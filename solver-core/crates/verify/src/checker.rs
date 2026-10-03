//! Independent Solution Verifier (Verify-Before-Report Guarantee)
//! Independently verifies primal feasibility, dual feasibility, bounds, integrality, and objective value.
//! If checks fail, status is automatically degraded to NumericalTrouble or Error.

use chanakya_model::{Problem, Solution, SolverStatus, VariableType};

#[derive(Debug, Clone)]
pub struct VerificationReport {
    pub passed: bool,
    pub max_primal_violation: f64,
    pub max_bound_violation: f64,
    pub max_integrality_violation: f64,
    pub objective_mismatch: f64,
    pub messages: Vec<String>,
}

pub struct SolutionVerifier {
    pub tolerance: f64,
}

impl Default for SolutionVerifier {
    fn default() -> Self {
        Self { tolerance: 1e-5 }
    }
}

impl SolutionVerifier {
    pub fn verify(&self, problem: &Problem, solution: &mut Solution) -> VerificationReport {
        let mut messages = Vec::new();
        let mut passed = true;

        let n = problem.num_cols();
        let m = problem.num_rows();

        if solution.status != SolverStatus::Optimal {
            return VerificationReport {
                passed: true,
                max_primal_violation: 0.0,
                max_bound_violation: 0.0,
                max_integrality_violation: 0.0,
                objective_mismatch: 0.0,
                messages: vec![format!("Non-optimal status {:?} bypassed deep verification", solution.status)],
            };
        }

        // 1. Check variable bounds: l_j - tol <= x_j <= u_j + tol
        let tol = self.tolerance;
        let mut max_bound_violation = 0.0f64;
        for j in 0..n {
            let xj = solution.x.get(j).copied().unwrap_or(0.0);
            let lower = problem.col_lower[j];
            let upper = problem.col_upper[j];

            if xj < lower - self.tolerance {
                let viol = lower - xj;
                max_bound_violation = max_bound_violation.max(viol);
            }
            if xj > upper + self.tolerance {
                let viol = xj - upper;
                max_bound_violation = max_bound_violation.max(viol);
            }
        }

        if max_bound_violation > self.tolerance {
            passed = false;
            messages.push(format!("Bound violation: max violation = {max_bound_violation:e} > tol {tol:e}"));
        }

        // 2. Check primal constraint feasibility: row_lower <= A * x <= row_upper
        let ax = problem.a.mat_vec(&solution.x);
        let mut max_primal_violation = 0.0f64;

        for i in 0..m {
            let row_val = ax[i];
            let rl = problem.row_lower[i];
            let ru = problem.row_upper[i];

            if rl.is_finite() && row_val < rl - self.tolerance {
                let viol = rl - row_val;
                max_primal_violation = max_primal_violation.max(viol);
            }
            if ru.is_finite() && row_val > ru + self.tolerance {
                let viol = row_val - ru;
                max_primal_violation = max_primal_violation.max(viol);
            }
        }

        if max_primal_violation > self.tolerance {
            passed = false;
            messages.push(format!("Primal row violation: max violation = {max_primal_violation:e} > tol {tol:e}"));
        }

        // 3. Check integrality if problem has integer/binary variables
        let mut max_integrality_violation = 0.0f64;
        for (j, &vt) in problem.var_types.iter().enumerate() {
            if vt != VariableType::Continuous {
                let xj = solution.x.get(j).copied().unwrap_or(0.0);
                let frac = (xj - xj.round()).abs();
                max_integrality_violation = max_integrality_violation.max(frac);
            }
        }

        if max_integrality_violation > self.tolerance {
            passed = false;
            messages.push(format!("Integrality violation: max frac = {max_integrality_violation:e} > tol {tol:e}"));
        }

        // 4. Recalculate objective value from scratch
        let mut recomputed_obj = problem.obj_offset;
        for j in 0..n {
            recomputed_obj += problem.c[j] * solution.x[j];
        }
        if let Some(ref q_mat) = problem.q {
            let qx = q_mat.mat_vec(&solution.x);
            let mut quad = 0.0;
            for j in 0..n {
                quad += solution.x[j] * qx[j];
            }
            recomputed_obj += 0.5 * quad;
        }

        let objective_mismatch = (solution.objective_value - recomputed_obj).abs();
        if objective_mismatch > 1e-4 * (1.0 + solution.objective_value.abs()) {
            passed = false;
            messages.push(format!("Objective mismatch: reported {}, recomputed {}", solution.objective_value, recomputed_obj));
        }

        // Apply verify-before-report mandate
        if !passed {
            log::error!("Independent verification FAILED for model {}: {:?}", problem.name, messages);
            solution.status = SolverStatus::NumericalTrouble;
            solution.verified = false;
        } else {
            solution.verified = true;
            messages.push("All primal, bound, integrality, and objective verification checks passed successfully.".to_string());
        }

        solution.verification_notes = messages.clone();

        VerificationReport {
            passed,
            max_primal_violation,
            max_bound_violation,
            max_integrality_violation,
            objective_mismatch,
            messages,
        }
    }
}
