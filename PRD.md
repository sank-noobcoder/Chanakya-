# Chanakya — Product Requirements Document (PRD)

**Product:** Sovereign Mathematical Optimization Solver (LP / MILP / QP)  
**Version:** 1.0 · **Status:** Active Reference · **Companion doc:** [TRD.md](./TRD.md)  
*(Chanakya is a placeholder name.)*

---

## 1. Problem Statement
India's refining, petrochemical, power, logistics and manufacturing sectors depend on foreign solvers (IBM CPLEX, Gurobi, FICO Xpress) for scheduling, blending, production planning, energy management and AI decision-support. Consequences:

- High recurring license cost and restrictive licensing
- No visibility into or control over solver internals
- Strategic dependency on foreign technology
- Open-source alternatives (CBC, HiGHS, GLPK, SCIP) lag on large MILPs and are not validated for Indian industrial use cases

**The real challenge is not the modeling interface. It is a numerically robust engine that finds high-quality solutions for large, sparse, highly constrained problems in practical time.**

## 2. Vision
A transparent, extensible, sovereign optimization engine, built from mathematical foundations, that becomes the base layer for future Indian optimization software across industrial, scientific and strategic applications.

## 3. Hard Constraint
The solver **must not** be built on any existing open-source or commercial solver library. It is written from scratch. General utility libraries (serialization, threading, logging) are allowed; anything implementing simplex, interior point, branch-and-bound or cut generation is forbidden.

## 4. Goals and Success Metrics
| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Correct LP solver | 100% of the feasible Netlib set solved, objective within 1e-6 relative tolerance |
| G2 | Robust MILP solver | Defined MIPLIB benchmark subset solved; optimality gap reported honestly |
| G3 | QP support | Convex QP solved via interior point, verified against a reference solver |
| G4 | Numerical robustness | Degenerate, ill-conditioned, badly scaled models never crash or silently return wrong answers |
| G5 | Scale | Sparse models from 10^5 up to 10^6 variables/constraints (staged) |
| G6 | Usability | CLI, REST API, Python binding and web console |
| G7 | Transparency | Every algorithmic decision is logged and inspectable |
| G8 | Credibility | Published, reproducible benchmark comparison vs at least one established solver |

## 5. Non-Goals
- Full modeling language or polished desktop GUI
- Wrapping or linking any existing solver
- MIQP, NLP, MINLP in v1 (architecture must allow them later)

## 6. Target Users and Personas
| Persona | Needs |
|---------|-------|
| **Industrial analyst** | Upload a model, pick settings, read results without coding |
| **Optimization engineer** | CLI/API/Python access, parameter tuning, detailed logs |
| **Researcher / contributor** | Clean module interfaces to add algorithms |
| **Administrator** | Manage users, roles, quotas, audit logs |

## 7. Scope: Application Domains
Refinery scheduling, crude blending, process optimization, production planning, logistics and transportation, power system dispatch, supply chain management.

## 8. User Stories
1. As an analyst, I upload an `.mps` / `.lp` file or JSON model and receive a job ID.
2. As an analyst, I watch live progress (iterations, best bound, incumbent, gap).
3. As an engineer, I set time limit, MIP gap, threads, tolerances and seed.
4. As an engineer, I download the solution, solver log and verification report.
5. As an engineer, I compare my run against a reference solver on a benchmark instance.
6. As an engineer, I cancel a running job.
7. As an admin, I see who ran what and can revoke access or set quotas.
8. As a researcher, I add a new branching rule or cut generator through a documented interface.

## 9. Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Support LP, MILP, QP (v1); extensible to MIQP/NLP/MINLP | P0 |
| FR2 | Input formats: MPS (fixed/free), LP, JSON model schema | P0 |
| FR3 | Job lifecycle: queued, presolving, solving, completed, failed, cancelled, timed_out | P0 |
| FR4 | Parameters: time limit, MIP gap, threads, tolerances, algorithm choice, seed | P0 |
| FR5 | Results: status, objective, primal/dual values, basis, gap, node count, logs | P0 |
| FR6 | Cancellation and enforced time limits | P0 |
| FR7 | Independent solution verification before reporting optimal | P0 |
| FR8 | Authentication, role-based access, per-user quotas, audit trail | P0 |
| FR9 | Live progress streaming | P1 |
| FR10 | Benchmark runner and comparison reports | P1 |
| FR11 | Python binding and CLI | P1 |
| FR12 | Admin console | P2 |

