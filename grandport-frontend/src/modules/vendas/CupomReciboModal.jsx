import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, ScrollText, FileText } from 'lucide-react';
import api from '../../api/axios';

export const CupomReciboModal = ({ pedido, onClose }) => {
    const [config, setConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [tamanhoPapel, setTamanhoPapel] = useState('80mm');

    useEffect(() => {
        const carregarConfig = async () => {
            try {
                const res = await api.get('/api/configuracoes');
                setConfig(res.data);
                setTamanhoPapel(res.data.tamanhoImpressora || '80mm');
            } catch (error) {
                console.error("Erro ao buscar configs", error);
                setConfig({
                    nomeFantasia: 'GRANDPORT AUTOPEÇAS',
                    cnpj: '', endereco: '', telefone: '',
                    mensagemRodape: 'Obrigado pela preferência!',
                    exibirVendedorCupom: true, diasValidadeOrcamento: 5
                });
            } finally {
                setLoadingConfig(false);
            }
        };
        carregarConfig();
    }, []);

    const handleImprimir = () => {
        setTimeout(() => window.print(), 300);
    };

    if (loadingConfig || !config) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-[9999] text-white print:hidden">
                <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                <h2 className="font-black tracking-widest">PREPARANDO DOCUMENTO...</h2>
            </div>
        );
    }

    const extrairNomeCliente = (cli) => {
        if (!cli) return 'CONSUMIDOR FINAL';
        if (typeof cli === 'string') return cli;
        return cli.nomeFantasia || cli.nome || cli.razaoSocial || 'CLIENTE CADASTRADO';
    };

    const isOrcamento = pedido.status === 'ORCAMENTO';
    const tituloCupom = isOrcamento ? `ORÇAMENTO` : `DOCUMENTO NÃO FISCAL`;

    const valorSubtotal = Number(pedido.valorSubtotal || pedido.subtotal || pedido.total) || 0;
    const valorDesconto = Number(pedido.desconto) || 0;
    const valorTotal = Number(pedido.valorTotal || pedido.total) || 0;
    const vendedorNome = pedido.vendedorNome || pedido.vendedor || 'Sistema';

    const veiculoNome = typeof pedido.veiculo === 'string' ? pedido.veiculo : (pedido.veiculoDescricao || pedido.veiculo?.modelo || 'Nenhum');
    const veiculoObj = pedido.veiculoObj || (typeof pedido.veiculo === 'object' ? pedido.veiculo : null) || {};
    const placa = veiculoObj.placa || '';
    const kmAtual = veiculoObj.kmAtual || veiculoObj.quilometragem || '';

    // ============================================================================
    // 🚀 LÓGICA DE DETECÇÃO DE PROMISSÓRIAS (A_PRAZO)
    // ============================================================================
    // Verifica se na lista de pagamentos tem algum "A_PRAZO"
    const pagamentosPrazo = (pedido.pagamentos || []).filter(p => p.metodo === 'A_PRAZO' || p.metodo === 'PROMISSORIA');

    // Calcula o valor de cada parcela
    const gerarParcelasPromissoria = () => {
        if (pagamentosPrazo.length === 0) return [];

        let parcelas = [];
        pagamentosPrazo.forEach(pag => {
            const numParcelas = pag.parcelas || 1;
            const valorParcela = pag.valor / numParcelas;

            for (let i = 1; i <= numParcelas; i++) {
                // Adiciona 30 dias para cada parcela a partir de hoje
                let dataVencimento = new Date(pedido.dataHora || Date.now());
                dataVencimento.setDate(dataVencimento.getDate() + (30 * i));

                parcelas.push({
                    numero: i,
                    totalParcelas: numParcelas,
                    valor: valorParcela,
                    vencimento: dataVencimento,
                    pedidoId: pedido.id
                });
            }
        });
        return parcelas;
    };

    const parcelasPromissoria = gerarParcelasPromissoria();
    const possuiPromissoria = parcelasPromissoria.length > 0;

    // ============================================================================
    // LAYOUT 1: BOBINA TÉRMICA
    // ============================================================================
    const renderBobina = () => {
        const is58mm = tamanhoPapel === '58mm';
        const largura = is58mm ? 'max-w-[58mm] w-[58mm]' : 'max-w-[80mm] w-[80mm]';
        const txt = is58mm ? 'text-[10px]' : 'text-xs';

        return (
            <div className={`mx-auto ${largura} p-4 font-mono text-black`}>
                <div className="text-center border-b border-black pb-3 mb-3 border-dashed">
                    <h1 className="text-lg font-black uppercase leading-none mb-2">{config.nomeFantasia || 'NOME DA LOJA'}</h1>
                    {config.razaoSocial && <p className={`${txt} uppercase leading-tight`}>{config.razaoSocial}</p>}
                    {config.cnpj && <p className={`${txt} mt-1 font-bold`}>CNPJ: {config.cnpj}</p>}
                    {config.endereco && <p className={`${txt} whitespace-pre-line mt-1`}>{config.endereco}</p>}
                    {config.telefone && <p className={`${txt} mt-1`}>Tel: {config.telefone}</p>}
                </div>

                <div className={`border-b border-black pb-3 mb-3 border-dashed ${txt}`}>
                    <p className="font-black text-center mb-2 text-[10px]">{tituloCupom} - #{pedido.id}</p>
                    <p><strong>Data:</strong> {new Date(pedido.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
                    <p><strong>Cliente:</strong> {extrairNomeCliente(pedido.cliente)}</p>
                    {veiculoNome !== 'Nenhum' && <p><strong>Veículo:</strong> {veiculoNome} {placa && `(${placa})`}</p>}
                    {config.exibirVendedorCupom && <p><strong>Vend:</strong> {vendedorNome}</p>}
                    {isOrcamento && <p className="font-bold mt-1">Válido por {config.diasValidadeOrcamento} dias.</p>}
                </div>

                <table className={`w-full text-left mb-4 ${txt}`}>
                    <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="pb-2 w-2/3">DESCRIÇÃO</th>
                        <th className="pb-2 text-center">QTD</th>
                        <th className="pb-2 text-right">TOTAL</th>
                    </tr>
                    </thead>
                    <tbody className="align-top">
                    {(pedido.itens || []).map((item, index) => {
                        const preco = Number(item.precoUnitario || item.preco) || 0;
                        const qtd = Number(item.quantidade || item.qtd) || 0;
                        return (
                            <tr key={index} className="border-b border-gray-300 border-dotted">
                                <td className="py-2 pr-1">
                                    <p className="font-bold">{item.produto?.nome || item.nome}</p>
                                    <p className="text-[10px] text-gray-500">Cód: {item.produto?.sku || item.codigo || 'S/N'}</p>
                                </td>
                                <td className="py-2 text-center font-bold">{qtd}</td>
                                <td className="py-2 text-right font-bold">{(preco * qtd).toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

                <div className={`border-t border-black pt-2 mb-4 border-dashed flex flex-col items-end ${txt}`}>
                    <div className="w-full flex justify-between mb-1 text-gray-600"><span>Subtotal:</span><span>R$ {valorSubtotal.toFixed(2)}</span></div>
                    {valorDesconto > 0 && <div className="w-full flex justify-between mb-1 text-gray-600"><span>Desconto:</span><span>- R$ {valorDesconto.toFixed(2)}</span></div>}
                    <div className="w-full flex justify-between font-black mt-2 pt-2 border-t border-black text-sm"><span>TOTAL:</span><span>R$ {valorTotal.toFixed(2)}</span></div>

                    {/* Lista os métodos de pagamento reais se tiver */}
                    {!isOrcamento && pedido.pagamentos && pedido.pagamentos.length > 0 ? (
                        <div className="w-full mt-3 pt-2 border-t border-gray-300 border-dotted">
                            <p className="font-bold mb-1">Pagamentos:</p>
                            {pedido.pagamentos.map((pag, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] uppercase">
                                    <span>{pag.metodo.replace('_', ' ')} {pag.parcelas > 1 ? `(${pag.parcelas}x)` : ''}</span>
                                    <span>R$ {Number(pag.valor).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !isOrcamento && <div className="w-full flex justify-between mt-3 font-bold text-[10px]"><span>Pagamento:</span><span className="uppercase">{pedido.metodoPagamento || 'DINHEIRO'}</span></div>
                    )}
                </div>

                <div className={`text-center mt-6 ${txt}`}>
                    <p className="whitespace-pre-line font-bold">{isOrcamento ? 'Orçamento sujeito a alteração de valores.' : config.mensagemRodape}</p>
                    <p className="mt-4 text-[9px] text-gray-400 font-sans">Gerado por Grandport ERP</p>
                </div>

                {/* 🚀 ANEXO DE PROMISSÓRIAS NA BOBINA */}
                {possuiPromissoria && (
                    <div className="mt-8 break-before-page">
                        {parcelasPromissoria.map((parcela, idx) => (
                            <div key={idx} className="mb-8 pt-4 border-t-2 border-black border-dashed">
                                <h2 className="text-center font-black text-sm mb-1">NOTA PROMISSÓRIA</h2>
                                <p className="text-center text-[10px] font-bold mb-4">Pedido #{parcela.pedidoId} - Parcela {parcela.numero}/{parcela.totalParcelas}</p>

                                <div className="border border-black p-2 mb-3 bg-gray-100 flex justify-between">
                                    <span>VENCIMENTO</span>
                                    <span className="font-black">{parcela.vencimento.toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="border border-black p-2 mb-4 bg-gray-100 flex justify-between">
                                    <span>VALOR</span>
                                    <span className="font-black">R$ {parcela.valor.toFixed(2)}</span>
                                </div>

                                <p className="text-[10px] text-justify leading-tight mb-8">
                                    Ao(s) {parcela.vencimento.getDate()} dia(s) do mês de {parcela.vencimento.toLocaleString('pt-BR', { month: 'long' })} de {parcela.vencimento.getFullYear()}, pagarei(emos) por esta única via de NOTA PROMISSÓRIA à empresa <b>{config.nomeFantasia}</b>, CNPJ {config.cnpj}, ou à sua ordem, a quantia de <b>R$ {parcela.valor.toFixed(2)}</b> na praça de pagamento referida.
                                </p>

                                <div className="text-[10px]">
                                    <p className="mb-1"><strong>Emitente:</strong> {pedido.cliente?.nome}</p>
                                    <p className="mb-1"><strong>CPF/CNPJ:</strong> {pedido.cliente?.documento || '___________________'}</p>
                                    <p className="mb-8"><strong>Endereço:</strong> ____________________________________</p>
                                </div>

                                <div className="border-t border-black pt-1 text-center mt-12">
                                    <p className="text-[10px] font-bold">Assinatura do Cliente</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================================
    // LAYOUT 2: FOLHA A4 OFICIAL
    // ============================================================================
    const renderA4 = () => {
        return (
            <div className="mx-auto w-[210mm] min-h-[297mm] p-8 font-sans bg-white text-slate-900 leading-snug">

                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-4">
                        {config.logoBase64 && (
                            <img src={config.logoBase64} alt="Logo" className="w-20 h-20 object-contain" />
                        )}
                        <div className="max-w-md">
                            <h1 className="text-xl font-black uppercase tracking-tight">{config.nomeFantasia || 'NOME DA LOJA'}</h1>
                            {config.razaoSocial && <p className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">{config.razaoSocial}</p>}
                            <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-700">
                                {config.cnpj && <span><strong>CNPJ:</strong> {config.cnpj}</span>}
                                {config.telefone && <span><strong>TEL:</strong> {config.telefone}</span>}
                                {config.endereco && <span className="w-full"><strong>END:</strong> {config.endereco}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-sm font-black uppercase border border-slate-800 px-3 py-1 rounded bg-slate-50 inline-block">{tituloCupom}</h2>
                        <p className="text-base font-black mt-1">Nº {pedido.id}</p>
                        <p className="text-[10px] font-medium text-slate-600">Emitido: {new Date(pedido.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
                        {isOrcamento && <p className="text-[10px] font-bold text-red-600 mt-0.5">Válido por {config.diasValidadeOrcamento} dias</p>}
                    </div>
                </div>

                <div className="border border-slate-300 rounded p-2 mb-4 flex justify-between bg-slate-50 text-xs">
                    <div>
                        <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Cliente</p>
                        <p className="font-bold text-sm text-slate-900">{extrairNomeCliente(pedido.cliente)}</p>
                        {pedido.cliente?.documento && <p className="text-[10px] text-slate-600">CPF/CNPJ: {pedido.cliente.documento}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Veículo / Vendedor</p>
                        <p className="font-bold text-sm text-slate-900">{veiculoNome}</p>
                        {(placa || kmAtual) && (
                            <p className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                                {placa && `PLACA: ${placa} `} {kmAtual && `| KM: ${kmAtual}`}
                            </p>
                        )}
                        {config.exibirVendedorCupom && <p className="text-[10px] text-slate-600 mt-0.5">Vend: {vendedorNome}</p>}
                    </div>
                </div>

                <table className="w-full text-left border-collapse mb-4">
                    <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-800">
                        <th className="py-1 px-1 text-[10px] font-black uppercase w-24">Cód/SKU</th>
                        <th className="py-1 px-1 text-[10px] font-black uppercase">Descrição do Produto</th>
                        <th className="py-1 px-1 text-center text-[10px] font-black uppercase w-12">Qtd</th>
                        <th className="py-1 px-1 text-right text-[10px] font-black uppercase w-24">Vl. Unit</th>
                        <th className="py-1 px-1 text-right text-[10px] font-black uppercase w-28">Subtotal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(pedido.itens || []).map((item, index) => {
                        const preco = Number(item.precoUnitario || item.preco) || 0;
                        const qtd = Number(item.quantidade || item.qtd) || 0;
                        return (
                            <tr key={index} className="border-b border-slate-200 text-[11px]">
                                <td className="py-1 px-1 font-mono text-slate-600">{item.produto?.sku || item.codigo || 'S/N'}</td>
                                <td className="py-1 px-1 font-bold text-slate-900">{item.produto?.nome || item.nome}</td>
                                <td className="py-1 px-1 text-center font-bold">{qtd}</td>
                                <td className="py-1 px-1 text-right text-slate-700">R$ {preco.toFixed(2)}</td>
                                <td className="py-1 px-1 text-right font-black text-slate-900">R$ {(preco * qtd).toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

                <div className="flex justify-between items-end mt-4">
                    <div className="w-1/2">
                        {!isOrcamento && (
                            <div className="mb-4">
                                <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Pagamentos Lançados</p>
                                {pedido.pagamentos && pedido.pagamentos.length > 0 ? (
                                    pedido.pagamentos.map((pag, idx) => (
                                        <p key={idx} className="font-bold text-[10px] text-slate-800 uppercase">
                                            {pag.metodo.replace('_', ' ')} {pag.parcelas > 1 ? `(${pag.parcelas}x)` : ''} - R$ {Number(pag.valor).toFixed(2)}
                                        </p>
                                    ))
                                ) : (
                                    <p className="font-bold text-[10px] text-slate-800 uppercase">{pedido.metodoPagamento || 'DINHEIRO'}</p>
                                )}
                            </div>
                        )}
                        <div className="mt-8 border-t border-slate-400 w-3/4 pt-1 text-center">
                            <p className="text-[10px] font-bold text-slate-600">Assinatura do Cliente</p>
                        </div>
                    </div>

                    <div className="w-64 bg-slate-50 p-2 rounded border border-slate-300 text-xs">
                        <div className="flex justify-between mb-1 text-slate-700 font-medium"><span>Subtotal:</span><span>R$ {valorSubtotal.toFixed(2)}</span></div>
                        {valorDesconto > 0 && <div className="flex justify-between mb-1 text-orange-600 font-bold"><span>Desconto:</span><span>- R$ {valorDesconto.toFixed(2)}</span></div>}
                        <div className="flex justify-between font-black text-sm mt-1 pt-1 border-t border-slate-300 text-slate-900"><span>TOTAL:</span><span>R$ {valorTotal.toFixed(2)}</span></div>
                    </div>
                </div>

                <div className="text-center mt-6 text-[10px] text-slate-500 font-medium">
                    <p>{isOrcamento ? 'Orçamento sujeito a alteração de valores.' : config.mensagemRodape}</p>
                </div>

                {/* 🚀 ANEXO DE PROMISSÓRIAS NA FOLHA A4 */}
                {possuiPromissoria && (
                    <div className="mt-12 w-full print:break-before-page">
                        <h2 className="text-xl font-black text-center mb-8 uppercase text-slate-800">Títulos de Promissórias</h2>
                        <div className="grid grid-cols-2 gap-8">
                            {parcelasPromissoria.map((parcela, idx) => (
                                <div key={idx} className="border-2 border-slate-800 p-6 rounded-lg bg-slate-50 relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 font-black text-sm">
                                        Nº {parcela.numero}/{parcela.totalParcelas}
                                    </div>
                                    <div className="flex justify-between mb-4 mt-2">
                                        <div className="bg-white border border-slate-300 p-2 rounded">
                                            <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Vencimento</p>
                                            <p className="font-black text-sm">{parcela.vencimento.toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="bg-white border border-slate-300 p-2 rounded">
                                            <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Valor</p>
                                            <p className="font-black text-sm">R$ {parcela.valor.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-justify leading-relaxed mb-6 font-medium text-slate-800">
                                        Ao(s) {parcela.vencimento.getDate()} dia(s) do mês de {parcela.vencimento.toLocaleString('pt-BR', { month: 'long' })} de {parcela.vencimento.getFullYear()}, pagarei(emos) por esta única via de NOTA PROMISSÓRIA à empresa <b>{config.nomeFantasia}</b>, CNPJ {config.cnpj}, a quantia de <b>R$ {parcela.valor.toFixed(2)}</b>, sujeita a juros e multas de lei em caso de atraso.
                                    </p>

                                    <div className="text-[10px] mb-8">
                                        <p><strong>Emitente:</strong> {pedido.cliente?.nome}</p>
                                        <p><strong>CPF/CNPJ:</strong> {pedido.cliente?.documento || '___________________'}</p>
                                    </div>

                                    <div className="border-t border-slate-800 pt-1 text-center w-full mt-auto">
                                        <p className="text-[10px] font-bold">Assinatura</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 print:p-0 print:bg-white print:backdrop-blur-none overflow-y-auto custom-scrollbar">

            <div className="fixed top-4 left-4 flex gap-2 print:hidden z-[10000] bg-white p-2 rounded-xl shadow-xl border border-slate-200">
                <button
                    onClick={() => setTamanhoPapel('80mm')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tamanhoPapel === '80mm' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <ScrollText size={16} /> Bobina 80mm
                </button>
                <button
                    onClick={() => setTamanhoPapel('A4')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tamanhoPapel === 'A4' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <FileText size={16} /> Folha A4
                </button>
            </div>

            <div className="fixed top-4 right-4 flex gap-4 print:hidden z-[10000]">
                <button
                    onClick={handleImprimir}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-black shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-transform transform hover:scale-105"
                >
                    <Printer size={18} /> IMPRIMIR {isOrcamento ? 'ORÇAMENTO' : 'DOCUMENTO'}
                </button>
                <button
                    onClick={onClose}
                    className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-red-500 shadow-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div id="recibo-modal-print" className={`bg-white text-black shadow-2xl mt-20 mb-16 print:mt-0 print:mb-0 print:shadow-none ${tamanhoPapel === 'A4' ? 'border border-gray-300' : ''}`}>
                {tamanhoPapel === 'A4' ? renderA4() : renderBobina()}
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    html, body, #root { height: auto !important; width: auto !important; overflow: visible !important; position: static !important; background-color: white !important; }
                    #recibo-modal-print, #recibo-modal-print * { visibility: visible; }
                    #recibo-modal-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
                    @page { margin: 0; size: auto; }
                    .break-before-page { page-break-before: always; }
                }
            `}</style>
        </div>
    );
};