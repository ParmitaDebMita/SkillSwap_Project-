"""
SkillSwap FastAPI Backend
=========================
Entry point: starts the FastAPI application, registers routers, and
configures CORS for the React + Vite frontend at http://localhost:5173.

Run with:
    uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.chat.router import router as chat_router
from app.config import settings
from app.database import close_connection, create_indexes
from app.exchanges.router import router as exchanges_router
from app.moderation.router import router as moderation_router
from app.notifications.router import router as notifications_router
from app.reviews.router import router as reviews_router
from app.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB indexes. Shutdown: close connection."""
    await create_indexes()
    yield
    await close_connection()


app = FastAPI(
    title="SkillSwap API",
    description=(
        "Backend API for the SkillSwap student skill exchange platform. "
        "Built with FastAPI + MongoDB. Swagger UI available at /docs."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Vite dev server to call the API. Update FRONTEND_ORIGIN in .env
# when deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(exchanges_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(moderation_router, prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "SkillSwap API is running. Visit /docs for Swagger UI."}


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
