import React, { useEffect, useState } from 'react';
import { Blocks, Building2, FileClock, LogOut, MessageCircle, Shield, Wrench } from 'lucide-react';
import api from '../api/axios';

const navItems = [
    { id: 'platform-overview', label: 'Visao Geral', icon: Blocks },
    { id: 'central-saas', label: 'Operacao SaaS', icon: Building2 },
    { id: 'atendimento-saas', label: 'Atendimento', icon: MessageCircle },
    { id: 'auditoria', label: 'Auditoria', icon: Shield }
];

export const PlatformConsoleLayout = ({
    paginaAtiva,
    setPaginaAtiva,
    usuarioLogado,
    onLogout,
    onEntrarErp,
    children
}) => {
    const [contadorAtendimento, setContadorAtendimento] = useState(0);

    useEffect(() => {
        const carregarPendencias = async () => {
            try {
                const res = await api.get('/api/atendimentos/plataforma/tickets', {
                    params: { status: 'AGUARDANDO_PLATAFORMA' }
                });
                const lista = Array.isArray(res.data) ? res.data : [];
                setContadorAtendimento(lista.length);
            } catch (error) {
                setContadorAtendimento(0);
            }
        };

        carregarPendencias();
        const intervalo = window.setInterval(carregarPendencias, 120000);
        return () => window.clearInterval(intervalo);
    }, []);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_48%,_#e2e8f0)] text-slate-900">
            <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-700">Platform Console</div>
                        <h1 className="mt-2 text-3xl font-black tracking-tight">Operacao da Plataforma</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Ambiente exclusivo para governanca SaaS, cobrancas, empresas e seguranca global.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Sessao</div>
                            <div className="mt-1 text-sm font-bold text-slate-800">{usuarioLogado?.nome || usuarioLogado?.email || 'Platform Admin'}</div>
                        </div>
                        <button
                            onClick={onEntrarErp}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                        >
                            <Wrench size={16} />
                            Entrar no ERP
                        </button>
                        <button
                            onClick={onLogout}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl px-6 pb-5 flex flex-wrap gap-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = paginaAtiva === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setPaginaAtiva(item.id)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                                    active
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={16} />
                                {item.label}
                                {item.id === 'atendimento-saas' && contadorAtendimento > 0 && (
                                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                        active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {contadorAtendimento}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {children}
            </main>
        </div>
    );
};
