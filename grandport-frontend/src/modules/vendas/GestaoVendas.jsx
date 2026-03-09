import React, { useState, useEffect } from 'react';
import {
    Search, Plus, FileText, CheckCircle, Clock,
    Printer, ArrowLeft, Eye, X, ScrollText, User, Trash2, Edit, Lock, Wallet, Package
} from 'lucide-react';
import api from '../../api/axios';
import { OrcamentoPedido } from './OrcamentoPedido';
import { CupomReciboModal } from './CupomReciboModal';

// 🚀 ADICIONADA A PROP setPaginaAtiva PARA O BOTÃO DE RECIBO FUNCIONAR
export const GestaoVendas = ({ setPaginaAtiva }) => {
    const [telaAtual, setTelaAtual] = useState('LISTA');
    const [busca, setBusca] = useState('');
    const [espelhoAberto, setEspelhoAberto] = useState(null);
    const [imprimirEspelho, setImprimirEspelho] = useState(false);
    const [listaVendas, setListaVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vendaParaEditar, setVendaParaEditar] = useState(null);

    const carregarVendas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/vendas');
            const formatadas = res.data.map(v => ({
                id: v.id,
                dataHora: v.dataHora,
                cliente: v.cliente ? v.cliente.nome : 'Consumidor Final',
                documento: v.cliente ? v.cliente.documento : '',
                veiculo: v.veiculo ? `${v.veiculo.marca} ${v.veiculo.modelo} ${v.veiculo.placa ? `(${v.veiculo.placa})` : ''}`.trim() : 'Nenhum',
                veiculoObj: v.veiculo || null,
                total: v.valorTotal || 0,
                subtotal: v.valorSubtotal || 0,
                desconto: v.desconto || 0,
                status: v.status,
                vendedor: v.vendedorNome || 'Sistema',
                metodoPagamento: v.pagamentos && v.pagamentos.length > 0 ? v.pagamentos[0].metodo : 'NÃO PAGO',
                itens: (v.itens || []).map(i => ({
                    produtoId: i.produto?.id,
                    id: i.produto?.id,
                    codigo: i.produto?.sku || 'N/A',
                    nome: i.produto?.nome || 'Produto Removido',
                    qtd: i.quantidade || 0,
                    preco: i.precoUnitario || 0
                }))
            }));
            setListaVendas(formatadas);
        } catch (error) {
            console.error("Erro ao carregar vendas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (telaAtual === 'LISTA') carregarVendas();
    }, [telaAtual]);

    const vendasFiltradas = listaVendas.filter(v =>
        v.id.toString().includes(busca) ||
        v.cliente.toLowerCase().includes(busca.toLowerCase()) ||
        v.veiculo.toLowerCase().includes(busca.toLowerCase())
    );

    const handleExcluir = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            try {
                await api.delete(`/api/vendas/${id}`);
                alert("Registro excluído com sucesso!");
                carregarVendas();
            } catch (error) { alert("Erro ao excluir registro."); }
        }
    };

    const handleReabrir = (venda) => {
        setVendaParaEditar(venda);
        setTelaAtual('NOVO');
    };

    const getBadgeStatus = (status) => {
        switch(status) {
            case 'ORCAMENTO':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><FileText size={12}/> Orçamento</span>;
            case 'PEDIDO':
                return <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><Package size={12}/> Pedido</span>;
            case 'AGUARDANDO_PAGAMENTO':
                return <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto animate-pulse"><Wallet size={12}/> Caixa</span>;
            case 'CONCLUIDA':
                return <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto"><CheckCircle size={12}/> Faturado</span>;
            default:
                return <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1 w-max mx-auto">{status}</span>;
        }
    };

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
                    <OrcamentoPedido orcamentoParaEditar={vendaParaEditar} onVoltar={() => { setTelaAtual('LISTA'); setVendaParaEditar(null); }} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-[90vh] animate-fade-in relative print:hidden">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3"><FileText className="text-blue-600 bg-blue-100 p-1.5 rounded-lg" size={36} /> CENTRAL DE VENDAS</h1>
                        <p className="text-slate-500 font-medium mt-1">Acompanhe o ciclo de Orçamentos, Pedidos, Caixa e Faturados.</p>
                    </div>

                    <div className="flex gap-4">
                        {/* 🚀 NOVO BOTÃO DE ATALHO PARA O RECIBO MANUAL */}
                        <button
                            onClick={() => setPaginaAtiva('recibo-avulso')}
                            title="Emitir um recibo manual ou avulso rapidamente"
                            className="bg-white text-slate-600 px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border-2 border-slate-200 shadow-sm"
                        >
                            <FileText size={20} className="text-blue-500" /> RECIBO AVULSO
                        </button>

                        <button
                            onClick={() => { setTelaAtual('NOVO'); setVendaParaEditar(null); }}
                            title="Abrir a tela de balcão para iniciar um novo atendimento"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all transform hover:scale-105"
                        >
                            <Plus size={24} /> NOVO ORÇAMENTO / VENDA
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-t-3xl shadow-sm border border-slate-200 border-b-0 flex gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por Nº, Cliente ou Veículo..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-700 border border-blue-200 flex items-center gap-1" title="Legenda: Documentos em fase de orçamento"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Orçamento</div>
                        <div className="px-3 py-1.5 bg-orange-50 rounded-lg text-xs font-bold text-orange-700 border border-orange-200 flex items-center gap-1" title="Legenda: Orçamentos aprovados aguardando separação"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Pedido</div>
                        <div className="px-3 py-1.5 bg-purple-50 rounded-lg text-xs font-bold text-purple-700 border border-purple-200 flex items-center gap-1" title="Legenda: Pedidos prontos para pagamento no caixa"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Caixa</div>
                        <div className="px-3 py-1.5 bg-green-50 rounded-lg text-xs font-bold text-green-700 border border-green-200 flex items-center gap-1" title="Legenda: Vendas finalizadas e recebidas"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Faturado</div>
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
                                            <p className="font-bold text-slate-700 text-sm">{venda.cliente}</p>
                                            <p className="text-xs text-slate-500">{venda.documento}</p>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-600">{venda.veiculo}</td>
                                        <td className="p-4 text-center">{getBadgeStatus(venda.status)}</td>
                                        <td className="p-4 text-right font-black text-slate-800 text-lg">R$ {venda.total.toFixed(2)}</td>
                                        <td className="p-4 text-center pr-6">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEspelhoAberto(venda); }}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                                    title="Visualizar resumo e itens do documento"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {venda.status !== 'CONCLUIDA' && venda.status !== 'AGUARDANDO_PAGAMENTO' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleReabrir(venda); }}
                                                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                            title="Reabrir este documento na tela de balcão para edição"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleExcluir(venda.id); }}
                                                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                                            title="Excluir permanentemente este registro"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="p-2 text-slate-300 cursor-not-allowed" title="Alterações bloqueadas para documentos em fase de caixa ou faturados">
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

            {/* VISUALIZAÇÃO DO ESPELHO NA TELA */}
            {espelhoAberto && !imprimirEspelho && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:hidden">
                    <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in relative">
                        <div className="bg-slate-900 p-6 flex justify-between items-end text-white border-b-4 border-blue-500">
                            <div>
                                <h2 className="text-3xl font-black tracking-widest uppercase">REIMPRESSÂO DO DOCUMENTO</h2>
                                <p className="text-blue-300 font-bold mt-1 text-sm">Documento #{espelhoAberto.id} • Emitido em: {new Date(espelhoAberto.dataHora).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setImprimirEspelho(true)}
                                    title="Abrir opções de impressão (A4 ou Cupom)"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
                                >
                                    <Printer size={20} /> IMPRIMIR {espelhoAberto.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'CUPOM'}
                                </button>
                                <button
                                    onClick={() => setEspelhoAberto(null)}
                                    title="Fechar visualização"
                                    className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dados do Cliente</p>
                                    <p className="font-black text-lg text-slate-800">{espelhoAberto.cliente}</p>
                                    <p className="text-sm font-bold text-slate-500">CPF/CNPJ: {espelhoAberto.documento}</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Aplicação</p>
                                    <p className="font-black text-lg text-slate-800">{espelhoAberto.veiculo}</p>
                                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1"><User size={14}/> Vendedor: {espelhoAberto.vendedor}</p>
                                </div>
                            </div>
                            <table className="w-full text-left bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-600">Código</th>
                                    <th className="py-3 px-4 text-xs font-black uppercase text-slate-600">Descrição</th>
                                    <th className="py-3 px-4 text-center text-xs font-black uppercase text-slate-600">Qtd</th>
                                    <th className="py-3 px-4 text-right text-xs font-black uppercase text-slate-600">Vl. Unit</th>
                                    <th className="py-3 px-4 text-right text-xs font-black uppercase text-slate-600">Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(espelhoAberto.itens || []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.codigo}</td>
                                        <td className="py-3 px-4 font-bold text-slate-800 text-sm">{item.nome}</td>
                                        <td className="py-3 px-4 text-center font-bold text-slate-800">{item.qtd}</td>
                                        <td className="py-3 px-4 text-right text-sm text-slate-600">R$ {(item.preco || 0).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-black text-slate-800">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="mt-6 flex justify-end">
                                <div className="w-72 bg-slate-800 text-white p-5 rounded-2xl shadow-xl">
                                    <div className="flex justify-between border-b border-slate-700 py-1 text-sm"><span className="text-slate-400 font-bold">Subtotal:</span><span>R$ {(espelhoAberto.subtotal || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between border-b border-slate-700 py-1 text-sm"><span className="text-slate-400 font-bold">Desconto:</span><span className="text-orange-400">- R$ {(espelhoAberto.desconto || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between mt-3"><span className="text-lg font-black uppercase text-slate-400">Total:</span><span className="text-2xl font-black text-green-400">R$ {(espelhoAberto.total || 0).toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHAMA O MODAL INTELIGENTE DE IMPRESSÃO */}
            {imprimirEspelho && espelhoAberto && (
                <CupomReciboModal
                    pedido={{
                        ...espelhoAberto,
                        valorSubtotal: espelhoAberto.subtotal,
                        valorTotal: espelhoAberto.total,
                        vendedorNome: espelhoAberto.vendedor
                    }}
                    onClose={() => setImprimirEspelho(false)}
                />
            )}
        </>
    );
};