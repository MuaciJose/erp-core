import React, { useState } from 'react';
import api from '../../api/axios';
import { FileJson, Upload, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const CargaNcm = () => {
    const [arquivo, setArquivo] = useState(null);
    const [carregando, setCarregando] = useState(false);

    const selecionarArquivo = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === "application/json" || file.name.endsWith('.json')) {
                setArquivo(file);
            } else {
                toast.error("Por favor, selecione um arquivo no formato .json");
            }
        }
    };

    const realizarUpload = async () => {
        if (!arquivo) return;

        const formData = new FormData();
        formData.append('file', arquivo);

        setCarregando(true);
        const toastId = toast.loading("Enviando e atualizando base NCM. Isso pode demorar alguns minutos...");

        try {
            const response = await api.post('/api/ncm/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(response.data || "Base NCM atualizada com sucesso!", { id: toastId, duration: 5000 });
            setArquivo(null);

            const fileInput = document.getElementById('file-upload');
            if(fileInput) fileInput.value = '';

        } catch (err) {
            console.error(err);
            const erroMsg = err.response?.data || err.message;
            toast.error("Falha ao processar o arquivo: " + erroMsg, { id: toastId, duration: 6000 });
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">

                {/* Cabeçalho com Tooltip de Informação */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                            <FileJson className="text-indigo-600" size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-slate-800">Carga de Base NCM</h1>

                                {/* TOOLTIP */}
                                <div className="relative group cursor-pointer flex items-center">
                                    <Info size={20} className="text-slate-400 hover:text-indigo-500 transition-colors" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl z-50 text-center leading-relaxed">
                                        Faça o upload do arquivo JSON (tabela IBPT) para manter os NCMs e as alíquotas do seu ERP sempre atualizados com a SEFAZ. O sistema atualizará os códigos existentes automaticamente.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </div>

                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-1">Atualize a tabela fiscal via arquivo JSON</p>
                        </div>
                    </div>
                </div>

                {/* Área de Drop/Seleção */}
                <div className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                    arquivo ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".json"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={selecionarArquivo}
                        disabled={carregando}
                    />
                    <Upload className={`mx-auto mb-4 transition-colors ${arquivo ? 'text-indigo-600' : 'text-slate-400'}`} size={48} />

                    <p className="text-xl font-black text-slate-700 mb-2">
                        {arquivo ? arquivo.name : "Clique ou arraste o arquivo IBPT/NCM"}
                    </p>

                    {arquivo ? (
                        <p className="text-sm font-bold text-indigo-600 bg-indigo-100 py-1 px-3 rounded-full inline-block">
                            Arquivo pronto para envio
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            APENAS FORMATO .JSON
                        </p>
                    )}
                </div>

                {/* Botão de Upload */}
                <div className="relative group mt-8">
                    <button
                        onClick={realizarUpload}
                        disabled={!arquivo || carregando}
                        className={`w-full py-4 rounded-2xl font-black text-white flex justify-center items-center gap-3 transition-all ${
                            carregando
                                ? 'bg-slate-400 cursor-not-allowed'
                                : !arquivo
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-1'
                        }`}
                    >
                        {carregando ? (
                            <><Loader2 className="animate-spin" size={24} /> PROCESSANDO ARQUIVO...</>
                        ) : (
                            "INICIAR PROCESSAMENTO"
                        )}
                    </button>

                    {!arquivo && !carregando && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xl z-50 text-center">
                            Selecione um arquivo .json primeiro para habilitar.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};