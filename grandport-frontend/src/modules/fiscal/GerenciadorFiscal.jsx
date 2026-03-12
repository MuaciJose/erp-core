import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Clock, Download, Printer, Settings, Loader2, XCircle, FilePlus2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = ({ setPaginaAtiva }) => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    // =========================================================================
    // 🚀 O "LIQUIDIFICADOR" DE DADOS (Blindado contra JSONs vazios)
    // =========================================================================
    const carregarDadosFiscais = async () => {
        setLoading(true);
        try {
            const [resVendas, resNotas] = await Promise.all([
                api.get('/api/vendas'),
                api.get('/api/fiscal/notas')
            ]);

            const unificados = [];

            // 1. Processa as Vendas do PDV (Pagas/Concluídas)
            const vendasPagas = resVendas.data.filter(v => v.status === 'CONCLUIDA' || v.status === 'PAGA');
            vendasPagas.forEach(v => {
                unificados.push({
                    uid: `venda_${v.id}`,
                    tipo: 'PDV',
                    vendaId: v.id,
                    nfeId: v.notaFiscal?.id || null,
                    numeroNota: v.notaFiscal?.numero || null,
                    data: v.dataHora || new Date().toISOString(), // Proteção de Data
                    clienteNome: v.cliente?.nome || 'Consumidor Final',
                    valorTotal: v.valorTotal || 0,
                    statusFiscal: v.notaFiscal?.status || 'PENDENTE',
                    chaveAcesso: v.notaFiscal?.chaveAcesso || null
                });
            });

            // 2. Processa as Notas Avulsas (🚀 Correção do filtro: usa !n.venda)
            const notasAvulsas = resNotas.data.filter(n => !n.venda);
            notasAvulsas.forEach(n => {
                unificados.push({
                    uid: `nota_${n.id}`,
                    tipo: 'AVULSA',
                    vendaId: null,
                    nfeId: n.id,
                    numeroNota: n.numero,
                    data: n.dataEmissao || new Date().toISOString(), // 🚀 Proteção caso o Java não tenha salvo a data
                    clienteNome: 'Emissão Manual (Avulsa)',
                    valorTotal: null,
                    statusFiscal: n.status || 'AUTORIZADA',
                    chaveAcesso: n.chaveAcesso
                });
            });

            // 3. Ordena tudo da mais recente para a mais antiga
            unificados.sort((a, b) => new Date(b.data) - new Date(a.data));

            setRegistros(unificados);
        } catch (error) {
            console.error("Erro ao carregar dados fiscais:", error);
            toast.error("Erro ao sincronizar as notas com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDadosFiscais();
    }, []);

    // =========================================================================
    // 🚀 AÇÕES FISCAIS
    // =========================================================================

    const handleEmitirNotaPDV = async (vendaId) => {
        setProcessandoId(vendaId);
        const loadId = toast.loading('Transmitindo para a SEFAZ...');
        try {
            await api.post(`/api/fiscal/emitir/${vendaId}`);
            toast.success('Nota Autorizada com Sucesso!', { id: loadId });
            carregarDadosFiscais();
        } catch (error) {
            const msgErro = error.response?.data?.message || 'Erro na SEFAZ. Verifique o certificado ou a internet.';
            toast.error(msgErro, { id: loadId });
        } finally {
            setProcessandoId(null);
        }
    };

    const handleImprimirDanfe = async (registro) => {
        const loadId = toast.loading('Buscando PDF do DANFE...');
        const pdfWindow = window.open('', '_blank');

        if (pdfWindow) {
            pdfWindow.document.write('<h2 style="font-family: sans-serif; padding: 20px; color: #334155;">Gerando o seu PDF no servidor, por favor aguarde...</h2>');
        } else {
            toast.error("Por favor, permita os pop-ups no seu navegador.", { id: loadId });
        }

        try {
            let url = registro.tipo === 'PDV'
                ? `/api/fiscal/${registro.nfeId}/danfe`
                : `/api/fiscal/danfe/avulsa/${registro.chaveAcesso}`;

            const response = await api.get(url, {
                responseType: 'blob',
                headers: { 'Accept': 'application/pdf' }
            });

            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            if (pdfWindow) {
                pdfWindow.location.href = fileURL;
            } else {
                const link = document.createElement('a');
                link.href = fileURL;
                link.download = `DANFE_${registro.numeroNota || registro.chaveAcesso}.pdf`;
                link.click();
            }
            toast.success('DANFE Aberto!', { id: loadId });
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao gerar PDF da nota.', { id: loadId });
        }
    };

    const handleBaixarXML = async (registro) => {
        const loadId = toast.loading('Baixando arquivo XML...');
        try {
            const response = await api.get(`/api/fiscal/${registro.nfeId}/xml`, { responseType: 'blob' });
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `NFe_${registro.chaveAcesso}.xml`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('XML baixado com sucesso!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao baixar o arquivo XML.', { id: loadId });
        }
    };

    // =========================================================================
    // FILTROS E COMPONENTES VISUAIS
    // =========================================================================

    const registrosFiltrados = registros.filter(reg => {
        const matchBusca =
            (reg.numeroNota && reg.numeroNota.toString().includes(busca)) ||
            (reg.vendaId && reg.vendaId.toString().includes(busca)) ||
            (reg.clienteNome && reg.clienteNome.toLowerCase().includes(busca.toLowerCase())) ||
            (reg.chaveAcesso || '').includes(busca);

        let matchStatus = true;
        if (filtroStatus === 'PENDENTES') matchStatus = reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'CONTINGENCIA';
        if (filtroStatus === 'AUTORIZADAS') matchStatus = reg.statusFiscal === 'AUTORIZADA';
        if (filtroStatus === 'ERRO') matchStatus = reg.statusFiscal === 'ERRO' || reg.statusFiscal === 'REJEITADA';

        return matchBusca && matchStatus;
    });

    const BadgeStatusFiscal = ({ status }) => {
        if (status === 'PENDENTE') return <span className="flex items-center gap-1 w-max text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200"><Clock size={12}/> Pendente</span>;
        if (status === 'AUTORIZADA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle size={12}/> Autorizada</span>;
        if (status === 'CONTINGENCIA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><AlertCircle size={12}/> Offline</span>;
        return <span className="flex items-center gap-1 w-max text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><AlertCircle size={12}/> Rejeitada</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Módulo Fiscal (NF-e)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerenciamento Central de Notas do PDV e Avulsas.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setPaginaAtiva('emitir-nfe-avulsa')}
                        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20"
                    >
                        <FilePlus2 size={18} /> Emitir NF-e Avulsa
                    </button>
                    <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        <Settings size={18} /> Certificado
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por N.º Nota, Pedido, Cliente ou Chave..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                        Sincronizando notas com a SEFAZ...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                <th className="p-4 font-black">Identificação</th>
                                <th className="p-4 font-black">Data</th>
                                <th className="p-4 font-black">Cliente / Valor</th>
                                <th className="p-4 font-black">Status SEFAZ</th>
                                <th className="p-4 text-right font-black">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {registrosFiltrados.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">Nenhuma nota encontrada.</td></tr>
                            ) : (
                                registrosFiltrados.map(reg => (
                                    <tr key={reg.uid} className="hover:bg-slate-50 transition-colors">

                                        <td className="p-4">
                                            {reg.numeroNota ? (
                                                <p className="font-black text-slate-800 text-sm">NFe Nº {reg.numeroNota}</p>
                                            ) : (
                                                <p className="font-black text-orange-500 text-sm">Sem Número</p>
                                            )}

                                            {reg.tipo === 'PDV' ? (
                                                <span className="text-xs text-slate-500 font-medium">Caixa: Venda #{reg.vendaId}</span>
                                            ) : (
                                                <span className="inline-block mt-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">
                                                    Nota Avulsa
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            {new Date(reg.data).toLocaleDateString('pt-BR')} <br/>
                                            <span className="text-xs text-slate-400">{new Date(reg.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>

                                        <td className="p-4">
                                            <p className={`font-bold text-sm truncate max-w-[200px] ${reg.tipo === 'AVULSA' ? 'text-purple-800' : 'text-slate-800'}`}>
                                                {reg.clienteNome}
                                            </p>
                                            {reg.valorTotal !== null && (
                                                <p className="font-black text-emerald-600 text-xs mt-0.5">R$ {reg.valorTotal.toFixed(2)}</p>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <BadgeStatusFiscal status={reg.statusFiscal} />
                                            {reg.chaveAcesso && (
                                                <p className="text-[10px] font-mono text-slate-400 mt-1" title="Chave de Acesso">
                                                    {reg.chaveAcesso}
                                                </p>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">

                                                {reg.tipo === 'PDV' && reg.statusFiscal === 'PENDENTE' && (
                                                    <button
                                                        onClick={() => handleEmitirNotaPDV(reg.vendaId)}
                                                        disabled={processandoId === reg.vendaId}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-colors disabled:opacity-50"
                                                    >
                                                        {processandoId === reg.vendaId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        AUTORIZAR NF-E
                                                    </button>
                                                )}

                                                {reg.chaveAcesso && (
                                                    <>
                                                        <button onClick={() => handleImprimirDanfe(reg)} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
                                                            <Printer size={14} /> DANFE
                                                        </button>
                                                        <button onClick={() => handleBaixarXML(reg)} className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
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
                    </div>
                )}
            </div>
        </div>
    );
};