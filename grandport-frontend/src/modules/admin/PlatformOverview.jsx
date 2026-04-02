import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const formatCurrencyBRL = (value) => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

export const PlatformOverview = ({ onAbrirCentralSaas, onAbrirAuditoria, onEntrarErp }) => {
    const [resumo, setResumo] = useState(null);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregar = async () => {
            setLoading(true);
            try {
                const [resResumo, resEmpresas] = await Promise.all([
                    api.get('/api/assinaturas/resumo-operacao'),
                    api.get('/api/assinaturas/empresas')
                ]);
                setResumo(resResumo.data || null);
                setEmpresas(Array.isArray(resEmpresas.data) ? resEmpresas.data : []);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, []);

    const radar = useMemo(() => {
        const empresasRisco = empresas
            .filter((empresa) =>
                empresa.statusAssinatura === 'INADIMPLENTE'
                || empresa.statusAssinatura === 'BLOQUEADA'
                || (empresa.totalModulosBloqueadosComercialmente || 0) > 0
            )
            .slice(0, 6);

        const trials = empresas
            .filter((empresa) => Array.isArray(empresa.extrasCobrados) && empresa.extrasCobrados.length > 0)
            .slice(0, 6);

        return { empresasRisco, trials };
    }, [empresas]);

    const saudePlataforma = useMemo(() => {
        const hoje = new Date();
        const hojeIso = hoje.toISOString().slice(0, 10);
        const proximos7 = new Date(hoje);
        proximos7.setDate(proximos7.getDate() + 7);
        const proximos7Iso = proximos7.toISOString().slice(0, 10);

        const trialsVencendo = empresas
            .filter((empresa) => Array.isArray(empresa.extrasCobrados) && empresa.extrasCobrados.length > 0)
            .filter((empresa) => empresa.dataVencimento && empresa.dataVencimento >= hojeIso && empresa.dataVencimento <= proximos7Iso)
            .slice(0, 5);

        const semCobrancaEmitida = empresas
            .filter((empresa) => empresa.statusAssinatura !== 'BLOQUEADA')
            .filter((empresa) => !empresa.ultimaCobrancaStatus || empresa.ultimaCobrancaStatus === 'CANCELADA')
            .slice(0, 5);

        const bloqueioProlongado = empresas
            .filter((empresa) => (empresa.totalModulosBloqueadosComercialmente || 0) > 0)
            .filter((empresa) => empresa.statusAssinatura === 'INADIMPLENTE' || empresa.statusAssinatura === 'ATIVA')
            .slice(0, 5);

        const divergenciaComercial = empresas
            .filter((empresa) => Number(empresa.valorExtrasMensal || 0) > 0 && (!Array.isArray(empresa.extrasCobrados) || empresa.extrasCobrados.length === 0))
            .slice(0, 5);

        const onboardingVencido = empresas
            .filter((empresa) => empresa.onboardingStatus === 'VENCIDO' && !empresa.onboardingLiberacaoManualAtiva)
            .slice(0, 5);

        const onboardingProximo = empresas
            .filter((empresa) => ['PENDENTE_COMPLEMENTO', 'EM_PREENCHIMENTO'].includes(empresa.onboardingStatus))
            .filter((empresa) => typeof empresa.onboardingDiasRestantes === 'number' && empresa.onboardingDiasRestantes >= 0 && empresa.onboardingDiasRestantes <= 3)
            .slice(0, 5);

        const liberacaoManualAtiva = empresas
            .filter((empresa) => empresa.onboardingLiberacaoManualAtiva)
            .slice(0, 5);

        const liberacaoManualAntiga = empresas
            .filter((empresa) => empresa.onboardingLiberacaoManualAtiva && empresa.onboardingLiberacaoManualEm)
            .filter((empresa) => {
                const dias = Math.floor((Date.now() - new Date(empresa.onboardingLiberacaoManualEm).getTime()) / 86400000);
                return dias >= 7;
            })
            .slice(0, 5);

        return {
            trialsVencendo,
            semCobrancaEmitida,
            bloqueioProlongado,
            divergenciaComercial,
            onboardingVencido,
            onboardingProximo,
            liberacaoManualAtiva,
            liberacaoManualAntiga
        };
    }, [empresas]);

    const acaoAgora = useMemo(() => {
        const hoje = new Date();
        const hojeIso = hoje.toISOString().slice(0, 10);

        const inadimplencia = empresas.filter((empresa) => empresa.statusAssinatura === 'INADIMPLENTE');
        const semAcesso = empresas.filter((empresa) => empresa.statusAssinatura === 'BLOQUEADA');
        const moduloBloqueado = empresas.filter((empresa) => (empresa.totalModulosBloqueadosComercialmente || 0) > 0);
        const semCobranca = empresas.filter((empresa) => !empresa.ultimaCobrancaStatus || empresa.ultimaCobrancaStatus === 'CANCELADA');
        const vencendoHoje = empresas.filter((empresa) => empresa.dataVencimento === hojeIso);
        const onboardingVencido = empresas.filter((empresa) => empresa.onboardingStatus === 'VENCIDO' && !empresa.onboardingLiberacaoManualAtiva);
        const liberacaoManualAtiva = empresas.filter((empresa) => empresa.onboardingLiberacaoManualAtiva);
        const liberacaoManualAntiga = empresas.filter((empresa) => {
            if (!empresa.onboardingLiberacaoManualAtiva || !empresa.onboardingLiberacaoManualEm) return false;
            const dias = Math.floor((Date.now() - new Date(empresa.onboardingLiberacaoManualEm).getTime()) / 86400000);
            return dias >= 7;
        });

        return {
            inadimplencia,
            semAcesso,
            moduloBloqueado,
            semCobranca,
            vencendoHoje,
            onboardingVencido,
            liberacaoManualAtiva,
            liberacaoManualAntiga
        };
    }, [empresas]);

    const abrirCentralComContexto = (contexto = null) => {
        onAbrirCentralSaas(contexto);
    };

    const abrirEmpresaNaCentral = (empresa, filtroEmpresas = 'TODAS') => {
        abrirCentralComContexto({
            abaAtiva: 'empresas',
            filtroEmpresas,
            buscaEmpresa: empresa.razaoSocial,
            titulo: `Empresa em foco: ${empresa.razaoSocial}`,
            descricao: 'A Central SaaS foi aberta a partir do painel executivo para revisar esta conta específica.',
            autoAbrir: filtroEmpresas === 'BLOQUEADAS'
                ? ['timeline', 'incidentes']
                : filtroEmpresas === 'INADIMPLENTES'
                    ? ['cobranca']
                    : ['cadastro']
        });
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="max-w-3xl">
                    <div className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Governanca</div>
                    <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Painel mestre da plataforma</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                        Este ambiente separa a operação SaaS do ERP operacional. Daqui você acompanha receita recorrente, risco comercial, bloqueios por módulo e decide quando entrar no ERP.
                    </p>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Central SaaS', descricao: 'Visão completa das empresas, módulos, cobranças e bloqueios comerciais.' })}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Operação</div>
                        <div className="mt-2 text-xl font-black text-slate-900">Central SaaS</div>
                        <p className="mt-2 text-sm text-slate-600">Empresas, planos, módulos, cobrança prevista e bloqueios comerciais.</p>
                    </button>
                    <button
                        onClick={onAbrirAuditoria}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Segurança</div>
                        <div className="mt-2 text-xl font-black text-slate-900">Auditoria</div>
                        <p className="mt-2 text-sm text-slate-600">Rastreabilidade, incidentes e investigação operacional por empresa.</p>
                    </button>
                    <button
                        onClick={onEntrarErp}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Produto</div>
                        <div className="mt-2 text-xl font-black text-slate-900">Entrar no ERP</div>
                        <p className="mt-2 text-sm text-slate-600">Acesse o ambiente operacional sem misturar a governança da plataforma.</p>
                    </button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'ATIVAS', titulo: 'MRR Base', descricao: 'Abertura focada em contas ativas que compõem a receita base recorrente.' })}
                    className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">MRR Base</div>
                    <div className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : formatCurrencyBRL(resumo?.mrrBase)}</div>
                </button>
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'MRR Extras', descricao: 'Revisão da carteira com foco em add-ons, extras mensais e composição comercial.', autoAbrir: ['licencas'] })}
                    className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">MRR Extras</div>
                    <div className="mt-2 text-3xl font-black text-violet-900">{loading ? '...' : formatCurrencyBRL(resumo?.mrrExtras)}</div>
                </button>
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'VENCE_7_DIAS', titulo: 'Empresas vencendo em 7 dias', descricao: 'Filtro de vencimento próximo para agir antes de virar inadimplência.' })}
                    className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Vencendo em 7 dias</div>
                    <div className="mt-2 text-3xl font-black text-amber-900">{loading ? '...' : resumo?.empresasVencendo7Dias ?? 0}</div>
                </button>
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Bloqueios comerciais', descricao: 'Revisão de empresas com módulos bloqueados comercialmente e risco de churn.', autoAbrir: ['licencas'] })}
                    className="rounded-3xl border border-red-200 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-300 hover:bg-red-100"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Bloqueios comerciais</div>
                    <div className="mt-2 text-3xl font-black text-red-900">{loading ? '...' : resumo?.modulosBloqueadosComercialmente ?? 0}</div>
                </button>
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Incidentes abertos', descricao: 'Foco nas contas com suporte ativo, incidentes em aberto e necessidade de acompanhamento.', autoAbrir: ['incidentes'] })}
                    className="rounded-3xl border border-orange-200 bg-orange-50 p-5 text-left shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">Incidentes abertos</div>
                    <div className="mt-2 text-3xl font-black text-orange-900">{loading ? '...' : resumo?.incidentesAbertos ?? 0}</div>
                </button>
                <button
                    onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'SLA vencido', descricao: 'Abertura para revisar contas com risco operacional e atraso em resposta ou resolução.', autoAbrir: ['incidentes'] })}
                    className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-5 text-left shadow-sm transition hover:border-fuchsia-300 hover:bg-fuchsia-100"
                >
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-700">SLA vencido</div>
                    <div className="mt-2 text-3xl font-black text-fuchsia-900">{loading ? '...' : resumo?.incidentesSlaVencido ?? 0}</div>
                </button>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Radar de risco</div>
                            <h3 className="mt-2 text-xl font-black text-slate-900">Empresas exigindo ação</h3>
                        </div>
                        <button
                            onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Radar de risco', descricao: 'Empresas críticas da plataforma ordenadas por risco comercial e operacional.' })}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                        >
                            Ver Central SaaS
                        </button>
                    </div>
                    <div className="mt-5 space-y-3">
                        {radar.empresasRisco.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-500">
                                Nenhuma empresa crítica no momento.
                            </div>
                        )}
                        {radar.empresasRisco.map((empresa) => (
                            <button
                                key={empresa.id}
                                onClick={() => abrirEmpresaNaCentral(empresa, empresa.statusAssinatura === 'BLOQUEADA' ? 'BLOQUEADAS' : empresa.statusAssinatura === 'INADIMPLENTE' ? 'INADIMPLENTES' : 'TODAS')}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                        empresa.statusAssinatura === 'BLOQUEADA' ? 'bg-red-100 text-red-700'
                                            : empresa.statusAssinatura === 'INADIMPLENTE' ? 'bg-amber-100 text-amber-700'
                                                : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {empresa.statusAssinatura}
                                    </span>
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                    Vencimento: {empresa.dataVencimento || '-'} · Bloqueios comerciais: {empresa.totalModulosBloqueadosComercialmente || 0}
                                </div>
                            </button>
                        ))}
                    </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Comercial</div>
                            <h3 className="mt-2 text-xl font-black text-slate-900">Visão rápida de receita</h3>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Empresas ativas</div>
                            <div className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : resumo?.empresasAtivas ?? 0}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Empresas com bloqueio comercial</div>
                            <div className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : resumo?.empresasComBloqueioComercial ?? 0}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Trials ativos</div>
                            <div className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : resumo?.trialsAtivos ?? 0}</div>
                        </div>
                    </div>
                </article>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">O que exige ação agora</div>
                        <h3 className="mt-2 text-xl font-black text-slate-900">Cenários operacionais prioritários</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Leitura direta do que merece ataque imediato na operação da plataforma.
                        </p>
                    </div>
                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'O que exige ação agora', descricao: 'Cenários prioritários do dia para atuação comercial e operacional.' })}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                        Resolver na Central SaaS
                    </button>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-5">
                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'INADIMPLENTES', titulo: 'Cenário: inadimplência', descricao: 'Empresas em atraso exigindo decisão entre cobrança, pagamento e bloqueio.', autoAbrir: ['cobranca'] })}
                        className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:border-amber-300 hover:bg-amber-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Inadimplência</div>
                        <div className="mt-2 text-3xl font-black text-amber-900">{acaoAgora.inadimplencia.length}</div>
                        <div className="mt-3 text-sm font-medium text-amber-950">
                            Contas em atraso exigindo decisão entre pagamento, cobrança em lote ou bloqueio.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                            Próximo passo: filtro `Inadimplentes` e exportação da carteira.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'BLOQUEADAS', titulo: 'Cenário: cliente sem acesso', descricao: 'Empresas bloqueadas que exigem análise de reativação, suporte ou segurança.', autoAbrir: ['timeline', 'incidentes'] })}
                        className="rounded-3xl border border-red-200 bg-red-50 p-5 text-left transition hover:border-red-300 hover:bg-red-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Cliente Sem Acesso</div>
                        <div className="mt-2 text-3xl font-black text-red-900">{acaoAgora.semAcesso.length}</div>
                        <div className="mt-3 text-sm font-medium text-red-950">
                            Empresas bloqueadas que podem demandar reativação, suporte ou validação de segurança.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-red-800">
                            Próximo passo: revisar timeline, auditoria e status da empresa.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Cenário: módulo bloqueado', descricao: 'Contas com bloqueio comercial por add-on ou divergência de licenciamento.', autoAbrir: ['licencas'] })}
                        className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-left transition hover:border-violet-300 hover:bg-violet-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Módulo Bloqueado</div>
                        <div className="mt-2 text-3xl font-black text-violet-900">{acaoAgora.moduloBloqueado.length}</div>
                        <div className="mt-3 text-sm font-medium text-violet-950">
                            Empresas com bloqueio comercial por add-on ou divergência de licenciamento.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-violet-800">
                            Próximo passo: revisar grade de licenças e valor extra mensal.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Cenário: sem cobrança', descricao: 'Empresas sem cobrança registrada ou com cobrança cancelada exigindo regularização.', autoAbrir: ['cobranca'] })}
                        className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Sem Cobrança</div>
                        <div className="mt-2 text-3xl font-black text-blue-900">{acaoAgora.semCobranca.length}</div>
                        <div className="mt-3 text-sm font-medium text-blue-950">
                            Empresas ativas sem cobrança registrada ou com cobrança cancelada.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-800">
                            Próximo passo: abrir operação e gerar cobrança manual ou em lote.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'VENCE_HOJE', titulo: 'Cenário: vencendo hoje', descricao: 'Carteira que precisa de ação imediata antes de escalar para inadimplência.' })}
                        className="rounded-3xl border border-orange-200 bg-orange-50 p-5 text-left transition hover:border-orange-300 hover:bg-orange-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Vencendo Hoje</div>
                        <div className="mt-2 text-3xl font-black text-orange-900">{acaoAgora.vencendoHoje.length}</div>
                        <div className="mt-3 text-sm font-medium text-orange-950">
                            Carteira com vencimento no dia e potencial impacto comercial imediato.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-800">
                            Próximo passo: agir antes de virar inadimplência ou bloquear add-ons.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Cenário: onboarding vencido', descricao: 'Empresas com ficha cadastral vencida exigindo cobrança, prorrogação ou liberação manual.', autoAbrir: ['cadastro'] })}
                        className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-left transition hover:border-sky-300 hover:bg-sky-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Onboarding Vencido</div>
                        <div className="mt-2 text-3xl font-black text-sky-900">{acaoAgora.onboardingVencido.length}</div>
                        <div className="mt-3 text-sm font-medium text-sky-950">
                            Empresas com ficha vencida e sem override manual exigindo decisão da plataforma.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
                            Próximo passo: abrir ficha completa, prorrogar prazo ou liberar manualmente.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Cenário: liberação manual ativa', descricao: 'Empresas com exceção manual ativa no onboarding, exigindo revisão periódica da plataforma.', autoAbrir: ['cadastro'] })}
                        className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:border-emerald-300 hover:bg-emerald-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Liberação Manual Ativa</div>
                        <div className="mt-2 text-3xl font-black text-emerald-900">{acaoAgora.liberacaoManualAtiva.length}</div>
                        <div className="mt-3 text-sm font-medium text-emerald-950">
                            Empresas operando com exceção manual de onboarding concedida pela plataforma.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                            Próximo passo: revisar motivo, prazo e necessidade de manter o override.
                        </div>
                    </button>

                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Cenário: liberação manual antiga', descricao: 'Empresas com exceção manual há 7 dias ou mais, exigindo revisão obrigatória.', autoAbrir: ['cadastro'] })}
                        className="rounded-3xl border border-teal-200 bg-teal-50 p-5 text-left transition hover:border-teal-300 hover:bg-teal-100"
                    >
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Liberação Manual Antiga</div>
                        <div className="mt-2 text-3xl font-black text-teal-900">{acaoAgora.liberacaoManualAntiga.length}</div>
                        <div className="mt-3 text-sm font-medium text-teal-950">
                            Exceções manuais com 7 dias ou mais, que não devem ficar esquecidas na operação.
                        </div>
                        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-teal-800">
                            Próximo passo: reavaliar, remover override ou exigir conclusão da ficha.
                        </div>
                    </button>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Saúde da plataforma</div>
                        <h3 className="mt-2 text-xl font-black text-slate-900">Alertas executivos da operação</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Leituras rápidas para identificar risco comercial, carteira sem cobrança e contas que precisam de revisão manual.
                        </p>
                    </div>
                    <button
                        onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Saúde da plataforma', descricao: 'Alertas executivos para revisar risco comercial, cobrança e divergências da carteira.' })}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                        Abrir operação SaaS
                    </button>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <article className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Onboarding vencido</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Onboarding vencido', descricao: 'Empresas com ficha cadastral vencida exigindo ação da plataforma.', autoAbrir: ['cadastro'] })}
                                className="rounded-2xl border border-sky-200 bg-white/80 px-3 py-2 text-xs font-black text-sky-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-sky-900">{saudePlataforma.onboardingVencido.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.onboardingVencido.length === 0 && (
                                <div className="rounded-2xl border border-sky-200/60 bg-white/70 p-4 text-sm font-semibold text-sky-900">
                                    Nenhuma empresa com ficha vencida exigindo intervenção agora.
                                </div>
                            )}
                            {saudePlataforma.onboardingVencido.map((empresa) => (
                                <button
                                    key={`onboarding-vencido-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-sky-200/60 bg-white/70 p-4 text-left transition hover:border-sky-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Prazo: {empresa.onboardingPrazoConclusao || '-'} · Pendências: {Array.isArray(empresa.onboardingPendencias) ? empresa.onboardingPendencias.length : 0}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Onboarding vencendo</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Onboarding vencendo', descricao: 'Empresas com prazo curto para concluir a ficha cadastral.', autoAbrir: ['cadastro'] })}
                                className="rounded-2xl border border-cyan-200 bg-white/80 px-3 py-2 text-xs font-black text-cyan-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-cyan-900">{saudePlataforma.onboardingProximo.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.onboardingProximo.length === 0 && (
                                <div className="rounded-2xl border border-cyan-200/60 bg-white/70 p-4 text-sm font-semibold text-cyan-900">
                                    Nenhuma empresa com ficha perto do vencimento crítico.
                                </div>
                            )}
                            {saudePlataforma.onboardingProximo.map((empresa) => (
                                <button
                                    key={`onboarding-proximo-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-cyan-200/60 bg-white/70 p-4 text-left transition hover:border-cyan-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Dias restantes: {empresa.onboardingDiasRestantes ?? '-'} · Progresso: {empresa.onboardingPercentualPreenchimento ?? 0}%
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Liberação manual ativa</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Liberação manual ativa', descricao: 'Empresas operando com exceção manual no onboarding.', autoAbrir: ['cadastro'] })}
                                className="rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-emerald-900">{saudePlataforma.liberacaoManualAtiva.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.liberacaoManualAtiva.length === 0 && (
                                <div className="rounded-2xl border border-emerald-200/60 bg-white/70 p-4 text-sm font-semibold text-emerald-900">
                                    Nenhuma empresa com exceção manual ativa no onboarding.
                                </div>
                            )}
                            {saudePlataforma.liberacaoManualAtiva.map((empresa) => (
                                <button
                                    key={`liberacao-manual-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-emerald-200/60 bg-white/70 p-4 text-left transition hover:border-emerald-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Status da ficha: {empresa.onboardingStatus || '-'} · Liberado por: {empresa.onboardingLiberacaoManualPor || '-'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Liberação manual antiga</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Liberação manual antiga', descricao: 'Exceções manuais com 7 dias ou mais exigindo revisão.', autoAbrir: ['cadastro'] })}
                                className="rounded-2xl border border-teal-200 bg-white/80 px-3 py-2 text-xs font-black text-teal-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-teal-900">{saudePlataforma.liberacaoManualAntiga.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.liberacaoManualAntiga.length === 0 && (
                                <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-4 text-sm font-semibold text-teal-900">
                                    Nenhuma exceção manual antiga precisando revisão.
                                </div>
                            )}
                            {saudePlataforma.liberacaoManualAntiga.map((empresa) => (
                                <button
                                    key={`liberacao-manual-antiga-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-teal-200/60 bg-white/70 p-4 text-left transition hover:border-teal-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Entrada: {empresa.dataCadastro ? new Date(empresa.dataCadastro).toLocaleDateString('pt-BR') : '-'} · Override desde: {empresa.onboardingLiberacaoManualEm ? new Date(empresa.onboardingLiberacaoManualEm).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Trials e vencimentos</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'VENCE_7_DIAS', titulo: 'Trials e vencimentos', descricao: 'Revisão de trials ativos e vencimentos próximos da carteira.' })}
                                className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-amber-900">{saudePlataforma.trialsVencendo.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.trialsVencendo.length === 0 && (
                                <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-4 text-sm font-semibold text-amber-900">
                                    Nenhum trial com vencimento crítico nos próximos 7 dias.
                                </div>
                            )}
                            {saudePlataforma.trialsVencendo.map((empresa) => (
                                <button
                                    key={`trial-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa, 'VENCE_7_DIAS')}
                                    className="w-full rounded-2xl border border-amber-200/60 bg-white/70 p-4 text-left transition hover:border-amber-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Vencimento: {empresa.dataVencimento || '-'} · Add-ons: {Array.isArray(empresa.extrasCobrados) ? empresa.extrasCobrados.join(', ') : '-'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Sem cobrança emitida</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Sem cobrança emitida', descricao: 'Contas sem cobrança ativa exigindo revisão comercial e financeira.', autoAbrir: ['cobranca'] })}
                                className="rounded-2xl border border-blue-200 bg-white/80 px-3 py-2 text-xs font-black text-blue-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-blue-900">{saudePlataforma.semCobrancaEmitida.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.semCobrancaEmitida.length === 0 && (
                                <div className="rounded-2xl border border-blue-200/60 bg-white/70 p-4 text-sm font-semibold text-blue-900">
                                    Todas as contas relevantes já têm cobrança registrada.
                                </div>
                            )}
                            {saudePlataforma.semCobrancaEmitida.map((empresa) => (
                                <button
                                    key={`cobranca-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-blue-200/60 bg-white/70 p-4 text-left transition hover:border-blue-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Plano: {empresa.plano || '-'} · Total previsto: {formatCurrencyBRL(empresa.valorTotalMensalPrevisto || empresa.valorMensal || 0)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-red-200 bg-red-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Bloqueio comercial prolongado</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Bloqueio comercial prolongado', descricao: 'Empresas com bloqueio comercial persistente pedindo revisão manual.', autoAbrir: ['licencas'] })}
                                className="rounded-2xl border border-red-200 bg-white/80 px-3 py-2 text-xs font-black text-red-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-red-900">{saudePlataforma.bloqueioProlongado.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.bloqueioProlongado.length === 0 && (
                                <div className="rounded-2xl border border-red-200/60 bg-white/70 p-4 text-sm font-semibold text-red-900">
                                    Nenhuma empresa com bloqueio comercial exigindo revisão manual.
                                </div>
                            )}
                            {saudePlataforma.bloqueioProlongado.map((empresa) => (
                                <button
                                    key={`bloqueio-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-red-200/60 bg-white/70 p-4 text-left transition hover:border-red-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Status: {empresa.statusAssinatura} · Bloqueios comerciais: {empresa.totalModulosBloqueadosComercialmente || 0}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Divergência comercial</div>
                            <button
                                onClick={() => abrirCentralComContexto({ abaAtiva: 'empresas', filtroEmpresas: 'TODAS', titulo: 'Divergência comercial', descricao: 'Diferenças entre extras mensais e add-ons visíveis que precisam ser corrigidas.', autoAbrir: ['licencas'] })}
                                className="rounded-2xl border border-violet-200 bg-white/80 px-3 py-2 text-xs font-black text-violet-800 transition hover:bg-white"
                            >
                                Abrir filtro
                            </button>
                        </div>
                        <div className="mt-2 text-3xl font-black text-violet-900">{saudePlataforma.divergenciaComercial.length}</div>
                        <div className="mt-4 space-y-2">
                            {saudePlataforma.divergenciaComercial.length === 0 && (
                                <div className="rounded-2xl border border-violet-200/60 bg-white/70 p-4 text-sm font-semibold text-violet-900">
                                    Nenhuma divergência entre extras cobrados e add-ons visíveis.
                                </div>
                            )}
                            {saudePlataforma.divergenciaComercial.map((empresa) => (
                                <button
                                    key={`divergencia-${empresa.id}`}
                                    onClick={() => abrirEmpresaNaCentral(empresa)}
                                    className="w-full rounded-2xl border border-violet-200/60 bg-white/70 p-4 text-left transition hover:border-violet-300 hover:bg-white"
                                >
                                    <div className="text-sm font-black text-slate-900">{empresa.razaoSocial}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        Extras mensais: {formatCurrencyBRL(empresa.valorExtrasMensal || 0)} · Add-ons listados: {Array.isArray(empresa.extrasCobrados) ? empresa.extrasCobrados.length : 0}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </article>
                </div>
            </section>
        </div>
    );
};
