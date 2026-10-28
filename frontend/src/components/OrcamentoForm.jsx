import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons";
import { waMessage } from "@/lib/site";
import { useSiteConfig } from "@/lib/SiteConfig";
import { trackClique } from "@/lib/track";

const maskTel = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskDoc = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 14);
    if (d.length <= 11) {
        return d
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }
    return d
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
};

const labelClass = "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";
const textareaClass =
    "mt-2 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

// Formulário "Cadastro para orçamento" (usado na seção Contato e no pop-up).
export default function OrcamentoForm({
    id,
    className = "rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9",
    onEnviado,
}) {
    const { whatsapp } = useSiteConfig();
    const [form, setForm] = useState({
        nome: "",
        contato: "",
        documento: "",
        telefone: "",
        local: "",
        projeto: "",
        itens: "",
        cor_aluminio: "",
        vidro: "",
    });
    const [erroTel, setErroTel] = useState("");
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        if (form.telefone.replace(/\D/g, "").length < 10) {
            setErroTel("Digite o telefone com DDD, ex.: (27) 99999-9999");
            return;
        }
        setErroTel("");

        const t = (v) => v.trim();
        const linhas = [
            "Olá! Vim pelo site da Aluminito e gostaria de solicitar um orçamento.",
            "",
            `Nome: ${t(form.nome)}`,
            `Telefone de contato: ${form.telefone}`,
            `Local de instalação: ${t(form.local)}`,
            `Itens a orçar: ${t(form.itens)}`,
        ];
        if (t(form.contato)) linhas.splice(3, 0, `Contato: ${t(form.contato)}`);
        if (t(form.documento)) linhas.push(`CNPJ/CPF: ${t(form.documento)}`);
        if (t(form.projeto)) linhas.push(`Possui projeto: ${t(form.projeto)}`);
        if (t(form.cor_aluminio)) linhas.push(`Cor do alumínio / material: ${t(form.cor_aluminio)}`);
        if (t(form.vidro)) linhas.push(`Vidro (cor, espessura e tipo): ${t(form.vidro)}`);

        trackClique("Formulário", `Orçamento - ${t(form.local)}`, "contato", {
            nome: form.nome,
            contato: form.contato,
            documento: form.documento,
            telefone: form.telefone,
            local: form.local,
            projeto: form.projeto,
            itens: form.itens,
            cor_aluminio: form.cor_aluminio,
            vidro: form.vidro,
        });
        window.open(waMessage(linhas.join("\n"), whatsapp), "_blank");
        if (onEnviado) onEnviado();
    };

    return (
        <form
            id={id}
            data-testid="contato-form"
            onSubmit={submit}
            className={className}
        >
            <h3 className="pr-10 font-display text-xl font-bold text-graphite sm:text-2xl">
                Cadastro para orçamento
            </h3>
            <p className="mt-1 text-sm text-slate-500">
                Preencha e continue direto no WhatsApp.
            </p>

            <label className="mt-7 block">
                <span className={labelClass}>Nome *</span>
                <input
                    required
                    data-testid="form-input-nome"
                    autoComplete="name"
                    value={form.nome}
                    onChange={set("nome")}
                    placeholder="Seu nome ou nome da empresa"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Contato</span>
                <input
                    data-testid="form-input-contato"
                    maxLength={120}
                    value={form.contato}
                    onChange={set("contato")}
                    placeholder="E-mail ou nome de quem vamos falar"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>CNPJ / CPF</span>
                <input
                    data-testid="form-input-documento"
                    inputMode="numeric"
                    value={form.documento}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, documento: maskDoc(e.target.value) }))
                    }
                    placeholder="Somente números"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Telefone de contato *</span>
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
                <span className={labelClass}>Local de instalação *</span>
                <input
                    required
                    data-testid="form-input-local"
                    maxLength={200}
                    value={form.local}
                    onChange={set("local")}
                    placeholder="Endereço, bairro e cidade da obra"
                    className={inputClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Possui projeto?</span>
                <textarea
                    data-testid="form-input-projeto"
                    rows={2}
                    maxLength={400}
                    value={form.projeto}
                    onChange={set("projeto")}
                    placeholder="Conte se já tem projeto de arquitetura/planta e se vai enviar pelo WhatsApp"
                    className={textareaClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Descritivo dos itens a serem orçados *</span>
                <textarea
                    required
                    data-testid="form-input-itens"
                    rows={4}
                    maxLength={1500}
                    value={form.itens}
                    onChange={set("itens")}
                    placeholder="Ex.: 3 janelas de correr 1,20 x 1,00 m, 1 porta pivotante 1,00 x 2,50 m, guarda-corpo da sacada..."
                    className={textareaClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Cor do alumínio (ou especificação do material)</span>
                <textarea
                    data-testid="form-input-cor-aluminio"
                    rows={2}
                    maxLength={400}
                    value={form.cor_aluminio}
                    onChange={set("cor_aluminio")}
                    placeholder="Ex.: preto fosco, branco, bronze, efeito madeira..."
                    className={textareaClass}
                />
            </label>

            <label className="mt-5 block">
                <span className={labelClass}>Cor do vidro, espessura e tipo</span>
                <textarea
                    data-testid="form-input-vidro"
                    rows={2}
                    maxLength={400}
                    value={form.vidro}
                    onChange={set("vidro")}
                    placeholder="Ex.: incolor, 8 mm, temperado / fumê, 10 mm, laminado..."
                    className={textareaClass}
                />
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
            <p className="mt-2 text-center text-xs text-slate-400">
                No WhatsApp você pode anexar fotos do local e a planta do projeto.
            </p>
            <p className="mt-2 text-center text-[11px] leading-snug text-slate-400">
                Ao enviar, você concorda que a Aluminito use esses dados apenas para
                responder ao seu pedido de orçamento.
            </p>
        </form>
    );
}
