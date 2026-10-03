//! JSON schema parser for optimization models

use super::mps::IoError;
use chanakya_model::Problem;
use std::io::BufRead;

pub struct JsonParser;

impl JsonParser {
    pub fn parse<R: BufRead>(reader: R) -> Result<Problem, IoError> {
        serde_json::from_reader(reader).map_err(|e| IoError::FormatError(e.to_string()))
    }

    pub fn from_string(content: &str) -> Result<Problem, IoError> {
        serde_json::from_str(content).map_err(|e| IoError::FormatError(e.to_string()))
    }

    pub fn to_string(problem: &Problem) -> Result<String, IoError> {
        serde_json::to_string_pretty(problem).map_err(|e| IoError::FormatError(e.to_string()))
    }
}
