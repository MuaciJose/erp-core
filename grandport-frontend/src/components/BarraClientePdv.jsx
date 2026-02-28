import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, UserPlus, Search, Loader2, X } from 'lucide-react';

export const BarraClientePdv = ({ onClienteSelecionado }) => {
    const [termo, setTermo] = useState("");
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState(null);

    const buscarParceiro = async () => {
        if (termo.length < 3) return;
        
        setLoading(true);
        try {
            const res = await api.get(`/api/parceiros?termo=${termo}`);
            console.log("Clientes encontrados:", res.data); // DEBUG
            
            if (res.data && res.data.length === 1) {
                const parceiroEncontrado = res.data[0];
                setCliente(parceiroEncontrado);
                onClienteSelecionado(parceiroEncontrado);
            } else {
                setCliente(null);
                onClienteSelecionado(null);
                if (res.data && res.data.length > 1) {
                    alert("Múltiplos clientes encontrados. Por favor, seja mais específico.");
                }
            }
        } catch (err) {
            console.error("Cliente não encontrado:", err);
            setCliente(null);
            onClienteSelecionado(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarParceiro();
        }
    };

    const limparSelecao = () => {
        setCliente(null);
        setTermo("");
        onClienteSelecionado(null);
    };

    return (
        <div className="bg-slate-800 p-2 px-4 flex items-center gap-4 border-b border-slate-700 print:hidden">
            <div className="flex items-center gap-2 text-blue-400">
                <Search size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Identificar Cliente</span>
            </div>

            <div className="flex-1 max-w-sm relative">
                <input 
                    type="text"
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite CPF, CNPJ ou Nome e pressione Enter..."
                    className="w-full bg-slate-900 border-none text-white text-sm p-2 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
                {loading && <Loader2 className="absolute right-3 top-2.5 animate-spin text-blue-500" size={18} />}
            </div>

            {cliente && (
                <div className="flex items-center gap-3 animate-fade-in">
                    <div className="h-8 w-[2px] bg-slate-600"></div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm leading-none flex items-center gap-1">
                            <UserCheck size={14} className="text-green-400" /> {cliente.nome}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">
                            {cliente.tipo}
                        </span>
                    </div>
                    <button 
                        onClick={limparSelecao}
                        className="text-red-400 hover:text-red-300 text-xs font-bold ml-2 flex items-center gap-1"
                    >
                        <X size={14} /> REMOVER
                    </button>
                </div>
            )}

            {!cliente && !loading && termo.length > 5 && (
                <button className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-bold transition-all">
                    <UserPlus size={12} /> CADASTRAR NOVO
                </button>
            )}
        </div>
    );
};
