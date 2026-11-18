import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { scrollToId } from "@/lib/scroll";
import { abrirOrcamento } from "@/lib/orcamento";

const LINKS = [
    { id: "inicio", label: "Início" },
    { id: "sobre", label: "Sobre Nós" },
    { id: "produtos", label: "Produtos & Serviços" },
    { id: "cores", label: "Cores" },
    { id: "projetos", label: "Projetos" },
    { id: "depoimentos", label: "Avaliações" },
    { id: "contato", label: "Contato" },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const toggleRef = useRef(null);
    const mobileNavRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 32);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        mobileNavRef.current?.querySelector("button")?.focus();
        const onKeyDown = (event) => {
            if (event.key !== "Escape") return;
            setOpen(false);
            toggleRef.current?.focus();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const go = (id) => {
        if (open) toggleRef.current?.focus();
        setOpen(false);
        scrollToId(id);
    };

    // Botão "Solicitar Orçamento": abre o formulário em pop-up, em qualquer ponto do site
    const irParaFormulario = () => {
        if (open) toggleRef.current?.focus();
        setOpen(false);
        abrirOrcamento();
    };

    return (
        <header
            style={{ top: "var(--aviso-h, 0px)" }}
            className={`fixed inset-x-0 z-50 transition-all duration-300 ${
                scrolled || open
                    ? "border-b border-white/10 bg-[#0d0d0d]/80 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
                    : "bg-transparent py-5"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
                <Logo />
                <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
                    {LINKS.map((l) => (
                        <button
                            key={l.id}
                            data-testid={`header-nav-${l.id}`}
                            onClick={() => go(l.id)}
                            className="text-[13px] font-medium tracking-wide text-silver transition-colors duration-200 hover:text-white"
                        >
                            {l.label}
                        </button>
                    ))}
                </nav>
                <div className="hidden items-center gap-3 lg:flex">
                    <button
                        type="button"
                        data-testid="header-cta-orcamento"
                        onClick={irParaFormulario}
                        className="rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                    >
                        Solicitar Orçamento
                    </button>
                </div>
                <div className="flex items-center gap-2 lg:hidden">
                    <button
                        data-testid="header-menu-toggle"
                        ref={toggleRef}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-white"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? "Fechar menu" : "Abrir menu"}
                                aria-expanded={open}
                                aria-controls="mobile-navigation"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-b border-white/10 bg-graphite/95 backdrop-blur-xl lg:hidden"
                    >
                        <nav ref={mobileNavRef} id="mobile-navigation" className="flex flex-col gap-1 px-5 py-4" aria-label="Navegação principal">
                            {LINKS.map((l) => (
                                <button
                                    key={l.id}
                                    data-testid={`mobile-nav-${l.id}`}
                                    onClick={() => go(l.id)}
                                    className="rounded-lg px-3 py-3 text-left text-[15px] font-medium text-silver transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    {l.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                data-testid="mobile-cta-orcamento"
                                onClick={irParaFormulario}
                                className="mt-2 rounded-xl bg-azul px-5 py-3.5 text-center text-sm font-semibold text-white"
                            >
                                Solicitar Orçamento
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
