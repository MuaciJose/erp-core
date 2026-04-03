import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Copy, Download, KeyRound, Mail, RefreshCcw, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { TooltipHint } from '../../components/TooltipHint';

const formatCurrencyBRL = (value) => {
    const numero = Number(value || 0);
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseCurrencyBRL = (value) => {
    if (typeof value === 'number') return value;
    const normalizado = String(value || '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, '');
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
};

const maskCurrencyInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    const cents = Number(digits || '0') / 100;
    return cents.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const maskCnpj = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const maskPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
};

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

const manualChecklistSections = {
    diario: [
        ['diario:redis-prod', 'Redis online e obrigatório em produção'],
        ['diario:cookie-https', 'Cookie seguro e HTTPS validados'],
        ['diario:solicitacoes', 'Solicitações pendentes revisadas'],
        ['diario:vencimentos', 'Empresas vencendo em breve revisadas'],
        ['diario:addons', 'Add-ons faturáveis conferidos'],
        ['diario:trials', 'Trials ativos e trials vencidos revisados'],
        ['diario:saude', 'Saúde da plataforma revisada no console mestre'],
        ['diario:auditoria', 'Auditoria de ações críticas conferida'],
        ['diario:incidentes', 'Incidentes abertos e SLA vencido revisados'],
        ['diario:seguranca', 'Eventos de segurança analisados'],
        ['diario:cobranca', 'Cobranças do dia emitidas ou conferidas'],
        ['diario:deploy', 'Checklist pós-deploy validado']
    ],
    semanal: [
        ['semanal:risco', 'Exportar empresas em risco e revisar divergências'],
        ['semanal:licencas', 'Exportar licenciamento das contas críticas'],
        ['semanal:incidentes', 'Exportar incidentes/SLA e revisar carteira crítica'],
        ['semanal:lotes', 'Executar ou revisar ações em lote pendentes'],
        ['semanal:mrr', 'Conferir MRR base vs extras e empresas com bloqueio comercial'],
        ['semanal:inadimplencia', 'Revisar régua de inadimplência e tolerâncias fora do padrão'],
        ['semanal:manual', 'Atualizar observações operacionais de módulos e bloqueios']
    ],
    mensal: [
        ['mensal:fechamento', 'Fechar a carteira do mês e revisar cobrança prevista'],
        ['mensal:conversao', 'Revisar trials que viraram add-on e trials que expiraram'],
        ['mensal:planos', 'Auditar planos, valores mensais e add-ons fora do padrão'],
        ['mensal:auditoria', 'Extrair auditoria consolidada de ações sensíveis'],
        ['mensal:incidentes', 'Revisar incidentes recorrentes, SLA e ações preventivas'],
        ['mensal:producao', 'Validar dependências críticas de produção e deploy guide']
    ]
};

export const LiberacaoAcessos = ({ modo = 'liberacao-acessos', contextoInicial = null }) => {
    const checklistStorageKey = 'grandport_saas_manual_checklist';
    const empresaRefs = useRef({});
    const ultimoScrollContexto = useRef('');
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [convites, setConvites] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [eventosSeguranca, setEventosSeguranca] = useState([]);
    const [resumoOperacao, setResumoOperacao] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processandoId, setProcessandoId] = useState(null);
    const [filtro, setFiltro] = useState('PENDENTE');
    const [filtroEmpresas, setFiltroEmpresas] = useState('TODAS');
    const [buscaEmpresa, setBuscaEmpresa] = useState('');
    const [empresasSelecionadas, setEmpresasSelecionadas] = useState({});
    const [datasVencimento, setDatasVencimento] = useState({});
    const [motivosBloqueio, setMotivosBloqueio] = useState({});
    const [planosEmpresa, setPlanosEmpresa] = useState({});
    const [valoresEmpresa, setValoresEmpresa] = useState({});
    const [toleranciasEmpresa, setToleranciasEmpresa] = useState({});
    const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
    const [catalogoModulos, setCatalogoModulos] = useState([]);
    const [planoForm, setPlanoForm] = useState({
        codigo: '',
        nomeExibicao: '',
        descricao: '',
        valorMensalBase: '0,00',
        ativo: true,
        modulos: []
    });
    const [motivosLiberacaoManual, setMotivosLiberacaoManual] = useState({});
    const [licencasPorEmpresa, setLicencasPorEmpresa] = useState({});
    const [licencasLoading, setLicencasLoading] = useState({});
    const [blocosEmpresaAbertos, setBlocosEmpresaAbertos] = useState({});
    const [cadastroComplementarPorEmpresa, setCadastroComplementarPorEmpresa] = useState({});
    const [cadastroComplementarLoading, setCadastroComplementarLoading] = useState({});
    const [observacoesModulo, setObservacoesModulo] = useState({});
    const [timelinePorEmpresa, setTimelinePorEmpresa] = useState({});
    const [timelineLoading, setTimelineLoading] = useState({});
    const [incidentesPorEmpresa, setIncidentesPorEmpresa] = useState({});
    const [incidentesLoading, setIncidentesLoading] = useState({});
    const [formIncidentePorEmpresa, setFormIncidentePorEmpresa] = useState({});
    const [avisoManutencao, setAvisoManutencao] = useState({
        ativo: false,
        severidade: 'MANUTENCAO',
        bloquearAcesso: false,
        titulo: 'Manutenção programada',
        mensagem: '',
        inicioPrevisto: '',
        fimPrevisto: ''
    });
    const [contextoVisual, setContextoVisual] = useState(contextoInicial);
    const [manualChecklist, setManualChecklist] = useState(() => {
        try {
            const raw = localStorage.getItem(checklistStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [abaAtiva, setAbaAtiva] = useState('solicitacoes');

    useEffect(() => {
        try {
            localStorage.setItem(checklistStorageKey, JSON.stringify(manualChecklist));
        } catch {
            // ignora falha de persistencia local
        }
    }, [manualChecklist]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resSolicitacoes, resConvites, resEmpresas, resEventos, resResumo, resPlanos, resCatalogo] = await Promise.all([
                api.get('/api/assinaturas/solicitacoes-acesso'),
                api.get('/api/assinaturas/convites'),
                api.get('/api/assinaturas/empresas'),
                api.get('/api/security-events', { params: { limit: 10 } }),
                api.get('/api/assinaturas/resumo-operacao'),
                api.get('/api/assinaturas/planos'),
                api.get('/api/assinaturas/catalogo-modulos')
            ]);
            setSolicitacoes(Array.isArray(resSolicitacoes.data) ? resSolicitacoes.data : []);
            setConvites(Array.isArray(resConvites.data) ? resConvites.data : []);
            const empresasRecebidas = Array.isArray(resEmpresas.data) ? resEmpresas.data : [];
            setEmpresas(empresasRecebidas);
            setEventosSeguranca(Array.isArray(resEventos.data) ? resEventos.data : []);
            setResumoOperacao(resResumo.data || null);
            const planosRecebidos = Array.isArray(resPlanos.data) ? resPlanos.data : [];
            setPlanosDisponiveis(planosRecebidos);
            setCatalogoModulos(Array.isArray(resCatalogo.data) ? resCatalogo.data : []);
            try {
                const resAviso = await api.get('/api/assinaturas/plataforma/aviso-manutencao');
                setAvisoManutencao({
                    ativo: !!resAviso.data?.ativo,
                    severidade: resAviso.data?.severidade || 'MANUTENCAO',
                    bloquearAcesso: !!resAviso.data?.bloquearAcesso,
                    titulo: resAviso.data?.titulo || 'Manutenção programada',
                    mensagem: resAviso.data?.mensagem || '',
                    inicioPrevisto: resAviso.data?.inicioPrevisto ? String(resAviso.data.inicioPrevisto).slice(0, 16) : '',
                    fimPrevisto: resAviso.data?.fimPrevisto ? String(resAviso.data.fimPrevisto).slice(0, 16) : ''
                });
            } catch {
                // mantém formulário local
            }
            setDatasVencimento(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.dataVencimento || ''])));
            setMotivosBloqueio(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.motivoBloqueio || ''])));
            setPlanosEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.plano || 'ESSENCIAL'])));
            setValoresEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, maskCurrencyInput(item.valorMensal ?? 0)])));
            setToleranciasEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.diasTolerancia ?? 0])));
            setMotivosLiberacaoManual(Object.fromEntries(empresasRecebidas.map(item => [item.id, ''])));
            if (planosRecebidos.length > 0) {
                setPlanoForm((prev) => prev.codigo ? prev : {
                    codigo: planosRecebidos[0].codigo || '',
                    nomeExibicao: planosRecebidos[0].nomeExibicao || '',
                    descricao: planosRecebidos[0].descricao || '',
                    valorMensalBase: maskCurrencyInput(planosRecebidos[0].valorMensalBase ?? 0),
                    ativo: planosRecebidos[0].ativo !== false,
                    modulos: Array.isArray(planosRecebidos[0].modulos) ? planosRecebidos[0].modulos : []
                });
            }
        } catch (error) {
            toast.error('Não foi possível carregar os dados da operação SaaS.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        setContextoVisual(contextoInicial || null);
        if (!contextoInicial) return;
        if (contextoInicial.abaAtiva) setAbaAtiva(contextoInicial.abaAtiva);
        if (contextoInicial.filtroEmpresas) setFiltroEmpresas(contextoInicial.filtroEmpresas);
        if (typeof contextoInicial.buscaEmpresa === 'string') setBuscaEmpresa(contextoInicial.buscaEmpresa);
    }, [contextoInicial]);

    const buscaContextoNormalizada = String(contextoVisual?.buscaEmpresa || '').trim().toLowerCase();

    useEffect(() => {
        if (abaAtiva !== 'empresas') return;
        if (!buscaContextoNormalizada) return;
        if (!Array.isArray(contextoVisual?.autoAbrir) || contextoVisual.autoAbrir.length === 0) return;

        const empresaAlvo = empresas.find((empresa) =>
            empresa.razaoSocial?.toLowerCase().includes(buscaContextoNormalizada)
        );
        if (!empresaAlvo) return;

        if (contextoVisual.autoAbrir.includes('licencas')) {
            carregarLicencasEmpresa(empresaAlvo.id);
        }
        if (contextoVisual.autoAbrir.includes('cadastro')) {
            carregarCadastroComplementarEmpresa(empresaAlvo.id);
        }
        if (contextoVisual.autoAbrir.includes('timeline')) {
            carregarTimelineEmpresa(empresaAlvo.id);
        }
        if (contextoVisual.autoAbrir.includes('incidentes')) {
            carregarIncidentesEmpresa(empresaAlvo.id);
        }
    }, [abaAtiva, buscaContextoNormalizada, contextoVisual, empresas]);

    const solicitacoesFiltradas = useMemo(() => {
        if (filtro === 'TODAS') return solicitacoes;
        return solicitacoes.filter(item => item.status === filtro);
    }, [filtro, solicitacoes]);

    const empresasFiltradas = useMemo(() => {
        const hoje = new Date().toISOString().slice(0, 10);
        const limiteDate = new Date();
        limiteDate.setDate(limiteDate.getDate() + 7);
        const limite = limiteDate.toISOString().slice(0, 10);
        const busca = buscaEmpresa.trim().toLowerCase();

        let base = empresas;

        if (filtroEmpresas === 'ATIVAS') base = empresas.filter(item => item.statusAssinatura === 'ATIVA');
        if (filtroEmpresas === 'INADIMPLENTES') base = empresas.filter(item => item.statusAssinatura === 'INADIMPLENTE');
        if (filtroEmpresas === 'BLOQUEADAS') base = empresas.filter(item => item.statusAssinatura === 'BLOQUEADA');
        if (filtroEmpresas === 'CANCELADAS') base = empresas.filter(item => item.statusAssinatura === 'CANCELADA');
        if (filtroEmpresas === 'VENCE_HOJE') base = empresas.filter(item => item.dataVencimento === hoje);
        if (filtroEmpresas === 'VENCE_7_DIAS') {
            base = empresas.filter(item => item.dataVencimento && item.dataVencimento >= hoje && item.dataVencimento <= limite);
        }

        if (!busca) return base;

        return base.filter((item) => {
            const texto = [
                item.razaoSocial,
                item.cnpj,
                item.adminPrincipal,
                item.telefone,
                item.plano
            ].filter(Boolean).join(' ').toLowerCase();
            return texto.includes(busca);
        });
    }, [buscaEmpresa, empresas, filtroEmpresas]);

    const empresasAcaoRapida = useMemo(() => {
        const hoje = new Date().toISOString().slice(0, 10);
        const limiteDate = new Date();
        limiteDate.setDate(limiteDate.getDate() + 7);
        const limite = limiteDate.toISOString().slice(0, 10);

        const prioridade = (empresa) => {
            if (empresa.statusAssinatura === 'BLOQUEADA') return 0;
            if (empresa.statusAssinatura === 'INADIMPLENTE') return 1;
            if ((empresa.totalModulosBloqueadosComercialmente || 0) > 0) return 2;
            if (empresa.dataVencimento === hoje) return 3;
            if (empresa.dataVencimento && empresa.dataVencimento >= hoje && empresa.dataVencimento <= limite) return 4;
            return 9;
        };

        return [...empresas]
            .filter((empresa) => prioridade(empresa) < 9)
            .sort((a, b) => prioridade(a) - prioridade(b))
            .slice(0, 6);
    }, [empresas]);

    const totalSelecionadasNoFiltro = useMemo(
        () => empresasFiltradas.filter((empresa) => empresasSelecionadas[empresa.id]).length,
        [empresasFiltradas, empresasSelecionadas]
    );

    useEffect(() => {
        if (abaAtiva !== 'empresas') return;
        if (!buscaContextoNormalizada) return;

        const empresaAlvo = empresasFiltradas.find((empresa) =>
            empresa.razaoSocial?.toLowerCase().includes(buscaContextoNormalizada)
        );
        if (!empresaAlvo) return;

        const chaveContexto = `${contextoVisual?.titulo || ''}:${empresaAlvo.id}`;
        if (ultimoScrollContexto.current === chaveContexto) return;

        const elemento = empresaRefs.current[empresaAlvo.id];
        if (!elemento) return;

        ultimoScrollContexto.current = chaveContexto;
        window.requestAnimationFrame(() => {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [abaAtiva, buscaContextoNormalizada, contextoVisual, empresasFiltradas]);

    const resumoEmpresas = useMemo(() => {
        const hoje = new Date().toISOString().slice(0, 10);
        const limiteDate = new Date();
        limiteDate.setDate(limiteDate.getDate() + 7);
        const limite = limiteDate.toISOString().slice(0, 10);

        return {
            total: empresas.length,
            ativas: empresas.filter(item => item.statusAssinatura === 'ATIVA').length,
            inadimplentes: empresas.filter(item => item.statusAssinatura === 'INADIMPLENTE').length,
            bloqueadas: empresas.filter(item => item.statusAssinatura === 'BLOQUEADA').length,
            canceladas: empresas.filter(item => item.statusAssinatura === 'CANCELADA').length,
            vencendo7Dias: empresas.filter(item => item.dataVencimento && item.dataVencimento >= hoje && item.dataVencimento <= limite).length
        };
    }, [empresas]);

    const catalogoModulosAgrupado = useMemo(() => {
        const grupos = {};
        catalogoModulos.forEach((modulo) => {
            const categoria = modulo.categoria || 'Outros';
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push(modulo);
        });
        return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
    }, [catalogoModulos]);

    const aprovarSolicitacao = async (solicitacao) => {
        setProcessandoId(solicitacao.id);
        const toastId = toast.loading(`Gerando convite para ${solicitacao.emailContato}...`);
        try {
            const res = await api.post(`/api/assinaturas/solicitacoes-acesso/${solicitacao.id}/aprovar`);
            toast.success('Solicitação aprovada e convite gerado.', { id: toastId });
            await carregarDados();
            if (res.data?.token) {
                await copiarConvite(res.data.token, solicitacao.emailContato, true);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível aprovar a solicitação.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const gerarConviteManual = async (emailDestino) => {
        const toastId = toast.loading(`Gerando novo convite para ${emailDestino}...`);
        try {
            const res = await api.post('/api/assinaturas/convites', { emailDestino });
            toast.success('Convite gerado com sucesso.', { id: toastId });
            await carregarDados();
            if (res.data?.token) {
                await copiarConvite(res.data.token, emailDestino, true);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Falha ao gerar convite.', { id: toastId });
        }
    };

    const montarLinkConvite = (token) => `${window.location.origin}/?inviteToken=${token}`;

    const copiarConvite = async (token, emailDestino, silencioso = false) => {
        const link = montarLinkConvite(token);
        const payload = `Olá! Seu acesso ao Grandport ERP foi liberado.\n\nUse este link para finalizar o cadastro da empresa e definir a senha do administrador:\n${link}\n\nE-mail autorizado: ${emailDestino}\nToken do convite: ${token}\n\nImportante:\n- o convite é pessoal para este e-mail\n- a senha do administrador será definida no cadastro final\n- se o link expirar, solicite um novo convite\n\nApós concluir, o acesso ao ERP poderá ser feito normalmente pela tela de login.`;
        try {
            await navigator.clipboard.writeText(payload);
            if (!silencioso) toast.success('Convite copiado para a área de transferência.');
        } catch (error) {
            if (!silencioso) toast.error('Não foi possível copiar o convite.');
        }
    };

    const copiarLinkConvite = async (token) => {
        try {
            await navigator.clipboard.writeText(montarLinkConvite(token));
            toast.success('Link do convite copiado.');
        } catch (error) {
            toast.error('Não foi possível copiar o link do convite.');
        }
    };

    const copiarTokenConvite = async (token) => {
        try {
            await navigator.clipboard.writeText(token);
            toast.success('Token do convite copiado.');
        } catch (error) {
            toast.error('Não foi possível copiar o token.');
        }
    };

    const badgeClasses = (status) => {
        if (status === 'APROVADA') return 'bg-emerald-100 text-emerald-700';
        if (status === 'PENDENTE') return 'bg-amber-100 text-amber-700';
        if (status === 'ATIVA') return 'bg-emerald-100 text-emerald-700';
        if (status === 'INADIMPLENTE') return 'bg-amber-100 text-amber-700';
        if (status === 'BLOQUEADA') return 'bg-red-100 text-red-700';
        if (status === 'CANCELADA') return 'bg-slate-200 text-slate-700';
        return 'bg-slate-100 text-slate-700';
    };

    const onboardingBadgeClasses = (status) => {
        if (status === 'COMPLETO') return 'bg-emerald-100 text-emerald-700';
        if (status === 'EM_PREENCHIMENTO') return 'bg-blue-100 text-blue-700';
        if (status === 'VENCIDO') return 'bg-red-100 text-red-700';
        if (status === 'PENDENTE_COMPLEMENTO') return 'bg-amber-100 text-amber-700';
        return 'bg-slate-100 text-slate-700';
    };

    const alternarChecklistManual = (id) => {
        setManualChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const limparChecklistManualSecao = (secao) => {
        setManualChecklist((prev) => {
            const proximo = { ...prev };
            Object.keys(proximo).forEach((chave) => {
                if (chave.startsWith(`${secao}:`)) delete proximo[chave];
            });
            return proximo;
        });
    };

    const bloquearEmpresa = async (empresa) => {
        setProcessandoId(`bloquear-${empresa.id}`);
        const toastId = toast.loading(`Bloqueando ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/bloquear`, {
                motivoBloqueio: motivosBloqueio[empresa.id]
            });
            toast.success('Empresa bloqueada com sucesso.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível bloquear a empresa.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const cancelarEmpresa = async (empresa) => {
        setProcessandoId(`cancelar-${empresa.id}`);
        const toastId = toast.loading(`Desligando ${empresa.razaoSocial} da plataforma...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/cancelar`, {
                motivoBloqueio: motivosBloqueio[empresa.id]
            });
            toast.success('Empresa desligada da plataforma.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível desligar a empresa da plataforma.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const registrarPagamento = async (empresa) => {
        setProcessandoId(`pagamento-${empresa.id}`);
        const toastId = toast.loading(`Registrando pagamento de ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/registrar-pagamento`, {
                novaDataVencimento: datasVencimento[empresa.id]
            });
            toast.success('Pagamento registrado e empresa liberada.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível registrar o pagamento.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const reativarEmpresa = async (empresa) => {
        setProcessandoId(`reativar-${empresa.id}`);
        const toastId = toast.loading(`Reativando ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/reativar`, {
                novaDataVencimento: datasVencimento[empresa.id]
            });
            toast.success('Empresa reativada com sucesso.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível reativar a empresa.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const salvarPlanoEmpresa = async (empresa) => {
        setProcessandoId(`plano-${empresa.id}`);
        const toastId = toast.loading(`Atualizando plano de ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/plano`, {
                plano: planosEmpresa[empresa.id],
                valorMensal: parseCurrencyBRL(valoresEmpresa[empresa.id]),
                diasTolerancia: Number(toleranciasEmpresa[empresa.id] || 0)
            });
            toast.success('Plano atualizado com sucesso.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível atualizar o plano.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const abrirPlanoNovo = () => {
        setPlanoForm({
            codigo: '',
            nomeExibicao: '',
            descricao: '',
            valorMensalBase: '0,00',
            ativo: true,
            modulos: []
        });
        setAbaAtiva('planos');
    };

    const carregarPlanoParaEdicao = (plano) => {
        setPlanoForm({
            codigo: plano.codigo || '',
            nomeExibicao: plano.nomeExibicao || '',
            descricao: plano.descricao || '',
            valorMensalBase: maskCurrencyInput(plano.valorMensalBase ?? 0),
            ativo: plano.ativo !== false,
            modulos: Array.isArray(plano.modulos) ? plano.modulos : []
        });
        setAbaAtiva('planos');
    };

    const alternarModuloPlanoForm = (modulo) => {
        setPlanoForm((prev) => {
            const jaTem = prev.modulos.includes(modulo);
            return {
                ...prev,
                modulos: jaTem
                    ? prev.modulos.filter((item) => item !== modulo)
                    : [...prev.modulos, modulo]
            };
        });
    };

    const salvarPlanoSaas = async () => {
        const toastId = toast.loading(planoForm.codigo ? `Salvando plano ${planoForm.codigo}...` : 'Criando plano...');
        try {
            const res = await api.post('/api/assinaturas/planos', {
                codigo: planoForm.codigo,
                nomeExibicao: planoForm.nomeExibicao,
                descricao: planoForm.descricao,
                valorMensalBase: parseCurrencyBRL(planoForm.valorMensalBase),
                ativo: !!planoForm.ativo,
                modulos: planoForm.modulos
            });
            const planoSalvo = res.data;
            setPlanosDisponiveis((prev) => {
                const restantes = prev.filter((item) => item.codigo !== planoSalvo.codigo);
                return [...restantes, planoSalvo].sort((a, b) => String(a.nomeExibicao || '').localeCompare(String(b.nomeExibicao || '')));
            });
            carregarPlanoParaEdicao(planoSalvo);
            toast.success('Plano SaaS salvo com sucesso.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível salvar o plano.', { id: toastId });
        }
    };

    const prorrogarCadastroComplementar = async (empresa, dias = 7) => {
        setProcessandoId(`onboarding-${empresa.id}`);
        const toastId = toast.loading(`Prorrogando ficha cadastral de ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/cadastro-complementar/prorrogar`, { dias });
            toast.success(`Prazo da ficha cadastral prorrogado em ${dias} dias.`, { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível prorrogar o prazo da ficha cadastral.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const atualizarLiberacaoManualCadastro = async (empresa, liberar) => {
        setProcessandoId(`liberacao-manual-${empresa.id}`);
        const toastId = toast.loading(liberar
            ? `Liberando acesso manual de ${empresa.razaoSocial}...`
            : `Removendo liberação manual de ${empresa.razaoSocial}...`);
        try {
            const payload = liberar
                ? { liberar: true, motivo: motivosLiberacaoManual[empresa.id] || '' }
                : { liberar: false, motivo: '' };
            const res = await api.post(`/api/assinaturas/empresas/${empresa.id}/cadastro-complementar/liberacao-manual`, payload);
            setCadastroComplementarPorEmpresa(prev => ({ ...prev, [empresa.id]: res.data || null }));
            toast.success(liberar ? 'Liberação manual ativada.' : 'Liberação manual removida.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível atualizar a liberação manual.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const criarCobrancaManual = async (empresa) => {
        setProcessandoId(`cobranca-${empresa.id}`);
        const toastId = toast.loading(`Criando cobrança de ${empresa.razaoSocial}...`);
        try {
            await api.post(`/api/assinaturas/empresas/${empresa.id}/cobrancas`, {
                referencia: `MENSALIDADE-${datasVencimento[empresa.id] || new Date().toISOString().slice(0, 10)}`,
                valor: parseCurrencyBRL(valoresEmpresa[empresa.id]) || empresa.valorMensal || 0,
                dataVencimento: datasVencimento[empresa.id],
                gatewayNome: 'MANUAL',
                descricao: `Cobrança manual do plano ${planosEmpresa[empresa.id] || empresa.plano || 'ESSENCIAL'}`
            });
            toast.success('Cobrança criada com sucesso.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível criar a cobrança.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const salvarAvisoManutencao = async () => {
        setProcessandoId('aviso-manutencao');
        const toastId = toast.loading(avisoManutencao.ativo ? 'Publicando aviso de manutenção...' : 'Atualizando aviso de manutenção...');
        try {
            const res = await api.post('/api/assinaturas/plataforma/aviso-manutencao', {
                ativo: !!avisoManutencao.ativo,
                severidade: avisoManutencao.severidade,
                bloquearAcesso: !!avisoManutencao.bloquearAcesso,
                titulo: avisoManutencao.titulo,
                mensagem: avisoManutencao.mensagem,
                inicioPrevisto: avisoManutencao.inicioPrevisto ? `${avisoManutencao.inicioPrevisto}:00` : null,
                fimPrevisto: avisoManutencao.fimPrevisto ? `${avisoManutencao.fimPrevisto}:00` : null
            });
            setAvisoManutencao({
                ativo: !!res.data?.ativo,
                severidade: res.data?.severidade || 'MANUTENCAO',
                bloquearAcesso: !!res.data?.bloquearAcesso,
                titulo: res.data?.titulo || 'Manutenção programada',
                mensagem: res.data?.mensagem || '',
                inicioPrevisto: res.data?.inicioPrevisto ? String(res.data.inicioPrevisto).slice(0, 16) : '',
                fimPrevisto: res.data?.fimPrevisto ? String(res.data.fimPrevisto).slice(0, 16) : ''
            });
            toast.success('Aviso de manutenção atualizado.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível atualizar o aviso de manutenção.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const abrirBlocoEmpresa = (empresaId, bloco) => {
        setBlocosEmpresaAbertos((prev) => ({
            ...prev,
            [empresaId]: {
                ...(prev[empresaId] || {}),
                [bloco]: true
            }
        }));

        window.requestAnimationFrame(() => {
            const elemento = document.getElementById(`empresa-${empresaId}-${bloco}`);
            elemento?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    };

    const alternarBlocoEmpresa = (empresaId, bloco) => {
        const estaAberto = !!blocosEmpresaAbertos[empresaId]?.[bloco];
        if (estaAberto) {
            setBlocosEmpresaAbertos((prev) => ({
                ...prev,
                [empresaId]: {
                    ...(prev[empresaId] || {}),
                    [bloco]: false
                }
            }));
            return;
        }
        abrirBlocoEmpresa(empresaId, bloco);
    };

    const carregarTimelineEmpresa = async (empresaId, force = false) => {
        if (!force && timelinePorEmpresa[empresaId]) return;
        setTimelineLoading(prev => ({ ...prev, [empresaId]: true }));
        try {
            const res = await api.get(`/api/assinaturas/empresas/${empresaId}/timeline`);
            setTimelinePorEmpresa(prev => ({ ...prev, [empresaId]: Array.isArray(res.data) ? res.data : [] }));
            abrirBlocoEmpresa(empresaId, 'timeline');
        } catch (error) {
            toast.error('Não foi possível carregar a timeline desta empresa.');
        } finally {
            setTimelineLoading(prev => ({ ...prev, [empresaId]: false }));
        }
    };

    const carregarLicencasEmpresa = async (empresaId, force = false) => {
        if (!force && licencasPorEmpresa[empresaId]) return;
        setLicencasLoading(prev => ({ ...prev, [empresaId]: true }));
        try {
            const res = await api.get(`/api/assinaturas/empresas/${empresaId}/modulos`);
            const licencas = Array.isArray(res.data) ? res.data : [];
            setLicencasPorEmpresa(prev => ({ ...prev, [empresaId]: licencas }));
            setObservacoesModulo(prev => ({
                ...prev,
                ...Object.fromEntries(licencas.map(item => [`${empresaId}:${item.modulo}`, item.observacao || '']))
            }));
            abrirBlocoEmpresa(empresaId, 'licencas');
        } catch (error) {
            toast.error('Não foi possível carregar o licenciamento desta empresa.');
        } finally {
            setLicencasLoading(prev => ({ ...prev, [empresaId]: false }));
        }
    };

    const carregarCadastroComplementarEmpresa = async (empresaId, force = false) => {
        if (!force && cadastroComplementarPorEmpresa[empresaId]) return;
        setCadastroComplementarLoading(prev => ({ ...prev, [empresaId]: true }));
        try {
            const res = await api.get(`/api/assinaturas/empresas/${empresaId}/cadastro-complementar`);
            setCadastroComplementarPorEmpresa(prev => ({ ...prev, [empresaId]: res.data || null }));
        } catch (error) {
            toast.error('Não foi possível carregar a ficha cadastral desta empresa.');
        } finally {
            setCadastroComplementarLoading(prev => ({ ...prev, [empresaId]: false }));
        }
    };

    const carregarIncidentesEmpresa = async (empresaId, force = false) => {
        if (!force && incidentesPorEmpresa[empresaId]) return;
        setIncidentesLoading(prev => ({ ...prev, [empresaId]: true }));
        try {
            const res = await api.get(`/api/assinaturas/empresas/${empresaId}/incidentes`);
            const incidentes = Array.isArray(res.data) ? res.data : [];
            setIncidentesPorEmpresa(prev => ({ ...prev, [empresaId]: incidentes }));
            setFormIncidentePorEmpresa(prev => ({
                ...prev,
                [empresaId]: prev[empresaId] || {
                    tipo: 'OPERACIONAL',
                    titulo: '',
                    severidade: 'MEDIA',
                    status: 'ABERTO',
                    responsavel: '',
                    prazoResposta: '',
                    prazoResolucao: '',
                    descricao: '',
                    resolucao: ''
                }
            }));
        } catch (error) {
            toast.error('Não foi possível carregar os incidentes desta empresa.');
        } finally {
            setIncidentesLoading(prev => ({ ...prev, [empresaId]: false }));
        }
    };

    const obterIncidentesEmpresaParaExportacao = async (empresaId) => {
        if (incidentesPorEmpresa[empresaId]) return incidentesPorEmpresa[empresaId];
        const res = await api.get(`/api/assinaturas/empresas/${empresaId}/incidentes`);
        const incidentes = Array.isArray(res.data) ? res.data : [];
        setIncidentesPorEmpresa(prev => ({ ...prev, [empresaId]: incidentes }));
        return incidentes;
    };

    const atualizarModuloEmpresa = async (empresa, modulo) => {
        const chave = `${empresa.id}:${modulo.modulo}`;
        setProcessandoId(`modulo-${empresa.id}-${modulo.modulo}`);
        const toastId = toast.loading(`Atualizando ${modulo.nomeExibicao} de ${empresa.razaoSocial}...`);
        try {
            const res = await api.post(`/api/assinaturas/empresas/${empresa.id}/modulos`, {
                modulo: modulo.modulo,
                ativo: modulo.ativo,
                observacao: observacoesModulo[chave] || null,
                valorMensalExtra: modulo.valorMensalExtra ?? 0,
                trialAte: modulo.trialAte || null,
                bloqueadoComercial: modulo.bloqueadoComercial ?? false,
                motivoBloqueioComercial: modulo.motivoBloqueioComercial || null
            });
            setLicencasPorEmpresa(prev => ({ ...prev, [empresa.id]: Array.isArray(res.data) ? res.data : [] }));
            toast.success('Licenciamento atualizado.', { id: toastId });
            await carregarDados();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível atualizar o módulo.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const salvarIncidenteEmpresa = async (empresa, incidenteExistente = null, patch = null) => {
        const payloadBase = incidenteExistente
            ? {
                tipo: incidenteExistente.tipo || 'OPERACIONAL',
                titulo: incidenteExistente.titulo || '',
                severidade: incidenteExistente.severidade || 'MEDIA',
                status: incidenteExistente.status || 'ABERTO',
                responsavel: incidenteExistente.responsavel || '',
                prazoResposta: incidenteExistente.prazoResposta || '',
                prazoResolucao: incidenteExistente.prazoResolucao || '',
                descricao: incidenteExistente.descricao || '',
                resolucao: incidenteExistente.resolucao || ''
            }
            : (formIncidentePorEmpresa[empresa.id] || {
                tipo: 'OPERACIONAL',
                titulo: '',
                severidade: 'MEDIA',
                status: 'ABERTO',
                responsavel: '',
                prazoResposta: '',
                prazoResolucao: '',
                descricao: '',
                resolucao: ''
            });
        const payload = { ...payloadBase, ...(patch || {}) };
        const acaoId = incidenteExistente ? `incidente-update-${incidenteExistente.id}` : `incidente-create-${empresa.id}`;
        setProcessandoId(acaoId);
        const toastId = toast.loading(`${incidenteExistente ? 'Atualizando' : 'Registrando'} incidente de ${empresa.razaoSocial}...`);
        try {
            if (incidenteExistente) {
                await api.post(`/api/assinaturas/empresas/${empresa.id}/incidentes/${incidenteExistente.id}`, payload);
            } else {
                await api.post(`/api/assinaturas/empresas/${empresa.id}/incidentes`, payload);
                setFormIncidentePorEmpresa(prev => ({
                    ...prev,
                    [empresa.id]: {
                        tipo: 'OPERACIONAL',
                        titulo: '',
                        severidade: 'MEDIA',
                        status: 'ABERTO',
                        responsavel: '',
                        prazoResposta: '',
                        prazoResolucao: '',
                        descricao: '',
                        resolucao: ''
                    }
                }));
            }
            await Promise.all([
                carregarIncidentesEmpresa(empresa.id, true),
                carregarTimelineEmpresa(empresa.id, true)
            ]);
            toast.success('Incidente salvo com sucesso.', { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Não foi possível salvar o incidente.', { id: toastId });
        } finally {
            setProcessandoId(null);
        }
    };

    const alternarSelecaoEmpresa = (empresaId) => {
        setEmpresasSelecionadas((prev) => ({
            ...prev,
            [empresaId]: !prev[empresaId]
        }));
    };

    const alternarSelecaoTodasFiltradas = () => {
        const selecionarTudo = totalSelecionadasNoFiltro !== empresasFiltradas.length;
        setEmpresasSelecionadas((prev) => {
            const proximo = { ...prev };
            empresasFiltradas.forEach((empresa) => {
                proximo[empresa.id] = selecionarTudo;
            });
            return proximo;
        });
    };

    const limparSelecaoEmpresas = () => {
        setEmpresasSelecionadas({});
    };

    const processarAcaoEmLote = async (tipo) => {
        const empresasLote = empresasFiltradas.filter((empresa) => empresasSelecionadas[empresa.id]);
        if (empresasLote.length === 0) {
            toast.error('Selecione ao menos uma empresa para executar a ação em lote.');
            return;
        }

        const rotulos = {
            cobranca: 'criação de cobrança',
            pagamento: 'registro de pagamento',
            bloqueio: 'bloqueio',
            reativacao: 'reativação'
        };

        const toastId = toast.loading(`Processando ${rotulos[tipo]} para ${empresasLote.length} empresa(s)...`);
        let sucesso = 0;
        let ignoradas = 0;

        for (const empresa of empresasLote) {
            try {
                if ((tipo === 'cobranca' || tipo === 'pagamento' || tipo === 'reativacao') && !datasVencimento[empresa.id]) {
                    ignoradas += 1;
                    continue;
                }

                if (tipo === 'cobranca') {
                    await api.post(`/api/assinaturas/empresas/${empresa.id}/cobrancas`, {
                        referencia: `MENSALIDADE-${datasVencimento[empresa.id] || new Date().toISOString().slice(0, 10)}`,
                        valor: parseCurrencyBRL(valoresEmpresa[empresa.id]) || empresa.valorMensal || 0,
                        dataVencimento: datasVencimento[empresa.id],
                        gatewayNome: 'MANUAL',
                        descricao: `Cobrança manual do plano ${planosEmpresa[empresa.id] || empresa.plano || 'ESSENCIAL'}`
                    });
                }

                if (tipo === 'pagamento') {
                    await api.post(`/api/assinaturas/empresas/${empresa.id}/registrar-pagamento`, {
                        novaDataVencimento: datasVencimento[empresa.id]
                    });
                }

                if (tipo === 'bloqueio') {
                    await api.post(`/api/assinaturas/empresas/${empresa.id}/bloquear`, {
                        motivoBloqueio: motivosBloqueio[empresa.id] || 'Bloqueio operacional em lote'
                    });
                }

                if (tipo === 'reativacao') {
                    await api.post(`/api/assinaturas/empresas/${empresa.id}/reativar`, {
                        novaDataVencimento: datasVencimento[empresa.id]
                    });
                }

                sucesso += 1;
            } catch (error) {
                ignoradas += 1;
            }
        }

        await carregarDados();
        limparSelecaoEmpresas();

        if (sucesso === 0) {
            toast.error('Nenhuma empresa foi processada no lote.', { id: toastId });
            return;
        }

        if (ignoradas > 0) {
            toast.success(`${sucesso} empresa(s) processada(s). ${ignoradas} item(ns) ficaram pendentes para revisão.`, { id: toastId });
            return;
        }

        toast.success(`${sucesso} empresa(s) processada(s) com sucesso.`, { id: toastId });
    };

    const exportarEmpresasFiltradas = () => {
        if (empresasFiltradas.length === 0) {
            toast.error('Não há empresas no filtro atual para exportar.');
            return;
        }

        const linhas = empresasFiltradas.map((empresa) => ([
            csvCell(empresa.razaoSocial),
            csvCell(maskCnpj(empresa.cnpj)),
            csvCell(empresa.adminPrincipal || ''),
            csvCell(maskPhone(empresa.telefone || '')),
            csvCell(empresa.statusAssinatura || ''),
            csvCell(empresa.plano || ''),
            csvCell(empresa.dataVencimento || ''),
            csvCell(empresa.onboardingStatus || ''),
            csvCell(empresa.onboardingPrazoConclusao || ''),
            csvCell(empresa.onboardingPercentualPreenchimento ?? 0),
            csvCell(Array.isArray(empresa.onboardingPendencias) ? empresa.onboardingPendencias.join(', ') : ''),
            csvCell(Number(empresa.valorMensal || 0).toFixed(2).replace('.', ',')),
            csvCell(Number(empresa.valorExtrasMensal || 0).toFixed(2).replace('.', ',')),
            csvCell(Number(empresa.valorTotalMensalPrevisto || empresa.valorMensal || 0).toFixed(2).replace('.', ',')),
            csvCell(empresa.totalModulosAtivos ?? 0),
            csvCell(empresa.totalModulosExtras ?? 0),
            csvCell(empresa.totalModulosBloqueadosComercialmente ?? 0),
            csvCell(Array.isArray(empresa.extrasCobrados) ? empresa.extrasCobrados.join(', ') : ''),
            csvCell(empresa.ultimaCobrancaStatus || ''),
            csvCell(empresa.ultimaCobrancaVencimento || ''),
            csvCell(empresa.motivoBloqueio || '')
        ]));

        baixarCsv(
            `operacao_saas_empresas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
            [
                'Razao Social',
                'CNPJ',
                'Admin',
                'Telefone',
                'Status',
                'Plano',
                'Vencimento',
                'Status Onboarding',
                'Prazo Onboarding',
                '% Ficha',
                'Pendencias Cadastrais',
                'Valor Plano',
                'Valor Extras',
                'Total Previsto',
                'Modulos Ativos',
                'Extras Ativos',
                'Bloqueios Comerciais',
                'Add-ons Faturaveis',
                'Ultima Cobranca',
                'Vencimento Cobranca',
                'Motivo Bloqueio'
            ],
            linhas
        );
        toast.success('CSV das empresas exportado.');
    };

    const exportarLicencasEmpresa = async (empresa) => {
        let licencas = licencasPorEmpresa[empresa.id];
        if (!licencas) {
            try {
                const res = await api.get(`/api/assinaturas/empresas/${empresa.id}/modulos`);
                licencas = Array.isArray(res.data) ? res.data : [];
                setLicencasPorEmpresa(prev => ({ ...prev, [empresa.id]: licencas }));
            } catch (error) {
                toast.error('Não foi possível carregar as licenças para exportação.');
                return;
            }
        }

        if (!licencas || licencas.length === 0) {
            toast.error('Esta empresa não possui licenciamento para exportar.');
            return;
        }

        const linhas = licencas.map((modulo) => ([
            csvCell(empresa.razaoSocial),
            csvCell(modulo.modulo),
            csvCell(modulo.nomeExibicao),
            csvCell(modulo.categoria),
            csvCell(modulo.ativo ? 'ATIVO' : 'BLOQUEADO'),
            csvCell(modulo.disponivelNoPlano ? 'SIM' : 'NAO'),
            csvCell(modulo.origem),
            csvCell(Number(modulo.valorBaseMensal || 0).toFixed(2).replace('.', ',')),
            csvCell(Number(modulo.valorMensalExtra || 0).toFixed(2).replace('.', ',')),
            csvCell(modulo.trialAtivo ? 'SIM' : 'NAO'),
            csvCell(modulo.trialAte || ''),
            csvCell(modulo.bloqueadoComercial ? 'SIM' : 'NAO'),
            csvCell(modulo.motivoBloqueioComercial || ''),
            csvCell(modulo.observacao || ''),
            csvCell(modulo.updatedAt || ''),
            csvCell(modulo.updatedBy || '')
        ]));

        baixarCsv(
            `licenciamento_${empresa.razaoSocial?.replace(/[^\w]+/g, '_').toLowerCase() || empresa.id}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
            [
                'Empresa',
                'Modulo',
                'Nome Exibicao',
                'Categoria',
                'Status',
                'No Plano Base',
                'Origem',
                'Valor Base',
                'Valor Extra',
                'Trial Ativo',
                'Trial Ate',
                'Bloqueado Comercial',
                'Motivo Bloqueio Comercial',
                'Observacao',
                'Atualizado Em',
                'Atualizado Por'
            ],
            linhas
        );
        toast.success(`CSV de licenciamento exportado para ${empresa.razaoSocial}.`);
    };

    const exportarIncidentesEmpresa = async (empresa) => {
        let incidentes;
        try {
            incidentes = await obterIncidentesEmpresaParaExportacao(empresa.id);
        } catch (error) {
            toast.error('Não foi possível carregar os incidentes para exportação.');
            return;
        }

        if (!incidentes || incidentes.length === 0) {
            toast.error('Esta empresa não possui incidentes para exportar.');
            return;
        }

        const linhas = incidentes.map((incidente) => ([
            csvCell(empresa.razaoSocial),
            csvCell(incidente.tipo),
            csvCell(incidente.titulo),
            csvCell(incidente.severidade),
            csvCell(incidente.status),
            csvCell(incidente.responsavel || ''),
            csvCell(incidente.prazoResposta || ''),
            csvCell(incidente.prazoResolucao || ''),
            csvCell(incidente.descricao || ''),
            csvCell(incidente.resolucao || ''),
            csvCell(incidente.updatedAt || incidente.createdAt || ''),
            csvCell(incidente.updatedBy || incidente.createdBy || '')
        ]));

        baixarCsv(
            `incidentes_${empresa.razaoSocial?.replace(/[^\w]+/g, '_').toLowerCase() || empresa.id}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
            [
                'Empresa',
                'Tipo',
                'Titulo',
                'Severidade',
                'Status',
                'Responsavel',
                'Prazo Resposta',
                'Prazo Resolucao',
                'Descricao',
                'Resolucao',
                'Ultima Atualizacao',
                'Atualizado Por'
            ],
            linhas
        );
        toast.success(`CSV de incidentes exportado para ${empresa.razaoSocial}.`);
    };

    const exportarIncidentesFiltroAtual = async () => {
        if (empresasFiltradas.length === 0) {
            toast.error('Não há empresas no filtro atual para exportar incidentes.');
            return;
        }

        const toastId = toast.loading('Gerando CSV de incidentes e SLA do filtro atual...');
        try {
            const lotes = await Promise.all(
                empresasFiltradas.map(async (empresa) => ({
                    empresa,
                    incidentes: await obterIncidentesEmpresaParaExportacao(empresa.id)
                }))
            );

            const linhas = lotes.flatMap(({ empresa, incidentes }) =>
                (incidentes || []).map((incidente) => ([
                    csvCell(empresa.razaoSocial),
                    csvCell(empresa.statusAssinatura || ''),
                    csvCell(incidente.tipo),
                    csvCell(incidente.titulo),
                    csvCell(incidente.severidade),
                    csvCell(incidente.status),
                    csvCell(incidente.responsavel || ''),
                    csvCell(incidente.prazoResposta || ''),
                    csvCell(incidente.prazoResolucao || ''),
                    csvCell(incidente.updatedAt || incidente.createdAt || ''),
                    csvCell(incidente.updatedBy || incidente.createdBy || '')
                ]))
            );

            if (linhas.length === 0) {
                toast.error('Nenhum incidente foi encontrado no filtro atual.', { id: toastId });
                return;
            }

            baixarCsv(
                `operacao_saas_incidentes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
                [
                    'Empresa',
                    'Status Empresa',
                    'Tipo',
                    'Titulo',
                    'Severidade',
                    'Status Incidente',
                    'Responsavel',
                    'Prazo Resposta',
                    'Prazo Resolucao',
                    'Ultima Atualizacao',
                    'Atualizado Por'
                ],
                linhas
            );
            toast.success('CSV de incidentes exportado.', { id: toastId });
        } catch (error) {
            toast.error('Não foi possível exportar os incidentes do filtro atual.', { id: toastId });
        }
    };

    const acaoPrimariaEmpresa = (empresa) => {
        if (empresa.statusAssinatura === 'BLOQUEADA') {
            return {
                label: 'Reativar empresa',
                onClick: () => reativarEmpresa(empresa),
                disabled: processandoId === `reativar-${empresa.id}`,
                className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            };
        }
        if (empresa.statusAssinatura === 'INADIMPLENTE') {
            return {
                label: 'Registrar pagamento',
                onClick: () => registrarPagamento(empresa),
                disabled: processandoId === `pagamento-${empresa.id}` || !datasVencimento[empresa.id],
                className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            };
        }
        return {
            label: 'Criar cobrança',
            onClick: () => criarCobrancaManual(empresa),
            disabled: processandoId === `cobranca-${empresa.id}` || !datasVencimento[empresa.id],
            className: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
        };
    };

    const abas = [
        { id: 'solicitacoes', label: 'Solicitações', count: solicitacoes.filter(item => item.status === 'PENDENTE').length },
        { id: 'empresas', label: 'Empresas', count: empresas.length },
        { id: 'planos', label: 'Planos', count: planosDisponiveis.length },
        { id: 'convites', label: 'Convites', count: convites.length },
        { id: 'seguranca', label: 'Segurança', count: eventosSeguranca.length },
        { id: 'manual', label: 'Manual', count: 'OPS' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">
                                {modo === 'central-saas' ? 'Plataforma SaaS' : 'Controle Comercial'}
                            </p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                                {modo === 'central-saas' ? 'Central SaaS' : 'Liberação de acessos'}
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm text-slate-600">
                                {modo === 'central-saas'
                                    ? 'Aqui você governa a plataforma: solicitações públicas, convites, empresas ativas, bloqueios por inadimplência e reativações.'
                                    : 'Aqui você recebe as solicitações públicas, aprova o contato e gera o convite seguro que libera a criação real da empresa.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={carregarDados}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <RefreshCcw size={16} />
                                Atualizar
                            </button>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                                <ShieldCheck size={16} />
                                {solicitacoes.filter(item => item.status === 'PENDENTE').length} pendentes
                            </div>
                        </div>
                    </div>
                </section>
                <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        {abas.map((aba) => (
                            <button
                                key={aba.id}
                                onClick={() => setAbaAtiva(aba.id)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                                    abaAtiva === aba.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {aba.label}
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${abaAtiva === aba.id ? 'bg-white/15 text-white' : 'bg-white text-slate-500'}`}>
                                    {aba.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Empresas</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{resumoEmpresas.total}</div>
                    </div>
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Ativas</div>
                        <div className="mt-2 text-3xl font-black text-emerald-900">{resumoEmpresas.ativas}</div>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Inadimplentes</div>
                        <div className="mt-2 text-3xl font-black text-amber-900">{resumoEmpresas.inadimplentes}</div>
                    </div>
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Bloqueadas</div>
                        <div className="mt-2 text-3xl font-black text-red-900">{resumoEmpresas.bloqueadas}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-300 bg-slate-100 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Canceladas</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{resumoEmpresas.canceladas}</div>
                    </div>
                    <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Vencendo 7 dias</div>
                        <div className="mt-2 text-3xl font-black text-blue-900">{resumoEmpresas.vencendo7Dias}</div>
                    </div>
                </section>

                {resumoOperacao && (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                MRR Base
                                <TooltipHint text="Receita recorrente mensal somando os planos base das empresas ativas na plataforma." />
                            </div>
                            <div className="mt-2 text-3xl font-black text-slate-900">{formatCurrencyBRL(resumoOperacao.mrrBase)}</div>
                        </div>
                        <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-violet-700">
                                MRR Extras
                                <TooltipHint text="Receita recorrente adicional gerada por módulos liberados fora do plano base da empresa." />
                            </div>
                            <div className="mt-2 text-3xl font-black text-violet-900">{formatCurrencyBRL(resumoOperacao.mrrExtras)}</div>
                        </div>
                        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Add-ons Ativos</div>
                            <div className="mt-2 text-3xl font-black text-blue-900">{resumoOperacao.modulosExtrasAtivos}</div>
                        </div>
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Trials Ativos</div>
                            <div className="mt-2 text-3xl font-black text-amber-900">{resumoOperacao.trialsAtivos}</div>
                        </div>
                    </section>
                )}

                {abaAtiva === 'empresas' && (
                    <section className={`rounded-3xl border p-6 shadow-sm ${avisoManutencao.ativo ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl">
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Aviso global da plataforma</div>
                                <h2 className="mt-2 text-lg font-black text-slate-900">Manutenção para clientes assinantes</h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Ative aqui um aviso operacional para aparecer no ERP das empresas durante manutenção programada ou incidente controlado.
                                </p>
                            </div>
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={!!avisoManutencao.ativo}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, ativo: e.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                />
                                Aviso ativo
                            </label>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                Severidade
                                <select
                                    value={avisoManutencao.severidade || 'MANUTENCAO'}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, severidade: e.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                                >
                                    <option value="INFORMATIVO">Informativo</option>
                                    <option value="MANUTENCAO">Manutenção</option>
                                    <option value="INCIDENTE">Incidente</option>
                                </select>
                            </label>
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={!!avisoManutencao.bloquearAcesso}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, bloquearAcesso: e.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                />
                                Bloquear acesso dos clientes durante a janela
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500 md:col-span-2">
                                Título do aviso
                                <input
                                    type="text"
                                    value={avisoManutencao.titulo}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, titulo: e.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                Início previsto
                                <input
                                    type="datetime-local"
                                    value={avisoManutencao.inicioPrevisto || ''}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, inicioPrevisto: e.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                Fim previsto
                                <input
                                    type="datetime-local"
                                    value={avisoManutencao.fimPrevisto || ''}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, fimPrevisto: e.target.value }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-amber-500"
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500 md:col-span-2">
                                Mensagem para os clientes
                                <textarea
                                    value={avisoManutencao.mensagem || ''}
                                    onChange={(e) => setAvisoManutencao((prev) => ({ ...prev, mensagem: e.target.value }))}
                                    className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-amber-500"
                                    placeholder="Ex: Hoje às 22:00 teremos manutenção programada no módulo operacional. O sistema pode apresentar instabilidade temporária."
                                />
                            </label>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={salvarAvisoManutencao}
                                disabled={processandoId === 'aviso-manutencao'}
                                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {processandoId === 'aviso-manutencao' ? 'SALVANDO...' : 'Salvar aviso de manutenção'}
                            </button>
                            {avisoManutencao.ativo && (
                                <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-900">
                                    O aviso está ativo e aparecerá para as empresas assinantes no ERP.
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {abaAtiva === 'solicitacoes' && (
                    <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Solicitações recebidas</h2>
                                    <p className="text-sm text-slate-500">Aprove e gere o convite em um clique.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['PENDENTE', 'APROVADA', 'TODAS'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setFiltro(status)}
                                            className={`rounded-full px-4 py-2 text-xs font-black tracking-wide transition ${
                                                filtro === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">Carregando solicitações...</div>}
                                {!loading && solicitacoesFiltradas.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
                                        Nenhuma solicitação encontrada neste filtro.
                                    </div>
                                )}

                                {!loading && solicitacoesFiltradas.map(solicitacao => (
                                    <article key={solicitacao.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-lg font-black text-slate-900">{solicitacao.razaoSocial}</h3>
                                                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badgeClasses(solicitacao.status)}`}>
                                                        {solicitacao.status}
                                                    </span>
                                                </div>
                                                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                                    <div className="flex items-center gap-2"><UserRound size={16} className="text-slate-400" /> {solicitacao.nomeContato}</div>
                                                    <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {solicitacao.emailContato}</div>
                                                    <div><span className="font-bold text-slate-700">CNPJ:</span> {solicitacao.cnpj}</div>
                                                    <div><span className="font-bold text-slate-700">Telefone:</span> {solicitacao.telefone}</div>
                                                    <div className="md:col-span-2"><span className="font-bold text-slate-700">Enviado em:</span> {solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString('pt-BR') : '-'}</div>
                                                </div>
                                                {solicitacao.observacoes && (
                                                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 border border-slate-200">
                                                        <span className="font-bold text-slate-800">Observações:</span> {solicitacao.observacoes}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex w-full flex-col gap-3 xl:w-72">
                                                <button
                                                    onClick={() => aprovarSolicitacao(solicitacao)}
                                                    disabled={processandoId === solicitacao.id || solicitacao.status === 'APROVADA'}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    {processandoId === solicitacao.id ? 'APROVANDO...' : 'Aprovar e gerar convite'}
                                                </button>
                                                <button
                                                    onClick={() => gerarConviteManual(solicitacao.emailContato)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                >
                                                    <KeyRound size={16} />
                                                    Gerar novo convite
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Resumo operacional</h2>
                                <p className="text-sm text-slate-500">Painel rápido da fila comercial da plataforma.</p>
                            </div>
                            <div className="mt-6 grid gap-3">
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Pendentes</div>
                                    <div className="mt-2 text-3xl font-black text-slate-900">{solicitacoes.filter(item => item.status === 'PENDENTE').length}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aprovadas</div>
                                    <div className="mt-2 text-3xl font-black text-slate-900">{solicitacoes.filter(item => item.status === 'APROVADA').length}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Convites ativos</div>
                                    <div className="mt-2 text-3xl font-black text-slate-900">{convites.filter(item => item.status === 'ATIVO').length}</div>
                                </div>
                            </div>
                        </aside>
                    </section>
                )}

                {abaAtiva === 'planos' && (
                    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Planos SaaS</h2>
                                    <p className="text-sm text-slate-500">Cadastre e edite os módulos de cada plano sem depender de código fixo.</p>
                                </div>
                                <button
                                    onClick={abrirPlanoNovo}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Novo plano
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {planosDisponiveis.map((plano) => (
                                    <article key={plano.codigo} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-black text-slate-900">{plano.nomeExibicao}</h3>
                                                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                                                        {plano.codigo}
                                                    </span>
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${plano.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {plano.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-600">{plano.descricao || 'Sem descrição operacional.'}</p>
                                            </div>
                                            <div className="flex flex-col items-start gap-2 md:items-end">
                                                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Base mensal</div>
                                                <div className="text-2xl font-black text-slate-900">{formatCurrencyBRL(plano.valorMensalBase)}</div>
                                                <button
                                                    onClick={() => carregarPlanoParaEdicao(plano)}
                                                    className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    Editar plano
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {Array.isArray(plano.modulos) && plano.modulos.length > 0 ? plano.modulos.map((modulo) => (
                                                <span key={`${plano.codigo}-${modulo}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                                                    {modulo}
                                                </span>
                                            )) : (
                                                <span className="text-sm text-slate-500">Nenhum módulo vinculado.</span>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Editor de plano</p>
                                <h2 className="mt-2 text-lg font-black text-slate-900">{planoForm.codigo ? `Plano ${planoForm.codigo}` : 'Novo plano'}</h2>
                                <p className="mt-2 text-sm text-slate-500">Defina nome, valor base e exatamente quais módulos entram no plano.</p>
                            </div>

                            <div className="mt-6 grid gap-4">
                                <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                    Código
                                    <input
                                        type="text"
                                        value={planoForm.codigo}
                                        onChange={(e) => setPlanoForm((prev) => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                                        placeholder="Ex: PROFISSIONAL_PLUS"
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                    Nome de exibição
                                    <input
                                        type="text"
                                        value={planoForm.nomeExibicao}
                                        onChange={(e) => setPlanoForm((prev) => ({ ...prev, nomeExibicao: e.target.value }))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                    Descrição
                                    <textarea
                                        rows={3}
                                        value={planoForm.descricao}
                                        onChange={(e) => setPlanoForm((prev) => ({ ...prev, descricao: e.target.value }))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </label>
                                <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                    Valor mensal base
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={planoForm.valorMensalBase}
                                        onChange={(e) => setPlanoForm((prev) => ({ ...prev, valorMensalBase: maskCurrencyInput(e.target.value) }))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </label>
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={!!planoForm.ativo}
                                        onChange={(e) => setPlanoForm((prev) => ({ ...prev, ativo: e.target.checked }))}
                                    />
                                    Plano ativo para novas atribuições
                                </label>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700">Módulos do plano</h3>
                                    <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                        {planoForm.modulos.length} selecionado(s)
                                    </span>
                                </div>
                                <div className="mt-4 max-h-[26rem] space-y-4 overflow-y-auto pr-1">
                                    {catalogoModulosAgrupado.map(([categoria, modulos]) => (
                                        <div key={categoria} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{categoria}</div>
                                            <div className="mt-3 grid gap-2">
                                                {modulos.map((modulo) => {
                                                    const marcado = planoForm.modulos.includes(modulo.modulo);
                                                    return (
                                                        <button
                                                            key={modulo.modulo}
                                                            type="button"
                                                            onClick={() => alternarModuloPlanoForm(modulo.modulo)}
                                                            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                                                marcado
                                                                    ? 'border-blue-300 bg-blue-50'
                                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <div>
                                                                <div className="text-sm font-black text-slate-800">{modulo.nomeExibicao}</div>
                                                                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{modulo.modulo}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs font-black text-slate-500">Base</div>
                                                                <div className="text-sm font-black text-slate-800">{formatCurrencyBRL(modulo.valorBaseMensal)}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={abrirPlanoNovo}
                                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Limpar editor
                                </button>
                                <button
                                    onClick={salvarPlanoSaas}
                                    className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                                >
                                    Salvar plano
                                </button>
                            </div>
                        </aside>
                    </section>
                )}

                {abaAtiva === 'convites' && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Convites recentes</h2>
                            <p className="text-sm text-slate-500">O sistema não envia WhatsApp nem e-mail sozinho aqui. Use os botões abaixo para copiar e mandar ao cliente.</p>
                        </div>

                        <div className="mt-6 grid gap-4 xl:grid-cols-2">
                            {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Carregando convites...</div>}
                            {!loading && convites.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                    Nenhum convite gerado ainda.
                                </div>
                            )}
                            {!loading && convites.map(convite => (
                                <div key={convite.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900">{convite.emailDestino}</p>
                                            <p className="mt-1 text-xs text-slate-500">Expira em {new Date(convite.expiresAt).toLocaleString('pt-BR')}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClasses(convite.status === 'ATIVO' ? 'PENDENTE' : convite.status)}`}>
                                            {convite.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700 border border-slate-200 break-all">
                                        {convite.token}
                                    </div>
                                    <div className="mt-3 grid gap-2">
                                        <button onClick={() => copiarConvite(convite.token, convite.emailDestino)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100">
                                            <Copy size={14} />
                                            Copiar mensagem pronta
                                        </button>
                                        <button onClick={() => copiarLinkConvite(convite.token)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100">
                                            <Mail size={14} />
                                            Copiar link do convite
                                        </button>
                                        <button onClick={() => copiarTokenConvite(convite.token)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100">
                                            <KeyRound size={14} />
                                            Copiar só o token
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {abaAtiva === 'empresas' && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Empresas da plataforma</h2>
                            <p className="text-sm text-slate-500">
                                Controle vencimento, bloqueio por inadimplência e liberação após pagamento.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                ['TODAS', 'Todas'],
                                ['ATIVAS', 'Ativas'],
                                ['INADIMPLENTES', 'Inadimplentes'],
                                ['BLOQUEADAS', 'Bloqueadas'],
                                ['CANCELADAS', 'Canceladas'],
                                ['VENCE_HOJE', 'Vence hoje'],
                                ['VENCE_7_DIAS', 'Vence 7 dias']
                            ].map(([valor, label]) => (
                                <button
                                    key={valor}
                                    onClick={() => setFiltroEmpresas(valor)}
                                    className={`rounded-full px-4 py-2 text-xs font-black tracking-wide transition ${
                                        filtroEmpresas === valor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                            <button
                                onClick={exportarEmpresasFiltradas}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black tracking-wide text-white transition hover:bg-slate-800"
                            >
                                <Download size={14} />
                                Exportar filtro
                            </button>
                            <button
                                onClick={exportarIncidentesFiltroAtual}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black tracking-wide text-slate-700 transition hover:bg-slate-50"
                            >
                                <Download size={14} />
                                Exportar incidentes
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Centro de ações rápidas</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-600">
                                        Empresas priorizadas por risco, vencimento ou bloqueio comercial.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFiltroEmpresas('INADIMPLENTES')}
                                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100"
                                >
                                    Ver só risco financeiro
                                </button>
                            </div>
                            <div className="mt-4 grid gap-3">
                                {empresasAcaoRapida.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
                                        Nenhuma empresa crítica no momento.
                                    </div>
                                )}
                                {empresasAcaoRapida.map((empresa) => {
                                    const acaoPrimaria = acaoPrimariaEmpresa(empresa);
                                    return (
                                        <div key={`quick-${empresa.id}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClasses(empresa.statusAssinatura)}`}>
                                                            {empresa.statusAssinatura}
                                                        </span>
                                                        {(empresa.totalModulosBloqueadosComercialmente || 0) > 0 && (
                                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800">
                                                                {empresa.totalModulosBloqueadosComercialmente} bloqueios comerciais
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-sm text-slate-600">
                                                        Vencimento: {empresa.dataVencimento ? new Date(`${empresa.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR') : '-'} · Total previsto: {formatCurrencyBRL(empresa.valorTotalMensalPrevisto || empresa.valorMensal || 0)}
                                                    </div>
                                                </div>
                                                <div className="grid gap-2 md:grid-cols-3">
                                                    <button
                                                        onClick={acaoPrimaria.onClick}
                                                        disabled={acaoPrimaria.disabled}
                                                        className={`rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${acaoPrimaria.className}`}
                                                    >
                                                        {acaoPrimaria.label}
                                                    </button>
                                                    <button
                                                        onClick={() => carregarLicencasEmpresa(empresa.id, true)}
                                                        disabled={licencasLoading[empresa.id]}
                                                        className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        Licenciamento
                                                    </button>
                                                    <button
                                                        onClick={() => carregarTimelineEmpresa(empresa.id, true)}
                                                        disabled={timelineLoading[empresa.id]}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        Timeline
                                                    </button>
                                                    <button
                                                        onClick={() => carregarIncidentesEmpresa(empresa.id, true)}
                                                        disabled={incidentesLoading[empresa.id]}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        {incidentesLoading[empresa.id] ? 'CARREGANDO...' : 'Incidentes'}
                                                    </button>
                                                    <button
                                                        onClick={() => exportarLicencasEmpresa(empresa)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                                    >
                                                        Exportar licenças
                                                    </button>
                                                    <button
                                                        onClick={() => exportarIncidentesEmpresa(empresa)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Exportar incidentes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Busca operacional</div>
                            <div className="mt-1 text-sm font-semibold text-slate-600">
                                Localize empresa por razão social, CNPJ, telefone, admin ou plano.
                            </div>
                            <input
                                type="text"
                                value={buscaEmpresa}
                                onChange={(e) => setBuscaEmpresa(e.target.value)}
                                placeholder="Buscar empresa..."
                                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                            />
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Resultado do filtro</div>
                                    <div className="mt-2 text-3xl font-black text-slate-900">{empresasFiltradas.length}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Com bloqueio comercial</div>
                                    <div className="mt-2 text-3xl font-black text-slate-900">
                                        {empresasFiltradas.filter((item) => (item.totalModulosBloqueadosComercialmente || 0) > 0).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {contextoVisual?.titulo && (
                        <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Contexto executivo</div>
                                    <div className="mt-1 text-lg font-black text-slate-900">{contextoVisual.titulo}</div>
                                    <div className="mt-1 text-sm font-medium text-slate-600">
                                        {contextoVisual.descricao || 'Esta visão foi aberta a partir do painel mestre da plataforma.'}
                                    </div>
                                    {Array.isArray(contextoVisual.autoAbrir) && contextoVisual.autoAbrir.length > 0 && (
                                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                                            Abertura automática: {contextoVisual.autoAbrir.join(' + ')}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setContextoVisual(null)}
                                    className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                                >
                                    Fechar contexto
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Ações em lote</div>
                                <div className="mt-1 text-sm font-semibold text-slate-600">
                                    Selecionadas no filtro atual: {totalSelecionadasNoFiltro} de {empresasFiltradas.length}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={alternarSelecaoTodasFiltradas}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                >
                                    {totalSelecionadasNoFiltro === empresasFiltradas.length && empresasFiltradas.length > 0 ? 'Desmarcar filtro' : 'Selecionar filtro'}
                                </button>
                                <button
                                    onClick={limparSelecaoEmpresas}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                >
                                    Limpar seleção
                                </button>
                                <button
                                    onClick={() => processarAcaoEmLote('cobranca')}
                                    className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                                >
                                    Cobrança em lote
                                </button>
                                <button
                                    onClick={() => processarAcaoEmLote('pagamento')}
                                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    Pagamento em lote
                                </button>
                                <button
                                    onClick={() => processarAcaoEmLote('reativacao')}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                >
                                    Reativar em lote
                                </button>
                                <button
                                    onClick={() => processarAcaoEmLote('bloqueio')}
                                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                                >
                                    Bloquear em lote
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">Carregando empresas...</div>}
                        {!loading && empresasFiltradas.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
                                Nenhuma empresa encontrada neste filtro.
                            </div>
                        )}

                        {!loading && empresasFiltradas.map(empresa => {
                            const empresaEmFoco = buscaContextoNormalizada
                                && empresa.razaoSocial?.toLowerCase().includes(buscaContextoNormalizada);
                            const destaqueCobranca = empresaEmFoco && Array.isArray(contextoVisual?.autoAbrir) && contextoVisual.autoAbrir.includes('cobranca');
                            const fichaCadastral = cadastroComplementarPorEmpresa[empresa.id];
                            return (
                            <article
                                key={empresa.id}
                                ref={(elemento) => {
                                    if (elemento) {
                                        empresaRefs.current[empresa.id] = elemento;
                                    } else {
                                        delete empresaRefs.current[empresa.id];
                                    }
                                }}
                                className={`rounded-3xl border p-5 ${
                                    empresaEmFoco
                                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                                        : 'border-slate-200 bg-slate-50'
                                }`}
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={!!empresasSelecionadas[empresa.id]}
                                                    onChange={() => alternarSelecaoEmpresa(empresa.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                                                />
                                                Selecionar
                                            </label>
                                            <h3 className="text-lg font-black text-slate-900">{empresa.razaoSocial}</h3>
                                            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badgeClasses(empresa.statusAssinatura)}`}>
                                                {empresa.statusAssinatura}
                                            </span>
                                            {empresa.empresaInterna && (
                                                <>
                                                    <span className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                        Empresa interna
                                                    </span>
                                                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                        Licenciamento total
                                                    </span>
                                                </>
                                            )}
                                            {empresaEmFoco && (
                                                <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                    Em foco
                                                </span>
                                            )}
                                        </div>
                                            <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                            <div><span className="font-bold text-slate-700">Entrada na plataforma:</span> {empresa.dataCadastro ? new Date(empresa.dataCadastro).toLocaleDateString('pt-BR') : '-'}</div>
                                            <div><span className="font-bold text-slate-700">Desligamento:</span> {empresa.dataDesligamento ? new Date(empresa.dataDesligamento).toLocaleDateString('pt-BR') : '-'}</div>
                                            <div><span className="font-bold text-slate-700">Admin:</span> {empresa.adminPrincipal || '-'}</div>
                                            <div><span className="font-bold text-slate-700">Contato:</span> {maskPhone(empresa.telefone) || '-'}</div>
                                            <div><span className="font-bold text-slate-700">CNPJ:</span> {maskCnpj(empresa.cnpj)}</div>
                                            <div><span className="font-bold text-slate-700">Vencimento:</span> {empresa.dataVencimento ? new Date(`${empresa.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</div>
                                            <div><span className="font-bold text-slate-700">Plano:</span> {empresa.empresaInterna ? 'INTERNO' : (empresa.plano || 'ESSENCIAL')}</div>
                                            <div><span className="font-bold text-slate-700">Plano base:</span> {formatCurrencyBRL(empresa.valorMensal || 0)}</div>
                                            <div><span className="font-bold text-slate-700">Módulos ativos:</span> {empresa.totalModulosAtivos ?? '-'}</div>
                                            <div><span className="font-bold text-slate-700">Extras liberados:</span> {empresa.totalModulosExtras ?? 0}</div>
                                            <div><span className="font-bold text-slate-700">Bloqueios manuais:</span> {empresa.totalModulosBloqueados ?? 0}</div>
                                            <div><span className="font-bold text-slate-700">Extras cobrados:</span> {formatCurrencyBRL(empresa.valorExtrasMensal || 0)}</div>
                                            <div><span className="font-bold text-slate-700">Total previsto:</span> {formatCurrencyBRL(empresa.valorTotalMensalPrevisto || empresa.valorMensal || 0)}</div>
                                            <div><span className="font-bold text-slate-700">Última cobrança:</span> {empresa.ultimaCobrancaStatus || '-'}</div>
                                            <div><span className="font-bold text-slate-700">Venc. cobrança:</span> {empresa.ultimaCobrancaVencimento ? new Date(`${empresa.ultimaCobrancaVencimento}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</div>
                                        </div>
                                        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Onboarding cadastral</div>
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${onboardingBadgeClasses(empresa.onboardingStatus)}`}>
                                                    {empresa.onboardingStatus || 'PENDENTE_COMPLEMENTO'}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                                <div><span className="font-bold">Prazo:</span> {empresa.onboardingPrazoConclusao ? new Date(`${empresa.onboardingPrazoConclusao}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</div>
                                                <div><span className="font-bold">Progresso:</span> {empresa.onboardingPercentualPreenchimento ?? 0}%</div>
                                                <div><span className="font-bold">Dias restantes:</span> {empresa.onboardingDiasRestantes ?? '-'}</div>
                                                <div><span className="font-bold">Pendências:</span> {Array.isArray(empresa.onboardingPendencias) ? empresa.onboardingPendencias.length : 0}</div>
                                            </div>
                                            {empresa.onboardingLiberacaoManualAtiva && (
                                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                                                    <span className="font-black">Liberação manual ativa:</span> acesso sensível liberado pela plataforma
                                                    {empresa.onboardingLiberacaoManualPor ? ` por ${empresa.onboardingLiberacaoManualPor}` : ''}.
                                                </div>
                                            )}
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                                                <div
                                                    className="h-full rounded-full bg-sky-600 transition-all"
                                                    style={{ width: `${Math.max(0, Math.min(100, empresa.onboardingPercentualPreenchimento ?? 0))}%` }}
                                                />
                                            </div>
                                            {Array.isArray(empresa.onboardingPendencias) && empresa.onboardingPendencias.length > 0 && (
                                                <div className="mt-3 text-sm text-sky-950">
                                                    <span className="font-black">Pendências críticas:</span> {empresa.onboardingPendencias.join(', ')}
                                                </div>
                                            )}
                                            {fichaCadastral && (
                                                <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Ficha completa</div>
                                                        {fichaCadastral.concluidoEm && (
                                                            <div className="text-xs font-bold text-emerald-700">
                                                                Concluída em {new Date(fichaCadastral.concluidoEm).toLocaleString('pt-BR')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                                                        <div><span className="font-bold">Nome fantasia:</span> {fichaCadastral.nomeFantasia || '-'}</div>
                                                        <div><span className="font-bold">Regime tributário:</span> {fichaCadastral.regimeTributario || '-'}</div>
                                                        <div><span className="font-bold">Inscrição estadual:</span> {fichaCadastral.inscricaoEstadual || '-'}</div>
                                                        <div><span className="font-bold">Inscrição municipal:</span> {fichaCadastral.inscricaoMunicipal || '-'}</div>
                                                        <div><span className="font-bold">Website:</span> {fichaCadastral.website || '-'}</div>
                                                        <div><span className="font-bold">LGPD:</span> {fichaCadastral.aceiteLgpd ? 'Aceito' : 'Pendente'}</div>
                                                    </div>
                                                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Endereço</div>
                                                        <div className="mt-2">
                                                            {[fichaCadastral.logradouro, fichaCadastral.numero, fichaCadastral.complemento].filter(Boolean).join(', ') || '-'}
                                                        </div>
                                                        <div>
                                                            {[fichaCadastral.bairro, fichaCadastral.cidade, fichaCadastral.uf].filter(Boolean).join(' - ') || '-'}
                                                        </div>
                                                        <div><span className="font-bold">CEP:</span> {fichaCadastral.cep || '-'}</div>
                                                    </div>
                                                    <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Responsável financeiro</div>
                                                            <div className="mt-2">{fichaCadastral.responsavelFinanceiroNome || '-'}</div>
                                                            <div>{fichaCadastral.responsavelFinanceiroEmail || '-'}</div>
                                                            <div>{maskPhone(fichaCadastral.responsavelFinanceiroTelefone) || '-'}</div>
                                                        </div>
                                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Responsável operacional</div>
                                                            <div className="mt-2">{fichaCadastral.responsavelOperacionalNome || '-'}</div>
                                                            <div>{fichaCadastral.responsavelOperacionalEmail || '-'}</div>
                                                            <div>{maskPhone(fichaCadastral.responsavelOperacionalTelefone) || '-'}</div>
                                                        </div>
                                                    </div>
                                                    {fichaCadastral.observacoes && (
                                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Observações</div>
                                                            <div className="mt-2 whitespace-pre-wrap">{fichaCadastral.observacoes}</div>
                                                        </div>
                                                    )}
                                                    {(fichaCadastral.liberacaoManualAtiva || fichaCadastral.liberacaoManualMotivo || fichaCadastral.liberacaoManualPor) && (
                                                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                                                            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Liberação manual</div>
                                                            <div className="mt-2"><span className="font-bold">Status:</span> {fichaCadastral.liberacaoManualAtiva ? 'Ativa' : 'Inativa'}</div>
                                                            <div><span className="font-bold">Por:</span> {fichaCadastral.liberacaoManualPor || '-'}</div>
                                                            <div><span className="font-bold">Em:</span> {fichaCadastral.liberacaoManualEm ? new Date(fichaCadastral.liberacaoManualEm).toLocaleString('pt-BR') : '-'}</div>
                                                            <div><span className="font-bold">Motivo:</span> {fichaCadastral.liberacaoManualMotivo || '-'}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {Array.isArray(empresa.extrasCobrados) && empresa.extrasCobrados.length > 0 && (
                                            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
                                                <span className="font-black">Add-ons faturáveis:</span> {empresa.extrasCobrados.join(', ')}
                                            </div>
                                        )}
                                        {empresa.motivoBloqueio && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                                <span className="font-black">Motivo atual:</span> {empresa.motivoBloqueio}
                                            </div>
                                        )}
                                        {empresa.ultimoLinkCobranca && (
                                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                                                <span className="font-black">Link da última cobrança:</span>{' '}
                                                <a href={empresa.ultimoLinkCobranca} target="_blank" rel="noreferrer" className="font-bold underline break-all">
                                                    Abrir link de pagamento
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`grid w-full gap-3 xl:w-[28rem] ${destaqueCobranca ? 'rounded-3xl border border-blue-300 bg-white p-3 shadow-sm' : ''}`}>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Próximo vencimento
                                                <input
                                                    type="date"
                                                    value={datasVencimento[empresa.id] || ''}
                                                    onChange={(e) => setDatasVencimento(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Plano
                                                <select
                                                    value={planosEmpresa[empresa.id] || planosDisponiveis[0]?.codigo || 'ESSENCIAL'}
                                                    onChange={(e) => setPlanosEmpresa(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                >
                                                    {planosDisponiveis.map((plano) => (
                                                        <option key={plano.codigo} value={plano.codigo}>
                                                            {plano.codigo} · {plano.nomeExibicao}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Valor mensal
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={valoresEmpresa[empresa.id] ?? '0,00'}
                                                    onChange={(e) => setValoresEmpresa(prev => ({ ...prev, [empresa.id]: maskCurrencyInput(e.target.value) }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Dias de tolerância
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={toleranciasEmpresa[empresa.id] ?? 0}
                                                    onChange={(e) => setToleranciasEmpresa(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Motivo do bloqueio
                                                <input
                                                    type="text"
                                                    value={motivosBloqueio[empresa.id] || ''}
                                                    onChange={(e) => setMotivosBloqueio(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    placeholder="Ex: pagamento em aberto"
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </label>
                                            <button
                                                onClick={() => prorrogarCadastroComplementar(empresa, 7)}
                                                disabled={processandoId === `onboarding-${empresa.id}`}
                                                className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-black text-sky-800 transition hover:border-sky-400 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                +7 dias ficha cadastral
                                            </button>
                                            <button
                                                onClick={() => carregarCadastroComplementarEmpresa(empresa.id, true)}
                                                disabled={cadastroComplementarLoading[empresa.id]}
                                                className="rounded-2xl border border-sky-300 bg-white px-4 py-3 text-sm font-black text-sky-800 transition hover:border-sky-400 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                {cadastroComplementarLoading[empresa.id] ? 'CARREGANDO FICHA...' : 'Ver ficha completa'}
                                            </button>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500 md:col-span-2">
                                                Motivo da liberação manual
                                                <input
                                                    type="text"
                                                    value={motivosLiberacaoManual[empresa.id] || ''}
                                                    onChange={(e) => setMotivosLiberacaoManual(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    placeholder="Ex: prazo estendido pela implantação"
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                            </label>
                                        </div>

                                        <div className="grid gap-2 md:grid-cols-3">
                                            <button
                                                onClick={() => salvarPlanoEmpresa(empresa)}
                                                disabled={processandoId === `plano-${empresa.id}`}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {processandoId === `plano-${empresa.id}` ? 'SALVANDO...' : 'Salvar plano'}
                                            </button>
                                            <button
                                                onClick={() => criarCobrancaManual(empresa)}
                                                disabled={processandoId === `cobranca-${empresa.id}` || !datasVencimento[empresa.id]}
                                                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {processandoId === `cobranca-${empresa.id}` ? 'CRIANDO...' : 'Criar cobrança'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (licencasPorEmpresa[empresa.id]) {
                                                        alternarBlocoEmpresa(empresa.id, 'licencas');
                                                        return;
                                                    }
                                                    carregarLicencasEmpresa(empresa.id, true);
                                                }}
                                                disabled={licencasLoading[empresa.id]}
                                                className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {licencasLoading[empresa.id]
                                                    ? 'SINCRONIZANDO...'
                                                    : blocosEmpresaAbertos[empresa.id]?.licencas
                                                        ? 'Ocultar licenciamento'
                                                        : 'Licenciamento'}
                                            </button>
                                            <button
                                                onClick={() => carregarIncidentesEmpresa(empresa.id, true)}
                                                disabled={incidentesLoading[empresa.id]}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {incidentesLoading[empresa.id] ? 'CARREGANDO...' : 'Incidentes'}
                                            </button>
                                            <button
                                                onClick={() => exportarLicencasEmpresa(empresa)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Exportar licenças
                                            </button>
                                            <button
                                                onClick={() => exportarIncidentesEmpresa(empresa)}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Exportar incidentes
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (timelinePorEmpresa[empresa.id]) {
                                                        alternarBlocoEmpresa(empresa.id, 'timeline');
                                                        return;
                                                    }
                                                    carregarTimelineEmpresa(empresa.id, true);
                                                }}
                                                disabled={timelineLoading[empresa.id]}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {timelineLoading[empresa.id]
                                                    ? 'CARREGANDO...'
                                                    : blocosEmpresaAbertos[empresa.id]?.timeline
                                                        ? 'Ocultar timeline'
                                                        : 'Timeline'}
                                            </button>
                                            <button
                                                onClick={() => registrarPagamento(empresa)}
                                                disabled={processandoId === `pagamento-${empresa.id}` || !datasVencimento[empresa.id]}
                                                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                {processandoId === `pagamento-${empresa.id}` ? 'SALVANDO...' : 'Registrar pagamento'}
                                            </button>
                                            <button
                                                onClick={() => atualizarLiberacaoManualCadastro(empresa, !empresa.onboardingLiberacaoManualAtiva)}
                                                disabled={processandoId === `liberacao-manual-${empresa.id}`}
                                                className={`rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                                    empresa.onboardingLiberacaoManualAtiva
                                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                        : 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                                                }`}
                                            >
                                                {processandoId === `liberacao-manual-${empresa.id}`
                                                    ? 'SALVANDO...'
                                                    : empresa.onboardingLiberacaoManualAtiva
                                                        ? 'Remover liberação manual'
                                                        : 'Liberar mesmo pendente'}
                                            </button>
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <button
                                                onClick={() => reativarEmpresa(empresa)}
                                                disabled={processandoId === `reativar-${empresa.id}`}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            >
                                                {processandoId === `reativar-${empresa.id}` ? 'REATIVANDO...' : 'Reativar'}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => bloquearEmpresa(empresa)}
                                            disabled={processandoId === `bloquear-${empresa.id}`}
                                            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {processandoId === `bloquear-${empresa.id}` ? 'BLOQUEANDO...' : 'Bloquear'}
                                        </button>
                                        <button
                                            onClick={() => cancelarEmpresa(empresa)}
                                            disabled={processandoId === `cancelar-${empresa.id}`}
                                            className="rounded-2xl border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {processandoId === `cancelar-${empresa.id}` ? 'DESLIGANDO...' : 'Desligar da plataforma'}
                                        </button>

                                        {licencasPorEmpresa[empresa.id] && blocosEmpresaAbertos[empresa.id]?.licencas && (
                                            <div id={`empresa-${empresa.id}-licencas`} className="rounded-3xl border border-violet-200 bg-white p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-violet-700">
                                                            Licenciamento por módulo
                                                            <TooltipHint text="O plano base libera o conjunto padrão. Aqui você faz override por empresa: add-on comercial, trial ou bloqueio manual." />
                                                        </h4>
                                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                                            O plano base libera o padrão. Aqui você concede extras ou bloqueia módulos por empresa.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => carregarLicencasEmpresa(empresa.id, true)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        Atualizar grade
                                                    </button>
                                                </div>

                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                    {licencasPorEmpresa[empresa.id].map((modulo) => {
                                                        const chave = `${empresa.id}:${modulo.modulo}`;
                                                        return (
                                                            <div key={modulo.modulo} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm font-black text-slate-900">{modulo.nomeExibicao}</div>
                                                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                                            {modulo.categoria} · {modulo.origem === 'PLANO' ? 'PLANO' : modulo.origem === 'LIBERACAO_MANUAL' ? 'EXTRA MANUAL' : 'BLOQUEIO MANUAL'}
                                                                        </div>
                                                                    </div>
                                                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${modulo.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {modulo.ativo ? 'ATIVO' : 'BLOQUEADO'}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 text-xs font-medium text-slate-500">
                                                                    Base do plano: <span className="font-black text-slate-700">{modulo.disponivelNoPlano ? 'SIM' : 'NAO'}</span>
                                                                </div>
                                                                {modulo.bloqueadoComercial && (
                                                                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
                                                                        Bloqueio comercial ativo{modulo.motivoBloqueioComercial ? `: ${modulo.motivoBloqueioComercial}` : '.'}
                                                                    </div>
                                                                )}
                                                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                                        Valor extra mensal
                                                                        <span className="normal-case tracking-normal text-[10px] font-semibold text-slate-400">Use quando o módulo virar add-on cobrado à parte.</span>
                                                                        <input
                                                                            value={observacoesModulo[`${chave}:valor`] ?? maskCurrencyInput(modulo.valorMensalExtra ?? modulo.valorBaseMensal ?? 0)}
                                                                            onChange={(e) => setObservacoesModulo(prev => ({ ...prev, [`${chave}:valor`]: maskCurrencyInput(e.target.value) }))}
                                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-500"
                                                                        />
                                                                    </label>
                                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                                        Trial até
                                                                        <span className="normal-case tracking-normal text-[10px] font-semibold text-slate-400">Preencha se quiser liberar por prazo promocional.</span>
                                                                        <input
                                                                            type="date"
                                                                            value={observacoesModulo[`${chave}:trial`] ?? modulo.trialAte ?? ''}
                                                                            onChange={(e) => setObservacoesModulo(prev => ({ ...prev, [`${chave}:trial`]: e.target.value }))}
                                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-500"
                                                                        />
                                                                    </label>
                                                                </div>
                                                                <textarea
                                                                    value={observacoesModulo[chave] || ''}
                                                                    onChange={(e) => setObservacoesModulo(prev => ({ ...prev, [chave]: e.target.value }))}
                                                                    placeholder="Observação operacional do módulo..."
                                                                    className="mt-3 min-h-[72px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-violet-500"
                                                                />
                                                                <input
                                                                    value={observacoesModulo[`${chave}:motivoBloqueio`] ?? modulo.motivoBloqueioComercial ?? ''}
                                                                    onChange={(e) => setObservacoesModulo(prev => ({ ...prev, [`${chave}:motivoBloqueio`]: e.target.value }))}
                                                                    placeholder="Motivo do bloqueio comercial do add-on"
                                                                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-amber-500"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const moduloComCampos = {
                                                                            ...modulo,
                                                                            ativo: !modulo.ativo,
                                                                            valorMensalExtra: parseCurrencyBRL(observacoesModulo[`${chave}:valor`] ?? modulo.valorMensalExtra ?? modulo.valorBaseMensal ?? 0),
                                                                            trialAte: observacoesModulo[`${chave}:trial`] ?? modulo.trialAte ?? '',
                                                                            bloqueadoComercial: modulo.bloqueadoComercial,
                                                                            motivoBloqueioComercial: observacoesModulo[`${chave}:motivoBloqueio`] ?? modulo.motivoBloqueioComercial ?? ''
                                                                        };
                                                                        atualizarModuloEmpresa(empresa, moduloComCampos);
                                                                    }}
                                                                    disabled={processandoId === `modulo-${empresa.id}-${modulo.modulo}`}
                                                                    className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                                                        modulo.ativo
                                                                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                    }`}
                                                                >
                                                                    {processandoId === `modulo-${empresa.id}-${modulo.modulo}`
                                                                        ? 'SALVANDO...'
                                                                        : modulo.ativo ? 'Bloquear módulo' : 'Liberar módulo'}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const moduloComCampos = {
                                                                            ...modulo,
                                                                            valorMensalExtra: parseCurrencyBRL(observacoesModulo[`${chave}:valor`] ?? modulo.valorMensalExtra ?? modulo.valorBaseMensal ?? 0),
                                                                            trialAte: observacoesModulo[`${chave}:trial`] ?? modulo.trialAte ?? '',
                                                                            bloqueadoComercial: !modulo.bloqueadoComercial,
                                                                            motivoBloqueioComercial: observacoesModulo[`${chave}:motivoBloqueio`] ?? modulo.motivoBloqueioComercial ?? ''
                                                                        };
                                                                        atualizarModuloEmpresa(empresa, moduloComCampos);
                                                                    }}
                                                                    disabled={processandoId === `modulo-${empresa.id}-${modulo.modulo}`}
                                                                    className={`mt-2 w-full rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                                                        modulo.bloqueadoComercial
                                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                                                    }`}
                                                                >
                                                                    {modulo.bloqueadoComercial ? 'Liberar comercialmente' : 'Bloquear comercialmente'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {timelinePorEmpresa[empresa.id] && blocosEmpresaAbertos[empresa.id]?.timeline && (
                                            <div id={`empresa-${empresa.id}-timeline`} className="rounded-3xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">Timeline da empresa</h4>
                                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                                            Auditoria, segurança, cobrança e incidentes em uma única leitura operacional.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    {timelinePorEmpresa[empresa.id].map((evento, index) => (
                                                        <div key={`${evento.dataHora}-${evento.titulo}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                                    {evento.tipo}
                                                                </span>
                                                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{evento.origem}</span>
                                                                <span className="text-xs font-medium text-slate-400">
                                                                    {evento.dataHora ? new Date(evento.dataHora).toLocaleString('pt-BR') : '-'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 text-sm font-black text-slate-900">{evento.titulo}</div>
                                                            <div className="mt-1 text-sm text-slate-600">{evento.descricao}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {incidentesPorEmpresa[empresa.id] && (
                                            <div className="rounded-3xl border border-red-200 bg-white p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase tracking-[0.18em] text-red-700">Incidentes e SLA</h4>
                                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                                            Registre suporte, severidade, responsável e prazo de resposta/resolução por empresa.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => carregarIncidentesEmpresa(empresa.id, true)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        Atualizar incidentes
                                                    </button>
                                                    <button
                                                        onClick={() => exportarIncidentesEmpresa(empresa)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        Exportar incidentes
                                                    </button>
                                                </div>

                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                        Tipo
                                                        <select
                                                            value={formIncidentePorEmpresa[empresa.id]?.tipo || 'OPERACIONAL'}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), tipo: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                        >
                                                            <option value="OPERACIONAL">OPERACIONAL</option>
                                                            <option value="FINANCEIRO">FINANCEIRO</option>
                                                            <option value="SEGURANCA">SEGURANCA</option>
                                                            <option value="COMERCIAL">COMERCIAL</option>
                                                        </select>
                                                    </label>
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                        Severidade
                                                        <select
                                                            value={formIncidentePorEmpresa[empresa.id]?.severidade || 'MEDIA'}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), severidade: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                        >
                                                            <option value="BAIXA">BAIXA</option>
                                                            <option value="MEDIA">MEDIA</option>
                                                            <option value="ALTA">ALTA</option>
                                                            <option value="CRITICA">CRITICA</option>
                                                        </select>
                                                    </label>
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500 md:col-span-2">
                                                        Título
                                                        <input
                                                            value={formIncidentePorEmpresa[empresa.id]?.titulo || ''}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), titulo: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                            placeholder="Ex: cliente sem acesso ao módulo fiscal"
                                                        />
                                                    </label>
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                        Responsável
                                                        <input
                                                            value={formIncidentePorEmpresa[empresa.id]?.responsavel || ''}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), responsavel: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                            placeholder="Ex: owner"
                                                        />
                                                    </label>
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                        Prazo de resposta
                                                        <input
                                                            type="date"
                                                            value={formIncidentePorEmpresa[empresa.id]?.prazoResposta || ''}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), prazoResposta: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                        />
                                                    </label>
                                                    <label className="grid gap-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                        Prazo de resolução
                                                        <input
                                                            type="date"
                                                            value={formIncidentePorEmpresa[empresa.id]?.prazoResolucao || ''}
                                                            onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                                ...prev,
                                                                [empresa.id]: { ...(prev[empresa.id] || {}), prazoResolucao: e.target.value }
                                                            }))}
                                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                                                        />
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={formIncidentePorEmpresa[empresa.id]?.descricao || ''}
                                                    onChange={(e) => setFormIncidentePorEmpresa(prev => ({
                                                        ...prev,
                                                        [empresa.id]: { ...(prev[empresa.id] || {}), descricao: e.target.value }
                                                    }))}
                                                    placeholder="Descrição do incidente, impacto e contexto"
                                                    className="mt-3 min-h-[80px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-500"
                                                />
                                                <button
                                                    onClick={() => salvarIncidenteEmpresa(empresa)}
                                                    disabled={processandoId === `incidente-create-${empresa.id}`}
                                                    className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                >
                                                    {processandoId === `incidente-create-${empresa.id}` ? 'SALVANDO...' : 'Registrar incidente'}
                                                </button>

                                                <div className="mt-4 space-y-3">
                                                    {incidentesPorEmpresa[empresa.id].length === 0 && (
                                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                                                            Nenhum incidente registrado para esta empresa.
                                                        </div>
                                                    )}
                                                    {incidentesPorEmpresa[empresa.id].map((incidente) => (
                                                        <div key={incidente.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                                    {incidente.tipo}
                                                                </span>
                                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                                                    incidente.status === 'RESOLVIDO' || incidente.status === 'ENCERRADO'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : incidente.severidade === 'CRITICA' || incidente.severidade === 'ALTA'
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {incidente.status} · {incidente.severidade}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 text-sm font-black text-slate-900">{incidente.titulo}</div>
                                                            <div className="mt-1 text-sm text-slate-600">{incidente.descricao || '-'}</div>
                                                            <div className="mt-2 text-xs font-medium text-slate-500">
                                                                Responsável: {incidente.responsavel || '-'} · Resposta até: {incidente.prazoResposta || '-'} · Resolução até: {incidente.prazoResolucao || '-'}
                                                            </div>
                                                            {incidente.resolucao && (
                                                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-950">
                                                                    Resolução: {incidente.resolucao}
                                                                </div>
                                                            )}
                                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                                <button
                                                                    onClick={() => salvarIncidenteEmpresa(empresa, incidente, { status: 'EM_ATENDIMENTO' })}
                                                                    disabled={processandoId === `incidente-update-${incidente.id}`}
                                                                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                                >
                                                                    Assumir atendimento
                                                                </button>
                                                                <button
                                                                    onClick={() => salvarIncidenteEmpresa(empresa, incidente, { status: 'RESOLVIDO', resolucao: incidente.resolucao || 'Resolvido pela operação da plataforma' })}
                                                                    disabled={processandoId === `incidente-update-${incidente.id}`}
                                                                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                                >
                                                                    Marcar resolvido
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )})}
                    </div>
                    </section>
                )}

                {abaAtiva === 'seguranca' && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Eventos recentes de segurança</h2>
                            <p className="text-sm text-slate-500">Monitore login, MFA, bloqueios e movimentações críticas da plataforma.</p>
                        </div>

                        <div className="mt-6 space-y-3">
                            {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Carregando eventos...</div>}
                            {!loading && eventosSeguranca.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                    Nenhum evento recente encontrado.
                                </div>
                            )}
                            {!loading && eventosSeguranca.map((evento) => (
                                <article key={evento.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert size={16} className="text-slate-400" />
                                                <span className="text-sm font-black text-slate-900">{evento.tipo}</span>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClasses(evento.severidade === 'CRITICAL' ? 'BLOQUEADA' : evento.severidade === 'WARN' ? 'INADIMPLENTE' : 'ATIVA')}`}>
                                                    {evento.severidade}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                <span className="font-bold text-slate-700">Usuário:</span> {evento.username || '-'}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                <span className="font-bold text-slate-700">Detalhes:</span> {evento.detalhes || '-'}
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            {evento.dataHora ? new Date(evento.dataHora).toLocaleString('pt-BR') : '-'}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {abaAtiva === 'manual' && (
                    <section className="space-y-6">
                        <div className="grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
                            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">Playbook da Plataforma</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-900">Manual técnico de operação SaaS</h2>
                                <p className="mt-3 max-w-4xl text-sm font-medium leading-relaxed text-slate-600">
                                    Use esta área quando precisar lembrar a sequência correta de operação da plataforma: abertura do dia, rotina comercial,
                                    cobrança, incidentes, exportações, ações em lote, saúde da plataforma, deploy e verificação de produção.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Ações rápidas</div>
                                <div className="mt-4 grid gap-3">
                                    <button
                                        onClick={() => setAbaAtiva('solicitacoes')}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Ir para Solicitações pendentes
                                    </button>
                                    <button
                                        onClick={() => setAbaAtiva('empresas')}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Ir para Empresas e licenças
                                    </button>
                                    <button
                                        onClick={() => setAbaAtiva('seguranca')}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Ir para Eventos de segurança
                                    </button>
                                    <button
                                        onClick={() => window.dispatchEvent(new CustomEvent('grandport:navigate', { detail: { page: 'auditoria' } }))}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Abrir Auditoria da plataforma
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Checklist operacional persistido</h3>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Organizado por cadência diária, semanal e mensal. O estado fica salvo neste navegador.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setManualChecklist({})}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    Limpar checklist
                                </button>
                            </div>

                            <div className="mt-5 grid gap-4 xl:grid-cols-3">
                                {[
                                    ['diario', 'Rotina diária', 'Validação rápida da operação corrente.'],
                                    ['semanal', 'Rotina semanal', 'Governança, exportação e revisão comercial.'],
                                    ['mensal', 'Fechamento mensal', 'Fechamento, auditoria e saúde da plataforma.']
                                ].map(([secao, titulo, descricao]) => {
                                    const itens = manualChecklistSections[secao];
                                    const concluidos = itens.filter(([id]) => manualChecklist[id]).length;
                                    return (
                                        <div key={secao} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{titulo}</div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-600">{descricao}</div>
                                                </div>
                                                <button
                                                    onClick={() => limparChecklistManualSecao(secao)}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    Limpar
                                                </button>
                                            </div>
                                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                                                {concluidos} de {itens.length} concluídos
                                            </div>
                                            <div className="mt-3 grid gap-3">
                                                {itens.map(([id, label]) => (
                                                    <button
                                                        key={id}
                                                        onClick={() => alternarChecklistManual(id)}
                                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-black transition ${
                                                            manualChecklist[id]
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${manualChecklist[id] ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {manualChecklist[id] ? 'OK' : '•'}
                                                        </span>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">1. Rotina diária do dono da plataforma</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Antes de abrir o dia:</span> confira `MRR base`, `MRR extras`, empresas inadimplentes,
                                        trials ativos, incidentes abertos, SLA vencido e últimos eventos de segurança.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Solicitações pendentes:</span> aprove, rejeite ou gere convite manual somente depois de validar
                                        contato, CNPJ e escopo comercial.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Empresas ativas:</span> revise vencimentos próximos, bloqueios manuais, bloqueios comerciais e add-ons faturáveis.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Centro de ações rápidas:</span> use a fila priorizada para decidir cobrança, pagamento,
                                        reativação, exportação de licenças, exportação de incidentes e timeline sem entrar em cada card completo.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Saúde da plataforma:</span> revise os cards de `Trials e vencimentos`, `Sem cobrança emitida`,
                                        `Bloqueio comercial prolongado` e `Divergência comercial` no console mestre.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <span className="font-black text-slate-900">Auditoria:</span> verifique ações críticas, acessos negados, bloqueios, reset de senha,
                                        alterações fiscais e eventos fora do padrão.
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">2. Checklist de liberação comercial</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 1:</span> aprovar solicitação e gerar convite para o e-mail correto.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 2:</span> confirmar plano base, valor mensal, dias de tolerância e vencimento inicial.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 3:</span> revisar licenciamento por módulo. Só liberar add-on manual com observação comercial.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 4:</span> se houver trial, preencher data final. Trial sem data é risco operacional.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 5:</span> validar na timeline se convite, licenças e primeira cobrança ficaram registrados.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 6:</span> se houver ativação assistida, registre incidente com responsável e SLA antes de escalar para suporte.
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                        <span className="font-black text-emerald-900">Passo 7:</span> se estiver trabalhando carteira grande, use busca operacional, seleção por filtro e ações em lote.
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">3. Cobrança e mensalidade</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Composição:</span> a cobrança usa `plano base + add-ons fora de trial`.
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Antes de criar cobrança:</span> confira `Total previsto` e a lista `Add-ons faturáveis`.
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Cobrança em lote:</span> use somente com vencimento preenchido e depois exporte o filtro para conferência externa.
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Registrar pagamento:</span> só após confirmar nova data de vencimento.
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Trials vencidos:</span> o scheduler expira automaticamente; revise diariamente se algum módulo caiu por fim de trial.
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 p-4">
                                        <span className="font-black text-violet-900">Bloqueio comercial por módulo:</span> antes de bloquear a empresa inteira, valide se o caso é inadimplência só de add-on.
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">4. Incidentes e suporte</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Erro de acesso geral:</span> validar primeiro status da empresa, vencimento, bloqueio manual e eventos de segurança.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Problema só em módulo específico:</span> revisar grade de licenciamento, trial, add-on e origem do bloqueio.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Incidentes e SLA:</span> registre responsável, prazo de resposta, prazo de resolução e mantenha o status atualizado entre `ABERTO`, `EM_ATENDIMENTO` e `RESOLVIDO`.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Revisão de carteira:</span> exporte empresas filtradas, licenciamento e incidentes da conta antes de acionar comercial ou suporte.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Falha de autenticação:</span> checar cookie, MFA, Redis e eventos `LOGIN_FALHA`, `MFA_FALHA`, `TENANT_BLOQUEADO`.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Timeline unificada:</span> use a timeline da empresa para confirmar auditoria, segurança, cobrança e incidentes sem alternar de contexto.
                                    </div>
                                    <div className="rounded-2xl bg-amber-50 p-4">
                                        <span className="font-black text-amber-900">Mudança sensível:</span> tudo que envolver fiscal, licenças, incidentes ou bloqueio precisa deixar rastro na auditoria.
                                    </div>
                                </div>
                            </article>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">5. Checklist técnico de produção</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        `APP_SECURITY_REDIS_REQUIRED=true` em produção.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        Redis deve estar online antes do app subir.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        Cookie com `secure=true` e HTTPS ativo.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        `JWT_SECRET`, banco e webhook token configurados.
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        Rodar healthcheck pós-deploy e validar login, Central SaaS e cobrança manual.
                                    </div>
                                </div>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">6. Pós-deploy rápido</h3>
                                <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                                    <div className="rounded-2xl bg-red-50 p-4">
                                        <span className="font-black text-red-900">Validar:</span> login, `/auth/me`, dashboard, Central SaaS, auditoria, timeline e criação de cobrança.
                                    </div>
                                    <div className="rounded-2xl bg-red-50 p-4">
                                        <span className="font-black text-red-900">Conferir:</span> se o build novo foi servido e se o navegador não ficou com bundle antigo do PWA.
                                    </div>
                                    <div className="rounded-2xl bg-red-50 p-4">
                                        <span className="font-black text-red-900">Revisar:</span> eventos de segurança, incidentes e logs de acesso negado nos primeiros minutos.
                                    </div>
                                    <div className="rounded-2xl bg-red-50 p-4">
                                        <span className="font-black text-red-900">Se algo falhar:</span> rollback antes de mexer manualmente em dados sensíveis.
                                    </div>
                                </div>
                            </article>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900">7. Resposta rápida a incidentes</h3>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Login falhando</div>
                                    <div className="mt-2 text-sm font-medium text-red-950">
                                        Verificar `/auth/me`, cookie, CORS, MFA, Redis e eventos `LOGIN_FALHA`.
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Módulo sumiu</div>
                                    <div className="mt-2 text-sm font-medium text-amber-950">
                                        Revisar licenciamento da empresa, trial, valor extra, bloqueio manual, bloqueio comercial e incidentes abertos.
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Cobrança divergente</div>
                                    <div className="mt-2 text-sm font-medium text-blue-950">
                                        Conferir `Plano base`, `Extras cobrados`, add-ons faturáveis, bloqueios comerciais e observação da cobrança gerada.
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Pós-deploy ruim</div>
                                    <div className="mt-2 text-sm font-medium text-violet-950">
                                        Verificar bundle novo, service worker, healthcheck, Redis, rota de auditoria e timeline antes de mexer em dados.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900">8. Operação por cenário</h3>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Inadimplência</div>
                                    <div className="mt-3 space-y-3 text-sm font-medium text-amber-950">
                                        <div><span className="font-black">1.</span> revisar `data de vencimento`, `dias de tolerância` e `última cobrança`.</div>
                                        <div><span className="font-black">2.</span> decidir se o caso é bloqueio comercial só de add-on ou bloqueio do tenant inteiro.</div>
                                        <div><span className="font-black">3.</span> se agir em carteira, usar filtro `Inadimplentes`, exportar o filtro e executar lote com cuidado.</div>
                                        <div><span className="font-black">4.</span> após regularização, registrar pagamento e validar se bloqueios comerciais foram liberados.</div>
                                    </div>
                                </article>

                                <article className="rounded-3xl border border-red-200 bg-red-50 p-5">
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Cliente Sem Acesso</div>
                                    <div className="mt-3 space-y-3 text-sm font-medium text-red-950">
                                        <div><span className="font-black">1.</span> validar status da empresa, motivo de bloqueio, vencimento e eventos de segurança.</div>
                                        <div><span className="font-black">2.</span> se houver suspeita de autenticação, checar `/auth/me`, cookie, MFA e Redis.</div>
                                        <div><span className="font-black">3.</span> abrir incidente com responsável e SLA antes de escalar tecnicamente.</div>
                                        <div><span className="font-black">4.</span> usar a timeline para confirmar o momento do bloqueio ou da última alteração sensível.</div>
                                    </div>
                                </article>

                                <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Módulo Bloqueado</div>
                                    <div className="mt-3 space-y-3 text-sm font-medium text-violet-950">
                                        <div><span className="font-black">1.</span> revisar se o módulo é do plano base, add-on manual ou trial.</div>
                                        <div><span className="font-black">2.</span> conferir `bloqueio manual`, `bloqueio comercial`, `trial até` e `valor extra mensal`.</div>
                                        <div><span className="font-black">3.</span> se for divergência comercial, exportar licenças e incidentes da empresa para análise externa.</div>
                                        <div><span className="font-black">4.</span> após ajuste, atualizar a grade e confirmar o reflexo na timeline e no acesso real.</div>
                                    </div>
                                </article>

                                <article className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                                    <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Pós-Deploy</div>
                                    <div className="mt-3 space-y-3 text-sm font-medium text-blue-950">
                                        <div><span className="font-black">1.</span> validar login, dashboard, Central SaaS, auditoria, timeline e cobrança manual.</div>
                                        <div><span className="font-black">2.</span> revisar `healthcheck`, Redis, cookie seguro, build servido e bundle/PWA antigo.</div>
                                        <div><span className="font-black">3.</span> monitorar eventos de segurança, incidentes novos e acessos negados nos primeiros minutos.</div>
                                        <div><span className="font-black">4.</span> se houver regressão sensível, priorizar rollback antes de corrigir dados manualmente.</div>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
