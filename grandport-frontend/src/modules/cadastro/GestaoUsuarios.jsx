import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, UserPlus, Shield, Edit, ShieldCheck, Ban, CheckCircle, User } from 'lucide-react';

export const GestaoUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    
    const [usuarioForm, setUsuarioForm] = useState({
        id: null,
        nome: '',
        email: '', // Mantemos o nome da chave como 'email' no estado para não quebrar o DTO do backend por enquanto
        senha: '',
        perfil: 'VENDEDOR',
        ativo: true
    });

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/usuarios');
            setUsuarios(res.data);
        } catch (error) {
            console.error("Erro ao carregar usuários", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarUsuarios(); }, []);

    const abrirModalNovo = () => {
        setUsuarioForm({ id: null, nome: '', email: '', senha: '', perfil: 'VENDEDOR', ativo: true });
        setModalAberto(true);
    };

    const abrirModalEditar = (user) => {
        setUsuarioForm({ ...user, senha: '' });
        setModalAberto(true);
    };

    const salvarUsuario = async (e) => {
        e.preventDefault();
        try {
            if (usuarioForm.id) {
                await api.put(`/api/usuarios/${usuarioForm.id}`, usuarioForm);
                alert("Usuário atualizado com sucesso!");
            } else {
                await api.post('/api/usuarios', usuarioForm);
                alert("Usuário cadastrado com sucesso!");
            }
            setModalAberto(false);
            carregarUsuarios();
        } catch (err) {
            alert("Erro ao salvar usuário. Verifique os dados.");
        }
    };

    const alternarStatus = async (id, statusAtual) => {
        if(window.confirm(`Deseja ${statusAtual ? 'BLOQUEAR' : 'DESBLOQUEAR'} o acesso deste usuário?`)) {
            try {
                await api.put(`/api/usuarios/${id}/status`, { ativo: !statusAtual });
                carregarUsuarios();
            } catch(err) {
                alert("Erro ao alterar status.");
            }
        }
    };

    const corPerfil = (perfil) => {
        switch(perfil) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'CAIXA': return 'bg-green-100 text-green-700 border-green-200';
            case 'ESTOQUISTA': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-gray-500">Carregando equipe...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} /> 
                        EQUIPE E ACESSOS
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie os funcionários e os níveis de permissão</p>
                </div>
                <button 
                    onClick={abrirModalNovo}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                >
                    <UserPlus size={20} /> NOVO USUÁRIO
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                        <tr>
                            <th className="p-4 pl-6">Nome do Funcionário</th>
                            <th className="p-4">Login (Usuário)</th>
                            <th className="p-4 text-center">Nível de Acesso</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center pr-6">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(user => (
                            <tr key={user.id} className={`border-b transition-colors ${!user.ativo ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                                <td className="p-4 pl-6 font-bold text-slate-800 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black">
                                        {user.nome?.substring(0, 2).toUpperCase()}
                                    </div>
                                    {user.nome}
                                </td>
                                <td className="p-4 text-sm text-slate-500 font-mono">{user.email}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border ${corPerfil(user.perfil)}`}>
                                        {user.perfil}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {user.ativo 
                                        ? <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> ATIVO</span>
                                        : <span className="text-red-500 font-bold text-xs flex items-center justify-center gap-1"><Ban size={14}/> BLOQUEADO</span>
                                    }
                                </td>
                                <td className="p-4 pr-6 flex justify-center gap-3">
                                    <button onClick={() => abrirModalEditar(user)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => alternarStatus(user.id, user.ativo)} className={`${user.ativo ? 'text-red-500 hover:text-red-700 bg-red-50' : 'text-green-600 hover:text-green-800 bg-green-50'} p-2 rounded-lg`}>
                                        {user.ativo ? <Ban size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2">
                                <ShieldCheck className="text-blue-400" /> 
                                {usuarioForm.id ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}
                            </h2>
                            <button onClick={() => setModalAberto(false)} className="hover:text-red-400 font-bold uppercase text-xs">Fechar</button>
                        </div>

                        <form onSubmit={salvarUsuario} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                <input type="text" required value={usuarioForm.nome} onChange={e => setUsuarioForm({...usuarioForm, nome: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-600 outline-none font-bold text-slate-700" placeholder="Ex: João da Silva" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário de Login</label>
                                <input type="text" required value={usuarioForm.email} onChange={e => setUsuarioForm({...usuarioForm, email: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-600 outline-none text-slate-700 font-mono" placeholder="Ex: joao.silva" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                                    <span>Senha de Acesso</span>
                                    {usuarioForm.id && <span className="text-orange-500 text-[10px]">Preencha apenas se for alterar</span>}
                                </label>
                                <input type="password" required={!usuarioForm.id} value={usuarioForm.senha} onChange={e => setUsuarioForm({...usuarioForm, senha: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-600 outline-none text-slate-700" placeholder="******" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Shield size={14}/> Perfil de Permissão</label>
                                <select value={usuarioForm.perfil} onChange={e => setUsuarioForm({...usuarioForm, perfil: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-600 outline-none font-black text-slate-700">
                                    <option value="VENDEDOR">VENDEDOR (Balcão e PDV)</option>
                                    <option value="CAIXA">CAIXA (Recebimentos e Fechamento)</option>
                                    <option value="ESTOQUISTA">ESTOQUISTA (App Mobile e XML)</option>
                                    <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 shadow-lg transition-all">
                                {usuarioForm.id ? 'SALVAR ALTERAÇÕES' : 'CRIAR ACESSO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
