//! Sparse matrix representations (Compressed Sparse Column & Compressed Sparse Row)
//! Engineered completely from first principles.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SparseMatrixCSC {
    pub nrows: usize,
    pub ncols: usize,
    pub col_ptr: Vec<usize>,
    pub row_ind: Vec<usize>,
    pub values: Vec<f64>,
}

impl SparseMatrixCSC {
    pub fn new(nrows: usize, ncols: usize) -> Self {
        Self {
            nrows,
            ncols,
            col_ptr: vec![0; ncols + 1],
            row_ind: Vec::new(),
            values: Vec::new(),
        }
    }

    pub fn from_triplets(
        nrows: usize,
        ncols: usize,
        triplets: &[(usize, usize, f64)],
    ) -> Self {
        let mut sorted = triplets.to_vec();
        // Sort primarily by column, secondarily by row
        sorted.sort_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(&b.0)));

        let mut col_ptr = vec![0; ncols + 1];
        let mut row_ind = Vec::with_capacity(sorted.len());
        let mut values = Vec::with_capacity(sorted.len());

        let mut current_col = 0;
        for (r, c, val) in sorted {
            while current_col < c {
                current_col += 1;
                col_ptr[current_col] = row_ind.len();
            }
            row_ind.push(r);
            values.push(val);
        }
        while current_col < ncols {
            current_col += 1;
            col_ptr[current_col] = row_ind.len();
        }

        Self {
            nrows,
            ncols,
            col_ptr,
            row_ind,
            values,
        }
    }

    pub fn nnz(&self) -> usize {
        self.values.len()
    }

    /// Matrix-vector multiplication y = A * x
    pub fn mat_vec(&self, x: &[f64]) -> Vec<f64> {
        assert_eq!(x.len(), self.ncols, "Vector length must match column count");
        let mut y = vec![0.0; self.nrows];
        for j in 0..self.ncols {
            let xj = x[j];
            if xj.abs() < 1e-18 {
                continue;
            }
            let start = self.col_ptr[j];
            let end = self.col_ptr[j + 1];
            for idx in start..end {
                let r = self.row_ind[idx];
                y[r] += self.values[idx] * xj;
            }
        }
        y
    }

    /// Transposed matrix-vector multiplication y = A^T * x
    pub fn mat_vec_transpose(&self, x: &[f64]) -> Vec<f64> {
        assert_eq!(x.len(), self.nrows, "Vector length must match row count");
        let mut y = vec![0.0; self.ncols];
        for j in 0..self.ncols {
            let start = self.col_ptr[j];
            let end = self.col_ptr[j + 1];
            let mut dot = 0.0;
            for idx in start..end {
                let r = self.row_ind[idx];
                dot += self.values[idx] * x[r];
            }
            y[j] = dot;
        }
        y
    }

    /// Transpose to Compressed Sparse Row (CSR) or another CSC
    pub fn transpose(&self) -> SparseMatrixCSC {
        let mut row_counts = vec![0; self.nrows];
        for &r in &self.row_ind {
            row_counts[r] += 1;
        }

        let mut row_ptr = vec![0; self.nrows + 1];
        for i in 0..self.nrows {
            row_ptr[i + 1] = row_ptr[i] + row_counts[i];
        }

        let mut next_pos = row_ptr.clone();
        let nnz = self.nnz();
        let mut col_ind = vec![0; nnz];
        let mut values = vec![0.0; nnz];

        for j in 0..self.ncols {
            for idx in self.col_ptr[j]..self.col_ptr[j + 1] {
                let r = self.row_ind[idx];
                let val = self.values[idx];
                let dest = next_pos[r];
                col_ind[dest] = j;
                values[dest] = val;
                next_pos[r] += 1;
            }
        }

        SparseMatrixCSC {
            nrows: self.ncols,
            ncols: self.nrows,
            col_ptr: row_ptr,
            row_ind: col_ind,
            values,
        }
    }
}
