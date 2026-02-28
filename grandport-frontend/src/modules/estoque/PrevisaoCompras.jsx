import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ShoppingBasket, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export const PrevisaoCompras = () => {
    const [previsoes, setPrevisoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarPrevisoes = async () => {
            try {
                const res = await api.get('/api/estoque/previsao-reposicao');
                setPrevisoes(res.data);
            } catch (error) {
                console.error("Erro ao carregar previsões:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarPrevisoes();
    }, []);

    if (loading) return <div className="p-8 text-center">Analisando giro de estoque...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-black mb-2 flex items-center gap-2 text-gray-800">
                <ShoppingBasket className="text-orange-600" /> PLANEJAMENTO DE COMPRAS
            </h1>
            <p className="text-gray-500 mb-8 italic">Sugestões baseadas no seu giro de estoque dos últimos 30 dias.</p>

            <div className="grid grid-cols-1 gap-4">
                {previsoes.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">Nenhuma sugestão de compra no momento. Estoque parece saudável.</p>
                ) : (
                    previsoes.map((item) => (
                        <div key={item.produtoId} className={`p-5 rounded-2xl border-2 flex items-center justify-between bg-white shadow-sm ${
                            item.diasRestantes <= 7 ? 'border-red-200 bg-red-50' : 'border-gray-100'
                        }`}>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800">{item.nome}</h3>
                                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1" title="Média de Vendas Diárias"><TrendingUp size={14}/> {item.mediaVendaDiaria.toFixed(2)}/dia</span>
                                    <span className="flex items-center gap-1" title="Previsão de duração do estoque atual"><Calendar size={14}/> {item.diasRestantes} dias</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Estoque</p>
                                    <p className={`text-xl font-black ${item.estoqueAtual <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {item.estoqueAtual}
                                    </p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center min-w-[140px]">
                                    <p className="text-[10px] text-orange-600 font-bold uppercase">Sugestão Compra</p>
                                    <p className="text-2xl font-black text-orange-700">+{item.sugestaoCompra}</p>
                                </div>

                                {item.diasRestantes <= 7 && (
                                    <div className="animate-pulse">
                                        <AlertCircle className="text-red-600" size={32} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
