import React, { useState, useEffect } from 'react';
import {
    Search, Plus, FileText, CheckCircle, Clock,
    Printer, ArrowLeft, Eye, X, ScrollText, User, Trash2, Edit
} from 'lucide-react';
import api from '../../api/axios';
import { OrcamentoPedido } from './OrcamentoPedido';

export const GestaoVendas = () => {
    const [telaAtual, setTelaAtual] = useState('LISTA');
    const [busca, setBusca] = useState('');
    const [espelhoAberto, setEspelhoAberto] = useState(null);
    const [formatoImpressao, setFormatoImpressao] = useState('BOBINA');
    const [listaVendas, setListaVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vendaParaEditar, setVendaParaEditar] = useState(null);

    const carregarVendas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/vendas/orcamentos');
            const formatadas = res.data.map(v => ({
                id: v.id,
                data: v.dataHora,
                cliente: v.cliente ? v.cliente.nome : 'Consumidor Final',
                documento: v.cliente ? v.cliente.documento : '',
                veiculo: v.veiculo ? `${v.veiculo.marca} ${v.veiculo.modelo} (${v.veiculo.placa})` : 'Nenhum',
                total: v.valorTotal || 0,
                subtotal: v.valorSubtotal || 0,
                desconto: v.desconto || 0,
                status: v.status === 'ORCAMENTO' ? 'PENDENTE' : 'APROVADO',
                tipo: v.status,
                vendedor: v.vendedorNome || 'Sistema',
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

    const handleImprimirEspelho = () => {
        window.print();
    };

    const handleExcluir = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este registro?")) {
            try {
                await api.delete(`/api/vendas/${id}`);
                alert("Registro excluído com sucesso!");
                carregarVendas();
            } catch (error) {
                alert("Erro ao excluir registro.");
            }
        }
    };

    const handleReabrir = (venda) => {
        setVendaParaEditar(venda);
        setTelaAtual('NOVO');
    };

    if (telaAtual === 'NOVO') {
        return (
            <div className="animate-fade-in flex flex-col h-full print:bg-white">
                <div className="bg-slate-900 p-4 flex items-center gap-4 text-white print:hidden">
                    <button
                        onClick={() => { setTelaAtual('LISTA'); setVendaParaEditar(null); }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-2 font-bold transition-colors"
                    >
                        <ArrowLeft size={20} /> VOLTAR PARA A LISTA
                    </button>
                    <div>
                        <h2 className="font-black text-lg tracking-widest">BALCÃO DE PEÇAS</h2>
                        <p className="text-xs text-slate-400">{vendaParaEditar ? `Editando Orçamento #${vendaParaEditar.id}` : 'Criando novo Orçamento / Pedido'}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto print:overflow-visible">
                    <OrcamentoPedido
                        orcamentoParaEditar={vendaParaEditar}
                        onVoltar={() => { setTelaAtual('LISTA'); setVendaParaEditar(null); }}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ========================================================= */}
            {/* TELA PRINCIPAL (TUDO ISSO SOME NA IMPRESSÃO)              */}
            {/* ========================================================= */}
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-[90vh] animate-fade-in relative print:hidden">

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <FileText className="text-blue-600 bg-blue-100 p-1.5 rounded-lg" size={36} />
                            CENTRAL DE VENDAS
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Gerencie orçamentos abertos e pedidos faturados.</p>
                    </div>
                    <button
                        onClick={() => { setTelaAtual('NOVO'); setVendaParaEditar(null); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all transform hover:scale-105"
                    >
                        <Plus size={24} /> NOVO ORÇAMENTO / VENDA
                    </button>
                </div>

                <div className="bg-white p-6 rounded-t-3xl shadow-sm border border-slate-200 border-b-0 flex gap-4 items-center">
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
                        <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-600 border border-slate-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-400"></span> Todos
                        </div>
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
                                <th className="p-4 text-center">Tipo</th>
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
                                            <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(venda.data || Date.now()).toLocaleDateString('pt-BR')}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-700 text-sm">{venda.cliente}</p>
                                            <p className="text-xs text-slate-500">{venda.documento}</p>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-600">{venda.veiculo}</td>
                                        <td className="p-4 text-center">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1 w-max mx-auto ${venda.tipo === 'ORCAMENTO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {venda.tipo === 'ORCAMENTO' ? <FileText size={12}/> : <CheckCircle size={12}/>} {venda.tipo}
                                                </span>
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-800 text-lg">R$ {venda.total.toFixed(2)}</td>
                                        <td className="p-4 text-center pr-6">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEspelhoAberto(venda); }}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                                    title="Ver Espelho"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {venda.tipo === 'ORCAMENTO' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReabrir(venda); }}
                                                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                        title="Reabrir Orçamento"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleExcluir(venda.id); }}
                                                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL DO ESPELHO (VISUALIZAÇÃO NORMAL) - TAMBÉM SOME NA IMPRESSÃO */}
                {espelhoAberto && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:hidden">
                        <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in relative">

                            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white p-2 rounded-2xl shadow-xl z-50 border border-slate-200">
                                <button onClick={() => setFormatoImpressao('BOBINA')} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${formatoImpressao === 'BOBINA' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                    <ScrollText size={18} /> Bobina Térmica
                                </button>
                                <button onClick={() => setFormatoImpressao('A4')} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${formatoImpressao === 'A4' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                    <FileText size={18} /> Folha A4
                                </button>
                            </div>

                            <div className="bg-slate-900 p-6 pt-20 flex justify-between items-end text-white border-b-4 border-blue-500">
                                <div>
                                    <h2 className="text-3xl font-black tracking-widest uppercase">ESPELHO DO {espelhoAberto.tipo}</h2>
                                    <p className="text-blue-300 font-bold mt-1 text-sm">Documento #{espelhoAberto.id} • Emitido em: {new Date(espelhoAberto.data).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleImprimirEspelho} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all transform hover:scale-105">
                                        <Printer size={20} /> REIMPRIMIR
                                    </button>
                                    <button onClick={() => setEspelhoAberto(null)} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-colors text-slate-400 hover:text-white">
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
                                    <div className="w-72 bg-slate-800 text-white p-5 rounded-2xl">
                                        <div className="flex justify-between border-b border-slate-700 py-1 text-sm"><span className="text-slate-400 font-bold">Subtotal:</span><span>R$ {(espelhoAberto.subtotal || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-b border-slate-700 py-1 text-sm"><span className="text-slate-400 font-bold">Desconto:</span><span className="text-orange-400">- R$ {(espelhoAberto.desconto || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between mt-3"><span className="text-lg font-black uppercase text-slate-400">Total:</span><span className="text-2xl font-black text-green-400">R$ {(espelhoAberto.total || 0).toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* O SEGREDO: CÓDIGO DE IMPRESSÃO À PROVA DE FALHAS          */}
            {/* ========================================================= */}
            {espelhoAberto && (
                <>
                    {/* INJEÇÃO DE CSS GLOBAL PARA QUEBRAR O LAYOUT DO REACT NA IMPRESSÃO */}
                    <style>
                        {`
                            @media print {
                                /* Desativa todas as travas de altura e barra de rolagem do sistema */
                                body, html, #root, main, div {
                                    height: auto !important;
                                    min-height: 0 !important;
                                    overflow: visible !important;
                                }
                                /* Esconde TUDO no body por padrao para sumir com o menu lateral */
                                body * {
                                    visibility: hidden;
                                }
                                /* Pega APENAS a nossa div de impressao e forca ela a aparecer sobre tudo */
                                #area-impressao-vendas, #area-impressao-vendas * {
                                    visibility: visible;
                                }
                                #area-impressao-vendas {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 100% !important;
                                    background: white !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                @page {
                                    margin: 0; /* Tira bordas extras geradas pelo navegador */
                                }
                            }
                        `}
                    </style>

                    <div id="area-impressao-vendas" className="hidden print:block font-sans bg-white text-black">
                        {formatoImpressao === 'BOBINA' ? (
                            <div className="w-[80mm] mx-auto text-xs font-mono p-4">
                                <div className="text-center mb-4">
                                    <h2 className="text-lg font-black uppercase">GRANDPORT AUTOPEÇAS</h2>
                                    <p>CNPJ: 12.345.678/0001-90</p>
                                    <div className="border-b border-dashed border-black my-2"></div>
                                    <p className="font-bold uppercase">ESPELHO DE {espelhoAberto.tipo}</p>
                                    <p>Nº: {espelhoAberto.id}</p>
                                    <p>{new Date(espelhoAberto.data).toLocaleString('pt-BR')}</p>
                                    <div className="border-b border-dashed border-black my-2"></div>
                                </div>
                                <div className="mb-4 space-y-1">
                                    <p><span className="font-bold">Cliente:</span> {espelhoAberto.cliente}</p>
                                    <p><span className="font-bold">Viatura:</span> {espelhoAberto.veiculo}</p>
                                    <p><span className="font-bold">Vendedor:</span> {espelhoAberto.vendedor}</p>
                                </div>
                                <div className="border-b border-dashed border-black my-2"></div>
                                <table className="w-full text-left mb-4">
                                    <thead><tr><th className="pb-1">QTD</th><th className="pb-1">DESCRIÇÃO</th><th className="text-right pb-1">TOTAL</th></tr></thead>
                                    <tbody>
                                    {(espelhoAberto.itens || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="align-top py-1">{item.qtd}x</td>
                                            <td className="align-top py-1 pr-2">{item.nome} <br/><span className="text-[10px]">R$ {(item.preco || 0).toFixed(2)}</span></td>
                                            <td className="align-top text-right py-1">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <div className="border-b border-dashed border-black my-2"></div>
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>R$ {(espelhoAberto.subtotal || 0).toFixed(2)}</span></div>
                                    {espelhoAberto.desconto > 0 && <div className="flex justify-between"><span>Desconto:</span><span>- R$ {espelhoAberto.desconto.toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-dashed border-black">
                                        <span>TOTAL:</span><span>R$ {(espelhoAberto.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-[210mm] mx-auto p-10 font-sans">
                                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                                    <div>
                                        <h1 className="text-3xl font-black uppercase tracking-widest text-black">GRANDPORT</h1>
                                        <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Auto Peças e Acessórios</p>
                                        <p className="text-xs mt-2 text-black">CNPJ: 12.345.678/0001-90</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-black uppercase border-2 border-black px-4 py-2 rounded-lg inline-block text-black">ESPELHO DE {espelhoAberto.tipo}</h2>
                                        <p className="text-sm font-bold mt-2 text-black">Nº {espelhoAberto.id} • Data: {new Date(espelhoAberto.data).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="border border-black p-4 mb-6 rounded-lg flex justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Dados do Cliente</p>
                                        <p className="font-black text-lg text-black">{espelhoAberto.cliente}</p>
                                        <p className="text-sm text-black">CPF/CNPJ: {espelhoAberto.documento}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase text-gray-500 mb-1">Aplicação / Vendedor</p>
                                        <p className="font-black text-lg text-black">{espelhoAberto.veiculo}</p>
                                        <p className="text-sm mt-1 text-black">Vend: {espelhoAberto.vendedor}</p>
                                    </div>
                                </div>
                                <table className="w-full text-left border-collapse mb-6">
                                    <thead className="border-b-2 border-black">
                                    <tr>
                                        <th className="py-2 text-xs font-black uppercase text-black">Cód</th>
                                        <th className="py-2 text-xs font-black uppercase text-black">Descrição da Peça</th>
                                        <th className="py-2 text-center text-xs font-black uppercase text-black">Qtd</th>
                                        <th className="py-2 text-right text-xs font-black uppercase text-black">Vl. Unit</th>
                                        <th className="py-2 text-right text-xs font-black uppercase text-black">Subtotal</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(espelhoAberto.itens || []).map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-400">
                                            <td className="py-2 text-xs font-mono text-black">{item.codigo}</td>
                                            <td className="py-2 text-sm font-bold text-black">{item.nome}</td>
                                            <td className="py-2 text-center font-bold text-black">{item.qtd}</td>
                                            <td className="py-2 text-right text-sm text-black">R$ {(item.preco || 0).toFixed(2)}</td>
                                            <td className="py-2 text-right font-black text-black">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <div className="flex justify-end mb-12">
                                    <div className="w-64">
                                        <div className="flex justify-between border-b border-gray-400 py-1"><span className="text-sm font-bold text-black">Subtotal:</span><span className="text-sm text-black">R$ {(espelhoAberto.subtotal || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-b border-gray-400 py-1"><span className="text-sm font-bold text-black">Desconto:</span><span className="text-sm text-black">- R$ {(espelhoAberto.desconto || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between mt-2 pt-2 border-t-2 border-black"><span className="text-lg font-black uppercase text-black">Total:</span><span className="text-2xl font-black text-black">R$ {(espelhoAberto.total || 0).toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};