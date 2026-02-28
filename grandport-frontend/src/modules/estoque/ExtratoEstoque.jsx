import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { ArrowLeft, History, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';

export const ExtratoEstoque = ({ produto, onVoltar }) => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const res = await api.get(`/api/estoque/produto/${produto.id}/historico`);
                setHistorico(res.data);
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            } finally {
                setLoading(false);
            }
        };
        carregarHistorico();
    }, [produto.id]);

    const formatData = (dataString) => {
        return new Date(dataString).toLocaleString('pt-BR');
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="mb-6 flex items-center gap-4">
                <button 
                    onClick={onVoltar}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <History className="text-blue-600" /> Extrato de Movimentações
                    </h1>
                    <p className="text-gray-500">Produto: <span className="font-bold text-gray-700">{produto.nome}</span> (SKU: {produto.sku})</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
                ) : historico.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400">
                        <AlertCircle size={48} className="mb-4 opacity-50" />
                        <p>Nenhuma movimentação registrada para este produto.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Data / Hora</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Motivo</th>
                                <th className="p-4 text-right">Qtd</th>
                                <th className="p-4 text-right">Saldo Anterior</th>
                                <th className="p-4 text-right">Saldo Atual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historico.map((mov) => (
                                <tr key={mov.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600">{formatData(mov.dataMovimentacao)}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                            mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {mov.tipo === 'ENTRADA' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                            {mov.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-800 font-medium">{mov.motivo}</td>
                                    <td className={`p-4 text-right font-bold ${mov.quantidade > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {mov.quantidade > 0 ? '+' : ''}{mov.quantidade}
                                    </td>
                                    <td className="p-4 text-right text-gray-500">{mov.saldoAnterior}</td>
                                    <td className="p-4 text-right font-bold text-gray-800">{mov.saldoAtual}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
