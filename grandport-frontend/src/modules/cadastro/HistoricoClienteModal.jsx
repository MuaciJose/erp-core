import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { User, FileText, ShoppingBag, AlertTriangle, CheckCircle, Calendar, Printer, X, Loader2 } from 'lucide-react';
import { CupomReciboModal } from '../vendas/CupomReciboModal';
import toast from 'react-hot-toast'; // 🚀 Adicionado para os avisos de carregamento

export const HistoricoClienteModal = ({ cliente, onClose }) => {
    const [historicoCompras, setHistoricoCompras] = useState([]);
    const [resumo, setResumo] = useState({ totalComprado: 0, totalAberto: 0 });
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const [pedidoParaReimprimir, setPedidoParaReimprimir] = useState(null);

    useEffect(() => {
        const carregarHistorico = async () => {
            setLoading(true);
            setErro(null);
            try {
                // Traz apenas o resumo das compras para a lista ficar super rápida
                const res = await api.get(`/api/parceiros/${cliente.id}/historico-compras`);

                const comprasFormatadas = res.data.map(compra => ({
                    ...compra,
                    id: compra.id,
                    dataHora: compra.dataHora || compra.data || new Date().toISOString(),
                    total: Number(compra.valorTotal || compra.valor || compra.total || 0),
                    status: compra.status || 'CONCLUIDA',
                    veiculoDescricao: compra.veiculoDescricao || (typeof compra.veiculo === 'string' ? compra.veiculo : compra.veiculo?.modelo) || 'N/A',
                }));

                setHistoricoCompras(comprasFormatadas);

                const comprado = comprasFormatadas.reduce((acc, c) => acc + c.total, 0);
                const aberto = comprasFormatadas.filter(c => c.status === 'AGUARDANDO_PAGAMENTO').reduce((acc, c) => acc + c.total, 0);

                setResumo({ totalComprado: comprado, totalAberto: aberto });
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
                setErro("Falha ao carregar os dados. Verifique a conexão com o servidor.");
            } finally {
                setLoading(false);
            }
        };

        if (cliente) carregarHistorico();
    }, [cliente]);

    // 🚀 NOVA FUNÇÃO: Busca a venda completa COM OS ITENS antes de imprimir
// 🚀 NOVA FUNÇÃO: Busca a venda completa COM OS ITENS e PAGAMENTOS antes de imprimir
    const handleImprimirDetalhado = async (compraResumo) => {
        const loadId = toast.loading('Buscando detalhes do pedido...');
        try {
            // Busca a Venda Completa na rota principal de Vendas
            const res = await api.get(`/api/vendas/${compraResumo.id}`);
            const pedidoCompleto = res.data;

            // 🚀 LÓGICA INTELIGENTE DE PAGAMENTO: Verifica se é uma lista de pagamentos ou texto simples
            let formasPagamento = 'DINHEIRO'; // Padrão

            if (pedidoCompleto.pagamentos && pedidoCompleto.pagamentos.length > 0) {
                // Se o cliente pagou de várias formas (Ex: Pix + Dinheiro), ele junta os nomes
                formasPagamento = pedidoCompleto.pagamentos
                    .map(p => p.formaPagamento || p.metodo || 'MÚLTIPLOS')
                    .join(' + ');
            } else if (pedidoCompleto.formaPagamento) {
                formasPagamento = pedidoCompleto.formaPagamento;
            }

            // Formata para o Recibo entender
            const pedidoFormatado = {
                ...pedidoCompleto,
                subtotal: Number(pedidoCompleto.valorSubtotal || pedidoCompleto.valorTotal || 0),
                desconto: Number(pedidoCompleto.desconto || 0),
                total: Number(pedidoCompleto.valorTotal || 0),
                metodoPagamento: formasPagamento, // 🚀 Agora o pagamento vai certo!
                vendedorNome: pedidoCompleto.vendedor?.nome || pedidoCompleto.vendedor || 'SISTEMA',
                cliente: cliente, // Mantém os dados do cliente da tela atual
                itens: pedidoCompleto.itens || []
            };

            setPedidoParaReimprimir(pedidoFormatado);
            toast.dismiss(loadId);
        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
            toast.error("Erro ao carregar os detalhes deste pedido.", { id: loadId });
        }
    };
    return (
        <>
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">

                    {/* CABEÇALHO */}
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-xl"><User size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black tracking-widest uppercase">FICHA DO CLIENTE</h2>
                                <p className="text-blue-300 font-bold text-sm">
                                    {cliente.nome} • CPF/CNPJ: {cliente.documento || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* CONTEÚDO */}
                    <div className="p-8 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8 custom-scrollbar">

                        {/* COLUNA ESQUERDA: RESUMO */}
                        <div className="w-full md:w-1/3 space-y-6">
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
                                    {resumo.totalAberto > 0 ? 'Existem compras a prazo pendentes.' : 'Cliente sem dívidas na loja.'}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag className="text-blue-500" size={18} />
                                    <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Total Comprado</h3>
                                </div>
                                <h1 className="text-3xl font-black text-slate-800">
                                    R$ {resumo.totalComprado.toFixed(2)}
                                </h1>
                                <p className="text-xs font-bold mt-2 text-slate-500">
                                    Total de {historicoCompras.length} pedidos.
                                </p>
                            </div>
                        </div>

                        {/* COLUNA DIREITA: LISTA DE PEDIDOS */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                            <div className="p-4 bg-slate-100 border-b border-slate-200 shrink-0">
                                <h3 className="font-black text-slate-700 uppercase flex items-center gap-2">
                                    <FileText size={18}/> Lista de Pedidos
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold gap-3">
                                        <Loader2 size={32} className="animate-spin text-blue-500" />
                                        Carregando histórico...
                                    </div>
                                ) : erro ? (
                                    <div className="h-full flex items-center justify-center text-red-500 font-bold text-center">
                                        {erro}
                                    </div>
                                ) : historicoCompras.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                                        Nenhuma compra registrada.
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white">
                                        <tr className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                                            <th className="pb-3 pl-2">Data / Pedido</th>
                                            <th className="pb-3">Aplicação</th>
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
                                                        <Calendar size={14} className="text-blue-400"/>
                                                        {new Date(compra.dataHora).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p className="text-xs font-mono text-slate-400 mt-1">#{compra.id}</p>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-slate-600">{compra.veiculoDescricao}</td>
                                                <td className="py-4 text-right font-black text-slate-800">R$ {compra.total.toFixed(2)}</td>
                                                <td className="py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest ${compra.status === 'CONCLUIDA' || compra.status === 'PAGA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {compra.status.replace('_', ' ')}
                                                        </span>
                                                </td>
                                                <td className="py-4 text-center">
                                                    {/* 🚀 CHAMA A NOVA FUNÇÃO DE BUSCA AQUI */}
                                                    <button
                                                        onClick={() => handleImprimirDetalhado(compra)}
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

            {/* MODAL DE REIMPRESSÃO */}
            {pedidoParaReimprimir && (
                <CupomReciboModal
                    pedido={pedidoParaReimprimir}
                    onClose={() => setPedidoParaReimprimir(null)}
                />
            )}
        </>
    );
};