import React, { Suspense, lazy, useEffect, useState } from 'react';
import api from './api/axios';

// --- IMPORTAÇÃO DO TOAST ---
import { Toaster } from 'react-hot-toast';

import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Marcas } from './modules/estoque/Marcas';
import { AjusteEstoque } from './modules/estoque/AjusteEstoque';
import { PrevisaoCompras } from './modules/estoque/PrevisaoCompras';
import { Parceiros } from './modules/cadastro/Parceiros';
import { Login } from './modules/auth/Login';
import CadastroEmpresa from './modules/auth/CadastroEmpresa'; // 🚀 IMPORTAÇÃO DA NOVA TELA AQUI
import { CargaNcm } from './modules/admin/CargaNcm';
import { RelatorioFaltas } from './modules/admin/RelatorioFaltas';
import { ContasPagar } from './modules/financeiro/ContasPagar';
import { ControleCaixa } from './modules/financeiro/ControleCaixa';
import { FluxoCaixaDre } from './modules/financeiro/FluxoCaixaDre';
import { FluxoCaixaProjecao } from './modules/financeiro/FluxoCaixaProjecao'; // 🚀 A NOVA TELA DO FUTURO AQUI!
import { PlanoContas } from './modules/financeiro/PlanoContas';
import { ConciliacaoBancaria } from './modules/financeiro/ConciliacaoBancaria';
import { GestaoUsuarios } from './modules/cadastro/GestaoUsuarios';
import { Auditoria } from './modules/cadastro/Auditoria';
import { WidgetCalculadora } from './components/WidgetCalculadora';
import { RelatorioComissoes } from './modules/vendas/RelatorioComissoes';
import { ManualUsuario } from './modules/manual/ManualUsuario';
import { AgendaCorporativa } from './modules/agenda/AgendaCorporativa';

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
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [paginaAtiva, setPaginaAtiva] = useState('');
    const [carregandoApp, setCarregandoApp] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [resumoAgendaTopo, setResumoAgendaTopo] = useState(null);

    // 🚀 NOVO ESTADO: Controla as telas antes do usuário logar
    const [telaPublica, setTelaPublica] = useState('login');

    const definirTelaInicial = (usuario) => {
        const permissoes = usuario.permissoes || [];
        if (permissoes.includes('dash')) return 'dash';
        if (permissoes.includes('pdv')) return 'pdv';
        if (permissoes.includes('vendas')) return 'vendas';
        if (permissoes.includes('fila-caixa')) return 'fila-caixa';
        if (permissoes.length > 0) return permissoes[0];
        return '';
    };

    useEffect(() => {
        const token = localStorage.getItem('grandport_token');
        const userSaved = localStorage.getItem('grandport_user');

        if (token && userSaved) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const usuario = JSON.parse(userSaved);
            setUsuarioLogado(usuario);
            setPaginaAtiva(definirTelaInicial(usuario));
        }
        setCarregandoApp(false);

        const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        const handleCustomNavigate = (event) => {
            const destino = event?.detail?.page;
            if (destino) setPaginaAtiva(destino);
        };
        window.addEventListener('grandport:navigate', handleCustomNavigate);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            window.removeEventListener('grandport:navigate', handleCustomNavigate);
        };
    }, []);

    useEffect(() => {
        if (!usuarioLogado) return;

        const carregarResumoAgenda = async () => {
            try {
                const hoje = new Date().toISOString().slice(0, 10);
                const res = await api.get('/api/agenda/resumo', { params: { data: hoje } });
                setResumoAgendaTopo(res.data || null);
            } catch (error) {
                console.error('Falha ao carregar resumo da agenda no topo.', error);
            }
        };

        carregarResumoAgenda();
        const intervalo = window.setInterval(carregarResumoAgenda, 120000);
        return () => window.clearInterval(intervalo);
    }, [usuarioLogado]);

    const handleLoginSucesso = (usuario) => {
        setUsuarioLogado(usuario);
        setPaginaAtiva(definirTelaInicial(usuario));
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Erro ao registrar logout", e);
        } finally {
            localStorage.removeItem('grandport_token');
            localStorage.removeItem('grandport_user');
            api.defaults.headers.common['Authorization'] = '';
            setUsuarioLogado(null);
            setPaginaAtiva('');
            window.location.reload();
        }
    };

    if (carregandoApp) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white font-black tracking-widest">CARREGANDO GRANDPORT ERP...</div>;

    // 🚀 O NOVO PÁTIO DE ENTRADA DO SAAS
    if (!usuarioLogado) {
        if (telaPublica === 'cadastro') {
            return <CadastroEmpresa onVoltarLogin={() => setTelaPublica('login')} />;
        }
        return <Login onLoginSuccess={handleLoginSucesso} onIrParaCadastro={() => setTelaPublica('cadastro')} />;
    }

    const permissoesExtra = ['revisoes', 'agenda', 'etiquetas', 'os', 'servicos', 'listagem-os', 'manual', 'checklist', 'inventario', 'estoque'];
    const temPermissao = usuarioLogado.permissoes.includes(paginaAtiva) || permissoesExtra.includes(paginaAtiva);
    const agendaTemAtrasos = (resumoAgendaTopo?.atrasados || 0) > 0;
    const podeVerAgenda = true;

    const abrirAgendaAtrasados = () => {
        localStorage.setItem('agenda_quick_filter', 'atrasados');
        setPaginaAtiva('agenda');
    };

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">

            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 4000,
                    style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontWeight: 'bold' },
                    success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
                }}
            />

            {!isFullScreen && (
                <Sidebar
                    paginaAtiva={paginaAtiva}
                    setPaginaAtiva={setPaginaAtiva}
                    usuarioLogado={usuarioLogado}
                    onLogout={handleLogout}
                />
            )}

            <main className={`flex-1 h-full overflow-y-auto ${isFullScreen ? 'p-0' : 'p-4'}`}>
                <div className={`${isFullScreen ? 'w-full h-full' : 'max-w-[1600px] mx-auto'}`}>
                    {!isFullScreen && podeVerAgenda && resumoAgendaTopo && (
                        <div className={`mb-4 rounded-2xl border px-5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                            agendaTemAtrasos
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                            <div>
                                <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                                    agendaTemAtrasos ? 'text-rose-700' : 'text-blue-700'
                                }`}>
                                    Agenda Operacional
                                </div>
                                <div className="text-sm md:text-base font-black text-slate-800 mt-1">
                                    {agendaTemAtrasos
                                        ? `${resumoAgendaTopo.atrasados} compromisso(s) atrasado(s) exigem ação.`
                                        : `${resumoAgendaTopo.hoje || 0} compromisso(s) previstos para hoje, sem atraso crítico no momento.`}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {agendaTemAtrasos && (
                                    <button
                                        onClick={abrirAgendaAtrasados}
                                        className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wide hover:bg-rose-500 transition-colors"
                                    >
                                        Ver Atrasados
                                    </button>
                                )}
                                <button
                                    onClick={() => setPaginaAtiva('agenda')}
                                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-colors ${
                                        agendaTemAtrasos
                                            ? 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-100'
                                            : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    }`}
                                >
                                    Abrir Agenda
                                </button>
                            </div>
                        </div>
                    )}

                    {!temPermissao ? (
                        <div className="p-10 text-center mt-20">
                            <h2 className="text-2xl font-black text-red-500 mb-2">ACESSO NEGADO</h2>
                            <p className="text-slate-500">Você não tem permissão para visualizar esta tela.</p>
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

            <WidgetCalculadora />
        </div>
    );
}

export default App;
