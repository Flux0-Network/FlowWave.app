import os
from cryptography.fernet import Fernet

_key = os.environ.get("HOSTING_ENCRYPTION_KEY", "")
if not _key:
    raise RuntimeError("HOSTING_ENCRYPTION_KEY is not set")

_fernet = Fernet(_key.encode())


def encrypt_token(token: str) -> str:
    return _fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()
