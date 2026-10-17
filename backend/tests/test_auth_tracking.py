import sys
from pathlib import Path

import jwt
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import (
    TrackEvent,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("SenhaForte#2026")
    assert hashed.startswith("$2b$")
    assert verify_password("SenhaForte#2026", hashed)
    assert not verify_password("senha-errada", hashed)


def test_access_token_roundtrip():
    token = create_access_token("65f000000000000000000001", "admin@example.com")
    payload = decode_token(token, "access")
    assert payload["sub"] == "65f000000000000000000001"
    assert payload["email"] == "admin@example.com"
    assert payload["type"] == "access"


def test_refresh_token_is_not_access_token():
    token = create_refresh_token("65f000000000000000000001")
    with pytest.raises(HTTPException) as exc:
        decode_token(token, "access")
    assert exc.value.status_code == 401


def test_access_token_rejects_invalid_signature():
    token = create_access_token("65f000000000000000000001", "admin@example.com")
    payload = jwt.decode(token, options={"verify_signature": False})
    forged = jwt.encode(payload, "segredo-errado", algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        decode_token(forged, "access")
    assert exc.value.status_code == 401


def test_track_event_requires_grupo_e_item():
    with pytest.raises(ValidationError):
        TrackEvent(grupo="", item="Porta", origem="teste")
    with pytest.raises(ValidationError):
        TrackEvent(grupo="Produtos", item="", origem="teste")
