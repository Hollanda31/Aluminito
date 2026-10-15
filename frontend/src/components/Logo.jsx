import { scrollToId } from "@/lib/scroll";

export default function Logo() {
    return (
        <button
            data-testid="header-logo"
            onClick={() => scrollToId("inicio")}
            className="group flex items-center gap-3"
            aria-label="Aluminito — voltar ao início"
        >
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-black/5 shadow-sm transition-shadow duration-300 group-hover:shadow-azul/30">
                <img
                    src="/logo-aluminito.jpg"
                    alt="Aluminito Esquadrias"
                    className="h-full w-full rounded-lg object-cover object-[55%_30%]"
                />
            </span>
            <span className="text-left leading-none">
                <span className="block font-display text-lg font-bold tracking-[0.18em] text-white">
                    ALUMINITO
                </span>
                <span className="mt-1 block text-[10px] font-medium tracking-[0.3em] text-silver/70">
                    ESQUADRIAS & VIDROS
                </span>
            </span>
        </button>
    );
}
