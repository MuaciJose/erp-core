import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export const ModalFechamento = ({ isOpen, onClose, onFinalizar, totalVenda }) => {
    if (!isOpen) return null;

    const [valorRecebido, setValorRecebido] = useState(0);
    
    // Assume que o valor que falta pagar é o total da venda.
    // Isso pode ser expandido depois para múltiplos pagamentos.
    const faltaPagar = totalVenda;
    const troco = valorRecebido > faltaPagar ? valorRecebido - faltaPagar : 0;

    // Atalhos para fechar o modal ou confirmar a venda
    useHotkeys('esc', onClose, { enableOnTags: ['INPUT'] });
    useHotkeys('f10', onFinalizar, { enableOnTags: ['INPUT'] });

    // Reseta o valor recebido quando o modal é aberto
    useEffect(() => {
        if (isOpen) {
            setValorRecebido(0);
        }
    }, [isOpen]);

    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl transform transition-all">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Fechamento da Venda</h2>
                
                <div className="text-right mb-6 bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-500 uppercase text-sm">Total a Pagar</p>
                    <p className="text-5xl font-bold text-blue-600">
                        {formatCurrency(totalVenda)}
                    </p>
                </div>

                {/* Calculadora de Troco */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300 mt-4">
                    <h3 className="text-sm font-bold text-yellow-800 uppercase">Cálculo de Troco (Dinheiro)</h3>
                    <div className="flex gap-4 items-end mt-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-600">Valor Entregue pelo Cliente:</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border-2 border-yellow-400 rounded text-xl font-bold focus:ring-2 focus:ring-yellow-500"
                                value={valorRecebido}
                                onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-600">Troco a Devolver:</p>
                            <p className={`text-4xl font-black ${troco > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                {formatCurrency(troco)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <p className="text-xs text-gray-500">[ESC] para Cancelar</p>
                    <button 
                        onClick={onFinalizar}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-3 px-10 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    >
                        Confirmar Venda (F10)
                    </button>
                </div>
            </div>
        </div>
    );
};
