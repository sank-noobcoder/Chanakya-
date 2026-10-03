//! Harris Two-Pass Ratio Test with Bound Shifting
//! Prevents cycling and numerical instability in degenerated simplex steps.

#[derive(Debug, Clone)]
pub struct HarrisRatioTest {
    pub feastol: f64,
    pub pivot_tol: f64,
}

impl Default for HarrisRatioTest {
    fn default() -> Self {
        Self {
            feastol: 1e-7,
            pivot_tol: 1e-9,
        }
    }
}

impl HarrisRatioTest {
    /// Pass 1 & Pass 2 for primal ratio test: min (x_B - l_B) / d
    pub fn select_leaving_variable(
        &self,
        x_b: &[f64],
        lower: &[f64],
        upper: &[f64],
        direction: &[f64],
    ) -> Option<(usize, f64)> {
        let m = x_b.len();
        let mut theta_max = f64::INFINITY;

        // Pass 1: Find relaxed step limit theta_max
        for i in 0..m {
            let d_i = direction[i];
            if d_i > self.pivot_tol {
                // Moving towards lower bound
                let theta_i = (x_b[i] - lower[i] + self.feastol) / d_i;
                if theta_i < theta_max {
                    theta_max = theta_i;
                }
            } else if d_i < -self.pivot_tol {
                // Moving towards upper bound
                let theta_i = (x_b[i] - upper[i] - self.feastol) / d_i;
                if theta_i < theta_max {
                    theta_max = theta_i;
                }
            }
        }

        if theta_max.is_infinite() {
            return None; // Unbounded step
        }

        // Pass 2: Select candidate that maximizes pivot element among theta <= theta_max
        let mut best_pivot = 0.0f64;
        let mut leaving_idx = None;

        for i in 0..m {
            let d_i = direction[i];
            if d_i.abs() > self.pivot_tol {
                let theta_i = if d_i > 0.0 {
                    (x_b[i] - lower[i]) / d_i
                } else {
                    (x_b[i] - upper[i]) / d_i
                };

                if theta_i <= theta_max && d_i.abs() > best_pivot {
                    best_pivot = d_i.abs();
                    leaving_idx = Some((i, theta_i.max(0.0)));
                }
            }
        }

        leaving_idx
    }
}
