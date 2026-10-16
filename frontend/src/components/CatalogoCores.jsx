import { useState } from "react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { waMessage } from "@/lib/site";

const PINTURA = [
    { nome: "Branco", codigo: "LI", arq: "BRANCO-LI-BR.jpg" },
    { nome: "Branco", codigo: "60312 MT", arq: "BRANCO-60312-MT-FO.jpg" },
    { nome: "Branco", codigo: "60409 PE", arq: "BRANCO-60409-PE-FO.jpg" },
    { nome: "Branco", codigo: "60617 LI", arq: "BRANCO-60617-LI-FO.jpg" },
    { nome: "Preto", codigo: "LI", arq: "PRETO-LI-FO.jpg" },
    { nome: "Preto Nero", codigo: "1005 MT", arq: "PRETO-NERO-1005-71524-MT-FO.jpg" },
    { nome: "Grafite", codigo: "10562 PE", arq: "GRAFITE-10562-PE-UF.jpg" },
    { nome: "Grafite Elegance", codigo: "11297 LI", arq: "GRAFITE-ELEGANCE-11297-LI-FO.jpg" },
    { nome: "Grafite Nero Industriale", codigo: "10621 MT", arq: "GRAFITE-NERO-INDUSTRIALE-10621-MT-FO.jpg" },
    { nome: "Grafite W", codigo: "RAL 7024 LI", arq: "GRAFITE-W-RAL-7024-LI-FO.jpg" },
    { nome: "Cinza Argila", codigo: "10916 PE", arq: "CINZA-ARGILA-10916-PE-SF.jpg" },
    { nome: "Cinza Concreto", codigo: "11301 MT", arq: "CINZA-CONCRETO-11301-MT-FO.jpg" },
    { nome: "Cinza Grigio Grafite", codigo: "10825 MT", arq: "CINZA-GRIGIO-GRAFITE-10825-MT-FO.jpg" },
    { nome: "Cinza Urbano", codigo: "11299 LI", arq: "CINZA-URBANO-11299-LI-FO.jpg" },
    { nome: "Cinza W", codigo: "RAL 9007 ME", arq: "CINZA-W-RAL-9007-ME-FO.jpg" },
    { nome: "Cinza W", codigo: "RAL 9023 ME", arq: "CINZA-W-RAL-9023-ME-FO.jpg" },
    { nome: "Bege Atacama", codigo: "21038 MT", arq: "BEGE-ATACAMA-21038-MT-FO.jpg" },
    { nome: "Bege Capuccino", codigo: "20998 PE", arq: "BEGE-CAPUCCINO-20998-PE-FO.jpg" },
    { nome: "Bege Dourado Aurora", codigo: "31792 PE", arq: "BEGE-DOURADO-AURORA-31792-PE-FO.jpg" },
    { nome: "Bege Papirus", codigo: "21042 LI", arq: "BEGE-PAPIRUS-21042-LI-FO.jpg" },
    { nome: "Bege Pirita", codigo: "20957 ME", arq: "BEGE-PIRITA-20957-ME-FO.jpg" },
    { nome: "Marrom Âmbar", codigo: "73466 LI", arq: "MARROM-AMBAR-73466-LI-FO.jpg" },
    { nome: "Marrom Bronze", codigo: "75202 LI", arq: "MARROM-BRONZE-75202-LI-FO.jpg" },
    { nome: "Marrom Bronze Avelã", codigo: "75204 LI", arq: "MARROM-BRONZE-AVELA-75204-LI-FO.jpg" },
    { nome: "Marrom Bronze Cacau", codigo: "75206 LI", arq: "MARROM-BRONZE-CACAU-75206-LI-FO.jpg" },
    { nome: "Marrom Corten", codigo: "73401 MT", arq: "MARROM-CORTEN-73401-MT-FO.jpg" },
    { nome: "Marrom Expresso", codigo: "75158 LI", arq: "MARROM-EXPRESSO-75158-LI-FO.jpg" },
    { nome: "Marrom Mesclado", codigo: "77180 MT", arq: "MARROM-MESCLADO-77180-MT-FO.jpg" },
    { nome: "Marrom Mesclado", codigo: "77181 MT", arq: "MARROM-MESCLADO-77181-MT-FO.png" },
    { nome: "Marrom Tiramissu", codigo: "75149 LI", arq: "MARROM-TIRAMISSU-75149-LI-FO.jpg" },
    { nome: "Marrom W", codigo: "RAL 8023 LI", arq: "MARROM-W-RAL-8023-LI-FO.jpg" },
    { nome: "Verde Ágata", codigo: "50608 ME", arq: "VERDE-AGATA-50608-ME-FO.jpg" },
    { nome: "Verde Alga", codigo: "50597 MT", arq: "VERDE-ALGA-50597-MT-FO.jpg" },
    { nome: "Verde Musgo", codigo: "50593 LI", arq: "VERDE-MUSGO-50593-LI-FO.jpg" },
    { nome: "Verde W", codigo: "7,5BG 3/2 MT", arq: "VERDE-W-75BG-3-2-MT-FO.jpg" },
    { nome: "Azul", codigo: "40423 MT", arq: "AZUL-40423-MT-FO.jpg" },
    { nome: "Azul Celeste", codigo: "40632 MT", arq: "AZUL-CELESTE-40632-MT-FO.jpg" },
    { nome: "Azul Glacial", codigo: "40599 ME", arq: "AZUL-GLACIAL-40599-ME-FO.jpg" },
    { nome: "Vermelho Rosé", codigo: "80207 PE", arq: "VERMELHO-ROSE-80207-PE-UF.jpg" },
    { nome: "Violeta Ametista", codigo: "35014 ME", arq: "VIOLETA-AMETISTA-35014-ME-FO.png" },
];

