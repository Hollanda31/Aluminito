import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { ChevronDown, Download, RefreshCw, Search } from "lucide-react";

const STATUS = {
    novo: { label: "Novo", cor: "bg-white/10 text-white" },
    em_conversa: { label: "Em conversa", cor: "bg-amber-500/15 text-amber-300" },
    orcamento_enviado: {
        label: "Orçamento enviado",
        cor: "bg-sky-500/15 text-sky-300",
    },
    fechado: { label: "Fechado", cor: "bg-emerald-500/15 text-emerald-300" },
    perdido: { label: "Perdido", cor: "bg-white/5 text-silver/50" },
};

const PERIODOS = [
    { v: 7, label: "7 dias" },
    { v: 30, label: "30 dias" },
    { v: 90, label: "90 dias" },
    { v: 0, label: "Tudo" },
];

const fmtData = (iso) =>
    new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

// link direto para conversar com o cliente no WhatsApp
const waCliente = (tel) => {
    const d = (tel || "").replace(/\D/g, "");
    if (d.length < 10) return null;
    return `https://wa.me/${d.startsWith("55") && d.length > 11 ? d : `55${d}`}`;
};

const DETALHES = [
    ["contato", "Contato"],
    ["documento", "CNPJ/CPF"],
    ["local", "Local de instalação"],
    ["projeto", "Possui projeto"],
    ["itens", "Itens a orçar"],
    ["cor_aluminio", "Cor do alumínio / material"],
    ["vidro", "Vidro (cor, espessura e tipo)"],
    ["cidade", "Cidade"],
    ["tipo", "Tipo de projeto"],
    ["obra", "Situação da obra"],
    ["prazo", "Prazo"],
    ["medidas", "Medidas"],
    ["detalhes", "Detalhes"],
];

