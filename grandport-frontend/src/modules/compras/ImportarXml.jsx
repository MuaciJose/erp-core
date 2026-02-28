import React, { useState } from 'react';
import api from '../../api/axios';
import { UploadCloud, CheckCircle, PackagePlus, Building, DollarSign } from 'lucide-react';
import { EspelhoNotaModal } from './EspelhoNotaModal';

export const ImportarXml = () => {
    const [arquivo, setArquivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [showEspelho, setShowEspelho] = useState(false);

    const handleUpload = async () => {
        if (!arquivo) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            const res = await api.post('/api/compras/importar-xml', formData);
            setResultado(res.data);
        } catch (err) {
            console.error("Erro ao processar XML:", err);
            alert("Erro ao processar o XML da NF-e: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setArquivo(null);
        setResultado(null);
        setShowEspelho(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-black mb-6">Importação de NF-e (XML)</h1>

            {!resultado && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-blue-400 text-center">
                    <input type="file" accept=".xml" onChange={e => setArquivo(e.target.files[0])} className="mb-4" />
                    <button 
                        onClick={handleUpload}
                        disabled={loading || !arquivo}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:bg-gray-400"
                    >
                        <UploadCloud /> {loading ? 'LENDO E PROCESSANDO NF-E...' : 'PROCESSAR NOTA FISCAL'}
                    </button>
                </div>
            )}

            {resultado && (
                <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
                    <div className="flex items-center gap-3 text-green-600 mb-6 border-b pb-4">
                        <CheckCircle size={32} />
                        <h2 className="text-2xl font-black">Nota Fiscal Importada com Sucesso!</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h3 className="font-bold text-purple-700 flex items-center gap-2 mb-2"><Building size={18} /> FORNECEDOR</h3>
                            <p className="text-sm font-black text-slate-800">{resultado.fornecedor.nome}</p>
                            <p className="text-xs text-slate-500">CNPJ: {resultado.fornecedor.documento}</p>
                            {resultado.fornecedor.novo && <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded mt-2 inline-block">Cadastrado Automaticamente</span>}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2"><PackagePlus size={18} /> ESTOQUE</h3>
                            <p className="text-3xl font-black text-slate-800">{resultado.quantidadeProdutosCadastrados}</p>
                            <p className="text-xs text-slate-500">Peças atualizadas/cadastradas</p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><DollarSign size={18} /> FINANCEIRO GERADO</h3>
                            <p className="text-xl font-black text-slate-800">R$ {resultado.valorTotalNota.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">{resultado.parcelasGeradas.length} parcelas lançadas no Contas a Pagar</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button onClick={resetState} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300">
                            Importar outra Nota
                        </button>
                        <button 
                            onClick={() => setShowEspelho(true)}
                            className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold"
                        >
                            ABRIR ESPELHO E PRECIFICAÇÃO
                        </button>
                    </div>
                </div>
            )}

            {showEspelho && (
                <EspelhoNotaModal 
                    importacao={resultado} 
                    onClose={() => setShowEspelho(false)} 
                />
            )}
        </div>
    );
};
