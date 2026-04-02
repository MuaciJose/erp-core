import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const statusClasses = (status) => {
    switch (status) {
        case 'ABERTO':
            return 'bg-blue-100 text-blue-800';
        case 'AGUARDANDO_PLATAFORMA':
            return 'bg-amber-100 text-amber-800';
        case 'AGUARDANDO_CLIENTE':
            return 'bg-violet-100 text-violet-800';
        case 'EM_ATENDIMENTO':
            return 'bg-orange-100 text-orange-800';
        case 'RESOLVIDO':
        case 'ENCERRADO':
            return 'bg-emerald-100 text-emerald-800';
        default:
            return 'bg-slate-100 text-slate-700';
    }
};

const calcularEstadoSla = (incidente) => {
    if (!incidente) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazoResposta = incidente.prazoResposta ? new Date(`${incidente.prazoResposta}T00:00:00`) : null;
    const prazoResolucao = incidente.prazoResolucao ? new Date(`${incidente.prazoResolucao}T00:00:00`) : null;

    if (incidente.status === 'RESOLVIDO') {
        return {
            label: 'Resolvido',
            tone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            detalhe: 'Incidente encerrado.'
        };
    }

    if (prazoResolucao && prazoResolucao < hoje) {
        return {
            label: 'SLA vencido',
            tone: 'bg-red-100 text-red-800 border-red-200',
            detalhe: `Prazo de resolução vencido em ${prazoResolucao.toLocaleDateString('pt-BR')}.`
        };
    }

    if (prazoResposta && prazoResposta < hoje) {
        return {
            label: 'Resposta vencida',
            tone: 'bg-amber-100 text-amber-800 border-amber-200',
            detalhe: `Prazo de resposta vencido em ${prazoResposta.toLocaleDateString('pt-BR')}.`
        };
    }

    if (prazoResolucao) {
        return {
            label: 'SLA em andamento',
            tone: 'bg-blue-100 text-blue-800 border-blue-200',
            detalhe: `Prazo de resolução: ${prazoResolucao.toLocaleDateString('pt-BR')}.`
        };
    }

    if (prazoResposta) {
        return {
            label: 'Resposta em andamento',
            tone: 'bg-sky-100 text-sky-800 border-sky-200',
            detalhe: `Prazo de resposta: ${prazoResposta.toLocaleDateString('pt-BR')}.`
        };
    }

    return {
        label: 'Sem SLA definido',
        tone: 'bg-slate-100 text-slate-700 border-slate-200',
        detalhe: 'Defina prazo de resposta ou resolução para acompanhar o atendimento.'
    };
};

