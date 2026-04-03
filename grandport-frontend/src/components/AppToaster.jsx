import React from 'react';
import { Toaster } from 'react-hot-toast';

export const AppToaster = () => (
    <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
            duration: 5000,
            style: {
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#f8fafc',
                borderRadius: '20px',
                fontWeight: '800',
                padding: '16px 18px',
                minWidth: '320px',
                maxWidth: '440px',
                boxShadow: '0 22px 55px rgba(15, 23, 42, 0.24)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                backdropFilter: 'blur(10px)'
            },
            success: {
                iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
                style: {
                    background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
                    color: '#ecfdf5',
                    border: '1px solid rgba(34, 197, 94, 0.24)'
                }
            },
            error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                style: {
                    background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
                    color: '#fef2f2',
                    border: '1px solid rgba(248, 113, 113, 0.22)'
                }
            },
            blank: {
                style: {
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc'
                }
            },
            loading: {
                style: {
                    background: 'linear-gradient(135deg, #172554 0%, #1d4ed8 100%)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(96, 165, 250, 0.24)'
                }
            }
        }}
    />
);
