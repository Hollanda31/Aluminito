const BACKEND = process.env.REACT_APP_BACKEND_URL;

export function trackProjectMetric(projectId, title, action) {
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

// `dados` (opcional): campos do formulário de orçamento (nome, telefone, cidade,
// tipo, situacao, medidas, cor, prazo, obs). Aparecem no painel e no CSV.
export function trackClique(grupo, item, origem, dados) {
    try {
        fetch(`${BACKEND}/api/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grupo, item, origem, ...(dados ? { dados } : {}) }),
            keepalive: true,
        }).catch(() => {});
    } catch (e) {
        /* rastreamento nunca deve quebrar a navegação */
    }
}
