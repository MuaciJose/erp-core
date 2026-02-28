import React from 'react';

export const CupomVenda = ({ venda, itens }) => {
    return (
        <div className="print-only w-[80mm] p-2 font-mono text-[12px] leading-tight text-black bg-white hidden print:block">
            <div className="text-center mb-4">
                <h1 className="text-lg font-black tracking-tighter">GRANDPORT AUTOPEÇAS</h1>
                <p>Rua Exemplo, 123 - Centro</p>
                <p>CNPJ: 00.000.000/0001-00</p>
                <div className="border-b border-black border-dashed my-2"></div>
                <p className="font-bold">CUPOM NÃO FISCAL</p>
                <div className="border-b border-black border-dashed my-2"></div>
            </div>

            <div className="mb-2">
                <p>Data: {new Date().toLocaleString()}</p>
                <p>Vendedor: {venda.vendedor || 'BALCÃO'}</p>
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>
            
            <table className="w-full mb-2 text-left">
                <thead>
                    <tr>
                        <th className="w-1/2 uppercase text-[10px]">Item</th>
                        <th className="text-right uppercase text-[10px]">Qtd x Preço</th>
                    </tr>
                </thead>
                <tbody>
                    {itens.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 pr-1">
                                {item.nome.substring(0, 25)}
                                <br/>
                                <span className="text-[10px]">Ref: {item.referenciaOriginal || 'N/A'}</span>
                            </td>
                            <td className="text-right align-top">
                                {item.qtd} x {item.precoVenda.toFixed(2)}
                                <br/>
                                <strong>R$ {(item.qtd * item.precoVenda).toFixed(2)}</strong>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed mb-2"></div>

            <div className="flex justify-between text-sm font-bold">
                <span>TOTAL:</span>
                <span>R$ {venda.total.toFixed(2)}</span>
            </div>
            
            <div className="mt-4 text-center">
                <p className="text-[10px]">Obrigado pela preferência!</p>
                <p className="text-[10px]">Trocas somente com este cupom em até 7 dias.</p>
            </div>
            
            <div className="mt-6 text-center text-[8px]">
                ERP GrandPort - 2026
            </div>
        </div>
    );
};
