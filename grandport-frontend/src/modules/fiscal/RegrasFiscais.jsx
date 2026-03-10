import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { RegraFiscalModal } from './RegraFiscalModal';

export const RegrasFiscais = () => {
    const [regras, setRegras] = useState([]);
    const [busca, setBusca] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [regraEditando, setRegraEditando] = useState(null);

    const carregarRegras = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/fiscal/regras');
            setRegras(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error("Erro ao carregar regras fiscais.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarRegras();
    }, [carregarRegras]);

    const handleExcluir = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta regra fiscal?")) return;

        try {
            await api.delete(`/api/fiscal/regras/${id}`);
            toast.success("Regra excluída com sucesso!");
            carregarRegras();
        } catch (error) {
            toast.error("Erro ao excluir regra.");
        }
    };

    const abrirNovaRegra = () => {
        setRegraEditando(null);
        setModalOpen(true);
    };

    const abrirEdicao = (regra) => {
        setRegraEditando(regra);
        setModalOpen(true);
    };

    const regrasFiltradas = regras.filter(r =>
        r.nomeRegra.toLowerCase().includes(busca.toLowerCase()) ||
        r.cfop.includes(busca) ||
        (r.ncmPrefixo && r.ncmPrefixo.includes(busca))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-indigo-600 bg-indigo-50 p-2 rounded-xl" size={40} />
                        REGRAS FISCAIS
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Configure o motor de impostos para a emissão de NF-e.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={carregarRegras} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                        <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={abrirNovaRegra} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200">
                        <Plus size={20} /> NOVA REGRA
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CFOP ou NCM..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-slate-500 text-xs uppercase font-black tracking-widest">
                        <th className="p-5">Nome da Regra</th>
                        <th className="p-5">Estado / NCM</th>
                        <th className="p-5">CFOP / CST</th>
                        <th className="p-5 text-center">Impostos (ICMS/PIS/COF/IPI)</th>
                        <th className="p-5 text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {loading ? (
                        <tr><td colSpan="5" className="p-20 text-center animate-pulse font-bold text-slate-400">Carregando...</td></tr>
                    ) : regrasFiltradas.length === 0 ? (
                        <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400 flex flex-col items-center"><AlertCircle className="mb-2 text-slate-300" size={32}/> Nenhuma regra encontrada.</td></tr>
                    ) : (
                        regrasFiltradas.map((regra) => (
                            <tr key={regra.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-800">{regra.nomeRegra}</td>
                                <td className="p-5">
                                    <div className="font-bold text-slate-700">UF: {regra.estadoDestino || 'TODOS'}</div>
                                    <div className="text-xs text-slate-500 font-bold">NCM: {regra.ncmPrefixo || 'GERAL'}</div>
                                </td>
                                <td className="p-5">
                                    <div className="font-black text-indigo-600">{regra.cfop}</div>
                                    <div className="text-xs text-slate-500 font-bold">CST: {regra.cstIcms}</div>
                                </td>
                                <td className="p-5 text-center font-bold text-sm text-slate-600">
                                    {regra.icmsAliquota}% / {regra.pisAliquota}% / {regra.cofinsAliquota}% / {regra.ipiAliquota}%
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => abrirEdicao(regra)} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit size={18} /></button>
                                        <button onClick={() => handleExcluir(regra.id)} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <RegraFiscalModal
                    regra={regraEditando}
                    onClose={() => setModalOpen(false)}
                    onSaveSuccess={() => {
                        setModalOpen(false);
                        carregarRegras();
                    }}
                />
            )}
        </div>
    );
};