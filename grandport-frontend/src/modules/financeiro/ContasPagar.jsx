import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { TrendingDown, Plus, DollarSign, X } from 'lucide-react';
import { NovaDespesaModal } from './NovaDespesaModal';

const ModalLiquidar = ({ contaPagar, contasBancarias, onClose, onConfirm }) => {
    const [contaSelecionada, setContaSelecionada] = useState(contasBancarias[0]?.id || '');

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black text-slate-800">Liquidar Despesa</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <p className="text-slate-500 mb-6 border-b pb-4">
                    Fornecedor: <strong className="text-slate-800">{contaPagar.fornecedorNome}</strong><br/>
                    Valor a pagar: <strong className="text-red-600">R$ {contaPagar.valor.toFixed(2)}</strong>
                </p>
                
                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Origem do Dinheiro</label>
                <select 
                    value={contaSelecionada}
                    onChange={(e) => setContaSelecionada(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none font-bold text-slate-700 mb-8"
                >
                    {contasBancarias.map(banco => (
                        <option key={banco.id} value={banco.id}>
                            {banco.nome} (Saldo: R$ {banco.saldoAtual.toFixed(2)})
                        </option>
                    ))}
                </select>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">CANCELAR</button>
                    <button 
                        onClick={() => onConfirm(contaPagar.id, contaSelecionada)}
                        className="flex-1 py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg"
                    >
                        CONFIRMAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ContasPagar = () => {
    const [contas, setContas] = useState([]);
    const [contasBancarias, setContasBancarias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contaParaLiquidar, setContaParaLiquidar] = useState(null);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resContas, resBancos] = await Promise.all([
                api.get('/api/financeiro/contas-a-pagar'),
                api.get('/api/financeiro/contas-bancarias')
            ]);
            setContas(resContas.data);
            setContasBancarias(resBancos.data);
        } catch (error) {
            console.error("Erro ao carregar dados financeiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const handleLiquidar = async (contaId, bancoId) => {
        try {
            await api.patch(`/api/financeiro/contas-a-pagar/${contaId}/liquidar`, { contaBancariaId: bancoId });
            alert("Pagamento registrado com sucesso!");
            setContaParaLiquidar(null);
            carregarDados();
        } catch (error) {
            alert("Erro ao registrar pagamento: " + (error.response?.data?.message || error.message));
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
                                        onClick={() => setContaParaLiquidar(conta)}
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
                    onSuccess={carregarDados}
                />
            )}

            {contaParaLiquidar && (
                <ModalLiquidar 
                    contaPagar={contaParaLiquidar}
                    contasBancarias={contasBancarias}
                    onClose={() => setContaParaLiquidar(null)}
                    onConfirm={handleLiquidar}
                />
            )}
        </div>
    );
};
