import React, { useState, useEffect } from 'react';
import {
    Search, FileText, CheckCircle, AlertCircle, Clock, Download,
    Printer, Loader2, FilePlus2, Mail, CalendarDays, X, Receipt,
    ChevronLeft, ChevronRight, Calendar, Trash2, AlertTriangle, XCircle,
    Wrench, Package, Landmark, FileArchive
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = ({ setPaginaAtiva }) => {
    const [abaAtiva, setAbaAtiva] = useState('VENDAS');
    const [registros, setRegistros] = useState([]);
    const [ordensServico, setOrdensServico] = useState([]);

    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
    const [fechamentoMes, setFechamentoMes] = useState(new Date().getMonth() + 1);
    const [fechamentoAno, setFechamentoAno] = useState(new Date().getFullYear());
    const [fechamentoEmail, setFechamentoEmail] = useState('contador@contabilidade.com.br');
    const [enviandoLote, setEnviandoLote] = useState(false);
    const [fechamentoMensagem, setFechamentoMensagem] = useState('Olá Contador,\n\nSeguem em anexo os arquivos XML e PDFs referentes ao fechamento deste mês.\n\nQualquer dúvida, estamos à disposição.');

    const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
    const [notaParaCancelar, setNotaParaCancelar] = useState(null);
    const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
    const [cancelandoNfe, setCancelandoNfe] = useState(false);

    // =======================================================================
    // 🚀 EXTRATOR E TRADUTOR DE ERROS DO JAVA
    // =======================================================================
    const extrairErroBackend = (error, mensagemPadrao) => {
        if (error?.response?.status === 403) return "Acesso Negado: Rota bloqueada pelo servidor (Erro 403).";
        if (error?.response?.status === 401) return "Sessão expirada. Por favor, recarregue a página e faça login novamente.";

        let msgBruta = error?.message || mensagemPadrao;

        if (error?.response?.data) {
            if (typeof error.response.data === 'string') msgBruta = error.response.data;
            else if (error.response.data.message) msgBruta = error.response.data.message;
            else if (error.response.data.error) msgBruta = error.response.data.error;
        }

        // 🛡️ TRADUÇÕES AMIGÁVEIS PARA O USUÁRIO FINAL
        if (msgBruta.includes("Certificado Digital não encontrado") || msgBruta.includes(".pfx")) {
            return "⚠️ Certificado Digital Ausente! Vá em Configurações > Fiscal e faça o upload do seu arquivo A1 (.pfx) antes de emitir notas.";
        }
        if (msgBruta.includes("Senha") && msgBruta.includes("Certificado")) {
            return "🔑 A senha do Certificado Digital está incorreta. Corrija na tela de Configurações Fiscais.";
        }
        if (msgBruta.includes("NCM")) {
            return "📦 Falta o NCM em um dos produtos desta nota! Revise o cadastro das peças.";
        }

        return msgBruta.replace(/\/home\/[^\s]+/, '[SERVIDOR]');
    };

    const isCupomFiscal = (chaveAcesso) => {
        if (!chaveAcesso || chaveAcesso.length < 22) return false;
        return chaveAcesso.substring(20, 22) === '65';
    };

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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
            const [resVendas, resNotas, resOs] = await Promise.all([
                api.get('/api/vendas').catch(() => ({ data: [] })),
                api.get('/api/fiscal/notas').catch(() => ({ data: [] })),
                api.get('/api/os').catch(() => ({ data: [] }))
            ]);

            const osFaturadas = Array.isArray(resOs.data) ? resOs.data.filter(o => o.status === 'FATURADA') : [];
            setOrdensServico(osFaturadas.sort((a, b) => b.id - a.id));

            const unificados = [];
            const nfeIdsAdicionados = new Set();

            const vendasPagas = Array.isArray(resVendas.data) ? resVendas.data.filter(v => v.status === 'CONCLUIDA' || v.status === 'PAGA') : [];
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

            if (Array.isArray(resNotas.data)) {
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
            }

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
    }, [busca, filtroStatus, dataInicio, dataFim, abaAtiva]);

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
        setProcessandoId(`venda-${vendaId}`);
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

    // =========================================================================
    // 🚨 NOVOS HANDLERS: CANCELAMENTO, COMPLEMENTAÇÃO, CONTINGÊNCIA
    // =========================================================================

    /**
     * Cancela uma NFC-e autorizada
     */
    const handleCancelarNfce = async (notaId) => {
        const justificativa = window.prompt(
            "Motivo do cancelamento (mín. 15 caracteres):",
            "Cancelamento conforme solicitação do cliente"
        );

        if (!justificativa || justificativa.length < 15) {
            toast.error("Justificativa deve ter no mínimo 15 caracteres");
            return;
        }

        const confirmado = window.confirm(
            "⚠️ ATENÇÃO!\n\nVocê está prestes a CANCELAR esta nota na SEFAZ.\n\nEsta ação é IRREVERSÍVEL e será registrada em auditoria.\n\nDeseja continuar?"
        );

        if (!confirmado) return;

        setCancelandoNfe(true);
        const toastId = toast.loading("Cancelando NFC-e na SEFAZ...");

        try {
            const response = await api.post(
                `/api/fiscal/cancelar-nfce/${notaId}`,
                { justificativa }
            );

            toast.success("NFC-e cancelada com sucesso! ✅", { id: toastId });
            carregarDadosFiscais();
            setModalCancelamentoAberto(false);
            setJustificativaCancelamento("");
            setNotaParaCancelar(null);
        } catch (error) {
            toast.error(
                extrairErroBackend(error, "Erro ao cancelar a NFC-e."),
                { id: toastId }
            );
        } finally {
            setCancelandoNfe(false);
        }
    };

    /**
     * Emite uma nota em modo contingência (quando SEFAZ está offline)
     */
    const handleEmitirContingencia = async (vendaId) => {
        const confirmado = window.confirm(
            "🚨 MODO CONTINGÊNCIA\n\n" +
            "A SEFAZ está indisponível.\n" +
            "Esta nota será emitida LOCALMENTE e sincronizada quando a SEFAZ voltar.\n\n" +
            "Deseja continuar?"
        );

        if (!confirmado) return;

        setProcessandoId(`venda-contingencia-${vendaId}`);
        const toastId = toast.loading("Emitindo em modo offline...");

        try {
            const response = await api.post(
                `/api/fiscal/contingencia/emitir/${vendaId}`,
                { justificativa: "SEFAZ indisponível" }
            );

            toast.success(
                "✅ Cupom emitido em CONTINGÊNCIA!\n" +
                "Será sincronizado quando SEFAZ voltar.",
                { id: toastId, duration: 5000 }
            );
            carregarDadosFiscais();
        } catch (error) {
            toast.error(
                extrairErroBackend(error, "Erro ao emitir em contingência."),
                { id: toastId }
            );
        } finally {
            setProcessandoId(null);
        }
    };

    /**
     * Cria uma complementação fiscal (devolução, desconto, etc)
     */
    const handleCriarComplementacao = async (notaId) => {
        const tipo = window.prompt(
            "Tipo de complementação:\n\n" +
            "DEVOLUCAO - Cliente devolveu produtos\n" +
            "DESCONTO - Conceder desconto\n" +
            "ACRESCIMO - Cobrar valor a mais\n" +
            "CORRECAO - Corrigir erro\n\n" +
            "Digite o tipo:",
            "DEVOLUCAO"
        );

        if (!tipo) return;

        if (!["DEVOLUCAO", "DESCONTO", "ACRESCIMO", "CORRECAO"].includes(tipo.toUpperCase())) {
            toast.error("Tipo de complementação inválido");
            return;
        }

        const motivo = window.prompt(
            `Motivo da ${tipo.toLowerCase()} (mín. 10 caracteres):`,
            "Cliente solicitou"
        );

        if (!motivo || motivo.length < 10) {
            toast.error("Descrição deve ter no mínimo 10 caracteres");
            return;
        }

        const valor = window.prompt(
            "Valor da complementação (ex: 150.00):",
            "0.00"
        );

        if (!valor || parseFloat(valor) <= 0) {
            toast.error("Valor deve ser maior que zero");
            return;
        }

        setProcessandoId(`complementacao-${notaId}`);
        const toastId = toast.loading("Criando complementação...");

        try {
            const response = await api.post("/api/fiscal/complementar/criar", {
                notaOriginalId: notaId,
                tipoComplementacao: tipo.toUpperCase(),
                descricaoMotivo: motivo,
                valorComplementacao: parseFloat(valor)
            });

            toast.success(
                `✅ Complementação de ${tipo.toLowerCase()} criada!\n` +
                `Nº: ${response.data.numeroComplementar}`,
                { id: toastId, duration: 5000 }
            );

            carregarDadosFiscais();
        } catch (error) {
            toast.error(
                extrairErroBackend(error, "Erro ao criar complementação."),
                { id: toastId }
            );
        } finally {
            setProcessandoId(null);
        }
    };

    /**
     * Verifica status de contingências
     */
    const handleVerificarContingencias = async () => {
        const toastId = toast.loading("Verificando contingências...");

        try {
            const response = await api.get("/api/fiscal/contingencia/status");

            if (response.data.notasEmContingencia > 0) {
                const sincronizar = window.confirm(
                    `⚠️ Há ${response.data.notasEmContingencia} nota(s) em contingência.\n\n` +
                    "A SEFAZ está online agora?\n\n" +
                    "OK = Sincronizar agora\n" +
                    "Cancelar = Deixar para depois"
                );

                if (sincronizar) {
                    await handleSincronizarContingencias(toastId);
                }
            } else {
                toast.success("✅ Nenhuma nota em contingência", { id: toastId });
            }
        } catch (error) {
            toast.error(
                "Erro ao verificar contingências",
                { id: toastId }
            );
        }
    };

    /**
     * Sincroniza notas em contingência com SEFAZ
     */
    const handleSincronizarContingencias = async (toastId = null) => {
        const loadId = toastId || toast.loading("Sincronizando contingências...");

        try {
            const response = await api.post("/api/fiscal/contingencia/sincronizar");

            toast.success(
                `✅ ${response.data.sincronizadas} nota(s) sincronizada(s)!\n` +
                `❌ ${response.data.rejeitadas} rejeitada(s)`,
                { id: loadId, duration: 5000 }
            );

            carregarDadosFiscais();
        } catch (error) {
            toast.error(
                "Erro ao sincronizar contingências",
                { id: loadId }
            );
        }
    };

    // =========================================================================
    // 🚀 FUNÇÕES PARA EMISSÃO EM OS
    // =========================================================================

    /**
     * Emite nota fiscal de peças em uma Ordem de Serviço
     */
    const emitirFiscalPecas = async (osId, modelo) => {
        setProcessandoId(`pecas-${modelo}-${osId}`);
        const nomeDoc = modelo === '55' ? 'NF-e (A4)' : 'NFC-e (Cupom)';
        const toastId = toast.loading(`Transmitindo ${nomeDoc} de Peças da OS #${osId}...`);

        try {
            const response = await api.post(
                `/api/os/${osId}/fiscal/emitir-pecas?modelo=${modelo}`
            );

            toast.success(
                response.data.message || `${nomeDoc} autorizada pela SEFAZ!`,
                { id: toastId, duration: 5000 }
            );

            carregarDadosFiscais();
        } catch (error) {
            toast.error(
                extrairErroBackend(error, `Erro ao emitir ${nomeDoc}.`),
                { id: toastId }
            );
        } finally {
            setProcessandoId(null);
        }
    };

    /**
     * Emite Nota Fiscal de Serviço (NFS-e) de uma Ordem de Serviço
     */
    const emitirNfseServicos = async (osId) => {
        setProcessandoId(`servicos-${osId}`);
        const toastId = toast.loading(`Transmitindo NFS-e de Serviços da OS #${osId}...`);

        try {
            const response = await api.post(`/api/os/${osId}/fiscal/emitir-nfse`);

            toast.success(
                response.data.message || "NFS-e autorizada pela Prefeitura!",
                { id: toastId, duration: 5000 }
            );

            carregarDadosFiscais();
        } catch (error) {
            toast.error(
                extrairErroBackend(error, "Erro ao emitir NFS-e."),
                { id: toastId }
            );
        } finally {
            setProcessandoId(null);
        }
    };

    // =========================================================================
    // RENDERIZADORES DE LAYOUT E FILTROS
    // =========================================================================
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
        return isCupomFiscal(chaveAcesso) ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-purple-100 text-purple-700 border-purple-200';
    };

    const registrosFiltrados = (abaAtiva === 'VENDAS' ? registros : ordensServico).filter(reg => {
        const clienteNome = reg.clienteNome || reg.cliente?.nome || '';
        const idLocal = reg.vendaId || reg.numeroNota || reg.id || '';
        const chaveAcesso = reg.chaveAcesso || '';

        const matchBusca = idLocal.toString().includes(busca) ||
            clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
            chaveAcesso.includes(busca);

        let matchStatus = true;
        if (abaAtiva === 'VENDAS' && filtroStatus !== 'TODAS') {
            if (filtroStatus === 'PENDENTES') matchStatus = reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'CONTINGENCIA';
            if (filtroStatus === 'AUTORIZADAS') matchStatus = reg.statusFiscal === 'AUTORIZADA';
            if (filtroStatus === 'ERRO') matchStatus = reg.statusFiscal === 'ERRO' || reg.statusFiscal === 'REJEITADA';
        }

        let matchData = true;
        const dataRegistro = new Date(reg.data || reg.dataEntrada);
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
        <div className="p-8 max-w-[1600px] mx-auto animate-fade-in relative flex flex-col h-full">
            <div className="flex justify-between items-end mb-6 flex-wrap gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Landmark className="text-emerald-600 bg-emerald-100 p-1.5 rounded-lg" size={36} />
                        GERENCIADOR FISCAL (SEFAZ)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Central de emissão de NF-e, NFC-e e NFS-e (Prefeitura)</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setModalFechamentoAberto(true)} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md">
                        <CalendarDays size={18} className="text-emerald-400" /> Lote do Mês (Contador)
                    </button>
                    <button onClick={() => setPaginaAtiva('emitir-nfe-avulsa')} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20">
                        <FilePlus2 size={18} /> Emitir NF-e Avulsa
                    </button>
                </div>
            </div>

            {/* CONTROLES E ABAS DE NAVEGAÇÃO */}
            <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex gap-2 w-full xl:w-auto">
                    <button
                        onClick={() => setAbaAtiva('VENDAS')}
                        className={`flex-1 xl:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${abaAtiva === 'VENDAS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Package size={16}/> Vendas Balcão (NFC-e)
                    </button>
                    <button
                        onClick={() => setAbaAtiva('OS')}
                        className={`flex-1 xl:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${abaAtiva === 'OS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Wrench size={16}/> Ordens de Serviço (NF-e + NFS-e)
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto px-2 pb-2 xl:pb-0">
                    <div className="relative flex-1 xl:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar por Nº, Cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none text-sm font-bold text-slate-700" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3">
                        <Calendar size={18} className="text-slate-400" />
                        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer" title="Data Inicial" />
                        <span className="text-slate-300 font-bold">até</span>
                        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-600 cursor-pointer" title="Data Final" />
                        {(dataInicio || dataFim) && (
                            <button onClick={() => { setDataInicio(''); setDataFim(''); }} className="ml-1 text-slate-400 hover:text-red-500" title="Limpar Filtro"><X size={16} /></button>
                        )}
                    </div>

                    {abaAtiva === 'VENDAS' && (
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                            {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                                <button key={status} onClick={() => setFiltroStatus(status)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TABELA DE DADOS (RENDERIZAÇÃO CONDICIONAL POR ABA) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 font-bold"><Loader2 size={40} className="animate-spin mb-4 text-emerald-500" />Sincronizando...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    {abaAtiva === 'VENDAS' ? (
                                        <>
                                            <th className="p-4 font-black">Identificação</th>
                                            <th className="p-4 font-black">Data</th>
                                            <th className="p-4 font-black">Cliente / Valor</th>
                                            <th className="p-4 font-black">Status SEFAZ</th>
                                            <th className="p-4 text-right font-black">Ações</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 pl-6 w-24">OS Nº</th>
                                            <th className="p-4">Cliente Associado</th>
                                            <th className="p-4 text-center border-l border-slate-200 bg-blue-50/50">Tributação SEFAZ (Peças)</th>
                                            <th className="p-4 text-center border-l border-slate-200 bg-orange-50/50">Tributação PREF. (Serviços)</th>
                                        </>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {registrosPaginados.length === 0 ? (
                                    <tr><td colSpan={abaAtiva === 'VENDAS' ? 5 : 4} className="p-12 text-center text-slate-400 font-bold">Nenhum resultado encontrado.</td></tr>
                                ) : (
                                    abaAtiva === 'VENDAS' ? (
                                        // ================== RENDER ABA VENDAS ==================
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
                                                        {(reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'REJEITADA' || reg.statusFiscal === 'ERRO') && reg.nfeId && (
                                                            <button onClick={() => handleExcluirNota(reg.nfeId)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
                                                                <Trash2 size={14} /> EXCLUIR
                                                            </button>
                                                        )}
                                                        {reg.tipo === 'PDV' && reg.statusFiscal === 'PENDENTE' && (
                                                            <button onClick={() => handleEmitirNotaPDV(reg.vendaId)} disabled={processandoId === `venda-${reg.vendaId}`} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm">
                                                                {processandoId === `venda-${reg.vendaId}` ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} AUTORIZAR
                                                            </button>
                                                        )}
                                                        {reg.chaveAcesso && reg.statusFiscal === 'AUTORIZADA' && (
                                                            <>
                                                                <button onClick={() => handleImprimirDanfe(reg)} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm">
                                                                    {isCupomFiscal(reg.chaveAcesso) ? <><Receipt size={14}/> CUPOM</> : <><Printer size={14}/> DANFE</>}
                                                                </button>
                                                                <button onClick={() => handleBaixarXML(reg)} className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"><Download size={14} /></button>
                                                                <button onClick={() => handleEnviarContador(reg)} className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"><Mail size={14} /></button>
                                                                
                                                                {/* 🚀 NOVOS BOTÕES: CANCELAMENTO NFCE, COMPLEMENTAÇÃO E CONTINGÊNCIA */}
                                                                {reg.statusFiscal === 'AUTORIZADA' && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleCancelarNfce(reg.nfeId)}
                                                                            disabled={cancelandoNfe}
                                                                            title="Cancela esta NFC-e na SEFAZ"
                                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                                                                        >
                                                                            {cancelandoNfe ? <Loader2 size={12} className="animate-spin"/> : <XCircle size={12}/>}
                                                                            CANCELAR NFC-e
                                                                        </button>

                                                                        <button 
                                                                            onClick={() => handleCriarComplementacao(reg.nfeId)}
                                                                            disabled={processandoId === `complementacao-${reg.nfeId}`}
                                                                            title="Cria devolução, desconto ou correção"
                                                                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                                                                        >
                                                                            {processandoId === `complementacao-${reg.nfeId}` ? <Loader2 size={12} className="animate-spin"/> : <FileArchive size={12}/>}
                                                                            COMPLEMENTAÇÃO
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* 🚨 BOTÃO CONTINGÊNCIA */}
                                                                {reg.statusFiscal === 'PENDENTE' && reg.tipo === 'PDV' && (
                                                                    <button 
                                                                        onClick={() => handleEmitirContingencia(reg.vendaId)}
                                                                        disabled={processandoId === `venda-contingencia-${reg.vendaId}`}
                                                                        title="Emitir em modo offline (SEFAZ indisponível)"
                                                                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                                                                    >
                                                                        {processandoId === `venda-contingencia-${reg.vendaId}` ? <Loader2 size={12} className="animate-spin"/> : <AlertTriangle size={12}/>}
                                                                        CONTINGÊNCIA
                                                                    </button>
                                                                )}

                                                                {/* ✅ VERIFICADOR DE CONTINGÊNCIAS */}
                                                                {reg.statusFiscal === 'CONTINGENCIA' && (
                                                                    <button 
                                                                        onClick={() => handleVerificarContingencias()}
                                                                        title="Sincronizar com SEFAZ quando voltar online"
                                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                                                                    >
                                                                        <Clock size={12}/>
                                                                        SINCRONIZAR
                                                                    </button>
                                                                )}

                                                                {verificarPrazoCancelamento(reg.data, reg.chaveAcesso).expirado ? (
                                                                    <span className="px-3 py-2 border border-transparent text-slate-400 font-bold text-[9px] uppercase flex items-center gap-1"><Clock size={12} /> NÃO CANCELÁVEL</span>
                                                                ) : (
                                                                    reg.statusFiscal !== 'AUTORIZADA' && (
                                                                        <button onClick={() => abrirModalCancelamento(reg)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">
                                                                            <XCircle size={14} /> CANCELAR
                                                                        </button>
                                                                    )
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // ================== RENDER ABA OS ==================
                                        registrosPaginados.map(os => {
                                            const temPecas = os.totalPecas > 0;
                                            const temServicos = os.totalServicos > 0;
                                            return (
                                                <tr key={os.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-4 pl-6">
                                                        <span className="font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-1 rounded">#{os.id}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-800">{os.cliente?.nome || 'Consumidor'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total OS: R$ {formatarMoeda(os.valorTotal)}</p>
                                                    </td>
                                                    <td className="p-4 border-l border-slate-100 bg-blue-50/30 text-center">
                                                        {temPecas ? (
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <span className="font-black text-blue-700 text-lg">R$ {formatarMoeda(os.totalPecas)}</span>
                                                                <div className="flex gap-2">
                                                                    {/* 🚀 CHAVE SELETORA: NFC-e e NF-e */}
                                                                    <button
                                                                        onClick={() => emitirFiscalPecas(os.id, '65')}
                                                                        disabled={processandoId === `pecas-65-${os.id}`}
                                                                        title="Emitir Cupom Fiscal (Termal)"
                                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm flex items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50"
                                                                    >
                                                                        {processandoId === `pecas-65-${os.id}` ? <Loader2 size={12} className="animate-spin"/> : <Receipt size={12}/>}
                                                                        NFC-e
                                                                    </button>
                                                                    <button
                                                                        onClick={() => emitirFiscalPecas(os.id, '55')}
                                                                        disabled={processandoId === `pecas-55-${os.id}`}
                                                                        title="Emitir Nota Fiscal Grande (A4)"
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-sm flex items-center gap-1 transition-transform hover:scale-105 disabled:opacity-50"
                                                                    >
                                                                        {processandoId === `pecas-55-${os.id}` ? <Loader2 size={12} className="animate-spin"/> : <FileText size={12}/>}
                                                                        NF-e
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem peças</span>)}
                                                    </td>
                                                    <td className="p-4 border-l border-slate-100 bg-orange-50/30 text-center">
                                                        {temServicos ? (
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <span className="font-black text-orange-700 text-lg">R$ {formatarMoeda(os.totalServicos)}</span>
                                                                <button
                                                                    onClick={() => emitirNfseServicos(os.id)}
                                                                    disabled={processandoId === `servicos-${os.id}`}
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] shadow-md flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50"
                                                                >
                                                                    {processandoId === `servicos-${os.id}` ? <Loader2 size={12} className="animate-spin"/> : <Receipt size={12}/>}
                                                                    Emitir NFS-e (Serviços)
                                                                </button>
                                                            </div>
                                                        ) : (<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem serviços</span>)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* RENDERIZAÇÃO DO RODAPÉ DE PAGINAÇÃO SE TIVER DADOS */}
                        {registrosFiltrados.length > 0 && (
                            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                                <span className="text-xs font-bold text-slate-500">
                                    Mostrando do {indiceInicial + 1} até {Math.min(indiceFinal, registrosFiltrados.length)} de {registrosFiltrados.length} registros
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
            {/* 🚀 MODAIS (FECHAMENTO E CANCELAMENTO MANTIDOS) */}
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
                                <textarea autoFocus value={justificativaCancelamento} onChange={(e) => setJustificativaCancelamento(e.target.value)} rows="3" disabled={cancelandoNfe} className={`w-full p-3 border-2 rounded-xl outline-none mt-1 bg-white shadow-sm transition-colors ${justificativaCancelamento.length >= 15 ? 'border-green-400 focus:border-green-600' : 'border-red-300 focus:border-red-500'}`} placeholder="Ex: Cliente desistiu da compra." />
                                <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${justificativaCancelamento.length < 15 ? 'text-red-500' : 'text-green-600'}`}>{justificativaCancelamento.length} / 15 Caracteres</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setModalCancelamentoAberto(false)} disabled={cancelandoNfe} className="w-1/3 bg-white border border-slate-300 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors">Voltar</button>
                                <button onClick={handleCancelarNotaSefaz} disabled={cancelandoNfe || justificativaCancelamento.length < 15} className="w-2/3 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {cancelandoNfe ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />} {cancelandoNfe ? "PROCESSANDO..." : "CONFIRMAR"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalFechamentoAberto && (
                <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                        <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2"><CalendarDays className="text-emerald-400"/> Envio em Lote (Contador)</h3>
                            <button onClick={() => setModalFechamentoAberto(false)} className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <p className="text-sm text-slate-600 font-medium">O sistema vai reunir <b>XMLs e PDFs</b> do período escolhido, compactar em um arquivo ZIP e enviar por e-mail.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mês</label>
                                    <select value={fechamentoMes} onChange={e=>setFechamentoMes(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700 bg-white">
                                        <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
                                        <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
                                        <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
                                        <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ano</label>
                                    <select value={fechamentoAno} onChange={e=>setFechamentoAno(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-bold text-slate-700 bg-white">
                                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">E-mail da Contabilidade *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input type="email" value={fechamentoEmail} onChange={e=>setFechamentoEmail(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-emerald-500 font-bold text-slate-700 bg-white" placeholder="contador@..." />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mensagem no E-mail</label>
                                <textarea value={fechamentoMensagem} onChange={e=>setFechamentoMensagem(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium text-slate-700 bg-white h-24 resize-none custom-scrollbar" placeholder="Digite a mensagem para o contador..."></textarea>
                            </div>
                        </div>
                        <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setModalFechamentoAberto(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleEnviarFechamento} disabled={enviandoLote} className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-transform transform hover:-translate-y-0.5 shadow-lg shadow-emerald-600/30 flex items-center gap-2">
                                {enviandoLote ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>} Enviar Lote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



