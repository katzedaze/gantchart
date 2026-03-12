import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.auth import verify_api_key
from app.config import settings
from app.routers import comments, dependencies, gantt, issues, milestones, projects, users

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])

app = FastAPI(
    title="GantChart API",
    description="Backlog-like project management system with Gantt Chart",
    version="0.1.0",
    dependencies=[Depends(verify_api_key)],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(issues.router, tags=["issues"])
app.include_router(milestones.router, tags=["milestones"])
app.include_router(dependencies.router, tags=["dependencies"])
app.include_router(gantt.router, tags=["gantt"])
app.include_router(comments.router, tags=["comments"])

# Serve uploaded files
upload_dir = os.environ.get("UPLOAD_DIR", "/app/uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
