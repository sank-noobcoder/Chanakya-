# Contributing to Chanakya

Thank you for contributing to the sovereign optimization engine for India.

## 1. Zero Foreign Solver Code Rule (CRITICAL)
- The core solver must be implemented **from first principles**.
- You must **never** link, wrap, vendor, or import any code from CPLEX, Gurobi, Xpress, HiGHS, SCIP, CBC, GLPK, or any existing LP/MILP/QP solver.
- CI runs `cargo deny check` against banned crate registries and forbidden dependency trees. Any violation results in an immediate PR rejection.

## 2. Code Quality & Standards
- **Rust Core:**
  - `cargo fmt --all -- --check`
  - `cargo clippy --workspace --all-targets -- -D warnings`
  - `cargo test --workspace`
- **Server / Backend (Python 3.12 / FastAPI):**
  - Type annotations required on all functions (`mypy --strict`)
  - Format with `ruff format` and lint with `ruff check`
  - 100% Parameterized queries only. Never concatenate SQL strings.
- **Client / Frontend (Next.js 14 / TypeScript):**
  - Strict TypeScript configuration (`tsc --noEmit`)
  - ESLint passing with zero warnings
  - Accessible components adhering to WCAG AA.

## 3. Development Workflow
1. Fork the repository and create your feature branch: `git checkout -b feat/scaling-curtis-reid`.
2. Commit with conventional commit messages (`feat:`, `fix:`, `perf:`, `security:`).
3. Ensure all tests pass, including the security test matrix (`cd server && pytest tests/test_security_matrix.py`).
4. Submit your pull request with a detailed description.
