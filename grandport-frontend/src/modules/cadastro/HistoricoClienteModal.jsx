import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { User, FileText, ShoppingBag, AlertTriangle, CheckCircle, Calendar, Printer, X } from 'lucide-react';
import { CupomReciboModal } from '../vendas/CupomReciboModal';

export const HistoricoClienteModal = ({ cliente, onClose }) => {
    const [historicoCompras, setHistoricoCompras] = useState([]);
    const [resumo, setResumo] = useState({ totalComprado: 0, totalAberto: 0 });
    const [loading, setLoading] = useState(true);

    const [pedidoParaReimprimir, setPedidoParaReimprimir] = useState(null);

    useEffect(() => {
        const carregarHistorico = async () => {
            setLoading(true);
            try {
                // Busca os dados reais no Backend
                const res = await api.get(`/api/parceiros/${cliente.id}/historico-compras`);

                // Formata os dados para o padrão que a tela e o cupom de impressão esperam
                const comprasFormatadas = res.data.map(compra => ({
                    id: compra.id,
                    data: compra.data,
                    subtotal: compra.valor,
                    desconto: 0,
                    total: compra.valor,
                    status: compra.status,
                    metodoPagamento: 'N/A',
                    veiculoDescricao: compra.veiculo,
                    vendedor: 'N/A',
                    cliente: cliente,
                    itens: [] // Idealmente, o backend deve trazer a lista de itens aqui também
                }));

                setHistoricoCompras(comprasFormatadas);

                const comprado = comprasFormatadas.reduce((acc, c) => acc + c.total, 0);
                const aberto = comprasFormatadas.filter(c => c.status === 'AGUARDANDO_PAGAMENTO').reduce((acc, c) => acc + c.total, 0);

                setResumo({ totalComprado: comprado, totalAberto: aberto });
                setLoading(false);
            } catch (error) {
                console.error("Erro ao carregar histórico", error);
                setLoading(false);
            }
        };

        if (cliente) carregarHistorico();
    }, [cliente]);

    return (
        <>
            {/* MÁSCARA ESCURA DO MODAL PRINCIPAL */}
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">

                    {/* CABEÇALHO */}
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-xl"><User size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black tracking-widest uppercase">FICHA DO CLIENTE</h2>
                                <p className="text-blue-300 font-bold text-sm">
                                    {cliente.nome} • CPF/CNPJ: {cliente.documento}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* CONTEÚDO DIVIDIDO EM DUAS COLUNAS */}
                    <div className="p-8 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">

                        {/* COLUNA ESQUERDA: RESUMO FINANCEIRO */}
                        <div className="w-full md:w-1/3 space-y-6">

                            {/* Card de Fiado (Alerta de Dívida) */}
                            <div className={`p-6 rounded-2xl border-2 ${resumo.totalAberto > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {resumo.totalAberto > 0 ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                                    <h3 className={`font-black uppercase tracking-widest text-xs ${resumo.totalAberto > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        Status Financeiro (Fiado)
                                    </h3>
                                </div>
                                <h1 className={`text-4xl font-black ${resumo.totalAberto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    R$ {resumo.totalAberto.toFixed(2)}
                                </h1>
                                <p className="text-xs font-bold mt-2 text-slate-500">
                                    {resumo.totalAberto > 0 ? 'Existem compras a prazo pendentes de pagamento.' : 'Cliente sem dívidas pendentes na loja.'}
                                </p>
                                {resumo.totalAberto > 0 && (
                                    <button className="mt-4 w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 shadow-md transition-colors">
                                        IR PARA CONTAS A RECEBER
                                    </button>
                                )}
                            </div>

                            {/* Card Total Comprado */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag className="text-blue-500" size={18} />
                                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Total Comprado (Histórico)</h3>
                                </div>
                                <h1 className="text-3xl font-black text-slate-800">
                                    R$ {resumo.totalComprado.toFixed(2)}
                                </h1>
                                <p className="text-xs font-bold mt-2 text-slate-500">
                                    Total de {historicoCompras.length} pedidos realizados.
                                </p>
                            </div>

                        </div>

                        {/* COLUNA DIREITA: LISTA DE PEDIDOS */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-100 border-b border-slate-200">
                                <h3 className="font-black text-slate-700 uppercase flex items-center gap-2">
                                    <FileText size={18}/> Lista de Pedidos (Compras)
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {/* VERIFICAÇÃO DE LOADING CORRIGIDA AQUI */}
                                {loading ? (
                                    <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Carregando histórico do servidor...</div>
                                ) : historicoCompras.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-bold">Nenhuma compra registrada para este cliente.</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                        <tr className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                                            <th className="pb-3 pl-2">Data / Pedido</th>
                                            <th className="pb-3">Aplicação (Viatura)</th>
                                            <th className="pb-3 text-right">Valor</th>
                                            <th className="pb-3 text-center">Status</th>
                                            <th className="pb-3 text-center">Ação</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {historicoCompras.map(compra => (
                                            <tr key={compra.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="py-4 pl-2">
                                                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                        <Calendar size={14} className="text-blue-400"/> {new Date(compra.data).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p className="text-xs font-mono text-slate-400 mt-1">#{compra.id}</p>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-slate-600">{compra.veiculoDescricao || 'N/A'}</td>
                                                <td className="py-4 text-right font-black text-slate-800">R$ {compra.total.toFixed(2)}</td>
                                                <td className="py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest ${compra.status === 'CONCLUIDA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {compra.status.replace('_', ' ')}
                                                        </span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <button
                                                        onClick={() => setPedidoParaReimprimir(compra)}
                                                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                        title="Reimprimir Recibo"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODAL DE REIMPRESSÃO (Sobreposto a esta tela) */}
            {pedidoParaReimprimir && (
                <CupomReciboModal
                    pedido={pedidoParaReimprimir}
                    onClose={() => setPedidoParaReimprimir(null)}
                />
            )}
        </>
    );
};