//! Geometric mean and Curtis-Reid equilibration matrix scaling
//! Rescales constraint matrix A so max/min non-zero entries are balanced near 1.0.

use chanakya_model::{Problem, SparseMatrixCSC};

#[derive(Debug, Clone)]
pub struct Scaler {
    pub row_scale: Vec<f64>,
    pub col_scale: Vec<f64>,
}

impl Scaler {
    /// Perform equilibration scaling on the problem
    pub fn scale_problem(problem: &mut Problem, max_iterations: usize) -> Self {
        let nrows = problem.num_rows();
        let ncols = problem.num_cols();

        let mut row_scale = vec![1.0; nrows];
        let mut col_scale = vec![1.0; ncols];

        for _iter in 0..max_iterations {
            // Row scaling: r_i = 1 / sqrt(max_j |A_ij| * min_j |A_ij|)
            let mut row_max = vec![0.0f64; nrows];
            for j in 0..ncols {
                let start = problem.a.col_ptr[j];
                let end = problem.a.col_ptr[j + 1];
                for idx in start..end {
                    let r = problem.a.row_ind[idx];
                    let val = problem.a.values[idx].abs();
                    if val > row_max[r] {
                        row_max[r] = val;
                    }
                }
            }

            for i in 0..nrows {
                if row_max[i] > 1e-12 {
                    let factor = 1.0 / row_max[i].sqrt();
                    row_scale[i] *= factor;
                }
            }

            // Apply row scaling to matrix values
            for j in 0..ncols {
                let start = problem.a.col_ptr[j];
                let end = problem.a.col_ptr[j + 1];
                for idx in start..end {
                    let r = problem.a.row_ind[idx];
                    problem.a.values[idx] *= row_scale[r];
                }
            }

            // Col scaling: c_j = 1 / sqrt(max_i |A_ij|)
            for j in 0..ncols {
                let start = problem.a.col_ptr[j];
                let end = problem.a.col_ptr[j + 1];
                let mut c_max = 0.0f64;
                for idx in start..end {
                    let val = problem.a.values[idx].abs();
                    if val > c_max {
                        c_max = val;
                    }
                }
                if c_max > 1e-12 {
                    let factor = 1.0 / c_max.sqrt();
                    col_scale[j] *= factor;
                    for idx in start..end {
                        problem.a.values[idx] *= factor;
                    }
                }
            }
        }

        // Rescale RHS / bounds & objective
        for i in 0..nrows {
            let rs = row_scale[i];
            if problem.row_lower[i].is_finite() {
                problem.row_lower[i] *= rs;
            }
            if problem.row_upper[i].is_finite() {
                problem.row_upper[i] *= rs;
            }
        }

        for j in 0..ncols {
            let cs = col_scale[j];
            problem.c[j] *= cs;
            if problem.col_lower[j].is_finite() {
                problem.col_lower[j] /= cs;
            }
            if problem.col_upper[j].is_finite() {
                problem.col_upper[j] /= cs;
            }
        }

        Self {
            row_scale,
            col_scale,
        }
    }

    /// Unscale primal vector x: x_orig = x_scaled * col_scale
    pub fn unscale_primal(&self, x: &mut [f64]) {
        for (j, val) in x.iter_mut().enumerate() {
            if j < self.col_scale.len() {
                *val *= self.col_scale[j];
            }
        }
    }

    /// Unscale dual vector y: y_orig = y_scaled * row_scale
    pub fn unscale_dual(&self, y: &mut [f64]) {
        for (i, val) in y.iter_mut().enumerate() {
            if i < self.row_scale.len() {
                *val *= self.row_scale[i];
            }
        }
    }
}
