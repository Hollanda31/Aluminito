import asyncio
import csv
import io
import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Literal, Optional
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import base64
import re

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
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
    cor_path = os.path.join(SIM_CORES_DIR, cor_arq)
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
        arquivos = sorted(os.listdir(SIM_CORES_DIR))
    except OSError:
        return {"cores": []}
    return {
        "cores": [
            a for a in arquivos if _sim_cache_find(_sim_stem(tipo, a)) is not None
        ]
    }


class PrewarmRequest(BaseModel):
    top: int = Field(default=6, ge=1, le=20)
    tipos: List[str] = Field(default_factory=lambda: list(SIM_TIPOS))


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
    await get_current_user(request)
    tipos = [t for t in input.tipos if t in SIM_TIPOS]
    top = (
        await db.simulation_events.aggregate(
            [
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
    for c in top:
        arq = os.path.basename(c["_id"] or "")
        if not arq or not os.path.isfile(os.path.join(SIM_CORES_DIR, arq)):
            continue
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
    if combos:
        task = asyncio.create_task(_sim_prewarm_worker(combos))
        _SIM_BG_TASKS.add(task)
        task.add_done_callback(_SIM_BG_TASKS.discard)
    return {"agendadas": len(combos)}


# --- Rastreamento de atendimentos (cliques para o WhatsApp) ---
LEAD_STATUS = ["novo", "em_conversa", "orcamento_enviado", "fechado", "perdido"]
LeadStatus = Literal["novo", "em_conversa", "orcamento_enviado", "fechado", "perdido"]
DADOS_CAMPOS = (
    "nome",
    "telefone",
    "cidade",
    "tipo",
    "situacao",
    "medidas",
    "cor",
    "prazo",
    "obs",
)
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
                limpo[chave] = val.strip()[:400]
        return limpo


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


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    nota: Optional[str] = Field(default=None, max_length=500)
    # True = o botao "Pedir avaliacao" foi usado (guarda a data)
    avaliacao_pedida: Optional[bool] = None


def _lead_out(doc: dict) -> dict:
    doc.setdefault("status", "novo")
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
    await get_current_user(request)
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
    await get_current_user(request)
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
            "Categoria",
            "Item",
            "Origem",
            "Nome",
            "Telefone",
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
            ev.get("grupo"),
            ev.get("item"),
            ev.get("origem"),
            d.get("nome"),
            d.get("telefone"),
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
    await get_current_user(request)
    campos = {}
    if input.status is not None:
        campos["status"] = input.status
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
    return _lead_out(result)


@api_router.get("/admin/leads/retornar")
async def admin_leads_retornar(request: Request, dias: int = 3):
    """Atendimentos 'em conversa' ou 'orcamento enviado' sem movimento ha
    `dias` dias ou mais. Mudar status ou editar a nota conta como movimento."""
    await get_current_user(request)
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
    await get_current_user(request)
    return await _aviso_doc()


@api_router.put("/admin/aviso")
async def admin_salvar_aviso(input: AvisoIn, request: Request):
    validate_origin(request)
    await get_current_user(request)
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
    return doc


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


def _cor_label(arq: str) -> str:
    stem = arq.rsplit(".", 1)[0]
    stem = re.sub(r"^COD\.\d+-", "", stem)
    stem = re.sub(r"-(FO|BR|UF|SF)$", "", stem)
    return stem.replace("-", " ").title()


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
    por_status = {s: 0 for s in LEAD_STATUS}
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
        "simulacoes": simulacoes,
        "ultimos": [_lead_out(e) for e in eventos[:20]],
    }


@app.on_event("startup")
async def seed_admin():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    try:  # indices de desempenho: nunca devem derrubar a inicializacao
        await db.lead_events.create_index("timestamp")
        await db.lead_events.create_index("id")
        await db.simulation_events.create_index("timestamp")
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