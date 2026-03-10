import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Clock, Download, Printer, Settings, Loader2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = () => {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    // Carrega todas as vendas concluídas do sistema
    const carregarVendas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/vendas');
            // Filtra apenas vendas que já foram pagas/concluídas no caixa
            const vendasPagas = res.data.filter(v => v.status === 'CONCLUIDA' || v.status === 'PAGA');
            setVendas(vendasPagas);
        } catch (error) {
            console.error("Erro ao carregar vendas para o fiscal:", error);
            toast.error("Erro ao carregar lista de notas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarVendas();
    }, []);

    // =========================================================================
    // 🚀 AÇÕES FISCAIS
    // =========================================================================

    // 1. Autorizar uma nova nota (Chama o NfeService do Java)
    const handleEmitirNota = async (vendaId) => {
        setProcessandoId(vendaId);
        const loadId = toast.loading('Enviando para a SEFAZ...');
        try {
            await api.post(`/api/fiscal/emitir/${vendaId}`);
            toast.success('Nota Autorizada com Sucesso!', { id: loadId });
            carregarVendas(); // Recarrega a lista para mostrar a chave verde
        } catch (error) {
            const msgErro = error.response?.data?.message || 'Erro na SEFAZ. Verifique o certificado ou a internet.';
            toast.error(msgErro, { id: loadId });
        } finally {
            setProcessandoId(null);
        }
    };

    // 2. Imprimir DANFE Autorizado (Com Anti-Bloqueador de Pop-ups)
    const handleImprimirDanfe = async (nfeId) => {
        const loadId = toast.loading('Buscando PDF do DANFE...');

        // 🚀 TRUQUE MÁGICO: Abre a aba antes do Java responder para o Chrome não bloquear!
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<h2 style="font-family: sans-serif; padding: 20px;">Buscando o seu PDF no servidor, por favor aguarde...</h2>');
        } else {
            toast.error("Por favor, permita os pop-ups no seu navegador para ver a nota.", { id: loadId });
        }

        try {
            const response = await api.get(`/api/fiscal/${nfeId}/danfe`, {
                responseType: 'blob',
                headers: { 'Accept': 'application/pdf' }
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Injeta o PDF na aba que já está aberta
            if (pdfWindow) {
                pdfWindow.location.href = fileURL;
            } else {
                // Se a aba foi bloqueada mesmo assim, força o download do arquivo
                const link = document.createElement('a');
                link.href = fileURL;
                link.download = `DANFE_${nfeId}.pdf`;
                link.click();
            }
            toast.success('DANFE Aberto!', { id: loadId });
        } catch (error) {
            if (pdfWindow) pdfWindow.close(); // Fecha a aba se der erro
            toast.error('Erro de Servidor: O Java não encontrou o layout do PDF.', { id: loadId });
            console.error("Erro ao gerar PDF:", error);
        }
    };

    // 3. Baixar XML para o Contador
    const handleBaixarXML = async (nfeId, chaveAcesso) => {
        const loadId = toast.loading('Baixando arquivo XML...');
        try {
            const response = await api.get(`/api/fiscal/${nfeId}/xml`, { responseType: 'blob' });
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `NFe_${chaveAcesso}.xml`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('XML baixado com sucesso!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao baixar o arquivo XML.', { id: loadId });
        }
    };

    // =========================================================================
    // RENDERIZAÇÃO E FILTROS
    // =========================================================================

    const vendasFiltradas = vendas.filter(venda => {
        const matchBusca =
            venda.id.toString().includes(busca) ||
            (venda.cliente?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
            (venda.notaFiscal?.chaveAcesso || '').includes(busca);

        const statusFiscal = venda.notaFiscal ? venda.notaFiscal.status : 'PENDENTE';
        let matchStatus = true;
        if (filtroStatus === 'PENDENTES') matchStatus = !venda.notaFiscal;
        if (filtroStatus === 'AUTORIZADAS') matchStatus = statusFiscal === 'AUTORIZADA';
        if (filtroStatus === 'ERRO') matchStatus = statusFiscal === 'ERRO' || statusFiscal === 'REJEITADA';

        return matchBusca && matchStatus;
    });

    const BadgeStatusFiscal = ({ nota }) => {
        if (!nota) return <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200"><Clock size={12}/> Pendente Emissão</span>;
        if (nota.status === 'AUTORIZADA') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle size={12}/> Autorizada</span>;
        if (nota.status === 'CANCELADA') return <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-300"><XCircle size={12}/> Cancelada</span>;
        return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><AlertCircle size={12}/> Rejeitada</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Módulo Fiscal (NF-e)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerenciamento de Notas Fiscais e XMLs para o contador.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                    <Settings size={18} /> Configurar Certificado
                </button>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por N.º Pedido, Cliente ou Chave de Acesso..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABELA DE NOTAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                        Carregando banco de dados fiscal...
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                            <th className="p-4 font-black">Pedido</th>
                            <th className="p-4 font-black">Data</th>
                            <th className="p-4 font-black">Cliente / Valor</th>
                            <th className="p-4 font-black">Status SEFAZ</th>
                            <th className="p-4 text-right font-black">Ações Fiscais</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {vendasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">
                                    Nenhuma venda encontrada para o filtro selecionado.
                                </td>
                            </tr>
                        ) : (
                            vendasFiltradas.map(venda => (
                                <tr key={venda.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-black">#{venda.id}</span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-600">
                                        {new Date(venda.dataHora).toLocaleDateString('pt-BR')} <br/>
                                        <span className="text-xs text-slate-400">{new Date(venda.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 text-sm">{venda.cliente?.nome || 'Consumidor Final'}</p>
                                        <p className="font-black text-green-600 text-xs mt-0.5">R$ {(venda.valorTotal || 0).toFixed(2)}</p>
                                    </td>
                                    <td className="p-4">
                                        <BadgeStatusFiscal nota={venda.notaFiscal} />
                                        {venda.notaFiscal?.chaveAcesso && (
                                            <p className="text-[10px] font-mono text-slate-400 mt-1" title="Chave de Acesso">
                                                {venda.notaFiscal.chaveAcesso}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">

                                            {/* 🚀 BOTÃO RENOMEADO PARA "AUTORIZAR NF-E" */}
                                            {!venda.notaFiscal && (
                                                <button
                                                    onClick={() => handleEmitirNota(venda.id)}
                                                    disabled={processandoId === venda.id}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
                                                >
                                                    {processandoId === venda.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                    AUTORIZAR NF-E
                                                </button>
                                            )}

                                            {venda.notaFiscal?.status === 'AUTORIZADA' && (
                                                <>
                                                    <button
                                                        onClick={() => handleImprimirDanfe(venda.notaFiscal.id)}
                                                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                        title="Visualizar/Imprimir DANFE"
                                                    >
                                                        <Printer size={14} /> DANFE
                                                    </button>
                                                    <button
                                                        onClick={() => handleBaixarXML(venda.notaFiscal.id, venda.notaFiscal.chaveAcesso)}
                                                        className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                        title="Baixar XML para o Contador"
                                                    >
                                                        <Download size={14} /> XML
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};