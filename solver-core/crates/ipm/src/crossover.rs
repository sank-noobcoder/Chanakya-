//! Crossover Algorithm from Interior Point Solution to Basic Feasible Solution (Vertex)

use chanakya_model::{BasisStatus, Problem, Solution};

pub struct Crossover;

impl Crossover {
    /// Convert an interior point solution into a clean vertex basis representation
    pub fn crossover(problem: &Problem, solution: &mut Solution) {
        let n = problem.num_cols();
        let m = problem.num_rows();

        let mut basis_col = vec![BasisStatus::AtLower; n];
        let basis_row = vec![BasisStatus::Basic; m];

        for j in 0..n {
            let val = solution.x[j];
            let lower = problem.col_lower[j];
            let upper = problem.col_upper[j];

            if (val - lower).abs() < 1e-5 {
                basis_col[j] = BasisStatus::AtLower;
                solution.x[j] = lower;
            } else if (val - upper).abs() < 1e-5 {
                basis_col[j] = BasisStatus::AtUpper;
                solution.x[j] = upper;
            } else {
                basis_col[j] = BasisStatus::Basic;
            }
        }

        solution.basis_col = Some(basis_col);
        solution.basis_row = Some(basis_row);
    }
}
