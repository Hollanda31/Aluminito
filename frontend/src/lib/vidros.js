// Cores de vidro do simulador. Referência: linha Habitat by Cebrace
// (https://www.cebrace.com.br/habitat-by-cebrace/): vidros de proteção solar para
// residências, em duas famílias: Neutro (visual próximo ao do vidro comum) e
// Refletivo (mais espelhado, dá privacidade de dia).
//
// "arq" é o nome do arquivo da amostra em public/vidros/ e também a chave usada
// pelo simulador. As amostras são ilustrativas (aproximação da tonalidade);
// para trocar por fotos reais, basta substituir o arquivo mantendo o mesmo nome.
// "calor" e "uv" são os percentuais de proteção informados pela Cebrace.
export const ESPESSURAS_VIDRO = "4, 6, 8 e 10 mm (laminado 4+4 mm)";

const DESC_NEUTRO =
    "Linha neutra: visual parecido com o do vidro comum, deixa entrar bastante luz natural e integra bem o ambiente interno e o externo.";
const DESC_REFLETIVO =
    "Linha refletiva: mais espelhada, ajuda na privacidade porque, de dia, dificulta enxergar de fora para dentro, sem atrapalhar a vista de quem está dentro.";

export const VIDROS = [
    {
        nome: "Habitat Neutro Incolor",
        codigo: "Linha Neutra",
        arq: "habitat-neutro-incolor.jpg",
        descricao: DESC_NEUTRO,
        calor: 32,
        uv: 57,
    },
    {
        nome: "Habitat Neutro Cinza Claro",
        codigo: "Linha Neutra",
        arq: "habitat-neutro-cinza-claro.jpg",
        descricao: DESC_NEUTRO,
        calor: 39,
        uv: 60,
    },
    {
        nome: "Habitat Neutro Cinza",
        codigo: "Linha Neutra",
        arq: "habitat-neutro-cinza.jpg",
        descricao: DESC_NEUTRO,
        calor: 45,
        uv: 67,
    },
    {
        nome: "Habitat Refletivo Cinza",
        codigo: "Linha Refletiva",
        arq: "habitat-refletivo-cinza.jpg",
        descricao: DESC_REFLETIVO,
        calor: 71,
        uv: 84,
    },
    {
        nome: "Habitat Refletivo Champanhe",
        codigo: "Linha Refletiva",
        arq: "habitat-refletivo-champanhe.jpg",
        descricao: DESC_REFLETIVO,
        calor: 50,
        uv: 91,
    },
    {
        nome: "Habitat Refletivo Esmeralda",
        codigo: "Linha Refletiva",
        arq: "habitat-refletivo-esmeralda.jpg",
        descricao: DESC_REFLETIVO,
        calor: 66,
        uv: 96,
    },
];
