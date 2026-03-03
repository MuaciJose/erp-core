import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Settings, Building2, Printer, Sliders, Save, CheckCircle,
    AlertTriangle, Info, X, Store, FileText, Percent, ShieldAlert, Search, Loader2, Camera, Plus,
    Database, Download, Trash2, ShieldCheck, Clock, Users, Trash,
    Plug, Smartphone, UploadCloud // <-- Novos ícones importados aqui
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
        endereco: '',
        logoBase64: '',
        tamanhoImpressora: '80mm',
        mensagemRodape: '',
        exibirVendedorCupom: true,
        descontoMaximoPermitido: 10.00,
        permitirEstoqueNegativoGlobal: false,
        diasValidadeOrcamento: 5,
        horarioBackupAuto: '03:00',
        vendedores: [],
        // --- NOVOS CAMPOS DE INTEGRAÇÃO ---
        whatsappToken: '',
        tipoCertificado: 'A1',
        senhaCertificado: ''
    });

    const [usuariosEquipe, setUsuariosEquipe] = useState([]);

    // Novo estado para segurar o arquivo do certificado A1 antes de salvar
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
            console.error("Erro ao carregar dados", error);
            showToast('erro', 'Falha de Sincronização', 'Não foi possível carregar as configurações ou a equipe.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

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

        if (index > -1) {
            novasConfiguracoesVendedores[index].comissao = parseFloat(valor) || 0;
        } else {
            novasConfiguracoesVendedores.push({ usuarioId, comissao: parseFloat(valor) || 0 });
        }

        setConfig(prev => ({ ...prev, vendedores: novasConfiguracoesVendedores }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                showToast('aviso', 'Arquivo muito grande', 'Escolha uma logo de até 500KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, logoBase64: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // --- NOVA FUNÇÃO PARA O UPLOAD DO CERTIFICADO ---
    const handleCertificadoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArquivoCertificado(file);
            showToast('sucesso', 'Certificado Selecionado', `Arquivo ${file.name} pronto para envio.`);
        }
    };

    const handleGerarBackup = async () => {
        setSalvando(true);
        try {
            const response = await api.get('/api/configuracoes/backup', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup_sistema_${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            showToast('sucesso', 'Backup Concluído', 'A cópia de segurança foi baixada com sucesso!');
        } catch (error) {
            showToast('erro', 'Falha no Backup', 'Não foi possível gerar o arquivo de segurança.');
        } finally {
            setSalvando(false);
        }
    };

    const handleLimparLogs = async () => {
        if(!window.confirm("Deseja apagar os registros de erros técnicos?")) return;
        setSalvando(true);
        try {
            await api.post('/api/configuracoes/limpar-logs');
            showToast('sucesso', 'Limpeza Concluída', 'O histórico de registros técnicos foi resetado.');
        } catch (error) {
            showToast('erro', 'Falha na Limpeza', 'Erro ao limpar registros.');
        } finally {
            setSalvando(false);
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
            setConfig(prev => ({
                ...prev,
                razaoSocial: data.razao_social || prev.razaoSocial,
                nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
                telefone: data.ddd_telefone_1 || prev.telefone,
                email: data.email || prev.email,
                endereco: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}-${data.uf}`
            }));
            showToast('sucesso', 'Dados Encontrados', 'Informações preenchidas automaticamente!');
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
            showToast('sucesso', 'Configurações Salvas', 'As novas configurações foram aplicadas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar", error);
            showToast('erro', 'Erro ao Salvar', 'Ocorreu um problema ao tentar salvar as configurações.');
        } finally {
            setSalvando(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400">Sincronizando equipe e configurações...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative flex flex-col h-full">

            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in w-full max-w-md px-4">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-l-4 ${notificacao.tipo === 'sucesso' ? 'bg-green-50 border-green-500 text-green-800' : notificacao.tipo === 'erro' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-orange-50 border-orange-500 text-orange-800'}`}>
                        <div className="mt-1">
                            {notificacao.tipo === 'sucesso' && <CheckCircle size={24} />}
                            {notificacao.tipo === 'erro' && <AlertTriangle size={24} />}
                            {notificacao.tipo === 'aviso' && <Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg">{notificacao.titulo}</h4>
                            <p className="text-sm font-medium mt-1 whitespace-pre-line leading-relaxed">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-slate-600 bg-slate-200 p-1.5 rounded-xl" size={40} /> CONFIGURAÇÕES GERAIS</h1>
                    <p className="text-slate-500 mt-1">Gerencie os dados da sua empresa, cupons e regras do PDV.</p>
                </div>
                <button onClick={salvarConfiguracoes} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50">
                    <Save size={20} /> {salvando ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">

                <div className="w-full lg:w-64 flex flex-col gap-2">
                    <button onClick={() => setAbaAtiva('EMPRESA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'EMPRESA' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Building2 size={20} /> Dados da Empresa
                    </button>
                    <button onClick={() => setAbaAtiva('VENDEDORES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'VENDEDORES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Users size={20} /> Vendedores & Equipe
                    </button>
                    <button onClick={() => setAbaAtiva('IMPRESSAO')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'IMPRESSAO' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Printer size={20} /> Impressão & Cupons
                    </button>
                    <button onClick={() => setAbaAtiva('REGRAS')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'REGRAS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Sliders size={20} /> Regras de Negócio
                    </button>

                    {/* NOVA ABA ADICIONADA AQUI */}
                    <button onClick={() => setAbaAtiva('INTEGRACOES')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'INTEGRACOES' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Plug size={20} /> Integrações & APIs
                    </button>

                    <button onClick={() => setAbaAtiva('SISTEMA')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'SISTEMA' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Database size={20} /> Sistema & Backup
                    </button>
                </div>

                <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">

                    {abaAtiva === 'EMPRESA' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Store className="text-blue-500" /> Identidade e Contato</h2>

                            <div className="flex flex-col md:flex-row items-center gap-8 bg-blue-50 p-6 rounded-3xl border-2 border-dashed border-blue-200 mb-8">
                                <div className="relative group">
                                    {config.logoBase64 ? (
                                        <img src={config.logoBase64} alt="Logo" className="w-32 h-32 object-contain bg-white rounded-2xl shadow-md border-2 border-white" />
                                    ) : (
                                        <div className="w-32 h-32 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                                            <Plus size={40} />
                                        </div>
                                    )}
                                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
                                        <Camera size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-black text-blue-900 text-lg">Logo da Empresa</h3>
                                    <p className="text-sm text-blue-600 font-medium">Esta imagem será utilizada nos cabeçalhos de orçamentos e pedidos em A4.</p>
                                    {config.logoBase64 && (
                                        <button onClick={() => setConfig(prev => ({...prev, logoBase64: ''}))} className="text-red-500 text-xs font-black mt-2 hover:underline flex items-center gap-1 mx-auto md:mx-0">
                                            <X size={14}/> REMOVER IMAGEM
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-blue-600 uppercase flex justify-between"><span>CNPJ (Busca Automática)</span></label>
                                    <div className="relative mt-1">
                                        <input type="text" name="cnpj" value={config.cnpj || ''} onChange={handleChange} placeholder="Digite apenas números..." className="w-full p-3 pr-12 bg-blue-50 border-2 border-blue-200 rounded-xl font-black text-slate-800 focus:border-blue-500 outline-none" />
                                        <button onClick={buscarCNPJ} disabled={buscandoCnpj} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"><Search size={18} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Fantasia</label>
                                    <input type="text" name="nomeFantasia" value={config.nomeFantasia || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Razão Social</label>
                                    <input type="text" name="razaoSocial" value={config.razaoSocial || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Inscrição Estadual (IE)</label>
                                    <input type="text" name="inscricaoEstadual" value={config.inscricaoEstadual || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                                    <input type="text" name="telefone" value={config.telefone || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail de Contato</label>
                                    <input type="email" name="email" value={config.email || ''} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                                <textarea name="endereco" value={config.endereco || ''} onChange={handleChange} rows="4" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none resize-none"></textarea>
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'VENDEDORES' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4 border-b pb-4"><Users className="text-blue-500" /> Parametrização de Equipe</h2>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 mb-6">
                                <Info className="text-blue-500 mt-1" size={20} />
                                <p className="text-sm text-blue-700 font-medium">Os usuários abaixo são carregados do módulo <strong>Equipe e Acesso</strong>. Defina aqui a comissão que cada um receberá nas vendas do PDV.</p>
                            </div>

                            <div className="space-y-3">
                                {usuariosEquipe.length === 0 ? (
                                    <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold italic">Nenhum membro da equipe encontrado no sistema.</p>
                                    </div>
                                ) : (
                                    usuariosEquipe.map((membro) => {
                                        const configVendedor = (config.vendedores || []).find(v => v.usuarioId === membro.id);

                                        return (
                                            <div key={membro.id} className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xl">
                                                        {membro.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800">{membro.nome}</h4>
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{membro.cargo || 'Funcionário'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Comissão de Venda</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={configVendedor?.comissao || 0}
                                                            onChange={(e) => handleComissaoChange(membro.id, e.target.value)}
                                                            className="w-28 p-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-black text-center text-blue-600 outline-none focus:border-blue-500"
                                                        />
                                                        <Percent size={12} className="absolute right-2 top-3 text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'IMPRESSAO' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><FileText className="text-blue-500" /> Parametrização de Recibos</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tamanho da Impressora / Bobina</label>
                                    <select name="tamanhoImpressora" value={config.tamanhoImpressora || '80mm'} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none">
                                        <option value="80mm">Térmica 80mm (Padrão PDV)</option>
                                        <option value="58mm">Térmica 58mm (Pequena)</option>
                                        <option value="A4">Folha A4 (Impressora Comum)</option>
                                    </select>
                                </div>
                                <div className="flex items-center bg-slate-50 p-4 rounded-xl border-2 border-slate-200 mt-5">
                                    <label className="flex items-center gap-3 cursor-pointer w-full">
                                        <input type="checkbox" name="exibirVendedorCupom" checked={config.exibirVendedorCupom} onChange={handleChange} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                        <span className="font-bold text-slate-700">Imprimir Nome do Vendedor no Cupom</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem de Rodapé (Fim do Cupom)</label>
                                <textarea name="mensagemRodape" value={config.mensagemRodape || ''} onChange={handleChange} rows="3" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none resize-none"></textarea>
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'REGRAS' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><ShieldAlert className="text-blue-500" /> Travas e Permissões Globais</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Percent size={14}/> Desconto Máximo Permitido (%)</label>
                                    <input type="number" step="0.01" name="descontoMaximoPermitido" value={config.descontoMaximoPermitido || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none text-2xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Validade de Orçamentos (Dias)</label>
                                    <input type="number" name="diasValidadeOrcamento" value={config.diasValidadeOrcamento || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none text-2xl" />
                                </div>
                            </div>
                            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                                <div className="mt-1"><AlertTriangle className="text-red-500" size={24} /></div>
                                <div>
                                    <h3 className="font-black text-red-800 text-lg">Permitir Venda com Estoque Negativo</h3>
                                    <label className="flex items-center gap-2 cursor-pointer w-max bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm mt-3">
                                        <input type="checkbox" name="permitirEstoqueNegativoGlobal" checked={config.permitirEstoqueNegativoGlobal} onChange={handleChange} className="w-5 h-5 accent-red-600 cursor-pointer" />
                                        <span className="font-bold text-red-700">Liberar Estoque Negativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================== */}
                    {/* NOVA ABA: INTEGRAÇÕES E APIS               */}
                    {/* ========================================== */}
                    {abaAtiva === 'INTEGRACOES' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4">
                                <Plug className="text-blue-500" /> Integrações e APIs Externas
                            </h2>

                            {/* SESSÃO WHATSAPP */}
                            <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-3xl mb-6">
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-2">
                                    <Smartphone className="text-green-500" /> API do WhatsApp
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Configure o token da sua API (ex: Evolution API / Z-API) para enviar orçamentos e comprovantes em PDF diretamente pelo sistema.</p>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Token de Acesso / API Key</label>
                                    <input
                                        type="password"
                                        name="whatsappToken"
                                        value={config.whatsappToken || ''}
                                        onChange={handleChange}
                                        placeholder="Cole seu token de integração aqui..."
                                        className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-mono text-slate-800 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* SESSÃO CERTIFICADO DIGITAL */}
                            <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-3xl">
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-2">
                                    <ShieldCheck className="text-blue-500" /> Certificado Digital (NF-e / NFC-e)
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Deixe preparado para emissão de Notas Fiscais.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Certificado</label>
                                        <select
                                            name="tipoCertificado"
                                            value={config.tipoCertificado || 'A1'}
                                            onChange={handleChange}
                                            className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="A1">Arquivo Digital (Modelo A1 - .pfx / .p12)</option>
                                            <option value="A3">Cartão/Token Físico (Modelo A3)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Senha do Certificado</label>
                                        <input
                                            type="password"
                                            name="senhaCertificado"
                                            value={config.senhaCertificado || ''}
                                            onChange={handleChange}
                                            placeholder="Senha do arquivo PFX"
                                            className="w-full p-3 mt-1 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    {config.tipoCertificado === 'A1' && (
                                        <div className="md:col-span-2 bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                            <input type="file" accept=".pfx,.p12" onChange={handleCertificadoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                                            <p className="font-bold text-slate-700">Clique para anexar o arquivo do Certificado A1</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {arquivoCertificado ? <span className="text-green-600 font-black">{arquivoCertificado.name}</span> : 'Formatos suportados: .pfx ou .p12'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {abaAtiva === 'SISTEMA' && (
                        <div className="space-y-8 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Database className="text-slate-600" /> Manutenção e Segurança</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl group hover:border-orange-500 transition-all">
                                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                        <Clock size={24} />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg">Horário do Auto-Backup</h3>
                                    <input type="time" name="horarioBackupAuto" value={config.horarioBackupAuto || "03:00"} onChange={handleChange} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-black text-2xl text-slate-800 focus:border-orange-500 outline-none transition-all" />
                                </div>
                                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl group hover:border-blue-500 transition-all">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Download size={24} />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg">Cópia de Segurança</h3>
                                    <button onClick={handleGerarBackup} className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"><Download size={18} /> GERAR BACKUP AGORA</button>
                                </div>
                                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl group hover:border-red-500 transition-all">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-all">
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 className="font-black text-slate-800 text-lg">Limpeza de Logs</h3>
                                    <button onClick={handleLimparLogs} className="w-full py-3 bg-white text-red-600 border-2 border-red-200 font-black rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 transition-all"><Trash2 size={18} /> LIMPAR REGISTROS</button>
                                </div>
                                <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-center gap-6 shadow-xl col-span-1 md:col-span-1">
                                    <ShieldCheck size={48} className="text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="font-black text-sm">Proteção Ativa</h4>
                                        <p className="text-slate-400 text-[10px] font-bold leading-tight uppercase tracking-widest mt-1">SISTEMA MONITORADO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};