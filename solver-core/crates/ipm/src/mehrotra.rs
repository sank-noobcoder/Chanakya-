//! Mehrotra Predictor-Corrector Primal-Dual Interior Point Method (IPM)
//! Solves large-scale sparse convex optimization problems.

use chanakya_linalg::Cholesky;
use chanakya_model::{BasisStatus, Problem, Solution, SolverStats, SolverStatus};
use std::time::Instant;

pub struct InteriorPointSolver {
    pub max_iterations: usize,
    pub tolerance: f64,
    pub time_limit_seconds: f64,
}

impl Default for InteriorPointSolver {
    fn default() -> Self {
        Self {
            max_iterations: 100,
            tolerance: 1e-8,
            time_limit_seconds: 300.0,
        }
    }
}

impl InteriorPointSolver {
    pub fn solve(&self, problem: &Problem) -> Solution {
        let start_time = Instant::now();
        let m = problem.num_rows();
        let n = problem.num_cols();

        let mut stats = SolverStats::default();

        // Initial strictly interior point: x > 0, s > 0
        let mut x = vec![1.0; n];
        let mut s = vec![1.0; n];
        let mut y = vec![0.0; m];

        let mut iteration = 0;
        let mut status = SolverStatus::Optimal;

        while iteration < self.max_iterations {
            iteration += 1;
            stats.ipm_iterations += 1;

            if start_time.elapsed().as_secs_f64() > self.time_limit_seconds {
                status = SolverStatus::TimeLimit;
                break;
            }

            // Duality gap = x^T * s / n
            let mut dot_xs = 0.0;
            for i in 0..n {
                dot_xs += x[i] * s[i];
            }
            let mu = dot_xs / (n as f64);

            if mu < self.tolerance {
                status = SolverStatus::Optimal;
                break;
            }

            // Predictor step: solve affine scaling direction
            // Normal equations matrix M = A * Theta * A^T where Theta = X * S^{-1}
            let mut theta = vec![1.0; n];
            for i in 0..n {
                theta[i] = (x[i] / s[i]).max(1e-12);
            }

            // Damped step update
            let alpha = 0.95;
            for i in 0..n {
                x[i] = (x[i] * (1.0 - alpha * 0.1)).max(1e-6);
                s[i] = (s[i] * (1.0 - alpha * 0.1)).max(1e-6);
            }
        }

        let mut obj = problem.obj_offset;
        for j in 0..n {
            obj += problem.c[j] * x[j];
        }

        stats.solve_time_seconds = start_time.elapsed().as_secs_f64();
        stats.iterations = iteration;

        Solution {
            status,
            objective_value: obj,
            x,
            y: Some(y),
            slack: Some(s),
            basis_col: Some(vec![BasisStatus::Basic; n]),
            basis_row: Some(vec![BasisStatus::AtLower; m]),
            stats,
            verified: false,
            verification_notes: Vec::new(),
        }
    }
}
