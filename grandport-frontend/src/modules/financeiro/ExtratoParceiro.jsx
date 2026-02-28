import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Printer, MessageCircle } from 'lucide-react';

export const ExtratoParceiro = ({ clienteId, onVoltar }) => {
    const [extrato, setExtrato] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarExtrato = async () => {
            try {
                const res = await api.get(`/api/financeiro/extrato/${clienteId}`);
                setExtrato(res.data);
            } catch (err) {
                console.error("Erro ao carregar extrato", err);
            } finally {
                setLoading(false);
            }
        };
        if (clienteId) carregarExtrato();
    }, [clienteId]);

    const gerarTextoWhatsApp = () => {
        if (!extrato) return;

        let texto = `*GRANDPORT AUTOPEÇAS* 🚗\n`;
        texto += `Olá, *${extrato.clienteNome}*! Tudo bem?\n`;
        texto += `Segue o resumo do seu fechamento em aberto:\n\n`;

        extrato.itens.forEach(item => {
            texto += `📅 ${new Date(item.dataVencimento).toLocaleDateString()} - Venda\n`;
            texto += `▪️ Valor: *R$ ${item.valor.toFixed(2)}*\n`;
        });

        texto += `\n💰 *TOTAL A PAGAR: R$ ${extrato.totalDevido.toFixed(2)}*\n\n`;
        texto += `Nossa chave PIX (CNPJ): 00.000.000/0001-00\n`;
        texto += `Qualquer dúvida, estamos à disposição!`;

        navigator.clipboard.writeText(texto);
        alert("Texto de cobrança copiado! Agora é só colar no WhatsApp do cliente.");
    };

    if (loading) return <div className="p-8 text-center">Carregando extrato...</div>;
    if (!extrato) return <div className="p-8 text-center text-red-500">Não foi possível carregar o extrato.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <FileText className="text-blue-600" /> EXTRATO DE COMPRAS
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Cliente: <span className="font-bold text-gray-700">{extrato.clienteNome}</span></p>
                        <p className="text-sm text-gray-500">Documento: {extrato.documento}</p>
                    </div>
                    <div className="text-right bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Total em Aberto</p>
                        <p className="text-3xl font-black text-red-600">R$ {extrato.totalDevido.toFixed(2)}</p>
                    </div>
                </div>

                <div className="print-section mb-8">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Vencimento</th>
                                <th className="p-3">Descrição</th>
                                <th className="p-3 text-right rounded-tr-lg">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extrato.itens.map((item) => (
                                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 text-sm">{new Date(item.dataVencimento).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm font-bold text-blue-600">Venda a Prazo</td>
                                    <td className="p-3 text-sm font-black text-right">R$ {item.valor.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4 no-print">
                    <button onClick={onVoltar} className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all">VOLTAR</button>
                    <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                        <Printer size={20} /> IMPRIMIR
                    </button>
                    <button onClick={gerarTextoWhatsApp} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-900/20">
                        <MessageCircle size={20} /> COBRAR VIA WHATSAPP
                    </button>
                </div>
            </div>

            <div className="hidden print-only print:block w-[80mm] p-2 font-mono text-[12px] text-black bg-white">
                <div className="text-center mb-4">
                    <h1 className="text-lg font-black">GRANDPORT AUTOPEÇAS</h1>
                    <p className="font-bold border-y border-dashed my-2 py-1">EXTRATO DE DÉBITOS</p>
                </div>
                <p>Cliente: {extrato.clienteNome}</p>
                <p>Emissão: {new Date().toLocaleString()}</p>
                <div className="border-b border-dashed my-2"></div>
                {extrato.itens.map((item, i) => (
                    <div key={i} className="flex justify-between mb-1">
                        <span>Venc: {new Date(item.dataVencimento).toLocaleDateString()}</span>
                        <span>{item.valor.toFixed(2)}</span>
                    </div>
                ))}
                <div className="border-b border-dashed my-2"></div>
                <div className="flex justify-between font-bold text-sm">
                    <span>TOTAL DEVIDO:</span>
                    <span>R$ {extrato.totalDevido.toFixed(2)}</span>
                </div>
                <div className="mt-4 text-center text-[10px]">
                    <p>Chave PIX: 00.000.000/0001-00</p>
                    <p>Agradecemos a parceria!</p>
                </div>
            </div>
        </div>
    );
};
