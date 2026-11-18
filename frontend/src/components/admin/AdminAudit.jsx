import { useCallback, useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";

const date = (value) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function AdminAudit() {
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState("");
    const load = useCallback(async () => {
        try { const { data } = await withAuthRefresh(() => authApi.get("/api/admin/audit", { params: { limit: 200 } })); setRows(data); }
        catch { setStatus("Não foi possível carregar o histórico."); }
    }, []);
    useEffect(() => { load(); }, [load]);
    return <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Histórico de alterações</h2><p className="mt-1 text-sm text-silver/60">Registro de mudanças feitas pela equipe no painel.</p></div><button onClick={load} className="rounded-full border border-white/20 px-4 py-2 text-sm">Atualizar</button></div>
        {rows.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase text-silver/50"><th className="pb-3 pr-4">Quando</th><th className="pb-3 pr-4">Quem</th><th className="pb-3 pr-4">Ação</th><th className="pb-3">Detalhes</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-white/5"><td className="py-3 pr-4 whitespace-nowrap text-silver/70">{date(row.timestamp)}</td><td className="py-3 pr-4">{row.actor_name || row.actor_email}</td><td className="py-3 pr-4">{row.action}</td><td className="py-3 text-xs text-silver/60">{Object.entries(row.details || {}).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" · ") || "—"}</td></tr>)}</tbody></table></div> : <p className="mt-6 text-sm text-silver/60">{status || "Ainda não há alterações registradas."}</p>}
    </section>;
}
