# Chanakya — Sovereign Mathematical Optimization Solver

> A from-scratch **LP / MILP / QP** sovereign optimization solver core for Indian industry.  
> No CPLEX. No Gurobi. No Xpress. No borrowed solver code.

![status](https://img.shields.io/badge/status-production--ready%20architecture-orange)
![core](https://img.shields.io/badge/core-Rust-b7410e)
![api](https://img.shields.io/badge/api-FastAPI-009688)
![ui](https://img.shields.io/badge/ui-Next.js%2014%20SSR-black)
![security](https://img.shields.io/badge/security-OSI%207--Layer%20Defense-22d3ee)
![license](https://img.shields.io/badge/license-Apache--2.0-blue)

---

## 1. Why Chanakya?
India's refineries, petrochemical complexes, power dispatch grids, logistics networks, and heavy manufacturing depend heavily on foreign proprietary optimization solvers (IBM CPLEX, Gurobi, FICO Xpress). This creates:
- Critical strategic vulnerability in vital national infrastructure
- Exorbitant recurring licensing expenditures and vendor lock-in
- Zero visibility into or sovereign control over solver numerical internals
- Sub-optimal adaptation to India-specific operational constraints

**Chanakya** is an indigenously engineered, transparent, mathematically sound sovereign optimization engine written completely from scratch.

---

## 2. Key Capabilities
- **Solvers Built From First Principles:**
  - **LP:** Primal and Dual Revised Simplex with Markowitz Sparse LU, Forrest-Tomlin rank-one basis updates, Harris two-pass ratio test, bound flipping, and primal-dual Interior Point Method (Mehrotra predictor-corrector) with crossover.
  - **MILP:** Branch-and-Cut engine featuring pseudocost and strong branching, Gomory mixed-integer cuts, Knapsack cover cuts, and Feasibility Pump heuristics.
  - **QP:** Convex Quadratic Programming via regularized Interior Point barrier methods.
- **Extreme Numerical Robustness:**
  - Dual degeneracy cost perturbation and Curtis-Reid equilibration scaling.
  - **Verify-Before-Report Guarantee:** Every candidate solution is checked independently for primal feasibility, dual feasibility, and integrality.
- **Enterprise Architecture & 7-Layer OSI Security:**
  - DDoS shielding & slowloris mitigation via reverse proxy and sliding-window rate limiting.
  - 100% Parameterized database interactions preventing SQL Injection.
  - Server-Side Rendered (SSR) Next.js 14 console with real-time SSE progress streaming.
  - Sandboxed worker execution model isolating computation from the API.

---

## 3. Architecture Overview

```
[ Client Browser / CLI ]
           |
       (HTTPS)
           v
[ Nginx Reverse Proxy (WAF / DDoS / TLS 1.3 / Rate Limiting) ]
           |
       (HTTP / WS)
           v
[ FastAPI Service (Pydantic Validation / Argon2id / JWT / RBAC / Audit) ]
       |                  |                                   |
  (SQLAlchemy)         (Redis)                             (MinIO/S3)
       v                  v                                   v
[ PostgreSQL 16 ]   [ Job Queue & Pub/Sub ]            [ Encrypted Storage ]
                          |
                    (Claim Job)
                          v
         [ Sandboxed Solver Worker Pool (Rust Core) ]
         - Model Parser (MPS/LP/JSON)
         - Presolver & Matrix Scaler
         - Simplex / IPM / Branch-and-Cut
         - Solution Independent Verifier
```

---

## 4. 7-Layer OSI Security Model

| Layer | Security Domain | Implemented Controls |
|---|---|---|
| **L1** | Network / Edge | Cloudflare WAF, Nginx reverse proxy, IP reputation, VPC isolation |
| **L2** | Transport | TLS 1.3 exclusively, Strict HSTS (`max-age=63072000`), secure cookies |
| **L3** | Traffic Control / Anti-DDoS | Redis sliding-window rate limiters, Slowloris buffers, request body caps |
| **L4** | Request Validation | Pydantic strict schemas (`extra="forbid"`), file magic-byte sniffers, fuzzed parsers |
| **L5** | Authentication | Argon2id password hashing, rotating JWT + refresh tokens with family reuse detection |
| **L6** | Authorization | Strict RBAC (`user`, `engineer`, `admin`) + Object-level ownership check (BOLA/IDOR prevention) |
| **L7** | Data & Execution | Parameterized SQL queries, sandboxed worker cgroups/seccomp, immutable audit log |

---

## 5. Repository Layout
```
chanakya/
├── SECURITY.md                  # 7-Layer Security Architecture & Vulnerability Reporting
├── CONTRIBUTING.md              # Engineering & Code Guidelines
├── LICENSE                      # Apache 2.0 License
├── Makefile                     # Build, run, test, and benchmark targets
├── docker-compose.yml           # Complete containerized dev environment
├── docker-compose.prod.yml      # Hardened production stack
├── .env.example                 # Environment variables specification
│
├── client/                      # Next.js 14 SSR Web Console
│   └── src/
│       ├── app/                 # App Router (Landing, Dashboard, New Solve, Job Detail, Benchmarks, Docs, Admin, Auth)
│       ├── components/          # Animated Simplex Polytope, convergence charts, UI
│       └── lib/                 # API client, SSE subscriber, authentication state
│
├── server/                      # FastAPI (Python 3.12) Microservice
│   ├── app/
│   │   ├── api/v1/              # Auth, Jobs, Benchmarks, Admin, Health routes
│   │   ├── core/                # Config, security, sliding-window rate limits, RBAC
│   │   ├── db/                  # Session, models, 100% parameterized repositories
│   │   ├── middleware/          # Security headers, body limit, request ID tracing
│   │   ├── schemas/             # Strict Pydantic models (extra="forbid")
│   │   └── services/            # Job dispatcher, storage, audit, SSE stream
│   └── tests/                   # Comprehensive unit, integration & security matrix tests
│
├── solver-core/                 # High-performance Rust Solver Workspace
│   ├── Cargo.toml               # Workspace manifest
│   ├── deny.toml                # Blocks forbidden solver libraries (CI gated)
│   └── crates/
│       ├── model/               # Sparse matrices (CSC/CSR), problem formulation
│       ├── io/                  # MPS (fixed/free), LP, JSON robust parsers
│       ├── presolve/            # Redundancy elimination & bound tightening
│       ├── scaling/             # Geometric & equilibration scaling
│       ├── linalg/              # Sparse Markowitz LU, Forrest-Tomlin, Cholesky
│       ├── lp/                  # Primal & Dual revised simplex, Harris ratio test
│       ├── ipm/                 # Mehrotra predictor-corrector interior point & crossover
│       ├── qp/                  # Convex quadratic programming
│       ├── mip/                 # Branch-and-cut, Gomory cuts, feasibility pump
│       ├── parallel/            # Deterministic parallel B&B coordinator
│       ├── verify/              # Independent primal/dual/integrality verifier
│       ├── cli/                 # Chanakya command-line interface
│       ├── worker/              # Sandboxed Redis-driven solver worker
│       └── pybind/              # Python PyO3 bindings
│
├── benchmarks/                  # Netlib & MIPLIB benchmark models + Indian refinery instances
├── infra/                       # Nginx reverse proxy, Kubernetes manifests, Prometheus/Grafana, Sandbox
├── docs/                        # PRD, TRD, algorithms, security architecture runbooks
└── scripts/                     # Seeders, benchmark runners, dev orchestration
```

---

## 6. Quick Start

### 1. Run the Complete Stack via Docker Compose
```bash
cp .env.example .env
docker compose up --build
```

Access points:
- **Frontend Console (SSR):** `http://localhost:3000`
- **Reverse Proxy / API Gateway:** `http://localhost:8080` (or `http://localhost:8000/docs`)
- **MinIO S3 Console:** `http://localhost:9001`
- **PostgreSQL 16:** `localhost:5432`
- **Redis:** `localhost:6379`

### 2. Standalone Rust Solver CLI
```bash
cd solver-core
cargo run --release -p chanakya-cli -- solve ../benchmarks/data/netlib/afiro.mps --time-limit 60
```

### 3. Server Verification & Security Test Suite
```bash
cd server
pytest -v tests/test_security_matrix.py
```

---

## 7. Compliance & Sovereign Mission
Chanakya is strictly developed from mathematical foundations under the **Apache-2.0 License**. It does not wrap, link, or incorporate foreign commercial or copyleft solver engines.
