import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, withAuthRefresh } from "@/lib/auth";
import ReviewsManager from "@/components/admin/ReviewsManager";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    CalendarDays,
    LogOut,
    MousePointerClick,
    RefreshCw,
    TrendingUp,
} from "lucide-react";

const fmtData = (iso) =>
    new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

export default function Admin() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState("mes");
    const [secao, setSecao] = useState("visao");
    const [stats, setStats] = useState(null);
    const [erro, setErro] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [usuario, setUsuario] = useState(null);

    const carregar = useCallback(
        async (p) => {
            try {
                const { data } = await withAuthRefresh(() =>
                    authApi.get("/api/admin/stats", {
                        params: { periodo: p || periodo },
                    }),
                );
                setStats(data);
                setErro(null);
            } catch (e) {
                if (e.response?.status === 401) {
                    navigate("/admin/login", { replace: true });
                    return;
                }
                setErro("Não foi possível carregar os dados.");
            } finally {
                setCarregando(false);
            }
        },
        [periodo, navigate],
    );

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/auth/me"))
            .then((r) => {
                setUsuario(r.data);
                carregar("mes");
            })
            .catch(() => navigate("/admin/login", { replace: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setInterval(() => carregar(), 30000);
        return () => clearInterval(t);
    }, [carregar]);

    const mudarPeriodo = (p) => {
        setPeriodo(p);
        setCarregando(true);
        carregar(p);
    };

    const sair = async () => {
        try {
            await withAuthRefresh(() => authApi.post("/api/auth/logout"));
        } catch (e) {}
        navigate("/admin/login", { replace: true });
    };

    const maxGrupo = stats
        ? Math.max(...stats.por_grupo.map((g) => g.total), 1)
        : 1;
    const maxDia = stats ? Math.max(...stats.por_dia.map((d) => d.total), 0) : 0;

    return (
        <div data-testid="admin-dashboard" className="min-h-screen bg-graphite font-body text-white">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-graphite/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white p-1">
                            <img src="/logo-aluminito.png" alt="Aluminito" className="h-full w-full object-cover" />
                        </span>
                        <div>
                            <p className="font-display text-sm font-bold tracking-wide">
                                Painel de Atendimentos
                            </p>
                            <p className="text-[11px] text-silver/50">
                                {usuario?.email || "Aluminito Esquadrias"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            data-testid="admin-view-site-link"
                            className="hidden rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-white sm:block"
                        >
                            Ver site
                        </Link>
                        <button
                            data-testid="admin-logout-button"
                            onClick={sair}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white"
                        >
                            <LogOut size={14} /> Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <div className="mb-6 flex gap-2 border-b border-white/10 pb-4">
                    {[
                        { id: "visao", label: "Visão geral" },
                        { id: "avaliacoes", label: "Avaliações" },
                    ].map((aba) => (
                        <button
                            key={aba.id}
                            data-testid={`admin-tab-${aba.id}`}
                            onClick={() => setSecao(aba.id)}
                            aria-pressed={secao === aba.id}
                            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                                secao === aba.id
                                    ? "border-azul bg-azul text-white"
                                    : "border-white/15 text-silver hover:border-white/40"
                            }`}
                        >
                            {aba.label}
                        </button>
                    ))}
                </div>

                <div
                    data-testid="admin-overview-section"
                    className={secao === "visao" ? "" : "hidden"}
                >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {[
                            { id: "semana", label: "Últimos 7 dias" },
                            { id: "mes", label: "Últimos 30 dias" },
                        ].map((p) => (
                            <button
                                key={p.id}
                                data-testid={`admin-periodo-${p.id}`}
                                onClick={() => mudarPeriodo(p.id)}
                                className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                                    periodo === p.id
                                        ? "border-azul bg-azul text-white"
                                        : "border-white/15 text-silver hover:border-white/40"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        data-testid="admin-refresh"
                        onClick={() => carregar()}
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

                {carregando && !stats ? (
                    <p className="mt-16 text-center text-silver/50">Carregando dados...</p>
                ) : stats ? (
                    <>
                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <div data-testid="admin-stat-total" className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <div className="flex items-center gap-2 text-silver/60">
                                    <MousePointerClick size={16} className="text-azul" />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                                        Atendimentos no período
                                    </span>
                                </div>
                                <p className="mt-3 font-display text-4xl font-bold">{stats.total}</p>
                            </div>
                            <div data-testid="admin-stat-hoje" className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <div className="flex items-center gap-2 text-silver/60">
                                    <CalendarDays size={16} className="text-azul" />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                                        Hoje
                                    </span>
                                </div>
                                <p className="mt-3 font-display text-4xl font-bold">{stats.hoje}</p>
                            </div>
                            <div data-testid="admin-stat-melhor-dia" className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <div className="flex items-center gap-2 text-silver/60">
                                    <TrendingUp size={16} className="text-azul" />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                                        Melhor dia
                                    </span>
                                </div>
                                <p className="mt-3 font-display text-4xl font-bold">{maxDia}</p>
                            </div>
                        </div>

                        <div data-testid="admin-chart" className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6">
                            <h2 className="font-display text-lg font-semibold">
                                Atendimentos por dia
                            </h2>
                            <div className="mt-4 h-64 min-w-0">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minWidth={0}
                                    minHeight={256}
                                    initialDimension={{ width: 800, height: 256 }}
                                >
                                    <BarChart data={stats.por_dia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis
                                            dataKey="dia"
                                            tick={{ fill: "#808080", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: "#808080", fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={28}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "#ffffff08" }}
                                            contentStyle={{
                                                background: "#111111",
                                                border: "1px solid #ffffff20",
                                                borderRadius: 12,
                                                fontSize: 13,
                                            }}
                                            labelStyle={{ color: "#fff" }}
                                        />
                                        <Bar dataKey="total" fill="#FF0000" radius={[6, 6, 0, 0]} name="Atendimentos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <div data-testid="admin-ranking" className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <h2 className="font-display text-lg font-semibold">
                                    Mais pedidos por categoria
                                </h2>
                                {stats.por_grupo.length === 0 ? (
                                    <p className="mt-6 text-sm text-silver/50">
                                        Nenhum atendimento no período ainda.
                                    </p>
                                ) : (
                                    <div className="mt-5 space-y-4">
                                        {stats.por_grupo.map((g) => (
                                            <div key={g.grupo}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-white">{g.grupo}</span>
                                                    <span className="font-display font-bold text-azul">{g.total}</span>
                                                </div>
                                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className="h-full rounded-full bg-azul transition-all duration-700"
                                                        style={{ width: `${(g.total / maxGrupo) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-graphite2 p-6">
                                <h2 className="font-display text-lg font-semibold">
                                    Itens mais escolhidos
                                </h2>
                                {stats.por_item.length === 0 ? (
                                    <p className="mt-6 text-sm text-silver/50">
                                        Nenhum atendimento no período ainda.
                                    </p>
                                ) : (
                                    <ul className="mt-5 space-y-3">
                                        {stats.por_item.map((it, i) => (
                                            <li key={it.item} className="flex items-center gap-3 text-sm">
                                                <span className="w-6 font-display text-xs font-bold text-silver/40">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <span className="flex-1 truncate text-white">{it.item}</span>
                                                <span className="font-display font-bold text-azul">{it.total}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div data-testid="admin-ultimos" className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6">
                            <h2 className="font-display text-lg font-semibold">
                                Últimos atendimentos
                            </h2>
                            {stats.ultimos.length === 0 ? (
                                <p className="mt-6 text-sm text-silver/50">
                                    Nenhum atendimento registrado ainda. Os cliques nos
                                    botões de WhatsApp do site aparecem aqui.
                                </p>
                            ) : (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-silver/50">
                                                <th className="pb-3 pr-4 font-semibold">Data</th>
                                                <th className="pb-3 pr-4 font-semibold">Categoria</th>
                                                <th className="pb-3 pr-4 font-semibold">Item escolhido</th>
                                                <th className="pb-3 font-semibold">Origem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.ultimos.map((ev) => (
                                                <tr key={ev.id} className="border-b border-white/5 last:border-0">
                                                    <td className="py-3 pr-4 whitespace-nowrap text-silver/70">
                                                        {fmtData(ev.timestamp)}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span className="rounded-full bg-azul/10 px-2.5 py-1 text-xs font-medium text-azul">
                                                            {ev.grupo}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-white">{ev.item}</td>
                                                    <td className="py-3 text-silver/60">{ev.origem || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
                </div>

                {secao === "avaliacoes" && <ReviewsManager />}
            </main>
        </div>
    );
}