export default function Atendimentos() {
    const navigate = useNavigate();
    const [dias, setDias] = useState(30);
    const [status, setStatus] = useState("");
    const [soFormulario, setSoFormulario] = useState(false);
    const [busca, setBusca] = useState("");
    const [q, setQ] = useState(""); // busca já "esperada" (debounce)
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [aberto, setAberto] = useState(null);
    const [notas, setNotas] = useState({}); // rascunho das observações

    useEffect(() => {
        const t = setTimeout(() => setQ(busca.trim()), 400);
        return () => clearTimeout(t);
    }, [busca]);

    const params = useCallback(() => {
        const p = { dias };
        if (status) p.status = status;
        if (soFormulario) p.grupo = "Formulário";
        if (q) p.q = q;
        return p;
    }, [dias, status, soFormulario, q]);

    const carregar = useCallback(async () => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.get("/api/admin/leads", { params: params() }),
            );
            setDados(data);
            setErro(null);
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível carregar os atendimentos.");
        } finally {
            setCarregando(false);
        }
    }, [params, navigate]);

    useEffect(() => {
        setCarregando(true);
        carregar();
    }, [carregar]);

    const atualizar = async (id, corpo) => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.patch(`/api/admin/leads/${id}`, corpo),
            );
            setDados((d) => ({
                ...d,
                itens: d.itens.map((i) => (i.id === id ? data : i)),
            }));
            if (corpo.status) carregar(); // atualiza os contadores do funil
        } catch (e) {
            setErro("Não foi possível salvar a alteração.");
        }
    };

    const exportar = async () => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.get("/api/admin/leads/export.csv", {
                    params: params(),
                    responseType: "blob",
                }),
            );
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `atendimentos-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setErro("Não foi possível exportar o CSV.");
        }
    };

    const r = dados?.resumo;
    const chip = (ativo) =>
        `rounded-full border px-4 py-2 text-xs font-medium transition-all ${
            ativo
                ? "border-azul bg-azul text-white"
                : "border-white/15 text-silver hover:border-white/40"
        }`;

    return (
        <div data-testid="admin-atendimentos">
            {/* Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {PERIODOS.map((p) => (
                        <button
                            key={p.v}
                            onClick={() => setDias(p.v)}
                            className={chip(dias === p.v)}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setSoFormulario((v) => !v)}
                        className={chip(soFormulario)}
                        aria-pressed={soFormulario}
                    >
                        Só formulários
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => carregar()}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-white"
                    >
                        <RefreshCw size={14} /> Atualizar
                    </button>
                    <button
                        data-testid="admin-export-csv"
                        onClick={exportar}
                        className="inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-azul-dark"
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                </div>
            </div>

            {erro && (
                <p className="mt-6 rounded-xl border border-azul/40 bg-azul/10 px-4 py-3 text-sm">
                    {erro}
                </p>
            )}

            {carregando && !dados ? (
                <p className="mt-16 text-center text-silver/50">
                    Carregando atendimentos...
                </p>
            ) : dados ? (
                <>
                    {/* Funil */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="rounded-2xl border border-white/10 bg-graphite2 p-5 lg:col-span-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-silver/60">
                                Taxa de fechamento
                            </p>
                            <p className="mt-3 font-display text-4xl font-bold">
                                {r.taxa_fechamento}%
                            </p>
                            <p className="mt-1 text-xs text-silver/50">
                                {r.por_status.fechado} de {r.total}
                            </p>
                        </div>
                        {Object.entries(STATUS).map(([id, s]) => (
                            <button
                                key={id}
                                onClick={() => setStatus((v) => (v === id ? "" : id))}
                                aria-pressed={status === id}
                                className={`rounded-2xl border p-5 text-left transition-all ${
                                    status === id
                                        ? "border-azul bg-azul/10"
                                        : "border-white/10 bg-graphite2 hover:border-white/30"
                                }`}
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-silver/60">
                                    {s.label}
                                </p>
                                <p className="mt-3 font-display text-4xl font-bold">
                                    {r.por_status[id]}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Busca */}
                    <div className="relative mt-6">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-silver/40"
                        />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por nome, telefone, cidade, item ou observação"
                            maxLength={80}
                            className="h-11 w-full rounded-full border border-white/15 bg-graphite2 pl-11 pr-4 text-sm text-white placeholder:text-silver/40 focus:border-azul"
                        />
                    </div>

                    {/* Lista */}
                    <div className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6">
                        <h2 className="font-display text-lg font-semibold">
                            Atendimentos
                            <span className="ml-2 text-sm font-normal text-silver/50">
                                {dados.itens.length < dados.filtrados
                                    ? `mostrando ${dados.itens.length} de ${dados.filtrados}`
                                    : dados.filtrados}
                            </span>
                        </h2>

                        {dados.itens.length === 0 ? (
                            <p className="mt-6 text-sm text-silver/50">
                                Nenhum atendimento com esses filtros.
                            </p>
                        ) : (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-silver/50">
                                            <th className="pb-3 pr-4 font-semibold">Data</th>
                                            <th className="pb-3 pr-4 font-semibold">Cliente / item</th>
                                            <th className="pb-3 pr-4 font-semibold">Status</th>
                                            <th className="pb-3 font-semibold" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dados.itens.map((ev) => {
                                            const d = ev.dados || {};
                                            const wa = waCliente(d.telefone);
                                            const exp = aberto === ev.id;
                                            return (
                                                <Fragment key={ev.id}>
                                                    <tr className="border-b border-white/5">
                                                        <td className="whitespace-nowrap py-3 pr-4 align-top text-silver/70">
                                                            {fmtData(ev.timestamp)}
                                                        </td>
                                                        <td className="py-3 pr-4 align-top">
                                                            <span className="rounded-full bg-azul/10 px-2.5 py-1 text-xs font-medium text-azul">
                                                                {ev.grupo}
                                                            </span>
                                                            <p className="mt-1.5 text-white">
                                                                {d.nome ? `${d.nome} · ` : ""}
                                                                {ev.item}
                                                            </p>
                                                            {d.telefone && (
                                                                <p className="mt-0.5 text-xs text-silver/60">
                                                                    {wa ? (
                                                                        <a
                                                                            href={wa}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="underline hover:text-white"
                                                                        >
                                                                            {d.telefone}
                                                                        </a>
                                                                    ) : (
                                                                        d.telefone
                                                                    )}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="py-3 pr-4 align-top">
                                                            <select
                                                                aria-label="Status do atendimento"
                                                                value={ev.status}
                                                                onChange={(e) =>
                                                                    atualizar(ev.id, { status: e.target.value })
                                                                }
                                                                className={`rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium ${STATUS[ev.status]?.cor || ""}`}
                                                            >
                                                                {Object.entries(STATUS).map(([id, s]) => (
                                                                    <option key={id} value={id} className="bg-graphite text-white">
                                                                        {s.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="py-3 text-right align-top">
                                                            <button
                                                                onClick={() => setAberto(exp ? null : ev.id)}
                                                                aria-expanded={exp}
                                                                aria-label="Ver detalhes e observação"
                                                                className="rounded-full p-1.5 text-silver/60 transition-colors hover:text-white"
                                                            >
                                                                <ChevronDown
                                                                    size={16}
                                                                    className={`transition-transform ${exp ? "rotate-180" : ""}`}
                                                                />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {exp && (
                                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                                            <td colSpan={4} className="px-1 py-4">
                                                                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                                                                    {DETALHES.filter(([k]) => d[k]).map(([k, label]) => (
                                                                        <div key={k}>
                                                                            <dt className="text-[11px] uppercase tracking-[0.14em] text-silver/50">
                                                                                {label}
                                                                            </dt>
                                                                            <dd className="text-white">{d[k]}</dd>
                                                                        </div>
                                                                    ))}
                                                                </dl>
                                                                <label className="mt-4 block">
                                                                    <span className="text-[11px] uppercase tracking-[0.14em] text-silver/50">
                                                                        Observação (só você vê)
                                                                    </span>
                                                                    <textarea
                                                                        rows={2}
                                                                        maxLength={1000}
                                                                        value={notas[ev.id] ?? ev.nota}
                                                                        onChange={(e) =>
                                                                            setNotas((n) => ({ ...n, [ev.id]: e.target.value }))
                                                                        }
                                                                        onBlur={() => {
                                                                            const v = notas[ev.id];
                                                                            if (v !== undefined && v.trim() !== ev.nota) {
                                                                                atualizar(ev.id, { nota: v });
                                                                            }
                                                                        }}
                                                                        placeholder="Ex.: pediu orçamento de 3 janelas, voltar a ligar sexta"
                                                                        className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-graphite px-3 py-2 text-sm text-white placeholder:text-silver/40 focus:border-azul"
                                                                    />
                                                                </label>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
