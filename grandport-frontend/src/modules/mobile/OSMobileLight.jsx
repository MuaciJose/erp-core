import React, { useEffect, useMemo, useState } from 'react';
import { CarFront, CheckCircle2, Clock3, Search, User, Wrench } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusOptions = [
    { id: 'TODAS', label: 'Todas' },
    { id: 'ORCAMENTO', label: 'Orcamento' },
    { id: 'AGUARDANDO_APROVACAO', label: 'Aprovacao' },
    { id: 'EM_EXECUCAO', label: 'Execucao' },
    { id: 'AGUARDANDO_PECA', label: 'Peca' },
    { id: 'FINALIZADA', label: 'Finalizada' }
];

const nextStatusMap = {
    ORCAMENTO: 'AGUARDANDO_APROVACAO',
    AGUARDANDO_APROVACAO: 'EM_EXECUCAO',
    EM_EXECUCAO: 'AGUARDANDO_PECA',
    AGUARDANDO_PECA: 'FINALIZADA'
};

const badgeTone = {
    ORCAMENTO: 'bg-slate-100 text-slate-700',
    AGUARDANDO_APROVACAO: 'bg-amber-100 text-amber-700',
    EM_EXECUCAO: 'bg-blue-100 text-blue-700',
    AGUARDANDO_PECA: 'bg-red-100 text-red-700',
    FINALIZADA: 'bg-emerald-100 text-emerald-700'
};

export const OSMobileLight = () => {
    const [loading, setLoading] = useState(true);
    const [ordens, setOrdens] = useState([]);
    const [busca, setBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('TODAS');

    const carregarOrdens = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/os');
            setOrdens(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error('Erro ao carregar OS mobile.');
            setOrdens([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarOrdens();
    }, []);

    const ordensFiltradas = useMemo(() => {
        return ordens.filter(os => {
            const matchStatus = statusFiltro === 'TODAS' || os.status === statusFiltro;
            const termo = busca.toLowerCase();
            const matchBusca =
                !termo ||
                os.id?.toString().includes(termo) ||
                os.cliente?.nome?.toLowerCase().includes(termo) ||
                os.veiculo?.placa?.toLowerCase().includes(termo) ||
                os.veiculo?.modelo?.toLowerCase().includes(termo);
            return matchStatus && matchBusca;
        });
    }, [ordens, busca, statusFiltro]);

    const avancarStatus = async (os) => {
        const proximo = nextStatusMap[os.status];
        if (!proximo) return;

        try {
            await api.patch(`/api/os/${os.id}/status?status=${proximo}`);
            toast.success(`OS #${os.id} movida para ${proximo.replace(/_/g, ' ')}`);
            setOrdens(prev => prev.map(item => item.id === os.id ? { ...item, status: proximo } : item));
        } catch (error) {
            toast.error('Nao foi possivel atualizar a OS.');
        }
    };

    const formatarMoeda = (valor) =>
        Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por cliente, placa ou OS"
                        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {statusOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setStatusFiltro(option.id)}
                            className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wide ${
                                statusFiltro === option.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400 shadow-sm">
                        Carregando ordens...
                    </div>
                ) : ordensFiltradas.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-400 shadow-sm">
                        Nenhuma OS encontrada para este filtro.
                    </div>
                ) : (
                    ordensFiltradas.map(os => (
                        <article
                            key={os.id}
                            className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                                        OS #{os.id}
                                    </p>
                                    <h3 className="mt-2 text-base font-black text-slate-900">
                                        {os.cliente?.nome || 'Cliente nao informado'}
                                    </h3>
                                </div>
                                <span className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-wide ${badgeTone[os.status] || 'bg-slate-100 text-slate-700'}`}>
                                    {os.status?.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    <span>{os.consultor?.nome || 'Consultor nao informado'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CarFront size={16} className="text-slate-400" />
                                    <span>
                                        {os.veiculo
                                            ? `${os.veiculo.marca || ''} ${os.veiculo.modelo || ''} ${os.veiculo.placa ? `• ${os.veiculo.placa}` : ''}`
                                            : 'Veiculo nao informado'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock3 size={16} className="text-slate-400" />
                                    <span>
                                        {os.dataEntrada ? new Date(os.dataEntrada).toLocaleString('pt-BR') : 'Sem data'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                                        Total
                                    </p>
                                    <p className="text-lg font-black text-slate-900">
                                        {formatarMoeda(os.valorTotal)}
                                    </p>
                                </div>
                                {nextStatusMap[os.status] ? (
                                    <button
                                        onClick={() => avancarStatus(os)}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wide text-white"
                                    >
                                        <CheckCircle2 size={16} />
                                        Avancar
                                    </button>
                                ) : (
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-700">
                                        <Wrench size={16} />
                                        Concluida
                                    </div>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </section>
        </div>
    );
};
