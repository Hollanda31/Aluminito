import { useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import AdminHelp from "@/components/admin/AdminHelp";

const TIPOS = [
    { id: "info", label: "Informativo (cinza)", prev: "bg-graphite2 text-white border border-white/10" },
    { id: "alerta", label: "Atenção (amarelo)", prev: "bg-amber-500 text-black" },
    { id: "promo", label: "Promoção (vermelho)", prev: "bg-azul text-white" },
];

const VAZIO = { ativo: false, texto: "", tipo: "info", expira_em: "" };

const campo =
    "mt-1.5 w-full rounded-lg border border-white/15 bg-graphite px-3 py-2.5 text-sm text-white outline-none transition focus:border-azul";

// hoje no horário de Brasília, no formato AAAA-MM-DD (mesmo critério do servidor)
const hojeBR = () =>
    new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

const fmtData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

// Diz se o aviso SALVO está aparecendo para os visitantes e, se não, por quê.
function situacao(a) {
    const texto = (a.texto || "").trim();
    if (!texto) return { no_ar: false, motivo: "Nenhum aviso cadastrado." };
    if (!a.ativo) {
        return { no_ar: false, motivo: "O aviso está desativado, por isso não aparece no site." };
    }
    if (a.expira_em && a.expira_em < hojeBR()) {
        return {
            no_ar: false,
            motivo: `O aviso expirou em ${fmtData(a.expira_em)} e não aparece mais no site.`,
        };
    }
    return { no_ar: true, motivo: "" };
}

export default function AvisoEditor() {
    const [salvo, setSalvo] = useState(VAZIO); // o que está gravado (e no ar)
    const [form, setForm] = useState(VAZIO); // o que você está digitando
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/admin/aviso"))
            .then(({ data }) => {
                const a = {
                    ativo: !!data.ativo,
                    texto: data.texto || "",
                    tipo: data.tipo || "info",
                    expira_em: data.expira_em || "",
                };
                setSalvo(a);
                setForm(a);
            })
            .catch(() => setMsg({ ok: false, t: "Não foi possível carregar o aviso." }))
            .finally(() => setCarregando(false));
    }, []);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const gravar = async (dados, okMsg) => {
        setSalvando(true);
        setMsg(null);
        try {
            await withAuthRefresh(() => authApi.put("/api/admin/aviso", dados));
            setSalvo(dados);
            setForm(dados);
            setMsg({ ok: true, t: okMsg });
        } catch (err) {
            const detalhe = err?.response?.data?.detail;
            setMsg({ ok: false, t: typeof detalhe === "string" ? detalhe : "Não foi possível salvar." });
        } finally {
            setSalvando(false);
        }
    };

    const salvar = (e) => {
        e.preventDefault();
        gravar(
            form,
            form.ativo
                ? "Aviso salvo. Ele aparece no site em até 1 minuto."
                : "Aviso salvo (desativado: não aparece no site).",
        );
    };

    // tira do ar mas mantém o texto, para reativar depois
    const tirarDoAr = () =>
        gravar({ ...salvo, ativo: false }, "Aviso tirado do ar. Some do site em até 1 minuto. O texto continua guardado.");

    const apagar = () => {
        if (!window.confirm("Apagar o texto do aviso? Essa ação não pode ser desfeita.")) return;
        gravar(VAZIO, "Aviso apagado.");
    };

    if (carregando) return <p className="mt-12 text-center text-silver/50">Carregando...</p>;

    const sit = situacao(salvo);
    const tipoSalvo = TIPOS.find((t) => t.id === salvo.tipo) || TIPOS[0];
    const tipoForm = TIPOS.find((t) => t.id === form.tipo) || TIPOS[0];
    const alterado = JSON.stringify(form) !== JSON.stringify(salvo);

    return (
        <div className="max-w-2xl space-y-6">
            <AdminHelp>O aviso pode ser ativado por um período. Revise o texto e a prévia antes de salvar; apagar remove o conteúdo salvo, enquanto desativar apenas tira o aviso do site.</AdminHelp>
            {/* O que está no ar agora */}
            <section
                data-testid="aviso-status"
                className={`rounded-2xl border p-6 ${
                    sit.no_ar ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-graphite2"
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                sit.no_ar ? "bg-emerald-400" : "bg-silver/40"
                            }`}
                        />
                        {sit.no_ar ? "No ar agora" : "Nenhum aviso no ar"}
                    </h2>
                    {sit.no_ar && (
                        <a
                            href="/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-azul hover:underline"
                        >
                            Ver no site
                        </a>
                    )}
                </div>

                {sit.no_ar ? (
                    <>
                        <div
                            data-testid="aviso-no-ar"
                            className={`mt-4 rounded-lg px-4 py-2.5 text-center text-[13px] font-medium ${tipoSalvo.prev}`}
                        >
                            {salvo.texto}
                        </div>
                        <p className="mt-3 text-xs text-silver/55">
                            {salvo.expira_em
                                ? `Some sozinho em ${fmtData(salvo.expira_em)}.`
                                : "Sem data para sumir: fica no ar até você tirar."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                data-testid="aviso-tirar"
                                onClick={tirarDoAr}
                                disabled={salvando}
                                className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-azul disabled:opacity-50"
                            >
                                Tirar do ar
                            </button>
                            <button
                                type="button"
                                data-testid="aviso-apagar"
                                onClick={apagar}
                                disabled={salvando}
                                className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium text-silver transition-colors hover:text-white disabled:opacity-50"
                            >
                                Apagar aviso
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-3 text-sm text-silver/60">{sit.motivo}</p>
                        {salvo.texto.trim() && (
                            <>
                                <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-silver/45">
                                    Texto guardado
                                </p>
                                <p className="mt-1 text-sm text-silver/80">{salvo.texto}</p>
                                <button
                                    type="button"
                                    data-testid="aviso-apagar"
                                    onClick={apagar}
                                    disabled={salvando}
                                    className="mt-4 rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium text-silver transition-colors hover:text-white disabled:opacity-50"
                                >
                                    Apagar aviso
                                </button>
                            </>
                        )}
                    </>
                )}
            </section>

            {/* Criar / editar */}
            <form
                data-testid="aviso-editor"
                onSubmit={salvar}
                className="rounded-2xl border border-white/10 bg-graphite2 p-6"
            >
                <h2 className="font-display text-lg font-semibold">
                    {salvo.texto.trim() ? "Editar aviso" : "Criar aviso"}
                </h2>
                <p className="mt-1 text-sm text-silver/55">
                    Use para feriado, horário especial ou promoção. Os visitantes podem fechar o aviso.
                </p>

                <label className="mt-6 flex cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        data-testid="aviso-ativo"
                        checked={form.ativo}
                        onChange={(e) => set("ativo", e.target.checked)}
                        className="h-5 w-5 accent-azul"
                    />
                    <span className="text-sm font-medium">Mostrar o aviso no site</span>
                </label>

                <label className="mt-5 block">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                        Texto ({form.texto.length}/200)
                    </span>
                    <textarea
                        data-testid="aviso-texto"
                        rows={2}
                        maxLength={200}
                        value={form.texto}
                        onChange={(e) => set("texto", e.target.value)}
                        placeholder="Ex.: Feriado de 15/11: atendimento retorna na segunda, às 8h."
                        className={`${campo} resize-none`}
                    />
                </label>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">Estilo</span>
                        <select
                            data-testid="aviso-tipo"
                            value={form.tipo}
                            onChange={(e) => set("tipo", e.target.value)}
                            style={{ colorScheme: "dark" }}
                            className={campo}
                        >
                            {TIPOS.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                            Some sozinho em (opcional)
                        </span>
                        <input
                            type="date"
                            data-testid="aviso-expira"
                            value={form.expira_em}
                            onChange={(e) => set("expira_em", e.target.value)}
                            style={{ colorScheme: "dark" }}
                            className={campo}
                        />
                    </label>
                </div>

                {form.texto.trim() && (
                    <div className="mt-6">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                            Prévia (como ficará)
                        </span>
                        <div className={`mt-1.5 rounded-lg px-4 py-2.5 text-center text-[13px] font-medium ${tipoForm.prev}`}>
                            {form.texto}
                        </div>
                    </div>
                )}

                {msg && (
                    <p
                        role="status"
                        className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                            msg.ok ? "border-emerald-400/30 bg-emerald-400/10" : "border-azul/40 bg-azul/10"
                        }`}
                    >
                        {msg.t}
                    </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        data-testid="aviso-salvar"
                        type="submit"
                        disabled={salvando || !alterado}
                        className="rounded-full bg-azul px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark disabled:opacity-40"
                    >
                        {salvando ? "Salvando..." : "Salvar aviso"}
                    </button>
                    {alterado && !salvando && (
                        <button
                            type="button"
                            onClick={() => setForm(salvo)}
                            className="text-xs font-medium text-silver/70 hover:text-white"
                        >
                            Descartar alterações
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
