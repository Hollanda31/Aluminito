import Reveal from "@/components/Reveal";
import { Check, Clock, Gem, Ruler, ShieldCheck } from "lucide-react";
import { IMAGES } from "@/lib/site";

const DIFERENCIAIS = [
    {
        icon: Ruler,
        title: "Fabricação sob medida",
        desc: "Cada esquadria é projetada e produzida nas medidas exatas do seu ambiente.",
    },
    {
        icon: ShieldCheck,
        title: "Durabilidade e resistência à maresia",
        desc: "Alumínio tratado e vidros de alta performance, prontos para o clima litorâneo.",
    },
    {
        icon: Gem,
        title: "Acabamento de alto padrão",
        desc: "Alinhamento milimétrico, vedação perfeita e estética impecável em cada detalhe.",
    },
    {
        icon: Clock,
        title: "Pontualidade na entrega",
        desc: "Cronograma respeitado, da medição à instalação, sem surpresas.",
    },
];

const PILLS = [
    "Alumínio anodizado",
    "Pintura eletrostática",
    "Todos os tipos de vidros",
];

export default function Sobre() {
    return (
        <section
            id="sobre"
            data-testid="sobre-section"
            className="bg-mist py-24 sm:py-32"
        >
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="grid items-center gap-14 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                                Sobre a Aluminito
                            </p>
                            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-graphite sm:text-4xl lg:text-[2.75rem]">
                                Fabricação própria, instalação técnica e
                                acabamento de alto padrão.
                            </h2>
                            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                                A Aluminito fabrica e instala esquadrias de
                                alumínio e todos os tipos de vidros sob
                                medida para residências e obras comerciais na
                                região de Serra - ES e Grande Vitória. Do
                                projeto à entrega, uma equipe própria cuida de
                                cada detalhe — do corte do perfil ao último
                                acabamento.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-2">
                                {PILLS.map((p) => (
                                    <span
                                        key={p}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700"
                                    >
                                        <Check size={13} className="text-azul" />
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </Reveal>
                    </div>

                    <div className="relative lg:col-span-7">
                        <Reveal delay={0.12} className="relative sm:pr-10">
                            <div
                                data-testid="sobre-image-main"
                                className="overflow-hidden rounded-3xl"
                            >
                                <img
                                    src={IMAGES.sobreMain}
                                    alt="Equipe técnica instalando esquadria de alumínio"
                                    loading="lazy"
                                    className="h-[320px] w-full object-cover transition-transform duration-700 hover:scale-[1.03] sm:h-[460px]"
                                />
                            </div>
                            <div
                                data-testid="sobre-image-second"
                                className="absolute -bottom-10 left-6 hidden w-60 overflow-hidden rounded-2xl border-8 border-mist shadow-2xl sm:block lg:-left-6 lg:w-72"
                            >
                                <img
                                    src={IMAGES.sobreSecond}
                                    alt="Residência com esquadrias de alumínio sob medida"
                                    loading="lazy"
                                    className="h-44 w-full object-cover lg:h-48"
                                />
                            </div>
                        </Reveal>
                    </div>
                </div>

                <div
                    data-testid="diferenciais-grid"
                    className="mt-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {DIFERENCIAIS.map((d, i) => (
                        <Reveal key={d.title} delay={i * 0.08} className="h-full">
                            <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-azul/50 hover:shadow-xl hover:shadow-azul/5">
                                <span className="grid h-12 w-12 place-items-center rounded-xl bg-azul/10 text-azul transition-colors duration-300 group-hover:bg-azul group-hover:text-white">
                                    <d.icon size={22} strokeWidth={1.8} />
                                </span>
                                <h3 className="mt-5 font-display text-lg font-semibold text-graphite">
                                    {d.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    {d.desc}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
