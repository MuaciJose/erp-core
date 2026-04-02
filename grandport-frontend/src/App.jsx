import React, { Suspense, lazy, useEffect, useState } from 'react';
import api from './api/axios';
import { clearSession, syncAuthHeader, updateStoredUser } from './utils/authStorage';

// --- IMPORTAÇÃO DO TOAST ---
import { toast } from 'react-hot-toast';
import { AppToaster } from './components/AppToaster';

import { Sidebar } from './components/Sidebar';
import { PlatformConsoleLayout } from './components/PlatformConsoleLayout';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Marcas } from './modules/estoque/Marcas';
import { AjusteEstoque } from './modules/estoque/AjusteEstoque';
import { PrevisaoCompras } from './modules/estoque/PrevisaoCompras';
import { Parceiros } from './modules/cadastro/Parceiros';
import { Login } from './modules/auth/Login';
import CadastroEmpresa from './modules/auth/CadastroEmpresa'; // 🚀 IMPORTAÇÃO DA NOVA TELA AQUI
import FinalizarCadastroEmpresa from './modules/auth/FinalizarCadastroEmpresa';
import { CargaNcm } from './modules/admin/CargaNcm';
import { RelatorioFaltas } from './modules/admin/RelatorioFaltas';
import { PlatformOverview } from './modules/admin/PlatformOverview';
import { ContasPagar } from './modules/financeiro/ContasPagar';
import { ControleCaixa } from './modules/financeiro/ControleCaixa';
import { FluxoCaixaDre } from './modules/financeiro/FluxoCaixaDre';
import { FluxoCaixaProjecao } from './modules/financeiro/FluxoCaixaProjecao'; // 🚀 A NOVA TELA DO FUTURO AQUI!
import { PlanoContas } from './modules/financeiro/PlanoContas';
import { ConciliacaoBancaria } from './modules/financeiro/ConciliacaoBancaria';
import { GestaoUsuarios } from './modules/cadastro/GestaoUsuarios';
import { LiberacaoAcessos } from './modules/cadastro/LiberacaoAcessos';
import { CentralSaas } from './modules/admin/CentralSaas';
import { Auditoria } from './modules/cadastro/Auditoria';
import { WidgetCalculadora } from './components/WidgetCalculadora';
import { RelatorioComissoes } from './modules/vendas/RelatorioComissoes';
import { ManualUsuario } from './modules/manual/ManualUsuario';
import { AgendaCorporativa } from './modules/agenda/AgendaCorporativa';
import { AtendimentoSaas } from './modules/atendimento/AtendimentoSaas';
import { FichaCadastralEmpresa } from './modules/assinatura/FichaCadastralEmpresa';

// 🚀 MÓDULOS IMPORTADOS
import { ReciboAvulso } from './modules/financeiro/ReciboAvulso';
import { HistoricoRecibos } from './modules/financeiro/HistoricoRecibos';

// 🚀 MÓDULO FISCAL
import { RegrasFiscais } from './modules/fiscal/RegrasFiscais';

// 🚀 MÓDULO Categoria
import { Categorias } from './modules/estoque/Categorias';

// 🚀 MÓDULO CRM DE REVISÕES
import { PainelRevisoes } from './modules/cadastro/PainelRevisoes';

// 🚀 MÓDULO GERADOR DE ETIQUETAS
import { GeradorEtiquetas } from './modules/estoque/GeradorEtiquetas';

// 🚀 MÓDULOS DE ORDEM DE SERVIÇO
import { ListagemOs } from './modules/os/ListagemOs';

// 🚀 MÓDULO CHECKLIST DE VEÍCULOS (NOVO)
import { CurvaABC } from './modules/estoque/curvaABC';

// 🚀 MÓDULO SERVIÇOS / MÃO DE OBRA
import { GestaoServicos } from './modules/servicos/GestaoServicos';

import { InventarioPWA } from './modules/estoque/InventarioPWA';

