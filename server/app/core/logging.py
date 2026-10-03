import json
import logging
import re
from typing import Any, Dict

SENSITIVE_PATTERNS = [
    re.compile(r"password", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"authorization", re.IGNORECASE),
    re.compile(r"api_?key", re.IGNORECASE),
]


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redacts sensitive keys from dictionaries and logs."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(pattern.search(str(k)) for pattern in SENSITIVE_PATTERNS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(redact_sensitive_data(log_obj))


def setup_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredJsonFormatter())
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [handler]
