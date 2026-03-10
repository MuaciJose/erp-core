import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const RegraFiscalModal = ({ regra, onClose, onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nomeRegra: '',
        ncmPrefixo: '',
        estadoDestino: 'TODOS',
        cfop: '',
        cstIcms: '',
        icmsAliquota: 0,
        pisAliquota: 0,
        cofinsAliquota: 0,
        ipiAliquota: 0
    });

    useEffect(() => {
        if (regra) {
            setFormData(regra);
        }
    }, [regra]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const salvarRegra = async (e) => {
        e.preventDefault();
        if (!formData.nomeRegra || !formData.cfop || !formData.cstIcms) {
            return toast.error("Preencha Nome, CFOP e CST ICMS.");
        }

        setLoading(true);
        const loadId = toast.loading("Salvando regra...");
        try {
            if (regra && regra.id) {
                await api.put(`/api/fiscal/regras/${regra.id}`, formData);
            } else {
                await api.post('/api/fiscal/regras', formData);
            }
            toast.success("Regra salva com sucesso!", { id: loadId });
            onSaveSuccess();
        } catch (error) {
            toast.error("Erro ao salvar a regra.", { id: loadId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-2xl font-black text-slate-800">
                        {regra ? 'Editar Regra Fiscal' : 'Nova Regra Fiscal'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
                </div>

                <form onSubmit={salvarRegra} className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Nome da Regra *</label>
                            <input type="text" name="nomeRegra" value={formData.nomeRegra} onChange={handleChange} placeholder="Ex: Venda Simples Nacional - Roupas" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-500" required />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Prefixo NCM (Opcional)</label>
                            <input type="text" name="ncmPrefixo" value={formData.ncmPrefixo} onChange={handleChange} placeholder="Deixe vazio para GERAL" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-500" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Estado Destino (UF)</label>
                            <input type="text" name="estadoDestino" value={formData.estadoDestino} onChange={handleChange} placeholder="Ex: PE ou TODOS" maxLength="5" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-500 uppercase" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">CFOP *</label>
                            <input type="text" name="cfop" value={formData.cfop} onChange={handleChange} placeholder="Ex: 5102" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-500" required />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">CST / CSOSN ICMS *</label>
                            <input type="text" name="cstIcms" value={formData.cstIcms} onChange={handleChange} placeholder="Ex: 102 ou 00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 outline-none focus:border-indigo-500" required />
                        </div>
                    </div>

                    <h3 className="text-sm font-black text-slate-800 uppercase mb-4 border-b pb-2">Alíquotas (%)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">ICMS</label>
                            <input type="number" step="0.01" name="icmsAliquota" value={formData.icmsAliquota} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-600 outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">PIS</label>
                            <input type="number" step="0.01" name="pisAliquota" value={formData.pisAliquota} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-600 outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">COFINS</label>
                            <input type="number" step="0.01" name="cofinsAliquota" value={formData.cofinsAliquota} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-600 outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">IPI</label>
                            <input type="number" step="0.01" name="ipiAliquota" value={formData.ipiAliquota} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-indigo-600 outline-none focus:border-indigo-500" />
                        </div>
                    </div>
                </form>

                <div className="p-8 border-t flex justify-end gap-4 bg-slate-50">
                    <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                        Cancelar
                    </button>
                    <button onClick={salvarRegra} disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:bg-slate-400">
                        <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Regra'}
                    </button>
                </div>
            </div>
        </div>
    );
};