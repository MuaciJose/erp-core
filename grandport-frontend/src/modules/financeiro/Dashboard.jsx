import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    DollarSign, 
    TrendingUp, 
    PackageSearch, 
    AlertTriangle, 
    Calendar,
    ArrowRight
} from 'lucide-react';

export const Dashboard = ({ setPaginaAtiva }) => {
    const [resumo, setResumo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const res = await api.get('/api/dashboard/resumo');
                setResumo(res.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDashboard();
    }, []);

    if (loading) return <div className="p-10 text-gray-500 font-bold text-center">Carregando painel de controle...</div>;
    if (!resumo) return <div className="p-10 text-red-500 font-bold text-center">Erro ao carregar dados do dashboard.</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">VISÃO GERAL</h1>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                        <Calendar size={16} /> Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-gray-400">Mês Atual</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">Faturamento Bruto</p>
                    <h2 className="text-3xl font-black text-slate-800">R$ {resumo.faturamentoMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPaginaAtiva('contas-receber')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><DollarSign size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-red-400 animate-pulse">Atenção</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">Contas Atrasadas</p>
                    <h2 className="text-3xl font-black text-red-600">R$ {resumo.receberAtrasado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><PackageSearch size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-gray-400">Hoje</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">Vendas Realizadas</p>
                    <h2 className="text-3xl font-black text-slate-800">{resumo.vendasHoje} <span className="text-sm font-medium text-gray-400">pedidos</span></h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPaginaAtiva('previsao')}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-gray-400">Reposição</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">Itens em Falta/Baixo</p>
                    <h2 className="text-3xl font-black text-orange-600">{resumo.produtosBaixoEstoque} <span className="text-sm font-medium text-gray-400">peças</span></h2>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-lg text-slate-800">Curva A - Mais Vendidos (Mês)</h3>
                        <button onClick={() => setPaginaAtiva('estoque')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                            Ver Estoque Completo <ArrowRight size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {resumo.topProdutos.map((prod, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-sm text-slate-700">{prod.nome}</span>
                                        <span className="font-bold text-sm text-green-600">R$ {prod.valor.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(prod.qtd / resumo.topProdutos[0].qtd) * 100}%`, maxWidth: '100%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">{prod.qtd} unidades vendidas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                    <h3 className="font-black text-lg text-blue-400 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20} /> AVISOS DO SISTEMA
                    </h3>
                    
                    <div className="space-y-4">
                        {resumo.alertas.map((alerta, i) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block ${
                                    alerta.tipo === 'FINANCEIRO' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                    {alerta.tipo}
                                </span>
                                <p className="text-sm text-slate-300 leading-relaxed">{alerta.msg}</p>
                            </div>
                        ))}
                        
                        {resumo.alertas.length === 0 && (
                            <p className="text-slate-400 italic text-sm text-center mt-10">Tudo operando normalmente.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
