import { useEffect, useRef, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { PROJECTS as DEFAULT_PROJECTS } from "@/components/Projetos";
import AdminHelp from "@/components/admin/AdminHelp";

const fromDefaults = () => DEFAULT_PROJECTS.map((p) => ({
    ...p,
    media: p.media || [
        ...(p.imgs || (p.img ? [p.img] : [])).map((src) => ({ type: "image", src })),
        ...(p.video ? [{ type: "video", src: p.video }] : []),
    ],
}));
const mediaSrc = (src) => src?.startsWith("/api/media/")
    ? `${process.env.REACT_APP_BACKEND_URL || ""}${src}`
    : src;
const optimizeImageFile = async (file) => {
    if (!file?.type?.startsWith("image/") || file.size < 350 * 1024 || typeof createImageBitmap !== "function") return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
        if (!blob || blob.size >= file.size) return file;
        const baseName = (file.name || "imagem").replace(/\.[^.]+$/, "");
        return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
    } catch { return file; }
};

export default function ProjectsManager() {
    const [projects, setProjects] = useState(fromDefaults);
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [preview, setPreview] = useState(false);
    const [previewMode, setPreviewMode] = useState("desktop");
    const [mobileReviewed, setMobileReviewed] = useState(false);
    const [checklistOpen, setChecklistOpen] = useState(false);
    const [publishChecks, setPublishChecks] = useState({ titles: false, photos: false, descriptions: false });
    const [metrics, setMetrics] = useState({});
    const baseline = useRef(fromDefaults());

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
        withAuthRefresh(() => authApi.get("/api/admin/projetos/draft"))
            .then(({ data }) => { if (data.configurado) setProjects(data.items || []); if (data.baseline_items?.length) baseline.current = data.baseline_items; else if (data.configurado && !data.rascunho) baseline.current = data.items || []; setDraftSaved(data.rascunho); })
            .catch(() => setStatus("Não foi possível carregar as obras salvas."));
    }, []);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/admin/projetos/metrics", { params: { dias: 30 } }))
            .then(({ data }) => setMetrics(Object.fromEntries(data.map((item) => [item.project_id, item]))))
            .catch(() => {});
    }, []);

    const update = (index, change) => { setDraftSaved(false); setMobileReviewed(false); setProjects((all) => all.map((p, i) => i === index ? { ...p, ...change } : p)); };
    const moveMedia = (projectIndex, mediaIndex, dir) => {
        const media = [...projects[projectIndex].media];
        const target = mediaIndex + dir;
        if (target < 0 || target >= media.length) return;
        [media[mediaIndex], media[target]] = [media[target], media[mediaIndex]];
        update(projectIndex, { media });
    };
    const move = (index, dir) => { setDraftSaved(false); setMobileReviewed(false); setProjects((all) => {
        const next = [...all]; const target = index + dir;
        if (target < 0 || target >= next.length) return all;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    }); };
    const upload = async (projectIndex, file, replaceIndex = null) => {
        if (!file) return;
        setBusy(true); setStatus(file.type.startsWith("image/") ? "Otimizando imagem..." : "Enviando mídia...");
        try {
            const uploadFile = await optimizeImageFile(file);
            const body = new FormData(); body.append("file", uploadFile);
            setStatus(uploadFile !== file ? `Imagem otimizada (${Math.round((1 - uploadFile.size / file.size) * 100)}% menor). Enviando...` : "Enviando mídia...");
            const { data } = await withAuthRefresh(() => authApi.post("/api/admin/media", body));
            const type = uploadFile.type.startsWith("video/") ? "video" : "image";
            const media = [...projects[projectIndex].media];
            if (replaceIndex === null) media.push({ type, src: data.url });
            else media[replaceIndex] = { type, src: data.url };
            update(projectIndex, { media });
            setDraftSaved(false); setStatus("Mídia enviada. Salve o rascunho antes de publicar.");
        } catch { setStatus("Falha no envio. Confira o limite de 30 MB e tente novamente."); }
        finally { setBusy(false); }
    };
    const save = async () => {
        setBusy(true); setStatus("");
        try {
            const { data } = await withAuthRefresh(() => authApi.put("/api/admin/projetos", { items: projects, baseline_items: baseline.current }));
            setProjects(data.items); setDraftSaved(true); setStatus("Rascunho salvo. O site ainda não foi alterado.");
        } catch { setStatus("Não foi possível salvar. Revise se cada obra tem ao menos uma mídia."); }
        finally { setBusy(false); }
    };
    const openPublishChecklist = () => {
        if (!draftSaved) return;
        setPublishChecks({ titles: false, photos: false, descriptions: false });
        setChecklistOpen(true);
    };
    const publish = async () => {
        if (!draftSaved || !publishChecks.titles || !publishChecks.photos || !publishChecks.descriptions || !mobileReviewed) return;
        setChecklistOpen(false);
        setBusy(true);
        try { const { data } = await withAuthRefresh(() => authApi.post("/api/admin/projetos/publicar")); setProjects(data.items); baseline.current = data.items; setDraftSaved(false); setStatus("Galeria publicada no site."); }
        catch { setStatus("Não foi possível publicar. Salve o rascunho novamente."); }
        finally { setBusy(false); }
    };
    const add = () => { setDraftSaved(false); setMobileReviewed(false); setProjects((all) => [...all, { id: `novo-${Date.now()}`, cat: "Portas", title: "Nova obra", description: "", tall: false, media: [] }]); };
    const removeProject = (index) => {
        if (!window.confirm("Remover esta obra do rascunho? Ela só sairá do site após publicar.")) return;
        setDraftSaved(false); setMobileReviewed(false); setProjects((all) => all.filter((_, i) => i !== index));
    };
    const removeMedia = (projectIndex, mediaIndex) => {
        if (!window.confirm("Remover esta foto ou vídeo da obra? A alteração só vai ao site após publicar.")) return;
        update(projectIndex, { media: projects[projectIndex].media.filter((_, i) => i !== mediaIndex) });
    };

    return <section className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
        <AdminHelp className="mb-4">Edite títulos, categorias, descrições e mídias. Fotos são reduzidas automaticamente antes do envio quando isso diminui o arquivo. Antes de publicar, revise a prévia no celular e complete o checklist.</AdminHelp>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-display text-xl font-semibold">Obras e galeria</h2><p className="mt-1 text-sm text-silver/60">Adicione fotos e vídeos, retire mídias e ordene como aparecem no site.</p></div>
            <button onClick={add} className="rounded-full border border-white/20 px-4 py-2 text-sm">Adicionar obra</button>
        </div>
        <div className="mt-5 space-y-4">
            {projects.map((p, i) => <article key={p.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex flex-wrap gap-3">
                    <input aria-label="Título da obra" value={p.title} onChange={(e) => update(i, { title: e.target.value })} className="min-w-[220px] flex-1 rounded-lg bg-graphite px-3 py-2 text-sm" />
                    <input aria-label="Categoria da obra" value={p.cat} onChange={(e) => update(i, { cat: e.target.value })} className="w-48 rounded-lg bg-graphite px-3 py-2 text-sm" />
                    <button onClick={() => move(i, -1)} aria-label="Mover obra para cima" className="rounded-lg border border-white/15 px-3">↑</button>
                    <button onClick={() => move(i, 1)} aria-label="Mover obra para baixo" className="rounded-lg border border-white/15 px-3">↓</button>
                    <label className="flex items-center gap-2 rounded-lg border border-white/15 px-3 text-xs"><input type="checkbox" checked={!!p.featured} onChange={(e) => { setDraftSaved(false); update(i, { featured: e.target.checked }); }} />Destaque</label>
                    <button onClick={() => removeProject(i)} className="rounded-lg border border-red-400/40 px-3 text-red-200">Excluir</button>
                </div>
                <textarea aria-label="Descrição da obra" maxLength={400} rows={2} value={p.description || ""} onChange={(e) => update(i, { description: e.target.value })} placeholder="Descrição da obra (opcional; até 400 caracteres)" className="mt-3 w-full resize-y rounded-lg bg-graphite px-3 py-2 text-sm text-white placeholder:text-silver/35" />
                <p className="mt-2 text-xs text-silver/50">Últimos 30 dias: {metrics[p.id]?.visualizacoes || 0} visualizações · {metrics[p.id]?.pedidos || 0} pedidos de orçamento</p>
                {p.featured && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs text-silver/60">Início (opcional)<input type="date" value={p.featured_from || ""} onChange={(e) => { setDraftSaved(false); update(i, { featured_from: e.target.value }); }} className="mt-1 block rounded-lg bg-graphite px-3 py-2 text-sm text-white" /></label><label className="text-xs text-silver/60">Fim do destaque · obrigatório<input type="date" required value={p.featured_until || ""} onChange={(e) => { setDraftSaved(false); update(i, { featured_until: e.target.value }); }} className="mt-1 block rounded-lg bg-graphite px-3 py-2 text-sm text-white" /></label></div>}
                <div className="mt-4 flex flex-wrap gap-3">
                    {p.media.map((m, mi) => <div key={`${m.src}-${mi}`} className="relative h-24 w-28 overflow-hidden rounded-lg bg-black">
                        {m.type === "video" ? <video src={mediaSrc(m.src)} className="h-full w-full object-cover" muted /> : <img src={mediaSrc(m.src)} alt="Mídia da obra" className="h-full w-full object-cover" />}
                        <div className="absolute inset-x-1 bottom-1 flex justify-between">
                            <button onClick={() => moveMedia(i, mi, -1)} disabled={mi === 0} className="rounded bg-black/70 px-1 text-white">←</button>
                            <button aria-label="Remover mídia" onClick={() => removeMedia(i, mi)} className="rounded bg-black/70 px-1 text-white">×</button>
                            <button onClick={() => moveMedia(i, mi, 1)} disabled={mi === p.media.length - 1} className="rounded bg-black/70 px-1 text-white">→</button>
                        </div>
                        <label className="absolute inset-x-1 top-1 cursor-pointer rounded bg-black/70 py-1 text-center text-[10px] text-white">Trocar<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" disabled={busy} onChange={(e) => { upload(i, e.target.files?.[0], mi); e.target.value = ""; }} /></label>
                    </div>)}
                    <label className="grid h-24 w-28 cursor-pointer place-items-center rounded-lg border border-dashed border-white/25 text-center text-xs text-silver/70">+ Foto/vídeo<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" disabled={busy} onChange={(e) => { upload(i, e.target.files?.[0]); e.target.value = ""; }} /></label>
                </div>
            </article>)}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><button onClick={save} disabled={busy} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{busy ? "Salvando..." : "Salvar rascunho"}</button><button onClick={() => { setPreviewMode("desktop"); setPreview(true); }} className="rounded-full border border-white/20 px-5 py-2.5 text-sm">Ver prévia</button><button onClick={openPublishChecklist} disabled={!draftSaved || busy} className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold disabled:opacity-40">Publicar no site</button><span role="status" className="text-sm text-silver/70">{status}</span></div>
        {preview && <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-black/80 p-5" role="dialog" aria-modal="true" aria-label="Prévia da galeria"><div className={`max-h-[calc(100vh-2.5rem)] max-h-[calc(100dvh-2.5rem)] w-full ${previewMode === "mobile" ? "max-w-[390px]" : "max-w-5xl"} overflow-y-auto overscroll-contain rounded-2xl bg-graphite p-6`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">Prévia da galeria</h3><div className="flex gap-2"><button onClick={() => { const next = previewMode === "mobile" ? "desktop" : "mobile"; setPreviewMode(next); if (next === "mobile") setMobileReviewed(true); }} className="rounded-full border border-white/20 px-3 py-2 text-xs">{previewMode === "mobile" ? "Ver tela ampla" : "Ver no celular"}</button><button onClick={() => setPreview(false)} className="rounded-full border border-white/20 px-4 py-2">Fechar</button></div></div><p className="mt-2 text-sm text-silver/60">Esta versão ainda não aparece no site até ser publicada.</p><div className={`mt-5 grid gap-3 ${previewMode === "mobile" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>{projects.map((p) => <div key={p.id} className="overflow-hidden rounded-xl bg-graphite2">{p.media[0]?.type === "video" ? <video src={mediaSrc(p.media[0]?.src)} className="h-40 w-full object-cover" muted /> : <img src={mediaSrc(p.media[0]?.src)} alt="" className="h-40 w-full object-cover" />}<div className="p-3"><p className="text-xs uppercase text-azul">{p.cat}{p.featured ? " · Destaque" : ""}</p><p className="mt-1 font-semibold">{p.title}</p>{p.description && <p className="mt-1 text-xs text-silver/70">{p.description}</p>}<p className="text-xs text-silver/50">{p.media.length} mídias</p></div></div>)}</div></div></div>}
        {checklistOpen && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Checklist de publicação"><section className="w-full max-w-lg rounded-2xl border border-white/10 bg-graphite p-6"><h3 className="font-display text-xl font-semibold">Revisão antes de publicar</h3><p className="mt-1 text-sm text-silver/60">Confirme cada etapa para liberar a publicação.</p><div className="mt-5 space-y-3">{[["titles", "Revisei títulos e categorias"], ["photos", "Revisei as fotos e a ordem das mídias"], ["descriptions", "Revisei as descrições (inclusive se alguma ficará em branco)"]].map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-lg border border-white/10 p-3 text-sm"><input type="checkbox" checked={publishChecks[key]} onChange={(e) => setPublishChecks((all) => ({ ...all, [key]: e.target.checked }))} className="mt-0.5" />{label}</label>)}<label className={`flex items-start gap-3 rounded-lg border border-white/10 p-3 text-sm ${!mobileReviewed ? "opacity-50" : ""}`}><input type="checkbox" checked={mobileReviewed} disabled={!mobileReviewed} readOnly className="mt-0.5" />Conferi a prévia no celular {mobileReviewed ? "✓" : "· Abra a prévia e escolha ‘Ver no celular’"}</label></div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setChecklistOpen(false)} className="rounded-full border border-white/20 px-4 py-2 text-sm">Voltar</button><button onClick={publish} disabled={!publishChecks.titles || !publishChecks.photos || !publishChecks.descriptions || !mobileReviewed || busy} className="rounded-full bg-azul px-5 py-2 text-sm font-semibold disabled:opacity-40">{busy ? "Publicando..." : "Confirmar e publicar"}</button></div></section></div>}
    </section>;
}
