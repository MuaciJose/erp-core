import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Clock, User, FileText, CheckCircle, DollarSign,
    Package, AlertCircle, Lock, Undo, X, Receipt, Loader2,
    CreditCard, Banknote, QrCode, Trash2, FileSignature, Printer
} from 'lucide-react';
import { CupomReciboModal } from './CupomReciboModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const FilaPedidosCaixa = ({ setPaginaAtiva }) => {
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState('');
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

    const [indexFocadoFila, setIndexFocadoFila] = useState(-1);
    const [modoRecebimento, setModoRecebimento] = useState(false);

    const buscaInputRef = useRef(null);
    const valorRecebidoRef = useRef(null);

    // 🚀 ESTADOS DO PAGAMENTO MÚLTIPLO (SPLIT)
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [valorRecebidoInput, setValorRecebidoInput] = useState('');
    const [numeroParcelas, setNumeroParcelas] = useState(1);
    const [pagamentosAdicionados, setPagamentosAdicionados] = useState([]);
    const [cpfAvulso, setCpfAvulso] = useState('');
    const [processandoPagamento, setProcessandoPagamento] = useState(false);

    // ESTADOS GERAIS
    const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false);
    const [pedidoPago, setPedidoPago] = useState(null);
    const [caixaStatus, setCaixaStatus] = useState(null);
    const [loadingCaixa, setLoadingCaixa] = useState(true);
    const [processandoNfce, setProcessandoNfce] = useState(false);

    // =======================================================================
    // 🚀 CORREÇÃO DO STATUS: Verifica se o Java devolveu CONCLUIDA
    // =======================================================================
    const isPago = pedidoSelecionado?.status === 'CONCLUIDA' || pedidoSelecionado?.status === 'PAGA';

    // =======================================================================
    // MÁSCARAS E CALCULADORA DE MÚLTIPLOS PAGAMENTOS
    // =======================================================================
    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleMudancaValorRecebido = (valorDigitado) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setValorRecebidoInput(valorRealFloat > 0 ? valorRealFloat.toString() : '');
    };

    const valorCobrado = pedidoSelecionado?.valorTotal || 0;
    const totalJaPago = pagamentosAdicionados.reduce((acc, p) => acc + p.valor, 0);
    const valorRestante = Math.max(0, valorCobrado - totalJaPago);

    const valorDigitadoAtual = parseFloat(valorRecebidoInput) || 0;
    const troco = Math.max(0, (totalJaPago + valorDigitadoAtual) - valorCobrado);
    const faltaPagarTotal = (totalJaPago + valorDigitadoAtual) < valorCobrado;

    // =======================================================================
    // LÓGICA DE DADOS
    // =======================================================================
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

    const carregarPedidos = async (silencioso = false) => {
        try {
            const res = await api.get('/api/vendas/fila-caixa');
            if (Array.isArray(res.data)) {
                const pedidosComHora = res.data.map(p => ({ ...p, horaEnvio: p.dataHora ? new Date(p.dataHora) : new Date() }));
                pedidosComHora.sort((a, b) => a.horaEnvio - b.horaEnvio);
                setPedidos(pedidosComHora);
            } else {
                setPedidos([]);
            }
        } catch (error) {
            setPedidos([]);
        }
    };

    useEffect(() => {
        verificarCaixa();
        carregarPedidos();
        const intervalId = setInterval(() => {
            if(caixaStatus !== 'FECHADO' && !modoRecebimento && !modalDevolucaoAberto && !pedidoPago) {
                carregarPedidos(true);
            }
        }, 10000);
        return () => clearInterval(intervalId);
    }, [caixaStatus, modoRecebimento, modalDevolucaoAberto, pedidoPago]);

    const pedidosFiltrados = pedidos.filter(p =>
        p?.id?.toString().includes(busca) ||
        (p?.cliente && p?.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()))
    );

    const abrirPagamentoDireto = (pedido) => {
        setPedidoSelecionado(pedido);
        setModoRecebimento(true);
        setMetodoPagamento('DINHEIRO');
        setNumeroParcelas(1);
        setPagamentosAdicionados([]);
        setValorRecebidoInput((pedido.valorTotal || 0).toString());
        setCpfAvulso('');
        buscaInputRef.current?.blur();

        setTimeout(() => {
            valorRecebidoRef.current?.focus();
            valorRecebidoRef.current?.select();
        }, 100);
    };

    const selecionarPedido = (pedido) => {
        setPedidoSelecionado(pedido);
        setModoRecebimento(false);
        setCpfAvulso('');
        setPagamentosAdicionados([]);
        buscaInputRef.current?.blur();
    };

    // =======================================================================
    // 🚀 MÁQUINA DE ESTADOS E ATALHOS INTELIGENTES
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (pedidoPago || modalDevolucaoAberto) {
                if (e.key === 'Escape' && modalDevolucaoAberto) setModalDevolucaoAberto(false);
                return;
            }

            if (modoRecebimento) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setModoRecebimento(false);
                }
                else if (e.key === 'Enter' && document.activeElement.tagName !== 'SELECT') {
                    e.preventDefault();
                    adicionarPagamentoEVerificar();
                }
                else if (!e.altKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
                    const key = e.key.toLowerCase();
                    if (key === 'd') { setMetodoPagamento('DINHEIRO'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }
                    if (key === 'p') { setMetodoPagamento('PIX'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }
                    if (key === 'c') { setMetodoPagamento('CARTAO_CREDITO'); valorRecebidoRef.current?.focus(); }
                    if (key === 'b') { setMetodoPagamento('CARTAO_DEBITO'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }
                    if (key === 'a') { setMetodoPagamento('A_PRAZO'); valorRecebidoRef.current?.focus(); }
                }
                return;
            }

            // 🚀 ATALHOS QUANDO O PEDIDO ESTÁ PAGO (TELA DE SUCESSO)
            if (isPago) {
                if (e.key === 'F10') {
                    e.preventDefault();
                    setPedidoPago(pedidoSelecionado);
                } else if (e.key === 'F12') {
                    e.preventDefault();
                    if(!processandoNfce) emitirCupomFiscal();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setPedidoSelecionado(null);
                    setBusca('');
                }
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setIndexFocadoFila(prev => Math.min(pedidosFiltrados.length - 1, prev + 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setIndexFocadoFila(prev => Math.max(0, prev - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (document.activeElement === buscaInputRef.current) {
                        if (pedidosFiltrados.length === 1) {
                            abrirPagamentoDireto(pedidosFiltrados[0]);
                        } else if (indexFocadoFila >= 0 && pedidosFiltrados[indexFocadoFila]) {
                            abrirPagamentoDireto(pedidosFiltrados[indexFocadoFila]);
                        } else if (pedidosFiltrados.length > 0) {
                            setIndexFocadoFila(0);
                        }
                    } else {
                        if (!pedidoSelecionado && indexFocadoFila >= 0) {
                            selecionarPedido(pedidosFiltrados[indexFocadoFila]);
                        } else if (pedidoSelecionado && !isPago) {
                            abrirPagamentoDireto(pedidoSelecionado);
                        }
                    }
                    break;
                case 'F2':
                    e.preventDefault();
                    buscaInputRef.current?.focus();
                    break;
                case 'F8':
                    e.preventDefault();
                    if (pedidoSelecionado && !isPago) setModalDevolucaoAberto(true);
                    break;
                case 'F12':
                case 'F10':
                    e.preventDefault();
                    if (pedidoSelecionado && !isPago) abrirPagamentoDireto(pedidoSelecionado);
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (document.activeElement === buscaInputRef.current) {
                        buscaInputRef.current.blur();
                        setBusca('');
                    } else if (pedidoSelecionado) {
                        setPedidoSelecionado(null);
                        setIndexFocadoFila(-1);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const getTempoEsperaBadge = (horaEnvio) => {
        const diffMinutos = Math.floor((new Date() - horaEnvio) / 60000);
        if (diffMinutos <= 0) return <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded uppercase">Agora mesmo</span>;
        let cor = 'bg-slate-100 text-slate-600';
        if (diffMinutos > 5 && diffMinutos <= 10) cor = 'bg-orange-100 text-orange-700';
        if (diffMinutos > 10) cor = 'bg-red-100 text-red-700 animate-pulse';
        return <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${cor}`}><Clock size={10} className="inline mr-1 -mt-0.5"/> Há {diffMinutos} min</span>;
    };

    // =======================================================================
    // LÓGICA DE CASCATA COM PROMISSÓRIA E PARCELAS
    // =======================================================================
    const adicionarPagamentoEVerificar = async () => {
        if (valorDigitadoAtual <= 0 && faltaPagarTotal) return toast.error("Digite um valor válido.");

        if (metodoPagamento === 'A_PRAZO' && !pedidoSelecionado.cliente) {
            return toast.error("Venda Promissória (A Prazo) exige um cliente cadastrado no pedido!", { duration: 4000 });
        }

        let novosPagamentos = [...pagamentosAdicionados];

        if (valorDigitadoAtual > 0) {
            let valorRealAdicionar = valorDigitadoAtual;
            if (metodoPagamento !== 'DINHEIRO' && valorDigitadoAtual > valorRestante) {
                valorRealAdicionar = valorRestante;
                toast.success(`Pagamento ajustado para o valor exato (R$ ${valorRestante.toFixed(2)})`);
            }

            let nomeAmigavel = metodoPagamento.replace('_', ' ');
            if (metodoPagamento === 'A_PRAZO') nomeAmigavel = `PROMISSÓRIA (${numeroParcelas}x)`;
            if (metodoPagamento === 'CARTAO_CREDITO') nomeAmigavel = `CRÉDITO (${numeroParcelas}x)`;

            novosPagamentos.push({
                metodo: metodoPagamento,
                valor: valorRealAdicionar,
                parcelas: (metodoPagamento === 'A_PRAZO' || metodoPagamento === 'CARTAO_CREDITO') ? numeroParcelas : 1,
                nomeAmigavel: nomeAmigavel
            });

            setPagamentosAdicionados(novosPagamentos);
        }

        const somaAtualizada = novosPagamentos.reduce((acc, p) => acc + p.valor, 0);

        if (somaAtualizada >= valorCobrado) {
            confirmarRecebimentoFinal(novosPagamentos);
        } else {
            const novoRestante = valorCobrado - somaAtualizada;
            setValorRecebidoInput(novoRestante.toFixed(2));
            setNumeroParcelas(1);
            valorRecebidoRef.current?.focus();
            valorRecebidoRef.current?.select();
        }
    };

    const removerPagamento = (index) => {
        const novaLista = [...pagamentosAdicionados];
        novaLista.splice(index, 1);
        setPagamentosAdicionados(novaLista);

        const novaSoma = novaLista.reduce((acc, p) => acc + p.valor, 0);
        setValorRecebidoInput((valorCobrado - novaSoma).toFixed(2));
    };

    const confirmarRecebimentoFinal = async (listaPagamentos) => {
        setProcessandoPagamento(true);
        const idVendaToast = toast.loading("Finalizando no Caixa...");
        try {
            const payload = listaPagamentos.map(pag => ({
                metodo: pag.metodo,
                valor: pag.valor,
                parcelas: pag.parcelas || 1,
                cpfConsumidorFinal: cpfAvulso
            }));

            // O Java processa a venda e devolve a venda atualizada com status CONCLUIDA
            const response = await api.post(`/api/vendas/${pedidoSelecionado.id}/pagar`, payload);

            toast.success('Caixa Recebido com Sucesso!', { id: idVendaToast });

            // Atualiza o pedido selecionado com os dados que voltaram do banco
            setPedidoSelecionado(response.data);
            setModoRecebimento(false);
            setBusca('');

            // Atualiza a fila oculta atrás da tela
            carregarPedidos(true);
        } catch (error) {
            toast.error(`Falha: ${error.response?.data?.message || error.message}`, { id: idVendaToast });
        } finally {
            setProcessandoPagamento(false);
        }
    };

    const emitirCupomFiscal = async () => {
        setProcessandoNfce(true);
        const loadId = toast.loading('Transmitindo para a SEFAZ...');
        try {
            const res = await api.post(`/api/fiscal/emitir/${pedidoSelecionado.id}`);
            const nfeId = res.data.id || res.data.notaFiscal?.id;
            if (!nfeId) throw new Error("ID fiscal não encontrado.");

            toast.success('Cupom Autorizado!', { id: loadId });
            const resPdf = await api.get(`/api/fiscal/${nfeId}/danfe`, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([resPdf.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');

            // Depois de emitir a nota fiscal oficial, podemos limpar a tela se desejar:
            setPedidoSelecionado(null);
            carregarPedidos(true);
        } catch (error) {
            toast.error(error.response?.data?.mensagem || error.message, { id: loadId, duration: 5000 });
        } finally {
            setProcessandoNfce(false);
        }
    };

    const confirmarDevolucaoAoVendedor = async () => {
        const idToast = toast.loading("Devolvendo pedido...");
        try {
            await api.post(`/api/vendas/${pedidoSelecionado.id}/devolver`);
            toast.success('Pedido retornado para a área de vendas!', { id: idToast });
            setPedidoSelecionado(null);
            setModalDevolucaoAberto(false);
            setBusca('');
            carregarPedidos(true);
        } catch (error) {
            toast.error("Erro ao devolver.", { id: idToast });
        }
    };

    if (loadingCaixa) return <div className="h-screen bg-slate-100 flex items-center justify-center font-black text-slate-400"><Loader2 className="animate-spin mr-2"/> VERIFICANDO GAVETA...</div>;

    if (caixaStatus === 'FECHADO') {
        return (
            <div className="h-screen bg-slate-100 flex items-center justify-center p-4 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-2xl border-t-8 border-red-500">
                    <Lock size={64} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-black mb-2">CAIXA FECHADO</h1>
                    <p className="text-slate-500 font-medium mb-8">Você precisa abrir o turno para receber pagamentos.</p>
                    <button onClick={() => setPaginaAtiva('caixa')} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-colors shadow-lg">ABRIR GAVETA DO CAIXA</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-8 max-w-7xl mx-auto h-[90vh] flex gap-6 animate-fade-in">
                {/* FILA LATERAL */}
                <div className="w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                    <div className="p-6 bg-slate-900 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black flex items-center gap-2"><Clock className="text-blue-400" /> FILA DO CAIXA</h2>
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold">{pedidos.length} PENDENTES</span>
                        </div>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input
                                ref={buscaInputRef}
                                type="text"
                                placeholder="Buscar pedido (F2)..."
                                value={busca}
                                onChange={(e) => { setBusca(e.target.value); setIndexFocadoFila(-1); }}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800 rounded-xl outline-none text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 relative">
                        {pedidosFiltrados.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-bold text-sm">
                                <CheckCircle size={32} className="mb-2 opacity-50"/> Fila Limpa!
                            </div>
                        )}
                        {pedidosFiltrados.map((pedido, idx) => (
                            <div
                                key={pedido.id}
                                onClick={() => selecionarPedido(pedido)}
                                onMouseEnter={() => setIndexFocadoFila(idx)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all transform ${pedidoSelecionado?.id === pedido.id || indexFocadoFila === idx ? 'bg-blue-50 border-blue-500 scale-[1.02] shadow-md z-10 relative' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-slate-800 text-sm truncate pr-2">#{pedido.id} - {pedido.cliente?.nome || 'Consumidor'}</p>
                                    <p className="font-black text-green-600 text-lg leading-none">R$ {(pedido.valorTotal || 0).toFixed(2)}</p>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    {getTempoEsperaBadge(pedido.horaEnvio)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ÁREA DIREITA */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                    {!pedidoSelecionado ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <DollarSign size={64} className="opacity-20 mb-4" />
                            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400">Pressione <span className="text-blue-400">&darr;</span> para selecionar</h2>
                        </div>
                    ) : (
                        <>
                            {/* CABEÇALHO DO PEDIDO */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center relative z-10">
                                <button onClick={() => selecionarPedido(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors" title="Fechar (Esc)"><X size={24}/></button>
                                <div>
                                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Pedido</p>
                                    <h2 className="text-4xl font-black text-slate-800">#{pedidoSelecionado.id}</h2>
                                    <p className="text-slate-500 font-bold mt-1 flex items-center gap-1"><User size={16}/> {pedidoSelecionado.cliente?.nome || 'Consumidor Final'}</p>
                                </div>
                                <div className="text-right bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isPago ? 'Valor Pago' : 'Total a Pagar'}</p>
                                    <h1 className="text-5xl font-black text-green-500 tracking-tighter leading-none">R$ {valorCobrado.toFixed(2)}</h1>
                                </div>
                            </div>

                            {/* 🚀 DETALHES OU PAGAMENTO SPLIT */}
                            {!modoRecebimento ? (
                                <>
                                    <div className="flex-1 p-8 overflow-y-auto bg-white">
                                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">Itens da Venda</h3>
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50">
                                            <tr className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-y border-slate-200">
                                                <th className="p-3">Produto</th>
                                                <th className="p-3 text-center w-24">Qtd</th>
                                                <th className="p-3 text-right w-32">Total</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                            {pedidoSelecionado.itens?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 font-bold text-slate-700">{item.produto?.nome}</td>
                                                    <td className="p-3 text-center font-bold text-slate-500">{item.quantidade}</td>
                                                    <td className="p-3 text-right font-black text-slate-800">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 🚀 BOTÕES DE AÇÃO: ALTERNA BASEADO NO STATUS */}
                                    <div className="p-6 bg-slate-900 border-t-4 border-blue-500 flex gap-4">
                                        {!isPago ? (
                                            <>
                                                <button onClick={() => setModalDevolucaoAberto(true)} title="Devolver pedido (F8)" className="px-6 py-5 bg-slate-800 text-red-400 font-bold rounded-xl hover:bg-red-950 transition-colors flex items-center gap-2">
                                                    <Undo size={20}/> DEVOLVER (F8)
                                                </button>
                                                <button onClick={() => abrirPagamentoDireto(pedidoSelecionado)} title="Avançar para pagamento (Enter / F12)" className="flex-1 py-5 bg-green-500 hover:bg-green-400 text-slate-900 font-black text-lg rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                                    <DollarSign size={24}/> CAIXA: RECEBER (Enter)
                                                </button>
                                            </>
                                        ) : (
                                            // 🚀 NOVOS BOTÕES APÓS O PAGAMENTO (SUCESSO)
                                            <div className="flex w-full gap-4 animate-fade-in">
                                                <button
                                                    onClick={() => setPedidoPago(pedidoSelecionado)}
                                                    className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 transition-transform transform hover:-translate-y-1 shadow-lg"
                                                >
                                                    <Printer size={24} /> IMPRIMIR RECIBO (F10)
                                                </button>
                                                <button
                                                    onClick={emitirCupomFiscal}
                                                    disabled={processandoNfce}
                                                    className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg rounded-xl flex items-center justify-center gap-3 transition-transform transform hover:-translate-y-1 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                                                >
                                                    {processandoNfce ? <Loader2 size={24} className="animate-spin" /> : <Receipt size={24} />} EMITIR NFC-e (F12)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col bg-slate-50 animate-fade-in border-t border-slate-200">

                                    {/* 🚀 BOTÕES DE MÉTODOS DE PAGAMENTO */}
                                    <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-5 gap-2">
                                        <button onClick={() => { setMetodoPagamento('DINHEIRO'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${metodoPagamento === 'DINHEIRO' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <Banknote size={20} /><span className="font-black text-[10px]">DINHEIRO (D)</span>
                                        </button>
                                        <button onClick={() => { setMetodoPagamento('PIX'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${metodoPagamento === 'PIX' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <QrCode size={20} /><span className="font-black text-[10px]">PIX (P)</span>
                                        </button>
                                        <button onClick={() => { setMetodoPagamento('CARTAO_CREDITO'); valorRecebidoRef.current?.focus(); }} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${metodoPagamento === 'CARTAO_CREDITO' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <CreditCard size={20} /><span className="font-black text-[10px]">CRÉDITO (C)</span>
                                        </button>
                                        <button onClick={() => { setMetodoPagamento('CARTAO_DEBITO'); setNumeroParcelas(1); valorRecebidoRef.current?.focus(); }} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${metodoPagamento === 'CARTAO_DEBITO' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <CreditCard size={20} /><span className="font-black text-[10px]">DÉBITO (B)</span>
                                        </button>
                                        <button onClick={() => { setMetodoPagamento('A_PRAZO'); valorRecebidoRef.current?.focus(); }} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${metodoPagamento === 'A_PRAZO' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <FileSignature size={20} /><span className="font-black text-[10px]">PROMISSÓRIA (A)</span>
                                        </button>
                                    </div>

                                    <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-y-auto">
                                        <div className="space-y-4">
                                            {/* ENTRADA DE VALOR */}
                                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="flex justify-between items-end mb-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor do {metodoPagamento.replace('_', ' ')}</label>
                                                    <span className="text-xs font-bold text-blue-500">Pressione ENTER para adicionar</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 p-2 rounded-xl focus-within:border-blue-50 transition-colors">
                                                    <span className="text-lg font-black text-slate-400 pl-2">R$</span>
                                                    <input
                                                        ref={valorRecebidoRef}
                                                        type="text"
                                                        value={formatarMoeda(valorRecebidoInput)}
                                                        onChange={(e) => handleMudancaValorRecebido(e.target.value)}
                                                        className="w-full bg-transparent outline-none text-3xl font-black text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* 🚀 OPÇÕES DE PARCELAMENTO */}
                                            {(metodoPagamento === 'CARTAO_CREDITO' || metodoPagamento === 'A_PRAZO') && (
                                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-200 animate-fade-in">
                                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-2">Dividir em quantas parcelas?</label>
                                                    <select
                                                        value={numeroParcelas}
                                                        onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                                                        className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none font-black text-slate-800 focus:border-orange-500 transition-colors cursor-pointer"
                                                    >
                                                        <option value="1">1x (À Vista)</option>
                                                        <option value="2">2x vezes</option>
                                                        <option value="3">3x vezes</option>
                                                        <option value="4">4x vezes</option>
                                                        <option value="5">5x vezes</option>
                                                        <option value="6">6x vezes</option>
                                                        <option value="7">7x vezes</option>
                                                        <option value="8">8x vezes</option>
                                                        <option value="9">9x vezes</option>
                                                        <option value="10">10x vezes</option>
                                                        <option value="11">11x vezes</option>
                                                        <option value="12">12x vezes</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* CPF OPCIONAL */}
                                            {!pedidoSelecionado.cliente && (
                                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CPF na Nota (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={cpfAvulso}
                                                        onChange={(e) => setCpfAvulso(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none text-sm font-bold tracking-widest focus:border-blue-500"
                                                        placeholder="Apenas números..."
                                                        maxLength="14"
                                                    />
                                                </div>
                                            )}

                                            {/* LISTA DE PAGAMENTOS ADICIONADOS */}
                                            {pagamentosAdicionados.length > 0 && (
                                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Pagamentos Lançados</p>
                                                    <div className="space-y-2">
                                                        {pagamentosAdicionados.map((pag, idx) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                                                                <span className="text-xs font-bold text-slate-600 uppercase">{pag.nomeAmigavel}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-black text-slate-800">R$ {pag.valor.toFixed(2)}</span>
                                                                    <button onClick={() => removerPagamento(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* CAIXA DE TROCO E FINALIZAR */}
                                        <div className="flex flex-col justify-between">
                                            <div className={`p-6 rounded-3xl border-4 text-center transition-colors flex-1 flex flex-col justify-center ${faltaPagarTotal ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-500'}`}>
                                                <p className={`text-sm font-black uppercase tracking-widest mb-1 ${faltaPagarTotal ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {faltaPagarTotal ? 'Falta Pagar' : 'Troco do Cliente'}
                                                </p>
                                                <h1 className={`text-5xl font-black tracking-tighter ${faltaPagarTotal ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    R$ {faltaPagarTotal ? formatarMoeda(valorCobrado - (totalJaPago + valorDigitadoAtual)) : formatarMoeda(troco)}
                                                </h1>
                                            </div>

                                            <div className="space-y-2 mt-4">
                                                <button onClick={() => setModoRecebimento(false)} className="w-full py-3 bg-white text-slate-500 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors">
                                                    VOLTAR (Esc)
                                                </button>
                                                <button
                                                    onClick={adicionarPagamentoEVerificar}
                                                    disabled={processandoPagamento}
                                                    className="w-full py-5 bg-slate-900 hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {processandoPagamento ? <Loader2 size={24} className="animate-spin"/> : <CheckCircle size={24}/>}
                                                    LANÇAR / FINALIZAR (Enter)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Devolução */}
            {modalDevolucaoAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl max-w-sm text-center border-4 border-red-500 shadow-2xl">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4"/>
                        <h2 className="text-2xl font-black mb-2 text-slate-800">Devolver Pedido?</h2>
                        <p className="text-sm font-bold text-slate-500 mb-6">O pedido voltará para o Balcão de Vendas para correção ou exclusão.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setModalDevolucaoAberto(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">CANCELAR (Esc)</button>
                            <button onClick={confirmarDevolucaoAoVendedor} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg">SIM, DEVOLVER</button>
                        </div>
                    </div>
                </div>
            )}

            {pedidoPago && (
                <CupomReciboModal pedido={pedidoPago} onClose={() => setPedidoPago(null)} />
            )}
        </>
    );
};