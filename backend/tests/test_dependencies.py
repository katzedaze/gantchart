import pytest
from httpx import AsyncClient


async def _setup(client: AsyncClient, key: str):
    proj_resp = await client.post("/projects", json={"name": "Dep Project", "key": key})
    project_id = proj_resp.json()["id"]

    issue_a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Task A", "issue_type": "task"},
    )
    issue_b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "Task B", "issue_type": "task"},
    )
    return project_id, issue_a.json()["id"], issue_b.json()["id"]


@pytest.mark.asyncio
async def test_create_dependency(client: AsyncClient):
    _, id_a, id_b = await _setup(client, "CDEP")
    response = await client.post(
        f"/issues/{id_b}/dependencies",
        json={"predecessor_id": id_a},
    )
    assert response.status_code == 201
    assert response.json()["predecessor_id"] == id_a
    assert response.json()["successor_id"] == id_b


@pytest.mark.asyncio
async def test_self_dependency_rejected(client: AsyncClient):
    _, id_a, _ = await _setup(client, "SDEP")
    response = await client.post(
        f"/issues/{id_a}/dependencies",
        json={"predecessor_id": id_a},
    )
    assert response.status_code == 400
    assert "self-dependency" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_circular_dependency_detected(client: AsyncClient):
    proj_resp = await client.post("/projects", json={"name": "Circular", "key": "CIRC"})
    project_id = proj_resp.json()["id"]

    a = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "A", "issue_type": "task"},
    )
    b = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "B", "issue_type": "task"},
    )
    c = await client.post(
        f"/projects/{project_id}/issues",
        json={"title": "C", "issue_type": "task"},
    )
    id_a, id_b, id_c = a.json()["id"], b.json()["id"], c.json()["id"]

    # A -> B -> C
    await client.post(f"/issues/{id_b}/dependencies", json={"predecessor_id": id_a})
    await client.post(f"/issues/{id_c}/dependencies", json={"predecessor_id": id_b})

    # C -> A would create a cycle
    response = await client.post(f"/issues/{id_a}/dependencies", json={"predecessor_id": id_c})
    assert response.status_code == 400
    assert "circular" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_dependencies(client: AsyncClient):
    _, id_a, id_b = await _setup(client, "GDEP")
    await client.post(f"/issues/{id_b}/dependencies", json={"predecessor_id": id_a})
    response = await client.get(f"/issues/{id_b}/dependencies")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_delete_dependency(client: AsyncClient):
    _, id_a, id_b = await _setup(client, "DDEP")
    create_resp = await client.post(f"/issues/{id_b}/dependencies", json={"predecessor_id": id_a})
    dep_id = create_resp.json()["id"]
    response = await client.delete(f"/dependencies/{dep_id}")
    assert response.status_code == 204
