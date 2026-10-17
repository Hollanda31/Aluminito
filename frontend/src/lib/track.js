const BACKEND = process.env.REACT_APP_BACKEND_URL;

export function trackClique(grupo, item, origem) {
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
