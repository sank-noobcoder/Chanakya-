//! Cost Perturbation for Degeneracy Resolution
//! Adds slight epsilon perturbations to break ties and prevent simplex cycling.

use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

#[derive(Debug, Clone)]
pub struct CostPerturbation {
    pub original_costs: Vec<f64>,
    pub perturbations: Vec<f64>,
}

impl CostPerturbation {
    pub fn apply(c: &mut [f64], epsilon: f64, seed: u64) -> Self {
        let mut rng = StdRng::seed_from_u64(seed);
        let mut original_costs = Vec::with_capacity(c.len());
        let mut perturbations = Vec::with_capacity(c.len());

        for val in c.iter_mut() {
            original_costs.push(*val);
            let delta = rng.gen_range(0.0..epsilon);
            *val += delta;
            perturbations.push(delta);
        }

        Self {
            original_costs,
            perturbations,
        }
    }

    pub fn restore(&self, c: &mut [f64]) {
        for (i, val) in c.iter_mut().enumerate() {
            if i < self.original_costs.len() {
                *val = self.original_costs[i];
            }
        }
    }
}
