import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Tags, Plus, Search, Edit, Trash2, CheckCircle, Ban, X, Save } from 'lucide-react';

export const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);

    const formInicial = { id: '', nome: '', ativo: true };
    const [form, setForm] = useState(formInicial);

    const carregarCategorias = async () => {
        try {
            // Se o seu backend suportar busca por nome na rota GET, ele passa o parâmetro
            const response = await api.get(busca ? `/api/categorias?busca=${busca}` : '/api/categorias');
            setCategorias(response.data);
        } catch (error) {
            toast.error('Não foi possível carregar as categorias.');
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => { carregarCategorias(); }, 300);
        return () => clearTimeout(delay);
    }, [busca]);

    const abrirNovo = () => {
        setForm(formInicial);
        setModalAberto(true);
    };

    const abrirEditar = (cat) => {
        setForm({ id: cat.id, nome: cat.nome, ativo: cat.ativo !== false });
        setModalAberto(true);
    };

    const salvarCategoria = async (e) => {
        e.preventDefault();

        if (!form.nome.trim()) {
            toast.error('O nome da categoria é obrigatório.');
            return;
        }

        const toastId = toast.loading('Salvando categoria...');

        try {
            const payload = { ...form, nome: form.nome.toUpperCase() };

            if (form.id) {
                await api.put(`/api/categorias/${form.id}`, payload);
                toast.success('Categoria atualizada com sucesso!', { id: toastId });
            } else {
                delete payload.id;
                await api.post('/api/categorias', payload);
                toast.success('Categoria cadastrada com sucesso!', { id: toastId });
            }

            setModalAberto(false);
            carregarCategorias();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar categoria.', { id: toastId });
        }
    };

    const deletarCategoria = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja excluir a categoria "${nome}"? Produtos vinculados a ela podem ficar sem categoria.`)) {
            return;
        }

        const toastId = toast.loading('Excluindo...');
        try {
            await api.delete(`/api/categorias/${id}`);
            toast.success('Categoria excluída com sucesso!', { id: toastId });
            carregarCategorias();
        } catch (error) {
            toast.error('Não é possível excluir esta categoria pois ela já está em uso.', { id: toastId });
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Tags className="text-purple-600 bg-purple-100 p-1 rounded-lg" size={36} />
                        CATEGORIAS
                    </h1>
                    <p className="text-slate-500 mt-1">Organize seus produtos por famílias e grupos</p>
                </div>
                <button onClick={abrirNovo} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg transition-transform transform hover:scale-105">
                    <Plus size={20} /> NOVA CATEGORIA
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar categoria..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 outline-none font-bold" />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                        <th className="p-4 pl-8 w-20">ID</th>
                        <th className="p-4">Nome da Categoria</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center pr-8 w-32">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {categorias.map(cat => (
                        <tr key={cat.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-8 font-mono text-xs text-slate-400">#{cat.id}</td>
                            <td className="p-4 font-black text-slate-700">{cat.nome}</td>
                            <td className="p-4 text-center">
                                {cat.ativo !== false ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black"><CheckCircle size={14}/> Ativo</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-black"><Ban size={14}/> Inativo</span>
                                )}
                            </td>
                            <td className="p-4 pr-8 text-center flex justify-center gap-2">
                                <button onClick={() => abrirEditar(cat)} title="Editar" className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit size={18}/></button>
                                <button onClick={() => deletarCategoria(cat.id, cat.nome)} title="Excluir" className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button>
                            </td>
                        </tr>
                    ))}
                    {categorias.length === 0 && (
                        <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Nenhuma categoria encontrada.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CADASTRO / EDIÇÃO */}
            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
                        <div className="p-6 bg-purple-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <Tags className="text-purple-300" size={20} />
                                {form.id ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button onClick={() => setModalAberto(false)} className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={e => setForm({...form, nome: e.target.value})}
                                    className="w-full p-4 border-2 rounded-xl font-black text-lg focus:border-purple-500 outline-none uppercase bg-slate-50 focus:bg-white"
                                    placeholder="Ex: SUSPENSÃO"
                                    autoFocus
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-700 bg-slate-50 p-4 border-2 border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                                <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} className="w-6 h-6 rounded cursor-pointer accent-purple-600" />
                                Categoria Ativa
                            </label>
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t">
                            <button onClick={() => setModalAberto(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={salvarCategoria} className="px-8 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2">
                                <Save size={20}/> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};