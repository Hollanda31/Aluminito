import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Eye, EyeOff, Pin, PinOff, RefreshCw, Star, Trash2 } from "lucide-react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import AdminHelp from "@/components/admin/AdminHelp";

const FILTROS = [
    { id: "todas", label: "Todas" },
    { id: "pending", label: "A confirmar / revisar" },
    { id: "visible", label: "Visíveis" },
    { id: "hidden", label: "Ocultas" },
    { id: "featured", label: "Destaques" },
];

const fmtData = (iso) =>
    new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export default function ReviewsManager() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [filtro, setFiltro] = useState("todas");
    const [carregando, setCarregando] = useState(true);
    const [acaoId, setAcaoId] = useState(null);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async () => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.get("/api/admin/reviews"),
            );
            setReviews(data);
            setErro("");
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível carregar as avaliações.");
        } finally {
            setCarregando(false);
        }
    }, [navigate]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const filtradas = useMemo(() => {
        if (filtro === "todas") return reviews;
        if (filtro === "featured") return reviews.filter((r) => r.featured && r.status === "visible" && r.customer_verified);
        if (filtro === "visible") return reviews.filter((r) => r.status === "visible" && r.customer_verified);
        if (filtro === "pending") return reviews.filter((r) => !r.customer_verified || r.status === "pending");
        return reviews.filter((r) => r.status === filtro);
    }, [reviews, filtro]);

    const mudarStatus = async (review, status) => {
        setAcaoId(review.id);
        setErro("");
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.patch(`/api/admin/reviews/${review.id}/status`, { status }),
            );
            setReviews((atual) =>
                atual.map((r) => (r.id === review.id ? data : r)),
            );
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível atualizar a avaliação.");
        } finally {
            setAcaoId(null);
        }
    };

    const mudarVerificacao = async (review, customer_verified) => {
        setAcaoId(review.id);
        setErro("");
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.patch(`/api/admin/reviews/${review.id}/verification`, { customer_verified }),
            );
            setReviews((atual) => atual.map((r) => (r.id === review.id ? data : r)));
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível atualizar a confirmação do cliente.");
        } finally {
            setAcaoId(null);
        }
    };

    const mudarDestaque = async (review, featured) => {
        setAcaoId(review.id);
        setErro("");
        try {
            await withAuthRefresh(() =>
                authApi.patch(`/api/admin/reviews/${review.id}/featured`, {
                    featured,
                }),
            );
            await carregar();
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível atualizar o destaque.");
        } finally {
            setAcaoId(null);
        }
    };

    const excluir = async (review) => {
        const confirmou = window.confirm(
            `Excluir definitivamente a avaliação de ${review.name}?`,
        );
        if (!confirmou) return;

        setAcaoId(review.id);
        setErro("");
        try {
            await withAuthRefresh(() =>
                authApi.delete(`/api/admin/reviews/${review.id}`),
            );
            setReviews((atual) => atual.filter((r) => r.id !== review.id));
        } catch (e) {
            if (e.response?.status === 401) {
                navigate("/admin/login", { replace: true });
                return;
            }
            setErro("Não foi possível excluir a avaliação.");
        } finally {
            setAcaoId(null);
        }
    };

    return (
        <section
            data-testid="admin-reviews-panel"
            className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6"
        >
            <AdminHelp className="mb-4">Compare a avaliação com os registros de atendimento e confirme a autorização para publicação. Só então marque a confirmação e publique manualmente. Ocultar mantém o registro no painel; excluir remove o registro do sistema.</AdminHelp>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-display text-lg font-semibold">
                        Gerenciar avaliações
                    </h2>
                    <p className="mt-1 text-sm text-silver/70">
                        Novas avaliações ficam pendentes. Só avaliações confirmadas pela equipe e publicadas aparecem no site.
                    </p>
                </div>
                <button
                    data-testid="admin-reviews-refresh"
                    onClick={carregar}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:text-white"
                >
                    <RefreshCw size={14} /> Atualizar
                </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {FILTROS.map((f) => (
                    <button
                        key={f.id}
                        data-testid={`admin-reviews-filter-${f.id}`}
                        onClick={() => setFiltro(f.id)}
                        aria-pressed={filtro === f.id}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                            filtro === f.id
                                ? "border-azul bg-azul text-white"
                                : "border-white/15 text-silver hover:border-white/40"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {erro && (
                <p
                    data-testid="admin-reviews-error"
                    className="mt-5 rounded-xl border border-azul/40 bg-azul/10 px-4 py-3 text-sm"
                >
                    {erro}
                </p>
            )}

            {carregando ? (
                <p className="mt-8 text-sm text-silver/50">Carregando avaliações...</p>
            ) : filtradas.length === 0 ? (
                <p
                    data-testid="admin-reviews-empty"
                    className="mt-8 rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-silver/50"
                >
                    Nenhuma avaliação encontrada para este filtro.
                </p>
            ) : (
                <div className="mt-6 grid gap-4">
                    {filtradas.map((review) => {
                        const status = review.status || "pending";
                        const oculta = status === "hidden";
                        const publicada = status === "visible" && Boolean(review.customer_verified);
                        const verificada = Boolean(review.customer_verified);
                        const destaque = Boolean(review.featured);
                        const ocupado = acaoId === review.id;
                        return (
                            <article
                                key={review.id}
                                data-testid={`admin-review-${review.id}`}
                                className={`rounded-2xl border p-5 transition-colors ${
                                    oculta
                                        ? "border-white/5 bg-black/20 opacity-70"
                                        : destaque
                                          ? "border-azul/50 bg-azul/5"
                                          : "border-white/10 bg-black/30"
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-1" aria-label={`${review.rating} de 5 estrelas`}>
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <Star
                                                key={value}
                                                size={15}
                                                className={
                                                    value <= review.rating
                                                        ? "fill-azul text-azul"
                                                        : "text-silver/25"
                                                }
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {destaque && (
                                            <span
                                                data-testid={`admin-review-featured-${review.id}`}
                                                className="inline-flex items-center gap-1 rounded-full bg-azul px-2.5 py-1 text-[11px] font-semibold text-white"
                                            >
                                                <Pin size={11} /> Destaque
                                            </span>
                                        )}
                                        <span
                                            data-testid={`admin-review-status-${review.id}`}
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                oculta
                                                    ? "bg-white/10 text-silver/80"
                                                    : publicada
                                                      ? "bg-azul/10 text-red-200"
                                                      : "bg-amber-500/10 text-amber-200"
                                            }`}
                                        >
                                            {oculta ? "Oculta" : publicada ? "Publicada · cliente confirmado" : verificada ? "Cliente confirmado · revisar" : "Pendente · confirmar cliente"}
                                        </span>
                                        <span className="text-xs text-silver/40">
                                            {fmtData(review.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                                    “{review.text}”
                                </p>
                                <p className="mt-4 text-sm font-semibold text-white">
                                    {review.name}
                                    {(review.role || review.place) && (
                                        <span className="ml-2 font-normal text-silver/45">
                                            {[review.role, review.place].filter(Boolean).join(" · ")}
                                        </span>
                                    )}
                                </p>
                                {review.customer_verified && (
                                    <p className="mt-2 text-xs text-emerald-200">
                                        Cliente confirmado por {review.customer_verified_by || "equipe"}{review.customer_verified_at ? ` · ${fmtData(review.customer_verified_at)}` : ""}
                                    </p>
                                )}

                                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                                    <button
                                        data-testid={`admin-review-verify-${review.id}`}
                                        onClick={() => mudarVerificacao(review, !verificada)}
                                        disabled={ocupado || (!review.publish_consent && !verificada)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${verificada ? "border-emerald-400/30 text-emerald-200 hover:bg-emerald-400/10" : "border-white/15 text-silver hover:border-emerald-300 hover:text-white"}`}
                                    >
                                        <BadgeCheck size={14} />
                                        {ocupado ? "Salvando..." : verificada ? "Desfazer confirmação" : review.publish_consent ? "Confirmar cliente" : "Sem autorização registrada"}
                                    </button>
                                    <button
                                        data-testid={`admin-review-feature-${review.id}`}
                                        onClick={() => mudarDestaque(review, !destaque)}
                                        disabled={ocupado || !publicada}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                                            destaque
                                                ? "border-azul bg-azul text-white hover:bg-azul-dark"
                                                : "border-white/15 text-silver hover:border-azul hover:text-white"
                                        }`}
                                    >
                                        {destaque ? <PinOff size={14} /> : <Pin size={14} />}
                                        {ocupado
                                            ? "Salvando..."
                                            : destaque
                                              ? "Remover destaque"
                                              : "Destacar"}
                                    </button>
                                    <button
                                        data-testid={`admin-review-toggle-${review.id}`}
                                        onClick={() => mudarStatus(review, publicada ? "hidden" : "visible")}
                                        disabled={ocupado || (!publicada && !verificada)}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white disabled:opacity-50"
                                    >
                                        {oculta ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {ocupado
                                            ? "Salvando..."
                                            : publicada
                                              ? "Ocultar do site"
                                              : verificada
                                                ? "Publicar no site"
                                                : "Confirme o cliente para publicar"}
                                    </button>
                                    <button
                                        data-testid={`admin-review-delete-${review.id}`}
                                        onClick={() => excluir(review)}
                                        disabled={ocupado}
                                        className="inline-flex items-center gap-2 rounded-full border border-azul/30 px-4 py-2 text-xs font-medium text-azul transition-colors hover:bg-azul hover:text-white disabled:opacity-50"
                                    >
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
