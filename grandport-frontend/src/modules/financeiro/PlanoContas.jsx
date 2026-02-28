import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Folder, FolderOpen, FileText, Plus, ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { ModalNovoPlanoConta } from './ModalNovoPlanoConta';

export const PlanoContas = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [contaPaiSelecionada, setContaPaiSelecionada] = useState(null);

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
            console.error("Erro ao carregar plano de contas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarContas(); }, []);

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
        setContas(toggleExpandir(id, contas));
    };

    const abrirModal = (pai = null) => {
        setContaPaiSelecionada(pai);
        setModalAberto(true);
    };

    const RenderizarConta = ({ conta, nivel = 0 }) => {
        const temFilhas = conta.filhas && conta.filhas.length > 0;
        
        return (
            <div className="w-full">
                <div 
                    className={`flex items-center justify-between p-3 border-b hover:bg-slate-50 transition-colors ${nivel === 0 ? 'bg-slate-100 font-black' : ''}`}
                    style={{ paddingLeft: `${nivel * 2}rem` }}
                >
                    <div className="flex items-center gap-3">
                        {temFilhas ? (
                            <button onClick={() => handleToggle(conta.id)} className="text-slate-400 hover:text-blue-600">
                                {conta.expandido ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>
                        ) : (
                            <div className="w-5"></div>
                        )}

                        <div className={`${conta.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                            {temFilhas ? (conta.expandido ? <FolderOpen size={20}/> : <Folder size={20}/>) : <FileText size={18} className="text-slate-400"/>}
                        </div>

                        <span className="font-mono text-sm text-slate-500 w-12">{conta.codigo}</span>
                        <span className={`text-slate-700 ${nivel === 0 ? 'uppercase' : ''}`}>{conta.descricao}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {!conta.aceitaLancamento && <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Grupo Sintético</span>}
                        {conta.aceitaLancamento && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold uppercase tracking-widest">Aceita Lançamento</span>}
                        
                        <button 
                            onClick={() => abrirModal(conta)}
                            className="text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors" 
                            title="Adicionar Subconta"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                {temFilhas && conta.expandido && (
                    <div className="w-full">
                        {conta.filhas.map(filha => (
                            <RenderizarConta key={filha.id} conta={filha} nivel={nivel + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center font-bold text-gray-500">Carregando estrutura...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Layers className="text-purple-600 bg-purple-100 p-1 rounded-lg" size={36} /> 
                        PLANO DE CONTAS
                    </h1>
                    <p className="text-slate-500 mt-1">Classificação hierárquica de receitas e despesas</p>
                </div>
                <button 
                    onClick={() => abrirModal(null)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Plus size={20} /> NOVO GRUPO PRINCIPAL
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b flex text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex-1 ml-16">Estrutura e Descrição</div>
                    <div className="w-48 text-right pr-8">Propriedades</div>
                </div>
                
                <div className="flex flex-col">
                    {contas.map(conta => (
                        <RenderizarConta key={conta.id} conta={conta} />
                    ))}
                    {contas.length === 0 && (
                        <div className="p-12 text-center text-gray-400 italic">Nenhuma conta cadastrada.</div>
                    )}
                </div>
            </div>

            {modalAberto && (
                <ModalNovoPlanoConta 
                    contaPai={contaPaiSelecionada}
                    onClose={() => setModalAberto(false)}
                    onSuccess={carregarContas}
                />
            )}
        </div>
    );
};
