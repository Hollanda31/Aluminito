import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { ORCAMENTO_MESSAGE, waMessage } from "@/lib/site";
import { optimizedImage, optimizedSrcSet } from "@/lib/images";
import { trackClique, trackProjectMetric } from "@/lib/track";
import { useSiteConfig } from "@/lib/SiteConfig";

const EASE = [0.16, 1, 0.3, 1];

const img = (id, w = 1000) =>
    `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const CATEGORIES = [
    "Todos",
    "Portas",
    "Varandas",
    "Janelas",
    "Divisórias",
    "Banheiro",
    "Guarda Corpo",
];

export const PROJECTS = [
    {
        id: 3,
        cat: "Portas",
        title: "Porta de alumínio Digital",
        img: "/projects/Porta-de-aluminio-digital-1.jpg",
        tall: true,
        imgs: [
            "/projects/Porta-de-aluminio-digital-1.jpg",
            "/projects/Porta-de-aluminio-digital-2.jpg",
            "/projects/Porta-de-aluminio-digital-3.jpg",
        ],
        video: "/projects/Porta-de-aluminio-digital.mp4",
    },
    {
        id: 5,
        cat: "Janelas",
        title: "Janelas de correr",
        img: "/projects/Janela-de-correr-1.jpg",
        tall: true,
        imgs: [
            "/projects/Janela-de-correr-1.jpg",
            "/projects/Janela-de-correr-2.jpg",
            "/projects/Janela-de-correr-3.jpg",
        ],
    },
    {
        id: 11,
        cat: "Mural de Licença",
        title: "Mural de licença em vidro",
        img: "/projects/Mural-de-licenças-1.jpg",
        tall: true,
        imgs: [
            "/projects/Mural-de-licenças-1.jpg",
        ],
        video: "/projects/Mural-de-licenças.mp4",
    },
    {
        id: 12,
        cat: "Divisórias",
        title: "Divisória corporativa em vidro",
        img: "/projects/Divisoria-corporativa-1.jpg",
        tall: true,
        imgs: [
            "/projects/Divisoria-corporativa-1.jpg",
            "/projects/Divisoria-corporativa-2.jpg",
            "/projects/Divisoria-corporativa-3.jpg",
            "/projects/Divisoria-corporativa-4.jpg",
            "/projects/Divisoria-corporativa-5.jpg",
            "/projects/Divisoria-corporativa-6.jpg",
        ],
    },
    {
        id: 6,
        cat: "Porta de Emergência",
        title: "Porta de Segurança",
        img: "/projects/Porta-de-emergencia-1.jpg",
        imgs: [
            "/projects/Porta-de-emergencia-1.jpg",
            "/projects/Porta-de-emergencia-2.jpg",
        ],
    },
    {
        id: 7,
        cat: "Varandas",
        title: "Varandas de correr em alumínio",
        img: "/projects/Varanda-1.jpg",
        imgs: [
            "/projects/Varanda-1.jpg",
            "/projects/Varanda-2.jpg",
            "/projects/Varanda-3.jpg",
        ],
    },
    {
        id: 8,
        cat: "Pele de Vidro",
        title: "Pele de vidro sob medida",
        img: "/projects/Pele-de-vidro-1.jpg",
        imgs: [
            "/projects/Pele-de-vidro-1.jpg",
            "/projects/Pele-de-vidro-2.jpg",
            "/projects/Pele-de-vidro-3.jpg",
        ],
    },
    {
        id: 9,
        cat: "Guarda Corpo",
        title: "Guarda Corpo sob medida",
        img: "/projects/Guarda-corpo-1.jpg",
        imgs: [
            "/projects/Guarda-corpo-1.jpg",
            "/projects/Guarda-corpo-2.jpg",
            "/projects/Guarda-corpo-3.jpg",
            "/projects/Guarda-corpo-4.jpg",
        ],
    },
    {
        id: 10,
        cat: "Banheiro",
        title: "Box de vidro e espelho sob medida",
        img: "/projects/Banheiro-1.jpg",
        imgs: [
            "/projects/Banheiro-1.jpg",
            "/projects/Banheiro-2.jpg",
            "/projects/Banheiro-3.jpg",
            "/projects/Banheiro-4.jpg",
            "/projects/Banheiro-5.jpg",
            "/projects/Banheiro-6.jpg",
            "/projects/Banheiro-7.jpg",
            "/projects/Banheiro-8.jpg",
            "/projects/Banheiro-9.jpg",
        ],
    },
];

const slug = (c) =>
    c.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

const photosOf = (p) => (p.imgs ? p.imgs : p.img ? [p.img] : []);
const mediaSrc = (src) => src?.startsWith("/api/media/")
    ? `${process.env.REACT_APP_BACKEND_URL || ""}${src}`
    : src;
const hojeLocal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const projetoEmDestaque = (p) => !!p.featured && (!p.featured_from || p.featured_from <= hojeLocal()) && (!p.featured_until || p.featured_until >= hojeLocal());
const registrarVisualizacao = (projectId, title) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const key = `aluminito-project-view:${hoje}:${projectId}`;
    try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
    } catch {}
    trackProjectMetric(projectId, title, "view");
};

const mediaOf = (p) => {
    if (p.media) return p.media;

    const images = photosOf(p).map((src) => ({
        type: "image",
        src,
    }));

    return p.video
        ? [...images, { type: "video", src: p.video }]
        : images;
};

export default function Projetos() {
    const { whatsapp } = useSiteConfig();
    const [cat, setCat] = useState("Todos");
    const [lightbox, setLightbox] = useState(null);
    const [angle, setAngle] = useState(0);
    const [projects, setProjects] = useState(PROJECTS);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/projetos`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.configurado) setProjects(data.items.map((p) => ({
                    ...p,
                    media: (p.media || []).map((m) => ({ ...m, src: mediaSrc(m.src) })),
                    img: mediaSrc(p.media?.find((m) => m.type === "image")?.src || p.media?.[0]?.src),
                })));
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) registrarVisualizacao(entry.target.dataset.projectId, entry.target.dataset.projectTitle);
            });
        }, { threshold: 0.5 });
        document.querySelectorAll("[data-project-metric]").forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [projects, cat]);

    const filtered =
        cat === "Todos" ? projects : projects.filter((p) => p.cat === cat);

    const categories = ["Todos", ...new Set(projects.map((p) => p.cat))];

    const currentIndex = lightbox
        ? filtered.findIndex((p) => p.id === lightbox.id)
        : -1;

    const media = lightbox ? mediaOf(lightbox) : [];

    const totalSlides = filtered.reduce(
        (acc, p) => acc + mediaOf(p).length,
        0
    );

    const slidePos =
        currentIndex >= 0
            ? filtered
                  .slice(0, currentIndex)
                  .reduce((acc, p) => acc + mediaOf(p).length, 0) +
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

        if (nextAngle >= 0 && nextAngle < media.length) {
            setAngle(nextAngle);
            return;
        }

        const nextProject =
            filtered[(currentIndex + dir + filtered.length) % filtered.length];

        if (!nextProject) return;

        setLightbox(nextProject);
        setAngle(dir === 1 ? 0 : mediaOf(nextProject).length - 1);
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
        <section
            id="projetos"
            data-testid="projetos-section"
            className="bg-white py-24 sm:py-32"
        >
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

                <div
                    className="mt-10 flex flex-wrap gap-2"
                    data-testid="projetos-filters"
                >
                    {categories.map((c) => (
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
                        {filtered.map((p) => {
                            const projectMedia = mediaOf(p);
                            const coverMedia =
                                projectMedia.find(
                                    (item) => item.type === "video"
                                ) || projectMedia[0];

                            return (
                                <motion.button
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.94 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.94 }}
                                    transition={{
                                        duration: 0.4,
                                        ease: EASE,
                                    }}
                                    onClick={() => { registrarVisualizacao(p.id, p.title); openProject(p); }}
                                    data-testid={`projeto-item-${p.id}`}
                                    data-project-metric="true"
                                    data-project-id={String(p.id)}
                                    data-project-title={p.title}
                                    className={`group relative overflow-hidden rounded-2xl text-left ${
                                        p.tall ? "sm:row-span-2" : ""
                                    }`}
                                >
                                    {coverMedia?.type === "video" ? (
                                        <video
                                            src={mediaSrc(coverMedia.src)}
                                            muted
                                            playsInline
                                            preload="metadata"
                                            aria-label={`Prévia do vídeo: ${p.title}`}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <img
                                            src={optimizedImage(mediaSrc(coverMedia?.src || p.img), 768)}
                                            srcSet={optimizedSrcSet(mediaSrc(coverMedia?.src || p.img))}
                                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                                            decoding="async"
                                            alt={p.title}
                                            loading="lazy"
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    )}

                                    {projectMedia.length > 1 && (
                                        <span
                                            data-testid={`projeto-item-${p.id}-badge`}
                                            className="absolute right-3 top-3 rounded-full border border-white/20 bg-graphite/70 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur"
                                        >
                                            {projectMedia.length} mídias
                                        </span>
                                    )}

                                    <div className="absolute bottom-0 left-0 p-5">
                                        {projetoEmDestaque(p) && <span className="mb-2 inline-flex rounded-full bg-azul px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Em destaque</span>}
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-azul [text-shadow:0_1px_8px_rgba(15,23,42,0.9)]">
                                            {p.cat}
                                        </span>
                                        <p className="mt-1 font-display text-base font-semibold text-white [text-shadow:0_1px_10px_rgba(15,23,42,0.9)]">
                                            {p.title}
                                        </p>
                                        {p.description && <p className="mt-1 line-clamp-2 max-w-md text-xs text-white/80 [text-shadow:0_1px_8px_rgba(15,23,42,0.9)]">{p.description}</p>}
                                    </div>
                                </motion.button>
                            );
                        })}
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
                                onClick={() => trackClique("Geral", "Banner - Quer um projeto parecido", "projetos")}
                                href={waMessage(ORCAMENTO_MESSAGE, whatsapp)}
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
                            {media[angle]?.type === "video" ? (
                                <motion.video
                                    key={`${lightbox.id}-${angle}`}
                                    initial={{ opacity: 0, scale: 0.985 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    src={mediaSrc(media[angle].src)}
                                    autoPlay
                                    controls
                                    playsInline
                                    className="max-h-[80vh] w-full bg-graphite2 object-contain"
                                />
                            ) : (
                                <motion.img
                                    key={`${lightbox.id}-${angle}`}
                                    initial={{ opacity: 0, scale: 0.985 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    src={optimizedImage(mediaSrc(media[angle]?.src), 1600)}
                                    srcSet={optimizedSrcSet(mediaSrc(media[angle]?.src))}
                                    sizes="(max-width: 896px) 100vw, 80vw"
                                    decoding="async"
                                    alt={`${lightbox.title} — ângulo ${angle + 1}`}
                                    className="max-h-[80vh] w-full bg-graphite2 object-contain"
                                />
                            )}

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

                            <div className="flex flex-wrap items-center justify-between gap-4 bg-graphite px-6 py-4">
                                <div>
                                    <p className="font-display text-sm font-semibold text-white sm:text-base">
                                        {lightbox.title}
                                    </p>
                                    {lightbox.description && <p className="mt-1 max-w-xl text-xs leading-relaxed text-silver/70">{lightbox.description}</p>}

                                    {totalSlides > 1 && currentIndex >= 0 && (
                                        <p
                                            data-testid="lightbox-counter"
                                            className="mt-0.5 text-[11px] font-medium text-silver/50"
                                        >
                                            {slidePos} de {totalSlides}
                                        </p>
                                    )}

                                    {media.length > 1 && (
                                        <div className="mt-2 flex gap-1.5">
                                            {media.map((_, i) => (
                                                <button
                                                    key={i}
                                                    data-testid={`lightbox-angle-${i}`}
                                                    onClick={() => setAngle(i)}
                                                    aria-label={`Ver mídia ${i + 1}`}
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

                                <div className="flex shrink-0 flex-wrap items-center gap-3"><span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-azul">{lightbox.cat}</span><a data-testid="projeto-orcamento-whatsapp" href={waMessage(`${ORCAMENTO_MESSAGE}\nTenho interesse em um projeto parecido com: ${lightbox.title}.`, whatsapp)} target="_blank" rel="noreferrer" onClick={() => { trackProjectMetric(lightbox.id, lightbox.title, "quote"); trackClique("Projetos", lightbox.title, "projetos", { tipo: "Orçamento", obs: `Interesse na obra ${lightbox.title}` }); }} className="inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-xs font-semibold text-white hover:bg-azul-dark"><WhatsAppIcon className="h-4 w-4" /> Pedir orçamento</a></div>
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
