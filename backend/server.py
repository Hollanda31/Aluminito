import asyncio
import csv
import io
import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Literal, Optional
from urllib.parse import quote
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", str(ROOT_DIR / "uploads")))
UPLOAD_DIR.mkdir(exist_ok=True)

import base64
import re

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
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
    await require_permission(request, "avaliacoes")
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
    actor = await require_permission(request, "avaliacoes")
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
    await log_admin_action(actor, "Status de avaliação alterado", {"id": review_id, "status": input.status})
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
    actor = await require_permission(request, "avaliacoes")
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
    await log_admin_action(actor, "Destaque de avaliação alterado", {"id": review_id, "destaque": input.featured})
    return result



@api_router.delete("/admin/reviews/{review_id}", status_code=204)
async def admin_delete_review(review_id: str, request: Request):
    actor = await require_permission(request, "avaliacoes")
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(
            status_code=404,
            detail="Avaliacao nao encontrada",
        )
    await db.site_trash.insert_one({"id": str(uuid.uuid4()), "kind": "review", "title": review.get("name", "Avaliação"), "data": review, "deleted_at": datetime.now(timezone.utc).isoformat(), "deleted_by": actor.get("email")})
    await db.reviews.delete_one({"id": review_id})
    await log_admin_action(actor, "Avaliação movida para a lixeira", {"id": review_id, "nome": review.get("name")})
    return None


# Simulador de cores com IA
from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    ImageContent,
)

try:  # Pillow e opcional: sem ele o cache continua em PNG (mais pesado)
    from PIL import Image as PILImage
except ImportError:  # pragma: no cover
    PILImage = None


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

# Simulacao de cor de VIDRO (pele de vidro). Cores de referencia: linha Habitat by
# Cebrace. A chave e o nome do arquivo da amostra (sem extensao) em
# frontend/public/vidros/, o mesmo "arq" usado em frontend/src/lib/vidros.js.
SIM_VIDROS_DIR = "/app/frontend/public/vidros"
SIM_TIPOS["vidro"] = {
    "base": "/app/frontend/public/projects/Pele-de-vidro-1.jpg",
    "desc": (
        "tall narrow glass curtain-wall window (pele de vidro) with a thin black "
        "aluminum frame, set in a white stone-clad wall"
    ),
    "dir": SIM_VIDROS_DIR,
}
SIM_VIDROS = {
    "habitat-neutro-incolor": (
        "almost colorless, highly transparent neutral glass with only a very "
        "faint cool-green tint, soft sky reflections, interior clearly visible"
    ),
    "habitat-neutro-cinza-claro": (
        "light grey tinted neutral glass, slightly smoky but still very "
        "transparent, soft sky reflections"
    ),
    "habitat-neutro-cinza": (
        "medium grey tinted neutral glass, smoky and darker than clear glass "
        "but still transparent, soft sky reflections"
    ),
    "habitat-refletivo-cinza": (
        "silver-grey mirror-like reflective glass with a strong, clear "
        "reflection of the sky and surroundings and little visibility inside"
    ),
    "habitat-refletivo-champanhe": (
        "champagne / golden-bronze mirror-like reflective glass with a strong "
        "reflection of the sky and surroundings and little visibility inside"
    ),
    "habitat-refletivo-esmeralda": (
        "emerald green mirror-like reflective glass with a strong reflection "
        "of the sky and surroundings and little visibility inside"
    ),
}
SIM_CACHE_DIR = Path("/app/backend/simulacao_cache")
SIM_CACHE_DIR.mkdir(exist_ok=True)
SIM_CACHE_EXTS = (".webp", ".png")

# Geracoes em andamento (chave = nome do cache): cliques repetidos na mesma
# cor/tipo esperam a mesma geracao em vez de gastar creditos duas vezes.
_SIM_INFLIGHT: dict = {}
# No maximo 3 geracoes simultaneas na IA (protege creditos e tempo de resposta).
_SIM_SEM = asyncio.Semaphore(3)
_SIM_BG_TASKS: set = set()


class SimulacaoRequest(BaseModel):
    tipo: str
    cor_arq: str
    cor_nome: str
    acabamento: str = "pintura"
    # "url" devolve so o link da imagem (rapido); "base64" mantem o formato antigo
    formato: str = "base64"


def _img_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _sim_limpa_nome(nome: str) -> str:
    return re.sub(r"[^\w .\-/]", "", nome or "")[:60].strip() or "cor"


def _sim_stem(tipo: str, cor_arq: str) -> str:
    return re.sub(r"[^\w.\-]", "_", f"{tipo}_{cor_arq.rsplit('.', 1)[0]}")


def _sim_cache_find(stem: str):
    for ext in SIM_CACHE_EXTS:
        path = SIM_CACHE_DIR / f"{stem}{ext}"
        if path.is_file():
            return path
    return None


def _sim_cache_save(stem: str, img_bytes: bytes) -> Path:
    """Salva em WebP (uns 4x menor que PNG) e de forma atomica."""
    if PILImage is not None:
        try:
            im = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
            final = SIM_CACHE_DIR / f"{stem}.webp"
            tmp = SIM_CACHE_DIR / f"{stem}.webp.tmp"
            im.save(tmp, "WEBP", quality=88, method=4)
            os.replace(tmp, final)
            return final
        except Exception:
            logger.exception("Falha ao converter simulacao para WebP; salvando PNG")
    final = SIM_CACHE_DIR / f"{stem}.png"
    tmp = SIM_CACHE_DIR / f"{stem}.png.tmp"
    tmp.write_bytes(img_bytes)
    os.replace(tmp, final)
    return final


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


def _sim_prompt_vidro(req: SimulacaoRequest) -> str:
    chave = req.cor_arq.rsplit(".", 1)[0]
    desc = SIM_VIDROS.get(chave, "tinted architectural glass")
    return (
        f"The first image is a photo of a {SIM_TIPOS['vidro']['desc']}. "
        "The second image is a color swatch of an architectural glass tint. "
        f"Change ONLY the glass panes of the tall glazed window so they look "
        f"like {desc} (glass name: {req.cor_nome}). "
        "Keep the black aluminum frame and dividers, the white stone wall, the "
        "grey wall, the plant, the sky, the blurred side bars, the lighting and "
        "the framing completely unchanged. The glass must keep realistic "
        "reflections appropriate to this glass type. Photorealistic result, "
        "high quality, same composition and aspect ratio as the first image."
    )


async def _sim_gerar(req: SimulacaoRequest, cor_path: str, stem: str) -> Path:
    base_path = SIM_TIPOS[req.tipo]["base"]

    async with _SIM_SEM:
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

        if req.tipo == "vidro":
            prompt = _sim_prompt_vidro(req)
        else:
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
    return _sim_cache_save(stem, base64.b64decode(images[0]["data"]))


async def _sim_gerar_ou_aguardar(
    req: SimulacaoRequest, cor_path: str, stem: str
) -> Path:
    task = _SIM_INFLIGHT.get(stem)
    if task is None:
        task = asyncio.create_task(_sim_gerar(req, cor_path, stem))
        _SIM_INFLIGHT[stem] = task
        task.add_done_callback(lambda _t, k=stem: _SIM_INFLIGHT.pop(k, None))
    # shield: se o cliente desistir, a geracao termina e fica no cache
    return await asyncio.shield(task)