const MADEIRA = [
    { nome: "Cambará", codigo: "COD.01", arq: "COD.01-CAMBARA.webp" },
    { nome: "Cerejeira", codigo: "COD.02", arq: "COD.02-CEREJEIRA.webp" },
    { nome: "Corten Arch", codigo: "COD.03", arq: "COD.03-CORTEN-ARCH.webp" },
    { nome: "Corten Especial", codigo: "COD.04", arq: "COD.04-CORTEN-ESPECIAL.webp" },
    { nome: "Imbuia", codigo: "COD.05", arq: "COD.05-IMBUIA.webp" },
    { nome: "Jequitibá", codigo: "COD.06", arq: "COD.06-JEQUITIBA.webp" },
    { nome: "Linheiro Claro", codigo: "COD.07", arq: "COD.07-LINHEIRO-CLARO.webp" },
    { nome: "Peroba", codigo: "COD.08", arq: "COD.08-PEROBA.webp" },
    { nome: "Pinus", codigo: "COD.09", arq: "COD.09-PINUS.webp" },
    { nome: "Savana", codigo: "COD.10", arq: "COD.10-SAVANA.webp" },
    { nome: "Nogueira", codigo: "COD.11", arq: "COD.11-NOGUEIRA.webp" },
    { nome: "Cerejeira Real", codigo: "COD.12", arq: "COD.12-CEREJEIRA-REAL.webp" },
    { nome: "Córdoba", codigo: "COD.13", arq: "COD.13-CORDOBA.webp" },
    { nome: "Sucupira", codigo: "COD.14", arq: "COD.14-SUCUPIRA.webp" },
    { nome: "Carvalho Americano", codigo: "COD.15", arq: "COD.15-CARVALHO-AMERICANO.webp" },
    { nome: "Pinho", codigo: "COD.16", arq: "COD.16-PINHO.webp" },
    { nome: "Cedro", codigo: "COD.17", arq: "COD.17-CEDRO.webp" },
    { nome: "Angelim", codigo: "COD.18", arq: "COD.18-ANGELIM.webp" },
    { nome: "Pequiá", codigo: "COD.19", arq: "COD.19-PEQUIA.webp" },
    { nome: "Pátina", codigo: "COD.20", arq: "COD.20-PATINA.webp" },
];

const slug = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");

const TABS = [
    { id: "pintura", label: "Pintura Eletrostática" },
    { id: "madeira", label: "Efeito Madeira" },
];

export default function CatalogoCores() {
    const [tab, setTab] = useState("pintura");
    const lista = tab === "pintura" ? PINTURA : MADEIRA;

    return (
        <section id="cores" data-testid="catalogo-cores-section" className="bg-mist py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                            Catálogo de Cores
                        </p>
                        <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-graphite sm:text-4xl lg:text-[2.75rem]">
                            Escolha o acabamento do seu projeto.
                        </h2>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-slate-600 sm:text-base">
                        Pintura eletrostática e efeito madeira para os perfis
                        de alumínio — toque em uma cor para pedir orçamento
                        com ela.
                    </p>
                </Reveal>

                <div className="mt-10 flex flex-wrap gap-2" data-testid="cores-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            data-testid={`cores-tab-${t.id}`}
                            onClick={() => setTab(t.id)}
                            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                                tab === t.id
                                    ? "border-graphite bg-graphite text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-graphite/40 hover:text-graphite"
                            }`}
                        >
                            {t.label}
                            <span className="ml-2 text-xs opacity-60">
                                {t.id === "pintura" ? PINTURA.length : MADEIRA.length}
                            </span>
                        </button>
                    ))}
                </div>

                <div
                    data-testid="cores-grid"
                    className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                >
                    {lista.map((cor) => (
                        <a
                            key={cor.arq}
                            data-testid={`cor-card-${slug(cor.nome)}-${slug(cor.codigo)}`}
                            href={waMessage(
                                `Olá! Gostei da cor ${cor.nome} (${cor.codigo}) do catálogo de vocês e gostaria de um orçamento.`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-azul/60 hover:shadow-xl hover:shadow-azul/5"
                        >
                            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                <img
                                    src={`/cores/${cor.arq}`}
                                    alt={`Perfil de alumínio na cor ${cor.nome} ${cor.codigo}`}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-4">
                                <p className="font-display text-sm font-semibold text-graphite">
                                    {cor.nome}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">{cor.codigo}</p>
                            </div>
                        </a>
                    ))}
                </div>

                <Reveal className="mt-12 flex flex-col items-center gap-4 text-center">
                    <p className="text-xs text-slate-500">
                        Amostras do catálogo Metaperfil · Consulte a
                        disponibilidade da cor para o seu projeto.
                    </p>
                    <a
                        data-testid="cores-cta-whatsapp"
                        href={waMessage(
                            "Olá! Vi o catálogo de cores no site da Aluminito e quero ajuda para escolher o acabamento do meu projeto.",
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 rounded-full bg-azul px-7 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                    >
                        <WhatsAppIcon className="h-5 w-5" />
                        Falar sobre cores no WhatsApp
                    </a>
                </Reveal>
            </div>
        </section>
    );
}
