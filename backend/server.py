import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Literal

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import asyncio
import base64
import csv
import functools
import io
import re
import time
from zoneinfo import ZoneInfo

import bcrypt
import jwt
from bson import ObjectId
from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Query,
    Request,
    Response,
)
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
from pydantic import BaseModel, Field, ConfigDict, field_validator
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
SIM_CACHE_URL = "/api/simulacao_img"  # imagens do cache servidas como arquivo
SIM_TIMEOUT_S = 90  # tempo maximo de UMA chamada a IA
SIM_MAX_PARALELO = 3  # quantas chamadas a IA ao mesmo tempo
SIM_TENTATIVAS = 2  # tenta de novo se a IA nao devolver imagem


class SimulacaoRequest(BaseModel):
    tipo: str
    cor_arq: str
    cor_nome: str = Field(max_length=80)
    cor_codigo: str = Field(default="", max_length=40)
    acabamento: str = "pintura"


# As imagens base e as amostras de cor nao mudam: le do disco uma vez so.
@functools.lru_cache(maxsize=128)
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


_sim_locks: dict[str, asyncio.Lock] = {}
_sim_sem: asyncio.Semaphore | None = None


def _semaforo() -> asyncio.Semaphore:
    global _sim_sem
    if _sim_sem is None:
        _sim_sem = asyncio.Semaphore(SIM_MAX_PARALELO)
    return _sim_sem


def _cache_key(tipo: str, cor_arq: str) -> str:
    # Mesmo padrao de nome do cache antigo (sem a extensao)
    return re.sub(r"[^\w.\-]", "_", f"{tipo}_{cor_arq.rsplit('.', 1)[0]}")


def _arquivo_em_cache(key: str) -> Path | None:
    # .webp = novo formato (leve); .png = cache antigo, continua valendo
    for ext in (".webp", ".png"):
        p = SIM_CACHE_DIR / f"{key}{ext}"
        if p.is_file():
            return p
    return None


def _salvar_webp(img_bytes: bytes, destino: Path) -> None:
    tmp = destino.with_name(destino.name + ".tmp")
    with Image.open(io.BytesIO(img_bytes)) as im:
        im.convert("RGB").save(tmp, format="WEBP", quality=88)
    tmp.replace(destino)  # troca atomica: ninguem le arquivo pela metade


async def _garantir_base_persiana(base_path: str) -> None:
    if os.path.isfile(base_path):
        return
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


async def _chamar_ia(
    tipo: str, cor_arq: str, cor_nome: str, acabamento: str
) -> bytes:
    base_path = SIM_TIPOS[tipo]["base"]
    if tipo == "persiana":
        await _garantir_base_persiana(base_path)
    cor_path = os.path.join(SIM_CORES_DIR, cor_arq)

    acab_txt = (
        "wood grain finish texture"
        if acabamento == "madeira"
        else "solid painted finish"
    )
    prompt = (
        f"The first image is a photo of an "
        f"{SIM_TIPOS[tipo]['desc']}. "
        "The second image is a color swatch of an aluminum profile finish. "
        f"Repaint ONLY the aluminum frame, profiles, slats and metal parts "
        f"to exactly match the swatch ({acab_txt}, finish name: "
        f"{cor_nome}). "
        "Keep the glass, the background, the lighting, the reflections "
        "and every other element completely unchanged. Photorealistic "
        "result, high quality."
    )

    for tentativa in range(1, SIM_TENTATIVAS + 1):
        chat = _new_chat()
        _, images = await asyncio.wait_for(
            chat.send_message_multimodal_response(
                UserMessage(
                    text=prompt,
                    file_contents=[
                        ImageContent(_img_b64(base_path)),
                        ImageContent(_img_b64(cor_path)),
                    ],
                )
            ),
            timeout=SIM_TIMEOUT_S,
        )
        if images:
            return base64.b64decode(images[0]["data"])
        logger.warning(
            "IA sem imagem (%s/%s) tipo=%s cor=%s",
            tentativa,
            SIM_TENTATIVAS,
            tipo,
            cor_arq,
        )
    raise HTTPException(
        status_code=502,
        detail="A IA nao retornou imagem. Tente novamente.",
    )


