import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_gantt_empty_project(client: AsyncClient):
    proj_resp = await client.post("/projects", json={"name": "Empty Gantt", "key": "EMPT"})
    project_id = proj_resp.json()["id"]
    response = await client.get(f"/projects/{project_id}/gantt")
    assert response.status_code == 200
    data = response.json()
    assert data["issues"] == []
    assert data["milestones"] == []
    assert data["dependencies"] == []


@pytest.mark.asyncio
async def test_gantt_with_data(client: AsyncClient):
    proj_resp = await client.post("/projects", json={"name": "Gantt Project", "key": "GANT"})
    project_id = proj_resp.json()["id"]

    issue_resp = await client.post(
        f"/projects/{project_id}/issues",
        json={
            "title": "Gantt Task",
            "issue_type": "task",
            "start_date": "2024-04-01",
            "due_date": "2024-04-15",
        },
    )
    issue_id = issue_resp.json()["id"]

    await client.post(
        f"/projects/{project_id}/milestones",
        json={"name": "Release", "due_date": "2024-04-30"},
    )

    response = await client.get(f"/projects/{project_id}/gantt")
    assert response.status_code == 200
    data = response.json()
    assert len(data["issues"]) == 1
    assert len(data["milestones"]) == 1
    assert data["issues"][0]["id"] == issue_id


@pytest.mark.asyncio
async def test_gantt_includes_dependencies(client: AsyncClient):
    proj_resp = await client.post("/projects", json={"name": "Dep Gantt", "key": "DGNT"})
    project_id = proj_resp.json()["id"]

    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "A", "issue_type": "task"},
    )
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "B", "issue_type": "task"},
    )
    id_a, id_b = a.json()["id"], b.json()["id"]

    await client.post(f"/issues/{id_b}/dependencies", json={"predecessor_id": id_a})

    response = await client.get(f"/projects/{project_id}/gantt")
    data = response.json()
    assert len(data["dependencies"]) == 1
    assert data["dependencies"][0]["predecessor_id"] == id_a
