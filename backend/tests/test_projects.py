import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient):
    response = await client.post(
        "/projects",
        json={"name": "Test Project", "key": "TEST", "description": "A test"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["key"] == "TEST"


@pytest.mark.asyncio
async def test_create_project_duplicate_key(client: AsyncClient):
    await client.post("/projects", json={"name": "Project 1", "key": "DUP"})
    response = await client.post("/projects", json={"name": "Project 2", "key": "DUP"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_project_invalid_key(client: AsyncClient):
    response = await client.post("/projects", json={"name": "Bad Key", "key": "bad"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient):
    await client.post("/projects", json={"name": "List Project", "key": "LIST"})
    response = await client.get("/projects")
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_get_project(client: AsyncClient):
    create_resp = await client.post("/projects", json={"name": "Get Project", "key": "GETP"})
    project_id = create_resp.json()["id"]
    response = await client.get(f"/projects/{project_id}")
    assert response.status_code == 200
    assert response.json()["key"] == "GETP"


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient):
    create_resp = await client.post("/projects", json={"name": "Old Project", "key": "OLDP"})
    project_id = create_resp.json()["id"]
    response = await client.patch(f"/projects/{project_id}", json={"name": "Updated Project"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Project"


@pytest.mark.asyncio
async def test_delete_project(client: AsyncClient):
    create_resp = await client.post("/projects", json={"name": "Delete Project", "key": "DELP"})
    project_id = create_resp.json()["id"]
    response = await client.delete(f"/projects/{project_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_add_and_remove_member(client: AsyncClient):
    user_resp = await client.post("/users", json={"name": "Member", "email": "member@example.com"})
    user_id = user_resp.json()["id"]

    proj_resp = await client.post("/projects", json={"name": "Member Project", "key": "MEMB"})
    project_id = proj_resp.json()["id"]

    add_resp = await client.post(
        f"/projects/{project_id}/members",
        json={"user_id": user_id, "role": "admin"},
    )
    assert add_resp.status_code == 201
    assert add_resp.json()["role"] == "admin"

    remove_resp = await client.delete(f"/projects/{project_id}/members/{user_id}")
    assert remove_resp.status_code == 204