## 10. Non-Functional Requirements
| Area | Requirement |
|------|-------------|
| Correctness | Never report "optimal" for an infeasible or unverified solution |
| Determinism | Same seed + thread count gives identical results (deterministic mode) |
| Performance | Competitive with open-source baselines (HiGHS) on benchmark sets; API p95 under 300 ms for non-solve endpoints |
| Scalability | Workers scale horizontally on queue depth |
| Availability | 99.5% API availability target |
| Security | 7-layer model, authentication separate from authorization (see TRD section 6) |
| Observability | Metrics, structured logs, traces, no secrets in logs |
| Accessibility | Web UI meets WCAG AA |

## 11. Security Requirements (Product Level)
- DoS/DDoS prevention at edge and application level
- SQL injection prevention
- Strict validation of every API request and every uploaded model file
- 7-layer protection model
- **Authentication is not authorization:** a valid identity grants nothing by itself; every action and every object access is checked against role and ownership
- Full audit trail of sensitive actions

## 12. Website / UX Requirements
**Feel:** futuristic-scientific, dark-first, calm and premium; a mission-control console for mathematics with an Indian identity accent. People should want to use it on first sight.

### Design Tokens
| Token | Value |
|-------|-------|
| Background | `#07090F` |
| Surface | `#0E1424`, 1px border `rgba(255,255,255,0.06)` |
| Primary accent | Saffron to amber gradient `#FF9933` to `#FFC24D` |
| Secondary accent | Cyan `#22D3EE` for live/data states |
| Success / Warn / Error | `#34D399` / `#FBBF24` / `#F87171` |
| Fonts | Space Grotesk (headings), Inter (body), JetBrains Mono (logs, numbers) |
| Radius | 16px cards, 12px inputs |
| Effects | Glass panels (backdrop blur), soft glow on primary buttons, animated mesh/grid background |

### Pages
1. **Landing:** hero with animated feasible-region polytope and a point moving vertex to vertex (simplex visual). Headline: *"Optimization, built in India. From first principles."* Live benchmark counters, CTAs (Try the Solver, Read the Docs), feature cards, comparison table, footer.
2. **Dashboard:** stat cards (jobs today, success rate, average solve time), recent jobs, quota ring.
3. **New Solve:** drag-and-drop upload, parameter panel, inline validation.
4. **Job Detail:** live convergence chart (bound vs incumbent), counters, streaming mono log, downloads, status timeline.
5. **Benchmarks:** Netlib/MIPLIB tables, performance profile chart, solver comparison toggle.
6. **Algorithms / Docs:** interactive explanations of presolve, simplex, IPM, branch-and-cut (the transparency selling point).
7. **Admin:** users, roles, quotas, audit log.
8. **Auth:** login, register, MFA; minimal split-screen layout.

### UX Rules
- Motion 150 to 250 ms ease-out; respect `prefers-reduced-motion`
- Skeleton loaders, toasts for async events
- Responsive from 360 px, keyboard navigable
- Numbers in monospace with tabular figures
- Lighthouse: Performance 90+, Accessibility 95+
- Dark default, light theme toggle

## 13. Acceptance Criteria (v1)
- [x] Netlib feasible set: all solved correctly
- [x] Degenerate / ill-conditioned demo set converges with documented safeguards
- [x] MIPLIB agreed subset: results published with honest gaps
- [x] Comparison report vs HiGHS (and a commercial solver where license permits)
- [x] CLI and REST API functional; web console covers upload, live progress, results
- [x] Security test matrix (TRD section 6) passes in CI
- [x] No forbidden solver dependency (CI policy check passes)

## 14. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Matching Gurobi/CPLEX is multi-year work | Define v1 success as correct, robust, transparent, competitive with open-source baselines |
| Numerical instability on hard models | Scaling, perturbation, refactorization, verify-before-report |
| Malicious or huge uploaded models | Parser limits, fuzzing, sandboxed workers |
| Scope creep into modeling tools | Non-goal enforced; thin API only |
