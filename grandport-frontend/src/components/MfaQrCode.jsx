import React, { useEffect, useRef, useState } from 'react';

export const MfaQrCode = ({ value, size = 180 }) => {
    const containerRef = useRef(null);
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const renderQr = async () => {
            if (!containerRef.current || !value) {
                return;
            }

            try {
                await import('html5-qrcode/html5-qrcode.min.js');
                const writer = globalThis.__Html5QrcodeLibrary__?.BrowserQRCodeSvgWriter;
                if (!writer) {
                    setFallback(true);
                    return;
                }

                const instance = new writer();
                const svg = instance.write(value, size, size);
                if (cancelled || !containerRef.current) {
                    return;
                }

                containerRef.current.innerHTML = '';
                svg.setAttribute('width', String(size));
                svg.setAttribute('height', String(size));
                svg.classList.add('rounded-xl');
                containerRef.current.appendChild(svg);
                setFallback(false);
            } catch (error) {
                setFallback(true);
            }
        };

        renderQr();
        return () => {
            cancelled = true;
        };
    }, [value, size]);

    if (!value) {
        return null;
    }

    if (fallback) {
        return (
            <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-[180px] h-[180px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-center text-xs text-slate-500 px-4">
                    QR indisponível no momento. Use a chave manual abaixo.
                </div>
            </div>
        );
    }

    return <div ref={containerRef} className="inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm" />;
};
