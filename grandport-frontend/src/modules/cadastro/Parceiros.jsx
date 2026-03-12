import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, Plus, Search, Phone, MapPin, Building2, Edit, FileText, History, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { CriarParceiro } from './CriarParceiro';
import { ExtratoParceiro } from '../financeiro/ExtratoParceiro';
import { HistoricoClienteModal } from './HistoricoClienteModal';

export const Parceiros = () => {
    const [parceiros, setParceiros] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [parceiroEmEdicao, setParceiroEmEdicao] = useState(null);
    const [extratoAberto, setExtratoAberto] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('CLIENTE');
    const [clienteParaHistorico, setClienteParaHistorico] = useState(null);

    // 🚀 ESTADOS PARA PAGINAÇÃO
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 10;

    const carregarParceiros = async () => {
        try {
            const res = await api.get('/api/parceiros');
            setParceiros(res.data);
        } catch (error) {
            console.error("Erro ao carregar parceiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarParceiros(); }, []);

    // 🚀 Voltar para a página 1 ao buscar ou trocar de aba
    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, abaAtiva]);

    // 1. APLICA OS FILTROS (Aba e Busca)
    const filtrados = parceiros
        .filter(p => {
            if (abaAtiva === 'CLIENTE') return p.tipo === 'CLIENTE' || p.tipo === 'AMBOS';
            if (abaAtiva === 'FORNECEDOR') return p.tipo === 'FORNECEDOR' || p.tipo === 'AMBOS';
            return true;
        })
        .filter(p =>
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            (p.documento && p.documento.includes(busca)) ||
            (p.telefone && p.telefone.includes(busca))
        );

    // 2. APLICA A PAGINAÇÃO
    const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    const indiceFinal = indiceInicial + itensPorPagina;
    const parceirosPaginados = filtrados.slice(indiceInicial, indiceFinal);

    if (parceiroEmEdicao) {
        return <CriarParceiro
            parceiroParaEditar={parceiroEmEdicao}
            parceirosLista={parceiros}
            onSucesso={() => { setParceiroEmEdicao(null); carregarParceiros(); }}
            onCancelar={() => setParceiroEmEdicao(null)}
        />;
    }

    if (extratoAberto) {
        return <ExtratoParceiro clienteId={extratoAberto} onVoltar={() => setExtratoAberto(null)} />;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-gray-800">
                        <Users className="text-blue-600" size={32} />
                        Parceiros de Negócio
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerencie seus clientes, fornecedores e histórico financeiro.</p>
                </div>

                <button
                    onClick={() => setParceiroEmEdicao({})}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} /> Novo Parceiro
                </button>
            </div>

            {/* ÁREA DE BUSCA E ABAS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6 items-center">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setAbaAtiva('CLIENTE')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${abaAtiva === 'CLIENTE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        CLIENTES
                    </button>
                    <button
                        onClick={() => setAbaAtiva('FORNECEDOR')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${abaAtiva === 'FORNECEDOR' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        FORNECEDORES
                    </button>
                </div>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 font-bold">Carregando parceiros...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    <th className="p-4 font-black">Cadastro</th>
                                    <th className="p-4 font-black">Contato</th>
                                    <th className="p-4 font-black">Localidade</th>
                                    <th className="p-4 font-black">Financeiro</th>
                                    <th className="p-4 text-right font-black">Ações</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {parceirosPaginados.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">Nenhum parceiro encontrado.</td></tr>
                                ) : (
                                    parceirosPaginados.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">

                                            {/* COLUNA 1: IDENTIFICAÇÃO */}
                                            <td className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 p-2 rounded-lg ${p.tipo === 'FORNECEDOR' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{p.nome}</p>
                                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.documento || 'Sem documento'}</p>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${p.tipo === 'FORNECEDOR' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                                {p.tipo}
                                                            </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* COLUNA 2: CONTATO */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                        <Phone size={14} className="text-slate-400"/> {p.telefone || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[150px]" title={p.email}>
                                                        <Mail size={14} className="text-slate-400"/> {p.email || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* COLUNA 3: LOCALIDADE */}
                                            <td className="p-4">
                                                <div className="flex items-start gap-1.5 text-xs font-medium text-slate-600">
                                                    <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0"/>
                                                    <span className="line-clamp-2 leading-tight">
                                                            {p.endereco?.cidade ? `${p.endereco.cidade} - ${p.endereco.estado}` : 'Endereço não informado'}
                                                        </span>
                                                </div>
                                            </td>

                                            {/* COLUNA 4: FINANCEIRO RÁPIDO */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Devedor</span>
                                                    <span className={`text-sm font-black ${p.saldoDevedor > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                            R$ {p.saldoDevedor?.toFixed(2) || '0.00'}
                                                        </span>
                                                </div>
                                            </td>

                                            {/* COLUNA 5: AÇÕES */}
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {p.tipo !== 'FORNECEDOR' && (
                                                        <button onClick={() => setClienteParaHistorico(p)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm" title="Histórico de Compras">
                                                            <History size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setExtratoAberto(p.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm" title="Extrato Financeiro">
                                                        <FileText size={16} />
                                                    </button>
                                                    <button onClick={() => setParceiroEmEdicao(p)} className="p-2 bg-slate-800 border border-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors shadow-sm" title="Editar Parceiro">
                                                        <Edit size={16} />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* 🚀 RODAPÉ DE PAGINAÇÃO */}
                        {filtrados.length > 0 && (
                            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <span className="text-xs font-bold text-slate-500">
                                    Mostrando do {indiceInicial + 1} até {Math.min(indiceFinal, filtrados.length)} de {filtrados.length} parceiros
                                </span>

                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-600">Página {paginaAtual} de {totalPaginas}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                                            disabled={paginaAtual === 1}
                                            className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
                                        >
                                            <ChevronLeft size={16} className="text-slate-600"/>
                                        </button>
                                        <button
                                            onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                                            disabled={paginaAtual === totalPaginas}
                                            className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
                                        >
                                            <ChevronRight size={16} className="text-slate-600"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {clienteParaHistorico && (
                <HistoricoClienteModal
                    cliente={clienteParaHistorico}
                    onClose={() => setClienteParaHistorico(null)}
                />
            )}
        </div>
    );
};