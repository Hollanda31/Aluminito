import { useEffect, useRef } from "react";

const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useFocusTrap(open, dialogRef, onClose, initialFocusSelector) {
    const onCloseRef = useRef(onClose);
    const previousFocusRef = useRef(null);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) {
            if (wasOpenRef.current) {
                wasOpenRef.current = false;
                const previous = previousFocusRef.current;
                window.requestAnimationFrame(() => previous?.focus?.());
            }
            return undefined;
        }

        wasOpenRef.current = true;
        previousFocusRef.current = document.activeElement;
        const dialog = dialogRef.current;
        const first = initialFocusSelector
            ? dialog?.querySelector(initialFocusSelector)
            : dialog?.querySelector(FOCUSABLE);
        window.requestAnimationFrame(() => (first || dialog)?.focus?.());

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current?.();
                return;
            }
            if (event.key !== "Tab" || !dialog) return;
            const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
                (element) => element.getClientRects().length > 0,
            );
            if (!focusable.length) {
                event.preventDefault();
                dialog.focus();
                return;
            }
            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === firstFocusable || document.activeElement === dialog)) {
                event.preventDefault();
                lastFocusable.focus();
            } else if (!event.shiftKey && document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, dialogRef, initialFocusSelector]);
}
