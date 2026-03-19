import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const CupomReciboModal = ({ pedido, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const gerarPDF = async () => {
            try {
                // 🚀 CHAMA O MOTOR V8 DO JAVA QUE CRIAMOS!
                const response = await api.get(`/api/vendas/${pedido.id}/imprimir-pdf`, { responseType: 'blob' });

                // Transforma a resposta num arquivo visível na tela
                const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                setPdfUrl(fileURL);
            } catch (error) {
                toast.error("Erro ao carregar o PDF do servidor. Verifique o Back-end.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (pedido && pedido.id) {
            gerarPDF();
        }
    }, [pedido]);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in border-2 border-slate-700">

                {/* CABEÇALHO DO VISUALIZADOR */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0 shadow-md z-10">
                    <div>
                        <h2 className="font-black tracking-widest text-lg flex items-center gap-2">
                            <Printer size={20} className="text-blue-400"/> VISUALIZADOR DE DOCUMENTO OFICIAL
                        </h2>
                        <p className="text-xs text-slate-400 font-bold mt-1">Pedido/OS #{pedido?.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {pdfUrl && (
                            <a href={pdfUrl} download={`Documento-${pedido?.id}.pdf`} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors border border-slate-700" title="Baixar PDF para o computador">
                                <Download size={18} /> BAIXAR PDF
                            </a>
                        )}
                        <button onClick={onClose} className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* ÁREA DO PDF (A TELEVISÃO) */}
                <div className="flex-1 bg-slate-300 relative flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center text-slate-500">
                            <Loader2 size={60} className="animate-spin mb-4 text-blue-600" />
                            <h3 className="font-black tracking-widest text-lg">GERANDO PDF NO SERVIDOR...</h3>
                            <p className="text-xs font-bold mt-2">Cruzando dados e aplicando layout do banco de dados.</p>
                        </div>
                    ) : pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Documento"></iframe>
                    ) : (
                        <div className="text-slate-500 font-bold flex flex-col items-center">
                            <X size={48} className="text-red-400 mb-2"/>
                            Falha ao exibir o documento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};