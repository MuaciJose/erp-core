import React, { useState, useEffect } from 'react';
import { X, Save, Printer } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const EspelhoNotaModal = ({ importacao, onClose, onSaveSuccess }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(false);
    const isFinalizado = importacao.status === "Finalizado";

    useEffect(() => {
        if (importacao.produtosImportados) {
            setProdutos(importacao.produtosImportados.map(p => ({
                ...p,
                novoPrecoVenda: p.precoVenda || 0,
                margem: p.precoCusto > 0 ? ((p.precoVenda / p.precoCusto - 1) * 100) : 0
            })));
        }
    }, [importacao]);

    const handlePrecoChange = (id, valor) => {
        const preco = parseFloat(valor) || 0;
        setProdutos(produtos.map(p => p.id === id ? { ...p, novoPrecoVenda: preco, margem: p.precoCusto > 0 ? ((preco / p.precoCusto - 1) * 100) : 0 } : p));
    };

    const handleMargemChange = (id, valor) => {
        const margem = parseFloat(valor) || 0;
        setProdutos(produtos.map(p => p.id === id ? { ...p, margem, novoPrecoVenda: p.precoCusto * (1 + margem / 100) } : p));
    };

    const salvarPrecos = async () => {
        setLoading(true);
        try {
            const payload = produtos.map(p => ({ id: p.id, novoPrecoVenda: p.novoPrecoVenda }));
            await api.put('/api/produtos/atualizar-precos', payload);
            await api.patch(`/api/compras/${importacao.id}/finalizar`);
            toast.success("Nota Finalizada!");
            onSaveSuccess(); onClose();
        } catch (err) { toast.error("Erro ao salvar."); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>

            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden print-area">
                <div className="p-8 border-b flex justify-between bg-slate-50 no-print">
                    <h2 className="text-2xl font-black">Precificação: {importacao.numero}</h2>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="text-[10px] uppercase text-slate-400 font-black border-b">
                            <th className="pb-4">Produto</th>
                            <th className="pb-4 text-right">Custo</th>
                            <th className="pb-4 text-right no-print">Margem %</th>
                            <th className="pb-4 text-right">Preço de Venda</th>
                        </tr>
                        </thead>
                        <tbody>
                        {produtos.map(p => (
                            <tr key={p.id} className="border-b">
                                <td className="py-4 font-bold text-sm">{p.nome}</td>
                                <td className="py-4 text-right font-black text-red-600">{p.precoCusto.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</td>
                                <td className="py-4 text-right no-print">
                                    <input type="number" disabled={isFinalizado} value={p.margem.toFixed(1)} onChange={e => handleMargemChange(p.id, e.target.value)} className="w-16 text-right font-bold bg-slate-50 p-1 rounded" />
                                </td>
                                <td className="py-4 text-right">
                                    <input type="number" disabled={isFinalizado} value={p.novoPrecoVenda.toFixed(2)} onChange={e => handlePrecoChange(p.id, e.target.value)} className="w-24 text-right font-black text-blue-600 bg-blue-50 p-1 rounded no-print" />
                                    <span className="hidden print:block font-black">{p.novoPrecoVenda.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t flex justify-end gap-4 bg-slate-50 no-print">
                    <button onClick={() => window.print()} className="px-6 py-3 bg-white border rounded-2xl font-bold flex items-center gap-2"><Printer size={20}/> IMPRIMIR</button>
                    {!isFinalizado && <button onClick={salvarPrecos} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg"><Save size={20}/> FINALIZAR NOTA</button>}
                </div>
            </div>
        </div>
    );
};