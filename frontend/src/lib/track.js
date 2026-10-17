const BACKEND = process.env.REACT_APP_BACKEND_URL;

/**
 * Registra um clique/pedido de atendimento no painel.
 * `dados` é opcional: usado pelo formulário para guardar nome, telefone,
 * cidade, obra, prazo, medidas e detalhes (só textos).
 */
export function trackClique(grupo, item, origem, dados) {
    try {
        fetch(`${BACKEND}/api/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grupo,
                item,
                origem,
                ...(dados ? { dados } : {}),
            }),
            keepalive: true,
        }).catch(() => {});
    } catch (e) {
        /* rastreamento nunca deve quebrar a navegação */
    }
}