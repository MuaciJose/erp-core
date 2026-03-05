import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Search, FileText, Printer, CheckCircle, Package, User,
    Trash2, ArrowRight, Tag, Percent, DollarSign, Save, FolderOpen, Car, X, Gauge, Phone, UserPlus, RefreshCw, AlertTriangle, Info
} from 'lucide-react';

import toast from 'react-hot-toast';

export const OrcamentoPedido = ({ orcamentoParaEditar, onVoltar }) => {
    const [modo, setModo] = useState('ORCAMENTO');
    const [itens, setItens] = useState([]);
    const [orcamentoId, setOrcamentoId] = useState(null);

    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');

    const [empresaConfig, setEmpresaConfig] = useState({
        nomeFantasia: '', razaoSocial: '', enderecoString: '', cnpj: '', telefone: '', mensagemRodape: ''
    });

    const [buscaPeca, setBuscaPeca] = useState('');
    const [resultadosPecas, setResultadosPecas] = useState([]);
    const [indexFocadoPeca, setIndexFocadoPeca] = useState(-1);
    const inputPecaRef = useRef(null);

    const [descontoTipo, setDescontoTipo] = useState('VALOR');
    const [descontoInput, setDescontoInput] = useState('');
    const [modalListaAberto, setModalListaAberto] = useState(false);
    const [orcamentosSalvos, setOrcamentosSalvos] = useState([]);
    const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState(false);
    const [novoCliente, setNovoCliente] = useState({ nome: '', documento: '', telefone: '', placa: '', marca: '', modelo: '', ano: '', km: '' });

    const limparCliente = () => {
        setClienteSelecionado(null);
        setBuscaCliente('');
        setVeiculoSelecionado('');
    };

    useEffect(() => {
        if (orcamentoParaEditar) {
            setOrcamentoId(orcamentoParaEditar.id);
            setModo(orcamentoParaEditar.status || 'ORCAMENTO');

            const itensMapeados = (orcamentoParaEditar.itens || []).map(i => ({
                id: i.produto?.id || i.id,
                produtoId: i.produto?.id || i.id,
                codigo: i.produto?.sku || i.codigo || '---',
                nome: i.produto?.nome || i.nome,
                qtd: i.quantidade || i.qtd || 1,
                preco: i.precoUnitario || i.preco || 0,
                estoqueDisponivel: i.produto?.quantidadeEstoque ?? 0
            }));

            setItens(itensMapeados);
            setDescontoInput(orcamentoParaEditar.desconto?.toString() || '');

            const restaurarDadosCliente = async () => {
                const termoBusca = orcamentoParaEditar.cliente?.nome || orcamentoParaEditar.cliente;
                if (termoBusca && termoBusca !== 'Consumidor Final') {
                    try {
                        const res = await api.get(`/api/parceiros?busca=${termoBusca}`);
                        const clienteFull = res.data.find(c => c.nome === termoBusca);
                        if (clienteFull) {
                            setClienteSelecionado(clienteFull);
                            setBuscaCliente(clienteFull.nome);
                            const resV = await api.get(`/api/veiculos/cliente/${clienteFull.id}`);
                            setClienteSelecionado(prev => ({ ...prev, veiculos: resV.data || [] }));
                            if (orcamentoParaEditar.veiculo?.id) setVeiculoSelecionado(orcamentoParaEditar.veiculo.id);
                        }
                    } catch (e) { console.error(e); }
                }
            };
            restaurarDadosCliente();
        }
    }, [orcamentoParaEditar]);

    // =================================================================================
    // 🚀 BUSCA CONFIGURAÇÃO (Lendo o campo 'endereco' completo em String)
    // =================================================================================
    useEffect(() => {
        api.get('/api/configuracoes')
            .then(res => {
                if (res.data) {
                    const data = Array.isArray(res.data) ? res.data[0] : res.data;

                    setEmpresaConfig({
                        nomeFantasia: data?.nomeFantasia || 'GRANDPORT ERP',
                        razaoSocial: data?.razaoSocial || '',
                        // Pega o endereço gigante que o Java manda e salva aqui
                        enderecoString: data?.endereco || '',
                        cnpj: data?.cnpj || '',
                        telefone: data?.telefone || '',
                        mensagemRodape: data?.mensagemRodape || 'Orçamento válido por 5 dias.'
                    });
                }
            })
            .catch(err => console.error("Erro ao buscar configs", err));
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaCliente.length > 2 && !clienteSelecionado) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    setResultadosClientes(res.data.filter(p => p.tipo === 'CLIENTE' || p.tipo === 'AMBOS'));
                } catch (e) { setResultadosClientes([]); }
            } else setResultadosClientes([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaCliente, clienteSelecionado]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaPeca.length > 1) {
                try {
                    const res = await api.get(`/api/produtos?busca=${buscaPeca}`);
                    setResultadosPecas(res.data);
                    setIndexFocadoPeca(0);
                } catch (e) { setResultadosPecas([]); }
            } else { setResultadosPecas([]); setIndexFocadoPeca(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaPeca]);

    const selecionarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setBuscaCliente(cliente.nome);
        setResultadosClientes([]);
        api.get(`/api/veiculos/cliente/${cliente.id}`).then(res => {
            setClienteSelecionado(prev => ({ ...prev, veiculos: res.data || [] }));
            if(res.data?.length === 1) setVeiculoSelecionado(res.data[0].id);
        });
    };

    const adicionarItem = (peca) => {
        const existe = itens.find(i => i.id === peca.id || i.produtoId === peca.id);
        if (existe) {
            setItens(itens.map(i => (i.id === peca.id || i.produtoId === peca.id) ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItens([...itens, { produtoId: peca.id, id: peca.id, codigo: peca.sku, nome: peca.nome, qtd: 1, preco: peca.precoVenda || 0, estoqueDisponivel: peca.quantidadeEstoque || 0 }]);
        }
        toast.success("Item adicionado");
        setBuscaPeca(''); setResultadosPecas([]); inputPecaRef.current.focus();
    };

    const subtotal = itens.reduce((acc, item) => acc + ((item.preco || 0) * (item.qtd || 0)), 0);
    let valorDescontoReal = descontoTipo === 'VALOR' ? (parseFloat(descontoInput) || 0) : subtotal * ((parseFloat(descontoInput) || 0) / 100);
    const totalFinal = Math.max(0, subtotal - valorDescontoReal);

    const validarEstoqueNoFront = () => {
        const itensSemEstoque = itens.filter(item => item.qtd > (item.estoqueDisponivel ?? 0));
        if (itensSemEstoque.length > 0) {
            const listaNomes = itensSemEstoque.map(i => `• ${i.nome} (Pedido: ${i.qtd} | Estoque: ${i.estoqueDisponivel ?? 0})`).join('\n');
            toast.error(`Estoque Insuficiente:\n${listaNomes}`, { duration: 6000, style: { minWidth: '350px' } });
            return false;
        }
        return true;
    };

    const processarVendaAPI = async (statusDesejado) => {
        if (itens.length === 0) return toast.error("O documento não possui itens.");

        const statusFinal = (statusDesejado === 'ORCAMENTO' && modo === 'PEDIDO') ? 'PEDIDO' : statusDesejado;
        if ((statusFinal === 'PEDIDO' || statusFinal === 'AGUARDANDO_PAGAMENTO') && !validarEstoqueNoFront()) return;

        const loadId = toast.loading(statusFinal === 'PEDIDO' ? "Salvando pedido..." : "Salvando rascunho...");

        const payload = {
            id: orcamentoId,
            status: statusFinal,
            itens: itens.map(i => ({ produtoId: i.produtoId || i.id, quantidade: i.qtd, precoUnitario: i.preco })),
            desconto: valorDescontoReal,
            parceiroId: clienteSelecionado?.id || null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null
        };

        try {
            if (orcamentoId) {
                await api.put(`/api/vendas/orcamento/${orcamentoId}`, payload);
            } else {
                const rota = statusFinal === 'PEDIDO' ? '/api/vendas/pedido' : '/api/vendas/orcamento';
                const res = await api.post(rota, payload);
                setOrcamentoId(res.data.id);
            }

            toast.success(statusFinal === 'PEDIDO' ? "Pedido salvo!" : "Orçamento guardado!", { id: loadId });

            if (statusFinal === 'AGUARDANDO_PAGAMENTO') {
                limparEcra();
                if (onVoltar) onVoltar();
            } else {
                setModo(statusFinal);
            }
        } catch (e) {
            const msgServidor = e.response?.data?.message || e.response?.data || "Erro no servidor.";
            if (msgServidor.includes("Estoque insuficiente")) {
                toast.error(msgServidor, { id: loadId, duration: 6000, style: { border: '2px solid #ef4444', fontWeight: 'bold' } });
            } else {
                toast.error("Falha ao salvar: " + msgServidor, { id: loadId });
            }
        }
    };

    const limparEcra = () => {
        setItens([]); limparCliente(); setModo('ORCAMENTO'); setOrcamentoId(null);
    };

    const carregarOrcamentoLocal = async (orcamento) => {
        setOrcamentoId(orcamento.id);
        setModo(orcamento.status);
        if (orcamento.clienteObj) selecionarCliente(orcamento.clienteObj);
        else limparCliente();

        setItens(orcamento.itens || []);
        setModalListaAberto(false);
        toast.success(`Documento #${orcamento.id} reaberto.`);
    };

    useEffect(() => {
        if (modalListaAberto) {
            api.get('/api/vendas/orcamentos')
                .then(res => {
                    const formatados = res.data.map(orc => ({
                        id: orc.id, data: orc.dataHora, cliente: orc.cliente ? orc.cliente.nome : 'Cliente Avulso', clienteObj: orc.cliente,
                        veiculo: orc.veiculo ? orc.veiculo.modelo : 'Nenhum', veiculoId: orc.veiculo?.id, valor: orc.valorTotal || 0, status: orc.status,
                        itens: (orc.itens || []).map(i => ({ produtoId: i.produto?.id, id: i.produto?.id, codigo: i.produto?.sku, nome: i.produto?.nome, qtd: i.quantidade || 0, preco: i.precoUnitario || 0, estoqueDisponivel: i.produto?.quantidadeEstoque ?? 0 }))
                    }));
                    setOrcamentosSalvos(formatados);
                })
                .catch(() => toast.error("Erro ao carregar lista."));
        }
    }, [modalListaAberto]);

    const veiculoDetalhado = clienteSelecionado?.veiculos?.find(v => v.id == veiculoSelecionado);

    return (
        <div className="flex flex-col h-full bg-white relative z-[15]">
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-in relative print:hidden">

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 z-40">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-2 rounded-xl"><FileText size={24}/></div>
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{modo} #{orcamentoId || 'NOVO'}</h1>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={limparEcra} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black border border-red-100"><Trash2 size={18} /></button>
                            <button onClick={() => setModalListaAberto(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black shadow-lg"><FolderOpen size={18} /> GUARDADOS</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input type="text" placeholder="Pesquisar Cliente..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} disabled={!!clienteSelecionado} className="w-full pl-10 pr-10 py-3 border-2 rounded-xl font-bold focus:border-blue-500 bg-slate-50 outline-none transition-all" />
                            {clienteSelecionado && <button onClick={limparCliente} className="absolute right-3 top-3 text-red-400"><X size={20}/></button>}
                            {resultadosClientes.length > 0 && !clienteSelecionado && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {resultadosClientes.map(c => <div key={c.id} onClick={() => selecionarCliente(c)} className="p-4 hover:bg-blue-50 cursor-pointer border-b font-bold text-slate-700">{c.nome}</div>)}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Car className="absolute left-3 top-3 text-slate-400" size={20} />
                            <select value={veiculoSelecionado} onChange={(e) => setVeiculoSelecionado(e.target.value)} disabled={!clienteSelecionado} className="w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold bg-slate-50 outline-none appearance-none focus:border-blue-500 transition-all">
                                <option value="">Selecione o Veículo...</option>
                                {clienteSelecionado?.veiculos?.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="relative mb-6 z-30">
                    <Search className="absolute left-4 top-4 text-slate-400" size={24} />
                    <input ref={inputPecaRef} type="text" value={buscaPeca} onChange={(e) => setBuscaPeca(e.target.value)} onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setIndexFocadoPeca(p => Math.min(resultadosPecas.length - 1, p + 1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexFocadoPeca(p => Math.max(0, p - 1)); }
                        else if (e.key === 'Enter' && resultadosPecas[indexFocadoPeca]) { adicionarItem(resultadosPecas[indexFocadoPeca]); }
                    }} placeholder="Adicionar peça ao balcão..." className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg font-black shadow-sm focus:border-blue-600 outline-none transition-all" />
                    {resultadosPecas.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border z-50 max-h-60 overflow-y-auto">
                            {resultadosPecas.map((peca, idx) => (
                                <div key={peca.id} onClick={() => adicionarItem(peca)} className={`p-4 border-b flex justify-between cursor-pointer transition-colors ${idx === indexFocadoPeca ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'}`}>
                                    <div><p className="font-bold">{peca.nome}</p><p className={`text-xs ${idx === indexFocadoPeca ? 'text-blue-100' : 'text-slate-400'}`}>{peca.sku}</p></div>
                                    <p className="font-black">R$ {(peca.precoVenda || 0).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-white rounded-t-3xl border border-slate-200 overflow-hidden flex flex-col z-10">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 shadow-sm">
                            <tr><th className="p-4">Cód. SKU</th><th className="p-4">Descrição</th><th className="p-4 text-center">Qtd</th><th className="p-4 text-right pr-6">Subtotal</th><th className="p-4"></th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itens.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 border-b">
                                    <td className="p-4 font-mono text-xs">{item.codigo}</td>
                                    <td className="p-4 font-bold text-slate-800 text-sm">{item.nome}</td>
                                    <td className="p-4 text-center">
                                        <input type="number" value={item.qtd} onChange={(e) => setItens(itens.map(i => i.id === item.id ? { ...i, qtd: Math.max(1, parseInt(e.target.value) || 1) } : i))} className="w-16 p-2 text-center font-black border-2 border-slate-100 rounded-lg outline-none focus:border-blue-500" />
                                    </td>
                                    <td className="p-4 text-right font-black text-blue-700 pr-6">R$ {(item.preco * item.qtd).toFixed(2)}</td>
                                    <td className="p-4 text-center"><button onClick={() => setItens(itens.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-b-3xl border-t-4 border-blue-500 p-6 flex flex-col md:flex-row justify-between items-center shadow-2xl">
                    <div className="flex gap-3">
                        <button onClick={() => processarVendaAPI(modo === 'PEDIDO' ? 'PEDIDO' : 'ORCAMENTO')} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 font-black rounded-2xl border border-slate-700 transition-all">
                            {modo === 'PEDIDO' ? 'SALVAR ALTERAÇÕES' : 'SALVAR RASCUNHO'}
                        </button>

                        <button onClick={() => window.print()} className="px-6 py-4 bg-white text-slate-900 font-black rounded-2xl flex items-center gap-2 shadow-xl hover:bg-slate-100 transition-all"><Printer size={20}/> IMPRIMIR</button>

                        {modo === 'ORCAMENTO' && (
                            <button onClick={() => processarVendaAPI('PEDIDO')} className="px-6 py-4 bg-orange-500 text-white font-black rounded-2xl flex items-center gap-2 shadow-orange-500/20 hover:bg-orange-600 transition-all">
                                CONVERTER PRA PEDIDO <ArrowRight size={20}/>
                            </button>
                        )}

                        {modo === 'PEDIDO' && <button onClick={() => processarVendaAPI('AGUARDANDO_PAGAMENTO')} className="px-8 py-4 bg-green-600 font-black rounded-2xl animate-pulse hover:bg-green-700">ENVIAR AO CAIXA</button>}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Valor Líquido Final</span>
                        <h2 className="text-5xl font-black text-green-400 tracking-tighter">R$ {totalFinal.toFixed(2)}</h2>
                    </div>
                </div>
            </div>

            {/* ========================================================================================= */}
            {/* 🎯 ÁREA DE IMPRESSÃO A4 (COM ENDEREÇO EM BLOCO PRE-LINE) */}
            {/* ========================================================================================= */}
            <div className="hidden print:block fixed inset-0 w-full h-full bg-white z-[99999] p-0 text-black">
                <div className="w-full max-w-[210mm] mx-auto p-6 font-sans text-slate-900">

                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div className="flex-1">
                            <h1 className="text-xl font-black uppercase leading-none mb-1">{empresaConfig.nomeFantasia}</h1>
                            <p className="text-[9px] font-bold text-slate-600 uppercase mb-2">{empresaConfig.razaoSocial}</p>

                            <div className="text-[9.5px] leading-tight font-medium text-slate-700">
                                {/* O segredo está no whitespace-pre-line, ele respeita as quebras \n do Java! */}
                                {empresaConfig.enderecoString && (
                                    <div className="whitespace-pre-line mb-1 uppercase font-bold text-slate-600">
                                        {empresaConfig.enderecoString}
                                    </div>
                                )}

                                <p className="mt-1">
                                    {empresaConfig.cnpj && `CNPJ: ${empresaConfig.cnpj}`}
                                    {empresaConfig.cnpj && empresaConfig.telefone && ' | '}
                                    {empresaConfig.telefone && <span className="font-bold">WhatsApp/Tel: {empresaConfig.telefone}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="bg-black text-white px-3 py-1.5 rounded mb-1">
                                <h2 className="text-md font-black uppercase leading-none">{modo}</h2>
                            </div>
                            <p className="text-[9px] font-black uppercase">Nº DOC: <span className="text-blue-700">{orcamentoId || 'PROVISÓRIO'}</span></p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 border border-black rounded mb-3 text-[9px]">
                        <div className="col-span-3 p-1.5 border-r border-black">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Identificação do Cliente</p>
                            <p className="font-black uppercase truncate">{clienteSelecionado?.nome || 'CLIENTE NÃO IDENTIFICADO'}</p>
                            <p className="font-bold">DOC: {clienteSelecionado?.documento || '---'} | TEL: {clienteSelecionado?.telefone || '---'}</p>
                        </div>
                        <div className="col-span-2 p-1.5 bg-slate-50">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Veículo em Atendimento</p>
                            {veiculoDetalhado ? (
                                <>
                                    <p className="font-black uppercase truncate">{veiculoDetalhado.marca} {veiculoDetalhado.modelo}</p>
                                    <p className="font-bold uppercase">PLACA: {veiculoDetalhado.placa} | KM: {veiculoDetalhado.km}</p>
                                </>
                            ) : (
                                <p className="font-bold italic text-slate-400 text-center py-2">VENDA BALCÃO</p>
                            )}
                        </div>
                    </div>

                    <table className="w-full mb-6 border-collapse">
                        <thead>
                        <tr className="bg-slate-100 border-y border-black">
                            <th className="p-1 text-left text-[8px] font-black uppercase w-16">Cód.</th>
                            <th className="p-1 text-left text-[8px] font-black uppercase">Descrição das Peças / Serviços</th>
                            <th className="p-1 text-center text-[8px] font-black uppercase w-12">Qtd</th>
                            <th className="p-1 text-right text-[8px] font-black uppercase w-20">Unitário</th>
                            <th className="p-1 text-right text-[8px] font-black uppercase w-20">Subtotal</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {itens.map((item, index) => (
                            <tr key={index} className={`border-b border-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <td className="p-1 text-[8.5px] font-mono text-slate-500">{item.codigo}</td>
                                <td className="p-1 text-[9px] font-bold uppercase">{item.nome}</td>
                                <td className="p-1 text-center text-[9px] font-bold">{item.qtd}</td>
                                <td className="p-1 text-right text-[9px]">{item.preco.toFixed(2)}</td>
                                <td className="p-1 text-right text-[9px] font-black">{(item.preco * item.qtd).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-start mt-4">
                        <div className="w-2/3 pr-10">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Termos e Condições</p>
                            <p className="text-[8.5px] text-slate-600 border-l-2 border-slate-200 pl-2">
                                {empresaConfig.mensagemRodape || 'Orçamento sujeito a alteração de preços após validade. Peças sob disponibilidade.'}
                            </p>
                        </div>
                        <div className="w-1/3 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>SUBTOTAL BRUTO:</span><span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-orange-600">
                                <span>DESCONTO:</span><span>- R$ {valorDescontoReal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-black pt-1 mt-1">
                                <span className="text-[11px] font-black uppercase">TOTAL LÍQUIDO:</span>
                                <span className="text-[18px] font-black">R$ {totalFinal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 grid grid-cols-2 gap-16 px-4">
                        <div className="border-t border-black text-center pt-1"><p className="text-[7.5px] font-black uppercase">Assinatura do Cliente</p></div>
                        <div className="border-t border-black text-center pt-1"><p className="text-[7.5px] font-black uppercase text-slate-400">Emissor: {empresaConfig.nomeFantasia}</p></div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0.3cm; }
                    body { margin: 0; padding: 0; background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block, .print\\:block * { visibility: visible !important; }
                    html, body { overflow: visible !important; height: auto !important; }
                }
            `}</style>
        </div>
    );
};