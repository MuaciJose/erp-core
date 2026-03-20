import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import {
    TrendingDown, Plus, Search, CheckCircle, AlertCircle,
    X, Loader2, CalendarX, ArrowLeft, Filter, Building2, Wallet,
    ChevronLeft, ChevronRight, Save, Calendar, Printer, Lock,
    MessageCircle, Smartphone // 🚀 ÍCONES DO ZAP
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ContasPagar = () => {
    const [contas, setContas] = useState([]);
    const [contasBancarias, setContasBancarias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('TODAS');
    const [tipoDataFiltro, setTipoDataFiltro] = useState('VENCIMENTO');

    const [modoAtual, setModoAtual] = useState('LISTA');
    const [contaSelecionada, setContaSelecionada] = useState(null);
    const [processando, setProcessando] = useState(false);

    const [bancoSelecionadoId, setBancoSelecionadoId] = useState('');

    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoValor, setNovoValor] = useState('0');
    const [novoVencimento, setNovoVencimento] = useState('');
    const [novoFornecedor, setNovoFornecedor] = useState('');

    // 🚀 ESTADOS DO ZAP
    const [modalZap, setModalZap] = useState(false);
    const [telefoneZap, setTelefoneZap] = useState('');
    const [enviandoZap, setEnviandoZap] = useState(false);

    const [indexFocado, setIndexFocado] = useState(-1);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const buscaInputRef = useRef(null);

    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleValorChange = (setter) => (valorDigitado) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setter(valorRealFloat.toString());
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resContas, resBancos] = await Promise.all([
                api.get('/api/financeiro/contas-a-pagar'),
                api.get('/api/financeiro/contas-bancarias')
            ]);

            const listaContas = Array.isArray(resContas.data) ? resContas.data : [];
            const listaBancos = Array.isArray(resBancos.data) ? resBancos.data : [];

            const ordenadas = listaContas.sort((a, b) => {
                const stA = a.status ? a.status.toUpperCase() : '';
                const stB = b.status ? b.status.toUpperCase() : '';
                const aPago = stA.includes('PAG') || stA.includes('LIQUID');
                const bPago = stB.includes('PAG') || stB.includes('LIQUID');

                if (aPago && !bPago) return 1;
                if (!aPago && bPago) return -1;
                return new Date(a.dataVencimento || 0) - new Date(b.dataVencimento || 0);
            });

            setContas(ordenadas);
            setContasBancarias(listaBancos);

            if (listaBancos.length > 0) {
                setBancoSelecionadoId(listaBancos[0].id.toString());
            }
        } catch (error) {
            toast.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(modoAtual === 'LISTA') {
            carregarDados();
            setTimeout(() => buscaInputRef.current?.focus(), 100);
        }
    }, [modoAtual]);

    useEffect(() => {
        setPaginaAtual(1);
        setIndexFocado(-1);
    }, [busca, dataInicio, dataFim, statusFiltro, tipoDataFiltro]);

    const contasFiltradas = contas.filter(c => {
        const fornecedor = c.fornecedorNome || '';
        const descricao = c.descricao || '';
        const idString = c.id ? c.id.toString() : '';
        const termoBusca = busca.toLowerCase();

        const matchBusca = fornecedor.toLowerCase().includes(termoBusca) ||
            descricao.toLowerCase().includes(termoBusca) ||
            idString.includes(termoBusca);

        const dataAlvo = tipoDataFiltro === 'PAGAMENTO' ? c.dataPagamento : c.dataVencimento;
        const dataString = dataAlvo ? String(dataAlvo).substring(0, 10) : '';

        let matchDataInicio = true;
        let matchDataFim = true;

        if (dataInicio) {
            matchDataInicio = dataString ? dataString >= dataInicio : false;
        }
        if (dataFim) {
            matchDataFim = dataString ? dataString <= dataFim : false;
        }

        const st = c.status ? c.status.toUpperCase() : '';
        const estaPaga = st.includes('PAG') || st.includes('LIQUID');

        const matchStatus = statusFiltro === 'TODAS' ? true :
            statusFiltro === 'PAGAS' ? estaPaga : !estaPaga;

        return matchBusca && matchDataInicio && matchDataFim && matchStatus;
    });

    const totalPaginas = Math.ceil(contasFiltradas.length / itensPorPagina) || 1;
    const indexInicialPaginacao = (paginaAtual - 1) * itensPorPagina;
    const contasPaginadas = contasFiltradas.slice(indexInicialPaginacao, indexInicialPaginacao + itensPorPagina);

    const totalAtrasado = contasFiltradas.filter(c => {
        const st = c.status ? c.status.toUpperCase() : '';
        const estaPaga = st.includes('PAG') || st.includes('LIQUID');
        return c.atrasado && !estaPaga;
    }).reduce((acc, c) => acc + c.valor, 0);

    const totalAVencer = contasFiltradas.filter(c => {
        const st = c.status ? c.status.toUpperCase() : '';
        const estaPaga = st.includes('PAG') || st.includes('LIQUID');
        return !c.atrasado && !estaPaga;
    }).reduce((acc, c) => acc + c.valor, 0);

    const hojeIso = new Date().toISOString().split('T')[0];

    const totalPago = contasFiltradas.filter(c => {
        const st = c.status ? c.status.toUpperCase() : '';
        const estaPaga = st.includes('PAG') || st.includes('LIQUID');

        if (!estaPaga) return false;

        if (!dataInicio && !dataFim && tipoDataFiltro !== 'PAGAMENTO') {
            const dataBase = c.dataPagamento ? String(c.dataPagamento).substring(0, 10) : '';
            return dataBase === hojeIso;
        }

        return true;
    }).reduce((acc, c) => acc + c.valor, 0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modoAtual === 'NOVA_DESPESA') {
                if (e.key === 'Escape') voltarParaLista();
                else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!processando) salvarNovaDespesa(); }
                return;
            }
            if (modoAtual === 'BAIXA' && contaSelecionada) {
                if (e.key === 'Escape') voltarParaLista();
                else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!processando) confirmarBaixa(); }
                return;
            }
            if (modoAtual === 'LISTA') {
                const isInputFocused = document.activeElement.tagName === 'INPUT';
                switch (e.key) {
                    case 'ArrowDown': e.preventDefault(); setIndexFocado(prev => Math.min(contasPaginadas.length - 1, prev + 1)); break;
                    case 'ArrowUp': e.preventDefault(); setIndexFocado(prev => Math.max(0, prev - 1)); break;
                    case 'ArrowRight': if (!isInputFocused) { e.preventDefault(); setPaginaAtual(prev => Math.min(totalPaginas, prev + 1)); setIndexFocado(-1); } break;
                    case 'ArrowLeft': if (!isInputFocused) { e.preventDefault(); setPaginaAtual(prev => Math.max(1, prev - 1)); setIndexFocado(-1); } break;
                    case 'F2': e.preventDefault(); buscaInputRef.current?.focus(); break;
                    case 'Escape':
                        if (isInputFocused) { document.activeElement.blur(); setBusca(''); setDataInicio(''); setDataFim(''); setStatusFiltro('TODAS'); setTipoDataFiltro('VENCIMENTO');}
                        else { setIndexFocado(-1); }
                        break;
                    default: break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const iniciarBaixa = (conta) => {
        const st = conta.status ? conta.status.toUpperCase() : '';
        if(st.includes('PAG') || st.includes('LIQUID')) return toast.error("Esta conta já foi paga!");
        setContaSelecionada(conta);
        setModoAtual('BAIXA');
    };
    const abrirNovaDespesa = () => { setNovaDescricao(''); setNovoValor('0'); setNovoVencimento(''); setNovoFornecedor(''); setModoAtual('NOVA_DESPESA'); };
    const voltarParaLista = () => { setContaSelecionada(null); setModoAtual('LISTA'); };

    // 🚀 TÉCNICA DA ABA FANTASMA PRA NÃO BLOQUEAR NO CHROME
    const imprimirRelatorioGeral = async () => {
        const idToast = toast.loading("Gerando relatório de contas a pagar...");

        const novaAba = window.open('', '_blank');
        if (novaAba) {
            novaAba.document.write('<h2 style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #333;">Gerando seu relatório... Aguarde.</h2>');
        } else {
            toast.error("Pop-up bloqueado pelo navegador. Permita pop-ups para imprimir.", { id: idToast });
            return;
        }

        try {
            const queryParams = new URLSearchParams({ busca, dataInicio, dataFim, status: statusFiltro, tipoDataFiltro }).toString();
            const response = await api.get(`/api/financeiro/contas-a-pagar/relatorio-pdf?${queryParams}`, { responseType: 'blob' });

            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            novaAba.location.href = fileURL;
            toast.success("Relatório gerado!", { id: idToast });
        } catch (error) {
            novaAba.close();
            toast.error("Falha ao gerar o PDF.", { id: idToast });
        }
    };

    // 🚀 FUNÇÃO QUE DISPARA O ZAP
    const dispararRelatorioWhatsapp = async () => {
        const numLimpo = telefoneZap.replace(/\D/g, '');
        if (numLimpo.length < 10) return toast.error('Digite um número de WhatsApp válido.');

        setEnviandoZap(true);
        const idToast = toast.loading("Enviando relatório via WhatsApp...");

        try {
            const queryParams = new URLSearchParams({
                busca, dataInicio, dataFim, status: statusFiltro, tipoDataFiltro,
                telefone: numLimpo
            }).toString();

            await api.post(`/api/financeiro/contas-a-pagar/relatorio/whatsapp?${queryParams}`);

            toast.success("Enviado com sucesso!", { id: idToast });
            setModalZap(false);
            setTelefoneZap('');
        } catch (error) {
            toast.error("Falha ao enviar. Verifique a conexão com o WhatsApp.", { id: idToast });
        } finally {
            setEnviandoZap(false);
        }
    };

    const confirmarBaixa = async () => {
        if (!bancoSelecionadoId) return toast.error("Selecione uma conta bancária.");
        setProcessando(true);
        const toastId = toast.loading("Processando liquidação...");

        try {
            await api.patch(`/api/financeiro/contas-a-pagar/${contaSelecionada.id}/liquidar`, {
                contaBancariaId: Number(bancoSelecionadoId)
            });

            toast.success("Conta PAGA com sucesso!", { id: toastId });

            // Aba fantasma do Recibo
            const novaAba = window.open('', '_blank');
            if (novaAba) {
                novaAba.document.write('<h2 style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #333;">Gerando comprovante... Aguarde.</h2>');
            }

            try {
                const resPdf = await api.get(`/api/financeiro/contas-a-pagar/${contaSelecionada.id}/recibo-pdf`, { responseType: 'blob' });
                if(novaAba){
                    const fileURL = URL.createObjectURL(new Blob([resPdf.data], { type: 'application/pdf' }));
                    novaAba.location.href = fileURL;
                }
            } catch (e) {
                if(novaAba) novaAba.close();
                console.log("Erro ao baixar o PDF do recibo");
            }

            setModoAtual('LISTA');
            setBusca('');
            setIndexFocado(-1);
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao registrar pagamento.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const salvarNovaDespesa = async () => {
        const valorNumerico = parseFloat(novoValor);
        if (!novaDescricao) return toast.error("Informe a descrição da despesa.");
        if (valorNumerico <= 0) return toast.error("O valor deve ser maior que zero.");
        if (!novoVencimento) return toast.error("Informe a data de vencimento.");

        setProcessando(true);
        const toastId = toast.loading("Salvando nova despesa...");
        try {
            const payload = { descricao: novaDescricao, valor: valorNumerico, vencimento: novoVencimento, fornecedor: novoFornecedor };
            await api.post('/api/financeiro/contas-pagar/manual', payload);
            toast.success("Despesa cadastrada com sucesso!", { id: toastId });
            setModoAtual('LISTA');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar despesa.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    if (modoAtual === 'LISTA') {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in flex flex-col h-[90vh]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                            <TrendingDown className="text-red-600 bg-red-100 p-2 rounded-xl" size={40} />
                            Contas a Pagar
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Controle de despesas, painel de dívidas e pagamentos.</p>
                    </div>
                    <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                        {/* 🚀 O BOTÃO NOVO DO ZAP */}
                        <button onClick={() => setModalZap(true)} className="w-full md:w-auto bg-green-500 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md shadow-green-500/20">
                            <MessageCircle size={20} /> WHATSAPP
                        </button>
                        <button onClick={imprimirRelatorioGeral} className="w-full md:w-auto bg-white border-2 border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                            <Printer size={20} /> RELATÓRIO
                        </button>
                        <button onClick={abrirNovaDespesa} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                            <Plus size={20} /> DESPESA AVULSA
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-100 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={12}/> Atrasadas (Pendentes)</p>
                            <h2 className="text-2xl font-black text-red-600 mt-1">R$ {formatarMoeda(totalAtrasado)}</h2>
                        </div>
                        <CalendarX className="text-red-200" size={40}/>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-100 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> A Vencer (Pendentes)</p>
                            <h2 className="text-2xl font-black text-amber-600 mt-1">R$ {formatarMoeda(totalAVencer)}</h2>
                        </div>
                        <TrendingDown className="text-amber-200" size={40}/>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-100 flex justify-between items-center shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle size={12}/>
                                {(!dataInicio && !dataFim && tipoDataFiltro !== 'PAGAMENTO') ? 'Pagamentos de Hoje' : 'Contas Pagas (Filtro)'}
                            </p>
                            <h2 className="text-2xl font-black text-emerald-600 mt-1">R$ {formatarMoeda(totalPago)}</h2>
                        </div>
                        <Wallet className="text-emerald-200 absolute -right-2 -bottom-2" size={60}/>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-3 items-center justify-end mb-4">
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto">
                        <Filter size={16} className="text-slate-400" />
                        <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Status</label>
                            <select
                                value={statusFiltro}
                                onChange={(e) => setStatusFiltro(e.target.value)}
                                className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer"
                            >
                                <option value="TODAS">Todas as Contas</option>
                                <option value="PENDENTES">Apenas Pendentes</option>
                                <option value="PAGAS">Apenas Pagas</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto pl-3">
                        <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase text-blue-500">Tipo de Data</label>
                            <select
                                value={tipoDataFiltro}
                                onChange={(e) => setTipoDataFiltro(e.target.value)}
                                className="outline-none text-sm font-black text-blue-700 bg-transparent cursor-pointer"
                            >
                                <option value="VENCIMENTO">Data de Vencimento</option>
                                <option value="PAGAMENTO">Data de Pagamento</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto pl-3">
                        <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Data Início</label>
                            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto">
                        <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Data Fim</label>
                            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer" />
                        </div>
                    </div>
                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input ref={buscaInputRef} type="text" placeholder="Buscar fornecedor/doc (F2)..." className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400"><Loader2 className="animate-spin mb-4 text-blue-500" size={40} /><span className="font-black tracking-widest">CARREGANDO...</span></div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                                    <tr className="text-[10px] text-slate-400 uppercase tracking-widest">
                                        <th className="p-4 font-black">Nº Doc</th>
                                        <th className="p-4 font-black">Fornecedor / Descrição</th>
                                        <th className="p-4 font-black">{tipoDataFiltro === 'PAGAMENTO' ? 'Pagamento' : 'Vencimento'}</th>
                                        <th className="p-4 font-black text-right">Valor (R$)</th>
                                        <th className="p-4 font-black text-center">Ação</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {contasPaginadas.length === 0 ? (
                                        <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold"><CheckCircle size={48} className="mx-auto mb-4 text-emerald-300 opacity-50" />Nenhuma despesa encontrada neste filtro!</td></tr>
                                    ) : (
                                        contasPaginadas.map((conta, idx) => {
                                            const isFocado = indexFocado === idx;
                                            const st = conta.status ? conta.status.toUpperCase() : '';
                                            const estaPaga = st.includes('PAG') || st.includes('LIQUID');

                                            const dataNaTabela = tipoDataFiltro === 'PAGAMENTO' && conta.dataPagamento
                                                ? conta.dataPagamento
                                                : conta.dataVencimento;

                                            return (
                                                <tr key={conta.id} onClick={() => { if(!estaPaga) iniciarBaixa(conta) }} className={`transition-all border-l-4 ${estaPaga ? 'bg-emerald-50/50 opacity-70 border-l-emerald-500' : isFocado ? 'bg-blue-50 border-l-blue-500 shadow-sm relative z-10 cursor-pointer' : 'hover:bg-slate-50 border-l-transparent cursor-pointer'}`}>
                                                    <td className="p-4 font-mono text-xs font-bold text-slate-500">#{conta.id}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2"><Building2 size={14} className={estaPaga ? "text-emerald-500" : "text-slate-400"} /><p className={`font-black text-sm ${estaPaga ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>{conta.fornecedorNome || 'Diversos'}</p></div>
                                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 ml-5">{conta.descricao}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className={`flex items-center gap-2 text-sm font-bold ${estaPaga ? 'text-emerald-600' : conta.atrasado ? 'text-red-600' : 'text-amber-600'}`}>
                                                            {estaPaga ? <CheckCircle size={14}/> : conta.atrasado ? <CalendarX size={14}/> : <Calendar size={14}/>}
                                                            {dataNaTabela ? new Date(dataNaTabela).toLocaleDateString('pt-BR') : '-'}
                                                        </div>
                                                    </td>
                                                    <td className={`p-4 font-black text-right text-lg ${estaPaga ? 'text-emerald-700' : 'text-slate-800'}`}>R$ {formatarMoeda(conta.valor)}</td>
                                                    <td className="p-4 text-center">
                                                        {estaPaga ? (
                                                            <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-black text-[10px] flex items-center justify-center gap-1.5 mx-auto uppercase tracking-widest w-max cursor-default">
                                                                <Lock size={12}/> JÁ PAGO
                                                            </div>
                                                        ) : (
                                                            <button onClick={(e) => { e.stopPropagation(); iniciarBaixa(conta); }} className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 mx-auto transition-colors">
                                                                <CheckCircle size={14}/> LIQUIDAR
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            {contasFiltradas.length > 0 && (
                                <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center z-20">
                                    <span className="text-xs font-bold text-slate-500">Exibindo <span className="text-slate-800">{indexInicialPaginacao + 1}</span> - <span className="text-slate-800">{Math.min(indexInicialPaginacao + itensPorPagina, contasFiltradas.length)}</span> de <span className="text-slate-800">{contasFiltradas.length}</span> despesas</span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                                            <span className="px-4 py-2 font-black text-sm text-slate-700">{paginaAtual} / {totalPaginas}</span>
                                            <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 🚀 MODAL DO WHATSAPP AQUI */}
                {modalZap && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 relative">
                            <button onClick={() => setModalZap(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>

                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
                                <Smartphone size={32} />
                            </div>

                            <h2 className="text-2xl font-black text-center text-slate-800 mb-2">Enviar Relatório</h2>
                            <p className="text-sm text-center text-slate-500 font-medium mb-6">O sistema enviará o PDF atual com base nos filtros da tela.</p>

                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Número do WhatsApp (Com DDD)</label>
                            <input
                                type="text"
                                autoFocus
                                value={telefoneZap}
                                onChange={(e) => setTelefoneZap(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ex: 81999999999"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-green-500 outline-none font-black text-slate-700 text-center text-xl tracking-widest mb-6"
                            />

                            <button
                                onClick={dispararRelatorioWhatsapp}
                                disabled={enviandoZap || telefoneZap.length < 10}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {enviandoZap ? <Loader2 size={24} className="animate-spin"/> : <MessageCircle size={24}/>}
                                {enviandoZap ? 'ENVIANDO...' : 'DISPARAR PDF'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (modoAtual === 'BAIXA') {
        const bancoSelecionadoObj = contasBancarias.find(b => b.id.toString() === bancoSelecionadoId);
        const valorConta = contaSelecionada?.valor || 0;

        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors"><ArrowLeft size={20} /> Voltar para Lista (Esc)</button>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-red-500">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2"><TrendingDown className="text-red-600" size={32} /> Liquidar Despesa</h2>
                        <p className="text-lg font-bold text-slate-600">Fornecedor: <span className="text-red-600">{contaSelecionada.fornecedorNome || 'Diversos'}</span></p>
                        <p className="text-sm font-bold text-slate-400 mt-1">{contaSelecionada.descricao} - Venc: {contaSelecionada.dataVencimento ? new Date(contaSelecionada.dataVencimento).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 p-8 rounded-3xl text-center shadow-inner flex flex-col justify-center">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Valor da Obrigação</p>
                            <h1 className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(valorConta)}</h1>
                        </div>
                        <div className="flex flex-col justify-center">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Wallet size={16}/> Origem do Dinheiro</label>
                            <select value={bancoSelecionadoId} onChange={(e) => setBancoSelecionadoId(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-red-500 outline-none font-black text-slate-700 text-lg transition-colors cursor-pointer">
                                {contasBancarias.length === 0 ? <option value="">Nenhuma conta cadastrada</option> : contasBancarias.map(banco => <option key={banco.id} value={banco.id}>{banco.nome} (Saldo: R$ {formatarMoeda(banco.saldoAtual)})</option>)}
                            </select>
                            {bancoSelecionadoObj && (bancoSelecionadoObj.saldoAtual < valorConta) && <p className="text-xs font-bold text-red-500 mt-3 flex items-center gap-1 bg-red-50 p-2 rounded-lg"><AlertCircle size={14}/> Atenção: O saldo desta conta ficará negativo.</p>}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button onClick={confirmarBaixa} disabled={processando || !bancoSelecionadoId} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none">
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <CheckCircle size={32}/>}
                            CONFIRMAR E IMPRIMIR RECIBO (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (modoAtual === 'NOVA_DESPESA') {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"><ArrowLeft size={20} /> Voltar para Lista (Esc)</button>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-slate-800">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Plus className="text-slate-600" size={32} /> Lançar Despesa Avulsa</h2>
                        <p className="text-sm font-bold text-slate-500 mt-1">Contas de consumo, aluguel, salários ou prestadores de serviço.</p>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descrição / Motivo</label>
                            <input type="text" autoFocus value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700" placeholder="Ex: Conta de Luz - Mês atual" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Fornecedor / Credor</label>
                            <input type="text" value={novoFornecedor} onChange={(e) => setNovoFornecedor(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700" placeholder="Opcional. Ex: Neoenergia" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Vencimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input type="date" value={novoVencimento} onChange={(e) => setNovoVencimento(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-black text-slate-700" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-red-500 uppercase tracking-widest mb-2">Valor da Despesa</label>
                            <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 rounded-xl focus-within:border-red-500 transition-colors">
                                <span className="text-xl font-black text-red-400 pl-2">R$</span>
                                <input type="text" value={formatarMoeda(novoValor)} onChange={(e) => handleValorChange(setNovoValor)(e.target.value)} className="w-full bg-transparent outline-none font-black text-red-700 text-3xl" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button onClick={salvarNovaDespesa} disabled={processando || !novaDescricao || !novoVencimento || parseFloat(novoValor) <= 0} className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black text-lg py-5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {processando ? <Loader2 size={24} className="animate-spin"/> : <Save size={24}/>}
                            SALVAR DESPESA (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};