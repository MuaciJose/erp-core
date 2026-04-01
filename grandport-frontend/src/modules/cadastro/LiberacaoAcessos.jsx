import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, KeyRound, Mail, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const LiberacaoAcessos = () => {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [convites, setConvites] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processandoId, setProcessandoId] = useState(null);
    const [filtro, setFiltro] = useState('PENDENTE');
    const [datasVencimento, setDatasVencimento] = useState({});
    const [motivosBloqueio, setMotivosBloqueio] = useState({});

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resSolicitacoes, resConvites, resEmpresas] = await Promise.all([
                api.get('/api/assinaturas/solicitacoes-acesso'),
                api.get('/api/assinaturas/convites'),
                api.get('/api/assinaturas/empresas')
            ]);
            setSolicitacoes(Array.isArray(resSolicitacoes.data) ? resSolicitacoes.data : []);
            setConvites(Array.isArray(resConvites.data) ? resConvites.data : []);
            const empresasRecebidas = Array.isArray(resEmpresas.data) ? resEmpresas.data : [];
            setEmpresas(empresasRecebidas);
            setDatasVencimento(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.dataVencimento || ''])));
            setMotivosBloqueio(Object.fromEntries(empresasRecebidas.map(item => [item.id, item.motivoBloqueio || ''])));
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

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Controle Comercial</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Liberação de acessos</h1>
                            <p className="mt-2 max-w-3xl text-sm text-slate-600">
                                Aqui você recebe as solicitações públicas, aprova o contato e gera o convite seguro que libera a criação real da empresa.
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
                            <h2 className="text-lg font-black text-slate-900">Convites recentes</h2>
                            <p className="text-sm text-slate-500">O sistema não envia WhatsApp nem e-mail sozinho aqui. Use os botões abaixo para copiar e mandar ao cliente.</p>
                        </div>

                        <div className="mt-6 space-y-3">
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
                                        <button
                                            onClick={() => copiarConvite(convite.token, convite.emailDestino)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <Copy size={14} />
                                            Copiar mensagem pronta
                                        </button>
                                        <button
                                            onClick={() => copiarLinkConvite(convite.token)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <Mail size={14} />
                                            Copiar link do convite
                                        </button>
                                        <button
                                            onClick={() => copiarTokenConvite(convite.token)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <KeyRound size={14} />
                                            Copiar só o token
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Empresas da plataforma</h2>
                            <p className="text-sm text-slate-500">
                                Controle vencimento, bloqueio por inadimplência e liberação após pagamento.
                            </p>
                        </div>
                        <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                            {empresas.length} empresas
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">Carregando empresas...</div>}
                        {!loading && empresas.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
                                Nenhuma empresa criada ainda.
                            </div>
                        )}

                        {!loading && empresas.map(empresa => (
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
                                            <button
                                                onClick={() => bloquearEmpresa(empresa)}
                                                disabled={processandoId === `bloquear-${empresa.id}`}
                                                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                {processandoId === `bloquear-${empresa.id}` ? 'BLOQUEANDO...' : 'Bloquear'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
