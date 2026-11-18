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
import { scrollToId } from "@/lib/scroll";
import { abrirOrcamento } from "@/lib/orcamento";
import { trackClique } from "@/lib/track";
import "@/components/HeroEffects.css";

const EASE = [0.16, 1, 0.3, 1];

const SLIDES = [
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

const optimizedSrcSet = (src) =>
    `${src.replace(/\.jpg$/i, "-768.webp")} 768w, ${src.replace(/\.jpg$/i, "-1600.webp")} 1600w`;

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
    const sectionRef = useRef(null);
    const whatsappRef = useRef(null);
    const [slide, setSlide] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.14]);
    const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

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
        const clamp = (value) => Math.min(5, Math.max(-5, value));
        whatsappRef.current.style.setProperty(
            "--magnetic-x",
            `${clamp((event.clientX - (bounds.left + bounds.width / 2)) * 0.065)}px`,
        );
        whatsappRef.current.style.setProperty(
            "--magnetic-y",
            `${clamp((event.clientY - (bounds.top + bounds.height / 2)) * 0.065)}px`,
        );
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
            <motion.div
                style={prefersReducedMotion ? undefined : { y: bgY, scale: bgScale }}
                className="absolute inset-0"
                aria-hidden="true"
            >
                <AnimatePresence initial={false}>
                    <motion.img
                        key={SLIDES[slide].src}
                        data-testid="hero-bg-slide"
                        src={SLIDES[slide].src}
                        srcSet={optimizedSrcSet(SLIDES[slide].src)}
                        sizes="100vw"
                        decoding="async"
                        alt={SLIDES[slide].alt}
                        initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.015 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        transition={{ opacity: { duration: 1.1, ease: "easeInOut" }, scale: { duration: 6.5, ease: "linear" } }}
                        className="hero-background-image absolute inset-0 h-full w-full object-cover"
                    />
                </AnimatePresence>
            </motion.div>
            <div className="hero-vignette" aria-hidden="true" />

            <motion.div
                style={{ opacity: prefersReducedMotion ? 1 : fade }}
                className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-12 pt-36 sm:px-8 sm:pb-14"
            >
                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.08, ease: EASE }}
                    className="hero-location-tag mb-6 inline-flex w-fit items-center gap-4"
                >
                    <span className="h-px w-12 bg-azul" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-500 sm:text-xs sm:tracking-[0.3em]">
                        Serra · ES — Grande Vitória
                    </span>
                </motion.div>

                <h1 className="max-w-[980px] font-display text-[clamp(2.45rem,6vw,5.35rem)] font-bold leading-[1.06] tracking-tight text-white">
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
                    className="mt-8 max-w-[540px] text-sm leading-relaxed text-silver sm:text-lg sm:leading-7"
                >
                    Qualidade, durabilidade e sofisticação para residências e obras
                    comerciais. Transforme seu ambiente com acabamento de alto
                    padrão.
                </motion.p>

                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.86, ease: EASE }}
                    className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                >
                    <button
                        type="button"
                        ref={whatsappRef}
                        data-testid="hero-whatsapp-button"
                        onPointerMove={handleMagneticMove}
                        onPointerLeave={resetMagnetic}
                        onClick={() => {
                            trackClique("Geral", "Capa - Solicitar Orçamento", "hero");
                            abrirOrcamento();
                        }}
                        aria-haspopup="dialog"
                        className="hero-whatsapp-button w-full sm:w-fit sm:min-w-[406px]"
                    >
                        <span className="hero-whatsapp-button__content">
                            <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
                            <span>Fazer Orçamento Gratuito via WhatsApp</span>
                        </span>
                    </button>
                    <button
                        type="button"
                        data-testid="hero-view-projects-button"
                        onClick={() => scrollToId("projetos")}
                        className="hero-projects-button sm:min-w-[187px]"
                    >
                        Ver Projetos
                        <ArrowDown size={16} className="hero-projects-arrow" />
                    </button>
                </motion.div>

                <div className="mt-8 flex flex-col items-start gap-4">
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: prefersReducedMotion ? 0 : 1.08, duration: prefersReducedMotion ? 0 : 0.7, ease: EASE }}
                        data-testid="hero-acervo-badge"
                        className="hero-history-badge"
                    >
                        <History size={13} className="text-red-500" />
                        <span>Imagens históricas · Desde 1984 atuando no ramo</span>
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
        </section>
    );
}
