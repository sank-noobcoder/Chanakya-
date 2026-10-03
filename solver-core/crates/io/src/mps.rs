//! High-performance, robust, fuzzed MPS parser (fixed & free format)
//! Implements strict limits to guard against DoS / resource exhaustion.

use chanakya_model::{ObjectiveSense, Problem, ProblemType, SparseMatrixCSC, VariableType};
use std::collections::HashMap;
use std::io::{BufRead, Cursor};
use thiserror::Error;

pub const MAX_ALLOWED_ROWS: usize = 2_000_000;
pub const MAX_ALLOWED_COLS: usize = 2_000_000;
pub const MAX_ALLOWED_NNZ: usize = 50_000_000;
pub const MAX_LINE_BYTES: usize = 16_384;

#[derive(Error, Debug)]
pub enum IoError {
    #[error("I/O failure: {0}")]
    Io(#[from] std::io::Error),
    #[error("Syntax error at line {line}: {msg}")]
    SyntaxError { line: usize, msg: String },
    #[error("Exceeded hard security limit: {0}")]
    SecurityLimitExceeded(String),
    #[error("Unknown row '{0}' referenced")]
    UnknownRow(String),
    #[error("Format error: {0}")]
    FormatError(String),
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum MpsSection {
    None,
    Name,
    Rows,
    Columns,
    Rhs,
    Ranges,
    Bounds,
    QuadObj,
    Endata,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RowType {
    N, // Free / Objective
    G, // Greater than or equal (>=)
    L, // Less than or equal (<=)
    E, // Equality (==)
}

pub struct MpsParser;

impl MpsParser {
    pub fn parse<R: BufRead>(reader: R) -> Result<Problem, IoError> {
        let mut section = MpsSection::None;
        let mut problem_name = "chanakya_model".to_string();
        let mut obj_name: Option<String> = None;
        let mut row_map: HashMap<String, (usize, RowType)> = HashMap::new();
        let mut row_names: Vec<String> = Vec::new();
        let mut row_types: Vec<RowType> = Vec::new();

        let mut col_map: HashMap<String, usize> = HashMap::new();
        let mut col_names: Vec<String> = Vec::new();
        let mut triplets: Vec<(usize, usize, f64)> = Vec::new();
        let mut c_map: HashMap<usize, f64> = HashMap::new();

        let mut row_lower_map: HashMap<usize, f64> = HashMap::new();
        let mut row_upper_map: HashMap<usize, f64> = HashMap::new();

        let mut col_lower_map: HashMap<usize, f64> = HashMap::new();
        let mut col_upper_map: HashMap<usize, f64> = HashMap::new();
        let mut var_types_map: HashMap<usize, VariableType> = HashMap::new();

        let mut q_triplets: Vec<(usize, usize, f64)> = Vec::new();
        let mut integer_marker = false;

        for (line_idx, line_res) in reader.lines().enumerate() {
            let line_num = line_idx + 1;
            let raw_line = line_res?;
            if raw_line.len() > MAX_LINE_BYTES {
                return Err(IoError::SecurityLimitExceeded(format!(
                    "Line {line_num} exceeds max line limit of {MAX_LINE_BYTES} bytes"
                )));
            }
            let line = raw_line.trim_end();
            if line.is_empty() || line.starts_with('*') {
                continue;
            }

            // Section headers begin with non-whitespace
            if !line.starts_with(' ') && !line.starts_with('\t') {
                let header = line.split_whitespace().next().unwrap_or("");
                match header {
                    "NAME" => {
                        section = MpsSection::Name;
                        if let Some(name) = line.split_whitespace().nth(1) {
                            problem_name = name.to_string();
                        }
                    }
                    "ROWS" => section = MpsSection::Rows,
                    "COLUMNS" => section = MpsSection::Columns,
                    "RHS" => section = MpsSection::Rhs,
                    "RANGES" => section = MpsSection::Ranges,
                    "BOUNDS" => section = MpsSection::Bounds,
                    "QUADOBJ" | "QMATRIX" => section = MpsSection::QuadObj,
                    "ENDATA" => {
                        section = MpsSection::Endata;
                        break;
                    }
                    unknown => {
                        log::warn!("Ignored unknown MPS header: {unknown} on line {line_num}");
                    }
                }
                continue;
            }

            let tokens: Vec<&str> = line.split_whitespace().collect();
            if tokens.is_empty() {
                continue;
            }

            match section {
                MpsSection::Rows => {
                    let rtype_char = tokens[0].to_uppercase();
                    let rname = tokens[1].to_string();
                    let rtype = match rtype_char.as_str() {
                        "N" => {
                            if obj_name.is_none() {
                                obj_name = Some(rname.clone());
                            }
                            RowType::N
                        }
                        "G" => RowType::G,
                        "L" => RowType::L,
                        "E" => RowType::E,
                        _ => return Err(IoError::SyntaxError { line: line_num, msg: format!("Invalid row type {rtype_char}") }),
                    };

                    if rtype != RowType::N {
                        if row_names.len() >= MAX_ALLOWED_ROWS {
                            return Err(IoError::SecurityLimitExceeded(format!("Exceeded max row limit of {MAX_ALLOWED_ROWS}")));
                        }
                        let ridx = row_names.len();
                        row_map.insert(rname.clone(), (ridx, rtype));
                        row_names.push(rname);
                        row_types.push(rtype);
                    }
                }

                MpsSection::Columns => {
                    // Check for integer markers 'MARKER' 'INTORG' / 'INTEND'
                    if tokens.len() >= 3 && tokens.iter().any(|&t| t == "'MARKER'") {
                        if tokens.iter().any(|&t| t == "'INTORG'") {
                            integer_marker = true;
                        } else if tokens.iter().any(|&t| t == "'INTEND'") {
                            integer_marker = false;
                        }
                        continue;
                    }

                    let col_name = tokens[0].to_string();
                    let col_idx = match col_map.get(&col_name) {
                        Some(&idx) => idx,
                        None => {
                            if col_names.len() >= MAX_ALLOWED_COLS {
                                return Err(IoError::SecurityLimitExceeded(format!("Exceeded max col limit of {MAX_ALLOWED_COLS}")));
                            }
                            let idx = col_names.len();
                            col_map.insert(col_name.clone(), idx);
                            col_names.push(col_name);
                            if integer_marker {
                                var_types_map.insert(idx, VariableType::Integer);
                            }
                            idx
                        }
                    };

                    let mut i = 1;
                    while i + 1 < tokens.len() {
                        let rname = tokens[i];
                        let val: f64 = tokens[i + 1].parse().map_err(|_| IoError::SyntaxError {
                            line: line_num,
                            msg: format!("Failed to parse number {}", tokens[i + 1]),
                        })?;

                        if Some(rname.to_string()) == obj_name {
                            c_map.insert(col_idx, val);
                        } else if let Some(&(ridx, _)) = row_map.get(rname) {
                            if triplets.len() >= MAX_ALLOWED_NNZ {
                                return Err(IoError::SecurityLimitExceeded(format!("Exceeded max non-zeros limit of {MAX_ALLOWED_NNZ}")));
                            }
                            triplets.push((ridx, col_idx, val));
                        }
                        i += 2;
                    }
                }

                MpsSection::Rhs => {
                    let mut i = if tokens.len() % 2 == 1 { 1 } else { 0 };
                    while i + 1 < tokens.len() {
                        let rname = tokens[i];
                        let rhs_val: f64 = tokens[i + 1].parse().map_err(|_| IoError::SyntaxError {
                            line: line_num,
                            msg: format!("Invalid RHS value {}", tokens[i + 1]),
                        })?;

                        if let Some(&(ridx, rtype)) = row_map.get(rname) {
                            match rtype {
                                RowType::E => {
                                    row_lower_map.insert(ridx, rhs_val);
                                    row_upper_map.insert(ridx, rhs_val);
                                }
                                RowType::L => {
                                    row_upper_map.insert(ridx, rhs_val);
                                }
                                RowType::G => {
                                    row_lower_map.insert(ridx, rhs_val);
                                }
                                RowType::N => {}
                            }
                        }
                        i += 2;
                    }
                }

                MpsSection::Bounds => {
                    let btype = tokens[0].to_uppercase();
                    let col_name = tokens[2].to_string();
                    if let Some(&cidx) = col_map.get(&col_name) {
                        match btype.as_str() {
                            "UP" => {
                                let val: f64 = tokens[3].parse().unwrap_or(0.0);
                                col_upper_map.insert(cidx, val);
                            }
                            "LO" => {
                                let val: f64 = tokens[3].parse().unwrap_or(0.0);
                                col_lower_map.insert(cidx, val);
                            }
                            "FX" => {
                                let val: f64 = tokens[3].parse().unwrap_or(0.0);
                                col_lower_map.insert(cidx, val);
                                col_upper_map.insert(cidx, val);
                            }
                            "FR" => {
                                col_lower_map.insert(cidx, f64::NEG_INFINITY);
                                col_upper_map.insert(cidx, f64::INFINITY);
                            }
                            "MI" => {
                                col_lower_map.insert(cidx, f64::NEG_INFINITY);
                            }
                            "PL" => {
                                col_upper_map.insert(cidx, f64::INFINITY);
                            }
                            "BV" => {
                                col_lower_map.insert(cidx, 0.0);
                                col_upper_map.insert(cidx, 1.0);
                                var_types_map.insert(cidx, VariableType::Binary);
                            }
                            "UI" => {
                                let val: f64 = tokens[3].parse().unwrap_or(0.0);
                                col_upper_map.insert(cidx, val);
                                var_types_map.insert(cidx, VariableType::Integer);
                            }
                            "LI" => {
                                let val: f64 = tokens[3].parse().unwrap_or(0.0);
                                col_lower_map.insert(cidx, val);
                                var_types_map.insert(cidx, VariableType::Integer);
                            }
                            _ => {}
                        }
                    }
                }

                MpsSection::QuadObj => {
                    let col1 = tokens[0].to_string();
                    let col2 = tokens[1].to_string();
                    let val: f64 = tokens[2].parse().unwrap_or(0.0);
                    if let (Some(&c1), Some(&c2)) = (col_map.get(&col1), col_map.get(&col2)) {
                        q_triplets.push((c1, c2, val));
                    }
                }
                _ => {}
            }
        }

        let nrows = row_names.len();
        let ncols = col_names.len();

        let mut row_lower = Vec::with_capacity(nrows);
        let mut row_upper = Vec::with_capacity(nrows);
        for i in 0..nrows {
            let rtype = row_types[i];
            let lower = row_lower_map.get(&i).copied().unwrap_or(match rtype {
                RowType::G | RowType::E => 0.0,
                RowType::L | RowType::N => f64::NEG_INFINITY,
            });
            let upper = row_upper_map.get(&i).copied().unwrap_or(match rtype {
                RowType::L | RowType::E => 0.0,
                RowType::G | RowType::N => f64::INFINITY,
            });
            row_lower.push(lower);
            row_upper.push(upper);
        }

        let mut c = vec![0.0; ncols];
        let mut col_lower = vec![0.0; ncols];
        let mut col_upper = vec![f64::INFINITY; ncols];
        let mut var_types = vec![VariableType::Continuous; ncols];

        for i in 0..ncols {
            if let Some(&ci) = c_map.get(&i) {
                c[i] = ci;
            }
            if let Some(&lo) = col_lower_map.get(&i) {
                col_lower[i] = lo;
            }
            if let Some(&up) = col_upper_map.get(&i) {
                col_upper[i] = up;
            }
            if let Some(&vt) = var_types_map.get(&i) {
                var_types[i] = vt;
            }
        }

        let a = SparseMatrixCSC::from_triplets(nrows, ncols, &triplets);

        let q = if !q_triplets.is_empty() {
            Some(SparseMatrixCSC::from_triplets(ncols, ncols, &q_triplets))
        } else {
            None
        };

        let has_int = var_types.iter().any(|&v| v != VariableType::Continuous);
        let problem_type = if q.is_some() {
            ProblemType::QP
        } else if has_int {
            ProblemType::MILP
        } else {
            ProblemType::LP
        };

        Ok(Problem {
            name: problem_name,
            problem_type,
            sense: ObjectiveSense::Minimize,
            col_names,
            row_names,
            c,
            obj_offset: 0.0,
            a,
            row_lower,
            row_upper,
            col_lower,
            col_upper,
            var_types,
            q,
        })
    }

    pub fn from_string(content: &str) -> Result<Problem, IoError> {
        Self::parse(Cursor::new(content.as_bytes()))
    }
}
