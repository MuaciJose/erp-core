import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Settings, Building2, Printer, Sliders, Save, CheckCircle,
    AlertTriangle, Info, X, Store, FileText, Percent, ShieldAlert, Search, Loader2, Camera, Plus
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
        logoBase64: '', // NOVO CAMPO ADICIONADO
        tamanhoImpressora: '80mm',
        mensagemRodape: '',
        exibirVendedorCupom: true,
        descontoMaximoPermitido: 10.00,
        permitirEstoqueNegativoGlobal: false,
        diasValidadeOrcamento: 5
    });

    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

    const carregarConfiguracoes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/configuracoes');
            setConfig(res.data);
        } catch (error) {
            console.error("Erro ao carregar configurações", error);
            showToast('erro', 'Falha de Comunicação', 'Não foi possível carregar as configurações do servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarConfiguracoes();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // =======================================================================
    // LÓGICA DE UPLOAD DE LOGO (CONVERSÃO PARA BASE64)
    // =======================================================================
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // Limite de 500KB
                showToast('aviso', 'Arquivo muito grande', 'Escolha uma logo de até 500KB para não pesar o sistema.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, logoBase64: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const buscarCNPJ = async () => {
        const cnpjLimpo = config.cnpj.replace(/\D/g, '');

        if (cnpjLimpo.length !== 14) {
            return showToast('aviso', 'CNPJ Inválido', 'Digite os 14 números do CNPJ para realizar a busca.');
        }

        setBuscandoCnpj(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }

            const data = await response.json();

            const enderecoFormatado = `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}
Bairro: ${data.bairro}
Cidade: ${data.municipio} - ${data.uf}
CEP: ${data.cep}`;

            setConfig(prev => ({
                ...prev,
                razaoSocial: data.razao_social || prev.razaoSocial,
                nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
                telefone: data.ddd_telefone_1 || prev.telefone,
                email: data.email || prev.email,
                endereco: enderecoFormatado
            }));

            showToast('sucesso', 'Dados Encontrados', 'As informações da empresa foram preenchidas automaticamente!');

        } catch (error) {
            console.error("Erro ao buscar CNPJ:", error);
            showToast('erro', 'Falha na Busca', 'Não foi possível encontrar os dados para este CNPJ. Verifique o número e tente novamente.');
        } finally {
            setBuscandoCnpj(false);
        }
    };

    const salvarConfiguracoes = async () => {
        setSalvando(true);
        try {
            const res = await api.put('/api/configuracoes', config);
            setConfig(res.data);
            showToast('sucesso', 'Configurações Salvas', 'As novas configurações do sistema foram aplicadas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar", error);
            showToast('erro', 'Erro ao Salvar', 'Ocorreu um problema ao tentar salvar as configurações.');
        } finally {
            setSalvando(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400">Carregando configurações do sistema...</div>;

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
                    <button onClick={() => setAbaAtiva('IMPRESSAO')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'IMPRESSAO' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Printer size={20} /> Impressão & Cupons
                    </button>
                    <button onClick={() => setAbaAtiva('REGRAS')} className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all text-left ${abaAtiva === 'REGRAS' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        <Sliders size={20} /> Regras de Negócio
                    </button>
                </div>

                <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">

                    {abaAtiva === 'EMPRESA' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><Store className="text-blue-500" /> Identidade e Contato</h2>

                            {/* NOVO: SEÇÃO DE UPLOAD DA LOGO */}
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
                                        <button
                                            onClick={() => setConfig(prev => ({...prev, logoBase64: ''}))}
                                            className="text-red-500 text-xs font-black mt-2 hover:underline flex items-center gap-1 mx-auto md:mx-0"
                                        >
                                            <X size={14}/> REMOVER IMAGEM
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-blue-600 uppercase flex justify-between">
                                        <span>CNPJ (Busca Automática)</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type="text"
                                            name="cnpj"
                                            value={config.cnpj}
                                            onChange={handleChange}
                                            placeholder="Digite apenas números..."
                                            className="w-full p-3 pr-12 bg-blue-50 border-2 border-blue-200 rounded-xl font-black text-slate-800 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            onClick={buscarCNPJ}
                                            disabled={buscandoCnpj}
                                            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {buscandoCnpj ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Fantasia (Aparece no Cupom)</label>
                                    <input type="text" name="nomeFantasia" value={config.nomeFantasia} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Razão Social</label>
                                    <input type="text" name="razaoSocial" value={config.razaoSocial} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Inscrição Estadual (IE)</label>
                                    <input type="text" name="inscricaoEstadual" value={config.inscricaoEstadual} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                                    <input type="text" name="telefone" value={config.telefone} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail de Contato</label>
                                    <input type="email" name="email" value={config.email} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo (Aparece no Cupom)</label>
                                <textarea name="endereco" value={config.endereco} onChange={handleChange} rows="4" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none resize-none" placeholder="Rua, Número, Bairro, Cidade - Estado"></textarea>
                            </div>
                        </div>
                    )}

                    {/* ABA: IMPRESSÃO E CUPONS */}
                    {abaAtiva === 'IMPRESSAO' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><FileText className="text-blue-500" /> Parametrização de Recibos</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tamanho da Impressora / Bobina</label>
                                    <select name="tamanhoImpressora" value={config.tamanhoImpressora} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none">
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
                                <textarea name="mensagemRodape" value={config.mensagemRodape} onChange={handleChange} rows="3" className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none resize-none" placeholder="Ex: Trocas somente com etiqueta em até 7 dias. Obrigado pela preferência!"></textarea>
                            </div>
                        </div>
                    )}

                    {/* ABA: REGRAS DE NEGÓCIO */}
                    {abaAtiva === 'REGRAS' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b pb-4"><ShieldAlert className="text-blue-500" /> Travas e Permissões Globais</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Percent size={14}/> Desconto Máximo Permitido (%)</label>
                                    <p className="text-[10px] text-slate-400 mb-2">Trava o limite de desconto que vendedores podem dar.</p>
                                    <input type="number" step="0.01" name="descontoMaximoPermitido" value={config.descontoMaximoPermitido} onChange={handleChange} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none text-2xl" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Validade de Orçamentos (Dias)</label>
                                    <p className="text-[10px] text-slate-400 mb-2">Dias até um orçamento salvo expirar no sistema.</p>
                                    <input type="number" name="diasValidadeOrcamento" value={config.diasValidadeOrcamento} onChange={handleChange} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none text-2xl" />
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                                <div className="mt-1"><AlertTriangle className="text-red-500" size={24} /></div>
                                <div>
                                    <h3 className="font-black text-red-800 text-lg">Permitir Venda com Estoque Negativo</h3>
                                    <p className="text-sm text-red-600 mt-1 mb-3 font-medium">Se ativado, o sistema deixará vender peças mesmo se o saldo no sistema for zero.</p>
                                    <label className="flex items-center gap-2 cursor-pointer w-max bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm">
                                        <input type="checkbox" name="permitirEstoqueNegativoGlobal" checked={config.permitirEstoqueNegativoGlobal} onChange={handleChange} className="w-5 h-5 accent-red-600 cursor-pointer" />
                                        <span className="font-bold text-red-700">Liberar Estoque Negativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};