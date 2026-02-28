import React, { useState } from 'react';
import api from '../../api/axios';
import { Database, UploadCloud, CheckCircle } from 'lucide-react';

export const CargaFiscal = () => {
    const [arquivo, setArquivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [concluido, setConcluido] = useState(false);

    const handleUploadNcm = async () => {
        if (!arquivo) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            // Endpoint que você já tem no Back-end para processar o JSON
            await api.post('/api/fiscal/importar-ncm', formData);
            setConcluido(true);
            setArquivo(null);
        } catch (err) {
            alert("Erro ao carregar base de NCM");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Database className="text-purple-600" /> Base Fiscal (NCM)
            </h1>

            <div className="bg-white p-6 rounded-xl shadow-md border">
                <p className="text-gray-600 mb-4 text-sm">
                    Carregue o arquivo JSON atualizado da SEFAZ para manter as alíquotas e códigos NCM em dia.
                </p>

                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                            {arquivo ? arquivo.name : "Selecionar arquivo ncm.json"}
                        </p>
                    </div>
                    <input type="file" className="hidden" accept=".json" onChange={(e) => setArquivo(e.target.files[0])} />
                </label>

                <button
                    onClick={handleUploadNcm}
                    disabled={!arquivo || loading}
                    className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
                >
                    {loading ? "Processando Banco de Dados..." : "Iniciar Carga Fiscal"}
                </button>

                {concluido && (
                    <div className="mt-4 flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle size={18} /> Base NCM atualizada com sucesso!
                    </div>
                )}
            </div>
        </div>
    );
};