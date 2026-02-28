import React, { useState } from 'react';
import api from '../../api/axios';
import { X, Save, Layers } from 'lucide-react';

export const ModalNovoPlanoConta = ({ contaPai, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        codigo: '',
        descricao: '',
        tipo: contaPai ? contaPai.tipo : 'RECEITA',
        aceitaLancamento: true,
        contaPaiId: contaPai ? contaPai.id : null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // No backend, o objeto PlanoConta tem uma relação ManyToOne com contaPai
            // Vamos enviar o ID e o backend cuidará de associar
            const payload = {
                codigo: form.codigo,
                descricao: form.descricao,
                tipo: form.tipo,
                aceitaLancamento: form.aceitaLancamento,
                contaPai: form.contaPaiId ? { id: form.contaPaiId } : null
            };

            await api.post('/api/planocontas', payload);
            alert("Conta cadastrada com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar conta no plano.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Layers className="text-purple-400" size={24} />
                        <div>
                            <h2 className="text-xl font-black tracking-widest">
                                {contaPai ? 'NOVA SUBCONTA' : 'NOVO GRUPO'}
                            </h2>
                            {contaPai && <p className="text-xs text-slate-400">Pai: {contaPai.codigo} - {contaPai.descricao}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Código</label>
                            <input 
                                type="text" 
                                required 
                                value={form.codigo}
                                onChange={e => setForm({...form, codigo: e.target.value})}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none font-mono" 
                                placeholder="1.1.1" 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição</label>
                            <input 
                                type="text" 
                                required 
                                value={form.descricao}
                                onChange={e => setForm({...form, descricao: e.target.value})}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none" 
                                placeholder="Ex: Venda de Peças" 
                            />
                        </div>
                    </div>

                    {!contaPai && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Natureza</label>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setForm({...form, tipo: 'RECEITA'})}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${form.tipo === 'RECEITA' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                >
                                    RECEITA
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setForm({...form, tipo: 'DESPESA'})}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${form.tipo === 'DESPESA' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                >
                                    DESPESA
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <input 
                            type="checkbox" 
                            id="aceitaLancamento"
                            checked={form.aceitaLancamento}
                            onChange={e => setForm({...form, aceitaLancamento: e.target.checked})}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="aceitaLancamento" className="text-sm font-bold text-blue-800 cursor-pointer">
                            Aceita lançamentos financeiros?
                            <span className="block text-[10px] font-normal text-blue-600 uppercase">Marque se for uma conta final (ex: Aluguel)</span>
                        </label>
                    </div>

                    <div className="flex gap-4 mt-8 pt-4 border-t">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">CANCELAR</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> {loading ? 'SALVANDO...' : 'SALVAR CONTA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
