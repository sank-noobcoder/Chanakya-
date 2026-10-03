//! Problem formulation types (LP, MILP, QP)

use super::sparse::SparseMatrixCSC;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ObjectiveSense {
    Minimize,
    Maximize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VariableType {
    Continuous,
    Integer,
    Binary,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProblemType {
    LP,
    MILP,
    QP,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Problem {
    pub name: String,
    pub problem_type: ProblemType,
    pub sense: ObjectiveSense,
    pub col_names: Vec<String>,
    pub row_names: Vec<String>,
    /// Linear objective vector c
    pub c: Vec<f64>,
    /// Constant objective offset
    pub obj_offset: f64,
    /// Constraint matrix A in CSC format
    pub a: SparseMatrixCSC,
    /// Row lower bounds (can be -inf)
    pub row_lower: Vec<f64>,
    /// Row upper bounds (can be +inf)
    pub row_upper: Vec<f64>,
    /// Column lower bounds (can be -inf, typically 0.0)
    pub col_lower: Vec<f64>,
    /// Column upper bounds (can be +inf)
    pub col_upper: Vec<f64>,
    /// Variable types (Continuous, Integer, Binary)
    pub var_types: Vec<VariableType>,
    /// Optional quadratic objective matrix Q (for QP: 1/2 x^T Q x)
    pub q: Option<SparseMatrixCSC>,
}

impl Problem {
    pub fn num_cols(&self) -> usize {
        self.c.len()
    }

    pub fn num_rows(&self) -> usize {
        self.row_lower.len()
    }

    pub fn is_mip(&self) -> bool {
        self.var_types.iter().any(|&vt| vt != VariableType::Continuous)
    }

    pub fn has_qp(&self) -> bool {
        self.q.is_some()
    }
}
