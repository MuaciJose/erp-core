import React, { useState, useEffect } from 'react';
import {
    Search, Clock, User, FileText, CheckCircle, DollarSign,
    Package, AlertCircle, Lock, Wallet, Undo, X, Info, Receipt, Loader2
} from 'lucide-react';
import { ModalFinalizarVenda } from './ModalFinalizarVenda';
import { CupomReciboModal } from './CupomReciboModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const FilaPedidosCaixa = ({ setPaginaAtiva }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState('');
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

    // ESTADOS DE MODAIS
    const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
    const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false);
    const [pedidoPago, setPedidoPago] = useState(null);
    const [cpfConsumidorAberto, setCpfConsumidorAberto] = useState(false);

    // DADOS TEMPORÁRIOS
    const [cpfAvulso, setCpfAvulso] = useState('');
    const [caixaStatus, setCaixaStatus] = useState(null);
    const [loadingCaixa, setLoadingCaixa] = useState(true);
    const [processandoNfce, setProcessandoNfce] = useState(false);

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

    const iniciarPagamento = () => {
        if (!pedidoSelecionado.cliente) {
            setCpfConsumidorAberto(true);
        } else {
            setModalPagamentoAberto(true);
        }
    };

    const confirmarCpfAvulso = () => {
        setCpfConsumidorAberto(false);
        setModalPagamentoAberto(true);
    };

    const confirmarRecebimento = async (dadosPagamento) => {
        const idVendaToast = toast.loading("Confirmando recebimento...");
        try {
            const payload = [{
                metodo: dadosPagamento.metodoPagamento,
                valor: pedidoSelecionado.valorTotal,
                parcelas: 1,
                cpfConsumidorFinal: cpfAvulso
            }];

            await api.post(`/api/vendas/${pedidoSelecionado.id}/pagar`, payload);
            toast.success('Pagamento Aprovado!', { id: idVendaToast });

            setPedidoSelecionado({ ...pedidoSelecionado, status: 'PAGA' });
            setModalPagamentoAberto(false);
            carregarPedidos();
        } catch (error) {
            toast.error(`Falha no Recebimento: ${error.response?.data?.message || error.message}`, { id: idVendaToast });
        }
    };

    const emitirCupomFiscal = async () => {
        setProcessandoNfce(true);
        const loadId = toast.loading('Transmitindo para a SEFAZ...');
        try {
            const res = await api.post(`/api/fiscal/emitir/${pedidoSelecionado.id}`);

            // 🚀 O pulo do gato: Pegamos o nfeId real ou o que vier no objeto
            const nfeId = res.data.id || res.data.notaFiscal?.id;

            if (!nfeId) {
                throw new Error("Nota autorizada, mas o ID interno não foi encontrado.");
            }

            toast.success('Cupom Autorizado!', { id: loadId });

            // 🚀 CHAMADA CORRETA: Chama o ID da nota.
            // O Java vai ver que é modelo 65 e usar o JRXML de Cupom.
            const resPdf = await api.get(`/api/fiscal/${nfeId}/danfe`, {
                responseType: 'blob'
            });

            const fileURL = URL.createObjectURL(new Blob([resPdf.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');

            setPedidoSelecionado(null);
            carregarPedidos();
        } catch (error) {
            console.error("Erro detalhado:", error);
            toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: loadId });
        } finally {
            setProcessandoNfce(false);
        }
    };
    const confirmarDevolucaoAoVendedor = async () => {
        const idDevolucaoToast = toast.loading("Devolvendo pedido...");
        try {
            await api.post(`/api/vendas/${pedidoSelecionado.id}/devolver`);
            toast.success('Pedido retornado!', { id: idDevolucaoToast });
            setPedidoSelecionado(null);
            setModalDevolucaoAberto(false);
            carregarPedidos();
        } catch (error) {
            toast.error("Erro ao devolver.", { id: idDevolucaoToast });
        }
    };

    if (loadingCaixa) return <div className="h-screen bg-slate-100 flex items-center justify-center font-black text-slate-400">VALIDANDO CAIXA...</div>;

    if (caixaStatus === 'FECHADO') {
        return (
            <div className="h-screen bg-slate-100 flex items-center justify-center p-4 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-2xl">
                    <Lock size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black mb-2">CAIXA FECHADO</h1>
                    <button onClick={() => setPaginaAtiva('caixa')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">ABRIR CAIXA</button>
                </div>
            </div>
        );
    }

    const esconderFundo = modalPagamentoAberto || !!pedidoPago || cpfConsumidorAberto;

    return (
        <>
            <div className={`p-8 max-w-7xl mx-auto h-[90vh] flex gap-6 animate-fade-in ${esconderFundo ? 'hidden' : ''}`}>
                {/* FILA LATERAL */}
                <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-6 bg-slate-900 text-white">
                        <h2 className="text-xl font-black flex items-center gap-2 mb-4"><Clock className="text-blue-400" /> FILA DO CAIXA</h2>
                        <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full px-4 py-3 bg-slate-800 rounded-xl outline-none text-sm font-bold text-white" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {pedidosFiltrados.map(pedido => (
                            <div key={pedido.id} onClick={() => { setPedidoSelecionado(pedido); setCpfAvulso(''); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${pedidoSelecionado?.id === pedido.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200'}`}>
                                <p className="font-bold text-slate-800">#{pedido.id} - {pedido.cliente?.nome || 'Consumidor'}</p>
                                <p className="font-black text-green-600">R$ {(pedido.valorTotal || 0).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ÁREA DE DETALHES */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    {!pedidoSelecionado ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><DollarSign size={64} className="opacity-20 mb-4" /><h2 className="text-2xl font-black">SELECIONE UM PEDIDO</h2></div>
                    ) : (
                        <>
                            <div className="p-8 border-b bg-slate-50 flex justify-between">
                                <div><h2 className="text-3xl font-black">PEDIDO #{pedidoSelecionado.id}</h2><p className="text-slate-500">{pedidoSelecionado.cliente?.nome || 'Consumidor Final'}</p></div>
                                <div className="text-right"><p className="text-xs font-black text-slate-400 uppercase">Total</p><h1 className="text-5xl font-black text-green-500">R$ {pedidoSelecionado.valorTotal.toFixed(2)}</h1></div>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className="text-slate-400 uppercase border-b"><th className="pb-2">Produto</th><th className="pb-2 text-right">Qtd</th><th className="pb-2 text-right">Total</th></tr></thead>
                                    <tbody>
                                    {pedidoSelecionado.itens?.map((item, idx) => (
                                        <tr key={idx} className="border-b border-dashed"><td className="py-3 font-bold">{item.produto?.nome}</td><td className="py-3 text-right">{item.quantidade}</td><td className="py-3 text-right font-black">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-slate-900 flex justify-end gap-4">
                                {pedidoSelecionado.status !== 'PAGA' ? (
                                    <>
                                        <button onClick={() => setModalDevolucaoAberto(true)} className="px-6 py-4 bg-slate-800 text-red-400 font-bold rounded-xl border border-slate-700">DEVOLVER</button>
                                        <button onClick={iniciarPagamento} className="px-8 py-4 bg-green-500 text-slate-900 font-black text-lg rounded-xl shadow-lg">RECEBER PAGAMENTO</button>
                                    </>
                                ) : (
                                    <button onClick={emitirCupomFiscal} disabled={processandoNfce} className="w-full py-4 bg-emerald-500 text-slate-900 font-black text-lg rounded-xl flex items-center justify-center gap-3">
                                        {processandoNfce ? <Loader2 size={24} className="animate-spin" /> : <Receipt size={24} />} EMITIR CUPOM FISCAL
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAIS */}
            {cpfConsumidorAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <h2 className="text-xl font-black mb-4">CPF na Nota?</h2>
                        <input type="text" value={cpfAvulso} onChange={(e) => setCpfAvulso(e.target.value.replace(/\D/g, ''))} placeholder="000.000.000-00" className="w-full border-2 p-4 rounded-xl mb-6 text-center text-lg font-bold" />
                        <div className="flex gap-4"><button onClick={() => { setCpfAvulso(''); confirmarCpfAvulso(); }} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">NÃO INFORMAR</button><button onClick={confirmarCpfAvulso} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl">CONTINUAR</button></div>
                    </div>
                </div>
            )}

            {modalPagamentoAberto && (
                <ModalFinalizarVenda totalVenda={pedidoSelecionado?.valorTotal || 0} clienteSelecionado={pedidoSelecionado?.cliente} onClose={() => setModalPagamentoAberto(false)} onConfirmarVenda={confirmarRecebimento} />
            )}

            {modalDevolucaoAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200]">
                    <div className="bg-white p-8 rounded-3xl max-w-sm text-center">
                        <h2 className="text-xl font-black mb-4">Devolver pedido?</h2>
                        <div className="flex gap-4"><button onClick={() => setModalDevolucaoAberto(false)} className="flex-1 py-3 bg-slate-100 rounded-xl">NÃO</button><button onClick={confirmarDevolucaoAoVendedor} className="flex-1 py-3 bg-orange-500 text-white rounded-xl">SIM</button></div>
                    </div>
                </div>
            )}

            {pedidoPago && (
                <CupomReciboModal pedido={pedidoPago} onClose={() => setPedidoPago(null)} />
            )}
        </>
    );
};