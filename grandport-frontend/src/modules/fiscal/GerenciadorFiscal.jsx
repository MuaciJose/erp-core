import React, { useState, useEffect } from 'react';
import {
    Search, FileText, CheckCircle, AlertCircle, Clock, Download,
    Printer, Loader2, FilePlus2, Mail, CalendarDays, X, Receipt,
    ChevronLeft, ChevronRight, Calendar, Trash2, AlertTriangle, XCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = ({ setPaginaAtiva }) => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    // 🚀 ESTADOS DE FILTRO DE DATA
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // 🚀 ESTADOS DE PAGINAÇÃO
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
    const [fechamentoMes, setFechamentoMes] = useState(new Date().getMonth() + 1);
    const [fechamentoAno, setFechamentoAno] = useState(new Date().getFullYear());
    const [fechamentoEmail, setFechamentoEmail] = useState('contador@contabilidade.com.br');
    const [enviandoLote, setEnviandoLote] = useState(false);
    const [fechamentoMensagem, setFechamentoMensagem] = useState('Olá Contador,\n\nSeguem em anexo os arquivos XML e PDFs referentes ao fechamento deste mês.\n\nQualquer dúvida, estamos à disposição.');

    // 🚀 ESTADOS PARA CANCELAMENTO DA NOTA
    const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
    const [notaParaCancelar, setNotaParaCancelar] = useState(null);
    const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
    const [cancelandoNfe, setCancelandoNfe] = useState(false);

    // =======================================================================
    // 🚀 EXTRATOR DE ERROS DO JAVA
    // =======================================================================
    const extrairErroBackend = (error, mensagemPadrao) => {
        if (error?.response?.status === 403) return "Acesso Negado: Rota bloqueada pelo servidor (Erro 403).";
        if (error?.response?.status === 401) return "Sessão expirada. Por favor, recarregue a página e faça login novamente.";

        if (error?.response?.data) {
            if (typeof error.response.data === 'string') return error.response.data;
            if (error.response.data.message) return error.response.data.message;
            if (error.response.data.error) return error.response.data.error;
        }
        return error?.message || mensagemPadrao;
    };

    const isCupomFiscal = (chaveAcesso) => {
        if (!chaveAcesso || chaveAcesso.length < 22) return false;
        return chaveAcesso.substring(20, 22) === '65';
    };

    // 🚀 NOVA LOGICA: VERIFICA PRAZO SEFAZ (30 min cupom / 24h nota)
    const verificarPrazoCancelamento = (dataEmissao, chaveAcesso) => {
        if (!dataEmissao || !chaveAcesso) return { expirado: true, mensagem: '' };

        const dataNota = new Date(dataEmissao);
        const agora = new Date();
        const diffEmMinutos = (agora - dataNota) / (1000 * 60);

        if (isCupomFiscal(chaveAcesso)) {
            if (diffEmMinutos > 30) return { expirado: true, mensagem: 'Prazo de 30 min expirado' };
        } else {
            if (diffEmMinutos > 1440) return { expirado: true, mensagem: 'Prazo de 24h expirado' };
        }

        return { expirado: false, mensagem: '' };
    };

    const carregarDadosFiscais = async () => {
        setLoading(true);
        try {
            const [resVendas, resNotas] = await Promise.all([
                api.get('/api/vendas'),
                api.get('/api/fiscal/notas')
            ]);

            const unificados = [];
            const nfeIdsAdicionados = new Set();

            const vendasPagas = resVendas.data.filter(v => v.status === 'CONCLUIDA' || v.status === 'PAGA');
            vendasPagas.forEach(v => {
                if (v.notaFiscal?.id) {
                    nfeIdsAdicionados.add(v.notaFiscal.id);
                }

                unificados.push({
                    uid: `venda_${v.id}`,
                    tipo: 'PDV',
                    vendaId: v.id,
                    nfeId: v.notaFiscal?.id || null,
                    numeroNota: v.notaFiscal?.numero || null,
                    data: v.dataHora || new Date().toISOString(),
                    clienteNome: v.cliente?.nome || 'Consumidor Final',
                    valorTotal: v.valorTotal || 0,
                    statusFiscal: v.notaFiscal?.status || 'PENDENTE',
                    chaveAcesso: v.notaFiscal?.chaveAcesso || null
                });
            });

            resNotas.data.forEach(n => {
                if (!nfeIdsAdicionados.has(n.id)) {
                    unificados.push({
                        uid: `nota_${n.id}`,
                        tipo: 'AVULSA',
                        vendaId: null,
                        nfeId: n.id,
                        numeroNota: n.numero,
                        data: n.dataEmissao || new Date().toISOString(),
                        clienteNome: 'Emissão Manual (NF-e)',
                        valorTotal: null,
                        statusFiscal: n.status || 'AUTORIZADA',
                        chaveAcesso: n.chaveAcesso
                    });
                }
            });

            unificados.sort((a, b) => new Date(b.data) - new Date(a.data));
            setRegistros(unificados);
        } catch (error) {
            toast.error(extrairErroBackend(error, "Erro ao sincronizar as notas com o servidor."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDadosFiscais();
    }, []);

    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, filtroStatus, dataInicio, dataFim]);

    // =========================================================================
    // 🚀 LÓGICA DE CANCELAMENTO E EXCLUSÃO
    // =========================================================================
    const abrirModalCancelamento = (registro) => {
        setNotaParaCancelar(registro);
        setJustificativaCancelamento('');
        setModalCancelamentoAberto(true);
    };

    const handleCancelarNotaSefaz = async () => {
        if (justificativaCancelamento.length < 15) {
            return toast.error("A justificativa deve ter no mínimo 15 caracteres.");
        }

        setCancelandoNfe(true);
        const loadId = toast.loading("Transmitindo cancelamento para a SEFAZ...");

        try {
            if (notaParaCancelar.tipo === 'PDV' && notaParaCancelar.vendaId) {
                await api.post(`/api/vendas/${notaParaCancelar.vendaId}/cancelar-nfe`, { justificativa: justificativaCancelamento });
            } else {
                await api.post(`/api/fiscal/cancelar-nfe/${notaParaCancelar.nfeId}`, { justificativa: justificativaCancelamento });
            }

            toast.success("NF-e Cancelada com sucesso e inutilizada na SEFAZ!", { id: loadId });
            setModalCancelamentoAberto(false);
            carregarDadosFiscais();
        } catch (error) {
            toast.error(extrairErroBackend(error, "Rejeição ao tentar cancelar a NF-e."), { id: loadId, duration: 6000 });
        } finally {
            setCancelandoNfe(false);
        }
    };

    // 🚀 NOVA LÓGICA DE EXCLUSÃO PARA NOTAS REJEITADAS/PENDENTES
    const handleExcluirNota = async (nfeId) => {
        if (!window.confirm("Tem certeza que deseja excluir este registro fiscal com erro/pendente do sistema?")) return;

        const loadId = toast.loading('Excluindo nota do banco de dados...');
        try {
            await api.delete(`/api/fiscal/notas/${nfeId}`);
            toast.success('Nota excluída com sucesso!', { id: loadId });
            carregarDadosFiscais();
        } catch (error) {
            toast.error(extrairErroBackend(error, "Erro ao excluir a nota."), { id: loadId });
        }
    };

    const handleEnviarFechamento = async () => {
        if (!fechamentoEmail || !fechamentoEmail.includes('@')) return toast.error("Digite um e-mail válido!");
        const notasDoMes = registros.filter(reg => {
            if (reg.statusFiscal !== 'AUTORIZADA' || !reg.nfeId) return false;
            const dataReg = new Date(reg.data);
            return (dataReg.getMonth() + 1) === parseInt(fechamentoMes) && dataReg.getFullYear() === parseInt(fechamentoAno);
        });

        if (notasDoMes.length === 0) return toast.error(`Nenhuma nota Autorizada encontrada no período selecionado.`);

        const idsParaEnviar = notasDoMes.map(n => n.nfeId);
        setEnviandoLote(true);
        const loadId = toast.loading(`Gerando PDFs e XMLs, aguarde...`);

        try {
            const mesFormatado = `${fechamentoMes.toString().padStart(2, '0')}-${fechamentoAno}`;
            const url = `/api/fiscal/enviar-lote-contador?email=${fechamentoEmail}&mesAno=${mesFormatado}&mensagem=${encodeURIComponent(fechamentoMensagem)}`;
            await api.post(url, idsParaEnviar);
            toast.success(`Fechamento enviado com sucesso! (${idsParaEnviar.length} notas)`, { id: loadId });
            setModalFechamentoAberto(false);
        } catch (error) {
            toast.error(extrairErroBackend(error, "Erro ao enviar lote."), { id: loadId });
        } finally {
            setEnviandoLote(false);
        }
    };

    const handleEmitirNotaPDV = async (vendaId) => {
        setProcessandoId(vendaId);
        const loadId = toast.loading('Gerando Cupom Fiscal...');
        try {
            await api.post(`/api/fiscal/emitir/${vendaId}`);
            toast.success('Cupom Autorizado com Sucesso!', { id: loadId });
            carregarDadosFiscais();
        } catch (error) {
            toast.error(extrairErroBackend(error, "Erro na SEFAZ."), { id: loadId });
        } finally {
            setProcessandoId(null);
        }
    };

    const handleImprimirDanfe = async (registro) => {
        const loadId = toast.loading('Buscando PDF...');
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) pdfWindow.document.write('<h2 style="font-family: sans-serif; padding: 20px;">Gerando PDF para impressão...</h2>');

        try {
            let url = registro.tipo === 'PDV' ? `/api/fiscal/${registro.nfeId}/danfe` : `/api/fiscal/danfe/avulsa/${registro.chaveAcesso}`;
            const response = await api.get(url, { responseType: 'blob', headers: { 'Accept': 'application/pdf' } });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            if (pdfWindow) pdfWindow.location.href = fileURL;
            else { const link = document.createElement('a'); link.href = fileURL; link.download = `Documento_Fiscal.pdf`; link.click(); }
            toast.success('Pronto para imprimir!', { id: loadId });
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao gerar PDF da nota.', { id: loadId });
        }
    };

    const handleBaixarXML = async (registro) => {
        const loadId = toast.loading('Baixando XML...');
        try {
            const response = await api.get(`/api/fiscal/${registro.nfeId}/xml`, { responseType: 'blob' });
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = fileURL; link.setAttribute('download', `XML_${registro.chaveAcesso}.xml`);
            document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
            toast.success('XML baixado!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao baixar o arquivo XML.', { id: loadId });
        }
    };

    const handleEnviarContador = async (registro) => {
        const emailDigitado = window.prompt("Digite o e-mail do contador:", "contador@contabilidade.com.br");
        if (!emailDigitado || !emailDigitado.includes('@')) {
            if(emailDigitado !== null) toast.error("E-mail inválido.");
            return;
        }

        const loadId = toast.loading('Enviando e-mail...');
        try {
            await api.post(`/api/fiscal/${registro.nfeId}/enviar-contador?email=${emailDigitado}`);
            toast.success('XML enviado com sucesso!', { id: loadId });
        } catch (error) {
            toast.error(extrairErroBackend(error, "Erro ao enviar o e-mail."), { id: loadId });
        }
    };

    const BadgeStatusFiscal = ({ status }) => {
        if (status === 'PENDENTE') return <span className="flex items-center gap-1 w-max text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200"><Clock size={12}/> Pendente</span>;
        if (status === 'AUTORIZADA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle size={12}/> Autorizada</span>;
        if (status === 'CONTINGENCIA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><AlertCircle size={12}/> Offline</span>;
        if (status === 'CANCELADA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-300"><XCircle size={12}/> Cancelada</span>;
        return <span className="flex items-center gap-1 w-max text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><AlertCircle size={12}/> Rejeitada</span>;
    };

    const getNomeTipoNota = (chaveAcesso) => {
        if (!chaveAcesso || chaveAcesso.length < 22) return 'Aguardando Emissão';
        return isCupomFiscal(chaveAcesso) ? 'CUPOM FISCAL (NFC-e)' : 'NOTA GRANDE (NF-e)';
    };

    const getCorTipoNota = (chaveAcesso) => {
        if (!chaveAcesso || chaveAcesso.length < 22) return 'bg-orange-100 text-orange-700 border-orange-200';
        return isCupomFiscal(chaveAcesso)
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : 'bg-purple-100 text-purple-700 border-purple-200';
    };

    const registrosFiltrados = registros.filter(reg => {
        const matchBusca = (reg.numeroNota?.toString().includes(busca)) ||
            (reg.vendaId?.toString().includes(busca)) ||
            (reg.clienteNome?.toLowerCase().includes(busca.toLowerCase())) ||
            (reg.chaveAcesso?.includes(busca));

        let matchStatus = true;
        if (filtroStatus === 'PENDENTES') matchStatus = reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'CONTINGENCIA';
        if (filtroStatus === 'AUTORIZADAS') matchStatus = reg.statusFiscal === 'AUTORIZADA';
        if (filtroStatus === 'ERRO') matchStatus = reg.statusFiscal === 'ERRO' || reg.statusFiscal === 'REJEITADA';

        let matchData = true;
        const dataRegistro = new Date(reg.data);
        dataRegistro.setHours(0, 0, 0, 0);

        if (dataInicio) {
            const dInicio = new Date(dataInicio + 'T00:00:00');
            if (dataRegistro < dInicio) matchData = false;
        }
        if (dataFim) {
            const dFim = new Date(dataFim + 'T23:59:59');
            if (dataRegistro > dFim) matchData = false;
        }

        return matchBusca && matchStatus && matchData;
    });

    const totalPaginas = Math.ceil(registrosFiltrados.length / itensPorPagina);
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    const indiceFinal = indiceInicial + itensPorPagina;
    const registrosPaginados = registrosFiltrados.slice(indiceInicial, indiceFinal);


    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Módulo Fiscal
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerencie os Cupons Fiscais (PDV) e as Notas Grandes (Avulsas).</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setModalFechamentoAberto(true)} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md">
                        <CalendarDays size={18} className="text-blue-400" /> Fechamento do Mês
                    </button>
                    <button onClick={() => setPaginaAtiva('emitir-nfe-avulsa')} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20">
                        <FilePlus2 size={18} /> Emitir Nota A4 (NF-e)
                    </button>
                </div>
            </div>

            {/* 🚀 ÁREA DE FILTROS COM DATA */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 mb-6">

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar por N.º, Pedido, Cliente ou Chave..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700" />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3">
                    <Calendar size={18} className="text-slate-400" />
                    <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer" title="Data Inicial" />
                    <span className="text-slate-300 font-bold">até</span>
                    <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer" title="Data Final" />
                    {(dataInicio || dataFim) && (
                        <button onClick={() => { setDataInicio(''); setDataFim(''); }} className="ml-1 text-slate-400 hover:text-red-500" title="Limpar Filtro de Data"><X size={16} /></button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                    {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                        <button key={status} onClick={() => setFiltroStatus(status)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABELA COM ALTURA FIXA E PAGINAÇÃO */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 font-bold"><Loader2 size={40} className="animate-spin mb-4 text-blue-500" />Sincronizando notas...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
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
                                {registrosPaginados.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">Nenhum resultado encontrado.</td></tr>
                                ) : (
                                    registrosPaginados.map(reg => (
                                        <tr key={reg.uid} className={`hover:bg-slate-50 transition-colors ${reg.statusFiscal === 'CANCELADA' ? 'opacity-60 bg-slate-50' : ''}`}>

                                            <td className="p-4">
                                                {reg.numeroNota ? (
                                                    <p className={`font-black text-sm ${reg.statusFiscal === 'CANCELADA' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                        {isCupomFiscal(reg.chaveAcesso) ? 'NFC-e' : 'NF-e'} Nº {reg.numeroNota}
                                                    </p>
                                                ) : (
                                                    <p className="font-black text-orange-500 text-sm">Aguardando Emissão</p>
                                                )}

                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border w-max ${getCorTipoNota(reg.chaveAcesso)}`}>
                                                        {getNomeTipoNota(reg.chaveAcesso)}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {reg.vendaId ? `Origem: Venda #${reg.vendaId}` : 'Emissão Avulsa'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-sm font-medium text-slate-600">
                                                {new Date(reg.data).toLocaleDateString('pt-BR')} <br/>
                                                <span className="text-xs text-slate-400">{new Date(reg.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="p-4">
                                                <p className={`font-bold text-sm truncate max-w-[200px] ${!reg.vendaId ? 'text-purple-800' : 'text-slate-800'}`}>{reg.clienteNome}</p>
                                                {reg.valorTotal !== null && <p className="font-black text-emerald-600 text-xs mt-0.5">R$ {reg.valorTotal.toFixed(2)}</p>}
                                            </td>
                                            <td className="p-4">
                                                <BadgeStatusFiscal status={reg.statusFiscal} />
                                                {reg.chaveAcesso && <p className="text-[10px] font-mono text-slate-400 mt-1" title={reg.chaveAcesso}>{reg.chaveAcesso.substring(0,24)}...</p>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">

                                                    {/* 🚀 BOTÃO EXCLUIR PARA ERROS E PENDENTES */}
                                                    {(reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'REJEITADA' || reg.statusFiscal === 'ERRO') && reg.nfeId && (
                                                        <button onClick={() => handleExcluirNota(reg.nfeId)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Excluir Registro do Sistema">
                                                            <Trash2 size={14} /> EXCLUIR
                                                        </button>
                                                    )}

                                                    {reg.tipo === 'PDV' && reg.statusFiscal === 'PENDENTE' && (
                                                        <button onClick={() => handleEmitirNotaPDV(reg.vendaId)} disabled={processandoId === reg.vendaId} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm">
                                                            {processandoId === reg.vendaId ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} AUTORIZAR
                                                        </button>
                                                    )}

                                                    {reg.chaveAcesso && reg.statusFiscal === 'AUTORIZADA' && (
                                                        <>
                                                            <button onClick={() => handleImprimirDanfe(reg)} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Imprimir Documento">
                                                                {isCupomFiscal(reg.chaveAcesso) ? <><Receipt size={14}/> CUPOM</> : <><Printer size={14}/> DANFE</>}
                                                            </button>

                                                            <button onClick={() => handleBaixarXML(reg)} className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Baixar XML"><Download size={14} /></button>
                                                            <button onClick={() => handleEnviarContador(reg)} className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Enviar para Contabilidade"><Mail size={14} /></button>

                                                            {/* 🚀 LOGICA DE CANCELAMENTO COM TRAVA DE TEMPO */}
                                                            {verificarPrazoCancelamento(reg.data, reg.chaveAcesso).expirado ? (
                                                                <span className="px-3 py-2 border border-transparent text-slate-400 font-bold text-[9px] uppercase flex items-center gap-1" title="Prazo expirado.">
                                                                    <Clock size={12} /> NÃO CANCELÁVEL
                                                                </span>
                                                            ) : (
                                                                <button onClick={() => abrirModalCancelamento(reg)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">
                                                                    <XCircle size={14} /> CANCELAR
                                                                </button>
                                                            )}
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

                        {registrosFiltrados.length > 0 && (
                            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <span className="text-xs font-bold text-slate-500">
                                    Mostrando do {indiceInicial + 1} até {Math.min(indiceFinal, registrosFiltrados.length)} de {registrosFiltrados.length} notas
                                </span>

                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-600">Página {paginaAtual} de {totalPaginas}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} className="text-slate-600"/></button>
                                        <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} className="text-slate-600"/></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ========================================================= */}
            {/* 🚀 MODAL DE CANCELAMENTO DE NF-E */}
            {/* ========================================================= */}
            {modalCancelamentoAberto && notaParaCancelar && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-red-600">
                        <div className="bg-red-600 p-6 flex justify-between items-center text-white">
                            <h2 className="font-black tracking-widest flex items-center gap-2"><AlertTriangle /> CANCELAR NFE/NFC-e</h2>
                            <button onClick={() => setModalCancelamentoAberto(false)} disabled={cancelandoNfe} title="Fechar" className="hover:text-red-200 transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-sm text-red-800 font-medium">
                                Você está prestes a cancelar a Nota <b>Nº {notaParaCancelar.numeroNota}</b>. Esta operação é irreversível e será transmitida para a SEFAZ.
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase">Justificativa (Mín. 15 caracteres) *</label>
                                <textarea
                                    autoFocus
                                    value={justificativaCancelamento}
                                    onChange={(e) => setJustificativaCancelamento(e.target.value)}
                                    rows="3"
                                    disabled={cancelandoNfe}
                                    className={`w-full p-3 border-2 rounded-xl outline-none mt-1 bg-white shadow-sm transition-colors ${justificativaCancelamento.length >= 15 ? 'border-green-400 focus:border-green-600' : 'border-red-300 focus:border-red-500'}`}
                                    placeholder="Ex: Cliente desistiu da compra logo após a emissão."
                                />
                                <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${justificativaCancelamento.length < 15 ? 'text-red-500' : 'text-green-600'}`}>
                                    {justificativaCancelamento.length} / 15 Caracteres
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setModalCancelamentoAberto(false)}
                                    disabled={cancelandoNfe}
                                    className="w-1/3 bg-white border border-slate-300 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCancelarNotaSefaz}
                                    disabled={cancelandoNfe || justificativaCancelamento.length < 15}
                                    className="w-2/3 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelandoNfe ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                                    {cancelandoNfe ? "PROCESSANDO..." : "CONFIRMAR"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* MODAL DE FECHAMENTO MENSAL */}
            {modalFechamentoAberto && (
                <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                        <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2"><CalendarDays className="text-blue-400"/> Envio em Lote (Contador)</h3>
                            <button onClick={() => setModalFechamentoAberto(false)} className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <p className="text-sm text-slate-600 font-medium">O sistema vai reunir <b>XMLs e PDFs</b> do período escolhido, compactar em um arquivo ZIP e enviar por e-mail.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mês</label>
                                    <select value={fechamentoMes} onChange={e=>setFechamentoMes(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                                        <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
                                        <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
                                        <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
                                        <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ano</label>
                                    <select value={fechamentoAno} onChange={e=>setFechamentoAno(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">E-mail da Contabilidade *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input type="email" value={fechamentoEmail} onChange={e=>setFechamentoEmail(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white" placeholder="contador@..." />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mensagem no E-mail</label>
                                <textarea
                                    value={fechamentoMensagem}
                                    onChange={e=>setFechamentoMensagem(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium text-slate-700 bg-white h-24 resize-none custom-scrollbar"
                                    placeholder="Digite a mensagem para o contador..."
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setModalFechamentoAberto(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button
                                onClick={handleEnviarFechamento}
                                disabled={enviandoLote}
                                className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-transform transform hover:-translate-y-0.5 shadow-lg shadow-blue-600/30 flex items-center gap-2"
                            >
                                {enviandoLote ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>}
                                Enviar Lote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};