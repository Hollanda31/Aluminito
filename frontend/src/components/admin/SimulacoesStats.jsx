import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { RefreshCw, Zap } from "lucide-react";

const NOME_TIPO = {
    porta: "Porta",
    persiana: "Persiana",
    janela: "Janela",
    outros: "Outros modelos",
};

export default function SimulacoesStats() {
    const navigate = useNavigate();
    const [dias, setDias] = useState(30);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [top, setTop] = useState(10);
    const [confirmando, setConfirmando] = useState(false);

    const carregar = useCallback(async () => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.get("/api/admin/simulacoes", { params: { dias } }),
            );
            setDados(data);
            setErro(null);
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível carregar as simulações.");
        }
    }, [dias, navigate]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // enquanto a pré-geração roda, atualiza a cada 4 segundos
    const rodando = dados?.pregeracao?.rodando;
    useEffect(() => {
        if (!rodando) return;
        const t = setInterval(carregar, 4000);
        return () => clearInterval(t);
    }, [rodando, carregar]);

    const preGerar = async () => {
        setConfirmando(false);
        setAviso(null);
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.post("/api/admin/simulacoes/pre-gerar", { top }),
            );
            setAviso(
                data.agendadas === 0
                    ? "Tudo já estava pronto: nada a gerar."
                    : `Gerando ${data.agendadas} imagens em segundo plano (${data.ja_em_cache} já estavam prontas).`,
            );
            carregar();
        } catch (e) {
            setAviso(
                e.response?.status === 409
                    ? "Já existe uma pré-geração em andamento."
                    : "Não foi possível iniciar a pré-geração.",
            );
        }
    };

    const maxCor = dados ? Math.max(...dados.cores.map((c) => c.total), 1) : 1;
    const maxTipo = dados ? Math.max(...dados.por_tipo.map((t) => t.total), 1) : 1;
    const p = dados?.pregeracao;

    const chip = (ativo) =>
        `rounded-full border px-4 py-2 text-xs font-medium transition-all ${
            ativo
                ? "border-azul bg-azul text-white"
                : "border-white/15 text-silver hover:border-white/40"
        }`;

    return (
        <div data-testid="admin-simulador">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                    {[7, 30, 90].map((d) => (
                        <button key={d} onClick={() => setDias(d)} className={chip(dias === d)}>
                            {d} dias
                        </button>
                    ))}
                </div>
                <button
                    onClick={carregar}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-white"
                >
                    <RefreshCw size={14} /> Atualizar
                </button>
            </div>

            {erro && (
                <p className="mt-6 rounded-xl border border-azul/40 bg-azul/10 px-4 py-3 text-sm">
                    {erro}
                </p>
            )}

            {!dados ? (
                !erro && <p className="mt-16 text-center text-silver/50">Carregando...</p>
            ) : (
                <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { l: "Simulações no período", v: dados.total },
                            { l: "Respondidas na hora (cache)", v: `${dados.pct_cache}%` },
                            {
                                l: "Tempo médio de geração",
                                v: dados.media_geracao_s != null ? `${dados.media_geracao_s}s` : "—",
                            },
                            { l: "Imagens prontas no cache", v: dados.arquivos_em_cache },
                        ].map((c) => (
                            <div key={c.l} className="rounded-2xl border border-white/10 bg-graphite2 p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-silver/60">
                                    {c.l}
                                </p>
                                <p className="mt-3 font-display text-4xl font-bold">{c.v}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-graphite2 p-6 lg:col-span-2">
                            <h2 className="font-display text-lg font-semibold">
                                Cores mais simuladas
                            </h2>
                            {dados.cores.length === 0 ? (
                                <p className="mt-6 text-sm text-silver/50">
                                    Nenhuma simulação registrada no período. As simulações feitas a
                                    partir de agora aparecem aqui.
                                </p>
                            ) : (
                                <ul className="mt-5 space-y-4">
                                    {dados.cores.map((c, i) => (
                                        <li key={c.arq} className="flex items-center gap-3">
                                            <span className="w-6 font-display text-xs font-bold text-silver/40">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <img
                                                src={`/cores/${c.arq}`}
                                                alt=""
                                                loading="lazy"
                                                className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="truncate font-medium text-white">
                                                        {c.nome}
                                                        {c.codigo ? ` (${c.codigo})` : ""}
                                                    </span>
                                                    <span className="font-display font-bold text-azul">
                                                        {c.total}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className="h-full rounded-full bg-azul transition-all duration-700"
                                                        style={{ width: `${(c.total / maxCor) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="mt-1 text-[11px] text-silver/50">
                                                    Pronta em {c.tipos_em_cache} de {dados.tipos_total} tipos
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <h2 className="font-display text-lg font-semibold">Por tipo</h2>
                                {dados.por_tipo.length === 0 ? (
                                    <p className="mt-6 text-sm text-silver/50">Sem dados ainda.</p>
                                ) : (
                                    <div className="mt-5 space-y-4">
                                        {dados.por_tipo.map((t) => (
                                            <div key={t.tipo}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-white">
                                                        {NOME_TIPO[t.tipo] || t.tipo}
                                                    </span>
                                                    <span className="font-display font-bold text-azul">
                                                        {t.total}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className="h-full rounded-full bg-azul transition-all duration-700"
                                                        style={{ width: `${(t.total / maxTipo) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <h2 className="font-display text-lg font-semibold">
                                    Deixar o simulador mais rápido
                                </h2>
                                <p className="mt-2 text-sm text-silver/60">
                                    Gera antes as cores mais pedidas, em todos os tipos. Quem
                                    simular depois recebe a imagem na hora. Cada imagem nova
                                    consome créditos da IA.
                                </p>

                                {rodando ? (
                                    <div className="mt-4">
                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                            <div
                                                className="h-full rounded-full bg-azul transition-all duration-700"
                                                style={{
                                                    width: `${p.total ? (p.feitas / p.total) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-silver/60">
                                            {p.feitas} de {p.total} imagens
                                            {p.erros ? ` · ${p.erros} com erro` : ""}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <select
                                            value={top}
                                            onChange={(e) => setTop(Number(e.target.value))}
                                            aria-label="Quantidade de cores"
                                            className="rounded-lg border border-white/15 bg-graphite px-3 py-2 text-xs text-white"
                                        >
                                            {[5, 10, 15, 20].map((n) => (
                                                <option key={n} value={n}>
                                                    Top {n} cores
                                                </option>
                                            ))}
                                        </select>
                                        {confirmando ? (
                                            <>
                                                <button
                                                    onClick={preGerar}
                                                    className="rounded-full bg-azul px-4 py-2 text-xs font-semibold text-white hover:bg-azul-dark"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmando(false)}
                                                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver hover:text-white"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                data-testid="admin-pregerar"
                                                onClick={() => setConfirmando(true)}
                                                className="inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-xs font-semibold text-white hover:bg-azul-dark"
                                            >
                                                <Zap size={14} /> Pré-gerar
                                            </button>
                                        )}
                                    </div>
                                )}
                                {aviso && <p className="mt-3 text-xs text-silver/70">{aviso}</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
