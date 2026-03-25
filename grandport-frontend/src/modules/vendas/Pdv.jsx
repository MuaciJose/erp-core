import React, { useState, useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    Maximize, Minimize, ShoppingCart, Ban, Lock, Wallet,
    CheckCircle, Printer, PlusCircle, Trash2, Plus, Minus,
    ArrowLeft, Keyboard, Receipt, FileText, CreditCard, Banknote, QrCode, Tag, ShieldCheck
} from 'lucide-react';
import api from '../../api/axios';
import { BuscaInteligente } from '../../components/BuscaInteligente';
import { BarraClientePdv } from '../../components/BarraClientePdv';
import toast from 'react-hot-toast';

export const Pdv = ({ setPaginaAtiva }) => {
    // 🚀 ESTADOS DE FLUXO E NAVEGAÇÃO
    const [modoAtual, setModoAtual] = useState('PDV'); // PDV, VENDA_PERDIDA, PAGAMENTO
    const [isFullScreen, setIsFullScreen] = useState(false);

    // 🚀 ESTADOS DO CARRINHO E VENDA
    const [carrinho, setCarrinho] = useState([]);
    const [indexFocado, setIndexFocado] = useState(-1);
    const [vendaFinalizada, setVendaFinalizada] = useState(null);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    const [descVendaPerdida, setDescVendaPerdida] = useState('');

    // 🚀 ESTADOS DE PAGAMENTO E PARCELAS
    const [pagamentosAdicionados, setPagamentosAdicionados] = useState([]);
    const [metodoSelecionado, setMetodoSelecionado] = useState('PIX');
    const [valorInput, setValorInput] = useState('');
    const [parcelasInput, setParcelasInput] = useState(1);
    const inputValorRecebidoRef = useRef(null);
    const inputParcelasRef = useRef(null);

    // 🚀 ESTADOS DO CAIXA E CONFIG
    const [caixaStatus, setCaixaStatus] = useState(null);
    const [loadingCaixa, setLoadingCaixa] = useState(true);
    const [configLoja, setConfigLoja] = useState(null);

    const verificarCaixaEConfig = async () => {
        setLoadingCaixa(true);
        try {
            const resCaixa = await api.get('/api/caixa/atual');
            setCaixaStatus(resCaixa.data.status);
            const resConfig = await api.get('/api/configuracoes');
            setConfigLoja(resConfig.data);
        } catch (err) {
            setCaixaStatus('FECHADO');
            setConfigLoja({ nomeFantasia: 'GRANDPORT AUTOPEÇAS', mensagemRodape: 'Obrigado pela preferência!' });
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

    // =======================================================================
    // 🚀 CÁLCULOS FINANCEIROS
    // =======================================================================
    const subtotalBruto = carrinho.reduce((acc, item) => acc + ((Number(item.precoVenda) || Number(item.preco) || 0) * (Number(item.qtd) || 1)), 0);
    const valorDesconto = clienteSelecionado?.percentualDesconto > 0 ? subtotalBruto * (clienteSelecionado.percentualDesconto / 100) : 0;
    const totalLiquido = subtotalBruto - valorDesconto;

    const totalPago = pagamentosAdicionados.reduce((acc, p) => acc + p.valor, 0);
    const faltaPagar = totalLiquido - totalPago > 0 ? totalLiquido - totalPago : 0;
    const troco = totalPago > totalLiquido ? totalPago - totalLiquido : 0;

    const formatCurrency = (value) => (isNaN(Number(value)) ? 0 : Number(value)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleValorInputChange = (e) => {
        const apenasDigitos = e.target.value.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setValorInput(valorRealFloat.toString());
    };

    // =======================================================================
    // 🚀 AÇÕES DE PAGAMENTO E CARRINHO
    // =======================================================================
    const selecionarPagamento = (metodo) => {
        setMetodoSelecionado(metodo);
        setValorInput(faltaPagar > 0 ? faltaPagar.toString() : '0');
        setParcelasInput(1);
        setTimeout(() => {
            if (metodo === 'CARTAO_CREDITO' || metodo === 'FIADO') {
                inputParcelasRef.current?.focus();
            } else {
                inputValorRecebidoRef.current?.focus();
            }
        }, 50);
    };

    const adicionarPagamentoLinha = () => {
        const valorDigitado = parseFloat(valorInput) || 0;
        if (valorDigitado <= 0) return toast.error("Digite um valor maior que zero.");
        if (faltaPagar <= 0) return toast.error("O valor da compra já foi totalmente atingido.");

        setPagamentosAdicionados([...pagamentosAdicionados, {
            metodo: metodoSelecionado,
            valor: valorDigitado,
            parcelas: parcelasInput
        }]);

        const novoFaltaPagar = faltaPagar - valorDigitado;
        setValorInput(novoFaltaPagar > 0 ? novoFaltaPagar.toString() : '');
        setParcelasInput(1);
    };

    const removerPagamentoLinha = (index) => setPagamentosAdicionados(prev => prev.filter((_, i) => i !== index));

    const abrirPagamento = () => {
        setPagamentosAdicionados([]);
        setMetodoSelecionado('PIX');
        setValorInput(totalLiquido.toString());
        setParcelasInput(1);
        setModoAtual('PAGAMENTO');
        setTimeout(() => inputValorRecebidoRef.current?.focus(), 100);
    };

    const tocarBip = () => { try { new Audio('/sounds/bip.mp3').play().catch(()=>{}); } catch(e){} };

    const adicionarAoCarrinho = (produto, qtd = 1) => {
        tocarBip();
        setCarrinho(prev => {
            const idx = prev.findIndex(item => item.id === produto.id);
            if (idx >= 0) { const novo = [...prev]; novo[idx].qtd += qtd; setIndexFocado(idx); return novo; }
            else { setIndexFocado(prev.length); return [...prev, { ...produto, qtd: qtd }]; }
        });
        toast.success(`${produto.nome} adicionado!`, { position: 'bottom-left' });
    };

    const alterarQuantidade = (index, delta) => setCarrinho(prev => { const novo = [...prev]; if (novo[index].qtd + delta > 0) novo[index].qtd += delta; return novo; });
    const removerDoCarrinho = (index) => setCarrinho(prev => { const novo = prev.filter((_, i) => i !== index); if (novo.length === 0) setIndexFocado(-1); return novo; });

    const abrirVendaPerdida = () => { setDescVendaPerdida(''); setModoAtual('VENDA_PERDIDA'); };
    const voltarParaPdv = () => { setModoAtual('PDV'); setDescVendaPerdida(''); };
    const novaVenda = () => { setCarrinho([]); setClienteSelecionado(null); setVendaFinalizada(null); setIndexFocado(-1); setPagamentosAdicionados([]); setModoAtual('PDV'); };

    // =======================================================================
    // 🚀 HOTKEYS COM ENABLE_ON_FORM_TAGS (Permite usar mesmo dentro do Input)
    // =======================================================================
    const hotkeyConfig = { enableOnFormTags: true, preventDefault: true };

    useHotkeys('f10', (e) => {
        if (carrinho.length > 0 && !vendaFinalizada && modoAtual === 'PDV') abrirPagamento();
        else if (modoAtual === 'PAGAMENTO' && faltaPagar <= 0) processarVenda();
    }, hotkeyConfig, [carrinho, vendaFinalizada, modoAtual, faltaPagar, pagamentosAdicionados]);

    useHotkeys('f9', (e) => { if(!vendaFinalizada && modoAtual === 'PDV') abrirVendaPerdida(); }, hotkeyConfig, [vendaFinalizada, modoAtual]);

    useHotkeys('esc', (e) => {
        if (vendaFinalizada) novaVenda();
        else if (modoAtual === 'VENDA_PERDIDA' || modoAtual === 'PAGAMENTO') voltarParaPdv();
        else if (carrinho.length > 0) { setCarrinho([]); setIndexFocado(-1); toast('Venda cancelada / Carrinho limpo', { icon: '🧹' }); }
    }, hotkeyConfig, [carrinho, modoAtual, vendaFinalizada]);

    useHotkeys('f1', (e) => { if(modoAtual === 'PAGAMENTO') selecionarPagamento('PIX'); }, hotkeyConfig, [modoAtual]);
    useHotkeys('f2', (e) => { if(modoAtual === 'PAGAMENTO') selecionarPagamento('DINHEIRO'); }, hotkeyConfig, [modoAtual]);
    useHotkeys('f3', (e) => { if(modoAtual === 'PAGAMENTO') selecionarPagamento('CARTAO_CREDITO'); }, hotkeyConfig, [modoAtual]);
    useHotkeys('f4', (e) => { if(modoAtual === 'PAGAMENTO') selecionarPagamento('CARTAO_DEBITO'); }, hotkeyConfig, [modoAtual]);
    useHotkeys('f5', (e) => { if(modoAtual === 'PAGAMENTO' && clienteSelecionado) selecionarPagamento('FIADO'); }, hotkeyConfig, [modoAtual, clienteSelecionado]);

    // Atalho ENTER para confirmar a venda se o valor já foi totalmente pago
    useHotkeys('enter', (e) => {
        if (modoAtual === 'PAGAMENTO' && faltaPagar <= 0) {
            e.preventDefault();
            processarVenda();
        }
    }, hotkeyConfig, [modoAtual, faltaPagar]);

    // =======================================================================
    // 🚀 MOTOR DE NAVEGAÇÃO POR SETAS
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (vendaFinalizada) return;
            const isInput = document.activeElement.tagName === 'INPUT';

            if (modoAtual === 'PDV') {
                if (isInput && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === '+' || e.key === '-')) return;
                if (carrinho.length > 0) {
                    switch (e.key) {
                        case 'ArrowDown': e.preventDefault(); setIndexFocado(prev => Math.min(carrinho.length - 1, prev + 1)); break;
                        case 'ArrowUp': e.preventDefault(); setIndexFocado(prev => Math.max(0, prev - 1)); break;
                        case 'Delete': if (!isInput) { e.preventDefault(); if (indexFocado >= 0) removerDoCarrinho(indexFocado); } break;
                        case '+': if (!isInput) { e.preventDefault(); if (indexFocado >= 0) alterarQuantidade(indexFocado, 1); } break;
                        case '-': if (!isInput) { e.preventDefault(); if (indexFocado >= 0) alterarQuantidade(indexFocado, -1); } break;
                        default: break;
                    }
                }
            } else if (modoAtual === 'PAGAMENTO') {
                // Se apertar Seta para CIMA ou Seta para BAIXO, troca a forma de pagamento (F1 a F5 automático)
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault(); // Impede o input number de ficar subindo o valor sozinho
                    const metodos = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'FIADO'];
                    const currentIndex = metodos.indexOf(metodoSelecionado);
                    let nextIndex = e.key === 'ArrowDown' ? (currentIndex + 1) % metodos.length : (currentIndex - 1 + metodos.length) % metodos.length;

                    if (metodos[nextIndex] === 'FIADO' && !clienteSelecionado) {
                        nextIndex = e.key === 'ArrowDown' ? (nextIndex + 1) % metodos.length : (nextIndex - 1 + metodos.length) % metodos.length;
                    }
                    selecionarPagamento(metodos[nextIndex]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [carrinho, indexFocado, modoAtual, vendaFinalizada, metodoSelecionado, clienteSelecionado]);

    // =======================================================================
    // 🚀 FINALIZAÇÃO DE VENDA (COM EXTRATOR DE CLIENTE BLINDADO)
    // =======================================================================
    const processarVenda = async () => {
        if (faltaPagar > 0) return toast.error("A venda ainda não foi totalmente paga!");
        const idVendaToast = toast.loading("Registrando pagamento e baixando estoque...");

        // 🚀 O EXTRATOR BLINDADO: Caça o ID do cliente não importa onde ele esteja escondido
        const idDoClienteExtraido = clienteSelecionado
            ? (clienteSelecionado.id || clienteSelecionado.value || clienteSelecionado.parceiroId || clienteSelecionado)
            : null;

        const dadosVenda = {
            status: 'CONCLUIDA',
            itens: carrinho.map(item => ({ produtoId: item.id, quantidade: Number(item.qtd) || 1, precoUnitario: Number(item.precoVenda) || Number(item.preco) || 0 })),
            pagamentos: pagamentosAdicionados,
            parceiroId: idDoClienteExtraido, // AGORA O NOME DO CLIENTE CHEGA NO BANCO DE DADOS!
            desconto: valorDesconto
        };

        try {
            const resVenda = await api.post('/api/vendas/pedido', dadosVenda);
            await api.post(`/api/vendas/${resVenda.data.id}/pagar`, dadosVenda.pagamentos);

            toast.success("Venda finalizada com sucesso!", { id: idVendaToast });
            if (clienteSelecionado && clienteSelecionado.telefone) {
                api.post(`/api/vendas/${resVenda.data.id}/whatsapp`).catch(() => {});
            }

            setVendaFinalizada({
                id: resVenda.data.id,
                total: totalLiquido,
                desconto: valorDesconto,
                vendedor: 'CAIXA 01',
                cliente: clienteSelecionado,
                dataHora: new Date().toISOString(),
                pagamentosInfo: pagamentosAdicionados,
                troco: troco
            });

        } catch (err) {
            toast.error(`Erro ao finalizar: ${err.response?.data?.message || err.message}`, { id: idVendaToast, duration: 5000 });
        }
    };

    // =======================================================================
    // 🚀 IMPRESSÃO A4 E BOBINA TÉRMICA
    // =======================================================================
    const imprimirDocumentoBackend = async () => {
        if (!vendaFinalizada) return;
        const toastId = toast.loading('Buscando PDF no servidor...');
        try {
            const response = await api.get(`/api/vendas/${vendaFinalizada.id}/imprimir-pdf`, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
            toast.success("Documento gerado!", { id: toastId });
        } catch (error) {
            toast.error("Erro ao gerar PDF.", { id: toastId });
        }
    };

    const imprimirBobinaLocal = () => {
        if (!vendaFinalizada) return;
        const printWindow = window.open('', '_blank');
        const nome = configLoja?.nomeFantasia || 'GRANDPORT AUTOPEÇAS';
        const data = new Date(vendaFinalizada.dataHora).toLocaleString('pt-BR');

        let linhasProd = '';
        carrinho.forEach((item, i) => {
            const prc = Number(item.precoVenda || item.preco);
            const tot = prc * item.qtd;
            linhasProd += `<div style="margin-bottom: 8px; font-size: 11px;"><div style="font-weight: bold;">${String(i+1).padStart(2,'0')} ${item.nome}</div><div style="display: flex; justify-content: space-between; margin-top: 2px;"><span style="width: 40%; font-size: 9px;">${item.sku||''}</span><span style="width: 30%; text-align: center;">${item.qtd} x ${prc.toFixed(2)}</span><span style="width: 30%; text-align: right; font-weight: bold;">${tot.toFixed(2)}</span></div></div>`;
        });

        let linhasPag = '';
        vendaFinalizada.pagamentosInfo.forEach(p => {
            linhasPag += `<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; font-size: 11px;"><span>${p.metodo.replace('_',' ')}</span><span>${formatCurrency(p.valor)}</span></div>`;
        });

        const html = `<!DOCTYPE html><html><head><title>Cupom #${vendaFinalizada.id}</title><style>body{font-family: monospace; width: 80mm; margin:0; padding:4mm;} .divider{border-bottom: 1px dashed #000; margin: 8px 0;}</style></head><body>
            <div style="text-align:center; font-weight:bold; font-size:14px;">${nome}</div>
            <div style="text-align:center; font-weight:bold; font-size:12px;">RECIBO DE VENDA</div>
            <div style="text-align:center; font-size:10px;">*** NAO E DOCUMENTO FISCAL ***</div>
            <div style="text-align:center; font-size:11px; margin-top:5px;">Pedido: #${String(vendaFinalizada.id).padStart(6,'0')}</div>
            <div style="text-align:center; font-size:11px;">${data}</div><div class="divider"></div>
            ${vendaFinalizada.cliente ? `<div style="font-size:11px;">CLI: ${vendaFinalizada.cliente.nome}</div><div class="divider"></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold;"><span>Item</span><span style="text-align:center;">QtdxVl</span><span style="text-align:right;">Total</span></div><div class="divider"></div>
            ${linhasProd}<div class="divider"></div>
            <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold;"><span>TOTAL</span><span>${formatCurrency(vendaFinalizada.total)}</span></div><div class="divider"></div>
            <div style="font-size:11px;"><strong>PAGAMENTOS:</strong><br>${linhasPag} ${vendaFinalizada.troco > 0 ? `<div style="display:flex; justify-content:space-between; margin-top:4px; border-top:1px solid #000;"><span>TROCO</span><span>${formatCurrency(vendaFinalizada.troco)}</span></div>` : ''}</div>
            <div class="divider"></div><div style="text-align:center; font-size:10px;">OBRIGADO PELA PREFERENCIA</div>
        </body></html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    const emitirFiscal = async () => {
        const toastId = toast.loading("Emitindo NFC-e...");
        try {
            const res = await api.post(`/api/fiscal/emitir/${vendaFinalizada.id}`);
            toast.success("NFC-e Autorizada com Sucesso!", { id: toastId });
            if (res.data.urlPdf) window.open(res.data.urlPdf, '_blank');
        } catch (err) {
            toast.error("Erro na SEFAZ: " + (err.response?.data?.message || err.message), { id: toastId, duration: 8000 });
        }
    };

    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================
    if (loadingCaixa) return <div className="h-screen bg-slate-100 flex items-center justify-center font-black text-slate-400 animate-pulse">VALIDANDO ESTADO DO CAIXA...</div>;

    if (caixaStatus === 'FECHADO') {
        return (
            <div className="h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-2xl border border-red-100 text-center max-w-md">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={48} className="text-red-500" /></div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">CAIXA BLOQUEADO</h1>
                    <p className="text-slate-500 mb-8 font-medium">Você não pode realizar vendas enquanto o caixa estiver fechado.</p>
                    <button onClick={() => setPaginaAtiva('caixa')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all mb-4"><Wallet size={20} /> IR PARA CAIXA</button>
                </div>
            </div>
        );
    }

    if (vendaFinalizada) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white z-50 fixed inset-0 p-4 animate-fade-in">
                <CheckCircle size={80} className="mb-4 text-green-400 animate-bounce" />
                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-center">VENDA CONCLUÍDA!</h1>
                <p className="text-lg text-slate-400 mb-8 text-center">Pedido #{vendaFinalizada.id} salvo no sistema.</p>

                {vendaFinalizada.troco > 0 && (
                    <div className="bg-slate-800 text-green-400 px-8 py-4 rounded-3xl mb-8 border border-slate-700 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Entregue de Troco</p>
                        <p className="text-4xl font-black">{formatCurrency(vendaFinalizada.troco)}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-4xl w-full">
                    <button onClick={imprimirBobinaLocal} className="bg-slate-800 border border-slate-700 text-white px-6 py-6 rounded-2xl font-black hover:bg-slate-700 shadow-lg flex flex-col items-center gap-3 transition-transform hover:-translate-y-1">
                        <Receipt size={32} className="text-slate-400" />
                        <span className="text-center">RECIBO GERENCIAL<br/><span className="text-xs text-slate-400 font-normal">Bobina Térmica 80mm</span></span>
                    </button>

                    <button onClick={imprimirDocumentoBackend} className="bg-slate-800 border border-slate-700 text-white px-6 py-6 rounded-2xl font-black hover:bg-blue-600 shadow-lg flex flex-col items-center gap-3 transition-transform hover:-translate-y-1 border-b-4 border-b-blue-500">
                        <FileText size={32} className="text-blue-400" />
                        <span className="text-center">PEDIDO DE VENDA<br/><span className="text-xs text-blue-200 font-normal">Folha A4 (Layout DB)</span></span>
                    </button>

                    <button onClick={emitirFiscal} className="bg-green-600 border-2 border-green-400 text-white px-6 py-6 rounded-2xl font-black hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex flex-col items-center gap-3 transition-transform hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 w-full transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <ShieldCheck size={32} className="text-green-200 relative z-10" />
                        <span className="text-center relative z-10">EMITIR NFC-e<br/><span className="text-xs text-green-200 font-normal">Cupom Fiscal (SEFAZ)</span></span>
                    </button>
                </div>

                <button onClick={novaVenda} className="bg-transparent border-none text-slate-400 hover:text-white px-8 py-3 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-colors">
                    <PlusCircle size={24} /> NOVA VENDA (ESC)
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-screen bg-slate-100 ${isFullScreen ? 'p-0' : 'p-4'}`}>
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-t-xl shadow-lg relative z-20">
                <div className="flex items-center gap-4">
                    <ShoppingCart className="text-blue-400" size={28} />
                    <h2 className="text-xl font-black tracking-tight">GRANDPORT | PONTO DE VENDA</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Operador</p>
                        <p className="text-sm font-bold">CAIXA 01</p>
                    </div>
                    <button onClick={toggleFullScreen} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><Maximize size={24} /></button>
                </div>
            </div>

            <BarraClientePdv onClienteSelecionado={setClienteSelecionado} />

            <div className="flex-1 bg-white shadow-2xl flex flex-col rounded-b-xl overflow-hidden relative z-10">
                {modoAtual === 'PDV' && (
                    <>
                        <div className="p-5 bg-slate-50 border-b border-slate-200 z-20 flex flex-col gap-3">
                            <BuscaInteligente onSelect={adicionarAoCarrinho} />
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                <div className="flex gap-4">
                                    <span><kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">F2</kbd> Buscar</span>
                                    <span><kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">F10</kbd> Pagamento</span>
                                    <span><kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">F9</kbd> Perda</span>
                                </div>
                                {carrinho.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Keyboard size={14} className="text-slate-300"/>
                                        <span><kbd className="bg-white border px-1 rounded shadow-sm">↑</kbd> <kbd className="bg-white border px-1 rounded shadow-sm">↓</kbd> Sel</span>
                                        <span><kbd className="bg-white border px-1 rounded shadow-sm">+</kbd> <kbd className="bg-white border px-1 rounded shadow-sm">-</kbd> Qtd</span>
                                        <span><kbd className="bg-white border px-1 rounded shadow-sm">Del</kbd> Del</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 z-0 bg-slate-50 relative">
                            <table className="w-full text-left bg-white">
                                <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-widest font-black sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-16 text-center">#</th>
                                    <th className="p-4">Descrição do Produto</th>
                                    <th className="p-4 w-32 text-right">Valor Unit.</th>
                                    <th className="p-4 w-36 text-center">Qtd</th>
                                    <th className="p-4 w-32 text-right">Total</th>
                                    <th className="p-4 w-16 text-center"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {carrinho.map((item, index) => {
                                    const prc = Number(item.precoVenda) || Number(item.preco) || 0;
                                    const isFoc = index === indexFocado;
                                    return (
                                        <tr key={index} className={`transition-colors group ${isFoc ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                                            <td className="p-4 text-center text-slate-400 font-mono text-xs">{String(index + 1).padStart(3, '0')}</td>
                                            <td className="p-4"><p className={`font-bold ${isFoc ? 'text-blue-900' : 'text-slate-800'}`}>{item.nome}</p><p className="text-[10px] text-slate-400 font-mono uppercase">{item.sku}</p></td>
                                            <td className="p-4 text-right font-bold text-slate-500">{formatCurrency(prc)}</td>
                                            <td className="p-4 text-center">
                                                <div className={`flex items-center justify-center gap-2 rounded-lg p-1 w-max mx-auto border transition-colors ${isFoc ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60 group-hover:opacity-100'}`}>
                                                    <button onClick={() => alterarQuantidade(index, -1)} className={`p-1 rounded ${isFoc ? 'text-red-500 hover:bg-red-50' : 'hover:bg-white hover:text-red-500'}`}><Minus size={14}/></button>
                                                    <span className={`w-8 text-center font-black ${isFoc ? 'text-blue-700' : 'text-slate-800'}`}>{item.qtd}</span>
                                                    <button onClick={() => alterarQuantidade(index, 1)} className={`p-1 rounded ${isFoc ? 'text-green-600 hover:bg-green-50' : 'hover:bg-white hover:text-green-600'}`}><Plus size={14}/></button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-800 text-lg">{formatCurrency(prc * item.qtd)}</td>
                                            <td className="p-4 text-center"><button onClick={() => removerDoCarrinho(index)} className="p-2 text-slate-300 hover:bg-red-100 hover:text-red-500 rounded-lg"><Trash2 size={18}/></button></td>
                                        </tr>
                                    );
                                })}
                                {carrinho.length === 0 && (
                                    <tr><td colSpan="6" className="p-24 text-center"><ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400 font-bold uppercase tracking-widest">Caixa Livre</p><p className="text-slate-400 text-sm">Passe um produto ou use o campo de busca (F2)</p></td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
                            <div className="flex gap-8 items-center">
                                <div><p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Qtd Itens</p><p className="text-2xl font-bold">{carrinho.length}</p></div>
                                <div><p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Subtotal Bruto</p><p className="text-2xl font-bold text-slate-300">{formatCurrency(subtotalBruto)}</p></div>
                                {valorDesconto > 0 && (
                                    <div className="bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-xl text-red-400">
                                        <p className="text-[10px] uppercase font-black flex items-center gap-1">Desconto (-{clienteSelecionado.percentualDesconto}%)</p>
                                        <p className="text-xl font-bold">- {formatCurrency(valorDesconto)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-6">
                                <button onClick={abrirVendaPerdida} className="bg-slate-800 text-slate-400 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-900 hover:text-red-400"><Ban size={16} /> VENDA PERDIDA (F9)</button>
                                <div className="text-right">
                                    <p className="text-green-400 text-[10px] uppercase font-black tracking-widest mb-1">Total a Receber</p>
                                    <p className="text-5xl font-black tracking-tighter">{formatCurrency(totalLiquido)}</p>
                                </div>
                                <button onClick={abrirPagamento} disabled={carrinho.length === 0} className="bg-green-500 hover:bg-green-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 px-8 py-5 rounded-2xl font-black text-2xl shadow-xl hover:shadow-green-500/20 transition-transform hover:-translate-y-1 flex flex-col items-center">
                                    <span>PAGAR</span><span className="text-[10px] font-black opacity-60 mt-1">F10</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {modoAtual === 'PAGAMENTO' && (
                    <div className="flex-1 bg-slate-50 flex flex-col animate-fade-in relative">
                        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                            <button onClick={voltarParaPdv} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"><ArrowLeft size={20} /> Voltar (Esc)</button>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Wallet className="text-blue-500" /> Caixa / Pagamento</h2>
                            <div className="w-24"></div>
                        </div>

                        <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                            <div className="space-y-6 flex flex-col">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Selecione a Forma (F1 a F5 ou Setas)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => selecionarPagamento('PIX')} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${metodoSelecionado === 'PIX' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        <QrCode size={24} /> <span className="font-black text-sm">PIX (F1)</span>
                                    </button>
                                    <button onClick={() => selecionarPagamento('DINHEIRO')} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${metodoSelecionado === 'DINHEIRO' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        <Banknote size={24} /> <span className="font-black text-sm">DINHEIRO (F2)</span>
                                    </button>
                                    <button onClick={() => selecionarPagamento('CARTAO_CREDITO')} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${metodoSelecionado === 'CARTAO_CREDITO' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        <CreditCard size={24} /> <span className="font-black text-sm">CRÉDITO (F3)</span>
                                    </button>
                                    <button onClick={() => selecionarPagamento('CARTAO_DEBITO')} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${metodoSelecionado === 'CARTAO_DEBITO' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        <CreditCard size={24} /> <span className="font-black text-sm">DÉBITO (F4)</span>
                                    </button>
                                </div>
                                <button onClick={() => selecionarPagamento('FIADO')} disabled={!clienteSelecionado} className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${metodoSelecionado === 'FIADO' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 disabled:opacity-50'}`}>
                                    <Tag size={20} /> <span className="font-black text-sm">A PRAZO / FIADO (F5)</span>
                                </button>

                                <div className="mt-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">2. Valor a Lançar em {metodoSelecionado.replace('_', ' ')}</label>
                                    <div className="flex gap-4">

                                        {(metodoSelecionado === 'CARTAO_CREDITO' || metodoSelecionado === 'FIADO') && (
                                            <div className="w-24 flex items-center gap-2 bg-slate-50 border-2 border-slate-200 p-4 rounded-xl focus-within:border-blue-500 transition-all">
                                                <span className="text-xs font-black text-slate-400">Qtd</span>
                                                <input
                                                    ref={inputParcelasRef}
                                                    type="number"
                                                    min="1" max="12"
                                                    value={parcelasInput}
                                                    onChange={(e) => setParcelasInput(Number(e.target.value))}
                                                    className="w-full bg-transparent outline-none font-black text-slate-800 text-2xl text-center"
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); inputValorRecebidoRef.current?.focus(); } }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 flex items-center gap-3 bg-slate-50 border-2 border-slate-200 p-4 rounded-xl focus-within:border-blue-500">
                                            <span className="text-xl font-black text-slate-400 pl-2">R$</span>
                                            <input
                                                ref={inputValorRecebidoRef}
                                                value={formatCurrency(valorInput).replace('R$', '').trim()}
                                                onChange={handleValorInputChange}
                                                className="w-full bg-transparent outline-none font-black text-slate-800 text-3xl"
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarPagamentoLinha(); } }}
                                            />
                                        </div>
                                        <button onClick={adicionarPagamentoLinha} disabled={faltaPagar <= 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 rounded-xl font-black shadow-md flex flex-col items-center justify-center">
                                            <Plus size={24}/> <span className="text-[10px] mt-1">ENTER</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col h-full">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-6">
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total da Venda</p><h2 className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalLiquido)}</h2></div>
                                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Falta Pagar</p><h2 className={`text-4xl font-black tracking-tighter ${faltaPagar > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(faltaPagar)}</h2></div>
                                </div>

                                <div className="flex-1 overflow-y-auto min-h-[150px]">
                                    {pagamentosAdicionados.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300"><Wallet size={48} className="mb-2 opacity-50"/><p className="font-bold text-sm uppercase">Aguardando Pagamento</p></div>
                                    ) : (
                                        <div className="space-y-2">
                                            {pagamentosAdicionados.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-slate-700">{p.metodo.replace('_', ' ')}</span>
                                                        {(p.metodo === 'CARTAO_CREDITO' || p.metodo === 'FIADO') && p.parcelas > 1 && (
                                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">{p.parcelas}x</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4"><span className="font-black text-xl text-slate-800">{formatCurrency(p.valor)}</span><button onClick={() => removerPagamentoLinha(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18}/></button></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mb-6"><span className="text-xs font-black text-slate-500 uppercase">Troco a Devolver</span><span className={`text-3xl font-black ${troco > 0 ? 'text-red-500' : 'text-slate-400'}`}>{formatCurrency(troco)}</span></div>
                                    <button onClick={processarVenda} disabled={faltaPagar > 0} className="w-full bg-green-500 hover:bg-green-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 py-6 rounded-2xl font-black text-2xl shadow-xl hover:-translate-y-1 flex justify-center items-center gap-3">
                                        {faltaPagar > 0 ? <Lock size={28}/> : <CheckCircle size={28}/>} CONFIRMAR PAGAMENTO (ENTER)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {modoAtual === 'VENDA_PERDIDA' && (
                    <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-8 relative">
                        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
                            <Ban size={64} className="mx-auto text-red-500 mb-4" />
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Registrar Venda Perdida</h2>
                            <p className="text-slate-500 mb-6">Informe o motivo para gerar estatísticas gerenciais.</p>
                            <textarea
                                value={descVendaPerdida}
                                onChange={(e) => setDescVendaPerdida(e.target.value)}
                                className="w-full border-2 border-slate-200 p-4 rounded-xl mb-6 focus:border-red-500 outline-none resize-none h-32"
                                placeholder="Ex: Produto muito caro, não tinha a peça, etc..."
                            />
                            <div className="flex gap-4">
                                <button onClick={voltarParaPdv} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                                <button onClick={() => { toast.success("Venda perdida registrada."); voltarParaPdv(); }} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600">Salvar Registro</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};