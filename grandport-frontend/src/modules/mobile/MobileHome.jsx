import React, { useEffect, useState } from 'react';
import { CarFront, ClipboardList, Wallet, Wrench, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

const quickActions = [
    {
        id: 'checklist',
        label: 'Recepcao',
        description: 'Check-in, fotos e assinatura',
        icon: ClipboardList,
        tone: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
        id: 'inventario',
        label: 'Estoque',
        description: 'Scanner e ajuste rapido',
        icon: CarFront,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
        id: 'fila-caixa',
        label: 'Caixa',
        description: 'Receber pedidos e OS',
        icon: Wallet,
        tone: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
        id: 'os',
        label: 'OS',
        description: 'Status e patio',
        icon: Wrench,
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
];

export const MobileHome = ({ setPaginaAtiva, quickActions = quickActions }) => {
    const [loading, setLoading] = useState(true);
    const [resumo, setResumo] = useState({
        ordensAbertas: 0,
        filaCaixa: 0,
        caixaStatus: 'INDISPONIVEL'
    });

    useEffect(() => {
        const carregarResumo = async () => {
            setLoading(true);
            try {
                const [resOs, resFila, resCaixa] = await Promise.all([
                    api.get('/api/os').catch(() => ({ data: [] })),
                    api.get('/api/vendas/fila-caixa').catch(() => ({ data: [] })),
                    api.get('/api/caixa/atual').catch(() => ({ data: { status: 'FECHADO' } }))
                ]);

                const listaOs = Array.isArray(resOs.data) ? resOs.data : [];
                const fila = Array.isArray(resFila.data) ? resFila.data : [];

                setResumo({
                    ordensAbertas: listaOs.filter(os => os.status !== 'FINALIZADA').length,
                    filaCaixa: fila.length,
                    caixaStatus: resCaixa.data?.status || 'FECHADO'
                });
            } finally {
                setLoading(false);
            }
        };

        carregarResumo();
    }, []);

    return (
        <div className="space-y-4">
            <section className="rounded-[28px] bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/10">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-300">
                    Mobile 1.0
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                    ERP de campo e balcão
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-300">
                    Entrada de veiculo, estoque, caixa e OS em fluxo rapido para uso no celular.
                </p>
            </section>

            <section className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                        OS abertas
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {loading ? '--' : resumo.ordensAbertas}
                    </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                        Fila caixa
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {loading ? '--' : resumo.filaCaixa}
                    </p>
                </div>
                <div className="col-span-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                        Caixa atual
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xl font-black text-slate-900">
                            {loading ? '--' : resumo.caixaStatus}
                        </p>
                        <button
                            onClick={() => setPaginaAtiva('fila-caixa')}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
                        >
                            Ir para caixa
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                        Modulos operacionais
                    </h3>
                </div>

                <div className="grid gap-3">
                    {quickActions.map(action => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => setPaginaAtiva(action.id)}
                                className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`rounded-2xl border p-3 ${action.tone}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-slate-900">
                                            {action.label}
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
