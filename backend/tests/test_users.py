import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/users",
        json={"name": "Test User", "email": "test@example.com"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient):
    await client.post(
        "/users",
        json={"name": "User 1", "email": "dup@example.com"},
    )
    response = await client.post(
        "/users",
        json={"name": "User 2", "email": "dup@example.com"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient):
    await client.post("/users", json={"name": "User A", "email": "a@example.com"})
    response = await client.get("/users")
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient):
    create_resp = await client.post("/users", json={"name": "Get User", "email": "get@example.com"})
    user_id = create_resp.json()["id"]
    response = await client.get(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Get User"


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/users/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient):
    create_resp = await client.post("/users", json={"name": "Old Name", "email": "update@example.com"})
    user_id = create_resp.json()["id"]
    response = await client.patch(f"/users/{user_id}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient):
    create_resp = await client.post("/users", json={"name": "Delete Me", "email": "delete@example.com"})
    user_id = create_resp.json()["id"]
    response = await client.delete(f"/users/{user_id}")
    assert response.status_code == 204

    get_resp = await client.get(f"/users/{user_id}")
    assert get_resp.status_code == 404
