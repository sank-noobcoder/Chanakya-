//! Branching rules: Strong Branching and Pseudocost Branching

use chanakya_model::Problem;

pub enum BranchingRule {
    MostFractional,
    StrongBranching,
    Pseudocost,
}

pub struct BranchingSelector;

impl BranchingSelector {
    pub fn select_variable(problem: &Problem, x: &[f64]) -> Option<usize> {
        let mut best_var = None;
        let mut max_frac = 0.0;

        for (j, &val) in x.iter().enumerate() {
            if problem.var_types[j] != chanakya_model::VariableType::Continuous {
                let frac = (val - val.round()).abs();
                if frac > 1e-5 && frac > max_frac {
                    max_frac = frac;
                    best_var = Some(j);
                }
            }
        }
        best_var
    }
}
