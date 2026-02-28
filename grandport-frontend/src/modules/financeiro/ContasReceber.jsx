import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { DollarSign } from 'lucide-react';

export const ContasReceber = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);

    const carregarContas = async () => {
        try {
            const res = await api.get('/api/financeiro/contas-a-receber');
            setContas(res.data);
        } catch (error) {
            console.error("Erro ao carregar contas a receber:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarContas();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando contas...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-black mb-6 flex items-center gap-2 text-gray-800">
                <DollarSign className="text-green-600" /> CONTAS A RECEBER
            </h1>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                        <tr>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Vencimento</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contas.map(conta => (
                            <tr key={conta.id} className="border-t hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{conta.parceiroNome}</td>
                                <td className="p-4 text-gray-600">{new Date(conta.dataVencimento).toLocaleDateString()}</td>
                                <td className="p-4 font-black text-blue-600 text-lg">R$ {conta.valor.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                        conta.atrasado ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {conta.atrasado ? 'ATRASADO' : 'PENDENTE'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700">
                                        BAIXAR PAGAMENTO
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {contas.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-400 italic">
                                    Nenhuma conta a receber pendente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
