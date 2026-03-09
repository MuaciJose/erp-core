import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CreditCard, DollarSign, Smartphone, Car, User, CheckCircle, X } from 'lucide-react';

export const ModalFinalizarVenda = ({ totalVenda, clienteSelecionado, onClose, onConfirmarVenda }) => {
    const [metodoPagamento, setMetodoPagamento] = useState('PIX'); // PIX, CARTAO, DINHEIRO, A_PRAZO
    const [veiculos, setVeiculos] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');
    const [loadingVeiculos, setLoadingVeiculos] = useState(false);

    useEffect(() => {
        const buscarVeiculos = async () => {
            if (clienteSelecionado && clienteSelecionado.id) {
                setLoadingVeiculos(true);
                try {
                    const res = await api.get(`/api/veiculos/cliente/${clienteSelecionado.id}`);
                    setVeiculos(res.data);
                    setLoadingVeiculos(false);
                } catch (error) {
                    console.error("Erro ao buscar veículos", error);
                    setLoadingVeiculos(false);
                }
            }
        };
        buscarVeiculos();
    }, [clienteSelecionado]);

    const finalizar = () => {
        const dadosFinalizacao = {
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null,
            metodoPagamento: metodoPagamento
        };

        onConfirmarVenda(dadosFinalizacao);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-fade-in">

                {/* LADO ESQUERDO: DADOS DO CLIENTE E VEÍCULO */}
                <div className="w-full md:w-1/2 bg-slate-50 p-8 border-r border-slate-200">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <User className="text-blue-600" /> IDENTIFICAÇÃO
                    </h2>

                    {clienteSelecionado ? (
                        <div className="space-y-6">
                            {/* Card do Cliente */}
                            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm" title="Cliente que receberá a cobrança/pontuação">
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Cliente na Venda</p>
                                <p className="font-bold text-slate-800">{clienteSelecionado.nome}</p>
                                <p className="text-xs text-slate-500">CPF/CNPJ: {clienteSelecionado.documento}</p>
                            </div>

                            {/* Seleção do Veículo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <Car size={14} /> Para qual veículo?
                                </label>

                                {loadingVeiculos ? (
                                    <div className="p-3 text-sm text-slate-400 font-bold animate-pulse">Buscando garagem...</div>
                                ) : (
                                    <select
                                        value={veiculoSelecionado}
                                        onChange={(e) => setVeiculoSelecionado(e.target.value)}
                                        title="Selecione um veículo do cliente para vincular a venda ao histórico de manutenção"
                                        className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none font-bold text-slate-700 shadow-sm transition-colors"
                                    >
                                        <option value="">Nenhum específico / Venda Avulsa</option>
                                        {veiculos.map(v => (
                                            <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    Vincular a um veículo criará um histórico automático para consultas futuras.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300">
                            <User size={48} className="text-slate-300 mb-4" />
                            <p className="font-bold text-slate-500 text-sm">Venda ao Consumidor Final</p>
                            <p className="text-xs text-slate-400 mt-2">Nenhum cliente selecionado. O histórico de veículos não estará disponível.</p>
                        </div>
                    )}
                </div>

                {/* LADO DIREITO: PAGAMENTO E FECHAMENTO */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-8">
                            <h2 className="text-xl font-black text-slate-800">PAGAMENTO</h2>
                            <button
                                onClick={onClose}
                                title="Cancelar e voltar para a tela anterior"
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-8 bg-slate-900 p-6 rounded-2xl shadow-inner text-white" title="Valor líquido total do documento">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total a Pagar</p>
                            <h1 className="text-5xl font-black text-green-400">R$ {totalVenda.toFixed(2)}</h1>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <button
                                onClick={() => setMetodoPagamento('PIX')}
                                title="Recebimento via PIX (QR Code ou Chave)"
                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${metodoPagamento === 'PIX' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Smartphone size={24} /> PIX
                            </button>
                            <button
                                onClick={() => setMetodoPagamento('CARTAO')}
                                title="Recebimento via Cartão de Débito ou Crédito"
                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${metodoPagamento === 'CARTAO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <CreditCard size={24} /> Cartão
                            </button>
                            <button
                                onClick={() => setMetodoPagamento('DINHEIRO')}
                                title="Recebimento em espécie (Dinheiro)"
                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${metodoPagamento === 'DINHEIRO' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <DollarSign size={24} /> Dinheiro
                            </button>
                            <button
                                onClick={() => setMetodoPagamento('A_PRAZO')}
                                disabled={!clienteSelecionado}
                                title={clienteSelecionado ? "Lançar na conta do cliente para pagamento posterior" : "Identifique um cliente para liberar a venda a prazo"}
                                className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all ${metodoPagamento === 'A_PRAZO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                            >
                                <User size={24} /> Fiado (Prazo)
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={finalizar}
                        title="Confirmar o recebimento e finalizar este pedido no sistema"
                        className="w-full py-5 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 shadow-lg shadow-green-900/20 flex justify-center items-center gap-2 transition-all"
                    >
                        <CheckCircle size={24} /> FINALIZAR VENDA
                    </button>
                </div>

            </div>
        </div>
    );
};