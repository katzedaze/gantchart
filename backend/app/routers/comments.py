import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.comment import Attachment, Comment
from app.schemas.comment import (
    AttachmentResponse,
    CommentCreate,
    CommentResponse,
    CommentUpdate,
)

router = APIRouter()

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")


@router.get("/issues/{issue_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    issue_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
    )
    return list(result.all())


@router.post(
    "/issues/{issue_id}/comments",
    response_model=CommentResponse,
    status_code=201,
)
async def create_comment(
    issue_id: uuid.UUID,
    data: CommentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    comment = Comment(
        issue_id=issue_id,
        author_id=data.author_id,
        body=data.body,
    )
    db.add(comment)
    await db.flush()
    # reload with author
    result = await db.scalars(select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id))
    return result.first()


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: uuid.UUID,
    data: CommentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment_id))
    comment = result.first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.body = data.body
    await db.flush()
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.delete(comment)
    await db.flush()


@router.post(
    "/issues/{issue_id}/attachments",
    response_model=AttachmentResponse,
    status_code=201,
)
async def upload_attachment(
    issue_id: uuid.UUID,
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
    comment_id: uuid.UUID | None = None,
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "file")[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, stored_name)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    attachment = Attachment(
        issue_id=issue_id,
        comment_id=comment_id,
        filename=file.filename or "file",
        filepath=f"/uploads/{stored_name}",
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
    )
    db.add(attachment)
    await db.flush()
    return attachment


@router.get(
    "/issues/{issue_id}/attachments",
    response_model=list[AttachmentResponse],
)
async def list_attachments(
    issue_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.scalars(
        select(Attachment).where(Attachment.issue_id == issue_id).order_by(Attachment.created_at.asc())
    )
    return list(result.all())
