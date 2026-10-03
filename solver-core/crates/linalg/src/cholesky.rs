//! Sparse and Dense Cholesky Factorization for IPM Normal Equations (A * Theta * A^T)

use super::lu::LinalgError;

#[derive(Debug, Clone)]
pub struct Cholesky {
    pub n: usize,
    pub l_dense: Vec<Vec<f64>>,
}

impl Cholesky {
    /// Factorize symmetric positive definite matrix M = L * L^T
    pub fn factorize_dense(matrix: &[Vec<f64>]) -> Result<Self, LinalgError> {
        let n = matrix.len();
        let mut l = vec![vec![0.0f64; n]; n];

        for i in 0..n {
            for j in 0..=i {
                let mut sum = 0.0;
                for k in 0..j {
                    sum += l[i][k] * l[j][k];
                }

                if i == j {
                    let d = matrix[i][i] - sum;
                    if d <= 1e-14 {
                        // Regularize for rank-deficient normal equations
                        l[i][i] = 1e-6;
                    } else {
                        l[i][i] = d.sqrt();
                    }
                } else {
                    l[i][j] = (matrix[i][j] - sum) / l[j][j];
                }
            }
        }

        Ok(Self { n, l_dense: l })
    }

    /// Solve L * L^T * x = b
    pub fn solve(&self, b: &[f64]) -> Result<Vec<f64>, LinalgError> {
        let n = self.n;
        if b.len() != n {
            return Err(LinalgError::DimensionMismatch { expected: n, got: b.len() });
        }

        // 1. Solve L * y = b (forward substitution)
        let mut y = vec![0.0; n];
        for i in 0..n {
            let mut sum = 0.0;
            for k in 0..i {
                sum += self.l_dense[i][k] * y[k];
            }
            y[i] = (b[i] - sum) / self.l_dense[i][i];
        }

        // 2. Solve L^T * x = y (backward substitution)
        let mut x = vec![0.0; n];
        for i in (0..n).rev() {
            let mut sum = 0.0;
            for k in (i + 1)..n {
                sum += self.l_dense[k][i] * x[k];
            }
            x[i] = (y[i] - sum) / self.l_dense[i][i];
        }

        Ok(x)
    }
}
