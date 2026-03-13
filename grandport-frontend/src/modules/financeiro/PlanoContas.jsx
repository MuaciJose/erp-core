import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Folder, FolderOpen, FileText, Plus, ChevronRight,
    ChevronDown, Layers, Loader2, CheckCircle, Keyboard,
    ArrowLeft, Save, AlertCircle, Edit2, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PlanoContas = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🚀 ESTADOS DE FLUXO E FORMULÁRIO
    const [modoAtual, setModoAtual] = useState('LISTA'); // LISTA ou FORMULARIO
    const [processando, setProcessando] = useState(false);

    const [contaPaiSelecionada, setContaPaiSelecionada] = useState(null);
    const [contaEmEdicao, setContaEmEdicao] = useState(null); // NOVO: Guarda a conta sendo editada

    const [form, setForm] = useState({
        descricao: '',
        tipo: 'DESPESA',
        aceitaLancamento: true
    });

    // ESTADOS DE NAVEGAÇÃO NINJA
    const [indexFocado, setIndexFocado] = useState(-1);

    // =======================================================================
    // BUSCA DE DADOS
    // =======================================================================
    const carregarContas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/planocontas');
            const formatarContas = (lista) => lista.map(c => ({
                ...c,
                expandido: true,
                filhas: c.filhas ? formatarContas(c.filhas) : []
            }));
            setContas(formatarContas(res.data));
        } catch (error) {
            toast.error("Erro ao carregar plano de contas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (modoAtual === 'LISTA') carregarContas();
    }, [modoAtual]);

    // =======================================================================
    // LÓGICA DE ÁRVORE ACHATADA
    // =======================================================================
    const getNosVisiveis = (lista, nivel = 0) => {
        let visiveis = [];
        lista.forEach(conta => {
            visiveis.push({ ...conta, nivel });
            if (conta.expandido && conta.filhas && conta.filhas.length > 0) {
                visiveis = visiveis.concat(getNosVisiveis(conta.filhas, nivel + 1));
            }
        });
        return visiveis;
    };

    const nosVisiveis = getNosVisiveis(contas);

    const toggleExpandir = (id, listaAtual) => {
        return listaAtual.map(conta => {
            if (conta.id === id) return { ...conta, expandido: !conta.expandido };
            if (conta.filhas && conta.filhas.length > 0) {
                return { ...conta, filhas: toggleExpandir(id, conta.filhas) };
            }
            return conta;
        });
    };

    const handleToggle = (id) => {
        setContas(prevContas => toggleExpandir(id, prevContas));
    };

    // =======================================================================
    // TRANSIÇÕES E SALVAMENTO (CRIAR E EDITAR)
    // =======================================================================
    const abrirNovaConta = (pai = null) => {
        setContaEmEdicao(null); // Garante que não é edição
        setContaPaiSelecionada(pai);
        setForm({
            descricao: '',
            tipo: pai ? pai.tipo : 'DESPESA',
            aceitaLancamento: true
        });
        setModoAtual('FORMULARIO');
    };

    const abrirEdicaoConta = (conta) => {
        setContaEmEdicao(conta); // Marca que estamos editando
        setContaPaiSelecionada(null);
        setForm({
            descricao: conta.descricao,
            tipo: conta.tipo,
            aceitaLancamento: conta.aceitaLancamento
        });
        setModoAtual('FORMULARIO');
    };

    const voltarParaLista = () => {
        setModoAtual('LISTA');
        setContaEmEdicao(null);
        setIndexFocado(-1);
    };

    const salvarConta = async () => {
        if (!form.descricao.trim()) return toast.error("A descrição é obrigatória.");

        setProcessando(true);
        const toastId = toast.loading(contaEmEdicao ? "Atualizando conta..." : "Salvando estrutura...");

        try {
            const payload = {
                descricao: form.descricao,
                tipo: form.tipo,
                aceitaLancamento: form.aceitaLancamento,
                contaPaiId: contaPaiSelecionada ? contaPaiSelecionada.id : null
            };

            if (contaEmEdicao) {
                await api.put(`/api/planocontas/${contaEmEdicao.id}`, payload);
                toast.success("Conta atualizada!", { id: toastId });
            } else {
                await api.post('/api/planocontas', payload);
                toast.success("Conta criada!", { id: toastId });
            }

            voltarParaLista();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar conta.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    // =======================================================================
    // EXCLUSÃO
    // =======================================================================
    const excluirConta = async (conta) => {
        if (conta.filhas && conta.filhas.length > 0) {
            return toast.error("Não é possível excluir uma pasta que contém subcontas dentro.");
        }

        if (!window.confirm(`ATENÇÃO!\n\nTem certeza que deseja excluir a conta:\n${conta.codigo} - ${conta.descricao}?`)) {
            return;
        }

        const toastId = toast.loading("Excluindo conta...");
        try {
            await api.delete(`/api/planocontas/${conta.id}`);
            toast.success("Conta excluída com sucesso!", { id: toastId });
            carregarContas();
            setIndexFocado(-1);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao excluir. Conta pode estar em uso no financeiro.", { id: toastId });
        }
    };

    // =======================================================================
    // 🚀 ATALHOS DE TECLADO (MODO NINJA)
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modoAtual === 'FORMULARIO') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    voltarParaLista();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!processando) salvarConta();
                }
                return;
            }

            if (modoAtual === 'LISTA') {
                const isInputFocused = document.activeElement.tagName === 'INPUT';
                if (isInputFocused) return;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setIndexFocado(prev => Math.min(nosVisiveis.length - 1, prev + 1));
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        setIndexFocado(prev => Math.max(0, prev - 1));
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (indexFocado >= 0 && nosVisiveis[indexFocado]) {
                            const noAtual = nosVisiveis[indexFocado];
                            if (noAtual.filhas?.length > 0 && !noAtual.expandido) handleToggle(noAtual.id);
                        }
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (indexFocado >= 0 && nosVisiveis[indexFocado]) {
                            const noAtual = nosVisiveis[indexFocado];
                            if (noAtual.expandido) handleToggle(noAtual.id);
                        }
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (indexFocado >= 0 && nosVisiveis[indexFocado]) abrirNovaConta(nosVisiveis[indexFocado]);
                        break;
                    case 'e':
                    case 'E':
                        e.preventDefault();
                        if (indexFocado >= 0 && nosVisiveis[indexFocado]) abrirEdicaoConta(nosVisiveis[indexFocado]);
                        break;
                    case 'Delete':
                        e.preventDefault();
                        if (indexFocado >= 0 && nosVisiveis[indexFocado]) excluirConta(nosVisiveis[indexFocado]);
                        break;
                    case 'n':
                    case 'N':
                        e.preventDefault();
                        abrirNovaConta(null);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        setIndexFocado(-1);
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================

    if (modoAtual === 'LISTA') {
        if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400"><Loader2 className="animate-spin mr-2"/> MONTANDO ESTRUTURA...</div>;

        return (
            <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div title="Estrutura hierárquica das finanças">
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Layers className="text-purple-600 bg-purple-100 p-2 rounded-xl" size={40} />
                            Plano de Contas
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Classificação hierárquica oficial de receitas e despesas.</p>
                    </div>
                    <button
                        onClick={() => abrirNovaConta(null)}
                        title="Atalho: Pressione 'N'"
                        className="w-full md:w-auto bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-purple-600 transition-all shadow-lg hover:-translate-y-1 transform"
                    >
                        <Plus size={20} /> NOVO GRUPO (N)
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-slate-100 p-3 rounded-xl mb-6 text-xs font-bold text-slate-500 border border-slate-200">
                    <Keyboard size={16} className="text-slate-400" />
                    <span><kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">↓</kbd> Navegar</span>
                    <span><kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">→</kbd> <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">←</kbd> Abrir/Fechar Pasta</span>
                    <span><kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">Enter</kbd> Nova Subconta</span>
                    <span><kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">E</kbd> Editar</span>
                    <span><kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">Del</kbd> Excluir</span>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 flex text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                        <div className="flex-1 pl-12">Estrutura / Código / Descrição</div>
                        <div className="w-56 text-right pr-6">Propriedades / Ações</div>
                    </div>

                    <div className="flex flex-col">
                        {nosVisiveis.length === 0 ? (
                            <div className="p-16 text-center text-slate-400 font-bold flex flex-col items-center">
                                <CheckCircle size={48} className="text-slate-300 mb-4 opacity-50" />
                                Nenhum grupo cadastrado. Comece criando um Novo Grupo.
                            </div>
                        ) : (
                            nosVisiveis.map((conta, index) => {
                                const isFocado = index === indexFocado;
                                const temFilhas = conta.filhas && conta.filhas.length > 0;
                                const isNivelZero = conta.nivel === 0;

                                return (
                                    <div
                                        key={conta.id}
                                        onClick={() => setIndexFocado(index)}
                                        onDoubleClick={() => abrirEdicaoConta(conta)}
                                        className={`flex items-center justify-between p-3 border-b border-slate-100 transition-colors cursor-pointer group 
                                            ${isNivelZero ? 'bg-slate-50/50' : 'bg-white'} 
                                            ${isFocado ? 'bg-purple-50 border-l-4 border-l-purple-500 shadow-sm relative z-10' : 'border-l-4 border-l-transparent hover:bg-slate-50'}
                                        `}
                                        style={{ paddingLeft: `${(conta.nivel * 2) + 1}rem` }}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-6 flex justify-center">
                                                {temFilhas && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleToggle(conta.id); }}
                                                        className="text-slate-400 hover:text-purple-600 transition-colors p-1"
                                                    >
                                                        {conta.expandido ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
                                                    </button>
                                                )}
                                            </div>
                                            <div className={`${conta.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'}`}>
                                                {temFilhas ? (
                                                    conta.expandido ? <FolderOpen size={20} className="fill-current opacity-20"/> : <Folder size={20} className="fill-current opacity-20"/>
                                                ) : (
                                                    <FileText size={18} className="text-slate-400"/>
                                                )}
                                            </div>
                                            <span className="font-mono text-sm font-bold text-slate-500 w-16">{conta.codigo}</span>
                                            <span className={`text-slate-700 truncate ${isNivelZero ? 'font-black uppercase tracking-wider' : 'font-bold'}`}>
                                                {conta.descricao}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!conta.aceitaLancamento ? (
                                                <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-1 rounded font-black uppercase tracking-widest mr-2">Sintético</span>
                                            ) : (
                                                <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-black uppercase tracking-widest mr-2">Lançamento</span>
                                            )}

                                            <div className={`flex gap-1 transition-all ${isFocado ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); abrirNovaConta(conta); }}
                                                    className="p-1.5 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white transition-colors"
                                                    title="Adicionar Subconta (Enter)"
                                                >
                                                    <Plus size={16} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); abrirEdicaoConta(conta); }}
                                                    className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-blue-500 hover:text-white transition-colors"
                                                    title="Editar (E)"
                                                >
                                                    <Edit2 size={16} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); excluirConta(conta); }}
                                                    className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Excluir (Del)"
                                                >
                                                    <Trash2 size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (modoAtual === 'FORMULARIO') {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} title="Atalho: Esc" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-purple-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Árvore (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-purple-600">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Layers className="text-purple-600" size={32} />
                            {contaEmEdicao ? 'Editar Conta' : (contaPaiSelecionada ? 'Nova Subconta' : 'Novo Grupo Principal')}
                        </h2>

                        {!contaEmEdicao && contaPaiSelecionada && (
                            <p className="text-sm font-bold text-slate-500 mt-2">
                                Criando uma conta dentro de: <span className="text-purple-600 uppercase tracking-widest ml-1">{contaPaiSelecionada.codigo} - {contaPaiSelecionada.descricao}</span>
                            </p>
                        )}
                        {contaEmEdicao && (
                            <p className="text-sm font-bold text-slate-500 mt-2">Editando os dados desta conta.</p>
                        )}
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6 md:col-span-2">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descrição da Conta</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={form.descricao}
                                    onChange={e => setForm({...form, descricao: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 outline-none font-black text-slate-800 text-lg"
                                    placeholder="Ex: Material de Limpeza, Receita de Vendas..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Natureza da Conta</label>
                            <select
                                value={form.tipo}
                                onChange={e => setForm({...form, tipo: e.target.value})}
                                disabled={!!contaPaiSelecionada || (contaEmEdicao && contaEmEdicao.nivel > 0)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 outline-none font-bold text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="RECEITA">ENTRADA (Receita)</option>
                                <option value="DESPESA">SAÍDA (Despesa)</option>
                            </select>
                            {(contaPaiSelecionada || (contaEmEdicao && contaEmEdicao.nivel > 0)) && (
                                <p className="text-[10px] text-purple-600 font-bold mt-2 flex items-center gap-1">
                                    <AlertCircle size={12}/> A natureza é obrigatória e herdada do grupo pai.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Comportamento</label>
                            <div
                                onClick={() => setForm({...form, aceitaLancamento: !form.aceitaLancamento})}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${form.aceitaLancamento ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <div>
                                    <p className={`font-black text-sm ${form.aceitaLancamento ? 'text-blue-700' : 'text-slate-600'}`}>Aceita Lançamento (Analítica)</p>
                                    <p className={`text-[10px] font-bold mt-1 ${form.aceitaLancamento ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {form.aceitaLancamento ? 'Pode receber valores.' : 'Apenas uma pasta agrupardora.'}
                                    </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${form.aceitaLancamento ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-transparent'}`}>
                                    {form.aceitaLancamento && <CheckCircle size={14} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={salvarConta}
                            disabled={processando}
                            title="Atalho: Ctrl + Enter"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <Save size={32}/>}
                            {contaEmEdicao ? 'ATUALIZAR CONTA (Ctrl+Enter)' : 'SALVAR NA ESTRUTURA (Ctrl+Enter)'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};