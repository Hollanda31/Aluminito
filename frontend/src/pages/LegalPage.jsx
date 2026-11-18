import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ADDRESS, CNPJ, INSTAGRAM_HANDLE, INSTAGRAM_URL, LEGAL_NAME, WA_DISPLAY, WA_LINK } from "@/lib/site";

const LAST_UPDATED = "18 de novembro de 2026";

const DOCUMENTS = {
    privacidade: {
        title: "Política de privacidade",
        intro: "Esta política explica quais informações são tratadas quando você navega pelo site, pede um orçamento ou envia uma avaliação.",
        sections: [
            ["Quem trata os dados", `O controlador é ${LEGAL_NAME} (CNPJ ${CNPJ}), que opera a marca Aluminito. Para solicitações sobre seus dados, fale pelo WhatsApp ${WA_DISPLAY} ou escreva para o endereço comercial: ${ADDRESS}.`],
            ["Pedido de orçamento", "O formulário do site solicita apenas o necessário para preparar uma cotação: cidade ou bairro da instalação, descrição dos itens e, se você quiser, nome e especificações do material ou projeto. O site não salva esses campos no servidor. Ao continuar para o WhatsApp, os dados são incluídos no link para preencher a mensagem; a conversa só é enviada quando você confirma o envio no WhatsApp. A partir daí, a conversa é tratada pela Aluminito e pelo WhatsApp/Meta conforme os termos e avisos próprios desses serviços."],
            ["Avaliações", "Se você enviar uma avaliação, tratamos nome, cidade opcional, nota e comentário para receber, moderar e, com sua autorização expressa, publicar sua opinião. Ela não aparece imediatamente: a equipe deve confirmar que corresponde à experiência de um cliente e aprovar sua publicação. Você pode pedir a remoção pelo WhatsApp."],
            ["Métricas opcionais", "Somente depois de autorizar métricas nas preferências de cookies, o site envia ao servidor da Aluminito registros de interações com botões e projetos, como a categoria ou identificação do item e a seção visitada. O conteúdo do formulário de orçamento não é incluído. Os registros individuais são eliminados automaticamente após 90 dias. Você pode retirar a autorização a qualquer momento em “Preferências de cookies”, no rodapé."],
            ["Finalidades e compartilhamento", "Usamos as informações para responder a pedidos, preparar propostas, moderar avaliações e, se houver autorização, entender o uso do site. Não vendemos dados pessoais. O pedido de orçamento é enviado ao WhatsApp somente por sua ação; métricas autorizadas vão ao servidor que mantém o site. Links para Instagram e Google Maps só abrem serviços externos quando você os seleciona."],
            ["Bases legais", "Usamos os detalhes do orçamento para atender à sua solicitação e realizar procedimentos preliminares a uma possível contratação. A publicação de avaliações e o envio de métricas opcionais dependem do seu consentimento, que pode ser retirado. Registros técnicos necessários à operação e à segurança podem ser tratados conforme a base legal aplicável ao caso."],
            ["Registros técnicos", "A infraestrutura que entrega o site pode processar dados técnicos de conexão, como endereço IP, data e hora, para comunicação e segurança. A hospedagem e seus registros dependem da configuração do serviço."],
            ["Prazo de guarda e segurança", "Mensagens enviadas ao WhatsApp permanecem sujeitas às configurações e políticas do WhatsApp e aos controles de atendimento da empresa. Avaliações pendentes e aprovadas ficam no sistema até exclusão pela equipe ou solicitação do titular. Registros individuais de métricas expiram após 90 dias; totais diários por projeto não identificam visitantes e podem permanecer para comparação agregada. O site aplica controles de acesso ao painel; não insira dados sensíveis ou documentos pessoais nos campos livres."],
            ["Seus direitos", `Você pode solicitar confirmação do tratamento, acesso, correção, informação sobre compartilhamento e eliminação de dados tratados com consentimento, conforme os direitos previstos na LGPD. Envie o pedido pelo WhatsApp ${WA_DISPLAY}, identificando o dado ou atendimento a que ele se refere. A equipe poderá pedir informações razoáveis para localizar o registro e proteger terceiros.`],
            ["Atualizações", "Podemos atualizar esta política para refletir mudanças no site ou nas operações. A versão atual e a data de revisão ficam nesta página."],
        ],
    },
    termos: {
        title: "Termos de serviço",
        intro: "Ao usar o site, você pode consultar o portfólio, conhecer acabamentos e solicitar contato comercial.",
        sections: [
            ["Orçamentos e contratação", "O site não conclui compras nem recebe pagamentos. Um pedido enviado por formulário ou WhatsApp é uma solicitação de atendimento, não uma confirmação de pedido. Preços, materiais, medidas, prazos, condições de instalação, garantias e demais obrigações só ficam definidos na proposta e no contrato aceitos pelas partes."],
            ["Informações do portfólio", "Fotos e descrições servem para apresentar exemplos de projetos e acabamentos. Tons, medidas e aparência podem variar conforme material, iluminação, configuração de tela e condições da obra. Simulações digitais são ilustrativas; disponibilidade e especificações devem ser confirmadas na proposta."],
            ["Créditos e direitos autorais", "As fotos do portfólio, da loja e dos registros históricos são da Aluminito. As amostras de cores e vidros têm seus fornecedores identificados no catálogo: Metaperfil e Cebrace (linha Habitat). A marca, os textos, os desenhos e os demais materiais permanecem sujeitos aos direitos de seus respectivos titulares. Não copie ou reutilize materiais sem autorização."],
            ["Uso permitido", "Não use o site para enviar conteúdo ilícito, tentar acessar áreas administrativas ou prejudicar seu funcionamento."],
            ["Links de terceiros", "WhatsApp, Instagram e Google Maps são serviços externos, com termos e políticas próprios. A Aluminito não controla os recursos, a disponibilidade ou o tratamento de dados realizado por esses serviços."],
            ["Contato", `Dúvidas sobre estes termos: ${WA_DISPLAY}, ${ADDRESS}.`],
        ],
    },
    cookies: {
        title: "Aviso de cookies e métricas",
        intro: "Você pode aceitar ou recusar métricas opcionais sem perder acesso às páginas e aos formulários do site.",
        sections: [
            ["Armazenamento essencial", "O site não instala cookies de publicidade. Ele salva sua escolha de privacidade por até 180 dias no armazenamento local do navegador para não perguntar novamente em cada visita e usa armazenamento de sessão para lembrar quando você fecha um aviso do topo. Esses registros guardam preferências da interface, não dados de orçamento."],
            ["Métricas opcionais", "Se você escolher “Aceitar métricas”, o site poderá enviar ao servidor da Aluminito eventos de interação com links, botões e projetos. Esses eventos não incluem o conteúdo dos formulários de orçamento. Se recusar, ou retirar a autorização, novos eventos não serão enviados."],
            ["Como alterar sua escolha", "Use “Preferências de cookies” no rodapé para aceitar ou recusar métricas novamente. Você também pode apagar os dados locais do site nas configurações do navegador. A retirada da autorização interrompe novos envios; para pedir exclusão de um registro já recebido, fale com a equipe pelo WhatsApp."],
            ["Serviços externos", "O mapa não é carregado automaticamente. Um link abre o Google Maps apenas quando você o seleciona. WhatsApp e Instagram também só são acessados quando você escolhe seus links."],
        ],
    },
    reembolso: {
        title: "Cancelamentos e reembolsos",
        intro: "O site não vende produtos nem recebe pagamentos. Ele permite consultar informações e solicitar um orçamento sem custo pelo próprio site.",
        sections: [
            ["Antes de contratar", "Enviar um formulário ou conversar pelo WhatsApp não cria cobrança. A proposta deve informar escopo, valores, condições e prazos antes de qualquer contratação."],
            ["Depois da contratação", `Cancelamentos, devoluções e reembolsos são avaliados conforme a proposta ou contrato firmado, a situação concreta do serviço e os direitos previstos na legislação aplicável. Nenhuma disposição desta página elimina direitos legais do consumidor. Para registrar uma solicitação, entre em contato pelo WhatsApp ${WA_DISPLAY} e informe o número da proposta ou do pedido, se houver.`],
            ["Atendimento", `${LEGAL_NAME} · CNPJ ${CNPJ} · ${ADDRESS} · WhatsApp ${WA_DISPLAY}.`],
        ],
    },
    empresa: {
        title: "Dados da empresa",
        intro: "Informações de identificação e contato publicadas pela Aluminito.",
        sections: [
            ["Identificação", `${LEGAL_NAME}\nCNPJ: ${CNPJ}\nNome comercial: Aluminito Esquadrias e Vidros`],
            ["Endereço", ADDRESS],
            ["Contato", `WhatsApp: ${WA_DISPLAY}\nInstagram: ${INSTAGRAM_HANDLE}`],
            ["Atuação", "Serra - ES e Grande Vitória. A disponibilidade de atendimento para cada local deve ser confirmada diretamente com a equipe."],
            ["Privacidade e dados pessoais", `Para exercer direitos sobre seus dados ou pedir a remoção de uma avaliação, contate a equipe pelo WhatsApp ${WA_DISPLAY}.`],
        ],
    },
};

