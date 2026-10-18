import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons";
import { ORCAMENTO_MESSAGE, waMessage } from "@/lib/site";
import { trackClique } from "@/lib/track";
import { useSiteConfig } from "@/lib/SiteConfig";

export default function FloatingWhatsApp() {
    const { whatsapp } = useSiteConfig();
    return (
        <motion.a
            data-testid="floating-whatsapp-button"
            onClick={() => trackClique("Geral", "Botão flutuante WhatsApp", "flutuante")}
            href={waMessage(ORCAMENTO_MESSAGE, whatsapp)}
            target="_blank"
            rel="noreferrer"
            aria-label="Fale conosco no WhatsApp"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 18 }}
            className="group fixed bottom-5 right-5 z-[80] flex items-center gap-3 sm:bottom-6 sm:right-6"
        >
            <span className="pointer-events-none hidden translate-x-2 rounded-full bg-graphite2 px-4 py-2.5 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block">
                Orçamento grátis pelo WhatsApp
            </span>
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-azul text-white shadow-xl shadow-azul/30 transition-colors duration-300 group-hover:bg-azul-dark">
                <span className="pulse-ring absolute inset-0 rounded-full bg-azul" aria-hidden="true" />
                <WhatsAppIcon className="relative h-7 w-7" />
            </span>
        </motion.a>
    );
}
