import React, { useState } from 'react';
import api from '../../api/axios'; // Verifique se o caminho do seu axios está correto
import { Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { persistSession } from '../../utils/authStorage';
import { MfaQrCode } from '../../components/MfaQrCode';

export const Login = ({ onLoginSuccess, onIrParaCadastro }) => {
    const [credenciais, setCredenciais] = useState({ username: '', senha: '' });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [lembrarAcesso, setLembrarAcesso] = useState(false);
    const [mfaState, setMfaState] = useState(null);
    const [codigoMfa, setCodigoMfa] = useState('');

    // 🚀 ESTADO: Controla a visibilidade da senha
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const handleChange = (e) => {
        setCredenciais({ ...credenciais, [e.target.name]: e.target.value });
        setErro('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', credenciais);
            const data = res.data;

            if (data?.mfaRequired || data?.mfaSetupRequired) {
                setMfaState(data);
                setErro('');
                return;
            }

            finalizarLogin(data);
        } catch (err) {
            setErro(err?.response?.data?.error || 'Usuário ou senha incorretos. Acesso negado.');
        } finally {
            setLoading(false);
        }
    };

    const finalizarLogin = (data) => {
        const { token, usuario } = data;
        persistSession({ token, user: usuario, remember: lembrarAcesso });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        onLoginSuccess(usuario);
    };

    const handleVerifyMfa = async () => {
        if (!codigoMfa.trim()) {
            setErro('Informe o código do autenticador.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/mfa/verify', {
                challengeToken: mfaState.challengeToken,
                code: codigoMfa
            });
            finalizarLogin(res.data);
        } catch (err) {
            setErro(err?.response?.data?.error || 'Não foi possível validar o MFA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-blue-900/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-indigo-900/20 blur-3xl rounded-full"></div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        STM Sistemas
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Acesso Restrito ao Sistema
                    </p>
                </div>

                <form onSubmit={handleLogin} className="p-8">
                    {erro && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center mb-6 border border-red-100">
                            {erro}
                        </div>
                    )}

                    {!mfaState ? (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário de Acesso</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={credenciais.username}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 font-medium transition-colors"
                                    placeholder="Ex: joao.silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 text-slate-400" size={20} />

                                <input
                                    type={mostrarSenha ? "text" : "password"}
                                    name="senha"
                                    required
                                    value={credenciais.senha}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 font-medium transition-colors"
                                    placeholder="••••••••"
                                />

                                <button
                                    type="button"
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    className="absolute right-4 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                                    title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                            <div>
                                <div className="text-sm font-bold text-slate-700">Lembrar acesso neste dispositivo</div>
                                <div className="text-xs text-slate-500">Desmarcado: volta para o login ao fechar o navegador.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={lembrarAcesso}
                                onChange={(e) => setLembrarAcesso(e.target.checked)}
                                className="h-4 w-4 accent-blue-600"
                            />
                        </label>
                    </div>
                    ) : (
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                            <div className="text-xs font-black uppercase tracking-widest text-blue-700">
                                {mfaState.mfaSetupRequired ? 'Configuração MFA' : 'Verificação MFA'}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 font-medium">
                                {mfaState.message}
                            </p>
                            {mfaState.setupSecret && (
                                <div className="mt-4 grid gap-4 md:grid-cols-[220px,1fr] items-start">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Escaneie no autenticador</div>
                                        <MfaQrCode value={mfaState.otpauthUri} size={180} />
                                    </div>
                                    <div className="rounded-xl bg-white border border-blue-100 p-3">
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Chave manual</div>
                                        <div className="mt-1 font-mono text-sm break-all text-slate-800">{mfaState.setupSecret}</div>
                                        <div className="mt-3 text-xs text-slate-500 leading-relaxed">
                                            Se preferir, cadastre a chave manualmente no Google Authenticator, Microsoft Authenticator ou app equivalente e depois informe o código de 6 dígitos.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código do autenticador</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={codigoMfa}
                                onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 font-mono tracking-[0.35em] text-center"
                                placeholder="123456"
                            />
                        </div>
                    </div>
                    )}

                    {!mfaState ? (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-black text-lg flex justify-center items-center gap-2 hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-900/30 disabled:opacity-70"
                        >
                            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO ERP'} <ArrowRight size={20} />
                        </button>
                    ) : (
                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setMfaState(null);
                                    setCodigoMfa('');
                                    setErro('');
                                }}
                                className="py-4 rounded-xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                VOLTAR
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyMfa}
                                disabled={loading}
                                className="bg-slate-900 text-white py-4 rounded-xl font-black text-lg flex justify-center items-center gap-2 hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-900/30 disabled:opacity-70"
                            >
                                {loading ? 'VALIDANDO...' : 'VALIDAR CÓDIGO'}
                            </button>
                        </div>
                    )}

                    {/* 🚀 AQUI ENTRA A NOSSA NOVA ROTA PARA O CADASTRO SAAS */}
                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        <p className="text-xs text-slate-500 font-medium mb-2">Ainda não usa nosso ERP?</p>
                        <button
                            type="button"
                            onClick={onIrParaCadastro}
                            className="text-blue-600 font-black hover:text-blue-800 transition-colors uppercase tracking-wider text-sm flex items-center justify-center gap-1 mx-auto bg-transparent border-none cursor-pointer"
                        >
                            Crie sua conta e teste agora <ArrowRight size={16} />
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                        Esqueceu a senha? Contate o administrador.
                    </p>
                </form>
            </div>
        </div>
    );
};
