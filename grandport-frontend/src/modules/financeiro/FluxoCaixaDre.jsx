import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    PieChart, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Calendar, 
    Target
} from 'lucide-react';

export const FluxoCaixaDre = () => {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)); // Padrão: Mês atual

    const carregarDre = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/financeiro/dre?mesAno=${mesAno}`);
            setDados(res.data);
        } catch (error) {
            console.error("Erro ao carregar DRE", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDre(); }, [mesAno]);

    if (loading) return <div className="p-8 font-bold text-gray-500 animate-pulse text-center">Calculando lucratividade...</div>;
    if (!dados) return <div className="p-8 text-center text-red-500">Erro ao carregar dados do DRE.</div>;

    const receitaLiquida = dados.receitaBruta - dados.devolucoesDescontos;
    const lucroBruto = receitaLiquida - dados.cmv;
    
    // Soma o total das despesas dinamicamente
    const totalDespesas = Object.values(dados.despesasOperacionais || {}).reduce((acc, val) => acc + val, 0);
    
    const lucroLiquido = lucroBruto - totalDespesas;
    const margemLiquida = dados.receitaBruta > 0 ? (lucroLiquido / dados.receitaBruta) * 100 : 0;

    const formatCurrency = (val) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <PieChart className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} /> 
                        RESULTADOS E DRE
                    </h1>
                    <p className="text-slate-500 mt-1">Demonstração do Resultado do Exercício - GrandPort</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border">
                    <Calendar className="text-gray-400 ml-2" size={20} />
                    <input 
                        type="month" 
                        value={mesAno}
                        onChange={(e) => setMesAno(e.target.value)}
                        className="p-2 outline-none font-bold text-slate-700 bg-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><TrendingUp size={16} className="text-green-500"/> Faturamento Bruto</p>
                    <h2 className="text-3xl font-black text-slate-800 mt-2">{formatCurrency(dados.receitaBruta)}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><TrendingDown size={16} className="text-red-500"/> Custos Totais</p>
                    <h2 className="text-3xl font-black text-slate-800 mt-2">{formatCurrency(dados.cmv + totalDespesas)}</h2>
                </div>
                <div className={`p-6 rounded-3xl shadow-lg text-white ${lucroLiquido >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                    <p className="text-sm font-bold text-white/80 uppercase flex items-center gap-2"><DollarSign size={16}/> Lucro Líquido Real</p>
                    <h2 className="text-4xl font-black mt-1">{formatCurrency(lucroLiquido)}</h2>
                    <p className="mt-2 text-sm font-bold bg-white/20 inline-block px-3 py-1 rounded-full">
                        Margem: {margemLiquida.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <h3 className="font-black text-lg flex items-center gap-2"><Target size={20} className="text-blue-400"/> DRE DETALHADO (CASCATA)</h3>
                </div>
                
                <div className="p-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl text-green-800">
                            <span className="font-black text-lg">(+) RECEITA BRUTA DE VENDAS</span>
                            <span className="font-black text-xl">{formatCurrency(dados.receitaBruta)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center px-4 text-red-500 font-bold border-b border-dashed pb-4">
                            <span>(-) Devoluções e Descontos</span>
                            <span>{formatCurrency(dados.devolucoesDescontos)}</span>
                        </div>

                        <div className="flex justify-between items-center px-4 text-slate-700 font-black text-lg pt-2">
                            <span>(=) RECEITA LÍQUIDA</span>
                            <span>{formatCurrency(receitaLiquida)}</span>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl text-orange-800 mt-4">
                            <div>
                                <span className="font-black text-lg block">(-) CMV (Custo da Mercadoria Vendida)</span>
                                <span className="text-xs">O valor de custo das peças que saíram do estoque</span>
                            </div>
                            <span className="font-black text-xl">{formatCurrency(dados.cmv)}</span>
                        </div>

                        <div className="flex justify-between items-center px-4 text-blue-700 font-black text-lg border-b border-dashed pb-4 pt-2">
                            <span>(=) LUCRO BRUTO</span>
                            <span>{formatCurrency(lucroBruto)}</span>
                        </div>

                        <div className="mt-6">
                            <span className="font-black text-lg text-slate-800 px-4 block mb-4">(-) DESPESAS OPERACIONAIS</span>
                            
                            {/* RENDERIZAÇÃO DINÂMICA DAS DESPESAS */}
                            <div className="space-y-2 px-8 text-slate-600 font-medium">
                                {Object.entries(dados.despesasOperacionais || {}).map(([nome, valor]) => (
                                    <div key={nome} className="flex justify-between border-b border-slate-100 pb-1 last:border-0">
                                        <span className="capitalize">{nome}</span>
                                        <span>{formatCurrency(valor)}</span>
                                    </div>
                                ))}
                                {Object.keys(dados.despesasOperacionais || {}).length === 0 && (
                                    <p className="text-sm text-slate-400 italic">Nenhuma despesa registrada neste período.</p>
                                )}
                            </div>

                            <div className="flex justify-between items-center px-4 text-red-600 font-bold border-b border-solid pb-4 pt-4 mt-2">
                                <span>Total de Despesas Operacionais</span>
                                <span>{formatCurrency(totalDespesas)}</span>
                            </div>
                        </div>

                        <div className={`flex justify-between items-center p-6 rounded-2xl mt-6 border-2 ${lucroLiquido >= 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
                            <div>
                                <span className="font-black text-2xl block">(=) RESULTADO LÍQUIDO DO EXERCÍCIO</span>
                                <span className="text-sm font-bold">O que realmente sobrou para a GrandPort</span>
                            </div>
                            <span className="font-black text-3xl">{formatCurrency(lucroLiquido)}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
