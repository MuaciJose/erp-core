import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, KeyRound, Mail, RefreshCcw, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const LiberacaoAcessos = ({ modo = 'liberacao-acessos' }) => {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [convites, setConvites] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [eventosSeguranca, setEventosSeguranca] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processandoId, setProcessandoId] = useState(null);
    const [filtro, setFiltro] = useState('PENDENTE');
    const [filtroEmpresas, setFiltroEmpresas] = useState('TODAS');
    const [datasVencimento, setDatasVencimento] = useState({});
    const [motivosBloqueio, setMotivosBloqueio] = useState({});
    const [planosEmpresa, setPlanosEmpresa] = useState({});
    const [valoresEmpresa, setValoresEmpresa] = useState({});
    const [toleranciasEmpresa, setToleranciasEmpresa] = useState({});
    const [abaAtiva, setAbaAtiva] = useState('solicitacoes');

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resSolicitacoes, resConvites, resEmpresas, resEventos] = await Promise.all([
                api.get('/api/assinaturas/solicitacoes-acesso'),
                api.get('/api/assinaturas/convites'),
                api.get('/api/assinaturas/empresas'),
                api.get('/api/security-events', { params: { limit: 10 } })
            ]);
            setSolicitacoes(Array.isArray(resSolicitacoes.data) ? resSolicitacoes.data : []);
            setConvites(Array.isArray(resConvites.data) ? resConvites.data : []);
            const empresasRecebidas = Array.isArray(resEmpresas.data) ? resEmpresas.data : [];
            setEmpresas(empresasRecebidas);
            setEventosSeguranca(Array.isArray(resEventos.data) ? resEventos.data : []);
            setDatasVencimento(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.dataVencimento || ''])));
            setMotivosBloqueio(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.motivoBloqueio || ''])));
            setPlanosEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.plano || 'ESSENCIAL'])));
            setValoresEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.valorMensal ?? 0])));
            setToleranciasEmpresa(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.diasTolerancia ?? 0])));
        } catch (error) {
            toast.error('Não foi possível carregar os dados da operação SaaS.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const solicitacoesFiltradas = useMemo(() => {
        if (filtro === 'TODAS') return solicitacoes;
        return solicitacoes.filter(item => item.status === filtro);
    }, [filtro, solicitacoes]);

    const empresasFiltradas = useMemo(() => {
        const hoje = new Date().toISOString().slice(0, 10);
        const limiteDate = new Date();
        limiteDate.setDate(limiteDate.getDate() + 7);
        const limite = limiteDate.toISOString().slice(0, 10);

        if (filtroEmpresas === 'TODAS') return empresas;
        if (filtroEmpresas === 'ATIVAS') return empresas.filter(item => item.statusAssinatura === 'ATIVA');
        if (filtroEmpresas === 'INADIMPLENTES') return empresas.filter(item => item.statusAssinatura === 'INADIMPLENTE');
        if (filtroEmpresas === 'BLOQUEADAS') return empresas.filter(item => item.statusAssinatura === 'BLOQUEADA');
        if (filtroEmpresas === 'VENCE_HOJE') return empresas.filter(item => item.dataVencimento === hoje);
        if (filtroEmpresas === 'VENCE_7_DIAS') {
            return empresas.filter(item => item.dataVencimento && item.dataVencimento >= hoje && item.dataVencimento <= limite);
        }
        return empresas;
    }, [empresas, filtroEmpresas]);

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
            vencendo7Dias: empresas.filter(item => item.dataVencimento && item.dataVencimento >= hoje && item.dataVencimento <= limite).length
        };
    }, [empresas]);

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
                valorMensal: Number(valoresEmpresa[empresa.id] || 0),
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

    const abas = [
        { id: 'solicitacoes', label: 'Solicitações', count: solicitacoes.filter(item => item.status === 'PENDENTE').length },
        { id: 'empresas', label: 'Empresas', count: empresas.length },
        { id: 'convites', label: 'Convites', count: convites.length },
        { id: 'seguranca', label: 'Segurança', count: eventosSeguranca.length }
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

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                    <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Vencendo 7 dias</div>
                        <div className="mt-2 text-3xl font-black text-blue-900">{resumoEmpresas.vencendo7Dias}</div>
                    </div>
                </section>

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
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">Carregando empresas...</div>}
                        {!loading && empresasFiltradas.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
                                Nenhuma empresa encontrada neste filtro.
                            </div>
                        )}

                        {!loading && empresasFiltradas.map(empresa => (
                            <article key={empresa.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-black text-slate-900">{empresa.razaoSocial}</h3>
                                            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${badgeClasses(empresa.statusAssinatura)}`}>
                                                {empresa.statusAssinatura}
                                            </span>
                                        </div>
                                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                            <div><span className="font-bold text-slate-700">Admin:</span> {empresa.adminPrincipal || '-'}</div>
                                            <div><span className="font-bold text-slate-700">Contato:</span> {empresa.telefone || '-'}</div>
                                            <div><span className="font-bold text-slate-700">CNPJ:</span> {empresa.cnpj}</div>
                                            <div><span className="font-bold text-slate-700">Vencimento:</span> {empresa.dataVencimento ? new Date(`${empresa.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</div>
                                            <div><span className="font-bold text-slate-700">Plano:</span> {empresa.plano || 'ESSENCIAL'}</div>
                                            <div><span className="font-bold text-slate-700">Valor:</span> R$ {Number(empresa.valorMensal || 0).toFixed(2)}</div>
                                        </div>
                                        {empresa.motivoBloqueio && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                                <span className="font-black">Motivo atual:</span> {empresa.motivoBloqueio}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid w-full gap-3 xl:w-[28rem]">
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
                                                    value={planosEmpresa[empresa.id] || 'ESSENCIAL'}
                                                    onChange={(e) => setPlanosEmpresa(prev => ({ ...prev, [empresa.id]: e.target.value }))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                >
                                                    <option value="ESSENCIAL">ESSENCIAL</option>
                                                    <option value="PROFISSIONAL">PROFISSIONAL</option>
                                                    <option value="PREMIUM">PREMIUM</option>
                                                </select>
                                            </label>
                                            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                                                Valor mensal
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={valoresEmpresa[empresa.id] ?? 0}
                                                    onChange={(e) => setValoresEmpresa(prev => ({ ...prev, [empresa.id]: e.target.value }))}
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
                                                onClick={() => registrarPagamento(empresa)}
                                                disabled={processandoId === `pagamento-${empresa.id}` || !datasVencimento[empresa.id]}
                                                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                {processandoId === `pagamento-${empresa.id}` ? 'SALVANDO...' : 'Registrar pagamento'}
                                            </button>
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
                                    </div>
                                </div>
                            </article>
                        ))}
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
            </div>
        </div>
    );
};
