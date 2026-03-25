import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, FileText, Loader2, X, Building, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export const BotaoImprimirBoleto = ({ contaReceberId }) => {
    const [modalAberto, setModalAberto] = useState(false);
    const [contasBancarias, setContasBancarias] = useState([]);
    const [contaSelecionada, setContaSelecionada] = useState('');
    const [loading, setLoading] = useState(false);

    // Carrega as contas bancárias quando o modal abre
    useEffect(() => {
        if (modalAberto) {
            api.get('/api/financeiro/contas-bancarias')
                .then(res => {
                    setContasBancarias(res.data);
                    if (res.data.length > 0) setContaSelecionada(res.data[0].id);
                })
                .catch(err => toast.error('Erro ao carregar os bancos disponíveis.'));
        }
    }, [modalAberto]);

    const handleGerarBoleto = async () => {
        if (!contaSelecionada) {
            toast.error("Comandante, selecione a conta bancária emissora!");
            return;
        }

        const idToast = toast.loading("A forjar o PDF do Boleto...");
        setLoading(true);

        // 🚀 TÁTICA FANTASMA: Abre a aba imediatamente no clique para furar o bloqueio!
        const novaAba = window.open('', '_blank');
        if (novaAba) {
            novaAba.document.write('<h2 style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #333;">A contactar o Banco... A gerar o seu Boleto.</h2>');
        } else {
            toast.error("O navegador bloqueou a aba! Permita os pop-ups lá em cima.", { id: idToast });
            setLoading(false);
            return;
        }

        try {
            // Faz o pedido ao Java
            const response = await api.get(`/api/financeiro/boletos/${contaReceberId}/gerar-pdf/${contaSelecionada}`, {
                responseType: 'blob'
            });

            // Cria o ficheiro na memória
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            // 🚀 INJETA O PDF NA ABA QUE JÁ ESTAVA ABERTA
            novaAba.location.href = fileURL;

            toast.success("Boleto gerado com sucesso!", { id: idToast });
            setModalAberto(false);

        } catch (error) {
            console.error(error);
            novaAba.close(); // Se der erro, fecha a aba fantasma para não sujar a tela
            toast.error("Falha ao gerar o boleto.", { id: idToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* O BOTÃO QUE FICA NA TELA DE BAIXA */}
            <button
                onClick={() => setModalAberto(true)}
                className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 px-4 py-2 rounded-xl font-black flex items-center gap-2 shadow-sm transition-all"
            >
                <QrCode size={18} />
                GERAR BOLETO
            </button>

            {/* O MODAL DE CONFIGURAÇÃO DO BOLETO */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <FileText size={24} /> Emissão de Boleto
                                </h2>
                                <p className="text-blue-200 text-sm font-medium mt-1">Selecione o banco emissor para o cliente.</p>
                            </div>
                            <button onClick={() => setModalAberto(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building size={16} /> Banco Emissor
                                </label>
                                <select
                                    value={contaSelecionada}
                                    onChange={(e) => setContaSelecionada(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="" disabled>Selecione a conta...</option>
                                    {contasBancarias.map(conta => (
                                        <option key={conta.id} value={conta.id}>
                                            {conta.nome} (Ag: {conta.agencia} / CC: {conta.numeroConta})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleGerarBoleto}
                                disabled={loading || contasBancarias.length === 0}
                                className="w-full bg-slate-900 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                                {loading ? 'GERANDO PDF...' : 'IMPRIMIR BOLETO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};