import React from 'react';

export const PremiumTableShell = ({ children, className = '' }) => {
    return (
        <div className={`bg-white overflow-hidden flex-1 flex flex-col relative ${className}`}>
            {children}
        </div>
    );
};