async def gerar_simulacao(
    tipo: str, cor_arq: str, cor_nome: str, acabamento: str
) -> tuple[str, bool, int]:
    """Devolve (nome_do_arquivo, veio_do_cache, milissegundos)."""
    inicio = time.monotonic()

    def ms() -> int:
        return int((time.monotonic() - inicio) * 1000)

    key = _cache_key(tipo, cor_arq)
    hit = _arquivo_em_cache(key)
    if hit:
        return hit.name, True, ms()

    # Uma trava por combinacao: se 5 pessoas pedirem a mesma cor ao mesmo
    # tempo, so UMA chamada a IA e feita (as outras esperam e reaproveitam).
    lock = _sim_locks.setdefault(key, asyncio.Lock())
    async with lock:
        hit = _arquivo_em_cache(key)
        if hit:
            return hit.name, True, ms()
        async with _semaforo():
            img_bytes = await _chamar_ia(tipo, cor_arq, cor_nome, acabamento)
        destino = SIM_CACHE_DIR / f"{key}.webp"
        await asyncio.to_thread(_salvar_webp, img_bytes, destino)
    return destino.name, False, ms()


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

    if not os.path.isfile(os.path.join(SIM_CORES_DIR, cor_arq)):
        raise HTTPException(
            status_code=404,
            detail="Cor nao encontrada",
        )

    acabamento = "madeira" if req.acabamento == "madeira" else "pintura"

    try:
        arquivo, cache_hit, ms = await gerar_simulacao(
            req.tipo, cor_arq, req.cor_nome, acabamento
        )
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="A IA demorou demais. Tente novamente.",
        )
    except Exception:
        logger.exception("Erro ao gerar simulacao")
        raise HTTPException(
            status_code=502,
            detail="Nao foi possivel gerar a simulacao agora.",
        )

    # Registro para o ranking "cores mais simuladas". Nunca derruba a resposta.
    try:
        await db.simulacoes.insert_one(
            {
                "id": str(uuid.uuid4()),
                "tipo": req.tipo,
                "cor_arq": cor_arq,
                "cor_nome": req.cor_nome,
                "cor_codigo": req.cor_codigo,
                "acabamento": acabamento,
                "cache_hit": cache_hit,
                "ms": ms,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception:
        logger.exception("Falha ao registrar simulacao")

    return {"url": f"{SIM_CACHE_URL}/{arquivo}", "cached": cache_hit}


class CachedStatic(StaticFiles):
    """Serve o cache de simulacoes e deixa o navegador guardar por 1 dia."""

    async def get_response(self, path, scope):
        resp = await super().get_response(path, scope)
        if resp.status_code == 200:
            resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp


# --- Pre-geracao das cores mais pedidas (painel admin) ---
_pregen = {"rodando": False, "total": 0, "feitas": 0, "erros": 0}
_bg_tasks: set = set()


class PreGerarRequest(BaseModel):
    top: int = Field(default=10, ge=1, le=30)
    tipos: list[str] | None = None


async def _rodar_pregen(itens: list[dict]) -> None:
    async def um(it: dict) -> None:
        try:
            await gerar_simulacao(**it)
        except Exception:
            _pregen["erros"] += 1
            logger.exception("Falha na pre-geracao: %s", it)
        finally:
            _pregen["feitas"] += 1

    try:
        await asyncio.gather(*(um(it) for it in itens))
    finally:
        _pregen["rodando"] = False


# --- Rastreamento de atendimentos (cliques para o WhatsApp) ---
STATUS_LEAD = [
    "novo",
    "em_conversa",
    "orcamento_enviado",
    "fechado",
    "perdido",
]
StatusLead = Literal[
    "novo", "em_conversa", "orcamento_enviado", "fechado", "perdido"
]
TZ_BR = ZoneInfo("America/Sao_Paulo")


class TrackEvent(BaseModel):
    grupo: str = Field(min_length=1, max_length=80)
    item: str = Field(min_length=1, max_length=200)
    origem: str = Field(default="", max_length=80)
    # Campos do formulario de orcamento (nome, telefone, cidade, obra...)
    dados: dict[str, str] = Field(default_factory=dict)

    @field_validator("dados")
    @classmethod
    def limitar_dados(cls, v: dict) -> dict:
        if len(v) > 15:
            raise ValueError("Dados demais")
        return {str(k)[:40]: str(val)[:500] for k, val in v.items()}


@api_router.post("/track", status_code=201)
async def track_event(input: TrackEvent):
    await db.lead_events.insert_one(
        {
            "id": str(uuid.uuid4()),
            **input.model_dump(),
            "status": "novo",
            "nota": "",
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


# --- Painel admin: atendimentos (status + CSV) ---
class LeadUpdate(BaseModel):
    status: StatusLead | None = None
    nota: str | None = Field(default=None, max_length=1000)


def _filtro_leads(
    dias: int,
    grupo: str | None,
    q: str | None,
    status: str | None = None,
) -> dict:
    cond = []
    if dias:
        inicio = datetime.now(timezone.utc) - timedelta(days=dias)
        cond.append({"timestamp": {"$gte": inicio.isoformat()}})
    if grupo:
        cond.append({"grupo": grupo})
    if q and q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        cond.append(
            {
                "$or": [
                    {"item": rx},
                    {"grupo": rx},
                    {"nota": rx},
                    {"dados.nome": rx},
                    {"dados.telefone": rx},
                    {"dados.cidade": rx},
                ]
            }
        )
    if status:
        if status == "novo":
            # atendimentos antigos nao tem o campo status: contam como novos
            cond.append(
                {"$or": [{"status": "novo"}, {"status": {"$exists": False}}]}
            )
        else:
            cond.append({"status": status})
    return {"$and": cond} if cond else {}


def _lead_out(ev: dict) -> dict:
    ev.setdefault("status", "novo")
    ev.setdefault("nota", "")
    ev.setdefault("dados", {})
    return ev


def _checar_status(status: str | None) -> None:
    if status and status not in STATUS_LEAD:
        raise HTTPException(status_code=400, detail="Status invalido")


@api_router.get("/admin/leads")
async def admin_listar_leads(
    request: Request,
    dias: int = Query(30, ge=0, le=365),  # 0 = todo o historico
    status: str | None = None,
    grupo: str | None = None,
    q: str | None = Query(None, max_length=80),
    limite: int = Query(200, ge=1, le=1000),
):
    await get_current_user(request)
    _checar_status(status)

    # Os contadores ignoram o filtro de status, para o funil ficar completo
    base = _filtro_leads(dias, grupo, q)
    contagem = await db.lead_events.aggregate(
        [
            {"$match": base},
            {
                "$group": {
                    "_id": {"$ifNull": ["$status", "novo"]},
                    "total": {"$sum": 1},
                }
            },
        ]
    ).to_list(20)
    por_status = {s: 0 for s in STATUS_LEAD}
    for c in contagem:
        if c["_id"] in por_status:
            por_status[c["_id"]] = c["total"]
    total = sum(por_status.values())

    filtro = _filtro_leads(dias, grupo, q, status)
    filtrados = await db.lead_events.count_documents(filtro)
    itens = (
        await db.lead_events.find(filtro, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(limite)
    )

    return {
        "statuses": STATUS_LEAD,
        "resumo": {
            "total": total,
            "por_status": por_status,
            "taxa_fechamento": (
                round(por_status["fechado"] / total * 100, 1)
                if total
                else 0
            ),
        },
        "filtrados": filtrados,
        "itens": [_lead_out(i) for i in itens],
    }


@api_router.patch("/admin/leads/{lead_id}")
async def admin_atualizar_lead(
    lead_id: str, input: LeadUpdate, request: Request
):
    validate_origin(request)
    await get_current_user(request)
    campos = {}
    if input.status is not None:
        campos["status"] = input.status
        campos["status_atualizado_em"] = datetime.now(
            timezone.utc
        ).isoformat()
    if input.nota is not None:
        campos["nota"] = input.nota.strip()
    if not campos:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    result = await db.lead_events.find_one_and_update(
        {"id": lead_id},
        {"$set": campos},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(
            status_code=404, detail="Atendimento nao encontrado"
        )
    return _lead_out(result)


STATUS_LABEL = {
    "novo": "Novo",
    "em_conversa": "Em conversa",
    "orcamento_enviado": "Orçamento enviado",
    "fechado": "Fechado",
    "perdido": "Perdido",
}


def _csv_safe(valor) -> str:
    """Evita que Excel/Sheets executem texto digitado no formulario."""
    s = "" if valor is None else str(valor)
    if s[:1] in ("=", "+", "-", "@", "\t", "\r") and not re.fullmatch(
        r"\+?[\d\s()\-]+", s
    ):
        s = "'" + s
    return s


@api_router.get("/admin/leads/export.csv")
async def admin_exportar_leads(
    request: Request,
    dias: int = Query(30, ge=0, le=365),
    status: str | None = None,
    grupo: str | None = None,
    q: str | None = Query(None, max_length=80),
):
    await get_current_user(request)
    _checar_status(status)
    itens = (
        await db.lead_events.find(
            _filtro_leads(dias, grupo, q, status), {"_id": 0}
        )
        .sort("timestamp", -1)
        .to_list(20000)
    )

    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    w.writerow(
        [
            "Data",
            "Status",
            "Categoria",
            "Item",
            "Origem",
            "Nome",
            "Telefone",
            "Cidade",
            "Tipo de projeto",
            "Obra",
            "Prazo",
            "Medidas",
            "Detalhes",
            "Observação",
        ]
    )
    for ev in itens:
        ev = _lead_out(ev)
        d = ev["dados"]
        data = datetime.fromisoformat(ev["timestamp"]).astimezone(TZ_BR)
        w.writerow(
            [
                _csv_safe(x)
                for x in [
                    data.strftime("%d/%m/%Y %H:%M"),
                    STATUS_LABEL.get(ev["status"], ev["status"]),
                    ev["grupo"],
                    ev["item"],
                    ev.get("origem", ""),
                    d.get("nome", ""),
                    d.get("telefone", ""),
                    d.get("cidade", ""),
                    d.get("tipo", ""),
                    d.get("obra", ""),
                    d.get("prazo", ""),
                    d.get("medidas", ""),
                    d.get("detalhes", ""),
                    ev["nota"],
                ]
            ]
        )

    nome = f"atendimentos-{datetime.now(TZ_BR).strftime('%Y-%m-%d')}.csv"
    # BOM no inicio: faz o Excel abrir com acentos corretos
    return Response(
        content="\ufeff" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nome}"'},
    )


# --- Painel admin: cores mais simuladas + pre-geracao ---
@api_router.get("/admin/simulacoes")
async def admin_simulacoes(
    request: Request, dias: int = Query(30, ge=1, le=365)
):
    await get_current_user(request)
    inicio = (datetime.now(timezone.utc) - timedelta(days=dias)).isoformat()
    filtro = {"timestamp": {"$gte": inicio}}

    total = await db.simulacoes.count_documents(filtro)
    do_cache = await db.simulacoes.count_documents(
        {**filtro, "cache_hit": True}
    )
    media = await db.simulacoes.aggregate(
        [
            {"$match": {**filtro, "cache_hit": False}},
            {"$group": {"_id": None, "media": {"$avg": "$ms"}}},
        ]
    ).to_list(1)
    por_tipo = await db.simulacoes.aggregate(
        [
            {"$match": filtro},
            {"$group": {"_id": "$tipo", "total": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
    ).to_list(20)
    top = await db.simulacoes.aggregate(
        [
            {"$match": filtro},
            {
                "$group": {
                    "_id": "$cor_arq",
                    "total": {"$sum": 1},
                    "nome": {"$last": "$cor_nome"},
                    "codigo": {"$last": "$cor_codigo"},
                }
            },
            {"$sort": {"total": -1}},
            {"$limit": 15},
        ]
    ).to_list(15)

    cores = [
        {
            "arq": c["_id"],
            "nome": c.get("nome") or c["_id"],
            "codigo": c.get("codigo") or "",
            "total": c["total"],
            "tipos_em_cache": sum(
                1 for t in SIM_TIPOS if _arquivo_em_cache(_cache_key(t, c["_id"]))
            ),
        }
        for c in top
    ]
    arquivos_em_cache = len(
        {
            p.stem
            for p in SIM_CACHE_DIR.iterdir()
            if p.suffix in (".webp", ".png")
        }
    )

    return {
        "dias": dias,
        "total": total,
        "pct_cache": round(do_cache / total * 100) if total else 0,
        "media_geracao_s": (
            round(media[0]["media"] / 1000, 1) if media else None
        ),
        "arquivos_em_cache": arquivos_em_cache,
        "tipos_total": len(SIM_TIPOS),
        "por_tipo": [{"tipo": t["_id"], "total": t["total"]} for t in por_tipo],
        "cores": cores,
        "pregeracao": dict(_pregen),
    }


@api_router.get("/admin/simulacoes/pre-gerar")
async def admin_pregen_status(request: Request):
    await get_current_user(request)
    return dict(_pregen)


@api_router.post("/admin/simulacoes/pre-gerar")
async def admin_pre_gerar(input: PreGerarRequest, request: Request):
    """Gera antecipadamente as N cores mais pedidas (todos os tipos).

    Cada imagem nova consome creditos da IA: use com moderacao.
    """
    validate_origin(request)
    await get_current_user(request)
    if _pregen["rodando"]:
        raise HTTPException(
            status_code=409, detail="Ja existe uma pre-geracao em andamento"
        )
    tipos = input.tipos or list(SIM_TIPOS)
    if any(t not in SIM_TIPOS for t in tipos):
        raise HTTPException(status_code=400, detail="Tipo invalido")

    top = await db.simulacoes.aggregate(
        [
            {
                "$group": {
                    "_id": "$cor_arq",
                    "total": {"$sum": 1},
                    "nome": {"$last": "$cor_nome"},
                }
            },
            {"$sort": {"total": -1}},
            {"$limit": input.top},
        ]
    ).to_list(input.top)

    itens, ja_em_cache = [], 0
    for c in top:
        arq = c["_id"] or ""
        if not re.fullmatch(r"[\w.\-]+", arq) or not os.path.isfile(
            os.path.join(SIM_CORES_DIR, arq)
        ):
            continue
        for t in tipos:
            if _arquivo_em_cache(_cache_key(t, arq)):
                ja_em_cache += 1
                continue
            itens.append(
                {
                    "tipo": t,
                    "cor_arq": arq,
                    "cor_nome": c.get("nome") or arq,
                    "acabamento": (
                        "madeira" if arq.startswith("COD.") else "pintura"
                    ),
                }
            )

    if not itens:
        return {"agendadas": 0, "ja_em_cache": ja_em_cache}

    _pregen.update(rodando=True, total=len(itens), feitas=0, erros=0)
    task = asyncio.create_task(_rodar_pregen(itens))
    _bg_tasks.add(task)  # guarda a referencia, senao o Python pode descartar
    task.add_done_callback(_bg_tasks.discard)
    return {"agendadas": len(itens), "ja_em_cache": ja_em_cache}


@app.on_event("startup")
async def seed_admin():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.lead_events.create_index("timestamp")
    await db.simulacoes.create_index("timestamp")
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
app.mount(
    SIM_CACHE_URL,
    CachedStatic(directory=str(SIM_CACHE_DIR)),
    name="simulacao_img",
)

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