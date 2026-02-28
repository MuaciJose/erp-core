import React, { useState } from 'react';
import api from '../../api/axios';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const ImportarXml = () => {
    const [arquivo, setArquivo] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [mensagem, setMensagem] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setArquivo(e.target.files[0]);
            setStatus('idle');
            setMensagem('');
        }
    };

    const handleUpload = async () => {
        if (!arquivo) return;

        const formData = new FormData();
        formData.append('file', arquivo);

        setStatus('uploading');

        try {
            await api.post('/api/compras/nfe/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setStatus('success');
            setMensagem('Nota Fiscal importada com sucesso! Estoque e Financeiro atualizados.');
        } catch (error) {
            setStatus('error');
            setMensagem('Erro ao importar XML: ' + (error.response?.data || error.message));
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <FileText className="text-blue-600" /> Importação de NF-e (XML)
            </h1>

            <div className="bg-white p-10 rounded-xl shadow-lg text-center border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                <Upload className="mx-auto text-gray-400 mb-4" size={64} />
                
                <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-block mb-4">
                        Selecionar Arquivo XML
                    </span>
                    <input id="file-upload" type="file" accept=".xml" className="hidden" onChange={handleFileChange} />
                </label>

                {arquivo && (
                    <p className="text-gray-600 font-medium">
                        Arquivo selecionado: <span className="text-blue-600">{arquivo.name}</span>
                    </p>
                )}

                {status === 'uploading' && (
                    <div className="mt-6 text-blue-600 font-bold animate-pulse">
                        Processando Nota Fiscal...
                    </div>
                )}

                {status === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle /> {mensagem}
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2">
                        <AlertCircle /> {mensagem}
                    </div>
                )}

                <button 
                    onClick={handleUpload}
                    disabled={!arquivo || status === 'uploading'}
                    className={`mt-8 w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                        !arquivo || status === 'uploading' 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                    }`}
                >
                    IMPORTAR NOTA
                </button>
            </div>

            <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">O que acontece ao importar?</h3>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>Novos produtos são cadastrados automaticamente.</li>
                    <li>O estoque de produtos existentes é atualizado.</li>
                    <li>O preço de custo é atualizado.</li>
                    <li>Uma conta a pagar é gerada no financeiro para o fornecedor.</li>
                </ul>
            </div>
        </div>
    );
};
