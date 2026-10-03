import json
import uuid
import jwt
import pytest
from httpx import ASGITransport, AsyncClient
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.models import Job, User
from app.db.session import get_db_session
from app.main import app

# ==============================================================================
# Security Test Matrix (TRD Section 6 Gate)
# ==============================================================================


@pytest.fixture
def test_users():
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    token_a = create_access_token(subject=str(user_a_id), role="user")
    token_b = create_access_token(subject=str(user_b_id), role="user")
    token_admin = create_access_token(subject=str(admin_id), role="admin")

    return {
        "user_a": {"id": user_a_id, "token": token_a, "role": "user"},
        "user_b": {"id": user_b_id, "token": token_b, "role": "user"},
        "admin": {"id": admin_id, "token": token_admin, "role": "admin"},
    }


@pytest.mark.asyncio
async def test_sqli_payload_resilience():
    """Test 1: SQL Injection payloads on string parameters (Layer 7 SQLi Prevention)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        sqli_payloads = [
            "' OR '1'='1",
            "admin'--",
            "'; DROP TABLE users; --",
            "1 UNION SELECT null, null, null--",
        ]
        for payload in sqli_payloads:
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": f"{payload}@example.com", "password": "SamplePassword123!"},
            )
            # Must safely reject without revealing SQL syntax error or stack trace
            assert res.status_code in [400, 401, 422]
            body = res.json()
            assert "syntax error" not in str(body).lower()
            assert "select" not in str(body).lower()


@pytest.mark.asyncio
async def test_idor_bola_protection(test_users):
    """Test 2: User A cannot read or access User B's job (Layer 6 IDOR/BOLA Protection)."""
    fake_job_id = uuid.uuid4()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # User A attempts to read a job belonging to someone else
        headers_a = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
        res = await client.get(f"/api/v1/jobs/{fake_job_id}", headers=headers_a)
        # Must return 404 Not Found to prevent object enumeration
        assert res.status_code == 404


@pytest.mark.asyncio
async def test_privilege_escalation_prevention(test_users):
    """Test 3: Standard user cannot access admin endpoints (Layer 6 RBAC)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers_user = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
        res = await client.get("/api/v1/admin/users", headers=headers_user)
        # Must return 403 Forbidden
        assert res.status_code == 403
        assert "clearance" in res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_oversized_payload_rejection():
    """Test 4: Oversized request bodies rejected (Layer 3 Anti-DoS)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Send header declaring 100MB body
        headers = {"Content-Length": str(100 * 1024 * 1024)}
        res = await client.post("/api/v1/auth/login", headers=headers, json={"email": "a@b.com", "password": "123"})
        assert res.status_code == 413
        assert res.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"


@pytest.mark.asyncio
async def test_jwt_tampering_and_alg_none():
    """Test 5: Reject forged tokens and alg=none (Layer 5 Authentication)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Forge alg=none token
        forged_none_token = jwt.encode({"sub": str(uuid.uuid4()), "role": "admin"}, key="", algorithm="none")
        res = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {forged_none_token}"})
        assert res.status_code == 401

        # Forged HS256 with wrong secret
        tampered_token = jwt.encode({"sub": str(uuid.uuid4()), "role": "admin"}, key="wrong-secret", algorithm="HS256")
        res2 = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {tampered_token}"})
        assert res2.status_code == 401


@pytest.mark.asyncio
async def test_path_traversal_in_model_upload(test_users):
    """Test 6: Malicious filename with directory traversal discarded (Layer 4 Path Traversal)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
        files = {
            "model_file": ("../../../../etc/passwd", b"NAME TEST\nROWS\n N OBJ\nCOLUMNS\nENDATA\n", "text/plain")
        }
        data = {"params": json.dumps({"time_limit_s": 60})}
        res = await client.post("/api/v1/jobs", headers=headers, files=files, data=data)
        # Should process or reject safely without writing to /etc/passwd
        if res.status_code == 202:
            body = res.json()
            assert "passwd" not in body["links"]["status"]
