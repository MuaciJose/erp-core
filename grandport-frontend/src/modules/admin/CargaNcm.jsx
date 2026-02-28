import React, { useState } from 'react';
import api from '../../api/axios';
import { FileJson, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const CargaNcm = () => {
    const [arquivo, setArquivo] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, carregando, sucesso, erro
    const [mensagem, setMensagem] = useState('');

    const selecionarArquivo = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/json") {
            setArquivo(file);
            setStatus('idle');
        } else {
            alert("Por favor, selecione um arquivo no formato .json");
        }
    };

    const realizarUpload = async () => {
        if (!arquivo) return;

        const formData = new FormData();
        formData.append('file', arquivo);

        setStatus('carregando');

        try {
            // Ajustado para o endpoint correto do NcmController
            const response = await api.post('/api/ncm/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatus('sucesso');
            setMensagem(response.data);
            setArquivo(null);
        } catch (err) {
            setStatus('erro');
            setMensagem("Falha ao processar o arquivo. " + (err.response?.data || err.message));
            console.error(err);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <FileJson className="text-purple-600" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Carga de Base NCM</h1>
                        <p className="text-sm text-gray-500">Atualize a tabela fiscal do sistema via JSON</p>
                    </div>
                </div>

                {/* Área de Drop/Seleção */}
                <div className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                    arquivo ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                }`}>
                    <input 
                        type="file" 
                        accept=".json" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={selecionarArquivo}
                    />
                    <Upload className={`mx-auto mb-4 ${arquivo ? 'text-purple-600' : 'text-gray-400'}`} size={40} />
                    <p className="text-lg font-medium text-gray-700">
                        {arquivo ? arquivo.name : "Clique ou arraste o arquivo ncm.json"}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 text-uppercase font-bold">Apenas arquivos JSON são aceitos</p>
                </div>

                {/* Botão de Ação */}
                <button 
                    onClick={realizarUpload}
                    disabled={!arquivo || status === 'carregando'}
                    className={`w-full mt-6 py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all ${
                        status === 'carregando' ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 shadow-lg'
                    }`}
                >
                    {status === 'carregando' ? (
                        <><Loader2 className="animate-spin" /> Salvando no Banco de Dados...</>
                    ) : (
                        "INICIAR PROCESSAMENTO"
                    )}
                </button>

                {/* Feedbacks de Status */}
                {status === 'sucesso' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
                        <CheckCircle size={20} />
                        <span className="font-medium">{mensagem}</span>
                    </div>
                )}

                {status === 'erro' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span className="font-medium">{mensagem}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
