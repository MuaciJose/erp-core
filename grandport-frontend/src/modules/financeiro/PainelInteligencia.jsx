import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Sparkles, TrendingUp, AlertOctagon, Lightbulb, ArrowRight, PackageX } from 'lucide-react';

export const PainelInteligencia = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarInsights = async () => {
            try {
                const res = await api.get('/api/dashboard/insights');
                setInsights(res.data);
            } catch (error) {
                console.error("Erro ao carregar insights", error);
            } finally {
                setLoading(false);
            }
        };
        carregarInsights();
    }, []);

    if (loading) return (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 animate-pulse flex items-center gap-4 mb-8">
            <Sparkles className="text-indigo-400 animate-spin-slow" size={32} />
            <div className="text-indigo-200 font-bold">Analisando dados da GrandPort para gerar insights...</div>
        </div>
    );

    if (insights.length === 0) return null;

    const getEstiloCard = (cor) => {
        switch(cor) {
            case 'orange': return 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20';
            case 'red': return 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20';
            case 'blue': return 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20';
            default: return 'bg-white/10 border-white/20 text-white';
        }
    };

    const getIcone = (tipo) => {
        switch(tipo) {
            case 'ALERTA_ESTOQUE': return <TrendingUp size={24} />;
            case 'DINHEIRO_PARADO': return <PackageX size={24} />;
            case 'OPORTUNIDADE_VENDA': return <Lightbulb size={24} />;
            default: return <AlertOctagon size={24} />;
        }
    };

    return (
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">ASSISTENTE INTELIGENTE</h2>
                    <p className="text-indigo-300 text-sm font-medium">Análise automática do seu negócio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {insights.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-2xl border transition-all cursor-default flex flex-col justify-between ${getEstiloCard(insight.cor)}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                    {getIcone(insight.tipo)}
                                </div>
                                <h3 className="font-bold text-white tracking-wide">{insight.titulo}</h3>
                            </div>
                            <p className="text-sm opacity-90 leading-relaxed mb-6 text-slate-300">
                                {insight.mensagem}
                            </p>
                        </div>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 backdrop-blur-sm">
                            {insight.acaoSugestao} <ArrowRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
