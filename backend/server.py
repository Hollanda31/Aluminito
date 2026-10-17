import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Literal

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import base64
import re

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from pymongo import ReturnDocument
from starlette.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Conexão com o MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Aplicação principal
app = FastAPI()

# Rotas com prefixo /api
api_router = APIRouter(prefix="/api")


# Modelos
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class StatusCheckCreate(BaseModel):
    client_name: str


class ReviewCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    role: str = Field(default="", max_length=80)
    place: str = Field(default="", max_length=80)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=10, max_length=1000)


class Review(ReviewCreate):
    id: str
    timestamp: str
    status: Literal["visible", "hidden"] = "visible"
    featured: bool = False
    featured_at: str | None = None


class ReviewStatusUpdate(BaseModel):
    status: Literal["visible", "hidden"]


class ReviewFeaturedUpdate(BaseModel):
    featured: bool


# Rotas básicas
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    # Salva o timestamp como texto no MongoDB
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()

    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Não retorna o campo interno _id do MongoDB
    status_checks = await db.status_checks.find(
        {},
        {"_id": 0},
    ).to_list(1000)

    # Converte os timestamps de volta para datetime
    for check in status_checks:
        if isinstance(check["timestamp"], str):
            check["timestamp"] = datetime.fromisoformat(
                check["timestamp"]
            )

    return status_checks


# Rotas de avaliações
@api_router.post(
    "/reviews",
    response_model=Review,
    status_code=201,
)
async def create_review(input: ReviewCreate):
    review = {
        "id": str(uuid.uuid4()),
        **input.model_dump(),
        "status": "visible",
        "featured": False,
        "featured_at": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await db.reviews.insert_one(review)
    return review


@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = (
        await db.reviews.find(
            {"status": {"$ne": "hidden"}},
            {"_id": 0},
        )
        .sort([
            ("featured", -1),
            ("featured_at", -1),
            ("timestamp", -1),
        ])
        .to_list(100)
    )
    return reviews


@api_router.get("/admin/reviews", response_model=List[Review])
async def admin_list_reviews(request: Request):
    await get_current_user(request)
    reviews = (
        await db.reviews.find({}, {"_id": 0})
        .sort([
            ("featured", -1),
            ("featured_at", -1),
            ("timestamp", -1),
        ])
        .to_list(500)
    )
    return reviews


@api_router.patch(
    "/admin/reviews/{review_id}/status",
    response_model=Review,
)
async def admin_update_review_status(
    review_id: str,
    input: ReviewStatusUpdate,
    request: Request,
):
    await get_current_user(request)
    result = await db.reviews.find_one_and_update(
        {"id": review_id},
        {"$set": {"status": input.status}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Avaliacao nao encontrada",
        )
    return result


@api_router.patch(
    "/admin/reviews/{review_id}/featured",
    response_model=Review,
)
async def admin_update_review_featured(
    review_id: str,
    input: ReviewFeaturedUpdate,
    request: Request,
):
    await get_current_user(request)
    result = await db.reviews.find_one_and_update(
        {"id": review_id},
        {
            "$set": {
                "featured": input.featured,
                "featured_at": (
                    datetime.now(timezone.utc).isoformat()
                    if input.featured
                    else None
                ),
            }
        },
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Avaliacao nao encontrada",
        )
    return result



@api_router.delete("/admin/reviews/{review_id}", status_code=204)
async def admin_delete_review(review_id: str, request: Request):
    await get_current_user(request)
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Avaliacao nao encontrada",
        )
    return None


# Simulador de cores com IA
from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    ImageContent,
)


SIM_TIPOS = {
    "porta": {
        "base": "/app/frontend/public/projects/Porta-de-aluminio-digital-1.jpg",
        "desc": "aluminum entrance door with a large glass panel",
    },
    "janela": {
        "base": "/app/frontend/public/projects/Janela-de-correr-1.jpg",
        "desc": "aluminum sliding window",
    },
    "outros": {
        "base": "/app/frontend/public/projects/Varanda-1.jpg",
        "desc": "aluminum sliding door (porta de correr) with large glass panels and a slatted aluminum panel",
    },
    "persiana": {
        "base": "/app/backend/base_persiana.jpg",
        "desc": "aluminum venetian blind (persiana) covering a window in a modern interior",
    },
}
SIM_CORES_DIR = "/app/frontend/public/cores"
SIM_CACHE_DIR = Path("/app/backend/simulacao_cache")
SIM_CACHE_DIR.mkdir(exist_ok=True)


