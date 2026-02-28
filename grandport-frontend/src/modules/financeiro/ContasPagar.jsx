import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { TrendingDown, Plus, DollarSign } from 'lucide-react';
import { NovaDespesaModal } from './NovaDespesaModal';

export const ContasPagar = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const carregarContas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/financeiro/contas-a-pagar');
            setContas(res.data);
        } catch (error) {
            console.error("Erro ao carregar contas a pagar:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarContas();
    }, []);

    const handleBaixarPagamento = async (contaId) => {
        if (window.confirm("Confirma o pagamento desta conta? Esta ação registrará uma saída no caixa.")) {
            try {
                await api.patch(`/api/financeiro/contas-a-pagar/${contaId}/baixar`);
                alert("Pagamento registrado com sucesso!");
                carregarContas(); // Recarrega a lista para remover a conta paga
            } catch (error) {
                console.error("Erro ao baixar conta:", error);
                alert("Erro ao registrar pagamento: " + (error.response?.data?.message || error.message));
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <TrendingDown className="text-red-600 bg-red-100 p-1 rounded-lg" size={36} /> 
                    CONTAS A PAGAR
                </h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Plus size={20} /> NOVA DESPESA MANUAL
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                        <tr>
                            <th className="p-4">Fornecedor</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4">Vencimento</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="p-12 text-center text-gray-400 italic">Carregando...</td></tr>
                        ) : contas.map(conta => (
                            <tr key={conta.id} className="border-t hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{conta.fornecedorNome}</td>
                                <td className="p-4 text-gray-600">{conta.descricao}</td>
                                <td className="p-4 text-gray-600">{new Date(conta.dataVencimento).toLocaleDateString()}</td>
                                <td className="p-4 font-black text-red-600 text-lg">R$ {conta.valor.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                        conta.atrasado ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {conta.atrasado ? 'ATRASADO' : 'PENDENTE'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleBaixarPagamento(conta.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700"
                                    >
                                        REGISTRAR PAGAMENTO
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && contas.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-gray-400 italic">
                                    Nenhuma conta a pagar pendente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <NovaDespesaModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={carregarContas}
                />
            )}
        </div>
    );
};
