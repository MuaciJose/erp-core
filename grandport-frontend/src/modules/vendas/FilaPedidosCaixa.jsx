import React, { useState, useEffect } from 'react';
import { Search, Clock, User, FileText, CheckCircle, DollarSign, Package, AlertCircle, Lock, Wallet } from 'lucide-react';
import { ModalFinalizarVenda } from './ModalFinalizarVenda';
import { CupomReciboModal } from './CupomReciboModal';
import api from '../../api/axios';

export const FilaPedidosCaixa = ({ setPaginaAtiva }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState('');
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
    const [pedidoPago, setPedidoPago] = useState(null);

    const [caixaStatus, setCaixaStatus] = useState(null);
    const [loadingCaixa, setLoadingCaixa] = useState(true);

    const verificarCaixa = async () => {
        setLoadingCaixa(true);
        try {
            const res = await api.get('/api/caixa/atual');
            setCaixaStatus(res.data.status);
        } catch (err) {
            setCaixaStatus('FECHADO');
        } finally {
            setLoadingCaixa(false);
        }
    };

    const carregarPedidos = async () => {
        try {
            const res = await api.get('/api/vendas/fila-caixa');
            if (Array.isArray(res.data)) {
                const pedidosComHora = res.data.map(p => ({ ...p, horaEnvio: new Date(p.dataHora || Date.now()) }));
                setPedidos(pedidosComHora);
            } else {
                setPedidos([]);
            }
        } catch (error) {
            console.error("Erro ao carregar pedidos da fila:", error);
            setPedidos([]);
        }
    };

    useEffect(() => {
        verificarCaixa();
        carregarPedidos();
    }, []);

    const pedidosFiltrados = pedidos.filter(p =>
        p?.id?.toString().includes(busca) ||
        (p?.cliente && p?.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()))
    );

    const calcularTempoEspera = (horaEnvio) => {
        const diffMinutos = Math.floor((new Date() - horaEnvio) / 60000);
        if (diffMinutos <= 0) return 'Agora mesmo';
        return `Há ${diffMinutos} min`;
    };

    const confirmarRecebimento = async (dadosPagamento) => {
        try {
            const payload = [{
                metodo: dadosPagamento.metodoPagamento,
                valor: pedidoSelecionado.valorTotal,
                parcelas: 1
            }];

            const res = await api.post(`/api/vendas/${pedidoSelecionado.id}/pagar`, payload);

            alert(`Pagamento do Pedido #${pedidoSelecionado.id} aprovado com sucesso!`);

            const pedidoFormatadoParaCupom = {
                id: res.data.id || pedidoSelecionado.id,
                dataHora: res.data.dataHora || new Date().toISOString(),
                cliente: res.data.cliente || pedidoSelecionado.cliente || null,
                veiculoDescricao: res.data.veiculo?.modelo || pedidoSelecionado.veiculo?.modelo || 'Nenhum',
                vendedorNome: res.data.vendedorNome || pedidoSelecionado.vendedorNome || 'Sistema',
                valorSubtotal: res.data.valorSubtotal || pedidoSelecionado.valorSubtotal || 0,
                desconto: res.data.desconto || pedidoSelecionado.desconto || 0,
                valorTotal: res.data.valorTotal || pedidoSelecionado.valorTotal || 0,
                metodoPagamento: dadosPagamento.metodoPagamento,
                itens: (res.data.itens || pedidoSelecionado.itens || []).map(item => ({
                    nome: item.produto?.nome || 'Produto',
                    codigo: item.produto?.sku || 'N/A',
                    quantidade: item.quantidade || 0,
                    precoUnitario: item.precoUnitario || 0
                }))
            };

            setPedidoPago(pedidoFormatadoParaCupom);
            setPedidoSelecionado(null);
            setModalPagamentoAberto(false);
            carregarPedidos();
        } catch (error) {
            // EXIBE A MENSAGEM DE ERRO REAL DO BACKEND (Ex: Estoque insuficiente)
            const msgErro = error.response?.data?.message || error.message;
            alert("ERRO NO PAGAMENTO: " + msgErro);
        }
    };

    if (loadingCaixa) return <div className="h-screen bg-slate-100 flex items-center justify-center font-black text-slate-400 animate-pulse">VALIDANDO ESTADO DO CAIXA...</div>;

    if (caixaStatus === 'FECHADO') {
        return (
            <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-2xl border border-red-100 text-center max-w-md animate-fade-in">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">CAIXA BLOQUEADO</h1>
                    <p className="text-slate-500 mb-8 font-medium">Você não pode receber pagamentos enquanto o caixa estiver fechado. Abra o caixa para liberar o terminal.</p>

                    <button
                        onClick={() => setPaginaAtiva('caixa')}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all mb-4"
                    >
                        <Wallet size={20} /> IR PARA CONTROLE DE CAIXA
                    </button>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">GrandPort ERP Security</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-8 max-w-7xl mx-auto flex h-[90vh] gap-6 animate-fade-in relative print:hidden">
                <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-6 bg-slate-900 text-white">
                        <h2 className="text-xl font-black flex items-center gap-2 mb-4">
                            <Clock className="text-blue-400" /> AGUARDANDO CAIXA
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text" placeholder="Buscar N.º Pedido ou Cliente..." value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-sm font-bold placeholder-slate-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50">
                        {pedidosFiltrados.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 font-bold">
                                <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-500" />
                                A fila está vazia.
                            </div>
                        ) : (
                            pedidosFiltrados.map(pedido => (
                                <div
                                    key={pedido.id} onClick={() => setPedidoSelecionado(pedido)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${pedidoSelecionado?.id === pedido.id ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">#{pedido.id}</span>
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${Math.floor((new Date() - pedido.horaEnvio) / 60000) > 10 ? 'text-red-500' : 'text-slate-500'}`}>
                                            <Clock size={12} /> {calcularTempoEspera(pedido.horaEnvio)}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm mb-1">{pedido.cliente ? pedido.cliente.nome : 'Cliente Avulso'}</p>
                                    <div className="flex justify-between items-end mt-3">
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><User size={12}/> Vend: {pedido.vendedorNome || 'Sistema'}</p>
                                        <p className="font-black text-green-600">R$ {(pedido.valorTotal || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                    {!pedidoSelecionado ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <DollarSign size={64} className="opacity-20 mb-4" />
                            <h2 className="text-2xl font-black text-slate-300">NENHUM PEDIDO SELECIONADO</h2>
                        </div>
                    ) : (
                        <>
                            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800">PEDIDO #{pedidoSelecionado.id}</h2>
                                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-2">
                                        <User size={16} className="text-blue-500" /> {pedidoSelecionado.cliente ? pedidoSelecionado.cliente.nome : 'Cliente Avulso'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total a Receber</p>
                                    <h1 className="text-5xl font-black text-green-500 tracking-tighter">R$ {(pedidoSelecionado.valorTotal || 0).toFixed(2)}</h1>
                                </div>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <h3 className="font-black text-sm text-slate-800 uppercase border-b pb-2 mb-4 flex items-center gap-2">
                                    <Package size={16} /> Conferência de Itens
                                </h3>
                                <table className="w-full text-left">
                                    <thead>
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b">
                                        <th className="pb-2">Cód</th>
                                        <th className="pb-2">Descrição</th>
                                        <th className="pb-2 text-center">Qtd</th>
                                        <th className="pb-2 text-right">Unitário</th>
                                        <th className="pb-2 text-right">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(pedidoSelecionado.itens || []).map((item, index) => {
                                        const preco = item.precoUnitario || item.preco || 0;
                                        const qtd = item.quantidade || item.qtd || 0;
                                        return (
                                            <tr key={index} className="border-b border-slate-50 border-dashed">
                                                <td className="py-3 text-xs font-mono text-slate-500">{item.produto?.sku || 'N/A'}</td>
                                                <td className="py-3 font-bold text-slate-700 text-sm">{item.produto?.nome || 'Produto Removido'}</td>
                                                <td className="py-3 text-center font-bold text-slate-600">{qtd}</td>
                                                <td className="py-3 text-right text-sm text-slate-500">R$ {preco.toFixed(2)}</td>
                                                <td className="py-3 text-right font-black text-slate-700">R$ {(preco * qtd).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-orange-400 text-xs font-bold bg-orange-400/10 px-4 py-2 rounded-lg">
                                    <AlertCircle size={16} /> O caixa não pode alterar os itens.
                                </div>
                                <button 
                                    onClick={() => setModalPagamentoAberto(true)}
                                    className="px-8 py-5 bg-green-500 hover:bg-green-400 text-slate-900 font-black text-lg rounded-xl flex items-center gap-3 shadow-lg transition-all transform hover:scale-105"
                                >
                                    <DollarSign size={24} /> INICIAR RECEBIMENTO
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalPagamentoAberto && (
                <ModalFinalizarVenda 
                    totalVenda={pedidoSelecionado?.valorTotal || 0}
                    clienteSelecionado={pedidoSelecionado?.cliente}
                    onClose={() => setModalPagamentoAberto(false)}
                    onConfirmarVenda={confirmarRecebimento}
                />
            )}

            {pedidoPago && (
                <CupomReciboModal 
                    pedido={pedidoPago}
                    onClose={() => setPedidoPago(null)}
                />
            )}
        </>
    );
};