const ordenarTimeline = (eventos) => [...eventos].sort((a, b) => {
    const dataA = a.data ? new Date(a.data).getTime() : 0;
    const dataB = b.data ? new Date(b.data).getTime() : 0;
    return dataA - dataB;
});

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const baixarCsv = (nomeArquivo, cabecalhos, linhas) => {
    const csvString = `\uFEFF${[cabecalhos.join(';'), ...linhas.map((linha) => linha.join(';'))].join('\n')}`;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const templatesPadraoPlataforma = [
    'Recebemos seu atendimento e já estamos analisando o caso. Em instantes retornaremos com o próximo passo.',
    'Conseguimos reproduzir o cenário informado. Vamos seguir com a validação técnica e te atualizamos neste ticket.',
    'Precisamos de mais contexto para avançar. Envie, por favor, prints, horário do erro e o passo a passo realizado.',
    'Ajuste aplicado pela plataforma. Valide novamente no sistema e nos confirme neste atendimento se o fluxo normalizou.',
    'Atendimento concluído pela plataforma. Se precisar continuar este assunto, abra um novo ticket com a nova evidência.'
];

const descricaoAutorMensagem = (autorTipo) => {
    if (autorTipo === 'PLATAFORMA') return 'Operador da plataforma';
    if (autorTipo === 'CLIENTE') return 'Cliente da empresa';
    return autorTipo || 'Origem não identificada';
};

const identificacaoAutorMensagem = (mensagem) => {
    if (!mensagem?.autorLogin && !mensagem?.autorPerfil) return mensagem?.autorNome || 'Autor não identificado';

    const identificadores = [];
    if (mensagem?.autorLogin) identificadores.push(`@${mensagem.autorLogin}`);
    if (mensagem?.autorPerfil) identificadores.push(mensagem.autorPerfil);

    return `${mensagem.autorNome} (${identificadores.join(' · ')})`;
};

const identificacaoAutorTicket = (ticket) => {
    if (!ticket?.ultimaMensagemAutorNome) return '';

    const identificadores = [];
    if (ticket?.ultimaMensagemAutorLogin) identificadores.push(`@${ticket.ultimaMensagemAutorLogin}`);
    if (ticket?.ultimaMensagemAutorPerfil) identificadores.push(ticket.ultimaMensagemAutorPerfil);

    if (!identificadores.length) return ticket.ultimaMensagemAutorNome;
    return `${ticket.ultimaMensagemAutorNome} (${identificadores.join(' · ')})`;
};

export const AtendimentoSaas = ({ modo = 'cliente' }) => {
    const isPlataforma = modo === 'plataforma';
    const templatesPadrao = templatesPadraoPlataforma.map((conteudo, index) => ({
        id: `padrao-${index}`,
        titulo: `Template ${index + 1}`,
        conteudo,
        isPadrao: true
    }));
    const [tickets, setTickets] = useState([]);
    const [resumoSuporte, setResumoSuporte] = useState(null);
    const [ticketAtivo, setTicketAtivo] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMensagens, setLoadingMensagens] = useState(false);
    const [busca, setBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
    const [filtroSla, setFiltroSla] = useState('');
    const [filtroSeveridade, setFiltroSeveridade] = useState('');
    const [filtroResponsavel, setFiltroResponsavel] = useState('');
    const [filtroFinalizados, setFiltroFinalizados] = useState(false);
    const [contextoTriagem, setContextoTriagem] = useState(null);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
    const [incidentesEmpresa, setIncidentesEmpresa] = useState([]);
    const [novoTicket, setNovoTicket] = useState({
        titulo: '',
        categoria: 'OPERACIONAL',
        prioridade: 'MEDIA',
        mensagemInicial: ''
    });
    const [statusAtual, setStatusAtual] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [incidenteSelecionado, setIncidenteSelecionado] = useState('');
    const [abrirNovoIncidente, setAbrirNovoIncidente] = useState(false);
    const [novoIncidente, setNovoIncidente] = useState({
        tipo: 'OPERACIONAL',
        titulo: '',
        severidade: 'MEDIA',
        status: 'ABERTO',
        prazoResposta: '',
        prazoResolucao: '',
        descricao: '',
        resolucao: ''
    });
    const [processando, setProcessando] = useState(false);
    const [templatesRapidos, setTemplatesRapidos] = useState(templatesPadrao);
    const ultimoTimestampMensagensRef = useRef(null);
    const audioLiberadoRef = useRef(false);

    const endpointTickets = useMemo(
        () => isPlataforma ? '/api/atendimentos/plataforma/tickets' : '/api/atendimentos/meus',
        [isPlataforma]
    );

    const ticketsFiltrados = useMemo(() => {
        if (!isPlataforma) return tickets;

        return tickets.filter((ticket) => {
            const incidente = {
                status: ticket.incidenteStatus,
                severidade: ticket.incidenteSeveridade,
                prazoResposta: ticket.incidentePrazoResposta,
                prazoResolucao: ticket.incidentePrazoResolucao
            };
            const estadoSla = calcularEstadoSla(ticket.incidenteId ? incidente : null);

            const passouSla =
                !filtroSla ||
                (filtroSla === 'VENCIDO' && ['SLA vencido', 'Resposta vencida'].includes(estadoSla?.label)) ||
                (filtroSla === 'ANDAMENTO' && ['SLA em andamento', 'Resposta em andamento'].includes(estadoSla?.label)) ||
                (filtroSla === 'SEM_SLA' && estadoSla?.label === 'Sem SLA definido');

            const passouSeveridade = !filtroSeveridade || ticket.incidenteSeveridade === filtroSeveridade;
            const passouResponsavel =
                !filtroResponsavel ||
                (filtroResponsavel === 'SEM_RESPONSAVEL' && !ticket.plataformaResponsavel) ||
                (filtroResponsavel === 'COM_RESPONSAVEL' && !!ticket.plataformaResponsavel);
            const passouFinalizados = !filtroFinalizados || ['RESOLVIDO', 'ENCERRADO'].includes(ticket.status);

            return passouSla && passouSeveridade && passouResponsavel && passouFinalizados;
        });
    }, [tickets, isPlataforma, filtroSla, filtroSeveridade, filtroResponsavel, filtroFinalizados]);

    const limparFiltrosResumo = () => {
        setStatusFiltro('');
        setFiltroSla('');
        setFiltroSeveridade('');
        setFiltroResponsavel('');
        setFiltroFinalizados(false);
        setContextoTriagem(null);
    };

    const aplicarFiltroResumo = (tipo) => {
        const aguardandoAtivo =
            statusFiltro === 'AGUARDANDO_PLATAFORMA' &&
            !filtroSla &&
            !filtroSeveridade &&
            !filtroResponsavel &&
            !filtroFinalizados;
        const criticosAtivo =
            filtroSeveridade === 'CRITICA' &&
            !statusFiltro &&
            !filtroSla &&
            !filtroResponsavel &&
            !filtroFinalizados;
        const slaVencidoAtivo =
            filtroSla === 'VENCIDO' &&
            !statusFiltro &&
            !filtroSeveridade &&
            !filtroResponsavel &&
            !filtroFinalizados;
        const semResponsavelAtivo =
            filtroResponsavel === 'SEM_RESPONSAVEL' &&
            !statusFiltro &&
            !filtroSla &&
            !filtroSeveridade &&
            !filtroFinalizados;

        const handlers = {
            AGUARDANDO_PLATAFORMA: aguardandoAtivo,
            CRITICOS: criticosAtivo,
            SLA_VENCIDO: slaVencidoAtivo,
            SEM_RESPONSAVEL: semResponsavelAtivo,
            FINALIZADOS: filtroFinalizados
        };

        if (handlers[tipo]) {
            limparFiltrosResumo();
            return;
        }

        limparFiltrosResumo();

        if (tipo === 'AGUARDANDO_PLATAFORMA') {
            setStatusFiltro('AGUARDANDO_PLATAFORMA');
            setContextoTriagem({
                titulo: 'Fila aguardando plataforma',
                descricao: 'Tickets que dependem de resposta ou ação imediata da plataforma.'
            });
        }
        if (tipo === 'CRITICOS') {
            setFiltroSeveridade('CRITICA');
            setContextoTriagem({
                titulo: 'Fila crítica',
                descricao: 'Tickets com severidade crítica para triagem prioritária.'
            });
        }
        if (tipo === 'SLA_VENCIDO') {
            setFiltroSla('VENCIDO');
            setContextoTriagem({
                titulo: 'Fila com SLA vencido',
                descricao: 'Tickets com prazo de resposta ou resolução já vencido.'
            });
        }
        if (tipo === 'SEM_RESPONSAVEL') {
            setFiltroResponsavel('SEM_RESPONSAVEL');
            setContextoTriagem({
                titulo: 'Fila sem responsável',
                descricao: 'Tickets que ainda precisam ser assumidos por um operador.'
            });
        }
        if (tipo === 'FINALIZADOS') {
            setFiltroFinalizados(true);
            setContextoTriagem({
                titulo: 'Fila de tickets finalizados',
                descricao: 'Atendimentos já resolvidos ou encerrados para conferência e auditoria.'
            });
        }
    };

    const classeCardResumo = (ativo, palette) =>
        `rounded-3xl border p-5 text-left transition ${
            ativo ? `${palette.activeBorder} ${palette.activeBg} shadow-sm` : `${palette.border} ${palette.bg} hover:${palette.hoverBorder}`
        }`;

    const carregarTickets = async (preservarSelecionado = true) => {
        setLoading(true);
        try {
            const res = await api.get(endpointTickets, {
                params: isPlataforma ? {
                    status: statusFiltro || undefined,
                    busca: busca || undefined
                } : undefined
            });
            const lista = Array.isArray(res.data) ? res.data : [];
            setTickets(lista);

            if (!preservarSelecionado) {
                setTicketAtivo(lista[0] || null);
            } else if (ticketAtivo) {
                const atualizado = lista.find((item) => item.id === ticketAtivo.id);
                setTicketAtivo(atualizado || lista[0] || null);
            } else {
                setTicketAtivo(lista[0] || null);
            }
        } catch (error) {
            toast.error('Não foi possível carregar os atendimentos.');
        } finally {
            setLoading(false);
        }
    };

    const carregarMensagens = async (ticket) => {
        if (!ticket?.id) {
            setMensagens([]);
            return;
        }
        setLoadingMensagens(true);
        try {
            const rota = isPlataforma
                ? `/api/atendimentos/plataforma/tickets/${ticket.id}/mensagens`
                : `/api/atendimentos/meus/${ticket.id}/mensagens`;
            const res = await api.get(rota);
            const lista = Array.isArray(res.data) ? res.data : [];
            setMensagens(lista);

            const ultimaMensagem = lista[lista.length - 1];
            const ultimoTimestampAtual = ultimaMensagem?.createdAt || null;
            const mensagemChegouAgora =
                ultimoTimestampMensagensRef.current &&
                ultimoTimestampAtual &&
                ultimoTimestampAtual !== ultimoTimestampMensagensRef.current;
            const autorEsperado = isPlataforma ? 'CLIENTE' : 'PLATAFORMA';
            if (mensagemChegouAgora && ultimaMensagem?.autorTipo === autorEsperado) {
                tocarSomMensagem();
                toast( isPlataforma ? 'Nova mensagem do cliente.' : 'Nova mensagem da plataforma.', {
                    icon: '🔔'
                });
            }
            ultimoTimestampMensagensRef.current = ultimoTimestampAtual;
        } catch (error) {
            toast.error('Não foi possível carregar a conversa.');
        } finally {
            setLoadingMensagens(false);
        }
    };

    const carregarIncidentesEmpresa = async (ticket) => {
        if (!isPlataforma || !ticket?.empresaId) {
            setIncidentesEmpresa([]);
            return;
        }
        try {
            const res = await api.get(`/api/assinaturas/empresas/${ticket.empresaId}/incidentes`);
            setIncidentesEmpresa(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            setIncidentesEmpresa([]);
        }
    };

    const carregarResumoSuporte = async () => {
        if (!isPlataforma) return;
        try {
            const res = await api.get('/api/atendimentos/plataforma/resumo');
            setResumoSuporte(res.data || null);
        } catch (error) {
            setResumoSuporte(null);
        }
    };

    useEffect(() => {
        carregarTickets(false);
        carregarResumoSuporte();
    }, [endpointTickets]);

    useEffect(() => {
        if (!isPlataforma) return;
        const id = window.setTimeout(() => carregarTickets(false), 500);
        return () => window.clearTimeout(id);
    }, [busca, statusFiltro]);

    useEffect(() => {
        carregarMensagens(ticketAtivo);
    }, [ticketAtivo?.id, isPlataforma]);

    useEffect(() => {
        if (!isPlataforma) return;

        if (!ticketsFiltrados.length) {
            if (ticketAtivo) {
                setTicketAtivo(null);
            }
            return;
        }

        const ticketAtualAindaVisivel = ticketAtivo && ticketsFiltrados.some((ticket) => ticket.id === ticketAtivo.id);
        if (!ticketAtualAindaVisivel) {
            setTicketAtivo(ticketsFiltrados[0]);
        }
    }, [ticketsFiltrados, ticketAtivo, isPlataforma]);

    useEffect(() => {
        carregarIncidentesEmpresa(ticketAtivo);
    }, [ticketAtivo?.id, isPlataforma]);

    useEffect(() => {
        if (!isPlataforma || !ticketAtivo) return;
        setResponsavel(ticketAtivo.plataformaResponsavel || '');
        setIncidenteSelecionado(ticketAtivo.incidenteId || '');
        setStatusAtual(ticketAtivo.status || 'ABERTO');
        setAbrirNovoIncidente(false);
        setNovoIncidente({
            tipo: 'OPERACIONAL',
            titulo: ticketAtivo.titulo || '',
            severidade: ticketAtivo.prioridade || 'MEDIA',
            status: 'ABERTO',
            prazoResposta: '',
            prazoResolucao: '',
            descricao: '',
            resolucao: ''
        });
    }, [ticketAtivo?.id, isPlataforma]);

    useEffect(() => {
        const liberarAudio = () => {
            audioLiberadoRef.current = true;
            window.removeEventListener('pointerdown', liberarAudio);
            window.removeEventListener('keydown', liberarAudio);
        };
        window.addEventListener('pointerdown', liberarAudio);
        window.addEventListener('keydown', liberarAudio);
        return () => {
            window.removeEventListener('pointerdown', liberarAudio);
            window.removeEventListener('keydown', liberarAudio);
        };
    }, []);

    useEffect(() => {
        if (!isPlataforma) return;
        const carregarTemplates = async () => {
            try {
                const res = await api.get('/api/atendimentos/plataforma/templates');
                const itens = Array.isArray(res.data) ? res.data : [];
                const customizados = itens.map((item) => ({
                    id: item.id,
                    titulo: item.titulo,
                    conteudo: item.conteudo,
                    isPadrao: false
                }));
                setTemplatesRapidos([...templatesPadrao, ...customizados]);
            } catch (error) {
                setTemplatesRapidos(templatesPadrao);
            }
        };
        carregarTemplates();
    }, [isPlataforma]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            carregarTickets(true);
            carregarResumoSuporte();
            if (ticketAtivo?.id) {
                carregarMensagens(ticketAtivo);
            }
        }, 10000);
        return () => window.clearInterval(interval);
    }, [ticketAtivo?.id, endpointTickets, statusFiltro, busca]);

    const abrirTicket = async () => {
        setProcessando(true);
        const toastId = toast.loading('Abrindo atendimento...');
        try {
            await api.post('/api/atendimentos/meus', novoTicket);
            setNovoTicket({ titulo: '', categoria: 'OPERACIONAL', prioridade: 'MEDIA', mensagemInicial: '' });
            await carregarTickets(false);
            toast.success('Atendimento criado com sucesso.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível abrir o atendimento.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const enviarMensagem = async () => {
        if (!ticketAtivo?.id || !novaMensagem.trim()) return;
        setProcessando(true);
        const toastId = toast.loading('Enviando mensagem...');
        try {
            const rota = isPlataforma
                ? `/api/atendimentos/plataforma/tickets/${ticketAtivo.id}/mensagens`
                : `/api/atendimentos/meus/${ticketAtivo.id}/mensagens`;
            await api.post(rota, { mensagem: novaMensagem });
            setNovaMensagem('');
            await carregarTickets(true);
            await carregarMensagens(ticketAtivo);
            toast.success('Mensagem enviada.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível enviar a mensagem.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const enviarAnexo = async () => {
        if (!ticketAtivo?.id || !arquivoSelecionado) return;
        setProcessando(true);
        const toastId = toast.loading('Enviando anexo...');
        try {
            const formData = new FormData();
            formData.append('file', arquivoSelecionado);
            if (novaMensagem.trim()) {
                formData.append('mensagem', novaMensagem.trim());
            }
            const rota = isPlataforma
                ? `/api/atendimentos/plataforma/tickets/${ticketAtivo.id}/anexos`
                : `/api/atendimentos/meus/${ticketAtivo.id}/anexos`;
            await api.post(rota, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setArquivoSelecionado(null);
            setNovaMensagem('');
            await carregarTickets(true);
            await carregarMensagens(ticketAtivo);
            toast.success('Anexo enviado.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível enviar o anexo.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const atualizarStatus = async (status) => {
        if (!ticketAtivo?.id) return;
        setProcessando(true);
        const toastId = toast.loading('Atualizando status...');
        try {
            const res = await api.post(`/api/atendimentos/plataforma/tickets/${ticketAtivo.id}/status`, {
                status: status || statusAtual,
                plataformaResponsavel: responsavel,
                incidenteId: incidenteSelecionado || null
            });
            const ticketAtualizado = res?.data || null;
            if (ticketAtualizado?.id) {
                setTicketAtivo(ticketAtualizado);
            }
            await carregarTickets(true);
            await carregarMensagens(ticketAtualizado || ticketAtivo);
            toast.success('Status atualizado.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível atualizar o status.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const criarIncidenteRapido = async () => {
        if (!isPlataforma || !ticketAtivo?.empresaId) return;
        setProcessando(true);
        const toastId = toast.loading('Criando incidente...');
        try {
            const payload = {
                ...novoIncidente,
                titulo: novoIncidente.titulo || ticketAtivo.titulo,
                responsavel: responsavel || undefined,
                descricao: novoIncidente.descricao || `Originado do ticket #${ticketAtivo.id}: ${ticketAtivo.titulo}`
            };
            const res = await api.post(`/api/assinaturas/empresas/${ticketAtivo.empresaId}/incidentes`, payload);
            const incidente = res?.data;
            await carregarIncidentesEmpresa(ticketAtivo);
            if (incidente?.id) {
                setIncidenteSelecionado(String(incidente.id));
                const ticketAtualizado = await api.post(`/api/atendimentos/plataforma/tickets/${ticketAtivo.id}/status`, {
                    status: statusAtual || ticketAtivo.status,
                    plataformaResponsavel: responsavel,
                    incidenteId: incidente.id
                });
                if (ticketAtualizado?.data?.id) {
                    setTicketAtivo(ticketAtualizado.data);
                }
                await carregarTickets(true);
            }
            setAbrirNovoIncidente(false);
            toast.success('Incidente criado e vinculado ao ticket.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível criar o incidente.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const finalizarAtendimento = async () => {
        if (!ticketAtivo?.id) return;
        setProcessando(true);
        const toastId = toast.loading('Finalizando atendimento...');
        try {
            if (isPlataforma) {
                await atualizarStatus('ENCERRADO');
            } else {
                const res = await api.post(`/api/atendimentos/meus/${ticketAtivo.id}/encerrar`);
                if (res?.data?.id) {
                    setTicketAtivo(res.data);
                }
                await carregarTickets(true);
                await carregarMensagens(ticketAtivo);
                toast.success('Atendimento finalizado.', { id: toastId });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível finalizar o atendimento.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const executarAcaoRapida = async (ticket, acao) => {
        if (!isPlataforma || !ticket?.id) return;
        if (acao === 'abrir-incidente') {
            setTicketAtivo(ticket);
            setAbrirNovoIncidente(true);
            return;
        }

        setProcessando(true);
        const labels = {
            assumir: 'Assumindo atendimento...',
            em_atendimento: 'Movendo para atendimento...',
            finalizar: 'Finalizando atendimento...'
        };
        const toastId = toast.loading(labels[acao] || 'Atualizando atendimento...');
        try {
            const statusDestino =
                acao === 'finalizar' ? 'ENCERRADO' :
                acao === 'em_atendimento' ? 'EM_ATENDIMENTO' :
                ticket.status;

            const res = await api.post(`/api/atendimentos/plataforma/tickets/${ticket.id}/status`, {
                status: statusDestino,
                plataformaResponsavel: acao === 'assumir' ? undefined : (ticket.plataformaResponsavel || responsavel || undefined),
                incidenteId: ticket.incidenteId || null
            });
            const ticketAtualizado = res?.data || null;
            await carregarTickets(true);
            if (ticketAtivo?.id === ticket.id && ticketAtualizado?.id) {
                setTicketAtivo(ticketAtualizado);
                setStatusAtual(ticketAtualizado.status || statusAtual);
                setResponsavel(ticketAtualizado.plataformaResponsavel || responsavel);
            }
            toast.success('Atendimento atualizado.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível executar a ação rápida.', { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const tocarSomMensagem = () => {
        if (!audioLiberadoRef.current || typeof window === 'undefined') return;
        const AudioContextApi = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextApi) return;
        const ctx = new AudioContextApi();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.26);
        oscillator.onended = () => {
            ctx.close().catch(() => {});
        };
    };

    const aplicarTemplate = (texto) => {
        setNovaMensagem(texto);
    };

    const salvarTemplateAtual = async () => {
        const texto = novaMensagem.trim();
        if (!texto) {
            toast.error('Digite uma resposta antes de salvar como template.');
            return;
        }
        if (templatesRapidos.some((item) => item.conteudo === texto)) {
            toast.error('Esse template já existe.');
            return;
        }
        const toastId = toast.loading('Salvando template...');
        try {
            const tituloBase = texto.length > 42 ? `${texto.slice(0, 42)}...` : texto;
            const res = await api.post('/api/atendimentos/plataforma/templates', {
                titulo: tituloBase,
                conteudo: texto
            });
            const item = res?.data;
            setTemplatesRapidos((prev) => [
                ...prev,
                {
                    id: item?.id || `custom-${Date.now()}`,
                    titulo: item?.titulo || tituloBase,
                    conteudo: item?.conteudo || texto,
                    isPadrao: false
                }
            ]);
            toast.success('Template salvo para respostas rápidas.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível salvar o template.', { id: toastId });
        }
    };

    const excluirTemplate = async (templateId) => {
        const toastId = toast.loading('Removendo template...');
        try {
            await api.delete(`/api/atendimentos/plataforma/templates/${templateId}`);
            setTemplatesRapidos((prev) => prev.filter((item) => item.id !== templateId));
            toast.success('Template removido.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível remover o template.', { id: toastId });
        }
    };

    const incidenteVinculado = useMemo(
        () => incidentesEmpresa.find((item) => String(item.id) === String(ticketAtivo?.incidenteId || incidenteSelecionado)),
        [incidentesEmpresa, ticketAtivo?.incidenteId, incidenteSelecionado]
    );
    const estadoSla = useMemo(() => calcularEstadoSla(incidenteVinculado), [incidenteVinculado]);
    const atendimentoFinalizado = ticketAtivo?.status === 'ENCERRADO' || ticketAtivo?.status === 'RESOLVIDO';
    const timelineTicket = useMemo(() => {
        if (!ticketAtivo) return [];

        const eventos = [
            {
                id: `ticket-open-${ticketAtivo.id}`,
                tipo: 'ABERTURA',
                titulo: 'Ticket aberto',
                descricao: `${ticketAtivo.titulo} · ${ticketAtivo.categoria}`,
                data: ticketAtivo.createdAt
            }
        ];

        if (ticketAtivo.plataformaResponsavel) {
            eventos.push({
                id: `ticket-owner-${ticketAtivo.id}`,
                tipo: 'RESPONSAVEL',
                titulo: 'Responsável definido',
                descricao: ticketAtivo.plataformaResponsavel,
                data: ticketAtivo.updatedAt
            });
        }

        if (ticketAtivo.incidenteId) {
            eventos.push({
                id: `ticket-incident-${ticketAtivo.id}`,
                tipo: 'INCIDENTE',
                titulo: `Incidente #${ticketAtivo.incidenteId} vinculado`,
                descricao: ticketAtivo.incidenteTitulo || 'Incidente operacional associado ao atendimento',
                data: incidenteVinculado?.createdAt || ticketAtivo.updatedAt
            });
        }

        if (ticketAtivo.closedAt) {
            eventos.push({
                id: `ticket-closed-${ticketAtivo.id}`,
                tipo: 'FECHAMENTO',
                titulo: 'Atendimento finalizado',
                descricao: `Status final: ${ticketAtivo.status}`,
                data: ticketAtivo.closedAt
            });
        } else if (ticketAtivo.updatedAt && ticketAtivo.updatedAt !== ticketAtivo.createdAt) {
            eventos.push({
                id: `ticket-status-${ticketAtivo.id}`,
                tipo: 'STATUS',
                titulo: 'Status atualizado',
                descricao: ticketAtivo.status,
                data: ticketAtivo.updatedAt
            });
        }

        mensagens.forEach((mensagem) => {
            eventos.push({
                id: `msg-${mensagem.id}`,
                tipo: mensagem.arquivoUrl ? 'ANEXO' : 'MENSAGEM',
                titulo: mensagem.arquivoUrl ? 'Anexo enviado' : 'Mensagem enviada',
                descricao: mensagem.arquivoUrl
                    ? `${identificacaoAutorMensagem(mensagem)} enviou ${mensagem.arquivoNome || 'um arquivo'}`
                    : `${identificacaoAutorMensagem(mensagem)}: ${mensagem.mensagem}`,
                data: mensagem.createdAt,
                destaque: mensagem.autorTipo,
                origem: descricaoAutorMensagem(mensagem.autorTipo),
                autorNome: mensagem.autorNome || '',
                autorLogin: mensagem.autorLogin || '',
                autorPerfil: mensagem.autorPerfil || ''
            });
        });

        return ordenarTimeline(eventos);
    }, [ticketAtivo, mensagens, incidenteVinculado]);

    const exportarInboxFiltrado = () => {
        if (!ticketsFiltrados.length) {
            toast.error('Não há tickets no filtro atual para exportar.');
            return;
        }

        const cabecalhos = [
            'Ticket',
            'Empresa',
            'Titulo',
            'Categoria',
            'Prioridade',
            'Status',
            'Responsavel',
            'Incidente',
            'Severidade',
            'SLA',
            'Ultima Atualizacao'
        ];
        const linhas = ticketsFiltrados.map((ticket) => {
            const sla = calcularEstadoSla(ticket.incidenteId ? {
                status: ticket.incidenteStatus,
                prazoResposta: ticket.incidentePrazoResposta,
                prazoResolucao: ticket.incidentePrazoResolucao
            } : null);
            return [
                csvCell(ticket.id),
                csvCell(ticket.empresaNome),
                csvCell(ticket.titulo),
                csvCell(ticket.categoria),
                csvCell(ticket.prioridade),
                csvCell(ticket.status),
                csvCell(ticket.plataformaResponsavel || ''),
                csvCell(ticket.incidenteTitulo || ''),
                csvCell(ticket.incidenteSeveridade || ''),
                csvCell(sla?.label || ''),
                csvCell(ticket.ultimaMensagemAt || '')
            ];
        });
        baixarCsv(`atendimento_inbox_${new Date().toISOString().slice(0, 10)}.csv`, cabecalhos, linhas);
        toast.success('CSV do inbox exportado.');
    };

    const exportarTimelineTicket = () => {
        if (!ticketAtivo || !timelineTicket.length) {
            toast.error('Não há timeline para exportar neste ticket.');
            return;
        }
        const cabecalhos = ['Ticket', 'Tipo', 'Titulo', 'Descricao', 'Origem', 'Autor', 'Login', 'Perfil', 'Data'];
        const linhas = timelineTicket.map((evento) => [
            csvCell(ticketAtivo.id),
            csvCell(evento.tipo),
            csvCell(evento.titulo),
            csvCell(evento.descricao),
            csvCell(evento.origem || ''),
            csvCell(evento.autorNome || ''),
            csvCell(evento.autorLogin || ''),
            csvCell(evento.autorPerfil || ''),
            csvCell(evento.data || '')
        ]);
        baixarCsv(`ticket_${ticketAtivo.id}_timeline.csv`, cabecalhos, linhas);
        toast.success('CSV da timeline exportado.');
    };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                            {isPlataforma ? 'Inbox da Plataforma' : 'Canal com a Plataforma'}
                        </div>
                        <h2 className="mt-2 text-2xl font-black text-slate-900">
                            {isPlataforma ? 'Central de atendimento SaaS' : 'Atendimento em tempo real com a plataforma'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            {isPlataforma
                                ? 'Acompanhe tickets de clientes, responda em tempo quase real e atualize o status do atendimento.'
                                : 'Abra um ticket com a plataforma e acompanhe a resposta do suporte em um só lugar.'}
                        </p>
                    </div>
                    {isPlataforma && (
                        <div className="grid gap-3 md:grid-cols-5">
                            <input
                                value={busca}
                                onChange={(e) => {
                                    setBusca(e.target.value);
                                    setFiltroFinalizados(false);
                                    setContextoTriagem(null);
                                }}
                                placeholder="Buscar empresa, cliente ou categoria"
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                            />
                            <select
                                value={statusFiltro}
                                onChange={(e) => {
                                    setStatusFiltro(e.target.value);
                                    setFiltroFinalizados(false);
                                    setContextoTriagem(null);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">Todos os status</option>
                                <option value="ABERTO">ABERTO</option>
                                <option value="AGUARDANDO_PLATAFORMA">AGUARDANDO_PLATAFORMA</option>
                                <option value="AGUARDANDO_CLIENTE">AGUARDANDO_CLIENTE</option>
                                <option value="EM_ATENDIMENTO">EM_ATENDIMENTO</option>
                                <option value="RESOLVIDO">RESOLVIDO</option>
                            </select>
                            <select
                                value={filtroSla}
                                onChange={(e) => {
                                    setFiltroSla(e.target.value);
                                    setFiltroFinalizados(false);
                                    setContextoTriagem(null);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">Todos os SLAs</option>
                                <option value="VENCIDO">SLA vencido</option>
                                <option value="ANDAMENTO">SLA em andamento</option>
                                <option value="SEM_SLA">Sem SLA</option>
                            </select>
                            <select
                                value={filtroResponsavel}
                                onChange={(e) => {
                                    setFiltroResponsavel(e.target.value);
                                    setFiltroFinalizados(false);
                                    setContextoTriagem(null);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">Todos os responsáveis</option>
                                <option value="SEM_RESPONSAVEL">Sem responsável</option>
                                <option value="COM_RESPONSAVEL">Com responsável</option>
                            </select>
                            <button
                                onClick={exportarInboxFiltrado}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                            >
                                Exportar inbox
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {isPlataforma && (
                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <button
                        onClick={() => aplicarFiltroResumo('AGUARDANDO_PLATAFORMA')}
                        className={classeCardResumo(
                            statusFiltro === 'AGUARDANDO_PLATAFORMA' &&
                                !filtroSla &&
                                !filtroSeveridade &&
                                !filtroResponsavel &&
                                !filtroFinalizados,
                            {
                                border: 'border-amber-200',
                                bg: 'bg-amber-50',
                                hoverBorder: 'border-amber-300',
                                activeBorder: 'border-amber-400',
                                activeBg: 'bg-amber-100'
                            }
                        )}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Ação imediata</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.aguardandoPlataforma || 0}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Aguardando plataforma</div>
                    </button>
                    <button
                        onClick={() => aplicarFiltroResumo('CRITICOS')}
                        className={classeCardResumo(
                            filtroSeveridade === 'CRITICA' &&
                                !statusFiltro &&
                                !filtroSla &&
                                !filtroResponsavel &&
                                !filtroFinalizados,
                            {
                                border: 'border-red-200',
                                bg: 'bg-red-50',
                                hoverBorder: 'border-red-300',
                                activeBorder: 'border-red-400',
                                activeBg: 'bg-red-100'
                            }
                        )}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Prioridade</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.ticketsCriticos || 0}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Tickets críticos</div>
                    </button>
                    <button
                        onClick={() => aplicarFiltroResumo('SLA_VENCIDO')}
                        className={classeCardResumo(
                            filtroSla === 'VENCIDO' &&
                                !statusFiltro &&
                                !filtroSeveridade &&
                                !filtroResponsavel &&
                                !filtroFinalizados,
                            {
                                border: 'border-rose-200',
                                bg: 'bg-rose-50',
                                hoverBorder: 'border-rose-300',
                                activeBorder: 'border-rose-400',
                                activeBg: 'bg-rose-100'
                            }
                        )}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">SLA</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.slaVencido || 0}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">SLA vencido</div>
                    </button>
                    <button
                        onClick={() => aplicarFiltroResumo('SEM_RESPONSAVEL')}
                        className={classeCardResumo(
                            filtroResponsavel === 'SEM_RESPONSAVEL' &&
                                !statusFiltro &&
                                !filtroSla &&
                                !filtroSeveridade &&
                                !filtroFinalizados,
                            {
                                border: 'border-slate-300',
                                bg: 'bg-slate-100',
                                hoverBorder: 'border-slate-400',
                                activeBorder: 'border-slate-500',
                                activeBg: 'bg-slate-200'
                            }
                        )}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Cobertura</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.semResponsavel || 0}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Sem responsável</div>
                    </button>
                    <button
                        onClick={() => aplicarFiltroResumo('FINALIZADOS')}
                        className={classeCardResumo(filtroFinalizados, {
                            border: 'border-emerald-200',
                            bg: 'bg-emerald-50',
                            hoverBorder: 'border-emerald-300',
                            activeBorder: 'border-emerald-400',
                            activeBg: 'bg-emerald-100'
                        })}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Fechamento</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.finalizados || 0}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Tickets finalizados</div>
                    </button>
                    <button
                        onClick={limparFiltrosResumo}
                        className={classeCardResumo(
                            !statusFiltro && !filtroSla && !filtroSeveridade && !filtroResponsavel && !filtroFinalizados,
                            {
                                border: 'border-blue-200',
                                bg: 'bg-blue-50',
                                hoverBorder: 'border-blue-300',
                                activeBorder: 'border-blue-400',
                                activeBg: 'bg-blue-100'
                            }
                        )}
                    >
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Resposta</div>
                        <div className="mt-3 text-3xl font-black text-slate-900">{resumoSuporte?.tempoMedioPrimeiraRespostaMinutos || 0} min</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Média da primeira resposta</div>
                    </button>
                </section>
            )}

            <section className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {!isPlataforma && (
                        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Novo ticket</div>
                            <div className="mt-3 grid gap-3">
                                <input
                                    value={novoTicket.titulo}
                                    onChange={(e) => setNovoTicket(prev => ({ ...prev, titulo: e.target.value }))}
                                    placeholder="Título do atendimento"
                                    className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <select
                                        value={novoTicket.categoria}
                                        onChange={(e) => setNovoTicket(prev => ({ ...prev, categoria: e.target.value }))}
                                        className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="OPERACIONAL">OPERACIONAL</option>
                                        <option value="FINANCEIRO">FINANCEIRO</option>
                                        <option value="COMERCIAL">COMERCIAL</option>
                                        <option value="TECNICO">TECNICO</option>
                                    </select>
                                    <select
                                        value={novoTicket.prioridade}
                                        onChange={(e) => setNovoTicket(prev => ({ ...prev, prioridade: e.target.value }))}
                                        className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="BAIXA">BAIXA</option>
                                        <option value="MEDIA">MEDIA</option>
                                        <option value="ALTA">ALTA</option>
                                        <option value="CRITICA">CRITICA</option>
                                    </select>
                                </div>
                                <textarea
                                    value={novoTicket.mensagemInicial}
                                    onChange={(e) => setNovoTicket(prev => ({ ...prev, mensagemInicial: e.target.value }))}
                                    placeholder="Explique o problema, impacto e o que já foi tentado."
                                    className="min-h-[120px] rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={abrirTicket}
                                    disabled={processando}
                                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                                >
                                    Abrir atendimento
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`${!isPlataforma ? 'mt-5' : ''}`}>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Tickets</div>
                        {isPlataforma && (
                            <div className="mt-3">
                                <select
                                    value={filtroSeveridade}
                                    onChange={(e) => {
                                        setFiltroSeveridade(e.target.value);
                                        setFiltroFinalizados(false);
                                        setContextoTriagem(null);
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">Todas as severidades</option>
                                    <option value="BAIXA">BAIXA</option>
                                    <option value="MEDIA">MEDIA</option>
                                    <option value="ALTA">ALTA</option>
                                    <option value="CRITICA">CRITICA</option>
                                </select>
                            </div>
                        )}
                        <div className="mt-4 space-y-3">
                            {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-500">Carregando tickets...</div>}
                            {!loading && ticketsFiltrados.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-500">
                                    Nenhum atendimento encontrado.
                                </div>
                            )}
                            {!loading && ticketsFiltrados.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setTicketAtivo(ticket)}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${
                                        ticketAtivo?.id === ticket.id
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-black text-slate-900">#{ticket.id} · {ticket.titulo}</div>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClasses(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                        {isPlataforma ? `${ticket.empresaNome} · ` : ''}{ticket.categoria} · {ticket.prioridade}
                                    </div>
                                    {isPlataforma && ticket.incidenteId && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                                                Incidente #{ticket.incidenteId}
                                            </span>
                                            {calcularEstadoSla({
                                                status: ticket.incidenteStatus,
                                                prazoResposta: ticket.incidentePrazoResposta,
                                                prazoResolucao: ticket.incidentePrazoResolucao
                                            })?.label && (
                                                <span className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
                                                    {calcularEstadoSla({
                                                        status: ticket.incidenteStatus,
                                                        prazoResposta: ticket.incidentePrazoResposta,
                                                        prazoResolucao: ticket.incidentePrazoResolucao
                                                    })?.label}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-1 text-xs font-medium text-slate-500">
                                        Última atualização: {ticket.ultimaMensagemAt ? new Date(ticket.ultimaMensagemAt).toLocaleString('pt-BR') : '-'}
                                    </div>
                                    {isPlataforma && ticket.ultimaMensagemAutorTipo && (
                                        <div className="mt-2 text-xs font-semibold text-slate-500">
                                            Última interação: <span className="font-black text-slate-700">{descricaoAutorMensagem(ticket.ultimaMensagemAutorTipo)}</span>
                                            {' · '}
                                            <span className="text-slate-600">{identificacaoAutorTicket(ticket)}</span>
                                        </div>
                                    )}
                                    {isPlataforma && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {!ticket.plataformaResponsavel && ticket.status !== 'ENCERRADO' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executarAcaoRapida(ticket, 'assumir');
                                                    }}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                                >
                                                    Assumir
                                                </button>
                                            )}
                                            {ticket.status !== 'EM_ATENDIMENTO' && ticket.status !== 'ENCERRADO' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executarAcaoRapida(ticket, 'em_atendimento');
                                                    }}
                                                    className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 transition hover:border-amber-400"
                                                >
                                                    Em atendimento
                                                </button>
                                            )}
                                            {!ticket.incidenteId && ticket.status !== 'ENCERRADO' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executarAcaoRapida(ticket, 'abrir-incidente');
                                                    }}
                                                    className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-violet-800 transition hover:border-violet-400"
                                                >
                                                    Abrir incidente
                                                </button>
                                            )}
                                            {ticket.status !== 'ENCERRADO' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executarAcaoRapida(ticket, 'finalizar');
                                                    }}
                                                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-400"
                                                >
                                                    Finalizar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {!ticketAtivo && (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-500">
                            Selecione um ticket para abrir a conversa.
                        </div>
                    )}

                    {ticketAtivo && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-xl font-black text-slate-900">#{ticketAtivo.id} · {ticketAtivo.titulo}</h3>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClasses(ticketAtivo.status)}`}>
                                            {ticketAtivo.status}
                                        </span>
                                        {isPlataforma && contextoTriagem && (
                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                {contextoTriagem.titulo}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                        {isPlataforma ? `${ticketAtivo.empresaNome} · ` : ''}{ticketAtivo.categoria} · Prioridade {ticketAtivo.prioridade}
                                    </div>
                                    {isPlataforma && (
                                        <div className="mt-2 text-sm font-semibold text-slate-600">
                                            Responsável atual da plataforma: <span className="font-black text-slate-900">{ticketAtivo.plataformaResponsavel || 'Não definido'}</span>
                                        </div>
                                    )}
                                    {isPlataforma && contextoTriagem && (
                                        <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                                            {contextoTriagem.descricao}
                                        </div>
                                    )}
                                </div>
                                {isPlataforma && (
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <input
                                            value={responsavel}
                                            onChange={(e) => setResponsavel(e.target.value)}
                                            placeholder="Responsável da plataforma"
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                        />
                                        <select
                                            value={statusAtual}
                                            onChange={(e) => setStatusAtual(e.target.value)}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                        >
                                            <option value="ABERTO">ABERTO</option>
                                            <option value="EM_ATENDIMENTO">EM_ATENDIMENTO</option>
                                            <option value="AGUARDANDO_CLIENTE">AGUARDANDO_CLIENTE</option>
                                            <option value="RESOLVIDO">RESOLVIDO</option>
                                            <option value="ENCERRADO">ENCERRADO</option>
                                        </select>
                                        <select
                                            value={incidenteSelecionado}
                                            onChange={(e) => setIncidenteSelecionado(e.target.value)}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                        >
                                            <option value="">Sem incidente vinculado</option>
                                            {incidentesEmpresa.map((incidente) => (
                                                <option key={incidente.id} value={incidente.id}>
                                                    #{incidente.id} · {incidente.titulo}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => atualizarStatus(statusAtual)}
                                            disabled={processando}
                                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                                        >
                                            Salvar atendimento
                                        </button>
                                        <button
                                            onClick={finalizarAtendimento}
                                            disabled={processando || ticketAtivo.status === 'ENCERRADO'}
                                            className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
                                        >
                                            Finalizar atendimento
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isPlataforma && (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <span className="font-black text-slate-800">Incidente vinculado:</span>{' '}
                                        {incidenteVinculado ? `#${incidenteVinculado.id} · ${incidenteVinculado.titulo}` : (ticketAtivo.incidenteId ? `#${ticketAtivo.incidenteId}` : 'nenhum')}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <span className="font-black text-slate-800">Incidentes da empresa:</span>{' '}
                                        {incidentesEmpresa.length}
                                    </div>
                                </div>
                            )}

                            {isPlataforma && incidenteVinculado && (
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                                        <span className="font-black">Status:</span> {incidenteVinculado.status}
                                    </div>
                                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                                        <span className="font-black">Severidade:</span> {incidenteVinculado.severidade}
                                    </div>
                                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                                        <span className="font-black">Responsável:</span> {incidenteVinculado.responsavel || 'Não definido'}
                                    </div>
                                    {estadoSla && (
                                        <div className={`rounded-2xl border px-4 py-3 text-sm ${estadoSla.tone}`}>
                                            <div className="font-black">{estadoSla.label}</div>
                                            <div className="mt-1 text-xs font-semibold">{estadoSla.detalhe}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isPlataforma && (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Incidente operacional</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                Vincule um incidente existente ou abra um novo incidente sem sair do atendimento.
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setAbrirNovoIncidente((prev) => !prev)}
                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                        >
                                            {abrirNovoIncidente ? 'Fechar criação rápida' : 'Novo incidente'}
                                        </button>
                                    </div>

                                    {abrirNovoIncidente && (
                                        <div className="mt-4 grid gap-3">
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={novoIncidente.titulo}
                                                    onChange={(e) => setNovoIncidente((prev) => ({ ...prev, titulo: e.target.value }))}
                                                    placeholder="Título do incidente"
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                                <select
                                                    value={novoIncidente.tipo}
                                                    onChange={(e) => setNovoIncidente((prev) => ({ ...prev, tipo: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                >
                                                    <option value="OPERACIONAL">OPERACIONAL</option>
                                                    <option value="FINANCEIRO">FINANCEIRO</option>
                                                    <option value="COMERCIAL">COMERCIAL</option>
                                                    <option value="SEGURANCA">SEGURANCA</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-4">
                                                <select
                                                    value={novoIncidente.severidade}
                                                    onChange={(e) => setNovoIncidente((prev) => ({ ...prev, severidade: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                >
                                                    <option value="BAIXA">BAIXA</option>
                                                    <option value="MEDIA">MEDIA</option>
                                                    <option value="ALTA">ALTA</option>
                                                    <option value="CRITICA">CRITICA</option>
                                                </select>
                                                <input
                                                    type="date"
                                                    value={novoIncidente.prazoResposta}
                                                    onChange={(e) => setNovoIncidente((prev) => ({ ...prev, prazoResposta: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="date"
                                                    value={novoIncidente.prazoResolucao}
                                                    onChange={(e) => setNovoIncidente((prev) => ({ ...prev, prazoResolucao: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={criarIncidenteRapido}
                                                    disabled={processando}
                                                    className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:bg-slate-300"
                                                >
                                                    Criar e vincular
                                                </button>
                                            </div>
                                            <textarea
                                                value={novoIncidente.descricao}
                                                onChange={(e) => setNovoIncidente((prev) => ({ ...prev, descricao: e.target.value }))}
                                                placeholder="Descreva o incidente ou deixe em branco para usar o contexto do ticket."
                                                className="min-h-[96px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                                    {loadingMensagens && <div className="text-sm font-semibold text-slate-500">Carregando conversa...</div>}
                                    {!loadingMensagens && mensagens.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                                            Ainda não há mensagens neste atendimento.
                                        </div>
                                    )}
                                    {!loadingMensagens && mensagens.map((mensagem) => (
                                        <div
                                            key={mensagem.id}
                                            className={`rounded-2xl p-4 ${
                                                mensagem.autorTipo === 'PLATAFORMA'
                                                    ? 'border border-violet-200 bg-violet-50'
                                                    : 'border border-blue-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                                    mensagem.autorTipo === 'PLATAFORMA'
                                                        ? 'bg-violet-100 text-violet-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {descricaoAutorMensagem(mensagem.autorTipo)}
                                                </span>
                                                <span className="text-sm font-black text-slate-900">{mensagem.autorNome}</span>
                                                {(mensagem.autorLogin || mensagem.autorPerfil) && (
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {[
                                                            mensagem.autorLogin ? `@${mensagem.autorLogin}` : null,
                                                            mensagem.autorPerfil || null
                                                        ].filter(Boolean).join(' · ')}
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-400">
                                                    {mensagem.createdAt ? new Date(mensagem.createdAt).toLocaleString('pt-BR') : '-'}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{mensagem.mensagem}</div>
                                            {mensagem.arquivoUrl && (
                                                <a
                                                    href={mensagem.arquivoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                                >
                                                    {mensagem.arquivoNome || 'Abrir anexo'}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Timeline do atendimento</div>
                                    <button
                                        onClick={exportarTimelineTicket}
                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                    >
                                        Exportar timeline
                                    </button>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {timelineTicket.map((evento) => (
                                        <div key={evento.id} className="flex gap-3">
                                            <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                                            <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                        {evento.tipo}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900">
                                                        {evento.titulo}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {evento.data ? new Date(evento.data).toLocaleString('pt-BR') : '-'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-slate-600">
                                                    {evento.descricao}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {!isPlataforma && atendimentoFinalizado ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
                                        Este atendimento foi finalizado. Para continuar o suporte, abra um novo ticket.
                                    </div>
                                ) : (
                                    <>
                                        {isPlataforma && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Respostas rápidas</div>
                                                    <button
                                                        onClick={salvarTemplateAtual}
                                                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                                    >
                                                        Salvar como template
                                                    </button>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                {templatesRapidos.map((template, index) => (
                                                    <React.Fragment key={template.id || `${index}-${template.conteudo.slice(0, 16)}`}>
                                                        <button
                                                            onClick={() => aplicarTemplate(template.conteudo)}
                                                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                                                            title={template.conteudo}
                                                        >
                                                            {template.titulo || `Template ${index + 1}`}
                                                        </button>
                                                        {!template.isPadrao && (
                                                            <button
                                                                onClick={() => excluirTemplate(template.id)}
                                                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-400"
                                                            >
                                                                Remover
                                                            </button>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                        )}
                                        <textarea
                                            value={novaMensagem}
                                            onChange={(e) => setNovaMensagem(e.target.value)}
                                            placeholder={isPlataforma ? 'Responder ao cliente...' : 'Escreva sua mensagem para a plataforma...'}
                                            className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                                        />
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                            <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-500 hover:text-blue-700">
                                                Selecionar anexo
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                                                />
                                            </label>
                                            {arquivoSelecionado && (
                                                <div className="text-sm font-bold text-slate-600">
                                                    {arquivoSelecionado.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3 lg:flex-row">
                                            <button
                                                onClick={enviarMensagem}
                                                disabled={processando || !novaMensagem.trim()}
                                                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                                            >
                                                Enviar mensagem
                                            </button>
                                            <button
                                                onClick={enviarAnexo}
                                                disabled={processando || !arquivoSelecionado}
                                                className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:bg-slate-300"
                                            >
                                                Enviar anexo
                                            </button>
                                            {!isPlataforma && (
                                                <button
                                                    onClick={finalizarAtendimento}
                                                    disabled={processando || ticketAtivo.status === 'ENCERRADO'}
                                                    className="rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:border-emerald-500 hover:text-emerald-800 disabled:border-slate-200 disabled:text-slate-400"
                                                >
                                                    Finalizar atendimento
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </article>
            </section>
        </div>
    );
};
