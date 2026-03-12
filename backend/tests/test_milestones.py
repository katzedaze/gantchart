import pytest
from httpx import AsyncClient


async def _create_project(client: AsyncClient, key: str = "MILE") -> str:
    resp = await client.post("/projects", json={"name": "Milestone Project", "key": key})
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_milestone(client: AsyncClient):
    project_id = await _create_project(client, "CMLM")
    response = await client.post(
        f"/projects/{project_id}/milestones",
        json={"name": "v1.0", "due_date": "2024-06-01"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "v1.0"
    assert response.json()["status"] == "open"


@pytest.mark.asyncio
async def test_list_milestones(client: AsyncClient):
    project_id = await _create_project(client, "LMLM")
    await client.post(
        f"/projects/{project_id}/milestones",
        json={"name": "v1.0", "due_date": "2024-06-01"},
    )
    response = await client.get(f"/projects/{project_id}/milestones")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_update_milestone(client: AsyncClient):
    project_id = await _create_project(client, "UMLM")
    create_resp = await client.post(
        f"/projects/{project_id}/milestones",
        json={"name": "v1.0", "due_date": "2024-06-01"},
    )
    milestone_id = create_resp.json()["id"]
    response = await client.patch(
        f"/milestones/{milestone_id}",
        json={"name": "v1.1", "status": "closed"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "v1.1"
    assert response.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_delete_milestone(client: AsyncClient):
    project_id = await _create_project(client, "DMLM")
    create_resp = await client.post(
        f"/projects/{project_id}/milestones",
        json={"name": "v1.0", "due_date": "2024-06-01"},
    )
    milestone_id = create_resp.json()["id"]
    response = await client.delete(f"/milestones/{milestone_id}")
    assert response.status_code == 204
