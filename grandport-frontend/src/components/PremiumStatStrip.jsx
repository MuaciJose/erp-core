import React from 'react';

export const PremiumStatStrip = ({ items = [], compact = false }) => {
    if (!items.length) return null;

    return (
        <div className={`grid grid-cols-1 gap-4 border-b border-slate-200/80 bg-white px-6 ${compact ? 'py-3' : 'py-4'} md:grid-cols-3 xl:grid-cols-4`}>
            {items.map((item) => (
                <div key={item.label} className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${compact ? 'p-3' : 'p-4'}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {item.label}
                    </p>
                    <p className={`${compact ? 'mt-1 text-lg' : 'mt-2 text-2xl'} font-black tracking-[-0.04em] text-slate-900`}>
                        {item.value}
                    </p>
                    {item.detail && (
                        <p className={`${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'} font-semibold text-slate-500`}>
                            {item.detail}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};
