from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, books, mood, progress

app = FastAPI(title="betterReading API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
