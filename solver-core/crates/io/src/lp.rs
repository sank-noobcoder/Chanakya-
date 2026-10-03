//! Robust LP format parser for CPLEX/standard .lp format

use super::mps::{IoError, MAX_ALLOWED_COLS, MAX_ALLOWED_ROWS, MAX_LINE_BYTES};
use chanakya_model::{ObjectiveSense, Problem, ProblemType, SparseMatrixCSC, VariableType};
use std::collections::HashMap;
use std::io::{BufRead, Cursor};

#[derive(Debug, PartialEq, Eq)]
enum LpSection {
    None,
    Objective,
    SubjectTo,
    Bounds,
    Generals,
    Binary,
    End,
}

pub struct LpParser;

impl LpParser {
    pub fn parse<R: BufRead>(reader: R) -> Result<Problem, IoError> {
        let mut section = LpSection::None;
        let mut sense = ObjectiveSense::Minimize;
        let mut col_map: HashMap<String, usize> = HashMap::new();
        let mut col_names: Vec<String> = Vec::new();
        let mut row_names: Vec<String> = Vec::new();

        let mut c_map: HashMap<usize, f64> = HashMap::new();
        let mut triplets: Vec<(usize, usize, f64)> = Vec::new();

        let mut row_lower = Vec::new();
        let mut row_upper = Vec::new();
        let mut col_lower_map: HashMap<usize, f64> = HashMap::new();
        let mut col_upper_map: HashMap<usize, f64> = HashMap::new();
        let mut var_types_map: HashMap<usize, VariableType> = HashMap::new();

        let mut get_or_create_col = |name: &str, cols: &mut Vec<String>, map: &mut HashMap<String, usize>| -> Result<usize, IoError> {
            if let Some(&idx) = map.get(name) {
                Ok(idx)
            } else {
                if cols.len() >= MAX_ALLOWED_COLS {
                    return Err(IoError::SecurityLimitExceeded("Column limit exceeded".to_string()));
                }
                let idx = cols.len();
                cols.push(name.to_string());
                map.insert(name.to_string(), idx);
                Ok(idx)
            }
        };

        for (line_idx, line_res) in reader.lines().enumerate() {
            let line_num = line_idx + 1;
            let raw_line = line_res?;
            if raw_line.len() > MAX_LINE_BYTES {
                return Err(IoError::SecurityLimitExceeded(format!("Line {line_num} exceeds max line length")));
            }
            let trimmed = raw_line.trim();
            if trimmed.is_empty() || trimmed.starts_with('\\') {
                continue;
            }

            let lower_trimmed = trimmed.to_lowercase();
            if lower_trimmed.starts_with("min") || lower_trimmed.starts_with("minimize") {
                section = LpSection::Objective;
                sense = ObjectiveSense::Minimize;
                continue;
            } else if lower_trimmed.starts_with("max") || lower_trimmed.starts_with("maximize") {
                section = LpSection::Objective;
                sense = ObjectiveSense::Maximize;
                continue;
            } else if lower_trimmed.starts_with("subject to") || lower_trimmed.starts_with("st") || lower_trimmed.starts_with("s.t.") {
                section = LpSection::SubjectTo;
                continue;
            } else if lower_trimmed.starts_with("bounds") {
                section = LpSection::Bounds;
                continue;
            } else if lower_trimmed.starts_with("general") || lower_trimmed.starts_with("generals") || lower_trimmed.starts_with("integers") {
                section = LpSection::Generals;
                continue;
            } else if lower_trimmed.starts_with("binary") || lower_trimmed.starts_with("binaries") || lower_trimmed.starts_with("bin") {
                section = LpSection::Binary;
                continue;
            } else if lower_trimmed.starts_with("end") {
                section = LpSection::End;
                break;
            }

            match section {
                LpSection::Objective => {
                    let tokens: Vec<&str> = trimmed.split_whitespace().collect();
                    let mut sign = 1.0;
                    let mut i = 0;
                    while i < tokens.len() {
                        let token = tokens[i];
                        if token == "+" {
                            sign = 1.0;
                            i += 1;
                        } else if token == "-" {
                            sign = -1.0;
                            i += 1;
                        } else {
                            let mut coef = sign;
                            let var_name;
                            if let Ok(c) = token.parse::<f64>() {
                                coef = sign * c;
                                i += 1;
                                var_name = tokens.get(i).copied().unwrap_or("");
                            } else {
                                var_name = token;
                            }
                            if !var_name.is_empty() {
                                let cidx = get_or_create_col(var_name, &mut col_names, &mut col_map)?;
                                c_map.insert(cidx, coef);
                            }
                            i += 1;
                        }
                    }
                }
                LpSection::SubjectTo => {
                    // Simple constraint parse: e.g. "c1: x + 2 y <= 10" or "x + 2 y <= 10"
                    let (rname, body) = if let Some(pos) = trimmed.find(':') {
                        (trimmed[..pos].trim().to_string(), trimmed[pos + 1..].trim())
                    } else {
                        (format!("r{}", row_names.len() + 1), trimmed)
                    };

                    let (lhs, op, rhs_str) = if let Some(pos) = body.find("<=") {
                        (&body[..pos], "<=", &body[pos + 2..])
                    } else if let Some(pos) = body.find(">=") {
                        (&body[..pos], ">=", &body[pos + 2..])
                    } else if let Some(pos) = body.find('=') {
                        (&body[..pos], "=", &body[pos + 1..])
                    } else {
                        continue;
                    };

                    let rhs_val: f64 = rhs_str.trim().parse().unwrap_or(0.0);
                    let ridx = row_names.len();
                    if ridx >= MAX_ALLOWED_ROWS {
                        return Err(IoError::SecurityLimitExceeded("Row limit exceeded".to_string()));
                    }
                    row_names.push(rname);

                    match op {
                        "<=" => {
                            row_lower.push(f64::NEG_INFINITY);
                            row_upper.push(rhs_val);
                        }
                        ">=" => {
                            row_lower.push(rhs_val);
                            row_upper.push(f64::INFINITY);
                        }
                        "=" => {
                            row_lower.push(rhs_val);
                            row_upper.push(rhs_val);
                        }
                        _ => {}
                    }

                    // Parse lhs terms
                    let tokens: Vec<&str> = lhs.split_whitespace().collect();
                    let mut sign = 1.0;
                    let mut i = 0;
                    while i < tokens.len() {
                        let token = tokens[i];
                        if token == "+" {
                            sign = 1.0;
                            i += 1;
                        } else if token == "-" {
                            sign = -1.0;
                            i += 1;
                        } else {
                            let mut coef = sign;
                            let var_name;
                            if let Ok(c) = token.parse::<f64>() {
                                coef = sign * c;
                                i += 1;
                                var_name = tokens.get(i).copied().unwrap_or("");
                            } else {
                                var_name = token;
                            }
                            if !var_name.is_empty() {
                                let cidx = get_or_create_col(var_name, &mut col_names, &mut col_map)?;
                                triplets.push((ridx, cidx, coef));
                            }
                            i += 1;
                        }
                    }
                }
                LpSection::Bounds => {
                    // Example: "0 <= x <= 10" or "x >= 5" or "x free"
                    let parts: Vec<&str> = trimmed.split_whitespace().collect();
                    if parts.len() == 2 && parts[1].to_lowercase() == "free" {
                        if let Some(&cidx) = col_map.get(parts[0]) {
                            col_lower_map.insert(cidx, f64::NEG_INFINITY);
                            col_upper_map.insert(cidx, f64::INFINITY);
                        }
                    } else if parts.len() == 3 && parts[1] == "<=" {
                        if let (Ok(val), Some(&cidx)) = (parts[0].parse::<f64>(), col_map.get(parts[2])) {
                            col_lower_map.insert(cidx, val);
                        } else if let (Some(&cidx), Ok(val)) = (col_map.get(parts[0]), parts[2].parse::<f64>()) {
                            col_upper_map.insert(cidx, val);
                        }
                    }
                }
                LpSection::Generals => {
                    for var in trimmed.split_whitespace() {
                        if let Some(&cidx) = col_map.get(var) {
                            var_types_map.insert(cidx, VariableType::Integer);
                        }
                    }
                }
                LpSection::Binary => {
                    for var in trimmed.split_whitespace() {
                        if let Some(&cidx) = col_map.get(var) {
                            var_types_map.insert(cidx, VariableType::Binary);
                            col_lower_map.insert(cidx, 0.0);
                            col_upper_map.insert(cidx, 1.0);
                        }
                    }
                }
                _ => {}
            }
        }

        let ncols = col_names.len();
        let nrows = row_names.len();
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
        let has_int = var_types.iter().any(|&v| v != VariableType::Continuous);
        let problem_type = if has_int { ProblemType::MILP } else { ProblemType::LP };

        Ok(Problem {
            name: "lp_problem".to_string(),
            problem_type,
            sense,
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
            q: None,
        })
    }

    pub fn from_string(content: &str) -> Result<Problem, IoError> {
        Self::parse(Cursor::new(content.as_bytes()))
    }
}
