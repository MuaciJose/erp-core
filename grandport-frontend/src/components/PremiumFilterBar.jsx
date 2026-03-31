import React from 'react';

export const PremiumFilterBar = ({ children, className = '' }) => {
    return (
        <div className={`rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}>
            {children}
        </div>
    );
};
