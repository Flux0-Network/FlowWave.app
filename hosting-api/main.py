from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import bots, logs
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CogsForge Hosting API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://flowwave.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bots.router, prefix="/bots", tags=["bots"])
app.include_router(logs.router, prefix="/logs", tags=["logs"])


@app.get("/health")
async def health():
    return {"status": "ok"}
