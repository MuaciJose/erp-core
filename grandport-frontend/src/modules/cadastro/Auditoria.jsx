import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Activity, Search, Clock, CheckCircle, Ban,
    AlertCircle, Edit, Globe, ChevronLeft, ChevronRight, RefreshCw, Filter, ShieldAlert
} from 'lucide-react';

export const Auditoria = () => {
    const [logs, setLogs] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const tamanhoPagina = 20;

    // ESTADOS DE FILTRO
    const [busca, setBusca] = useState('');
    const [empresaFiltro, setEmpresaFiltro] = useState('TODAS');
    const [moduloFiltro, setModuloFiltro] = useState('TODOS');
    const [filtroInteligente, setFiltroInteligente] = useState('TUDO');
    const [acaoFiltro, setAcaoFiltro] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const carregarLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/auditoria', {
                params: {
                    page,
                    size: tamanhoPagina,
                    empresaId: empresaFiltro === 'TODAS' ? undefined : Number(empresaFiltro),
                    modulo: moduloFiltro === 'TODOS' ? undefined : moduloFiltro,
                    acao: acaoFiltro || undefined,
                    busca: busca || undefined,
                    dataInicio: dataInicio || undefined,
                    dataFim: dataFim || undefined
                }
            });
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (error) {
            console.error("Erro ao carregar auditoria", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadEmpresas = async () => {
            try {
                const res = await api.get('/api/assinaturas/empresas');
                setEmpresas(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                setEmpresas([]);
            }
        };
        loadEmpresas();
    }, []);

    useEffect(() => {
        setPage(0);
    }, [empresaFiltro, moduloFiltro, filtroInteligente, acaoFiltro, dataInicio, dataFim, busca]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            carregarLogs();
        }, 250);
        return () => clearTimeout(timeout);
    }, [page, empresaFiltro, moduloFiltro, acaoFiltro, dataInicio, dataFim, busca]);

    // 🚀 MOTOR DE CORES INTELIGENTE (ESTILO FERRARI)
    const getBadgeConfig = (acao) => {
        if (!acao) return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Activity size={10} /> };

        const a = acao.toUpperCase();

        // 🔴 Nível Máximo (Crítico / Perda Financeira / Quebra de Segurança)
        if (a.includes('EXCLUSAO') || a.includes('CANCELAMENTO') || a.includes('FORCADA') || a.includes('RESET') || a.includes('ESTORNO'))
            return { color: 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100', icon: <Ban size={10} /> };

        // 🟠 Nível Atenção (Modificação de Base / Retirada de Caixa)
        if (a.includes('ALTERACAO') || a.includes('EDICAO') || a.includes('SANGRIA') || a.includes('AJUSTE') || a.includes('QUEBRA'))
            return { color: 'bg-orange-50 text-orange-600 border-orange-200', icon: <AlertCircle size={10} /> };

        // 🟢 Nível Sucesso (Entrada de Dinheiro / Finalização)
        if (a.includes('FATURAMENTO') || a.includes('BAIXA') || a.includes('LIQUIDACAO') || a.includes('ABERTURA') || a.includes('FECHAMENTO'))
            return { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle size={10} /> };

        // 🔵 Nível Sistema/Fiscal (Transações Legais)
        if (a.includes('EMISSAO') || a.includes('GERACAO') || a.includes('IMPORTACAO') || a.includes('UPLOAD') || a.includes('TRANSFERENCIA'))
            return { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: <ShieldAlert size={10} /> };

        // ⚪ Nível Neutro (Cadastros comuns)
        return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Edit size={10} /> };
    };

    const logsFiltrados = logs.filter(log => {
        let atendeInteligente = true;
        if (filtroInteligente === 'EXCLUSOES') atendeInteligente = log.acao?.toUpperCase().includes('EXCLUSAO') || log.acao?.toUpperCase().includes('CANCELAMENTO') || log.acao?.toUpperCase().includes('FORCADA');
        if (filtroInteligente === 'FINANCEIRO') atendeInteligente = log.modulo === 'FINANCEIRO' || log.modulo === 'CAIXA';
        if (filtroInteligente === 'FISCAL') atendeInteligente = log.modulo === 'FISCAL';

        return atendeInteligente;
    });

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in flex flex-col h-[calc(100vh-4rem)] bg-slate-50">

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                            <Activity size={28} strokeWidth={2.5} />
                        </div>
                        Cofre de Auditoria
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Rastreabilidade forense de todas as ações do sistema (LGPD)</p>
                </div>
                <button
                    onClick={carregarLogs}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500' : ''} />
                    {loading ? 'Sincronizando...' : 'Atualizar Dados'}
                </button>
            </div>

            {/* PAINEL DE CONTROLE (FILTROS) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm mb-6 shrink-0">

                <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por usuário, IP, ação ou detalhes..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-semibold text-slate-700 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 hover:border-slate-300 transition-colors">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={empresaFiltro}
                            onChange={(e) => setEmpresaFiltro(e.target.value)}
                            className="py-2.5 px-1 bg-transparent outline-none text-sm font-bold text-slate-700 w-full md:w-56 cursor-pointer"
                        >
                            <option value="TODAS">Todas as empresas</option>
                            {empresas.map((empresa) => (
                                <option key={empresa.id} value={empresa.id}>{empresa.razaoSocial}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 hover:border-slate-300 transition-colors">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={moduloFiltro}
                            onChange={(e) => setModuloFiltro(e.target.value)}
                            className="py-2.5 px-1 bg-transparent outline-none text-sm font-bold text-slate-700 w-full md:w-48 cursor-pointer"
                        >
                            <option value="TODOS">Todos os Módulos</option>
                            <option value="VENDAS">Vendas / PDV</option>
                            <option value="CAIXA">Caixa Diário</option>
                            <option value="FINANCEIRO">Financeiro</option>
                            <option value="FISCAL">Fiscal (Sefaz)</option>
                            <option value="ESTOQUE">Estoque</option>
                            <option value="ORDEM_SERVICO">Ordem de Serviço</option>
                            <option value="CADASTROS">Cadastros</option>
                            <option value="SISTEMA">Configurações/Sistema</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Filtrar ação..."
                        value={acaoFiltro}
                        onChange={(e) => setAcaoFiltro(e.target.value)}
                        className="w-full md:w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                    <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                </div>

                {/* FILTROS INTELIGENTES RAPIDOS */}
                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                    <button onClick={() => setFiltroInteligente('TUDO')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filtroInteligente === 'TUDO' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Visão Geral</button>
                    <button onClick={() => setFiltroInteligente('FINANCEIRO')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filtroInteligente === 'FINANCEIRO' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : 'bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50'}`}>💰 Financeiro / Caixa</button>
                    <button onClick={() => setFiltroInteligente('FISCAL')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filtroInteligente === 'FISCAL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white text-indigo-700 border border-slate-200 hover:bg-indigo-50'}`}>🧾 Fiscal</button>
                    <button onClick={() => setFiltroInteligente('EXCLUSOES')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${filtroInteligente === 'EXCLUSOES' ? 'bg-red-600 text-white shadow-md shadow-red-500/30' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}><Ban size={14} strokeWidth={2.5}/> Ações Críticas</button>
                </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                        <tr className="text-[11px] text-slate-500 uppercase tracking-widest">
                            <th className="p-4 pl-6 font-black w-48 whitespace-nowrap">Data / Hora</th>
                            <th className="p-4 font-black w-48 whitespace-nowrap">Empresa</th>
                            <th className="p-4 font-black w-48 whitespace-nowrap">Usuário Operador</th>
                            <th className="p-4 font-black w-32 text-center whitespace-nowrap">IP Origem</th>
                            <th className="p-4 font-black w-32 whitespace-nowrap">Módulo</th>
                            <th className="p-4 font-black w-56 whitespace-nowrap">Ação Executada</th>
                            <th className="p-4 font-black min-w-[300px]">Detalhes Técnicos</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            // EFEITO DE CARREGAMENTO PULSANTE (SKELETON)
                            [...Array(7)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4 pl-6"><div className="h-4 bg-slate-100 rounded w-24 mb-2"></div><div className="h-3 bg-slate-100 rounded w-16"></div></td>
                                    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                                    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                    <td className="p-4"><div className="h-5 bg-slate-100 rounded-full w-24 mx-auto"></div></td>
                                    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    <td className="p-4"><div className="h-6 bg-slate-100 rounded-lg w-32"></div></td>
                                    <td className="p-4"><div className="h-4 bg-slate-100 rounded w-full max-w-md"></div></td>
                                </tr>
                            ))
                        ) : logsFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-slate-500 font-bold text-lg">Nenhum registro encontrado</h3>
                                        <p className="text-slate-400 text-sm">Tente limpar os filtros ou buscar por outras palavras.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logsFiltrados.map((log) => {
                                const badge = getBadgeConfig(log.acao);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-6 align-top">
                                            <div className="text-sm text-slate-700 font-bold">
                                                {new Date(log.dataHora).toLocaleDateString('pt-BR')}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {new Date(log.dataHora).toLocaleTimeString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-800 text-sm">
                                                {log.empresaRazaoSocial || `Empresa #${log.empresaId || '-'}`}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-400">
                                                #{log.empresaId || 'PLATAFORMA'}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                                                    {log.usuarioNome?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                {log.usuarioNome || 'Sistema'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center align-top">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md w-max mx-auto">
                                                    <Globe size={10} className="text-slate-400" /> {log.ipOrigem || '0.0.0.0'}
                                                </span>
                                        </td>
                                        <td className="p-4 align-top">
                                                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">
                                                    {log.modulo?.replace('_', ' ')}
                                                </span>
                                        </td>
                                        <td className="p-4 align-top">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border w-max ${badge.color}`}>
                                                    {badge.icon} {log.acao?.replace(/_/g, ' ')}
                                                </span>
                                        </td>
                                        <td className="p-4 pr-6 text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 align-top">
                                            {/* Se a string contiver ALERTA, destaca em vermelho na leitura */}
                                            {log.detalhes?.includes('ALERTA') ? (
                                                <span className="text-red-600 font-bold">{log.detalhes}</span>
                                            ) : (
                                                log.detalhes
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 RODAPÉ DE PAGINAÇÃO (ESTILO FERRARI) */}
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
                <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                        <Activity size={16} />
                    </div>
                    Página <span className="text-indigo-600 font-black px-1">{page + 1}</span> de <span className="font-bold px-1">{totalPages === 0 ? 1 : totalPages}</span>
                    <span className="hidden md:inline text-slate-400 font-normal border-l border-slate-300 pl-2 ml-1">
                        Total de <b>{totalElements}</b> registros auditados
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                        disabled={page === 0 || loading}
                        className="p-2 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} /> Anterior
                    </button>
                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                        disabled={page >= totalPages - 1 || loading || totalPages === 0}
                        className="p-2 px-5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-all font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        Próxima <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

        </div>
    );
};
