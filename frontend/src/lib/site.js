export const WA_NUMBER = "5527998682220";
export const WA_DISPLAY = "(27) 99868-2220";
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const waMessage = (text) =>
    `${WA_LINK}?text=${encodeURIComponent(text)}`;

export const INSTAGRAM_URL = "https://www.instagram.com/aluminitoesquadrias";
export const INSTAGRAM_HANDLE = "@aluminitoesquadrias";
export const ADDRESS = "R. Vitória, 488 - Alterosas, Serra - ES";
export const MAPS_EMBED =
    "https://www.google.com/maps?q=R.+Vit%C3%B3ria,+488+-+Alterosas,+Serra+-+ES&output=embed";

export const waOrcamento = waMessage(
    "Olá! Vim pelo site da Aluminito e admirei o acabamento dos projetos de vocês. Gostaria de solicitar um orçamento de esquadrias de alumínio e vidros sob medida para o meu projeto. Podem me ajudar?",
);

const u = (id, w) =>
    `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const IMAGES = {
    hero: "/projects/sacada-envidracada.jpg",
    sobreMain: u("photo-1780429483856-aefcf0ab9e26", 1600),
    sobreSecond: u("photo-1766603636700-e9d80473f40f", 1200),
};
