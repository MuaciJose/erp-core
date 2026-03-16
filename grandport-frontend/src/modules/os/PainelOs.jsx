import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    LayoutTemplate, Plus, Clock, Car, User, Settings, CheckCircle,
    AlertTriangle, DollarSign, GripVertical
} from 'lucide-react';
import { OrdemServico } from './OrdemServico'; // Importa a tela que fizemos antes

export const PainelOs = () => {
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para controlar se estamos na tela de listagem ou dentro de uma OS específica
    const [osEmEdicao, setOsEmEdicao] = useState(null);
    const [modoFormulario, setModoFormulario] = useState(false);

    const carregarOrdens = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/os');
            setOrdens(res.data);
        } catch (error) {
            toast.error("Erro ao carregar o painel de OS.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarOrdens(); }, []);

    // =========================================================================
    // 🚀 MÁGICA DO DRAG & DROP (ARRASTAR E SOLTAR)
    // =========================================================================
    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('osId', id);
        // Efeito visual de quem está sendo arrastado
        setTimeout(() => e.target.classList.add('opacity-50', 'scale-95'), 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50', 'scale-95');
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessário para permitir o drop
    };

    const handleDrop = async (e, novoStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('osId');
        if (!id) return;

        const osCard = ordens.find(o => o.id === parseInt(id));
        if (osCard.status === novoStatus) return;

        // 1. Atualização Otimista (Muda na tela na hora, sem esperar o servidor)
        setOrdens(prev => prev.map(o => o.id === parseInt(id) ? { ...o, status: novoStatus } : o));

        // 2. Manda pro servidor
        try {
            await api.patch(`/api/os/${id}/status?status=${novoStatus}`);
            toast.success(`OS #${id} movida para ${novoStatus.replace(/_/g, ' ')}`);
        } catch (error) {
            toast.error("Erro ao mover a OS.");
            carregarOrdens(); // Reverte se der erro
        }
    };

    // =========================================================================
    // 🚀 RENDERIZAÇÃO DAS COLUNAS
    // =========================================================================
    const colunas = [
        { id: 'ORCAMENTO', titulo: '1. Orçamento', cor: 'bg-slate-100 border-slate-300 text-slate-700', corTexto: 'text-slate-800' },
        { id: 'AGUARDANDO_APROVACAO', titulo: '2. Aguardando Aprovação', cor: 'bg-yellow-50 border-yellow-300 text-yellow-700', corTexto: 'text-yellow-800' },
        { id: 'EM_EXECUCAO', titulo: '3. Em Execução (Pátio)', cor: 'bg-blue-50 border-blue-300 text-blue-700', corTexto: 'text-blue-800' },
        { id: 'AGUARDANDO_PECA', titulo: '⚠️ Aguardando Peça', cor: 'bg-red-50 border-red-300 text-red-700', corTexto: 'text-red-800' },
        { id: 'FINALIZADA', titulo: '4. Pronto p/ Entregar', cor: 'bg-emerald-50 border-emerald-300 text-emerald-700', corTexto: 'text-emerald-800' }
    ];

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // Se clicou em "Nova OS" ou em algum Card, renderiza a tela de OS
    if (modoFormulario) {
        return (
            <OrdemServico
                osParaEditar={osEmEdicao}
                onVoltar={() => {
                    setModoFormulario(false);
                    setOsEmEdicao(null);
                    carregarOrdens(); // Recarrega ao voltar
                }}
            />
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col animate-fade-in">
            {/* CABEÇALHO DO KANBAN */}
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <LayoutTemplate className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={36} />
                        PAINEL DE PRODUÇÃO (OS)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Arraste os cards para atualizar o status na oficina</p>
                </div>

                <button
                    onClick={() => { setOsEmEdicao(null); setModoFormulario(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 uppercase tracking-widest text-sm transition-transform hover:scale-105"
                >
                    <Plus size={20} /> Nova Ordem de Serviço
                </button>
            </div>

            {/* O QUADRO KANBAN */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-black animate-pulse text-xl">Carregando painel de produção...</div>
            ) : (
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
                    {colunas.map(coluna => {
                        const ordensDaColuna = ordens.filter(o => o.status === coluna.id);

                        return (
                            <div
                                key={coluna.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, coluna.id)}
                                className={`w-80 shrink-0 flex flex-col rounded-3xl border-2 border-dashed ${coluna.cor} bg-opacity-40 min-h-[70vh] transition-colors overflow-hidden`}
                            >
                                {/* HEADER DA COLUNA */}
                                <div className={`p-4 border-b border-white/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center ${coluna.corTexto}`}>
                                    <h3 className="font-black uppercase tracking-widest text-sm truncate">{coluna.titulo}</h3>
                                    <span className="bg-white/50 px-2 py-1 rounded-lg text-xs font-black">{ordensDaColuna.length}</span>
                                </div>

                                {/* LISTA DE CARDS */}
                                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                    {ordensDaColuna.map(os => (
                                        <div
                                            key={os.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, os.id)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => { setOsEmEdicao(os); setModoFormulario(true); }}
                                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 cursor-grab active:cursor-grabbing transition-all hover:border-indigo-400 group relative"
                                        >
                                            {/* Pegador (Grip) visual */}
                                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                                                <GripVertical size={20}/>
                                            </div>

                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest border border-slate-200">
                                                    OS #{os.id}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock size={12}/> {new Date(os.dataEntrada).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>

                                            <h4 className="font-black text-slate-800 text-base leading-tight mb-1 truncate flex items-center gap-2">
                                                <User size={14} className="text-slate-400 shrink-0"/> {os.cliente?.nome || 'Cliente Balcão'}
                                            </h4>

                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-4 truncate">
                                                <Car size={14} className="text-indigo-400 shrink-0"/>
                                                {os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo} (${os.veiculo.placa})` : 'Veículo não informado'}
                                            </p>

                                            <div className="border-t border-slate-100 pt-3 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Total da OS</p>
                                                    <p className="font-black text-emerald-600 flex items-center gap-1">
                                                        <DollarSign size={14}/> {formatarMoeda(os.valorTotal)}
                                                    </p>
                                                </div>

                                                {/* Se tiver desconto ou alerta, mostra badge */}
                                                {os.desconto > 0 && (
                                                    <span className="text-[9px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100">
                                                        C/ Desconto
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {ordensDaColuna.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest text-center px-4">
                                            Arraste uma OS para cá
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};