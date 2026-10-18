import { createContext, useContext, useEffect, useState } from "react";

const DEFAULT_CONFIG = {
    whatsapp: "5527998682220",
    whatsapp_display: "(27) 99868-2220",
    horario: "Segunda a Quinta · 08:00 às 18:00\nSexta-feira · 08:00 às 17:00",
};
const SiteConfigContext = createContext(DEFAULT_CONFIG);

export function SiteConfigProvider({ children }) {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    useEffect(() => {
        const load = () => fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/api/site-config`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => data && setConfig((current) => ({ ...current, ...data })))
            .catch(() => {});
        load();
        window.addEventListener("site-config-updated", load);
        return () => window.removeEventListener("site-config-updated", load);
    }, []);
    return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteConfigContext);
