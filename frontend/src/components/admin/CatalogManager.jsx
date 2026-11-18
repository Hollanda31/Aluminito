import { useEffect, useMemo, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { PINTURA, MADEIRA } from "@/components/CatalogoCores";
import AdminHelp from "@/components/admin/AdminHelp";

const DEFAULTS = [...PINTURA, ...MADEIRA];

export default function CatalogManager() {
    const [items, setItems] = useState(DEFAULTS.map((c) => ({ arq: c.arq, nome: c.nome, codigo: c.codigo, ativo: true, mais_pedida: false })));
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [preview, setPreview] = useState(false);
    const grouped = useMemo(() => ({ Madeira: items.filter((x) => x.arq.startsWith("COD.")), Pintura: items.filter((x) => !x.arq.startsWith("COD.")) }), [items]);

    useEffect(() => {
        if (!preview) return;
        const scrollY = window.scrollY;
        const body = document.body;
        const html = document.documentElement;
        const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow, htmlOverflow: html.style.overflow };
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
        body.style.overflow = "hidden";
        html.style.overflow = "hidden";
        return () => {
            body.style.position = previous.position;
            body.style.top = previous.top;
            body.style.width = previous.width;
            body.style.overflow = previous.overflow;
            html.style.overflow = previous.htmlOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [preview]);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/admin/catalogo/cores/draft"))
            .then(({ data }) => {
                if (!data.items?.length) return;
                const saved = Object.fromEntries(data.items.map((x) => [x.arq, x]));
                setItems((all) => all.map((x) => ({ ...x, ...(saved[x.arq] || {}) })));
                setDraftSaved(data.rascunho);
            }).catch(() => setMsg("Não foi possível carregar o catálogo."));
    }, []);
    const change = (arq, key, value) => { setDraftSaved(false); setItems((all) => all.map((x) => x.arq === arq ? { ...x, [key]: value } : x)); };
    const save = async () => {
        setBusy(true); setMsg("");
        try { await withAuthRefresh(() => authApi.put("/api/admin/catalogo/cores", { items })); setDraftSaved(true); setMsg("Rascunho salvo. O catálogo publicado ainda não mudou."); }
        catch { setMsg("Não foi possível salvar o catálogo."); }
        finally { setBusy(false); }
    };
    const publish = async () => {
        if (!draftSaved || !window.confirm("Publicar agora as alterações do catálogo?")) return;
        setBusy(true);
        try { await withAuthRefresh(() => authApi.post("/api/admin/catalogo/cores/publicar")); setDraftSaved(false); setMsg("Catálogo publicado no site."); }
        catch { setMsg("Não foi possível publicar o catálogo."); }
        finally { setBusy(false); }
    };

    return <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
        <AdminHelp className="mb-4">Desative cores temporariamente quando estiverem em falta e marque como “mais pedida” para dar destaque. Salve o rascunho e publique para atualizar o catálogo do site.</AdminHelp>
        <h2 className="font-display text-xl font-semibold">Cores do catálogo</h2>
        <p className="mt-1 text-sm text-silver/60">Desative cores em falta ou marque as mais pedidas.</p>
        <div className="mt-5 space-y-6">{Object.entries(grouped).map(([group, colors]) => <div key={group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-azul">{group}</h3>
            <div className="grid gap-2 sm:grid-cols-2">{colors.map((c) => <div key={c.arq} className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                <img src={`/cores/${c.arq}`} alt="" className="h-9 w-9 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{c.nome} <span className="text-silver/50">{c.codigo}</span></span>
                <label className="flex items-center gap-1.5 text-xs text-silver/70"><input type="checkbox" checked={c.ativo} onChange={(e) => change(c.arq, "ativo", e.target.checked)} />Disponível</label>
                <label className="flex items-center gap-1.5 text-xs text-silver/70"><input type="checkbox" checked={c.mais_pedida} onChange={(e) => change(c.arq, "mais_pedida", e.target.checked)} />Destaque</label>
            </div>)}</div>
        </div>)}</div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={save} disabled={busy} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold">{busy ? "Salvando..." : "Salvar rascunho"}</button><button onClick={() => setPreview(true)} className="rounded-full border border-white/20 px-5 py-2.5 text-sm">Ver prévia</button><button onClick={publish} disabled={!draftSaved || busy} className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold disabled:opacity-40">Publicar no site</button><span role="status" className="text-sm text-silver/70">{msg}</span></div>
        {preview && <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-black/80 p-5" role="dialog" aria-modal="true" aria-label="Prévia do catálogo"><div className="max-h-[calc(100vh-2.5rem)] max-h-[calc(100dvh-2.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl bg-graphite p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Prévia do catálogo</h3><button onClick={() => setPreview(false)} className="rounded-full border border-white/20 px-4 py-2">Fechar</button></div><p className="mt-2 text-sm text-silver/60">Cores disponíveis: {items.filter((x) => x.ativo).length} · Destaques: {items.filter((x) => x.ativo && x.mais_pedida).length}</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{items.filter((x) => x.ativo).map((x) => <div key={x.arq} className="overflow-hidden rounded-xl bg-white text-graphite"><img src={`/cores/${x.arq}`} alt="" className="h-24 w-full object-cover"/><div className="p-2"><p className="truncate text-sm font-semibold">{x.nome}</p>{x.mais_pedida && <span className="text-[10px] font-semibold text-amber-700">Mais pedida</span>}</div></div>)}</div></div></div>}
    </section>;
}
