import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, UserPlus, Search, Loader2, X, AlertCircle } from 'lucide-react';

export const BarraClientePdv = ({ onClienteSelecionado }) => {
    const [termo, setTermo] = useState("");
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    // 🚀 Máscara Inteligente para CPF/CNPJ
    const formatarDocumento = (doc) => {
        if (!doc) return null; // Retorna null para tratarmos a mensagem no HTML
        const d = doc.replace(/\D/g, "");

        if (d.length === 11) {
            return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        } else if (d.length === 14) {
            return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        }
        return d;
    };

    // 🔍 Função auxiliar para encontrar o documento no objeto, não importa o nome
    const extrairDocumento = (c) => {
        return c.cnpj || c.cpfCnpj || c.cpf_cnpj || c.documento || c.cpf || "";
    };

    useEffect(() => {
        const buscarDeformaDinamica = async () => {
            if (termo.length < 3 || cliente) {
                setResultados([]);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get(`/api/parceiros?termo=${termo}`);
                setResultados(res.data || []);
                setMostrarDropdown(true);
            } catch (err) {
                console.error("Erro na busca dinâmica");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(buscarDeformaDinamica, 400);
        return () => clearTimeout(timer);
    }, [termo, cliente]);

    const selecionarCliente = (c) => {
        // 🕵️‍♂️ DEBUG: Abre o F12 e veja o que aparece no Console se o documento sumir
        console.log("CLIENTE SELECIONADO (Objeto Completo):", c);

        setCliente(c);
        setTermo(c.nome);
        setResultados([]);
        setMostrarDropdown(false);
        onClienteSelecionado(c);
    };

    const limparSelecao = () => {
        setCliente(null);
        setTermo("");
        setResultados([]);
        onClienteSelecionado(null);
    };

    return (
        <div className="bg-slate-800 p-2 px-4 flex items-center gap-4 border-b border-slate-700 relative print:hidden">
            <div className="flex items-center gap-2 text-blue-400">
                <Search size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Identificar Cliente</span>
            </div>

            <div className="flex-1 max-w-sm relative">
                <input
                    type="text"
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    disabled={!!cliente}
                    placeholder="Digite Nome, CPF ou CNPJ..."
                    className="w-full bg-slate-900 border-none text-white text-sm p-2 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                />
                {loading && <Loader2 className="absolute right-3 top-2.5 animate-spin text-blue-500" size={18} />}

                {/* DROPDOWN DE RESULTADOS */}
                {mostrarDropdown && termo.length >= 3 && !cliente && (
                    <div className="absolute top-full left-0 right-0 bg-slate-900 border border-slate-700 mt-1 rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto">
                        {resultados.length > 0 ? (
                            resultados.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => selecionarCliente(c)}
                                    className="p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors"
                                >
                                    <div>
                                        <p className="text-white font-bold text-xs uppercase">{c.nome}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {formatarDocumento(extrairDocumento(c)) || 'SEM DOCUMENTO'}
                                        </p>
                                    </div>
                                    <UserCheck size={14} className="text-slate-500" />
                                </div>
                            ))
                        ) : (
                            !loading && (
                                <div className="p-4 text-center">
                                    <p className="text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                                        <AlertCircle size={14} /> CLIENTE NÃO ENCONTRADO
                                    </p>
                                    <button className="mt-2 text-[10px] bg-blue-600 text-white px-3 py-1 rounded font-bold uppercase">
                                        Cadastrar Novo
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* FEEDBACK DO CLIENTE SELECIONADO */}
            {cliente && (
                <div className="flex items-center gap-3 animate-fade-in bg-slate-700/30 p-1 pr-3 rounded-lg border border-green-500/30">
                    <div className="flex flex-col">
                        <span className="text-green-400 font-black text-sm uppercase">
                             {cliente.nome}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                            {/* 🎯 CORREÇÃO FINAL: Tenta extrair de qualquer campo possível */}
                            DOC: {formatarDocumento(extrairDocumento(cliente)) || 'NÃO CADASTRADO'}
                        </span>
                    </div>
                    <button onClick={limparSelecao} className="text-slate-400 hover:text-red-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};