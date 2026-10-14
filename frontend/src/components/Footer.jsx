import { Clock, Instagram, MapPin } from "lucide-react";
import Logo from "@/components/Logo";
import { WhatsAppIcon } from "@/components/icons";
import { scrollToId } from "@/lib/scroll";
import {
    ADDRESS,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    MAPS_EMBED,
    WA_DISPLAY,
    WA_LINK,
} from "@/lib/site";

const NAV = [
    { id: "inicio", label: "Início" },
    { id: "sobre", label: "Sobre Nós" },
    { id: "produtos", label: "Produtos & Serviços" },
    { id: "projetos", label: "Projetos" },
    { id: "depoimentos", label: "Depoimentos" },
    { id: "contato", label: "Contato" },
];

export default function Footer() {
    return (
        <footer data-testid="footer" className="border-t border-white/10 bg-graphite">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <div className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <Logo />
                        <p className="mt-6 max-w-xs text-sm leading-relaxed text-silver/60">
                            Esquadrias de alumínio e vidros sob medida, com
                            fabricação própria e instalação técnica
                            especializada em Serra - ES e Grande Vitória.
                        </p>
                        <a
                            data-testid="footer-instagram"
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-5 py-2.5 text-sm text-silver transition-colors duration-200 hover:border-azul hover:text-white"
                        >
                            <Instagram size={16} className="text-azul" />
                            {INSTAGRAM_HANDLE}
                        </a>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-silver/50">
                            Navegação
                        </h4>
                        <ul className="mt-5 space-y-3">
                            {NAV.map((l) => (
                                <li key={l.id}>
                                    <button
                                        data-testid={`footer-nav-${l.id}`}
                                        onClick={() => scrollToId(l.id)}
                                        className="text-sm text-silver/70 transition-colors duration-200 hover:text-white"
                                    >
                                        {l.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-5">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-silver/50">
                            Contato & Localização
                        </h4>
                        <ul className="mt-5 space-y-4 text-sm text-silver/70">
                            <li className="flex gap-3">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-azul" />
                                {ADDRESS}
                            </li>
                            <li>
                                <a
                                    data-testid="footer-whatsapp"
                                    href={WA_LINK}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex gap-3 transition-colors duration-200 hover:text-white"
                                >
                                    <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-azul" />
                                    {WA_DISPLAY}
                                </a>
                            </li>
                            <li>
                                <a
                                    data-testid="footer-instagram-link"
                                    href={INSTAGRAM_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex gap-3 transition-colors duration-200 hover:text-white"
                                >
                                    <Instagram size={16} className="mt-0.5 shrink-0 text-azul" />
                                    {INSTAGRAM_HANDLE}
                                </a>
                            </li>
                            <li className="flex gap-3">
                                <Clock size={16} className="mt-0.5 shrink-0 text-azul" />
                                Segunda a Sexta · 07h30 às 17h30
                            </li>
                        </ul>
                        <div
                            data-testid="footer-map"
                            className="mt-6 overflow-hidden rounded-2xl border border-white/10"
                        >
                            <iframe
                                title="Mapa — Aluminito Esquadrias, Serra - ES"
                                src={MAPS_EMBED}
                                loading="lazy"
                                className="h-44 w-full grayscale-[0.35]"
                                style={{ border: 0 }}
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-7 sm:flex-row">
                    <p data-testid="footer-copyright" className="text-xs text-silver/50">
                        © {new Date().getFullYear()} Aluminito Esquadrias de
                        Alumínio e Vidros. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-silver/40">Serra · ES — Grande Vitória</p>
                </div>
            </div>
        </footer>
    );
}
