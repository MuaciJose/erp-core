import React, { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, FileText, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import api from '../../api/axios';

const FinalizarCadastroEmpresa = ({ inviteToken, onVoltarLogin }) => {
    const [loadingConvite, setLoadingConvite] = useState(true);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
    const [convite, setConvite] = useState(null);
    const [formData, setFormData] = useState({
        razaoSocial: '',
        cnpj: '',
        telefone: '',
        nomeAdmin: '',
        emailAdmin: '',
        senhaAdmin: '',
        confirmarSenha: ''
    });
    const conviteAtivo = convite?.status === 'ATIVO';

    const aplicarMascaraCnpj = (valor) => {
        const digitos = valor.replace(/\D/g, '').slice(0, 14);
        return digitos
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    const aplicarMascaraTelefone = (valor) => {
        const digitos = valor.replace(/\D/g, '').slice(0, 11);
        if (digitos.length <= 10) {
            return digitos
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return digitos
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    useEffect(() => {
        const carregarConvite = async () => {
            if (!inviteToken) {
                setErro('Convite não informado.');
                setLoadingConvite(false);
                return;
            }

            try {
                const res = await api.get(`/api/assinaturas/convites/publico/${inviteToken}`);
                setConvite(res.data);
                setFormData(prev => ({ ...prev, emailAdmin: res.data.emailDestino || '' }));
            } catch (error) {
                setErro(error?.response?.data?.message || 'Convite inválido.');
            } finally {
                setLoadingConvite(false);
            }
        };

        carregarConvite();
    }, [inviteToken]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let valorTratado = value;

        if (name === 'cnpj') valorTratado = aplicarMascaraCnpj(value);
        if (name === 'telefone') valorTratado = aplicarMascaraTelefone(value);

        setFormData({ ...formData, [name]: valorTratado });
        setErro('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        if (convite?.status !== 'ATIVO') {
            setErro('Este convite não está mais disponível para uso.');
            return;
        }

        if (formData.senhaAdmin !== formData.confirmarSenha) {
            setErro('A confirmação da senha não confere.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/assinaturas/nova-empresa', {
                razaoSocial: formData.razaoSocial,
                cnpj: formData.cnpj.replace(/\D/g, ''),
                telefone: formData.telefone.replace(/\D/g, ''),
                nomeAdmin: formData.nomeAdmin,
                emailAdmin: formData.emailAdmin,
                senhaAdmin: formData.senhaAdmin,
                inviteToken
            });

            setSucesso(true);
            setTimeout(() => {
                onVoltarLogin();
            }, 3000);
        } catch (error) {
            setErro(error?.response?.data?.message || 'Não foi possível concluir o cadastro da empresa.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingConvite) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black tracking-widest">VALIDANDO CONVITE...</div>;
    }

    if (sucesso) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center space-y-4 border border-slate-100">
                    <CheckCircle2 size={64} className="text-emerald-500 mx-auto animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-800">Empresa criada com sucesso</h2>
                    <p className="text-slate-600">
                        O ambiente foi provisionado e o admin da empresa já pode acessar com o e-mail e a senha definidos agora.
                    </p>
                    <p className="text-sm text-slate-400">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
                <div className="w-full md:w-2/5 bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <ShieldCheck size={48} className="text-blue-400" />
                        <h1 className="text-3xl font-bold">Finalize seu ambiente.</h1>
                        <p className="text-slate-300">
                            Este convite permite criar a empresa e definir a senha do administrador principal do ERP.
                        </p>
                        {convite && (
                            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 space-y-2 text-sm">
                                <div><span className="font-black text-slate-100">E-mail autorizado:</span> {convite.emailDestino}</div>
                                <div>
                                    <span className="font-black text-slate-100">Status:</span>{' '}
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${
                                        convite.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' :
                                        convite.status === 'USADO' ? 'bg-amber-100 text-amber-700' :
                                        'bg-rose-100 text-rose-700'
                                    }`}>
                                        {convite.status}
                                    </span>
                                </div>
                                <div><span className="font-black text-slate-100">Expira em:</span> {new Date(convite.expiresAt).toLocaleString('pt-BR')}</div>
                                {convite.usedAt && (
                                    <div><span className="font-black text-slate-100">Usado em:</span> {new Date(convite.usedAt).toLocaleString('pt-BR')}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-3/5 p-10 overflow-y-auto max-h-[90vh]">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Finalizar cadastro por convite</h2>
                        <p className="text-slate-500 text-sm">Preencha os dados finais da empresa e defina a senha do administrador.</p>
                    </div>

                    {erro && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r flex items-center gap-2">
                            <span className="font-bold">Atenção:</span> {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {convite && !conviteAtivo && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {convite.statusMessage || 'Este convite não está disponível para uso. Solicite um novo link ao administrador da plataforma.'}
                            </div>
                        )}
                        {convite && conviteAtivo && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {convite.statusMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Dados da Empresa</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="razaoSocial" required placeholder="Razão Social" value={formData.razaoSocial} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="cnpj" required placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative md:col-span-2">
                                    <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="telefone" required placeholder="Telefone / WhatsApp" value={formData.telefone} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Administrador da Empresa</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" name="nomeAdmin" required placeholder="Nome do administrador" value={formData.nomeAdmin} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="email" name="emailAdmin" required placeholder="E-mail do admin" value={formData.emailAdmin} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="relative flex items-center">
                                    <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type={mostrarSenha ? 'text' : 'password'} name="senhaAdmin" required placeholder="Senha do administrador" value={formData.senhaAdmin} onChange={handleChange} className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 text-slate-400 hover:text-blue-600">
                                        {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="relative flex items-center">
                                    <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input type={mostrarConfirmacao ? 'text' : 'password'} name="confirmarSenha" required placeholder="Confirmar senha" value={formData.confirmarSenha} onChange={handleChange} className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                                    <button type="button" onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)} className="absolute right-3 text-slate-400 hover:text-blue-600">
                                        {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500">A senha precisa seguir a política atual do sistema: mínimo 10 caracteres com maiúscula, minúscula, número e símbolo.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !conviteAtivo}
                            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${loading || !conviteAtivo ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'}`}
                        >
                            {loading ? 'CRIANDO EMPRESA...' : !conviteAtivo ? 'CONVITE INDISPONÍVEL' : 'FINALIZAR CADASTRO'} <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        <button onClick={onVoltarLogin} className="text-blue-600 font-bold hover:underline bg-transparent border-none cursor-pointer">
                            Voltar para o login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalizarCadastroEmpresa;
