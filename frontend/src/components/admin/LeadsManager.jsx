import { useCallback, useEffect, useRef, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { STATUS_LEAD, PRIORIDADE_LEAD, baixarCsv, statusInfo, prioridadeInfo, waCliente } from "@/lib/leads";
import { Download, RefreshCw, Search } from "lucide-react";
import AdminHelp from "@/components/admin/AdminHelp";

const PERIODOS = [
    { id: "semana", label: "7 dias" },
    { id: "mes", label: "30 dias" },
    { id: "trimestre", label: "90 dias" },
    { id: "todos", label: "Tudo" },
];

const DETALHES = [
    ["contato", "Contato"],
    ["documento", "CNPJ/CPF"],
    ["local", "Local de instalação"],
    ["projeto", "Possui projeto"],
    ["itens", "Itens a orçar"],
    ["cor_aluminio", "Cor do alumínio / material"],
    ["vidro", "Vidro (cor, espessura e tipo)"],
    ["situacao", "Situação da obra"],
    ["prazo", "Prazo"],
    ["cor", "Cor desejada"],
    ["medidas", "Medidas"],
    ["obs", "Observações"],
];
const MOTIVOS_PERDA = [
    ["preco", "Preço"], ["prazo", "Prazo"], ["concorrente", "Escolheu outro fornecedor"],
    ["desistiu", "Desistiu do projeto"], ["sem_resposta", "Parou de responder"], ["outro", "Outro motivo"],
];

const fmtData = (iso) =>
    new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

const selectClass =
    "rounded-lg border border-white/15 bg-graphite px-3 py-2 text-sm text-white outline-none transition focus:border-azul";

function LeadCard({ lead, onChange, quickReplies }) {
    const [nota, setNota] = useState(lead.nota || "");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [motivoPerda, setMotivoPerda] = useState(lead.motivo_perda || "");
    const [escolhendoMotivo, setEscolhendoMotivo] = useState(false);
    const d = lead.dados || {};
    const info = statusInfo(lead.status);
    const wa = waCliente(d.telefone);
    const detalhes = DETALHES.filter(([k]) => d[k]);
    const prioridade = prioridadeInfo(lead.prioridade);

    const enviarResposta = (message) => {
        if (!wa) return;
        const texto = message.replaceAll("{{nome}}", (d.nome || "").trim().split(/\s+/)[0] || "");
        window.open(`${wa}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    };

    const salvar = async (payload) => {
        setSalvando(true);
        setErro("");
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.patch(`/api/admin/leads/${lead.id}`, payload),
            );
            onChange(data);
        } catch (e) {
            setErro("Não foi possível salvar. Tente de novo.");
        } finally {
            setSalvando(false);
        }
    };

    const pedirAvaliacao = () => {
        const primeiro = (d.nome || "").trim().split(/\s+/)[0];
        const link = `${window.location.origin}/#depoimentos`;
        const msg = `Olá${primeiro ? `, ${primeiro}` : ""}! Foi um prazer atender você na Aluminito. Se puder, deixe sua avaliação sobre o nosso trabalho neste link (leva 1 minuto): ${link}`;
        window.open(`${wa}?text=${encodeURIComponent(msg)}`, "_blank");
        salvar({ avaliacao_pedida: true });
    };

    return (
        <li
            data-testid={`lead-${lead.id}`}
            className="rounded-2xl border border-white/10 bg-graphite2 p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-silver/50">
                        {fmtData(lead.timestamp)} · {lead.origem || "site"}
                    </p>
                    <p className="mt-1 truncate font-display text-base font-semibold text-white">
                        {d.nome || lead.item}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-silver/80">
                            {lead.grupo}
                        </span>
                        {d.nome && (
                            <span className="text-xs text-silver/70">{lead.item}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline ${info.cls}`}
                    >
                        {info.label}
                    </span>
                    <select
                        data-testid={`lead-status-${lead.id}`}
                        aria-label="Status do atendimento"
                        value={lead.status}
                        disabled={salvando}
                        onChange={(e) => e.target.value === "perdido" ? setEscolhendoMotivo(true) : salvar({ status: e.target.value })}
                        style={{ colorScheme: "dark" }}
                        className={selectClass}
                    >
                        {STATUS_LEAD.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Prioridade do atendimento"
                        value={lead.prioridade || "media"}
                        disabled={salvando}
                        onChange={(e) => salvar({ prioridade: e.target.value })}
                        style={{ colorScheme: "dark" }}
                        className={selectClass}
                    >
                        {PRIORIDADE_LEAD.map((p) => <option key={p.id} value={p.id}>Prioridade: {p.label}</option>)}
                    </select>
                </div>
            </div>

            {escolhendoMotivo && <label className="mt-4 block max-w-sm text-xs text-silver/70">Por que o atendimento foi perdido?
                <select autoFocus value={motivoPerda} onChange={(e) => { const value = e.target.value; setMotivoPerda(value); if (value) { setEscolhendoMotivo(false); salvar({ status: "perdido", motivo_perda: value }); } }} className={`${selectClass} mt-1.5 w-full`}>
                    <option value="">Escolha um motivo</option>{MOTIVOS_PERDA.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
            </label>}
            {lead.status === "perdido" && lead.motivo_perda && <p className="mt-3 text-xs text-silver/60">Motivo da perda: {MOTIVOS_PERDA.find(([id]) => id === lead.motivo_perda)?.[1] || "Outro motivo"}</p>}

            <div className="mt-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${prioridade.cls}`}>Prioridade {prioridade.label.toLowerCase()}</span></div>

            {(d.telefone || d.cidade) && (
                <p className="mt-3 text-sm text-silver/80">
                    {d.telefone}
                    {d.telefone && d.cidade ? " · " : ""}
                    {d.cidade}
                    {wa && (
                        <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-3 text-xs font-semibold text-azul hover:underline"
                        >
                            Abrir no WhatsApp
                        </a>
                    )}
                </p>
            )}

            {wa && quickReplies.length > 0 && <details className="mt-4 rounded-xl border border-white/10 px-4 py-3"><summary className="cursor-pointer text-xs font-semibold text-azul">Respostas rápidas</summary><div className="mt-3 flex flex-wrap gap-2">{quickReplies.map((reply) => <button key={reply.id} type="button" onClick={() => enviarResposta(reply.message)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-silver hover:text-white">{reply.title}</button>)}</div></details>}

            {detalhes.length > 0 && (
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {detalhes.map(([k, rotulo]) => (
                        <div key={k} className={k === "obs" ? "sm:col-span-2" : ""}>
                            <dt className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                                {rotulo}
                            </dt>
                            <dd className="text-white">{d[k]}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {lead.status === "fechado" && wa && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                    <button
                        type="button"
                        data-testid={`lead-avaliacao-${lead.id}`}
                        onClick={pedirAvaliacao}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-400"
                    >
                        {lead.avaliacao_pedida_em ? "Pedir avaliação de novo" : "Pedir avaliação"}
                    </button>
                    <span className="text-xs text-silver/60">
                        {lead.avaliacao_pedida_em
                            ? `Pedido enviado em ${fmtData(lead.avaliacao_pedida_em)}`
                            : "Abre o WhatsApp do cliente com o link para avaliar."}
                    </span>
                </div>
            )}

            <label className="mt-4 block">
                <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                    Nota interna
                </span>
                <textarea
                    data-testid={`lead-nota-${lead.id}`}
                    rows={2}
                    maxLength={500}
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    onBlur={() => {
                        if (nota.trim() !== (lead.nota || "")) salvar({ nota });
                    }}
                    placeholder="Ex.: retornar sexta, pediu desconto, medir no local..."
                    className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-graphite px-3 py-2 text-sm text-white outline-none transition placeholder:text-silver/30 focus:border-azul"
                />
            </label>
            {erro && <p className="mt-2 text-xs text-azul">{erro}</p>}
        </li>
    );
}

export default function LeadsManager() {
    const [periodo, setPeriodo] = useState("mes");
    const [status, setStatus] = useState("");
    const [busca, setBusca] = useState("");
    const [q, setQ] = useState("");
    const [itens, setItens] = useState([]);
    const [total, setTotal] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [baixando, setBaixando] = useState(false);
    const [quickReplies, setQuickReplies] = useState([]);
    const [replyMsg, setReplyMsg] = useState("");
    const [savingReplies, setSavingReplies] = useState(false);
    const pedido = useRef(0);

    // espera o usuário parar de digitar antes de buscar
    useEffect(() => {
        const t = setTimeout(() => setQ(busca.trim()), 400);
        return () => clearTimeout(t);
    }, [busca]);

    const carregar = useCallback(
        async (skip = 0) => {
            const id = ++pedido.current;
            setCarregando(true);
            setErro("");
            try {
                const { data } = await withAuthRefresh(() =>
                    authApi.get("/api/admin/leads", {
                        params: { periodo, status, q, limit: 50, skip },
                    }),
                );
                if (id !== pedido.current) return;
                setTotal(data.total);
                setItens((atual) => (skip ? [...atual, ...data.itens] : data.itens));
            } catch (e) {
                if (id === pedido.current) {
                    setErro("Não foi possível carregar os atendimentos.");
                }
            } finally {
                if (id === pedido.current) setCarregando(false);
            }
        },
        [periodo, status, q],
    );

    useEffect(() => {
        carregar(0);
    }, [carregar]);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/admin/quick-replies"))
            .then(({ data }) => setQuickReplies(data.items || []))
            .catch(() => setReplyMsg("Não foi possível carregar as respostas rápidas."));
    }, []);

    const atualizarItem = (novo) =>
        setItens((lista) => lista.map((l) => (l.id === novo.id ? novo : l)));

    const exportar = async () => {
        setBaixando(true);
        try {
            await baixarCsv({ periodo, status, q });
        } catch (e) {
            setErro("Não foi possível baixar o CSV.");
        } finally {
            setBaixando(false);
        }
    };

    const salvarRespostas = async () => {
        setSavingReplies(true); setReplyMsg("");
        try {
            const { data } = await withAuthRefresh(() => authApi.put("/api/admin/quick-replies", { items: quickReplies }));
            setQuickReplies(data.items); setReplyMsg("Respostas rápidas salvas.");
        } catch (e) { setReplyMsg(e.response?.data?.detail || "Não foi possível salvar as respostas."); }
        finally { setSavingReplies(false); }
    };

    const adicionarResposta = () => setQuickReplies((all) => [...all, { id: globalThis.crypto?.randomUUID?.() || `resposta-${Date.now()}`, title: "", message: "" }]);

    return (
        <div data-testid="admin-leads-section">
            <AdminHelp className="mb-4">Atualize o status e a prioridade para organizar a fila. As respostas rápidas são compartilhadas com a equipe; use <code>{"{{nome}}"}</code> para inserir o primeiro nome do cliente. As notas internas não são enviadas ao cliente.</AdminHelp>
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-silver/40"
                    />
                    <input
                        data-testid="leads-busca"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, telefone, cidade ou item"
                        className="h-11 w-full rounded-full border border-white/15 bg-graphite pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-silver/35 focus:border-azul"
                    />
                </div>
                <select
                    data-testid="leads-periodo"
                    aria-label="Período"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className={`${selectClass} h-11`}
                >
                    {PERIODOS.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.label}
                        </option>
                    ))}
                </select>
                <button
                    data-testid="leads-refresh"
                    onClick={() => carregar(0)}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-medium text-silver transition-colors hover:text-white"
                >
                    <RefreshCw size={14} /> Atualizar
                </button>
                <button
                    data-testid="leads-export"
                    onClick={exportar}
                    disabled={baixando}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-azul px-5 text-xs font-semibold text-white transition-colors hover:bg-azul-dark disabled:opacity-50"
                >
                    <Download size={14} /> {baixando ? "Gerando..." : "Exportar CSV"}
                </button>
            </div>

            <details className="mt-4 rounded-xl border border-white/10 bg-graphite2 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Configurar respostas rápidas</summary>
                <div className="mt-3 space-y-3">{quickReplies.map((reply, index) => <div key={reply.id} className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-[180px_1fr_auto]"><input aria-label="Título da resposta" maxLength={60} value={reply.title} onChange={(e) => setQuickReplies((all) => all.map((x, i) => i === index ? { ...x, title: e.target.value } : x))} placeholder="Nome curto" className={selectClass} /><textarea aria-label="Texto da resposta" maxLength={500} rows={2} value={reply.message} onChange={(e) => setQuickReplies((all) => all.map((x, i) => i === index ? { ...x, message: e.target.value } : x))} placeholder="Mensagem para enviar" className={selectClass} /><button type="button" onClick={() => setQuickReplies((all) => all.filter((_, i) => i !== index))} className="text-xs text-red-200">Remover</button></div>)}
                    {quickReplies.length < 30 && <button type="button" onClick={adicionarResposta} className="rounded-full border border-white/15 px-4 py-2 text-xs">Adicionar resposta</button>}
                    <button type="button" onClick={salvarRespostas} disabled={savingReplies} className="ml-2 rounded-full bg-azul px-4 py-2 text-xs font-semibold disabled:opacity-50">{savingReplies ? "Salvando..." : "Salvar respostas"}</button>
                    {replyMsg && <p role="status" className="text-xs text-silver/70">{replyMsg}</p>}
                </div>
            </details>

            <div className="mt-4 flex flex-wrap gap-2">
                {[{ id: "", label: "Todos" }, ...STATUS_LEAD].map((s) => (
                    <button
                        key={s.id || "todos"}
                        data-testid={`leads-filtro-${s.id || "todos"}`}
                        onClick={() => setStatus(s.id)}
                        aria-pressed={status === s.id}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                            status === s.id
                                ? "border-azul bg-azul text-white"
                                : "border-white/15 text-silver hover:border-white/40"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <p className="mt-5 text-sm text-silver/60">
                {total} {total === 1 ? "atendimento" : "atendimentos"}
                {status || q ? " com esse filtro" : ""}
            </p>

            {erro && (
                <p className="mt-4 rounded-xl border border-azul/40 bg-azul/10 px-4 py-3 text-sm">
                    {erro}
                </p>
            )}

            {carregando && itens.length === 0 ? (
                <p className="mt-12 text-center text-silver/50">Carregando...</p>
            ) : itens.length === 0 ? (
                <p className="mt-12 text-center text-silver/50">
                    Nenhum atendimento encontrado.
                </p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {itens.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onChange={atualizarItem} quickReplies={quickReplies} />
                    ))}
                </ul>
            )}

            {itens.length < total && (
                <div className="mt-6 text-center">
                    <button
                        data-testid="leads-mais"
                        onClick={() => carregar(itens.length)}
                        disabled={carregando}
                        className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-silver transition-colors hover:text-white disabled:opacity-50"
                    >
                        {carregando ? "Carregando..." : "Carregar mais"}
                    </button>
                </div>
            )}
        </div>
    );
}
