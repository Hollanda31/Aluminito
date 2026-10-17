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

const OBRAS = [
    "Obra nova",
    "Reforma",
    "Troca de esquadrias antigas",
    "Ainda estou planejando",
];

const PRAZOS = [
    "O quanto antes",
    "Em até 30 dias",
    "De 1 a 3 meses",
    "Só estou pesquisando preços",
];

const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

const textareaClass =
    "mt-2 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-[15px] text-graphite transition focus:border-azul focus:bg-white focus:ring-2 focus:ring-azul/20";

// (27) 99999-9999 enquanto a pessoa digita
const maskTelefone = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function Campo({ label, children, className = "" }) {
    return (
        <label className={`block ${className}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {label}
            </span>
            {children}
        </label>
    );
}

const FORM_VAZIO = {
    nome: "",
    telefone: "",
    cidade: "",
    tipo: "",
    obra: "",
    prazo: "",
    medidas: "",
    detalhes: "",
};

export default function Contato() {
    const [form, setForm] = useState(FORM_VAZIO);
    const [erroTel, setErroTel] = useState(false);
    const [waUrl, setWaUrl] = useState(null);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();

        if (form.telefone.replace(/\D/g, "").length < 10) {
            setErroTel(true);
            return;
        }
        setErroTel(false);

        const linhas = [
            "Olá! Vim pelo site da Aluminito e gostaria de solicitar um orçamento.",
            "",
            `Nome: ${form.nome}`,
            `Telefone: ${form.telefone}`,
            `Cidade: ${form.cidade}`,
            `Tipo de projeto: ${form.tipo}`,
            `Situação da obra: ${form.obra}`,
        ];
        if (form.prazo) linhas.push(`Prazo: ${form.prazo}`);
        if (form.medidas.trim())
            linhas.push(`Medidas aproximadas: ${form.medidas.trim()}`);
        if (form.detalhes.trim())
            linhas.push(`Detalhes: ${form.detalhes.trim()}`);
        linhas.push("", "Vou enviar fotos do local aqui na conversa.");

        // só manda para o painel os campos que foram preenchidos
        const dados = Object.fromEntries(
            Object.entries(form)
                .map(([k, v]) => [k, v.trim()])
                .filter(([, v]) => v),
        );

        const url = waMessage(linhas.join("\n"));
        trackClique(
            "Formulário",
            `${form.tipo} - ${form.cidade}`,
            "contato",
            dados,
        );
        window.open(url, "_blank");
        setWaUrl(url); // link de reserva caso o navegador bloqueie a janela
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
                            Preencha e continue direto no WhatsApp. Quanto mais
                            detalhes, mais rápido o orçamento.
                        </p>

                        <Campo label="Nome *" className="mt-7">
                            <input
                                required
                                autoComplete="name"
                                data-testid="form-input-nome"
                                value={form.nome}
                                onChange={set("nome")}
                                placeholder="Seu nome"
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Telefone / WhatsApp *" className="mt-5">
                            <input
                                required
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel-national"
                                data-testid="form-input-telefone"
                                value={form.telefone}
                                onChange={(e) => {
                                    setErroTel(false);
                                    setForm((f) => ({
                                        ...f,
                                        telefone: maskTelefone(e.target.value),
                                    }));
                                }}
                                placeholder="(27) 99999-9999"
                                className={
                                    erroTel
                                        ? inputClass.replace("border-slate-300", "border-red-500")
                                        : inputClass
                                }
                            />
                            {erroTel && (
                                <span className="mt-1.5 block text-xs text-red-600">
                                    Digite o telefone com DDD.
                                </span>
                            )}
                        </Campo>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <Campo label="Cidade *">
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
                            </Campo>

                            <Campo label="Tipo de Projeto *">
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
                            </Campo>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <Campo label="Obra nova ou reforma? *">
                                <select
                                    required
                                    data-testid="form-input-obra"
                                    value={form.obra}
                                    onChange={set("obra")}
                                    className={`${inputClass} appearance-none ${form.obra ? "" : "text-slate-400"}`}
                                >
                                    <option value="" disabled>
                                        Selecione
                                    </option>
                                    {OBRAS.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            </Campo>

                            <Campo label="Prazo desejado">
                                <select
                                    data-testid="form-input-prazo"
                                    value={form.prazo}
                                    onChange={set("prazo")}
                                    className={`${inputClass} appearance-none ${form.prazo ? "" : "text-slate-400"}`}
                                >
                                    <option value="">Opcional</option>
                                    {PRAZOS.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </Campo>
                        </div>

                        <Campo label="Medidas aproximadas" className="mt-5">
                            <input
                                data-testid="form-input-medidas"
                                value={form.medidas}
                                onChange={set("medidas")}
                                maxLength={120}
                                placeholder="Ex.: 2 janelas de 1,20 x 1,00 m"
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Detalhes do projeto" className="mt-5">
                            <textarea
                                data-testid="form-input-detalhes"
                                value={form.detalhes}
                                onChange={set("detalhes")}
                                maxLength={400}
                                rows={3}
                                placeholder="Cor desejada, tipo de vidro, andar, bairro..."
                                className={textareaClass}
                            />
                        </Campo>

                        <button
                            data-testid="contact-form-submit-button"
                            type="submit"
                            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-azul px-6 py-4 font-semibold text-white transition-colors duration-200 hover:bg-azul-dark"
                        >
                            <WhatsAppIcon className="h-5 w-5" />
                            Enviar Projeto pelo WhatsApp
                        </button>

                        {waUrl ? (
                            <p
                                data-testid="form-enviado"
                                className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600"
                            >
                                Abrimos o WhatsApp com o seu pedido. Lá, é só
                                anexar as fotos do local.{" "}
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-azul underline"
                                >
                                    Não abriu? Toque aqui.
                                </a>
                            </p>
                        ) : (
                            <p className="mt-4 text-center text-xs text-slate-400">
                                Resposta rápida em horário comercial · Sem
                                compromisso · Usamos seus dados só para
                                responder ao seu orçamento
                            </p>
                        )}
                    </form>
                </Reveal>
            </div>
        </section>
    );
}