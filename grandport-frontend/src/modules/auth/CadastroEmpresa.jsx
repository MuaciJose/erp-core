import React, { useState } from 'react';
import { Building2, User, Mail, Lock, Phone, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios'; // 🚀 Ajuste o caminho se a pasta for diferente

const CadastroEmpresa = ({ onVoltarLogin }) => {
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);

    const [formData, setFormData] = useState({
        razaoSocial: '',
        cnpj: '',
        telefone: '',
        nomeContato: '',
        emailContato: '',
        observacoes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro('');

        try {
            await api.post('/api/assinaturas/solicitacoes-acesso', formData);

            setSucesso(true);
            setLoading(false);

            // Redireciona para o login após 3 segundos usando a função do App.jsx
            setTimeout(() => {
                onVoltarLogin();
            }, 3000);

        } catch (error) {
            setLoading(false);
            setErro(error.response?.data?.message || 'Erro ao solicitar acesso. Verifique os dados e tente novamente.');
        }
    };

    if (sucesso) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center space-y-4 border border-slate-100">
                    <CheckCircle2 size={64} className="text-emerald-500 mx-auto animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-800">Solicitação Enviada!</h2>
                    <p className="text-slate-600">
                        Recebemos seus dados. Nossa equipe vai validar o cadastro e liberar o acesso por convite.
                    </p>
                    <p className="text-sm text-slate-400">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">

                {/* LADO ESQUERDO: Marketing */}
                <div className="w-full md:w-2/5 bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <Building2 size={48} className="text-blue-400" />
                        <h1 className="text-3xl font-bold">Solicite seu acesso.</h1>
                        <p className="text-slate-300">
                            O acesso agora é controlado por aprovação comercial. Envie seus dados e nossa equipe libera um convite seguro para sua empresa.
                        </p>
                        <div className="pt-8 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={18} className="text-emerald-400" /> Liberação controlada
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={18} className="text-emerald-400" /> Implantação orientada
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                </div>

                {/* LADO DIREITO: Formulário */}
                <div className="w-full md:w-3/5 p-10 overflow-y-auto max-h-[90vh]">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Solicitar Acesso</h2>
                        <p className="text-slate-500 text-sm">Preencha os dados abaixo para nossa equipe avaliar e liberar seu ambiente com convite.</p>
                    </div>

                    {erro && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r flex items-center gap-2">
                            <span className="font-bold">Atenção:</span> {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Dados da Empresa</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="razaoSocial" required placeholder="Razão Social ou Nome" value={formData.razaoSocial} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="cnpj" required placeholder="CNPJ (Somente Números)" value={formData.cnpj} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative md:col-span-2">
                                    <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="telefone" required placeholder="Telefone / WhatsApp" value={formData.telefone} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Contato Responsável</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="nomeContato" required placeholder="Seu Nome Completo" value={formData.nomeContato} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="email" name="emailContato" required placeholder="Seu E-mail Comercial" value={formData.emailContato} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <textarea name="observacoes" placeholder="Conte brevemente sua operação, número de usuários ou necessidade principal" value={formData.observacoes} onChange={handleChange} className="w-full pl-10 pr-4 py-2 min-h-[96px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-y" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'}`}
                        >
                            {loading ? 'ENVIANDO SOLICITAÇÃO...' : 'SOLICITAR ACESSO'} <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Já tem uma conta?{' '}
                        {/* 🚀 AQUI ELE CHAMA A FUNÇÃO PARA VOLTAR AO LOGIN SEM RECARREGAR A PÁGINA */}
                        <button onClick={onVoltarLogin} className="text-blue-600 font-bold hover:underline bg-transparent border-none cursor-pointer">
                            Faça Login aqui
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CadastroEmpresa;
