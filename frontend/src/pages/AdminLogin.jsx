import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, withAuthRefresh } from "@/lib/auth";

function formatApiErrorDetail(detail) {
    if (detail == null) return "Algo deu errado. Tente novamente.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState(null);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/auth/me"))
            .then(() => navigate("/admin", { replace: true }))
            .catch(() => {});
    }, [navigate]);

    const submit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setErro(null);
        try {
            await authApi.post("/api/auth/login", { email, password });
            navigate("/admin", { replace: true });
        } catch (err) {
            setErro(
                formatApiErrorDetail(err.response?.data?.detail) ||
                    "Erro ao entrar",
            );
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="grid min-h-screen place-items-center bg-graphite px-5 font-body">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-graphite2 p-8 shadow-2xl">
                <div className="flex flex-col items-center">
                    <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5">
                        <img src="/logo-aluminito.png" alt="Aluminito" className="h-full w-full object-cover" />
                    </span>
                    <h1 className="mt-4 font-display text-xl font-bold text-white">
                        Painel de Atendimentos
                    </h1>
                    <p className="mt-1 text-xs text-silver/60">
                        Acesso restrito · Aluminito Esquadrias
                    </p>
                </div>

                <form data-testid="admin-login-form" onSubmit={submit} className="mt-8">
                    <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-silver/60">
                            E-mail
                        </span>
                        <input
                            type="email"
                            required
                            data-testid="admin-input-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-[15px] text-white transition focus:border-azul focus:ring-2 focus:ring-azul/30"
                        />
                    </label>
                    <label className="mt-4 block">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-silver/60">
                            Senha
                        </span>
                        <input
                            type="password"
                            required
                            data-testid="admin-input-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-[15px] text-white transition focus:border-azul focus:ring-2 focus:ring-azul/30"
                        />
                    </label>

                    {erro && (
                        <p
                            data-testid="admin-login-error"
                            className="mt-4 rounded-xl border border-azul/40 bg-azul/10 px-4 py-3 text-center text-sm text-white"
                        >
                            {erro}
                        </p>
                    )}

                    <button
                        data-testid="admin-login-submit"
                        type="submit"
                        disabled={enviando}
                        className="mt-6 w-full rounded-xl bg-azul px-6 py-4 font-semibold text-white transition-colors duration-200 hover:bg-azul-dark disabled:opacity-50"
                    >
                        {enviando ? "Entrando..." : "Entrar no painel"}
                    </button>
                </form>

                <a
                    href="/"
                    data-testid="admin-login-back-link"
                    className="mt-6 block text-center text-xs text-silver/50 transition-colors hover:text-white"
                >
                    ← Voltar ao site
                </a>
            </div>
        </div>
    );
}
