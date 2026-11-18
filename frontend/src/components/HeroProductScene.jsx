import { AnimatePresence, motion } from "framer-motion";
import { Ruler, ShieldCheck } from "lucide-react";
import { optimizedImage } from "@/lib/images";

export default function HeroProductScene({ slide, reducedMotion = false }) {
    return (
        <div
            className="hero-product-scene"
            data-testid="hero-product-scene"
        >
            <div aria-hidden="true" className="hero-blueprint">
                <svg viewBox="0 0 720 620" preserveAspectRatio="none">
                    <path d="M48 112H654M82 127H620M602 102V523M618 130V491M120 500H650M92 518H627" />
                    <path d="M90 95v34m-8-17h16M620 87v31m-8-15h16M585 500h34m-17-8v16M105 480v36m-8-18h16" />
                    <circle cx="113" cy="120" r="2.5" />
                    <circle cx="610" cy="506" r="2.5" />
                    <circle cx="604" cy="114" r="2.5" />
                </svg>
                <span className="hero-dimension-label hero-dimension-label--top">2.400 mm</span>
                <span className="hero-dimension-label hero-dimension-label--side">1.600 mm</span>
                <span className="hero-blueprint-crosshair hero-blueprint-crosshair--one" />
                <span className="hero-blueprint-crosshair hero-blueprint-crosshair--two" />
            </div>

            <div className="hero-scene-assembly">
                <div className="hero-glass-sheet hero-glass-sheet--rear" />
                <div className="hero-aluminum-frame hero-aluminum-frame--rear">
                    <span className="hero-frame-recess" />
                    <span className="hero-frame-mullion hero-frame-mullion--rear" />
                    <span className="hero-frame-glint" />
                </div>

                <div className="hero-glass-sheet hero-glass-sheet--loose" />

                <div className="hero-aluminum-frame hero-aluminum-frame--front">
                    <div className="hero-window-photo">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.img
                                key={slide.src}
                                data-testid="hero-bg-slide"
                                src={optimizedImage(slide.src, 1600)}
                                srcSet={`${optimizedImage(slide.src, 768)} 768w, ${optimizedImage(slide.src, 1600)} 1600w`}
                                sizes="(min-width: 1024px) 34vw, 80vw"
                                decoding="async"
                                alt={slide.alt}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    opacity: { duration: reducedMotion ? 0 : 0.9, ease: "easeInOut" },
                                }}
                                className="hero-window-photo__image"
                            />
                        </AnimatePresence>
                        <span className="hero-window-photo__tint" />
                    </div>
                    <span className="hero-frame-mullion hero-frame-mullion--vertical" />
                    <span className="hero-frame-mullion hero-frame-mullion--horizontal" />
                    <span className="hero-frame-glint" />
                </div>

                <div className="hero-glass-sheet hero-glass-sheet--front" />

                <div className="hero-aluminum-profile hero-aluminum-profile--one">
                    <span />
                    <span />
                </div>
                <div className="hero-aluminum-profile hero-aluminum-profile--two">
                    <span />
                    <span />
                </div>
            </div>

            <div className="hero-spec-card hero-spec-card--quality">
                <span className="hero-spec-card__icon"><Ruler size={15} /></span>
                <span>
                    <strong>Projetos sob medida</strong>
                    <small>Especificações do seu projeto</small>
                </span>
                <i>01</i>
            </div>

            <div className="hero-spec-card hero-spec-card--glass">
                <span className="hero-spec-card__icon"><ShieldCheck size={15} /></span>
                <span>
                    <strong>Alumínio e vidro</strong>
                    <small>Opções conforme o projeto</small>
                </span>
                <i>02</i>
            </div>

            <div className="hero-scene-caption">
                <span className="hero-scene-caption__dot" />
                <span>ALUMÍNIO · VIDRO · PRECISÃO</span>
            </div>
        </div>
    );
}
