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

    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

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
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b text-gray-600 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="p-4">Data / Hora</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Nº Doc / Nota</th> {/* 🚀 NOVA COLUNA */}
                            <th className="p-4">Cliente / Fornecedor</th> {/* 🚀 NOVA COLUNA */}
                            <th className="p-4">Motivo</th>
                            <th className="p-4 text-right">Qtd</th>
                            <th className="p-4 text-right">Saldo Atual</th>
                        </tr>
                        </thead>
                        <tbody>
                        {historico.map((mov) => (
                            <tr key={mov.id} className="border-b hover:bg-blue-50/30 transition-colors group">
                                <td className="p-4 text-gray-600 text-xs">{formatData(mov.dataMovimentacao)}</td>
                                <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tracking-tighter ${
                                            mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                            {mov.tipo === 'ENTRADA' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                            {mov.tipo}
                                        </span>
                                </td>

                                {/* 🚀 EXIBIÇÃO DO NÚMERO DO DOCUMENTO */}
                                <td className="p-4 font-mono text-xs text-blue-600 font-bold">
                                    {mov.documento ? `#${mov.documento}` : '---'}
                                </td>

                                {/* 🚀 EXIBIÇÃO DO PARCEIRO (CLIENTE OU FORNECEDOR) */}
                                <td className="p-4">
                                    <p className="text-xs font-black text-slate-700 uppercase leading-tight">
                                        {mov.parceiro || 'CONSUMIDOR FINAL'}
                                    </p>
                                </td>

                                <td className="p-4 text-gray-500 text-xs font-medium uppercase">{mov.motivo}</td>

                                <td className={`p-4 text-right font-black ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                    <span className="text-xs mr-0.5">{mov.tipo === 'ENTRADA' ? '+' : '-'}</span>
                                    {Math.abs(mov.quantidade)}
                                </td>

                                <td className="p-4 text-right font-black text-slate-800 bg-slate-50/50 group-hover:bg-blue-100/50 transition-colors">
                                    {mov.saldoAtual}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};