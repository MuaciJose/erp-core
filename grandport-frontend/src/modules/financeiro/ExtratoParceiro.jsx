import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Printer, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // 🚀 Usado para avisos mais profissionais que o alert()

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
                toast.error("Erro ao carregar os dados do extrato.");
            } finally {
                setLoading(false);
            }
        };
        if (clienteId) carregarExtrato();
    }, [clienteId]);

    // 🚀 NOVA LÓGICA DE WHATSAPP DIRETO
    const abrirWhatsAppCobranca = () => {
        if (!extrato || !extrato.itens || extrato.itens.length === 0) {
            toast.error("Não há dívidas em aberto para cobrar.");
            return;
        }

        // 1. Monta o texto bonitinho com emojis e negrito
        let texto = `*GRANDPORT AUTOPEÇAS* 🚗\n`;
        texto += `Olá, *${extrato.clienteNome}*! Tudo bem?\n`;
        texto += `Segue o resumo do seu fechamento em aberto:\n\n`;

        extrato.itens.forEach(item => {
            texto += `📅 Venc: ${new Date(item.dataVencimento).toLocaleDateString()}\n`;
            texto += `▪️ Valor: *R$ ${Number(item.valor).toFixed(2)}*\n\n`;
        });

        texto += `💰 *TOTAL A PAGAR: R$ ${Number(extrato.totalDevido).toFixed(2)}*\n\n`;
        texto += `Nossa chave PIX (CNPJ): 00.000.000/0001-00\n`;
        texto += `Qualquer dúvida, estamos à disposição!`;

        // 2. Verifica se o backend mandou o telefone do cliente junto com o extrato
        const telefoneBruto = extrato.telefone || extrato.celular || '';
        const apenasNumeros = telefoneBruto.replace(/\D/g, ''); // Limpa parênteses e traços

        if (apenasNumeros && apenasNumeros.length >= 10) {
            // Se tiver telefone, garante que tem o '55' do Brasil na frente e abre o Zap direto!
            const numeroFinal = apenasNumeros.startsWith('55') ? apenasNumeros : `55${apenasNumeros}`;
            const url = `https://wa.me/${numeroFinal}?text=${encodeURIComponent(texto)}`;

            window.open(url, '_blank');
            toast.success("Abrindo conversa no WhatsApp...", { icon: '💬' });
        } else {
            // Plano B: Se o cliente não tem telefone cadastrado, copia pro mouse
            navigator.clipboard.writeText(texto);
            toast.success("Cliente sem telefone! O texto foi copiado, cole no seu WhatsApp.", {
                duration: 5000,
                icon: '📋'
            });
        }
    };

    if (loading) return (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 font-bold gap-3">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            Buscando extrato financeiro...
        </div>
    );

    if (!extrato) return <div className="p-8 text-center text-red-500 font-bold">Não foi possível carregar o extrato do cliente.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            {/* TELA NORMAL DE PC/CELULAR */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden print:hidden">

                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <button onClick={onVoltar} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-slate-600"/>
                            </button>
                            EXTRATO DE COMPRAS
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 ml-12">Cliente: <span className="font-bold text-gray-800">{extrato.clienteNome}</span></p>
                        <p className="text-sm text-gray-500 ml-12">Documento: {extrato.documento || 'Não informado'}</p>
                    </div>
                    <div className="text-right bg-red-50 p-4 rounded-xl border border-red-100 shadow-inner">
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Total em Aberto</p>
                        <p className="text-3xl font-black text-red-600">R$ {Number(extrato.totalDevido).toFixed(2)}</p>
                    </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-black">Vencimento</th>
                            <th className="p-4 font-black">Descrição</th>
                            <th className="p-4 font-black text-right">Valor (R$)</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {(extrato.itens || []).length === 0 ? (
                            <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-bold">Não há débitos pendentes.</td></tr>
                        ) : (
                            extrato.itens.map((item) => (
                                <tr key={item.id || item.dataVencimento} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-700">{new Date(item.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 text-sm font-bold text-blue-600 uppercase tracking-wide">Venda a Prazo</td>
                                    <td className="p-4 text-sm font-black text-right text-slate-800">R$ {Number(item.valor).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={onVoltar} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        FECHAR EXTRATO
                    </button>
                    <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg">
                        <Printer size={20} /> IMPRIMIR NA BOBINA
                    </button>
                    <button
                        onClick={abrirWhatsAppCobranca}
                        disabled={(extrato.itens || []).length === 0}
                        className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageCircle size={22} /> ENVIAR COBRANÇA
                    </button>
                </div>
            </div>

            {/* 🚀 LAYOUT EXCLUSIVO PARA IMPRESSORA TÉRMICA (Oculto na tela, visível só na impressão) */}
            <div className="hidden print:block w-[80mm] p-2 font-mono text-black bg-white mx-auto">
                <div className="text-center mb-4">
                    <h1 className="text-lg font-black leading-none">GRANDPORT AUTOPEÇAS</h1>
                    <p className="font-bold border-y border-black border-dashed my-2 py-1 text-sm uppercase">EXTRATO DE DÉBITOS</p>
                </div>

                <div className="text-xs mb-3">
                    <p className="font-bold">Cliente: {extrato.clienteNome}</p>
                    <p>Emissão: {new Date().toLocaleString('pt-BR')}</p>
                </div>

                <div className="border-b border-black border-dashed my-2"></div>

                <div className="text-xs">
                    {(extrato.itens || []).map((item, i) => (
                        <div key={i} className="flex justify-between mb-1">
                            <span>Venc: {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}</span>
                            <span className="font-bold">R$ {Number(item.valor).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b border-black border-dashed my-2 pt-1"></div>

                <div className="flex justify-between font-black text-sm mt-2">
                    <span>TOTAL DEVIDO:</span>
                    <span>R$ {Number(extrato.totalDevido).toFixed(2)}</span>
                </div>

                <div className="mt-6 text-center text-[10px] text-gray-600">
                    <p className="font-bold mb-1">Chave PIX: 00.000.000/0001-00</p>
                    <p>Agradecemos a parceria!</p>
                </div>
            </div>
        </div>
    );
};