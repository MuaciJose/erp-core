import React from 'react';
import { Toaster } from 'react-hot-toast';

export const AppToaster = () => (
    <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
            duration: 4500,
            style: {
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '18px',
                fontWeight: '800',
                padding: '14px 16px',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.22)',
                border: '1px solid rgba(148, 163, 184, 0.18)'
            },
            success: {
                iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
                style: {
                    background: '#052e16',
                    color: '#ecfdf5',
                    border: '1px solid rgba(34, 197, 94, 0.25)'
                }
            },
            error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                style: {
                    background: '#450a0a',
                    color: '#fef2f2',
                    border: '1px solid rgba(248, 113, 113, 0.22)'
                }
            },
            loading: {
                style: {
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: '1px solid rgba(96, 165, 250, 0.18)'
                }
            }
        }}
    />
);
