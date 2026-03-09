import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { DollarSign, CreditCard, Smartphone, UserCheck } from 'lucide-react';

export const ModalFechamento = ({ isOpen, onClose, onFinalizar, totalVenda, clienteSelecionado }) => {
    if (!isOpen) return null;

    const [metodo, setMetodo] = useState('DINHEIRO');
    const [valorRecebido, setValorRecebido] = useState(0);

    const troco = valorRecebido > totalVenda && metodo === 'DINHEIRO' ? valorRecebido - totalVenda : 0;

    useHotkeys('esc', onClose, { enableOnTags: ['INPUT'] });
    useHotkeys('f10', () => onFinalizar(metodo), { enableOnTags: ['INPUT'] });

    useEffect(() => {
        if (isOpen) {
            setValorRecebido(totalVenda); // Preenche com o valor total por padrão
            setMetodo('DINHEIRO'); // Reseta para dinheiro
        }
    }, [isOpen, totalVenda]);

    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const MetodoPagamento = ({ id, icon, label, hotkey, tooltip }) => (
        <button
            onClick={() => setMetodo(id)}
            title={tooltip}
            className={`flex-1 p-4 rounded-xl border-4 transition-all ${metodo === id ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-gray-100 hover:bg-gray-200'}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-bold text-lg">{label}</span>
                <span className="ml-auto text-xs font-mono bg-gray-300 px-2 py-1 rounded">{hotkey}</span>
            </div>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-3xl transform transition-all">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Fechamento da Venda</h2>

                <div className="text-right mb-6 bg-gray-100 p-4 rounded-lg" title="Valor final que deve ser recebido do cliente">
                    <p className="text-gray-500 uppercase text-sm">Total a Pagar</p>
                    <p className="text-5xl font-bold text-blue-600">{formatCurrency(totalVenda)}</p>
                </div>

                {/* Seleção de Método de Pagamento */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <MetodoPagamento id="DINHEIRO" icon={<DollarSign className="text-green-600" />} label="Dinheiro" hotkey="F5" tooltip="Pagamento em espécie com cálculo de troco" />
                    <MetodoPagamento id="CARTAO" icon={<CreditCard className="text-blue-600" />} label="Cartão" hotkey="F6" tooltip="Pagamento via débito ou crédito (máquina)" />
                    <MetodoPagamento id="PIX" icon={<Smartphone className="text-purple-600" />} label="PIX" hotkey="F7" tooltip="Pagamento instantâneo via QR Code ou Chave" />
                    <MetodoPagamento id="A_PRAZO" icon={<UserCheck className="text-orange-600" />} label="A Prazo / Fiado" hotkey="F8" tooltip="Lançar valor na conta do cliente para pagamento posterior" />
                </div>

                {/* Lógica condicional para troco ou dados do cliente */}
                {metodo === 'DINHEIRO' && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300 mt-4">
                        <h3 className="text-sm font-bold text-yellow-800 uppercase">Cálculo de Troco</h3>
                        <div className="flex gap-4 items-end mt-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">Valor Entregue:</label>
                                <input
                                    type="number"
                                    title="Digite quanto o cliente te entregou em dinheiro para calcular o troco"
                                    className="w-full p-2 border-2 border-yellow-400 rounded text-xl font-bold focus:ring-2 focus:ring-yellow-500"
                                    value={valorRecebido}
                                    onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-600">Troco:</p>
                                <p className={`text-4xl font-black ${troco > 0 ? 'text-green-600' : 'text-gray-500'}`} title="Valor que deve ser devolvido ao cliente">
                                    {formatCurrency(troco)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {metodo === 'A_PRAZO' && (
                    <div className={`p-4 rounded-lg border ${clienteSelecionado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`} title="Status de crédito do cliente selecionado">
                        {clienteSelecionado ? (
                            <div>
                                <p className="text-sm font-bold text-green-800">Venda será lançada para:</p>
                                <p className="text-lg font-bold">{clienteSelecionado.nome}</p>
                                <p className="text-xs text-gray-600">Limite Disponível: {formatCurrency(clienteSelecionado.limiteCredito - clienteSelecionado.saldoDevedor)}</p>
                            </div>
                        ) : (
                            <p className="text-red-700 font-bold text-center">Atenção: Nenhum cliente selecionado para a venda a prazo!</p>
                        )}
                    </div>
                )}

                <div className="mt-8 flex justify-between items-center">
                    <p className="text-xs text-gray-500" title="Pressione a tecla ESC para sair sem salvar">[ESC] para Cancelar</p>
                    <button
                        onClick={() => onFinalizar(metodo)}
                        disabled={metodo === 'A_PRAZO' && !clienteSelecionado}
                        title="Finalizar o processo de venda e baixar o estoque (Atalho: F10)"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-3 px-10 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Confirmar Venda (F10)
                    </button>
                </div>
            </div>
        </div>
    );
};