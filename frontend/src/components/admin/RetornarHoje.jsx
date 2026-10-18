import { useCallback, useEffect, useState } from "react";
import { authApi, withAuthRefresh } from "@/lib/auth";
import { statusInfo, waCliente } from "@/lib/leads";
import { PhoneCall } from "lucide-react";

const DIAS = 3;

// Lista de atendimentos "em conversa" ou "orçamento enviado" parados há 3+ dias.
export default function RetornarHoje({ onAbrirAtendimentos }) {
    const [lista, setLista] = useState(null);
    const [erro, setErro] = useState(false);

    const carregar = useCallback(async () => {
        try {
            const { data } = await withAuthRefresh(() =>
                authApi.get("/api/admin/leads/retornar", { params: { dias: DIAS } }),
            );
            setLista(data);
            setErro(false);
        } catch (e) {
            setErro(true);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // "Já retornei": regravar o mesmo status conta como movimento e tira da lista
    const jaRetornei = async (lead) => {
        try {
            await withAuthRefresh(() =>
                authApi.patch(`/api/admin/leads/${lead.id}`, { status: lead.status }),
            );
            setLista((l) => ({
                total: l.total - 1,
                itens: l.itens.filter((x) => x.id !== lead.id),
            }));
        } catch (e) {
            setErro(true);
        }
    };

    if (erro && !lista) return null;
    if (!lista) return null;

    return (
        <div data-testid="admin-retornar" className="mt-6 rounded-2xl border border-white/10 bg-graphite2 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <PhoneCall size={18} className="text-azul" />
                Retornar hoje
                {lista.total > 0 && (
                    <span className="rounded-full bg-azul px-2.5 py-0.5 text-xs font-bold text-white">
                        {lista.total}
                    </span>
                )}
            </h2>
            <p className="mt-1 text-xs text-silver/50">
                Atendimentos em conversa ou com orçamento enviado, sem movimento há {DIAS} dias ou mais.
            </p>

            {lista.itens.length === 0 ? (
                <p className="mt-5 text-sm text-silver/55">Nenhum retorno pendente. Tudo em dia.</p>
            ) : (
                <ul className="mt-5 divide-y divide-white/5">
                    {lista.itens.map((lead) => {
                        const d = lead.dados || {};
                        const wa = waCliente(d.telefone);
                        const info = statusInfo(lead.status);
                        return (
                            <li key={lead.id} className="flex flex-wrap items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {d.nome || lead.item}
                                    </p>
                                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-silver/55">
                                        <span className={`rounded-full px-2 py-0.5 font-medium ${info.cls}`}>
                                            {info.label}
                                        </span>
                                        <span>parado há {lead.parado_ha_dias} dias</span>
                                        {d.telefone && <span>· {d.telefone}</span>}
                                    </p>
                                </div>
                                {wa && (
                                    <a
                                        href={wa}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-silver transition-colors hover:border-azul hover:text-white"
                                    >
                                        WhatsApp
                                    </a>
                                )}
                                <button
                                    data-testid={`retornei-${lead.id}`}
                                    onClick={() => jaRetornei(lead)}
                                    className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-azul"
                                >
                                    Já retornei
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {onAbrirAtendimentos && lista.itens.length > 0 && (
                <button
                    onClick={onAbrirAtendimentos}
                    className="mt-4 text-xs font-semibold text-azul hover:underline"
                >
                    Ver todos os atendimentos
                </button>
            )}
        </div>
    );
}
