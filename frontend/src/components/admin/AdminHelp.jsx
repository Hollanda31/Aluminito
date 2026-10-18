export default function AdminHelp({ children, className = "" }) {
    return (
        <details className={`rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 ${className}`}>
            <summary className="cursor-pointer text-xs font-semibold text-azul">Como usar esta área</summary>
            <div className="mt-2 text-xs leading-relaxed text-silver/65">{children}</div>
        </details>
    );
}