const Configuracoes = lazy(() =>
    import('./modules/configuracoes/Configuracoes').then(module => ({ default: module.Configuracoes }))
);
const Pdv = lazy(() =>
    import('./modules/vendas/Pdv').then(module => ({ default: module.Pdv }))
);
const Produtos = lazy(() =>
    import('./modules/estoque/Produtos').then(module => ({ default: module.Produtos }))
);
const ImportarXml = lazy(() =>
    import('./modules/compras/ImportarXml').then(module => ({ default: module.ImportarXml }))
);
const ContasReceber = lazy(() =>
    import('./modules/financeiro/ContasReceber').then(module => ({ default: module.ContasReceber }))
);
const ContasBancarias = lazy(() =>
    import('./modules/financeiro/ContasBancarias').then(module => ({ default: module.ContasBancarias }))
);
const GestaoVendas = lazy(() =>
    import('./modules/vendas/GestaoVendas').then(module => ({ default: module.GestaoVendas }))
);
const FilaPedidosCaixa = lazy(() =>
    import('./modules/vendas/FilaPedidosCaixa').then(module => ({ default: module.FilaPedidosCaixa }))
);
const GerenciadorFiscal = lazy(() =>
    import('./modules/fiscal/GerenciadorFiscal').then(module => ({ default: module.GerenciadorFiscal }))
);
const EmitirNfeAvulsa = lazy(() =>
    import('./modules/fiscal/EmitirNfeAvulsa')
);
const PainelOs = lazy(() =>
    import('./modules/os/PainelOs').then(module => ({ default: module.PainelOs }))
);
const ChecklistTablet = lazy(() =>
    import('./modules/checklist/ChecklistTablet').then(module => ({ default: module.ChecklistTablet }))
);

const lazyFallback = (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-500 font-semibold">
        Carregando modulo...
    </div>
);

