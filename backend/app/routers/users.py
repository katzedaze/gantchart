import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.user import UserRepository
from app.schemas.bulk import BulkIds
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    include_archived: bool = Query(False),
):
    repo = UserRepository(db)
    return await repo.get_all(include_archived=include_archived)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = UserRepository(db)
    existing = await repo.get_by_email(data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    return await repo.create(**data.model_dump())


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.email:
        existing = await repo.get_by_email(data.email)
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="Email already exists")
    return await repo.update(user, **data.model_dump(exclude_unset=True))


@router.post("/bulk-delete", status_code=204)
async def bulk_delete_users(
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    await repo.bulk_delete(data.ids)


@router.post("/bulk-archive", status_code=200)
async def bulk_archive_users(
    data: BulkIds,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = UserRepository(db)
    await repo.bulk_archive(data.ids)
    return {"ok": True}


@router.post("/{user_id}/archive", response_model=UserResponse)
async def archive_user(user_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = UserRepository(db)
    user = await repo.archive_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{user_id}/unarchive", response_model=UserResponse)
async def unarchive_user(user_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = UserRepository(db)
    user = await repo.unarchive_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.delete(user)
