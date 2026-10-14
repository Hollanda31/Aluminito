import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { waMessage } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1];

const img = (id, w = 1000) =>
    `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const CATEGORIES = ["Todos", "Portas", "Janelas", "Fachadas", "Guarda-Corpo"];

const PROJECTS = [
    { id: 1, cat: "Portas", title: "Porta pivotante em vidro e alumínio", img: img("photo-1613544723301-176686aa9f09", 900), tall: true },
    { id: 2, cat: "Janelas", title: "Janela panorâmica de alumínio", img: img("photo-1616877575565-6908da8619f5", 900) },
    { id: 3, cat: "Fachadas", title: "Pele de vidro comercial", img: img("photo-1479292889369-1a48f234247e", 900), tall: true },
    { id: 4, cat: "Guarda-Corpo", title: "Guarda-corpo em vidro à beira-mar", img: img("photo-1597663459867-9903bf92dcfd", 900) },
    { id: 5, cat: "Portas", title: "Portas de correr integradas ao jardim", img: img("photo-1766603636700-e9d80473f40f", 900) },
    { id: 6, cat: "Janelas", title: "Esquadrias panorâmicas residenciais", img: img("photo-1775116483675-a592e6e02807", 900) },
    { id: 7, cat: "Fachadas", title: "Fachada em vidro e alumínio", img: img("photo-1523477593243-78bbf626fd3b", 900) },
    { id: 8, cat: "Guarda-Corpo", title: "Guarda-corpo em sacadas", img: img("photo-1595039357995-905cad2933e3", 900) },
];

const slug = (c) => c.toLowerCase();

export default function Projetos() {
    const [cat, setCat] = useState("Todos");
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setLightbox(null);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const filtered =
        cat === "Todos" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat);

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
                                onClick={() => setLightbox(p)}
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
                                <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 p-5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                                        {p.cat}
                                    </span>
                                    <p className="mt-1 font-display text-base font-semibold text-white">
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
                                href={waMessage(
                                    "Olá! Vi o portfólio da Aluminito e quero um projeto parecido.",
                                )}
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
                            <img
                                src={lightbox.img}
                                alt={lightbox.title}
                                className="max-h-[80vh] w-full object-contain bg-graphite2"
                            />
                            <div className="flex items-center justify-between bg-graphite px-6 py-4">
                                <p className="font-display text-sm font-semibold text-white sm:text-base">
                                    {lightbox.title}
                                </p>
                                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
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
