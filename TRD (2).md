# Chanakya — Technical Requirements Document (TRD)

**Companion doc:** [PRD.md](./PRD.md) · **Version:** 1.0 · **Status:** Draft

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

**Submit example**
```http
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: multipart/form-data

model_file: refinery_blend.mps
params: {"time_limit_s": 600, "mip_gap": 0.001, "threads": 4, "seed": 42}
```
`202 Accepted`:
```json
{ "job_id": "9f1c...e2", "status": "queued", "links": { "events": "/api/v1/jobs/9f1c...e2/events" } }
```

**Error shape** (no stack traces, SQL errors or internal paths ever returned):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "time_limit_s must be between 1 and 3600", "request_id": "..." } }
```

## 5. Database Design (PostgreSQL)
All access via SQLAlchemy Core / parameterized queries only.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                       -- argon2id
  role          TEXT NOT NULL CHECK (role IN ('user','engineer','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_secret    BYTEA,                               -- encrypted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL,                         -- never store raw key
  scopes      TEXT[] NOT NULL,
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id),
  problem_type  TEXT NOT NULL CHECK (problem_type IN ('LP','MILP','QP')),
  status        TEXT NOT NULL,
  model_uri     TEXT NOT NULL,
  model_sha256  CHAR(64) NOT NULL,
  params        JSONB NOT NULL,
  result_uri    TEXT,
  objective     DOUBLE PRECISION,
  gap           DOUBLE PRECISION,
  stats         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ
);
CREATE INDEX idx_jobs_owner_created ON jobs(owner_id, created_at DESC);
CREATE INDEX idx_jobs_status ON jobs(status);

CREATE TABLE benchmark_runs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite     TEXT NOT NULL,            -- netlib | miplib | mittelmann
  instance  TEXT NOT NULL,
  solver    TEXT NOT NULL,            -- chanakya | highs | ...
  status    TEXT NOT NULL,
  objective DOUBLE PRECISION,
  time_s    DOUBLE PRECISION,
  nodes     BIGINT,
  run_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID,
  action     TEXT NOT NULL,
  resource   TEXT,
  ip         INET,
  request_id UUID,
  detail     JSONB,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**DB hardening:** separate roles (`app_rw`, `worker_rw`, `readonly`, `migrator`), no superuser from app, TLS to DB, ownership enforced in queries (`WHERE owner_id = :uid`), encrypted backups, pool limits, statement timeout.

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

**Cross-cutting:** structured logs with request IDs and no secrets; alerts on auth-failure and 429 spikes; pinned dependencies; `cargo audit`, `pip-audit`, `npm audit`, Trivy scans, SBOM, signed images; SAST (Semgrep/CodeQL), secret scanning, mandatory review.

### Security Test Matrix (CI gate)
| Threat | Test | Expected |
|--------|------|----------|
| SQL injection | Payload suite on every string param | 4xx, no DB error leak |
| IDOR/BOLA | User A requests user B's job | 403/404 |
| Privilege escalation | `user` calls `/admin/*` | 403 |
| Brute force | Repeated failed logins | Throttled |
| DoS | Oversize body, slow request, flood | Rejected / 429 |
| Malicious model | Zip bomb, huge MPS, malformed fields | Clean rejection within limits |
| JWT abuse | Expired, tampered, `alg=none` | 401 |

## 7. Production Folder Structure

```
chanakya/
├── README.md  PRD.md  TRD.md  SECURITY.md  CONTRIBUTING.md  LICENSE
├── Makefile
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .github/workflows/
│   ├── ci.yml
│   ├── security.yml
│   ├── benchmark.yml          # nightly Netlib/MIPLIB regression
│   └── release.yml
│
├── solver-core/               # Rust workspace
│   ├── Cargo.toml
│   ├── deny.toml              # blocks forbidden solver crates
│   ├── crates/ (model io presolve scaling linalg lp ipm qp mip parallel verify cli worker pybind)
│   ├── benches/
│   ├── fuzz/                  # cargo-fuzz parser targets
│   └── tests/
│
├── backend/                   # FastAPI
│   ├── pyproject.toml  Dockerfile  alembic.ini
│   ├── migrations/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/              # config, security, rate_limit, permissions, logging
│   │   ├── api/
│   │   │   ├── deps.py        # authn + authz dependencies
│   │   │   └── v1/            # auth, jobs, benchmarks, admin, health
│   │   ├── middleware/        # request_id, security_headers, body_limit, error_handler
│   │   ├── db/                # session, models, repositories/ (parameterized only)
│   │   ├── schemas/           # strict Pydantic models
│   │   ├── services/          # job, storage, queue, audit
│   │   └── utils/
│   └── tests/ (unit integration security)
│
├── frontend/                  # Next.js
│   ├── package.json  next.config.js  tailwind.config.ts
│   ├── public/
│   └── src/
│       ├── app/               # (marketing) dashboard jobs benchmarks docs admin auth
│       ├── components/ (ui charts hero layout)
│       ├── lib/               # api client, auth, sse hook
│       ├── hooks/  styles/tokens.css  types/
│
├── benchmarks/ (data runners reports)
├── infra/ (nginx k8s terraform monitoring sandbox)
├── docs/ (architecture algorithms api security runbooks)
└── scripts/
```

## 8. Benchmarking and Validation
| Stage | Suite | Target |
|-------|-------|--------|
| 1 | Netlib LP (feasible) | 100% correct objective; within 5-10x of HiGHS time initially |
| 2 | Netlib hard (degenerate/ill-conditioned) | Converges, no wrong answer |
| 3 | MIPLIB 2017 easy/benchmark subset | Agreed % solved in time limit |
| 4 | Mittelmann LP/MILP | Honest published comparison |
| 5 | Synthetic Indian-industry models (crude blending, refinery scheduling, unit commitment, transport/supply chain) | Domain test pack |

Compare against HiGHS and, where licensing permits, a commercial solver. Report time, status, objective, gap, nodes via performance profiles and shifted geometric mean. The `verify` module and known optimal objectives gate CI; any mismatch fails the build. A robustness demo logs which safeguard (scaling, perturbation, refactorization) acted on each hard instance.

## 9. DevOps and Deployment
- Environments: dev (Compose), staging, prod (Kubernetes)
- Multi-stage builds, non-root, read-only FS, distroless where possible
- 12-factor config; secrets in Vault / cloud secret manager
- API on HPA; workers scale on queue depth; heavy jobs on dedicated node pool
- NetworkPolicies (workers: no egress), PodSecurity `restricted`, resource limits
- PostgreSQL PITR + daily snapshots; quarterly restore drills
- Metrics: queue depth, solve time, 4xx/5xx, auth failures; alerts for DDoS signatures

## 10. Testing Strategy
| Level | Scope |
|-------|-------|
| Unit | Every solver module, policies, validators |
| Property-based | Random LPs vs verify module; presolve/postsolve round-trip |
| Fuzz | MPS/LP/JSON parsers |
| Integration | API + DB + Redis + worker end to end |
| Security | Matrix in section 6 |
| Performance | Nightly benchmark regression with alert on slowdown |
