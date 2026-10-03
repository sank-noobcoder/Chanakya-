# Chanakya — Technical Requirements Document (TRD)

**Companion doc:** [PRD.md](./PRD.md) · **Version:** 1.0 · **Status:** Active Reference

---

## 1. Technology Stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Solver core | **Rust** (or C++20) | Memory safety, speed, safe concurrency (rayon) |
| Linear algebra | In-house sparse CSC/CSR, LU, Cholesky | No external solver libs allowed |
| Bindings | PyO3 (Python), C ABI | Adoption and integration |
| Backend API | **FastAPI** (Python 3.12) | Pydantic validation, OpenAPI docs |
| Workers | Rust binary + Python supervisor | Isolates solver from API process |
| Queue / counters | **Redis** (streams, sliding-window limits) | Job dispatch, rate limiting |
| Database | **PostgreSQL 16** | Users, jobs, audit, benchmarks |
| Object storage | MinIO / S3 | Models, results, logs |
| Frontend | **Next.js 14 + TypeScript + Tailwind** | Modern SSR UI |
| Realtime | Server-Sent Events | Live solve progress |
| Edge | Cloudflare (WAF/DDoS) + Nginx/Caddy | TLS, filtering |
| Observability | Prometheus, Grafana, Loki, OpenTelemetry | Metrics, logs, traces |
| CI/CD | GitHub Actions, Docker, Kubernetes (or Compose) | Reproducible deploys |

**Forbidden-dependency policy:** `cargo deny` config blocks any crate implementing LP/MILP/QP solving. CI fails on violation.

## 2. System Architecture

```
Browser (Next.js) --HTTPS--> Cloudflare (WAF/DDoS) --> Nginx --> FastAPI (API)
                                                                  |        |
                                                  PostgreSQL <----+        +----> Redis (queue, rate limits)
                                                                                      |
                                                                                      v
                                                                        Solver Workers (sandboxed)
                                                                          Rust solver core
                                                                                      |
                                                                                      v
                                                                        MinIO/S3 (models, results, logs)
```

**Principle:** the API never runs solver code in-process. Workers pull jobs, run in a resource-limited sandbox, and write results to storage and DB.

### Submit-Solve Flow
1. `POST /api/v1/jobs` with JWT
2. Edge WAF + rate limit, then Nginx, then API
3. API: validate headers, size, schema; authenticate; authorize (permission + quota)
4. File stored in S3 (checksummed, type-sniffed, size-capped)
5. `jobs` row inserted via parameterized query; message pushed to Redis stream
6. Worker claims job, solves, publishes progress to Redis pub/sub
7. API streams progress to UI via SSE; result persisted

## 3. Solver Core Architecture

### 3.1 Modules
```
solver-core/crates/
  model/       problem representation, sparse matrices, bounds, variable types
  io/          MPS/LP/JSON parsers (fuzzed, size-limited)
  presolve/    singleton rows, dominated columns, bound tightening, duplicate rows, coefficient tightening
  scaling/     geometric / equilibration scaling
  linalg/      sparse LU (Markowitz), Forrest-Tomlin update, Cholesky, AMD ordering, iterative refinement
  lp/          primal and dual revised simplex, bound-flipping ratio test, perturbation for degeneracy
  ipm/         primal-dual interior point (Mehrotra predictor-corrector), crossover
  qp/          convex QP via IPM
  mip/         branch-and-bound / branch-and-cut
    branching/   pseudocost, strong, reliability
    cuts/        Gomory, MIR, knapsack cover, flow cover, clique
    heuristics/  diving, feasibility pump, RINS, rounding
    nodesel/     best-bound, best-estimate, hybrid
  parallel/    thread pool, deterministic parallel B&B
  verify/      independent primal/dual feasibility and integrality checker
  cli/  worker/  pybind/
```

### 3.2 Numerical Robustness
- Scale before every solve; unscale on output
- Harris two-pass ratio test with bound shifting
- Cost perturbation for dual degeneracy, then cleanup
- LU refactorization on growth/instability; iterative refinement
- IPM regularization for rank-deficient or ill-conditioned normal equations
- **Verify-before-report:** every solution passes `verify/`. On failure the status is `numerical_trouble`, never `optimal`

