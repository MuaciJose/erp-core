import React, { useState } from 'react';
import api from '../../api/axios';
import { Save, X, Upload, Loader2 } from 'lucide-react';

export const CriarProduto = ({ onSucesso, onCancelar }) => {
    const [form, setForm] = useState({
        sku: '',
        nome: '',
        descricao: '',
        aplicacao: '',
        localizacao: '',
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
    const [sugestoesNcm, setSugestoesNcm] = useState([]);
    const [buscandoNcm, setBuscarNcm] = useState(false);

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

    const buscarNcmNoBanco = async (termo) => {
        if (termo.length > 2) {
            setBuscarNcm(true);
            try {
                const res = await api.get(`/api/ncm/busca?q=${termo}`);
                console.log("NCMs encontrados:", res.data);
                setSugestoesNcm(res.data);
            } catch (error) {
                console.error("Erro ao buscar NCM:", error);
                setSugestoesNcm([]);
            } finally {
                setBuscarNcm(false);
            }
        } else {
            setSugestoesNcm([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('produto', new Blob([JSON.stringify(form)], { type: 'application/json' }));
        
        if (imagem) {
            formData.append('image', imagem);
        }

        try {
            await api.post('/api/produtos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Produto cadastrado com sucesso!');
            onSucesso();
        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar produto: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Novo Produto</h2>
                <button onClick={onCancelar} className="text-gray-500 hover:text-red-500">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna da Esquerda: Dados Básicos */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição da Peça</label>
                        <input name="nome" value={form.nome} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required placeholder="Ex: Amortecedor Dianteiro - Marca Bosch" />
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Compatibilidade / Veículos</label>
                        <textarea name="aplicacao" value={form.aplicacao} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" rows="2" placeholder="Ex: Uno Mille, Palio G3, Strada" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Marca (ID)</label>
                            <input name="marcaId" type="number" value={form.marcaId} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required placeholder="Ex: 1" />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 flex justify-between">
                                NCM (Fiscal)
                                {buscandoNcm && <Loader2 size={14} className="animate-spin text-blue-600" />}
                            </label>
                            <input 
                                name="ncmCodigo" 
                                type="text" 
                                value={form.ncmCodigo}
                                onChange={(e) => {
                                    setForm(prev => ({ ...prev, ncmCodigo: e.target.value }));
                                    buscarNcmNoBanco(e.target.value);
                                }}
                                className="mt-1 block w-full border rounded-md p-2" 
                                required 
                                placeholder="Ex: 8708..." 
                                autoComplete="off"
                            />
                            
                            {sugestoesNcm.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1 left-0">
                                    {sugestoesNcm.map((n, index) => {
                                        const codigo = n.Codigo || n.codigo;
                                        const descricao = n.Descricao || n.descricao;
                                        
                                        return (
                                            <li 
                                                key={codigo || index}
                                                onClick={() => {
                                                    setForm(prev => ({ ...prev, ncmCodigo: codigo }));
                                                    setSugestoesNcm([]);
                                                }}
                                                title={`${codigo} - ${descricao}`} // Tooltip nativo com o texto completo
                                                className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 flex flex-col group"
                                            >
                                                <span className="font-bold text-blue-700">{codigo}</span>
                                                <span className="text-gray-600 text-xs truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:h-auto">
                                                    {descricao}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Preços, Estoque e Imagem */}
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
                            <label className="block text-sm font-medium text-gray-700">Estoque Inicial</label>
                            <input name="quantidadeEstoque" type="number" value={form.quantidadeEstoque} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                            <input name="estoqueMinimo" type="number" value={form.estoqueMinimo} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <label className="block text-sm font-bold text-orange-800 uppercase">
                            Endereçamento (Localização no Depósito)
                        </label>
                        <input 
                            name="localizacao" 
                            type="text" 
                            value={form.localizacao}
                            onChange={handleChange}
                            className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono mt-1" 
                            placeholder="Ex: CORREDOR B - ESTANTE 02 - NÍVEL 3" 
                        />
                        <p className="text-[10px] text-orange-600 mt-1">
                            * Esta informação aparecerá no telemóvel do estoquista para facilitar a recolha.
                        </p>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto (URL ou Upload)</label>
                        
                        <input name="fotoUrl" type="text" value={form.fotoUrl} onChange={handleChange} className="mb-4 block w-full border rounded-md p-2" placeholder="https://link-da-imagem.com/foto.jpg" />

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors relative">
                            {form.fotoUrl ? (
                                <img src={form.fotoUrl} alt="Preview URL" className="mx-auto h-40 object-contain mb-4" />
                            ) : preview ? (
                                <img src={preview} alt="Preview Upload" className="mx-auto h-40 object-contain mb-4" />
                            ) : (
                                <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                            )}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
                    <button type="button" onClick={onCancelar} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save size={20} /> Salvar Produto
                    </button>
                </div>
            </form>
        </div>
    );
};
