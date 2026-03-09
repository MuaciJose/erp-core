import React, { useState, useEffect } from 'react';
import { History, Search, Printer, Trash2, Calendar, User, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const HistoricoRecibos = ({ setPaginaAtiva }) => {
    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // ESTADO PARA O RECIBO QUE SERÁ REIMPRESSO
    const [reciboParaImprimir, setReciboParaImprimir] = useState(null);

    const carregarRecibos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/financeiro/recibos');
            setRecibos(res.data);
        } catch (error) {
            toast.error("Erro ao carregar histórico.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarRecibos();
    }, []);

    // FUNÇÃO PARA REIMPRIMIR
    const handleReimprimir = (r) => {
        setReciboParaImprimir(r);
        // Aguarda o React renderizar o componente de impressão e dispara
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handleExcluir = async (id) => {
        if (window.confirm("Deseja apagar este recibo do histórico?")) {
            try {
                await api.delete(`/api/financeiro/recibos/${id}`);
                toast.success("Recibo removido.");
                carregarRecibos();
            } catch (error) {
                toast.error("Erro ao excluir.");
            }
        }
    };

    const filtrarRecibos = recibos.filter(r =>
        r.pagador.toLowerCase().includes(busca.toLowerCase()) ||
        r.referente.toLowerCase().includes(busca.toLowerCase())
    );

    const formatarMoeda = (valor) => {
        const n = parseFloat(valor) || 0;
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in min-h-screen">

            {/* INTERFACE DA TABELA (ESCONDE NA IMPRESSÃO) */}
            <div className="print:hidden">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <History className="text-indigo-600 bg-indigo-100 p-1.5 rounded-xl" size={40}/>
                            HISTÓRICO DE RECIBOS
                        </h1>
                        <p className="text-slate-500 mt-1">Consulte e reimprima recibos emitidos anteriormente.</p>
                    </div>
                    <button
                        onClick={() => setPaginaAtiva('recibo-avulso')}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                    >
                        <ArrowLeft size={20}/> VOLTAR PARA GERADOR
                    </button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3 text-slate-400" size={20}/>
                        <input
                            type="text"
                            placeholder="Buscar por pagador ou referente..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                        <tr>
                            <th className="p-4 pl-8">Data Registro</th>
                            <th className="p-4">Pagador</th>
                            <th className="p-4">Valor</th>
                            <th className="p-4">Referente</th>
                            <th className="p-4 text-center pr-8">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="text-slate-700 font-medium">
                        {loading ? (
                            <tr><td colSpan="5" className="p-10 text-center animate-pulse">Carregando histórico...</td></tr>
                        ) : filtrarRecibos.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400">Nenhum recibo encontrado.</td></tr>
                        ) : (
                            filtrarRecibos.map(r => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 pl-8 text-xs font-mono">
                                        {new Date(r.dataRegistro).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="p-4 font-black text-slate-800 uppercase">{r.pagador}</td>
                                    <td className="p-4 text-green-600 font-black">{formatarMoeda(r.valor)}</td>
                                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{r.referente}</td>
                                    <td className="p-4 pr-8 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleReimprimir(r)}
                                                title="Reimprimir Recibo"
                                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                <Printer size={16}/>
                                            </button>
                                            <button
                                                onClick={() => handleExcluir(r.id)}
                                                title="Excluir do Histórico"
                                                className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 ÁREA SECRETA DE IMPRESSÃO (Só aparece no papel) */}
            {reciboParaImprimir && (
                <div id="print-area-wrapper" className="hidden print:block">
                    <div id="recibo-final" className="border-[3px] border-double border-slate-900 p-10 bg-white relative font-serif">

                        {/* 🚀 MARCA D'ÁGUA ATUALIZADA */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.04] pointer-events-none select-none text-center">
                            <h1 className="text-9xl font-black -rotate-12">RECIBO</h1>
                            <h2 className="text-5xl font-black -rotate-12 mt-4 tracking-widest">REIMPRESSÃO</h2>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10">
                                <h2 className="text-3xl font-black uppercase tracking-tighter font-sans">RECIBO</h2>

                                <div className="text-right">
                                    <h1 className="text-4xl italic font-black text-slate-900 flex items-center justify-end gap-3">
                                        Recibo
                                        {/* 🚀 ETIQUETA DE 2ª VIA */}
                                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-sans not-italic tracking-widest font-bold">
                                            2ª VIA
                                        </span>
                                    </h1>
                                    <div className="mt-3 inline-block border-2 border-slate-900 bg-slate-50 px-6 py-2 rounded-lg font-black text-3xl font-sans">
                                        {formatarMoeda(reciboParaImprimir.valor)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-2xl leading-[3.8rem] text-justify text-slate-900">
                                Recebi(emos) de <span className="font-black border-b border-slate-400 px-2 uppercase">{reciboParaImprimir.pagador}</span>,
                                a quantia de <span className="font-black border-b border-slate-400 px-2">{formatarMoeda(reciboParaImprimir.valor)}</span>
                                (<span className="italic font-bold text-slate-700 px-2 lowercase">{reciboParaImprimir.valorExtenso}</span>),
                                referente a <span className="font-black border-b border-slate-400 px-2 uppercase">{reciboParaImprimir.referente}</span>,
                                pelo que firmo(amos) o presente para que produza seus efeitos.
                            </div>

                            <div className="mt-16 text-right text-xl font-bold uppercase tracking-tight">
                                {reciboParaImprimir.cidade || "__________"}, {new Date(reciboParaImprimir.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                            </div>

                            <div className="mt-32 flex flex-col items-center">
                                <div className="w-1/2 border-t-2 border-slate-900 text-center pt-4">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 font-sans">Assinatura do Emitente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚀 CSS BLINDADO PARA REIMPRESSÃO (MANTIDO) */}
            <style>{`
                @media print {
                    @page { margin: 0; size: landscape; }
                    body * { visibility: hidden !important; }
                    
                    html, body, #root, main, div[class*="overflow-y-auto"] { 
                        height: auto !important; 
                        min-height: 0 !important;
                        overflow: visible !important; 
                        position: static !important;
                        background: white !important;
                    }

                    #print-area-wrapper, #print-area-wrapper * { 
                        visibility: visible !important; 
                    }

                    #print-area-wrapper {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    #recibo-final {
                        border: 3px double #000 !important;
                        padding: 40px !important;
                        margin: 0.8cm !important;
                    }

                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};