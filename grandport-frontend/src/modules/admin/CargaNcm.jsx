import React, { useState } from 'react';
import api from '../../api/axios';
import { FileJson, Upload, Loader2, Info, ExternalLink, AlertCircle, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';

// 🚀 IMPORTAMOS O COMPONENTE QUE CRIAMOS ACIMA
import { ListagemNcm } from './ListagemNcm';

export const CargaNcm = () => {
    // Estado para controlar as ABAS: 'upload' ou 'lista'
    const [abaAtiva, setAbaAtiva] = useState('upload');

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
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(response.data || "Base NCM atualizada com sucesso!", { id: toastId, duration: 5000 });
            setArquivo(null);

            // Depois que o upload termina, manda o usuário pra tela de listagem pra ele ver que deu certo!
            setAbaAtiva('lista');

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
        <div className="p-8 max-w-5xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-100px)]">

            {/* CABEÇALHO PRINCIPAL DA TELA */}
            <div className="flex items-center justify-between mb-8 relative shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                        <FileJson size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tabela NCM / IBPT</h1>
                        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Gestão de Nomenclatura Comum do Mercosul</p>
                    </div>
                </div>

                {/* BOTÕES DE ABAS */}
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                    <button
                        onClick={() => setAbaAtiva('upload')}
                        className={`px-6 py-3 font-black text-xs uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${abaAtiva === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Upload size={16} /> Atualizar Base
                    </button>
                    <button
                        onClick={() => setAbaAtiva('lista')}
                        className={`px-6 py-3 font-black text-xs uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${abaAtiva === 'lista' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ListFilter size={16} /> Consultar NCMs
                    </button>
                </div>
            </div>

            {/* CONTEÚDO DINÂMICO BASEADO NA ABA ESCOLHIDA */}
            <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 flex-1 flex flex-col overflow-hidden">

                {abaAtiva === 'upload' && (
                    <div className="max-w-2xl mx-auto w-full animate-fade-in flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800">Carga do Arquivo JSON</h2>
                            <div className="relative group cursor-pointer flex items-center">
                                <Info size={20} className="text-slate-400 hover:text-indigo-500 transition-colors" />
                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl z-50 text-center leading-relaxed">
                                    Mantenha os NCMs do seu ERP sempre atualizados com a SEFAZ para evitar rejeições de NF-e.
                                    <div className="absolute top-full right-2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                        </div>

                        {/* Guia Rápido de Download do Portal Único */}
                        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-inner">
                            <h3 className="text-blue-800 font-black text-sm flex items-center gap-2 mb-3 tracking-widest uppercase">
                                <ExternalLink size={16} /> Onde conseguir o arquivo?
                            </h3>
                            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2 font-medium">
                                <li>Acesse o <a href="https://portalunico.siscomex.gov.br/classif/#/nomenclatura/tabela?perfil=publico" target="_blank" rel="noopener noreferrer" className="font-black text-blue-900 underline hover:text-indigo-600 transition-colors">Portal Único Siscomex</a>.</li>
                                <li>No menu de download ou exportação, marque a opção <strong className="bg-blue-200 px-1 rounded">Tabela Vigente</strong>.</li>
                                <li>Escolha o formato <strong className="bg-blue-200 px-1 rounded">JSON</strong> e salve no seu computador.</li>
                            </ol>
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
                                {arquivo ? arquivo.name : "Clique ou arraste o arquivo NCM"}
                            </p>

                            {arquivo ? (
                                <p className="text-sm font-bold text-indigo-600 bg-indigo-100 py-1 px-3 rounded-full inline-block">
                                    Arquivo pronto para envio
                                </p>
                            ) : (
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <AlertCircle size={14}/> APENAS FORMATO .JSON
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
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 hover:-translate-y-1'
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
                )}

                {/* CHAMA O COMPONENTE DE LISTAGEM */}
                {abaAtiva === 'lista' && (
                    <ListagemNcm />
                )}

            </div>
        </div>
    );
};