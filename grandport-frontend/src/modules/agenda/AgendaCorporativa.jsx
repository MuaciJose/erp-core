import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3, Plus, RefreshCcw, Sparkles, CheckCircle2, AlertTriangle, User2, CarFront, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const STATUS_OPTIONS = ['AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
const SETOR_OPTIONS = ['COMERCIAL', 'RECEPCAO', 'OFICINA', 'FINANCEIRO', 'ADMINISTRATIVO'];
const PRIORIDADE_OPTIONS = ['BAIXA', 'NORMAL', 'ALTA'];

const hojeIso = () => new Date().toISOString().slice(0, 10);
const adicionarDiasIso = (dias) => {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().slice(0, 10);
};

const estadoInicialForm = {
    titulo: '',
    descricao: '',
    tipo: 'COMPROMISSO',
    setor: 'COMERCIAL',
    prioridade: 'NORMAL',
    status: 'AGENDADO',
    dataInicio: `${hojeIso()}T09:00`,
    dataFim: `${hojeIso()}T10:00`,
    parceiroId: '',
    veiculoId: '',
    usuarioResponsavelId: '',
    origemModulo: '',
    origemId: '',
    lembreteWhatsApp: false,
    observacaoInterna: ''
};

const formatarDataHora = (valor) => {
    if (!valor) return '--';
    return new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const corStatus = (status) => {
    switch (status) {
        case 'CONCLUIDO':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'EM_ANDAMENTO':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'CONFIRMADO':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'CANCELADO':
            return 'bg-rose-100 text-rose-700 border-rose-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

export const AgendaCorporativa = () => {
    const montarFiltroRapido = (tipo) => {
        const hoje = hojeIso();
        if (tipo === 'atrasados') {
            return {
                dataInicio: adicionarDiasIso(-30),
                dataFim: adicionarDiasIso(-1),
                status: '',
                setor: '',
                usuarioResponsavelId: ''
            };
        }
        if (tipo === 'proximos7') {
            return {
                dataInicio: hoje,
                dataFim: adicionarDiasIso(7),
                status: '',
                setor: '',
                usuarioResponsavelId: ''
            };
        }
        return {
            dataInicio: hoje,
            dataFim: hoje,
            status: '',
            setor: '',
            usuarioResponsavelId: ''
        };
    };

    const [filtros, setFiltros] = useState({
        dataInicio: hojeIso(),
        dataFim: adicionarDiasIso(14),
        status: '',
        setor: '',
        usuarioResponsavelId: ''
    });
    const [agenda, setAgenda] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [parceiros, setParceiros] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [sugestoes, setSugestoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState(estadoInicialForm);

    const carregarBase = async () => {
        try {
            const [agendaRes, resumoRes, usuariosRes, parceirosRes, veiculosRes] = await Promise.all([
                api.get('/api/agenda', { params: filtros }),
                api.get('/api/agenda/resumo', { params: { data: filtros.dataInicio } }),
                api.get('/api/usuarios'),
                api.get('/api/parceiros'),
                api.get('/api/veiculos')
            ]);

            setAgenda(agendaRes.data);
            setResumo(resumoRes.data);
            setUsuarios(usuariosRes.data || []);
            setParceiros(parceirosRes.data || []);
            setVeiculos(veiculosRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar agenda corporativa.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        setCarregando(true);
        carregarBase();
    }, [filtros.dataInicio, filtros.dataFim, filtros.status, filtros.setor, filtros.usuarioResponsavelId]);

    useEffect(() => {
        const filtroSalvo = localStorage.getItem('agenda_quick_filter');
        if (filtroSalvo) {
            localStorage.removeItem('agenda_quick_filter');
            setFiltros(montarFiltroRapido(filtroSalvo));
        }

        const criacaoRapida = localStorage.getItem('agenda_quick_create');
        if (criacaoRapida) {
            localStorage.removeItem('agenda_quick_create');
            try {
                const payload = JSON.parse(criacaoRapida);
                setEditandoId(null);
                setForm(prev => ({
                    ...prev,
                    ...payload,
                    dataInicio: payload.dataInicio || `${hojeIso()}T09:00`,
                    dataFim: payload.dataFim || `${hojeIso()}T09:30`
                }));
                setModalAberto(true);
            } catch (error) {
                console.error('Falha ao abrir criacao rapida da agenda', error);
            }
        }
    }, []);

    useEffect(() => {
        if (!form.dataInicio || !form.usuarioResponsavelId) {
            setSugestoes([]);
            return;
        }

        const data = form.dataInicio.slice(0, 10);
        api.get('/api/agenda/sugestoes', {
            params: {
                data,
                duracaoMinutos: 60,
                usuarioResponsavelId: form.usuarioResponsavelId || undefined
            }
        }).then((res) => setSugestoes(res.data || []))
            .catch(() => setSugestoes([]));
    }, [form.dataInicio, form.usuarioResponsavelId]);

    const agendaAgrupada = useMemo(() => {
        return agenda.reduce((acc, item) => {
            const chave = item.dataInicio.slice(0, 10);
            if (!acc[chave]) acc[chave] = [];
            acc[chave].push(item);
            return acc;
        }, {});
    }, [agenda]);

    const abrirNovo = () => {
        setEditandoId(null);
        setForm({
            ...estadoInicialForm,
            dataInicio: `${filtros.dataInicio}T09:00`,
            dataFim: `${filtros.dataInicio}T10:00`
        });
        setModalAberto(true);
    };

    const abrirEdicao = (item) => {
        setEditandoId(item.id);
        setForm({
            titulo: item.titulo || '',
            descricao: item.descricao || '',
            tipo: item.tipo || 'COMPROMISSO',
            setor: item.setor || 'COMERCIAL',
            prioridade: item.prioridade || 'NORMAL',
            status: item.status || 'AGENDADO',
            dataInicio: item.dataInicio?.slice(0, 16) || `${hojeIso()}T09:00`,
            dataFim: item.dataFim?.slice(0, 16) || `${hojeIso()}T10:00`,
            parceiroId: item.parceiroId || '',
            veiculoId: item.veiculoId || '',
            usuarioResponsavelId: item.usuarioResponsavelId || '',
            origemModulo: item.origemModulo || '',
            origemId: item.origemId || '',
            lembreteWhatsApp: !!item.lembreteWhatsApp,
            observacaoInterna: item.observacaoInterna || ''
        });
        setModalAberto(true);
    };

    const salvarCompromisso = async () => {
        if (!form.titulo || !form.dataInicio || !form.dataFim) {
            toast.error('Título, início e fim são obrigatórios.');
            return;
        }

        setSalvando(true);
        try {
            const payload = {
                ...form,
                parceiroId: form.parceiroId || null,
                veiculoId: form.veiculoId || null,
                usuarioResponsavelId: form.usuarioResponsavelId || null,
                origemId: form.origemId || null
            };

            if (editandoId) {
                await api.put(`/api/agenda/${editandoId}`, payload);
                toast.success('Compromisso atualizado.');
            } else {
                await api.post('/api/agenda', payload);
                toast.success('Compromisso agendado.');
            }

            setModalAberto(false);
            setForm(estadoInicialForm);
            setEditandoId(null);
            carregarBase();
        } catch (error) {
            console.error(error);
            toast.error('Falha ao salvar compromisso.');
        } finally {
            setSalvando(false);
        }
    };

    const atualizarStatus = async (id, status) => {
        try {
            await api.patch(`/api/agenda/${id}/status`, { status });
            toast.success(`Status alterado para ${status}.`);
            carregarBase();
        } catch (error) {
            toast.error('Não foi possível alterar o status.');
        }
    };

    const excluirCompromisso = async (id) => {
        if (!window.confirm('Deseja realmente excluir este compromisso da agenda?')) return;
        try {
            await api.delete(`/api/agenda/${id}`);
            toast.success('Compromisso excluído.');
            carregarBase();
        } catch (error) {
            toast.error('Não foi possível excluir o compromisso.');
        }
    };

    const sincronizarRevisoes = async () => {
        const toastId = toast.loading('Sincronizando revisões vencidas com a agenda...');
        try {
            const res = await api.post('/api/agenda/sincronizar/revisoes');
            const criados = res.data?.criados || 0;
            toast.success(criados > 0 ? `${criados} compromisso(s) criado(s) a partir das revisões.` : 'Nenhuma revisão pendente precisou de novo compromisso.', { id: toastId });
            carregarBase();
        } catch (error) {
            toast.error('Falha ao sincronizar revisões com a agenda.', { id: toastId });
        }
    };

    return (
        <div className="p-8 max-w-[1500px] mx-auto animate-fade-in space-y-6">
            <div className="bg-slate-900 rounded-3xl p-7 text-white flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                    <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Agenda Corporativa Inteligente</div>
                    <h1 className="text-3xl font-black mt-3">Planejamento operacional, comercial e de oficina</h1>
                    <p className="text-slate-300 mt-3 font-medium leading-relaxed">
                        Centralize compromissos por setor, responsável, cliente e veículo. Use a sugestão de encaixe para montar a agenda sem conflito.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={carregarBase} className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-black flex items-center gap-2">
                        <RefreshCcw size={16} /> Atualizar
                    </button>
                    <button onClick={sincronizarRevisoes} className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2">
                        <Sparkles size={16} /> Sincronizar revisões
                    </button>
                    <button onClick={abrirNovo} className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black flex items-center gap-2">
                        <Plus size={16} /> Novo compromisso
                    </button>
                </div>
            </div>

            {resumo && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-xs font-black uppercase text-slate-400">Total</div><div className="text-3xl font-black text-slate-800 mt-2">{resumo.total}</div></div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-xs font-black uppercase text-slate-400">Hoje</div><div className="text-3xl font-black text-blue-600 mt-2">{resumo.hoje}</div></div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-xs font-black uppercase text-slate-400">Atrasados</div><div className="text-3xl font-black text-rose-600 mt-2">{resumo.atrasados}</div></div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-xs font-black uppercase text-slate-400">Concluídos</div><div className="text-3xl font-black text-emerald-600 mt-2">{resumo.concluidos}</div></div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-xs font-black uppercase text-slate-400">Alta prioridade</div><div className="text-3xl font-black text-amber-600 mt-2">{resumo.altaPrioridade}</div></div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
                <label className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400">De</span>
                    <input type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={filtros.dataInicio} onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400">Até</span>
                    <input type="date" className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={filtros.dataFim} onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))} />
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400">Status</span>
                    <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={filtros.status} onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="">Todos</option>
                        {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400">Setor</span>
                    <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={filtros.setor} onChange={(e) => setFiltros(prev => ({ ...prev, setor: e.target.value }))}>
                        <option value="">Todos</option>
                        {SETOR_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400">Responsável</span>
                    <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={filtros.usuarioResponsavelId} onChange={(e) => setFiltros(prev => ({ ...prev, usuarioResponsavelId: e.target.value }))}>
                        <option value="">Todos</option>
                        {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
                    </select>
                </label>
            </div>

            <div className="flex flex-wrap gap-3">
                <button onClick={() => setFiltros(montarFiltroRapido('hoje'))} className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wide hover:bg-slate-50">
                    Hoje
                </button>
                <button onClick={() => setFiltros(montarFiltroRapido('atrasados'))} className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs uppercase tracking-wide hover:bg-rose-100">
                    Atrasados
                </button>
                <button onClick={() => setFiltros(montarFiltroRapido('proximos7'))} className="px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs uppercase tracking-wide hover:bg-blue-100">
                    Próximos 7 dias
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr] gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 min-h-[520px]">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Agenda planejada</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Compromissos do intervalo filtrado</p>
                        </div>
                        <div className="text-sm font-black text-slate-400">{agenda.length} registros</div>
                    </div>

                    {carregando ? (
                        <div className="py-20 text-center text-slate-400 font-bold">Carregando agenda...</div>
                    ) : agenda.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold">Nenhum compromisso para o período.</div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(agendaAgrupada).map(([data, itens]) => (
                                <div key={data}>
                                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-black">
                                        <Calendar size={16} className="text-blue-600" />
                                        {new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                                    </div>
                                    <div className="space-y-3">
                                        {itens.map((item) => (
                                            <div
                                                key={item.id}
                                                className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 transition-colors"
                                            >
                                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-[11px] border font-black ${corStatus(item.status)}`}>{item.status}</span>
                                                            <span className="px-2.5 py-1 rounded-full text-[11px] border border-slate-200 bg-white text-slate-600 font-black">{item.setor}</span>
                                                            <span className="px-2.5 py-1 rounded-full text-[11px] border border-slate-200 bg-white text-slate-600 font-black">{item.prioridade}</span>
                                                        </div>
                                                        <div className="text-lg font-black text-slate-800">{item.titulo}</div>
                                                        {item.descricao ? <div className="text-sm text-slate-600 font-medium">{item.descricao}</div> : null}
                                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-bold">
                                                            <span className="flex items-center gap-2"><Clock3 size={14} /> {formatarDataHora(item.dataInicio)} - {formatarDataHora(item.dataFim)}</span>
                                                            {item.usuarioResponsavelNome ? <span className="flex items-center gap-2"><User2 size={14} /> {item.usuarioResponsavelNome}</span> : null}
                                                            {item.veiculoPlaca ? <span className="flex items-center gap-2"><CarFront size={14} /> {item.veiculoPlaca}</span> : null}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button onClick={() => abrirEdicao(item)} className="px-3 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 font-black text-xs flex items-center gap-2">
                                                            <Pencil size={14} /> Editar
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); atualizarStatus(item.id, 'CONCLUIDO'); }} className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center gap-2">
                                                            <CheckCircle2 size={14} /> Concluir
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); atualizarStatus(item.id, 'CONFIRMADO'); }} className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-black text-xs">Confirmar</button>
                                                        <button onClick={() => excluirCompromisso(item.id)} className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 font-black text-xs flex items-center gap-2">
                                                            <Trash2 size={14} /> Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-black mb-4">
                            <Sparkles size={18} className="text-amber-500" /> Encaixes inteligentes
                        </div>
                        {!form.usuarioResponsavelId ? (
                            <div className="text-sm font-medium text-slate-500">Selecione um responsável no formulário para ver horários livres sugeridos.</div>
                        ) : sugestoes.length === 0 ? (
                            <div className="text-sm font-medium text-slate-500">Sem encaixes automáticos para o dia selecionado.</div>
                        ) : (
                            <div className="space-y-3">
                                {sugestoes.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => setForm(prev => ({
                                            ...prev,
                                            dataInicio: item.dataInicio.slice(0, 16),
                                            dataFim: item.dataFim.slice(0, 16)
                                        }))}
                                        className="w-full text-left border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-2xl p-4 transition-colors"
                                    >
                                        <div className="font-black text-amber-800">{item.label}</div>
                                        <div className="text-xs font-bold text-amber-700 mt-1">Aplicar no compromisso atual</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 text-slate-800 font-black mb-4">
                            <AlertTriangle size={18} className="text-rose-500" /> Leituras rápidas
                        </div>
                        <ul className="space-y-3 text-sm font-medium text-slate-600">
                            <li>Use <strong>COMERCIAL</strong> para retornos, propostas e follow-up.</li>
                            <li>Use <strong>RECEPCAO</strong> para entrega, retirada e checklist.</li>
                            <li>Use <strong>OFICINA</strong> para execução, encaixe e acompanhamento interno.</li>
                            <li>Marque <strong>ALTA</strong> quando o compromisso bloquear venda, entrega ou cliente crítico.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {modalAberto && (
                <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{editandoId ? 'Editar compromisso' : 'Novo compromisso'}</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Agenda corporativa conectada com cliente, veículo e responsável.</p>
                            </div>
                            <button onClick={() => setModalAberto(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-black">Fechar</button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                            <label className="space-y-2 md:col-span-2">
                                <span className="text-xs font-black uppercase text-slate-400">Título</span>
                                <input className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.titulo} onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))} />
                            </label>
                            <label className="space-y-2 md:col-span-2">
                                <span className="text-xs font-black uppercase text-slate-400">Descrição</span>
                                <textarea className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium min-h-24" value={form.descricao} onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Início</span>
                                <input type="datetime-local" className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.dataInicio} onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Fim</span>
                                <input type="datetime-local" className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.dataFim} onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Setor</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.setor} onChange={(e) => setForm(prev => ({ ...prev, setor: e.target.value }))}>
                                    {SETOR_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Prioridade</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.prioridade} onChange={(e) => setForm(prev => ({ ...prev, prioridade: e.target.value }))}>
                                    {PRIORIDADE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Status</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
                                    {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Responsável</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.usuarioResponsavelId} onChange={(e) => setForm(prev => ({ ...prev, usuarioResponsavelId: e.target.value }))}>
                                    <option value="">Sem responsável</option>
                                    {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Cliente</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.parceiroId} onChange={(e) => setForm(prev => ({ ...prev, parceiroId: e.target.value }))}>
                                    <option value="">Sem cliente</option>
                                    {parceiros.map((parceiro) => <option key={parceiro.id} value={parceiro.id}>{parceiro.nome}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Veículo</span>
                                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" value={form.veiculoId} onChange={(e) => setForm(prev => ({ ...prev, veiculoId: e.target.value }))}>
                                    <option value="">Sem veículo</option>
                                    {veiculos.map((veiculo) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa} - {veiculo.marca} {veiculo.modelo}</option>)}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Origem módulo</span>
                                <input className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" placeholder="Ex: OS, VENDAS, CRM" value={form.origemModulo} onChange={(e) => setForm(prev => ({ ...prev, origemModulo: e.target.value }))} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-black uppercase text-slate-400">Origem ID</span>
                                <input className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold" placeholder="Ex: 1542" value={form.origemId} onChange={(e) => setForm(prev => ({ ...prev, origemId: e.target.value }))} />
                            </label>
                            <label className="space-y-2 md:col-span-2">
                                <span className="text-xs font-black uppercase text-slate-400">Observação interna</span>
                                <textarea className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium min-h-24" value={form.observacaoInterna} onChange={(e) => setForm(prev => ({ ...prev, observacaoInterna: e.target.value }))} />
                            </label>
                            <label className="md:col-span-2 flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
                                <input type="checkbox" checked={form.lembreteWhatsApp} onChange={(e) => setForm(prev => ({ ...prev, lembreteWhatsApp: e.target.checked }))} />
                                <span className="font-bold text-slate-700">Marcar lembrete por WhatsApp</span>
                            </label>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setModalAberto(false)} className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black">Cancelar</button>
                            <button onClick={salvarCompromisso} disabled={salvando} className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-black disabled:opacity-60">
                                {salvando ? 'Salvando...' : editandoId ? 'Atualizar compromisso' : 'Criar compromisso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
