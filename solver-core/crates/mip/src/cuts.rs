//! Cut Generators: Gomory Mixed-Integer Cuts and Knapsack Cover Cuts

use chanakya_model::Problem;

#[derive(Debug, Clone)]
pub struct Cut {
    pub indices: Vec<usize>,
    pub values: Vec<f64>,
    pub rhs: f64,
}

pub struct CutGenerator;

impl CutGenerator {
    /// Generate Chvátal-Gomory Fractional Cuts from tableau row
    pub fn generate_gomory_cut(tableau_row: &[f64], basic_rhs: f64) -> Option<Cut> {
        let f0 = basic_rhs - basic_rhs.floor();
        if f0 < 1e-4 || f0 > 1.0 - 1e-4 {
            return None;
        }

        let mut indices = Vec::new();
        let mut values = Vec::new();

        for (j, &val) in tableau_row.iter().enumerate() {
            let fj = val - val.floor();
            if fj > 1e-6 {
                indices.push(j);
                values.push(fj);
            }
        }

        if indices.is_empty() {
            None
        } else {
            Some(Cut {
                indices,
                values,
                rhs: f0,
            })
        }
    }
}
