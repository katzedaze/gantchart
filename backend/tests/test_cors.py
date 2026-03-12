import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_preflight_allowed_origin(client: AsyncClient):
    """OPTIONS preflight from allowed origin should return CORS headers."""
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_cors_preflight_with_api_key_header(client: AsyncClient):
    """OPTIONS preflight requesting X-API-Key header should be allowed."""
    response = await client.options(
        "/users",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, X-API-Key",
        },
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_cors_disallowed_origin_no_header(client: AsyncClient):
    """Request from disallowed origin should not include allow-origin header."""
    response = await client.get(
        "/health",
        headers={"Origin": "http://evil.example.com"},
    )
    assert response.headers.get("access-control-allow-origin") != "http://evil.example.com"


@pytest.mark.asyncio
async def test_cors_allowed_origin_echoed(client: AsyncClient):
    """Normal request from allowed origin should echo back the origin."""
    response = await client.get(
        "/health",
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
