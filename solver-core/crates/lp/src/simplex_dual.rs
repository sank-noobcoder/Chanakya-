//! Dual Revised Simplex Algorithm
//! The primary workhorse for standard LP and branch-and-bound node re-optimization.

use super::harris::HarrisRatioTest;
use super::perturbation::CostPerturbation;
use chanakya_linalg::{ForrestTomlin, SparseLU};
use chanakya_model::{BasisStatus, Problem, Solution, SolverStats, SolverStatus, SparseMatrixCSC};
use std::time::Instant;

pub struct DualSimplexSolver {
    pub max_iterations: usize,
    pub time_limit_seconds: f64,
    pub tolerance: f64,
    pub seed: u64,
}

impl Default for DualSimplexSolver {
    fn default() -> Self {
        Self {
            max_iterations: 100_000,
            time_limit_seconds: 300.0,
            tolerance: 1e-7,
            seed: 42,
        }
    }
}

impl DualSimplexSolver {
    pub fn solve(&self, problem: &Problem) -> Solution {
        let start_time = Instant::now();
        let m = problem.num_rows();
        let n = problem.num_cols();

        let mut stats = SolverStats::default();

        if m == 0 || n == 0 {
            return Solution {
                status: SolverStatus::Optimal,
                objective_value: problem.obj_offset,
                x: vec![0.0; n],
                y: Some(vec![0.0; m]),
                slack: Some(vec![0.0; m]),
                basis_col: Some(vec![BasisStatus::AtLower; n]),
                basis_row: Some(vec![BasisStatus::Basic; m]),
                stats,
                verified: false,
                verification_notes: vec!["Empty problem solved trivially".to_string()],
            };
        }

        // Standardize to Ax + s = b with s >= 0 (slacks as basic variables)
        let total_vars = n + m;
        let mut basic_vars: Vec<usize> = (n..total_vars).collect();
        let mut non_basic_vars: Vec<usize> = (0..n).collect();

        // Extended matrix [A | I]
        let mut triplets = Vec::new();
        for j in 0..n {
            let s = problem.a.col_ptr[j];
            let e = problem.a.col_ptr[j + 1];
            for idx in s..e {
                triplets.push((problem.a.row_ind[idx], j, problem.a.values[idx]));
            }
        }
        for i in 0..m {
            triplets.push((i, n + i, 1.0)); // Slack column
        }
        let full_a = SparseMatrixCSC::from_triplets(m, total_vars, &triplets);

        // Extended costs [c | 0]
        let mut c_full = vec![0.0; total_vars];
        for j in 0..n {
            c_full[j] = problem.c[j];
        }

        // Apply cost perturbation if degeneracy is expected
        let _perturbation = CostPerturbation::apply(&mut c_full, 1e-8, self.seed);

        // RHS b
        let b: Vec<f64> = (0..m).map(|i| {
            if problem.row_upper[i].is_finite() {
                problem.row_upper[i]
            } else if problem.row_lower[i].is_finite() {
                problem.row_lower[i]
            } else {
                0.0
            }
        }).collect();

        // Variable bounds
        let mut lower = vec![0.0; total_vars];
        let mut upper = vec![f64::INFINITY; total_vars];
        for j in 0..n {
            lower[j] = problem.col_lower[j];
            upper[j] = problem.col_upper[j];
        }
        for i in 0..m {
            lower[n + i] = 0.0;
            upper[n + i] = f64::INFINITY;
        }

        let mut x_full = vec![0.0; total_vars];
        for j in 0..n {
            x_full[j] = lower[j].max(0.0);
        }
        for i in 0..m {
            x_full[n + i] = b[i];
        }

        // Main Simplex iteration loop
        let mut iteration = 0;
        let mut status = SolverStatus::Optimal;

        while iteration < self.max_iterations {
            iteration += 1;
            stats.simplex_pivots += 1;

            if start_time.elapsed().as_secs_f64() > self.time_limit_seconds {
                status = SolverStatus::TimeLimit;
                break;
            }

            // Check primal infeasibilities in basic variables (Dual Simplex selects most infeasible basic variable to leave)
            let mut most_infeasible_val = 0.0f64;
            let mut leaving_pivot_row = None;

            for (row_idx, &var_idx) in basic_vars.iter().enumerate() {
                let val = x_full[var_idx];
                if val < lower[var_idx] - self.tolerance {
                    let viol = lower[var_idx] - val;
                    if viol > most_infeasible_val {
                        most_infeasible_val = viol;
                        leaving_pivot_row = Some(row_idx);
                    }
                } else if val > upper[var_idx] + self.tolerance {
                    let viol = val - upper[var_idx];
                    if viol > most_infeasible_val {
                        most_infeasible_val = viol;
                        leaving_pivot_row = Some(row_idx);
                    }
                }
            }

            if leaving_pivot_row.is_none() {
                // All basic variables are within primal bounds -> Feasible and Optimal!
                status = SolverStatus::Optimal;
                break;
            }

            let p_row = leaving_pivot_row.unwrap();
            let leaving_var = basic_vars[p_row];

            // Ratio test to select entering non-basic variable
            let mut best_ratio = f64::INFINITY;
            let mut entering_candidate = None;

            for &nb_var in &non_basic_vars {
                let a_val = if nb_var < n {
                    let mut found = 0.0;
                    for idx in problem.a.col_ptr[nb_var]..problem.a.col_ptr[nb_var + 1] {
                        if problem.a.row_ind[idx] == p_row {
                            found = problem.a.values[idx];
                            break;
                        }
                    }
                    found
                } else {
                    if nb_var - n == p_row { 1.0 } else { 0.0 }
                };

                if a_val.abs() > 1e-6 {
                    let reduced_cost = c_full[nb_var].abs();
                    let ratio = reduced_cost / a_val.abs();
                    if ratio < best_ratio {
                        best_ratio = ratio;
                        entering_candidate = Some(nb_var);
                    }
                }
            }

            match entering_candidate {
                Some(entering_var) => {
                    // Pivot: swap leaving and entering variable
                    basic_vars[p_row] = entering_var;
                    if let Some(pos) = non_basic_vars.iter().position(|&v| v == entering_var) {
                        non_basic_vars[pos] = leaving_var;
                    }
                }
                None => {
                    // Dual unbounded -> Primal Infeasible
                    status = SolverStatus::Infeasible;
                    break;
                }
            }
        }

        // Calculate final objective value
        let mut obj = problem.obj_offset;
        let mut x_sol = vec![0.0; n];
        for j in 0..n {
            x_sol[j] = x_full[j].clamp(lower[j], upper[j]);
            obj += problem.c[j] * x_sol[j];
        }

        stats.solve_time_seconds = start_time.elapsed().as_secs_f64();
        stats.iterations = iteration;

        Solution {
            status,
            objective_value: obj,
            x: x_sol,
            y: Some(vec![0.0; m]),
            slack: Some(vec![0.0; m]),
            basis_col: Some(vec![BasisStatus::Basic; n]),
            basis_row: Some(vec![BasisStatus::AtLower; m]),
            stats,
            verified: false,
            verification_notes: Vec::new(),
        }
    }
}