### 3.3 Parallelism
- Phase 1: parallel presolve/matrix ops, parallel node processing
- Phase 2: deterministic mode (fixed seed, ordered node queue)
- GPU: only for IPM linear algebra, only after a CPU baseline, only if measured gain

## 4. Backend API
Base `/api/v1` · JSON · `Authorization: Bearer <JWT>` or hashed API key.

| Method | Endpoint | Purpose | Required role |
|--------|----------|---------|---------------|
| POST | `/auth/register` | Create account | public, rate-limited |
| POST | `/auth/login` | Access + refresh token | public, rate-limited |
| POST | `/auth/refresh` | Rotate refresh token | authenticated |
| POST | `/auth/logout` | Revoke refresh token | authenticated |
| GET | `/me` | Profile | user |
| POST | `/jobs` | Submit model + params | user |
| GET | `/jobs` | List own jobs | user |
| GET | `/jobs/{id}` | Status | owner / admin |
| GET | `/jobs/{id}/events` | SSE progress | owner / admin |
| POST | `/jobs/{id}/cancel` | Cancel | owner / admin |
| GET | `/jobs/{id}/result` | Solution + stats | owner / admin |
| GET | `/jobs/{id}/log` | Solver log | owner / admin |
| GET | `/benchmarks` | List suites | user |
| POST | `/benchmarks/run` | Run suite | engineer / admin |
| GET | `/admin/users` | Manage users | admin |
| GET | `/admin/audit` | Audit log | admin |
| GET | `/health`, `/ready` | Probes | internal only |

## 5. Database Design (PostgreSQL)
All access via SQLAlchemy Core / parameterized queries only.

## 6. Security: 7-Layer Model

> **Authentication is not authorization.**
> Authentication = "who are you?" (password + MFA, JWT, API key).
> Authorization = "what may you do?" (role + ownership checks on every endpoint and every object).
> A valid token alone grants nothing. Object-level checks prevent IDOR/BOLA.

| Layer | Name | Controls |
|-------|------|----------|
| **L1** | Edge / Network | WAF, DDoS mitigation, bot management, IP reputation, origin locked to CDN ranges, default-deny firewall, private network for DB/Redis/workers |
| **L2** | Transport | TLS 1.3 only, HSTS preload, `HttpOnly; Secure; SameSite=Strict` cookies, strict CORS allowlist, CSP + security headers, mTLS between internal services |
| **L3** | Traffic Control / Anti-DoS | Redis sliding-window rate limits per IP, user and API key; stricter on `/auth/*`; body size caps; header/body timeouts (slowloris); connection limits; per-user job quota and concurrency cap; queue back-pressure; circuit breakers |
| **L4** | Request Validation | Pydantic strict schemas (`extra=forbid`), type/range/enum/length checks, content-type allowlist, file magic-byte sniffing, parser hard limits (rows, cols, nnz, line length, no recursion), fuzz-tested parsers, server-generated filenames only (no path traversal), request ID on everything |
| **L5** | Authentication | argon2id, 10-15 min JWT + rotating hashed refresh tokens with reuse detection, optional TOTP MFA, hashed API keys, login throttling/backoff, constant-time compares, no user enumeration |
| **L6** | Authorization | RBAC (`user`, `engineer`, `admin`), object ownership checks on every read/write, API key scopes, deny-by-default FastAPI dependencies, re-auth for admin actions, centralized policy module with per-endpoint tests |
| **L7** | Data and Execution | **SQLi prevention:** parameterized queries/ORM only, no string-built SQL, least-privilege DB roles, statement timeouts. Encryption at rest and in transit, secrets in a vault. **Solver sandbox:** gVisor/container, cgroup CPU/mem/time limits, seccomp, read-only FS, no network, non-root. Immutable audit log |

## 7. Production Folder Structure
As reflected in the repository tree.
