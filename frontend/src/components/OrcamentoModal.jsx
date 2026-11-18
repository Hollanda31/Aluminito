import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import OrcamentoForm from "@/components/OrcamentoForm";
import { EVENTO_ABRIR_ORCAMENTO } from "@/lib/orcamento";
import { startScroll, stopScroll } from "@/lib/scroll";
import { useFocusTrap } from "@/lib/useFocusTrap";

export default function OrcamentoModal() {
    const [aberto, setAberto] = useState(false);
    const dialogRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const abrir = () => setAberto(true);
        window.addEventListener(EVENTO_ABRIR_ORCAMENTO, abrir);
        return () => {
            window.removeEventListener(EVENTO_ABRIR_ORCAMENTO, abrir);
        };
    }, []);

    useEffect(() => {
        if (aberto) stopScroll();
        else startScroll();
        return () => startScroll();
    }, [aberto]);

    useFocusTrap(aberto, dialogRef, () => setAberto(false), "input");

    const fechar = () => setAberto(false);

    return (
        <AnimatePresence>
            {aberto && (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    data-testid="orcamento-modal"
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Cadastro para orçamento"
                    tabIndex={-1}
                    className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6"
                    onClick={fechar}
                >
                    <motion.div
                        initial={reduceMotion ? false : { y: 40, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { y: 40, opacity: 0, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                        data-lenis-prevent
                        data-scroll-lock-allow
                        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#171717] shadow-2xl sm:rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            data-testid="orcamento-modal-close"
                            onClick={fechar}
                            aria-label="Fechar"
                            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-azul hover:text-white"
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
