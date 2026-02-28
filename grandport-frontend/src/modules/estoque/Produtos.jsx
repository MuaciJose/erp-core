import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Package, Search, Edit, Trash2, Plus, History } from 'lucide-react';
import { CriarProduto } from './CriarProduto';
import { ExtratoEstoque } from './ExtratoEstoque';

export const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [busca, setBusca] = useState("");
    const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
    const [extratoAberto, setExtratoAberto] = useState(null);
    const [loading, setLoading] = useState(true);

    const carregarProdutos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/produtos');
            setProdutos(res.data);
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarProdutos(); }, []);

    const handleDeletar = async (produtoId) => {
        if (window.confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) {
            try {
                await api.delete(`/api/produtos/${produtoId}`);
                alert("Produto excluído com sucesso!");
                carregarProdutos(); // Recarrega a lista
            } catch (error) {
                console.error("Erro ao excluir produto:", error);
                alert("Erro ao excluir produto. Verifique se ele não está associado a vendas.");
            }
        }
    };

    const produtosFiltrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase()) || 
        (p.codigoBarras && p.codigoBarras.includes(busca)) ||
        (p.sku && p.sku.toLowerCase().includes(busca.toLowerCase()))
    );

    // Se um produto está em edição, mostra o formulário de criação/edição
    if (produtoEmEdicao) {
        return <CriarProduto 
                    produtoParaEditar={produtoEmEdicao.id ? produtoEmEdicao : null}
                    onSucesso={() => { setProdutoEmEdicao(null); carregarProdutos(); }} 
                    onCancelar={() => setProdutoEmEdicao(null)} 
                />;
    }

    // Se um extrato está aberto, mostra o extrato
    if (extratoAberto) {
        return <ExtratoEstoque 
                    produto={extratoAberto} 
                    onVoltar={() => setExtratoAberto(null)} 
                />;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Package className="text-blue-600" /> Cadastro de Peças
                </h1>
                <div className="flex gap-4">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, SKU ou código..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setProdutoEmEdicao({})} // Abre o form vazio para criar
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex gap-2 items-center shadow-md transition-colors"
                    >
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4">Peça</th>
                            <th className="p-4">NCM</th>
                            <th className="p-4">Custo</th>
                            <th className="p-4">Venda</th>
                            <th className="p-4">Estoque</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Carregando produtos...</td></tr>
                        ) : produtosFiltrados.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{p.nome}</td>
                                <td className="p-4 text-gray-500">{p.ncm ? p.ncm.codigo : '-'}</td>
                                <td className="p-4 text-gray-600">R$ {p.precoCusto ? p.precoCusto.toFixed(2) : '0.00'}</td>
                                <td className="p-4 text-blue-600 font-bold">R$ {p.precoVenda ? p.precoVenda.toFixed(2) : '0.00'}</td>
                                <td className={`p-4 font-bold ${p.quantidadeEstoque <= (p.estoqueMinimo || 5) ? 'text-red-500' : 'text-green-600'}`}>
                                    {p.quantidadeEstoque} un
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => setExtratoAberto(p)} className="p-2 hover:bg-purple-100 text-purple-600 rounded transition-colors" title="Ver Extrato de Estoque">
                                        <History size={18}/>
                                    </button>
                                    <button onClick={() => setProdutoEmEdicao(p)} className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors" title="Editar Produto">
                                        <Edit size={18}/>
                                    </button>
                                    <button onClick={() => handleDeletar(p.id)} className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors" title="Excluir Produto">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && produtosFiltrados.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum produto encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};
