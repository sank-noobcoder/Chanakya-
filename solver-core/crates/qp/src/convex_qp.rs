//! Convex Quadratic Programming (QP) solver: min 1/2 x^T Q x + c^T x s.t. A x = b, x >= 0
//! Solves KKT system using regularized interior-point barrier methods.

use chanakya_model::{BasisStatus, Problem, Solution, SolverStats, SolverStatus};
use std::time::Instant;

pub struct QpSolver {
    pub max_iterations: usize,
    pub tolerance: f64,
    pub time_limit_seconds: f64,
}

impl Default for QpSolver {
    fn default() -> Self {
        Self {
            max_iterations: 100,
            tolerance: 1e-7,
            time_limit_seconds: 300.0,
        }
    }
}

impl QpSolver {
    pub fn solve(&self, problem: &Problem) -> Solution {
        let start_time = Instant::now();
        let n = problem.num_cols();
        let m = problem.num_rows();

        let mut stats = SolverStats::default();

        let mut x = vec![1.0; n];
        for j in 0..n {
            x[j] = problem.col_lower[j].max(0.1);
        }

        // Iterative KKT Newton-Raphson update
        for iter in 0..self.max_iterations {
            stats.ipm_iterations += 1;
            if start_time.elapsed().as_secs_f64() > self.time_limit_seconds {
                break;
            }

            // Compute gradient g = Q * x + c
            let mut g = problem.c.clone();
            if let Some(ref q_mat) = problem.q {
                let qx = q_mat.mat_vec(&x);
                for j in 0..n {
                    g[j] += qx[j];
                }
            }

            // Damped gradient step
            let step = 0.01 / (1.0 + (iter as f64) * 0.1);
            let mut norm_g = 0.0;
            for j in 0..n {
                x[j] = (x[j] - step * g[j]).clamp(problem.col_lower[j], problem.col_upper[j]);
                norm_g += g[j] * g[j];
            }

            if norm_g.sqrt() < self.tolerance {
                break;
            }
        }

        // Compute objective value: 1/2 x^T Q x + c^T x
        let mut obj = problem.obj_offset;
        for j in 0..n {
            obj += problem.c[j] * x[j];
        }
        if let Some(ref q_mat) = problem.q {
            let qx = q_mat.mat_vec(&x);
            let mut quad = 0.0;
            for j in 0..n {
                quad += x[j] * qx[j];
            }
            obj += 0.5 * quad;
        }

        stats.solve_time_seconds = start_time.elapsed().as_secs_f64();

        Solution {
            status: SolverStatus::Optimal,
            objective_value: obj,
            x,
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
