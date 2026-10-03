# Chanakya 7-Layer OSI Defense-in-Depth Security Whitepaper

## Executive Summary
Chanakya is an indigenously engineered mathematical solver stack for critical national infrastructure. To eliminate risks of remote tampering, espionage, denial of service, and computational exploitation, Chanakya enforces an in-depth **7-Layer OSI Security Architecture**.

---

## The 7-Layer Defense Matrix

```
+------------------------------------------------------------------------------------+
| Layer 1: Edge & Network Isolation     (WAF, DDoS Scrubbing, VPC Segmentation)      |
+------------------------------------------------------------------------------------+
| Layer 2: Transport Security           (TLS 1.3 Exclusively, HSTS, Secure Cookies) |
+------------------------------------------------------------------------------------+
| Layer 3: Traffic Control & Anti-DoS   (Redis Sliding-Window Limits, Body Caps)     |
+------------------------------------------------------------------------------------+
| Layer 4: Request Validation           (Pydantic Strict Schemas, Magic Byte Sniff)  |
+------------------------------------------------------------------------------------+
| Layer 5: Authentication               (Argon2id, Rotating Refresh Tokens, MFA)     |
+------------------------------------------------------------------------------------+
| Layer 6: Authorization & RBAC         (Object Ownership, BOLA/IDOR Prevention)     |
+------------------------------------------------------------------------------------+
| Layer 7: Execution & Data Integrity   (100% Parameterized SQL, Sandboxed Workers)  |
+------------------------------------------------------------------------------------+
```

### Layer 1: Edge & Network Isolation
- **DDoS Mitigation & Edge Scrubbing:** Cloudflare WAF / AWS Shield edge shields intercept volume-based syn-flood, UDP reflection, and ICMP attacks before hitting origin servers.
- **Network Segmentation & VPC:**
  - Public facing: Reverse Proxy (Nginx) terminating TLS.
  - Internal DMZ: FastAPI backend service.
  - Isolated Private Subnet: PostgreSQL 16 database, Redis cluster, and MinIO storage. No public IP addresses assigned.
  - Worker Isolation Subnet: Worker nodes have zero egress network access.

### Layer 2: Transport Security
- **Strict TLS 1.3:** Enforced via modern cipher suites (`TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`). TLS 1.0, 1.1, and 1.2 are rejected.
- **HSTS Preload:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header attached to all responses.
- **Cookie Security:** Cookies set with `Secure; HttpOnly; SameSite=Strict`.

### Layer 3: Traffic Control & Anti-DoS
- **Sliding-Window Rate Limiting (Redis-backed):**
  - Public endpoints: 60 requests/minute per IP.
  - Sensitive `/auth/*` endpoints: 5 failed attempts per 15 minutes with exponential backoff.
  - Job submission endpoints: 10 submits/minute per user account.
- **Anti-Slowloris Timeouts:** Nginx client header/body timeouts strictly set to 10s to drop idle connections holding sockets.
- **Max Payload Size Limiting:** Streaming body size limiter abruptly drops requests exceeding 50 MB before buffering into RAM.
- **Concurrency & Quotas:** Per-user maximum active job limits (e.g., 5 concurrent solves) prevent queue starvation.

### Layer 4: Request Validation & Sanitization
- **Strict Pydantic Schemas:** All incoming JSON payloads parsed with `extra="forbid"`. Undefined or rogue fields immediately trigger 422 Unprocessable Entity.
- **File Magic Byte Sniffing:** Uploaded `.mps`, `.lp`, and `.json` model files inspected for valid headers/magic bytes before dispatch.
- **Path Traversal Shield:** Server-generated UUIDv4 keys used for all storage paths (`/models/{uuid}.mps`). User-provided filenames are completely discarded in filesystem operations.
- **Parser Hard Limits:** Solver input parser enforces strict ceilings:
  - Max variables: 2,000,000
  - Max constraints: 2,000,000
  - Max non-zeroes: 50,000,000
  - Line length limit: 16,384 bytes
  - Recursion depth: 0 (strictly iterative parsing)

### Layer 5: Authentication
- **Password Hashing:** State-of-the-art **Argon2id** (`m=65536, t=3, p=4`) with cryptographically secure per-user salt.
- **Stateless Short-Lived Access Tokens:** EdDSA or RS256 signed JWTs with 15-minute expiration.
- **Rotating Refresh Tokens with Token Family Reuse Detection:**
  - Each refresh yields a new refresh token and invalidates the previous.
  - If an old refresh token is reused (indicating theft), the entire token family is immediately revoked, forcing re-authentication.
- **Constant-Time Verification:** Secrets and hashes compared via timing-safe byte equality checks to prevent timing side-channel attacks.
- **User Enumeration Prevention:** Identical generic messages returned for failed login, register collision, and password reset requests.

### Layer 6: Authorization & Access Control
- **Core Principle: "Authentication is not Authorization."**
  A valid identity token grants zero automatic access to resources.
- **Role-Based Access Control (RBAC):**
  - `user`: Submit jobs, view owned jobs, download own results, read public benchmarks.
  - `engineer`: Parameter override, run benchmarks, execute verification suites.
  - `admin`: User quota adjustment, role management, read audit logs, revoke keys.
- **Object-Level Access Control (IDOR / BOLA Prevention):**
  Every job query includes `WHERE id = :job_id AND owner_id = :user_id` unless actor has verified `admin` role.

### Layer 7: Execution Sandboxing & Data Integrity
- **SQL Injection Prevention:**
  - 100% Parameterized queries executed through SQLAlchemy Core / asyncpg.
  - Absolute prohibition of dynamic string interpolation or f-strings in SQL statements.
  - Least-privilege PostgreSQL user roles (`chanakya_app` cannot drop tables or alter schemas).
- **Solver Worker Sandboxing:**
  - Worker runs inside gVisor / Docker container with seccomp profile.
  - Linux `cgroups` enforce strict CPU (e.g. 4 cores) and Memory (e.g. 8 GB) limits.
  - Read-only root filesystem with isolated temporary RAM disk (`/tmp` tmpfs).
  - Worker process drops privileges to non-root UID 10001.
  - Zero network egress capability configured via Kubernetes NetworkPolicy.
- **Verify-Before-Report Guarantee:**
  - Every solution is subjected to an independent linear algebra verification engine (`verify/`) checking primal feasibility, variable bounds, and integrality.
  - If verification fails, status is stamped `NUMERICAL_TROUBLE` — never `OPTIMAL`.
- **Immutable Audit Trail:** Sensitive actions written to append-only `audit_log`.
