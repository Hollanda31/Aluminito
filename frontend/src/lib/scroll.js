import Lenis from "lenis";

let lenis = null;

export function initLenis() {
    if (lenis) return lenis;
    lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return lenis;
}

export function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
        lenis.scrollTo(el, { offset: -72, duration: 1.2 });
    } else {
        el.scrollIntoView({ behavior: "smooth" });
    }
}

let lockHandler = null;

export function stopScroll() {
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (!lockHandler) {
        lockHandler = (e) => {
            const alvo = e.target;
            const dentro =
                alvo && alvo.closest && alvo.closest("[data-scroll-lock-allow]");
            if (!dentro) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
        window.addEventListener("wheel", lockHandler, { passive: false, capture: true });
        window.addEventListener("touchmove", lockHandler, { passive: false, capture: true });
    }
}

export function startScroll() {
    if (lenis) lenis.start();
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (lockHandler) {
        window.removeEventListener("wheel", lockHandler, { capture: true });
        window.removeEventListener("touchmove", lockHandler, { capture: true });
        lockHandler = null;
    }
}
