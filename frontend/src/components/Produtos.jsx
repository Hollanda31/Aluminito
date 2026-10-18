import Reveal from "@/components/Reveal";
import { ArrowUpRight } from "lucide-react";
import { waMessage } from "@/lib/site";
import { trackClique } from "@/lib/track";
import { useSiteConfig } from "@/lib/SiteConfig";

const img = (id, w = 1200) =>
    `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const PRODUCTS = [
    {
        n: "01",
        title: "Portas e Janelas de Alumínio",
        desc: "Linhas Gold, Supreme e projetos sob medida: esquadrias leves, silenciosas e com vedação de alta performance.",
        img: img("photo-1710883734891-93709398496d"),
        span: "lg:col-span-7",
    },
    {
        n: "02",
        title: "Portões e Portas Pivotantes",
        desc: "Presença marcante na fachada: portas pivotantes e portões de alumínio com movimento suave e segurança reforçada.",
        img: img("photo-1628744448840-55bdb2497bd4"),
        span: "lg:col-span-5",
    },
    {
        n: "03",
        title: "Fachadas Pele de Vidro",
        desc: "Structural glazing para obras comerciais e residenciais: grandes vãos, estética limpa e vedação impecável.",
        img: img("photo-1690944851207-3f288c8fcd0b"),
        span: "lg:col-span-5",
    },
    {
        n: "04",
        title: "Guarda-Corpo em Alumínio e Vidro",
        desc: "Segurança com transparência: guarda-corpos com todos os tipos de vidros e fixação em alumínio integrado.",
        img: img("photo-1617036958702-0cb93be0552b"),
        span: "lg:col-span-7",
    },
    {
        n: "05",
        title: "Coberturas e Envidraçamento de Sacada/Varanda",
        desc: "Reiki, eurosystem e coberturas sob medida: mais conforto térmico e acústico, e valor agregado ao imóvel.",
        img: img("photo-1697609709300-d7409f2c2459", 1600),
        span: "lg:col-span-12",
    },
];

export default function Produtos() {
    const { whatsapp } = useSiteConfig();
    return (
        <section
            id="produtos"
            data-testid="produtos-section"
            className="relative overflow-hidden bg-graphite py-24 sm:py-32"
        >
            <div className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-azul/10 blur-[140px]" />
            <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
                <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <Reveal>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                            Produtos & Serviços
                        </p>
                        <h2 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                            Tudo em esquadrias, de uma porta ao edifício
                            inteiro.
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="max-w-sm text-sm leading-relaxed text-silver/70 sm:text-base">
                            Da linha residencial às fachadas comerciais em pele
                            de vidro: projetos sob medida com fabricação e
                            instalação próprias.
                        </p>
                    </Reveal>
                </div>

                <div className="grid gap-5 lg:grid-cols-12">
                    {PRODUCTS.map((p, i) => (
                        <Reveal
                            key={p.n}
                            delay={(i % 2) * 0.1}
                            className={p.span}
                        >
                            <a
                                data-testid={`produto-card-${p.n}`}
                                onClick={() => trackClique("Produtos & Serviços", p.title, "produtos")}
                                href={waMessage(
                                    `Olá! Gostaria de solicitar um orçamento de ${p.title}.`,
                                    whatsapp,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative block h-72 overflow-hidden rounded-3xl border border-white/10 transition-colors duration-300 hover:border-azul/50 lg:h-80"
                            >
                                <img
                                    src={p.img}
                                    alt={p.title}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-95"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/35 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7 sm:p-8">
                                    <div>
                                        <span className="font-display text-sm font-semibold tracking-[0.2em] text-azul">
                                            {p.n}
                                        </span>
                                        <h3 className="mt-2 max-w-md font-display text-xl font-semibold text-white sm:text-2xl">
                                            {p.title}
                                        </h3>
                                        <p className="mt-2 max-w-md text-sm leading-relaxed text-silver/75">
                                            {p.desc}
                                        </p>
                                    </div>
                                    <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:border-azul group-hover:bg-azul sm:grid">
                                        <ArrowUpRight size={20} />
                                    </span>
                                </div>
                            </a>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
