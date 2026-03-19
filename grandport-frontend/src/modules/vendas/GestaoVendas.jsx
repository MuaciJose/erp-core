import React, { useState, useEffect } from 'react';
import {
    Search, Plus, FileText, CheckCircle, Clock,
    Printer, ArrowLeft, Eye, X, User, Trash2, Edit, Lock, Wallet, Package, Receipt
} from 'lucide-react';
import api from '../../api/axios';
import { OrcamentoPedido } from './OrcamentoPedido';
import toast from 'react-hot-toast';

import EmitirNfeAvulsa from '../fiscal/EmitirNfeAvulsa';

export const GestaoVendas = ({ setPaginaAtiva }) => {
    const [telaAtual, setTelaAtual] = useState('LISTA');
    const [busca, setBusca] = useState('');
    const [espelhoAberto, setEspelhoAberto] = useState(null);
    const [listaVendas, setListaVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vendaParaEditar, setVendaParaEditar] = useState(null);
    const [configLoja, setConfigLoja] = useState({ nomeFantasia: 'EMPRESA', mensagemRodape: 'Obrigado pela preferência!' });

    const [dadosParaAjusteFiscal, setDadosParaAjusteFiscal] = useState(null);

    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const carregarConfiguracoes = async () => {
        try {
            const res = await api.get('/api/configuracoes');
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data) setConfigLoja(data);
        } catch (e) { console.log("Não foi possível carregar configurações."); }
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
        carregarConfiguracoes();
        if (telaAtual === 'LISTA') carregarVendas();
    }, [telaAtual]);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (espelhoAberto) {
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
    }, [telaAtual, espelhoAberto]);

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

    // 🚀 IMPRESSÃO A4 (VIA JAVA / BANCO DE DADOS)
    const imprimirDocumentoA4 = async (vendaId) => {
        if (!vendaId) return;
        const toastId = toast.loading('Buscando PDF A4 no servidor...');
        try {
            const response = await api.get(`/api/vendas/${vendaId}/imprimir-pdf`, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
            toast.success("Documento gerado com sucesso!", { id: toastId });
        } catch (error) {
            toast.error("Erro ao gerar o PDF. Verifique a conexão com o servidor.", { id: toastId });
        }
    };

    // 🚀 IMPRESSÃO BOBINA TÉRMICA (VIA NAVEGADOR)
    const imprimirBobinaLocal = (venda) => {
        if (!venda) return;
        const printWindow = window.open('', '_blank');
        const nomeEmpresa = configLoja?.nomeFantasia || 'EMPRESA';
        const titulo = venda.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'RECIBO DE VENDA';
        const dataDoc = new Date(venda.dataHora || Date.now()).toLocaleString('pt-BR');

        const itensParaImprimir = venda.itens || [];

        let linhasProd = '';
        itensParaImprimir.forEach((item, i) => {
            const prc = Number(item.precoUnitario || item.preco) || 0;
            const qtd = Number(item.quantidade || item.qtd) || 0;
            const tot = prc * qtd;
            const nomeProd = item.produto?.nome || item.nome || 'Item';
            const sku = item.produto?.sku || item.codigo || '';

            linhasProd += `<div style="margin-bottom: 8px; font-size: 11px;"><div style="font-weight: bold;">${String(i+1).padStart(2,'0')} ${nomeProd}</div><div style="display: flex; justify-content: space-between; margin-top: 2px;"><span style="width: 40%; font-size: 9px;">${sku}</span><span style="width: 30%; text-align: center;">${qtd} x ${prc.toFixed(2)}</span><span style="width: 30%; text-align: right; font-weight: bold;">${tot.toFixed(2)}</span></div></div>`;
        });

        const pagamentos = venda.pagamentos || venda.pagamentosInfo || [];
        let linhasPag = '';
        if(pagamentos.length > 0) {
            pagamentos.forEach(p => {
                const metodoStr = (p.metodo || p.formaPagamento || 'DINHEIRO').replace('_', ' ');
                linhasPag += `<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; font-size: 11px;"><span>${metodoStr}</span><span>R$ ${formatarMoeda(p.valor)}</span></div>`;
            });
        } else {
            linhasPag = `<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; font-size: 11px;"><span>A PAGAR / CAIXA</span><span>R$ ${formatarMoeda(venda.valorTotal)}</span></div>`;
        }

        const desconto = Number(venda.desconto) || 0;

        const html = `<!DOCTYPE html><html><head><title>Cupom #${venda.id}</title><style>body{font-family: monospace; width: 80mm; margin:0; padding:4mm;} .divider{border-bottom: 1px dashed #000; margin: 8px 0;}</style></head><body>
            <div style="text-align:center; font-weight:bold; font-size:14px;">COMPROVANTE</div>
            <div style="text-align:center; font-weight:bold; font-size:12px;">${titulo}</div>
            <div style="text-align:center; font-size:10px;">*** NAO E DOCUMENTO FISCAL ***</div>
            <div style="text-align:center; font-size:11px; margin-top:5px;">Nº: #${String(venda.id).padStart(6,'0')}</div>
            <div style="text-align:center; font-size:11px;">${dataDoc}</div><div class="divider"></div>
            ${venda.cliente ? `<div style="font-size:11px;">CLI: ${venda.cliente?.nome || venda.cliente}</div><div class="divider"></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:bold;"><span>Item</span><span style="text-align:center;">QtdxVl</span><span style="text-align:right;">Total</span></div><div class="divider"></div>
            ${linhasProd}<div class="divider"></div>
            ${desconto > 0 ? `<div style="display:flex; justify-content:space-between; font-size:11px; color:red;"><span>DESCONTO</span><span>- R$ ${formatarMoeda(desconto)}</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; margin-top:5px;"><span>TOTAL</span><span>R$ ${formatarMoeda(venda.valorTotal)}</span></div><div class="divider"></div>
            <div style="font-size:11px;"><strong>PAGAMENTOS:</strong><br>${linhasPag}</div>
            <div class="divider"></div><div style="text-align:center; font-size:10px;">OBRIGADO PELA PREFERENCIA</div>
        </body></html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
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

    if (telaAtual === 'NOTA_FISCAL') {
        return (
            <div className="h-full bg-slate-100 relative z-[20]">
                <EmitirNfeAvulsa
                    dadosIniciais={dadosParaAjusteFiscal}
                    onVoltar={() => setTelaAtual('NOVO')}
                />
            </div>
        );
    }

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
                        onIrParaNota={(dadosEmpacotados) => {
                            setDadosParaAjusteFiscal(dadosEmpacotados);
                            setTelaAtual('NOTA_FISCAL');
                        }}
                    />
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
                                <th className="p-4 text-center pr-6 w-52">Ações</th>
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
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                                                    title="Ver Resumo"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* 🚀 BOTÃO DE IMPRESSÃO BOBINA */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); imprimirBobinaLocal(venda); }}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                                                    title="Imprimir Recibo (Bobina)"
                                                >
                                                    <Receipt size={16} />
                                                </button>

                                                {/* 🚀 BOTÃO DE IMPRESSÃO A4 (JAVA) */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); imprimirDocumentoA4(venda.id); }}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                                    title="Imprimir Folha A4 (PDF)"
                                                >
                                                    <FileText size={16} />
                                                </button>

                                                {venda.status !== 'CONCLUIDA' && venda.status !== 'AGUARDANDO_PAGAMENTO' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleReabrir(venda); }}
                                                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleExcluir(venda.id); }}
                                                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="p-2 text-slate-300 cursor-not-allowed" title="Finalizado">
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
            {espelhoAberto && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 print:hidden">
                    <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in relative">
                        <div className="bg-slate-900 p-6 flex justify-between items-end text-white border-b-4 border-blue-500">
                            <div>
                                <h2 className="text-3xl font-black tracking-widest uppercase">RESUMO DA VENDA</h2>
                                <p className="text-blue-300 font-bold mt-1 text-sm">Documento #{espelhoAberto.id} • {new Date(espelhoAberto.dataHora).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => imprimirBobinaLocal(espelhoAberto)}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-1"
                                >
                                    <Receipt size={20} /> BOBINA
                                </button>

                                <button
                                    onClick={() => imprimirDocumentoA4(espelhoAberto.id)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-1"
                                >
                                    <FileText size={20} /> FOLHA A4
                                </button>

                                <button onClick={() => setEspelhoAberto(null)} title="Pressione Esc para fechar" className="bg-slate-800 p-3 rounded-xl text-slate-400 hover:text-white hover:bg-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
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
                            <table className="w-full bg-white rounded-xl shadow-sm border overflow-hidden text-left">
                                <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-xs font-black uppercase text-slate-500">Descrição</th>
                                    <th className="p-3 text-center text-xs font-black uppercase text-slate-500">Qtd</th>
                                    <th className="p-3 text-right text-xs font-black uppercase text-slate-500">Vl. Unit</th>
                                    <th className="p-3 text-right text-xs font-black uppercase text-slate-500">Total</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {(espelhoAberto.itens || []).map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-3 font-bold text-sm text-slate-700">{item.produto?.nome || item.nome}</td>
                                        <td className="p-3 text-center font-bold text-slate-500">{item.quantidade || item.qtd}</td>
                                        <td className="p-3 text-right text-slate-600">R$ {formatarMoeda(item.precoUnitario || item.preco)}</td>
                                        <td className="p-3 text-right font-black text-slate-800">R$ {formatarMoeda((item.precoUnitario || item.preco) * (item.quantidade || item.qtd))}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="mt-6 flex justify-end">
                                <div className="w-72 bg-slate-800 text-white p-5 rounded-2xl shadow-xl">
                                    <div className="flex justify-between py-1 text-sm border-b border-slate-700"><span className="text-slate-400">Subtotal:</span><span className="font-bold">R$ {formatarMoeda(espelhoAberto.valorSubtotal || espelhoAberto.subtotal)}</span></div>
                                    <div className="flex justify-between py-1 text-sm border-b border-slate-700"><span className="text-slate-400">Desconto:</span><span className="text-orange-400 font-bold">- R$ {formatarMoeda(espelhoAberto.desconto)}</span></div>
                                    <div className="flex justify-between mt-3"><span className="font-black uppercase text-slate-400">Total:</span><span className="text-2xl font-black text-green-400 tracking-tight">R$ {formatarMoeda(espelhoAberto.valorTotal || espelhoAberto.total)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};