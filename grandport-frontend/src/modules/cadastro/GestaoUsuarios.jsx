import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, UserPlus, Edit, ShieldCheck, Ban, CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

export const GestaoUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);

    // NOVO: Estado para mensagens profissionais
    const [notificacao, setNotificacao] = useState(null);

    const [usuarioForm, setUsuarioForm] = useState({
        id: null,
        nome: '',
        email: '',
        senha: '',
        ativo: true,
        permissoes: []
    });

    const modulosPermissoes = [
        {
            grupo: 'Vendas & Frente de Loja',
            telas: [
                { acao: 'dash', nome: 'Dashboard Inicial (Gráficos)' },
                { acao: 'pdv', nome: 'Ponto de Venda Rápido (PDV)' },
                { acao: 'vendas', nome: 'Balcão de Peças / Central' },
                { acao: 'fila-caixa', nome: 'Fila do Caixa (Receber Pagamentos)' },
                { acao: 'caixa', nome: 'Controle de Caixa (Abrir/Fechar Turno)' }
            ]
        },
        {
            grupo: 'Estoque & Compras',
            telas: [
                { acao: 'estoque', nome: 'Buscar Peças / Consulta' },
                { acao: 'marcas', nome: 'Gestão de Marcas' },
                { acao: 'compras', nome: 'Importar NF-e (XML)' },
                { acao: 'previsao', nome: 'Previsão de Compras' },
                { acao: 'faltas', nome: 'Relatório de Faltas' }
            ]
        },
        {
            grupo: 'Financeiro',
            telas: [
                { acao: 'contas-receber', nome: 'Contas a Receber (Fiado)' },
                { acao: 'contas-pagar', nome: 'Contas a Pagar (Despesas)' },
                { acao: 'bancos', nome: 'Contas Bancárias / Tesouraria' },
                { acao: 'conciliacao', nome: 'Conciliação Bancária' },
                { acao: 'plano-contas', nome: 'Plano de Contas' },
                { acao: 'dre', nome: 'Resultado e Lucro (DRE)' }
            ]
        },
        {
            grupo: 'Administrativo',
            telas: [
                { acao: 'parceiros', nome: 'Cadastros (Clientes/Fornecedores)' },
                { acao: 'usuarios', nome: 'Gestão de Usuários e Permissões' },
                { acao: 'auditoria', nome: 'Auditoria de Sistema (Logs)' },
                { acao: 'calculadora', nome: 'Calculadora de Markup' },
                { acao: 'fiscal', nome: 'Fiscal / NCM' },
                { acao: 'configuracoes', nome: 'Configurações do Sistema' }
            ]
        }
    ];

    const todasAsPermissoes = modulosPermissoes.flatMap(modulo => modulo.telas.map(tela => tela.acao));

    // =================================================================================
    // SISTEMA DE NOTIFICAÇÕES PROFISSIONAIS
    // =================================================================================
    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

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

    const handleTogglePermissao = (acaoTela) => {
        setUsuarioForm(prev => {
            const jaTem = prev.permissoes.includes(acaoTela);
            if (jaTem) {
                return { ...prev, permissoes: prev.permissoes.filter(p => p !== acaoTela) };
            } else {
                return { ...prev, permissoes: [...prev.permissoes, acaoTela] };
            }
        });
    };

    const handleToggleGrupo = (telas) => {
        const acoesDoGrupo = telas.map(t => t.acao);
        const todasMarcadas = acoesDoGrupo.every(a => usuarioForm.permissoes.includes(a));

        if (todasMarcadas) {
            setUsuarioForm(prev => ({ ...prev, permissoes: prev.permissoes.filter(p => !acoesDoGrupo.includes(p)) }));
        } else {
            const novas = acoesDoGrupo.filter(a => !usuarioForm.permissoes.includes(a));
            setUsuarioForm(prev => ({ ...prev, permissoes: [...prev.permissoes, ...novas] }));
        }
    };

    const abrirModalNovo = () => {
        setUsuarioForm({ id: null, nome: '', email: '', senha: '', ativo: true, permissoes: todasAsPermissoes });
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
                showToast('sucesso', 'Acessos Atualizados', 'As permissões do usuário foram salvas com sucesso!');
            } else {
                await api.post('/api/usuarios', usuarioForm);
                showToast('sucesso', 'Usuário Cadastrado', 'Novo membro adicionado à equipe com sucesso!');
            }
            setModalAberto(false);
            carregarUsuarios();
        } catch (err) {
            const msgErro = err.response?.data?.message || "Ocorreu um problema ao salvar as informações.";
            showToast('erro', 'Erro ao Salvar', msgErro);
        }
    };

    const alternarStatus = async (id, statusAtual) => {
        if(window.confirm(`Deseja ${statusAtual ? 'BLOQUEAR' : 'DESBLOQUEAR'} o acesso deste usuário?`)) {
            try {
                await api.put(`/api/usuarios/${id}/status`, { ativo: !statusAtual });
                showToast('sucesso', 'Status Alterado', `O acesso do usuário foi ${statusAtual ? 'bloqueado' : 'liberado'} com sucesso.`);
                carregarUsuarios();
            } catch(err) {
                showToast('erro', 'Erro na Operação', 'Não foi possível alterar o status do usuário.');
            }
        }
    };

    const marcarTudoAdmin = () => setUsuarioForm(prev => ({ ...prev, permissoes: todasAsPermissoes }));
    const limparTudo = () => setUsuarioForm(prev => ({ ...prev, permissoes: [] }));

    if (loading) return <div className="p-8 text-center font-bold text-gray-500">Carregando equipe...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative">

            {/* NOTIFICAÇÃO PROFISSIONAL FLUTUANTE */}
            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in w-full max-w-lg px-4">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-l-4 ${
                        notificacao.tipo === 'sucesso' ? 'bg-green-50 border-green-500 text-green-800' :
                            notificacao.tipo === 'erro' ? 'bg-red-50 border-red-500 text-red-800' :
                                'bg-orange-50 border-orange-500 text-orange-800'
                    }`}>
                        <div className="mt-1">
                            {notificacao.tipo === 'sucesso' && <CheckCircle size={24} />}
                            {notificacao.tipo === 'erro' && <AlertTriangle size={24} />}
                            {notificacao.tipo === 'aviso' && <Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg">{notificacao.titulo}</h4>
                            <p className="text-sm font-medium mt-1 whitespace-pre-line leading-relaxed">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} />
                        EQUIPE E ACESSOS
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie os funcionários e os níveis de permissão</p>
                </div>
                <button onClick={abrirModalNovo} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                    <UserPlus size={20} /> NOVO USUÁRIO
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                    <tr>
                        <th className="p-4 pl-6">Nome do Funcionário</th>
                        <th className="p-4">Login (Usuário)</th>
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
                                {user.ativo
                                    ? <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> ATIVO</span>
                                    : <span className="text-red-500 font-bold text-xs flex items-center justify-center gap-1"><Ban size={14}/> BLOQUEADO</span>
                                }
                            </td>
                            <td className="p-4 pr-6 flex justify-center gap-3">
                                <button onClick={() => abrirModalEditar(user)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar Permissões"><Edit size={18} /></button>
                                <button onClick={() => alternarStatus(user.id, user.ativo)} className={`${user.ativo ? 'text-red-500 hover:text-red-700 bg-red-50' : 'text-green-600 hover:text-green-800 bg-green-50'} p-2 rounded-lg`} title={user.ativo ? "Bloquear Acesso" : "Liberar Acesso"}>{user.ativo ? <Ban size={18} /> : <CheckCircle size={18} />}</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2"><ShieldCheck className="text-blue-400" /> {usuarioForm.id ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}</h2>
                            <button onClick={() => setModalAberto(false)} className="hover:text-red-400 font-bold uppercase text-xs">Fechar</button>
                        </div>

                        <div className="overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                    <input type="text" value={usuarioForm.nome} onChange={e => setUsuarioForm({...usuarioForm, nome: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none font-bold text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário de Login</label>
                                    <input type="text" value={usuarioForm.email} onChange={e => setUsuarioForm({...usuarioForm, email: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 font-mono" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                                    <span>Senha de Acesso</span>
                                    {usuarioForm.id && <span className="text-orange-500 text-[10px]">Preencha apenas se for alterar</span>}
                                </label>
                                <input type="password" value={usuarioForm.senha} onChange={e => setUsuarioForm({...usuarioForm, senha: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700" placeholder="******" />
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-4 border-b pb-3">
                                    <h3 className="text-sm font-black text-slate-800 uppercase">Controle de Acesso às Telas</h3>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={limparTudo} className="text-[10px] font-black tracking-widest bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors">LIMPAR TUDO</button>
                                        <button type="button" onClick={marcarTudoAdmin} className="text-[10px] font-black tracking-widest bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">MARCAR TUDO (ADMIN)</button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {modulosPermissoes.map((modulo, index) => (
                                        <div key={index} className="bg-slate-50 border rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-bold text-blue-800">{modulo.grupo}</h4>
                                                <button type="button" onClick={() => handleToggleGrupo(modulo.telas)} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Marcar/Desmarcar Grupo</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {modulo.telas.map(tela => (
                                                    <label key={tela.acao} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleTogglePermissao(tela.acao)}>
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${usuarioForm.permissoes.includes(tela.acao) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                                            {usuarioForm.permissoes.includes(tela.acao) && <CheckCircle size={14} />}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 select-none">{tela.nome}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t flex gap-4">
                            <button onClick={() => setModalAberto(false)} className="flex-1 py-4 font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">CANCELAR</button>
                            <button onClick={salvarUsuario} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-colors">SALVAR USUÁRIO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};