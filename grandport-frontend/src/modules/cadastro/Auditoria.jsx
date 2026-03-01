import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity, Search, Clock, CheckCircle, Ban, AlertCircle, Edit, Globe } from 'lucide-react';

export const Auditoria = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [moduloFiltro, setModuloFiltro] = useState('TODOS');

    const carregarLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/auditoria');
            setLogs(res.data);
        } catch (error) {
            console.error("Erro ao carregar auditoria", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarLogs(); }, []);

    const getBadgeAcao = (acao) => {
        const a = acao.toUpperCase();
        if (a.includes('EXCLUSAO') || a.includes('ESTORNO') || a.includes('BLOQUEADO')) 
            return 'bg-red-100 text-red-700 border-red-200';
        if (a.includes('ALTERACAO') || a.includes('EDICAO')) 
            return 'bg-orange-100 text-orange-700 border-orange-200';
        if (a.includes('IMPORTACAO') || a.includes('LIQUIDACAO') || a.includes('FECHAMENTO') || a.includes('CRIACAO')) 
            return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const logsFiltrados = logs.filter(log => {
        const atendeModulo = moduloFiltro === 'TODOS' || log.modulo === moduloFiltro;
        const termo = busca.toLowerCase();
        const atendeBusca = (log.usuarioNome?.toLowerCase() || '').includes(termo) || 
                            (log.detalhes?.toLowerCase() || '').includes(termo) ||
                            (log.ipOrigem?.toLowerCase() || '').includes(termo);
        return atendeModulo && atendeBusca;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="text-indigo-600 bg-indigo-100 p-1 rounded-lg" size={36} /> 
                        AUDITORIA DO SISTEMA
                    </h1>
                    <p className="text-slate-500 mt-1">Rastreabilidade completa de ações críticas</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-t-3xl border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar usuário, detalhe ou IP..." 
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium"
                        />
                    </div>
                    <select 
                        value={moduloFiltro}
                        onChange={(e) => setModuloFiltro(e.target.value)}
                        className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700"
                    >
                        <option value="TODOS">Todos os Módulos</option>
                        <option value="PDV">PDV / Vendas</option>
                        <option value="CAIXA">Controle de Caixa</option>
                        <option value="ESTOQUE">Estoque</option>
                        <option value="FINANCEIRO">Financeiro</option>
                        <option value="SISTEMA">Configurações</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Clock size={16} /> Registros em tempo real
                </div>
            </div>

            <div className="bg-white rounded-b-3xl shadow-xl border border-t-0 border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-slate-300 text-xs uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-4 pl-6 w-48">Data e Hora</th>
                            <th className="p-4 w-40">Usuário</th>
                            <th className="p-4 w-32 text-center">IP Origem</th>
                            <th className="p-4 w-32">Módulo</th>
                            <th className="p-4 w-40 text-center">Ação</th>
                            <th className="p-4 pr-6">Detalhes do Registro</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">Buscando registros...</td></tr>
                        ) : logsFiltrados.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">Nenhum registro encontrado.</td></tr>
                        ) : (
                            logsFiltrados.map((log) => (
                                <tr key={log.id} className="border-b hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 pl-6 text-slate-500 font-mono">
                                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">
                                        {log.usuarioNome}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            <Globe size={10} /> {log.ipOrigem || '0.0.0.0'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-black text-slate-400 text-xs uppercase">
                                        {log.modulo}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest border ${getBadgeAcao(log.acao)}`}>
                                            {log.acao}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6 text-slate-600 leading-relaxed group-hover:text-slate-900">
                                        {log.detalhes}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
