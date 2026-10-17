import { useState } from "react";
import { Download, MonitorSmartphone, Share, SquarePlus, EllipsisVertical } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { promptInstall, usePWAInstall } from "@/lib/pwa";

const STEPS = {
    ios: {
        title: "Instalar no iPhone / iPad",
        note: "Abra este site no Safari para instalar.",
        steps: [
            { icon: Share, text: "Toque no botão Compartilhar, na barra do Safari." },
            { icon: SquarePlus, text: "Escolha “Adicionar à Tela de Início”." },
            { icon: Download, text: "Toque em “Adicionar”. O app da Aluminito aparece na sua tela." },
        ],
    },
    android: {
        title: "Instalar no Android",
        note: "Use o Google Chrome para instalar.",
        steps: [
            { icon: EllipsisVertical, text: "Toque no menu ⋮ do navegador, no canto superior." },
            { icon: Download, text: "Escolha “Instalar app” (ou “Adicionar à tela inicial”)." },
            { icon: SquarePlus, text: "Confirme em “Instalar”. O app aparece na sua tela." },
        ],
    },
    "safari-mac": {
        title: "Instalar no Mac (Safari)",
        note: "Disponível no Safari 17 ou mais novo.",
        steps: [
            { icon: Share, text: "Clique em Compartilhar, na barra de ferramentas." },
            { icon: SquarePlus, text: "Escolha “Adicionar ao Dock”." },
            { icon: Download, text: "Clique em “Adicionar”." },
        ],
    },
    firefox: {
        title: "Instalar no computador",
        note: "O Firefox no computador não instala sites como app. Abra este site no Google Chrome ou no Microsoft Edge para instalar.",
        steps: [],
    },
    desktop: {
        title: "Instalar no computador",
        note: "Funciona no Google Chrome e no Microsoft Edge.",
        steps: [
            { icon: Download, text: "Clique no ícone de instalar, no fim da barra de endereço." },
            { icon: EllipsisVertical, text: "Ou abra o menu ⋮ e escolha “Instalar Aluminito”." },
            { icon: SquarePlus, text: "Confirme em “Instalar”. O app abre em janela própria." },
        ],
    },
};

const STYLES = {
    header:
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5",
    mobile:
        "flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5",
    footer:
        "inline-flex items-center gap-2.5 rounded-full border border-white/15 px-5 py-2.5 text-sm text-silver transition-colors duration-200 hover:border-azul hover:text-white",
};

export default function InstallAppButton({ variant = "header", onDone }) {
    const { installed, platform } = usePWAInstall();
    const [open, setOpen] = useState(false);

    // Já está usando o app instalado: não precisa do botão
    if (installed) return null;

    const handleClick = async () => {
        const result = await promptInstall();
        if (result === "manual") setOpen(true);
        if (result !== "dismissed" && onDone) onDone();
    };

    const guide = STEPS[platform] || STEPS.desktop;

    return (
        <>
            <button
                type="button"
                data-testid={`install-app-${variant}`}
                onClick={handleClick}
                aria-label="Baixar o app da Aluminito"
                className={STYLES[variant]}
            >
                <Download size={variant === "footer" ? 16 : 17} className={variant === "footer" ? "text-azul" : ""} />
                {variant === "header" ? (
                    <span className="hidden xl:inline">Baixar App</span>
                ) : (
                    <span>Baixar o App</span>
                )}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    data-testid="install-app-dialog"
                    className="max-w-md border-white/10 bg-graphite2 text-white"
                >
                    <DialogHeader>
                        <span className="mb-1 grid h-12 w-12 place-items-center rounded-xl bg-azul/10 text-azul">
                            <MonitorSmartphone size={24} />
                        </span>
                        <DialogTitle className="font-display text-xl">{guide.title}</DialogTitle>
                        <DialogDescription className="text-silver">{guide.note}</DialogDescription>
                    </DialogHeader>
                    {guide.steps.length > 0 && (
                        <ol className="space-y-3">
                            {guide.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 p-3.5">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-azul">
                                        <s.icon size={16} />
                                    </span>
                                    <p className="text-sm leading-relaxed text-silverlight">
                                        <span className="mr-1.5 font-semibold text-white">{i + 1}.</span>
                                        {s.text}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}