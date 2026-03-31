import React from 'react';
import { BookOpen, Building2, MessageCircleMore, Monitor, Users, LogOut } from 'lucide-react';

const shortcuts = [
    { id: 'crm', label: 'CRM', description: 'Revisoes e relacionamento', icon: MessageCircleMore },
    { id: 'parceiros', label: 'Clientes', description: 'Consulta de clientes e fornecedores', icon: Users },
    { id: 'listagem-os', label: 'Lista de OS', description: 'Consulta completa de ordens', icon: Building2 },
    { id: 'manual', label: 'Manual', description: 'Ajuda operacional no celular', icon: BookOpen }
];

export const MobileMais = ({ setPaginaAtiva, onOpenDesktop, onLogout, shortcuts = shortcuts }) => {
    return (
        <div className="space-y-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Mais modulos
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    Acesso rapido no celular
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                    Aqui ficam consultas, CRM e o atalho para abrir o ERP completo quando precisar de escritorio.
                </p>
            </section>

            <section className="grid gap-3">
                {shortcuts.map(shortcut => {
                    const Icon = shortcut.icon;
                    return (
                        <button
                            key={shortcut.id}
                            onClick={() => setPaginaAtiva(shortcut.id)}
                            className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900">
                                        {shortcut.label}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        {shortcut.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </section>

            <section className="grid gap-3">
                <button
                    onClick={onOpenDesktop}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-slate-900/20"
                >
                    <Monitor size={18} />
                    Abrir ERP completo
                </button>

                <button
                    onClick={onLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-black uppercase tracking-wide text-red-700"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </section>
        </div>
    );
};
