/* Service worker do app Aluminito.
 * - Necessário para o navegador oferecer a instalação do app.
 * - Páginas: tenta a rede primeiro; se estiver sem internet, mostra a última versão salva.
 * - Nunca guarda chamadas da API (/api/*) nem sites de terceiros (mapa, Instagram etc.). */
const CACHE = "aluminito-v1";
const SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/logo-aluminito.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin")) return;

    // Navegação: rede primeiro, com a página salva como reserva offline
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put("/", copy));
                    return res;
                })
                .catch(() => caches.match("/")),
        );
        return;
    }

    // Arquivos estáticos (imagens, JS, CSS): usa o salvo e atualiza em segundo plano
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(CACHE).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        }),
    );
});