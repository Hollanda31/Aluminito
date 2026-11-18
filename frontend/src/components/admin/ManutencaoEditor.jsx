import { useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import AdminHelp from "@/components/admin/AdminHelp";

const PADRAO = {
    ativo: false,
    titulo: "Site em manutenção",
    mensagem: "Estamos fazendo melhorias no site para atender você ainda melhor. Voltamos em breve!",
    mostrar_whatsapp: true,
};

const campo =
    "mt-1.5 w-full rounded-lg border border-white/15 bg-graphite px-3 py-2.5 text-sm text-white outline-none transition focus:border-azul";

// Liga/desliga o pop-up de manutenção do site e edita o texto dele.
export default function ManutencaoEditor() {
    const [salvo, setSalvo] = useState(PADRAO); // o que está gravado (e no ar)
    const [form, setForm] = useState(PADRAO); // o que está sendo editado
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        withAuthRefresh(() => authApi.get("/api/admin/manutencao"))
            .then(({ data }) => {
                const d = { ...PADRAO, ...data };
                setSalvo(d);
                setForm(d);
            })
            .catch(() => setMsg({ ok: false, t: "Não foi possível carregar o modo manutenção." }))
            .finally(() => setCarregando(false));
    }, []);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const gravar = async (dados, okMsg) => {
        setSalvando(true);
        setMsg(null);
        try {
            const { data } = await withAuthRefresh(() => authApi.put("/api/admin/manutencao", dados));
            const d = { ...PADRAO, ...data };
            setSalvo(d);
            setForm(d);
            setMsg({ ok: true, t: okMsg });
        } catch (err) {
            const detalhe = err?.response?.data?.detail;
            setMsg({ ok: false, t: typeof detalhe === "string" ? detalhe : "Não foi possível salvar." });
        } finally {
            setSalvando(false);
        }
    };

    // ligar e desligar gravam na hora, com o texto que estiver no formulário
    const alternar = () => {
        const ligar = !salvo.ativo;
        if (
            ligar &&
            !window.confirm(
                "Ativar o modo manutenção? Os visitantes verão o pop-up e não conseguirão usar o site até você desativar.",
            )
        ) {
            return;
        }
        gravar(
            { ...form, ativo: ligar },
            ligar
                ? "Modo manutenção ATIVADO. O pop-up aparece para os visitantes em até 30 segundos."
                : "Modo manutenção desativado. O site volta ao normal em até 30 segundos.",
        );
    };

    const salvarTexto = (e) => {
        e.preventDefault();
        gravar({ ...form, ativo: salvo.ativo }, "Texto salvo.");
    };

    if (carregando) return <p className="mt-12 text-center text-silver/50">Carregando...</p>;

    const alterado =
        form.titulo !== salvo.titulo ||
        form.mensagem !== salvo.mensagem ||
        form.mostrar_whatsapp !== salvo.mostrar_whatsapp;

    return (
        <section
            data-testid="manutencao-editor"
            className={`rounded-2xl border p-6 ${
                salvo.ativo ? "border-amber-400/50 bg-amber-400/5" : "border-white/10 bg-graphite2"
            }`}
        >
            <AdminHelp className="mb-5">
                Com o modo manutenção ligado, os visitantes veem um pop-up que não pode ser fechado e
                ficam sem acesso ao site. Este painel continua funcionando normalmente. Ao ligar ou
                desligar, a mudança chega aos visitantes em até 30 segundos.
            </AdminHelp>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                salvo.ativo ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                        />
                        Modo manutenção
                    </h2>
                    <p data-testid="manutencao-status" className="mt-1 text-sm text-silver/65">
                        {salvo.ativo
                            ? "ATIVO: os visitantes estão vendo o pop-up de manutenção."
                            : "Desativado: o site está funcionando normalmente."}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={salvo.ativo}
                    data-testid="manutencao-alternar"
                    onClick={alternar}
                    disabled={salvando}
                    className={`rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                        salvo.ativo ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"
                    }`}
                >
                    {salvando ? "Salvando..." : salvo.ativo ? "Desativar manutenção" : "Ativar manutenção"}
                </button>
            </div>

            <form onSubmit={salvarTexto} className="mt-6 border-t border-white/10 pt-6">
                <label className="block">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                        Título ({form.titulo.length}/80)
                    </span>
                    <input
                        data-testid="manutencao-titulo"
                        maxLength={80}
                        value={form.titulo}
                        onChange={(e) => set("titulo", e.target.value)}
                        className={campo}
                    />
                </label>
                <label className="mt-5 block">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                        Mensagem ({form.mensagem.length}/400)
                    </span>
                    <textarea
                        data-testid="manutencao-mensagem"
                        rows={4}
                        maxLength={400}
                        value={form.mensagem}
                        onChange={(e) => set("mensagem", e.target.value)}
                        className={`${campo} resize-none`}
                    />
                </label>
                <label className="mt-5 flex cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        data-testid="manutencao-whatsapp-check"
                        checked={form.mostrar_whatsapp}
                        onChange={(e) => set("mostrar_whatsapp", e.target.checked)}
                        className="h-5 w-5 accent-azul"
                    />
                    <span className="text-sm font-medium">Mostrar botão &quot;Falar pelo WhatsApp&quot; no pop-up</span>
                </label>

                {(form.titulo.trim() || form.mensagem.trim()) && (
                    <div className="mt-6">
                        <span className="text-[11px] uppercase tracking-[0.14em] text-silver/45">
                            Prévia (como ficará)
                        </span>
                        <div className="mt-1.5 rounded-xl border border-white/10 bg-graphite px-5 py-5 text-center">
                            <p className="font-display text-base font-bold text-white">
                                {form.titulo.trim() || PADRAO.titulo}
                            </p>
                            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-silver/75">
                                {form.mensagem.trim() || PADRAO.mensagem}
                            </p>
                            {form.mostrar_whatsapp && (
                                <span className="mt-4 inline-block rounded-full bg-azul px-5 py-2 text-xs font-semibold text-white">
                                    Falar pelo WhatsApp
                                </span>
                            )}
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
                        type="submit"
                        data-testid="manutencao-salvar"
                        disabled={salvando || !alterado}
                        className="rounded-full bg-azul px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark disabled:opacity-40"
                    >
                        {salvando ? "Salvando..." : "Salvar texto"}
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
        </section>
    );
}
