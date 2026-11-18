import { Clock, Instagram, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { WhatsAppIcon } from "@/components/icons";
import { scrollToId } from "@/lib/scroll";
import { trackClique } from "@/lib/track";
import {
    ADDRESS,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    LEGAL_NAME,
    CNPJ,
    MAPS_URL,
} from "@/lib/site";
import { useSiteConfig } from "@/lib/SiteConfig";
import { OPEN_CONSENT_EVENT } from "@/lib/consent";

const NAV = [
    { id: "inicio", label: "Início" },
    { id: "sobre", label: "Sobre Nós" },
    { id: "cores", label: "Cores" },
    { id: "projetos", label: "Projetos" },
    { id: "depoimentos", label: "Avaliações" },
    { id: "contato", label: "Contato" },
];

export default function Footer() {
    const { whatsapp, whatsapp_display, horario } = useSiteConfig();
    return (
        <footer data-testid="footer" className="border-t border-white/10 bg-graphite">
            <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <div className="grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <Logo />
                        <p className="mt-6 max-w-xs text-sm leading-relaxed text-silver/90">
                            Projetos de esquadrias de alumínio e vidros sob medida
                            em Serra - ES e Grande Vitória.
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
                                    onClick={() => trackClique("Geral", "Rodapé - WhatsApp", "footer")}
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex gap-3 transition-colors duration-200 hover:text-white"
                                >
                                    <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-azul" />
                                    {whatsapp_display}
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
                                <span>
                                    {horario.split("\n").map((linha) => <span key={linha} className="block">{linha}</span>)}
                                </span>
                            </li>
                        </ul>
                        <a data-testid="footer-map" href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2.5 text-sm text-silver/90 transition-colors hover:border-azul hover:text-white">
                            Abrir endereço no Google Maps
                        </a>
                    </div>
                </div>

                <div className="mt-14 border-t border-white/10 pt-7">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <p data-testid="footer-copyright" className="text-xs text-silver/80">
                            © {new Date().getFullYear()} {LEGAL_NAME} · CNPJ {CNPJ}. Todos os direitos reservados.
                        </p>
                        <p className="text-xs text-silver/80">Serra · ES — Grande Vitória</p>
                    </div>
                    <nav aria-label="Informações legais e privacidade" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-silver/90">
                        <Link to="/privacidade" className="underline-offset-4 hover:text-white hover:underline">Política de privacidade</Link>
                        <Link to="/termos" className="underline-offset-4 hover:text-white hover:underline">Termos de serviço</Link>
                        <Link to="/cookies" className="underline-offset-4 hover:text-white hover:underline">Aviso de cookies</Link>
                        <Link to="/reembolso" className="underline-offset-4 hover:text-white hover:underline">Cancelamentos e reembolsos</Link>
                        <Link to="/empresa" className="underline-offset-4 hover:text-white hover:underline">Dados da empresa</Link>
                        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className="underline-offset-4 hover:text-white hover:underline">Preferências de cookies</button>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
