import React from 'react';
import { Info } from 'lucide-react';

export const TooltipHint = ({ text }) => (
    <span className="group relative inline-flex items-center align-middle">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
            <Info size={12} />
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-2xl bg-slate-950 px-3 py-2 text-[11px] font-bold leading-relaxed text-white opacity-0 shadow-2xl transition group-hover:opacity-100">
            {text}
        </span>
    </span>
);