class SimulacaoRequest(BaseModel):
    tipo: str
    cor_arq: str
    cor_nome: str
    acabamento: str = "pintura"


def _img_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _new_chat():
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=f"sim-{uuid.uuid4()}",
        system_message=(
            "You are a photorealistic image editor for an aluminum "
            "frames manufacturer."
        ),
    )
    chat.with_model(
        "gemini",
        "gemini-3.1-flash-image-preview",
    ).with_params(modalities=["image", "text"])
    return chat


@api_router.post("/simular")
async def simular_cor(req: SimulacaoRequest):
    if req.tipo not in SIM_TIPOS:
        raise HTTPException(
            status_code=400,
            detail="Tipo de projeto invalido",
        )

    cor_arq = os.path.basename(req.cor_arq)

    if not re.fullmatch(r"[\w.\-]+", cor_arq):
        raise HTTPException(
            status_code=400,
            detail="Arquivo de cor invalido",
        )

    cor_path = os.path.join(SIM_CORES_DIR, cor_arq)

    if not os.path.isfile(cor_path):
        raise HTTPException(
            status_code=404,
            detail="Cor nao encontrada",
        )

    cache_name = re.sub(
        r"[^\w.\-]",
        "_",
        f"{req.tipo}_{cor_arq.rsplit('.', 1)[0]}.png",
    )
    cache_path = SIM_CACHE_DIR / cache_name

    if cache_path.is_file():
        return {
            "image": "data:image/png;base64," + _img_b64(cache_path)
        }

    base_path = SIM_TIPOS[req.tipo]["base"]

    if req.tipo == "persiana" and not os.path.isfile(base_path):
        chat0 = _new_chat()
        _, imgs0 = await chat0.send_message_multimodal_response(
            UserMessage(
                text=(
                    "Photorealistic photo of a modern matte WHITE aluminum "
                    "venetian blind (persiana horizontal de aluminio branca), "
                    "half open, covering a large window in a bright modern "
                    "living room, natural daylight, high quality"
                )
            )
        )

        if not imgs0:
            raise HTTPException(
                status_code=502,
                detail="Falha ao gerar imagem base da persiana",
            )

        with open(base_path, "wb") as f:
            f.write(base64.b64decode(imgs0[0]["data"]))

    acab_txt = (
        "wood grain finish texture"
        if req.acabamento == "madeira"
        else "solid painted finish"
    )

    prompt = (
        f"The first image is a photo of an "
        f"{SIM_TIPOS[req.tipo]['desc']}. "
        "The second image is a color swatch of an aluminum profile finish. "
        f"Repaint ONLY the aluminum frame, profiles, slats and metal parts "
        f"to exactly match the swatch ({acab_txt}, finish name: "
        f"{req.cor_nome}). "
        "Keep the glass, the background, the lighting, the reflections "
        "and every other element completely unchanged. Photorealistic "
        "result, high quality."
    )

    chat = _new_chat()
    _, images = await chat.send_message_multimodal_response(
        UserMessage(
            text=prompt,
            file_contents=[
                ImageContent(_img_b64(base_path)),
                ImageContent(_img_b64(cor_path)),
            ],
        )
    )

    if not images:
        raise HTTPException(
            status_code=502,
            detail="A IA nao retornou imagem. Tente novamente.",
        )

    img_bytes = base64.b64decode(images[0]["data"])

    with open(cache_path, "wb") as f:
        f.write(img_bytes)

    return {
        "image": "data:image/png;base64," + images[0]["data"]
    }



# --- Rastreamento de atendimentos (cliques para o WhatsApp) ---
class TrackEvent(BaseModel):
    grupo: str = Field(min_length=1, max_length=80)
    item: str = Field(min_length=1, max_length=200)
    origem: str = Field(default="", max_length=80)


@api_router.post("/track", status_code=201)
async def track_event(input: TrackEvent):
    await db.lead_events.insert_one(
        {
            "id": str(uuid.uuid4()),
            **input.model_dump(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"ok": True}


# --- Autenticacao do painel admin (JWT em cookies httpOnly) ---
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 15
REFRESH_TOKEN_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(
        payload, get_jwt_secret(), algorithm=JWT_ALGORITHM
    )


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_DAYS),
        "type": "refresh",
    }
    return jwt.encode(
        payload, get_jwt_secret(), algorithm=JWT_ALGORITHM
    )


