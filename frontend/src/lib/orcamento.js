// Abre o pop-up "Cadastro para orçamento" de qualquer lugar do site.
export const EVENTO_ABRIR_ORCAMENTO = "abrir-orcamento";

export function abrirOrcamento() {
    window.dispatchEvent(new Event(EVENTO_ABRIR_ORCAMENTO));
}
