import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Car, X, Calendar, PenTool, User, Gauge, CheckCircle } from 'lucide-react';

export const HistoricoVeiculoModal = ({ veiculo, onClose }) => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarHistorico = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/veiculos/${veiculo.id}/historico`);
                setHistorico(res.data);
            } catch (error) {
                console.error("Erro ao carregar histórico", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (veiculo) carregarHistorico();
    }, [veiculo]);

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                            <Car size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-widest uppercase">PRONTUÁRIO DO VEÍCULO</h2>
                            <p className="text-blue-300 font-bold text-sm">
                                {veiculo.marca} {veiculo.modelo} • Placa: <span className="text-white bg-white/20 px-2 rounded uppercase">{veiculo.placa}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 font-bold animate-pulse">
                            Buscando registros no sistema...
                        </div>
                    ) : historico.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-bold">
                            Nenhum registro de peças encontrado para esta placa.
                        </div>
                    ) : (
                        <div className="relative border-l-4 border-blue-200 ml-6 space-y-10">
                            {historico.map((registro) => (
                                <div key={registro.idVenda} className="relative pl-8">
                                    <div className="absolute -left-[14px] top-0 bg-blue-500 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-md">
                                        <div className="bg-white w-1.5 h-1.5 rounded-full"></div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="flex flex-wrap justify-between items-start mb-4 border-b border-dashed pb-4 gap-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
                                                    <Calendar size={16} className="text-blue-500"/> 
                                                    {new Date(registro.data).toLocaleDateString('pt-BR')} (Pedido #{registro.idVenda})
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                                    <User size={14} className="text-orange-500"/> Comprador: {registro.clienteComprador}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 justify-end">
                                                    <Gauge size={12}/> KM na época
                                                </p>
                                                <p className="text-lg font-black text-slate-700">{registro.kmRegistrado ? registro.kmRegistrado.toLocaleString('pt-BR') : '---'} km</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                <PenTool size={12}/> Peças Trocadas/Compradas
                                            </p>
                                            <ul className="space-y-2">
                                                {registro.itens.map((item, i) => (
                                                    <li key={i} className="flex justify-between text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg">
                                                        <span className="flex items-center gap-2">
                                                            <CheckCircle size={14} className="text-green-500" /> {item.descricao}
                                                        </span>
                                                        <span className="text-slate-500">R$ {item.valor.toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
