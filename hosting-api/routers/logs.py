import asyncio
import threading
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import docker

router = APIRouter()


@router.websocket("/{bot_id}")
async def ws_logs(websocket: WebSocket, bot_id: str):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    client = docker.from_env()

    try:
        container = client.containers.get(f"bot_{bot_id}")
    except docker.errors.NotFound:
        await websocket.send_text("Bot not found or not running.\n")
        await websocket.close()
        return

    q: asyncio.Queue[str | None] = asyncio.Queue()

    def _reader():
        try:
            for chunk in container.logs(stream=True, follow=True, timestamps=True, tail=50):
                loop.call_soon_threadsafe(q.put_nowait, chunk.decode("utf-8", errors="replace"))
        finally:
            loop.call_soon_threadsafe(q.put_nowait, None)

    threading.Thread(target=_reader, daemon=True).start()

    try:
        while True:
            item = await q.get()
            if item is None:
                break
            await websocket.send_text(item)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(f"[error] {e}\n")
        except Exception:
            pass
