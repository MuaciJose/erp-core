import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, CheckCircle, Truck, FileText, User, DollarSign, Package, Settings, Calendar, X, Calculator } from 'lucide-react';
import api from "../../api/axios";
import toast from 'react-hot-toast';

export default function EmitirNfeAvulsa() {
    const [loading, setLoading] = useState(false);
    const [notaEmitida, setNotaEmitida] = useState(null); // 🚀 NOVO ESTADO: Controla a tela de sucesso

    // --- ESTADOS DE BUSCA ---
    const [termoBuscaCliente, setTermoBuscaCliente] = useState('');
    const [clientesSugeridos, setClientesSugeridos] = useState([]);
    const [buscandoCliente, setBuscandoCliente] = useState(false);
    const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState('');
    const [clienteIndexFocado, setClienteIndexFocado] = useState(-1);

    // --- ESTADO DO MODAL FISCAL (Engrenagem) ---
    const [modalFiscalOpen, setModalFiscalOpen] = useState(null);

    // O "Caminhão" de dados que vai para o Java
    const [nfeData, setNfeData] = useState({
        naturezaOperacao: 'VENDA DE MERCADORIA',
        dataEmissao: new Date().toISOString().slice(0, 10),
        dataSaida: new Date().toISOString().slice(0, 10),
        vendedorNome: '',
        informacoesComplementares: '',
        clienteId: '',
        itens: [],
        transporte: {
            modalidadeFrete: 0,
            transportadoraId: '',
            placaVeiculo: '',
            ufVeiculo: '',
            quantidadeVolumes: 1,
            especie: 'CAIXA',
            pesoBruto: 0,
            pesoLiquido: 0,
        },
        financeiro: {
            valorFrete: 0,
            valorSeguro: 0,
            valorDescontoGeral: 0,
            outrasDespesas: 0,
            duplicatas: [],
        },
    });

    // ================= MATEMÁTICA EM TEMPO REAL =================
    const totalProdutos = nfeData.itens.reduce((acc, item) => acc + (Number(item.quantidade) * Number(item.precoUnitario)), 0);
    const freteTotal = Number(nfeData.financeiro.valorFrete) || 0;
    const seguroTotal = Number(nfeData.financeiro.valorSeguro) || 0;
    const outrasDespesas = Number(nfeData.financeiro.outrasDespesas) || 0;
    const descontoTotal = Number(nfeData.financeiro.valorDescontoGeral) || 0;
    const totalNota = (totalProdutos + freteTotal + seguroTotal + outrasDespesas) - descontoTotal;

    // ================= LÓGICA DE PRODUTOS =================
    const adicionarProduto = () => {
        setNfeData({
            ...nfeData,
            itens: [
                ...nfeData.itens,
                {
                    produtoId: '',
                    produtoNome: '',
                    quantidade: 1,
                    precoUnitario: 0,
                    cfopEspecifico: '',
                    cst: '000',
                    baseCalculoIcms: 0,
                    aliquotaIcms: 0,
                    valorIpi: 0,
                    termoBusca: '',
                    sugestoes: [],
                    buscando: false,
                    indexFocado: -1
                },
            ],
        });
    };

    const atualizarProduto = (index, campo, valor) => {
        const novosItens = [...nfeData.itens];
        novosItens[index][campo] = valor;
        setNfeData({ ...nfeData, itens: novosItens });
    };

    const removerProduto = (index) => {
        const novosItens = nfeData.itens.filter((_, i) => i !== index);
        setNfeData({ ...nfeData, itens: novosItens });
    };

    // BUSCA INTELIGENTE DE PRODUTOS REAL (VIA API)
    const buscarProdutoTabela = async (index, termo) => {
        const novosItens = [...nfeData.itens];
        novosItens[index].termoBusca = termo;
        novosItens[index].indexFocado = -1;

        if (termo.length < 3) {
            novosItens[index].sugestoes = [];
            setNfeData({ ...nfeData, itens: novosItens });
            return;
        }

        novosItens[index].buscando = true;
        setNfeData({ ...nfeData, itens: novosItens });

        try {
            const res = await api.get(`/api/produtos?busca=${termo}`);
            const produtosFiltrados = res.data.map(p => ({
                id: p.id,
                nome: p.nome,
                preco: p.precoVenda || 0
            }));

            const itensAtualizados = [...nfeData.itens];
            itensAtualizados[index].sugestoes = produtosFiltrados;
            itensAtualizados[index].buscando = false;
            setNfeData({ ...nfeData, itens: itensAtualizados });
        } catch (error) {
            const itensErro = [...nfeData.itens];
            itensErro[index].buscando = false;
            itensErro[index].sugestoes = [];
            setNfeData({ ...nfeData, itens: itensErro });
        }
    };

    const selecionarProdutoTabela = (index, produto) => {
        const novosItens = [...nfeData.itens];
        novosItens[index].produtoId = produto.id;
        novosItens[index].produtoNome = produto.nome;
        novosItens[index].precoUnitario = produto.preco;
        novosItens[index].termoBusca = '';
        novosItens[index].sugestoes = [];
        novosItens[index].indexFocado = -1;
        setNfeData({ ...nfeData, itens: novosItens });
    };

    const handleKeyDownProduto = (e, index) => {
        const item = nfeData.itens[index];
        const temSugestoes = item.sugestoes && item.sugestoes.length > 0;

        if (e.key === 'Enter') {
            e.preventDefault();
            if (temSugestoes && item.indexFocado >= 0) {
                selecionarProdutoTabela(index, item.sugestoes[item.indexFocado]);
            }
        } else if (e.key === 'ArrowDown' && temSugestoes) {
            e.preventDefault();
            const nextIndex = item.indexFocado < item.sugestoes.length - 1 ? item.indexFocado + 1 : item.indexFocado;
            atualizarProduto(index, 'indexFocado', nextIndex);
        } else if (e.key === 'ArrowUp' && temSugestoes) {
            e.preventDefault();
            const prevIndex = item.indexFocado > 0 ? item.indexFocado - 1 : 0;
            atualizarProduto(index, 'indexFocado', prevIndex);
        } else if (e.key === 'Escape') {
            atualizarProduto(index, 'sugestoes', []);
            atualizarProduto(index, 'indexFocado', -1);
        }
    };

    // ================= LÓGICA DE DUPLICATAS =================
    const adicionarDuplicata = () => {
        setNfeData({
            ...nfeData,
            financeiro: {
                ...nfeData.financeiro,
                duplicatas: [
                    ...nfeData.financeiro.duplicatas,
                    { numero: `001/${nfeData.financeiro.duplicatas.length + 1}`, dataVencimento: '', valor: 0 },
                ],
            },
        });
    };

    // ================= BUSCA DE CLIENTE REAL =================
    const buscarClientes = async (termo) => {
        setTermoBuscaCliente(termo);
        setClienteIndexFocado(-1);

        if (termo.length < 3) {
            setClientesSugeridos([]);
            return;
        }

        setBuscandoCliente(true);
        try {
            const res = await api.get(`/api/parceiros?termo=${termo}`);
            const parceirosFiltrados = res.data.map(cli => ({
                id: cli.id,
                nome: cli.nome,
                documento: cli.documento || 'Sem Documento'
            }));
            setClientesSugeridos(parceirosFiltrados);
        } catch (error) {
            setClientesSugeridos([]);
        } finally {
            setBuscandoCliente(false);
        }
    };

    const selecionarCliente = (cliente) => {
        setNfeData({ ...nfeData, clienteId: cliente.id });
        setClienteSelecionadoNome(`${cliente.nome} (${cliente.documento})`);
        setTermoBuscaCliente('');
        setClientesSugeridos([]);
        setClienteIndexFocado(-1);
    };

    const handleKeyDownCliente = (e) => {
        const temSugestoes = clientesSugeridos.length > 0;

        if (e.key === 'Enter') {
            e.preventDefault();
            if (temSugestoes && clienteIndexFocado >= 0) {
                selecionarCliente(clientesSugeridos[clienteIndexFocado]);
            }
        } else if (e.key === 'ArrowDown' && temSugestoes) {
            e.preventDefault();
            setClienteIndexFocado(prev => (prev < clientesSugeridos.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp' && temSugestoes) {
            e.preventDefault();
            setClienteIndexFocado(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Escape') {
            setClientesSugeridos([]);
            setClienteIndexFocado(-1);
        }
    };

    // ================= ENVIO PARA O BACK-END =================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nfeData.clienteId) {
            toast.error('Por favor, selecione um destinatário.');
            return;
        }
        if (nfeData.itens.length === 0) {
            toast.error('Adicione pelo menos um produto na nota.');
            return;
        }

        const temProdutoInvalido = nfeData.itens.some(item => !item.produtoId);
        if(temProdutoInvalido) {
            toast.error('Por favor, selecione os produtos da lista de sugestões.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/fiscal/emitir-completa', nfeData);
            toast.success(`NF-e ${response.data.numero} autorizada com sucesso!`);

            // 🚀 SALVA OS DADOS PARA MOSTRAR A TELA DE SUCESSO
            setNotaEmitida({
                numero: response.data.numero,
                chaveAcesso: response.data.chaveAcesso
            });

        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao emitir NF-e Avançada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-32 relative">

            {/* 🚀 TELA DE SUCESSO E IMPRESSÃO (SOBREPÕE O FORMULÁRIO) */}
            {notaEmitida && (
                <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-lg w-full border-t-8 border-green-500">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">Nota Autorizada!</h2>
                        <p className="text-slate-500 mb-6">A NF-e foi transmitida com sucesso para a SEFAZ.</p>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Número da Nota</p>
                            <p className="text-lg font-black text-slate-700 mb-3">{notaEmitida.numero}</p>

                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Chave de Acesso</p>
                            <p className="text-xs font-bold text-slate-600 break-all">{notaEmitida.chaveAcesso}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* BOTÃO DE IMPRIMIR - CHAMA A ROTA NO JAVA */}
                            <button
                                onClick={() => window.open(`http://localhost:8080/api/fiscal/danfe/avulsa/${notaEmitida.chaveAcesso}`, '_blank')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-1"
                            >
                                <FileText size={20} /> IMPRIMIR DANFE (PDF)
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                            >
                                Emitir Nova Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER DA PÁGINA */}
            <div className="bg-white border-b px-8 py-6 shadow-sm mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Emissão de NF-e Avançada
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Preencha os blocos abaixo para faturamento B2B, devoluções, remessas e notas com frete.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Emissão</label>
                        <input type="date" className="border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none" value={nfeData.dataEmissao} onChange={(e) => setNfeData({...nfeData, dataEmissao: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Saída</label>
                        <input type="date" className="border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none" value={nfeData.dataSaida} onChange={(e) => setNfeData({...nfeData, dataSaida: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendedor</label>
                        <input type="text" placeholder="Nome do Vendedor" className="border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none w-40" value={nfeData.vendedorNome} onChange={(e) => setNfeData({...nfeData, vendedorNome: e.target.value})} />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 px-4">

                {/* BLOCO 1: DADOS GERAIS & DESTINATÁRIO */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-slate-50 rounded-t-xl border-b px-6 py-3 flex items-center gap-2 font-bold text-slate-700">
                        <User size={18} className="text-blue-500" /> Destinatário e Operação
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Natureza da Operação *</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={nfeData.naturezaOperacao}
                                onChange={(e) => setNfeData({ ...nfeData, naturezaOperacao: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>

                        {/* Busca Inteligente do Cliente */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Buscar Destinatário (Nome/CNPJ) *</label>

                            {!nfeData.clienteId ? (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg pl-10 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Digite para pesquisar..."
                                        value={termoBuscaCliente}
                                        onChange={(e) => buscarClientes(e.target.value)}
                                        onKeyDown={handleKeyDownCliente}
                                    />
                                    {buscandoCliente && <span className="absolute right-3 top-3 text-xs text-blue-500 font-bold">Buscando...</span>}

                                    {clientesSugeridos.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                                            {clientesSugeridos.map((cli, idx) => (
                                                <div
                                                    key={cli.id}
                                                    onClick={() => selecionarCliente(cli)}
                                                    onMouseEnter={() => setClienteIndexFocado(idx)}
                                                    className={`p-3 cursor-pointer border-b last:border-0 transition-colors ${clienteIndexFocado === idx ? 'bg-blue-100 border-l-4 border-l-blue-500' : 'hover:bg-blue-50'}`}
                                                >
                                                    <p className={`text-sm font-bold ${clienteIndexFocado === idx ? 'text-blue-800' : 'text-slate-800'}`}>{cli.nome}</p>
                                                    <p className="text-xs text-slate-500">{cli.documento}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between border border-green-300 bg-green-50 rounded-lg p-2.5">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={18} className="text-green-600" />
                                        <span className="text-sm font-bold text-green-800">{clienteSelecionadoNome}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setNfeData({ ...nfeData, clienteId: '' }); setClienteSelecionadoNome(''); }}
                                        className="text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Trocar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BLOCO 2: PRODUTOS */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-slate-50 rounded-t-xl border-b px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                            <Package size={18} className="text-amber-500" /> Produtos da Nota
                        </div>
                        <button
                            type="button"
                            onClick={adicionarProduto}
                            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
                        >
                            <Plus size={14} /> Adicionar Item
                        </button>
                    </div>

                    <div className="p-0 pb-16 overflow-visible">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b">
                            <tr>
                                <th className="px-6 py-3 w-2/5">Produto (Nome ou Cód)</th>
                                <th className="px-4 py-3 w-24">Qtd</th>
                                <th className="px-4 py-3 w-32">Vlr Unit (R$)</th>
                                <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                                <th className="px-4 py-3 text-center w-28">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {nfeData.itens.map((item, index) => {
                                const subtotal = Number(item.quantidade) * Number(item.precoUnitario);
                                return (
                                    <tr key={index} className="hover:bg-slate-50">

                                        <td className="px-6 py-3">
                                            {!item.produtoId ? (
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                                        <Search size={14} className="text-slate-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-slate-300 rounded p-1.5 pl-8 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                        placeholder="Buscar peça..."
                                                        value={item.termoBusca || ''}
                                                        onChange={(e) => buscarProdutoTabela(index, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDownProduto(e, index)}
                                                    />
                                                    {item.buscando && <span className="absolute right-2 top-2 text-[10px] text-amber-500 font-bold">Buscando...</span>}

                                                    {item.sugestoes && item.sugestoes.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                            {item.sugestoes.map((prod, idx) => (
                                                                <div
                                                                    key={prod.id}
                                                                    onClick={() => selecionarProdutoTabela(index, prod)}
                                                                    onMouseEnter={() => atualizarProduto(index, 'indexFocado', idx)}
                                                                    className={`p-2 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors ${item.indexFocado === idx ? 'bg-amber-100 border-l-4 border-l-amber-500' : 'hover:bg-amber-50'}`}
                                                                >
                                                                    <div>
                                                                        <p className={`text-sm font-bold ${item.indexFocado === idx ? 'text-amber-800' : 'text-slate-800'}`}>{prod.nome}</p>
                                                                        <p className="text-[10px] text-slate-500">Cód: {prod.id}</p>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-emerald-600">R$ {prod.preco.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between border border-amber-300 bg-amber-50 rounded p-1.5 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-amber-900 truncate max-w-[200px]">{item.produtoNome}</span>
                                                        <span className="text-[10px] text-amber-700">ID: {item.produtoId}</span>
                                                    </div>
                                                    <button type="button" onClick={() => atualizarProduto(index, 'produtoId', '')} className="text-[10px] text-red-500 font-bold hover:underline">Trocar</button>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <input type="number" className="w-full border border-slate-300 rounded p-1.5 text-sm focus:border-amber-500 outline-none" value={item.quantidade} onChange={(e) => atualizarProduto(index, 'quantidade', e.target.value)} required />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="number" step="0.01" className="w-full border border-slate-300 rounded p-1.5 text-sm font-bold text-slate-700 focus:border-amber-500 outline-none" value={item.precoUnitario} onChange={(e) => atualizarProduto(index, 'precoUnitario', e.target.value)} required />
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                            R$ {subtotal.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setModalFiscalOpen(index)}
                                                    className="text-slate-400 hover:text-blue-500 transition-colors bg-white p-1 rounded-md hover:bg-blue-50"
                                                    title="Ajustes Fiscais Avançados"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                                <button type="button" onClick={() => removerProduto(index)} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-md hover:bg-red-50" title="Remover Produto">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            {nfeData.itens.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-10 text-slate-400 bg-slate-50 border-t border-dashed">Nenhum produto adicionado. Clique no botão "Adicionar Item".</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BLOCO 3: TRANSPORTE E VOLUMES */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2 font-bold text-slate-700">
                        <Truck size={18} className="text-indigo-500" /> Transporte e Volumes
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modalidade do Frete</label>
                            <select className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.transporte.modalidadeFrete} onChange={(e) => setNfeData({...nfeData, transporte: {...nfeData.transporte, modalidadeFrete: parseInt(e.target.value)}})}>
                                <option value={0}>0 - Por conta do Emitente (CIF)</option>
                                <option value={1}>1 - Por conta do Destinatário (FOB)</option>
                                <option value={9}>9 - Sem Frete</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Volumes</label>
                            <input type="number" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.transporte.quantidadeVolumes} onChange={(e) => setNfeData({...nfeData, transporte: {...nfeData.transporte, quantidadeVolumes: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso Bruto</label>
                            <input type="number" step="0.001" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.transporte.pesoBruto} onChange={(e) => setNfeData({...nfeData, transporte: {...nfeData.transporte, pesoBruto: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso Líquido</label>
                            <input type="number" step="0.001" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.transporte.pesoLiquido} onChange={(e) => setNfeData({...nfeData, transporte: {...nfeData.transporte, pesoLiquido: e.target.value}})} />
                        </div>
                    </div>
                </div>

                {/* BLOCO 4: FINANCEIRO & COBRANÇA */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2 font-bold text-slate-700">
                        <DollarSign size={18} className="text-emerald-500" /> Valores Adicionais & Fatura
                    </div>
                    <div className="p-6">

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Frete (+)</label><input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2 text-sm font-bold text-blue-700" value={nfeData.financeiro.valorFrete} onChange={(e) => setNfeData({...nfeData, financeiro: {...nfeData.financeiro, valorFrete: e.target.value}})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seguro (+)</label><input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.financeiro.valorSeguro} onChange={(e) => setNfeData({...nfeData, financeiro: {...nfeData.financeiro, valorSeguro: e.target.value}})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outras Desp. (+)</label><input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={nfeData.financeiro.outrasDespesas} onChange={(e) => setNfeData({...nfeData, financeiro: {...nfeData.financeiro, outrasDespesas: e.target.value}})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-red-500">Desc. Geral (-)</label><input type="number" step="0.01" className="w-full border-red-300 rounded-lg p-2 text-sm font-bold text-red-600 focus:border-red-500 focus:ring-red-500" value={nfeData.financeiro.valorDescontoGeral} onChange={(e) => setNfeData({...nfeData, financeiro: {...nfeData.financeiro, valorDescontoGeral: e.target.value}})} /></div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">Duplicatas / Parcelamento</h3>
                            <button type="button" onClick={adicionarDuplicata} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1"><Plus size={16}/> Nova Parcela</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {nfeData.financeiro.duplicatas.map((dup, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-3 border rounded-lg relative">
                                    <button type="button" onClick={() => { const novas = nfeData.financeiro.duplicatas.filter((_, i) => i !== idx); setNfeData({...nfeData, financeiro: {...nfeData.financeiro, duplicatas: novas}}) }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    <div className="flex gap-2">
                                        <div className="w-1/2"><label className="text-xs text-slate-500">Número</label><input type="text" className="w-full border p-1.5 rounded text-sm" value={dup.numero} onChange={(e) => { const novas = [...nfeData.financeiro.duplicatas]; novas[idx].numero = e.target.value; setNfeData({...nfeData, financeiro: {...nfeData.financeiro, duplicatas: novas}}); }} /></div>
                                        <div className="w-1/2"><label className="text-xs text-slate-500">Vencimento</label><input type="date" className="w-full border p-1.5 rounded text-sm" value={dup.dataVencimento} onChange={(e) => { const novas = [...nfeData.financeiro.duplicatas]; novas[idx].dataVencimento = e.target.value; setNfeData({...nfeData, financeiro: {...nfeData.financeiro, duplicatas: novas}}); }} /></div>
                                    </div>
                                    <div><label className="text-xs text-slate-500">Valor (R$)</label><input type="number" step="0.01" className="w-full border p-1.5 rounded text-sm font-bold text-slate-700" value={dup.valor} onChange={(e) => { const novas = [...nfeData.financeiro.duplicatas]; novas[idx].valor = e.target.value; setNfeData({...nfeData, financeiro: {...nfeData.financeiro, duplicatas: novas}}); }} /></div>
                                </div>
                            ))}
                        </div>
                        {nfeData.financeiro.duplicatas.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma duplicata. A nota será gerada como pagamento à vista.</p>}
                    </div>
                </div>

                {/* BLOCO 5: INFORMAÇÕES ADICIONAIS */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b px-6 py-3 flex items-center gap-2 font-bold text-slate-700">
                        <FileText size={18} className="text-slate-500" /> Informações Complementares
                    </div>
                    <div className="p-6">
                        <textarea
                            className="w-full border border-slate-300 rounded-lg p-3 h-24 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. Pedido de Compra nº 12345."
                            value={nfeData.informacoesComplementares}
                            onChange={(e) => setNfeData({ ...nfeData, informacoesComplementares: e.target.value })}
                        ></textarea>
                    </div>
                </div>

            </form>

            {/* 🚀 RODAPÉ FIXO (STICKY BAR) - RESUMO DOS TOTAIS */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white border-t border-slate-300 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] p-4 flex flex-col md:flex-row justify-between items-center z-40">
                <div className="flex gap-6 mb-4 md:mb-0 bg-slate-100 px-6 py-2 rounded-lg border border-slate-200 w-full md:w-auto overflow-x-auto">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Produtos</p>
                        <p className="text-sm font-black text-slate-800">R$ {totalProdutos.toFixed(2)}</p>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Frete/Seguro</p>
                        <p className="text-sm font-black text-blue-600">+ R$ {(freteTotal + seguroTotal + outrasDespesas).toFixed(2)}</p>
                    </div>
                    <div className="border-l border-slate-300 pl-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Descontos</p>
                        <p className="text-sm font-black text-red-500">- R$ {descontoTotal.toFixed(2)}</p>
                    </div>
                    <div className="border-l border-blue-300 pl-4 bg-blue-50 px-3 rounded">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">VALOR FINAL NF-E</p>
                        <p className="text-lg font-black text-blue-800">R$ {totalNota.toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-black tracking-wide shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    {loading ? <span className="animate-pulse">PROCESSANDO SEFAZ...</span> : <>🎯 TRANSMITIR NF-E À SEFAZ</>}
                </button>
            </div>

            {/* 🚀 MODAL FISCAL (A ENGRENAGEM) */}
            {modalFiscalOpen !== null && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">

                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <h2 className="font-bold flex items-center gap-2">
                                <Settings size={20} className="text-blue-400"/>
                                Ajustes Fiscais Avançados (Item {modalFiscalOpen + 1})
                            </h2>
                            <button onClick={() => setModalFiscalOpen(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-6 text-sm">
                                <strong>Aviso:</strong> Preencha estes campos apenas se precisar <b>substituir</b> a regra tributária automática do sistema para este produto específico.
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CFOP Específico</label>
                                    <input type="text" placeholder="Ex: 5102" className="w-full border rounded p-2 text-sm" value={nfeData.itens[modalFiscalOpen].cfopEspecifico} onChange={(e) => atualizarProduto(modalFiscalOpen, 'cfopEspecifico', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CST / CSOSN</label>
                                    <input type="text" placeholder="Ex: 000 ou 102" className="w-full border rounded p-2 text-sm" value={nfeData.itens[modalFiscalOpen].cst} onChange={(e) => atualizarProduto(modalFiscalOpen, 'cst', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base de Cálculo ICMS (R$)</label>
                                    <input type="number" step="0.01" className="w-full border rounded p-2 text-sm" value={nfeData.itens[modalFiscalOpen].baseCalculoIcms} onChange={(e) => atualizarProduto(modalFiscalOpen, 'baseCalculoIcms', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alíquota ICMS (%)</label>
                                    <input type="number" step="0.01" className="w-full border rounded p-2 text-sm" value={nfeData.itens[modalFiscalOpen].aliquotaIcms} onChange={(e) => atualizarProduto(modalFiscalOpen, 'aliquotaIcms', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor do IPI (R$)</label>
                                    <input type="number" step="0.01" className="w-full border rounded p-2 text-sm" value={nfeData.itens[modalFiscalOpen].valorIpi} onChange={(e) => atualizarProduto(modalFiscalOpen, 'valorIpi', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 border-t flex justify-end">
                            <button onClick={() => setModalFiscalOpen(null)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors">
                                Salvar Ajustes do Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}