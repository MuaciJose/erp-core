import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Search, FileText, Printer, CheckCircle, Package, User,
    Trash2, ArrowRight, Tag, Percent, DollarSign, Save, FolderOpen, Car, X, Gauge, Phone
} from 'lucide-react';

export const OrcamentoPedido = ({ orcamentoParaEditar, onVoltar }) => {
    // ESTADOS GERAIS DO PEDIDO
    const [modo, setModo] = useState('ORCAMENTO');
    const [itens, setItens] = useState([]);
    const [orcamentoId, setOrcamentoId] = useState(null);

    // ESTADOS DO CLIENTE E VEÍCULO
    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');

    // ESTADOS DE BUSCA DE PEÇAS
    const [buscaPeca, setBuscaPeca] = useState('');
    const [resultadosPecas, setResultadosPecas] = useState([]);
    const [indexFocadoPeca, setIndexFocadoPeca] = useState(-1);
    const inputPecaRef = useRef(null);

    // ESTADOS FINANCEIROS E REABERTURA
    const [descontoTipo, setDescontoTipo] = useState('VALOR');
    const [descontoInput, setDescontoInput] = useState('');
    const [modalListaAberto, setModalListaAberto] = useState(false);
    const [orcamentosSalvos, setOrcamentosSalvos] = useState([]);

    // EFEITO PARA CARREGAR ORÇAMENTO PARA EDIÇÃO (Vindo da Gestão de Vendas)
    useEffect(() => {
        if (orcamentoParaEditar) {
            setOrcamentoId(orcamentoParaEditar.id);
            setModo(orcamentoParaEditar.tipo || 'ORCAMENTO');
            setItens(orcamentoParaEditar.itens || []);
            setDescontoInput(orcamentoParaEditar.desconto?.toString() || '');

            // Busca o cliente completo para restaurar o estado
            const restaurarCliente = async () => {
                try {
                    const res = await api.get(`/api/parceiros?busca=${orcamentoParaEditar.cliente}`);
                    const cliente = res.data.find(c => c.nome === orcamentoParaEditar.cliente);
                    if (cliente) {
                        selecionarCliente(cliente);
                    }
                } catch (e) { console.error(e); }
            };
            restaurarCliente();
        }
    }, [orcamentoParaEditar]);

    // Busca Clientes no Backend
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (buscaCliente.length > 2 && !clienteSelecionado) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    if (Array.isArray(res.data)) {
                        setResultadosClientes(res.data.filter(p => p.tipo === 'CLIENTE' || p.tipo === 'AMBOS'));
                    } else {
                        setResultadosClientes([]);
                    }
                } catch (error) {
                    console.error("Erro ao buscar clientes", error);
                    setResultadosClientes([]);
                }
            } else {
                setResultadosClientes([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [buscaCliente, clienteSelecionado]);

    const selecionarCliente = async (cliente) => {
        setClienteSelecionado(cliente);
        setBuscaCliente(cliente.nome);
        setResultadosClientes([]);

        try {
            const res = await api.get(`/api/veiculos/cliente/${cliente.id}`);
            setClienteSelecionado(prev => ({ ...prev, veiculos: res.data || [] }));

            if(res.data && res.data.length === 1) {
                setVeiculoSelecionado(res.data[0].id);
            }
        } catch (error) {
            console.error("Erro ao buscar veículos do cliente", error);
            setClienteSelecionado(prev => ({ ...prev, veiculos: [] }));
        }

        inputPecaRef.current?.focus();
    };

    const limparCliente = () => {
        setClienteSelecionado(null);
        setBuscaCliente('');
        setVeiculoSelecionado('');
    };

    const atualizarKmVeiculo = (novoKm) => {
        if(!clienteSelecionado || !veiculoSelecionado) return;
        const novosVeiculos = clienteSelecionado.veiculos.map(v => {
            if (v.id == veiculoSelecionado) {
                return { ...v, km: parseInt(novoKm) || 0 };
            }
            return v;
        });
        setClienteSelecionado(prev => ({ ...prev, veiculos: novosVeiculos }));
    };

    // Busca Peças no Backend
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (buscaPeca.length > 1) {
                try {
                    const res = await api.get(`/api/produtos?busca=${buscaPeca}`);
                    if (Array.isArray(res.data)) {
                        setResultadosPecas(res.data);
                        setIndexFocadoPeca(0);
                    } else {
                        setResultadosPecas([]);
                    }
                } catch (error) {
                    console.error("Erro ao buscar peças", error);
                    setResultadosPecas([]);
                }
            } else {
                setResultadosPecas([]);
                setIndexFocadoPeca(-1);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [buscaPeca]);

    const handleKeyDownPeca = (e) => {
        if (resultadosPecas.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndexFocadoPeca(prev => (prev < resultadosPecas.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndexFocadoPeca(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                adicionarItem(resultadosPecas[indexFocadoPeca]);
            }
        }
    };

    const adicionarItem = (peca) => {
        const itemExistente = itens.find(i => i.id === peca.id || i.produtoId === peca.id);
        if (itemExistente) {
            setItens(itens.map(i => (i.id === peca.id || i.produtoId === peca.id) ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItens(prev => [...prev, {
                produtoId: peca.id,
                id: peca.id,
                codigo: peca.sku,
                nome: peca.nome,
                qtd: 1,
                preco: peca.precoVenda || 0 // PROTEÇÃO AQUI
            }]);
        }
        setBuscaPeca('');
        setResultadosPecas([]);
        inputPecaRef.current.focus();
    };

    const removerItem = (id) => {
        setItens(itens.filter(i => (i.id !== id && i.produtoId !== id)));
    };

    const alterarQuantidade = (id, novaQtd) => {
        if (novaQtd < 1) return;
        setItens(itens.map(i => (i.id === id || i.produtoId === id) ? { ...i, qtd: novaQtd } : i));
    };

    // CARREGA ORÇAMENTOS SALVOS QUANDO O MODAL ABRE
    useEffect(() => {
        if (modalListaAberto) {
            const carregarOrcamentos = async () => {
                try {
                    const res = await api.get('/api/vendas/orcamentos');
                    const orcamentosFormatados = res.data.map(orc => ({
                        id: orc.id,
                        data: orc.dataHora,
                        cliente: orc.cliente ? orc.cliente.nome : 'Cliente Avulso',
                        clienteObj: orc.cliente,
                        veiculo: orc.veiculo ? orc.veiculo.modelo : 'Nenhum',
                        veiculoId: orc.veiculo ? orc.veiculo.id : null,
                        valor: orc.valorTotal || 0,
                        status: orc.status,
                        itens: (orc.itens || []).map(item => ({
                            produtoId: item.produto?.id,
                            id: item.produto?.id,
                            codigo: item.produto?.sku,
                            nome: item.produto?.nome,
                            qtd: item.quantidade || 0,
                            preco: item.precoUnitario || 0
                        }))
                    }));
                    setOrcamentosSalvos(orcamentosFormatados);
                } catch (error) {
                    console.error("Erro ao carregar orçamentos", error);
                }
            };
            carregarOrcamentos();
        }
    }, [modalListaAberto]);

    const subtotal = itens.reduce((acc, item) => acc + ((item.preco || 0) * (item.qtd || 0)), 0);
    let valorDescontoReal = descontoTipo === 'VALOR' ? (parseFloat(descontoInput) || 0) : subtotal * ((parseFloat(descontoInput) || 0) / 100);
    if (valorDescontoReal > subtotal) valorDescontoReal = subtotal;
    const totalFinal = subtotal - valorDescontoReal;

    const salvarOrcamento = async () => {
        if (itens.length === 0) return alert("Não pode guardar um orçamento vazio.");

        const payload = {
            itens: itens.map(item => ({ produtoId: item.produtoId || item.id, quantidade: item.qtd, precoUnitario: item.preco })),
            desconto: valorDescontoReal,
            parceiroId: clienteSelecionado ? clienteSelecionado.id : null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null
        };

        try {
            if (orcamentoId) {
                await api.put(`/api/vendas/orcamento/${orcamentoId}`, payload);
                alert(`Orçamento #${orcamentoId} atualizado com sucesso!`);
            } else {
                const res = await api.post('/api/vendas/orcamento', payload);
                alert(`Orçamento #${res.data.id} guardado com sucesso!`);
            }
            if (onVoltar) onVoltar();
            else limparEcra();
        } catch (error) {
            alert("Erro ao salvar orçamento.");
        }
    };

    const carregarOrcamentoLocal = async (orcamento) => {
        setOrcamentoId(orcamento.id);
        setItens(orcamento.itens);
        setModo(orcamento.status);
        if (orcamento.clienteObj) {
            selecionarCliente(orcamento.clienteObj);
        } else {
            limparCliente();
        }
        setModalListaAberto(false);
    };

    const limparEcra = () => {
        setItens([]); limparCliente(); setBuscaPeca(''); setDescontoInput(''); setModo('ORCAMENTO'); setOrcamentoId(null);
    };

    const enviarParaCaixa = async () => {
        if (itens.length === 0) return alert("O pedido está vazio!");
        const payload = {
            itens: itens.map(item => ({ produtoId: item.produtoId || item.id, quantidade: item.qtd, precoUnitario: item.preco })),
            desconto: valorDescontoReal,
            parceiroId: clienteSelecionado ? clienteSelecionado.id : null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null
        };
        try {
            const res = await api.post('/api/vendas/pedido', payload);
            alert(`Sucesso! O Pedido #${res.data.id} foi enviado para a fila da Caixa.`);
            if (onVoltar) onVoltar();
            else limparEcra();
        } catch (error) {
            alert("Erro ao enviar pedido.");
        }
    };

    const handleImprimir = () => {
        if (itens.length === 0) return alert("Adicione peças ao orçamento antes de imprimir.");
        window.print();
    };

    const veiculoDetalhado = clienteSelecionado && clienteSelecionado.veiculos && veiculoSelecionado
        ? clienteSelecionado.veiculos.find(v => v.id == veiculoSelecionado)
        : null;

    return (
        <div className="flex flex-col h-full">
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-in relative print:hidden">

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-40">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-slate-200 p-1 rounded-xl flex font-black text-sm uppercase tracking-widest cursor-pointer">
                                <div onClick={() => setModo('ORCAMENTO')} className={`px-4 py-2 rounded-lg transition-all ${modo === 'ORCAMENTO' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>Orçamento</div>
                                <div onClick={() => { if(itens.length > 0) setModo('PEDIDO') }} className={`px-4 py-2 rounded-lg transition-all ${modo === 'PEDIDO' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500'}`}>Pedido Oficial</div>
                            </div>
                            <button onClick={() => setModalListaAberto(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md">
                                <FolderOpen size={16} /> REABRIR GUARDADOS
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 relative">
                            <div className="flex-1 relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Nome ou CPF do Cliente..."
                                    value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} disabled={clienteSelecionado !== null}
                                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl font-bold outline-none transition-colors ${clienteSelecionado ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-700'}`}
                                />
                                {clienteSelecionado && <button onClick={limparCliente} className="absolute right-3 top-3.5 text-blue-400 hover:text-red-500"><X size={16}/></button>}
                                {resultadosClientes.length > 0 && !clienteSelecionado && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                        {resultadosClientes.map(c => (
                                            <div key={c.id} onClick={() => selecionarCliente(c)} className="p-3 hover:bg-slate-50 border-b cursor-pointer flex justify-between">
                                                <span className="font-bold text-slate-700">{c.nome}</span>
                                                <span className="text-xs text-slate-400">{c.documento}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 relative">
                                <Car className={`absolute left-3 top-3 ${clienteSelecionado ? 'text-blue-500' : 'text-slate-300'}`} size={18} />
                                <select
                                    value={veiculoSelecionado} onChange={(e) => setVeiculoSelecionado(e.target.value)} disabled={!clienteSelecionado}
                                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold outline-none appearance-none ${clienteSelecionado ? 'bg-white border-blue-200 text-slate-700 cursor-pointer focus:border-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <option value="">Selecione o Veículo...</option>
                                    {clienteSelecionado?.veiculos?.map(v => (
                                        <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {clienteSelecionado && (
                            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-6 animate-fade-in shadow-inner">
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><User size={12}/> Ficha do Cliente</h4>
                                    <p className="font-black text-slate-800 text-sm">{clienteSelecionado.nome}</p>
                                    <div className="flex flex-col gap-1 mt-2">
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2"><FileText size={12}/> CPF/CNPJ: {clienteSelecionado.documento}</p>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-2"><Phone size={12}/> {clienteSelecionado.telefone}</p>
                                    </div>
                                </div>
                                {veiculoDetalhado ? (
                                    <div className="flex-1 md:border-l border-slate-200 md:pl-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Car size={12}/> Dados Técnicos do Veículo</h4>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{veiculoDetalhado.marca} {veiculoDetalhado.modelo} ({veiculoDetalhado.ano})</p>
                                                <p className="text-xs font-bold text-slate-500 mt-1 bg-slate-200 inline-block px-2 py-1 rounded border border-slate-300">
                                                    Placa: <span className="font-mono text-slate-700 uppercase">{veiculoDetalhado.placa}</span>
                                                </p>
                                            </div>
                                            <div className="text-right bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">KM Atual</p>
                                                <div className="flex items-center gap-2">
                                                    <Gauge size={16} className="text-slate-400"/>
                                                    <input
                                                        type="number"
                                                        value={veiculoDetalhado.km || ''}
                                                        onChange={(e) => atualizarKmVeiculo(e.target.value)}
                                                        className="w-24 p-1 border-b-2 border-slate-300 text-right font-black text-slate-700 text-sm outline-none focus:border-blue-500 bg-transparent transition-colors"
                                                    />
                                                    <span className="text-xs font-bold text-slate-400">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 md:border-l border-slate-200 md:pl-6 flex items-center justify-center text-slate-400 text-sm font-bold bg-slate-100/50 rounded-lg border border-dashed">
                                        Selecione um veículo para ver motorização e KM
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative mb-6 z-30">
                    <Search className="absolute left-4 top-4 text-slate-400" size={24} />
                    <input
                        ref={inputPecaRef} type="text" value={buscaPeca} onChange={(e) => setBuscaPeca(e.target.value)} onKeyDown={handleKeyDownPeca}
                        placeholder="Pesquise Peças (Setas para navegar, Enter para adicionar ao carrinho)"
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg font-black text-slate-800 shadow-sm focus:border-blue-600 outline-none transition-all"
                    />
                    {resultadosPecas.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                            {resultadosPecas.map((peca, index) => (
                                <div key={peca.id} onClick={() => adicionarItem(peca)} className={`flex justify-between items-center p-4 cursor-pointer border-b ${index === indexFocadoPeca ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-100 p-2 rounded-lg"><Package size={20} className="text-slate-500" /></div>
                                        <div><p className="font-bold text-slate-800">{peca.nome}</p><p className="text-xs font-mono text-slate-500">{peca.sku}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-blue-700">R$ {(peca.precoVenda || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-white rounded-t-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0">
                            <tr>
                                <th className="p-4 pl-6">Código</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 text-center">Qtd</th>
                                <th className="p-4 text-right">Unitário</th>
                                <th className="p-4 text-right pr-6">Subtotal</th>
                                <th className="p-4"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {itens.length === 0 ? (
                                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold">Carrinho vazio. Use a busca acima.</td></tr>
                            ) : (
                                itens.map((item) => (
                                    <tr key={item.id || item.produtoId} className="border-b hover:bg-slate-50 group">
                                        <td className="p-4 pl-6 font-mono text-xs text-slate-500">{item.codigo}</td>
                                        <td className="p-4 font-bold text-slate-800 text-sm">{item.nome}</td>
                                        <td className="p-4 text-center">
                                            <input type="number" value={item.qtd} onChange={(e) => alterarQuantidade(item.id || item.produtoId, parseInt(e.target.value) || 1)} className="w-16 p-2 text-center font-black bg-white border-2 border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-600 text-sm">R$ {(item.preco || 0).toFixed(2)}</td>
                                        <td className="p-4 pr-6 text-right font-black text-blue-700">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                        <td className="p-4 text-center"><button onClick={() => removerItem(item.id || item.produtoId)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-b-3xl border-t-4 border-blue-500 shadow-2xl flex flex-col md:flex-row justify-between p-6 z-20 relative">
                    <div className="flex flex-col justify-end gap-3 mb-4 md:mb-0">
                        <button onClick={salvarOrcamento} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700">
                            <Save size={18} /> {orcamentoId ? 'ATUALIZAR GUARDADO' : 'GUARDAR PARA DEPOIS'}
                        </button>
                        {modo === 'ORCAMENTO' ? (
                            <div className="flex gap-2">
                                <button onClick={handleImprimir} className="px-6 py-4 bg-slate-100 text-slate-800 hover:bg-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                                    <Printer size={20} /> IMPRIMIR
                                </button>
                                <button onClick={() => setModo('PEDIDO')} disabled={itens.length === 0} className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                    GERAR PEDIDO <ArrowRight size={20} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={enviarParaCaixa} disabled={itens.length === 0} className="px-8 py-5 bg-green-500 hover:bg-green-600 font-black text-slate-900 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50">
                                <CheckCircle size={24} /> ENVIAR PARA O CAIXA / FINALIZAR
                            </button>
                        )}
                    </div>

                    <div className="w-full md:w-[400px] bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-slate-300 font-bold text-sm">
                            <span>Subtotal das Peças:</span><span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-dashed border-slate-600 pb-3">
                            <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Tag size={14} className="text-orange-400"/> Desconto:</span>
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button onClick={() => {setDescontoTipo(descontoTipo === 'VALOR' ? 'PERCENTUAL' : 'VALOR'); setDescontoInput('');}} className="p-1.5 bg-slate-800 rounded text-slate-400 hover:text-white">
                                    {descontoTipo === 'VALOR' ? <DollarSign size={14} /> : <Percent size={14} />}
                                </button>
                                <input type="number" placeholder="0.00" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)} className="w-20 bg-transparent text-right font-black text-orange-400 outline-none pr-2" />
                            </div>
                        </div>
                        <div className="flex justify-between items-end pt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{modo === 'ORCAMENTO' ? 'Total Cotação' : 'Total a Pagar'}</span>
                            <h2 className={`text-4xl font-black ${modo === 'ORCAMENTO' ? 'text-white' : 'text-green-400'}`}>R$ {totalFinal.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* O ESCUDO DE IMPRESSÃO - A MÁGICA ACONTECE AQUI!                           */}
            {/* ========================================================================= */}
            <>
                <style>
                    {`
                        @media print {
                            html, body, #root {
                                height: auto !important;
                                min-height: 100% !important;
                                overflow: visible !important;
                                background-color: white !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            body * {
                                visibility: hidden;
                            }
                            #area-impressao-orcamento, #area-impressao-orcamento * {
                                visibility: visible;
                            }
                            #area-impressao-orcamento {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                background: white !important;
                                padding: 0 !important;
                                margin: 0 !important;
                            }
                            @page { margin: 0; }
                        }
                    `}
                </style>

                <div id="area-impressao-orcamento" className="hidden print:block bg-white text-black font-sans">
                    <div className="w-[210mm] mx-auto p-10 font-sans">
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-widest">GRANDPORT</h1>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Auto Peças e Acessórios</p>
                                <p className="text-xs mt-2">CNPJ: 12.345.678/0001-90</p>
                                <p className="text-xs">Rua dos Motores, 123 - Centro - Telefone: (81) 9999-8888</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-black uppercase border-2 border-black px-4 py-2 rounded-lg inline-block">
                                    {modo === 'ORCAMENTO' ? 'ORÇAMENTO' : 'PEDIDO'}
                                </h2>
                                <p className="text-sm font-bold mt-2">Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="border border-black p-4 mb-6 rounded-lg flex justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Dados do Cliente</p>
                                <p className="font-black text-lg">{clienteSelecionado ? clienteSelecionado.nome : 'Cliente Avulso'}</p>
                                {clienteSelecionado && (
                                    <>
                                        <p className="text-sm">CPF/CNPJ: {clienteSelecionado.documento}</p>
                                        <p className="text-sm">Telefone: {clienteSelecionado.telefone}</p>
                                    </>
                                )}
                            </div>
                            {veiculoDetalhado && (
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">Viatura / Aplicação</p>
                                    <p className="font-black text-lg">{veiculoDetalhado.marca} {veiculoDetalhado.modelo} ({veiculoDetalhado.ano})</p>
                                    <p className="text-sm font-bold">Placa: <span className="uppercase">{veiculoDetalhado.placa}</span></p>
                                    <p className="text-sm font-black mt-1">KM Atual: {veiculoDetalhado.km || 0} km</p>
                                </div>
                            )}
                        </div>

                        <table className="w-full text-left border-collapse mb-6">
                            <thead className="border-b-2 border-black">
                            <tr>
                                <th className="py-2 text-xs font-black uppercase">Cód</th>
                                <th className="py-2 text-xs font-black uppercase">Descrição da Peça</th>
                                <th className="py-2 text-center text-xs font-black uppercase">Qtd</th>
                                <th className="py-2 text-right text-xs font-black uppercase">Vl. Unit</th>
                                <th className="py-2 text-right text-xs font-black uppercase">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {itens.map((item, index) => (
                                <tr key={index} className="border-b border-gray-300">
                                    <td className="py-2 text-xs font-mono">{item.codigo}</td>
                                    <td className="py-2 text-sm font-bold">{item.nome}</td>
                                    <td className="py-2 text-center font-bold">{item.qtd}</td>
                                    <td className="py-2 text-right text-sm">R$ {(item.preco || 0).toFixed(2)}</td>
                                    <td className="py-2 text-right font-black">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-12">
                            <div className="w-64">
                                <div className="flex justify-between border-b border-gray-300 py-1"><span className="text-sm font-bold">Subtotal:</span><span className="text-sm">R$ {subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between border-b border-gray-300 py-1"><span className="text-sm font-bold">Desconto:</span><span className="text-sm">- R$ {valorDescontoReal.toFixed(2)}</span></div>
                                <div className="flex justify-between mt-2 pt-2 border-t-2 border-black"><span className="text-lg font-black uppercase">Total a Pagar:</span><span className="text-2xl font-black">R$ {totalFinal.toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div className="text-center mt-12 pt-8 border-t border-gray-300">
                            {modo === 'ORCAMENTO' && <p className="text-xs font-bold uppercase mb-8">** Este orçamento é válido por 5 dias. **</p>}
                            <div className="w-1/2 mx-auto border-t border-black pt-2 mt-12">
                                <p className="text-sm font-bold uppercase">{clienteSelecionado ? clienteSelecionado.nome : 'Assinatura do Cliente / Mecânico'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>

            {/* MODAL: LISTA DE ORÇAMENTOS SALVOS */}
            {modalListaAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2"><FolderOpen /> REGISTOS GUARDADOS</h2>
                            <button onClick={() => setModalListaAberto(false)} className="hover:text-red-400"><X size={24}/></button>
                        </div>
                        <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                            {orcamentosSalvos.length === 0 ? (
                                <div className="text-center py-10 font-bold text-slate-400">Nenhum orçamento guardado no sistema.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {orcamentosSalvos.map(orc => (
                                        <div key={orc.id} onClick={() => carregarOrcamentoLocal(orc)} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-blue-100 text-blue-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-widest">#{orc.id}</span>
                                                    <span className={`font-black text-[10px] px-2 py-1 rounded uppercase tracking-widest ${orc.status === 'ORCAMENTO' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>{orc.status}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{new Date(orc.data).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <p className="font-bold text-slate-800 text-lg flex items-center gap-2"><User size={16} className="text-slate-400"/> {orc.cliente}</p>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1"><Car size={14} className="text-slate-400"/> Veículo: {orc.veiculo}</p>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valor Total</p>
                                                    <p className="font-black text-xl text-slate-800">R$ {(orc.valor || 0).toFixed(2)}</p>
                                                </div>
                                                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                                                    REABRIR E EDITAR
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};