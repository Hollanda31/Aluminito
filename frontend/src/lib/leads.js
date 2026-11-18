import { authApi, withAuthRefresh } from "@/lib/auth";

export const STATUS_LEAD = [
    { id: "novo", label: "Novo", cls: "bg-azul/15 text-azul" },
    { id: "em_conversa", label: "Em conversa", cls: "bg-amber-400/15 text-amber-300" },
    { id: "orcamento_enviado", label: "Orçamento enviado", cls: "bg-sky-400/15 text-sky-300" },
    { id: "fechado", label: "Fechado", cls: "bg-emerald-400/15 text-emerald-300" },
    { id: "perdido", label: "Perdido", cls: "bg-white/10 text-silver/60" },
];

export const PRIORIDADE_LEAD = [
    { id: "baixa", label: "Baixa", cls: "bg-white/10 text-silver/70" },
    { id: "media", label: "Média", cls: "bg-sky-400/15 text-sky-300" },
    { id: "alta", label: "Alta", cls: "bg-red-400/15 text-red-300" },
];

export const prioridadeInfo = (id) =>
    PRIORIDADE_LEAD.find((p) => p.id === id) || PRIORIDADE_LEAD[1];

export const statusInfo = (id) =>
    STATUS_LEAD.find((s) => s.id === id) || STATUS_LEAD[0];

export const TIPOS_SIM = {
    porta: "Porta",
    janela: "Janela",
    persiana: "Persiana",
    outros: "Outros",
    vidro: "Pele de vidro",
};

// Baixa o CSV de atendimentos (abre direto no Excel, com acentos e ";").
export async function baixarCsv({ periodo = "mes", status = "", q = "" } = {}) {
    const { data } = await withAuthRefresh(() =>
        authApi.get("/api/admin/leads/export.csv", {
            params: { periodo, status, q },
            responseType: "blob",
        }),
    );
    const url = URL.createObjectURL(
        new Blob([data], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `atendimentos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Link do WhatsApp do cliente a partir do telefone digitado no formulário.
export function waCliente(telefone) {
    const d = String(telefone || "").replace(/\D/g, "");
    if (d.length === 10 || d.length === 11) return `https://wa.me/55${d}`;
    if (d.length >= 12 && d.startsWith("55")) return `https://wa.me/${d}`;
    return null;
}
