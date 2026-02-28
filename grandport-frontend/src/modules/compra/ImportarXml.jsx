import React, { useState } from 'react';
import api from '../../api/axios';
import { FileUp, CheckCircle, AlertTriangle } from 'lucide-react';

export const ImportarXml = () => {
    const [arquivo, setArquivo] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error

    const handleUpload = async () => {
        if (!arquivo) return;
        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            await api.post('/api/compras/importar-xml', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus('success');
            setArquivo(null);
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Importar Nota Fiscal (XML)</h1>

            <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                arquivo ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}>
                <input
                    type="file"
                    accept=".xml"
                    className="hidden"
                    id="xml-upload"
                    onChange={(e) => setArquivo(e.target.files[0])}
                />
                <label htmlFor="xml-upload" className="cursor-pointer flex flex-col items-center">
                    <FileUp size={48} className="text-gray-400 mb-4" />
                    <span className="text-lg font-medium">
                        {arquivo ? arquivo.name : "Clique para selecionar o XML da Nota"}
                    </span>
                    <span className="text-sm text-gray-500">Padrão SEFAZ (.xml)</span>
                </label>
            </div>

            <button
                onClick={handleUpload}
                disabled={!arquivo || status === 'uploading'}
                className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all ${
                    status === 'uploading' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {status === 'uploading' ? 'Processando Nota...' : 'Confirmar Entrada de Estoque'}
            </button>

            {status === 'success' && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex gap-2 items-center">
                    <CheckCircle size={20} /> Nota importada! Estoque e financeiro atualizados.
                </div>
            )}
        </div>
    );
};