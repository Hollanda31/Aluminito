export const CONSENT_KEY = "aluminito-consent-v1";
export const OPEN_CONSENT_EVENT = "aluminito:open-cookie-settings";

export function readConsent() {
    if (typeof window === "undefined") return null;
    try {
        const value = window.localStorage.getItem(CONSENT_KEY);
        if (!value) return null;
        const parsed = JSON.parse(value);
        if (!parsed || parsed.version !== 1 || !Number.isFinite(Date.parse(parsed.updatedAt))) return null;
        const maxAge = 180 * 24 * 60 * 60 * 1000;
        return Date.now() - Date.parse(parsed.updatedAt) <= maxAge ? parsed : null;
    } catch {
        return null;
    }
}

export function saveConsent(analytics) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            CONSENT_KEY,
            JSON.stringify({ version: 1, analytics: Boolean(analytics), updatedAt: new Date().toISOString() }),
        );
    } catch {
        // O site continua funcionando mesmo se o navegador bloquear armazenamento local.
    }
}

export function analyticsAllowed() {
    return readConsent()?.analytics === true;
}
