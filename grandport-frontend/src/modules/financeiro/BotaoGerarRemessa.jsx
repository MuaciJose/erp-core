import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Download, Loader2, X, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export const BotaoGerarRemessa = () => {
    const [modalAberto, setModalAberto] = useState(false);
    const [contas, setContas] = useState([]);
    const [contaSelecionada, setContaSelecionada] = useState('');
    const [loading, setLoading] = useState(false);

    // Quando abre o modal, procura as contas bancárias disponíveis
    useEffect(() => {
        if (modalAberto) {
            api.get('/api/financeiro/contas-bancarias')
                .then(res => {
                    setContas(res.data);
                    if (res.data.length > 0) setContaSelecionada(res.data[0].id);
                })
                .catch(err => toast.error('Erro ao carregar contas bancárias.'));
        }
    }, [modalAberto]);

    const handleBaixarRemessa = async () => {
        if (!contaSelecionada) {
            toast.error("Selecione uma conta bancária primeiro!");
            return;
        }

        const idToast = toast.loading("A forjar o ficheiro CNAB...");
        setLoading(true);

        try {
            // 🚀 O SEGREDO ESTÁ AQUI: responseType: 'blob'
            const response = await api.get(`/api/financeiro/edi/remessa/gerar/${contaSelecionada}`, {
                responseType: 'blob'
            });

            // Cria um link temporário na memória do navegador
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Define o nome do ficheiro (ou tenta pegar do header, mas aqui forçamos um padrão)
            const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
            link.setAttribute('download', `REMESSA_${dataHoje}.txt`);

            // Simula o clique e limpa a memória
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast.success("Arquivo de Remessa descarregado com sucesso!", { id: idToast });
            setModalAberto(false);

        } catch (error) {
            console.error(error);
            if (error.response && error.response.data instanceof Blob) {
                // 🛡️ O erro veio misturado num ficheiro fantasma, vamos abrir e ler!
                const text = await error.response.data.text();
                try {
                    const jsonObj = JSON.parse(text);
                    toast.error(`Erro: ${jsonObj.message || jsonObj.error || "Falha na remessa"}`, { id: idToast });
                } catch (e) {
                    toast.error(`Erro: ${text}`, { id: idToast });
                }
            } else {
                toast.error("Erro ao gerar o arquivo de remessa.", { id: idToast });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* O BOTÃO QUE FICA NA TELA PRINCIPAL */}
            <button
                onClick={() => setModalAberto(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5"
            >
                <FileText size={18} />
                Gerar Remessa CNAB
            </button>

            {/* O MODAL DE ESCOLHA DO BANCO */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <FileText size={24} /> Emissão de Remessa
                                </h2>
                                <p className="text-indigo-200 text-sm font-medium mt-1">Gere o arquivo para enviar ao Banco.</p>
                            </div>
                            <button onClick={() => setModalAberto(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building size={16} /> Conta Bancária (Emissora)
                                </label>
                                <select
                                    value={contaSelecionada}
                                    onChange={(e) => setContaSelecionada(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="" disabled>Selecione a conta...</option>
                                    {contas.map(conta => (
                                        <option key={conta.id} value={conta.id}>
                                            {conta.nome} (Ag: {conta.agencia} / CC: {conta.numeroConta})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 font-medium">O sistema vai procurar todos os boletos PENDENTES desta conta.</p>
                            </div>

                            <button
                                onClick={handleBaixarRemessa}
                                disabled={loading || contas.length === 0}
                                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {loading ? 'GERANDO ARQUIVO...' : 'BAIXAR ARQUIVO .TXT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};