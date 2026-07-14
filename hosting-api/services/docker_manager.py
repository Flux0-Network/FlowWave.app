import docker
import shutil
import tempfile
from pathlib import Path

_client = docker.from_env()

_TEMPLATE = Path(__file__).parent.parent / "bot_template"

_LIMITS = {
    "mem_limit": "128m",
    "nano_cpus": 500_000_000,
}


def deploy_bot(bot_id: str, code: str, token: str) -> str:
    work_dir = Path(tempfile.mkdtemp(prefix=f"bot_{bot_id}_"))
    try:
        (work_dir / "bot.py").write_text(code, encoding="utf-8")
        shutil.copy(_TEMPLATE / "requirements.txt", work_dir / "requirements.txt")
        shutil.copy(_TEMPLATE / "Dockerfile", work_dir / "Dockerfile")

        _client.images.build(
            path=str(work_dir),
            tag=f"cogsforge-bot:{bot_id}",
            rm=True,
            forcerm=True,
        )

        _remove_container(bot_id)

        container = _client.containers.run(
            f"cogsforge-bot:{bot_id}",
            name=f"bot_{bot_id}",
            environment={"DISCORD_TOKEN": token},
            detach=True,
            restart_policy={"Name": "unless-stopped"},
            network_mode="bridge",
            **_LIMITS,
        )
        return container.id
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def _remove_container(bot_id: str) -> None:
    try:
        c = _client.containers.get(f"bot_{bot_id}")
        c.stop(timeout=5)
        c.remove(force=True)
    except docker.errors.NotFound:
        pass


def stop_bot(bot_id: str) -> None:
    """Stop the container but keep it (and its image) so it can be restarted without re-deploying."""
    try:
        _client.containers.get(f"bot_{bot_id}").stop(timeout=5)
    except docker.errors.NotFound:
        raise ValueError(f"Bot {bot_id} not found")


def start_bot(bot_id: str) -> None:
    """Start a previously stopped container."""
    try:
        _client.containers.get(f"bot_{bot_id}").start()
    except docker.errors.NotFound:
        raise ValueError(f"Bot {bot_id} not found — redeploy required")


def delete_bot(bot_id: str) -> None:
    """Fully remove the container and image."""
    _remove_container(bot_id)
    try:
        _client.images.remove(f"cogsforge-bot:{bot_id}", force=True)
    except docker.errors.ImageNotFound:
        pass


def restart_bot(bot_id: str) -> None:
    try:
        _client.containers.get(f"bot_{bot_id}").restart(timeout=5)
    except docker.errors.NotFound:
        raise ValueError(f"Bot {bot_id} not running")


def get_status(bot_id: str) -> str:
    try:
        return _client.containers.get(f"bot_{bot_id}").status
    except docker.errors.NotFound:
        return "stopped"


def get_logs(bot_id: str, tail: int = 100) -> list[str]:
    try:
        container = _client.containers.get(f"bot_{bot_id}")
        raw = container.logs(stream=False, timestamps=True, tail=tail)
        return raw.decode("utf-8", errors="replace").splitlines()
    except docker.errors.NotFound:
        return []


def stream_logs(bot_id: str, tail: int = 50):
    try:
        container = _client.containers.get(f"bot_{bot_id}")
        for line in container.logs(stream=True, follow=True, timestamps=True, tail=tail):
            yield line.decode("utf-8", errors="replace")
    except docker.errors.NotFound:
        yield "Container not found.\n"
