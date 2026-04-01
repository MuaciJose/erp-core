import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, UserPlus, Edit, ShieldCheck, Ban, CheckCircle, X, AlertTriangle, Info, Wrench, KeyRound, Smartphone, ShieldOff, RotateCcw } from 'lucide-react';

export const GestaoUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [eventosSeguranca, setEventosSeguranca] = useState([]);

    const [notificacao, setNotificacao] = useState(null);

    const [usuarioForm, setUsuarioForm] = useState({
        id: null,
        nome: '',
        email: '',
        senha: '',
        ativo: true,
        mfaEnabled: false,
        forcePasswordChange: true,
        tipoAcesso: 'TENANT_USER',
        isMecanico: false,
        comissaoServico: '',
        permissoes: []
    });

    const modulosPermissoes = [
        {
            grupo: 'Vendas & Frente de Loja',
            telas: [
                { acao: 'dash', nome: 'Dashboard Inicial (Gráficos)' },
                { acao: 'pdv', nome: 'Ponto de Venda Rápido (PDV)' },
                { acao: 'vendas', nome: 'Balcão de Peças / Central' },
                { acao: 'checklist', nome: 'Checklist de Entrada (Tablet)' }, // 🚀 ADICIONADO AQUI
                { acao: 'os', nome: 'Ordem de Serviço (OS)' },
                { acao: 'listagem-os', nome: 'Consulta de OS (Histórico)' },
                { acao: 'orcamentos', nome: 'Orçamentos e Pedidos' },
                { acao: 'fila-caixa', nome: 'Fila do Caixa (Receber Pagamentos)' },
                { acao: 'caixa', nome: 'Controle de Caixa (Abrir/Fechar Turno)' },
                { acao: 'relatorio-comissoes', nome: 'Relatório de Comissões' }
            ]
        },
        {
            grupo: 'CRM & Relacionamento',
            telas: [
                { acao: 'crm', nome: 'Painel de CRM / Pós-Venda' },
                { acao: 'revisoes', nome: 'Gestão de Revisões (Agendamentos)' },
                { acao: 'agenda', nome: 'Agenda Corporativa Inteligente' },
                { acao: 'whatsapp', nome: 'Integração WhatsApp' }
            ]
        },
        {
            grupo: 'Estoque & Compras',
            telas: [
                { acao: 'estoque', nome: 'Buscar Peças / Consulta' },
                { acao: 'categorias', nome: 'Gestão de Categorias' },
                { acao: 'marcas', nome: 'Gestão de Marcas' },
                { acao: 'etiquetas', nome: 'Gerador de Etiquetas' },
                { acao: 'ajuste_estoque', nome: 'Ajuste de Estoque / Inventário' },
                { acao: 'compras', nome: 'Importar NF-e (XML)' },
                { acao: 'previsao', nome: 'Previsão de Compras' },
                { acao: 'faltas', nome: 'Relatório de Faltas' },
                { acao: 'curva-abc', nome: 'Curva ABC' }
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
                { acao: 'dre', nome: 'Resultado e Lucro (DRE)' },
                { acao: 'recibo-avulso', nome: 'Gerador de Recibo Avulso' },
                { acao: 'historico-recibos', nome: 'Histórico de Recibos' }
            ]
        },
        {
            grupo: 'Fiscal & Notas NF-e',
            telas: [
                { acao: 'gerenciador-nfe', nome: 'Gerenciador de NF-e' },
                { acao: 'emitir-nfe-avulsa', nome: 'Emitir NF-e Avulsa' },
                { acao: 'fiscal', nome: 'Painel Fiscal Geral / Carga NCM' },
                { acao: 'regras-fiscais', nome: 'Regras Fiscais de Tributação' }
            ]
        },
        {
            grupo: 'Administrativo & Sistema',
            telas: [
                { acao: 'parceiros', nome: 'Cadastros (Clientes/Fornecedores)' },
                { acao: 'servicos', nome: 'Tabela de Serviços (Mão de Obra)' },
                { acao: 'usuarios', nome: 'Gestão de Usuários e Permissões' },
                { acao: 'auditoria', nome: 'Auditoria de Sistema (Logs)' },
                { acao: 'configuracoes', nome: 'Configurações do Sistema' },
                { acao: 'manual', nome: 'Manual do Sistema' }
            ]
        }
    ];

    const todasAsPermissoes = modulosPermissoes.flatMap(modulo => modulo.telas.map(tela => tela.acao));

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

    const carregarEventosSeguranca = async () => {
        try {
            const res = await api.get('/api/security-events', { params: { limit: 8 } });
            setEventosSeguranca(res.data || []);
        } catch (error) {
            console.error("Erro ao carregar eventos de segurança", error);
        }
    };

    useEffect(() => {
        carregarUsuarios();
        carregarEventosSeguranca();
    }, []);

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
        setUsuarioForm({
            id: null, nome: '', email: '', senha: '', ativo: true, mfaEnabled: false, forcePasswordChange: true, tipoAcesso: 'TENANT_USER',
            isMecanico: false, comissaoServico: '', permissoes: todasAsPermissoes
        });
        setModalAberto(true);
    };

    const abrirModalEditar = (user) => {
        setUsuarioForm({
            ...user,
            senha: '',
            isMecanico: user.isMecanico || false,
            comissaoServico: user.comissaoServico || ''
        });
        setModalAberto(true);
    };

    const salvarUsuario = async (e) => {
        e.preventDefault();

        const payload = {
            ...usuarioForm,
            comissaoServico: usuarioForm.isMecanico && usuarioForm.comissaoServico ? parseFloat(usuarioForm.comissaoServico) : 0
        };

        try {
            if (usuarioForm.id) {
                await api.put(`/api/usuarios/${usuarioForm.id}`, payload);
                showToast('sucesso', 'Acessos Atualizados', 'As permissões do usuário foram salvas com sucesso!');
            } else {
                await api.post('/api/usuarios', payload);
                showToast('sucesso', 'Usuário Cadastrado', 'Novo membro adicionado à equipe com sucesso!');
            }
            setModalAberto(false);
            carregarUsuarios();
            carregarEventosSeguranca();
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
                carregarEventosSeguranca();
            } catch(err) {
                showToast('erro', 'Erro na Operação', 'Não foi possível alterar o status do usuário.');
            }
        }
    };

    const revogarMfa = async (user) => {
        if (!window.confirm(`Deseja revogar o MFA de ${user.nome}?`)) return;
        try {
            await api.post(`/api/usuarios/${user.id}/revogar-mfa`);
            showToast('sucesso', 'MFA Revogado', `O MFA de ${user.nome} foi revogado.`);
            carregarUsuarios();
            carregarEventosSeguranca();
        } catch (err) {
            showToast('erro', 'Erro na Operação', 'Não foi possível revogar o MFA deste usuário.');
        }
    };

    const forcarResetSenha = async (user) => {
        if (!window.confirm(`Deseja forçar troca de senha para ${user.nome} no próximo login?`)) return;
        try {
            await api.post(`/api/usuarios/${user.id}/forcar-reset-senha`);
            showToast('sucesso', 'Reset de Senha Marcado', `${user.nome} terá que definir nova senha no próximo login.`);
            carregarUsuarios();
            carregarEventosSeguranca();
        } catch (err) {
            showToast('erro', 'Erro na Operação', 'Não foi possível marcar o reset de senha.');
        }
    };

    const marcarTudoAdmin = () => setUsuarioForm(prev => ({ ...prev, permissoes: todasAsPermissoes }));
    const limparTudo = () => setUsuarioForm(prev => ({ ...prev, permissoes: [] }));

    if (loading) return <div className="p-8 text-center font-bold text-gray-500 animate-pulse">Carregando equipe...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative">

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
                    <p className="text-slate-500 mt-1">Gerencie os funcionários, mecânicos e níveis de permissão</p>
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
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black shrink-0">
                                    {user.nome?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {user.nome}
                                        {user.isMecanico && (
                                            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-black uppercase border border-orange-200 flex items-center gap-1">
                                                <Wrench size={10}/> Mecânico
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-500 font-mono">{user.email}</td>
                            <td className="p-4 text-center">
                                {user.ativo
                                    ? <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/> ATIVO</span>
                                    : <span className="text-red-500 font-bold text-xs flex items-center justify-center gap-1"><Ban size={14}/> BLOQUEADO</span>
                                }
                                <div className="mt-2 flex justify-center gap-1 flex-wrap">
                                    {user.mfaEnabled && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">MFA</span>}
                                    {user.forcePasswordChange && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">TROCA SENHA</span>}
                                    {user.tipoAcesso && <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black">{user.tipoAcesso}</span>}
                                </div>
                            </td>
                            <td className="p-4 pr-6 flex justify-center gap-3">
                                <button onClick={() => abrirModalEditar(user)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar dados e permissões de acesso"><Edit size={18} /></button>
                                <button onClick={() => revogarMfa(user)} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-2 rounded-lg" title="Revogar MFA deste usuário"><ShieldOff size={18} /></button>
                                <button onClick={() => forcarResetSenha(user)} className="text-amber-600 hover:text-amber-800 bg-amber-50 p-2 rounded-lg" title="Forçar nova senha no próximo login"><RotateCcw size={18} /></button>
                                <button onClick={() => alternarStatus(user.id, user.ativo)} className={`${user.ativo ? 'text-red-500 hover:text-red-700 bg-red-50' : 'text-green-600 hover:text-green-800 bg-green-50'} p-2 rounded-lg`} title={user.ativo ? "Bloquear acesso deste usuário ao sistema" : "Liberar acesso deste usuário ao sistema"}>{user.ativo ? <Ban size={18} /> : <CheckCircle size={18} />}</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Eventos Recentes de Segurança</h2>
                        <p className="text-sm text-slate-500">Login, MFA, bloqueios e ações administrativas recentes.</p>
                    </div>
                    <button onClick={carregarEventosSeguranca} className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800">Atualizar</button>
                </div>
                <div className="divide-y divide-slate-100">
                    {eventosSeguranca.length === 0 ? (
                        <div className="px-6 py-8 text-sm text-slate-500">Nenhum evento recente.</div>
                    ) : eventosSeguranca.map(evento => (
                        <div key={evento.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${
                                        evento.severidade === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                        evento.severidade === 'WARN' ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {evento.severidade}
                                    </span>
                                    <span className="text-xs font-black text-slate-700">{evento.tipo}</span>
                                    {evento.username && <span className="text-xs text-slate-500 font-mono">{evento.username}</span>}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">{evento.detalhes}</div>
                            </div>
                            <div className="text-xs text-slate-400 whitespace-nowrap">
                                {new Date(evento.dataHora).toLocaleString('pt-BR')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {modalAberto && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2"><ShieldCheck className="text-blue-400" /> {usuarioForm.id ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}</h2>
                            <button onClick={() => setModalAberto(false)} className="hover:text-red-400 font-bold uppercase text-xs">Fechar</button>
                        </div>

                        <div className="overflow-y-auto p-8 space-y-4 custom-scrollbar">

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
                                <p className="mt-1 text-[11px] text-slate-500">Mínimo 10 caracteres com maiúscula, minúscula, número e símbolo.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Acesso</span>
                                    <select
                                        value={usuarioForm.tipoAcesso || 'TENANT_USER'}
                                        onChange={(e) => setUsuarioForm({ ...usuarioForm, tipoAcesso: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none font-bold text-slate-700"
                                    >
                                        <option value="TENANT_USER">Funcionário da empresa</option>
                                        <option value="TENANT_ADMIN">Admin da empresa</option>
                                    </select>
                                </label>

                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 cursor-pointer">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${usuarioForm.mfaEnabled ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                                        {usuarioForm.mfaEnabled && <CheckCircle size={16} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={usuarioForm.mfaEnabled} onChange={(e) => setUsuarioForm({ ...usuarioForm, mfaEnabled: e.target.checked })} />
                                    <div>
                                        <div className="font-black text-slate-800 flex items-center gap-2"><Smartphone size={16} /> MFA</div>
                                        <div className="text-[11px] text-slate-500">Exige código do autenticador no login.</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 cursor-pointer">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${usuarioForm.forcePasswordChange ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-300'}`}>
                                        {usuarioForm.forcePasswordChange && <CheckCircle size={16} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={usuarioForm.forcePasswordChange} onChange={(e) => setUsuarioForm({ ...usuarioForm, forcePasswordChange: e.target.checked })} />
                                    <div>
                                        <div className="font-black text-slate-800 flex items-center gap-2"><KeyRound size={16} /> Troca obrigatória</div>
                                        <div className="text-[11px] text-slate-500">Força nova senha no próximo login.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-inner">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${usuarioForm.isMecanico ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-orange-300'}`}>
                                        {usuarioForm.isMecanico && <CheckCircle size={16} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={usuarioForm.isMecanico}
                                        onChange={(e) => setUsuarioForm({...usuarioForm, isMecanico: e.target.checked})}
                                    />
                                    <div>
                                        <span className="font-black text-orange-900 block group-hover:text-orange-700">Este usuário é um Mecânico?</span>
                                        <span className="text-[10px] text-orange-600 uppercase font-bold tracking-widest block">Aparecerá na lista da Ordem de Serviço</span>
                                    </div>
                                </label>

                                {usuarioForm.isMecanico && (
                                    <div className="w-full sm:w-auto sm:min-w-[180px] animate-fade-in">
                                        <label className="block text-[10px] font-black text-orange-600 uppercase mb-1">Comissão de Mão de Obra (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={usuarioForm.comissaoServico}
                                                onChange={(e) => setUsuarioForm({...usuarioForm, comissaoServico: e.target.value})}
                                                className="w-full p-2.5 bg-white border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none font-black text-orange-800 text-right pr-8"
                                                placeholder="Ex: 40.0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-orange-400">%</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
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
                                            <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                                                <h4 className="font-bold text-blue-800">{modulo.grupo}</h4>
                                                <button type="button" onClick={() => handleToggleGrupo(modulo.telas)} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Marcar/Desmarcar Grupo</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {modulo.telas.map(tela => (
                                                    <label key={tela.acao} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleTogglePermissao(tela.acao)}>
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${usuarioForm.permissoes.includes(tela.acao) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                                            {usuarioForm.permissoes.includes(tela.acao) && <CheckCircle size={14} />}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 select-none group-hover:text-blue-800">{tela.nome}</span>
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
