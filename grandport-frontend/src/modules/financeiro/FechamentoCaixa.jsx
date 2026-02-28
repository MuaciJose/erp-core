import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { DollarSign, CreditCard, Smartphone, Calculator, CheckCircle } from 'lucide-react';

export const FechamentoCaixa = () => {
    const [resumo, setResumo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarFechamento = async () => {
            try {
                // Busca as vendas do dia atual
                const res = await api.get('/api/vendas/fechamento-hoje');
                setResumo(res.data);
            } catch (error) {
                console.error("Erro ao carregar fechamento:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarFechamento();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Calculando movimentação do dia...</div>;
    if (!resumo) return <div className="p-10 text-center text-red-500">Erro ao carregar dados do fechamento.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
                <Calculator className="text-blue-600" /> FECHAMENTO DE CAIXA DIÁRIO
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card Dinheiro */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <DollarSign className="text-green-600" size={32} />
                        <span className="text-[10px] font-bold text-gray-400">DINHEIRO</span>
                    </div>
                    <p className="text-2xl font-black mt-2">R$ {resumo.totalDinheiro?.toFixed(2)}</p>
                </div>

                {/* Card Cartão */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <CreditCard className="text-blue-600" size={32} />
                        <span className="text-[10px] font-bold text-gray-400">CARTÃO</span>
                    </div>
                    <p className="text-2xl font-black mt-2">R$ {resumo.totalCartao?.toFixed(2)}</p>
                </div>

                {/* Card Pix */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <Smartphone className="text-purple-600" size={32} />
                        <span className="text-[10px] font-bold text-gray-400">PIX</span>
                    </div>
                    <p className="text-2xl font-black mt-2">R$ {resumo.totalPix?.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-400 uppercase text-xs font-bold tracking-widest">Faturamento Total Hoje</p>
                        <h2 className="text-5xl font-black text-blue-400">R$ {resumo.totalGeral?.toFixed(2)}</h2>
                        <p className="mt-2 text-slate-400 italic">{resumo.quantidadeVendas} vendas realizadas com sucesso.</p>
                    </div>
                    <button 
                        onClick={() => window.print()} 
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40"
                    >
                        <CheckCircle size={20} /> IMPRIMIR FECHAMENTO
                    </button>
                </div>
            </div>
            
            <p className="text-center text-gray-400 mt-8 text-xs">
                GrandPort ERP - O controle da sua autopeças em tempo real.
            </p>
        </div>
    );
};
