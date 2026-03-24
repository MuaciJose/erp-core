import React, { useState } from 'react';
import api from '../../api/axios'; // Verifique se o caminho do seu axios está correto
import { Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = ({ onLoginSuccess, onIrParaCadastro }) => {
    const [credenciais, setCredenciais] = useState({ username: '', senha: '' });
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

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
            // Envia as credenciais para o backend
            const res = await api.post('/auth/login', credenciais);

            const { token, usuario } = res.data;

            localStorage.setItem('grandport_token', token);
            localStorage.setItem('grandport_user', JSON.stringify(usuario));

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            onLoginSuccess(usuario);
        } catch (err) {
            setErro('Usuário ou senha incorretos. Acesso negado.');
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
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-black text-lg flex justify-center items-center gap-2 hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-900/30 disabled:opacity-70"
                    >
                        {loading ? 'AUTENTICANDO...' : 'ENTRAR NO ERP'} <ArrowRight size={20} />
                    </button>

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