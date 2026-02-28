import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, Save, Percent, DollarSign, Printer } from 'lucide-react';

export const EspelhoNotaModal = ({ importacao, onClose }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (importacao && importacao.produtosImportados) {
            setProdutos(importacao.produtosImportados.map(p => ({
                ...p,
                novoPrecoVenda: p.precoVenda || 0,
                margem: p.precoCusto > 0 ? ((p.precoVenda / p.precoCusto - 1) * 100) : 0
            })));
        }
    }, [importacao]);

    const handlePrecoChange = (id, novoPreco) => {
        setProdutos(produtos.map(p => {
            if (p.id === id) {
                const preco = parseFloat(novoPreco) || 0;
                const margem = p.precoCusto > 0 ? ((preco / p.precoCusto - 1) * 100) : 0;
                return { ...p, novoPrecoVenda: preco, margem: margem };
            }
            return p;
        }));
    };

    const handleMargemChange = (id, novaMargem) => {
        setProdutos(produtos.map(p => {
            if (p.id === id) {
                const margem = parseFloat(novaMargem) || 0;
                const novoPreco = p.precoCusto * (1 + margem / 100);
                return { ...p, novoPrecoVenda: novoPreco, margem: margem };
            }
            return p;
        }));
    };

    const salvarPrecos = async () => {
        setLoading(true);
        try {
            const payload = produtos.map(p => ({
                id: p.id,
                novoPrecoVenda: p.novoPrecoVenda
            }));
            await api.put('/api/produtos/atualizar-precos', payload);
            alert("Preços atualizados com sucesso!");
            onClose();
        } catch (err) {
            console.error("Erro ao salvar preços:", err);
            alert("Erro ao salvar os novos preços.");
        } finally {
            setLoading(false);
        }
    };

    if (!importacao) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                <div className="p-6 border-b flex justify-between items-center no-print">
                    <h2 className="text-2xl font-black text-gray-800">Espelho da Nota e Precificação</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 print-area">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-3">Produto</th>
                                <th className="p-3">Custo (R$)</th>
                                <th className="p-3 no-print">Preço Venda Atual (R$)</th>
                                <th className="p-3 no-print">Margem (%)</th>
                                <th className="p-3">Novo Preço Venda (R$)</th>
                                <th className="p-3 no-print">Nova Margem (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produtos.map(p => (
                                <tr key={p.id} className="border-b">
                                    <td className="p-3 font-bold">{p.nome}</td>
                                    <td className="p-3">{p.precoCusto.toFixed(2)}</td>
                                    <td className="p-3 no-print">{p.precoVenda.toFixed(2)}</td>
                                    <td className="p-3 font-bold no-print">{p.margem.toFixed(2)}%</td>
                                    <td className="p-3">
                                        <div className="relative no-print">
                                            <DollarSign size={14} className="absolute left-2 top-3 text-gray-400" />
                                            <input 
                                                type="number"
                                                value={p.novoPrecoVenda.toFixed(2)}
                                                onChange={e => handlePrecoChange(p.id, e.target.value)}
                                                className="w-full pl-7 p-2 border rounded-md"
                                            />
                                        </div>
                                        <span className="hidden print:block">{p.novoPrecoVenda.toFixed(2)}</span>
                                    </td>
                                    <td className="p-3 no-print">
                                        <div className="relative">
                                            <Percent size={14} className="absolute left-2 top-3 text-gray-400" />
                                            <input 
                                                type="number"
                                                value={p.margem.toFixed(2)}
                                                onChange={e => handleMargemChange(p.id, e.target.value)}
                                                className="w-full pl-7 p-2 border rounded-md"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t flex justify-end gap-4 no-print">
                    <button onClick={() => window.print()} className="px-6 py-2 bg-gray-100 rounded-lg font-bold flex items-center gap-2">
                        <Printer /> IMPRIMIR
                    </button>
                    <button onClick={salvarPrecos} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
                        <Save /> {loading ? 'SALVANDO...' : 'SALVAR NOVOS PREÇOS'}
                    </button>
                </div>
            </div>
        </div>
    );
};
