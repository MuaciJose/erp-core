import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    UploadCloud, Search, PackagePlus, Calculator, Printer,
    CheckCircle, ArrowLeft, FileText, DollarSign, Package,
    Info, Percent, HelpCircle, Trash2, AlertTriangle, X,
    Link as LinkIcon, ArrowRightLeft, Boxes, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const ImportarXml = () => {
    const [modoAtual, setModoAtual] = useState('LISTA');
    const [busca, setBusca] = useState('');
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notaSelecionada, setNotaSelecionada] = useState(null);

    const [modalExclusao, setModalExclusao] = useState({ aberto: false, nota: null });

    const [vinculos, setVinculos] = useState({});
    const [modalVinculo, setModalVinculo] = useState({ aberto: false, itemIndex: null, item: null });
    const [termoBuscaVinculo, setTermoBuscaVinculo] = useState('');
    const [resultadosBuscaEstoque, setResultadosBuscaEstoque] = useState([]);
    const [buscandoEstoque, setBuscandoEstoque] = useState(false);

    const [precosVenda, setPrecosVenda] = useState({});

    // ESTADO PARA A CONVERSÃO DE EMBALAGEM
    const [conversaoEmbalagem, setConversaoEmbalagem] = useState({});
    const [modalConversao, setModalConversao] = useState({ aberto: false, itemIndex: null, item: null, fatorInput: '', tipo: 'DESMEMBRAR' });

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

    const abrirModalExclusao = (nota) => setModalExclusao({ aberto: true, nota });
    const fecharModalExclusao = () => setModalExclusao({ aberto: false, nota: null });

    const confirmarExclusao = async () => {
        if (!modalExclusao.nota) return;
        const toastId = toast.loading("Excluindo nota e limpando financeiro...");
        const idParaExcluir = modalExclusao.nota.id;

        fecharModalExclusao();

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
        setVinculos({});
        setConversaoEmbalagem({});

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
        setVinculos({});
        setModoAtual('LISTA');
    };

    // 🚀 NOVA FUNÇÃO DE IMPRESSÃO DO ESPELHO
    const imprimirEspelhoNota = async () => {
        if (!notaSelecionada) return;
        const idToast = toast.loading("Gerando PDF do espelho da nota...");
        try {
            // Bate na rota do Java pedindo o PDF desta nota específica
            const response = await api.get(`/api/compras/${notaSelecionada.id}/pdf`, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            window.open(fileURL, '_blank');
            toast.success("Documento gerado com sucesso!", { id: idToast });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar o PDF no servidor.", { id: idToast });
        }
    };

    const confirmarConferencia = async () => {
        if (notaSelecionada.status === 'Finalizado' || notaSelecionada.status === 'Conferido') {
            return toast.success("Esta nota já foi conferida!");
        }

        const toastId = toast.loading("Atualizando estoque, vínculos e salvando auditoria...");

        const payload = {
            itens: (notaSelecionada.produtosImportados || []).map((item, idx) => {
                const conversao = conversaoEmbalagem[idx] || null;
                let qtdXml = Number(item.quantidade || 1);
                let custoXml = Number(item.precoCusto || 0);

                let qtdFinal = qtdXml;
                let custoFinal = custoXml;

                if (conversao && conversao.fator > 1) {
                    if (conversao.tipo === 'DESMEMBRAR') {
                        qtdFinal = qtdXml * conversao.fator;
                        custoFinal = custoXml / conversao.fator;
                    } else if (conversao.tipo === 'AGRUPAR') {
                        qtdFinal = qtdXml / conversao.fator;
                        custoFinal = custoXml * conversao.fator;
                    }
                }

                return {
                    idImportacao: item.id,
                    produtoId: vinculos[idx] ? vinculos[idx].id : item.produtoId,
                    precoVenda: parseFloat(precosVenda[idx]) || 0,
                    vinculoManual: !!vinculos[idx],
                    conversaoTipo: conversao?.tipo || 'NENHUMA',
                    fatorConversao: conversao?.fator || 1,
                    quantidadeFinal: qtdFinal,
                    custoFinal: custoFinal
                };
            })
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

    // =========================================================================
    // LÓGICA DO MODAL DE CONVERSÃO (CAIXA <-> UNIDADE)
    // =========================================================================
    const abrirModalConversao = (item, idx) => {
        const conversaoExistente = conversaoEmbalagem[idx];
        setModalConversao({
            aberto: true,
            itemIndex: idx,
            item: item,
            fatorInput: conversaoExistente ? conversaoExistente.fator.toString() : '',
            tipo: conversaoExistente ? conversaoExistente.tipo : 'DESMEMBRAR'
        });
    };

    const fecharModalConversao = () => {
        setModalConversao({ aberto: false, itemIndex: null, item: null, fatorInput: '', tipo: 'DESMEMBRAR' });
    };

    const confirmarAplicacaoConversao = () => {
        const fatorNum = Number(modalConversao.fatorInput);

        if (!fatorNum || fatorNum <= 1) {
            toast.error("O fator de conversão deve ser maior que 1.");
            return;
        }

        if (modalConversao.tipo === 'AGRUPAR') {
            const qtdXml = Number(modalConversao.item.quantidade || 1);
            if (qtdXml % fatorNum !== 0) {
                toast.error(`Atenção: Agrupar ${qtdXml} unidades de ${fatorNum} em ${fatorNum} não resulta em caixas exatas. Revise os números.`);
                return;
            }
        }

        setConversaoEmbalagem(prev => ({
            ...prev,
            [modalConversao.itemIndex]: {
                tipo: modalConversao.tipo,
                fator: fatorNum
            }
        }));

        toast.success(`Conversão aplicada: ${modalConversao.tipo === 'DESMEMBRAR' ? 'Desmembramento' : 'Agrupamento'} (x${fatorNum})`);
        fecharModalConversao();
    };

    const removerConversao = (idx) => {
        const novaConversao = { ...conversaoEmbalagem };
        delete novaConversao[idx];
        setConversaoEmbalagem(novaConversao);
    };

    // =========================================================================
    // LÓGICA DO MODAL DE VÍNCULO (DE-PARA)
    // =========================================================================
    const abrirModalVinculo = (item, idx) => {
        setModalVinculo({ aberto: true, itemIndex: idx, item });
        setTermoBuscaVinculo(item.nome);
        setResultadosBuscaEstoque([]);
        buscarProdutoNoEstoque(item.nome);
    };

    const fecharModalVinculo = () => {
        setModalVinculo({ aberto: false, itemIndex: null, item: null });
        setTermoBuscaVinculo('');
    };

    const buscarProdutoNoEstoque = async (termo) => {
        if (!termo || termo.length < 2) return;
        setBuscandoEstoque(true);
        try {
            const res = await api.get(`/api/produtos?busca=${termo}`);
            const dados = Array.isArray(res.data) ? res.data : (res.data.content || []);
            setResultadosBuscaEstoque(dados);
        } catch (error) {
            toast.error("Falha ao buscar produtos no estoque.");
        } finally {
            setBuscandoEstoque(false);
        }
    };

    const selecionarVinculo = (produto) => {
        setVinculos(prev => ({
            ...prev,
            [modalVinculo.itemIndex]: { id: produto.id, nome: produto.nome, estoqueAtual: produto.quantidadeEstoque }
        }));
        toast.success(`Peça vinculada ao produto #${produto.id}!`);
        fecharModalVinculo();
    };

    const removerVinculo = (idx) => {
        const novosVinculos = { ...vinculos };
        delete novosVinculos[idx];
        setVinculos(novosVinculos);
    };

    const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const handlePrecoChangeMask = (idx, inputValue) => {
        const apenasNumeros = inputValue.replace(/\D/g, '');
        const valorDecimal = (Number(apenasNumeros) / 100).toFixed(2);
        setPrecosVenda({ ...precosVenda, [idx]: valorDecimal });
    };

    const formatMaskDisplay = (valorDecimal) => {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorDecimal);
    };

    const alterarMarkup = (idx, custoRealUnitario, novoMarkupPercentual) => {
        const markupNum = Number(novoMarkupPercentual) || 0;
        const novoPrecoVenda = custoRealUnitario * (1 + (markupNum / 100));
        setPrecosVenda({ ...precosVenda, [idx]: novoPrecoVenda.toFixed(2) });
    };

    useHotkeys('f2', (e) => { e.preventDefault(); if (modoAtual === 'LISTA') searchInputRef.current?.focus(); }, [modoAtual]);
    useHotkeys('esc', (e) => {
        if (modalConversao.aberto) fecharModalConversao();
        else if (modalVinculo.aberto) fecharModalVinculo();
        else if (modalExclusao.aberto) fecharModalExclusao();
        else if (modoAtual === 'ESPELHO') voltarParaLista();
    }, [modoAtual, modalExclusao, modalVinculo, modalConversao]);
    useHotkeys('f10', (e) => { e.preventDefault(); if (modoAtual === 'ESPELHO') confirmarConferencia(); }, [modoAtual, notaSelecionada, precosVenda, vinculos, conversaoEmbalagem]);


    const notasFiltradas = historico.filter(n => n.numero?.includes(busca) || n.fornecedorNome?.toLowerCase().includes(busca.toLowerCase()));

    if (modoAtual === 'LISTA') {
        return (
            <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">

                {modalExclusao.aberto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 transform transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-red-100 p-3 rounded-2xl text-red-600"><AlertTriangle size={32} /></div>
                                <button onClick={fecharModalExclusao} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Excluir Nota Fiscal?</h2>
                            <p className="text-slate-500 font-medium mb-6">Tem certeza que deseja apagar a nota <strong className="text-slate-800">#{modalExclusao.nota?.numero}</strong>?</p>
                            <div className="flex gap-4">
                                <button onClick={fecharModalExclusao} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Cancelar</button>
                                <button onClick={confirmarExclusao} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><PackagePlus className="text-blue-600 bg-blue-50 p-2 rounded-xl" size={40} />Entrada de Notas (XML)</h1>
                        <p className="text-slate-500 font-medium mt-1">Importe XMLs, audite o financeiro e faça a conversão de caixas e pacotes.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input ref={searchInputRef} type="text" placeholder="Buscar nota (F2)..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-12 pr-4 py-3 border rounded-xl font-bold outline-none shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                        </div>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1">
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
                            <th className="p-5 text-center">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {notasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <PackagePlus size={48} className="mb-4 text-slate-300" />
                                        <p className="font-black text-lg text-slate-500">Nenhuma nota encontrada.</p>
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
                                        title="Editar Preços, Converter Embalagens e Conferir"
                                        className="border-2 border-blue-100 p-2 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm"
                                    >
                                        <Calculator size={18} />
                                    </button>
                                    <button
                                        onClick={() => abrirModalExclusao(nota)}
                                        title="Excluir Nota"
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

    return (
        <div className="flex-1 bg-slate-50 flex flex-col animate-fade-in min-h-screen">

            {/* MODAL CONVERSÃO */}
            {modalConversao.aberto && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2"><ArrowRightLeft size={20}/> Conversão de Embalagem</h3>
                                <p className="text-sm text-slate-400 mt-1">{modalConversao.item?.nome}</p>
                            </div>
                            <button onClick={fecharModalConversao} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                        </div>

                        <div className="p-8 bg-slate-50">

                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setModalConversao(p => ({ ...p, tipo: 'DESMEMBRAR' }))}
                                    className={`flex-1 p-4 rounded-xl border-2 font-black flex flex-col items-center justify-center gap-2 transition-all ${modalConversao.tipo === 'DESMEMBRAR' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300'}`}
                                >
                                    <ArrowDownToLine size={24}/>
                                    DESMEMBRAR (Caixa ➔ Unidade)
                                    <span className="text-[10px] font-bold mt-1 text-center">Multiplica QTD<br/>Divide Custo</span>
                                </button>

                                <button
                                    onClick={() => setModalConversao(p => ({ ...p, tipo: 'AGRUPAR' }))}
                                    className={`flex-1 p-4 rounded-xl border-2 font-black flex flex-col items-center justify-center gap-2 transition-all ${modalConversao.tipo === 'AGRUPAR' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' : 'border-slate-200 bg-white text-slate-400 hover:border-orange-300'}`}
                                >
                                    <ArrowUpFromLine size={24}/>
                                    AGRUPAR (Unidade ➔ Caixa)
                                    <span className="text-[10px] font-bold mt-1 text-center">Divide QTD<br/>Multiplica Custo</span>
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <label className="block text-sm font-black text-slate-500 uppercase mb-4">
                                    {modalConversao.tipo === 'DESMEMBRAR' ? 'Quantas unidades vêm dentro da Caixa/Jogo?' : 'Quantas unidades formam 1 Caixa/Jogo?'}
                                </label>
                                <div className="flex items-center justify-center gap-4">
                                    <input
                                        type="number"
                                        autoFocus
                                        min="2"
                                        value={modalConversao.fatorInput}
                                        onChange={(e) => setModalConversao(p => ({...p, fatorInput: e.target.value}))}
                                        placeholder="Ex: 24"
                                        className="w-32 text-center text-4xl font-black py-4 border-b-4 border-slate-300 focus:border-blue-500 outline-none text-slate-800 transition-colors"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                            <button onClick={fecharModalConversao} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar (ESC)</button>
                            <button onClick={confirmarAplicacaoConversao} className="flex-1 py-4 font-black text-white bg-slate-900 hover:bg-blue-600 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2">
                                <CheckCircle size={20}/> APLICAR MATEMÁTICA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VÍNCULO */}
            {modalVinculo.aberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div><h3 className="text-xl font-black flex items-center gap-2"><LinkIcon size={20}/> Vincular ao Estoque</h3><p className="text-sm text-blue-200 mt-1">{modalVinculo.item?.nome}</p></div>
                            <button onClick={fecharModalVinculo} className="text-blue-200 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                                <input type="text" autoFocus value={termoBuscaVinculo} onChange={(e) => { setTermoBuscaVinculo(e.target.value); buscarProdutoNoEstoque(e.target.value); }} placeholder="Buscar produto..." className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-lg outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3 min-h-[300px]">
                            {buscandoEstoque ? <div className="text-center text-blue-500 py-10 font-bold">Buscando...</div> : resultadosBuscaEstoque.length === 0 ? <div className="text-center text-slate-400 py-10 font-bold">Nenhum produto encontrado.</div> : (
                                resultadosBuscaEstoque.map(prod => (
                                    <div key={prod.id} className="flex justify-between items-center p-4 border-2 border-slate-100 rounded-xl hover:border-blue-300 transition-all">
                                        <div><h4 className="font-black text-slate-800">#{prod.id} - {prod.nome}</h4><p className="text-xs font-bold text-slate-500 mt-1">Estoque: {prod.quantidadeEstoque || 0}</p></div>
                                        <button onClick={() => selecionarVinculo(prod)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-3 rounded-xl font-black text-xs transition-colors">VINCULAR</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🚀 CABEÇALHO DO ESPELHO (ONDE O BOTÃO DE IMPRIMIR ENTROU) */}
            <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm sticky top-0 z-20">
                <button onClick={voltarParaLista} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black transition-colors"><ArrowLeft size={20} /> VOLTAR</button>
                <div className="flex gap-4">
                    {/* 🚀 NOVO BOTÃO DE IMPRESSÃO AQUI */}
                    <button
                        onClick={imprimirEspelhoNota}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl font-black text-slate-600 bg-white border-2 border-slate-200 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                    >
                        <Printer size={20} /> IMPRIMIR ESPELHO
                    </button>

                    <button onClick={confirmarConferencia} disabled={notaSelecionada.status === 'Finalizado'} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black shadow-lg transition-all ${notaSelecionada.status === 'Finalizado' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30 hover:-translate-y-1'}`}>
                        <CheckCircle size={20} /> {notaSelecionada.status === 'Finalizado' ? 'NOTA FINALIZADA' : 'SALVAR PREÇOS E VÍNCULOS (F10)'}
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 max-w-[1400px] mx-auto w-full space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border flex flex-col justify-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Fornecedor</p>
                        <p className="text-xl font-black uppercase text-slate-800 leading-tight">{notaSelecionada.fornecedorNome}</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-900/20 text-white flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Valor Total Importado</p>
                            <p className="text-5xl font-black text-emerald-400 tracking-tighter">{formatarMoeda(notaSelecionada.valorTotalNota)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="p-4 min-w-[250px]">SKU / Peça (De-Para)</th>
                                <th className="p-4 text-center border-l border-slate-200 bg-slate-100">XML (Origem)</th>
                                <th className="p-4 text-center bg-slate-800 text-white">Conversão de Embalagem</th>
                                <th className="p-4 text-right bg-blue-50">Entrada Real no Estoque</th>
                                <th className="p-4 w-32 text-right border-l border-slate-200">Margem %</th>
                                <th className="p-4 w-48 text-right bg-emerald-50">Preço Venda Unit.</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itensNota.map((item, idx) => {

                                const conversao = conversaoEmbalagem[idx] || null;
                                let qtdXml = Number(item.quantidade || 1);
                                let custoXml = Number(item.precoCusto || 0);

                                let qtdFinal = qtdXml;
                                let custoUnitarioFinal = custoXml;

                                if (conversao && conversao.fator > 1) {
                                    if (conversao.tipo === 'DESMEMBRAR') {
                                        qtdFinal = qtdXml * conversao.fator;
                                        custoUnitarioFinal = custoXml / conversao.fator;
                                    } else if (conversao.tipo === 'AGRUPAR') {
                                        qtdFinal = qtdXml / conversao.fator;
                                        custoUnitarioFinal = custoXml * conversao.fator;
                                    }
                                }

                                const vendaAtual = Number(precosVenda[idx] || 0);
                                const markupAtual = custoUnitarioFinal > 0 ? (((vendaAtual / custoUnitarioFinal) - 1) * 100).toFixed(2) : "0.00";

                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">

                                        <td className="p-4">
                                            <p className="font-black text-slate-700 uppercase text-sm leading-tight mb-2">
                                                {vinculos[idx] ? vinculos[idx].nome : item.nome}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Ref: {item.sku || 'S/N'}</span>

                                                {vinculos[idx] ? (
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-indigo-200">
                                                        <LinkIcon size={10}/> Vinculado (Estoque: {vinculos[idx].estoqueAtual})
                                                        <button onClick={() => removerVinculo(idx)} className="ml-1 text-indigo-400 hover:text-red-500"><X size={12}/></button>
                                                    </span>
                                                ) : item.produtoId ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-green-200">
                                                        <CheckCircle size={10}/> Conhecido (Estoque: {item.estoqueAtual || 0})
                                                    </span>
                                                ) : (
                                                    <button onClick={() => abrirModalVinculo(item, idx)} className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1 rounded font-bold transition-all flex items-center gap-1 border border-blue-200"><Search size={10}/> Vincular Estoque</button>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 text-center border-l border-slate-200 bg-slate-50">
                                            <p className="font-black text-slate-500 text-lg">{qtdXml} <span className="text-xs uppercase">{item.unidadeMedida || 'UN'}</span></p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{formatarMoeda(custoXml)}</p>
                                        </td>

                                        <td className="p-4 text-center">
                                            {conversao ? (
                                                <div className="flex flex-col items-center gap-1 animate-fade-in">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 ${conversao.tipo === 'DESMEMBRAR' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                        {conversao.tipo === 'DESMEMBRAR' ? <ArrowDownToLine size={12}/> : <ArrowUpFromLine size={12}/>}
                                                        {conversao.tipo} (x{conversao.fator})
                                                    </span>
                                                    <button onClick={() => removerConversao(idx)} className="text-[10px] text-slate-400 font-bold hover:text-red-500 hover:underline">Remover</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => abrirModalConversao(item, idx)} className="mx-auto flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all w-24 h-16 group">
                                                    <ArrowRightLeft size={16} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Converter</span>
                                                </button>
                                            )}
                                        </td>

                                        <td className="p-4 text-right bg-blue-50/30">
                                            <p className="font-black text-blue-600 text-xl tracking-tighter">
                                                +{qtdFinal} <span className="text-xs uppercase">UN</span>
                                            </p>
                                            <p className="text-xs font-bold text-slate-500 mt-1 bg-white inline-block px-2 py-0.5 rounded shadow-sm border border-slate-100">
                                                Custo: {formatarMoeda(custoUnitarioFinal)}
                                            </p>
                                        </td>

                                        <td className="p-4 border-l border-slate-200">
                                            <div className="relative">
                                                <input
                                                    type="number" step="0.1" value={markupAtual} onChange={(e) => alterarMarkup(idx, custoUnitarioFinal, e.target.value)}
                                                    className={`w-full pl-2 pr-6 py-3 border-2 rounded-xl font-black focus:border-blue-500 outline-none text-right shadow-sm ${Number(markupAtual) < 20 ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200'}`}
                                                />
                                                <Percent className={`absolute right-2 top-1/2 -translate-y-1/2 ${Number(markupAtual) < 20 ? 'text-red-400' : 'text-slate-400'}`} size={12} />
                                            </div>
                                        </td>

                                        <td className="p-4 bg-emerald-50/50">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                                                <input
                                                    type="text" value={formatMaskDisplay(precosVenda[idx] || 0)} onChange={(e) => handlePrecoChangeMask(idx, e.target.value)}
                                                    className="w-full pl-8 pr-3 py-3 border-2 border-slate-200 rounded-xl font-black text-slate-800 focus:border-emerald-500 focus:ring-2 outline-none text-right shadow-sm bg-white"
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
            </div>
        </div>
    );
};