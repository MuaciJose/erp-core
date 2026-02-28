import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Loader2 } from 'lucide-react';

export const BuscaParceiroModal = ({ isOpen, onClose, onSelect }) => {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setBusca('');
            setResultados([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            if (busca.length > 1) {
                setLoading(true);
                try {
                    const res = await api.get(`/api/parceiros?termo=${busca}`);
                    setResultados(res.data);
                } catch (error) {
                    console.error("Erro ao buscar parceiro:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResultados([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [busca, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[100] pt-20">
            <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Selecionar Cliente</h2>
                <div className="relative">
                    <input 
                        type="text"
                        className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o nome, CPF ou CNPJ do cliente..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        autoFocus
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400">
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                    </div>
                </div>

                <div className="mt-4 max-h-80 overflow-y-auto">
                    {resultados.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => onSelect(p)}
                            className="p-4 border-b hover:bg-blue-50 cursor-pointer"
                        >
                            <p className="font-bold text-gray-900">{p.nome}</p>
                            <p className="text-sm text-gray-500">{p.documento}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg font-bold">
                        Fechar (ESC)
                    </button>
                </div>
            </div>
        </div>
    );
};
