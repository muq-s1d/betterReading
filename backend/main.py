import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, books, mood, progress
from backend.services.nlp import get_classifier


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_classifier)
    yield


app = FastAPI(title="betterReading API", version="0.1.0", lifespan=lifespan)

ALLOWED_ORIGINS = ["http://localhost:3000"]
extra_origins = os.environ.get("CORS_EXTRA_ORIGINS", "")
if extra_origins:
    ALLOWED_ORIGINS.extend(origin.strip() for origin in extra_origins.split(",") if origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(mood.router)
app.include_router(progress.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
