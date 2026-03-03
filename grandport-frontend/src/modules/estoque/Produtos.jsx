import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Plus, Search, Edit, Trash2, CheckCircle, Ban, X, Save, FileText, DollarSign, Box, ShieldAlert, Image as ImageIcon, Info, AlertTriangle } from 'lucide-react';

export const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState('geral');
    const [notificacao, setNotificacao] = useState(null);

    // ESTADOS PARA O AUTOCOMPLETE DO NCM
    const [resultadosNcm, setResultadosNcm] = useState([]);
    const [buscandoNcm, setBuscandoNcm] = useState(false);

    const formInicial = {
        id: '', nome: '', sku: '', codigoBarras: '', referenciaOriginal: '', aplicacao: '', marca: { id: '' }, categoria: '', descricao: '', ativo: true,
        precoCusto: 0, margemLucro: 0, precoVenda: 0, precoMinimo: 0, comissao: 0,
        unidadeMedida: 'UN', quantidadeEstoque: 0, estoqueMinimo: 0, estoqueMaximo: 0, localizacao: '', pesoLiquido: 0, pesoBruto: 0, permitirEstoqueNegativo: false,
        ncm: '', cest: '', origemMercadoria: 0, cstIcms: '', cstPisCofins: '', cstIpi: '',
        fotoUrl: '', fotoLocalPath: ''
    };

    const [form, setForm] = useState(formInicial);

    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

    const carregarDados = async () => {
        try {
            const [resProd, resMarcas] = await Promise.all([
                api.get(busca ? `/api/produtos?busca=${busca}` : '/api/produtos'),
                api.get('/api/marcas')
            ]);
            setProdutos(resProd.data);
            setMarcas(resMarcas.data);
        } catch (error) {
            showToast('erro', 'Erro de Conexão', 'Não foi possível carregar a lista de produtos.');
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { carregarDados(); }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    // =======================================================================
    // EFEITO DO AUTOCOMPLETE DE NCM
    // =======================================================================
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (abaAtiva === 'fiscal' && buscandoNcm && form.ncm && form.ncm.length > 2) {
                try {
                    const res = await api.get(`/api/ncms?busca=${form.ncm}`);
                    setResultadosNcm(res.data);
                } catch (error) {
                    console.error("Erro ao buscar NCM", error);
                    setResultadosNcm([]);
                }
            } else {
                setResultadosNcm([]);
            }
        }, 400); // 400ms delay para não travar o banco
        return () => clearTimeout(delayDebounceFn);
    }, [form.ncm, abaAtiva, buscandoNcm]);

    const selecionarNcm = (ncm) => {
        // Pega o código independente de ser 'codigo' ou 'Codigo'
        const codigoFinal = ncm.codigo || ncm.Codigo;
        setForm({...form, ncm: codigoFinal});
        setResultadosNcm([]);
        setBuscandoNcm(false);
    };

    const abrirNovo = () => {
        setForm(formInicial);
        setBuscandoNcm(false);
        setResultadosNcm([]);
        setAbaAtiva('geral');
        setModalAberto(true);
    };

    const abrirEditar = (prod) => {
        const formSeguro = { ...formInicial };

        Object.keys(formInicial).forEach(key => {
            if (prod[key] !== null && prod[key] !== undefined) {
                formSeguro[key] = prod[key];
            }
        });

        formSeguro.marca = prod.marca ? { id: prod.marca.id } : { id: '' };

        if (prod.ncm) {
            // Suporte para objeto vindo do Java ou string simples
            formSeguro.ncm = typeof prod.ncm === 'object' ? (prod.ncm.codigo || prod.ncm.Codigo || prod.ncm.id || '') : prod.ncm;
        }

        setForm(formSeguro);
        setBuscandoNcm(false);
        setResultadosNcm([]);
        setAbaAtiva('geral');
        setModalAberto(true);
    };

    const calcularPrecoVenda = (custo, margem) => {
        const c = parseFloat(custo) || 0;
        const m = parseFloat(margem) || 0;
        return (c + (c * (m / 100))).toFixed(2);
    };

    const salvarProduto = async (e) => {
        e.preventDefault();

        if (!form.nome || !form.sku) {
            showToast('aviso', 'Campos Incompletos', 'O Nome e o Cód Interno (SKU) são obrigatórios.');
            setAbaAtiva('geral');
            return;
        }

        if (!form.marca || !form.marca.id) {
            showToast('aviso', 'Marca Obrigatória', 'Por favor, selecione uma Marca na aba Geral.');
            setAbaAtiva('geral');
            return;
        }

        if (!form.ncm) {
            showToast('aviso', 'NCM Obrigatório', 'O Código NCM é obrigatório para emissão fiscal. Preencha na aba Dados Fiscais.');
            setAbaAtiva('fiscal');
            return;
        }

        try {
            const payload = {
                ...form,
                quantidadeEstoque: parseInt(form.quantidadeEstoque) || 0,
                estoqueMinimo: parseInt(form.estoqueMinimo) || 0,
                estoqueMaximo: parseInt(form.estoqueMaximo) || 0,
                precoCusto: parseFloat(form.precoCusto) || 0,
                margemLucro: parseFloat(form.margemLucro) || 0,
                precoVenda: parseFloat(form.precoVenda) || 0,
                precoMinimo: parseFloat(form.precoMinimo) || 0,
                comissao: parseFloat(form.comissao) || 0,
                pesoLiquido: parseFloat(form.pesoLiquido) || 0,
                pesoBruto: parseFloat(form.pesoBruto) || 0,
                origemMercadoria: parseInt(form.origemMercadoria) || 0,

                marcaId: parseInt(form.marca.id),
                idMarca: parseInt(form.marca.id),
                ncmCodigo: form.ncm,
                codigoNcm: form.ncm
            };

            if (!payload.id) delete payload.id;

            if (form.id) {
                await api.put(`/api/produtos/${form.id}`, payload);
                showToast('sucesso', 'Produto Atualizado', 'As informações foram salvas com sucesso!');
            } else {
                await api.post('/api/produtos', payload);
                showToast('sucesso', 'Produto Cadastrado', 'Novo produto adicionado ao estoque!');
            }
            setModalAberto(false);
            carregarDados();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            const msg = error.response?.data?.message || 'Ocorreu um erro no servidor. Verifique se o SKU já existe.';
            showToast('erro', 'Falha ao Salvar', msg);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">

            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in w-full max-w-md px-4">
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
                            <p className="text-sm font-medium mt-1 leading-relaxed">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Package className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} /> GESTÃO DE PEÇAS</h1>
                    <p className="text-slate-500 mt-1">Cadastro unificado: Operacional, Fiscal e Precificação</p>
                </div>
                <button onClick={abrirNovo} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-transform transform hover:scale-105"><Plus size={20} /> NOVO PRODUTO</button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar por Nome, Código, EAN ou Ref..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold" />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr><th className="p-4 pl-6 w-16">Foto</th><th className="p-4">Cód / SKU</th><th className="p-4">Produto</th><th className="p-4 text-center">Estoque</th><th className="p-4 text-right">Preço (R$)</th><th className="p-4 text-center">Status</th><th className="p-4 text-center pr-6">Ações</th></tr>
                    </thead>
                    <tbody>
                    {produtos.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                                    {p.fotoUrl || p.fotoLocalPath ? (
                                        <img src={p.fotoUrl || p.fotoLocalPath} alt={p.nome} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=Img'} />
                                    ) : (
                                        <ImageIcon size={16} className="text-slate-400" />
                                    )}
                                </div>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500">{p.sku}</td>
                            <td className="p-4">
                                <p className="font-bold text-slate-800">{p.nome}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{p.marca?.nome} • {p.categoria}</p>
                            </td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-lg text-xs font-black ${p.quantidadeEstoque <= (p.estoqueMinimo||0) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.quantidadeEstoque} {p.unidadeMedida}</span>
                            </td>
                            <td className="p-4 text-right font-black text-blue-600">R$ {(p.precoVenda||0).toFixed(2)}</td>
                            <td className="p-4 text-center">{p.ativo ? <span className="text-green-500" title="Produto Ativo"><CheckCircle size={16} className="mx-auto"/></span> : <span className="text-red-500" title="Produto Inativo"><Ban size={16} className="mx-auto"/></span>}</td>
                            <td className="p-4 pr-6 text-center">
                                <button onClick={() => abrirEditar(p)} className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit size={18}/></button>
                            </td>
                        </tr>
                    ))}
                    {produtos.length === 0 && (
                        <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-bold">Nenhum produto encontrado.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CADASTRO COM ABAS */}
            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden animate-fade-in">

                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black flex items-center gap-2"><Package className="text-blue-400" /> {form.id ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h2>
                            <button onClick={() => setModalAberto(false)} className="hover:text-red-400 transition-colors p-1"><X size={24} /></button>
                        </div>

                        {/* NAVEGAÇÃO DAS ABAS */}
                        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 overflow-x-auto custom-scrollbar select-none">
                            <button type="button" onClick={()=>setAbaAtiva('geral')} className={`px-6 py-3 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'geral' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><FileText size={16}/> Dados Gerais</button>
                            <button type="button" onClick={()=>setAbaAtiva('precos')} className={`px-6 py-3 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'precos' ? 'border-green-500 text-green-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><DollarSign size={16}/> Precificação</button>
                            <button type="button" onClick={()=>setAbaAtiva('estoque')} className={`px-6 py-3 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'estoque' ? 'border-orange-500 text-orange-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><Box size={16}/> Estoque & Físico</button>
                            <button type="button" onClick={()=>setAbaAtiva('fiscal')} className={`px-6 py-3 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'fiscal' ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><ShieldAlert size={16}/> Dados Fiscais</button>
                            <button type="button" onClick={()=>setAbaAtiva('midia')} className={`px-6 py-3 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'midia' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><ImageIcon size={16}/> Mídia & Fotos</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">

                            {/* ABA 1: GERAL */}
                            {abaAtiva === 'geral' && (
                                <div className="space-y-5 animate-fade-in">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Nome do Produto *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold bg-white outline-none focus:border-blue-500" /></div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 uppercase">Cód Interno (SKU) *</label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none focus:border-blue-500 uppercase font-mono" /></div>
                                        <div><label className="text-xs font-bold text-slate-500 uppercase">EAN (Cód. Barras)</label><input type="text" value={form.codigoBarras} onChange={e => setForm({...form, codigoBarras: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none focus:border-blue-500 font-mono" /></div>
                                        <div><label className="text-xs font-bold text-slate-500 uppercase">Ref. Original / Fabricante</label><input type="text" value={form.referenciaOriginal} onChange={e => setForm({...form, referenciaOriginal: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none focus:border-blue-500 uppercase font-mono" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 uppercase">Marca *</label>
                                            <select value={form.marca.id} onChange={e => setForm({...form, marca: { id: e.target.value }})} className="w-full p-3 border-2 rounded-xl bg-white outline-none font-bold focus:border-blue-500">
                                                <option value="">-- Selecione uma Marca --</option>
                                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </div>
                                        <div><label className="text-xs font-bold text-slate-500 uppercase">Categoria</label><input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none font-bold focus:border-blue-500" placeholder="Ex: Suspensão, Óleos..." /></div>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Aplicação (Compatibilidade de Veículos)</label><input type="text" value={form.aplicacao} onChange={e => setForm({...form, aplicacao: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none focus:border-blue-500 font-bold" placeholder="Ex: Palio 1.0 2012>, Uno Way..." /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Descrição Completa</label><textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-white outline-none h-24 focus:border-blue-500" /></div>
                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-white p-4 border-2 border-slate-200 rounded-xl w-max hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} className="w-5 h-5 rounded cursor-pointer accent-blue-600" /> Produto Ativo (Disponível para venda)
                                    </label>
                                </div>
                            )}

                            {/* ABA 2: PREÇOS */}
                            {abaAtiva === 'precos' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-3 gap-6 bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                        <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Custo (R$)</label>
                                            <input type="number" step="0.01" value={form.precoCusto} onChange={e => {
                                                const custo = e.target.value;
                                                setForm({...form, precoCusto: custo, precoVenda: calcularPrecoVenda(custo, form.margemLucro)});
                                            }} className="w-full p-4 border-2 rounded-xl font-black text-slate-700 outline-none focus:border-green-500 text-lg" />
                                        </div>
                                        <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Markup / Margem (%)</label>
                                            <input type="number" step="0.01" value={form.margemLucro} onChange={e => {
                                                const margem = e.target.value;
                                                setForm({...form, margemLucro: margem, precoVenda: calcularPrecoVenda(form.precoCusto, margem)});
                                            }} className="w-full p-4 border-2 rounded-xl font-black text-slate-700 outline-none focus:border-green-500 text-lg" />
                                        </div>
                                        <div><label className="text-xs font-black text-green-600 uppercase tracking-widest mb-2 block">Preço de Venda Final</label>
                                            <input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({...form, precoVenda: e.target.value})} className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-xl font-black text-green-700 outline-none focus:border-green-500 text-2xl" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço Mínimo (Limite Desconto)</label>
                                            <input type="number" step="0.01" value={form.precoMinimo} onChange={e => setForm({...form, precoMinimo: e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500" />
                                            <p className="text-[10px] text-slate-400 mt-2 font-bold">Impede que vendedores deem desconto abaixo deste valor no PDV.</p>
                                        </div>
                                        <div className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Comissão Vendedor (%)</label>
                                            <input type="number" step="0.01" value={form.comissao} onChange={e => setForm({...form, comissao: e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: ESTOQUE & FÍSICO */}
                            {abaAtiva === 'estoque' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 transition-colors shadow-sm ${form.permitirEstoqueNegativo ? 'bg-orange-50 border-orange-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <input type="checkbox" checked={form.permitirEstoqueNegativo} onChange={e => setForm({...form, permitirEstoqueNegativo: e.target.checked})} className="w-6 h-6 mt-1 cursor-pointer accent-orange-500" />
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg">Permitir Venda com Estoque Negativo (S/ Saldo)</h4>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Se marcado, o sistema <strong className="text-orange-600">NÃO BLOQUEARÁ</strong> o Caixa ou o Vendedor caso a quantidade chegue a zero.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">UN Comercial</label><select value={form.unidadeMedida} onChange={e=>setForm({...form, unidadeMedida: e.target.value})} className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500"><option>UN</option><option>PC</option><option>KG</option><option>LT</option><option>CX</option><option>KIT</option></select></div>
                                        <div><label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Estoque Atual</label><input type="number" value={form.quantidadeEstoque} onChange={e=>setForm({...form, quantidadeEstoque: e.target.value})} className="w-full p-3 border-2 border-blue-300 bg-blue-50 font-black rounded-xl outline-none focus:border-blue-600" /></div>
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estoque Mínimo</label><input type="number" value={form.estoqueMinimo} onChange={e=>setForm({...form, estoqueMinimo: e.target.value})} className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estoque Máximo</label><input type="number" value={form.estoqueMaximo} onChange={e=>setForm({...form, estoqueMaximo: e.target.value})} className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localização Física</label><input type="text" value={form.localizacao} onChange={e=>setForm({...form, localizacao: e.target.value})} placeholder="Ex: Corredor B, Prat. 4" className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500 uppercase" /></div>
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peso Líquido (KG)</label><input type="number" step="0.001" value={form.pesoLiquido} onChange={e=>setForm({...form, pesoLiquido: e.target.value})} className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                        <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peso Bruto (KG)</label><input type="number" step="0.001" value={form.pesoBruto} onChange={e=>setForm({...form, pesoBruto: e.target.value})} className="w-full p-3 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 4: FISCAL */}
                            {abaAtiva === 'fiscal' && (
                                <div className="space-y-4 animate-fade-in bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-sm font-bold flex items-center gap-3 mb-6 border border-purple-200">
                                        <ShieldAlert size={24}/>
                                        <span>O NCM é <strong>obrigatório</strong> para a correta emissão de Notas Fiscais.</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* ============================================================== */}
                                        {/* CAMPO INTELIGENTE DE AUTOCOMPLETE DO NCM                     */}
                                        {/* ============================================================== */}
                                        <div className="relative">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">NCM (Pesquisa Inteligente) *</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-3 text-purple-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={form.ncm}
                                                    onChange={e => {
                                                        setForm({...form, ncm: e.target.value});
                                                        setBuscandoNcm(true);
                                                    }}
                                                    className="w-full pl-10 pr-4 p-3 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500 focus:bg-white"
                                                    placeholder="Digite o código ou nome do NCM..."
                                                />
                                            </div>

                                            {/* LISTA DE SUGESTÕES COM FILTRO DE COMPATIBILIDADE */}
                                            {buscandoNcm && resultadosNcm.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-purple-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                                    {resultadosNcm.map((ncm, index) => {
                                                        // FILTRO DE COMPATIBILIDADE: Lê tanto codigo/descricao quanto Codigo/Descricao
                                                        const codigo = ncm.codigo || ncm.Codigo || ncm.id;
                                                        const descricao = ncm.descricao || ncm.Descricao || "Sem descrição";

                                                        return (
                                                            <div
                                                                key={codigo || index}
                                                                onClick={() => {
                                                                    setForm({...form, ncm: codigo});
                                                                    setResultadosNcm([]);
                                                                    setBuscandoNcm(false);
                                                                }}
                                                                className="p-3 border-b border-slate-100 hover:bg-purple-50 cursor-pointer transition-colors"
                                                            >
                                                                <p className="font-bold text-purple-700 text-sm">{codigo}</p>
                                                                <p className="text-[10px] text-slate-500 font-black uppercase truncate">{descricao}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">CEST</label><input type="text" value={form.cest} onChange={e=>setForm({...form, cest: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500" placeholder="Ex: 01.001.00"/></div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Origem da Mercadoria</label>
                                        <select value={form.origemMercadoria} onChange={e=>setForm({...form, origemMercadoria: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl font-bold outline-none focus:border-purple-500">
                                            <option value="0">0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8</option>
                                            <option value="1">1 - Estrangeira - Importação direta, exceto a indicada no código 6</option>
                                            <option value="2">2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 pt-2">
                                        <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">CST/CSOSN ICMS</label><input type="text" value={form.cstIcms} onChange={e=>setForm({...form, cstIcms: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500" placeholder="Ex: 102, 500, 00"/></div>
                                        <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">CST PIS/COFINS</label><input type="text" value={form.cstPisCofins} onChange={e=>setForm({...form, cstPisCofins: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500" placeholder="Ex: 01, 49, 99"/></div>
                                        <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">CST IPI</label><input type="text" value={form.cstIpi} onChange={e=>setForm({...form, cstIpi: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500" placeholder="Ex: 50, 51, 99"/></div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 5: MÍDIA E FOTOS */}
                            {abaAtiva === 'midia' && (
                                <div className="animate-fade-in flex flex-col md:flex-row gap-8 bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex-1 space-y-6">
                                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                            <h4 className="font-black text-indigo-800 flex items-center gap-2"><ImageIcon size={18}/> Exibição no Ponto de Venda</h4>
                                            <p className="text-sm text-indigo-600 mt-1 font-medium">As imagens ajudam os vendedores a identificar rapidamente a peça correta no momento da venda. Insira o link direto de uma imagem da internet.</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">URL da Foto (Link da Internet)</label>
                                            <input type="text" value={form.fotoUrl} onChange={e => setForm({...form, fotoUrl: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" placeholder="Ex: https://site.com/foto-do-amortecedor.jpg" />
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Caminho Local (Avançado)</label>
                                            <input type="text" value={form.fotoLocalPath} onChange={e => setForm({...form, fotoLocalPath: e.target.value})} className="w-full p-3 border-2 bg-slate-50 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" placeholder="Ex: /uploads/pecas/gp-amortecedor.png" />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-72 flex flex-col items-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Pré-visualização</p>
                                        <div className="w-64 h-64 border-4 border-dashed border-slate-200 rounded-3xl flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner">
                                            {form.fotoUrl || form.fotoLocalPath ? (
                                                <img src={form.fotoUrl || form.fotoLocalPath} alt="Preview" className="w-full h-full object-cover transition-transform transform hover:scale-110" onError={(e) => e.target.src = 'https://via.placeholder.com/250?text=Imagem+Indisponível'} />
                                            ) : (
                                                <div className="text-center text-slate-300">
                                                    <ImageIcon size={64} className="mx-auto mb-2 opacity-50"/>
                                                    <span className="text-sm font-bold uppercase tracking-widest">Sem Imagem</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-6 bg-slate-900 flex justify-end gap-4 border-t-4 border-blue-600">
                            <button onClick={() => setModalAberto(false)} className="px-8 py-4 font-bold text-white hover:bg-slate-800 rounded-xl transition-colors">CANCELAR</button>
                            <button onClick={salvarProduto} className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-transform transform hover:scale-105"><Save size={20}/> SALVAR PRODUTO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};