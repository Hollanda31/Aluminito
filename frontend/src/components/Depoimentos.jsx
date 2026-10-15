import Reveal from "@/components/Reveal";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
    {
        text: "Do orçamento à instalação, tudo no horário combinado. O acabamento das portas de correr ficou impecável — parece que a casa nasceu com elas.",
        name: "Mariana S.",
        role: "Proprietária",
        place: "Vila Velha · ES",
    },
    {
        text: "Especifico a Aluminito nos meus projetos porque a equipe entende o desenho da arquitetura e entrega o detalhe exatamente como foi projetado.",
        name: "Carlos M.",
        role: "Arquiteto",
        place: "Vitória · ES",
    },
    {
        text: "Obra comercial com pele de vidro entregue no prazo e com vedação perfeita. Pontualidade e profissionalismo raro na região.",
        name: "Rodrigo T.",
        role: "Engenheiro Civil",
        place: "Serra · ES",
    },
];

export default function Depoimentos() {
    return (
        <section
            id="depoimentos"
            data-testid="depoimentos-section"
            className="bg-mist py-24 sm:py-32"
        >
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                        Depoimentos
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-graphite sm:text-4xl lg:text-[2.75rem]">
                        Quem contratou, recomenda.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                        Proprietários, arquitetos e engenheiros que confiam no
                        nosso acabamento e no nosso atendimento.
                    </p>
                </Reveal>

                <div className="mt-14 grid gap-5 lg:grid-cols-3">
                    {TESTIMONIALS.map((t, i) => (
                        <Reveal key={t.name} delay={i * 0.1} className="h-full">
                            <figure
                                data-testid={`depoimento-card-${i}`}
                                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-200/70"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1" aria-label="Avaliação 5 de 5">
                                        {[...Array(5)].map((_, s) => (
                                            <Star
                                                key={s}
                                                size={16}
                                                className="fill-azul text-azul"
                                            />
                                        ))}
                                    </div>
                                    <Quote size={30} className="text-azul/15" />
                                </div>
                                <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-slate-700">
                                    “{t.text}”
                                </blockquote>
                                <figcaption className="mt-7 border-t border-slate-100 pt-5">
                                    <p className="font-display font-semibold text-graphite">
                                        {t.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {t.role} · {t.place}
                                    </p>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
