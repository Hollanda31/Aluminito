import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Wrench } from "lucide-react";
import { startScroll, stopScroll } from "@/lib/scroll";
import { useSiteConfig } from "@/lib/SiteConfig";
import { waMessage } from "@/lib/site";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
const INTERVALO_MS = 30000;

// Pop-up de "site em manutenção" (ligado/desligado no painel, aba "Aviso do site").
// Não tem botão de fechar, não fecha com ESC nem clicando fora, e o resto da página
// fica travado (sem rolagem e sem foco por teclado) enquanto estiver ativo.
export default function ManutencaoPopup() {
    const [manutencao, setManutencao] = useState(null);
    const { whatsapp } = useSiteConfig();
    const caixa = useRef(null);
    const ativo = !!manutencao;

    // consulta o servidor ao abrir, a cada 30 s e quando a aba volta a ficar visível
    useEffect(() => {
        let vivo = true;
        const consultar = () =>
            fetch(`${BACKEND}/api/manutencao`, { cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => {
                    // se a consulta falhar, não bloqueia o site por engano
                    if (vivo && d) setManutencao(d.ativo ? d : null);
                })
                .catch(() => {});
        consultar();
        const timer = setInterval(consultar, INTERVALO_MS);
        const aoVoltar = () => {
            if (document.visibilityState === "visible") consultar();
        };
        document.addEventListener("visibilitychange", aoVoltar);
        return () => {
            vivo = false;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", aoVoltar);
        };
    }, []);

    // trava rolagem e teclado da página por trás enquanto o pop-up estiver no ar
    useEffect(() => {
        if (!ativo) return undefined;
        const raiz = document.getElementById("root");
        stopScroll();
        if (raiz) {
            raiz.inert = true;
            raiz.setAttribute("aria-hidden", "true");
        }
        caixa.current?.focus();
        const bloquearEsc = (e) => {
            if (e.key === "Escape") e.preventDefault();
        };
        window.addEventListener("keydown", bloquearEsc, true);
        return () => {
            window.removeEventListener("keydown", bloquearEsc, true);
            if (raiz) {
                raiz.inert = false;
                raiz.removeAttribute("aria-hidden");
            }
            startScroll();
        };
    }, [ativo]);

    if (!manutencao) return null;

    const linkWhatsapp = waMessage(
        "Olá! Vi que o site está em manutenção e gostaria de falar com a Aluminito.",
        whatsapp,
    );

    return createPortal(
        <div
            data-testid="manutencao-overlay"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 px-5 py-8 backdrop-blur-md"
        >
            <div
                ref={caixa}
                tabIndex={-1}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="manutencao-titulo"
                aria-describedby="manutencao-texto"
                data-testid="manutencao-popup"
                className="w-full max-w-md rounded-3xl border border-white/10 bg-graphite2 p-8 text-center shadow-2xl outline-none sm:p-10"
            >
                <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm">
                    <img
                        src="/logo-aluminito.png"
                        alt="Aluminito Esquadrias"
                        className="h-full w-full object-cover"
                    />
                </span>

                <span className="mx-auto mt-7 grid h-12 w-12 place-items-center rounded-full bg-azul/15 text-azul">
                    <Wrench size={22} aria-hidden="true" />
                </span>

                <h2
                    id="manutencao-titulo"
                    className="mt-5 font-display text-2xl font-bold text-white"
                >
                    {manutencao.titulo}
                </h2>
                <p
                    id="manutencao-texto"
                    className="mt-3 whitespace-pre-line text-sm leading-relaxed text-silver/80"
                >
                    {manutencao.mensagem}
                </p>

                {manutencao.mostrar_whatsapp && (
                    <a
                        href={linkWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="manutencao-whatsapp"
                        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-azul px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark"
                    >
                        <MessageCircle size={16} aria-hidden="true" />
                        Falar pelo WhatsApp
                    </a>
                )}
            </div>
        </div>,
        document.body,
    );
}
