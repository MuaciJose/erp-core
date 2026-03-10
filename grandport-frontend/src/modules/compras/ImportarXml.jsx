import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Search, PackagePlus, RefreshCw, Calculator, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EspelhoNotaModal } from './EspelhoNotaModal';

export const ImportarXml = () => {
    const [busca, setBusca] = useState('');
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notaSelecionada, setNotaSelecionada] = useState(null);

    const carregarHistorico = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/compras/historico');
            setHistorico(res.data);
        } catch (error) { toast.error("Erro ao carregar histórico."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

    const handleUpload = async (e) => {
        const loadId = toast.loading("Processando XML...");
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        try {
            await api.post('/api/compras/importar-xml', formData);
            toast.success("Nota importada!", { id: loadId });
            carregarHistorico();
        } catch (err) { toast.error("Erro no upload.", { id: loadId }); }
    };

    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <PackagePlus className="text-blue-600 bg-blue-50 p-2 rounded-xl" size={40} />
                        HISTÓRICO DE NOTAS FISCAIS
                    </h1>
                </div>
                <label className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 cursor-pointer shadow-lg">
                    <UploadCloud size={20} /> IMPORTAR XML
                    <input type="file" accept=".xml" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                    <tr>
                        <th className="p-5">NF-e</th>
                        <th className="p-5">Fornecedor</th>
                        <th className="p-5">Valor Total</th>
                        <th className="p-5 text-center">Status</th>
                        <th className="p-5 text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {historico.filter(n => n.numero.includes(busca)).map((nota) => (
                        <tr key={nota.id} className="border-t">
                            <td className="p-5 font-black">{nota.numero}</td>
                            <td className="p-5 font-bold uppercase text-xs">{nota.fornecedorNome}</td>
                            <td className="p-5 font-black">{formatarMoeda(nota.valorTotalNota)}</td>
                            <td className="p-5 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${nota.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {nota.status}
                                    </span>
                            </td>
                            <td className="p-5 text-right">
                                <button onClick={() => setNotaSelecionada(nota)} className="p-2 border rounded-xl hover:bg-slate-100">
                                    <Calculator size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {notaSelecionada && <EspelhoNotaModal importacao={notaSelecionada} onClose={() => setNotaSelecionada(null)} onSaveSuccess={carregarHistorico} />}
        </div>
    );
};