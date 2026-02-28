import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, Save, FileText, Calendar, DollarSign, Tag } from 'lucide-react';

export const NovaDespesaModal = ({ onClose, onSuccess }) => {
    const [despesa, setDespesa] = useState({
        descricao: '',
        fornecedor: '',
        valor: '',
        vencimento: '',
        planoContaId: '',
    });
    const [planoContas, setPlanoContas] = useState([]);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        const carregarPlano = async () => {
            try {
                const res = await api.get('/api/planocontas/lancamentos?tipo=DESPESA');
                setPlanoContas(res.data);
            } catch (error) {
                console.error("Erro ao carregar plano de contas", error);
            }
        };
        carregarPlano();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDespesa({ ...despesa, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!despesa.planoContaId) {
            alert("Selecione uma categoria do plano de contas.");
            return;
        }
        setSalvando(true);
        try {
            await api.post('/api/financeiro/contas-pagar/manual', {
                ...despesa,
                valor: parseFloat(despesa.valor),
                planoContaId: parseInt(despesa.planoContaId)
            });
            alert("Despesa registrada com sucesso!");
            onSuccess();
            onClose();
        } catch (err) {
            alert("Erro ao registrar a despesa.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
                
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <FileText className="text-blue-400" size={28} />
                        <div>
                            <h2 className="text-xl font-black tracking-widest">NOVA DESPESA</h2>
                            <p className="text-sm text-slate-400">Registro manual com classificação contábil</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FileText size={14}/> Descrição</label>
                            <input name="descricao" type="text" required value={despesa.descricao} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl" placeholder="Ex: Fatura da Luz, Aluguel..." />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Tag size={14}/> Categoria (Plano de Contas)</label>
                            <select name="planoContaId" value={despesa.planoContaId} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-slate-700">
                                <option value="">Selecione uma classificação...</option>
                                {planoContas.map(conta => (
                                    <option key={conta.id} value={conta.id}>
                                        {conta.codigo} - {conta.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><DollarSign size={14}/> Valor (R$)</label>
                            <input name="valor" type="number" step="0.01" required value={despesa.valor} onChange={handleChange} className="w-full p-3 bg-red-50 border-2 border-red-100 rounded-xl font-black text-red-600" placeholder="0.00" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Calendar size={14}/> Vencimento</label>
                            <input name="vencimento" type="date" required value={despesa.vencimento} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fornecedor (Opcional)</label>
                            <input name="fornecedor" type="text" value={despesa.fornecedor} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl" placeholder="Ex: EDP, Senhorio..." />
                        </div>

                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-100">CANCELAR</button>
                        <button type="submit" disabled={salvando} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl flex items-center gap-2">
                            <Save size={20} /> {salvando ? 'REGISTRANDO...' : 'REGISTRAR DESPESA'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
