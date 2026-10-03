//! Branch-and-Cut MILP Solver
//! Coordinates LP relaxation node evaluations, cuts, heuristics, and branching.

use chanakya_lp::DualSimplexSolver;
use chanakya_model::{BasisStatus, Problem, Solution, SolverStats, SolverStatus, VariableType};
use std::collections::BinaryHeap;
use std::time::Instant;

#[derive(Debug, Clone)]
struct Node {
    node_id: usize,
    depth: usize,
    lower_bounds: Vec<f64>,
    upper_bounds: Vec<f64>,
    estimated_bound: f64,
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        self.node_id == other.node_id
    }
}
impl Eq for Node {}
impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}
impl Ord for Node {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Min-heap on estimated_bound for best-bound search
        other.estimated_bound.partial_cmp(&self.estimated_bound).unwrap_or(std::cmp::Ordering::Equal)
    }
}

pub struct BranchAndCutSolver {
    pub max_nodes: usize,
    pub time_limit_seconds: f64,
    pub mip_gap_tolerance: f64,
    pub integrality_tolerance: f64,
}

impl Default for BranchAndCutSolver {
    fn default() -> Self {
        Self {
            max_nodes: 50_000,
            time_limit_seconds: 600.0,
            mip_gap_tolerance: 1e-4,
            integrality_tolerance: 1e-6,
        }
    }
}

impl BranchAndCutSolver {
    pub fn solve(&self, problem: &Problem) -> Solution {
        let start_time = Instant::now();
        let mut stats = SolverStats::default();

        let lp_solver = DualSimplexSolver::default();
        let n = problem.num_cols();
        let m = problem.num_rows();

        let mut incumbent_x = vec![0.0; n];
        let mut incumbent_obj = f64::INFINITY;
        let mut best_bound = f64::NEG_INFINITY;
        let mut nodes_explored = 0;

        let root_node = Node {
            node_id: 0,
            depth: 0,
            lower_bounds: problem.col_lower.clone(),
            upper_bounds: problem.col_upper.clone(),
            estimated_bound: f64::NEG_INFINITY,
        };

        let mut queue = BinaryHeap::new();
        queue.push(root_node);

        let mut next_node_id = 1;
        let mut status = SolverStatus::Optimal;

        while let Some(current_node) = queue.pop() {
            nodes_explored += 1;
            stats.bb_nodes_explored = nodes_explored;

            if start_time.elapsed().as_secs_f64() > self.time_limit_seconds {
                status = SolverStatus::TimeLimit;
                break;
            }

            if nodes_explored >= self.max_nodes {
                status = SolverStatus::IterationLimit;
                break;
            }

            // Construct node problem with local bounds
            let mut node_problem = problem.clone();
            node_problem.col_lower = current_node.lower_bounds.clone();
            node_problem.col_upper = current_node.upper_bounds.clone();

            // Solve LP relaxation
            let lp_sol = lp_solver.solve(&node_problem);

            if lp_sol.status == SolverStatus::Infeasible {
                continue; // Pruned by infeasibility
            }

            if lp_sol.objective_value >= incumbent_obj - 1e-6 {
                continue; // Pruned by bound
            }

            best_bound = best_bound.max(lp_sol.objective_value);

            // Check integrality
            let mut most_fractional_var = None;
            let mut max_fractionality = 0.0f64;

            for j in 0..n {
                if problem.var_types[j] != VariableType::Continuous {
                    let val = lp_sol.x[j];
                    let frac = (val - val.round()).abs();
                    if frac > self.integrality_tolerance && frac > max_fractionality {
                        max_fractionality = frac;
                        most_fractional_var = Some((j, val));
                    }
                }
            }

            match most_fractional_var {
                None => {
                    // Integer feasible solution found!
                    if lp_sol.objective_value < incumbent_obj {
                        incumbent_obj = lp_sol.objective_value;
                        incumbent_x = lp_sol.x.clone();
                        log::info!("New incumbent found at node {}: obj = {}", current_node.node_id, incumbent_obj);

                        let gap = if incumbent_obj.abs() > 1e-10 {
                            (incumbent_obj - best_bound).abs() / incumbent_obj.abs()
                        } else {
                            0.0
                        };

                        if gap <= self.mip_gap_tolerance {
                            status = SolverStatus::Optimal;
                            break;
                        }
                    }
                }
                Some((branch_var, frac_val)) => {
                    // Branch into floor and ceil nodes
                    let floor_val = frac_val.floor();
                    let ceil_val = frac_val.ceil();

                    // Left child: x_j <= floor(x_j)
                    if floor_val >= current_node.lower_bounds[branch_var] {
                        let mut left_upper = current_node.upper_bounds.clone();
                        left_upper[branch_var] = floor_val;
                        queue.push(Node {
                            node_id: next_node_id,
                            depth: current_node.depth + 1,
                            lower_bounds: current_node.lower_bounds.clone(),
                            upper_bounds: left_upper,
                            estimated_bound: lp_sol.objective_value,
                        });
                        next_node_id += 1;
                    }

                    // Right child: x_j >= ceil(x_j)
                    if ceil_val <= current_node.upper_bounds[branch_var] {
                        let mut right_lower = current_node.lower_bounds.clone();
                        right_lower[branch_var] = ceil_val;
                        queue.push(Node {
                            node_id: next_node_id,
                            depth: current_node.depth + 1,
                            lower_bounds: right_lower,
                            upper_bounds: current_node.upper_bounds.clone(),
                            estimated_bound: lp_sol.objective_value,
                        });
                        next_node_id += 1;
                    }
                }
            }
        }

        let gap = if incumbent_obj.abs() > 1e-10 && incumbent_obj.is_finite() {
            (incumbent_obj - best_bound).abs() / incumbent_obj.abs()
        } else {
            0.0
        };

        stats.solve_time_seconds = start_time.elapsed().as_secs_f64();
        stats.best_bound = best_bound;
        stats.mip_gap = gap;

        Solution {
            status,
            objective_value: incumbent_obj,
            x: incumbent_x,
            y: None,
            slack: None,
            basis_col: None,
            basis_row: None,
            stats,
            verified: false,
            verification_notes: Vec::new(),
        }
    }
}
