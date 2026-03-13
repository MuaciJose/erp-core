import React, { useState, useEffect } from 'react';
import {
    Search, Plus, FileText, CheckCircle, Clock,
    Printer, ArrowLeft, Eye, X, User, Trash2, Edit, Lock, Wallet, Package
} from 'lucide-react';
import api from '../../api/axios';
import { OrcamentoPedido } from './OrcamentoPedido';
import { CupomReciboModal } from './CupomReciboModal';
import toast from 'react-hot-toast';

// 🚀 IMPORTANTE: Importe o componente da Nota Avulsa aqui! (Ajuste o caminho da pasta se precisar)
import EmitirNfeAvulsa from '../fiscal/EmitirNfeAvulsa';

export const GestaoVendas = ({ setPaginaAtiva }) => {
    const [telaAtual, setTelaAtual] = useState('LISTA'); // Pode ser: 'LISTA', 'NOVO', 'NOTA_FISCAL'
    const [busca, setBusca] = useState('');
    const [espelhoAberto, setEspelhoAberto] = useState(null);
    const [imprimirEspelho, setImprimirEspelho] = useState(false);
    const [listaVendas, setListaVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vendaParaEditar, setVendaParaEditar] = useState(null);

    // 🚀 ESTADO QUE GUARDA O PACOTE DA NOTA
    const [dadosParaAjusteFiscal, setDadosParaAjusteFiscal] = useState(null);

    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const carregarVendas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/vendas');
            if (Array.isArray(res.data)) {
                setListaVendas(res.data);
            } else if (res.data?.content && Array.isArray(res.data.content)) {
                setListaVendas(res.data.content);
            } else {
                setListaVendas([]);
            }
        } catch (error) {
            console.error("Erro ao carregar vendas:", error);
            if (typeof toast !== 'undefined') toast.error("Erro ao carregar lista de vendas.");
            setListaVendas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (telaAtual === 'LISTA') carregarVendas();
    }, [telaAtual]);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (espelhoAberto && !imprimirEspelho) {
                if (e.key === 'Escape') setEspelhoAberto(null);
                return;
            }
            if (telaAtual === 'LISTA') {
                if (e.key === 'F2') {
                    e.preventDefault();
                    document.getElementById('busca-vendas')?.focus();
                } else if (e.key === 'F3') {
                    e.preventDefault();
                    setTelaAtual('NOVO');
                    setVendaParaEditar(null);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [telaAtual, espelhoAberto, imprimirEspelho]);

    const vendasFiltradas = listaVendas.filter(v => {
        const idMatch = v.id?.toString().includes(busca);
        const clienteNome = v.cliente?.nome || v.cliente || "";
        const clienteMatch = clienteNome.toLowerCase().includes(busca.toLowerCase());
        const veiculoMatch = (v.veiculo?.modelo || "").toLowerCase().includes(busca.toLowerCase());
        return idMatch || clienteMatch || veiculoMatch;
    });

    const handleExcluir = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            try {
                await api.delete(`/api/vendas/${id}`);
                toast.success("Registro excluído com sucesso!");
                carregarVendas();
            } catch (error) { toast.error("Erro ao excluir registro."); }
        }
    };

    const handleReabrir = (venda) => {
        setVendaParaEditar(venda);
        setTelaAtual('NOVO');
    };

    const getBadgeStatus = (status) => {
        switch(status) {
            case 'ORCAMENTO': return <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><FileText size={12}/> Orçamento</span>;
            case 'PEDIDO': return <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><Package size={12}/> Pedido</span>;
            case 'AGUARDANDO_PAGAMENTO': return <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto animate-pulse"><Wallet size={12}/> Caixa</span>;
            case 'CONCLUIDA': return <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><CheckCircle size={12}/> Faturado</span>;
            default: return <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto">{status}</span>;
        }
    };

    // ==================================================================
    // 🚀 TELA 3 (NOVA): NOTA FISCAL AVULSA (Faturamento Assistido)
    // ==================================================================
    if (telaAtual === 'NOTA_FISCAL') {
        return (
            <div className="h-full bg-slate-100 relative z-[20]">
                {/* O componente da nota recebe os dados e a função de voltar */}
                <EmitirNfeAvulsa
                    dadosIniciais={dadosParaAjusteFiscal}
                    onVoltar={() => setTelaAtual('NOVO')}
                />
            </div>
        );
    }

    // ==================================================================
    // 🚀 TELA 1: BALCÃO (ORÇAMENTO/PEDIDO)
    // ==================================================================
    if (telaAtual === 'NOVO') {
        return (
            <div className="animate-fade-in flex flex-col h-full bg-white relative z-[10]">
                <div className="bg-slate-900 p-4 flex items-center gap-4 text-white print:hidden">
                    <div>
                        <h2 className="font-black text-lg tracking-widest">BALCÃO DE PEÇAS</h2>
                        <p className="text-xs text-slate-400">{vendaParaEditar ? `Acessando Documento #${vendaParaEditar.id}` : 'Criando novo Orçamento / Pedido'}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto relative z-[11] bg-white pt-6">
                    <OrcamentoPedido
                        orcamentoParaEditar={vendaParaEditar}
                        onVoltar={() => { setTelaAtual('LISTA'); setVendaParaEditar(null); }}
                        // 🚀 AQUI É ONDE A MÁGICA ACONTECE!
                        onIrParaNota={(dadosEmpacotados) => {
                            setDadosParaAjusteFiscal(dadosEmpacotados); // 1. Guarda os dados
                            setTelaAtual('NOTA_FISCAL'); // 2. Abre a tela da nota AQUI MESMO, em vez do menu principal
                        }}
                    />
                </div>
            </div>
        );
    }

    // ==================================================================
    // 🚀 TELA 2: LISTAGEM PRINCIPAL
    // ==================================================================
    return (
        <>
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-[90vh] animate-fade-in relative print:hidden">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><FileText className="text-blue-600 bg-blue-100 p-1.5 rounded-lg" size={36} /> CENTRAL DE VENDAS</h1>
                        <p className="text-slate-500 font-medium mt-1">Acompanhe o ciclo de Orçamentos, Pedidos, Caixa e Faturados.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setPaginaAtiva('recibo-avulso')}
                            className="bg-white text-slate-600 px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border-2 border-slate-200 shadow-sm"
                        >
                            <FileText size={20} className="text-blue-500" /> RECIBO AVULSO
                        </button>

                        <button
                            onClick={() => { setTelaAtual('NOVO'); setVendaParaEditar(null); }}
                            title="Atalho: F3"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all transform hover:scale-105"
                        >
                            <Plus size={24} /> NOVO ORÇAMENTO (F3)
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-t-3xl shadow-sm border border-slate-200 border-b-0 flex gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            id="busca-vendas"
                            type="text"
                            placeholder="Buscar por Nº, Cliente ou Veículo (F2)..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-700 border border-blue-200 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Orçamento</div>
                        <div className="px-3 py-1.5 bg-orange-50 rounded-lg text-xs font-bold text-orange-700 border border-orange-200 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Pedido</div>
                        <div className="px-3 py-1.5 bg-purple-50 rounded-lg text-xs font-bold text-purple-700 border border-purple-200 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Caixa</div>
                        <div className="px-3 py-1.5 bg-green-50 rounded-lg text-xs font-bold text-green-700 border border-green-200 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Faturado</div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-b-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 pl-6">Nº / Data</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Veículo</th>
                                <th className="p-4 text-center">Fase Atual</th>
                                <th className="p-4 text-right">Valor Total</th>
                                <th className="p-4 text-center pr-6">Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold animate-pulse">Carregando vendas...</td></tr>
                            ) : vendasFiltradas.length === 0 ? (
                                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold">Nenhum registo encontrado.</td></tr>
                            ) : (
                                vendasFiltradas.map((venda) => (
                                    <tr key={venda.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setEspelhoAberto(venda)}>
                                        <td className="p-4 pl-6">
                                            <p className="font-black text-slate-800 text-sm">#{venda.id}</p>
                                            <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(venda.dataHora).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-700 text-sm">{venda.cliente?.nome || venda.cliente || "Consumidor"}</p>
                                            <p className="text-xs text-slate-500">{venda.cliente?.documento || ""}</p>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-600">{venda.veiculo?.modelo || "Balcão"}</td>
                                        <td className="p-4 text-center">{getBadgeStatus(venda.status)}</td>
                                        <td className="p-4 text-right font-black text-slate-800 text-lg">
                                            R$ {formatarMoeda(venda.valorTotal)}
                                        </td>
                                        <td className="p-4 text-center pr-6">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEspelhoAberto(venda); }}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {venda.status !== 'CONCLUIDA' && venda.status !== 'AGUARDANDO_PAGAMENTO' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleReabrir(venda); }}
                                                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleExcluir(venda.id); }}
                                                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="p-2 text-slate-300 cursor-not-allowed">
                                                        <Lock size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* VISUALIZAÇÃO DO ESPELHO */}
            {espelhoAberto && !imprimirEspelho && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:hidden">
                    <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in relative">
                        <div className="bg-slate-900 p-6 flex justify-between items-end text-white border-b-4 border-blue-500">
                            <div>
                                <h2 className="text-3xl font-black tracking-widest uppercase">RESUMO DA VENDA</h2>
                                <p className="text-blue-300 font-bold mt-1 text-sm">Documento #{espelhoAberto.id} • {new Date(espelhoAberto.dataHora).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setImprimirEspelho(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2"
                                >
                                    <Printer size={20} /> IMPRIMIR
                                </button>
                                <button onClick={() => setEspelhoAberto(null)} title="Pressione Esc para fechar" className="bg-slate-800 p-3 rounded-xl text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Cliente</p>
                                    <p className="font-black text-lg">{espelhoAberto.cliente?.nome || espelhoAberto.cliente || "Consumidor"}</p>
                                    <p className="text-sm font-bold text-slate-500">{espelhoAberto.cliente?.documento || ""}</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Veículo / Vendedor</p>
                                    <p className="font-black text-lg">{espelhoAberto.veiculo?.modelo || "Balcão"}</p>
                                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1"><User size={14}/> {espelhoAberto.vendedorNome || "Administrador"}</p>
                                </div>
                            </div>
                            <table className="w-full bg-white rounded-xl shadow-sm border overflow-hidden">
                                <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-xs font-black uppercase">Descrição</th>
                                    <th className="p-3 text-center text-xs font-black uppercase">Qtd</th>
                                    <th className="p-3 text-right text-xs font-black uppercase">Vl. Unit</th>
                                    <th className="p-3 text-right text-xs font-black uppercase">Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(espelhoAberto.itens || []).map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-3 font-bold text-sm">{item.produto?.nome || item.nome}</td>
                                        <td className="p-3 text-center">{item.quantidade || item.qtd}</td>
                                        <td className="p-3 text-right">R$ {formatarMoeda(item.precoUnitario || item.preco)}</td>
                                        <td className="p-3 text-right font-black">R$ {formatarMoeda((item.precoUnitario || item.preco) * (item.quantidade || item.qtd))}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="mt-6 flex justify-end">
                                <div className="w-72 bg-slate-800 text-white p-5 rounded-2xl">
                                    <div className="flex justify-between py-1 text-sm border-b border-slate-700"><span className="text-slate-400">Subtotal:</span><span>R$ {formatarMoeda(espelhoAberto.valorSubtotal || espelhoAberto.subtotal)}</span></div>
                                    <div className="flex justify-between py-1 text-sm border-b border-slate-700"><span className="text-slate-400">Desconto:</span><span className="text-orange-400">- R$ {formatarMoeda(espelhoAberto.desconto)}</span></div>
                                    <div className="flex justify-between mt-3"><span className="font-black uppercase">Total:</span><span className="text-2xl font-black text-green-400">R$ {formatarMoeda(espelhoAberto.valorTotal || espelhoAberto.total)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {imprimirEspelho && espelhoAberto && (
                <CupomReciboModal
                    pedido={espelhoAberto}
                    onClose={() => setImprimirEspelho(false)}
                />
            )}
        </>
    );
};