import React from 'react';
import {
    House,
    ClipboardCheck,
    Boxes,
    Wallet,
    Wrench,
    Grid2x2,
    MonitorSmartphone
} from 'lucide-react';

const DEFAULT_NAV_ITEMS = [
    { id: 'dash', label: 'Inicio', icon: House },
    { id: 'checklist', label: 'Recepcao', icon: ClipboardCheck },
    { id: 'inventario', label: 'Estoque', icon: Boxes },
    { id: 'fila-caixa', label: 'Caixa', icon: Wallet },
    { id: 'os', label: 'OS', icon: Wrench },
    { id: 'mobile-mais', label: 'Mais', icon: Grid2x2 }
];

const DEFAULT_TITLES = {
    dash: 'Operacao mobile',
    checklist: 'Recepcao de veiculo',
    inventario: 'Estoque mobile',
    'fila-caixa': 'Caixa mobile',
    os: 'Ordem de servico',
    'mobile-mais': 'Mais modulos'
};

export const MobileShell = ({
    paginaAtiva,
    setPaginaAtiva,
    usuarioLogado,
    nomeEmpresa,
    onOpenDesktop,
    navItems = DEFAULT_NAV_ITEMS,
    titles = DEFAULT_TITLES,
    children
}) => {
    const paginaNormalizada = navItems.some(item => item.id === paginaAtiva) ? paginaAtiva : navItems[0]?.id || 'dash';

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-600">
                                {nomeEmpresa || 'Grandport ERP'}
                            </p>
                            <h1 className="truncate text-lg font-black text-slate-900">
                                {titles[paginaNormalizada] || 'Operacao mobile'}
                            </h1>
                            <p className="truncate text-xs font-semibold text-slate-500">
                                {usuarioLogado?.nome || 'Operador logado'}
                            </p>
                        </div>

                        <button
                            onClick={onOpenDesktop}
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                            <MonitorSmartphone size={16} />
                            ERP completo
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-3 pb-24 pt-3">
                {children}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
                <div
                    className="grid gap-1 px-2 py-2"
                    style={{ gridTemplateColumns: `repeat(${Math.max(navItems.length, 1)}, minmax(0, 1fr))` }}
                >
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const ativo = paginaNormalizada === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setPaginaAtiva(item.id)}
                                className={`flex min-h-[60px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-black transition ${
                                    ativo
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={18} />
                                <span className="mt-1 leading-none">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
