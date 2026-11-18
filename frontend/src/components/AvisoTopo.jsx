import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const CORES = {
    info: "bg-graphite2 text-white border-b border-white/10",
    alerta: "bg-amber-500 text-black",
    promo: "bg-azul text-white",
};

// Barra de aviso no topo do site (texto editado no painel, aba "Aviso").
// Fica fixa no topo e empurra o cabeçalho para baixo com a variável --aviso-h.
export default function AvisoTopo() {
    const [aviso, setAviso] = useState(null);
    const [fechado, setFechado] = useState(false);
    const barra = useRef(null);

    useEffect(() => {
        let vivo = true;
        fetch(`${BACKEND}/api/aviso`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!vivo || !d || !d.ativo) return;
                let dispensado = false;
                try {
                    dispensado = sessionStorage.getItem("aviso-fechado") === d.texto;
                } catch (e) {
                    /* sem sessionStorage: mostra normalmente */
                }
                if (dispensado) setFechado(true);
                setAviso(d);
            })
            .catch(() => {});
        return () => {
            vivo = false;
        };
    }, []);

    const visivel = !!aviso && !fechado;

    // reserva o espaço da barra para o cabeçalho fixo não ficar por cima
    useEffect(() => {
        const root = document.documentElement;
        if (!visivel || !barra.current) {
            root.style.setProperty("--aviso-h", "0px");
            return undefined;
        }
        const medir = () =>
            root.style.setProperty("--aviso-h", `${barra.current.offsetHeight}px`);
        medir();
        window.addEventListener("resize", medir);
        return () => {
            window.removeEventListener("resize", medir);
            root.style.setProperty("--aviso-h", "0px");
        };
    }, [visivel, aviso]);

    if (!visivel) return null;

    const fechar = () => {
        setFechado(true);
        try {
            sessionStorage.setItem("aviso-fechado", aviso.texto);
        } catch (e) {
            /* ignora */
        }
    };

    return (
        <>
            <div
                ref={barra}
                data-testid="aviso-topo"
                role="status"
                className={`fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 px-10 py-2 text-center text-[13px] font-medium leading-snug ${CORES[aviso.tipo] || CORES.info}`}
            >
                <span>{aviso.texto}</span>
                <button
                    type="button"
                    data-testid="aviso-fechar"
                    onClick={fechar}
                    aria-label="Fechar aviso"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-70 transition hover:opacity-100"
                >
                    <X size={14} />
                </button>
            </div>
            {/* espaço na página para o conteúdo não ficar escondido sob a barra */}
            <div aria-hidden="true" style={{ height: "var(--aviso-h, 0px)" }} />
        </>
    );
}
