import React from 'react';
import { Info } from 'lucide-react';

export const TooltipHint = ({ text, title, widthClass = 'w-72' }) => (
    <span className="group relative inline-flex items-center align-middle">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
            <Info size={12} />
        </span>
        <span className={`pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-[11px] leading-relaxed text-white opacity-0 shadow-2xl transition duration-150 group-hover:opacity-100 ${widthClass}`}>
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-slate-800 bg-slate-950/95" />
            {title && (
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                    {title}
                </span>
            )}
            <span className="block font-bold text-slate-100">
                {text}
            </span>
        </span>
    </span>
);
