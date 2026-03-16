import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    Wrench, Plus, Edit, CheckCircle, Ban, Search,
    Clock, DollarSign, FileText, Settings2, ShieldAlert
} from 'lucide-react';

export const GestaoServicos = () => {
    const [servicos, setServicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Modal
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState({
        id: null, codigo: '', nome: '', descricao: '', preco: '', tempoEstimadoMinutos: '', ativo: true
    });

    const carregarServicos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/servicos');
            setServicos(res.data);
        } catch (error) {
            toast.error("Erro ao carregar tabela de serviços.");
        } finally { setLoading(false); }
    };

    useEffect(() => { carregarServicos(); }, []);

    const servicosFiltrados = servicos.filter(s =>
        s.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (s.codigo && s.codigo.toLowerCase().includes(busca.toLowerCase()))
    );

    const abrirModalNovo = () => {
        setForm({ id: null, codigo: '', nome: '', descricao: '', preco: '', tempoEstimadoMinutos: '', ativo: true });
        setModalAberto(true);
    };

    const abrirModalEditar = (serv) => {
        setForm({ ...serv });
        setModalAberto(true);
    };

    const salvarServico = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            preco: parseFloat(form.preco) || 0,
            tempoEstimadoMinutos: parseInt(form.tempoEstimadoMinutos) || 0
        };

        const loadId = toast.loading("Salvando serviço...");
        try {
            if (form.id) {
                await api.put(`/api/servicos/${form.id}`, payload);
                toast.success("Serviço atualizado com sucesso!", { id: loadId });
            } else {
                await api.post('/api/servicos', payload);
                toast.success("Novo serviço cadastrado!", { id: loadId });
            }
            setModalAberto(false);
            carregarServicos();
        } catch (error) {
            toast.error("Erro ao salvar serviço.", { id: loadId });
        }
    };

    const alternarStatus = async (serv) => {
        if(window.confirm(`Deseja ${serv.ativo ? 'DESATIVAR' : 'ATIVAR'} este serviço no catálogo?`)) {
            try {
                await api.put(`/api/servicos/${serv.id}`, { ...serv, ativo: !serv.ativo });
                toast.success(`Serviço ${serv.ativo ? 'desativado' : 'ativado'}!`);
                carregarServicos();
            } catch(e) { toast.error("Erro ao alterar status."); }
        }
    };

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Wrench className="text-orange-600 bg-orange-100 p-1 rounded-lg" size={36} />
                        TABELA DE SERVIÇOS
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Gerencie os valores de mão de obra da sua oficina</p>
                </div>

                <button onClick={abrirModalNovo} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-600/30 uppercase tracking-widest text-sm">
                    <Plus size={20} /> NOVO SERVIÇO
                </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar serviço por nome ou código..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all text-lg"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Carregando catálogo...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="p-4 pl-6">Código</th>
                            <th className="p-4">Serviço / Descrição</th>
                            <th className="p-4 text-center">Tempo Est.</th>
                            <th className="p-4 text-right">Valor Padrão</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center pr-6">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {servicosFiltrados.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">Nenhum serviço encontrado.</td></tr>
                        ) : servicosFiltrados.map(serv => (
                            <tr key={serv.id} className={`transition-colors ${!serv.ativo ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50'}`}>
                                <td className="p-4 pl-6 font-mono text-sm font-bold text-slate-500">{serv.codigo || 'S/N'}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-800">{serv.nome}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-xs">{serv.descricao}</p>
                                </td>
                                <td className="p-4 text-center font-bold text-slate-500 flex items-center justify-center gap-1">
                                    <Clock size={14} className="text-slate-400"/> {serv.tempoEstimadoMinutos ? `${serv.tempoEstimadoMinutos} min` : '--'}
                                </td>
                                <td className="p-4 text-right font-black text-orange-600 text-lg">
                                    R$ {formatarMoeda(serv.preco)}
                                </td>
                                <td className="p-4 text-center">
                                    {serv.ativo
                                        ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded uppercase text-[9px] font-black tracking-widest">Ativo</span>
                                        : <span className="bg-red-100 text-red-700 px-2 py-1 rounded uppercase text-[9px] font-black tracking-widest">Inativo</span>
                                    }
                                </td>
                                <td className="p-4 pr-6">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => abrirModalEditar(serv)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={16}/></button>
                                        <button onClick={() => alternarStatus(serv)} className={`p-2 rounded-lg transition-colors ${serv.ativo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                            {serv.ativo ? <Ban size={16}/> : <CheckCircle size={16}/>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE CADASTRO/EDIÇÃO */}
            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={salvarServico} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                                <Settings2 className="text-orange-500" /> {form.id ? 'EDITAR SERVIÇO' : 'NOVO SERVIÇO'}
                            </h2>
                            <button type="button" onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white uppercase text-xs font-bold tracking-widest">Fechar</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CÓD. (Opcional)</label>
                                    <input type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-sm font-bold outline-none focus:border-orange-500" placeholder="Ex: AL-01" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">NOME DO SERVIÇO *</label>
                                    <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-orange-500" placeholder="Ex: Alinhamento 3D" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12}/> DESCRIÇÃO / DETALHES</label>
                                <textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-500 min-h-[80px] resize-none" placeholder="O que está incluso neste serviço?"></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={12}/> PREÇO PADRÃO *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-orange-400">R$</span>
                                        <input type="number" step="0.01" required value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} className="w-full pl-10 pr-3 py-3 bg-white border-2 border-orange-200 rounded-xl font-black text-orange-800 outline-none focus:border-orange-500 text-lg" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={12}/> TEMPO ESTIMADO</label>
                                    <div className="relative">
                                        <input type="number" value={form.tempoEstimadoMinutos} onChange={e => setForm({...form, tempoEstimadoMinutos: e.target.value})} className="w-full pl-3 pr-12 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-slate-400 text-lg" placeholder="Ex: 45" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">MIN</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-start gap-2">
                                <ShieldAlert size={16} className="text-yellow-600 shrink-0 mt-0.5"/>
                                <p className="text-[10px] text-yellow-800 font-bold leading-tight uppercase tracking-wide">
                                    Este valor serve como base. Na hora da OS, o consultor poderá dar descontos ou alterar o valor livremente.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
                            <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-4 font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs">CANCELAR</button>
                            <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-black shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-colors uppercase tracking-widest text-xs">SALVAR CATÁLOGO</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};