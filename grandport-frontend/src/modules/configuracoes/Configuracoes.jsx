import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Settings, Building2, Printer, Sliders, Save, CheckCircle,
    AlertTriangle, Info, X, Store, FileText, Percent, ShieldAlert, Search, Loader2, Camera, Plus,
    Database, Download, Trash2, ShieldCheck, Clock, Users, Trash, MapPin,
    Plug, Smartphone, UploadCloud
} from 'lucide-react';

export const Configuracoes = () => {
    const [abaAtiva, setAbaAtiva] = useState('EMPRESA');
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [buscandoCnpj, setBuscandoCnpj] = useState(false);
    const [notificacao, setNotificacao] = useState(null);

    const [config, setConfig] = useState({
        nomeFantasia: '',
        razaoSocial: '',
        cnpj: '',
        inscricaoEstadual: '',
        telefone: '',
        email: '',
        // --- CAMPOS ATUALIZADOS PARA O BACKEND ---
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        // -----------------------------------------
        logoBase64: '',
        tamanhoImpressora: '80mm',
        mensagemRodape: '',
        exibirVendedorCupom: true,
        descontoMaximoPermitido: 10.00,
        permitirEstoqueNegativoGlobal: false,
        diasValidadeOrcamento: 5,
        horarioBackupAuto: '03:00',
        vendedores: [],
        whatsappToken: '',
        tipoCertificado: 'A1',
        senhaCertificado: ''
    });

    const [usuariosEquipe, setUsuariosEquipe] = useState([]);
    const [arquivoCertificado, setArquivoCertificado] = useState(null);

    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resConfig, resUsuarios] = await Promise.all([
                api.get('/api/configuracoes'),
                api.get('/api/usuarios')
            ]);
            setConfig(prev => ({ ...prev, ...resConfig.data }));
            setUsuariosEquipe(resUsuarios.data);
        } catch (error) {
            showToast('erro', 'Falha de Sincronização', 'Erro ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleComissaoChange = (usuarioId, valor) => {
        const novasConfiguracoesVendedores = [...(config.vendedores || [])];
        const index = novasConfiguracoesVendedores.findIndex(v => v.usuarioId === usuarioId);
        if (index > -1) { novasConfiguracoesVendedores[index].comissao = parseFloat(valor) || 0; }
        else { novasConfiguracoesVendedores.push({ usuarioId, comissao: parseFloat(valor) || 0 }); }
        setConfig(prev => ({ ...prev, vendedores: novasConfiguracoesVendedores }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setConfig(prev => ({ ...prev, logoBase64: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const buscarCNPJ = async () => {
        const cnpjLimpo = config.cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) return showToast('aviso', 'CNPJ Inválido', 'Digite os 14 números.');
        setBuscandoCnpj(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
            if (!response.ok) throw new Error('Erro');
            const data = await response.json();

            // 🚀 MAPEAMENTO INTELIGENTE DOS CAMPOS
            setConfig(prev => ({
                ...prev,
                razaoSocial: data.razao_social || prev.razaoSocial,
                nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
                telefone: data.ddd_telefone_1 || prev.telefone,
                email: data.email || prev.email,
                logradouro: data.logradouro || '',
                numero: data.numero || '',
                bairro: data.bairro || '',
                cidade: data.municipio || '',
                uf: data.uf || ''
            }));
            showToast('sucesso', 'Dados Encontrados', 'Endereço e dados da empresa atualizados!');
        } catch (error) {
            showToast('erro', 'Falha na Busca', 'Não foi possível encontrar os dados para este CNPJ.');
        } finally {
            setBuscandoCnpj(false);
        }
    };

    const salvarConfiguracoes = async () => {
        setSalvando(true);
        try {
            const res = await api.put('/api/configuracoes', config);
            setConfig(prev => ({ ...prev, ...res.data }));
            showToast('sucesso', 'Configurações Salvas', 'Dados aplicados com sucesso!');
        } catch (error) {
            showToast('erro', 'Erro ao Salvar', 'Verifique a conexão com o servidor.');
        } finally {
            setSalvando(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">CARREGANDO CONFIGURAÇÕES...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative flex flex-col h-full">

            {/* NOTIFICAÇÃO (TOAST) */}
            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in w-full max-w-md px-4">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-l-4 ${notificacao.tipo === 'sucesso' ? 'bg-green-50 border-green-500 text-green-800' : notificacao.tipo === 'erro' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-orange-50 border-orange-500 text-orange-800'}`}>
                        <div className="mt-1">{notificacao.tipo === 'sucesso' ? <CheckCircle size={24}/> : notificacao.tipo === 'erro' ? <AlertTriangle size={24}/> : <Info size={24}/>}</div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg">{notificacao.titulo}</h4>
                            <p className="text-sm font-medium mt-1">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-slate-600 bg-slate-200 p-1.5 rounded-xl" size={40} /> CONFIGURAÇÕES</h1>
                    <p className="text-slate-500 mt-1">Gerencie a identidade e as regras do GrandPort.</p>
                </div>
                <button onClick={salvarConfiguracoes} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50">
                    <Save size={20} /> {salvando ? 'PROCESSANDO...' : 'SALVAR TUDO'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                {/* MENU LATERAL */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    <button onClick={() => setAbaAtiva('EMPRESA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'EMPRESA' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Building2 size={20} /> Dados da Empresa</button>
                    <button onClick={() => setAbaAtiva('VENDEDORES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'VENDEDORES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Users size={20} /> Vendedores</button>
                    <button onClick={() => setAbaAtiva('IMPRESSAO')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'IMPRESSAO' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Printer size={20} /> Impressão</button>
                    <button onClick={() => setAbaAtiva('REGRAS')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'REGRAS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Sliders size={20} /> Regras</button>
                    <button onClick={() => setAbaAtiva('INTEGRACOES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'INTEGRACOES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Plug size={20} /> Integrações</button>
                    <button onClick={() => setAbaAtiva('SISTEMA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'SISTEMA' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Database size={20} /> Sistema</button>
                </div>

                <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[500px]">
                    {abaAtiva === 'EMPRESA' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Store className="text-blue-500" /> Identidade e Endereço</h2>

                            {/* LOGO */}
                            <div className="flex flex-col md:flex-row items-center gap-8 bg-blue-50 p-6 rounded-3xl border-2 border-dashed border-blue-200">
                                <div className="relative group">
                                    {config.logoBase64 ? <img src={config.logoBase64} alt="Logo" className="w-32 h-32 object-contain bg-white rounded-2xl shadow-md border-2 border-white" /> : <div className="w-32 h-32 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><Plus size={40} /></div>}
                                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-lg"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} /></label>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-black text-blue-900 text-lg">Logo da Empresa</h3>
                                    <p className="text-sm text-blue-600">Esta imagem aparecerá nos cabeçalhos dos documentos.</p>
                                    {config.logoBase64 && <button onClick={() => setConfig(prev => ({...prev, logoBase64: ''}))} className="text-red-500 text-xs font-black mt-2 hover:underline">REMOVER IMAGEM</button>}
                                </div>
                            </div>

                            {/* DADOS BÁSICOS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-blue-600 uppercase">CNPJ (Auto-Busca)</label>
                                    <div className="relative mt-1">
                                        <input type="text" name="cnpj" value={config.cnpj || ''} onChange={handleChange} className="w-full p-3 pr-12 bg-blue-50 border-2 border-blue-200 rounded-xl font-black focus:border-blue-500 outline-none" />
                                        <button onClick={buscarCNPJ} disabled={buscandoCnpj} className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg">{buscandoCnpj ? <Loader2 className="animate-spin" size={18}/> : <Search size={18} />}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Fantasia</label>
                                    <input type="text" name="nomeFantasia" value={config.nomeFantasia || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Razão Social</label>
                                    <input type="text" name="razaoSocial" value={config.razaoSocial || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* 🚀 NOVO GRID DE ENDEREÇO ESTRUTURADO */}
                            <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 mt-8"><MapPin size={16}/> Localização</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Logradouro (Rua/Av)</label>
                                    <input type="text" name="logradouro" value={config.logradouro || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Nº</label>
                                    <input type="text" name="numero" value={config.numero || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Bairro</label>
                                    <input type="text" name="bairro" value={config.bairro || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Cidade</label>
                                    <input type="text" name="cidade" value={config.cidade || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">UF</label>
                                    <input type="text" name="uf" value={config.uf || ''} onChange={handleChange} maxLength="2" className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold text-center outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp de Contato</label>
                                    <input type="text" name="telefone" value={config.telefone || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                                    <input type="email" name="email" value={config.email || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ... (Demais abas VENDEDORES, IMPRESSAO, REGRAS, INTEGRACOES, SISTEMA permanecem as mesmas que você enviou) ... */}
                    {abaAtiva === 'VENDEDORES' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4 border-b pb-4"><Users className="text-blue-500" /> Parametrização de Equipe</h2>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 mb-6">
                                <Info className="text-blue-500 mt-1" size={20} />
                                <p className="text-sm text-blue-700 font-medium">Defina aqui a comissão que cada vendedor receberá nas vendas concluídas.</p>
                            </div>
                            <div className="space-y-3">
                                {usuariosEquipe.map((membro) => {
                                    const configVendedor = (config.vendedores || []).find(v => v.usuarioId === membro.id);
                                    return (
                                        <div key={membro.id} className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xl">{membro.nome.charAt(0).toUpperCase()}</div>
                                                <div><h4 className="font-black text-slate-800">{membro.nome}</h4><span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{membro.cargo || 'Equipe'}</span></div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Comissão (%)</label>
                                                <div className="relative"><input type="number" step="0.1" value={configVendedor?.comissao || 0} onChange={(e) => handleComissaoChange(membro.id, e.target.value)} className="w-24 p-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-black text-center text-blue-600 outline-none"/><Percent size={12} className="absolute right-2 top-3 text-slate-300" /></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ... (Manter as outras abas conforme o seu código original) ... */}
                </div>
            </div>
        </div>
    );
};