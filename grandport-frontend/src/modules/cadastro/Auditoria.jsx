import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Activity, Search, Clock, CheckCircle, Ban,
    AlertCircle, Edit, Globe, ChevronLeft, ChevronRight, RefreshCw, Filter
} from 'lucide-react';

export const Auditoria = () => {
    // 🚀 ESTADOS DO MOTOR DE PAGINAÇÃO
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const tamanhoPagina = 20; // Quantidade de logs por tela

    // ESTADOS DE FILTRO
    const [busca, setBusca] = useState('');
    const [moduloFiltro, setModuloFiltro] = useState('TODOS');
    const [filtroInteligente, setFiltroInteligente] = useState('TUDO'); // TUDO, EXCLUSOES, FINANCEIRO

    const carregarLogs = async () => {
        setLoading(true);
        try {
            // 🚀 Bate na nova rota paginada do Java
            const res = await api.get(`/api/auditoria?page=${page}&size=${tamanhoPagina}`);

            // O Spring devolve um objeto Page, os dados ficam dentro de "content"
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
        } catch (error) {
            console.error("Erro ao carregar auditoria", error);
        } finally {
            setLoading(false);
        }
    };

    // Recarrega sempre que a página mudar
    useEffect(() => {
        carregarLogs();
    }, [page]);

    // Reseta a página para 0 se o usuário mudar o filtro
    useEffect(() => {
        setPage(0);
    }, [moduloFiltro, filtroInteligente]);

    const getBadgeAcao = (acao) => {
        if (!acao) return 'bg-slate-100 text-slate-700 border-slate-200';
        const a = acao.toUpperCase();
        if (a.includes('EXCLUSAO') || a.includes('ESTORNO') || a.includes('BLOQUEADO'))
            return 'bg-red-100 text-red-700 border-red-200';
        if (a.includes('ALTERACAO') || a.includes('EDICAO'))
            return 'bg-orange-100 text-orange-700 border-orange-200';
        if (a.includes('IMPORTACAO') || a.includes('LIQUIDACAO') || a.includes('FECHAMENTO') || a.includes('CRIACAO'))
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    // 🚀 FILTRO APLICADO NA PÁGINA ATUAL (Para o motor do banco filtrar 100%,
    // precisaríamos passar esses parâmetros na URL da API no futuro)
    const logsFiltrados = logs.filter(log => {
        const atendeModulo = moduloFiltro === 'TODOS' || log.modulo === moduloFiltro;
        const termo = busca.toLowerCase();
        const atendeBusca = (log.usuarioNome?.toLowerCase() || '').includes(termo) ||
            (log.detalhes?.toLowerCase() || '').includes(termo) ||
            (log.ipOrigem?.toLowerCase() || '').includes(termo);

        let atendeInteligente = true;
        if (filtroInteligente === 'EXCLUSOES') atendeInteligente = log.acao?.toUpperCase().includes('EXCLUSÃO') || log.acao?.toUpperCase().includes('ESTORNO');
        if (filtroInteligente === 'FINANCEIRO') atendeInteligente = log.modulo === 'FINANCEIRO';

        return atendeModulo && atendeBusca && atendeInteligente;
    });

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in flex flex-col h-[calc(100vh-4rem)]">

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="text-indigo-600 bg-indigo-100 p-1.5 rounded-xl shadow-inner" size={36} />
                        AUDITORIA DO SISTEMA
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Rastreabilidade completa de ações e segurança (LGPD)</p>
                </div>
                <button
                    onClick={carregarLogs}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Sincronizando...' : 'Atualizar Tempo Real'}
                </button>
            </div>

            {/* BARRA DE FILTROS E PESQUISA */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm mb-6 shrink-0">

                <div className="flex flex-col md:flex-row w-full xl:w-auto gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar na página atual..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none text-sm font-bold text-slate-700 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2">
                        <Filter size={16} className="text-slate-400 ml-2" />
                        <select
                            value={moduloFiltro}
                            onChange={(e) => setModuloFiltro(e.target.value)}
                            className="py-2.5 px-2 bg-transparent outline-none text-sm font-bold text-slate-700 w-full cursor-pointer"
                        >
                            <option value="TODOS">Módulo: Todos</option>
                            <option value="COMPRAS">Compras / Notas</option>
                            <option value="ESTOQUE">Estoque / Produtos</option>
                            <option value="FINANCEIRO">Financeiro / Caixa</option>
                            <option value="SISTEMA">Configurações</option>
                        </select>
                    </div>
                </div>

                {/* FILTROS INTELIGENTES (CHIPS) */}
                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                    <button onClick={() => setFiltroInteligente('TUDO')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${filtroInteligente === 'TUDO' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Visão Geral</button>
                    <button onClick={() => setFiltroInteligente('EXCLUSOES')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap flex items-center gap-1 ${filtroInteligente === 'EXCLUSOES' ? 'bg-red-600 text-white shadow-md shadow-red-500/30' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}><Ban size={12}/> Apenas Exclusões</button>
                </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                            <th className="p-4 pl-6 font-black w-48">Data e Hora</th>
                            <th className="p-4 font-black w-40">Usuário</th>
                            <th className="p-4 font-black w-32 text-center">IP Origem</th>
                            <th className="p-4 font-black w-32">Módulo</th>
                            <th className="p-4 font-black w-40 text-center">Ação</th>
                            <th className="p-4 font-black">Detalhes do Registro</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="p-12 text-center"><div className="flex flex-col items-center gap-3"><RefreshCw size={32} className="animate-spin text-indigo-500"/><span className="text-slate-400 font-bold text-sm tracking-widest uppercase">Decodificando Logs...</span></div></td></tr>
                        ) : logsFiltrados.length === 0 ? (
                            <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-bold text-lg border-2 border-dashed border-slate-100 rounded-3xl m-4">Nenhum registro encontrado nesta página.</td></tr>
                        ) : (
                            logsFiltrados.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 pl-6 text-sm text-slate-500 font-medium">
                                        {new Date(log.dataHora).toLocaleDateString('pt-BR')} <br/>
                                        <span className="text-xs text-slate-400">{new Date(log.dataHora).toLocaleTimeString('pt-BR')}</span>
                                    </td>
                                    <td className="p-4 font-black text-slate-800 text-sm">{log.usuarioNome}</td>
                                    <td className="p-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded w-max mx-auto">
                                                <Globe size={10} /> {log.ipOrigem || '0.0.0.0'}
                                            </span>
                                    </td>
                                    <td className="p-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">{log.modulo}</td>
                                    <td className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border w-max mx-auto ${getBadgeAcao(log.acao)}`}>
                                                {log.acao}
                                            </span>
                                    </td>
                                    <td className="p-4 pr-6 text-sm text-slate-600 font-medium leading-relaxed group-hover:text-slate-900">
                                        {log.detalhes}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 RODAPÉ DE PAGINAÇÃO (ESTILO FERRARI) */}
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-3xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Clock size={14} />
                    Mostrando página <b className="text-indigo-600">{page + 1}</b> de {totalPages === 0 ? 1 : totalPages}
                    <span className="hidden md:inline">({totalElements} registros no total)</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                        disabled={page === 0 || loading}
                        className="p-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>
                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                        disabled={page >= totalPages - 1 || loading || totalPages === 0}
                        className="p-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                        Próxima <ChevronRight size={16} />
                    </button>
                </div>
            </div>

        </div>
    );
};