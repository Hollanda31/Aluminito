import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { waMessage } from "@/lib/site";
import { useSiteConfig } from "@/lib/SiteConfig";

const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-silver/90";
const textareaClass =
    "mt-2 w-full resize-y rounded-xl border border-white/15 bg-[#202020] px-4 py-3 text-[15px] text-white placeholder:text-silver/75 transition focus:border-azul focus:ring-2 focus:ring-azul/30";
const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#202020] px-4 text-[15px] text-white placeholder:text-silver/75 transition focus:border-azul focus:ring-2 focus:ring-azul/30";

export default function OrcamentoForm({
    id,
    className = "rounded-3xl border border-white/10 bg-[#171717] p-7 shadow-2xl shadow-black/30 sm:p-9",
    onEnviado,
}) {
    const { whatsapp } = useSiteConfig();
    const [form, setForm] = useState({
        nome: "",
        local: "",
        projeto: "",
        itens: "",
        cor_aluminio: "",
        vidro: "",
    });
    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const submit = (event) => {
        event.preventDefault();
        const clean = (value) => value.trim();
        const lines = [
            "Olá! Vim pelo site da Aluminito e gostaria de pedir um orçamento.",
            "",
            `Cidade/bairro da instalação: ${clean(form.local)}`,
            `Itens a orçar: ${clean(form.itens)}`,
        ];
        if (clean(form.nome)) lines.splice(2, 0, `Nome: ${clean(form.nome)}`);
        if (clean(form.projeto)) lines.push(`Projeto ou referência: ${clean(form.projeto)}`);
        if (clean(form.cor_aluminio)) lines.push(`Alumínio/material: ${clean(form.cor_aluminio)}`);
        if (clean(form.vidro)) lines.push(`Vidro: ${clean(form.vidro)}`);

        window.open(waMessage(lines.join("\n"), whatsapp), "_blank", "noopener,noreferrer");
        onEnviado?.();
    };

    return (
        <form id={id} data-testid="contato-form" onSubmit={submit} className={className}>
            <h3 className="pr-10 font-display text-xl font-bold text-white sm:text-2xl">
                Solicite um orçamento
            </h3>
            <p className="mt-1 text-sm text-silver/90">
                Informe os detalhes da obra. A mensagem será aberta no WhatsApp para você revisar e enviar.
            </p>

            <label className="mt-7 block">
                <span className={labelClass}>Nome (opcional)</span>
                <input
                    data-testid="form-input-nome"
                    autoComplete="name"
                    maxLength={80}
                    value={form.nome}
                    onChange={set("nome")}
                    placeholder="Seu nome ou empresa"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Cidade e bairro da instalação *</span>
                <input
                    required
                    data-testid="form-input-local"
                    autoComplete="address-level2"
                    maxLength={100}
                    value={form.local}
                    onChange={set("local")}
                    placeholder="Ex.: Alterosas, Serra - ES"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Itens a orçar *</span>
                <textarea
                    required
                    data-testid="form-input-itens"
                    rows={4}
                    maxLength={1000}
                    value={form.itens}
                    onChange={set("itens")}
                    placeholder="Ex.: 3 janelas de correr e 1 guarda-corpo para varanda"
                    className={textareaClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Projeto ou referência (opcional)</span>
                <textarea
                    data-testid="form-input-projeto"
                    rows={2}
                    maxLength={300}
                    value={form.projeto}
                    onChange={set("projeto")}
                    placeholder="Descreva a obra ou informe se possui planta"
                    className={textareaClass}
                />
            </label>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                    <span className={labelClass}>Alumínio/material (opcional)</span>
                    <textarea
                        data-testid="form-input-cor-aluminio"
                        rows={2}
                        maxLength={200}
                        value={form.cor_aluminio}
                        onChange={set("cor_aluminio")}
                        placeholder="Ex.: preto fosco"
                        className={textareaClass}
                    />
                </label>
                <label className="block">
                    <span className={labelClass}>Vidro (opcional)</span>
                    <textarea
                        data-testid="form-input-vidro"
                        rows={2}
                        maxLength={200}
                        value={form.vidro}
                        onChange={set("vidro")}
                        placeholder="Ex.: incolor, temperado"
                        className={textareaClass}
                    />
                </label>
            </div>

            <button
                data-testid="contact-form-submit-button"
                type="submit"
                className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-azul px-6 py-4 font-semibold text-white transition-[background-color,transform] duration-300 hover:scale-[1.02] hover:bg-azul-dark focus-visible:scale-[1.02]"
            >
                <WhatsAppIcon className="h-5 w-5" />
                Continuar pelo WhatsApp
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-silver/85">
                Ao continuar, os detalhes deste formulário seguem no link do WhatsApp para preencher a mensagem. A conversa só é enviada se você confirmar por lá; o site não guarda esses campos no servidor. Consulte a <a href="/privacidade" className="underline underline-offset-4 hover:text-white">Política de privacidade</a>.
            </p>
            <p className="mt-2 text-center text-xs leading-relaxed text-silver/85">
                Fotos e plantas podem ser anexadas diretamente no WhatsApp, se desejar.
            </p>
        </form>
    );
}
