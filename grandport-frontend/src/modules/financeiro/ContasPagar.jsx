import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import {
    TrendingDown, Plus, Search, CheckCircle, AlertCircle,
    X, Loader2, CalendarX, ArrowLeft, Filter, Building2, Wallet,
    ChevronLeft, ChevronRight, Save, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ContasPagar = () => {
    // 🚀 ESTADOS DE DADOS
    const [contas, setContas] = useState([]);
    const [contasBancarias, setContasBancarias] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚀 FILTROS E BUSCA
    const [busca, setBusca] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // 🚀 ESTADOS DE FLUXO (Sem Modais!)
    const [modoAtual, setModoAtual] = useState('LISTA'); // LISTA, BAIXA ou NOVA_DESPESA
    const [contaSelecionada, setContaSelecionada] = useState(null);
    const [processando, setProcessando] = useState(false);

    // ESTADO DA BAIXA
    const [bancoSelecionadoId, setBancoSelecionadoId] = useState('');

    // 🚀 ESTADOS DA NOVA DESPESA AVULSA
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoValor, setNovoValor] = useState('0');
    const [novoVencimento, setNovoVencimento] = useState('');
    const [novoFornecedor, setNovoFornecedor] = useState('');

    // 🚀 ESTADOS DE NAVEGAÇÃO E PAGINAÇÃO
    const [indexFocado, setIndexFocado] = useState(-1);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const buscaInputRef = useRef(null);

    // =======================================================================
    // MÁSCARAS
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

    // =======================================================================
    // BUSCA DE DADOS (API)
    // =======================================================================
    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resContas, resBancos] = await Promise.all([
                api.get('/api/financeiro/contas-a-pagar'),
                api.get('/api/financeiro/contas-bancarias')
            ]);

            const listaContas = Array.isArray(resContas.data) ? resContas.data : [];
            const listaBancos = Array.isArray(resBancos.data) ? resBancos.data : [];

            const ordenadas = listaContas.sort((a, b) => new Date(a.dataVencimento || 0) - new Date(b.dataVencimento || 0));

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

    // =======================================================================
    // APLICAÇÃO DOS FILTROS E PAGINAÇÃO
    // =======================================================================
    useEffect(() => {
        setPaginaAtual(1);
        setIndexFocado(-1);
    }, [busca, dataInicio, dataFim]);

    const contasFiltradas = contas.filter(c => {
        const fornecedor = c.fornecedorNome || '';
        const descricao = c.descricao || '';
        const idString = c.id ? c.id.toString() : '';
        const termoBusca = busca.toLowerCase();

        const matchBusca = fornecedor.toLowerCase().includes(termoBusca) ||
            descricao.toLowerCase().includes(termoBusca) ||
            idString.includes(termoBusca);

        const dataVenc = c.dataVencimento ? String(c.dataVencimento).substring(0, 10) : '';
        const matchDataInicio = dataInicio ? dataVenc >= dataInicio : true;
        const matchDataFim = dataFim ? dataVenc <= dataFim : true;

        return matchBusca && matchDataInicio && matchDataFim;
    });

    const totalPaginas = Math.ceil(contasFiltradas.length / itensPorPagina) || 1;
    const indexInicialPaginacao = (paginaAtual - 1) * itensPorPagina;
    const contasPaginadas = contasFiltradas.slice(indexInicialPaginacao, indexInicialPaginacao + itensPorPagina);

    // =======================================================================
    // 🚀 ATALHOS DE TECLADO (MODO NINJA)
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {

            // TELA DE NOVA DESPESA
            if (modoAtual === 'NOVA_DESPESA') {
                if (e.key === 'Escape') {
                    voltarParaLista();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!processando) salvarNovaDespesa();
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
                    case 'ArrowRight':
                        if (!isInputFocused) {
                            e.preventDefault();
                            setPaginaAtual(prev => Math.min(totalPaginas, prev + 1));
                            setIndexFocado(-1);
                        }
                        break;
                    case 'ArrowLeft':
                        if (!isInputFocused) {
                            e.preventDefault();
                            setPaginaAtual(prev => Math.max(1, prev - 1));
                            setIndexFocado(-1);
                        }
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (isInputFocused && document.activeElement === buscaInputRef.current) {
                            if (contasPaginadas.length === 1) iniciarBaixa(contasPaginadas[0]);
                            else if (indexFocado >= 0 && contasPaginadas[indexFocado]) iniciarBaixa(contasPaginadas[indexFocado]);
                        } else {
                            if (indexFocado >= 0 && contasPaginadas[indexFocado]) iniciarBaixa(contasPaginadas[indexFocado]);
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
    // TRANSIÇÕES E LÓGICAS
    // =======================================================================
    const iniciarBaixa = (conta) => {
        setContaSelecionada(conta);
        setModoAtual('BAIXA');
    };

    const abrirNovaDespesa = () => {
        setNovaDescricao('');
        setNovoValor('0');
        setNovoVencimento('');
        setNovoFornecedor('');
        setModoAtual('NOVA_DESPESA');
    };

    const voltarParaLista = () => {
        setContaSelecionada(null);
        setModoAtual('LISTA');
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
            setModoAtual('LISTA');
            setBusca('');
            setIndexFocado(-1);
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
            const payload = {
                descricao: novaDescricao,
                valor: valorNumerico,
                vencimento: novoVencimento,
                fornecedor: novoFornecedor
            };

            await api.post('/api/financeiro/contas-pagar/manual', payload);
            toast.success("Despesa cadastrada com sucesso!", { id: toastId });
            setModoAtual('LISTA');
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar despesa.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };


    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================

    // -----------------------------------------------------------------------
    // TELA 1: LISTA (Padrão)
    // -----------------------------------------------------------------------
    if (modoAtual === 'LISTA') {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in flex flex-col h-[90vh]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                            <TrendingDown className="text-red-600 bg-red-100 p-2 rounded-xl" size={40} />
                            Contas a Pagar
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Controle de despesas, boletos XML e contas fixas.</p>
                    </div>
                    <button
                        onClick={abrirNovaDespesa}
                        className="w-full md:w-auto bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Plus size={20} /> DESPESA AVULSA
                    </button>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-3 items-center justify-end mb-4">
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto">
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
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 w-full xl:w-auto">
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
                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            ref={buscaInputRef}
                            type="text"
                            placeholder="Buscar fornecedor/doc (F2)..."
                            className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-sm"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

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
                                        <th className="p-4 font-black">Fornecedor / Descrição</th>
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
                                                Nenhuma despesa pendente!
                                            </td>
                                        </tr>
                                    ) : (
                                        contasPaginadas.map((conta, idx) => {
                                            const isFocado = indexFocado === idx;
                                            return (
                                                <tr
                                                    key={conta.id}
                                                    onClick={() => iniciarBaixa(conta)}
                                                    className={`cursor-pointer transition-all border-l-4 ${isFocado ? 'bg-red-50 border-l-red-500 shadow-sm relative z-10' : 'hover:bg-slate-50 border-l-transparent'}`}
                                                >
                                                    <td className="p-4 font-mono text-xs font-bold text-slate-500">#{conta.id}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 size={14} className="text-slate-400" />
                                                            <p className="font-black text-slate-800 text-sm">{conta.fornecedorNome || 'Diversos'}</p>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 ml-5">{conta.descricao}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className={`flex items-center gap-2 text-sm font-bold ${conta.atrasado ? 'text-red-600' : 'text-slate-600'}`}>
                                                            {conta.atrasado ? <CalendarX size={14}/> : <CheckCircle size={14} className="text-emerald-500"/>}
                                                            {conta.dataVencimento ? new Date(conta.dataVencimento).toLocaleDateString('pt-BR') : '-'}
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
                                        Exibindo <span className="text-slate-800">{indexInicialPaginacao + 1}</span> - <span className="text-slate-800">{Math.min(indexInicialPaginacao + itensPorPagina, contasFiltradas.length)}</span> de <span className="text-slate-800">{contasFiltradas.length}</span> despesas
                                    </span>

                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">Use <strong className="text-slate-600 px-1">&larr;</strong> e <strong className="text-slate-600 px-1">&rarr;</strong></span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="px-4 py-2 font-black text-sm text-slate-700">{paginaAtual} / {totalPaginas}</span>
                                            <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-30">
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

    // -----------------------------------------------------------------------
    // TELA 2: BAIXA DE DESPESA
    // -----------------------------------------------------------------------
    if (modoAtual === 'BAIXA') {
        const bancoSelecionadoObj = contasBancarias.find(b => b.id.toString() === bancoSelecionadoId);
        const valorConta = contaSelecionada?.valor || 0;

        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Lista (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-red-500">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2">
                            <TrendingDown className="text-red-600" size={32} /> Liquidar Despesa
                        </h2>
                        <p className="text-lg font-bold text-slate-600">Fornecedor: <span className="text-red-600">{contaSelecionada.fornecedorNome || 'Diversos'}</span></p>
                        <p className="text-sm font-bold text-slate-400 mt-1">{contaSelecionada.descricao} - Venc: {contaSelecionada.dataVencimento ? new Date(contaSelecionada.dataVencimento).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 p-8 rounded-3xl text-center shadow-inner flex flex-col justify-center">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Valor da Obrigação</p>
                            <h1 className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(valorConta)}</h1>
                        </div>

                        <div className="flex flex-col justify-center">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Wallet size={16}/> Origem do Dinheiro
                            </label>

                            <select
                                value={bancoSelecionadoId}
                                onChange={(e) => setBancoSelecionadoId(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-red-500 outline-none font-black text-slate-700 text-lg transition-colors cursor-pointer"
                            >
                                {contasBancarias.length === 0 ? (
                                    <option value="">Nenhuma conta cadastrada</option>
                                ) : (
                                    contasBancarias.map(banco => (
                                        <option key={banco.id} value={banco.id}>
                                            {banco.nome} (Saldo: R$ {formatarMoeda(banco.saldoAtual)})
                                        </option>
                                    ))
                                )}
                            </select>

                            {bancoSelecionadoObj && (bancoSelecionadoObj.saldoAtual < valorConta) && (
                                <p className="text-xs font-bold text-red-500 mt-3 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                                    <AlertCircle size={14}/> Atenção: O saldo desta conta ficará negativo.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={confirmarBaixa}
                            disabled={processando || !bancoSelecionadoId}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <CheckCircle size={32}/>}
                            CONFIRMAR PAGAMENTO (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // 🚀 TELA 3: NOVA DESPESA AVULSA (Substitui o Modal Antigo)
    // -----------------------------------------------------------------------
    if (modoAtual === 'NOVA_DESPESA') {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Lista (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-slate-800">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Plus className="text-slate-600" size={32} /> Lançar Despesa Avulsa
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mt-1">Contas de consumo, aluguel, salários ou prestadores de serviço.</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descrição / Motivo</label>
                            <input
                                type="text"
                                autoFocus
                                value={novaDescricao}
                                onChange={(e) => setNovaDescricao(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                placeholder="Ex: Conta de Luz - Mês atual"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Fornecedor / Credor</label>
                            <input
                                type="text"
                                value={novoFornecedor}
                                onChange={(e) => setNovoFornecedor(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                placeholder="Opcional. Ex: Neoenergia"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Vencimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input
                                    type="date"
                                    value={novoVencimento}
                                    onChange={(e) => setNovoVencimento(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-black text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-red-500 uppercase tracking-widest mb-2">Valor da Despesa</label>
                            <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 p-4 rounded-xl focus-within:border-red-500 transition-colors">
                                <span className="text-xl font-black text-red-400 pl-2">R$</span>
                                <input
                                    type="text"
                                    value={formatarMoeda(novoValor)}
                                    onChange={(e) => handleValorChange(setNovoValor)(e.target.value)}
                                    className="w-full bg-transparent outline-none font-black text-red-700 text-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={salvarNovaDespesa}
                            disabled={processando || !novaDescricao || !novoVencimento || parseFloat(novoValor) <= 0}
                            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black text-lg py-5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processando ? <Loader2 size={24} className="animate-spin"/> : <Save size={24}/>}
                            SALVAR DESPESA (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};