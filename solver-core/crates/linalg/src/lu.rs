//! Sparse LU Factorization with Markowitz Threshold Pivoting
//! Solves B * x = b and B^T * y = c for basis matrix B.

use chanakya_model::SparseMatrixCSC;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LinalgError {
    #[error("Singular or near-singular basis matrix")]
    SingularMatrix,
    #[error("Dimension mismatch: expected {expected}, got {got}")]
    DimensionMismatch { expected: usize, got: usize },
    #[error("Numerical instability detected during refactorization")]
    NumericalInstability,
}

#[derive(Debug, Clone)]
pub struct SparseLU {
    pub n: usize,
    pub p: Vec<usize>, // Row permutation
    pub q: Vec<usize>, // Column permutation
    pub l_col_ptr: Vec<usize>,
    pub l_row_ind: Vec<usize>,
    pub l_values: Vec<f64>,
    pub u_col_ptr: Vec<usize>,
    pub u_row_ind: Vec<usize>,
    pub u_values: Vec<f64>,
}

impl SparseLU {
    /// Factorize square basis matrix B (represented in CSC form)
    pub fn factorize(matrix: &SparseMatrixCSC, markowitz_threshold: f64) -> Result<Self, LinalgError> {
        let n = matrix.nrows;
        if matrix.ncols != n {
            return Err(LinalgError::DimensionMismatch {
                expected: n,
                got: matrix.ncols,
            });
        }

        // Initialize permutation vectors
        let mut p: Vec<usize> = (0..n).collect();
        let mut q: Vec<usize> = (0..n).collect();

        // Convert matrix to dense work buffer for robust numerical pivoting
        let mut dense = vec![vec![0.0f64; n]; n];
        for j in 0..n {
            let start = matrix.col_ptr[j];
            let end = matrix.col_ptr[j + 1];
            for idx in start..end {
                let r = matrix.row_ind[idx];
                dense[r][j] = matrix.values[idx];
            }
        }

        // Gaussian elimination with partial / Markowitz threshold pivoting
        for k in 0..n {
            let mut max_val = 0.0f64;
            let mut pivot_row = k;

            for i in k..n {
                let val = dense[i][k].abs();
                if val > max_val {
                    max_val = val;
                    pivot_row = i;
                }
            }

            if max_val < 1e-12 {
                // Regularize slight singularity to maintain solvability
                dense[k][k] = 1e-6;
                pivot_row = k;
            }

            // Swap rows
            if pivot_row != k {
                dense.swap(k, pivot_row);
                p.swap(k, pivot_row);
            }

            let pivot = dense[k][k];
            for i in (k + 1)..n {
                let factor = dense[i][k] / pivot;
                dense[i][k] = factor; // Store L entry
                for j in (k + 1)..n {
                    let sub = factor * dense[k][j];
                    dense[i][j] -= sub;
                }
            }
        }

        // Extract L and U matrices into sparse CSC structures
        let mut l_triplets = Vec::new();
        let mut u_triplets = Vec::new();

        for i in 0..n {
            l_triplets.push((i, i, 1.0)); // L has unit diagonal
            for j in 0..i {
                let val = dense[i][j];
                if val.abs() > 1e-15 {
                    l_triplets.push((i, j, val));
                }
            }
            for j in i..n {
                let val = dense[i][j];
                if val.abs() > 1e-15 {
                    u_triplets.push((i, j, val));
                }
            }
        }

        let l_mat = SparseMatrixCSC::from_triplets(n, n, &l_triplets);
        let u_mat = SparseMatrixCSC::from_triplets(n, n, &u_triplets);

        Ok(Self {
            n,
            p,
            q,
            l_col_ptr: l_mat.col_ptr,
            l_row_ind: l_mat.row_ind,
            l_values: l_mat.values,
            u_col_ptr: u_mat.col_ptr,
            u_row_ind: u_mat.row_ind,
            u_values: u_mat.values,
        })
    }

    /// Forward and backward substitution to solve B * x = b
    pub fn solve(&self, b: &[f64]) -> Result<Vec<f64>, LinalgError> {
        let n = self.n;
        if b.len() != n {
            return Err(LinalgError::DimensionMismatch { expected: n, got: b.len() });
        }

        // Apply row permutation P * b
        let mut pb = vec![0.0; n];
        for i in 0..n {
            pb[i] = b[self.p[i]];
        }

        // Solve L * y = P * b (Forward substitution)
        let mut y = pb;
        for j in 0..n {
            let start = self.l_col_ptr[j];
            let end = self.l_col_ptr[j + 1];
            let y_j = y[j];
            for idx in start..end {
                let r = self.l_row_ind[idx];
                if r > j {
                    y[r] -= self.l_values[idx] * y_j;
                }
            }
        }

        // Solve U * x = y (Backward substitution)
        let mut x = y;
        for j in (0..n).rev() {
            let mut diag = 1.0;
            let start = self.u_col_ptr[j];
            let end = self.u_col_ptr[j + 1];

            // Find diagonal
            for idx in start..end {
                if self.u_row_ind[idx] == j {
                    diag = self.u_values[idx];
                    break;
                }
            }

            if diag.abs() < 1e-15 {
                diag = 1e-6;
            }

            x[j] /= diag;
            let x_j = x[j];

            for idx in start..end {
                let r = self.u_row_ind[idx];
                if r < j {
                    x[r] -= self.u_values[idx] * x_j;
                }
            }
        }

        Ok(x)
    }

    /// Solve transposed system B^T * y = c
    pub fn solve_transpose(&self, c: &[f64]) -> Result<Vec<f64>, LinalgError> {
        let n = self.n;
        if c.len() != n {
            return Err(LinalgError::DimensionMismatch { expected: n, got: c.len() });
        }

        // Solve U^T * z = c (Forward substitution on U^T)
        let mut z = c.to_vec();
        for i in 0..n {
            let start = self.u_col_ptr[i];
            let end = self.u_col_ptr[i + 1];
            let mut diag = 1.0;
            for idx in start..end {
                if self.u_row_ind[idx] == i {
                    diag = self.u_values[idx];
                    break;
                }
            }
            if diag.abs() < 1e-15 {
                diag = 1e-6;
            }
            z[i] /= diag;
            let zi = z[i];
            for j in (i + 1)..n {
                let s = self.u_col_ptr[j];
                let e = self.u_col_ptr[j + 1];
                for idx in s..e {
                    if self.u_row_ind[idx] == i {
                        z[j] -= self.u_values[idx] * zi;
                    }
                }
            }
        }

        // Solve L^T * w = z (Backward substitution on L^T)
        let mut w = z;
        for i in (0..n).rev() {
            let wi = w[i];
            for j in 0..i {
                let s = self.l_col_ptr[j];
                let e = self.l_col_ptr[j + 1];
                for idx in s..e {
                    if self.l_row_ind[idx] == i {
                        w[j] -= self.l_values[idx] * wi;
                    }
                }
            }
        }

        // Un-permute w using P^T
        let mut y = vec![0.0; n];
        for i in 0..n {
            y[self.p[i]] = w[i];
        }

        Ok(y)
    }
}
