//! Solution representation, solver status, and basis definition

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SolverStatus {
    Optimal,
    Infeasible,
    Unbounded,
    TimeLimit,
    IterationLimit,
    NumericalTrouble,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BasisStatus {
    Basic,
    AtLower,
    AtUpper,
    Free,
    Fixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolverStats {
    pub solve_time_seconds: f64,
    pub iterations: usize,
    pub simplex_pivots: usize,
    pub ipm_iterations: usize,
    pub bb_nodes_explored: usize,
    pub best_bound: f64,
    pub mip_gap: f64,
    pub presolve_rows_eliminated: usize,
    pub presolve_cols_eliminated: usize,
    pub numerical_perturbations: usize,
}

impl Default for SolverStats {
    fn default() -> Self {
        Self {
            solve_time_seconds: 0.0,
            iterations: 0,
            simplex_pivots: 0,
            ipm_iterations: 0,
            bb_nodes_explored: 0,
            best_bound: 0.0,
            mip_gap: 0.0,
            presolve_rows_eliminated: 0,
            presolve_cols_eliminated: 0,
            numerical_perturbations: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Solution {
    pub status: SolverStatus,
    pub objective_value: f64,
    /// Primal variable values
    pub x: Vec<f64>,
    /// Dual variable values (reduced costs / row duals)
    pub y: Option<Vec<f64>>,
    pub slack: Option<Vec<f64>>,
    pub basis_col: Option<Vec<BasisStatus>>,
    pub basis_row: Option<Vec<BasisStatus>>,
    pub stats: SolverStats,
    pub verified: bool,
    pub verification_notes: Vec<String>,
}
