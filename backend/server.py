from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

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
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await db.reviews.insert_one(review)
    return review


@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = (
        await db.reviews.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(100)
    )
    return reviews


# Simulador de cores com IA
import base64
import re

from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    ImageContent,
)


SIM_TIPOS = {
    "porta": {
        "base": "/app/frontend/public/projects/porta-branca.jpg",
        "desc": "aluminum entrance door with a large glass panel",
    },
    "janela": {
        "base": "/app/frontend/public/projects/janela-correr-branca.jpg",
        "desc": "aluminum sliding window",
    },
    "outros": {
        "base": "/app/frontend/public/projects/porta-duas-folhas-1.jpg",
        "desc": (
            "aluminum sliding door (porta de correr) with large glass "
            "panels and a slatted aluminum panel"
        ),
    },
    "persiana": {
        "base": "/app/backend/base_persiana.jpg",
        "desc": (
            "aluminum venetian blind (persiana) covering a window "
            "in a modern interior"
        ),
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


# Registra as rotas
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configuração de logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()