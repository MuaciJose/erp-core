import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Maximize, Minimize, ShoppingCart, Ban, Lock, Wallet, CheckCircle, Printer, PlusCircle } from 'lucide-react';
import api from '../../api/axios';
import { ModalFinalizarVenda } from './ModalFinalizarVenda';
import { BuscaInteligente } from '../../components/BuscaInteligente';
import { CupomVenda } from './CupomVenda';
import { BarraClientePdv } from '../../components/BarraClientePdv';

// --- 🚀 IMPORTAÇÃO DO TOAST ---
import toast from 'react-hot-toast';

export const Pdv = ({ setPaginaAtiva }) => {
    const [carrinho, setCarrinho] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [vendaFinalizada, setVendaFinalizada] = useState(null);
    const [showModalPerdida, setShowModalPerdida] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [configLoja, setConfigLoja] = useState(null);

    const [caixaStatus, setCaixaStatus] = useState(null);
    const [loadingCaixa, setLoadingCaixa] = useState(true);

    const verificarCaixaEConfig = async () => {
        setLoadingCaixa(true);
        try {
            const resCaixa = await api.get('/api/caixa/atual');
            setCaixaStatus(resCaixa.data.status);

            const resConfig = await api.get('/api/configuracoes');
            setConfigLoja(resConfig.data);
        } catch (err) {
            setCaixaStatus('FECHADO');
            setConfigLoja({
                nomeFantasia: 'GRANDPORT AUTOPEÇAS',
                tamanhoImpressora: '80mm',
                exibirVendedorCupom: true,
                mensagemRodape: 'Obrigado pela preferência!'
            });
        } finally {
            setLoadingCaixa(false);
        }
    };

    useEffect(() => {
        verificarCaixaEConfig();
        const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(`Erro: ${err.message}`));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useHotkeys('f10', (e) => { e.preventDefault(); if (carrinho.length > 0 && !vendaFinalizada) setModalAberto(true); }, { preventDefault: true }, [carrinho, vendaFinalizada]);
    useHotkeys('f9', (e) => { e.preventDefault(); if(!vendaFinalizada) setShowModalPerdida(true); }, { preventDefault: true }, [vendaFinalizada]);

    useHotkeys('esc', (e) => {
        if (vendaFinalizada) {
            setCarrinho([]);
            setClienteSelecionado(null);
            setVendaFinalizada(null);
        } else if (showModalPerdida) {
            setShowModalPerdida(false);
        } else if (modalAberto) {
            setModalAberto(false);
        } else if (carrinho.length > 0) {
            if (window.confirm("Deseja limpar todo o carrinho?")) setCarrinho([]);
        }
    }, { preventDefault: true }, [carrinho, modalAberto, showModalPerdida, vendaFinalizada]);

    const tocarBip = () => {
        try {
            const audioBip = new Audio('/sounds/bip.mp3');
            audioBip.currentTime = 0;
            const playPromise = audioBip.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { });
            }
        } catch (e) {}
    };

    const adicionarAoCarrinho = (produto, qtd = 1) => {
        tocarBip();
        const itemExistente = carrinho.find(item => item.id === produto.id);
        if (itemExistente) {
            setCarrinho(carrinho.map(item => item.id === produto.id ? { ...item, qtd: item.qtd + qtd } : item));
        } else {
            setCarrinho(prev => [...prev, { ...produto, qtd: qtd }]);
        }
        // Feedback ao adicionar item
        toast.success(`${produto.nome} adicionado ao carrinho!`, { position: 'bottom-left' });
    };

    const calcularTotal = () => {
        let total = carrinho.reduce((acc, item) => {
            const precoSeguro = Number(item.precoVenda) || Number(item.preco) || 0;
            const qtdSegura = Number(item.qtd) || 1;
            return acc + (precoSeguro * qtdSegura);
        }, 0);

        if (clienteSelecionado?.percentualDesconto > 0) {
            total = total * (1 - clienteSelecionado.percentualDesconto / 100);
        }
        return isNaN(total) ? 0 : total;
    };

    const formatCurrency = (value) => {
        const valorSeguro = isNaN(Number(value)) ? 0 : Number(value);
        return valorSeguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const finalizarVenda = async (dadosFinalizacao) => {
        const total = calcularTotal();

        // 🎯 Inicia o Toast de carregamento
        const idVendaToast = toast.loading("Processando venda e estoque...");

        const dadosVenda = {
            status: 'CONCLUIDA',
            itens: carrinho.map(item => ({
                produtoId: item.id,
                quantidade: Number(item.qtd) || 1,
                precoUnitario: Number(item.precoVenda) || Number(item.preco) || 0
            })),
            pagamentos: [{ metodo: dadosFinalizacao.metodoPagamento, valor: total }],
            parceiroId: clienteSelecionado ? clienteSelecionado.id : null,
            veiculoId: dadosFinalizacao.veiculoId,
            desconto: clienteSelecionado?.percentualDesconto > 0 ? (carrinho.reduce((acc, item) => acc + ((item.precoVenda || item.preco) * item.qtd), 0) - total) : 0
        };

        try {
            const resVenda = await api.post('/api/vendas/pedido', dadosVenda);
            await api.post(`/api/vendas/${resVenda.data.id}/pagar`, dadosVenda.pagamentos);

            // ✅ Sucesso na Venda
            toast.success("Venda finalizada com sucesso!", { id: idVendaToast });

            if (clienteSelecionado && clienteSelecionado.telefone) {
                api.post(`/api/vendas/${resVenda.data.id}/whatsapp`)
                    .then(() => toast.success("Recibo enviado por WhatsApp!"))
                    .catch((err) => {
                        console.error("Falha no zap:", err);
                        toast.error("Venda salva, mas WhatsApp falhou.");
                    });
            }

            const vendaParaImpressao = {
                id: resVenda.data.id,
                total: total,
                vendedor: 'CAIXA 01',
                cliente: clienteSelecionado,
                dataHora: new Date().toISOString(),
                metodoPagamento: dadosFinalizacao.metodoPagamento
            };

            setVendaFinalizada(vendaParaImpressao);
            setModalAberto(false);

            setTimeout(() => {
                window.print();
            }, 500);

        } catch (err) {
            console.error(err);
            const msgErro = err.response?.data?.message || err.message;
            // ❌ Erro na Venda
            toast.error(`Erro ao finalizar: ${msgErro}`, { id: idVendaToast, duration: 5000 });
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
                    <p className="text-slate-500 mb-8 font-medium">Você não pode realizar vendas enquanto o caixa estiver fechado. Abra o caixa para liberar o terminal.</p>

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

    if (vendaFinalizada) {
        return (
            <>
                <div className="h-screen w-screen bg-green-600 flex flex-col items-center justify-center text-white z-50 fixed inset-0 p-4 print:hidden">
                    <CheckCircle size={100} className="mb-6 text-green-200 animate-bounce" />
                    <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter text-center">VENDA APROVADA!</h1>
                    <p className="text-xl md:text-2xl font-bold text-green-200 mb-12 text-center">
                        Pedido #{vendaFinalizada.id} registrado com sucesso.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6">
                        <button onClick={() => window.print()} className="bg-white text-green-700 px-8 py-5 rounded-2xl font-black text-xl hover:bg-slate-100 shadow-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95">
                            <Printer size={32} /> IMPRIMIR RECIBO
                        </button>
                        <button onClick={() => {
                            setCarrinho([]);
                            setClienteSelecionado(null);
                            setVendaFinalizada(null);
                        }} className="bg-green-800 border-2 border-green-500 text-white px-8 py-5 rounded-2xl font-black text-xl hover:bg-green-900 shadow-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95">
                            <PlusCircle size={32} /> NOVA VENDA (ESC)
                        </button>
                    </div>
                </div>
                <CupomVenda venda={vendaFinalizada} itens={carrinho} config={configLoja} />
            </>
        );
    }

    return (
        <div className={`flex flex-col h-screen bg-slate-100 ${isFullScreen ? 'p-0' : 'p-4'}`}>
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-t-xl shadow-lg print:hidden">
                <div className="flex items-center gap-4">
                    <ShoppingCart className="text-blue-400" size={28} />
                    <h2 className="text-xl font-black tracking-tight">GRANDPORT | PONTO DE VENDA</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 uppercase">Operador</p>
                        <p className="text-sm font-bold">CAIXA 01</p>
                    </div>
                    <button onClick={toggleFullScreen} className="p-2 hover:bg-slate-700 rounded-full transition-colors" title="Alternar Tela Cheia">
                        {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
                </div>
            </div>

            <BarraClientePdv onClienteSelecionado={setClienteSelecionado} />

            <div className="flex-1 bg-white shadow-2xl flex flex-col rounded-b-xl overflow-hidden print:hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200 z-20">
                    <BuscaInteligente onSelect={adicionarAoCarrinho} />
                    <div className="flex justify-between mt-2 text-xs text-slate-500 px-2">
                        <span>[F2] Buscar Peça</span>
                        <span>[F10] Finalizar Venda</span>
                        <span>[F9] Venda Perdida</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 z-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Descrição do Produto</th>
                            <th className="p-4 w-32 text-right">Valor Unit.</th>
                            <th className="p-4 w-24 text-center">Qtd</th>
                            <th className="p-4 w-32 text-right">Total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {carrinho.map((item, index) => {
                            const precoProduto = Number(item.precoVenda) || Number(item.preco) || 0;
                            return (
                                <tr key={index} className="hover:bg-blue-50 transition-colors">
                                    <td className="p-4 text-center text-slate-400 font-mono">{index + 1}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{item.nome}</p>
                                        <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                    </td>
                                    <td className="p-4 text-right font-medium text-slate-600">{formatCurrency(precoProduto)}</td>
                                    <td className="p-4 text-center font-bold text-slate-800 bg-slate-50 rounded-lg mx-2">{item.qtd}</td>
                                    <td className="p-4 text-right font-black text-slate-800">{formatCurrency(precoProduto * item.qtd)}</td>
                                </tr>
                            );
                        })}
                        {carrinho.length === 0 && (
                            <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">Caixa livre. Aguardando próximo cliente...</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-8 items-center">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Itens</p>
                            <p className="text-2xl font-bold">{carrinho.length}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Subtotal</p>
                            <p className="text-2xl font-bold text-slate-200">{formatCurrency(calcularTotal())}</p>
                        </div>
                        <button
                            onClick={() => setShowModalPerdida(true)}
                            className="ml-8 bg-red-600/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-red-600/40"
                        >
                            <Ban size={16} /> Venda Perdida (F9)
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-green-400 text-xs uppercase font-bold mb-1">Total a Pagar</p>
                            <p className="text-5xl font-black tracking-tighter text-white">{formatCurrency(calcularTotal())}</p>
                        </div>
                        <button onClick={() => setModalAberto(true)} disabled={carrinho.length === 0} className="bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-4 rounded-xl font-black text-xl shadow-lg hover:shadow-green-500/20 transition-all transform hover:scale-105 active:scale-95">
                            FINALIZAR<span className="block text-[10px] font-normal opacity-80">TECLA F10</span>
                        </button>
                    </div>
                </div>
            </div>

            {modalAberto && (
                <ModalFinalizarVenda
                    totalVenda={calcularTotal()}
                    clienteSelecionado={clienteSelecionado}
                    onClose={() => setModalAberto(false)}
                    onConfirmarVenda={finalizarVenda}
                />
            )}

            {showModalPerdida && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] print:hidden">
                    <div className="bg-white p-8 rounded-2xl w-[500px] shadow-2xl">
                        <h2 className="text-xl font-black mb-4 text-red-600">Registrar Falta de Peça</h2>
                        <input className="w-full p-3 border rounded-lg mb-4" placeholder="Nome da peça ou Referência..." id="inputPerdida" autoFocus />
                        <div className="flex gap-2">
                            <button onClick={() => setShowModalPerdida(false)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">CANCELAR</button>
                            <button onClick={async () => {
                                const desc = document.getElementById('inputPerdida').value;
                                if (!desc) return toast.error("Descreva a peça!");
                                await api.post('/api/vendas-perdidas', { descricaoPeca: desc });
                                setShowModalPerdida(false);
                                toast.success("Registrado! O gestor será avisado.");
                            }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};