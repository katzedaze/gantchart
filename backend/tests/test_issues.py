import pytest
from httpx import AsyncClient


async def _create_project(client: AsyncClient, key: str = "ISS") -> str:
    resp = await client.post("/projects", json={"name": "Issue Project", "key": key})
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_issue(client: AsyncClient):
    project_id = await _create_project(client, "CISS")
    response = await client.post(
        f"/projects/{project_id}/issues",
        json={
            "title": "Fix bug",
            "issue_type": "bug",
            "priority": "high",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Fix bug"
    assert data["issue_key"] == "CISS-1"
    assert data["status"] == "open"


@pytest.mark.asyncio
async def test_issue_key_auto_increment(client: AsyncClient):
    project_id = await _create_project(client, "AINC")
    await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "First", "issue_type": "task"},
    )
    resp2 = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Second", "issue_type": "task"},
    )
    assert resp2.json()["issue_key"] == "AINC-2"


@pytest.mark.asyncio
async def test_list_issues_with_filter(client: AsyncClient):
    project_id = await _create_project(client, "FILT")
    await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Open task", "issue_type": "task", "status": "open"},
    )
    await client.post(
        f"/projects/{project_id}/issues",
        json={
            "title": "Closed bug",
            "issue_type": "bug",
            "status": "closed",
        },
    )

    resp = await client.get(f"/projects/{project_id}/issues", params={"status": "open"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["title"] == "Open task"


@pytest.mark.asyncio
async def test_update_issue(client: AsyncClient):
    project_id = await _create_project(client, "UPDI")
    create_resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Original", "issue_type": "task"},
    )
    issue_id = create_resp.json()["id"]
    response = await client.patch(f"/issues/{issue_id}", json={"title": "Updated", "status": "in_progress"})
    assert response.status_code == 200
    assert response.json()["title"] == "Updated"
    assert response.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_issue(client: AsyncClient):
    project_id = await _create_project(client, "DELI")
    create_resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Delete me", "issue_type": "task"},
    )
    issue_id = create_resp.json()["id"]
    response = await client.delete(f"/issues/{issue_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_issue_date_validation(client: AsyncClient):
    project_id = await _create_project(client, "DATV")
    response = await client.post(
        f"/projects/{project_id}/issues",
        json={
            "title": "Bad dates",
            "issue_type": "task",
            "start_date": "2024-03-15",
            "due_date": "2024-03-10",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bulk_update_issues(client: AsyncClient):
    project_id = await _create_project(client, "BULK")
    resp1 = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Task 1", "issue_type": "task"},
    )
    resp2 = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Task 2", "issue_type": "task"},
    )
    id1 = resp1.json()["id"]
    id2 = resp2.json()["id"]

    response = await client.patch(
        f"/projects/{project_id}/issues/bulk",
        json=[
            {"id": id1, "start_date": "2024-04-01", "due_date": "2024-04-10"},
            {"id": id2, "sort_order": 5},
        ],
    )
    assert response.status_code == 200
    assert len(response.json()) == 2
