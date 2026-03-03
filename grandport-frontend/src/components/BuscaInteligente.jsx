import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Search, Loader2, Package } from 'lucide-react';
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

    // Busca por texto (com debounce para não travar o servidor)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            const termoLimpo = busca.trim();
            if (termoLimpo.length > 2 && !termoLimpo.includes('*')) {
                setLoading(true);
                try {
                    const res = await api.get(`/api/produtos?busca=${termoLimpo}`);
                    // PROTEÇÃO 1: Garante que só vai renderizar se for realmente uma Lista (Array)
                    setResultados(Array.isArray(res.data) ? res.data : []);
                } catch (error) {
                    console.error("Erro na busca:", error);
                    setResultados([]); // Limpa a lista em caso de erro para não dar tela branca
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
            e.preventDefault(); // PROTEÇÃO 2: Impede que a tela do navegador pisque ou recarregue

            const termoLimpo = busca.trim();
            if (!termoLimpo) return; // PROTEÇÃO 3: Ignora se apertar Enter com o campo vazio

            let qtd = 1;
            let termo = termoLimpo;

            // Identifica se o usuário usou o multiplicador (Ex: 3*7891020)
            if (termoLimpo.includes('*')) {
                const partes = termoLimpo.split('*');
                qtd = parseInt(partes[0], 10) || 1;
                termo = partes[1]?.trim();
            }

            if (!termo) return; // Se depois do * não tiver nada, cancela.

            // Se houver apenas 1 resultado na tela, seleciona ele automaticamente
            if (Array.isArray(resultados) && resultados.length === 1) {
                selecionarProduto(resultados[0], qtd);
                return;
            }

            // Busca exata pelo leitor de código de barras
            try {
                const res = await api.get(`/api/produtos/barcode/${termo}`);
                if (res.data && res.data.id) {
                    selecionarProduto(res.data, qtd);
                }
            } catch (err) {
                console.warn("Código de barras não encontrado.");
                // Mantém o texto na tela para o usuário ver o que bipou errado
            }
        }
    };

    const selecionarProduto = (produto, qtd = 1) => {
        if (!produto || !produto.id) return; // PROTEÇÃO 4: Garante que não vai mandar peça vazia pro carrinho
        onSelect(produto, qtd);
        setBusca("");
        setResultados([]);
        inputRef.current?.focus();
    };

    const formatCurrency = (value) => {
        const numeroLimpo = Number(value) || 0;
        return numeroLimpo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="relative z-20">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full p-4 pl-12 border-2 border-blue-500 rounded-lg text-xl shadow-inner focus:ring-4 focus:ring-blue-200 transition-all"
                    placeholder="Ex: 3*SKU123, 'Amortecedor' ou bipe o código (F2)"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <div className="absolute left-4 top-4 text-blue-500">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
                </div>
            </div>

            {/* Lista de Sugestões com proteção de Array */}
            {Array.isArray(resultados) && resultados.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-lg border border-gray-200 max-h-96 overflow-y-auto z-30">
                    {resultados.map(p => (
                        <div
                            key={p.id || Math.random()}
                            onClick={() => selecionarProduto(p)}
                            className="flex items-center gap-4 p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                            {p.fotoUrl ? (
                                <img
                                    src={p.fotoUrl}
                                    className="w-16 h-16 rounded object-cover border border-gray-200 group-hover:border-blue-300 flex-shrink-0"
                                    alt={p.nome || 'Produto'}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0 text-slate-400">
                                    <Package size={32} />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-700 truncate">{p.nome || 'Produto sem nome'}</h4>
                                    {p.referenciaOriginal && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono border border-blue-200">
                                            Ref: {p.referenciaOriginal}
                                        </span>
                                    )}
                                </div>
                                {p.aplicacao && (
                                    <p className="text-xs text-blue-600 uppercase font-bold mt-1 truncate">
                                        Aplica-se em: {p.aplicacao}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-1 truncate">
                                    Marca: {p.marca?.nome || 'Genérica'} | SKU: {p.sku || 'S/N'} | Estoque: {p.quantidadeEstoque || 0}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-xl font-black text-green-700 block">
                                    {formatCurrency(p.precoVenda || p.preco)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};