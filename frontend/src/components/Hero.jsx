import { useEffect, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion";
import { ArrowDown, History } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import HeroProductScene from "@/components/HeroProductScene";
import { scrollToId } from "@/lib/scroll";
import { ORCAMENTO_MESSAGE, waMessage } from "@/lib/site";
import { trackClique } from "@/lib/track";
import { useSiteConfig } from "@/lib/SiteConfig";
import "@/components/HeroEffects.css";

const EASE = [0.16, 1, 0.3, 1];

const SLIDES = [
    {
        src: "/projects/sacada-envidracada.jpg",
        alt: "Sacada envidraçada em um projeto Aluminito",
    },
    {
        src: "/hero/loja-atual.jpg",
        alt: "Fachada atual da loja Aluminito",
    },
    {
        src: "/hero/historia-2.jpg",
        alt: "Registro histórico da trajetória da Aluminito",
    },
    {
        src: "/hero/historia-3.jpg",
        alt: "Registro histórico de uma obra em alumínio e vidro",
    },
    {
        src: "/hero/historia-4.jpg",
        alt: "Registro histórico da equipe e das esquadrias Aluminito",
    },
];

const STATS = [
    { label: "Projetos", value: "Residenciais e comerciais" },
    { label: "Atendimento", value: "Serra · Grande Vitória" },
    { label: "Materiais", value: "Alumínio e vidro" },
    { label: "Soluções", value: "Definidas sob medida" },
];

function RevealLine({ children, delay, reducedMotion }) {
    return (
        <span className="-mb-[0.09em] block overflow-hidden pb-[0.09em]">
            <motion.span
                className="block"
                initial={reducedMotion ? false : { y: "112%" }}
                animate={{ y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 1.05, ease: EASE, delay: reducedMotion ? 0 : delay }}
            >
                {children}
            </motion.span>
        </span>
    );
}

export default function Hero() {
    const { whatsapp } = useSiteConfig();
    const sectionRef = useRef(null);
    const whatsappRef = useRef(null);
    const [slide, setSlide] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.88]);

    useEffect(() => {
        if (prefersReducedMotion) return undefined;

        const timer = window.setInterval(() => {
            setSlide((current) => (current + 1) % SLIDES.length);
        }, 5500);

        return () => window.clearInterval(timer);
    }, [prefersReducedMotion]);

    const handleMagneticMove = (event) => {
        if (event.pointerType !== "mouse" || !whatsappRef.current) return;

        const bounds = whatsappRef.current.getBoundingClientRect();
        const offsetX = (event.clientX - (bounds.left + bounds.width / 2)) * 0.065;
        const offsetY = (event.clientY - (bounds.top + bounds.height / 2)) * 0.065;
        const clamp = (value) => Math.min(5, Math.max(-5, value));

        whatsappRef.current.style.setProperty("--magnetic-x", `${clamp(offsetX)}px`);
        whatsappRef.current.style.setProperty("--magnetic-y", `${clamp(offsetY)}px`);
    };

    const resetMagnetic = () => {
        if (!whatsappRef.current) return;
        whatsappRef.current.style.setProperty("--magnetic-x", "0px");
        whatsappRef.current.style.setProperty("--magnetic-y", "0px");
    };

    return (
        <section
            id="inicio"
            ref={sectionRef}
            data-testid="hero-section"
            className="hero-section relative flex min-h-screen flex-col overflow-hidden"
        >
            <div className="hero-vignette" aria-hidden="true" />

            <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center px-5 pb-12 pt-32 sm:px-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-5 lg:pt-28">
                <motion.div
                    style={{ opacity: prefersReducedMotion ? 1 : fade }}
                    className="relative z-20 flex max-w-[690px] flex-col justify-center py-5 lg:py-0"
                >
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0.35 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.85, delay: prefersReducedMotion ? 0 : 0.12, ease: EASE }}
                        className="hero-location-tag mb-6 inline-flex w-fit origin-left items-center gap-3"
                    >
                        <span className="h-px w-8 bg-[#dc2626] sm:w-10" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-400 sm:text-[11px] sm:tracking-[0.3em]">
                            Serra · ES — Grande Vitória
                        </span>
                    </motion.div>

                    <h1 className="max-w-[720px] font-display text-[clamp(2.2rem,4.1vw,4.2rem)] font-bold leading-[1.03] tracking-[-0.045em] text-[#f8f8f8]">
                        <RevealLine delay={0.2} reducedMotion={prefersReducedMotion}>Esquadrias de Alumínio</RevealLine>
                        <RevealLine delay={0.34} reducedMotion={prefersReducedMotion}>
                            e Vidros <span className="hero-title-accent">Sob Medida</span>
                        </RevealLine>
                        <RevealLine delay={0.48} reducedMotion={prefersReducedMotion}>para o Seu Projeto</RevealLine>
                    </h1>

                    <motion.p
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.72, ease: EASE }}
                        className="mt-6 max-w-[540px] text-sm leading-relaxed text-silverlight sm:text-base sm:leading-7"
                    >
                        Soluções em alumínio e vidro para residências e espaços
                        comerciais. Conte à equipe o que seu projeto precisa.
                    </motion.p>

                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.86, ease: EASE }}
                        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <a
                            ref={whatsappRef}
                            data-testid="hero-whatsapp-button"
                            onPointerMove={handleMagneticMove}
                            onPointerLeave={resetMagnetic}
                            onClick={() => trackClique("Geral", "Capa - Solicitar Orçamento", "hero")}
                            href={waMessage(ORCAMENTO_MESSAGE, whatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            className="hero-whatsapp-button w-full sm:w-fit"
                        >
                            <span className="hero-whatsapp-button__content">
                                <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
                                <span>Solicitar orçamento pelo WhatsApp</span>
                            </span>
                        </a>
                        <button
                            type="button"
                            data-testid="hero-view-projects-button"
                            onClick={() => scrollToId("projetos")}
                            className="hero-projects-button"
                        >
                            Ver Projetos
                            <ArrowDown size={16} className="hero-projects-arrow" />
                        </button>
                    </motion.div>

                    <div className="mt-7 flex flex-col items-start gap-3">
                        <motion.div
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: prefersReducedMotion ? 0 : 1.08, duration: prefersReducedMotion ? 0 : 0.7, ease: EASE }}
                            data-testid="hero-acervo-badge"
                            className="hero-history-badge"
                        >
                            <History size={13} className="text-red-400" />
                            <span>Registros históricos da Aluminito</span>
                        </motion.div>

                        <motion.div
                            initial={prefersReducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: prefersReducedMotion ? 0 : 1.2, duration: prefersReducedMotion ? 0 : 0.7 }}
                            data-testid="hero-slide-dots"
                            className="flex items-center gap-[7px] pl-1"
                            aria-label="Fotos em destaque"
                        >
                            {SLIDES.map((item, index) => (
                                <button
                                    key={item.src}
                                    type="button"
                                    data-testid={`hero-slide-dot-${index}`}
                                    data-active={index === slide}
                                    onClick={() => setSlide(index)}
                                    aria-label={`Mostrar imagem ${index + 1} de ${SLIDES.length}`}
                                    aria-pressed={index === slide}
                                    className="hero-slide-dot"
                                />
                            ))}
                        </motion.div>
                    </div>
                </motion.div>

                <div
                    className="hero-scene-column"
                    role="group"
                    aria-label="Composição de esquadrias e vidros"
                >
                    <HeroProductScene slide={SLIDES[slide]} reducedMotion={prefersReducedMotion} />
                </div>
            </div>

            <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 1.1, ease: EASE }}
                className="relative z-20 border-t border-white/[0.09] bg-[#0d0d0d]/55 backdrop-blur-sm"
                data-testid="hero-stats"
            >
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-4 px-5 py-5 sm:px-8 md:grid-cols-4">
                    {STATS.map((stat, index) => (
                        <div
                            key={stat.label}
                            data-testid={`hero-stat-${index}`}
                            className={index > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""}
                        >
                            <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/75 sm:text-[10px]">
                                {stat.label}
                            </p>
                            <p className="mt-1.5 font-display text-sm font-semibold text-white/90 sm:text-base">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
