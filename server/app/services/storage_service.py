import uuid
from typing import Tuple

# In-memory and S3 compatible storage adapter
# Enforces safe UUID filenames to completely eliminate path traversal vulnerabilities (Layer 4)
_STORAGE_CACHE: dict = {}


class StorageService:
    @staticmethod
    def save_model_file(raw_bytes: bytes, file_extension: str) -> Tuple[str, str]:
        import hashlib
        sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
        # Generate safe server-controlled UUID filename
        file_id = uuid.uuid4()
        clean_ext = file_extension.lstrip(".").lower()
        if clean_ext not in ["mps", "lp", "json"]:
            clean_ext = "mps"

        safe_uri = f"s3://chanakya-models/{file_id}.{clean_ext}"
        _STORAGE_CACHE[safe_uri] = raw_bytes
        return safe_uri, sha256_hash

    @staticmethod
    def get_file(uri: str) -> bytes:
        return _STORAGE_CACHE.get(uri, b"")
