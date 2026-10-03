# Chanakya — Sovereign Mathematical Optimization Solver

> A from-scratch **LP / MILP / QP** solver core for Indian industry.
> No CPLEX. No Gurobi. No Xpress. No borrowed solver code.
> *(Chanakya is a placeholder name — rename freely.)*

![status](https://img.shields.io/badge/status-in%20development-orange)
![core](https://img.shields.io/badge/core-Rust-b7410e)
![api](https://img.shields.io/badge/api-FastAPI-009688)
![ui](https://img.shields.io/badge/ui-Next.js-black)
![security](https://img.shields.io/badge/security-7--layer-22d3ee)

## Why
India's refineries, power grids, logistics and manufacturing run on foreign optimization solvers: high license cost, closed internals, strategic dependency. Chanakya is a transparent, extensible, sovereign engine built from mathematical foundations.

## Documentation
| Document | What it covers |
|----------|----------------|
| [PRD.md](./PRD.md) | Problem, goals, personas, user stories, requirements, UX/design spec, milestones |
| [TRD.md](./TRD.md) | Architecture, solver design, API, database, 7-layer security, folder structure, benchmarks, DevOps |

## Features
- **Solvers:** LP (dual/primal revised simplex, interior point), MILP (branch-and-cut, presolve, heuristics), QP (convex, interior point)
- **Robustness:** scaling, degeneracy handling, refactorization, and a verify-before-report check on every solution
- **Interfaces:** CLI, REST API, Python binding, web console with live progress
- **Parallel:** multi-core B&B with deterministic mode
- **Security:** DoS/DDoS protection, SQL injection prevention, strict request validation, authentication separated from authorization, sandboxed solver workers
- **Benchmarks:** Netlib, MIPLIB, Mittelmann with published comparison vs HiGHS

## Architecture (short)
```
Browser (Next.js) -> Cloudflare WAF/DDoS -> Nginx -> FastAPI -> PostgreSQL
                                                         |
                                                       Redis -> Sandboxed Rust workers -> MinIO/S3
```
Full detail: [TRD.md](./TRD.md).

## 7-Layer Security
1. Edge: WAF + DDoS mitigation
2. Transport: TLS 1.3, HSTS, strict headers
3. Traffic control: rate limits, quotas, body caps
4. Validation: strict schemas, file sniffing, fuzzed parsers
5. **Authentication:** who are you (argon2id, JWT + rotating refresh, MFA)
6. **Authorization:** what may you do (RBAC + object ownership)
7. Data and execution: parameterized SQL, least-privilege DB, sandboxed solver

## Repository Layout
```
chanakya/
├── solver-core/   Rust workspace (model, io, presolve, linalg, lp, ipm, qp, mip, verify, cli, worker)
├── backend/       FastAPI service (api, core, db, services, schemas, tests)
├── frontend/      Next.js web console
├── benchmarks/    data fetchers, runners, reports
├── infra/         nginx, k8s, terraform, monitoring, sandbox
├── docs/          architecture, algorithms, runbooks
└── scripts/
```

## Quick Start
```bash
git clone https://github.com/<you>/chanakya.git && cd chanakya
cp .env.example .env            # fill in secrets

# Full stack (dev)
docker compose up --build

# Solver CLI only
cd solver-core && cargo build --release
./target/release/chanakya solve ../benchmarks/data/netlib/afiro.mps --time-limit 60

# Backend tests (includes security suite)
cd backend && pytest -q

# Frontend
cd frontend && npm install && npm run dev
```
| Service | Dev URL |
|---------|---------|
| Frontend | http://localhost:3000 |
| API + docs | http://localhost:8000/docs |
| PostgreSQL | :5432 |
| Redis | :6379 |
| MinIO console | :9001 |

## Example: Submit a Job
```bash
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -F "model_file=@refinery_blend.mps" \
  -F 'params={"time_limit_s":600,"mip_gap":0.001,"threads":4,"seed":42}'
```

## Roadmap
| Phase | Deliverable |
|-------|-------------|
| 0 | Repo, CI, fuzzed parsers, CLI skeleton |
| 1 | Presolve, scaling, sparse LU, dual simplex passing Netlib |
| 2 | Primal simplex, degeneracy handling, IPM + crossover |
| 3 | Backend, DB, auth/authz, security layers, sandboxed workers |
| 4 | Frontend |
| 5 | Branch-and-cut, heuristics, parallel B&B |
| 6 | QP, benchmark publishing, hardening, pen-test |
| 7 | MIQP / NLP / MINLP |

## Contributing and Security
See `CONTRIBUTING.md`. Report vulnerabilities privately per `SECURITY.md`.

## License
Choose per policy (for example Apache-2.0). See `LICENSE`.
