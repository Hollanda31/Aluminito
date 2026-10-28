import { useEffect, useState } from "react";

const firstSlide = { src: "/sobre-aluminito.jpg", alt: "Fachada da Aluminito" };

export default function Sobre() {
    const [slides, setSlides] = useState([firstSlide]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        let active = true;
        fetch("/api/imagens-sobre")
            .then((response) => (response.ok ? response.json() : Promise.reject()))
            .then((data) => {
                if (!active || !Array.isArray(data.items)) return;
                const localSlides = data.items.filter((photo) =>
                    photo && typeof photo.src === "string" && photo.src.startsWith("/imagens/")
                    && typeof photo.alt === "string",
                );
                if (localSlides.length) setSlides(localSlides);
            })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (slides.length < 2) return undefined;
        const timer = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % slides.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, [slides.length]);

    const changeSlide = (direction) => {
        setActiveIndex((index) => (index + direction + slides.length) % slides.length);
    };

    return (
        <section id="sobre" className="bg-[#f7f7f7] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-600">Sobre a Aluminito</p>
                    <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.08] tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.65rem]">
                        Fabricação própria, instalação técnica e acabamento de alto padrão.
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Somos uma empresa comprometida em entregar soluções de qualidade, unindo experiência, inovação e atendimento próximo. Trabalhamos todos os dias para oferecer resultados que geram confiança e fortalecem parcerias duradouras.
                    </p>
                    <ul className="mt-7 flex flex-wrap gap-2.5 text-xs text-slate-700 sm:text-sm">
                        {["Alumínio anodizado", "Pintura eletrostática", "Todos os tipos de vidros"].map((item) => (
                            <li key={item} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5">
                                <span aria-hidden="true" className="font-bold text-red-600">✓</span>{item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative overflow-hidden rounded-[1.6rem] bg-slate-200 shadow-sm" aria-label="Fotos da Aluminito e de seus projetos">
                    <div className="aspect-[1.4/1] w-full">
                        {slides.map((slide, index) => (
                            <img
                                key={`${slide.src}-${index}`}
                                src={slide.src}
                                alt={slide.alt}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
                                loading={index === activeIndex ? "eager" : "lazy"}
                                aria-hidden={index !== activeIndex}
                            />
                        ))}
                    </div>
                    {slides.length > 1 && (
                        <>
                            <button type="button" onClick={() => changeSlide(-1)} aria-label="Foto anterior" className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-600">‹</button>
                            <button type="button" onClick={() => changeSlide(1)} aria-label="Próxima foto" className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-600">›</button>
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" role="group" aria-label="Escolher foto">
                                {slides.map((slide, index) => (
                                    <button key={`${slide.src}-dot-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`Mostrar foto ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-2.5 rounded-full shadow-sm transition-all ${index === activeIndex ? "w-7 bg-white" : "w-2.5 bg-white/65 hover:bg-white"}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