function App() {
    const paginasRestritasPorOnboarding = ['configuracoes', 'fiscal', 'regras-fiscais', 'gerenciador-nfe', 'emitir-nfe-avulsa', 'ncm'];
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [paginaAtiva, setPaginaAtiva] = useState('');
    const [modoAplicacao, setModoAplicacao] = useState('erp');
    const [contextoCentralSaas, setContextoCentralSaas] = useState(null);
    const [carregandoApp, setCarregandoApp] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [senhaAtualObrigatoria, setSenhaAtualObrigatoria] = useState('');
    const [novaSenhaObrigatoria, setNovaSenhaObrigatoria] = useState('');
    const [confirmacaoSenhaObrigatoria, setConfirmacaoSenhaObrigatoria] = useState('');
    const [salvandoTrocaSenha, setSalvandoTrocaSenha] = useState(false);
    const [erroTrocaSenha, setErroTrocaSenha] = useState('');
    const [onboardingEmpresa, setOnboardingEmpresa] = useState(null);
    const [avisoManutencaoPlataforma, setAvisoManutencaoPlataforma] = useState(null);

    // 🚀 NOVO ESTADO: Controla as telas antes do usuário logar
    const [telaPublica, setTelaPublica] = useState('login');
    const [inviteTokenPublico, setInviteTokenPublico] = useState('');

    const definirTelaInicial = (usuario) => {
        if (usuario?.tipoAcesso === 'PLATFORM_ADMIN') return 'platform-overview';
        const permissoes = usuario.permissoes || [];
        if (permissoes.includes('dash')) return 'dash';
        if (permissoes.includes('pdv')) return 'pdv';
        if (permissoes.includes('vendas')) return 'vendas';
        if (permissoes.includes('fila-caixa')) return 'fila-caixa';
        if (permissoes.length > 0) return permissoes[0];
        return '';
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const inviteToken = params.get('inviteToken');
        if (inviteToken) {
            setInviteTokenPublico(inviteToken);
            setTelaPublica('finalizar-cadastro');
        }

        const validarSessao = async () => {
            syncAuthHeader(api);

            try {
                const res = await api.get('/auth/me');
                const usuario = res.data;
                setUsuarioLogado(usuario);
                setPaginaAtiva(definirTelaInicial(usuario));
                setModoAplicacao(usuario?.tipoAcesso === 'PLATFORM_ADMIN' ? 'platform' : 'erp');
            } catch (error) {
                clearSession();
                setUsuarioLogado(null);
                setPaginaAtiva('');
                setModoAplicacao('erp');
            } finally {
                setCarregandoApp(false);
            }
        };

        validarSessao();

        const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        const handleCustomNavigate = (event) => {
            const destino = event?.detail?.page;
            if (destino) setPaginaAtiva(destino);
        };
        const handleSessionExpired = () => {
            setUsuarioLogado(null);
            setPaginaAtiva('');
            setTelaPublica(inviteToken ? 'finalizar-cadastro' : 'login');
        };
        const handleTenantBlocked = (event) => {
            setUsuarioLogado(null);
            setPaginaAtiva('');
            setModoAplicacao('erp');
            setTelaPublica('login');
            toast.error(event?.detail?.message || 'O acesso desta empresa foi bloqueado pela plataforma.');
        };
        window.addEventListener('grandport:navigate', handleCustomNavigate);
        window.addEventListener('grandport:session-expired', handleSessionExpired);
        window.addEventListener('grandport:tenant-blocked', handleTenantBlocked);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            window.removeEventListener('grandport:navigate', handleCustomNavigate);
            window.removeEventListener('grandport:session-expired', handleSessionExpired);
            window.removeEventListener('grandport:tenant-blocked', handleTenantBlocked);
        };
    }, []);

    const handleLoginSucesso = (usuario) => {
        setUsuarioLogado(usuario);
        setPaginaAtiva(definirTelaInicial(usuario));
        setModoAplicacao(usuario?.tipoAcesso === 'PLATFORM_ADMIN' ? 'platform' : 'erp');
    };

    useEffect(() => {
        if (!usuarioLogado || usuarioLogado?.tipoAcesso === 'PLATFORM_ADMIN') {
            setOnboardingEmpresa(null);
            setAvisoManutencaoPlataforma(null);
            return;
        }

        const carregarAvisosOperacionais = async () => {
            try {
                const [resOnboarding, resAviso] = await Promise.all([
                    api.get('/api/assinaturas/minha-empresa/cadastro-complementar'),
                    api.get('/api/assinaturas/plataforma/aviso-manutencao')
                ]);
                setOnboardingEmpresa(resOnboarding.data || null);
                setAvisoManutencaoPlataforma(resAviso.data || null);
            } catch (error) {
                setOnboardingEmpresa(null);
                setAvisoManutencaoPlataforma(null);
            }
        };

        carregarAvisosOperacionais();
        const intervalo = window.setInterval(carregarAvisosOperacionais, 120000);
        return () => window.clearInterval(intervalo);
    }, [usuarioLogado?.empresaId, usuarioLogado?.tipoAcesso]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Erro ao registrar logout", e);
        } finally {
            clearSession();
            setUsuarioLogado(null);
            setPaginaAtiva('');
            setModoAplicacao('erp');
            setTelaPublica('login');
        }
    };

    if (carregandoApp) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white font-black tracking-widest">CARREGANDO GRANDPORT ERP...</div>;

    // 🚀 O NOVO PÁTIO DE ENTRADA DO SAAS
    if (!usuarioLogado) {
        if (telaPublica === 'finalizar-cadastro') {
            return <FinalizarCadastroEmpresa inviteToken={inviteTokenPublico} onVoltarLogin={() => setTelaPublica('login')} />;
        }
        if (telaPublica === 'cadastro') {
            return <CadastroEmpresa onVoltarLogin={() => setTelaPublica('login')} />;
        }
        return <Login onLoginSuccess={handleLoginSucesso} onIrParaCadastro={() => setTelaPublica('cadastro')} />;
    }

    const permissoesExtra = ['revisoes', 'agenda', 'atendimento', 'ficha-cadastral', 'etiquetas', 'os', 'servicos', 'listagem-os', 'manual', 'checklist', 'inventario', 'estoque'];
    const temPermissao =
        usuarioLogado.permissoes.includes(paginaAtiva) ||
        permissoesExtra.includes(paginaAtiva) ||
        ((paginaAtiva === 'liberacao-acessos' || paginaAtiva === 'central-saas') && usuarioLogado.tipoAcesso === 'PLATFORM_ADMIN');
    const podeVerAgenda = usuarioLogado?.permissoes?.includes('agenda');
    const exigeTrocaSenha = !!usuarioLogado?.forcePasswordChange;
    const isPlatformAdmin = usuarioLogado?.tipoAcesso === 'PLATFORM_ADMIN';
    const onboardingPendente =
        onboardingEmpresa &&
        ['PENDENTE_COMPLEMENTO', 'EM_PREENCHIMENTO', 'VENCIDO'].includes(onboardingEmpresa.statusOnboarding);
    const mostrarBannerOnboarding = onboardingPendente && paginaAtiva !== 'ficha-cadastral' && modoAplicacao === 'erp';
    const mostrarBannerManutencao = !!avisoManutencaoPlataforma?.ativo && modoAplicacao === 'erp';
    const classeBannerManutencao =
        avisoManutencaoPlataforma?.severidade === 'INCIDENTE'
            ? 'border-red-200 bg-red-50 text-red-900'
            : avisoManutencaoPlataforma?.severidade === 'INFORMATIVO'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-amber-200 bg-amber-50 text-amber-900';
    const acessoBloqueadoPorOnboarding =
        onboardingEmpresa?.statusOnboarding === 'VENCIDO' &&
        paginasRestritasPorOnboarding.includes(paginaAtiva);

    const toneBannerOnboarding =
        onboardingEmpresa?.statusOnboarding === 'VENCIDO'
            ? 'border-red-200 bg-red-50 text-red-900'
            : onboardingEmpresa?.statusOnboarding === 'EM_PREENCHIMENTO'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-amber-200 bg-amber-50 text-amber-900';

    const handleTrocarSenhaObrigatoria = async () => {
        setErroTrocaSenha('');
        if (!senhaAtualObrigatoria || !novaSenhaObrigatoria || !confirmacaoSenhaObrigatoria) {
            setErroTrocaSenha('Preencha a senha atual e a nova senha completa.');
            return;
        }
        if (novaSenhaObrigatoria !== confirmacaoSenhaObrigatoria) {
            setErroTrocaSenha('A confirmação da nova senha não confere.');
            return;
        }

        setSalvandoTrocaSenha(true);
        try {
            const res = await api.post('/auth/trocar-senha', {
                senhaAtual: senhaAtualObrigatoria,
                novaSenha: novaSenhaObrigatoria
            });
            setUsuarioLogado(res.data);
            updateStoredUser(res.data);
            setSenhaAtualObrigatoria('');
            setNovaSenhaObrigatoria('');
            setConfirmacaoSenhaObrigatoria('');
        } catch (error) {
            setErroTrocaSenha(error?.response?.data?.error || 'Não foi possível trocar a senha.');
        } finally {
            setSalvandoTrocaSenha(false);
        }
    };

    const handleOpenPlatformConsole = () => {
        if (!isPlatformAdmin) {
            return;
        }
        setModoAplicacao('platform');
        setPaginaAtiva('platform-overview');
    };

    const handleAbrirCentralSaas = (contexto = null) => {
        setContextoCentralSaas(contexto);
        setPaginaAtiva('central-saas');
    };

    const handleEntrarErp = () => {
        const telaInicialErp = usuarioLogado?.tipoAcesso === 'PLATFORM_ADMIN'
            ? 'dash'
            : definirTelaInicial(usuarioLogado);
        setModoAplicacao('erp');
        setPaginaAtiva(telaInicialErp);
    };

    if (isPlatformAdmin && modoAplicacao === 'platform') {
        return (
            <>
                <AppToaster />
                <PlatformConsoleLayout
                    paginaAtiva={paginaAtiva}
                    setPaginaAtiva={setPaginaAtiva}
                    usuarioLogado={usuarioLogado}
                    onLogout={handleLogout}
                    onEntrarErp={handleEntrarErp}
                >
                    {paginaAtiva === 'platform-overview' && (
                        <PlatformOverview
                            onAbrirCentralSaas={handleAbrirCentralSaas}
                            onAbrirAuditoria={() => setPaginaAtiva('auditoria')}
                            onEntrarErp={handleEntrarErp}
                        />
                    )}
                    {paginaAtiva === 'central-saas' && <CentralSaas contextoInicial={contextoCentralSaas} />}
                    {paginaAtiva === 'atendimento-saas' && <AtendimentoSaas modo="plataforma" />}
                    {paginaAtiva === 'auditoria' && <Auditoria />}
                </PlatformConsoleLayout>
            </>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">

            <AppToaster />

            {!isFullScreen && (
                <Sidebar
                    paginaAtiva={paginaAtiva}
                    setPaginaAtiva={setPaginaAtiva}
                    usuarioLogado={usuarioLogado}
                    onLogout={handleLogout}
                    onOpenPlatformConsole={handleOpenPlatformConsole}
                />
            )}

            <main className={`flex-1 h-full overflow-y-auto ${isFullScreen ? 'p-0' : 'p-4'}`}>
                <div className={`${isFullScreen ? 'w-full h-full' : 'max-w-[1600px] mx-auto'}`}>
                    {mostrarBannerManutencao && (
                        <div className={`mb-4 rounded-[1.75rem] border px-5 py-4 shadow-sm ${classeBannerManutencao}`}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="space-y-2">
                                    <div className="text-xs font-black uppercase tracking-[0.22em]">
                                        Aviso da plataforma
                                    </div>
                                    <div className="text-lg font-black">
                                        {avisoManutencaoPlataforma?.titulo || 'Manutenção programada'}
                                    </div>
                                    {avisoManutencaoPlataforma?.mensagem && (
                                        <div className="text-sm font-semibold">
                                            {avisoManutencaoPlataforma.mensagem}
                                        </div>
                                    )}
                                    <div className="text-sm font-semibold opacity-90">
                                        {avisoManutencaoPlataforma?.inicioPrevisto
                                            ? `Início previsto: ${new Date(avisoManutencaoPlataforma.inicioPrevisto).toLocaleString('pt-BR')}`
                                            : 'Início previsto não informado'}
                                        {avisoManutencaoPlataforma?.fimPrevisto
                                            ? ` · Fim previsto: ${new Date(avisoManutencaoPlataforma.fimPrevisto).toLocaleString('pt-BR')}`
                                            : ''}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-bold">
                                    {avisoManutencaoPlataforma?.bloquearAcesso
                                        ? 'O acesso pode ser bloqueado durante a janela informada.'
                                        : 'A comunicação foi publicada pela plataforma.'}
                                </div>
                            </div>
                        </div>
                    )}
                    {mostrarBannerOnboarding && (
                        <div className={`mb-4 rounded-[1.75rem] border px-5 py-4 shadow-sm ${toneBannerOnboarding}`}>
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="space-y-2">
                                    <div className="text-xs font-black uppercase tracking-[0.22em]">
                                        Ficha cadastral da empresa
                                    </div>
                                    <div className="text-lg font-black">
                                        {onboardingEmpresa?.statusOnboarding === 'VENCIDO'
                                            ? 'O prazo para completar a ficha cadastral expirou.'
                                            : 'Sua empresa ainda precisa concluir a ficha cadastral obrigatória.'}
                                    </div>
                                    <div className="text-sm font-semibold opacity-80">
                                        {onboardingEmpresa?.prazoConclusao
                                            ? `Prazo final: ${new Date(`${onboardingEmpresa.prazoConclusao}T00:00:00`).toLocaleDateString('pt-BR')}`
                                            : 'Prazo ainda não definido'} · {onboardingEmpresa?.percentualPreenchimento || 0}% preenchido · {onboardingEmpresa?.pendencias?.length || 0} pendência(s)
                                    </div>
                                    {Array.isArray(onboardingEmpresa?.pendencias) && onboardingEmpresa.pendencias.length > 0 && (
                                        <div className="text-sm font-semibold">
                                            Pendências: {onboardingEmpresa.pendencias.join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="h-3 w-48 overflow-hidden rounded-full bg-white/60">
                                        <div
                                            className="h-full rounded-full bg-slate-900 transition-all"
                                            style={{ width: `${Math.max(0, Math.min(100, onboardingEmpresa?.percentualPreenchimento || 0))}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setPaginaAtiva('ficha-cadastral')}
                                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                                    >
                                        Abrir ficha cadastral
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {!temPermissao ? (
                        <div className="p-10 text-center mt-20">
                            <h2 className="text-2xl font-black text-red-500 mb-2">ACESSO NEGADO</h2>
                            {acessoBloqueadoPorOnboarding ? (
                                <div className="mx-auto max-w-2xl space-y-4">
                                    <p className="text-slate-600">
                                        Este recurso foi restringido porque a ficha cadastral da empresa venceu e ainda precisa ser concluída.
                                    </p>
                                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-left text-sm text-red-900 shadow-sm">
                                        <div className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Restrição temporária</div>
                                        <div className="mt-2 font-semibold">
                                            Recursos fiscais e configurações críticas ficam bloqueados até a conclusão da ficha cadastral obrigatória.
                                        </div>
                                        <div className="mt-3">
                                            <span className="font-black">Pendências atuais:</span>{' '}
                                            {Array.isArray(onboardingEmpresa?.pendencias) && onboardingEmpresa.pendencias.length > 0
                                                ? onboardingEmpresa.pendencias.join(', ')
                                                : 'Ficha cadastral incompleta'}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setPaginaAtiva('ficha-cadastral')}
                                                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                                            >
                                                Concluir ficha cadastral
                                            </button>
                                            <button
                                                onClick={() => setPaginaAtiva('dash')}
                                                className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                                            >
                                                Voltar ao dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500">Você não tem permissão para visualizar esta tela.</p>
                            )}
                        </div>
                    ) : (
                        <>
                            {paginaAtiva === 'dash' && <Dashboard setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'pdv' && <Suspense fallback={lazyFallback}><Pdv setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'vendas' && <Suspense fallback={lazyFallback}><GestaoVendas setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'fila-caixa' && <Suspense fallback={lazyFallback}><FilaPedidosCaixa setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'caixa' && <ControleCaixa />}
                            {paginaAtiva === 'relatorio-comissoes' && <RelatorioComissoes />}

                            {paginaAtiva === 'revisoes' && <PainelRevisoes />}
                            {paginaAtiva === 'agenda' && <AgendaCorporativa />}
                            {paginaAtiva === 'atendimento' && <AtendimentoSaas modo="cliente" />}
                            {paginaAtiva === 'ficha-cadastral' && <FichaCadastralEmpresa />}
                            {paginaAtiva === 'crm' && <PainelRevisoes />}
                            {paginaAtiva === 'etiquetas' && <GeradorEtiquetas />}

                            {/* 🚀 TELAS DA OFICINA */}
                            {paginaAtiva === 'checklist' && <Suspense fallback={lazyFallback}><ChecklistTablet setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'os' && <Suspense fallback={lazyFallback}><PainelOs /></Suspense>}
                            {paginaAtiva === 'listagem-os' && <ListagemOs setPaginaAtiva={setPaginaAtiva} />}

                            {paginaAtiva === 'servicos' && <GestaoServicos />}

                            {paginaAtiva === 'estoque' && <Suspense fallback={lazyFallback}><Produtos setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'marcas' && <Marcas />}
                            {paginaAtiva === 'ajuste_estoque' && <AjusteEstoque />}
                            {paginaAtiva === 'parceiros' && <Parceiros setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'previsao' && <PrevisaoCompras />}
                            {paginaAtiva === 'compras' && <Suspense fallback={lazyFallback}><ImportarXml /></Suspense>}
                            {paginaAtiva === 'fiscal' && <CargaNcm />}
                            {paginaAtiva === 'faltas' && <RelatorioFaltas />}
                            {paginaAtiva === 'contas-receber' && <Suspense fallback={lazyFallback}><ContasReceber /></Suspense>}
                            {paginaAtiva === 'contas-pagar' && <ContasPagar />}
                            {paginaAtiva === 'dre' && <FluxoCaixaDre />}
                            {paginaAtiva === 'fluxo-caixa-projecao' && <FluxoCaixaProjecao setPaginaAtiva={setPaginaAtiva}/>}
                            {paginaAtiva === 'bancos' && <Suspense fallback={lazyFallback}><ContasBancarias /></Suspense>}
                            {paginaAtiva === 'plano-contas' && <PlanoContas />}
                            {paginaAtiva === 'conciliacao' && <ConciliacaoBancaria />}
                            {paginaAtiva === 'usuarios' && <GestaoUsuarios />}
                            {paginaAtiva === 'liberacao-acessos' && <LiberacaoAcessos />}
                            {paginaAtiva === 'central-saas' && <CentralSaas contextoInicial={contextoCentralSaas} />}
                            {paginaAtiva === 'auditoria' && <Auditoria />}
                            {paginaAtiva === 'configuracoes' && (
                                <Suspense fallback={
                                    <div className="min-h-[40vh] flex items-center justify-center text-slate-500 font-semibold">
                                        Carregando central de configuracoes...
                                    </div>
                                }>
                                    <Configuracoes />
                                </Suspense>
                            )}
                            {paginaAtiva === 'manual' && <ManualUsuario onVoltar={() => setPaginaAtiva('dash')} />}

                            {paginaAtiva === 'recibo-avulso' && <ReciboAvulso setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'historico-recibos' && <HistoricoRecibos setPaginaAtiva={setPaginaAtiva} />}

                            {paginaAtiva === 'regras-fiscais' && <RegrasFiscais setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'categorias' && <Categorias />}
                            {paginaAtiva === 'gerenciador-nfe' && <Suspense fallback={lazyFallback}><GerenciadorFiscal setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'emitir-nfe-avulsa' && <Suspense fallback={lazyFallback}><EmitirNfeAvulsa setPaginaAtiva={setPaginaAtiva} /></Suspense>}
                            {paginaAtiva === 'inventario' && <InventarioPWA  setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'curva-abc' && <CurvaABC />}
                        </>
                    )}
                </div>
            </main>

            {exigeTrocaSenha && (
                <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">Segurança obrigatória</div>
                            <h2 className="mt-2 text-2xl font-black text-slate-900">Troque sua senha antes de continuar</h2>
                            <p className="mt-2 text-sm text-slate-500">Usuários novos ou com senha resetada precisam definir uma senha forte antes de acessar o ERP.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha atual</label>
                                <input type="password" value={senhaAtualObrigatoria} onChange={(e) => setSenhaAtualObrigatoria(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova senha</label>
                                <input type="password" value={novaSenhaObrigatoria} onChange={(e) => setNovaSenhaObrigatoria(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none" />
                                <p className="mt-1 text-[11px] text-slate-500">Use no mínimo 10 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar nova senha</label>
                                <input type="password" value={confirmacaoSenhaObrigatoria} onChange={(e) => setConfirmacaoSenhaObrigatoria(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none" />
                            </div>
                            {erroTrocaSenha && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{erroTrocaSenha}</div>}
                            <button onClick={handleTrocarSenhaObrigatoria} disabled={salvandoTrocaSenha} className="w-full rounded-xl bg-slate-900 text-white py-4 font-black hover:bg-blue-600 transition-colors disabled:opacity-70">
                                {salvandoTrocaSenha ? 'SALVANDO...' : 'ATUALIZAR SENHA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <WidgetCalculadora />
        </div>
    );
}

export default App;
