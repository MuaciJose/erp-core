import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Settings, Building2, Printer, Sliders, Save, CheckCircle,
    AlertTriangle, Info, X, Store, Percent, Search, Loader2, Camera, Plus,
    Database, Users, MapPin, Plug, Smartphone, Clock, ShieldCheck, Download, Trash2, UploadCloud, Bomb, QrCode, RefreshCw, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
export const Configuracoes = () => {
    const [abaAtiva, setAbaAtiva] = useState('EMPRESA');
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [buscandoCnpj, setBuscandoCnpj] = useState(false);

    // 🚀 ESTADOS PARA A MÁGICA DO WHATSAPP (QR CODE)
    const [qrCodeBase64, setQrCodeBase64] = useState(null);
    const [statusWhatsapp, setStatusWhatsapp] = useState('DESCONHECIDO');
    const [gerandoQr, setGerandoQr] = useState(false);
    const [checandoConexao, setChecandoConexao] = useState(false);

    // 🚀 ATUALIZADO COM OS NOVOS CAMPOS FISCAIS E ENDEREÇO
    const [config, setConfig] = useState({
        nomeFantasia: '',
        razaoSocial: '',
        cnpj: '',
        inscricaoEstadual: '',
        telefone: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        codigoIbgeMunicipio: '',
        crt: '1',
        ambienteSefaz: 2,
        serieNfe: 1,
        numeroProximaNfe: 1,
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
        whatsappApiUrl: '',
        tipoCertificado: 'A1',
        senhaCertificado: ''
    });

    const [usuariosEquipe, setUsuariosEquipe] = useState([]);
    const [arquivoCertificado, setArquivoCertificado] = useState(null);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resConfig, resUsuarios] = await Promise.all([
                api.get('/api/configuracoes'),
                api.get('/api/usuarios')
            ]);

            const data = Array.isArray(resConfig.data) ? resConfig.data[0] : resConfig.data;

            if (data) {
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    cep: data.cep || '',
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || '',
                    uf: data.uf || '',
                    codigoIbgeMunicipio: data.codigoIbgeMunicipio || '',
                    telefone: data.telefone || '',
                    email: data.email || '',
                    cnpj: data.cnpj || '',
                    razaoSocial: data.razaoSocial || '',
                    nomeFantasia: data.nomeFantasia || '',
                    inscricaoEstadual: data.inscricaoEstadual || '',
                    crt: data.crt || '1',
                    ambienteSefaz: data.ambienteSefaz || 2,
                    serieNfe: data.serieNfe || 1,
                    numeroProximaNfe: data.numeroProximaNfe || 1,
                    whatsappToken: data.whatsappToken || '',
                    whatsappApiUrl: data.whatsappApiUrl || '',
                    tamanhoImpressora: data.tamanhoImpressora || '80mm',
                    mensagemRodape: data.mensagemRodape || ''
                }));
            }
            setUsuariosEquipe(resUsuarios.data || []);
        } catch (error) {
            toast.error('Erro ao carregar configurações do servidor.');
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

    // =========================================================================
    // 🚀 BUSCA DE CNPJ (BRASIL API)
    // =========================================================================
    const buscarCNPJ = async () => {
        const cnpjLimpo = config.cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) {
            return toast.error('CNPJ Inválido: Digite os 14 números.');
        }

        setBuscandoCnpj(true);
        const loadId = toast.loading('Buscando dados na Receita Federal...');

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
            if (!response.ok) throw new Error('Erro');
            const data = await response.json();

            setConfig(prev => ({
                ...prev,
                razaoSocial: data.razao_social || prev.razaoSocial,
                nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
                telefone: data.ddd_telefone_1 || data.telefone || prev.telefone,
                email: data.email || prev.email,
                cep: data.cep || prev.cep,
                logradouro: data.logradouro || data.descricao_tipo_de_logradouro || prev.logradouro || '',
                numero: data.numero || prev.numero || '',
                bairro: data.bairro || prev.bairro,
                cidade: data.municipio || prev.cidade,
                uf: data.uf || prev.uf,
                codigoIbgeMunicipio: data.codigo_municipio || prev.codigoIbgeMunicipio
            }));
            toast.success('Dados da empresa importados com sucesso!', { id: loadId });
        } catch (error) {
            toast.error('Não foi possível encontrar os dados para este CNPJ.', { id: loadId });
        } finally {
            setBuscandoCnpj(false);
        }
    };

    // =========================================================================
    // 🚀 NOVA BUSCA DE CEP (VIA CEP) PARA GARANTIR O LOGRADOURO E IBGE
    // =========================================================================
    const buscarCEP = async () => {
        const cepLimpo = config.cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            return toast.error('CEP Inválido: Digite os 8 números.');
        }

        const loadId = toast.loading('Buscando endereço via Correios...');

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (!response.ok) throw new Error('Erro na requisição');
            const data = await response.json();

            if (data.erro) {
                return toast.error('CEP não encontrado.', { id: loadId });
            }

            setConfig(prev => ({
                ...prev,
                logradouro: data.logradouro || prev.logradouro,
                bairro: data.bairro || prev.bairro,
                cidade: data.localidade || prev.cidade,
                uf: data.uf || prev.uf,
                codigoIbgeMunicipio: data.ibge || prev.codigoIbgeMunicipio
            }));
            toast.success('Endereço e IBGE preenchidos!', { id: loadId });
        } catch (error) {
            toast.error('Falha ao buscar o CEP.', { id: loadId });
        }
    };

    const salvarConfiguracoes = async () => {
        setSalvando(true);
        const loadId = toast.loading('Salvando configurações...');

        try {
            // 1. Salva os textos (JSON) usando o seu 'api' normal
            const res = await api.put('/api/configuracoes', config);
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            setConfig(prev => ({ ...prev, ...data }));

            // 2. 🚀 ENVIA O ARQUIVO COM FETCH NATIVO (IMUNE AO AXIOS)
            if (arquivoCertificado) {
                toast.loading('Enviando Certificado Digital...', { id: loadId });

                const formData = new FormData();
                formData.append('file', arquivoCertificado);

                // Descobre a URL do seu servidor
                const baseUrl = api.defaults.baseURL || 'http://localhost:8080';

                // Caça o Token de Segurança de todas as formas possíveis
                let token = localStorage.getItem('token');
                if (!token && api.defaults.headers.common['Authorization']) {
                    token = api.defaults.headers.common['Authorization'];
                }
                const authHeader = token ? (token.startsWith('Bearer') ? token : `Bearer ${token}`) : '';

                // 🚀 O DISPARO NATIVO (O Axios não consegue tocar nisso aqui)
                const uploadRes = await fetch(`${baseUrl}/api/configuracoes/certificado`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader
                        // NUNCA coloque 'Content-Type' aqui. O navegador criará a "fronteira" do arquivo.
                    },
                    body: formData
                });

                if (!uploadRes.ok) {
                    // Se o Java reclamar, agora vamos ler O QUE ele reclamou!
                    const mensagemErroJava = await uploadRes.text();
                    console.error("Motivo da recusa do Java:", mensagemErroJava);
                    throw new Error(mensagemErroJava || 'Falha no upload');
                }

                setArquivoCertificado(null); // Limpa da tela após sucesso
            }

            toast.success('Configurações e Certificado salvos com sucesso!', { id: loadId });

        } catch (error) {
            console.error("Erro detalhado:", error);
            toast.error('Erro ao salvar certificado. Verifique o console.', { id: loadId });
        } finally {
            setSalvando(false);
        }
    };


    // =========================================================================
    // 🚀 WHATSAPP E SISTEMA
    // =========================================================================
    const solicitarQrCode = async (tentativa) => {
        const numTentativa = typeof tentativa === 'number' ? tentativa : 1;
        setGerandoQr(true);
        const loadId = toast.loading(`Obtendo QR Code (Tentativa ${numTentativa})...`);

        try {
            const res = await api.get('/api/whatsapp/qrcode');
            const qrCodeBase64 = res.data?.qrcode?.base64 || res.data?.base64;

            if (res.data?.instance?.status === 'open' || res.data?.status === 'open') {
                setStatusWhatsapp('CONECTADO');
                setQrCodeBase64(null);
                toast.success('WhatsApp Conectado!', { id: loadId });
            }
            else if (qrCodeBase64) {
                setStatusWhatsapp('AGUARDANDO_LEITURA');
                setQrCodeBase64(qrCodeBase64);
                toast.success('Aponte a câmera do celular!', { id: loadId });
            }
            else {
                if (numTentativa < 8) {
                    setTimeout(() => solicitarQrCode(numTentativa + 1), 3000);
                } else {
                    toast.error('O motor demorou para gerar o código.', { id: loadId });
                }
            }
        } catch (error) {
            toast.error('Erro ao buscar QR Code no servidor.', { id: loadId });
        } finally {
            setGerandoQr(false);
        }
    };

    const verificarConexaoAtiva = async () => {
        setChecandoConexao(true);
        const loadId = toast.loading('Validando conexão com o WhatsApp...');
        try {
            const res = await api.get('/api/vendas/whatsapp/status');
            const estado = res.data?.instance?.state || res.data?.state;

            if (estado === 'open') {
                setStatusWhatsapp('CONECTADO');
                toast.success("WhatsApp está ONLINE!", { id: loadId });
            } else {
                setStatusWhatsapp('DESCONECTADO');
                toast.error("WhatsApp está desconectado.", { id: loadId });
            }
        } catch (error) {
            setStatusWhatsapp('ERRO');
            toast.error("Falha ao consultar motor do WhatsApp.", { id: loadId });
        } finally {
            setChecandoConexao(false);
        }
    };

    const restaurarBanco = async (event) => {
        const arquivo = event.target.files[0];
        if (!arquivo) return;

        if (!arquivo.name.endsWith('.sql')) {
            return toast.error("Por favor, selecione um arquivo .sql válido.");
        }

        const confirmacao = window.confirm(
            "🚨 ATENÇÃO CRÍTICA 🚨\n\nEsta ação apagará todos os dados atuais e substituirá pelos do arquivo.\n\nTem certeza absoluta?"
        );

        if (confirmacao) {
            const formData = new FormData();
            formData.append('file', arquivo);

            const loadId = toast.loading('Restaurando banco de dados... Não feche o navegador.');
            try {
                await api.post('/api/configuracoes/restaurar-banco', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Banco de dados restaurado com sucesso!', { id: loadId });
                setTimeout(() => window.location.reload(), 3000);
            } catch (error) {
                console.error(error);
                toast.error('Falha na restauração. Verifique o console do servidor.', { id: loadId });
            }
        }
        event.target.value = null;
    };

    const fazerBackup = async () => {
        const loadId = toast.loading('Gerando backup do banco de dados... Isto pode demorar alguns segundos.');
        try {
            const response = await api.get('/api/configuracoes/backup', { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const dataHoje = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `backup_grandport_${dataHoje}.sql`);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast.success('Backup descarregado com sucesso!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao gerar o backup. Verifique o servidor.', { id: loadId });
        }
    };

    const limparLogsCache = async () => {
        const loadId = toast.loading('Limpando cache e arquivos temporários...');
        try {
            await api.post('/api/configuracoes/limpar-logs');
            toast.success('Limpeza de sistema concluída!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao limpar logs.', { id: loadId });
        }
    };

    const limparBancoDeDados = async () => {
        const confirmacao = window.confirm(
            "⚠️ ATENÇÃO EXTREMA ⚠️\n\nIsso irá APAGAR TODOS os Produtos, Clientes, Vendas e Orçamentos do banco de dados.\nEssa ação é irreversível.\n\nTem certeza absoluta que deseja resetar o sistema?"
        );

        if (confirmacao) {
            const loadId = toast.loading('Resetando banco de dados. Por favor, aguarde...');
            try {
                await api.delete('/api/configuracoes/resetar-banco');
                toast.success('O banco de dados foi limpo com sucesso!', { id: loadId });
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                toast.error('Erro ao limpar o banco de dados. Verifique a conexão com o servidor.', { id: loadId });
            }
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">CARREGANDO CONFIGURAÇÕES...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative flex flex-col h-full">

            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-slate-600 bg-slate-200 p-1.5 rounded-xl" size={40} /> CONFIGURAÇÕES</h1>
                    <p className="text-slate-500 mt-1">Gerencie a identidade, regras e motor fiscal do ERP.</p>
                </div>
                <button
                    onClick={salvarConfiguracoes}
                    disabled={salvando}
                    title="Aplicar e salvar permanentemente todas as alterações realizadas em todas as abas"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    <Save size={20} /> {salvando ? 'PROCESSANDO...' : 'SALVAR TUDO'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                {/* MENU LATERAL */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    <button onClick={() => setAbaAtiva('EMPRESA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'EMPRESA' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Building2 size={20} /> Dados da Empresa</button>
                    <button onClick={() => setAbaAtiva('FISCAL')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'FISCAL' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Receipt size={20} /> Fiscal / NF-e</button>
                    <button onClick={() => setAbaAtiva('VENDEDORES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'VENDEDORES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Users size={20} /> Vendedores</button>
                    <button onClick={() => setAbaAtiva('IMPRESSAO')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'IMPRESSAO' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Printer size={20} /> Impressão</button>
                    <button onClick={() => setAbaAtiva('REGRAS')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'REGRAS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Sliders size={20} /> Regras</button>
                    <button onClick={() => setAbaAtiva('INTEGRACOES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'INTEGRACOES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Plug size={20} /> Integrações</button>
                    <button onClick={() => setAbaAtiva('SISTEMA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${abaAtiva === 'SISTEMA' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Database size={20} /> Sistema</button>
                </div>

                <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[500px]">

                    {/* ABA: DADOS DA EMPRESA */}
                    {abaAtiva === 'EMPRESA' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Store className="text-blue-500" /> Identidade e Endereço</h2>

                            <div className="flex flex-col md:flex-row items-center gap-8 bg-blue-50 p-6 rounded-3xl border-2 border-dashed border-blue-200">
                                <div className="relative group">
                                    {config.logoBase64 ? <img src={config.logoBase64} alt="Logo" className="w-32 h-32 object-contain bg-white rounded-2xl shadow-md border-2 border-white" /> : <div className="w-32 h-32 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><Plus size={40} /></div>}
                                    <label title="Carregar nova imagem de logo do seu computador" className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-lg"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} /></label>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-black text-blue-900 text-lg">Logo da Empresa</h3>
                                    <p className="text-sm text-blue-600">Esta imagem aparecerá nos cabeçalhos dos documentos.</p>
                                    {config.logoBase64 && <button onClick={() => setConfig(prev => ({...prev, logoBase64: ''}))} title="Excluir o logotipo atual" className="text-red-500 text-xs font-black mt-2 hover:underline">REMOVER IMAGEM</button>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-blue-600 uppercase">CNPJ (Auto-Busca)</label>
                                    <div className="relative mt-1">
                                        <input type="text" name="cnpj" value={config.cnpj || ''} onChange={handleChange} title="Digite apenas números para realizar a busca automática" className="w-full p-3 pr-12 bg-blue-50 border-2 border-blue-200 rounded-xl font-black focus:border-blue-500 outline-none" />
                                        <button onClick={buscarCNPJ} disabled={buscandoCnpj} title="Consultar dados da empresa automaticamente na Receita Federal via API" className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg transition-all hover:bg-blue-700">{buscandoCnpj ? <Loader2 className="animate-spin" size={18}/> : <Search size={18} />}</button>
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

                            <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 mt-8"><MapPin size={16}/> Localização Oficial (SEFAZ)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">

                                {/* 🚀 CAMPO CEP COM BOTÃO VIACEP ADICIONADO */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">CEP (Auto-Busca)</label>
                                    <div className="relative mt-1">
                                        <input type="text" name="cep" value={config.cep || ''} onChange={handleChange} maxLength="9" className="w-full p-2 pr-10 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" placeholder="00000-000" />
                                        <button onClick={buscarCEP} title="Buscar endereço completo e IBGE através da ViaCEP" className="absolute right-1 top-1 bottom-1 bg-slate-100 hover:bg-slate-200 text-blue-600 p-1.5 rounded-md transition-colors">
                                            <Search size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Logradouro (Rua/Av)</label>
                                    <input type="text" name="logradouro" value={config.logradouro || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Nº</label>
                                    <input type="text" name="numero" value={config.numero || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Bairro</label>
                                    <input type="text" name="bairro" value={config.bairro || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Cidade</label>
                                    <input type="text" name="cidade" value={config.cidade || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase">UF</label>
                                    <input type="text" name="uf" value={config.uf || ''} onChange={handleChange} maxLength="2" className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold text-center outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase" title="Código exigido pela Receita Federal para emissão de Notas">Cód. IBGE Município</label>
                                    <input type="text" name="codigoIbgeMunicipio" value={config.codigoIbgeMunicipio || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp de Contato</label>
                                    <input type="text" name="telefone" value={config.telefone || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                                    <input type="email" name="email" value={config.email || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: FISCAL / NF-e (NOVA) */}
                    {abaAtiva === 'FISCAL' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4">
                                <Receipt className="text-blue-500" /> Parâmetros Fiscais (NF-e)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Inscrição Estadual (I.E.)</label>
                                    <input type="text" name="inscricaoEstadual" value={config.inscricaoEstadual || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" placeholder="Ex: 123456789" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Regime Tributário (CRT)</label>
                                    <select name="crt" value={config.crt || '1'} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none">
                                        <option value="1">Simples Nacional</option>
                                        <option value="2">Simples Nacional (Excesso de Sublimite)</option>
                                        <option value="3">Regime Normal (Lucro Presumido/Real)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Ambiente Sefaz</label>
                                    <select name="ambienteSefaz" value={config.ambienteSefaz || 2} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none text-sm">
                                        <option value={1}>1 - Produção (Com Valor Fiscal)</option>
                                        <option value={2}>2 - Homologação (Testes)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Série da NF-e</label>
                                    <input type="number" name="serieNfe" value={config.serieNfe || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold text-center focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase" title="O número que o ERP utilizará para a próxima NF-e gerada">Próximo Nº da NF-e</label>
                                    <input type="number" name="numeroProximaNfe" value={config.numeroProximaNfe || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-black text-center text-blue-600 focus:border-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* CERTIFICADO DIGITAL */}
                            <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl shadow-inner">
                                <h3 className="font-black text-blue-900 flex items-center gap-2 mb-4"><ShieldCheck className="text-blue-600" /> Certificado Digital (A1/A3)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-blue-700 uppercase">Tipo do Certificado</label>
                                        <select name="tipoCertificado" value={config.tipoCertificado || 'A1'} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-blue-200 rounded-xl font-bold focus:border-blue-500 outline-none">
                                            <option value="A1">A1 (Arquivo Digital .pfx / .p12)</option>
                                            <option value="A3">A3 (Cartão Físico / Token)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-blue-700 uppercase">Senha do Certificado</label>
                                        <input type="password" name="senhaCertificado" value={config.senhaCertificado || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-blue-200 rounded-xl font-bold focus:border-blue-500 outline-none" placeholder="••••••••" />
                                    </div>

                                    {config.tipoCertificado === 'A1' && (
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-blue-700 uppercase">Arquivo do Certificado (Upload)</label>
                                            <div className="mt-1 flex items-center gap-4 p-4 bg-white border-2 border-dashed border-blue-300 rounded-xl transition-all hover:border-blue-500">
                                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                                    <UploadCloud size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {arquivoCertificado ? arquivoCertificado.name : 'Nenhum arquivo selecionado'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Selecione o arquivo do seu certificado (formato .pfx ou .p12)</p>
                                                </div>
                                                <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-md">
                                                    PROCURAR
                                                    <input type="file" className="hidden" accept=".pfx,.p12" onChange={(e) => setArquivoCertificado(e.target.files[0])} />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: VENDEDORES */}
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
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={configVendedor?.comissao || 0} onChange={(e) => handleComissaoChange(membro.id, e.target.value)} title={`Definir percentual de comissão padrão para ${membro.nome}`} className="w-24 p-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-black text-center text-blue-600 outline-none focus:border-blue-500"/>
                                                    <Percent size={12} className="absolute right-2 top-3 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ABA: IMPRESSÃO */}
                    {abaAtiva === 'IMPRESSAO' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Printer className="text-blue-500" /> Configurações de Impressão</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tamanho Padrão do Papel (PDV)</label>
                                    <select name="tamanhoImpressora" value={config.tamanhoImpressora || '80mm'} onChange={handleChange} title="Escolha o formato que melhor se adapta à sua impressora de balcão" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none">
                                        <option value="80mm">Bobina 80mm</option>
                                        <option value="58mm">Bobina 58mm</option>
                                        <option value="A4">Folha A4</option>
                                    </select>
                                </div>
                                <div className="flex items-center mt-6">
                                    <input type="checkbox" id="exibirVendedorCupom" name="exibirVendedorCupom" checked={config.exibirVendedorCupom || false} onChange={handleChange} className="w-6 h-6 accent-blue-600 rounded cursor-pointer" />
                                    <label htmlFor="exibirVendedorCupom" className="ml-3 font-bold text-slate-700 cursor-pointer" title="Se marcado, o nome do vendedor que realizou a venda aparecerá no cabeçalho do recibo">Exibir nome do vendedor no documento impresso</label>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Mensagem Padrão no Rodapé (Garantia/Agradecimento)</label>
                                    <textarea name="mensagemRodape" value={config.mensagemRodape || ''} onChange={handleChange} rows="3" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" placeholder="Ex: Orçamento sujeito a alteração de preços após validade."></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA: REGRAS */}
                    {abaAtiva === 'REGRAS' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Sliders className="text-blue-500" /> Regras de Negócio</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Desconto Máximo Permitido (%)</label>
                                    <input type="number" step="0.1" name="descontoMaximoPermitido" value={config.descontoMaximoPermitido || 0} onChange={handleChange} title="Bloqueia descontos superiores a este valor nas telas de venda" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-blue-700 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Validade do Orçamento (Dias)</label>
                                    <input type="number" name="diasValidadeOrcamento" value={config.diasValidadeOrcamento || 5} onChange={handleChange} title="Período em que o orçamento impresso é considerado válido pela empresa" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" />
                                </div>

                                <div className="md:col-span-2 mt-4 p-5 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-start gap-4">
                                    <input type="checkbox" id="permitirEstoqueNegativoGlobal" name="permitirEstoqueNegativoGlobal" checked={config.permitirEstoqueNegativoGlobal || false} onChange={handleChange} className="w-full h-6 accent-orange-600 mt-1 cursor-pointer" />
                                    <div>
                                        <label htmlFor="permitirEstoqueNegativoGlobal" className="font-black text-orange-900 text-lg cursor-pointer block">Permitir Estoque Negativo Global</label>
                                        <p className="text-sm text-orange-800 font-medium mt-1">Se marcado, o sistema não bloqueará vendas de produtos que constam com estoque zero no sistema. Útil se você faz vendas sem dar entrada em nota primeiro.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA INTEGRAÇÕES */}
                    {abaAtiva === 'INTEGRACOES' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Plug className="text-blue-500" /> Integrações e APIs</h2>

                                <button
                                    onClick={verificarConexaoAtiva}
                                    disabled={checandoConexao}
                                    title="Validar se o WhatsApp ainda está conectado e pronto para enviar mensagens"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border-2 ${
                                        statusWhatsapp === 'CONECTADO'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    {checandoConexao ? <RefreshCw className="animate-spin" size={14}/> : <div className={`w-2 h-2 rounded-full ${statusWhatsapp === 'CONECTADO' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />}
                                    {checandoConexao ? 'VALIDANDO...' : 'TESTAR CONEXÃO'}
                                </button>
                            </div>

                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
                                    <div>
                                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg"><Smartphone className="text-green-500" /> Motor WhatsApp ERP</h3>
                                        <p className="text-sm text-slate-500 font-medium">Conecte o seu celular para disparar orçamentos e comprovantes automaticamente.</p>
                                    </div>
                                    <div title="Estado atual da sincronização com o aparelho celular" className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-inner border ${statusWhatsapp === 'CONECTADO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                        {statusWhatsapp === 'CONECTADO' ? <CheckCircle size={14}/> : <Info size={14}/>}
                                        Status: {statusWhatsapp}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 relative min-h-[300px]">
                                        {qrCodeBase64 ? (
                                            <div className="flex flex-col items-center animate-fade-in">
                                                <div className="p-2 bg-white rounded-2xl shadow-xl mb-4 border border-slate-100">
                                                    <img src={qrCodeBase64} alt="QR Code WhatsApp" className="w-48 h-48 object-contain" />
                                                </div>
                                                <h4 className="font-black text-slate-800">Abra o WhatsApp</h4>
                                                <p className="text-xs text-slate-500 text-center mt-1">Aparelhos conectados {'>'} Conectar aparelho<br/>e aponte a câmera.</p>
                                                <button onClick={() => setQrCodeBase64(null)} title="Interromper processo de leitura" className="mt-4 text-xs font-bold text-red-500 hover:underline">CANCELAR</button>
                                            </div>
                                        ) : statusWhatsapp === 'CONECTADO' ? (
                                            <div className="flex flex-col items-center animate-fade-in text-center">
                                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner"><CheckCircle size={40} /></div>
                                                <h4 className="font-black text-green-700 text-xl">Celular Conectado!</h4>
                                                <p className="text-sm text-green-800 font-medium mt-1">Seu sistema já está disparando PDFs.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <QrCode size={64} className="text-slate-300 mb-4" />
                                                <h4 className="font-black text-slate-700 mb-1">Aparelho Desconectado</h4>
                                                <p className="text-xs text-slate-500 mb-6">Para iniciar os disparos de PDF, vincule o seu número comercial ao sistema.</p>
                                                <button
                                                    onClick={solicitarQrCode}
                                                    disabled={gerandoQr}
                                                    title="Solicitar ao servidor a geração de um novo código de pareamento"
                                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-green-500/30 flex items-center gap-2 transition-all"
                                                >
                                                    {gerandoQr ? <Loader2 className="animate-spin" size={18}/> : <Smartphone size={18}/>}
                                                    {gerandoQr ? 'AGUARDANDO...' : 'CONECTAR CELULAR (GERAR QR)'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-center">
                                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                                            <h4 className="font-bold text-orange-800 flex items-center gap-2 text-sm"><Sliders size={16}/> Configuração Técnica (Avançado)</h4>
                                            <p className="text-xs text-orange-700 mt-1">Deixe vazio para usar o servidor local nativo, ou insira os dados do seu provedor terceirizado (Ex: Z-API, ChatPro).</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">URL da API (Endpoint Base)</label>
                                                <input type="text" name="whatsappApiUrl" value={config.whatsappApiUrl || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-500 outline-none" placeholder="Ex: http://localhost:8081" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Token de Autenticação (Global)</label>
                                                <input type="password" name="whatsappToken" value={config.whatsappToken || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-500 outline-none" placeholder="Cole o token fornecido..." />
                                            </div>
                                            <button onClick={salvarConfiguracoes} title="Salvar apenas os dados de endereço e token da API de WhatsApp" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl mt-2 transition-colors">
                                                SALVAR DADOS TÉCNICOS
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ABA: SISTEMA */}
                    {abaAtiva === 'SISTEMA' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4">
                                <Database className="text-blue-500" /> Sistema e Segurança
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Clock size={18} className="text-slate-400"/> Rotinas Automáticas</h3>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Horário do Backup Automático</label>
                                    <input type="time" name="horarioBackupAuto" value={config.horarioBackupAuto || '03:00'} onChange={handleChange} title="Defina o melhor horário (preferencialmente de madrugada) para o sistema salvar uma cópia de segurança" className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">O sistema fará uma cópia de segurança diária neste horário.</p>
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Database size={18} className="text-slate-400"/> Manutenção de Dados</h3>
                                    <div className="flex gap-2">
                                        <button onClick={fazerBackup} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm" title="Baixar agora uma cópia completa de segurança do banco de dados (.sql) para o seu computador">
                                            <Download size={18} /> FAZER BACKUP AGORA
                                        </button>

                                        <button onClick={limparLogsCache} className="bg-red-100 hover:bg-red-200 text-red-600 font-bold px-4 py-3 rounded-xl flex items-center justify-center transition-colors" title="Excluir logs antigos e limpar o cache para otimizar a velocidade do servidor">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 font-medium text-center">Recomendamos fazer o download do backup 1x por semana.</p>
                                </div>
                            </div>

                            <div className="mt-8 p-6 border-2 border-red-500 bg-red-50 rounded-3xl relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <AlertTriangle size={150} className="text-red-600" />
                                </div>
                                <h3 className="font-black text-red-700 flex items-center gap-2 mb-2 relative z-10">
                                    <Bomb size={24} /> ZONA DE PERIGO
                                </h3>
                                <p className="text-sm text-red-900 font-medium mb-6 relative z-10">
                                    Ações nesta área são irreversíveis. Utilize apenas em ambiente de teste ou antes de colocar o sistema em produção oficial para os clientes.
                                </p>

                                <div className="flex flex-col gap-3 relative z-10">
                                    <label title="CUIDADO: Substitui TODOS os dados atuais do sistema pelo conteúdo de um arquivo de backup (.sql)" className="bg-white text-red-600 border-2 border-red-600 hover:bg-red-50 px-6 py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-colors shadow-lg cursor-pointer">
                                        <UploadCloud size={20} /> UPLOAD E RESTAURAR BANCO (.SQL)
                                        <input
                                            type="file"
                                            accept=".sql"
                                            className="hidden"
                                            onChange={restaurarBanco}
                                        />
                                    </label>

                                    <button
                                        onClick={limparBancoDeDados}
                                        title="CUIDADO EXTREMO: Apaga permanentemente todos os produtos, clientes e vendas cadastrados, resetando o banco de dados"
                                        className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-4 rounded-xl flex items-center gap-3 transition-colors shadow-lg"
                                    >
                                        <AlertTriangle size={20} /> RESETAR E LIMPAR BANCO DE DADOS
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};