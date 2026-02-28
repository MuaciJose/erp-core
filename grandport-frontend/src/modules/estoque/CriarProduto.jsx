import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, X, Upload } from 'lucide-react';
import { Autocomplete } from '../../components/Autocomplete';

export const CriarProduto = ({ onSucesso, onCancelar, produtoParaEditar }) => {
    const [form, setForm] = useState({
        sku: '',
        nome: '',
        descricao: '',
        aplicacao: '',
        localizacao: '',
        referenciaOriginal: '',
        codigoBarras: '',
        precoCusto: '',
        precoVenda: '',
        quantidadeEstoque: '',
        estoqueMinimo: 5,
        marcaId: '',
        ncmCodigo: '',
        fotoUrl: ''
    });
    const [imagem, setImagem] = useState(null);
    const [preview, setPreview] = useState(null);
    const isEditing = !!produtoParaEditar;

    useEffect(() => {
        if (isEditing) {
            setForm({
                sku: produtoParaEditar.sku || '',
                nome: produtoParaEditar.nome || '',
                descricao: produtoParaEditar.descricao || '',
                aplicacao: produtoParaEditar.aplicacao || '',
                localizacao: produtoParaEditar.localizacao || '',
                referenciaOriginal: produtoParaEditar.referenciaOriginal || '',
                codigoBarras: produtoParaEditar.codigoBarras || '',
                precoCusto: produtoParaEditar.precoCusto || '',
                precoVenda: produtoParaEditar.precoVenda || '',
                quantidadeEstoque: produtoParaEditar.quantidadeEstoque || '',
                estoqueMinimo: produtoParaEditar.estoqueMinimo || 5,
                marcaId: produtoParaEditar.marca?.id || '',
                ncmCodigo: produtoParaEditar.ncm?.codigo || '',
                fotoUrl: produtoParaEditar.fotoUrl || ''
            });
            setPreview(produtoParaEditar.fotoUrl || produtoParaEditar.fotoLocalPath);
        }
    }, [produtoParaEditar, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const buscarNcm = async (termo) => {
        const res = await api.get(`/api/ncm/busca?q=${termo}`);
        return res.data;
    };

    const buscarMarca = async (termo) => {
        const res = await api.get(`/api/marcas/buscar?nome=${termo}`);
        return res.data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.marcaId || !form.ncmCodigo) {
            alert("Marca e NCM são obrigatórios.");
            return;
        }

        const formData = new FormData();
        formData.append('produto', new Blob([JSON.stringify(form)], { type: 'application/json' }));
        
        if (imagem) {
            formData.append('image', imagem);
        }

        try {
            if (isEditing) {
                // O endpoint de atualização também precisa ser multipart
                await api.put(`/api/produtos/${produtoParaEditar.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Produto atualizado com sucesso!');
            } else {
                await api.post('/api/produtos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Produto cadastrado com sucesso!');
            }
            onSucesso();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar produto: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={onCancelar} className="text-gray-500 hover:text-red-500">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna da Esquerda */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição da Peça</label>
                        <input name="nome" value={form.nome} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SKU</label>
                            <input name="sku" value={form.sku} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">EAN (Código de Barras)</label>
                            <input name="codigoBarras" value={form.codigoBarras} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <label className="block text-sm font-bold text-blue-800 uppercase">Referência Original</label>
                        <input name="referenciaOriginal" type="text" value={form.referenciaOriginal} onChange={handleChange} className="w-full p-3 border-2 border-blue-300 rounded-lg font-mono mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Compatibilidade / Veículos</label>
                        <textarea name="aplicacao" value={form.aplicacao} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" rows="2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Autocomplete label="Fabricante (Marca)" placeholder="Digite para buscar..." onSearch={buscarMarca} onSelect={(m) => setForm(prev => ({ ...prev, marcaId: m ? m.id : '' }))} displayValue={(m) => m?.nome || ''} initialValue={produtoParaEditar?.marca} />
                        <Autocomplete label="NCM (Fiscal)" placeholder="Ex: 8708..." onSearch={buscarNcm} onSelect={(n) => setForm(prev => ({ ...prev, ncmCodigo: n ? (n.Codigo || n.codigo) : '' }))} displayValue={(n) => n?.codigo || n?.Codigo || ''} initialValue={produtoParaEditar?.ncm} />
                    </div>
                </div>

                {/* Coluna da Direita */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço de Custo</label>
                            <input name="precoCusto" type="number" step="0.01" value={form.precoCusto} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço de Venda</label>
                            <input name="precoVenda" type="number" step="0.01" value={form.precoVenda} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2 font-bold text-blue-600" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque</label>
                            <input name="quantidadeEstoque" type="number" value={form.quantidadeEstoque} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required disabled={isEditing} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                            <input name="estoqueMinimo" type="number" value={form.estoqueMinimo} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <label className="block text-sm font-bold text-orange-800 uppercase">Localização no Depósito</label>
                        <input name="localizacao" type="text" value={form.localizacao} onChange={handleChange} className="w-full p-3 border-2 border-orange-300 rounded-lg font-mono mt-1" />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto</label>
                        <input name="fotoUrl" type="text" value={form.fotoUrl} onChange={handleChange} className="mb-4 block w-full border rounded-md p-2" placeholder="https://link-da-imagem.com/foto.jpg" />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {preview ? <img src={preview} alt="Preview" className="mx-auto h-40 object-contain mb-4" /> : <Upload className="mx-auto text-gray-400 mb-2" size={48} />}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500" />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
                    <button type="button" onClick={onCancelar} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save size={20} /> {isEditing ? 'Salvar Alterações' : 'Salvar Produto'}
                    </button>
                </div>
            </form>
        </div>
    );
};
