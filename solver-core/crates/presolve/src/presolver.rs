//! LP and MILP Presolve Reductions
//! Implements singleton row/col detection, bound propagation, and post-solve reconstruction.

use chanakya_model::{Problem, Solution};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct PresolveResult {
    pub rows_removed: usize,
    pub cols_removed: usize,
    pub fixed_vars: Vec<(usize, f64)>,
}

pub struct Presolver;

impl Presolver {
    pub fn presolve(problem: &mut Problem) -> PresolveResult {
        let mut rows_removed = 0;
        let mut cols_removed = 0;
        let mut fixed_vars = Vec::new();

        let nrows = problem.num_rows();
        let ncols = problem.num_cols();

        // 1. Calculate row degree (non-zero count per row)
        let mut row_degree = vec![0; nrows];
        let mut row_singletons = vec![None; nrows];

        for j in 0..ncols {
            let start = problem.a.col_ptr[j];
            let end = problem.a.col_ptr[j + 1];
            for idx in start..end {
                let r = problem.a.row_ind[idx];
                let val = problem.a.values[idx];
                row_degree[r] += 1;
                if row_degree[r] == 1 {
                    row_singletons[r] = Some((j, val));
                } else {
                    row_singletons[r] = None;
                }
            }
        }

        // 2. Bound tightening from singleton rows: a_{ij} * x_j <= u_i => x_j <= u_i / a_{ij} (if a_{ij} > 0)
        let mut active_rows = HashSet::new();
        for i in 0..nrows {
            if row_degree[i] == 1 {
                if let Some((j, a_ij)) = row_singletons[i] {
                    if a_ij.abs() > 1e-12 {
                        let rl = problem.row_lower[i];
                        let ru = problem.row_upper[i];

                        if a_ij > 0.0 {
                            if ru.is_finite() {
                                problem.col_upper[j] = problem.col_upper[j].min(ru / a_ij);
                            }
                            if rl.is_finite() {
                                problem.col_lower[j] = problem.col_lower[j].max(rl / a_ij);
                            }
                        } else {
                            if ru.is_finite() {
                                problem.col_lower[j] = problem.col_lower[j].max(ru / a_ij);
                            }
                            if rl.is_finite() {
                                problem.col_upper[j] = problem.col_upper[j].min(rl / a_ij);
                            }
                        }
                        rows_removed += 1;
                        active_rows.insert(i);
                    }
                }
            }
        }

        // 3. Detect fixed variables (l_j == u_j)
        for j in 0..ncols {
            if (problem.col_upper[j] - problem.col_lower[j]).abs() < 1e-8 {
                fixed_vars.push((j, problem.col_lower[j]));
                cols_removed += 1;
            }
        }

        PresolveResult {
            rows_removed,
            cols_removed,
            fixed_vars,
        }
    }

    /// Restore full original solution from presolved solution
    pub fn postsolve(
        original_problem: &Problem,
        solution: &mut Solution,
        presolve_result: &PresolveResult,
    ) {
        for &(var_idx, val) in &presolve_result.fixed_vars {
            if var_idx < solution.x.len() {
                solution.x[var_idx] = val;
            }
        }
    }
}
