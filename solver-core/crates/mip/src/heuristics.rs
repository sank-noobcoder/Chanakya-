//! Primal Heuristics: Feasibility Pump & Rounding Heuristics

use chanakya_model::{Problem, VariableType};

pub struct PrimalHeuristics;

impl PrimalHeuristics {
    /// Fast rounding heuristic: rounds fractional variables to nearest integer if feasible
    pub fn round_solution(problem: &Problem, lp_x: &[f64]) -> Option<Vec<f64>> {
        let mut int_x = lp_x.to_vec();
        for (j, &vt) in problem.var_types.iter().enumerate() {
            if vt != VariableType::Continuous {
                let rounded = int_x[j].round();
                if rounded < problem.col_lower[j] - 1e-6 || rounded > problem.col_upper[j] + 1e-6 {
                    return None;
                }
                int_x[j] = rounded;
            }
        }
        Some(int_x)
    }
}
