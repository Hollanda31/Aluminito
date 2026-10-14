import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { scrollToId } from "@/lib/scroll";
import { waOrcamento } from "@/lib/site";

const LINKS = [
    { id: "inicio", label: "Início" },
    { id: "sobre", label: "Sobre Nós" },
    { id: "produtos", label: "Produtos & Serviços" },
    { id: "projetos", label: "Projetos" },
    { id: "depoimentos", label: "Depoimentos" },
    { id: "contato", label: "Contato" },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 32);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const go = (id) => {
        setOpen(false);
        scrollToId(id);
    };

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled || open
                    ? "border-b border-white/10 bg-graphite/85 py-3 backdrop-blur-xl"
                    : "bg-transparent py-5"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
                <Logo />
                <nav className="hidden items-center gap-7 lg:flex">
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
                <a
                    data-testid="header-cta-orcamento"
                    href={waOrcamento}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-azul-dark lg:block"
                >
                    Solicitar Orçamento
                </a>
                <button
                    data-testid="header-menu-toggle"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-white lg:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Fechar menu" : "Abrir menu"}
                >
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-b border-white/10 bg-graphite/95 backdrop-blur-xl lg:hidden"
                    >
                        <nav className="flex flex-col gap-1 px-5 py-4">
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
                            <a
                                data-testid="mobile-cta-orcamento"
                                href={waOrcamento}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 rounded-xl bg-azul px-5 py-3.5 text-center text-sm font-semibold text-white"
                            >
                                Solicitar Orçamento
                            </a>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
