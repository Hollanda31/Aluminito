import { useCallback, useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";

const date = (value) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function AdminTrash() {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);
    const load = useCallback(async () => {
        try { const { data } = await withAuthRefresh(() => authApi.get("/api/admin/trash")); setItems(data); }
        catch { setStatus("Não foi possível carregar a lixeira."); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const restore = async (item) => {
        setBusy(true); setStatus("");
        try { await withAuthRefresh(() => authApi.post(`/api/admin/trash/${item.id}/restore`)); setStatus("Item restaurado."); await load(); }
        catch (e) { setStatus(e.response?.data?.detail || "Não foi possível restaurar o item."); }
        finally { setBusy(false); }
    };
    return <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Lixeira</h2><p className="mt-1 text-sm text-silver/60">Obras, mídias e avaliações removidas da publicação podem ser recuperadas.</p></div><button onClick={load} className="rounded-full border border-white/20 px-4 py-2 text-sm">Atualizar</button></div>
        {items.length ? <ul className="mt-5 space-y-2">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title || item.kind}</p><p className="text-xs text-silver/50">{({ project: "Obra", media: "Foto/vídeo", review: "Avaliação" })[item.kind] || item.kind} · removido em {date(item.deleted_at)}{item.deleted_by ? ` · ${item.deleted_by}` : ""}</p></div><button onClick={() => restore(item)} disabled={busy} className="rounded-full bg-azul px-4 py-2 text-xs font-semibold disabled:opacity-50">Restaurar</button></li>)}</ul> : <p className="mt-6 text-sm text-silver/60">A lixeira está vazia.</p>}
        {status && <p role="status" className="mt-4 text-sm text-silver/70">{status}</p>}
    </section>;
}
