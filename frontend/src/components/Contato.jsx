import { useState } from "react";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons";
import { Clock, Instagram, MapPin } from "lucide-react";
import {
    ADDRESS,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    WA_DISPLAY,
    WA_LINK,
    waMessage,
} from "@/lib/site";
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

const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

export default function Contato() {
    const [form, setForm] = useState({ nome: "", telefone: "", cidade: "", tipo: "" });
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        const msg = `Olá! Vim pelo site da Aluminito e gostaria de solicitar um orçamento.\n\nNome: ${form.nome}\nTelefone: ${form.telefone}\nCidade: ${form.cidade}\nTipo de projeto: ${form.tipo}`;
        trackClique("Formulário", `${form.tipo} - ${form.cidade}`, "contato");
        window.open(waMessage(msg), "_blank");
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
                            href={WA_LINK}
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
                                    {WA_DISPLAY}
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
                                    Seg a Qui · 08:00 às 18:00 · Sex até as 17:00
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
                                value={form.telefone}
                                onChange={set("telefone")}
                                placeholder="(27) 99999-9999"
                                className={inputClass}
                            />
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
                    </form>
                </Reveal>
            </div>
        </section>
    );
}
