import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, History } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { scrollToId } from "@/lib/scroll";
import { IMAGES, waOrcamento } from "@/lib/site";
import { trackClique } from "@/lib/track";

const EASE = [0.16, 1, 0.3, 1];

const SLIDES = [
    "/hero/loja-atual.jpg",
    "/hero/historia-2.jpg",
    "/hero/historia-3.jpg",
    "/hero/historia-4.jpg",
];

const STATS = [
    { label: "Fabricação", value: "Própria" },
    { label: "Atendimento", value: "Todo o Brasil" },
    { label: "Vidros", value: "Todos os Tipos" },
    { label: "Perfis", value: "Resistentes à Maresia" },
];

function RevealLine({ children, delay }) {
    return (
        <span className="-mb-[0.09em] block overflow-hidden pb-[0.09em]">
            <motion.span
                className="block"
                initial={{ y: "112%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay }}
            >
                {children}
            </motion.span>
        </span>
    );
}

export default function Hero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
    const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

    const [slide, setSlide] = useState(0);

    useEffect(() => {
        const t = setInterval(
            () => setSlide((s) => (s + 1) % SLIDES.length),
            5500,
        );
        return () => clearInterval(t);
    }, []);

    return (
        <section
            id="inicio"
            ref={ref}
            data-testid="hero-section"
            className="relative flex min-h-screen flex-col overflow-hidden bg-graphite"
        >
            <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
                <AnimatePresence>
                    <motion.img
                        key={slide}
                        data-testid="hero-bg-slide"
                        src={SLIDES[slide]}
                        alt="Aluminito — projetos e história em esquadrias"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: 1.06 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 1.4, ease: "easeInOut" },
                            scale: { duration: 6.5, ease: "linear" },
                        }}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-graphite/80 via-graphite/55 to-graphite" />
                <div className="absolute inset-0 bg-gradient-to-r from-graphite/85 via-graphite/40 to-transparent" />
            </motion.div>

            <motion.div
                style={{ opacity: fade }}
                className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-14 pt-36 sm:px-8"
            >
                <motion.div
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
                    className="mb-7 flex items-center gap-4"
                >
                    <span className="h-px w-12 bg-azul" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-azul sm:text-xs">
                        Serra · ES — Grande Vitória
                    </span>
                </motion.div>

                <h1 className="max-w-5xl font-display text-[clamp(2.45rem,6.4vw,5.4rem)] font-bold leading-[1.04] tracking-tight text-white">
                    <RevealLine delay={0.22}>Esquadrias de Alumínio</RevealLine>
                    <RevealLine delay={0.36}>
                        e Vidros <span className="text-azul">Sob Medida</span>
                    </RevealLine>
                    <RevealLine delay={0.5}>para o Seu Projeto</RevealLine>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
                    className="mt-7 max-w-xl text-base leading-relaxed text-silver sm:text-lg"
                >
                    Qualidade, durabilidade e sofisticação para residências e
                    obras comerciais. Transforme seu ambiente com acabamento de
                    alto padrão.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
                    className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                    <a
                        data-testid="hero-whatsapp-button"
                        onClick={() => trackClique("Geral", "Capa - Fazer Orçamento Gratuito", "hero")}
                        href={waOrcamento}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-azul px-8 py-4 text-base font-semibold text-white shadow-lg shadow-azul/25 transition-all duration-300 hover:bg-azul-dark hover:shadow-azul/40"
                    >
                        <WhatsAppIcon className="h-5 w-5" />
                        Fazer Orçamento Gratuito via WhatsApp
                    </a>
                    <button
                        data-testid="hero-view-projects-button"
                        onClick={() => scrollToId("projetos")}
                        className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/25 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5"
                    >
                        Ver Projetos
                        <ArrowDown size={18} />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.25, duration: 0.8, ease: EASE }}
                    data-testid="hero-acervo-badge"
                    className="mt-8 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-4 py-2 backdrop-blur"
                >
                    <History size={14} className="text-azul" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/85">
                        Imagens Históricas · Desde 1984 atuando no ramo
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.8 }}
                    data-testid="hero-slide-dots"
                    className="mt-4 flex items-center gap-2"
                >
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            data-testid={`hero-slide-dot-${i}`}
                            onClick={() => setSlide(i)}
                            aria-label={`Foto ${i + 1} de ${SLIDES.length}`}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                i === slide
                                    ? "w-7 bg-azul"
                                    : "w-1.5 bg-white/30 hover:bg-white/60"
                            }`}
                        />
                    ))}
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
                className="relative z-10 border-t border-white/10 bg-graphite/40 backdrop-blur-sm"
                data-testid="hero-stats"
            >
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 sm:px-8 md:grid-cols-4">
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            data-testid={`hero-stat-${i}`}
                            className={i > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""}
                        >
                            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-silver/60 sm:text-[11px]">
                                {s.label}
                            </p>
                            <p className="mt-1.5 font-display text-sm font-semibold text-white sm:text-base">
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
