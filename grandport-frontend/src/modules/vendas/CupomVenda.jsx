import React from 'react';

export const CupomVenda = ({ venda, itens, config }) => {
    // Trava de segurança: não imprime se a configuração estiver vazia
    if (!config || !venda) return null;

    let larguraCupom = 'max-w-[80mm]';
    let tamanhoTexto = 'text-[11px]';

    if (config.tamanhoImpressora === '58mm') {
        larguraCupom = 'max-w-[58mm]';
        tamanhoTexto = 'text-[9px]';
    } else if (config.tamanhoImpressora === 'A4') {
        larguraCupom = 'max-w-[210mm]';
        tamanhoTexto = 'text-sm';
    }

    const extrairNomeCliente = (cli) => {
        if (!cli) return 'CONSUMIDOR FINAL';
        if (typeof cli === 'string') return cli;
        return cli.nomeFantasia || cli.nome || cli.razaoSocial || 'CLIENTE CADASTRADO';
    };

    return (
        <>
            {/* O ID "recibo-pdv" é crucial para o CSS lá embaixo encontrar ele */}
            <div id="recibo-pdv" className="hidden print:block bg-white text-black font-mono">
                <div className={`mx-auto ${larguraCupom} ${config.tamanhoImpressora !== 'A4' ? 'p-2' : 'p-10'}`}>

                    {/* CABEÇALHO DA EMPRESA */}
                    <div className="text-center border-b border-black pb-2 mb-2 border-dashed" title="Dados cadastrais da empresa emissora">
                        <h1 className="font-black text-lg uppercase leading-none mb-1" title="Nome Fantasia da Unidade">{config.nomeFantasia || 'NOME DA LOJA'}</h1>
                        {config.razaoSocial && <p className={`${tamanhoTexto} uppercase leading-tight`} title="Razão Social Completa">{config.razaoSocial}</p>}
                        {config.cnpj && <p className={`${tamanhoTexto} mt-1 font-bold`} title="CNPJ do Emissor">CNPJ: {config.cnpj}</p>}
                        {config.endereco && <p className={`${tamanhoTexto} whitespace-pre-line mt-1`} title="Endereço Físico">{config.endereco}</p>}
                        {config.telefone && <p className={`${tamanhoTexto} mt-1`} title="Contato Telefônico">Tel: {config.telefone}</p>}
                    </div>

                    {/* DADOS DO PEDIDO */}
                    <div className={`border-b border-black pb-2 mb-2 border-dashed ${tamanhoTexto}`} title="Informações do documento e cliente">
                        <p className="font-black text-center mb-1" title="Número sequencial da venda">CUPOM NÃO FISCAL - #{venda.id}</p>
                        <p title="Instante exato da finalização"><strong>Data:</strong> {new Date(venda.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
                        <p title="Nome do comprador"><strong>Cliente:</strong> {extrairNomeCliente(venda.cliente)}</p>
                        {config.exibirVendedorCupom && <p title="Operador ou Vendedor responsável"><strong>Vendedor:</strong> {venda.vendedor || 'Caixa'}</p>}
                    </div>

                    {/* ITENS DA COMPRA */}
                    <table className={`w-full text-left mb-2 ${tamanhoTexto}`} title="Lista de mercadorias vendidas">
                        <thead>
                        <tr className="border-b border-black border-dashed">
                            <th className="pb-1">DESCRIÇÃO</th>
                            <th className="pb-1 text-center">QTD</th>
                            <th className="pb-1 text-right">TOTAL</th>
                        </tr>
                        </thead>
                        <tbody className="align-top">
                        {itens.map((item, index) => {
                            const preco = Number(item.precoVenda) || Number(item.preco) || 0;
                            const qtd = Number(item.qtd) || Number(item.quantidade) || 0;
                            return (
                                <tr key={index} className="border-b border-gray-300 border-dotted" title={`Código SKU: ${item.sku || 'S/N'}`}>
                                    <td className="py-1 pr-1">
                                        <p className="font-bold">{item.nome}</p>
                                        <p className="text-[9px] text-gray-500">{item.sku || 'S/N'}</p>
                                    </td>
                                    <td className="py-1 text-center" title="Quantidade entregue">{qtd}</td>
                                    <td className="py-1 text-right" title="Subtotal do item">{(preco * qtd).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    {/* TOTAIS E PAGAMENTO */}
                    <div className={`border-t border-black pt-1 mb-2 border-dashed flex flex-col items-end ${tamanhoTexto}`} title="Resumo financeiro e método de recebimento">
                        <div className="w-full flex justify-between font-black text-sm mt-1 pt-1 border-t border-black" title="Valor final pago pelo cliente">
                            <span>TOTAL:</span>
                            <span>R$ {(Number(venda.total) || 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full flex justify-between mt-2 font-bold" title="Forma de pagamento escolhida">
                            <span>Pagamento:</span>
                            <span className="uppercase">{venda.metodoPagamento || 'DINHEIRO'}</span>
                        </div>
                    </div>

                    {/* MENSAGEM DE RODAPÉ */}
                    <div className={`text-center mt-4 ${tamanhoTexto}`}>
                        <p className="whitespace-pre-line font-bold" title="Mensagem configurada pelo administrador">{config.mensagemRodape}</p>
                        <p className="mt-2 text-[8px] text-gray-400 font-sans" title="Assinatura do Software">Gerado por Grandport ERP</p>
                    </div>
                </div>
            </div>

            {/* A MÁGICA ACONTECE AQUI: Força o navegador a imprimir do jeito certo */}
            <style>{`
                @media print {
                    /* 1. Esconde TUDO no navegador */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* 2. Remove as travas de tela cheia do React (Isso causa a folha branca!) */
                    html, body, #root {
                        height: auto !important;
                        width: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        background-color: white !important;
                    }

                    /* 3. Mostra APENAS o recibo que criamos ali em cima */
                    #recibo-pdv, #recibo-pdv * {
                        visibility: visible;
                    }
                    
                    /* 4. Posiciona o recibo no topo esquerdo do papel */
                    #recibo-pdv {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }

                    /* 5. Tira as margens padrão do navegador */
                    @page {
                        margin: 0;
                    }
                }
            `}</style>
        </>
    );
};