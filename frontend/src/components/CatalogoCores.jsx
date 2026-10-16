import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Blinds, DoorOpen, Frame, LayoutGrid, Wand2, X } from "lucide-react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { waMessage } from "@/lib/site";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

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

const TODAS = [...PINTURA, ...MADEIRA];

const TIPOS = [
    { id: "porta", nome: "Porta", desc: "Porta de alumínio com vidro", icon: DoorOpen },
    { id: "persiana", nome: "Persiana", desc: "Persiana de alumínio", icon: Blinds },
    { id: "janela", nome: "Janela", desc: "Janela de correr", icon: Frame },
    { id: "outros", nome: "Outros modelos", desc: "Esquadrias e envidraçamentos", icon: LayoutGrid },
];

const LOAD_MSGS = [
    "Analisando a cor escolhida...",
    "Aplicando na esquadria...",
    "Ajustando luz e reflexos...",
    "Finalizando a simulação...",
];

const slug = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");

const TABS = [
    { id: "pintura", label: "Pintura Eletrostática" },
    { id: "madeira", label: "Efeito Madeira" },
];

export default function CatalogoCores() {
    const [tab, setTab] = useState("pintura");
    const [cor, setCor] = useState(null);
    const [step, setStep] = useState("cor");
    const [tipo, setTipo] = useState(null);
    const [img, setImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const [msgIdx, setMsgIdx] = useState(0);

    const lista = tab === "pintura" ? PINTURA : MADEIRA;

    useEffect(() => {
        if (!loading) return;
        const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOAD_MSGS.length), 2600);
        return () => clearInterval(t);
    }, [loading]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && fechar();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const fechar = () => {
        setCor(null);
        setStep("cor");
        setTipo(null);
        setImg(null);
        setErro(null);
        setLoading(false);
    };

    const gerar = async (corSel, tipoSel) => {
        setLoading(true);
        setErro(null);
        setImg(null);
        setMsgIdx(0);
        try {
            const r = await fetch(`${BACKEND}/api/simular`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo: tipoSel,
                    cor_arq: corSel.arq,
                    cor_nome: corSel.nome,
                    acabamento: corSel.arq.startsWith("COD.") ? "madeira" : "pintura",
                }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.detail || "Falha ao gerar");
            setImg(d.image);
        } catch (e) {
            setErro("Não consegui gerar a simulação agora. Toque em tentar novamente.");
        } finally {
            setLoading(false);
        }
    };

    const escolherTipo = (t) => {
        setTipo(t);
        setStep("sim");
        gerar(cor, t);
    };

    const trocarCor = (c) => {
        if (loading || c.arq === cor.arq) return;
        setCor(c);
        gerar(c, tipo);
    };

    const tipoNome = TIPOS.find((t) => t.id === tipo)?.nome || "";

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
                        Toque em uma cor para ampliar e simular como ela fica
                        em portas, janelas, persianas e outras esquadrias.
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
                    {lista.map((c) => (
                        <button
                            key={c.arq}
                            data-testid={`cor-card-${slug(c.nome)}-${slug(c.codigo)}`}
                            onClick={() => {
                                setCor(c);
                                setStep("cor");
                            }}
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:border-azul/60 hover:shadow-xl hover:shadow-azul/5"
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                <img
                                    src={`/cores/${c.arq}`}
                                    alt={`Perfil de alumínio na cor ${c.nome} ${c.codigo}`}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-center text-[10px] font-semibold uppercase tracking-widest text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    Ampliar e simular
                                </span>
                            </div>
                            <div className="p-4">
                                <p className="font-display text-sm font-semibold text-graphite">{c.nome}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{c.codigo}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <Reveal className="mt-12 flex flex-col items-center gap-4 text-center">
                    <p className="text-xs text-slate-500">
                        Amostras do catálogo Metaperfil · Simulações geradas
                        por IA são ilustrativas.
                    </p>
                </Reveal>
            </div>

            <AnimatePresence>
                {cor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        data-testid="cor-sim-modal"
                        className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
                        onClick={fechar}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 40, opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                data-testid="cor-modal-close"
                                onClick={fechar}
                                aria-label="Fechar"
                                className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-azul"
                            >
                                <X size={18} />
                            </button>

                            {step === "cor" && (
                                <div>
                                    <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                        <img
                                            src={`/cores/${cor.arq}`}
                                            alt={`Cor ${cor.nome}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-azul">
                                            Cor selecionada
                                        </p>
                                        <h3 className="mt-1.5 font-display text-2xl font-bold text-graphite">
                                            {cor.nome}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">{cor.codigo}</p>
                                        <button
                                            data-testid="cor-btn-simular"
                                            onClick={() => setStep("tipo")}
                                            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-azul px-6 py-4 font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                                        >
                                            <Wand2 size={18} />
                                            Simular
                                        </button>
                                        <a
                                            data-testid="cor-btn-whatsapp"
                                            href={waMessage(
                                                `Olá! Gostei da cor ${cor.nome} (${cor.codigo}) do catálogo de vocês e gostaria de um orçamento.`,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-medium text-graphite transition-colors hover:border-azul/50"
                                        >
                                            <WhatsAppIcon className="h-4 w-4" />
                                            Pedir orçamento desta cor
                                        </a>
                                    </div>
                                </div>
                            )}

                            {step === "tipo" && (
                                <div className="p-6 sm:p-8">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-azul">
                                        Simulação · {cor.nome}
                                    </p>
                                    <h3 className="mt-1.5 font-display text-2xl font-bold text-graphite">
                                        O que você quer simular?
                                    </h3>
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        {TIPOS.map((t) => (
                                            <button
                                                key={t.id}
                                                data-testid={`sim-tipo-${t.id}`}
                                                onClick={() => escolherTipo(t.id)}
                                                className="group rounded-2xl border border-slate-200 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-azul/60 hover:shadow-lg"
                                            >
                                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-azul/10 text-azul transition-colors group-hover:bg-azul group-hover:text-white">
                                                    <t.icon size={22} strokeWidth={1.8} />
                                                </span>
                                                <p className="mt-3 font-display font-semibold text-graphite">{t.nome}</p>
                                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        data-testid="sim-back-cor"
                                        onClick={() => setStep("cor")}
                                        className="mt-6 text-sm font-medium text-slate-500 transition-colors hover:text-azul"
                                    >
                                        ← Voltar para a cor
                                    </button>
                                </div>
                            )}

                            {step === "sim" && (
                                <div>
                                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                                        <img
                                            src={`/cores/${cor.arq}`}
                                            alt={cor.nome}
                                            className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                                        />
                                        <div>
                                            <p className="font-display text-sm font-bold text-graphite">
                                                {tipoNome} · {cor.nome}
                                            </p>
                                            <p className="text-xs text-slate-500">{cor.codigo} · simulação por IA</p>
                                        </div>
                                    </div>

                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                        {loading && (
                                            <div
                                                data-testid="sim-loading"
                                                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                                            >
                                                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-azul" />
                                                <p className="text-sm font-medium text-slate-600">{LOAD_MSGS[msgIdx]}</p>
                                                <p className="text-xs text-slate-400">A primeira geração pode levar até 30 segundos</p>
                                            </div>
                                        )}
                                        {erro && !loading && (
                                            <button
                                                data-testid="sim-error"
                                                onClick={() => gerar(cor, tipo)}
                                                className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
                                            >
                                                <p className="text-sm font-medium text-graphite">{erro}</p>
                                                <span className="text-xs font-semibold text-azul">Tentar novamente</span>
                                            </button>
                                        )}
                                        {img && !loading && (
                                            <img
                                                data-testid="sim-result-image"
                                                src={img}
                                                alt={`Simulação: ${tipoNome} na cor ${cor.nome}`}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 p-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            Trocar cor
                                        </p>
                                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" data-testid="sim-color-rail">
                                            {TODAS.map((c) => (
                                                <button
                                                    key={c.arq}
                                                    data-testid={`sim-cor-${slug(c.nome)}-${slug(c.codigo)}`}
                                                    onClick={() => trocarCor(c)}
                                                    disabled={loading}
                                                    title={`${c.nome} ${c.codigo}`}
                                                    className={`h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 disabled:opacity-40 ${
                                                        c.arq === cor.arq
                                                            ? "border-azul ring-2 ring-azul/30"
                                                            : "border-transparent hover:border-slate-300"
                                                    }`}
                                                >
                                                    <img src={`/cores/${c.arq}`} alt={c.nome} className="h-full w-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <button
                                                data-testid="sim-back-tipo"
                                                onClick={() => setStep("tipo")}
                                                className="text-left text-sm font-medium text-slate-500 transition-colors hover:text-azul"
                                            >
                                                ← Trocar tipo de projeto
                                            </button>
                                            <a
                                                data-testid="sim-whatsapp"
                                                href={waMessage(
                                                    `Olá! Fiz uma simulação no site: ${tipoNome} na cor ${cor.nome} (${cor.codigo}). Gostaria de um orçamento.`,
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark"
                                            >
                                                <WhatsAppIcon className="h-4 w-4" />
                                                Pedir orçamento nesta cor
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
