import React from 'react';

export const MfaQrCode = ({ value, size = 180 }) => {
    if (!value) {
        return (
            <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-[180px] h-[180px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-center text-xs text-slate-500 px-4">
                    QR indisponivel no momento. Use a chave manual abaixo.
                </div>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <img
                src={value}
                alt="QR Code para configuracao do MFA"
                width={size}
                height={size}
                className="rounded-xl"
            />
        </div>
    );
};
