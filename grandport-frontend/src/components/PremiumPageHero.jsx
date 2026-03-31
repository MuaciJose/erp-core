import React from 'react';

export const PremiumPageHero = ({
    kicker,
    title,
    description,
    icon: Icon,
    actions,
    metrics,
    rightPanel
}) => {
    return (
        <section className="erp-glass rounded-[2rem] border border-white/70 p-7 shadow-[0_25px_80px_rgba(15,23,42,0.16)]">
            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="space-y-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-3">
                            {kicker && <span className="erp-kicker">{kicker}</span>}
                            <div>
                                <h1 className="flex items-center gap-3 text-4xl font-black tracking-[-0.04em] text-slate-900">
                                    {Icon && (
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                                            <Icon size={24} />
                                        </span>
                                    )}
                                    {title}
                                </h1>
                                {description && (
                                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
                    </div>

                    {metrics && metrics.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                            {metrics.map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-[1.6rem] border bg-gradient-to-br p-5 shadow-sm ${item.tone || 'from-slate-100 to-white text-slate-900 border-slate-200'}`}
                                >
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-current/60">
                                        {item.label}
                                    </p>
                                    <p className="mt-4 text-3xl font-black tracking-[-0.04em]">
                                        {item.value}
                                    </p>
                                    {item.detail && (
                                        <p className="mt-2 text-sm font-semibold text-current/70">
                                            {item.detail}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {rightPanel && (
                    <div className="rounded-[1.8rem] bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
                        {rightPanel}
                    </div>
                )}
            </div>
        </section>
    );
};
