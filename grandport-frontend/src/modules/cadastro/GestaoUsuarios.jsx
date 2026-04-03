import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, UserPlus, Edit, ShieldCheck, Ban, CheckCircle, X, AlertTriangle, Info, Wrench, KeyRound, Smartphone, ShieldOff, RotateCcw } from 'lucide-react';
import { MODULE_GROUPS_FOR_USER_MANAGEMENT } from '../../utils/moduleCatalog';

export const GestaoUsuarios = () => {
    const acoesBloqueadasPorOnboarding = new Set([
        'configuracoes',
        'fiscal',
        'regras-fiscais',
        'gerenciador-nfe',
        'emitir-nfe-avulsa',
        'ncm'
    ]);

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [eventosSeguranca, setEventosSeguranca] = useState([]);
    const [planoEmpresa, setPlanoEmpresa] = useState('ESSENCIAL');
    const [statusOnboardingEmpresa, setStatusOnboardingEmpresa] = useState(null);
    const [modulosEmpresa, setModulosEmpresa] = useState([]);

    const [notificacao, setNotificacao] = useState(null);

    const [usuarioForm, setUsuarioForm] = useState({
        id: null,
        nome: '',
        email: '',
        senha: '',
        ativo: true,
        mfaEnabled: true,
        forcePasswordChange: true,
        tipoAcesso: 'TENANT_USER',
        isMecanico: false,
        comissaoServico: '',
        permissoes: []
    });

    const modulosPermissoes = MODULE_GROUPS_FOR_USER_MANAGEMENT;

    const todasAsPermissoes = modulosPermissoes.flatMap(modulo => modulo.telas.map(tela => tela.acao));
    const nomesPermissao = Object.fromEntries(
        modulosPermissoes.flatMap(modulo => modulo.telas.map(tela => [tela.acao, tela.nome]))
    );
    const permissoesPorPlano = {
        ESSENCIAL: new Set([
            'dash', 'pdv', 'vendas', 'checklist', 'os', 'listagem-os',
            'fila-caixa', 'caixa', 'estoque', 'marcas', 'categorias', 'ajuste_estoque',
            'parceiros', 'servicos', 'agenda', 'atendimento', 'ficha-cadastral', 'manual', 'usuarios', 'configuracoes'
        ]),
        PROFISSIONAL: new Set([
            'dash', 'pdv', 'vendas', 'checklist', 'os', 'listagem-os',
            'fila-caixa', 'caixa', 'estoque', 'marcas', 'categorias', 'ajuste_estoque',
            'parceiros', 'servicos', 'agenda', 'atendimento', 'ficha-cadastral', 'manual', 'usuarios', 'configuracoes',
            'orcamentos', 'relatorio-comissoes', 'crm', 'revisoes', 'whatsapp',
            'compras', 'previsao', 'faltas', 'inventario', 'curva-abc', 'etiquetas',
            'contas-pagar', 'contas-receber', 'bancos', 'conciliacao',
            'recibo-avulso', 'historico-recibos'
        ]),
        PREMIUM: new Set(todasAsPermissoes),
        INTERNO: new Set(todasAsPermissoes)
    };

    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            const [resUsuarios, resOnboarding, resModulos] = await Promise.all([
                api.get('/api/usuarios'),
                api.get('/api/assinaturas/minha-empresa/cadastro-complementar'),
                api.get('/api/assinaturas/minha-empresa/modulos')
            ]);
            setUsuarios(resUsuarios.data);
            if (Array.isArray(resUsuarios.data) && resUsuarios.data.length > 0 && resUsuarios.data[0]?.planoEmpresa) {
                setPlanoEmpresa(resUsuarios.data[0].planoEmpresa);
            }
            setStatusOnboardingEmpresa(resOnboarding?.data?.statusOnboarding || null);
            setModulosEmpresa(Array.isArray(resModulos?.data) ? resModulos.data : []);
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

    const descreverMotivosBloqueio = (acaoTela) => {
        const permitidasNoPlano = permissoesPorPlano[planoEmpresa] || permissoesPorPlano.ESSENCIAL;
        const motivos = [];

        if (!permitidasNoPlano.has(acaoTela)) {
            motivos.push('Bloqueado pelo plano');
        }

        const modulo = mapaModulosEmpresa[acaoTela];
        if (modulo?.bloqueadoComercial) {
            motivos.push('Bloqueado comercialmente');
        }

        if (modulo && !modulo.ativo && modulo.origem === 'BLOQUEIO_MANUAL') {
            motivos.push('Bloqueado manualmente');
        }

        if (modulo && !modulo.ativo && !modulo.disponivelNoPlano && permitidasNoPlano.has(acaoTela)) {
            motivos.push('Bloqueado no licenciamento');
        }

        if (onboardingVencido && acoesBloqueadasPorOnboarding.has(acaoTela)) {
            motivos.push('Bloqueado por onboarding');
        }

        return [...new Set(motivos)];
    };

    const handleTogglePermissao = (acaoTela) => {
        const motivosBloqueio = descreverMotivosBloqueio(acaoTela);
        if (motivosBloqueio.length > 0) {
            showToast(
                'aviso',
                'Permissão indisponível',
                `${nomesPermissao[acaoTela] || acaoTela}: ${motivosBloqueio.join(', ')}.`
            );
            return;
        }
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
        const acoesDoGrupo = telas
            .map(t => t.acao)
            .filter((acao) => descreverMotivosBloqueio(acao).length === 0);
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
            id: null, nome: '', email: '', senha: '', ativo: true, mfaEnabled: true, forcePasswordChange: true, tipoAcesso: 'TENANT_USER',
            isMecanico: false, comissaoServico: '', permissoes: Array.from(permissoesPorPlano[planoEmpresa] || permissoesPorPlano.ESSENCIAL)
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

        const senhaNormalizada = typeof usuarioForm.senha === 'string' ? usuarioForm.senha.trim() : '';
        const permissoesSolicitadas = [...new Set(usuarioForm.permissoes || [])];
        const payload = {
            ...usuarioForm,
            senha: senhaNormalizada || undefined,
            comissaoServico: usuarioForm.isMecanico && usuarioForm.comissaoServico ? parseFloat(usuarioForm.comissaoServico) : 0
        };

        try {
            let resposta;
            if (usuarioForm.id) {
                resposta = await api.put(`/api/usuarios/${usuarioForm.id}`, payload);
            } else {
                resposta = await api.post('/api/usuarios', payload);
            }
            const permissoesAceitas = resposta?.data?.permissoes || [];
            const permissoesRecusadas = permissoesSolicitadas.filter((permissao) => !permissoesAceitas.includes(permissao));

            if (permissoesRecusadas.length > 0) {
                const recusadasFormatadas = permissoesRecusadas
                    .map((permissao) => nomesPermissao[permissao] || permissao)
                    .join(', ');
                showToast(
                    'aviso',
                    'Permissões ajustadas pelo sistema',
                    `Algumas permissões não puderam ser mantidas: ${recusadasFormatadas}.\n\nO backend filtra por plano, licenciamento ativo e bloqueios operacionais como onboarding vencido.`
                );
            } else {
                showToast(
                    'sucesso',
                    usuarioForm.id ? 'Acessos Atualizados' : 'Usuário Cadastrado',
                    usuarioForm.id
                        ? 'As permissões do usuário foram salvas com sucesso!'
                        : 'Novo membro adicionado à equipe com sucesso!'
                );
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

    const marcarTudoAdmin = () => setUsuarioForm(prev => ({
        ...prev,
        permissoes: Array.from(permissoesPorPlano[planoEmpresa] || permissoesPorPlano.ESSENCIAL)
            .filter((acao) => descreverMotivosBloqueio(acao).length === 0)
    }));
    const limparTudo = () => setUsuarioForm(prev => ({ ...prev, permissoes: [] }));
    const mapaModulosEmpresa = Object.fromEntries((modulosEmpresa || []).map((item) => [item.modulo, item]));
    const onboardingVencido = statusOnboardingEmpresa === 'VENCIDO';

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
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600 mt-2">
                        {planoEmpresa === 'INTERNO' ? 'Empresa interna · licenciamento total' : `Plano da empresa: ${planoEmpresa}`}
                    </p>
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
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                        user.mfaEnabled
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {user.mfaEnabled ? 'MFA ATIVO' : 'MFA REVOGADO'}
                                    </span>
                                    {user.forcePasswordChange && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">TROCA SENHA</span>}
                                    {user.tipoAcesso && <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black">{user.tipoAcesso}</span>}
                                </div>
                            </td>
                            <td className="p-4 pr-6 flex justify-center gap-3">
                                <button onClick={() => abrirModalEditar(user)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar dados e permissões de acesso"><Edit size={18} /></button>
                                <button onClick={() => revogarMfa(user)} disabled={!user.mfaEnabled} className={`p-2 rounded-lg ${user.mfaEnabled ? 'text-indigo-500 hover:text-indigo-700 bg-indigo-50' : 'text-slate-300 bg-slate-100 cursor-not-allowed'}`} title={user.mfaEnabled ? "Revogar MFA deste usuário" : "MFA já está revogado"}><ShieldOff size={18} /></button>
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
                                <input type="password" value={usuarioForm.senha} onChange={e => setUsuarioForm({...usuarioForm, senha: e.target.value})} autoComplete="new-password" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700" placeholder="******" />
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
                                        <div className="text-[11px] text-slate-500">
                                            {usuarioForm.mfaEnabled
                                                ? 'Exige código do autenticador no login.'
                                                : 'MFA revogado. Só volta a ser exigido se você ativar novamente aqui.'}
                                        </div>
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
                                                    (() => {
                                                        const motivosBloqueio = descreverMotivosBloqueio(tela.acao);
                                                        const disponivel = motivosBloqueio.length === 0;
                                                        return (
                                                    <button
                                                        type="button"
                                                        key={tela.acao}
                                                        className={`w-full flex items-start gap-3 group text-left ${
                                                            disponivel ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                                                        }`}
                                                        onClick={() => handleTogglePermissao(tela.acao)}
                                                        disabled={!disponivel}
                                                    >
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                                                            usuarioForm.permissoes.includes(tela.acao)
                                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                                : 'border-slate-300 bg-white'
                                                        }`}>
                                                            {usuarioForm.permissoes.includes(tela.acao) && <CheckCircle size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-slate-700 select-none group-hover:text-blue-800">{tela.nome}</div>
                                                            {motivosBloqueio.length > 0 && (
                                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                                    {motivosBloqueio.map((motivo) => (
                                                                        <span
                                                                            key={`${tela.acao}-${motivo}`}
                                                                            className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full"
                                                                        >
                                                                            {motivo}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                        );
                                                    })()
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
