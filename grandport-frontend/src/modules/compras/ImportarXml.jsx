import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    UploadCloud, Search, PackagePlus, Calculator, Printer,
    CheckCircle, ArrowLeft, FileText, DollarSign, Package,
    Info, Percent, HelpCircle, Trash2, AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const ImportarXml = () => {
    const [modoAtual, setModoAtual] = useState('LISTA');
    const [busca, setBusca] = useState('');
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notaSelecionada, setNotaSelecionada] = useState(null);

    // 🚀 NOVO: Estado para controlar o Modal Customizado de Exclusão
    const [modalExclusao, setModalExclusao] = useState({ aberto: false, nota: null });

    const [precosVenda, setPrecosVenda] = useState({});
    const searchInputRef = useRef(null);

    const tratarErro = (acao, err) => {
        const status = err.response?.status;
        const msgPrincipal = err.response?.data?.mensagem || err.response?.data?.message || err.message;
        if (status === 403) toast.error(`Acesso Negado (403): Verifique as permissões no backend!`, { duration: 8000 });
        else if (status === 409) toast.error(`Duplicidade: Este XML já foi importado anteriormente.`, { duration: 6000 });
        else toast.error(`Falha em ${acao}: ${msgPrincipal}`, { duration: 6000 });
    };

    const carregarHistorico = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/compras/historico');
            setHistorico(res.data);
        } catch (error) { tratarErro("Carregar Histórico", error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

    const handleUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const loadId = toast.loading("Processando XML e lançando dados...");
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/compras/importar-xml', formData);
            toast.success(res.data?.mensagem || "Nota importada com sucesso!", { id: loadId });
            carregarHistorico();
        } catch (err) { toast.dismiss(loadId); tratarErro("Upload XML", err); }
        finally { e.target.value = ''; }
    };

    // 🚀 LÓGICA DO MODAL PROFISSIONAL
    const abrirModalExclusao = (nota) => {
        setModalExclusao({ aberto: true, nota });
    };

    const fecharModalExclusao = () => {
        setModalExclusao({ aberto: false, nota: null });
    };

    const confirmarExclusao = async () => {
        if (!modalExclusao.nota) return;
        const toastId = toast.loading("Excluindo nota e limpando financeiro...");
        const idParaExcluir = modalExclusao.nota.id;

        fecharModalExclusao(); // Fecha o modal imediatamente

        try {
            await api.delete(`/api/compras/${idParaExcluir}`);
            toast.success("Nota excluída com sucesso!", { id: toastId });
            carregarHistorico();
        } catch (err) {
            toast.dismiss(toastId);
            tratarErro("Excluir Nota", err);
        }
    };

    const abrirEspelho = (nota) => {
        setNotaSelecionada(nota);
        const precosIniciais = {};
        (nota.produtosImportados || []).forEach((item, idx) => {
            const custo = Number(item.precoCusto || 0);
            precosIniciais[idx] = item.precoVenda && item.precoVenda > 0 ? item.precoVenda.toFixed(2) : (custo * 1.4).toFixed(2);
        });
        setPrecosVenda(precosIniciais);
        setModoAtual('ESPELHO');
    };

    const voltarParaLista = () => {
        setNotaSelecionada(null);
        setModoAtual('LISTA');
    };

    const confirmarConferencia = async () => {
        if (notaSelecionada.status === 'Finalizado' || notaSelecionada.status === 'Conferido') {
            return toast.success("Esta nota já foi conferida!");
        }

        const toastId = toast.loading("Atualizando preços e salvando auditoria...");
        const payload = {
            itens: (notaSelecionada.produtosImportados || []).map((item, idx) => ({
                produtoId: item.id || item.produtoId,
                precoVenda: parseFloat(precosVenda[idx]) || 0
            }))
        };

        try {
            const res = await api.put(`/api/compras/confirmar/${notaSelecionada.id}`, payload);
            toast.success(res.data?.mensagem || "Conferência e preços salvos!", { id: toastId });
            carregarHistorico();
            voltarParaLista();
        } catch (err) {
            toast.dismiss(toastId);
            tratarErro("Confirmar Nota", err);
        }
    };

    const imprimirEspelho = () => {
        const itens = notaSelecionada.produtosImportados || [];
        const duplicatas = notaSelecionada.parcelasGeradas || [];
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <html>
            <head>
                <title>Espelho de Conferência - NF ${notaSelecionada.numero}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                    .header p { margin: 5px 0 0 0; color: #555; }
                    .total { text-align: right; }
                    .total h2 { margin: 0; font-size: 28px; color: #000; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f4f4f4; text-transform: uppercase; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .section-title { margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .financeiro-grid { display: flex; gap: 15px; }
                    .boleto { border: 1px solid #000; padding: 15px; width: 200px; text-align: center; border-radius: 8px; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>${notaSelecionada.fornecedorNome}</h1>
                        <p><strong>Nota Fiscal:</strong> #${notaSelecionada.numero}</p>
                        <p><strong>Data de Emissão:</strong> ${notaSelecionada.dataEmissao ? new Date(notaSelecionada.dataEmissao).toLocaleDateString() : '-'}</p>
                    </div>
                    <div class="total">
                        <p>Valor Total da Nota</p>
                        <h2>${formatarMoeda(notaSelecionada.valorTotalNota)}</h2>
                    </div>
                </div>

                <h3 class="section-title">Itens da Nota e Precificação</h3>
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Descrição do Produto</th>
                            <th class="text-center">Qtd</th>
                            <th class="text-right">Custo Unit.</th>
                            <th class="text-center">Markup</th>
                            <th class="text-right">Preço de Venda</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itens.map((item, idx) => {
            const custo = Number(item.precoCusto || 0);
            const venda = Number(precosVenda[idx] || 0);
            const markup = custo > 0 ? (((venda / custo) - 1) * 100).toFixed(2) : '0.00';
            return `
                            <tr>
                                <td>${item.sku || '-'}</td>
                                <td>${item.nome}</td>
                                <td class="text-center">${item.quantidade || 1}</td>
                                <td class="text-right">${formatarMoeda(custo)}</td>
                                <td class="text-center">${markup}%</td>
                                <td class="text-right"><strong>${formatarMoeda(venda)}</strong></td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>

                <h3 class="section-title">Contas a Pagar Geradas (Duplicatas)</h3>
                ${duplicatas.length > 0 ? `
                    <div class="financeiro-grid">
                        ${duplicatas.map(dup => `
                            <div class="boleto">
                                <p style="margin:0; color:#666; font-size: 10px;">PARCELA ${dup.numero}</p>
                                <h3 style="margin: 10px 0;">${formatarMoeda(dup.valor)}</h3>
                                <p style="margin:0; font-size: 12px; font-weight: bold;">Venc: ${dup.vencimento ? new Date(dup.vencimento).toLocaleDateString() : '-'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>Nenhuma duplicata registrada nesta nota.</p>'}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    useHotkeys('f2', (e) => { e.preventDefault(); if (modoAtual === 'LISTA') searchInputRef.current?.focus(); }, [modoAtual]);
    useHotkeys('esc', (e) => {
        if (modalExclusao.aberto) fecharModalExclusao();
        else if (modoAtual === 'ESPELHO') voltarParaLista();
    }, [modoAtual, modalExclusao]);
    useHotkeys('f8', (e) => { e.preventDefault(); if (modoAtual === 'ESPELHO') imprimirEspelho(); }, [modoAtual, notaSelecionada]);
    useHotkeys('f10', (e) => { e.preventDefault(); if (modoAtual === 'ESPELHO') confirmarConferencia(); }, [modoAtual, notaSelecionada, precosVenda]);

    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const handlePrecoChangeMask = (idx, inputValue) => {
        const apenasNumeros = inputValue.replace(/\D/g, '');
        const valorDecimal = (Number(apenasNumeros) / 100).toFixed(2);
        setPrecosVenda({ ...precosVenda, [idx]: valorDecimal });
    };

    const formatMaskDisplay = (valorDecimal) => {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorDecimal);
    };

    const alterarMarkup = (idx, custo, novoMarkupPercentual) => {
        const markupNum = Number(novoMarkupPercentual) || 0;
        const novoPrecoVenda = custo * (1 + (markupNum / 100));
        setPrecosVenda({ ...precosVenda, [idx]: novoPrecoVenda.toFixed(2) });
    };

    const notasFiltradas = historico.filter(n => n.numero?.includes(busca) || n.fornecedorNome?.toLowerCase().includes(busca.toLowerCase()));

    if (modoAtual === 'LISTA') {
        return (
            <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">

                {/* 🚀 MODAL DE EXCLUSÃO CUSTOMIZADO */}
                {modalExclusao.aberto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                                    <AlertTriangle size={32} />
                                </div>
                                <button onClick={fecharModalExclusao} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 mb-2">Excluir Nota Fiscal?</h2>
                            <p className="text-slate-500 font-medium mb-6">
                                Tem certeza que deseja apagar a nota <strong className="text-slate-800">#{modalExclusao.nota?.numero}</strong> do fornecedor <strong className="text-slate-800 uppercase">{modalExclusao.nota?.fornecedorNome}</strong>?
                                <br/><br/>
                                Isso removerá o registro do histórico e <span className="text-red-600 font-bold">cancelará todos os títulos a pagar</span> gerados por ela.
                            </p>

                            <div className="flex gap-4">
                                <button onClick={fecharModalExclusao} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                                    Cancelar (ESC)
                                </button>
                                <button onClick={confirmarExclusao} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/30 hover:-translate-y-0.5 transition-all">
                                    Sim, Excluir Nota
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><PackagePlus className="text-blue-600 bg-blue-50 p-2 rounded-xl" size={40} />Entrada de Notas (XML)</h1>
                        <p className="text-slate-500 font-medium mt-1">Importe XMLs, audite o financeiro e atualize os preços de venda.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative w-72" title="Pressione F2 para focar na busca rapidamente.">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input ref={searchInputRef} type="text" placeholder="Buscar nota (F2)..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-4 py-3 border rounded-xl font-bold outline-none shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                        </div>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1" title="Clique para procurar um arquivo .xml no seu computador">
                            <UploadCloud size={20} /> IMPORTAR XML
                            <input type="file" accept=".xml" className="hidden" onChange={handleUpload} />
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                        <tr>
                            <th className="p-5">NF-e</th>
                            <th className="p-5">Fornecedor</th>
                            <th className="p-5 text-right">Valor Total</th>
                            <th className="p-5 text-center">Status</th>
                            <th className="p-5 text-center" title="Ações disponíveis para a nota">Ações <HelpCircle size={12} className="inline mb-1 text-slate-400"/></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {notasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <PackagePlus size={48} className="mb-4 text-slate-300" />
                                        <p className="font-black text-lg text-slate-500">Nenhuma nota encontrada.</p>
                                        <p className="text-sm">Importe um arquivo XML para começar.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : notasFiltradas.map((nota) => (
                            <tr key={nota.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-5 font-black text-slate-800">#{nota.numero}</td>
                                <td className="p-5 font-bold uppercase text-xs text-slate-600">{nota.fornecedorNome}</td>
                                <td className="p-5 font-black text-right text-slate-800">{formatarMoeda(nota.valorTotalNota)}</td>
                                <td className="p-5 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${nota.status?.includes('Pendente') ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{nota.status}</span></td>

                                <td className="p-5 text-center flex justify-center gap-3">
                                    <button
                                        onClick={() => abrirEspelho(nota)}
                                        title="Editar Preços e Conferir Nota"
                                        className="border-2 border-blue-100 p-2 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
                                    >
                                        <Calculator size={18} />
                                    </button>
                                    <button
                                        onClick={() => abrirModalExclusao(nota)}
                                        title="Excluir Nota e Financeiro"
                                        className="border-2 border-red-100 p-2 rounded-xl text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const itensNota = notaSelecionada.produtosImportados || [];
    const duplicatasNota = notaSelecionada.parcelasGeradas || notaSelecionada.duplicatas || notaSelecionada.parcelas || [];

    return (
        <div className="flex-1 bg-slate-50 flex flex-col animate-fade-in min-h-screen">
            <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm sticky top-0 z-20">
                <button onClick={voltarParaLista} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black transition-colors" title="Pressione ESC para voltar"><ArrowLeft size={20} /> VOLTAR (ESC)</button>
                <div className="flex items-center gap-3">
                    <FileText className="text-blue-500" size={28} />
                    <div><h2 className="text-xl font-black text-slate-800 leading-none">Espelho de Conferência</h2><p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">NF: {notaSelecionada.numero}</p></div>
                </div>
                <div className="flex gap-4">
                    <button onClick={imprimirEspelho} className="flex items-center gap-2 bg-white border-2 border-slate-200 px-6 py-2 rounded-xl font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm" title="Pressione F8 para imprimir o espelho da nota"><Printer size={18} /> IMPRIMIR (F8)</button>
                    <button onClick={confirmarConferencia} disabled={notaSelecionada.status === 'Finalizado'} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black shadow-lg transition-all ${notaSelecionada.status === 'Finalizado' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30 hover:-translate-y-1'}`} title="Pressione F10 para confirmar e salvar no banco">
                        <CheckCircle size={20} /> {notaSelecionada.status === 'Finalizado' ? 'NOTA FINALIZADA' : 'SALVAR PREÇOS (F10)'}
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border flex flex-col justify-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Fornecedor</p>
                        <p className="text-xl font-black uppercase text-slate-800 leading-tight">{notaSelecionada.fornecedorNome}</p>
                        <p className="text-sm font-bold text-slate-500 mt-2">Emissão: {notaSelecionada.dataEmissao ? new Date(notaSelecionada.dataEmissao).toLocaleDateString() : '-'}</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-900/20 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Valor Total Importado</p>
                            <p className="text-5xl font-black text-emerald-400 tracking-tighter">{formatarMoeda(notaSelecionada.valorTotalNota)}</p>
                        </div>
                        <DollarSign size={120} className="text-white opacity-5 absolute -right-4 -bottom-4" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border overflow-hidden">
                    <div className="p-6 border-b flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-3">
                            <Package className="text-blue-500" size={24} />
                            <h3 className="text-lg font-black text-slate-800">Ajuste de Preços de Venda</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border">Two-Way Binding Ativo</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b">
                            <tr>
                                <th className="p-4" title="Código Interno ou do Fornecedor">SKU / Peça <HelpCircle size={10} className="inline mb-1"/></th>
                                <th className="p-4 text-center">QTD</th>
                                <th className="p-4 text-right" title="Custo Real (Valor do XML + Impostos)">Custo Unit. <HelpCircle size={10} className="inline mb-1"/></th>
                                <th className="p-4 w-40 text-right bg-blue-50/50" title="Margem de Lucro. Digite a % para calcular o Preço final">Margem (Markup) <HelpCircle size={10} className="inline mb-1"/></th>
                                <th className="p-4 w-56 text-right bg-emerald-50/50" title="Valor final de prateleira. Se alterar, o Markup recalcula sozinho">Novo Preço Venda <HelpCircle size={10} className="inline mb-1"/></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itensNota.map((item, idx) => {
                                const custo = Number(item.precoCusto || 0);
                                const vendaAtual = Number(precosVenda[idx] || 0);
                                const markupAtual = custo > 0 ? (((vendaAtual / custo) - 1) * 100).toFixed(2) : "0.00";

                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-black text-slate-700 uppercase text-sm">{item.nome}</p>
                                            <p className="text-xs font-mono text-slate-400 mt-1">{item.sku || 'S/N'}</p>
                                        </td>
                                        <td className="p-4 text-center font-black text-slate-600 bg-slate-50/50">{item.quantidade || 1}</td>
                                        <td className="p-4 text-right font-black text-slate-600">{formatarMoeda(custo)}</td>

                                        <td className="p-4 bg-blue-50/20">
                                            <div className="relative group-hover:scale-105 transition-transform origin-right">
                                                <input
                                                    type="number" step="0.1"
                                                    value={markupAtual}
                                                    onChange={(e) => alterarMarkup(idx, custo, e.target.value)}
                                                    className={`w-full pl-3 pr-8 py-2.5 border-2 rounded-xl font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-right transition-all shadow-sm ${Number(markupAtual) < 20 ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200 text-slate-700'}`}
                                                    title="Digite a margem desejada (%)"
                                                />
                                                <Percent className={`absolute right-3 top-1/2 -translate-y-1/2 ${Number(markupAtual) < 20 ? 'text-red-400' : 'text-slate-400'}`} size={14} />
                                            </div>
                                        </td>

                                        <td className="p-4 bg-emerald-50/30">
                                            <div className="relative group-hover:scale-105 transition-transform origin-right">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                                                <input
                                                    type="text"
                                                    value={formatMaskDisplay(precosVenda[idx] || 0)}
                                                    onChange={(e) => handlePrecoChangeMask(idx, e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2.5 border-2 border-slate-200 rounded-xl font-black text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-right shadow-sm bg-white"
                                                    title="Preço Final na Prateleira"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <DollarSign className="text-amber-500 bg-amber-50 p-1.5 rounded-lg" size={32} />
                            <h3 className="text-lg font-black text-slate-800">Contas a Pagar Geradas</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border shadow-sm">Duplicatas do XML</span>
                    </div>
                    <div className="p-8">
                        {duplicatasNota.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {duplicatasNota.map((dup, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-1 transition-all relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 group-hover:bg-amber-500 transition-colors"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parcela {dup.numero}</p>
                                        <p className="text-2xl font-black text-slate-800 mb-4 tracking-tighter">{formatarMoeda(dup.valor)}</p>
                                        <p className="text-xs font-bold text-amber-600 uppercase bg-amber-50 inline-block px-2 py-1 rounded-md">
                                            Venc: {dup.vencimento ? new Date(dup.vencimento).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-10 text-slate-400">
                                <Info size={48} className="text-slate-200 mb-3" />
                                <p className="font-black text-lg text-slate-500">Nenhum título financeiro.</p>
                                <p className="text-sm">O fornecedor emitiu esta nota sem registro de duplicatas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};