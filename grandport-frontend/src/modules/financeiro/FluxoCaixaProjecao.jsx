import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    TrendingUp, TrendingDown, DollarSign,
    Calendar, Target, Loader2, LineChart as ChartIcon, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const FluxoCaixaProjecao = () => {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);

    // Projeção: De hoje até 30 dias para a frente
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const [dataInicio, setDataInicio] = useState(hoje.toISOString().slice(0, 10));
    const [dataFim, setDataFim] = useState(trintaDias.toISOString().slice(0, 10));

    const carregarProjecao = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/financeiro/fluxo-caixa/projecao?dataInicio=${dataInicio}&dataFim=${dataFim}`);
            setDados(res.data);
        } catch (error) {
            console.error("Erro na API de Projeção:", error);
            toast.error("Erro ao carregar a projeção do fluxo de caixa.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarProjecao();
    }, [dataInicio, dataFim]);

    // =======================================================================
    // BLINDAGEM CONTRA FALHAS DE RENDERIZAÇÃO
    // =======================================================================

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400"><Loader2 className="animate-spin mr-2" size={32}/> MAPEANDO O FUTURO FINANCEIRO...</div>;

    // 🛡️ Prevenção de quebra se o Java não mandar os dias corretamente
    if (!dados || !Array.isArray(dados.dias)) {
        return <div className="p-8 text-center text-red-500 font-bold">Nenhum dado encontrado para este período.</div>;
    }

    const formatCurrency = (val) => (Number(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 🛡️ O TRADUTOR DE DATAS BLINDADO (Aceita String ou Array do Java)
    const formatarDataGrafico = (dataValue) => {
        if (!dataValue) return "";
        // Se o Java mandou como Array: [2026, 3, 25]
        if (Array.isArray(dataValue)) {
            const dia = String(dataValue[2]).padStart(2, '0');
            const mes = String(dataValue[1]).padStart(2, '0');
            return `${dia}/${mes}`;
        }
        // Se o Java mandou como String: "2026-03-25"
        if (typeof dataValue === 'string') {
            const partes = dataValue.split('T')[0].split('-');
            if (partes.length >= 3) return `${partes[2]}/${partes[1]}`;
        }
        return String(dataValue);
    };

    // 🛡️ Mapeamento seguro com fallback para Zero
    const dadosGrafico = dados.dias.map(dia => ({
        data: formatarDataGrafico(dia.data),
        Entradas: Number(dia.entradas) || 0,
        Saidas: (Number(dia.saidas) || 0) * -1,
        SaldoAcumulado: Number(dia.saldoAcumulado) || 0
    }));

    const totalEntradas = dados.dias.reduce((acc, dia) => acc + (Number(dia.entradas) || 0), 0);
    const totalSaidas = dados.dias.reduce((acc, dia) => acc + (Number(dia.saidas) || 0), 0);
    const saldoFinal = Number(dados.saldoFinalProjetado) || 0;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-24">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ChartIcon className="text-indigo-600 bg-indigo-100 p-2 rounded-xl" size={40} />
                        Projeção de Fluxo de Caixa
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Antecipe o futuro cruzando Contas a Pagar e Receber.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <Calendar className="text-indigo-600 ml-2" size={20} />
                        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="p-2 outline-none font-black text-slate-700 bg-transparent cursor-pointer" />
                        <span className="text-slate-400 font-bold">até</span>
                        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="p-2 outline-none font-black text-slate-700 bg-transparent cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Inicial (Projeção)</div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(dados.saldoInicial)}</h2>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><TrendingUp size={100}/></div>
                    <div className="text-xs font-black text-green-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> A Receber (Período)
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalEntradas)}</h2>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><TrendingDown size={100}/></div>
                    <div className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> A Pagar (Período)
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalSaidas)}</h2>
                </div>

                <div className={`p-6 rounded-3xl shadow-xl text-white relative overflow-hidden transition-colors ${saldoFinal >= 0 ? 'bg-indigo-600' : 'bg-red-500'}`}>
                    <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign size={100}/></div>
                    <div className="text-xs font-black text-white/80 uppercase tracking-widest mb-2 relative z-10">
                        Saldo Final Projetado
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter relative z-10">{formatCurrency(saldoFinal)}</h2>
                    {saldoFinal < 0 && (
                        <div className="mt-2 text-xs font-bold flex items-center gap-1 bg-red-900/30 px-2 py-1 rounded w-max">
                            <AlertTriangle size={14}/> Risco de Furo no Caixa
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mb-10">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                    <Target size={20} className="text-indigo-500"/> Comportamento do Caixa (Linha do Tempo)
                </h3>

                <div className="h-96 w-full font-sans font-bold text-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dadosGrafico} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `R$ ${value}`} />
                            <Tooltip formatter={(value) => formatCurrency(Math.abs(value))} contentStyle={{ borderRadius: '16px', fontWeight: 'bold', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'black' }} />
                            <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="Saidas" fill="#ef4444" radius={[0, 0, 4, 4]} maxBarSize={40} />
                            <Line type="monotone" dataKey="SaldoAcumulado" name="Saldo em Conta" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};