def set_auth_cookies(response: Response, user_id: str, email: str) -> None:
    response.set_cookie(
        "access_token",
        create_access_token(user_id, email),
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        create_refresh_token(user_id),
        httponly=True,
        secure=True,
        samesite="none",
        max_age=REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        path="/",
    )


def decode_token(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token, get_jwt_secret(), algorithms=[JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessao expirada")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessao invalida")
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail="Token invalido")
    return payload


def user_public(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", "Admin"),
        "role": user.get("role", "admin"),
    }


async def user_from_payload(payload: dict) -> dict:
    try:
        user_id = ObjectId(payload.get("sub", ""))
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado")
    return user_public(user)


def validate_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    allowed = {
        os.environ.get("FRONTEND_URL"),
        "http://localhost:3000",
    }
    if origin not in allowed:
        raise HTTPException(status_code=403, detail="Origem nao permitida")


def client_identifier(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "desconhecido"


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado")
    return await user_from_payload(decode_token(token, "access"))


class LoginRequest(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def auth_login(
    input: LoginRequest, request: Request, response: Response
):
    validate_origin(request)
    email = input.email.lower().strip()
    client_host = client_identifier(request)
    identifier = f"{client_host}:{email}"
    tent = await db.login_attempts.find_one({"identifier": identifier})
    if tent and tent.get("count", 0) >= 5:
        last = datetime.fromisoformat(tent["last"])
        if datetime.now(timezone.utc) - last < timedelta(minutes=15):
            raise HTTPException(
                status_code=429,
                detail="Muitas tentativas. Aguarde 15 minutos.",
            )
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(
        input.password, user.get("password_hash", "")
    ):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {
                    "last": datetime.now(timezone.utc).isoformat()
                },
            },
            upsert=True,
        )
        raise HTTPException(
            status_code=401, detail="E-mail ou senha incorretos"
        )
    await db.login_attempts.delete_many({"identifier": identifier})
    set_auth_cookies(response, str(user["_id"]), email)
    return user_public(user)


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/refresh")
async def auth_refresh(request: Request, response: Response):
    validate_origin(request)
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado")
    user = await user_from_payload(decode_token(token, "refresh"))
    response.set_cookie(
        "access_token",
        create_access_token(user["id"], user["email"]),
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    validate_origin(request)
    await get_current_user(request)
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats(request: Request, periodo: str = "mes"):
    await get_current_user(request)
    now = datetime.now(timezone.utc)
    dias = 7 if periodo == "semana" else 30
    inicio_dia = now.replace(hour=0, minute=0, second=0, microsecond=0)
    inicio = inicio_dia - timedelta(days=dias - 1)

    eventos = (
        await db.lead_events.find(
            {"timestamp": {"$gte": inicio.isoformat()}}, {"_id": 0}
        )
        .sort("timestamp", -1)
        .to_list(10000)
    )

    por_dia_map = {}
    cur = inicio
    while cur <= now:
        por_dia_map[cur.strftime("%d/%m")] = 0
        cur += timedelta(days=1)

    por_grupo = {}
    por_item = {}
    hoje = 0
    for ev in eventos:
        ts = datetime.fromisoformat(ev["timestamp"])
        dia = ts.strftime("%d/%m")
        if dia in por_dia_map:
            por_dia_map[dia] += 1
        if ts >= inicio_dia:
            hoje += 1
        por_grupo[ev["grupo"]] = por_grupo.get(ev["grupo"], 0) + 1
        por_item[ev["item"]] = por_item.get(ev["item"], 0) + 1

    return {
        "periodo": periodo,
        "dias": dias,
        "total": len(eventos),
        "hoje": hoje,
        "por_dia": [
            {"dia": k, "total": v} for k, v in por_dia_map.items()
        ],
        "por_grupo": sorted(
            [{"grupo": k, "total": v} for k, v in por_grupo.items()],
            key=lambda x: -x["total"],
        ),
        "por_item": sorted(
            [{"item": k, "total": v} for k, v in por_item.items()],
            key=lambda x: -x["total"],
        )[:15],
        "ultimos": eventos[:20],
    }


@app.on_event("startup")
async def seed_admin():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index(
        "expires_at", expireAfterSeconds=0
    )

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one(
            {
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info("Admin criado: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Senha do admin atualizada a partir do .env")


# Registra as rotas
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()