import { useState } from "react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { Clock, Instagram, MapPin } from "lucide-react";
import {
    ADDRESS,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    waMessage,
} from "@/lib/site";
import { useSiteConfig } from "@/lib/SiteConfig";
import { trackClique } from "@/lib/track";

const CIDADES = [
    "Serra",
    "Vitória",
    "Vila Velha",
    "Cariacica",
    "Viana",
    "Outra cidade da Grande Vitória",
];

const TIPOS = [
    "Portas e Janelas de Alumínio",
    "Portões e Portas Pivotantes",
    "Fachada Pele de Vidro",
    "Guarda-Corpo em Alumínio e Vidro",
    "Envidraçamento de Sacada/Varanda",
    "Outros",
];

const SITUACOES = ["Obra nova", "Reforma / troca de esquadrias", "Ainda estou planejando"];
const PRAZOS = ["Urgente (até 15 dias)", "Em até 30 dias", "Sem pressa / pesquisando"];
const CORES_OPCOES = [
    "Ainda não sei",
    "Branco",
    "Preto",
    "Grafite / Cinza",
    "Bronze / Marrom",
    "Efeito madeira",
    "Outra",
];

const maskTel = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

export default function Contato() {
    const { whatsapp, whatsapp_display, horario } = useSiteConfig();
    const [form, setForm] = useState({
        nome: "",
        telefone: "",
        cidade: "",
        tipo: "",
        situacao: "",
        prazo: "",
        cor: "",
        medidas: "",
        obs: "",
    });
    const [mais, setMais] = useState(false);
    const [erroTel, setErroTel] = useState("");
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        if (form.telefone.replace(/\D/g, "").length < 10) {
            setErroTel("Digite o telefone com DDD, ex.: (27) 99999-9999");
            return;
        }
        setErroTel("");

        const linhas = [
            "Olá! Vim pelo site da Aluminito e gostaria de solicitar um orçamento.",
            "",
            `Nome: ${form.nome.trim()}`,
            `Telefone: ${form.telefone}`,
            `Cidade: ${form.cidade}`,
            `Tipo de projeto: ${form.tipo}`,
        ];
        if (form.situacao) linhas.push(`Situação da obra: ${form.situacao}`);
        if (form.prazo) linhas.push(`Prazo: ${form.prazo}`);
        if (form.cor) linhas.push(`Cor desejada: ${form.cor}`);
        if (form.medidas.trim()) linhas.push(`Medidas aproximadas: ${form.medidas.trim()}`);
        if (form.obs.trim()) linhas.push(`Observações: ${form.obs.trim()}`);

        trackClique("Formulário", `${form.tipo} - ${form.cidade}`, "contato", {
            nome: form.nome,
            telefone: form.telefone,
            cidade: form.cidade,
            tipo: form.tipo,
            situacao: form.situacao,
            prazo: form.prazo,
            cor: form.cor,
            medidas: form.medidas,
            obs: form.obs,
        });
        window.open(waMessage(linhas.join("\n"), whatsapp), "_blank");
    };

    return (
        <section
            id="contato"
            data-testid="contato-section"
            className="relative overflow-hidden bg-graphite2 py-24 sm:py-32"
        >
            <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-azul/10 blur-[130px]" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
                <Reveal>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                        Orçamento sem compromisso
                    </p>
                    <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                        Tem um projeto de arquitetura ou reforma em mãos?
                    </h2>
                    <p className="mt-5 max-w-lg text-base leading-relaxed text-silver/75 sm:text-lg">
                        Envie sua planta ou descreva seu projeto e receba uma
                        cotação rápida, personalizada e sem compromisso.
                    </p>

                    <div className="mt-9 space-y-4">
                        <a
                            data-testid="contato-whatsapp-link"
                            onClick={() => trackClique("Geral", "Contato - WhatsApp", "contato")}
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4 transition-colors duration-300 hover:border-azul/50"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <WhatsAppIcon className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    WhatsApp
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {whatsapp_display}
                                </span>
                            </span>
                        </a>
                        <a
                            data-testid="contato-instagram-link"
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4 transition-colors duration-300 hover:border-azul/50"
                        >
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <Instagram size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Instagram
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {INSTAGRAM_HANDLE}
                                </span>
                            </span>
                        </a>
                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <MapPin size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Endereço
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {ADDRESS}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-white/10 px-5 py-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-azul/15 text-azul">
                                <Clock size={20} />
                            </span>
                            <span>
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-silver/50">
                                    Atendimento
                                </span>
                                <span className="mt-0.5 block font-display font-semibold text-white">
                                    {horario.replace(/\n/g, " · ")}
                                </span>
                            </span>
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.12}>
                    <form
                        data-testid="contato-form"
                        onSubmit={submit}
                        className="rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9"
                    >
                        <h3 className="font-display text-xl font-bold text-graphite sm:text-2xl">
                            Solicite seu orçamento
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Preencha e continue direto no WhatsApp.
                        </p>

                        <label className="mt-7 block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Nome *
                            </span>
                            <input
                                required
                                data-testid="form-input-nome"
                                value={form.nome}
                                onChange={set("nome")}
                                placeholder="Seu nome"
                                className={inputClass}
                            />
                        </label>

                        <label className="mt-5 block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Telefone / WhatsApp *
                            </span>
                            <input
                                required
                                type="tel"
                                data-testid="form-input-telefone"
                                inputMode="tel"
                                autoComplete="tel"
                                value={form.telefone}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, telefone: maskTel(e.target.value) }))
                                }
                                placeholder="(27) 99999-9999"
                                className={inputClass}
                            />
                            {erroTel && (
                                <span role="alert" className="mt-1.5 block text-xs text-red-600">
                                    {erroTel}
                                </span>
                            )}
                        </label>

                        <label className="mt-5 block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Cidade *
                            </span>
                            <select
                                required
                                data-testid="form-input-cidade"
                                value={form.cidade}
                                onChange={set("cidade")}
                                className={`${inputClass} appearance-none ${form.cidade ? "" : "text-slate-400"}`}
                            >
                                <option value="" disabled>
                                    Selecione sua cidade
                                </option>
                                {CIDADES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="mt-5 block">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Tipo de Projeto *
                            </span>
                            <select
                                required
                                data-testid="form-input-tipo"
                                value={form.tipo}
                                onChange={set("tipo")}
                                className={`${inputClass} appearance-none ${form.tipo ? "" : "text-slate-400"}`}
                            >
                                <option value="" disabled>
                                    O que você precisa?
                                </option>
                                {TIPOS.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            data-testid="form-toggle-detalhes"
                            onClick={() => setMais((m) => !m)}
                            aria-expanded={mais}
                            className="mt-6 flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 px-4 py-3 text-left text-sm font-semibold text-graphite transition hover:border-azul hover:text-azul"
                        >
                            <span>Adicionar detalhes (opcional)</span>
                            <span aria-hidden="true" className="text-lg leading-none">
                                {mais ? "−" : "+"}
                            </span>
                        </button>
                        <p className="mt-1.5 text-xs text-slate-400">
                            Com mais detalhes o orçamento sai mais rápido e mais preciso.
                        </p>

                        {mais && (
                            <div data-testid="form-detalhes">
                                <label className="mt-5 block">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Situação da obra
                                    </span>
                                    <select
                                        data-testid="form-input-situacao"
                                        value={form.situacao}
                                        onChange={set("situacao")}
                                        className={`${inputClass} appearance-none ${form.situacao ? "" : "text-slate-400"}`}
                                    >
                                        <option value="">Selecione (opcional)</option>
                                        {SITUACOES.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="mt-5 block">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Prazo desejado
                                    </span>
                                    <select
                                        data-testid="form-input-prazo"
                                        value={form.prazo}
                                        onChange={set("prazo")}
                                        className={`${inputClass} appearance-none ${form.prazo ? "" : "text-slate-400"}`}
                                    >
                                        <option value="">Selecione (opcional)</option>
                                        {PRAZOS.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="mt-5 block">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Cor desejada
                                    </span>
                                    <select
                                        data-testid="form-input-cor"
                                        value={form.cor}
                                        onChange={set("cor")}
                                        className={`${inputClass} appearance-none ${form.cor ? "" : "text-slate-400"}`}
                                    >
                                        <option value="">Selecione (opcional)</option>
                                        {CORES_OPCOES.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="mt-5 block">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Medidas aproximadas
                                    </span>
                                    <input
                                        data-testid="form-input-medidas"
                                        maxLength={120}
                                        value={form.medidas}
                                        onChange={set("medidas")}
                                        placeholder="Ex.: janela 1,20 x 1,00 m (2 unidades)"
                                        className={inputClass}
                                    />
                                </label>

                                <label className="mt-5 block">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Observações
                                    </span>
                                    <textarea
                                        data-testid="form-input-obs"
                                        rows={3}
                                        maxLength={400}
                                        value={form.obs}
                                        onChange={set("obs")}
                                        placeholder="Conte um pouco do seu projeto"
                                        className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20"
                                    />
                                </label>
                            </div>
                        )}

                        <button
                            data-testid="contact-form-submit-button"
                            type="submit"
                            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-azul px-6 py-4 font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                        >
                            <WhatsAppIcon className="h-5 w-5" />
                            Enviar Projeto pelo WhatsApp
                        </button>
                        <p className="mt-4 text-center text-xs text-slate-400">
                            Resposta rápida em horário comercial · Sem
                            compromisso
                        </p>
                        <p className="mt-2 text-center text-xs text-slate-400">
                            No WhatsApp você pode anexar fotos do local e a planta do projeto.
                        </p>
                        <p className="mt-2 text-center text-[11px] leading-snug text-slate-400">
                            Ao enviar, você concorda que a Aluminito use esses dados apenas para
                            responder ao seu pedido de orçamento.
                        </p>
                    </form>
                </Reveal>
            </div>
        </section>
    );
}
