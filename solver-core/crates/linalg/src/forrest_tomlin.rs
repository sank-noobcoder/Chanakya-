//! Forrest-Tomlin basis update for efficient Simplex pivots
//! Maintains LU factors without complete refactorization each iteration.

use super::lu::{LinalgError, SparseLU};

#[derive(Debug, Clone)]
pub struct ForrestTomlin {
    pub base_lu: SparseLU,
    pub eta_vectors: Vec<(usize, Vec<f64>)>, // Column index and eta column vector
    pub update_count: usize,
    pub max_updates: usize,
}

impl ForrestTomlin {
    pub fn new(base_lu: SparseLU, max_updates: usize) -> Self {
        Self {
            base_lu,
            eta_vectors: Vec::new(),
            update_count: 0,
            max_updates,
        }
    }

    pub fn needs_refactorization(&self) -> bool {
        self.update_count >= self.max_updates
    }

    /// Update representation when column `leaving_col` leaves basis and entering column vector arrives
    pub fn update(&mut self, leaving_col: usize, entering_col_solved: Vec<f64>) -> Result<(), LinalgError> {
        self.eta_vectors.push((leaving_col, entering_col_solved));
        self.update_count += 1;
        Ok(())
    }

    /// Forward solve using LU and product-form Eta matrices
    pub fn solve(&self, b: &[f64]) -> Result<Vec<f64>, LinalgError> {
        let mut x = self.base_lu.solve(b)?;
        for (col_idx, eta) in &self.eta_vectors {
            let eta_p = eta[*col_idx];
            if eta_p.abs() > 1e-15 {
                let alpha = x[*col_idx] / eta_p;
                for i in 0..x.len() {
                    if i != *col_idx {
                        x[i] -= alpha * eta[i];
                    }
                }
                x[*col_idx] = alpha;
            }
        }
        Ok(x)
    }

    /// Transpose solve using Product Form of Inverse (PFI)
    pub fn solve_transpose(&self, c: &[f64]) -> Result<Vec<f64>, LinalgError> {
        let mut y = c.to_vec();
        for (col_idx, eta) in self.eta_vectors.iter().rev() {
            let mut dot = 0.0;
            for i in 0..y.len() {
                if i != *col_idx {
                    dot += eta[i] * y[i];
                }
            }
            let eta_p = eta[*col_idx];
            if eta_p.abs() > 1e-15 {
                y[*col_idx] = (y[*col_idx] - dot) / eta_p;
            }
        }
        self.base_lu.solve_transpose(&y)
    }
}
