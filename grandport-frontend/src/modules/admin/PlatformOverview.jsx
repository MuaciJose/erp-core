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
                        onClick={onAbrirCentralSaas}
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

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">MRR Base</div>
                    <div className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : formatCurrencyBRL(resumo?.mrrBase)}</div>
                </div>
                <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">MRR Extras</div>
                    <div className="mt-2 text-3xl font-black text-violet-900">{loading ? '...' : formatCurrencyBRL(resumo?.mrrExtras)}</div>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Vencendo em 7 dias</div>
                    <div className="mt-2 text-3xl font-black text-amber-900">{loading ? '...' : resumo?.empresasVencendo7Dias ?? 0}</div>
                </div>
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Bloqueios comerciais</div>
                    <div className="mt-2 text-3xl font-black text-red-900">{loading ? '...' : resumo?.modulosBloqueadosComercialmente ?? 0}</div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Radar de risco</div>
                            <h3 className="mt-2 text-xl font-black text-slate-900">Empresas exigindo ação</h3>
                        </div>
                        <button
                            onClick={onAbrirCentralSaas}
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
                            <div key={empresa.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                            </div>
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
        </div>
    );
};