async def _sim_log(req: SimulacaoRequest, cor_arq: str, cached: bool) -> None:
    """Registra cada simulacao (alimenta 'Cores mais simuladas' no painel)."""
    try:
        await db.simulation_events.insert_one(
            {
                "id": str(uuid.uuid4()),
                "tipo": req.tipo,
                "cor_arq": cor_arq,
                "cor_nome": req.cor_nome,
                "acabamento": req.acabamento,
                "cached": cached,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception:
        logger.warning("Nao foi possivel registrar a simulacao", exc_info=True)


def _sim_validar(req: SimulacaoRequest):
    if req.tipo not in SIM_TIPOS:
        raise HTTPException(status_code=400, detail="Tipo de projeto invalido")
    cor_arq = os.path.basename(req.cor_arq)
    if not re.fullmatch(r"[\w.\-]+", cor_arq):
        raise HTTPException(status_code=400, detail="Arquivo de cor invalido")
    pasta = SIM_TIPOS[req.tipo].get("dir", SIM_CORES_DIR)
    cor_path = os.path.join(pasta, cor_arq)
    if not os.path.isfile(cor_path):
        raise HTTPException(status_code=404, detail="Cor nao encontrada")
    return cor_arq, cor_path


@api_router.post("/simular")
async def simular_cor(req: SimulacaoRequest):
    cor_arq, cor_path = _sim_validar(req)
    req.cor_nome = _sim_limpa_nome(req.cor_nome)
    stem = _sim_stem(req.tipo, cor_arq)

    path = _sim_cache_find(stem)
    cached = path is not None
    if path is None:
        path = await _sim_gerar_ou_aguardar(req, cor_path, stem)

    await _sim_log(req, cor_arq, cached)

    url = f"/api/simular/img/{path.name}"
    if req.formato == "url":
        return {"url": url, "cached": cached}
    mime = "image/webp" if path.suffix == ".webp" else "image/png"
    return {
        "image": f"data:{mime};base64," + _img_b64(path),
        "url": url,
        "cached": cached,
    }


@api_router.get("/simular/img/{nome}")
async def simular_imagem(nome: str):
    nome = os.path.basename(nome)
    if not re.fullmatch(r"[\w.\-]+", nome) or not nome.lower().endswith(
        SIM_CACHE_EXTS
    ):
        raise HTTPException(status_code=404, detail="Imagem nao encontrada")
    path = SIM_CACHE_DIR / nome
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Imagem nao encontrada")
    media = "image/webp" if path.suffix.lower() == ".webp" else "image/png"
    return FileResponse(
        path,
        media_type=media,
        headers={"Cache-Control": "public, max-age=604800"},
    )


@api_router.get("/simular/disponiveis")
async def simular_disponiveis(tipo: str):
    """Cores que ja tem simulacao pronta (resposta instantanea) para o tipo."""
    if tipo not in SIM_TIPOS:
        raise HTTPException(status_code=400, detail="Tipo de projeto invalido")
    try:
        arquivos = sorted(os.listdir(SIM_TIPOS[tipo].get("dir", SIM_CORES_DIR)))
    except OSError:
        return {"cores": []}
    return {
        "cores": [
            a for a in arquivos if _sim_cache_find(_sim_stem(tipo, a)) is not None
        ]
    }


class PrewarmRequest(BaseModel):
    top: int = Field(default=6, ge=1, le=20)
    tipos: List[str] = Field(
        default_factory=lambda: [t for t in SIM_TIPOS if t != "vidro"]
    )


async def _sim_prewarm_worker(combos: List[SimulacaoRequest]) -> None:
    for req in combos:
        try:
            cor_arq, cor_path = _sim_validar(req)
            stem = _sim_stem(req.tipo, cor_arq)
            if _sim_cache_find(stem) is None:
                await _sim_gerar_ou_aguardar(req, cor_path, stem)
        except Exception:
            logger.warning("Pre-geracao falhou para %s", req.cor_arq, exc_info=True)


@api_router.post("/admin/simular/prewarm")
async def simular_prewarm(input: PrewarmRequest, request: Request):
    """Pre-gera (em segundo plano) as cores mais simuladas que ainda nao
    estao em cache. Cada imagem nova consome creditos da IA."""
    validate_origin(request)
    await require_permission(request, "relatorios")
    # o pre-aquecimento e so para as cores de aluminio (vidro tem poucas opcoes)
    tipos = [t for t in input.tipos if t in SIM_TIPOS and t != "vidro"]
    top = (
        await db.simulation_events.aggregate(
            [
                {"$match": {"tipo": {"$ne": "vidro"}}},
                {
                    "$group": {
                        "_id": "$cor_arq",
                        "total": {"$sum": 1},
                        "cor_nome": {"$first": "$cor_nome"},
                        "acabamento": {"$first": "$acabamento"},
                    }
                },
                {"$sort": {"total": -1}},
                {"$limit": input.top},
            ]
        )
        .to_list(input.top)
    )
    combos = []
    cores_validas = 0
    for c in top:
        arq = os.path.basename(c["_id"] or "")
        if not arq or not os.path.isfile(os.path.join(SIM_CORES_DIR, arq)):
            continue
        cores_validas += 1
        for t in tipos:
            if _sim_cache_find(_sim_stem(t, arq)) is None:
                combos.append(
                    SimulacaoRequest(
                        tipo=t,
                        cor_arq=arq,
                        cor_nome=_sim_limpa_nome(c.get("cor_nome") or arq),
                        acabamento=c.get("acabamento") or "pintura",
                    )
                )
    ja_em_cache = cores_validas * len(tipos) - len(combos)
    if combos:
        task = asyncio.create_task(_sim_prewarm_worker(combos))
        _SIM_BG_TASKS.add(task)
        task.add_done_callback(_SIM_BG_TASKS.discard)
    return {"agendadas": len(combos), "ja_em_cache": ja_em_cache}


@api_router.post("/admin/simulacoes/pre-gerar")
async def simulacoes_pre_gerar(input: PrewarmRequest, request: Request):
    return await simular_prewarm(input, request)


@api_router.get("/admin/simulacoes")
async def admin_simulacoes(request: Request, dias: int = 30):
    await require_permission(request, "relatorios")
    dias = min(max(dias, 1), 365)
    inicio = datetime.now(timezone.utc) - timedelta(days=dias)
    eventos = (
        await db.simulation_events.find(
            {"timestamp": {"$gte": inicio.isoformat()}}, {"_id": 0}
        )
        .to_list(10000)
    )
    tipos = [t for t in SIM_TIPOS if t != "vidro"]
    por_tipo = {}
    por_cor = {}
    respondidas_cache = 0

    for ev in eventos:
        tipo = ev.get("tipo") or "outros"
        arq = ev.get("cor_arq") or ""
        por_tipo[tipo] = por_tipo.get(tipo, 0) + 1
        if ev.get("cached"):
            respondidas_cache += 1
        if arq:
            cor = por_cor.setdefault(
                arq,
                {
                    "arq": arq,
                    "nome": ev.get("cor_nome") or _cor_label(arq),
                    "codigo": (
                        re.search(r"COD\.\d+", arq).group(0)
                        if re.search(r"COD\.\d+", arq)
                        else None
                    ),
                    "total": 0,
                },
            )
            cor["total"] += 1

    cores = []
    for cor in por_cor.values():
        cor["tipos_em_cache"] = sum(
            1
            for tipo in tipos
            if _sim_cache_find(_sim_stem(tipo, cor["arq"])) is not None
        )
        cores.append(cor)

    total = len(eventos)
    return {
        "dias": dias,
        "total": total,
        "pct_cache": round((respondidas_cache / total) * 100) if total else 0,
        "media_geracao_s": None,
        "arquivos_em_cache": len(
            [
                p
                for p in SIM_CACHE_DIR.iterdir()
                if p.suffix.lower() in SIM_CACHE_EXTS
            ]
        ),
        "tipos_total": len(tipos),
        "cores": sorted(cores, key=lambda c: -c["total"])[:20],
        "por_tipo": sorted(
            [{"tipo": k, "total": v} for k, v in por_tipo.items()],
            key=lambda t: -t["total"],
        ),
        "pregeracao": {
            "rodando": bool(_SIM_BG_TASKS),
            "total": 0,
            "feitas": 0,
            "erros": 0,
        },
    }


# --- Rastreamento de atendimentos (cliques para o WhatsApp) ---
LEAD_STATUS = ["novo", "em_conversa", "orcamento_enviado", "fechado", "perdido"]
LeadStatus = Literal["novo", "em_conversa", "orcamento_enviado", "fechado", "perdido"]
LeadPriority = Literal["baixa", "media", "alta"]
LeadLossReason = Literal["preco", "prazo", "concorrente", "desistiu", "sem_resposta", "outro"]
DADOS_CAMPOS = (
    "nome",
    "contato",
    "documento",
    "telefone",
    "local",
    "projeto",
    "itens",
    "cor_aluminio",
    "vidro",
    # campos do formulario antigo (mantidos para os atendimentos ja registrados)
    "cidade",
    "tipo",
    "situacao",
    "medidas",
    "cor",
    "prazo",
    "obs",
)
DADOS_LIMITE = {"itens": 1500}  # demais campos: 400 caracteres
BR_TZ = ZoneInfo("America/Sao_Paulo")


class TrackEvent(BaseModel):
    grupo: str = Field(min_length=1, max_length=80)
    item: str = Field(min_length=1, max_length=200)
    origem: str = Field(default="", max_length=80)
    # Dados do formulario de orcamento (so os campos conhecidos sao aceitos)
    dados: dict = Field(default_factory=dict)

    @field_validator("dados")
    @classmethod
    def _limpa_dados(cls, v):
        limpo = {}
        for chave in DADOS_CAMPOS:
            val = v.get(chave)
            if isinstance(val, str) and val.strip():
                limpo[chave] = val.strip()[: DADOS_LIMITE.get(chave, 400)]
        return limpo


class ProjectMetricInput(BaseModel):
    project_id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=120)
    action: Literal["view", "quote"]


@api_router.post("/track", status_code=201)
async def track_event(input: TrackEvent):
    doc = {
        "id": str(uuid.uuid4()),
        **input.model_dump(),
        "status": "novo",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if not doc["dados"]:
        doc.pop("dados")
    await db.lead_events.insert_one(doc)
    return {"ok": True}


@api_router.post("/track/project", status_code=202)
async def track_project_metric(input: ProjectMetricInput, request: Request):
    validate_origin(request)
    today = datetime.now(timezone.utc).date().isoformat()
    key = f"{input.project_id}:{today}"
    metric = "views" if input.action == "view" else "quotes"
    await db.project_metrics.update_one(
        {"_id": key},
        {"$setOnInsert": {"project_id": input.project_id, "day": today},
         "$set": {"title": input.title.strip()},
         "$inc": {metric: 1}},
        upsert=True,
    )
    return {"ok": True}


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    prioridade: Optional[LeadPriority] = None
    motivo_perda: Optional[LeadLossReason] = None
    nota: Optional[str] = Field(default=None, max_length=500)
    # True = o botao "Pedir avaliacao" foi usado (guarda a data)
    avaliacao_pedida: Optional[bool] = None


def _lead_out(doc: dict) -> dict:
    doc.setdefault("status", "novo")
    doc.setdefault("prioridade", "media")
    return doc


def _lead_filtro(periodo: str = "mes", status: str = "", q: str = "") -> dict:
    filtro: dict = {}
    dias = {"semana": 7, "mes": 30, "trimestre": 90}.get(periodo)
    if dias:
        inicio = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=dias - 1)
        filtro["timestamp"] = {"$gte": inicio.isoformat()}
    if status in LEAD_STATUS:
        if status == "novo":
            # eventos antigos nao tem o campo status: contam como "novo"
            filtro["$and"] = [
                {"$or": [{"status": "novo"}, {"status": {"$exists": False}}]}
            ]
        else:
            filtro["status"] = status
    q = (q or "").strip()
    if q:
        rx = {"$regex": re.escape(q[:60]), "$options": "i"}
        filtro.setdefault("$and", []).append(
            {
                "$or": [
                    {"item": rx},
                    {"grupo": rx},
                    {"origem": rx},
                    {"nota": rx},
                    {"dados.nome": rx},
                    {"dados.telefone": rx},
                    {"dados.cidade": rx},
                    {"dados.local": rx},
                    {"dados.contato": rx},
                ]
            }
        )
    return filtro


@api_router.get("/admin/leads")
async def admin_leads(
    request: Request,
    periodo: str = "mes",
    status: str = "",
    q: str = "",
    limit: int = 50,
    skip: int = 0,
):
    await require_permission(request, "atendimentos")
    limit = max(1, min(limit, 200))
    skip = max(0, skip)
    filtro = _lead_filtro(periodo, status, q)
    total = await db.lead_events.count_documents(filtro)
    itens = (
        await db.lead_events.find(filtro, {"_id": 0})
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    return {"total": total, "itens": [_lead_out(i) for i in itens]}


def _csv_seguro(valor) -> str:
    """Evita que o Excel execute formulas vindas de texto digitado no site."""
    texto = "" if valor is None else str(valor)
    if texto[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + texto
    return texto


@api_router.get("/admin/leads/export.csv")
async def admin_leads_export(
    request: Request,
    periodo: str = "mes",
    status: str = "",
    q: str = "",
):
    await require_permission(request, "atendimentos")
    itens = (
        await db.lead_events.find(_lead_filtro(periodo, status, q), {"_id": 0})
        .sort("timestamp", -1)
        .to_list(10000)
    )
    rotulos = {
        "novo": "Novo",
        "em_conversa": "Em conversa",
        "orcamento_enviado": "Orçamento enviado",
        "fechado": "Fechado",
        "perdido": "Perdido",
    }
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    w.writerow(
        [
            "Data",
            "Hora",
            "Status",
            "Motivo da perda",
            "Categoria",
            "Item",
            "Origem",
            "Nome",
            "Contato",
            "CNPJ/CPF",
            "Telefone",
            "Local de instalação",
            "Possui projeto",
            "Itens a orçar",
            "Cor do alumínio / material",
            "Vidro (cor, espessura e tipo)",
            "Cidade",
            "Tipo de projeto",
            "Situação da obra",
            "Medidas",
            "Cor desejada",
            "Prazo",
            "Observações",
            "Nota interna",
        ]
    )
    for ev in itens:
        try:
            ts = datetime.fromisoformat(ev["timestamp"]).astimezone(BR_TZ)
            data, hora = ts.strftime("%d/%m/%Y"), ts.strftime("%H:%M")
        except Exception:
            data, hora = ev.get("timestamp", ""), ""
        d = ev.get("dados") or {}
        linha = [
            data,
            hora,
            rotulos.get(ev.get("status", "novo"), "Novo"),
            ev.get("motivo_perda", ""),
            ev.get("grupo"),
            ev.get("item"),
            ev.get("origem"),
            d.get("nome"),
            d.get("contato"),
            d.get("documento"),
            d.get("telefone"),
            d.get("local"),
            d.get("projeto"),
            d.get("itens"),
            d.get("cor_aluminio"),
            d.get("vidro"),
            d.get("cidade"),
            d.get("tipo"),
            d.get("situacao"),
            d.get("medidas"),
            d.get("cor"),
            d.get("prazo"),
            d.get("obs"),
            ev.get("nota"),
        ]
        w.writerow([_csv_seguro(c) for c in linha])
    corpo = ("\ufeff" + buf.getvalue()).encode("utf-8")  # BOM: Excel abre com acentos
    nome = f"atendimentos-{datetime.now(BR_TZ).strftime('%Y-%m-%d')}.csv"
    return Response(
        content=corpo,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nome}"'},
    )


@api_router.patch("/admin/leads/{lead_id}")
async def admin_update_lead(lead_id: str, input: LeadUpdate, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "atendimentos")
    campos = {}
    if input.status is not None:
        campos["status"] = input.status
        if input.status == "perdido":
            current_lead = await db.lead_events.find_one({"id": lead_id}, {"_id": 0, "motivo_perda": 1, "status": 1})
            if not current_lead:
                raise HTTPException(status_code=404, detail="Atendimento nao encontrado")
            reason = input.motivo_perda or (current_lead.get("motivo_perda") if current_lead.get("status") == "perdido" else None)
            if not reason:
                raise HTTPException(status_code=400, detail="Selecione o motivo da perda")
            campos["motivo_perda"] = reason
    elif input.motivo_perda is not None:
        raise HTTPException(status_code=400, detail="O motivo só pode ser salvo em atendimento perdido")
    if input.prioridade is not None:
        campos["prioridade"] = input.prioridade
    if input.nota is not None:
        campos["nota"] = input.nota.strip()
    agora = datetime.now(timezone.utc).isoformat()
    if input.avaliacao_pedida:
        campos["avaliacao_pedida_em"] = agora
    if not campos:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    campos["atualizado_em"] = agora
    result = await db.lead_events.find_one_and_update(
        {"id": lead_id},
        {"$set": campos},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Atendimento nao encontrado")
    await log_admin_action(actor, "Atendimento atualizado", {"id": lead_id, "campos": list(campos.keys())})
    return _lead_out(result)


class QuickReply(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=60)
    message: str = Field(min_length=1, max_length=500)


class QuickRepliesUpdate(BaseModel):
    items: list[QuickReply] = Field(max_length=30)


@api_router.get("/admin/quick-replies")
async def admin_get_quick_replies(request: Request):
    await require_permission(request, "atendimentos")
    saved = await db.site_settings.find_one({"key": "quick_replies"}, {"_id": 0, "items": 1})
    return {"items": (saved or {}).get("items", [])}


@api_router.put("/admin/quick-replies")
async def admin_save_quick_replies(input: QuickRepliesUpdate, request: Request):
    actor = await require_permission(request, "atendimentos")
    items = [item.model_dump() for item in input.items]
    if len({item["id"] for item in items}) != len(items):
        raise HTTPException(status_code=400, detail="Cada resposta precisa ter um identificador único")
    await db.site_settings.update_one(
        {"key": "quick_replies"},
        {"$set": {"items": items, "atualizado_em": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await log_admin_action(actor, "Respostas rápidas atualizadas", {"quantidade": len(items)})
    return {"items": items}


@api_router.get("/admin/leads/retornar")
async def admin_leads_retornar(request: Request, dias: int = 3):
    """Atendimentos 'em conversa' ou 'orcamento enviado' sem movimento ha
    `dias` dias ou mais. Mudar status ou editar a nota conta como movimento."""
    await require_permission(request, "atendimentos")
    dias = max(1, min(dias, 60))
    agora = datetime.now(timezone.utc)
    limite = (agora - timedelta(days=dias)).isoformat()
    filtro = {
        "status": {"$in": ["em_conversa", "orcamento_enviado"]},
        "$or": [
            {"atualizado_em": {"$lte": limite}},
            {"atualizado_em": {"$exists": False}, "timestamp": {"$lte": limite}},
        ],
    }
    itens = await db.lead_events.find(filtro, {"_id": 0}).to_list(200)
    for it in itens:
        ref = it.get("atualizado_em") or it["timestamp"]
        it["parado_ha_dias"] = (agora - datetime.fromisoformat(ref)).days
    itens.sort(key=lambda x: -x["parado_ha_dias"])
    return {"total": len(itens), "itens": itens[:50]}


# --- Aviso editavel no topo do site (feriado, horario especial, promocao) ---
class AvisoIn(BaseModel):
    ativo: bool = False
    texto: str = Field(default="", max_length=200)
    tipo: Literal["info", "alerta", "promo"] = "info"
    # data (AAAA-MM-DD) em que o aviso some sozinho; vazio = sem prazo
    expira_em: str = Field(default="", pattern=r"^(\d{4}-\d{2}-\d{2})?$")


async def _aviso_doc() -> dict:
    doc = await db.site_settings.find_one({"key": "aviso"}, {"_id": 0})
    return doc or {
        "key": "aviso",
        "ativo": False,
        "texto": "",
        "tipo": "info",
        "expira_em": "",
    }


@api_router.get("/aviso")
async def aviso_publico(response: Response):
    doc = await _aviso_doc()
    hoje = datetime.now(BR_TZ).strftime("%Y-%m-%d")
    expira = doc.get("expira_em") or ""
    texto = (doc.get("texto") or "").strip()
    if not doc.get("ativo") or not texto or (expira and expira < hoje):
        return {"ativo": False}
    response.headers["Cache-Control"] = "public, max-age=60"
    return {"ativo": True, "texto": texto, "tipo": doc.get("tipo", "info")}


@api_router.get("/admin/aviso")
async def admin_aviso(request: Request):
    await require_permission(request, "aviso")
    return await _aviso_doc()


@api_router.put("/admin/aviso")
async def admin_salvar_aviso(input: AvisoIn, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "aviso")
    texto = input.texto.strip()
    if input.ativo and not texto:
        raise HTTPException(
            status_code=400, detail="Escreva o texto do aviso antes de ativar"
        )
    doc = {
        "key": "aviso",
        **input.model_dump(),
        "texto": texto,
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
    }
    await db.site_settings.update_one({"key": "aviso"}, {"$set": doc}, upsert=True)
    await log_admin_action(actor, "Aviso do site atualizado", {"ativo": input.ativo})
    return doc


# --- Modo manutencao: pop-up que bloqueia o site inteiro ate ser desativado ---
MANUTENCAO_PADRAO = {
    "ativo": False,
    "titulo": "Site em manutenção",
    "mensagem": "Estamos fazendo melhorias no site para atender você ainda melhor. Voltamos em breve!",
    "mostrar_whatsapp": True,
}


class ManutencaoIn(BaseModel):
    ativo: bool = False
    titulo: str = Field(default=MANUTENCAO_PADRAO["titulo"], max_length=80)
    mensagem: str = Field(default=MANUTENCAO_PADRAO["mensagem"], max_length=400)
    mostrar_whatsapp: bool = True


async def _manutencao_doc() -> dict:
    doc = await db.site_settings.find_one({"key": "manutencao"}, {"_id": 0}) or {}
    return {**MANUTENCAO_PADRAO, **{k: doc[k] for k in MANUTENCAO_PADRAO if k in doc}}


@api_router.get("/manutencao")
async def manutencao_publico(response: Response):
    # sem cache: ao ativar/desativar no painel, o efeito precisa ser imediato
    response.headers["Cache-Control"] = "no-store"
    doc = await _manutencao_doc()
    if not doc["ativo"]:
        return {"ativo": False}
    return {
        "ativo": True,
        "titulo": (doc["titulo"] or "").strip() or MANUTENCAO_PADRAO["titulo"],
        "mensagem": (doc["mensagem"] or "").strip() or MANUTENCAO_PADRAO["mensagem"],
        "mostrar_whatsapp": bool(doc["mostrar_whatsapp"]),
    }


@api_router.get("/admin/manutencao")
async def admin_manutencao(request: Request):
    await require_permission(request, "aviso")
    return await _manutencao_doc()


@api_router.put("/admin/manutencao")
async def admin_salvar_manutencao(input: ManutencaoIn, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "aviso")
    doc = {
        "key": "manutencao",
        "ativo": input.ativo,
        "titulo": input.titulo.strip() or MANUTENCAO_PADRAO["titulo"],
        "mensagem": input.mensagem.strip() or MANUTENCAO_PADRAO["mensagem"],
        "mostrar_whatsapp": input.mostrar_whatsapp,
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
    }
    await db.site_settings.update_one({"key": "manutencao"}, {"$set": doc}, upsert=True)
    await log_admin_action(
        actor,
        "Modo manutenção ativado" if input.ativo else "Modo manutenção desativado",
        {"ativo": input.ativo},
    )
    return {k: doc[k] for k in MANUTENCAO_PADRAO}


SITE_DEFAULTS = {
    "whatsapp": "5527998682220",
    "whatsapp_display": "(27) 99868-2220",
    "horario": "Segunda a Quinta · 08:00 às 18:00\nSexta-feira · 08:00 às 17:00",
}


@api_router.get("/site-config")
async def public_site_config():
    doc = await db.site_settings.find_one({"key": "contato"}, {"_id": 0}) or {}
    return {**SITE_DEFAULTS, **{k: doc[k] for k in SITE_DEFAULTS if k in doc}}


class SiteConfigIn(BaseModel):
    whatsapp: str = Field(min_length=10, max_length=20)
    whatsapp_display: str = Field(min_length=5, max_length=30)
    horario: str = Field(min_length=3, max_length=300)


@api_router.put("/admin/site-config")
async def admin_save_site_config(input: SiteConfigIn, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "contato")
    doc = {"key": "contato", **input.model_dump(), "atualizado_em": datetime.now(timezone.utc).isoformat()}
    doc["whatsapp"] = re.sub(r"\D", "", doc["whatsapp"])
    if len(doc["whatsapp"]) < 10:
        raise HTTPException(status_code=400, detail="Informe o telefone com DDD")
    await db.site_settings.update_one({"key": "contato"}, {"$set": doc}, upsert=True)
    await log_admin_action(actor, "Contato e horário atualizados")
    return {k: doc[k] for k in SITE_DEFAULTS}


@api_router.get("/projetos")
async def public_projects():
    doc = await db.site_settings.find_one({"key": "projetos"}, {"_id": 0, "items": 1})
    items = (doc or {}).get("items", [])
    hoje = datetime.now(BR_TZ).strftime("%Y-%m-%d")
    def destaque_ativo(item):
        inicio = item.get("featured_from") or ""
        fim = item.get("featured_until") or "9999-12-31"
        return bool(item.get("featured")) and inicio <= hoje <= fim
    items = sorted(items, key=lambda item: (not destaque_ativo(item), item.get("order", 0)))
    return {"items": items, "configurado": doc is not None}


@api_router.get("/imagens-sobre")
async def public_about_images():
    images_dir = ROOT_DIR.parent / "frontend" / "public" / "imagens"
    if not images_dir.is_dir():
        return {"items": []}

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
    photos = sorted(
        (
            path for path in images_dir.iterdir()
            if path.is_file() and not path.is_symlink() and path.suffix.lower() in extensions
        ),
        key=lambda path: path.name.casefold(),
    )
    return {
        "items": [
            {
                "src": f"/imagens/{quote(path.name)}",
                "alt": f"Foto da Aluminito: {path.stem.replace('-', ' ').replace('_', ' ')}",
            }
            for path in photos
        ]
    }


class ProjectsIn(BaseModel):
    items: list[dict] = Field(max_length=100)
    baseline_items: list[dict] = Field(default_factory=list, max_length=100)


@api_router.put("/admin/projetos")
async def admin_save_projects(input: ProjectsIn, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "projetos")
    items = []
    for index, item in enumerate(input.items):
        title = str(item.get("title", "")).strip()[:120]
        category = str(item.get("cat", "")).strip()[:80]
        description = str(item.get("description", "")).strip()[:400]
        media = item.get("media", [])
        if not title or not category or not isinstance(media, list) or len(media) > 100:
            raise HTTPException(status_code=400, detail="Revise o título, categoria e mídias dos projetos")
        clean_media = []
        for entry in media:
            src = str(entry.get("src", ""))
            projeto_estatico = src.startswith("/projects/") and ".." not in Path(src).parts
            arquivo_enviado = re.fullmatch(r"/api/media/[a-f0-9]{32}\.(jpg|jpeg|png|webp|mp4|webm)", src)
            if not (projeto_estatico or arquivo_enviado):
                raise HTTPException(status_code=400, detail="Mídia de projeto inválida")
            kind = entry.get("type")
            if kind not in {"image", "video"}:
                raise HTTPException(status_code=400, detail="Tipo de mídia inválido")
            clean_media.append({"type": kind, "src": src})
        if not clean_media:
            raise HTTPException(status_code=400, detail="Cada projeto precisa de ao menos uma foto ou vídeo")
        inicio = str(item.get("featured_from") or "")
        fim = str(item.get("featured_until") or "")
        if any(v and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) for v in (inicio, fim)) or (inicio and fim and fim < inicio):
            raise HTTPException(status_code=400, detail="Revise o período do destaque")
        destaque = bool(item.get("featured", False))
        if destaque and not fim:
            raise HTTPException(status_code=400, detail="Defina uma data final para o destaque")
        items.append({"id": str(item.get("id") or uuid.uuid4()), "cat": category, "title": title, "description": description, "media": clean_media, "tall": bool(item.get("tall", False)), "order": index, "featured": destaque, "featured_from": inicio, "featured_until": fim})
    baseline = input.baseline_items[:100]
    await db.site_settings.update_one({"key": "projetos_draft"}, {"$set": {"items": items, "baseline_items": baseline, "atualizado_em": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await log_admin_action(actor, "Rascunho de obras salvo", {"quantidade": len(items)})
    return {"items": items}


@api_router.get("/admin/projetos/draft")
async def admin_get_projects_draft(request: Request):
    await require_permission(request, "projetos")
    draft = await db.site_settings.find_one({"key": "projetos_draft"}, {"_id": 0, "items": 1})
    published = await db.site_settings.find_one({"key": "projetos"}, {"_id": 0, "items": 1})
    return {"items": (draft or published or {}).get("items", []), "baseline_items": (published or {}).get("items", (draft or {}).get("baseline_items", [])), "rascunho": draft is not None, "configurado": draft is not None or published is not None}


@api_router.get("/admin/projetos/metrics")
async def admin_project_metrics(request: Request, dias: int = 30):
    await require_permission(request, "projetos")
    dias = max(1, min(dias, 365))
    since = (datetime.now(timezone.utc).date() - timedelta(days=dias - 1)).isoformat()
    rows = await db.project_metrics.aggregate([
        {"$match": {"day": {"$gte": since}}},
        {"$group": {
            "_id": "$project_id",
            "title": {"$last": "$title"},
            "visualizacoes": {"$sum": {"$ifNull": ["$views", 0]}},
            "pedidos": {"$sum": {"$ifNull": ["$quotes", 0]}},
        }},
        {"$sort": {"visualizacoes": -1}},
    ]).to_list(500)
    return [{"project_id": row["_id"], "title": row.get("title", ""), "visualizacoes": row["visualizacoes"], "pedidos": row["pedidos"]} for row in rows]


@api_router.post("/admin/projetos/publicar")
async def admin_publish_projects(request: Request):
    actor = await require_permission(request, "projetos")
    draft = await db.site_settings.find_one({"key": "projetos_draft"}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=400, detail="Salve um rascunho antes de publicar")
    old = await db.site_settings.find_one({"key": "projetos"}, {"_id": 0}) or {"items": draft.get("baseline_items", [])}
    old_by_id = {str(p.get("id")): p for p in old.get("items", [])}
    new_by_id = {str(p.get("id")): p for p in draft.get("items", [])}
    agora = datetime.now(timezone.utc).isoformat()
    for project_id, project in old_by_id.items():
        if project_id not in new_by_id:
            await db.site_trash.insert_one({"id": str(uuid.uuid4()), "kind": "project", "title": project.get("title", "Obra"), "data": project, "deleted_at": agora, "deleted_by": actor["email"]})
            continue
        old_media = project.get("media", [])
        new_media = {(m.get("type"), m.get("src")) for m in new_by_id[project_id].get("media", [])}
        for media in old_media:
            if (media.get("type"), media.get("src")) not in new_media:
                await db.site_trash.insert_one({"id": str(uuid.uuid4()), "kind": "media", "title": f"Mídia — {project.get('title', 'Obra')}", "project_id": project_id, "data": media, "deleted_at": agora, "deleted_by": actor["email"]})
    await db.site_settings.update_one({"key": "projetos"}, {"$set": {"items": draft.get("items", []), "atualizado_em": agora}}, upsert=True)
    await db.site_settings.delete_one({"key": "projetos_draft"})
    await log_admin_action(actor, "Galeria publicada", {"quantidade": len(draft.get("items", []))})
    return {"ok": True, "items": draft.get("items", [])}


@api_router.get("/catalogo/cores")
async def public_catalog_colors():
    doc = await db.site_settings.find_one({"key": "catalogo_cores"}, {"_id": 0, "items": 1})
    return {"items": (doc or {}).get("items", [])}


class CatalogColorsIn(BaseModel):
    items: list[dict] = Field(max_length=200)


@api_router.put("/admin/catalogo/cores")
async def admin_save_catalog_colors(input: CatalogColorsIn, request: Request):
    validate_origin(request)
    actor = await require_permission(request, "catalogo")
    items = []
    for item in input.items:
        arquivo = str(item.get("arq", ""))
        if not re.fullmatch(r"[A-Za-z0-9._-]{1,120}\.(jpg|jpeg|png|webp)", arquivo, re.I):
            raise HTTPException(status_code=400, detail="Arquivo de cor inválido")
        items.append({"arq": arquivo, "ativo": bool(item.get("ativo", True)), "mais_pedida": bool(item.get("mais_pedida", False))})
    await db.site_settings.update_one({"key": "catalogo_cores_draft"}, {"$set": {"items": items, "atualizado_em": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await log_admin_action(actor, "Rascunho do catálogo salvo", {"quantidade": len(items)})
    return {"items": items}


@api_router.get("/admin/catalogo/cores/draft")
async def admin_get_catalog_draft(request: Request):
    await require_permission(request, "catalogo")
    draft = await db.site_settings.find_one({"key": "catalogo_cores_draft"}, {"_id": 0, "items": 1})
    published = await db.site_settings.find_one({"key": "catalogo_cores"}, {"_id": 0, "items": 1})
    return {"items": (draft or published or {}).get("items", []), "rascunho": draft is not None}


@api_router.post("/admin/catalogo/cores/publicar")
async def admin_publish_catalog(request: Request):
    actor = await require_permission(request, "catalogo")
    draft = await db.site_settings.find_one({"key": "catalogo_cores_draft"}, {"_id": 0})
    if not draft:
        raise HTTPException(status_code=400, detail="Salve um rascunho antes de publicar")
    await db.site_settings.update_one({"key": "catalogo_cores"}, {"$set": {"items": draft.get("items", []), "atualizado_em": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await db.site_settings.delete_one({"key": "catalogo_cores_draft"})
    await log_admin_action(actor, "Catálogo publicado", {"quantidade": len(draft.get("items", []))})
    return {"ok": True}


@api_router.get("/admin/trash")
async def admin_list_trash(request: Request, limit: int = 200):
    await require_permission(request, "lixeira")
    rows = await db.site_trash.find({}, {"_id": 0}).sort("deleted_at", -1).to_list(max(1, min(limit, 500)))
    return rows


@api_router.post("/admin/trash/{trash_id}/restore")
async def admin_restore_trash(trash_id: str, request: Request):
    actor = await require_permission(request, "lixeira")
    entry = await db.site_trash.find_one({"id": trash_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Item não encontrado na lixeira")
    if entry["kind"] == "review":
        if not await db.reviews.find_one({"id": entry["data"]["id"]}):
            await db.reviews.insert_one(entry["data"])
    else:
        doc = await db.site_settings.find_one({"key": "projetos"}, {"_id": 0}) or {"items": []}
        items = doc.get("items", [])
        if entry["kind"] == "project":
            if not any(p.get("id") == entry["data"].get("id") for p in items):
                items.append(entry["data"])
        elif entry["kind"] == "media":
            project = next((p for p in items if p.get("id") == entry.get("project_id")), None)
            if not project:
                raise HTTPException(status_code=409, detail="Restaure a obra primeiro")
            if not any(m.get("src") == entry["data"].get("src") for m in project.get("media", [])):
                project.setdefault("media", []).append(entry["data"])
        else:
            raise HTTPException(status_code=400, detail="Tipo de item inválido")
        for index, project in enumerate(items):
            project["order"] = index
        await db.site_settings.update_one({"key": "projetos"}, {"$set": {"items": items, "atualizado_em": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await db.site_trash.delete_one({"id": trash_id})
    await log_admin_action(actor, "Item restaurado da lixeira", {"tipo": entry["kind"], "item": entry.get("title")})
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


def create_access_token(user_id: str, email: str, session_id: str | None = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
        "sid": session_id,
    }
    return jwt.encode(
        payload, get_jwt_secret(), algorithm=JWT_ALGORITHM
    )


def create_refresh_token(user_id: str, session_id: str | None = None) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_DAYS),
        "type": "refresh",
        "sid": session_id,
    }
    return jwt.encode(
        payload, get_jwt_secret(), algorithm=JWT_ALGORITHM
    )


def set_auth_cookies(response: Response, user_id: str, email: str, session_id: str | None = None) -> None:
    response.set_cookie(
        "access_token",
        create_access_token(user_id, email, session_id),
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        create_refresh_token(user_id, session_id),
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
    role = user.get("role", "admin")
    if role == "admin":  # Compatibilidade com contas criadas antes dos cargos novos.
        role = "chefe"
    defaults = {
        "chefe": ["atendimentos", "relatorios", "avaliacoes", "aviso", "contato", "projetos", "catalogo", "usuarios", "permissoes", "auditoria", "lixeira"],
        "gerente": ["atendimentos", "relatorios", "avaliacoes", "aviso", "contato", "projetos", "catalogo", "lixeira"],
        "atendente": ["atendimentos"],
    }
    permissions = defaults["chefe"] if role == "chefe" else user.get("permissions", defaults.get(role, defaults["atendente"]))
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", "Admin"),
        "role": role if role in {"chefe", "gerente", "atendente"} else "atendente",
        "permissions": permissions,
        "active": user.get("active", True),
    }


async def user_from_payload(payload: dict) -> dict:
    try:
        user_id = ObjectId(payload.get("sub", ""))
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("active", True):
        raise HTTPException(status_code=401, detail="Usuario nao encontrado")
    return user_public(user)


async def create_admin_session(user_id: str, request: Request) -> str:
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    await db.admin_sessions.insert_one({
        "id": session_id,
        "user_id": user_id,
        "created_at": now.isoformat(),
        "last_seen": now.isoformat(),
        "expires_at": now + timedelta(days=REFRESH_TOKEN_DAYS),
        "ip": client_identifier(request),
        "user_agent": request.headers.get("user-agent", "")[:200],
    })
    return session_id


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
    payload = decode_token(token, "access")
    user = await user_from_payload(payload)
    session_id = payload.get("sid")
    if session_id and not await db.admin_sessions.find_one({"id": session_id, "user_id": user["id"]}):
        raise HTTPException(status_code=401, detail="Sessao encerrada")
    return user


async def require_admin(request: Request) -> dict:
    return await require_permission(request, "projetos")


async def require_chief(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in {"chefe", "admin"}:
        raise HTTPException(status_code=403, detail="Acesso restrito ao chefe")
    return user


async def require_permission(request: Request, permission: str) -> dict:
    user = await get_current_user(request)
    if permission not in user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Você não tem permissão para esta função")
    return user


async def log_admin_action(actor: dict, action: str, details: dict | None = None) -> None:
    await db.admin_audit.insert_one({
        "id": str(uuid.uuid4()), "actor_id": actor["id"],
        "actor_name": actor.get("name", actor.get("email", "Usuário")),
        "actor_email": actor.get("email", ""), "action": action,
        "details": details or {}, "timestamp": datetime.now(timezone.utc).isoformat(),
    })


ADMIN_PERMISSION_KEYS = ["atendimentos", "relatorios", "avaliacoes", "aviso", "contato", "projetos", "catalogo", "lixeira", "auditoria"]


class UserPermissionsIn(BaseModel):
    permissions: list[str] = Field(max_length=20)


class RolePermissionsIn(BaseModel):
    roles: dict[str, list[str]]


@api_router.get("/admin/role-permissions")
async def admin_get_role_permissions(request: Request):
    await require_permission(request, "permissoes")
    saved = await db.site_settings.find_one({"key": "role_permissions"}, {"_id": 0, "roles": 1})
    defaults = {
        "gerente": ["atendimentos", "relatorios", "avaliacoes", "aviso", "contato", "projetos", "catalogo", "lixeira"],
        "atendente": ["atendimentos"],
    }
    saved_roles = (saved or {}).get("roles") or {}
    return {"roles": {role: saved_roles.get(role, default) for role, default in defaults.items()}}


@api_router.put("/admin/role-permissions")
async def admin_save_role_permissions(input: RolePermissionsIn, request: Request):
    actor = await require_permission(request, "permissoes")
    if set(input.roles) != {"gerente", "atendente"}:
        raise HTTPException(status_code=400, detail="Configure gerente e atendente")
    roles = {}
    for role, values in input.roles.items():
        if len(values) != len(set(values)) or any(p not in ADMIN_PERMISSION_KEYS for p in values):
            raise HTTPException(status_code=400, detail="A configuração inclui uma permissão inválida")
        if role == "gerente" and "atendimentos" not in values:
            raise HTTPException(status_code=400, detail="O gerente precisa manter acesso aos atendimentos")
        if role == "atendente" and "atendimentos" not in values:
            raise HTTPException(status_code=400, detail="O atendente precisa manter acesso aos atendimentos")
        roles[role] = sorted(set(values))
    await db.site_settings.update_one({"key": "role_permissions"}, {"$set": {"roles": roles, "atualizado_em": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    for role, permissions in roles.items():
        await db.users.update_many({"role": role}, {"$set": {"permissions": permissions}})
    await log_admin_action(actor, "Permissões por cargo atualizadas", {"cargos": list(roles)})
    return {"roles": roles}


@api_router.patch("/admin/users/{user_id}/permissions")
async def admin_update_user_permissions(user_id: str, input: UserPermissionsIn, request: Request):
    actor = await require_permission(request, "permissoes")
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    role = "chefe" if target.get("role") == "admin" else target.get("role", "atendente")
    if role == "chefe":
        raise HTTPException(status_code=400, detail="As permissões do chefe são fixas")
    if len(set(input.permissions)) != len(input.permissions) or any(p not in ADMIN_PERMISSION_KEYS for p in input.permissions):
        raise HTTPException(status_code=400, detail="A lista contém uma permissão inválida")
    allowed = sorted(set(input.permissions))
    await db.users.update_one({"_id": oid}, {"$set": {"permissions": allowed}})
    await log_admin_action(actor, "Permissões alteradas", {"usuário": target["email"], "permissões": allowed})
    return {"id": user_id, "permissions": allowed}


@api_router.get("/admin/audit")
async def admin_audit_log(request: Request, limit: int = 100):
    await require_permission(request, "auditoria")
    limit = max(1, min(limit, 300))
    rows = await db.admin_audit.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return rows


def safe_upload_name(filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"}:
        raise HTTPException(status_code=400, detail="Formato não permitido")
    return f"{uuid.uuid4().hex}{suffix}"


@api_router.get("/media/{filename}")
async def public_media(filename: str):
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    path = UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(path)


@api_router.post("/admin/media", status_code=201)
async def upload_media(request: Request, file: UploadFile = File(...)):
    validate_origin(request)
    actor = await require_permission(request, "projetos")
    filename = safe_upload_name(file.filename or "")
    content = await file.read(30 * 1024 * 1024 + 1)
    if not content or len(content) > 30 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Arquivo vazio ou maior que 30 MB")
    (UPLOAD_DIR / filename).write_bytes(content)
    await log_admin_action(actor, "Mídia enviada", {"arquivo": filename, "bytes": len(content)})
    return {"url": f"/api/media/{filename}", "filename": filename}


class LoginRequest(BaseModel):
    email: str
    password: str


class PasswordChange(BaseModel):
    senha_atual: str = Field(min_length=1, max_length=200)
    senha_nova: str = Field(min_length=10, max_length=200)


class UserCreate(BaseModel):
    email: str = Field(min_length=5, max_length=200)
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=10, max_length=200)
    role: Literal["chefe", "gerente", "atendente"] = "atendente"


@api_router.post("/auth/change-password")
async def auth_change_password(input: PasswordChange, request: Request):
    validate_origin(request)
    user = await get_current_user(request)
    doc = await db.users.find_one({"email": user["email"]})
    if not doc or not verify_password(input.senha_atual, doc.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    if input.senha_atual == input.senha_nova:
        raise HTTPException(status_code=400, detail="Escolha uma senha diferente da atual")
    await db.users.update_one({"_id": doc["_id"]}, {"$set": {"password_hash": hash_password(input.senha_nova)}})
    await log_admin_action(user, "Senha alterada")
    return {"ok": True}


@api_router.get("/admin/users")
async def admin_list_users(request: Request):
    await require_permission(request, "usuarios")
    users = await db.users.find({}, {"email": 1, "name": 1, "role": 1, "permissions": 1, "active": 1}).to_list(200)
    return [{**user_public(u), "id": str(u["_id"])} for u in users]


@api_router.post("/admin/users", status_code=201)
async def admin_create_user(input: UserCreate, request: Request):
    actor = await require_permission(request, "usuarios")
    if input.role == "chefe" and actor.get("role") not in {"chefe", "admin"}:
        raise HTTPException(status_code=403, detail="Somente o chefe pode criar outro chefe")
    email = input.email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=400, detail="E-mail inválido")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Já existe um usuário com esse e-mail")
    user = {"email": email, "name": input.name.strip(), "role": input.role, "active": True, "password_hash": hash_password(input.password), "created_at": datetime.now(timezone.utc).isoformat()}
    if input.role != "chefe":
        saved = await db.site_settings.find_one({"key": "role_permissions"}, {"_id": 0, "roles": 1})
        if (saved or {}).get("roles", {}).get(input.role) is not None:
            user["permissions"] = saved["roles"][input.role]
    result = await db.users.insert_one(user)
    await log_admin_action(actor, "Usuário criado", {"email": email, "cargo": user["role"]})
    return {"id": str(result.inserted_id), "email": email, "name": user["name"], "role": user["role"]}


@api_router.delete("/admin/users/{user_id}", status_code=204)
async def admin_delete_user(user_id: str, request: Request):
    current = await require_permission(request, "usuarios")
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user_id == current["id"]:
        raise HTTPException(status_code=400, detail="Você não pode remover seu próprio acesso")
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.get("role") in {"admin", "chefe"} and current.get("role") not in {"chefe", "admin"}:
        raise HTTPException(status_code=403, detail="Somente o chefe pode remover outro chefe")
    if user.get("role") in {"admin", "chefe"} and await db.users.count_documents({"role": {"$in": ["admin", "chefe"]}}) <= 1:
        raise HTTPException(status_code=400, detail="Mantenha ao menos um chefe")
    await db.users.delete_one({"_id": oid})
    await db.admin_sessions.delete_many({"user_id": user_id})
    await log_admin_action(current, "Usuário removido", {"email": user["email"], "cargo": user.get("role")})
    return None


class UserActiveUpdate(BaseModel):
    active: bool


@api_router.patch("/admin/users/{user_id}/active")
async def admin_set_user_active(user_id: str, input: UserActiveUpdate, request: Request):
    actor = await require_chief(request)
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user_id == actor["id"]:
        raise HTTPException(status_code=400, detail="Você não pode desativar seu próprio acesso")
    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not input.active and target.get("role") in {"admin", "chefe"}:
        active_chiefs = await db.users.count_documents({"role": {"$in": ["admin", "chefe"]}, "active": {"$ne": False}})
        if active_chiefs <= 1:
            raise HTTPException(status_code=400, detail="Mantenha ao menos um chefe ativo")
    await db.users.update_one({"_id": oid}, {"$set": {"active": input.active}})
    if not input.active:
        await db.admin_sessions.delete_many({"user_id": user_id})
    await log_admin_action(actor, "Acesso de usuário atualizado", {"email": target["email"], "ativo": input.active})
    return {"id": user_id, "active": input.active}


@api_router.get("/admin/sessions")
async def admin_list_sessions(request: Request):
    await require_chief(request)
    now = datetime.now(timezone.utc)
    sessions = await db.admin_sessions.find({"expires_at": {"$gt": now}}, {"_id": 0}).sort("last_seen", -1).to_list(500)
    user_ids = list({s["user_id"] for s in sessions})
    users = await db.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]}}, {"name": 1, "email": 1, "role": 1}).to_list(500)
    by_id = {str(user["_id"]): user for user in users}
    return [{
        "id": s["id"], "created_at": s.get("created_at"), "last_seen": s.get("last_seen"),
        "user_agent": s.get("user_agent", ""), "ip": s.get("ip", ""),
        "user": {"id": s["user_id"], "name": by_id.get(s["user_id"], {}).get("name", "Usuário"), "email": by_id.get(s["user_id"], {}).get("email", ""), "role": by_id.get(s["user_id"], {}).get("role", "")},
    } for s in sessions]


@api_router.delete("/admin/sessions/{session_id}", status_code=204)
async def admin_revoke_session(session_id: str, request: Request):
    actor = await require_chief(request)
    session = await db.admin_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    await db.admin_sessions.delete_one({"id": session_id})
    await log_admin_action(actor, "Sessão encerrada", {"usuário_id": session.get("user_id")})
    return None


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
    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Este acesso está desativado. Fale com o chefe do painel.")
    await db.login_attempts.delete_many({"identifier": identifier})
    user_id = str(user["_id"])
    session_id = await create_admin_session(user_id, request)
    set_auth_cookies(response, user_id, email, session_id)
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
    payload = decode_token(token, "refresh")
    user = await user_from_payload(payload)
    session_id = payload.get("sid")
    if session_id:
        session = await db.admin_sessions.find_one({"id": session_id, "user_id": user["id"]})
        if not session:
            raise HTTPException(status_code=401, detail="Sessao encerrada")
        now = datetime.now(timezone.utc)
        await db.admin_sessions.update_one({"id": session_id}, {"$set": {"last_seen": now.isoformat(), "expires_at": now + timedelta(days=REFRESH_TOKEN_DAYS)}})
    else:
        # Migra sessões abertas antes da implementação do controle de dispositivos.
        session_id = await create_admin_session(user["id"], request)
    set_auth_cookies(response, user["id"], user["email"], session_id)
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    validate_origin(request)
    await get_current_user(request)
    token = request.cookies.get("access_token", "")
    if token:
        session_id = decode_token(token, "access").get("sid")
        if session_id:
            await db.admin_sessions.delete_one({"id": session_id})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


def _cor_label(arq: str) -> str:
    stem = arq.rsplit(".", 1)[0]
    stem = re.sub(r"^COD\.\d+-", "", stem)
    stem = re.sub(r"-(FO|BR|UF|SF)$", "", stem)
    return stem.replace("-", " ").title()


@api_router.get("/admin/stats")
async def admin_stats(request: Request, periodo: str = "mes"):
    await require_permission(request, "relatorios")
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
    por_status = {s: 0 for s in LEAD_STATUS}
    por_motivo_perda = {}
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
        st = ev.get("status") if ev.get("status") in por_status else "novo"
        por_status[st] += 1
        if st == "perdido":
            motivo = ev.get("motivo_perda") or "nao_informado"
            por_motivo_perda[motivo] = por_motivo_perda.get(motivo, 0) + 1

    # Cores mais simuladas no periodo
    simulacoes = {"total": 0, "cores": [], "tipos": []}
    try:
        linhas = (
            await db.simulation_events.aggregate(
                [
                    {"$match": {"timestamp": {"$gte": inicio.isoformat()}}},
                    {
                        "$group": {
                            "_id": {"cor": "$cor_arq", "tipo": "$tipo"},
                            "total": {"$sum": 1},
                            "nome": {"$first": "$cor_nome"},
                        }
                    },
                ]
            )
            .to_list(2000)
        )
        por_cor = {}
        por_tipo = {}
        for row in linhas:
            arq = row["_id"].get("cor") or ""
            tipo = row["_id"].get("tipo") or "outros"
            c = por_cor.setdefault(
                arq,
                {
                    "cor_arq": arq,
                    "cor_nome": row.get("nome") or arq,
                    "cor_label": _cor_label(arq),
                    "total": 0,
                    "tipos": {},
                },
            )
            c["total"] += row["total"]
            c["tipos"][tipo] = c["tipos"].get(tipo, 0) + row["total"]
            por_tipo[tipo] = por_tipo.get(tipo, 0) + row["total"]
        simulacoes = {
            "total": sum(por_tipo.values()),
            "cores": sorted(por_cor.values(), key=lambda c: -c["total"])[:10],
            "tipos": sorted(
                [{"tipo": k, "total": v} for k, v in por_tipo.items()],
                key=lambda x: -x["total"],
            ),
        }
    except Exception:
        logger.warning("Falha ao agregar simulacoes", exc_info=True)

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
        "por_status": por_status,
        "por_motivo_perda": sorted(
            [{"motivo": k, "total": v} for k, v in por_motivo_perda.items()],
            key=lambda item: -item["total"],
        ),
        "simulacoes": simulacoes,
        "ultimos": [_lead_out(e) for e in eventos[:20]],
    }


@app.on_event("startup")
async def seed_admin():
    await db.users.create_index("email", unique=True)
    await db.admin_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    try:  # indices de desempenho: nunca devem derrubar a inicializacao
        await db.lead_events.create_index("timestamp")
        await db.lead_events.create_index("id")
        await db.simulation_events.create_index("timestamp")
        await db.project_metrics.create_index("day")
    except Exception:
        logger.warning("Nao foi possivel criar indices", exc_info=True)
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
                "role": "chefe",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info("Admin criado: %s", admin_email)


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
