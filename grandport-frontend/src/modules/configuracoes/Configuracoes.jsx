import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Settings, Building2, Printer, Sliders, Save, CheckCircle,
    AlertTriangle, Info, X, Store, Percent, Search, Loader2, Camera, Plus,
    Database, Users, MapPin, Plug, Smartphone, Clock, ShieldCheck, Download, Trash2, UploadCloud, Bomb, QrCode, RefreshCw, Receipt,
    Landmark, Wrench, Palette, LogOut, Link
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CentralDeLayouts } from './CentralDeLayouts';
import { CentralDeLaudos } from './CentralDeLaudos';
import { LayoutGovernanceDashboard } from './LayoutGovernanceDashboard';
import { CentralDanfe } from './CentralDanfe';

// 🚀 LISTA OFICIAL PARA GARANTIR QUE O DADO ENVIADO AO JAVA SEJA SEMPRE VÁLIDO
const ESTADOS_BRASIL = [
    { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' }, { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' }, { uf: 'RS', nome:'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' }
];

export const Configuracoes = () => {
    const [abaAtiva, setAbaAtiva] = useState('EMPRESA');
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [buscandoCnpj, setBuscandoCnpj] = useState(false);

    // 🚀 ESTADOS DO FLUXO SAAS (WHATSAPP)
    const [qrCodeBase64, setQrCodeBase64] = useState(null);
    const [statusWhatsapp, setStatusWhatsapp] = useState('DESCONHECIDO'); // CONNECTED, DISCONNECTED, ERRO
    const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);

    const [statusSefaz, setStatusSefaz] = useState('DESCONHECIDO');
    const [testandoSefaz, setTestandoSefaz] = useState(false);

    const [statusEmail, setStatusEmail] = useState('DESCONHECIDO');
    const [testandoEmail, setTestandoEmail] = useState(false);

    // ESTADOS DO ROBÔ DE LIMPEZA
    const [mesesLimpeza, setMesesLimpeza] = useState(24);
    const [limpandoFotos, setLimpandoFotos] = useState(false);

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
        serieNfce: 1,
        numeroProximaNfce: 1,
        cscIdToken: '',
        cscCodigo: '',

        inscricaoMunicipal: '',
        codigoCnae: '',
        codigoServicoLc116: '14.01',
        aliquotaIss: '',
        provedorPrefeitura: 'PADRAO_NACIONAL',
        ambienteNfse: 2,
        loginPrefeitura: '',
        senhaPrefeitura: '',

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
        whatsappInstancia: '',
        mensagemWhatsapp: '',// 🚀 CAMPO NOVO ADICIONADO AQUI
        tipoCertificado: 'A1',
        senhaCertificado: '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        emailRemetente: '',
        senhaEmailRemetente: '',
        exibirIvaDual: false
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
                    serieNfce: data.serieNfce || 1,
                    numeroProximaNfce: data.numeroProximaNfce || 1,
                    cscIdToken: data.cscIdToken || '',
                    cscCodigo: data.cscCodigo || '',

                    inscricaoMunicipal: data.inscricaoMunicipal || '',
                    codigoCnae: data.codigoCnae || '',
                    codigoServicoLc116: data.codigoServicoLc116 || '14.01',
                    aliquotaIss: data.aliquotaIss || '',
                    provedorPrefeitura: data.provedorPrefeitura || 'PADRAO_NACIONAL',
                    ambienteNfse: data.ambienteNfse || 2,
                    loginPrefeitura: data.loginPrefeitura || '',
                    senhaPrefeitura: data.senhaPrefeitura || '',

                    whatsappToken: data.whatsappToken || '',
                    whatsappApiUrl: data.whatsappApiUrl || '',
                    whatsappInstancia: data.whatsappInstancia || '', // 🚀 CAMPO NOVO ADICIONADO AQUI
                    tamanhoImpressora: data.tamanhoImpressora || '80mm',
                    mensagemRodape: data.mensagemRodape || '',

                    smtpHost: data.smtpHost || 'smtp.gmail.com',
                    smtpPort: data.smtpPort || 587,
                    emailRemetente: data.emailRemetente || '',
                    senhaEmailRemetente: data.senhaEmailRemetente || '',
                    exibirIvaDual: data.exibirIvaDual || false
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

    const verificarConexaoSefaz = async () => {
        setTestandoSefaz(true);
        const loadId = toast.loading('Consultando servidores da SEFAZ...');
        try {
            const res = await api.get('/api/fiscal/status-sefaz');
            setStatusSefaz(res.data.status);

            if (res.data.status === 'ONLINE') {
                toast.success(res.data.mensagem, { id: loadId });
            } else {
                toast.error(res.data.mensagem, { id: loadId });
            }
        } catch (error) {
            setStatusSefaz('ERRO');
            toast.error('Erro ao tentar conectar com a SEFAZ. Verifique os dados e o Certificado.', { id: loadId });
        } finally {
            setTestandoSefaz(false);
        }
    };

    const verificarConexaoEmail = async () => {
        await api.put('/api/configuracoes', config);

        setTestandoEmail(true);
        const loadId = toast.loading('Autenticando no servidor de E-mail (SMTP)...');
        try {
            const res = await api.get('/api/fiscal/testar-email');
            setStatusEmail('CONECTADO');
            toast.success(res.data.mensagem || 'E-mail autenticado com sucesso!', { id: loadId });
        } catch (error) {
            setStatusEmail('ERRO');
            toast.error('Falha ao conectar. Verifique se a Senha de App e o Servidor SMTP estão corretos.', { id: loadId });
        } finally {
            setTestandoEmail(false);
        }
    };

    const salvarConfiguracoes = async () => {
        setSalvando(true);
        const loadId = toast.loading('Salvando configurações...');

        try {
            const res = await api.put('/api/configuracoes', config);
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            setConfig(prev => ({ ...prev, ...data }));

            if (arquivoCertificado) {
                toast.loading('Enviando Certificado Digital...', { id: loadId });

                const formData = new FormData();
                formData.append('file', arquivoCertificado);

                const baseUrl = api.defaults.baseURL || 'http://localhost:8080';

                let token = localStorage.getItem('token');
                if (!token && api.defaults.headers.common['Authorization']) {
                    token = api.defaults.headers.common['Authorization'];
                }
                const authHeader = token ? (token.startsWith('Bearer') ? token : `Bearer ${token}`) : '';

                const uploadRes = await fetch(`${baseUrl}/api/configuracoes/certificado`, {
                    method: 'POST',
                    headers: { 'Authorization': authHeader },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const mensagemErroJava = await uploadRes.text();
                    console.error("Motivo da recusa do Java:", mensagemErroJava);
                    throw new Error(mensagemErroJava || 'Falha no upload');
                }

                setArquivoCertificado(null);
            }

            toast.success('Configurações salvas com sucesso!', { id: loadId });

        } catch (error) {
            console.error("Erro detalhado:", error);
            toast.error('Erro ao salvar configurações. Verifique o console.', { id: loadId });
        } finally {
            setSalvando(false);
        }
    };

    // =========================================================================
    // 🚀 FLUXO PROFISSIONAL WHATSAPP (SAAS)
    // =========================================================================

    // 1. Robô de Auto Refresh (Só roda na aba Integrações)
    useEffect(() => {
        let interval;
        if (abaAtiva === 'INTEGRACOES') {
            verificarStatus(true);
            interval = setInterval(() => {
                verificarStatus(true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [abaAtiva]);

    // 2. Buscar Status
    const verificarStatus = async (silencioso = false) => {
        if (!silencioso) setLoadingWhatsapp(true);
        try {
            const res = await api.get('/api/whatsapp/status');
            const estado = res.data?.instance?.state || res.data?.state;

            if (estado === 'open') {
                setStatusWhatsapp('CONNECTED');
                setQrCodeBase64(null); // Limpa o QR Code da tela
            } else if (estado === 'connecting' || estado === 'close') {
                setStatusWhatsapp('DISCONNECTED');
            } else {
                setStatusWhatsapp('DISCONNECTED');
            }
            return estado;
        } catch (error) {
            setStatusWhatsapp('ERRO');
            return 'ERRO';
        } finally {
            if (!silencioso) setLoadingWhatsapp(false);
        }
    };

    // 3. Conectar (Inteligente e Paciente)
    const conectar = async (paramTentativa) => {
        // 🚀 BLINDAGEM: Se o React mandar o clique do mouse, nós forçamos a tentativa ser 1.
        const tentativa = typeof paramTentativa === 'number' ? paramTentativa : 1;

        setLoadingWhatsapp(true);
        const toastId = toast.loading(`Iniciando motor do WhatsApp (Tentativa ${tentativa}/5)...`);

        try {
            const res = await api.get(`/api/whatsapp/qrcode?nocache=${new Date().getTime()}`);
            const data = res.data;

            console.log(`📦 RESPOSTA DA EVOLUTION (TENTATIVA ${tentativa}):`, data);

            const qr = data?.base64 || data?.qrcode?.base64 || data?.instance?.qrcode || data?.qrcode || null;
            const estadoAtual = data?.instance?.state || data?.state || data?.status || data?.instance?.status || 'DESCONHECIDO';

            if (qr) {
                setQrCodeBase64(qr);
                toast.success('QR Code gerado! Aponte a câmera do celular.', { id: toastId });
                setLoadingWhatsapp(false);
            } else if (estadoAtual === 'open' || estadoAtual === 'CONNECTED') {
                setStatusWhatsapp('CONNECTED');
                toast.success('O WhatsApp já está conectado! ✅', { id: toastId });
                setLoadingWhatsapp(false);
            } else {
                if (tentativa < 5) {
                    toast.loading(`Esquentando motor... Aguarde.`, { id: toastId });
                    setTimeout(() => conectar(tentativa + 1), 3000);
                } else {
                    toast.error(`Falha: A API não gerou a imagem a tempo.`, { id: toastId });
                    setLoadingWhatsapp(false);
                }
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor do WhatsApp.', { id: toastId });
            setLoadingWhatsapp(false);
        }
    };

    // 4. Reconectar (Derruba a sessão velha)
    const reconectar = async () => {
        setLoadingWhatsapp(true);
        const loadId = toast.loading('Desconectando sessão antiga...');

        try {
            await api.get('/api/whatsapp/logout');
            await new Promise(r => setTimeout(r, 2000)); // Espera a Evolution processar
            toast.loading('Sessão encerrada. Buscando novo QR...', { id: loadId });
            await conectar();
        } catch (error) {
            toast.error('Erro ao desconectar.', { id: loadId });
            setLoadingWhatsapp(false);
        }
    };

    const restaurarBanco = (event) => {
        const arquivo = event.target.files[0];
        if (!arquivo) return;

        if (!arquivo.name.endsWith('.sql')) {
            return toast.error("Por favor, selecione um arquivo .sql válido.");
        }

        toast((t) => (
            <div className="flex flex-col gap-3 max-w-sm">
                <div className="flex items-center gap-2 text-red-600 font-black text-lg">
                    <Bomb size={24} /> ALERTA CRÍTICO
                </div>
                <p className="text-sm text-slate-600 font-medium">
                    Esta ação apagará todos os dados atuais e substituirá pelos do arquivo. Tem certeza absoluta?
                </p>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">CANCELAR</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        executarRestauracaoBanco(arquivo);
                    }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md">RESTAURAR BANCO</button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });

        event.target.value = null;
    };

    const executarRestauracaoBanco = async (arquivo) => {
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
    };

    const fazerBackup = async () => {
        const loadId = toast.loading('Gerando backup do banco de dados...');
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

    const limparBancoDeDados = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 max-w-sm">
                <div className="flex items-center gap-2 text-red-600 font-black text-lg">
                    <AlertTriangle size={24} /> ATENÇÃO EXTREMA
                </div>
                <p className="text-sm text-slate-600 font-medium">
                    Isso irá APAGAR TODOS os Produtos, Clientes, Vendas e Orçamentos do banco de dados de forma irreversível!
                </p>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">CANCELAR</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        executarLimpezaBanco();
                    }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-colors shadow-md">RESETAR TUDO</button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const executarLimpezaBanco = async () => {
        const loadId = toast.loading('Resetando banco de dados. Por favor, aguarde...');
        try {
            await api.delete('/api/configuracoes/resetar-banco');
            toast.success('O banco de dados foi limpo com sucesso!', { id: loadId });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            toast.error('Erro ao limpar o banco de dados. Verifique a conexão com o servidor.', { id: loadId });
        }
    };

    const limparFotosAntigas = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 max-w-sm">
                <div className="flex items-center gap-2 text-orange-600 font-black text-lg">
                    <AlertTriangle size={24} /> Confirmação de Faxina
                </div>
                <p className="text-sm text-slate-600 font-medium">
                    Apagar permanentemente as fotos com mais de <b>{mesesLimpeza} meses</b>? O laudo em texto será mantido intacto.
                </p>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">CANCELAR</button>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        executarLimpezaFotos();
                    }} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-colors shadow-md">SIM, APAGAR</button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const executarLimpezaFotos = async () => {
        setLimpandoFotos(true);
        const loadId = toast.loading('O robô da faxina está trabalhando no servidor...');
        try {
            const response = await api.post(`/api/configuracoes/manutencao/limpar-fotos-vistorias?meses=${mesesLimpeza}`);
            const { fotosApagadas, espacoLiberadoMb, checklistsAfetados } = response.data;
            toast.success(`Faxina concluída! ${espacoLiberadoMb} MB liberados. (${fotosApagadas} fotos apagadas).`, { id: loadId, duration: 8000 });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao executar a limpeza. Verifique se a rota no Back-end está correta.', { id: loadId });
        } finally {
            setLimpandoFotos(false);
        }
    };

    const gruposNavegacao = [
        {
            id: 'negocio',
            label: 'Negócio',
            items: [
                { id: 'EMPRESA', label: 'Dados da Empresa', icon: Building2, activeClass: 'bg-blue-600 text-white shadow-md' },
                { id: 'VENDEDORES', label: 'Vendedores', icon: Users, activeClass: 'bg-blue-600 text-white shadow-md' },
                { id: 'REGRAS', label: 'Regras', icon: Sliders, activeClass: 'bg-blue-600 text-white shadow-md' },
            ],
        },
        {
            id: 'fiscal',
            label: 'Fiscal e Impressão',
            items: [
                { id: 'FISCAL', label: 'Fiscal / NF-e (Peças)', icon: Receipt, activeClass: 'bg-blue-600 text-white shadow-md' },
                { id: 'PREFEITURA', label: 'Prefeitura (Serviços)', icon: Landmark, activeClass: 'bg-orange-500 text-white shadow-md' },
                { id: 'IMPRESSAO', label: 'Impressão', icon: Printer, activeClass: 'bg-blue-600 text-white shadow-md' },
                { id: 'LAYOUTS', label: 'Layouts', icon: Palette, activeClass: 'bg-purple-600 text-white shadow-md' },
            ],
        },
        {
            id: 'plataforma',
            label: 'Plataforma',
            items: [
                { id: 'INTEGRACOES', label: 'Integrações', icon: Plug, activeClass: 'bg-blue-600 text-white shadow-md' },
                { id: 'SISTEMA', label: 'Sistema', icon: Database, activeClass: 'bg-slate-900 text-white shadow-md' },
            ],
        },
    ];

    if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">CARREGANDO CONFIGURAÇÕES...</div>;

    return (
        <div className="mx-auto flex h-full max-w-7xl flex-col animate-fade-in p-8">

            <div className="mb-8 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Centro administrativo
                        </div>
                        <h1 className="flex items-center gap-3 text-3xl font-black text-slate-800">
                            <Settings className="rounded-2xl bg-slate-200 p-1.5 text-slate-600" size={40} />
                            Configurações
                        </h1>
                        <p className="mt-2 max-w-2xl text-slate-500">
                            Gerencie identidade da empresa, parâmetros fiscais, impressão, integrações e rotinas críticas do ERP.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Aba atual: <span className="font-black text-slate-900">{abaAtiva}</span>
                        </div>
                        <button
                            onClick={salvarConfiguracoes}
                            disabled={salvando}
                            title="Aplicar e salvar permanentemente todas as alterações realizadas em todas as abas"
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save size={20} /> {salvando ? 'PROCESSANDO...' : 'SALVAR TUDO'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-8 xl:grid-cols-12">
                <div className="xl:col-span-3">
                    <div className="sticky top-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Seções</h2>
                        </div>
                        <div className="max-h-[820px] overflow-y-auto px-4 py-4">
                            <div className="space-y-5">
                                {gruposNavegacao.map((grupo) => (
                                    <div key={grupo.id}>
                                        <div className="px-2 pb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                                            {grupo.label}
                                        </div>
                                        <div className="space-y-2">
                                            {grupo.items.map((item) => {
                                                const Icone = item.icon;
                                                const ativo = abaAtiva === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setAbaAtiva(item.id)}
                                                        className={`flex w-full items-center gap-3 rounded-2xl p-4 font-bold transition-all ${
                                                            ativo
                                                                ? item.activeClass
                                                                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                                                        }`}
                                                    >
                                                        <Icone size={19} />
                                                        <span className="text-left">{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-9">
                    <div className="min-h-[500px] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">

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
                                        <button onClick={buscarCNPJ} disabled={buscandoCnpj} title="Consultar dados da empresa automatically na Receita Federal" className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg transition-all hover:bg-blue-700">{buscandoCnpj ? <Loader2 className="animate-spin" size={18}/> : <Search size={18} />}</button>
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

                            <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-2 mt-8"><MapPin size={16}/> Localização Oficial</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">

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
                                    <label className="text-[10px] font-black text-slate-400 uppercase">Número</label>
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
                                    <select name="uf" value={config.uf || ''} onChange={handleChange} className="w-full p-2 mt-1 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500">
                                        <option value="">Selecione</option>
                                        {ESTADOS_BRASIL.map(estado => (
                                            <option key={estado.uf} value={estado.uf}>{estado.uf} - {estado.nome}</option>
                                        ))}
                                    </select>
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

                    {abaAtiva === 'FISCAL' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Receipt className="text-blue-500" /> Parâmetros Fiscais (NF-e)
                                </h2>

                                <button onClick={verificarConexaoSefaz} disabled={testandoSefaz} title="Validar comunicação com os servidores da Receita Federal" className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border-2 ${statusSefaz === 'ONLINE' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    {testandoSefaz ? <RefreshCw className="animate-spin" size={14}/> : <div className={`w-2.5 h-2.5 rounded-full ${statusSefaz === 'ONLINE' ? 'bg-green-500 animate-pulse' : statusSefaz === 'OFFLINE' || statusSefaz === 'ERRO' ? 'bg-red-500' : 'bg-slate-400'}`} />}
                                    {testandoSefaz ? 'CONSULTANDO...' : 'TESTAR STATUS SEFAZ'}
                                </button>
                            </div>

                            <div className={`mt-6 mb-8 p-6 rounded-2xl border-4 transition-all flex items-center justify-between group cursor-pointer ${config.exibirIvaDual ? 'bg-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`} onClick={() => setConfig({...config, exibirIvaDual: !config.exibirIvaDual})}>
                                <div>
                                    <h4 className={`font-black text-lg ${config.exibirIvaDual ? 'text-green-700' : 'text-slate-600'}`}>Transparência Fiscal (IVA Dual / Padrão Americano) no Caixa</h4>
                                    <p className="text-sm font-medium text-slate-500 mt-1">{config.exibirIvaDual ? 'Ativado. O cliente verá o imposto separado no recibo e na tela de pagamento.' : 'Desativado. O imposto continuará embutido no preço total.'}</p>
                                </div>
                                <div className={`w-16 h-8 rounded-full flex items-center p-1 transition-colors ${config.exibirIvaDual ? 'bg-green-500 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-6 h-6 bg-white rounded-full shadow-sm"></div></div>
                            </div>

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
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Série da NF-e (Mod. 55)</label>
                                    <input type="number" name="serieNfe" value={config.serieNfe || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold text-center focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase" title="O número que o ERP utilizará para a próxima NF-e gerada">Próximo Nº da NF-e</label>
                                    <input type="number" name="numeroProximaNfe" value={config.numeroProximaNfe || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-black text-center text-blue-600 focus:border-blue-500 outline-none" />
                                </div>
                            </div>

                            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mt-8 mb-4">
                                <Receipt className="text-blue-500" size={18} /> Parâmetros Fiscais (NFC-e - Cupom de Balcão)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Série da NFC-e</label>
                                    <input type="number" name="serieNfce" value={config.serieNfce || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold text-center focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Próximo Nº NFC-e</label>
                                    <input type="number" name="numeroProximaNfce" value={config.numeroProximaNfce || 1} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-black text-center text-blue-600 focus:border-blue-500 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase" title="O ID do Token gerado na SEFAZ (Ex: 000001)">ID do Token (cIdToken)</label>
                                    <input type="text" name="cscIdToken" value={config.cscIdToken || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold focus:border-blue-500 outline-none" placeholder="Ex: 000001" />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase" title="O código alfanumérico longo do CSC">Código CSC (Senha)</label>
                                    <input type="text" name="cscCodigo" value={config.cscCodigo || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-500 outline-none" placeholder="Cole aqui o código CSC longo gerado na SEFAZ..." />
                                </div>
                            </div>

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
                                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><UploadCloud size={24} /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-700">{arquivoCertificado ? arquivoCertificado.name : 'Nenhum arquivo selecionado'}</p>
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

                    {abaAtiva === 'PREFEITURA' && (
                        <div className="p-8 overflow-y-auto animate-fade-in custom-scrollbar">
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl mb-8 flex items-start gap-4">
                                <Landmark size={32} className="text-orange-600 shrink-0"/>
                                <div>
                                    <h3 className="font-black text-orange-800">Prefeitura Municipal (Imposto Sobre Serviços - ISS)</h3>
                                    <p className="text-sm font-medium text-orange-700 mt-1">Configure as chaves e códigos da sua prefeitura para a emissão automática de <b className="font-black">NFS-e</b> referente à Mão de Obra das Ordens de Serviço.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 block">Inscrição Municipal (IM) *</label>
                                    <input type="text" name="inscricaoMunicipal" value={config.inscricaoMunicipal || ''} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-mono text-slate-700 outline-none focus:border-orange-500" placeholder="Apenas números" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 flex items-center justify-between">
                                        <span>Alíquota do ISS (%)</span><span className="text-slate-400 font-medium normal-case">Padrão da Oficina</span>
                                    </label>
                                    <div className="relative">
                                        <input type="number" step="0.01" name="aliquotaIss" value={config.aliquotaIss || ''} onChange={handleChange} className="w-full p-3 pl-10 bg-white border-2 border-slate-200 rounded-xl font-black text-orange-600 outline-none focus:border-orange-500" placeholder="Ex: 5.0" />
                                        <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"/>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                                            CNAE Principal (Serviços) <a href="https://concla.ibge.gov.br/busca-online-cnae.html" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline normal-case">Consultar IBGE</a>
                                        </label>
                                        <input type="text" name="codigoCnae" value={config.codigoCnae || ''} onChange={handleChange} className="w-full p-2 bg-white border-2 border-slate-200 rounded-lg font-mono text-sm outline-none focus:border-orange-500" placeholder="Ex: 4520-0/01" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                                            Código de Serviço (Lista LC 116)<span className="text-slate-400 normal-case text-[9px]">Padrão: 14.01</span>
                                        </label>
                                        <input type="text" name="codigoServicoLc116" value={config.codigoServicoLc116 || ''} onChange={handleChange} className="w-full p-2 bg-white border-2 border-slate-200 rounded-lg font-mono text-sm outline-none focus:border-orange-500" placeholder="Ex: 14.01" />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Provedor da Prefeitura</label>
                                        <select name="provedorPrefeitura" value={config.provedorPrefeitura || 'PADRAO_NACIONAL'} onChange={handleChange} className="w-full p-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-sm text-slate-700 outline-none focus:border-orange-500 cursor-pointer">
                                            <option value="PADRAO_NACIONAL">Padrão Nacional (Sefin)</option>
                                            <option value="GINFES">Ginfes</option>
                                            <option value="BETHA">Betha Sistemas</option>
                                            <option value="IPM">IPM</option>
                                            <option value="WEBISS">WebISS</option>
                                            <option value="OUTRO">Outro (Via Integração)</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                                        <div className="col-span-2"><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Acesso ao Portal da Prefeitura (Se Exigido)</p></div>
                                        <div><input type="text" name="loginPrefeitura" value={config.loginPrefeitura || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-500" placeholder="Login/Usuário" /></div>
                                        <div><input type="password" name="senhaPrefeitura" value={config.senhaPrefeitura || ''} onChange={handleChange} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-500" placeholder="Senha Web" /></div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 block">Ambiente da Prefeitura (NFS-e)</label>
                                    <select name="ambienteNfse" value={config.ambienteNfse || 2} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold focus:border-orange-500 outline-none text-sm cursor-pointer">
                                        <option value={1}>1 - Produção (Emissão Oficial na Prefeitura)</option>
                                        <option value={2}>2 - Homologação (Ambiente de Testes)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {/* ======================================================= */}
                    {/* 🖨️ ABA DE IMPRESSÃO (LIMPA E FOCADA) */}
                    {/* ======================================================= */}
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
                            <div className="mt-4">
                                <label className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                                    Texto Padrão do WhatsApp (Envio de PDF)
                                </label>
                                <textarea
                                    name="mensagemWhatsapp"
                                    value={config.mensagemWhatsapp || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Ex: Olá! Seu pedido já está pronto. Segue o recibo em anexo! 🚀"
                                    className="w-full p-3 mt-1 bg-white border-2 border-green-200 rounded-xl text-sm outline-none focus:border-green-500 text-slate-700 shadow-sm"
                                ></textarea>
                                <p className="text-[10px] text-slate-500 mt-1 font-medium">Esta mensagem acompanhará o PDF enviado para o cliente.</p>
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                                    <Palette size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-blue-900 text-lg">Edição de Templates Movida!</h3>
                                    <p className="text-sm text-blue-800 font-medium mt-1">
                                        Todos os códigos HTML dos recibos, extratos e ordens de serviço agora são gerenciados na aba exclusiva <b>🎨 Layouts</b> no menu lateral.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {abaAtiva === 'INTEGRACOES' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Plug className="text-blue-500" /> Integrações e APIs</h2>

                                <button
                                    onClick={() => verificarStatus(false)}
                                    disabled={loadingWhatsapp}
                                    title="Validar se o WhatsApp ainda está conectado e pronto para enviar mensagens"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border-2 ${
                                        statusWhatsapp === 'CONNECTED'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    {loadingWhatsapp ? <RefreshCw className="animate-spin" size={14}/> : <div className={`w-2 h-2 rounded-full ${statusWhatsapp === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />}
                                    {loadingWhatsapp ? 'VALIDANDO...' : 'TESTAR CONEXÃO'}
                                </button>
                            </div>

                            {/* 📱 BLOCO WHATSAPP */}
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 pb-4">
                                    <div>
                                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg"><Smartphone className="text-green-500" /> Motor WhatsApp ERP</h3>
                                        <p className="text-sm text-slate-500 font-medium">Conecte o seu celular para disparar orçamentos e comprovantes automaticamente.</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-inner border ${statusWhatsapp === 'CONNECTED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                        {statusWhatsapp === 'CONNECTED' ? <CheckCircle size={14}/> : <Info size={14}/>}
                                        Status: {statusWhatsapp}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 relative min-h-[300px]">

                                        {/* TELA 1: CONECTADO */}
                                        {statusWhatsapp === 'CONNECTED' ? (
                                                <div className="flex flex-col items-center animate-fade-in text-center w-full">
                                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner"><CheckCircle size={40} /></div>
                                                    <h4 className="font-black text-green-700 text-xl">Celular Conectado!</h4>
                                                    <p className="text-sm text-green-800 font-medium mt-1 mb-6">O sistema está pronto para disparar PDFs.</p>

                                                    <button onClick={reconectar} disabled={loadingWhatsapp} className="w-full max-w-xs bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 px-6 py-3 rounded-xl font-black shadow-sm flex items-center justify-center gap-2 transition-all">
                                                        {loadingWhatsapp ? <Loader2 className="animate-spin" size={18}/> : <LogOut size={18}/>}
                                                        {loadingWhatsapp ? 'PROCESSANDO...' : 'DESCONECTAR (RECONECTAR)'}
                                                    </button>
                                                </div>
                                            )

                                            /* TELA 2: MOSTRANDO O QR CODE PARA LER */
                                            : qrCodeBase64 ? (
                                                    <div className="flex flex-col items-center animate-fade-in">
                                                        <div className="p-2 bg-white rounded-2xl shadow-xl mb-4 border border-slate-100">
                                                            <img src={qrCodeBase64} alt="QR Code WhatsApp" className="w-48 h-48 object-contain" />
                                                        </div>
                                                        <h4 className="font-black text-slate-800">Abra o WhatsApp</h4>
                                                        <p className="text-xs text-slate-500 text-center mt-1">Aparelhos conectados {'>'} Conectar aparelho<br/>e aponte a câmera.</p>
                                                        <button onClick={() => setQrCodeBase64(null)} className="mt-4 text-xs font-bold text-red-500 hover:underline">CANCELAR</button>
                                                    </div>
                                                )

                                                /* TELA 3: DESCONECTADO (BOTÃO DE INÍCIO) */
                                                : (
                                                    <div className="flex flex-col items-center text-center w-full">
                                                        <QrCode size={64} className="text-slate-300 mb-4" />
                                                        <h4 className="font-black text-slate-700 mb-1">Aparelho Desconectado</h4>
                                                        <p className="text-xs text-slate-500 mb-6">Para iniciar os disparos de PDF, vincule o seu número comercial ao sistema.</p>
                                                        <button onClick={conectar} disabled={loadingWhatsapp} className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all">
                                                            {loadingWhatsapp ? <Loader2 className="animate-spin" size={18}/> : <Link size={18}/>}
                                                            {loadingWhatsapp ? 'AGUARDANDO...' : 'CONECTAR CELULAR'}
                                                        </button>
                                                    </div>
                                                )}
                                    </div>

                                    <div className="flex flex-col justify-center">
                                        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl shadow-inner">
                                            <h4 className="text-sm font-black text-green-800 mb-4 flex items-center gap-2">
                                                <Plug size={18} /> Credenciais da API Externa
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest">URL da API (Endpoint)</label>
                                                    <input type="text" name="whatsappApiUrl" value={config.whatsappApiUrl || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-green-200 rounded-xl text-sm font-mono outline-none focus:border-green-500 text-slate-700 shadow-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest">Token / Global API Key</label>
                                                    <input type="password" name="whatsappToken" value={config.whatsappToken || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-green-200 rounded-xl text-sm font-mono outline-none focus:border-green-500 text-slate-700 shadow-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest">Nome da Instância</label>
                                                    <input type="text" name="whatsappInstancia" value={config.whatsappInstancia || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-green-200 rounded-xl text-sm font-mono outline-none focus:border-green-500 text-slate-700 shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                                    <div>
                                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">📧 Servidor de E-mail (Envio de Notas)</h3>
                                        <p className="text-sm text-slate-500 font-medium">Configure a conta que fará o envio dos XMLs para o contador e clientes.</p>
                                    </div>

                                    <button
                                        onClick={verificarConexaoEmail}
                                        disabled={testandoEmail}
                                        title="Validar se o e-mail e a senha de aplicativo estão corretos"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border-2 ${
                                            statusEmail === 'CONECTADO'
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {testandoEmail ? <RefreshCw className="animate-spin" size={14}/> :
                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                statusEmail === 'CONECTADO' ? 'bg-green-500 animate-pulse' :
                                                    statusEmail === 'ERRO' ? 'bg-red-500' : 'bg-slate-400'
                                            }`} />
                                        }
                                        {testandoEmail ? 'TESTANDO...' : 'TESTAR LOGIN DE E-MAIL'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">E-mail Remetente (Gmail, Outlook, etc)</label>
                                        <input type="email" name="emailRemetente" value={config.emailRemetente || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="loja@gmail.com" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Senha de Aplicativo (App Password)</label>
                                        <input type="password" name="senhaEmailRemetente" value={config.senhaEmailRemetente || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="••••••••••••••••" />
                                        <p className="text-[10px] text-blue-600 mt-1 font-bold">⚠️ Importante: Não use a senha normal. Gere uma "Senha de App" no provedor.</p>
                                    </div>

                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 md:col-span-2">
                                        <h4 className="text-xs font-black text-orange-800 mb-2">Configurações Avançadas (SMTP)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Servidor SMTP</label>
                                                <input type="text" name="smtpHost" value={config.smtpHost || 'smtp.gmail.com'} onChange={handleChange} className="w-full p-2 mt-1 bg-white border-2 border-slate-200 rounded-lg text-sm font-mono outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Porta SMTP</label>
                                                <input type="number" name="smtpPort" value={config.smtpPort || 587} onChange={handleChange} className="w-full p-2 mt-1 bg-white border-2 border-slate-200 rounded-lg text-sm font-mono outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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

                            <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-1">
                                            <Wrench size={18} className="text-orange-500"/> Robô de Faxina (Armazenamento)
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">Libere espaço no HD apagando fotos de vistorias antigas. Os textos e assinaturas dos laudos serão mantidos.</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <select
                                            value={mesesLimpeza}
                                            onChange={(e) => setMesesLimpeza(e.target.value)}
                                            className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500"
                                        >
                                            <option value={6}>Vistorias com +6 meses</option>
                                            <option value={12}>Vistorias com +1 ano</option>
                                            <option value={24}>Vistorias com +2 anos</option>
                                            <option value={36}>Vistorias com +3 anos</option>
                                        </select>
                                        <button
                                            onClick={limparFotosAntigas}
                                            disabled={limpandoFotos}
                                            title="Acionar robô para excluir arquivos físicos do servidor"
                                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm px-6 py-3 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {limpandoFotos ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            {limpandoFotos ? 'LIMPANDO...' : 'EXECUTAR FAXINA'}
                                        </button>
                                    </div>
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

                    {abaAtiva === 'LAYOUTS' && (
                        <div className="animate-fade-in space-y-8">
                            <LayoutGovernanceDashboard />
                            <CentralDeLayouts />
                            <CentralDeLaudos />
                            <CentralDanfe />
                        </div>
                    )}

                </div>
            </div>
        </div>
        </div>
    );
};
