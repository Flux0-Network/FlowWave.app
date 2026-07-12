import os
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from services.docker_manager import deploy_bot, stop_bot, restart_bot, get_status

router = APIRouter()

_API_SECRET = os.environ.get("HOSTING_API_SECRET", "")


def _auth(x_api_secret: str = Header(...)):
    if not _API_SECRET or x_api_secret != _API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


class DeployRequest(BaseModel):
    bot_id: str
    code: str
    token: str


@router.post("/deploy", dependencies=[Depends(_auth)])
async def deploy(req: DeployRequest):
    try:
        container_id = deploy_bot(req.bot_id, req.code, req.token)
        return {"bot_id": req.bot_id, "container_id": container_id, "status": "running"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{bot_id}", dependencies=[Depends(_auth)])
async def stop(bot_id: str):
    stop_bot(bot_id)
    return {"bot_id": bot_id, "status": "stopped"}


@router.post("/{bot_id}/restart", dependencies=[Depends(_auth)])
async def restart(bot_id: str):
    try:
        restart_bot(bot_id)
        return {"bot_id": bot_id, "status": "running"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{bot_id}/status", dependencies=[Depends(_auth)])
async def status(bot_id: str):
    return {"bot_id": bot_id, "status": get_status(bot_id)}
