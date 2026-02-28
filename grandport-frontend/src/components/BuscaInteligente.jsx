import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Search, Loader2 } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

export const BuscaInteligente = ({ onSelect }) => {
    const [busca, setBusca] = useState("");
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Atalho F2 para focar na busca
    useHotkeys('f2', (e) => {
        e.preventDefault();
        inputRef.current?.focus();
    });

    // Busca com debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (busca.length > 2 && !busca.includes('*')) {
                setLoading(true);
                try {
                    // Usa o endpoint de busca geral que já cobre nome, aplicação, ref original, etc.
                    const res = await api.get(`/api/produtos?busca=${busca}`);
                    setResultados(res.data);
                } catch (error) {
                    console.error("Erro na busca:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResultados([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            // Lógica para código de barras exato ou multiplicador (ex: 3*SKU)
            let qtd = 1;
            let termo = busca;

            if (busca.includes('*')) {
                const partes = busca.split('*');
                qtd = parseInt(partes[0], 10) || 1;
                termo = partes[1];
            }

            // Se houver apenas 1 resultado na lista visual, seleciona ele
            if (resultados.length === 1) {
                selecionarProduto(resultados[0], qtd);
                return;
            }

            // Tenta busca exata por código de barras
            try {
                const res = await api.get(`/api/produtos/barcode/${termo}`);
                selecionarProduto(res.data, qtd);
            } catch (err) {
                // Se não achou, mantém a lista aberta
            }
        }
    };

    const selecionarProduto = (produto, qtd = 1) => {
        onSelect(produto, qtd);
        setBusca("");
        setResultados([]);
        inputRef.current?.focus();
    };

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="relative z-20">
            <div className="relative">
                <input 
                    ref={inputRef}
                    type="text"
                    className="w-full p-4 pl-12 border-2 border-blue-500 rounded-lg text-xl shadow-inner focus:ring-4 focus:ring-blue-200 transition-all"
                    placeholder="Ex: 3*SKU123, 'Amortecedor Uno' ou bipe o código (F2)"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <div className="absolute left-4 top-4 text-blue-500">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
                </div>
            </div>

            {/* Lista de Sugestões */}
            {resultados.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 max-h-96 overflow-y-auto z-30">
                    {resultados.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => selecionarProduto(p)}
                            className="flex items-center gap-4 p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                            <img 
                                src={p.fotoUrl || 'https://via.placeholder.com/150'} 
                                className="w-16 h-16 rounded object-cover border border-gray-200 group-hover:border-blue-300" 
                                alt={p.nome} 
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-700">{p.nome}</h4>
                                    {p.referenciaOriginal && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono border border-blue-200">
                                            Ref: {p.referenciaOriginal}
                                        </span>
                                    )}
                                </div>
                                {p.aplicacao && (
                                    <p className="text-xs text-blue-600 uppercase font-bold mt-1">
                                        Aplica-se em: {p.aplicacao}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                    Marca: {p.marca?.nome || 'Genérica'} | SKU: {p.sku} | Estoque: {p.quantidadeEstoque}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-green-700 block">
                                    {formatCurrency(p.precoVenda)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
