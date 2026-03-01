import React, { useState } from 'react';
import { Printer, CheckCircle, X, FileText, ScrollText } from 'lucide-react';

export const CupomReciboModal = ({ pedido, onClose }) => {
    const [formato, setFormato] = useState('BOBINA');

    const handleImprimir = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4 print:bg-white print:p-0 overflow-y-auto">
            
            {/* PAINEL DE CONTROLE (Oculto na impressão) */}
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-2 rounded-2xl shadow-2xl print:hidden z-50 border border-slate-200">
                <button 
                    onClick={() => setFormato('BOBINA')} 
                    className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${formato === 'BOBINA' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <ScrollText size={18} /> Bobina 80mm
                </button>
                <button 
                    onClick={() => setFormato('A4')} 
                    className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${formato === 'A4' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <FileText size={18} /> Papel A4
                </button>
            </div>

            <div className="fixed top-6 right-6 flex gap-4 print:hidden z-50">
                <button onClick={handleImprimir} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all transform hover:scale-105">
                    <Printer size={20} /> IMPRIMIR {formato}
                </button>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl shadow-lg transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* ÁREA DE PRÉ-VISUALIZAÇÃO / IMPRESSÃO */}
            <div className="mt-24 mb-10 print:mt-0 print:mb-0">
                
                {formato === 'BOBINA' ? (
                    /* LAYOUT BOBINA TÉRMICA (80mm) */
                    <div className="bg-white w-full max-w-[350px] mx-auto p-6 shadow-2xl rounded-lg print:shadow-none print:w-[80mm] print:p-0 font-mono text-xs text-slate-800">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-black uppercase">GRANDPORT AUTOPEÇAS</h2>
                            <p>CNPJ: 12.345.678/0001-90</p>
                            <p>Rua dos Motores, 123 - Centro</p>
                            <p>Tel: (81) 9999-8888</p>
                            <div className="border-b border-dashed border-slate-400 my-2"></div>
                            <p className="font-bold uppercase">Recibo de Venda - Não Fiscal</p>
                            <p>Pedido Nº: {pedido.id}</p>
                            <p>{new Date(pedido.dataHora).toLocaleString('pt-BR')}</p>
                            <div className="border-b border-dashed border-slate-400 my-2"></div>
                        </div>

                        <div className="mb-4 space-y-1">
                            <p><span className="font-bold">Cliente:</span> {pedido.cliente ? pedido.cliente.nome : 'CONSUMIDOR FINAL'}</p>
                            {pedido.cliente && <p><span className="font-bold">CPF/CNPJ:</span> {pedido.cliente.documento}</p>}
                            <p><span className="font-bold">Veículo:</span> {pedido.veiculo?.modelo || 'N/A'}</p>
                            <p><span className="font-bold">Vendedor:</span> {pedido.vendedorNome}</p>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-2"></div>

                        <table className="w-full text-left mb-4">
                            <thead>
                                <tr>
                                    <th className="pb-1">QTD</th>
                                    <th className="pb-1">DESCRIÇÃO</th>
                                    <th className="text-right pb-1">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.itens.map((item, index) => (
                                    <tr key={index}>
                                        <td className="align-top py-1">{item.quantidade}x</td>
                                        <td className="align-top py-1 pr-2">{item.produto.nome} <br/><span className="text-[10px]">R$ {item.precoUnitario.toFixed(2)}</span></td>
                                        <td className="align-top text-right py-1">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="border-b border-dashed border-slate-400 my-2"></div>

                        <div className="space-y-1 mb-4">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>R$ {pedido.valorSubtotal.toFixed(2)}</span>
                            </div>
                            {pedido.desconto > 0 && (
                                <div className="flex justify-between">
                                    <span>Desconto:</span>
                                    <span>- R$ {pedido.desconto.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-dashed border-slate-400">
                                <span>TOTAL PAGO:</span>
                                <span>R$ {pedido.valorTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span>Pgto:</span>
                                <span className="font-bold uppercase">{pedido.pagamentos[0]?.metodo || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <CheckCircle size={20} className="mx-auto mb-1 print:hidden text-green-500" />
                            <p className="font-bold uppercase">Obrigado pela preferência!</p>
                            <p className="text-[10px] mt-1">Trocas apenas com este comprovante (Até 7 dias).</p>
                        </div>
                    </div>
                ) : (
                    /* LAYOUT PAPEL A4 */
                    <div className="bg-white w-full max-w-[800px] mx-auto p-10 shadow-2xl rounded-lg print:shadow-none print:w-[210mm] print:p-0 font-sans text-slate-900">
                        
                        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900">GRANDPORT</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Auto Peças e Acessórios</p>
                                <p className="text-sm mt-2">CNPJ: 12.345.678/0001-90</p>
                                <p className="text-sm">Rua dos Motores, 123 - Centro - Telefone: (81) 9999-8888</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-black uppercase bg-slate-100 border-2 border-slate-800 px-4 py-2 rounded-lg inline-block">
                                    RECIBO DE PAGAMENTO
                                </h2>
                                <p className="text-base font-bold mt-3">Pedido Nº: <span className="text-red-600">{pedido.id}</span></p>
                                <p className="text-sm text-slate-600 mt-1">Data: {new Date(pedido.dataHora).toLocaleDateString('pt-BR')} às {new Date(pedido.dataHora).toLocaleTimeString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="border-2 border-slate-200 p-6 mb-8 rounded-xl flex justify-between bg-slate-50">
                            <div>
                                <p className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Sacado / Cliente</p>
                                <p className="font-black text-xl text-slate-800">{pedido.cliente ? pedido.cliente.nome : 'Consumidor Final'}</p>
                                {pedido.cliente && <p className="text-sm font-bold text-slate-600 mt-1">CPF/CNPJ: {pedido.cliente.documento}</p>}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Informações Adicionais</p>
                                <p className="font-bold text-slate-800">Vendedor: <span className="font-medium text-slate-600">{pedido.vendedorNome}</span></p>
                                <p className="font-bold text-slate-800 mt-1">Veículo: <span className="font-medium text-slate-600">{pedido.veiculo?.modelo || 'N/A'}</span></p>
                            </div>
                        </div>

                        <table className="w-full text-left border-collapse mb-8">
                            <thead className="bg-slate-100 border-y-2 border-slate-800">
                                <tr>
                                    <th className="py-3 px-2 text-xs font-black uppercase">Código</th>
                                    <th className="py-3 px-2 text-xs font-black uppercase">Descrição da Peça</th>
                                    <th className="py-3 px-2 text-center text-xs font-black uppercase">Qtd</th>
                                    <th className="py-3 px-2 text-right text-xs font-black uppercase">Vl. Unit</th>
                                    <th className="py-3 px-2 text-right text-xs font-black uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.itens.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-200">
                                        <td className="py-3 px-2 text-sm font-mono text-slate-500">{item.produto.sku}</td>
                                        <td className="py-3 px-2 text-sm font-bold text-slate-800">{item.produto.nome}</td>
                                        <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantidade}</td>
                                        <td className="py-3 px-2 text-right text-sm text-slate-600">R$ {item.precoUnitario.toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right font-black text-slate-800">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end items-end mb-12 border-t-2 border-slate-800 pt-6">
                            <div className="w-72 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-600">Subtotal das peças:</span>
                                    <span className="text-sm font-bold text-slate-800">R$ {pedido.valorSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-600">Desconto aplicado:</span>
                                    <span className="text-sm font-bold text-orange-600">- R$ {pedido.desconto.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <span className="text-xl font-black uppercase text-slate-800">Total Pago:</span>
                                    <span className="text-3xl font-black text-green-600">R$ {pedido.valorTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-sm font-bold text-slate-600">Forma de Pagamento:</span>
                                    <span className="text-sm font-bold text-slate-800 uppercase">{pedido.pagamentos[0]?.metodo || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-16 pt-8">
                            <div className="w-1/2 mx-auto border-t-2 border-slate-400 pt-2">
                                <p className="text-sm font-bold uppercase">{pedido.cliente ? pedido.cliente.nome : 'Assinatura do Cliente'}</p>
                                <p className="text-xs text-slate-500">Confirmo o recebimento das mercadorias descritas acima.</p>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
