import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Sparkles, TrendingUp, AlertOctagon, Lightbulb, ArrowRight, PackageX, ChevronDown, ChevronUp } from 'lucide-react';

export const PainelInteligencia = ({ compacto = false }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState(false);

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
        <div className="bg-slate-900 rounded-[2rem] p-5 animate-pulse flex items-center gap-3 mb-8">
            <Sparkles className="text-indigo-400 animate-spin-slow" size={24} />
            <div className="text-indigo-200 font-bold text-sm">Analisando dados da GrandPort para gerar insights...</div>
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

    const insightsExibidos = compacto && !expandido ? insights.slice(0, 2) : insights;
    const insightPrincipal = insights[0];

    return (
        <div className="bg-slate-900 rounded-[2rem] shadow-xl p-5 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="lg:max-w-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">Assistente Inteligente</h2>
                            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-[0.18em]">Prioridades do dia</p>
                        </div>
                    </div>

                    {insightPrincipal && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/10 p-2 text-white">
                                    {getIcone(insightPrincipal.tipo)}
                                </div>
                                <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-200">Maior prioridade</div>
                                    <div className="text-sm font-black text-white">{insightPrincipal.titulo}</div>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                {insightPrincipal.mensagem}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className={`grid gap-3 ${compacto ? 'xl:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
                        {insightsExibidos.map((insight, index) => (
                            <div key={index} className={`rounded-2xl border p-4 transition-all cursor-default ${getEstiloCard(insight.cor)}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm">
                                            {getIcone(insight.tipo)}
                                        </div>
                                        <h3 className="font-bold text-white tracking-wide text-sm">{insight.titulo}</h3>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm opacity-90 leading-6 text-slate-300">
                                    {insight.mensagem}
                                </p>
                                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                    {insight.acaoSugestao} <ArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {compacto && insights.length > 2 && (
                        <button
                            onClick={() => setExpandido(valorAtual => !valorAtual)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-100 transition hover:bg-white/10"
                        >
                            {expandido ? 'Mostrar menos' : `Mostrar ${insights.length - 2} insight(s)`}
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
