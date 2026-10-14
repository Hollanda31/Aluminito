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
