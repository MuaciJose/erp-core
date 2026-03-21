import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Printer, MessageCircle, ArrowLeft, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const ExtratoParceiro = ({ clienteId, onVoltar }) => {
    const [extrato, setExtrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gerandoPdf, setGerandoPdf] = useState(false);

    useEffect(() => {
        const carregarExtrato = async () => {
            try {
                // A API original que trás os dados JSON pra desenhar a tela
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

    // 🚀 LÓGICA PARA PUXAR O PDF OFICIAL (Usando a Central de Layouts)
    const imprimirExtratoOficial = async () => {
        setGerandoPdf(true);
        const loadId = toast.loading('Gerando PDF Oficial...');

        try {
            // Chama a rota que você configurou lá no FinanceiroController.java
            const response = await api.get(`/api/financeiro/extrato-cliente/${clienteId}/pdf`, {
                responseType: 'blob', // Importante para receber arquivos
                headers: { 'Accept': 'application/pdf' }
            });

            // Abre o PDF em uma nova aba para o cliente ver e imprimir
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const pdfWindow = window.open();
            if (pdfWindow) {
                pdfWindow.location.href = fileURL;
                toast.success('Extrato gerado com sucesso!', { id: loadId });
            } else {
                // Se o navegador bloquear o popup, baixa o arquivo
                const link = document.createElement('a');
                link.href = fileURL;
                link.download = `Extrato_Cliente_${clienteId}.pdf`;
                link.click();
                toast.success('Extrato baixado com sucesso!', { id: loadId });
            }

        } catch (error) {
            console.error("Erro ao gerar PDF", error);
            toast.error('Erro ao gerar o documento PDF.', { id: loadId });
        } finally {
            setGerandoPdf(false);
        }
    };

    const enviarWhatsAppBackend = async () => {
        if (!extrato || !extrato.itens || extrato.itens.length === 0) {
            toast.error("Não há dívidas em aberto para cobrar.");
            return;
        }

        const telefoneBruto = extrato.parceiro?.telefone || extrato.telefone || extrato.celular || '';
        const apenasNumeros = telefoneBruto.replace(/\D/g, '');

        if (!apenasNumeros || apenasNumeros.length < 10) {
            toast.error("Este cliente não tem um celular válido cadastrado.");
            return;
        }

        const loadId = toast.loading('Disparando PDF pelo motor do WhatsApp...');
        try {
            // 🚀 Chama a sua rota nova que gera o PDF e manda direto pelo Zap!
            await api.post(`/api/financeiro/extrato-cliente/${clienteId}/whatsapp?telefone=${apenasNumeros}`);
            toast.success('Extrato em PDF enviado com sucesso pelo WhatsApp!', { id: loadId });
        } catch (error) {
            toast.error('Falha no motor do WhatsApp. Verifique a conexão em Configurações.', { id: loadId });
        }
    };

    if (loading) return (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 font-bold gap-3">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            Buscando extrato financeiro...
        </div>
    );

    if (!extrato) return <div className="p-8 text-center text-red-500 font-bold">Não foi possível carregar o extrato do cliente.</div>;

    // Adaptação caso a API mude o nome dos campos (clienteNome x parceiro.nome)
    const nomeDoCliente = extrato.clienteNome || extrato.parceiro?.nome || 'Desconhecido';
    const documentoCliente = extrato.documento || extrato.parceiro?.documento || 'Não informado';
    const listaDeItens = extrato.itens || extrato.contas || [];

    // Calcula o total devido se a API não mandar pronto
    const totalAberto = extrato.totalDevido || listaDeItens.reduce((acc, item) => acc + (item.valorOriginal || item.valor || 0), 0);

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">

                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <button onClick={onVoltar} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-slate-600"/>
                            </button>
                            EXTRATO DE CONTAS A RECEBER
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 ml-12">Cliente: <span className="font-bold text-gray-800">{nomeDoCliente}</span></p>
                        <p className="text-sm text-gray-500 ml-12">Documento: {documentoCliente}</p>
                    </div>
                    <div className="text-right bg-red-50 p-4 rounded-xl border border-red-100 shadow-inner">
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Total em Aberto</p>
                        <p className="text-3xl font-black text-red-600">R$ {Number(totalAberto).toFixed(2)}</p>
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
                        {listaDeItens.length === 0 ? (
                            <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-bold">Não há débitos pendentes.</td></tr>
                        ) : (
                            listaDeItens.map((item) => (
                                <tr key={item.id || item.dataVencimento} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-sm font-bold text-slate-700">{new Date(item.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 text-sm font-bold text-blue-600 uppercase tracking-wide">{item.descricao || 'Venda a Prazo'}</td>
                                    <td className="p-4 text-sm font-black text-right text-slate-800">R$ {Number(item.valorOriginal || item.valor).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={onVoltar} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        FECHAR TELA
                    </button>

                    {/* 🚀 BOTÃO NOVO QUE CHAMA O JAVA */}
                    <button
                        onClick={imprimirExtratoOficial}
                        disabled={gerandoPdf}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                    >
                        {gerandoPdf ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                        IMPRIMIR PDF (A4)
                    </button>

                    {/* 🚀 BOTÃO NOVO DO WHATSAPP VIA BACKEND */}
                    <button
                        onClick={enviarWhatsAppBackend}
                        disabled={listaDeItens.length === 0}
                        className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageCircle size={22} /> ENVIAR PELO MOTOR ZAP
                    </button>
                </div>
            </div>
        </div>
    );
};