import logging

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

if not settings.api_key:
    logger.warning(
        "API_KEY is not set — authentication is disabled. Set API_KEY environment variable for production use."
    )


async def verify_api_key(
    api_key: str | None = Security(api_key_header),
) -> str | None:
    if not settings.api_key:
        return None
    if not api_key or api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key
