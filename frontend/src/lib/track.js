import { analyticsAllowed } from "@/lib/consent";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export function trackProjectMetric(projectId, title, action) {
    if (!analyticsAllowed()) return;
    try {
        fetch(`${BACKEND || ""}/api/track/project`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: String(projectId), title, action }),
            keepalive: true,
        }).catch(() => {});
    } catch (e) {
        /* métricas nunca devem interromper a navegação */
    }
}

export function trackClique(grupo, item, origem) {
    if (!analyticsAllowed()) return;
    try {
        fetch(`${BACKEND}/api/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grupo, item, origem }),
            keepalive: true,
        }).catch(() => {});
    } catch (e) {
        /* rastreamento nunca deve quebrar a navegação */
    }
}
