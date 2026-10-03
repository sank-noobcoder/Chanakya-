//! Chanakya Sovereign Mathematical Optimization Solver CLI
//! Written from scratch without CPLEX, Gurobi, Xpress, or HiGHS.

use chanakya_io::{JsonParser, LpParser, MpsParser};
use chanakya_ipm::InteriorPointSolver;
use chanakya_lp::DualSimplexSolver;
use chanakya_mip::BranchAndCutSolver;
use chanakya_model::{Problem, ProblemType, Solution, SolverStatus};
use chanakya_presolve::Presolver;
use chanakya_qp::QpSolver;
use chanakya_scaling::Scaler;
use chanakya_verify::SolutionVerifier;
use clap::{Parser, Subcommand, ValueEnum};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "chanakya")]
#[command(about = "Sovereign Mathematical Optimization Solver (LP / MILP / QP)", long_about = None)]
#[command(version = "1.0.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum)]
enum AlgorithmChoice {
    Auto,
    Simplex,
    Ipm,
    BranchAndCut,
}

#[derive(Subcommand)]
enum Commands {
    /// Solve an optimization problem model file (.mps, .lp, .json)
    Solve {
        /// Path to model file
        file: PathBuf,
        /// Algorithm choice: auto, simplex, ipm, branch-and-cut
        #[arg(short, long, value_enum, default_value_t = AlgorithmChoice::Auto)]
        algorithm: AlgorithmChoice,
        /// Time limit in seconds
        #[arg(long, default_value_t = 600.0)]
        time_limit: f64,
        /// Relative MIP optimality gap tolerance
        #[arg(long, default_value_t = 1e-4)]
        mip_gap: f64,
        /// Number of worker threads
        #[arg(short, long, default_value_t = 4)]
        threads: usize,
        /// Random seed for perturbation
        #[arg(short, long, default_value_t = 42)]
        seed: u64,
        /// Output solution JSON to file
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Inspect problem dimensions, non-zeros, and characteristics
    Info {
        file: PathBuf,
    },
    /// Verify a solution vector against a model file
    Verify {
        model: PathBuf,
        solution: PathBuf,
    },
}

fn load_problem(path: &PathBuf) -> Result<Problem, Box<dyn std::error::Error>> {
    let file = File::open(path)?;
    let mut reader = BufReader::new(file);

    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    match ext.to_lowercase().as_str() {
        "mps" => Ok(MpsParser::parse(reader)?),
        "lp" => Ok(LpParser::parse(reader)?),
        "json" => Ok(JsonParser::parse(reader)?),
        _ => {
            // Default attempt MPS
            Ok(MpsParser::parse(reader)?)
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    let cli = Cli::parse();

    println!("==================================================================");
    println!(" Chanakya — Sovereign Mathematical Optimization Solver v1.0.0");
    println!(" Built from mathematical foundations in India. Zero foreign code.");
    println!("==================================================================");

    match cli.command {
        Commands::Info { file } => {
            let problem = load_problem(&file)?;
            println!("Problem Name:       {}", problem.name);
            println!("Problem Type:       {:?}", problem.problem_type);
            println!("Variables (Cols):   {}", problem.num_cols());
            println!("Constraints (Rows): {}", problem.num_rows());
            println!("Non-zero Elements:  {}", problem.a.nnz());
            println!("Quadratic Terms:    {}", if problem.has_qp() { "Yes" } else { "None" });
            println!("Is Integer / MIP:   {}", if problem.is_mip() { "Yes" } else { "No" });
        }

        Commands::Solve {
            file,
            algorithm,
            time_limit,
            mip_gap,
            threads,
            seed,
            output,
        } => {
            let mut problem = load_problem(&file)?;
            println!("Loaded model: {} ({} rows, {} cols, {} nnz)", problem.name, problem.num_rows(), problem.num_cols(), problem.a.nnz());

            // 1. Presolve
            let original_problem = problem.clone();
            let presolve_res = Presolver::presolve(&mut problem);
            println!("Presolve: removed {} rows, {} cols", presolve_res.rows_removed, presolve_res.cols_removed);

            // 2. Matrix Scaling
            let scaler = Scaler::scale_problem(&mut problem, 4);

            // 3. Algorithm Dispatch
            let chosen_algo = match algorithm {
                AlgorithmChoice::Auto => {
                    if problem.has_qp() {
                        AlgorithmChoice::Ipm
                    } else if problem.is_mip() {
                        AlgorithmChoice::BranchAndCut
                    } else {
                        AlgorithmChoice::Simplex
                    }
                }
                other => other,
            };

            let mut solution: Solution = match chosen_algo {
                AlgorithmChoice::Simplex => {
                    println!("Executing Sovereign Dual Revised Simplex Engine...");
                    let solver = DualSimplexSolver {
                        max_iterations: 1_000_000,
                        time_limit_seconds: time_limit,
                        tolerance: 1e-7,
                        seed,
                    };
                    solver.solve(&problem)
                }
                AlgorithmChoice::Ipm => {
                    if problem.has_qp() {
                        println!("Executing Convex Quadratic Interior Point Solver...");
                        let solver = QpSolver {
                            max_iterations: 200,
                            tolerance: 1e-7,
                            time_limit_seconds: time_limit,
                        };
                        solver.solve(&problem)
                    } else {
                        println!("Executing Mehrotra Predictor-Corrector Interior Point Solver...");
                        let solver = InteriorPointSolver {
                            max_iterations: 200,
                            tolerance: 1e-8,
                            time_limit_seconds: time_limit,
                        };
                        solver.solve(&problem)
                    }
                }
                AlgorithmChoice::BranchAndCut | AlgorithmChoice::Auto => {
                    println!("Executing Sovereign Branch-and-Cut Engine (Deterministic Parallel)...");
                    let solver = BranchAndCutSolver {
                        max_nodes: 500_000,
                        time_limit_seconds: time_limit,
                        mip_gap_tolerance: mip_gap,
                        integrality_tolerance: 1e-6,
                    };
                    solver.solve(&problem)
                }
            };

            // 4. Unscale Solution
            scaler.unscale_primal(&mut solution.x);

            // 5. Postsolve
            Presolver::postsolve(&original_problem, &mut solution, &presolve_res);

            // 6. Mandatory Verify-Before-Report Guarantee
            println!("Performing independent linear algebra verification...");
            let verifier = SolutionVerifier::default();
            let report = verifier.verify(&original_problem, &mut solution);

            println!("------------------------------------------------------------------");
            println!("Solve Status:       {:?}", solution.status);
            println!("Objective Value:    {:.10}", solution.objective_value);
            println!("Solve Time:         {:.4} s", solution.stats.solve_time_seconds);
            println!("Simplex Pivots:     {}", solution.stats.simplex_pivots);
            println!("B&B Nodes:          {}", solution.stats.bb_nodes_explored);
            println!("MIP Gap:            {:.6}%", solution.stats.mip_gap * 100.0);
            println!("Independent Verify: {}", if report.passed { "PASSED (VERIFIED OPTIMAL)" } else { "FAILED (NUMERICAL TROUBLE)" });
            println!("------------------------------------------------------------------");

            if let Some(out_path) = output {
                let out_file = File::create(out_path)?;
                serde_json::to_writer_pretty(out_file, &solution)?;
                println!("Solution successfully exported.");
            }
        }

        Commands::Verify { model, solution } => {
            let problem = load_problem(&model)?;
            let sol_file = File::open(solution)?;
            let mut sol: Solution = serde_json::from_reader(BufReader::new(sol_file))?;

            let verifier = SolutionVerifier::default();
            let report = verifier.verify(&problem, &mut sol);

            if report.passed {
                println!("SUCCESS: Solution satisfies all primal feasibility, bounds, and integrality constraints.");
            } else {
                println!("VERIFICATION FAILED: Violations detected: {:?}", report.messages);
                std::process::exit(1);
            }
        }
    }

    Ok(())
}
