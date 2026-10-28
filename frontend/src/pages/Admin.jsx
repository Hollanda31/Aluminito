import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, withAuthRefresh } from "@/lib/auth";
import ReviewsManager from "@/components/admin/ReviewsManager";
import LeadsManager from "@/components/admin/LeadsManager";
import AvisoEditor from "@/components/admin/AvisoEditor";
import ManutencaoEditor from "@/components/admin/ManutencaoEditor";
import RetornarHoje from "@/components/admin/RetornarHoje";
import ProjectsManager from "@/components/admin/ProjectsManager";
import CatalogManager from "@/components/admin/CatalogManager";
import SiteSecurityManager from "@/components/admin/SiteSecurityManager";
import AdminTrash from "@/components/admin/AdminTrash";
import AdminAudit from "@/components/admin/AdminAudit";
import { STATUS_LEAD, TIPOS_SIM, baixarCsv } from "@/lib/leads";
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
    CircleHelp,
    Home,
    Users,
    Star,
    Megaphone,
    Settings2,
    Sun,
    Moon,
    Rows3,
    Trash2,
    History,
    Images,
    Download,
    LogOut,
    MousePointerClick,
    Palette,
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

const MOTIVOS_PERDA_LABEL = {
    preco: "Preço", prazo: "Prazo", concorrente: "Outro fornecedor",
    desistiu: "Desistiu", sem_resposta: "Sem resposta", outro: "Outro motivo",
    nao_informado: "Não informado",
};

