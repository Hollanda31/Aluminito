import Reveal from "@/components/Reveal";
import OrcamentoForm from "@/components/OrcamentoForm";
import { WhatsAppIcon } from "@/components/icons";
import { Clock, Instagram, MapPin } from "lucide-react";
import {
    ADDRESS,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
} from "@/lib/site";
import { useSiteConfig } from "@/lib/SiteConfig";
import { trackClique } from "@/lib/track";

export default function Contato() {
    const { whatsapp, whatsapp_display, horario } = useSiteConfig();
    return (
        <section
            id="contato"
            data-testid="contato-section"
            className="relative overflow-hidden bg-graphite2 py-24 sm:py-32"
        >
            <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-azul/10 blur-[130px]" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
                <Reveal>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                        Orçamento sem compromisso
                    </p>
                    <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                        Tem um projeto de arquitetura ou reforma em mãos?
                    </h2>
                    <p className="mt-5 max-w-lg text-base leading-relaxed text-silver/75 sm:text-lg">
                        Envie sua planta ou descreva seu projeto e receba uma
                        cotação rápida, personalizada e sem compromisso.
                    </p>

                    <div className="mt-9 space-y-4">
                        <a
                            data-testid="contato-whatsapp-link"
                            onClick={() => trackClique("Geral", "Contato - WhatsApp", "contato")}
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4 transition-colors duration-300 hover:border-azul/50"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <WhatsAppIcon className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    WhatsApp
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {whatsapp_display}
                                </span>
                            </span>
                        </a>
                        <a
                            data-testid="contato-instagram-link"
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4 transition-colors duration-300 hover:border-azul/50"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <Instagram size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Instagram
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {INSTAGRAM_HANDLE}
                                </span>
                            </span>
                        </a>
                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <MapPin size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Endereço
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {ADDRESS}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <Clock size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Atendimento
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {horario.replace(/\n/g, " · ")}
                                </span>
                            </span>
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.12}>
                    <OrcamentoForm id="formulario-orcamento" className="scroll-mt-24 rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9" />
                </Reveal>
            </div>
        </section>
    );
}
