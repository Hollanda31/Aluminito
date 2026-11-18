/**
 * Instalação do app (PWA).
 * O navegador avisa (beforeinstallprompt) quando o site pode ser instalado.
 * Guardamos esse aviso aqui, já na abertura do site, para o botão poder
 * usá-lo quando a pessoa clicar.
 */
import { useEffect, useState } from "react";

let deferredPrompt = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function isStandalone() {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

if (typeof window !== "undefined") {
    installed = isStandalone();

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); // guardamos para disparar quando clicarem no botão
        deferredPrompt = e;
        notify();
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        installed = true;
        notify();
    });
}

export function getPlatform() {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent || "";
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (/iphone|ipad|ipod/i.test(ua) || iPadOS) return "ios";
    if (/android/i.test(ua)) return "android";
    if (/firefox/i.test(ua)) return "firefox";
    if (/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua)) return "safari-mac";
    return "desktop"; // Chrome / Edge / Brave no computador
}

/** Abre o pedido de instalação do navegador. Retorna "accepted", "dismissed" ou "manual". */
export async function promptInstall() {
    if (!deferredPrompt) return "manual";
    const p = deferredPrompt;
    deferredPrompt = null;
    notify();
    try {
        await p.prompt();
        const { outcome } = await p.userChoice;
        return outcome;
    } catch {
        return "manual";
    }
}

export function usePWAInstall() {
    const [, force] = useState(0);
    useEffect(() => {
        const fn = () => force((n) => n + 1);
        listeners.add(fn);
        return () => listeners.delete(fn);
    }, []);
    return {
        installed,
        canPrompt: !!deferredPrompt,
        platform: getPlatform(),
    };
}

export function registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    });
}