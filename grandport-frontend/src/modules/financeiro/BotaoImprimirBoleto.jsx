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
        // 1. VALIDAÇÃO DE PRÉ-LANÇAMENTO
        if (!contaSelecionada) {
            alert("⚠️ Selecione uma Conta Bancária antes de gerar o boleto.");
            return;
        }

        try {
            setLoading(true); // Ativa o spinner do botão

            // 2. A MIRA CORRIGIDA
            // Usando a variável de estado real 'contaSelecionada'
            const urlDoJava = `/api/financeiro/boletos/${contaReceberId}/gerar-pdf/${contaSelecionada}`;

            const response = await api.get(urlDoJava, {
                responseType: 'blob'
            });

            const arquivoPdf = new Blob([response.data], { type: 'application/pdf' });
            const urlDoArquivo = window.URL.createObjectURL(arquivoPdf);
            window.open(urlDoArquivo, '_blank');

        } catch (error) {
            let mensagemAmigavel = "Ocorreu um erro de comunicação com o servidor.";
            if (error.response && (error.response.status === 400 || error.response.status === 500)) {
                mensagemAmigavel = "Falha na geração do PDF. O banco rejeitou os dados (Agência, Conta, ou IDs) por estarem fora do padrão matemático exigido.";
            }
            alert(`⚠️ ALERTA DO SISTEMA:\n\n${mensagemAmigavel}`);
            console.error("Erro Técnico detalhado:", error);
        } finally {
            setLoading(false); // Desativa o spinner independentemente de sucesso ou erro
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