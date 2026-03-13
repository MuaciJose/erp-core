import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import {
    DollarSign, Search, CheckCircle, AlertCircle,
    X, Loader2, Banknote, QrCode, CreditCard, CalendarX,
    ArrowLeft, Printer, Calendar, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ContasReceber = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚀 FILTROS E BUSCA
    const [busca, setBusca] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // 🚀 ESTADOS DE FLUXO (Sem Modais)
    const [modoAtual, setModoAtual] = useState('LISTA'); // LISTA, BAIXA ou SUCESSO
    const [contaSelecionada, setContaSelecionada] = useState(null);
    const [processando, setProcessando] = useState(false);
    const [reciboGerado, setReciboGerado] = useState(null);

    // ESTADOS DO PAGAMENTO (BAIXA)
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [valorAcrescimoInput, setValorAcrescimoInput] = useState('0');
    const [valorDescontoInput, setValorDescontoInput] = useState('0');

    // 🚀 ESTADOS DE NAVEGAÇÃO E PAGINAÇÃO
    const [indexFocado, setIndexFocado] = useState(-1);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const buscaInputRef = useRef(null);
    const acrescimoInputRef = useRef(null);

    // =======================================================================
    // MÁSCARAS E CALCULADORA
    // =======================================================================
    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleValorChange = (setter) => (valorDigitado) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setter(valorRealFloat.toString());
    };

    const valorOriginal = contaSelecionada?.valor || 0;
    const acrescimo = parseFloat(valorAcrescimoInput) || 0;
    const desconto = parseFloat(valorDescontoInput) || 0;
    const valorTotalReceber = Math.max(0, valorOriginal + acrescimo - desconto);

    // =======================================================================
    // BUSCA DE DADOS
    // =======================================================================
    const carregarContas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/financeiro/contas-a-receber');
            const ordenadas = res.data.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
            setContas(ordenadas);
        } catch (error) {
            toast.error("Erro ao carregar contas a receber.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(modoAtual === 'LISTA') {
            carregarContas();
            setTimeout(() => buscaInputRef.current?.focus(), 100);
        }
    }, [modoAtual]);

    // =======================================================================
    // 🚀 APLICAÇÃO DOS FILTROS E PAGINAÇÃO
    // =======================================================================
    useEffect(() => {
        setPaginaAtual(1);
        setIndexFocado(-1);
    }, [busca, dataInicio, dataFim]);

    const contasFiltradas = contas.filter(c => {
        // Filtro de Texto
        const matchBusca = c.parceiroNome?.toLowerCase().includes(busca.toLowerCase()) ||
            c.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
            c.id?.toString().includes(busca);

        // Filtro de Data (Corta apenas a parte YYYY-MM-DD para comparar corretamente)
        const dataVenc = c.dataVencimento ? c.dataVencimento.substring(0, 10) : '';
        const matchDataInicio = dataInicio ? dataVenc >= dataInicio : true;
        const matchDataFim = dataFim ? dataVenc <= dataFim : true;

        return matchBusca && matchDataInicio && matchDataFim;
    });

    const totalPaginas = Math.ceil(contasFiltradas.length / itensPorPagina) || 1;
    const indexInicialPaginacao = (paginaAtual - 1) * itensPorPagina;
    const contasPaginadas = contasFiltradas.slice(indexInicialPaginacao, indexInicialPaginacao + itensPorPagina);

    // =======================================================================
    // 🚀 ATALHOS DE TECLADO (MODO NINJA MÁXIMO)
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            // TELA DE SUCESSO
            if (modoAtual === 'SUCESSO') {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    setModoAtual('LISTA');
                } else if (e.key === 'F10') {
                    e.preventDefault();
                    imprimirReciboPagamento();
                }
                return;
            }

            // TELA DE BAIXA
            if (modoAtual === 'BAIXA' && contaSelecionada) {
                if (e.key === 'Escape') {
                    voltarParaLista();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!processando) confirmarBaixa();
                } else if (!e.altKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT') {
                    const key = e.key.toLowerCase();
                    if (key === 'd') setMetodoPagamento('DINHEIRO');
                    if (key === 'p') setMetodoPagamento('PIX');
                    if (key === 'c') setMetodoPagamento('CARTAO_CREDITO');
                    if (key === 'b') setMetodoPagamento('CARTAO_DEBITO');
                }
                return;
            }

            // TELA DA LISTA
            if (modoAtual === 'LISTA') {
                const isInputFocused = document.activeElement.tagName === 'INPUT';

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setIndexFocado(prev => Math.min(contasPaginadas.length - 1, prev + 1));
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        setIndexFocado(prev => Math.max(0, prev - 1));
                        break;
                    case 'ArrowRight': // Muda de página para frente
                        if (!isInputFocused) {
                            e.preventDefault();
                            setPaginaAtual(prev => Math.min(totalPaginas, prev + 1));
                            setIndexFocado(-1);
                        }
                        break;
                    case 'ArrowLeft': // Muda de página para trás
                        if (!isInputFocused) {
                            e.preventDefault();
                            setPaginaAtual(prev => Math.max(1, prev - 1));
                            setIndexFocado(-1);
                        }
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (isInputFocused && document.activeElement === buscaInputRef.current) {
                            if (contasPaginadas.length === 1) {
                                iniciarBaixa(contasPaginadas[0]);
                            } else if (indexFocado >= 0 && contasPaginadas[indexFocado]) {
                                iniciarBaixa(contasPaginadas[indexFocado]);
                            }
                        } else {
                            if (indexFocado >= 0 && contasPaginadas[indexFocado]) {
                                iniciarBaixa(contasPaginadas[indexFocado]);
                            }
                        }
                        break;
                    case 'F2':
                        e.preventDefault();
                        buscaInputRef.current?.focus();
                        break;
                    case 'Escape':
                        if (isInputFocused) {
                            document.activeElement.blur();
                            setBusca('');
                            setDataInicio('');
                            setDataFim('');
                        } else {
                            setIndexFocado(-1);
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // =======================================================================
    // TRANSIÇÕES DE TELA E LÓGICA DE BAIXA
    // =======================================================================
    const iniciarBaixa = (conta) => {
        setContaSelecionada(conta);
        setMetodoPagamento('DINHEIRO');
        setValorAcrescimoInput('0');
        setValorDescontoInput('0');
        setModoAtual('BAIXA');

        setTimeout(() => {
            if (conta.atrasado && acrescimoInputRef.current) {
                acrescimoInputRef.current.focus();
                acrescimoInputRef.current.select();
            }
        }, 100);
    };

    const voltarParaLista = () => {
        setContaSelecionada(null);
        setModoAtual('LISTA');
    };

    const confirmarBaixa = async () => {
        if (valorTotalReceber <= 0) return toast.error("O valor a receber deve ser maior que zero.");

        setProcessando(true);
        const toastId = toast.loading("Processando recebimento...");

        try {
            const payload = {
                valorRecebido: valorTotalReceber,
                metodoPagamento: metodoPagamento
            };

            await api.post(`/api/financeiro/contas-a-receber/${contaSelecionada.id}/baixar`, payload);

            toast.success("Conta baixada com sucesso!", { id: toastId });

            setReciboGerado({
                ...contaSelecionada,
                valorPago: valorTotalReceber,
                dataPagamento: new Date(),
                metodoPago: metodoPagamento
            });

            setModoAtual('SUCESSO');
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao baixar conta.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const imprimirReciboPagamento = () => {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
                <head>
                    <title>Recibo de Pagamento</title>
                    <style>
                        body { font-family: monospace; padding: 20px; font-size: 14px; width: 80mm; margin: 0 auto; color: black; }
                        h2 { text-align: center; border-bottom: 1px dashed black; padding-bottom: 10px; margin-bottom: 10px; font-size: 16px;}
                        .line { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .bold { font-weight: bold; }
                        .total { font-size: 18px; border-top: 1px dashed black; padding-top: 10px; margin-top: 10px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px solid black; padding-top: 5px;}
                        @media print { body { width: 100%; padding: 0; } }
                    </style>
                </head>
                <body>
                    <h2>RECIBO DE PAGAMENTO</h2>
                    <div class="line"><span class="bold">Doc Nº:</span> <span>${reciboGerado.id}</span></div>
                    <div class="line"><span class="bold">Data Pgto:</span> <span>${reciboGerado.dataPagamento.toLocaleString('pt-BR')}</span></div>
                    <div class="line" style="margin-top: 10px;"><span class="bold">Cliente:</span></div>
                    <div class="line" style="margin-bottom: 15px;"><span>${reciboGerado.parceiroNome}</span></div>
                    
                    <div class="line"><span class="bold">Referente a:</span></div>
                    <div class="line" style="margin-bottom: 15px; font-size: 12px;"><span>${reciboGerado.descricao}</span></div>

                    <div class="line"><span>Forma de Pgto:</span> <span class="bold">${reciboGerado.metodoPago}</span></div>
                    
                    <div class="line total">
                        <span class="bold">VALOR RECEBIDO:</span>
                        <span class="bold">R$ ${formatarMoeda(reciboGerado.valorPago)}</span>
                    </div>

                    <div class="footer">
                        Obrigado e volte sempre!<br/>
                        Gestão Financeira
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    // =======================================================================
    // RENDERIZAÇÃO PRINCIPAL
    // =======================================================================
    if (modoAtual === 'LISTA') {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in flex flex-col h-[90vh]">
                {/* CABEÇALHO E FILTROS */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-gray-800">
                            <DollarSign className="text-green-600 bg-green-100 p-2 rounded-xl" size={40} />
                            Contas a Receber
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Navegue pelas contas usando as <strong className="text-slate-700">&uarr; &darr; &larr; &rarr;</strong></p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full md:w-auto">
                            <Filter size={16} className="text-slate-400" />
                            <div className="flex flex-col">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Data Início</label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full md:w-auto">
                            <div className="flex flex-col">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Data Fim</label>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                ref={buscaInputRef}
                                type="text"
                                placeholder="Buscar (F2)..."
                                className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                        {(busca || dataInicio || dataFim) && (
                            <button onClick={() => {setBusca(''); setDataInicio(''); setDataFim('');}} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* TABELA COM PAGINAÇÃO */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                            <Loader2 className="animate-spin mb-4 text-blue-500" size={40} />
                            <span className="font-black tracking-widest">CARREGANDO...</span>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-widest">
                                        <th className="p-4 font-black">Nº Doc</th>
                                        <th className="p-4 font-black">Cliente / Descrição</th>
                                        <th className="p-4 font-black">Vencimento</th>
                                        <th className="p-4 font-black text-right">Valor (R$)</th>
                                        <th className="p-4 font-black text-center">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {contasPaginadas.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                                                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-300 opacity-50" />
                                                Nenhuma conta encontrada com estes filtros.
                                            </td>
                                        </tr>
                                    ) : (
                                        contasPaginadas.map((conta, idx) => {
                                            const isFocado = indexFocado === idx;
                                            return (
                                                <tr
                                                    key={conta.id}
                                                    onClick={() => iniciarBaixa(conta)}
                                                    className={`cursor-pointer transition-all border-l-4 ${isFocado ? 'bg-blue-50 border-l-blue-500 shadow-sm relative z-10' : 'hover:bg-slate-50 border-l-transparent'}`}
                                                >
                                                    <td className="p-4 font-mono text-xs font-bold text-slate-500">#{conta.id}</td>
                                                    <td className="p-4">
                                                        <p className="font-black text-slate-800 text-sm">{conta.parceiroNome}</p>
                                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">{conta.descricao}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className={`flex items-center gap-2 text-sm font-bold ${conta.atrasado ? 'text-red-600' : 'text-slate-600'}`}>
                                                            {conta.atrasado ? <CalendarX size={14}/> : <Calendar size={14} className="text-emerald-500"/>}
                                                            {new Date(conta.dataVencimento).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-black text-slate-800 text-right text-lg">
                                                        {formatarMoeda(conta.valor)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                                conta.atrasado ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                            }`}>
                                                                {conta.atrasado ? 'ATRASADO' : 'PENDENTE'}
                                                            </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {/* CONTROLES DE PAGINAÇÃO */}
                            {contasFiltradas.length > 0 && (
                                <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center z-20">
                                    <span className="text-xs font-bold text-slate-500">
                                        Exibindo <span className="text-slate-800">{indexInicialPaginacao + 1}</span> - <span className="text-slate-800">{Math.min(indexInicialPaginacao + itensPorPagina, contasFiltradas.length)}</span> de <span className="text-slate-800">{contasFiltradas.length}</span> registros
                                    </span>

                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">Use <strong className="text-slate-600 px-1">&larr;</strong> e <strong className="text-slate-600 px-1">&rarr;</strong> para navegar</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                                                disabled={paginaAtual === 1}
                                                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="px-4 py-2 font-black text-sm text-slate-700">
                                                {paginaAtual} / {totalPaginas}
                                            </span>
                                            <button
                                                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                                                disabled={paginaAtual === totalPaginas}
                                                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // TELA 2: BAIXA (Permanece igual, super leve)
    if (modoAtual === 'BAIXA') {
        return (
            <div className="p-8 max-w-5xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Lista (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                <DollarSign className="text-green-600" size={32} /> Liquidar Fatura
                            </h2>
                            <p className="text-lg font-bold text-slate-500 mt-2">Cliente: <span className="text-blue-600">{contaSelecionada.parceiroNome}</span></p>
                            <p className="text-sm font-bold text-slate-400 mt-1">{contaSelecionada.descricao} - Venc: {new Date(contaSelecionada.dataVencimento).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Valor Original</span>
                                <span className="text-3xl font-black text-slate-800">R$ {formatarMoeda(valorOriginal)}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-red-500 uppercase tracking-widest mb-2">
                                    {contaSelecionada.atrasado && <AlertCircle size={16} className="inline mr-1 -mt-1"/>}
                                    Acréscimo (Juros/Multa)
                                </label>
                                <div className={`flex items-center gap-3 border-2 p-3 rounded-2xl focus-within:border-red-500 transition-colors ${contaSelecionada.atrasado ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <span className="text-lg font-black text-red-400 pl-2">+ R$</span>
                                    <input
                                        ref={acrescimoInputRef}
                                        type="text"
                                        value={formatarMoeda(valorAcrescimoInput)}
                                        onChange={(e) => handleValorChange(setValorAcrescimoInput)(e.target.value)}
                                        className="w-full bg-transparent outline-none font-black text-red-700 text-2xl"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-green-600 uppercase tracking-widest mb-2">Desconto Concedido</label>
                                <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 p-3 rounded-2xl focus-within:border-green-500 transition-colors">
                                    <span className="text-lg font-black text-green-400 pl-2">- R$</span>
                                    <input
                                        type="text"
                                        value={formatarMoeda(valorDescontoInput)}
                                        onChange={(e) => handleValorChange(setValorDescontoInput)(e.target.value)}
                                        className="w-full bg-transparent outline-none font-black text-green-700 text-2xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Forma de Pagamento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setMetodoPagamento('DINHEIRO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'DINHEIRO' ? 'border-green-500 bg-green-50 text-green-700 shadow-md transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <Banknote size={28} /><span className="font-black text-xs">DINHEIRO (D)</span>
                                    </button>
                                    <button onClick={() => setMetodoPagamento('PIX')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'PIX' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <QrCode size={28} /><span className="font-black text-xs">PIX (P)</span>
                                    </button>
                                    <button onClick={() => setMetodoPagamento('CARTAO_CREDITO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'CARTAO_CREDITO' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <CreditCard size={28} /><span className="font-black text-xs">CRÉDITO (C)</span>
                                    </button>
                                    <button onClick={() => setMetodoPagamento('CARTAO_DEBITO')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${metodoPagamento === 'CARTAO_DEBITO' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md transform scale-[1.02]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        <CreditCard size={28} /><span className="font-black text-xs">DÉBITO (B)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 bg-slate-900 p-8 rounded-3xl text-center shadow-inner relative overflow-hidden">
                                <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2 relative z-10">Total a Receber</p>
                                <h1 className="text-6xl font-black text-white tracking-tighter relative z-10">R$ {formatarMoeda(valorTotalReceber)}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={confirmarBaixa}
                            disabled={processando || valorTotalReceber <= 0}
                            className="flex-1 bg-green-500 hover:bg-green-400 text-slate-900 font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <CheckCircle size={32}/>}
                            CONFIRMAR RECEBIMENTO (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // TELA 3: SUCESSO
    if (modoAtual === 'SUCESSO') {
        return (
            <div className="p-8 max-w-3xl mx-auto animate-fade-in text-center mt-12">
                <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-green-500 p-12 flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Pagamento Recebido!</h1>
                    <p className="text-slate-500 font-bold mb-8">A dívida foi baixada e o limite do cliente foi restaurado.</p>

                    <div className="bg-slate-50 p-6 rounded-2xl w-full text-left mb-8 border border-slate-200">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Resumo da Operação</p>
                        <h2 className="text-xl font-bold text-slate-800">{reciboGerado?.parceiroNome}</h2>
                        <p className="text-sm font-bold text-blue-600 mb-4">{reciboGerado?.descricao}</p>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                            <span className="font-bold text-slate-500 uppercase">{reciboGerado?.metodoPago}</span>
                            <span className="text-2xl font-black text-green-600">R$ {formatarMoeda(reciboGerado?.valorPago)}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setModoAtual('LISTA')}
                            className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors"
                        >
                            VOLTAR (Enter)
                        </button>
                        <button
                            onClick={imprimirReciboPagamento}
                            className="flex-1 py-5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 shadow-xl transition-all"
                        >
                            <Printer size={24} /> IMPRIMIR RECIBO (F10)
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};