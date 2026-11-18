import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from "@/lib/consent";

export default function CookieConsent() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        setOpen(!pathname.startsWith("/admin") && !readConsent());
        const reopen = () => {
            if (!window.location.pathname.startsWith("/admin")) setOpen(true);
        };
        window.addEventListener(OPEN_CONSENT_EVENT, reopen);
        return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    }, [pathname]);

    const choose = (analytics) => {
        saveConsent(analytics);
        setOpen(false);
    };

    if (!open) return null;

    return (
        <aside
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
            className="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#171717]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:p-6"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                    <h2 id="cookie-consent-title" className="font-display text-base font-semibold">
                        Preferências de privacidade
                    </h2>
                    <p id="cookie-consent-description" className="mt-2 text-sm leading-relaxed text-silver/90">
                        Guardamos sua escolha neste navegador. Métricas de uso opcionais só são enviadas ao servidor da Aluminito se você autorizar; elas não incluem os dados digitados no pedido de orçamento. Sem autorização, nenhuma métrica é enviada.
                        {" "}<Link to="/cookies" className="underline underline-offset-4 hover:text-white">Aviso de cookies</Link>
                    </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:min-w-44">
                    <button type="button" onClick={() => choose(true)} className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-azul-dark">
                        Aceitar métricas
                    </button>
                    <button type="button" onClick={() => choose(false)} className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                        Recusar opcionais
                    </button>
                </div>
            </div>
        </aside>
    );
}
