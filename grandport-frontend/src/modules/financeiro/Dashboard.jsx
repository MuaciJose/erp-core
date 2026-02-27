import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/axios';

export const Dashboard = () => {
    const [dados, setDados] = useState(null);

    useEffect(() => {
        // Busca os dados do período atual (ex: últimos 30 dias)
        const fetchResumo = async () => {
            try {
                const res = await api.get('/api/financeiro/fluxo-caixa/resumo', {
                    params: {
                        inicio: '2024-01-01T00:00:00',
                        fim: '2024-12-31T23:59:59'
                    }
                });
                setDados(res.data);
            } catch (error) {
                console.error("Erro ao buscar resumo financeiro:", error);
            }
        };
        fetchResumo();
    }, []);

    const chartData = [
        { name: 'Entradas', valor: dados?.totalEntradas || 0 },
        { name: 'Saídas', valor: dados?.totalSaidas || 0 },
    ];

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestão GrandPort</h1>
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 uppercase">Total de Entradas</p>
                    <p className="text-2xl font-bold">{formatCurrency(dados?.totalEntradas)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-sm text-gray-500 uppercase">Total de Saídas</p>
                    <p className="text-2xl font-bold">{formatCurrency(dados?.totalSaidas)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 uppercase">Saldo Líquido</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(dados?.saldoLiquido)}</p>
                </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="bg-white p-6 rounded-xl shadow-sm h-96">
                <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Anual</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={formatCurrency} />
                        <Bar dataKey="valor">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
