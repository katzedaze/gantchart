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


@pytest.mark.asyncio
async def test_issue_progress_field(client: AsyncClient):
    project_id = await _create_project(client, "PROG")
    create_resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Progress task", "issue_type": "task", "progress": 50},
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["progress"] == 50

    issue_id = create_resp.json()["id"]
    update_resp = await client.patch(f"/issues/{issue_id}", json={"progress": 80})
    assert update_resp.status_code == 200
    assert update_resp.json()["progress"] == 80


@pytest.mark.asyncio
async def test_issue_progress_default_zero(client: AsyncClient):
    project_id = await _create_project(client, "PDEF")
    resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "No progress", "issue_type": "task"},
    )
    assert resp.status_code == 201
    assert resp.json()["progress"] == 0


@pytest.mark.asyncio
async def test_issue_progress_validation(client: AsyncClient):
    project_id = await _create_project(client, "PVAL")
    resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Invalid", "issue_type": "task", "progress": 150},
    )
    assert resp.status_code == 422

    resp2 = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Negative", "issue_type": "task", "progress": -10},
    )
    assert resp2.status_code == 422


@pytest.mark.asyncio
async def test_cannot_set_self_as_parent(client: AsyncClient):
    project_id = await _create_project(client, "SELF")
    resp = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Self ref", "issue_type": "task"},
    )
    issue_id = resp.json()["id"]
    update = await client.patch(f"/issues/{issue_id}", json={"parent_id": issue_id})
    assert update.status_code == 400
    assert "自分自身" in update.json()["detail"]


@pytest.mark.asyncio
async def test_cannot_set_child_as_parent(client: AsyncClient):
    """A -> B (B is child of A). Setting B as parent of A should fail."""
    project_id = await _create_project(client, "CHLD")
    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Parent A", "issue_type": "task"},
    )
    a_id = a.json()["id"]
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Child B", "issue_type": "task", "parent_id": a_id},
    )
    b_id = b.json()["id"]

    # Try to set child B as parent of A -> should fail
    resp = await client.patch(f"/issues/{a_id}", json={"parent_id": b_id})
    assert resp.status_code == 400
    assert "循環参照" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_cannot_set_grandchild_as_parent(client: AsyncClient):
    """A -> B -> C. Setting C as parent of A should fail."""
    project_id = await _create_project(client, "GRCH")
    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "A", "issue_type": "task"},
    )
    a_id = a.json()["id"]
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "B", "issue_type": "task", "parent_id": a_id},
    )
    b_id = b.json()["id"]
    c = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "C", "issue_type": "task", "parent_id": b_id},
    )
    c_id = c.json()["id"]

    # Try to set grandchild C as parent of A
    resp = await client.patch(f"/issues/{a_id}", json={"parent_id": c_id})
    assert resp.status_code == 400
    assert "循環参照" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_valid_parent_assignment(client: AsyncClient):
    """Setting an unrelated issue as parent should succeed."""
    project_id = await _create_project(client, "VPAR")
    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "A", "issue_type": "task"},
    )
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "B", "issue_type": "task"},
    )
    a_id = a.json()["id"]
    b_id = b.json()["id"]

    resp = await client.patch(f"/issues/{b_id}", json={"parent_id": a_id})
    assert resp.status_code == 200
    assert resp.json()["parent_id"] == a_id


@pytest.mark.asyncio
async def test_can_remove_parent(client: AsyncClient):
    """Setting parent_id to null should succeed."""
    project_id = await _create_project(client, "RPAR")
    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Parent", "issue_type": "task"},
    )
    a_id = a.json()["id"]
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Child", "issue_type": "task", "parent_id": a_id},
    )
    b_id = b.json()["id"]

    resp = await client.patch(f"/issues/{b_id}", json={"parent_id": None})
    assert resp.status_code == 200
    assert resp.json()["parent_id"] is None
