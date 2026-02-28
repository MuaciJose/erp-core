import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/axios';
import { startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';
import { AlertOctagon } from 'lucide-react';

export const Dashboard = () => {
    const [dados, setDados] = useState(null);
    const [filtro, setFiltro] = useState('MES'); // Padrão: Mês Atual
    const [alertas, setAlertas] = useState([]);

    const carregarDados = async (periodo) => {
        let inicio = startOfMonth(new Date());
        let fim = endOfDay(new Date());

        if (periodo === 'HOJE') {
            inicio = startOfDay(new Date());
        } else if (periodo === '7DIAS') {
            inicio = startOfDay(subDays(new Date(), 7));
        }

        try {
            const res = await api.get('/api/financeiro/fluxo-caixa/resumo', {
                params: {
                    inicio: inicio.toISOString(),
                    fim: fim.toISOString()
                }
            });
            setDados(res.data);
            setFiltro(periodo);
        } catch (err) {
            console.error("Erro ao carregar dashboard", err);
        }
    };

    useEffect(() => {
        carregarDados('MES');
        
        const carregarAlertas = async () => {
            try {
                const res = await api.get('/api/produtos/alertas');
                setAlertas(res.data);
            } catch (error) {
                console.error("Erro ao carregar alertas de estoque:", error);
            }
        };
        carregarAlertas();
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Gestão GrandPort</h1>
                
                <div className="inline-flex rounded-md shadow-sm">
                    <button
                        onClick={() => carregarDados('HOJE')}
                        className={`px-4 py-2 text-sm font-medium border ${filtro === 'HOJE' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} rounded-l-lg hover:bg-gray-100`}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => carregarDados('7DIAS')}
                        className={`px-4 py-2 text-sm font-medium border-t border-b ${filtro === '7DIAS' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-gray-100`}
                    >
                        Últimos 7 dias
                    </button>
                    <button
                        onClick={() => carregarDados('MES')}
                        className={`px-4 py-2 text-sm font-medium border ${filtro === 'MES' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} rounded-r-lg hover:bg-gray-100`}
                    >
                        Mês Atual
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 uppercase font-semibold">Entradas ({filtro})</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(dados?.totalEntradas)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-sm text-gray-500 uppercase font-semibold">Saídas ({filtro})</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(dados?.totalSaidas)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 uppercase font-semibold">Saldo ({filtro})</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(dados?.saldoLiquido)}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm h-[500px] w-full mb-8">
                <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa ({filtro})</h3>
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">
                    <AlertOctagon size={20} /> Atenção: Reposição Necessária
                </h3>
                
                {alertas.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Estoque saudável. Nenhuma peça em falta.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alertas.map(p => (
                            <div key={p.id} className="p-3 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">{p.nome}</p>
                                    <p className="text-xs text-red-600">Restam apenas {p.quantidadeEstoque} unidades</p>
                                </div>
                                <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full uppercase font-black">
                                    Crítico
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