export default function Admin() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState("mes");
    const [secao, setSecao] = useState("visao");
    const [stats, setStats] = useState(null);
    const [erro, setErro] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [usuario, setUsuario] = useState(null);
    const [baixando, setBaixando] = useState(false);
    const [aviso, setAviso] = useState("");
    const [guiaAberto, setGuiaAberto] = useState(false);
    const [etapaGuia, setEtapaGuia] = useState(0);
    const [tema, setTema] = useState("claro");
    const [densidade, setDensidade] = useState("confortavel");

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
                const chaveUsuario = encodeURIComponent(r.data.email || "padrao");
                try {
                    setTema(localStorage.getItem(`aluminito.admin.tema.${chaveUsuario}`) || "claro");
                    setDensidade(localStorage.getItem(`aluminito.admin.densidade.${chaveUsuario}`) || "confortavel");
                } catch (e) {}
                if (r.data.permissions?.includes("relatorios")) carregar("mes");
                else setSecao(r.data.permissions?.includes("atendimentos") ? "atendimentos" : "configuracoes");
            })
            .catch(() => navigate("/admin/login", { replace: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mudarPeriodo = (p) => {
        setPeriodo(p);
        setCarregando(true);
        carregar(p);
    };

    const exportar = async () => {
        setBaixando(true);
        try {
            await baixarCsv({ periodo });
        } catch (e) {
            setErro("Não foi possível baixar o CSV.");
        } finally {
            setBaixando(false);
        }
    };

    const prepararSimulacoes = async () => {
        const ok = window.confirm(
            "Isso gera, em segundo plano, as simulações das 6 cores mais simuladas que ainda não estão prontas (porta, janela, persiana e outros). Cada imagem nova consome créditos da IA. Continuar?",
        );
        if (!ok) return;
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.post("/api/admin/simular/prewarm", { top: 6 }),
            );
            setAviso(
                data.agendadas
                    ? `${data.agendadas} simulações estão sendo preparadas. Em alguns minutos elas aparecem instantâneas no site.`
                    : "As cores mais simuladas já estão todas prontas.",
            );
        } catch (e) {
            setAviso("Não foi possível iniciar a preparação agora.");
        }
    };

    const sair = async () => {
        try {
            await withAuthRefresh(() => authApi.post("/api/auth/logout"));
        } catch (e) {}
        navigate("/admin/login", { replace: true });
    };

    const salvarPreferencia = (tipo, valor) => {
        const chaveUsuario = encodeURIComponent(usuario?.email || "padrao");
        if (tipo === "tema") setTema(valor);
        if (tipo === "densidade") setDensidade(valor);
        try { localStorage.setItem(`aluminito.admin.${tipo}.${chaveUsuario}`, valor); } catch (e) {}
    };

    const maxGrupo = stats
        ? Math.max(...stats.por_grupo.map((g) => g.total), 1)
        : 1;
    const maxDia = stats ? Math.max(...stats.por_dia.map((d) => d.total), 0) : 0;
    const hasPermission = (permission) => usuario?.role === "chefe" || usuario?.role === "admin" || usuario?.permissions?.includes(permission);
    const tabs = [
        ...(hasPermission("relatorios") ? [{ id: "visao", label: "Visão geral", guide: "Acompanhe os atendimentos e os indicadores do período, incluindo os principais motivos de perda. Use os filtros de data para comparar resultados e o botão Atualizar para buscar os dados mais recentes." }] : []),
        ...(hasPermission("atendimentos") ? [{ id: "atendimentos", label: "Atendimentos", guide: "Localize contatos, atualize status e prioridade, registre notas internas e use respostas rápidas no WhatsApp. Ao marcar um contato como perdido, informe o motivo; a visão geral reúne esses motivos." }] : []),
        ...(hasPermission("projetos") ? [{ id: "projetos", label: "Obras e galeria", guide: "Edite as obras, envie e organize fotos e vídeos, confira a prévia e publique a galeria do site. O checklist ajuda a revisar o conteúdo antes de publicar." }] : []),
        ...(hasPermission("catalogo") ? [{ id: "catalogo", label: "Catálogo", guide: "Gerencie as cores do catálogo, oculte as indisponíveis e marque as mais pedidas. Revise a prévia antes de publicar as alterações." }] : []),
        ...(hasPermission("avaliacoes") ? [{ id: "avaliacoes", label: "Avaliações", guide: "Revise as avaliações recebidas, escolha quais ficam visíveis no site e organize os destaques. Ocultar preserva o registro no painel." }] : []),
        ...(hasPermission("aviso") ? [{ id: "aviso", label: "Aviso e manutenção", guide: "Ative o modo manutenção para bloquear o site com um pop-up que não pode ser fechado. Abaixo, crie avisos para os visitantes, escolha o tipo e o período de exibição. Desativar tira o aviso do ar sem apagar o texto salvo." }] : []),
        { id: "configuracoes", label: hasPermission("contato") || hasPermission("usuarios") ? "Gerência" : "Minha senha", guide: [(hasPermission("contato") || hasPermission("aviso")) && "Contato: atualize telefone e horário em um só lugar.", hasPermission("usuarios") && "Acessos: gerencie usuários e permissões; o diretor também pode desativar contas e encerrar sessões.", "Senha: altere sua própria senha nesta área."].filter(Boolean).join(" ") },
        { id: "preferencias", label: "Configurações do painel", guide: "Personalize a aparência do painel com tema claro ou escuro e escolha uma visualização confortável ou compacta. As preferências ficam salvas para sua conta neste navegador." },
        ...(hasPermission("lixeira") ? [{ id: "lixeira", label: "Lixeira", guide: "Recupere obras, mídias e avaliações removidas. Confira o item antes de restaurá-lo para o site." }] : []),
        ...(hasPermission("auditoria") ? [{ id: "auditoria", label: "Histórico", guide: "Consulte quem fez alterações no painel e quando elas aconteceram." }] : []),
    ];
    const etapaAtual = Math.min(etapaGuia, Math.max(tabs.length - 1, 0));
    const abrirGuia = () => { setEtapaGuia(0); setGuiaAberto(true); };
    const tabIcons = { visao: Home, atendimentos: Users, projetos: Images, catalogo: Palette, avaliacoes: Star, aviso: Megaphone, configuracoes: Settings2, lixeira: Trash2, auditoria: History, preferencias: Settings2 };
    const activeTab = tabs.find((aba) => aba.id === secao) || tabs[0];

    useEffect(() => {
        if (!guiaAberto) return;
        const fecharComEsc = (event) => { if (event.key === "Escape") setGuiaAberto(false); };
        window.addEventListener("keydown", fecharComEsc);
        return () => window.removeEventListener("keydown", fecharComEsc);
    }, [guiaAberto]);

    return (
        <div data-testid="admin-dashboard" data-theme={tema} data-density={densidade} className="admin-theme flex min-h-screen bg-graphite font-body text-white">
            <aside className="admin-sidebar hidden w-60 shrink-0 border-r border-white/10 bg-graphite2 px-4 py-5 md:flex md:flex-col">
                <div className="mb-8 flex items-center gap-3 px-2">
                    <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                        <img src="/logo-aluminito.png" alt="Aluminito" className="h-full w-full object-cover" />
                    </span>
                    <div><p className="font-display text-sm font-bold tracking-wide">Aluminito</p><p className="text-[11px] text-silver/50">Painel administrativo</p></div>
                </div>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-silver/45">Menu principal</p>
                <nav className="space-y-1" aria-label="Navegação do painel">
                    {tabs.map((aba) => {
                        const Icon = tabIcons[aba.id] || Settings2;
                        return <button key={aba.id} data-testid={`admin-tab-${aba.id}`} onClick={() => setSecao(aba.id)} aria-pressed={secao === aba.id} className={`admin-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${secao === aba.id ? "border-azul bg-azul text-white" : "border-transparent text-silver hover:border-white/10 hover:bg-white/5 hover:text-white"}`}><Icon size={17} strokeWidth={1.8} /><span>{aba.label}</span></button>;
                    })}
                </nav>
                <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3"><p className="truncate text-xs font-semibold">{usuario?.email || "Aluminito Esquadrias"}</p><p className="mt-1 text-[11px] capitalize text-silver/55">{({ chefe: "Diretor", admin: "Diretor", gerente: "Gerente", atendente: "Atendente" })[usuario?.role] || "Usuário"}</p></div>
            </aside>
            <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-graphite/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3.5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-silver/50">Aluminito · Administração</p>
                            <p className="mt-0.5 font-display text-base font-bold">{activeTab?.label || "Painel"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={abrirGuia}
                            aria-haspopup="dialog"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white"
                        >
                            <CircleHelp size={14} /> <span className="hidden sm:inline">Como funciona o painel</span><span className="sm:hidden">Ajuda</span>
                        </button>
                        <Link
                            to="/"
                            data-testid="admin-view-site-link"
                            className="hidden rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-silver transition-colors hover:text-white sm:block"
                        >
                            Ver site
                        </Link>
                        <button
                            data-testid="admin-logout-button"
                            onClick={sair}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white"
                        >
                            <LogOut size={14} /> Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8">
                <div className="admin-mobile-nav mb-5 flex gap-2 overflow-x-auto pb-2 md:hidden">
                    {tabs.map((aba) => (
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

                {hasPermission("relatorios") && secao === "visao" && <div data-testid="admin-overview-section">
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
                    <div className="flex items-center gap-2">
                        <button
                            data-testid="admin-export-csv"
                            onClick={exportar}
                            disabled={baixando}
                            className="inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-azul-dark disabled:opacity-50"
                        >
                            <Download size={14} /> {baixando ? "Gerando..." : "Exportar CSV"}
                        </button>
                        <button
                            data-testid="admin-refresh"
                            onClick={() => carregar()}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-white"
                        >
                            <RefreshCw size={14} /> Atualizar
                        </button>
                    </div>
                </div>}

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

                        <RetornarHoje onAbrirAtendimentos={() => setSecao("atendimentos")} />

                        <div data-testid="admin-status-resumo" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {STATUS_LEAD.map((st) => (
                                <button
                                    key={st.id}
                                    onClick={() => setSecao("atendimentos")}
                                    className="rounded-2xl border border-white/10 bg-graphite2 px-4 py-3 text-left transition-colors hover:border-white/30"
                                >
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                                        {st.label}
                                    </span>
                                    <p className="mt-2 font-display text-2xl font-bold">
                                        {stats.por_status?.[st.id] ?? 0}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {stats.por_motivo_perda?.length > 0 && <section data-testid="admin-loss-reasons" className="mt-5 rounded-2xl border border-white/10 bg-graphite2 p-5">
                            <h2 className="font-display text-lg font-semibold">Motivos de perda</h2>
                            <p className="mt-1 text-xs text-silver/50">Atendimentos marcados como perdidos no período selecionado.</p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{stats.por_motivo_perda.map((item) => <div key={item.motivo} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span className="text-sm text-silver/75">{MOTIVOS_PERDA_LABEL[item.motivo] || item.motivo}</span><span className="font-display text-lg font-semibold">{item.total}</span></div>)}</div>
                        </section>}

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
                                        <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]} name="Atendimentos" />
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

                        <div data-testid="admin-cores-simuladas" className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                                        <Palette size={18} className="text-azul" />
                                        Cores mais simuladas
                                    </h2>
                                    <p className="mt-1 text-xs text-silver/50">
                                        {stats.simulacoes?.total || 0} simulações no período
                                        {stats.simulacoes?.tipos?.length > 0 && " · "}
                                        {(stats.simulacoes?.tipos || [])
                                            .map((t) => `${TIPOS_SIM[t.tipo] || t.tipo} ${t.total}`)
                                            .join(" · ")}
                                    </p>
                                </div>
                                <button
                                    data-testid="admin-prewarm"
                                    onClick={prepararSimulacoes}
                                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white"
                                >
                                    Deixar essas cores instantâneas
                                </button>
                            </div>
                            {aviso && (
                                <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-silver/80">
                                    {aviso}
                                </p>
                            )}
                            {!stats.simulacoes || stats.simulacoes.cores.length === 0 ? (
                                <p className="mt-6 text-sm text-silver/50">
                                    Nenhuma simulação no período ainda.
                                </p>
                            ) : (
                                <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                                    {stats.simulacoes.cores.map((c, i) => (
                                        <li key={c.cor_arq} className="flex items-center gap-3">
                                            <span className="w-5 font-display text-xs font-bold text-silver/40">
                                                {i + 1}
                                            </span>
                                            <img
                                                src={`/${c.tipos?.vidro ? "vidros" : "cores"}/${c.cor_arq}`}
                                                alt={c.cor_label}
                                                loading="lazy"
                                                className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-white">
                                                    {c.cor_label}
                                                </p>
                                                <p className="truncate text-xs text-silver/50">
                                                    {Object.entries(c.tipos)
                                                        .map(([t, n]) => `${TIPOS_SIM[t] || t} ${n}`)
                                                        .join(" · ")}
                                                </p>
                                            </div>
                                            <span className="font-display font-bold text-azul">{c.total}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                                                <th className="pb-3 pr-4 font-semibold">Origem</th>
                                                <th className="pb-3 font-semibold">Status</th>
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
                                                    <td className="py-3 pr-4 text-silver/60">{ev.origem || "—"}</td>
                                                    <td className="py-3">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${(STATUS_LEAD.find((x) => x.id === ev.status) || STATUS_LEAD[0]).cls}`}>
                                                            {(STATUS_LEAD.find((x) => x.id === ev.status) || STATUS_LEAD[0]).label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
                </div>}

                {hasPermission("atendimentos") && secao === "atendimentos" && <LeadsManager />}
                {hasPermission("projetos") && secao === "projetos" && <ProjectsManager />}
                {hasPermission("catalogo") && secao === "catalogo" && <CatalogManager />}
                {hasPermission("aviso") && secao === "aviso" && <div className="max-w-2xl space-y-6"><ManutencaoEditor /><AvisoEditor /></div>}
                {hasPermission("avaliacoes") && secao === "avaliacoes" && <ReviewsManager />}
                {secao === "configuracoes" && <div className="space-y-5">
                    <SiteSecurityManager usuario={usuario} />
                </div>}
                {secao === "preferencias" && <section data-testid="admin-preferencias" className="rounded-2xl border border-white/10 bg-graphite2 p-5 sm:p-7">
                    <div className="mb-6"><h2 className="font-display text-lg font-semibold">Personalize seu painel</h2><p className="mt-1 text-sm text-silver/60">Essas opções são salvas para seu usuário neste navegador.</p></div>
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-xl border border-white/10 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-azul/10 text-azul"><Sun size={19} /></span><div><h3 className="text-sm font-semibold">Tema</h3><p className="mt-1 text-xs text-silver/60">Escolha a aparência do painel administrativo.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => salvarPreferencia("tema", "claro")} aria-pressed={tema === "claro"} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${tema === "claro" ? "border-azul bg-azul text-white" : "border-white/15 text-silver"}`}><Sun size={16} /> Claro</button><button type="button" onClick={() => salvarPreferencia("tema", "escuro")} aria-pressed={tema === "escuro"} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${tema === "escuro" ? "border-azul bg-azul text-white" : "border-white/15 text-silver"}`}><Moon size={16} /> Escuro</button></div></div>
                        <div className="rounded-xl border border-white/10 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-azul/10 text-azul"><Rows3 size={19} /></span><div><h3 className="text-sm font-semibold">Espaçamento</h3><p className="mt-1 text-xs text-silver/60">Compacto mostra mais conteúdo na tela.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => salvarPreferencia("densidade", "confortavel")} aria-pressed={densidade === "confortavel"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${densidade === "confortavel" ? "border-azul bg-azul text-white" : "border-white/15 text-silver"}`}>Confortável</button><button type="button" onClick={() => salvarPreferencia("densidade", "compacta")} aria-pressed={densidade === "compacta"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${densidade === "compacta" ? "border-azul bg-azul text-white" : "border-white/15 text-silver"}`}>Compacta</button></div></div>
                    </div>
                    <p role="status" className="mt-5 text-xs text-silver/55">As alterações são aplicadas imediatamente.</p>
                </section>}
                {hasPermission("lixeira") && secao === "lixeira" && <AdminTrash />}
                {hasPermission("auditoria") && secao === "auditoria" && <AdminAudit />}
            </main>
            {guiaAberto && tabs.length > 0 && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-guide-title" aria-describedby="admin-guide-description">
                <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-graphite p-6 shadow-2xl sm:p-8">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-azul">Guia do painel · parte {etapaAtual + 1} de {tabs.length}</p><h2 id="admin-guide-title" className="mt-2 font-display text-xl font-semibold">{tabs[etapaAtual]?.label}</h2></div><button type="button" onClick={() => setGuiaAberto(false)} className="rounded-full border border-white/20 px-4 py-2 text-sm">Fechar</button></div>
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-azul transition-all" style={{ width: `${((etapaAtual + 1) / tabs.length) * 100}%` }} /></div>
                    <p id="admin-guide-description" className="mt-5 text-sm leading-relaxed text-silver/75">{tabs[etapaAtual]?.guide}</p>
                    <p className="mt-4 text-xs text-silver/45">As etapas seguem as seções disponíveis para seu cargo e se atualizam conforme as permissões e áreas do painel.</p>
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button type="button" onClick={() => setEtapaGuia((step) => Math.max(0, step - 1))} disabled={etapaAtual === 0} className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-35">Anterior</button><button type="button" onClick={() => { setSecao(tabs[etapaAtual].id); setGuiaAberto(false); }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Abrir esta área</button></div><button type="button" onClick={() => etapaAtual < tabs.length - 1 ? setEtapaGuia(etapaAtual + 1) : setGuiaAberto(false)} className="rounded-full bg-azul px-5 py-2 text-sm font-semibold">{etapaAtual < tabs.length - 1 ? "Próxima etapa" : "Concluir"}</button></div>
                </section>
            </div>}
            </div>
        </div>
    );
}
