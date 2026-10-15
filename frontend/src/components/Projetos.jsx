import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { waOrcamento } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1];

const img = (id, w = 1000) =>
    `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const CATEGORIES = ["Todos", "Portas", "Portão de Garagem", "Janelas", "Divisórias", "Banheiro"];

const PROJECTS = [
    { id: 1, cat: "Portas", title: "Porta de alumínio branca com puxador", img: "/projects/porta-branca.jpg" },
    { id: 2, cat: "Janelas", title: "Envidraçamento de sacada em vidro", img: "/projects/sacada-envidracada.jpg" },
    {
        id: 3,
        cat: "Portas",
        title: "Porta de Giro comercial em Alumínio",
        img: "/projects/porta-comercial-4.jpg",
        tall: true,
        imgs: [
            "/projects/porta-comercial-1.jpg",
            "/projects/porta-comercial-2.jpg",
            "/projects/porta-comercial-3.jpg",
            "/projects/porta-comercial-4.jpg",
            "/projects/porta-comercial-5.jpg",
        ],
    },
    { id: 4, cat: "Janelas", title: "Janela de correr em alumínio branco", img: "/projects/janela-correr-branca.jpg" },
    {
        id: 5,
        cat: "Divisórias",
        title: "Divisória corporativa em vidro",
        img: "/projects/divisoria-corporativa-1.jpg",
        tall: true,
        imgs: [
            "/projects/divisoria-corporativa-1.jpg",
            "/projects/divisoria-corporativa-2.jpg",
        ],
    },
    {
        id: 6,
        cat: "Portas",
        title: "Porta de correr em duas folhas",
        img: "/projects/porta-duas-folhas-1.jpg",
        imgs: [
            "/projects/porta-duas-folhas-1.jpg",
            "/projects/porta-duas-folhas-2.jpg",
            "/projects/porta-duas-folhas-3.jpg",
            "/projects/porta-duas-folhas-4.jpg",
        ],
    },
    {
        id: 7,
        cat: "Portão de Garagem",
        title: "Portão de correr em alumínio branco",
        img: "/projects/portao-correr-branco.jpg",
        imgs: [
            "/projects/portao-correr-branco.jpg",
            "/projects/portao-correr-branco-2.jpg",
            "/projects/portao-correr-branco-3.jpg",
        ],
    },
    {
        id: 11,
        cat: "Banheiro",
        title: "Box de vidro e espelho sob medida",
        img: "/projects/banheiro-2.jpg",
        imgs: [
            "/projects/banheiro-2.jpg",
            "/projects/banheiro-1.jpg",
        ],
    },
];

const slug = (c) =>
    c.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
const photosOf = (p) => (p.imgs ? p.imgs : [p.img]);

export default function Projetos() {
    const [cat, setCat] = useState("Todos");
    const [lightbox, setLightbox] = useState(null);
    const [angle, setAngle] = useState(0);

    const filtered =
        cat === "Todos" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat);

    const currentIndex = lightbox
        ? filtered.findIndex((p) => p.id === lightbox.id)
        : -1;

    const photos = lightbox ? photosOf(lightbox) : [];

    const totalSlides = filtered.reduce((acc, p) => acc + photosOf(p).length, 0);
    const slidePos =
        currentIndex >= 0
            ? filtered
                  .slice(0, currentIndex)
                  .reduce((acc, p) => acc + photosOf(p).length, 0) +
              angle +
              1
            : 0;

    const openProject = (p) => {
        setLightbox(p);
        setAngle(0);
    };

    const navigate = (dir) => {
        if (!lightbox) return;
        const nextAngle = angle + dir;
        if (nextAngle >= 0 && nextAngle < photos.length) {
            setAngle(nextAngle);
            return;
        }
        const nextProject =
            filtered[(currentIndex + dir + filtered.length) % filtered.length];
        if (!nextProject) return;
        setLightbox(nextProject);
        setAngle(dir === 1 ? 0 : photosOf(nextProject).length - 1);
    };

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightbox(null);
            if (e.key === "ArrowRight") navigate(1);
            if (e.key === "ArrowLeft") navigate(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lightbox, angle, cat]);

    return (
        <section id="projetos" data-testid="projetos-section" className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                            Projetos Entregues
                        </p>
                        <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-graphite sm:text-4xl lg:text-[2.75rem]">
                            Um portfólio feito de detalhes milimétricos.
                        </h2>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-slate-600 sm:text-base">
                        Residências e obras comerciais em Serra, Vitória e
                        região — clique para ampliar cada projeto.
                    </p>
                </Reveal>

                <div className="mt-10 flex flex-wrap gap-2" data-testid="projetos-filters">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            data-testid={`filter-tab-${slug(c)}`}
                            onClick={() => setCat(c)}
                            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                                cat === c
                                    ? "border-graphite bg-graphite text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-graphite/40 hover:text-graphite"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <motion.div
                    layout
                    data-testid="projetos-grid"
                    className="mt-8 grid auto-rows-[220px] grid-cols-1 gap-4 sm:auto-rows-[240px] sm:grid-cols-2 lg:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map((p) => (
                            <motion.button
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                                transition={{ duration: 0.4, ease: EASE }}
                                onClick={() => openProject(p)}
                                data-testid={`projeto-item-${p.id}`}
                                className={`group relative overflow-hidden rounded-2xl text-left ${
                                    p.tall ? "sm:row-span-2" : ""
                                }`}
                            >
                                <img
                                    src={p.img}
                                    alt={p.title}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {p.imgs && (
                                    <span
                                        data-testid={`projeto-item-${p.id}-badge`}
                                        className="absolute right-3 top-3 rounded-full border border-white/20 bg-graphite/70 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur"
                                    >
                                        {p.imgs.length} fotos
                                    </span>
                                )}
                                <div className="absolute bottom-0 left-0 p-5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-azul [text-shadow:0_1px_8px_rgba(15,23,42,0.9)]">
                                        {p.cat}
                                    </span>
                                    <p className="mt-1 font-display text-base font-semibold text-white [text-shadow:0_1px_10px_rgba(15,23,42,0.9)]">
                                        {p.title}
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </motion.div>

                <Reveal className="mt-16">
                    <div
                        data-testid="projetos-cta-banner"
                        className="relative overflow-hidden rounded-3xl bg-graphite px-8 py-12 sm:px-12"
                    >
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-azul/20 blur-[100px]" />
                        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                            <div>
                                <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                                    Quer um projeto parecido?
                                </h3>
                                <p className="mt-2 text-silver/75">
                                    Mostre sua referência e receba uma proposta
                                    sob medida, sem compromisso.
                                </p>
                            </div>
                            <a
                                data-testid="projetos-cta-whatsapp"
                                href={waOrcamento}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-3 rounded-full bg-azul px-7 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                            >
                                <WhatsAppIcon className="h-5 w-5" />
                                Fale no WhatsApp
                            </a>
                        </div>
                    </div>
                </Reveal>
            </div>

            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        data-testid="projeto-lightbox"
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-graphite/95 p-5 backdrop-blur-sm"
                        onClick={() => setLightbox(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 24 }}
                            transition={{ duration: 0.35, ease: EASE }}
                            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                key={`${lightbox.id}-${angle}`}
                                initial={{ opacity: 0, scale: 0.985 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                src={photos[angle]}
                                alt={`${lightbox.title} — ângulo ${angle + 1}`}
                                className="max-h-[80vh] w-full bg-graphite2 object-contain"
                            />
                            {totalSlides > 1 && (
                                <>
                                    <button
                                        data-testid="lightbox-prev-button"
                                        onClick={() => navigate(-1)}
                                        aria-label="Imagem anterior"
                                        className="absolute left-3 top-[42%] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-graphite/70 text-white backdrop-blur transition-colors duration-200 hover:bg-azul"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        data-testid="lightbox-next-button"
                                        onClick={() => navigate(1)}
                                        aria-label="Próxima imagem"
                                        className="absolute right-3 top-[42%] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-graphite/70 text-white backdrop-blur transition-colors duration-200 hover:bg-azul"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}
                            <div className="flex items-center justify-between gap-4 bg-graphite px-6 py-4">
                                <div>
                                    <p className="font-display text-sm font-semibold text-white sm:text-base">
                                        {lightbox.title}
                                    </p>
                                    {totalSlides > 1 && currentIndex >= 0 && (
                                        <p
                                            data-testid="lightbox-counter"
                                            className="mt-0.5 text-[11px] font-medium text-silver/50"
                                        >
                                            {slidePos} de {totalSlides}
                                        </p>
                                    )}
                                    {photos.length > 1 && (
                                        <div className="mt-2 flex gap-1.5">
                                            {photos.map((_, i) => (
                                                <button
                                                    key={i}
                                                    data-testid={`lightbox-angle-${i}`}
                                                    onClick={() => setAngle(i)}
                                                    aria-label={`Ver ângulo ${i + 1}`}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        i === angle
                                                            ? "w-6 bg-azul"
                                                            : "w-1.5 bg-white/30 hover:bg-white/60"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-azul">
                                    {lightbox.cat}
                                </span>
                            </div>
                        </motion.div>
                        <button
                            data-testid="lightbox-close-button"
                            onClick={() => setLightbox(null)}
                            aria-label="Fechar"
                            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
