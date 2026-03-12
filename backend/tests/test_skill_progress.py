import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_skill_progress_empty(client: AsyncClient):
    """全進捗データが空の場合、空リストを返す"""
    response = await client.get("/skill-progress/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_upsert_skill_progress(client: AsyncClient):
    """スキル進捗をバルクで登録できる"""
    response = await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [
                {"node_id": "node-1", "level": "done"},
                {"node_id": "node-2", "level": "learning"},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    levels = {item["node_id"]: item["level"] for item in data}
    assert levels["node-1"] == "done"
    assert levels["node-2"] == "learning"


@pytest.mark.asyncio
async def test_upsert_skill_progress_update_existing(client: AsyncClient):
    """既存の進捗データを更新できる"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "node-1", "level": "learning"}],
        },
    )
    response = await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "node-1", "level": "done"}],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["level"] == "done"


@pytest.mark.asyncio
async def test_upsert_removes_none_level(client: AsyncClient):
    """level=noneを送信すると該当レコードが削除される"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [
                {"node_id": "node-1", "level": "done"},
                {"node_id": "node-2", "level": "learning"},
            ],
        },
    )
    response = await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "node-1", "level": "none"}],
        },
    )
    assert response.status_code == 200
    node_ids = [item["node_id"] for item in response.json()]
    assert "node-1" not in node_ids
    assert "node-2" in node_ids


@pytest.mark.asyncio
async def test_upsert_empty_items(client: AsyncClient):
    """空のitemsリストでは何も変更されない"""
    response = await client.put(
        "/skill-progress/",
        json={"roadmap_slug": "frontend", "items": []},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_skill_progress_filter_by_roadmap(client: AsyncClient):
    """roadmap_slugでフィルタリングできる"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "fe-1", "level": "done"}],
        },
    )
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "backend",
            "items": [{"node_id": "be-1", "level": "learning"}],
        },
    )

    # Filter by frontend
    response = await client.get("/skill-progress/?roadmap_slug=frontend")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["roadmap_slug"] == "frontend"

    # Filter by backend
    response = await client.get("/skill-progress/?roadmap_slug=backend")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["roadmap_slug"] == "backend"


@pytest.mark.asyncio
async def test_get_skill_progress_all(client: AsyncClient):
    """フィルタなしで全ロードマップの進捗を取得できる"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "fe-1", "level": "done"}],
        },
    )
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "backend",
            "items": [{"node_id": "be-1", "level": "learning"}],
        },
    )

    response = await client.get("/skill-progress/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    slugs = {item["roadmap_slug"] for item in data}
    assert slugs == {"frontend", "backend"}


@pytest.mark.asyncio
async def test_delete_skill_progress_by_roadmap(client: AsyncClient):
    """ロードマップ単位で進捗を削除できる"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "fe-1", "level": "done"}],
        },
    )
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "backend",
            "items": [{"node_id": "be-1", "level": "learning"}],
        },
    )

    response = await client.delete("/skill-progress/?roadmap_slug=frontend")
    assert response.status_code == 204

    # frontend deleted, backend remains
    get_resp = await client.get("/skill-progress/")
    data = get_resp.json()
    assert len(data) == 1
    assert data[0]["roadmap_slug"] == "backend"


@pytest.mark.asyncio
async def test_delete_all_skill_progress(client: AsyncClient):
    """全進捗データを一括削除できる"""
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "fe-1", "level": "done"}],
        },
    )
    await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "backend",
            "items": [{"node_id": "be-1", "level": "learning"}],
        },
    )

    response = await client.delete("/skill-progress/")
    assert response.status_code == 204

    get_resp = await client.get("/skill-progress/")
    assert get_resp.json() == []


@pytest.mark.asyncio
async def test_upsert_invalid_level(client: AsyncClient):
    """無効なlevelで422バリデーションエラーを返す"""
    response = await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "node-1", "level": "invalid"}],
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upsert_missing_roadmap_slug(client: AsyncClient):
    """roadmap_slugがない場合422バリデーションエラーを返す"""
    response = await client.put(
        "/skill-progress/",
        json={"items": [{"node_id": "node-1", "level": "done"}]},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_response_contains_expected_fields(client: AsyncClient):
    """レスポンスに必要なフィールドが含まれている"""
    response = await client.put(
        "/skill-progress/",
        json={
            "roadmap_slug": "frontend",
            "items": [{"node_id": "node-1", "level": "done"}],
        },
    )
    data = response.json()[0]
    assert "id" in data
    assert "roadmap_slug" in data
    assert "node_id" in data
    assert "level" in data
    assert "updated_at" in data
    # user_id should NOT be present
    assert "user_id" not in data


@pytest.mark.asyncio
async def test_unique_constraint_per_roadmap_node(client: AsyncClient):
    """同じroadmap_slug+node_idの組み合わせは1件のみ存在する"""
    for _ in range(3):
        await client.put(
            "/skill-progress/",
            json={
                "roadmap_slug": "frontend",
                "items": [{"node_id": "node-1", "level": "done"}],
            },
        )

    response = await client.get("/skill-progress/?roadmap_slug=frontend")
    data = response.json()
    node_ids = [item["node_id"] for item in data]
    assert node_ids.count("node-1") == 1


@pytest.mark.asyncio
async def test_bulk_upsert_many_items(client: AsyncClient):
    """大量のアイテムを一度にバルク登録できる"""
    items = [{"node_id": f"node-{i}", "level": "done"} for i in range(50)]
    response = await client.put(
        "/skill-progress/",
        json={"roadmap_slug": "frontend", "items": items},
    )
    assert response.status_code == 200
    assert len(response.json()) == 50
