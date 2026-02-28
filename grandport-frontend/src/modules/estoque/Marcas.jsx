import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Tag, Plus, Save, X, Edit, Trash2 } from 'lucide-react';

export const Marcas = () => {
    const [marcas, setMarcas] = useState([]);
    const [exibirCadastro, setExibirCadastro] = useState(false);
    const [novaMarca, setNovaMarca] = useState({ nome: '' });

    const carregarMarcas = async () => {
        try {
            const res = await api.get('/api/marcas');
            setMarcas(res.data);
        } catch (error) {
            console.error("Erro ao carregar marcas:", error);
        }
    };

    useEffect(() => { carregarMarcas(); }, []);

    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/marcas', novaMarca);
            alert('Marca cadastrada com sucesso!');
            setNovaMarca({ nome: '' });
            setExibirCadastro(false);
            carregarMarcas();
        } catch (error) {
            alert('Erro ao salvar marca: ' + error.message);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Tag className="text-purple-600" /> Gestão de Marcas
                </h1>
                <button 
                    onClick={() => setExibirCadastro(true)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 flex gap-2 items-center shadow-md transition-colors"
                >
                    <Plus size={20} /> Nova Marca
                </button>
            </div>

            {exibirCadastro && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-purple-100 animate-fade-in">
                    <h3 className="font-bold text-lg mb-4 text-gray-700">Cadastrar Nova Marca</h3>
                    <form onSubmit={handleSalvar} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Marca</label>
                            <input 
                                type="text" 
                                value={novaMarca.nome}
                                onChange={(e) => setNovaMarca({ ...novaMarca, nome: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                required
                                placeholder="Ex: Bosch, Cofap, Nakata..."
                                autoFocus
                            />
                        </div>
                        <button type="button" onClick={() => setExibirCadastro(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <Save size={18} /> Salvar
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Nome da Marca</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {marcas.map(m => (
                            <tr key={m.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-gray-500 w-20">#{m.id}</td>
                                <td className="p-4 font-bold text-gray-800">{m.nome}</td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"><Edit size={18}/></button>
                                    <button className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                        {marcas.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500">
                                    Nenhuma marca cadastrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
