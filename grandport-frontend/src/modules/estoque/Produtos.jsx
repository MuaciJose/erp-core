import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast'; // 🚀 Importação do Toast Global
import { Package, Plus, Search, Edit, Trash2, CheckCircle, Ban, X, Save, FileText, DollarSign, Box, ShieldAlert, Image as ImageIcon, Info, ArrowLeft } from 'lucide-react';

export const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [busca, setBusca] = useState('');
    const [telaAtual, setTelaAtual] = useState('lista');
    const [abaAtiva, setAbaAtiva] = useState('geral');

    const [resultadosNcm, setResultadosNcm] = useState([]);
    const [buscandoNcm, setBuscandoNcm] = useState(false);

    const [modalMarcaAberto, setModalMarcaAberto] = useState(false);
    const [novaMarcaNome, setNovaMarcaNome] = useState('');
    const [salvandoMarca, setSalvandoMarca] = useState(false);

    const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
    const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);

    const formInicial = {
        id: '', nome: '', sku: '', codigoBarras: '', referenciaOriginal: '', aplicacao: '',
        marca: { id: '' }, categoria: { id: '' }, descricao: '', ativo: true,
        precoCusto: 0, margemLucro: 0, precoVenda: 0, precoMinimo: 0, comissao: 0,
        unidadeMedida: 'UN', quantidadeEstoque: 0, estoqueMinimo: 0, estoqueMaximo: 0, localizacao: '', pesoLiquido: 0, pesoBruto: 0, permitirEstoqueNegativo: false,
        ncm: '', cest: '', origemMercadoria: 0, cstIcms: '', cstPisCofins: '', cstIpi: '',
        cfopPadrao: '', csosnPadrao: '', cstPadrao: '', aliquotaIcms: 0, aliquotaIpi: 0, aliquotaPis: 0, aliquotaCofins: 0,
        fotoUrl: '', fotoLocalPath: ''
    };

    const [form, setForm] = useState(formInicial);

    // 🚀 Função unificada para disparar os Toasts bonitos
    const notificar = (tipo, titulo, msg) => {
        const conteudo = (
            <div>
                <strong className="block text-sm">{titulo}</strong>
                <span className="text-xs text-slate-100">{msg}</span>
            </div>
        );
        if (tipo === 'sucesso') toast.success(conteudo, { duration: 4000 });
        else if (tipo === 'erro') toast.error(conteudo, { duration: 5000 });
        else toast(conteudo, { icon: '⚠️', duration: 4000, style: { background: '#f59e0b', color: '#fff' } });
    };

    const carregarDados = async () => {
        try {
            const [resProd, resMarcas, resCat] = await Promise.all([
                api.get(busca ? `/api/produtos?busca=${busca}` : '/api/produtos'),
                api.get('/api/marcas'),
                api.get('/api/categorias')
            ]);
            setProdutos(resProd.data);
            setMarcas(resMarcas.data);
            setCategorias(resCat.data);
        } catch (error) {
            notificar('erro', 'Erro de Conexão', 'Não foi possível carregar os dados.');
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => { carregarDados(); }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (abaAtiva === 'fiscal' && buscandoNcm && form.ncm && form.ncm.length > 2) {
                try {
                    const res = await api.get(`/api/ncm?busca=${form.ncm}`);
                    setResultadosNcm(res.data);
                } catch (error) {
                    setResultadosNcm([]);
                }
            } else {
                setResultadosNcm([]);
            }
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [form.ncm, abaAtiva, buscandoNcm]);

    const abrirNovo = () => {
        setForm(formInicial);
        setBuscandoNcm(false);
        setResultadosNcm([]);
        setAbaAtiva('geral');
        setTelaAtual('formulario');
    };

    const abrirEditar = (prod) => {
        const formSeguro = { ...formInicial };
        Object.keys(formInicial).forEach(key => {
            if (prod[key] !== null && prod[key] !== undefined) formSeguro[key] = prod[key];
        });

        formSeguro.marca = prod.marca ? { id: prod.marca.id } : { id: '' };
        formSeguro.categoria = prod.categoria ? { id: prod.categoria.id } : { id: '' };
        if (prod.ncm) formSeguro.ncm = typeof prod.ncm === 'object' ? (prod.ncm.codigo || prod.ncm.Codigo || '') : prod.ncm;

        setForm(formSeguro);
        setBuscandoNcm(false);
        setResultadosNcm([]);
        setAbaAtiva('geral');
        setTelaAtual('formulario');
    };

    const voltarParaLista = () => {
        setTelaAtual('lista');
    };

    const calcularPrecoVenda = (custo, margem) => {
        const c = parseFloat(custo) || 0;
        const m = parseFloat(margem) || 0;
        return (c + (c * (m / 100))).toFixed(2);
    };

    const salvarNovaMarcaRapida = async () => {
        if (!novaMarcaNome.trim()) return notificar('aviso', 'Atenção', 'Digite o nome da marca.');
        setSalvandoMarca(true);
        try {
            const res = await api.post('/api/marcas', { nome: novaMarcaNome.toUpperCase(), ativo: true });
            setMarcas(prev => [...prev, res.data]);
            setForm({...form, marca: { id: res.data.id }});
            setModalMarcaAberto(false);
            setNovaMarcaNome('');
            notificar('sucesso', 'Sucesso!', `Marca ${res.data.nome} adicionada e selecionada.`);
        } catch (error) { notificar('erro', 'Erro', 'Falha ao salvar marca.'); }
        finally { setSalvandoMarca(false); }
    };

    const salvarNovaCategoriaRapida = async () => {
        if (!novaCategoriaNome.trim()) return notificar('aviso', 'Atenção', 'Digite o nome da categoria.');
        setSalvandoCategoria(true);
        try {
            const res = await api.post('/api/categorias', { nome: novaCategoriaNome.toUpperCase(), ativo: true });
            setCategorias(prev => [...prev, res.data]);
            setForm({...form, categoria: { id: res.data.id }});
            setModalCategoriaAberto(false);
            setNovaCategoriaNome('');
            notificar('sucesso', 'Sucesso!', `Categoria ${res.data.nome} adicionada e selecionada.`);
        } catch (error) { notificar('erro', 'Erro', 'Falha ao salvar categoria.'); }
        finally { setSalvandoCategoria(false); }
    };

    const salvarProduto = async (e) => {
        e.preventDefault();

        if (!form.nome || !form.sku) return notificar('aviso', 'Campos Incompletos', 'Nome e SKU são obrigatórios.');

        const toastId = toast.loading('Salvando produto...');

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
                aliquotaIcms: parseFloat(form.aliquotaIcms) || 0,
                aliquotaIpi: parseFloat(form.aliquotaIpi) || 0,
                aliquotaPis: parseFloat(form.aliquotaPis) || 0,
                aliquotaCofins: parseFloat(form.aliquotaCofins) || 0,
                origemMercadoria: parseInt(form.origemMercadoria) || 0,

                // Manda null se não tiver escolhido para o Java aceitar!
                marcaId: form.marca && form.marca.id ? parseInt(form.marca.id) : null,
                categoriaId: form.categoria && form.categoria.id ? parseInt(form.categoria.id) : null,
                ncmCodigo: form.ncm && form.ncm.trim() !== '' ? form.ncm : null
            };

            // Remove o ID se for um cadastro novo para o Java não reclamar
            if (!payload.id) delete payload.id;
            delete payload.marca;
            delete payload.categoria;
            delete payload.ncm;

            if (form.id) {
                await api.put(`/api/produtos/${form.id}`, payload);
                toast.success('Produto Atualizado com sucesso!', { id: toastId });
            } else {
                await api.post('/api/produtos', payload);
                toast.success('Novo produto adicionado ao estoque!', { id: toastId });
            }

            setTelaAtual('lista');
            carregarDados();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar o produto.', { id: toastId });
        }
    };

    // 🚀 COMPONENTE DE TOOLTIP INTELIGENTE
    const Tooltip = ({ texto }) => (
        <div className="relative group cursor-pointer inline-block ml-2 align-middle">
            <Info size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-[12px] font-bold rounded-xl shadow-xl z-50 text-center leading-relaxed">
                {texto}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">

            {/* ========================================================= */}
            {/* TELA 1: LISTA                                             */}
            {/* ========================================================= */}
            {telaAtual === 'lista' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Package className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} /> GESTÃO DE PEÇAS</h1>
                            <p className="text-slate-500 mt-1">Cadastro unificado: Operacional, Fiscal e Precificação</p>
                        </div>
                        <button
                            onClick={abrirNovo}
                            title="Clique para cadastrar uma nova peça"
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-transform transform hover:scale-105"
                        >
                            <Plus size={20} /> NOVO PRODUTO
                        </button>
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
                                            {p.fotoUrl || p.fotoLocalPath ? <img src={p.fotoUrl || p.fotoLocalPath} alt={p.nome} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=Img'} /> : <ImageIcon size={16} className="text-slate-400" />}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">{p.sku}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{p.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{p.marca?.nome} • {p.categoria?.nome || 'Sem Categoria'}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${p.quantidadeEstoque <= (p.estoqueMinimo||0) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.quantidadeEstoque} {p.unidadeMedida}</span>
                                    </td>
                                    <td className="p-4 text-right font-black text-blue-600">R$ {(p.precoVenda||0).toFixed(2)}</td>
                                    <td className="p-4 text-center">{p.ativo ? <span className="text-green-500" title="Produto Ativo"><CheckCircle size={16} className="mx-auto"/></span> : <span className="text-red-500" title="Produto Inativo"><Ban size={16} className="mx-auto"/></span>}</td>
                                    <td className="p-4 pr-6 text-center">
                                        <button
                                            onClick={() => abrirEditar(p)}
                                            title="Editar as informações deste produto"
                                            className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                        >
                                            <Edit size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {produtos.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-bold">Nenhum produto encontrado.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TELA 2: FORMULÁRIO                                        */}
            {/* ========================================================= */}
            {telaAtual === 'formulario' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-visible animate-fade-in flex flex-col relative mb-10">

                    {/* CABEÇALHO DO FORMULÁRIO */}
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white rounded-t-3xl">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setTelaAtual('lista')} title="Voltar para a lista de produtos (Cancelar)" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"><ArrowLeft size={20} /></button>
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-2"><Package className="text-blue-400" /> {form.id ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h2>
                                <p className="text-slate-400 text-sm mt-1">{form.id ? 'Modifique as informações da peça abaixo.' : 'Preencha os dados para cadastrar uma nova peça no estoque.'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 overflow-x-auto custom-scrollbar select-none">
                        <button type="button" onClick={()=>setAbaAtiva('geral')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'geral' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><FileText size={18}/> Dados Gerais</button>
                        <button type="button" onClick={()=>setAbaAtiva('precos')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'precos' ? 'border-green-500 text-green-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><DollarSign size={18}/> Precificação</button>
                        <button type="button" onClick={()=>setAbaAtiva('estoque')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'estoque' ? 'border-orange-500 text-orange-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><Box size={18}/> Estoque & Físico</button>
                        <button type="button" onClick={()=>setAbaAtiva('fiscal')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'fiscal' ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><ShieldAlert size={18}/> Dados Fiscais</button>
                        <button type="button" onClick={()=>setAbaAtiva('midia')} className={`px-6 py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-colors flex items-center gap-2 ${abaAtiva === 'midia' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><ImageIcon size={18}/> Mídia & Fotos</button>
                    </div>

                    <div className="flex-1 p-8 bg-slate-50/50 min-h-[500px]">

                        {abaAtiva === 'geral' && (
                            <div className="space-y-6 animate-fade-in max-w-5xl">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Nome do Produto *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-4 border-2 rounded-xl font-bold bg-white outline-none focus:border-blue-500" placeholder="Ex: Amortecedor Dianteiro Cofap" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Cód Interno (SKU) *</label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full p-4 border-2 rounded-xl bg-white outline-none focus:border-blue-500 uppercase font-mono" placeholder="Ex: AMORT-001" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">EAN (Cód. Barras)</label><input type="text" value={form.codigoBarras} onChange={e => setForm({...form, codigoBarras: e.target.value})} className="w-full p-4 border-2 rounded-xl bg-white outline-none focus:border-blue-500 font-mono" placeholder="Código numérico do leitor" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Ref. Original / Fabricante</label><input type="text" value={form.referenciaOriginal} onChange={e => setForm({...form, referenciaOriginal: e.target.value})} className="w-full p-4 border-2 rounded-xl bg-white outline-none focus:border-blue-500 uppercase font-mono" placeholder="Ex: 51920-SWA-A01" /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Marca</label>
                                        <div className="flex items-center gap-2">
                                            <select value={form.marca.id} onChange={e => setForm({...form, marca: { id: e.target.value }})} className="w-full p-4 border-2 rounded-xl bg-white outline-none font-bold focus:border-blue-500">
                                                <option value="">-- Selecione uma Marca --</option>
                                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalMarcaAberto(true)} title="Cadastrar Nova Marca Rapidamente" className="p-4 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm shrink-0"><Plus size={24} /></button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Categoria</label>
                                        <div className="flex items-center gap-2">
                                            <select value={form.categoria?.id || ''} onChange={e => setForm({...form, categoria: { id: e.target.value }})} className="w-full p-4 border-2 rounded-xl bg-white outline-none font-bold focus:border-blue-500">
                                                <option value="">-- Selecione uma Categoria --</option>
                                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalCategoriaAberto(true)} title="Cadastrar Nova Categoria Rapidamente" className="p-4 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition-colors shadow-sm shrink-0"><Plus size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Aplicação (Compatibilidade)</label><input type="text" value={form.aplicacao} onChange={e => setForm({...form, aplicacao: e.target.value})} className="w-full p-4 border-2 rounded-xl bg-white outline-none focus:border-blue-500 font-bold" placeholder="Ex: Palio 1.0 2012>, Uno Way..." /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Descrição Completa</label><textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full p-4 border-2 rounded-xl bg-white outline-none h-32 focus:border-blue-500" placeholder="Detalhes técnicos da peça..." /></div>
                                <label title="Desmarque para esconder este produto na tela de Vendas" className="flex items-center gap-3 cursor-pointer font-bold text-slate-700 bg-white p-5 border-2 border-slate-200 rounded-xl w-max hover:bg-slate-50 transition-colors">
                                    <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} className="w-6 h-6 rounded cursor-pointer accent-blue-600" /> Produto Ativo (Aparecerá no PDV)
                                </label>
                            </div>
                        )}

                        {abaAtiva === 'precos' && (
                            <div className="space-y-6 animate-fade-in max-w-5xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Custo (R$)</label>
                                        <input type="number" step="0.01" value={form.precoCusto} onChange={e => {
                                            const custo = e.target.value;
                                            setForm({...form, precoCusto: custo, precoVenda: calcularPrecoVenda(custo, form.margemLucro)});
                                        }} className="w-full p-4 border-2 rounded-xl font-black text-slate-700 outline-none focus:border-green-500 text-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                            Markup / Margem (%) <Tooltip texto="A porcentagem de lucro que será adicionada ao Preço de Custo para sugerir o Preço de Venda Final." />
                                        </label>
                                        <input type="number" step="0.01" value={form.margemLucro} onChange={e => {
                                            const margem = e.target.value;
                                            setForm({...form, margemLucro: margem, precoVenda: calcularPrecoVenda(form.precoCusto, margem)});
                                        }} className="w-full p-4 border-2 rounded-xl font-black text-slate-700 outline-none focus:border-green-500 text-xl" />
                                    </div>
                                    <div><label className="text-xs font-black text-green-600 uppercase tracking-widest mb-2 block">Preço de Venda Final</label>
                                        <input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({...form, precoVenda: e.target.value})} className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-xl font-black text-green-700 outline-none focus:border-green-500 text-3xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                            Preço Mínimo (Alçada) <Tooltip texto="Se preenchido, os vendedores não conseguirão dar desconto no PDV que deixe a peça abaixo deste valor." />
                                        </label>
                                        <input type="number" step="0.01" value={form.precoMinimo} onChange={e => setForm({...form, precoMinimo: e.target.value})} className="w-full p-4 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 text-lg" />
                                    </div>
                                    <div className="bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                                            Comissão Vendedor (%) <Tooltip texto="Porcentagem repassada ao vendedor caso ele venda este produto específico." />
                                        </label>
                                        <input type="number" step="0.01" value={form.comissao} onChange={e => setForm({...form, comissao: e.target.value})} className="w-full p-4 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 text-lg" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {abaAtiva === 'estoque' && (
                            <div className="space-y-6 animate-fade-in max-w-5xl">
                                <div className={`p-6 rounded-2xl border-2 flex items-start gap-4 transition-colors shadow-sm ${form.permitirEstoqueNegativo ? 'bg-orange-50 border-orange-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <input type="checkbox" checked={form.permitirEstoqueNegativo} onChange={e => setForm({...form, permitirEstoqueNegativo: e.target.checked})} className="w-6 h-6 mt-1 cursor-pointer accent-orange-500" />
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg flex items-center">
                                            Permitir Venda com Estoque Negativo
                                            <Tooltip texto="Se marcado, o sistema deixará o saldo ir para negativo (-1, -2). Ideal caso a mercadoria física já tenha chegado na loja, mas a nota de compra ainda não foi importada." />
                                        </h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">O sistema <strong className="text-orange-600">NÃO BLOQUEARÁ</strong> a venda caso a quantidade chegue a zero.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">UN Comercial</label><select value={form.unidadeMedida} onChange={e=>setForm({...form, unidadeMedida: e.target.value})} className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500"><option>UN</option><option>PC</option><option>KG</option><option>LT</option><option>CX</option><option>KIT</option></select></div>
                                    <div><label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Estoque Atual</label><input type="number" value={form.quantidadeEstoque} onChange={e=>setForm({...form, quantidadeEstoque: e.target.value})} className="w-full p-4 border-2 border-blue-300 bg-blue-50 font-black text-xl rounded-xl outline-none focus:border-blue-600" /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">Mínimo <Tooltip texto="O sistema emitirá um alerta no Relatório de Faltas quando o estoque chegar neste número." /></label><input type="number" value={form.estoqueMinimo} onChange={e=>setForm({...form, estoqueMinimo: e.target.value})} className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Máximo</label><input type="number" value={form.estoqueMaximo} onChange={e=>setForm({...form, estoqueMaximo: e.target.value})} className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Localização Física</label><input type="text" value={form.localizacao} onChange={e=>setForm({...form, localizacao: e.target.value})} placeholder="Ex: Corredor B, Prat. 4" className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500 uppercase" /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Peso Líquido (KG)</label><input type="number" step="0.001" value={form.pesoLiquido} onChange={e=>setForm({...form, pesoLiquido: e.target.value})} className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Peso Bruto (KG)</label><input type="number" step="0.001" value={form.pesoBruto} onChange={e=>setForm({...form, pesoBruto: e.target.value})} className="w-full p-4 border-2 font-bold rounded-xl outline-none focus:border-blue-500" /></div>
                                </div>
                            </div>
                        )}

                        {abaAtiva === 'fiscal' && (
                            <div className="space-y-6 animate-fade-in max-w-5xl bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="relative">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                                            NCM (Pesquisa Inteligente)
                                            <Tooltip texto="Nomenclatura Comum do Mercosul. Sem este código de 8 dígitos, a SEFAZ rejeitará a Nota Fiscal." />
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-4 text-purple-400" size={20} />
                                            <input
                                                type="text"
                                                value={form.ncm}
                                                onChange={e => {
                                                    setForm({...form, ncm: e.target.value});
                                                    setBuscandoNcm(true);
                                                }}
                                                className="w-full pl-12 pr-4 p-4 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500 focus:bg-white text-lg"
                                                placeholder="Digite o código (ex: 8708) ou nome..."
                                            />
                                        </div>
                                        {buscandoNcm && resultadosNcm.length > 0 && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar">
                                                {resultadosNcm.map((ncm, index) => {
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
                                                            className="p-4 border-b border-slate-100 hover:bg-purple-50 cursor-pointer transition-colors"
                                                        >
                                                            <p className="font-bold text-purple-700 text-base">{codigo}</p>
                                                            <p className="text-xs text-slate-500 font-black uppercase truncate mt-1">{descricao}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                                            CEST
                                            <Tooltip texto="Código Especificador da Substituição Tributária. Só é obrigatório se o produto for sujeito ao regime de Substituição Tributária (ICMS-ST)." />
                                        </label>
                                        <input type="text" value={form.cest} onChange={e=>setForm({...form, cest: e.target.value})} className="w-full p-4 border-2 bg-slate-50 rounded-xl font-mono outline-none focus:border-purple-500 text-lg" placeholder="Ex: 01.001.00"/>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-purple-500"/> Padrões de Venda do Sistema</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">CFOP Padrão de Saída</label><input type="text" value={form.cfopPadrao} onChange={e=>setForm({...form, cfopPadrao: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" placeholder="Ex: 5102"/></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">CSOSN (Simples Nacional)</label><input type="text" value={form.csosnPadrao} onChange={e=>setForm({...form, csosnPadrao: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" placeholder="Ex: 102"/></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">CST Padrão (Lucro Presumido)</label><input type="text" value={form.cstPadrao} onChange={e=>setForm({...form, cstPadrao: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" placeholder="Ex: 00"/></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="font-black text-slate-800 mb-4">Alíquotas e Outros Impostos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aliq. ICMS (%)</label><input type="number" step="0.01" value={form.aliquotaIcms} onChange={e=>setForm({...form, aliquotaIcms: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aliq. PIS (%)</label><input type="number" step="0.01" value={form.aliquotaPis} onChange={e=>setForm({...form, aliquotaPis: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aliq. COFINS (%)</label><input type="number" step="0.01" value={form.aliquotaCofins} onChange={e=>setForm({...form, aliquotaCofins: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Aliq. IPI (%)</label><input type="number" step="0.01" value={form.aliquotaIpi} onChange={e=>setForm({...form, aliquotaIpi: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none font-mono" /></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Origem da Mercadoria (Usada na NF-e)</label>
                                    <select value={form.origemMercadoria} onChange={e=>setForm({...form, origemMercadoria: e.target.value})} className="w-full p-4 border-2 bg-slate-50 rounded-xl font-bold outline-none focus:border-purple-500 text-sm">
                                        <option value="0">0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8</option>
                                        <option value="1">1 - Estrangeira - Importação direta, exceto a indicada no código 6</option>
                                        <option value="2">2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7</option>
                                        <option value="3">3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40%</option>
                                        <option value="4">4 - Nacional, cuja produção tenha sido feita em conformidade com o PPB</option>
                                        <option value="5">5 - Nacional, com Conteúdo de Importação inf. a 40% (Resolução do Senado)</option>
                                        <option value="8">8 - Nacional, mercadoria com Conteúdo de Importação superior a 70%</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        {abaAtiva === 'midia' && (
                            <div className="animate-fade-in flex flex-col md:flex-row gap-8 bg-white p-8 border-2 border-slate-200 rounded-2xl shadow-sm max-w-5xl">
                                <div className="flex-1 space-y-6">
                                    <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
                                        <h4 className="font-black text-indigo-800 flex items-center gap-2 text-lg"><ImageIcon size={20}/> Exibição no Ponto de Venda</h4>
                                        <p className="text-sm text-indigo-600 mt-2 font-medium">Imagens de peças ajudam na conferência visual rápida antes de fechar a venda no balcão.</p>
                                    </div>
                                    <div><label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">URL da Foto (Cole o Link)</label><input type="text" value={form.fotoUrl} onChange={e => setForm({...form, fotoUrl: e.target.value})} className="w-full p-4 border-2 bg-slate-50 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm" placeholder="https://..." /></div>
                                </div>
                                <div className="w-full md:w-80 flex flex-col items-center">
                                    <div className="w-72 h-72 border-4 border-dashed border-slate-200 rounded-3xl flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner">
                                        {form.fotoUrl || form.fotoLocalPath ? <img src={form.fotoUrl || form.fotoLocalPath} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/250?text=Imagem+Indisponível'} /> : <ImageIcon size={72} className="mx-auto mb-3 opacity-50"/>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOTÃO DE SALVAR ÚNICO NO RODAPÉ */}
                    <div className="p-6 bg-slate-100 flex justify-end gap-4 border-t border-slate-200 rounded-b-3xl">
                        <button onClick={voltarParaLista} title="Descartar alterações e voltar" className="px-8 py-4 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">CANCELAR</button>
                        <button onClick={salvarProduto} title="Confirmar e salvar produto" className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-transform transform hover:scale-105"><Save size={20}/> SALVAR PRODUTO</button>
                    </div>
                </div>
            )}

            {/* MINI-MODAL DE MARCA */}
            {modalMarcaAberto && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100">
                        <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2">Nova Marca</h3>
                            <button onClick={() => { setModalMarcaAberto(false); setNovaMarcaNome(''); }} title="Fechar sem salvar" className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome da Marca</label>
                            <input type="text" value={novaMarcaNome} onChange={e => setNovaMarcaNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarNovaMarcaRapida()} className="w-full mt-2 p-4 border-2 rounded-xl font-black text-lg focus:border-blue-500 outline-none uppercase bg-slate-50 focus:bg-white" autoFocus placeholder="Ex: BOSCH" />
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t">
                            <button onClick={() => { setModalMarcaAberto(false); setNovaMarcaNome(''); }} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={salvarNovaMarcaRapida} disabled={salvandoMarca} title="Salvar no banco e usar neste produto" className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20">{salvandoMarca ? 'Salvando...' : 'Salvar e Usar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MINI-MODAL DE CATEGORIA */}
            {modalCategoriaAberto && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-slate-100">
                        <div className="p-6 bg-purple-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2">Nova Categoria</h3>
                            <button onClick={() => { setModalCategoriaAberto(false); setNovaCategoriaNome(''); }} title="Fechar sem salvar" className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome da Categoria</label>
                            <input type="text" value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarNovaCategoriaRapida()} className="w-full mt-2 p-4 border-2 rounded-xl font-black text-lg focus:border-purple-500 outline-none uppercase bg-slate-50 focus:bg-white" placeholder="Ex: SUSPENSÃO" autoFocus />
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t">
                            <button onClick={() => { setModalCategoriaAberto(false); setNovaCategoriaNome(''); }} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={salvarNovaCategoriaRapida} disabled={salvandoCategoria} title="Salvar no banco e usar neste produto" className="px-6 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-lg shadow-purple-600/20">{salvandoCategoria ? 'Salvando...' : 'Salvar e Usar'}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};