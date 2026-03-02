import React, { useState } from 'react';
import { Printer, CheckCircle, X, FileText, ScrollText } from 'lucide-react';

export const CupomReciboModal = ({ pedido, onClose }) => {
    const [formato, setFormato] = useState('BOBINA');

    const handleImprimir = () => {
        window.print();
    };

    if (!pedido) return null;

    return (
        <>
            <style>
                {`
                    @media print {
                        html, body, #root {
                            height: auto !important;
                            min-height: 100% !important;
                            overflow: visible !important;
                            background-color: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        body * {
                            visibility: hidden;
                        }
                        #area-impressao-recibo, #area-impressao-recibo * {
                            visibility: visible;
                        }
                        #area-impressao-recibo {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        @page { margin: 0; }
                    }
                `}
            </style>

            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4 overflow-y-auto print:hidden">
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-2 rounded-2xl shadow-2xl z-50 border border-slate-200">
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

                <div className="fixed top-6 right-6 flex gap-4 z-50">
                    <button onClick={handleImprimir} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all transform hover:scale-105">
                        <Printer size={20} /> IMPRIMIR {formato}
                    </button>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl shadow-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="mt-24 mb-10">
                    {formato === 'BOBINA' ? (
                        <div className="bg-white w-[350px] mx-auto p-6 shadow-2xl rounded-lg font-mono text-xs text-slate-800">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-black uppercase">GRANDPORT AUTOPEÇAS</h2>
                                <p>CNPJ: 12.345.678/0001-90</p>
                                <div className="border-b border-dashed border-slate-400 my-2"></div>
                                <p className="font-bold uppercase">RECIBO DE VENDA</p>
                                <p>Pedido Nº: {pedido.id}</p>
                                <p>{new Date(pedido.dataHora || pedido.data || Date.now()).toLocaleString('pt-BR')}</p>
                                <div className="border-b border-dashed border-slate-400 my-2"></div>
                            </div>
                            <div className="mb-4 space-y-1">
                                <p><span className="font-bold">Cliente:</span> {pedido.cliente?.nome || pedido.cliente || 'CONSUMIDOR FINAL'}</p>
                                <p><span className="font-bold">Viatura:</span> {pedido.veiculo?.modelo || pedido.veiculoDescricao || 'N/A'}</p>
                                <p><span className="font-bold">Vend:</span> {pedido.vendedorNome || pedido.vendedor || 'Sistema'}</p>
                            </div>
                            <div className="border-b border-dashed border-slate-400 my-2"></div>
                            <table className="w-full text-left mb-4">
                                <thead><tr><th className="pb-1">QTD</th><th className="pb-1">DESCRIÇÃO</th><th className="text-right pb-1">TOTAL</th></tr></thead>
                                <tbody>
                                {(pedido.itens || []).map((item, index) => (
                                    <tr key={index}>
                                        <td className="align-top py-1">{item.quantidade || item.qtd}x</td>
                                        <td className="align-top py-1 pr-2">
                                            {item.produto?.nome || item.nome || 'Produto'} <br/>
                                            <span className="text-[10px]">R$ {(item.precoUnitario || item.preco || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="align-top text-right py-1">R$ {((item.precoUnitario || item.preco || 0) * (item.quantidade || item.qtd || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="border-b border-dashed border-slate-400 my-2"></div>
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between"><span>Subtotal:</span><span>R$ {(pedido.valorSubtotal || pedido.subtotal || 0).toFixed(2)}</span></div>
                                {(pedido.desconto > 0) && <div className="flex justify-between"><span>Desconto:</span><span>- R$ {pedido.desconto.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-dashed border-slate-400">
                                    <span>TOTAL PAGO:</span><span>R$ {(pedido.valorTotal || pedido.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mt-1"><span>Pgto:</span><span className="font-bold uppercase">{pedido.pagamentos?.[0]?.metodo || pedido.metodoPagamento || 'N/A'}</span></div>
                            </div>
                            <div className="text-center mt-6">
                                <CheckCircle size={20} className="mx-auto mb-1 text-green-500" />
                                <p className="font-bold uppercase">Obrigado pela preferência!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white w-[800px] mx-auto p-10 shadow-2xl rounded-lg font-sans text-slate-900">
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900">GRANDPORT</h1>
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Auto Peças e Acessórios</p>
                                    <p className="text-sm mt-2">CNPJ: 12.345.678/0001-90</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-black uppercase bg-slate-100 border-2 border-slate-800 px-4 py-2 rounded-lg inline-block">RECIBO DE PAGAMENTO</h2>
                                    <p className="text-base font-bold mt-3">Pedido Nº: <span className="text-red-600">{pedido.id}</span></p>
                                    <p className="text-sm text-slate-600 mt-1">Data: {new Date(pedido.dataHora || pedido.data || Date.now()).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <div className="border-2 border-slate-200 p-6 mb-8 rounded-xl flex justify-between bg-slate-50">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Sacado / Cliente</p>
                                    <p className="font-black text-xl text-slate-800">{pedido.cliente?.nome || pedido.cliente || 'Consumidor Final'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Informações Adicionais</p>
                                    <p className="font-bold text-slate-800">Vendedor: <span className="font-medium text-slate-600">{pedido.vendedorNome || pedido.vendedor || 'N/A'}</span></p>
                                    <p className="font-bold text-slate-800 mt-1">Veículo: <span className="font-medium text-slate-600">{pedido.veiculo?.modelo || pedido.veiculoDescricao || 'N/A'}</span></p>
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
                                {(pedido.itens || []).map((item, index) => (
                                    <tr key={index} className="border-b border-slate-200">
                                        <td className="py-3 px-2 text-sm font-mono text-slate-500">{item.produto?.sku || item.sku || item.codigo || 'N/A'}</td>
                                        <td className="py-3 px-2 text-sm font-bold text-slate-800">{item.produto?.nome || item.nome || 'Produto'}</td>
                                        <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantidade || item.qtd || 0}</td>
                                        <td className="py-3 px-2 text-right text-sm text-slate-600">R$ {(item.precoUnitario || item.preco || 0).toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right font-black text-slate-800">R$ {((item.precoUnitario || item.preco || 0) * (item.quantidade || item.qtd || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end items-end mb-12 border-t-2 border-slate-800 pt-6">
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 w-64">
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1 tracking-widest">Pagamento</p>
                                    <p className="font-black text-lg text-slate-800 uppercase flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> {pedido.metodoPagamento || 'PIX'}</p>
                                </div>
                                <div className="w-72">
                                    <div className="flex justify-between border-b border-gray-300 py-2"><span className="text-sm font-bold text-slate-600">Subtotal:</span><span className="text-sm font-bold text-slate-800">R$ {(pedido.subtotal || pedido.valorSubtotal || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between border-b border-gray-300 py-2"><span className="text-sm font-bold text-slate-600">Desconto:</span><span className="text-sm font-bold text-orange-600">- R$ {(pedido.desconto || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between mt-4"><span className="text-xl font-black uppercase text-slate-800">Total Pago:</span><span className="text-3xl font-black text-green-600">R$ {(pedido.total || pedido.valorTotal || 0).toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div id="area-impressao-recibo" className="hidden print:block bg-white text-black font-sans">
                {formato === 'BOBINA' ? (
                    <div className="w-[80mm] mx-auto text-xs font-mono p-4">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-black uppercase">GRANDPORT AUTOPEÇAS</h2>
                            <p>CNPJ: 12.345.678/0001-90</p>
                            <div className="border-b border-dashed border-black my-2"></div>
                            <p className="font-bold uppercase">RECIBO DE VENDA</p>
                            <p>Pedido Nº: {pedido.id}</p>
                            <p>{new Date(pedido.dataHora || pedido.data || Date.now()).toLocaleString('pt-BR')}</p>
                            <div className="border-b border-dashed border-black my-2"></div>
                        </div>
                        <div className="mb-4 space-y-1">
                            <p><span className="font-bold">Cliente:</span> {pedido.cliente?.nome || pedido.cliente || 'CONSUMIDOR FINAL'}</p>
                            <p><span className="font-bold">Viatura:</span> {pedido.veiculo?.modelo || pedido.veiculoDescricao || 'N/A'}</p>
                            <p><span className="font-bold">Vend:</span> {pedido.vendedorNome || pedido.vendedor || 'Sistema'}</p>
                        </div>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <table className="w-full text-left mb-4">
                            <thead><tr><th className="pb-1">QTD</th><th className="pb-1">DESCRIÇÃO</th><th className="text-right pb-1">TOTAL</th></tr></thead>
                            <tbody>
                            {(pedido.itens || []).map((item, index) => (
                                <tr key={index}>
                                    <td className="align-top py-1 font-bold">{item.quantidade || item.qtd}x</td>
                                    <td className="align-top py-1 pr-1">{item.produto?.nome || item.nome || 'Produto'} <br/><span className="text-[10px]">R$ {(item.precoUnitario || item.preco || 0).toFixed(2)}</span></td>
                                    <td className="align-top text-right py-1 font-bold">R$ {((item.precoUnitario || item.preco || 0) * (item.quantidade || item.qtd || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <div className="space-y-1 mb-4">
                            <div className="flex justify-between"><span>Subtotal:</span><span>R$ {(pedido.subtotal || pedido.valorSubtotal || 0).toFixed(2)}</span></div>
                            {(pedido.desconto > 0) && <div className="flex justify-between"><span>Desconto:</span><span>- R$ {pedido.desconto.toFixed(2)}</span></div>}
                            <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-dashed border-black">
                                <span>TOTAL PAGO:</span><span>R$ {(pedido.total || pedido.valorTotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px]"><span>Pgto:</span><span className="font-bold uppercase">{pedido.metodoPagamento || 'PIX'}</span></div>
                        </div>
                    </div>
                ) : (
                    <div className="w-[210mm] mx-auto p-10 font-sans">
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-widest text-black">GRANDPORT</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-700">Auto Peças e Acessórios</p>
                                <p className="text-xs mt-2 text-black">CNPJ: 12.345.678/0001-90</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-black uppercase border-2 border-black px-4 py-2 rounded-lg inline-block text-black">RECIBO DE PAGAMENTO</h2>
                                <p className="text-sm font-bold mt-2 text-black">Nº {pedido.id} • Data: {new Date(pedido.dataHora || pedido.data || Date.now()).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <div className="border-2 border-black p-6 mb-6 rounded-lg flex justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Sacado / Cliente</p>
                                <p className="font-black text-xl text-black">{pedido.cliente?.nome || pedido.cliente || 'Consumidor Final'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase text-gray-600 mb-1">Informações Adicionais</p>
                                <p className="font-bold text-black">Vend: <span className="font-medium text-gray-700">{pedido.vendedorNome || pedido.vendedor || 'Sistema'}</span></p>
                                <p className="font-bold text-black mt-1">Veículo: <span className="font-medium text-gray-700">{pedido.veiculo?.modelo || pedido.veiculoDescricao || 'N/A'}</span></p>
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse mb-6">
                            <thead className="border-b-2 border-black">
                            <tr>
                                <th className="py-2 px-2 text-sm font-black uppercase text-black">Cód</th>
                                <th className="py-2 px-2 text-sm font-black uppercase text-black">Descrição da Peça</th>
                                <th className="py-2 px-2 text-center text-sm font-black uppercase text-black">Qtd</th>
                                <th className="py-2 px-2 text-right text-sm font-black uppercase text-black">Vl. Unit</th>
                                <th className="py-2 px-2 text-right text-sm font-black uppercase text-black">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(pedido.itens || []).map((item, index) => (
                                <tr key={index} className="border-b border-gray-400">
                                    <td className="py-3 px-2 text-sm font-mono text-black">{item.produto?.sku || item.sku || item.codigo || 'N/A'}</td>
                                    <td className="py-3 px-2 text-base font-bold text-black">{item.produto?.nome || item.nome || 'Produto'}</td>
                                    <td className="py-3 px-2 text-center font-bold text-black">{item.quantidade || item.qtd || 0}</td>
                                    <td className="py-3 px-2 text-right text-sm text-black">R$ {(item.precoUnitario || item.preco || 0).toFixed(2)}</td>
                                    <td className="py-3 px-2 text-right font-black text-black">R$ {((item.precoUnitario || item.preco || 0) * (item.quantidade || item.qtd || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="flex justify-between items-end mb-12 border-t-2 border-black pt-6">
                            <div className="border border-black p-4 w-64">
                                <p className="text-xs font-black uppercase text-gray-600 mb-1">Forma de Pagamento</p>
                                <p className="font-black text-lg text-black uppercase">{pedido.metodoPagamento || 'PIX'}</p>
                            </div>
                            <div className="w-80">
                                <div className="flex justify-between border-b border-gray-400 py-2"><span className="text-base font-bold text-black">Subtotal:</span><span className="text-base text-black">R$ {(pedido.subtotal || pedido.valorSubtotal || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between border-b border-gray-400 py-2"><span className="text-base font-bold text-black">Desconto:</span><span className="text-base text-black">- R$ {(pedido.desconto || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between mt-4 pt-2 border-t-2 border-black"><span className="text-xl font-black uppercase text-black">Total Pago:</span><span className="text-3xl font-black text-black">R$ {(pedido.total || pedido.valorTotal || 0).toFixed(2)}</span></div>
                            </div>
                        </div>
                        <div className="text-center mt-16 pt-8">
                            <div className="w-1/2 mx-auto border-t-2 border-black pt-2">
                                <p className="text-sm font-bold uppercase text-black">{pedido.cliente?.nome || pedido.cliente || 'Assinatura do Cliente'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
