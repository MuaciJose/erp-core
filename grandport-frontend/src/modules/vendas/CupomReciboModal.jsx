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

    const handleImprimir = () => window.print();

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
    // LAYOUT 1: BOBINA TÉRMICA (Ultra Compacto)
    // ============================================================================
    const renderBobina = () => {
        const is58mm = tamanhoPapel === '58mm';
        const largura = is58mm ? 'max-w-[58mm] w-[58mm]' : 'max-w-[80mm] w-[80mm]';
        const txt = is58mm ? 'text-[8px]' : 'text-[10px]';

        return (
            <div className={`mx-auto ${largura} p-2 font-mono text-black leading-tight`}>
                <div className="text-center border-b border-black pb-1 mb-1 border-dashed">
                    <h1 className="text-sm font-black uppercase mb-1">{config.nomeFantasia || 'NOME DA LOJA'}</h1>
                    {config.cnpj && <p className={`${txt} font-bold`}>CNPJ: {config.cnpj}</p>}
                    {config.telefone && <p className={`${txt}`}>Tel: {config.telefone}</p>}
                </div>

                <div className={`border-b border-black pb-1 mb-1 border-dashed ${txt}`}>
                    <p className="font-black text-center mb-1 text-[11px]">{tituloCupom} #{pedido.id}</p>
                    <p><strong>Data:</strong> {new Date(pedido.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
                    <p className="truncate"><strong>Cli:</strong> {extrairNomeCliente(pedido.cliente)}</p>
                    {veiculoNome !== 'Nenhum' && <p className="truncate"><strong>Vei:</strong> {veiculoNome} {placa && `(${placa})`}</p>}
                    {config.exibirVendedorCupom && <p><strong>Vend:</strong> {vendedorNome}</p>}
                </div>

                <table className={`w-full text-left mb-1 ${txt}`}>
                    <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="pb-0.5">DESCRIÇÃO</th>
                        <th className="pb-0.5 text-center">QTD</th>
                        <th className="pb-0.5 text-right">TOTAL</th>
                    </tr>
                    </thead>
                    <tbody className="align-top">
                    {(pedido.itens || []).map((item, index) => {
                        const preco = Number(item.precoUnitario || item.preco) || 0;
                        const qtd = Number(item.quantidade || item.qtd) || 0;
                        return (
                            <tr key={index} className="border-b border-gray-300 border-dotted">
                                <td className="py-0.5 pr-1 leading-none">
                                    <p className="font-bold">{item.produto?.nome || item.nome}</p>
                                    <p className="text-[8px] text-gray-600">{item.produto?.sku || item.codigo || 'S/N'}</p>
                                </td>
                                <td className="py-0.5 text-center font-bold">{qtd}</td>
                                <td className="py-0.5 text-right font-bold">{(preco * qtd).toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

                <div className={`border-t border-black pt-1 mb-2 border-dashed flex flex-col items-end ${txt}`}>
                    {valorDesconto > 0 && <div className="w-full flex justify-between text-gray-600"><span>Subtotal:</span><span>{valorSubtotal.toFixed(2)}</span></div>}
                    {valorDesconto > 0 && <div className="w-full flex justify-between text-gray-600"><span>Desc:</span><span>-{valorDesconto.toFixed(2)}</span></div>}
                    <div className="w-full flex justify-between font-black mt-1 pt-1 border-t border-black text-xs"><span>TOTAL:</span><span>R$ {valorTotal.toFixed(2)}</span></div>
                    {!isOrcamento && <div className="w-full flex justify-between mt-1 font-bold"><span>Pagto:</span><span className="uppercase">{pedido.metodoPagamento || 'DINH'}</span></div>}
                </div>

                <div className={`text-center mt-2 ${txt}`}>
                    <p className="font-bold leading-tight">{isOrcamento ? 'Orcamento sujeito a alteracao.' : config.mensagemRodape}</p>
                </div>
            </div>
        );
    };

    // ============================================================================
    // LAYOUT 2: FOLHA A4 OFICIAL (Ultra Compacto / Econômico)
    // ============================================================================
    const renderA4 = () => {
        return (
            <div className="mx-auto w-[210mm] min-h-[297mm] p-8 font-sans bg-white text-slate-900 leading-snug">

                {/* CABEÇALHO */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                    <div className="max-w-md">
                        <h1 className="text-xl font-black uppercase tracking-tight">{config.nomeFantasia || 'NOME DA LOJA'}</h1>
                        {config.razaoSocial && <p className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">{config.razaoSocial}</p>}
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-700">
                            {config.cnpj && <span><strong>CNPJ:</strong> {config.cnpj}</span>}
                            {config.telefone && <span><strong>TEL:</strong> {config.telefone}</span>}
                            {config.endereco && <span className="w-full"><strong>END:</strong> {config.endereco}</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-black uppercase border border-slate-800 px-3 py-1 rounded bg-slate-50 inline-block">{tituloCupom}</h2>
                        <p className="text-base font-black mt-1">Nº {pedido.id}</p>
                        <p className="text-[10px] font-medium text-slate-600">Emitido: {new Date(pedido.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
                        {isOrcamento && <p className="text-[10px] font-bold text-red-600 mt-0.5">Válido por {config.diasValidadeOrcamento} dias</p>}
                    </div>
                </div>

                {/* DADOS DO CLIENTE E VEÍCULO (Caixa Baixa) */}
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

                {/* TABELA DE ITENS (Sem preenchimentos exagerados) */}
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
                        const nome = item.produto?.nome || item.nome || 'Produto Indefinido';
                        const codigo = item.produto?.sku || item.codigo || 'S/N';
                        return (
                            <tr key={index} className="border-b border-slate-200 text-[11px]">
                                <td className="py-1 px-1 font-mono text-slate-600">{codigo}</td>
                                <td className="py-1 px-1 font-bold text-slate-900">{nome}</td>
                                <td className="py-1 px-1 text-center font-bold">{qtd}</td>
                                <td className="py-1 px-1 text-right text-slate-700">R$ {preco.toFixed(2)}</td>
                                <td className="py-1 px-1 text-right font-black text-slate-900">R$ {(preco * qtd).toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>

                {/* TOTAIS E ASSINATURA */}
                <div className="flex justify-between items-end mt-4">
                    <div className="w-1/2">
                        {!isOrcamento && (
                            <div className="mb-4">
                                <p className="text-[9px] font-black uppercase text-slate-500 mb-0.5">Pagamento</p>
                                <p className="font-bold text-xs text-slate-800 uppercase">{pedido.metodoPagamento || 'DINHEIRO'}</p>
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

                {/* RODAPÉ A4 */}
                <div className="text-center mt-6 text-[10px] text-slate-500 font-medium">
                    <p>{isOrcamento ? 'Orçamento sujeito a alteração de valores e disponibilidade de estoque.' : config.mensagemRodape}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 print:p-0 print:bg-white print:backdrop-blur-none overflow-y-auto custom-scrollbar">

            <div className="fixed top-4 left-4 flex gap-2 print:hidden z-[10000] bg-white p-2 rounded-xl shadow-xl border border-slate-200">
                <button onClick={() => setTamanhoPapel('80mm')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tamanhoPapel === '80mm' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}><ScrollText size={16} /> Bobina 80mm</button>
                <button onClick={() => setTamanhoPapel('A4')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tamanhoPapel === 'A4' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}><FileText size={16} /> Folha A4</button>
            </div>

            <div className="fixed top-4 right-4 flex gap-4 print:hidden z-[10000]">
                <button onClick={handleImprimir} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-black shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-transform transform hover:scale-105"><Printer size={18} /> IMPRIMIR {isOrcamento ? 'ORÇAMENTO' : 'DOCUMENTO'}</button>
                <button onClick={onClose} className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-red-500 shadow-lg transition-colors"><X size={20} /></button>
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
                }
            `}</style>
        </div>
    );
};