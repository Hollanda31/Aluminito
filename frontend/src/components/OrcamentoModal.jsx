import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import OrcamentoForm from "@/components/OrcamentoForm";
import { EVENTO_ABRIR_ORCAMENTO } from "@/lib/orcamento";
import { startScroll, stopScroll } from "@/lib/scroll";

export default function OrcamentoModal() {
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        const abrir = () => setAberto(true);
        const onKey = (e) => e.key === "Escape" && setAberto(false);
        window.addEventListener(EVENTO_ABRIR_ORCAMENTO, abrir);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener(EVENTO_ABRIR_ORCAMENTO, abrir);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    useEffect(() => {
        if (aberto) stopScroll();
        else startScroll();
        return () => startScroll();
    }, [aberto]);

    const fechar = () => setAberto(false);

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    data-testid="orcamento-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Cadastro para orçamento"
                    className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
                    onClick={fechar}
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        data-lenis-prevent
                        data-scroll-lock-allow
                        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            data-testid="orcamento-modal-close"
                            onClick={fechar}
                            aria-label="Fechar"
                            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-graphite transition-colors hover:bg-azul hover:text-white"
                        >
                            <X size={18} />
                        </button>
                        <OrcamentoForm className="p-6 sm:p-8" onEnviado={fechar} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
