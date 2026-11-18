export const WA_NUMBER = "5527998682220";
export const WA_DISPLAY = "(27) 99868-2220";
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const waMessage = (text, number = WA_NUMBER) =>
    `https://wa.me/${String(number).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const INSTAGRAM_URL = "https://www.instagram.com/aluminitoesquadrias";
export const INSTAGRAM_HANDLE = "@aluminitoesquadrias";
export const ADDRESS = "R. Vitória, 488 - Alterosas, Serra - ES";
export const LEGAL_NAME = "Aluminito Indústria e Comércio Ltda.";
export const CNPJ = "28.485.365/0001-72";
export const MAPS_URL =
    "https://www.google.com/maps/search/?api=1&query=R.+Vit%C3%B3ria%2C+488+-+Alterosas%2C+Serra+-+ES";

export const ORCAMENTO_MESSAGE = "Olá! Vim pelo site da Aluminito e admirei o acabamento dos projetos de vocês. Gostaria de solicitar um orçamento de esquadrias de alumínio e vidros sob medida para o meu projeto. Podem me ajudar?";
export const waOrcamento = waMessage(ORCAMENTO_MESSAGE);

