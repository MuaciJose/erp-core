import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Search, FileText, Printer, CheckCircle, Package, User,
    Trash2, ArrowRight, Tag, Percent, DollarSign, Save, FolderOpen, Car, X, Gauge, Phone, UserPlus, RefreshCw, AlertTriangle, Info
} from 'lucide-react';

export const OrcamentoPedido = ({ orcamentoParaEditar, onVoltar }) => {
    // ESTADOS GERAIS
    const [modo, setModo] = useState('ORCAMENTO');
    const [itens, setItens] = useState([]);
    const [orcamentoId, setOrcamentoId] = useState(null);

    // ESTADOS DO CLIENTE E VEÍCULO
    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');

    // ESTADO DO CADASTRO RÁPIDO
    const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState(false);
    const [novoCliente, setNovoCliente] = useState({
        nome: '', documento: '', telefone: '', placa: '', marca: '', modelo: '', ano: '', km: ''
    });

    // ESTADOS DE PEÇAS
    const [buscaPeca, setBuscaPeca] = useState('');
    const [resultadosPecas, setResultadosPecas] = useState([]);
    const [indexFocadoPeca, setIndexFocadoPeca] = useState(-1);
    const inputPecaRef = useRef(null);

    // ESTADOS FINANCEIROS
    const [descontoTipo, setDescontoTipo] = useState('VALOR');
    const [descontoInput, setDescontoInput] = useState('');
    const [modalListaAberto, setModalListaAberto] = useState(false);
    const [orcamentosSalvos, setOrcamentosSalvos] = useState([]);

    // ESTADOS DE AUTO-SAVE E NOTIFICAÇÕES
    const [avisoRascunho, setAvisoRascunho] = useState(false);
    const [rascunhoCarregado, setRascunhoCarregado] = useState(false);
    const [notificacao, setNotificacao] = useState(null);

    // =================================================================================
    // SISTEMA DE NOTIFICAÇÕES PROFISSIONAIS
    // =================================================================================
    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => {
            setNotificacao(null);
        }, 4000);
    };

    // =================================================================================
    // FUNÇÃO DE VALIDAÇÃO DE ESTOQUE (FRONT-END)
    // =================================================================================
    const validarEstoqueNoFront = () => {
        const itensSemEstoque = itens.filter(item => item.qtd > (item.estoqueDisponivel || 0));

        if (itensSemEstoque.length > 0) {
            const listaNomes = itensSemEstoque.map(i => `• ${i.nome} (Pedido: ${i.qtd} | No Estoque: ${i.estoqueDisponivel || 0})`).join('\n');
            showToast('erro', 'Estoque Insuficiente', `Os seguintes itens excedem a quantidade disponível:\n\n${listaNomes}\n\nAjuste as quantidades antes de prosseguir.`);
            return false;
        }
        return true;
    };

    // =================================================================================
    // 1. RECUPERAÇÃO DO RASCUNHO AUTOMÁTICO
    // =================================================================================
    useEffect(() => {
        if (!orcamentoParaEditar) {
            const rascunhoSalvo = localStorage.getItem('RASCUNHO_BALCAO');
            if (rascunhoSalvo) {
                try {
                    const dados = JSON.parse(rascunhoSalvo);
                    if (dados.clienteSelecionado || dados.itens?.length > 0 || dados.buscaCliente) {
                        setModo(dados.modo || 'ORCAMENTO');
                        setItens(dados.itens || []);
                        setBuscaCliente(dados.buscaCliente || '');
                        if (dados.clienteSelecionado) {
                            setClienteSelecionado(dados.clienteSelecionado);
                        }
                        setVeiculoSelecionado(dados.veiculoSelecionado || '');
                        setDescontoTipo(dados.descontoTipo || 'VALOR');
                        setDescontoInput(dados.descontoInput || '');

                        setAvisoRascunho(true);
                        setTimeout(() => setAvisoRascunho(false), 5000);
                    }
                } catch (e) { console.error("Erro ao ler rascunho", e); }
            }
        }
        setRascunhoCarregado(true);
    }, [orcamentoParaEditar]);

    // 2. GRAVA O RASCUNHO A CADA TECLA DIGITADA
    useEffect(() => {
        if (rascunhoCarregado && !orcamentoId) {
            if (clienteSelecionado || itens.length > 0 || descontoInput || buscaCliente.length > 0) {
                const rascunho = { modo, itens, clienteSelecionado, veiculoSelecionado, descontoTipo, descontoInput, buscaCliente };
                localStorage.setItem('RASCUNHO_BALCAO', JSON.stringify(rascunho));
            } else {
                localStorage.removeItem('RASCUNHO_BALCAO');
            }
        }
    }, [modo, itens, clienteSelecionado, veiculoSelecionado, descontoTipo, descontoInput, buscaCliente, orcamentoId, rascunhoCarregado]);


    // CARREGA ORÇAMENTO EXISTENTE DO BANCO DE DADOS
    useEffect(() => {
        if (orcamentoParaEditar) {
            setOrcamentoId(orcamentoParaEditar.id);
            setModo(orcamentoParaEditar.tipo === 'PEDIDO' ? 'PEDIDO' : 'ORCAMENTO');
            setItens(orcamentoParaEditar.itens || []);
            setDescontoInput(orcamentoParaEditar.desconto?.toString() || '');

            const restaurarCliente = async () => {
                if(orcamentoParaEditar.cliente && orcamentoParaEditar.cliente !== 'Consumidor Final') {
                    try {
                        const res = await api.get(`/api/parceiros?busca=${orcamentoParaEditar.cliente}`);
                        const cliente = res.data.find(c => c.nome === orcamentoParaEditar.cliente);
                        if (cliente) selecionarCliente(cliente);
                    } catch (e) { console.error(e); }
                }
            };
            restaurarCliente();
        }
    }, [orcamentoParaEditar]);

    // BUSCA CLIENTES
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (buscaCliente.length > 2 && !clienteSelecionado) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    if (Array.isArray(res.data)) setResultadosClientes(res.data.filter(p => p.tipo === 'CLIENTE' || p.tipo === 'AMBOS'));
                } catch (error) { setResultadosClientes([]); }
            } else setResultadosClientes([]);
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
            if(res.data && res.data.length === 1) setVeiculoSelecionado(res.data[0].id);
        } catch (error) { setClienteSelecionado(prev => ({ ...prev, veiculos: [] })); }
        inputPecaRef.current?.focus();
    };

    const limparCliente = () => { setClienteSelecionado(null); setBuscaCliente(''); setVeiculoSelecionado(''); };

    const atualizarKmVeiculo = (novoKm) => {
        if(!clienteSelecionado || !veiculoSelecionado) return;
        const novosVeiculos = clienteSelecionado.veiculos.map(v => {
            if (v.id == veiculoSelecionado) return { ...v, km: parseInt(novoKm) || 0 };
            return v;
        });
        setClienteSelecionado(prev => ({ ...prev, veiculos: novosVeiculos }));
    };

    const salvarNovoClienteRapido = async () => {
        if (!novoCliente.nome) return showToast('aviso', 'Atenção', 'O Nome do cliente é obrigatório!');
        try {
            const resCliente = await api.post('/api/parceiros', {
                nome: novoCliente.nome, documento: novoCliente.documento, telefone: novoCliente.telefone, tipo: 'CLIENTE'
            });
            let veiculosDoCliente = [];
            if (novoCliente.modelo && novoCliente.placa) {
                const resVeiculo = await api.post('/api/veiculos', {
                    parceiro: { id: resCliente.data.id }, placa: novoCliente.placa, marca: novoCliente.marca, modelo: novoCliente.modelo, ano: novoCliente.ano, km: parseInt(novoCliente.km) || 0
                });
                veiculosDoCliente = [resVeiculo.data];
            }
            const clienteCompleto = { ...resCliente.data, veiculos: veiculosDoCliente };
            setClienteSelecionado(clienteCompleto);
            setBuscaCliente(clienteCompleto.nome);
            if (veiculosDoCliente.length > 0) setVeiculoSelecionado(veiculosDoCliente[0].id);
            setModalNovoClienteAberto(false);
            setNovoCliente({ nome: '', documento: '', telefone: '', placa: '', marca: '', modelo: '', ano: '', km: '' });
            showToast('sucesso', 'Concluído', 'Cliente cadastrado com sucesso!');
            inputPecaRef.current?.focus();
        } catch (error) {
            showToast('erro', 'Erro no Cadastro', 'Ocorreu uma falha ao tentar cadastrar o cliente rápido.');
        }
    };

    // BUSCA PEÇAS
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (buscaPeca.length > 1) {
                try {
                    const res = await api.get(`/api/produtos?busca=${buscaPeca}`);
                    if (Array.isArray(res.data)) { setResultadosPecas(res.data); setIndexFocadoPeca(0); }
                } catch (error) { setResultadosPecas([]); }
            } else { setResultadosPecas([]); setIndexFocadoPeca(-1); }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [buscaPeca]);

    const handleKeyDownPeca = (e) => {
        if (resultadosPecas.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndexFocadoPeca(prev => (prev < resultadosPecas.length - 1 ? prev + 1 : prev)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexFocadoPeca(prev => (prev > 0 ? prev - 1 : 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); adicionarItem(resultadosPecas[indexFocadoPeca]); }
        }
    };

    const adicionarItem = (peca) => {
        const itemExistente = itens.find(i => i.id === peca.id || i.produtoId === peca.id);
        if (itemExistente) setItens(itens.map(i => (i.id === peca.id || i.produtoId === peca.id) ? { ...i, qtd: i.qtd + 1 } : i));
        else setItens(prev => [...prev, {
            produtoId: peca.id,
            id: peca.id,
            codigo: peca.sku,
            nome: peca.nome,
            qtd: 1,
            preco: peca.precoVenda || 0,
            estoqueDisponivel: peca.quantidadeEstoque || 0
        }]);
        setBuscaPeca(''); setResultadosPecas([]); inputPecaRef.current.focus();
    };

    const removerItem = (id) => setItens(itens.filter(i => (i.id !== id && i.produtoId !== id)));
    const alterarQuantidade = (id, novaQtd) => { if (novaQtd < 1) return; setItens(itens.map(i => (i.id === id || i.produtoId === id) ? { ...i, qtd: novaQtd } : i)); };

    const subtotal = itens.reduce((acc, item) => acc + ((item.preco || 0) * (item.qtd || 0)), 0);
    let valorDescontoReal = descontoTipo === 'VALOR' ? (parseFloat(descontoInput) || 0) : subtotal * ((parseFloat(descontoInput) || 0) / 100);
    if (valorDescontoReal > subtotal) valorDescontoReal = subtotal;
    const totalFinal = subtotal - valorDescontoReal;

    // =================================================================================
    // O CORAÇÃO DO FLUXO: Avança o status de forma estruturada.
    // =================================================================================
    const processarVendaAPI = async (statusDesejado) => {
        if (itens.length === 0) return showToast('aviso', 'Documento Vazio', 'Não é possível guardar um documento sem itens.');

        if (statusDesejado === 'PEDIDO' || statusDesejado === 'AGUARDANDO_PAGAMENTO') {
            if (!validarEstoqueNoFront()) return;
        }

        const kmAtual = veiculoSelecionado && clienteSelecionado ? clienteSelecionado.veiculos.find(v => v.id == veiculoSelecionado)?.km : null;

        const payload = {
            id: orcamentoId,
            status: statusDesejado,
            itens: itens.map(item => ({ produtoId: item.produtoId || item.id, quantidade: item.qtd, precoUnitario: item.preco })),
            desconto: valorDescontoReal,
            parceiroId: clienteSelecionado ? clienteSelecionado.id : null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null,
            kmVeiculo: kmAtual
        };

        try {
            if (orcamentoId) {
                await api.put(`/api/vendas/orcamento/${orcamentoId}`, payload);

                if (statusDesejado === 'AGUARDANDO_PAGAMENTO') {
                    showToast('sucesso', 'Sucesso!', 'Documento enviado para a Fila do Caixa.');
                    limparEcra();
                    if (onVoltar) setTimeout(() => onVoltar(), 1500);
                    return;
                } else if (statusDesejado === 'PEDIDO') {
                    showToast('sucesso', 'Aprovado', 'Promovido a Pedido Oficial com sucesso!');
                    setModo('PEDIDO');
                } else {
                    showToast('sucesso', 'Salvo', 'Orçamento atualizado com sucesso!');
                    setModo('ORCAMENTO');
                }
            } else {
                const rota = statusDesejado === 'PEDIDO' ? '/api/vendas/pedido' : '/api/vendas/orcamento';
                const resposta = await api.post(rota, payload);
                setOrcamentoId(resposta.data.id);

                if (statusDesejado === 'AGUARDANDO_PAGAMENTO') {
                    showToast('sucesso', 'Sucesso!', 'Documento enviado para a Fila do Caixa.');
                    limparEcra();
                    if (onVoltar) setTimeout(() => onVoltar(), 1500);
                    return;
                } else if (statusDesejado === 'PEDIDO') {
                    showToast('sucesso', 'Aprovado', 'Pedido Oficial criado com sucesso!');
                    setModo('PEDIDO');
                } else {
                    showToast('sucesso', 'Salvo', 'Orçamento guardado com sucesso!');
                    setModo('ORCAMENTO');
                }
            }
            localStorage.removeItem('RASCUNHO_BALCAO');
        } catch (error) {
            console.error(error);
            const msgErro = error.response?.data?.message || "Ocorreu uma falha no servidor.";
            showToast('erro', 'Falha na Operação', msgErro);
        }
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
                            preco: item.precoUnitario || 0,
                            estoqueDisponivel: item.produto?.quantidadeEstoque || 0
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
        setItens([]); limparCliente(); setBuscaPeca(''); setDescontoInput('');
        setModo('ORCAMENTO'); setOrcamentoId(null);
        localStorage.removeItem('RASCUNHO_BALCAO');
    };

    const handleImprimir = () => {
        if (itens.length === 0) return showToast('aviso', 'Impressão Inválida', 'Adicione peças ao orçamento antes de imprimir.');
        window.print();
    };

    const veiculoDetalhado = clienteSelecionado && clienteSelecionado.veiculos && veiculoSelecionado
        ? clienteSelecionado.veiculos.find(v => v.id == veiculoSelecionado) : null;

    return (
        <div className="flex flex-col h-full bg-white relative z-[15]">

            {/* NOTIFICAÇÃO PROFISSIONAL FLUTUANTE */}
            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in print:hidden w-full max-w-lg px-4">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-l-4 ${
                        notificacao.tipo === 'sucesso' ? 'bg-green-50 border-green-500 text-green-800' :
                            notificacao.tipo === 'erro' ? 'bg-red-50 border-red-500 text-red-800' :
                                'bg-orange-50 border-orange-500 text-orange-800'
                    }`}>
                        <div className="mt-1">
                            {notificacao.tipo === 'sucesso' && <CheckCircle size={24} />}
                            {notificacao.tipo === 'erro' && <AlertTriangle size={24} />}
                            {notificacao.tipo === 'aviso' && <Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg">{notificacao.titulo}</h4>
                            <p className="text-sm font-medium mt-1 whitespace-pre-line leading-relaxed">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-in relative print:hidden">

                {avisoRascunho && (
                    <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 mb-4 animate-bounce">
                        <RefreshCw size={20} />
                        <div><p className="font-black text-sm">Rascunho Restaurado Automaticamente</p><p className="text-xs">O sistema recuperou os dados perdidos da sua última edição.</p></div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 z-40">
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4 items-start lg:items-center border-b border-slate-100 pb-4">

                        <div className="bg-slate-100 p-1 rounded-xl flex font-black text-sm uppercase tracking-widest w-max border border-slate-200">
                            <div className={`px-4 py-2 rounded-lg transition-all ${modo === 'ORCAMENTO' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 opacity-60'}`}>
                                1. Orçamento
                            </div>
                            <div className={`px-4 py-2 rounded-lg transition-all ${modo === 'PEDIDO' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 opacity-60'}`}>
                                2. Pedido Oficial
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={limparEcra} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-black transition-colors" title="Apagar Rascunho e Começar do Zero">
                                <Trash2 size={16} /> LIMPAR TELA
                            </button>
                            {!orcamentoParaEditar && (
                                <button onClick={() => setModalListaAberto(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md">
                                    <FolderOpen size={16} /> REABRIR GUARDADOS
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 relative">
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input type="text" placeholder="Nome ou CPF do Cliente..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} disabled={clienteSelecionado !== null} className="w-full pl-10 pr-10 py-3 border-2 rounded-xl font-bold outline-none focus:border-blue-500 text-slate-700 bg-slate-50" />
                                {clienteSelecionado && <button onClick={limparCliente} className="absolute right-3 top-3.5 text-blue-400 hover:text-red-500"><X size={16}/></button>}
                                {resultadosClientes.length > 0 && !clienteSelecionado && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50">
                                        {resultadosClientes.map(c => (
                                            <div key={c.id} onClick={() => selecionarCliente(c)} className="p-3 hover:bg-slate-50 border-b cursor-pointer flex justify-between"><span className="font-bold text-slate-700">{c.nome}</span><span className="text-xs text-slate-400">{c.documento}</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {!clienteSelecionado && (
                                <button onClick={() => setModalNovoClienteAberto(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl flex items-center justify-center gap-2 font-black transition-colors" title="Cadastrar Novo Cliente">
                                    <UserPlus size={20} /> <span className="hidden lg:block">NOVO</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 relative">
                            <Car className="absolute left-3 top-3 text-slate-400" size={18} />
                            <select value={veiculoSelecionado} onChange={(e) => setVeiculoSelecionado(e.target.value)} disabled={!clienteSelecionado} className="w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold outline-none appearance-none bg-slate-50">
                                <option value="">Selecione o Veículo...</option>
                                {clienteSelecionado?.veiculos?.map(v => (<option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>))}
                            </select>
                        </div>
                    </div>

                    {clienteSelecionado && (
                        <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-6 animate-fade-in shadow-inner">
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><User size={12}/> Ficha do Cliente</h4>
                                <p className="font-black text-slate-800 text-lg">{clienteSelecionado.nome}</p>
                                <div className="flex gap-4 mt-2">
                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><FileText size={12}/> {clienteSelecionado.documento || 'S/ Doc.'}</p>
                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Phone size={12}/> {clienteSelecionado.telefone || 'S/ Tel.'}</p>
                                </div>
                            </div>
                            <div className="hidden md:block w-px bg-slate-200"></div>
                            <div className="flex-1">
                                {veiculoDetalhado ? (
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Car size={12}/> Veículo em Atendimento</h4>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase">{veiculoDetalhado.marca} {veiculoDetalhado.modelo} {veiculoDetalhado.ano ? `(${veiculoDetalhado.ano})` : ''}</p>
                                                <p className="text-xs font-bold text-slate-500 mt-1 bg-slate-200 inline-block px-2 py-1 rounded border border-slate-300">Placa: <span className="font-mono text-slate-700 uppercase">{veiculoDetalhado.placa}</span></p>
                                            </div>
                                            <div className="text-right bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">KM Atual</p>
                                                <div className="flex items-center gap-2">
                                                    <Gauge size={16} className="text-slate-400"/>
                                                    <input type="number" value={veiculoDetalhado.km || ''} onChange={(e) => atualizarKmVeiculo(e.target.value)} className="w-24 p-1 border-b-2 border-slate-300 text-right font-black text-slate-700 text-sm outline-none focus:border-blue-500 bg-transparent transition-colors" placeholder="Ex: 50000" />
                                                    <span className="text-xs font-bold text-slate-400">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70"><Car size={24} className="mb-2"/><p className="text-xs font-bold uppercase tracking-widest">Venda de Balcão (Sem Veículo)</p></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative mb-6 z-30">
                    <Search className="absolute left-4 top-4 text-slate-400" size={24} />
                    {/* AQUI ESTÁ A MUDANÇA NO PLACEHOLDER */}
                    <input ref={inputPecaRef} type="text" value={buscaPeca} onChange={(e) => setBuscaPeca(e.target.value)} onKeyDown={handleKeyDownPeca} placeholder="Buscar por Código, Referência ou Descrição..." className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg font-black text-slate-800 shadow-sm focus:border-blue-600 outline-none" />
                    {resultadosPecas.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                            {resultadosPecas.map((peca, index) => (
                                <div key={peca.id} onClick={() => adicionarItem(peca)} className={`flex justify-between items-center p-4 cursor-pointer border-b hover:bg-slate-50`}>
                                    <div className="flex items-center gap-4"><div><p className="font-bold text-slate-800">{peca.nome}</p><p className="text-xs font-mono text-slate-500">{peca.sku}</p></div></div>
                                    <div className="text-right"><p className="font-black text-blue-700">R$ {(peca.precoVenda || 0).toFixed(2)}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-white rounded-t-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0">
                            <tr><th className="p-4 pl-6">Código</th><th className="p-4">Descrição</th><th className="p-4 text-center">Qtd</th><th className="p-4 text-right">Unitário</th><th className="p-4 text-right pr-6">Subtotal</th><th className="p-4"></th></tr>
                            </thead>
                            <tbody>
                            {itens.map((item) => (
                                <tr key={item.id || item.produtoId} className={`border-b hover:bg-slate-50 ${item.qtd > (item.estoqueDisponivel || 0) ? 'bg-red-50' : ''}`}>
                                    <td className="p-4 pl-6 font-mono text-xs text-slate-500">{item.codigo}</td>
                                    <td className="p-4 font-bold text-slate-800 text-sm">
                                        <div>
                                            <p>{item.nome}</p>
                                            {item.qtd > (item.estoqueDisponivel || 0) && (
                                                <span className="text-[10px] font-black text-red-600 flex items-center gap-1 uppercase tracking-tighter">
                                                    <AlertTriangle size={10}/> Falta Estoque (Disponível: {item.estoqueDisponivel || 0})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center"><input type="number" value={item.qtd} onChange={(e) => alterarQuantidade(item.id || item.produtoId, parseInt(e.target.value) || 1)} className={`w-16 p-2 text-center font-black bg-white border-2 rounded-lg outline-none ${item.qtd > (item.estoqueDisponivel || 0) ? 'border-red-500 bg-red-100' : 'border-slate-200'}`} /></td>
                                    <td className="p-4 text-right font-bold text-slate-600 text-sm">R$ {(item.preco || 0).toFixed(2)}</td>
                                    <td className="p-4 pr-6 text-right font-black text-blue-700">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                                    <td className="p-4 text-center"><button onClick={() => removerItem(item.id || item.produtoId)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-b-3xl border-t-4 border-blue-500 shadow-2xl flex flex-col md:flex-row justify-between p-6 z-20 relative">
                    <div className="flex flex-col justify-end gap-3 mb-4 md:mb-0">
                        {modo === 'ORCAMENTO' ? (
                            <>
                                <button onClick={() => processarVendaAPI('ORCAMENTO')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <Save size={18} /> {orcamentoId ? 'ATUALIZAR ORÇAMENTO' : 'GUARDAR RASCUNHO'}
                                </button>

                                <div className="flex gap-2">
                                    <button onClick={handleImprimir} className="px-6 py-4 bg-slate-100 text-slate-800 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Printer size={20} /> IMPRIMIR</button>
                                    <button onClick={() => processarVendaAPI('PEDIDO')} disabled={itens.length === 0} className="flex-1 px-6 py-4 bg-orange-500 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-orange-400 transition-colors">
                                        AVANÇAR PARA PEDIDO <ArrowRight size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <button onClick={() => processarVendaAPI('PEDIDO')} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                        <Save size={18} /> ATUALIZAR PEÇAS
                                    </button>
                                    <button onClick={handleImprimir} className="px-6 py-3 bg-slate-100 text-slate-800 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Printer size={20} /></button>
                                </div>
                                <button onClick={() => processarVendaAPI('AGUARDANDO_PAGAMENTO')} disabled={itens.length === 0} className="px-8 py-5 bg-purple-600 text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20">
                                    <CheckCircle size={24} /> ENVIAR PARA O CAIXA
                                </button>
                            </>
                        )}
                    </div>

                    <div className="w-full md:w-[400px] bg-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between font-bold text-sm"><span>Subtotal:</span><span>R$ {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center border-b border-dashed border-slate-600 pb-3">
                            <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Tag size={14} className="text-orange-400"/> Desconto:</span>
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button onClick={() => {setDescontoTipo(descontoTipo === 'VALOR' ? 'PERCENTUAL' : 'VALOR'); setDescontoInput('');}} className="p-1.5 bg-slate-800 rounded text-slate-400 hover:text-white">
                                    {descontoTipo === 'VALOR' ? <DollarSign size={14} /> : <Percent size={14} />}
                                </button>
                                <input type="number" placeholder="0.00" value={descontoInput} onChange={(e) => setDescontoInput(e.target.value)} className="w-20 bg-transparent text-right font-black text-orange-400 outline-none pr-2" />
                            </div>
                        </div>
                        <div className="flex justify-between items-end pt-1 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{modo === 'ORCAMENTO' ? 'Total Cotação' : 'Total a Pagar'}</span>
                            <h2 className="text-4xl font-black text-green-400">R$ {totalFinal.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE ORÇAMENTOS SALVOS */}
            {modalListaAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2"><FolderOpen /> ORÇAMENTOS GUARDADOS</h2>
                            <button onClick={() => setModalListaAberto(false)} className="hover:text-red-400"><X size={24}/></button>
                        </div>
                        <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                            {orcamentosSalvos.length === 0 ? (
                                <div className="text-center py-10 font-bold text-slate-400">Nenhum orçamento pendente.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {orcamentosSalvos.map(orc => (
                                        <div key={orc.id} onClick={() => carregarOrcamentoLocal(orc)} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-blue-100 text-blue-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-widest">#{orc.id}</span>
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
                                                    REABRIR
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

            {/* MODAL: CADASTRO RÁPIDO DE CLIENTE */}
            {modalNovoClienteAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="font-black tracking-widest flex items-center gap-2"><UserPlus /> CADASTRO RÁPIDO</h2>
                            <button onClick={() => setModalNovoClienteAberto(false)} className="hover:text-red-400"><X size={24}/></button>
                        </div>
                        <div className="p-6 space-y-4 bg-slate-50">
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Nome do Cliente *</label><input type="text" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none mt-1" placeholder="Ex: João da Silva"/></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">CPF/CNPJ</label><input type="text" value={novoCliente.documento} onChange={e => setNovoCliente({...novoCliente, documento: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none mt-1" /></div>
                                <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Telefone</label><input type="text" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none mt-1" /></div>
                            </div>
                            <div className="border-t border-slate-200 my-4 pt-4">
                                <p className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Car size={14}/> Veículo (Opcional)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><input type="text" placeholder="Placa (Ex: ABC-1234)" value={novoCliente.placa} onChange={e => setNovoCliente({...novoCliente, placa: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl uppercase focus:border-blue-500 outline-none" /></div>
                                    <div><input type="text" placeholder="Marca (Ex: Fiat)" value={novoCliente.marca} onChange={e => setNovoCliente({...novoCliente, marca: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none" /></div>
                                    <div><input type="text" placeholder="Modelo (Ex: Uno)" value={novoCliente.modelo} onChange={e => setNovoCliente({...novoCliente, modelo: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none" /></div>
                                    <div><input type="number" placeholder="KM Atual" value={novoCliente.km} onChange={e => setNovoCliente({...novoCliente, km: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none" /></div>
                                </div>
                            </div>
                            <button onClick={salvarNovoClienteRapido} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition-colors">SALVAR E USAR NA VENDA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* O IMPRESSO INVISÍVEL */}
            <div className="hidden print:block fixed inset-0 w-full h-full bg-white z-[99999] m-0 p-0 text-black font-sans">
                <div className="w-[210mm] mx-auto p-10 font-sans">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div><h1 className="text-3xl font-black uppercase">GRANDPORT</h1><p className="text-sm font-bold">Auto Peças e Acessórios</p></div>
                        <div className="text-right"><h2 className="text-2xl font-black uppercase border-2 border-black px-4 py-2 rounded-lg inline-block">{modo}</h2><p className="text-sm font-bold mt-2">Data: {new Date().toLocaleDateString('pt-BR')}</p></div>
                    </div>
                    <div className="border border-black p-4 mb-6 rounded-lg flex justify-between">
                        <div><p className="text-xs font-bold uppercase text-gray-500 mb-1">Dados do Cliente</p><p className="font-black text-lg">{clienteSelecionado ? clienteSelecionado.nome : 'Cliente Avulso'}</p></div>
                        {veiculoDetalhado && (<div className="text-right"><p className="text-xs font-bold uppercase text-gray-500 mb-1">Veículo / Aplicação</p><p className="font-black text-lg">{veiculoDetalhado.marca} {veiculoDetalhado.modelo}</p><p className="text-sm font-bold">Placa: {veiculoDetalhado.placa} | KM: {veiculoDetalhado.km}</p></div>)}
                    </div>
                    <table className="w-full text-left border-collapse mb-6">
                        <thead className="border-b-2 border-black"><tr><th className="py-2 text-xs font-black uppercase">Cód</th><th className="py-2 text-xs font-black uppercase">Descrição</th><th className="py-2 text-center text-xs font-black uppercase">Qtd</th><th className="py-2 text-right text-xs font-black uppercase">Vl. Unit</th><th className="py-2 text-right text-xs font-black uppercase">Total</th></tr></thead>
                        <tbody>
                        {itens.map((item, index) => (
                            <tr key={index} className="border-b border-gray-300">
                                <td className="py-2 text-xs font-mono">{item.codigo}</td><td className="py-2 text-sm font-bold">{item.nome}</td><td className="py-2 text-center font-bold">{item.qtd}</td><td className="py-2 text-right text-sm">R$ {(item.preco || 0).toFixed(2)}</td><td className="py-2 text-right font-black">R$ {((item.preco || 0) * (item.qtd || 0)).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mb-12"><div className="w-64"><div className="flex justify-between border-t-2 border-black mt-2 pt-2"><span className="text-lg font-black uppercase">Total:</span><span className="text-2xl font-black">R$ {totalFinal.toFixed(2)}</span></div></div></div>
                </div>
            </div>
            <style>{`@media print { body * { visibility: hidden; } .print\\:block { visibility: visible !important; } .print\\:block * { visibility: visible; } html, body { height: 100vh !important; background: white !important; overflow: visible !important; margin: 0; padding: 0; } }`}</style>
        </div>
    );
};