export default function LegalPage() {
    const { slug } = useParams();
    const document = DOCUMENTS[slug];

    useEffect(() => {
        if (!document) return undefined;
        const previousTitle = window.document.title;
        window.document.title = `${document.title} · Aluminito`;
        return () => { window.document.title = previousTitle; };
    }, [document]);

    if (!document) {
        return (
            <main className="min-h-screen bg-graphite px-5 py-16 text-white">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
                    <Link to="/" className="mt-6 inline-flex items-center gap-2 text-silverlight underline underline-offset-4"><ArrowLeft size={16} /> Voltar ao site</Link>
                </div>
            </main>
        );
    }

    return (
        <main id="conteudo-principal" className="min-h-screen bg-graphite px-5 py-12 text-silver sm:px-8 sm:py-16">
            <a href="#conteudo-legal" className="sr-only rounded bg-white px-4 py-3 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">Ir para o conteúdo principal</a>
            <article className="mx-auto max-w-3xl">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-silverlight underline-offset-4 hover:text-white hover:underline"><ArrowLeft size={16} /> Voltar ao site</Link>
                <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-azul">Aluminito · Informações legais</p>
                <h1 id="conteudo-legal" className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{document.title}</h1>
                <p className="mt-4 text-sm text-silver/80">Atualizado em {LAST_UPDATED}</p>
                <p className="mt-8 text-base leading-relaxed text-silverlight">{document.intro}</p>
                <div className="mt-8 space-y-7">
                    {document.sections.map(([heading, body]) => (
                        <section key={heading}>
                            <h2 className="font-display text-lg font-semibold text-white">{heading}</h2>
                            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-silverlight">{body}</p>
                        </section>
                    ))}
                </div>
                <div className="mt-12 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm">
                    {Object.entries(DOCUMENTS).filter(([key]) => key !== slug).map(([key, item]) => (
                        <Link key={key} to={`/${key}`} className="text-silverlight underline-offset-4 hover:text-white hover:underline">{item.title}</Link>
                    ))}
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-silverlight underline-offset-4 hover:text-white hover:underline">{INSTAGRAM_HANDLE}</a>
                    <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-silverlight underline-offset-4 hover:text-white hover:underline">WhatsApp {WA_DISPLAY}</a>
                    {slug === "privacidade" && <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer" className="text-silverlight underline-offset-4 hover:text-white hover:underline">Lei Geral de Proteção de Dados</a>}
                    {slug === "reembolso" && <a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noopener noreferrer" className="text-silverlight underline-offset-4 hover:text-white hover:underline">Código de Defesa do Consumidor</a>}
                    <button type="button" onClick={() => window.dispatchEvent(new Event("aluminito:open-cookie-settings"))} className="text-silverlight underline-offset-4 hover:text-white hover:underline">Preferências de cookies</button>
                </div>
            </article>
        </main>
    );
}
