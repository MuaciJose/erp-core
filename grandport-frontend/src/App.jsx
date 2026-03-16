import React, { useState, useEffect } from 'react';
import api from './api/axios';

// --- IMPORTAÇÃO DO TOAST ---
import { Toaster } from 'react-hot-toast';

import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Pdv } from './modules/vendas/Pdv';
import { Produtos } from './modules/estoque/Produtos';
import { Marcas } from './modules/estoque/Marcas';
import { AjusteEstoque } from './modules/estoque/AjusteEstoque';
import { PrevisaoCompras } from './modules/estoque/PrevisaoCompras';
import { Parceiros } from './modules/cadastro/Parceiros';
import { ImportarXml } from './modules/compras/ImportarXml';
import { Login } from './modules/auth/Login';
import { CargaNcm } from './modules/admin/CargaNcm';
import { RelatorioFaltas } from './modules/admin/RelatorioFaltas';
import { ContasReceber } from './modules/financeiro/ContasReceber';
import { ContasPagar } from './modules/financeiro/ContasPagar';
import { ControleCaixa } from './modules/financeiro/ControleCaixa';
import { FluxoCaixaDre } from './modules/financeiro/FluxoCaixaDre';
import { ContasBancarias } from './modules/financeiro/ContasBancarias';
import { PlanoContas } from './modules/financeiro/PlanoContas';
import { ConciliacaoBancaria } from './modules/financeiro/ConciliacaoBancaria';
import { GestaoUsuarios } from './modules/cadastro/GestaoUsuarios';
import { Auditoria } from './modules/cadastro/Auditoria';
import { Configuracoes } from './modules/configuracoes/Configuracoes';
import { WidgetCalculadora } from './components/WidgetCalculadora';
import { GestaoVendas } from './modules/vendas/GestaoVendas';
import { FilaPedidosCaixa } from './modules/vendas/FilaPedidosCaixa';
import { RelatorioComissoes } from './modules/vendas/RelatorioComissoes';
import { ManualUsuario } from './modules/manual/ManualUsuario';

// 🚀 MÓDULOS IMPORTADOS
import { ReciboAvulso } from './modules/financeiro/ReciboAvulso';
import { HistoricoRecibos } from './modules/financeiro/HistoricoRecibos';

// 🚀 MÓDULO FISCAL (ADICIONADO)
import { RegrasFiscais } from './modules/fiscal/RegrasFiscais';
import { GerenciadorFiscal } from './modules/fiscal/GerenciadorFiscal';
import EmitirNfeAvulsa from './modules/fiscal/EmitirNfeAvulsa';

// 🚀 MÓDULO Categoria (ADICIONADO)
import { Categorias } from './modules/estoque/Categorias';

// 🚀 MÓDULO CRM DE REVISÕES (ADICIONADO)
import { PainelRevisoes } from './modules/cadastro/PainelRevisoes';

// 🚀 MÓDULO GERADOR DE ETIQUETAS (ADICIONADO AGORA)
import { GeradorEtiquetas } from './modules/estoque/GeradorEtiquetas';

function App() {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [paginaAtiva, setPaginaAtiva] = useState('');
    const [carregandoApp, setCarregandoApp] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

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
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

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

    if (!usuarioLogado) {
        return <Login onLoginSuccess={handleLoginSucesso} />;
    }

    // 🚀 'etiquetas' e 'revisoes' liberados sem precisar de restrição de banco temporariamente
    const permissoesExtra = ['revisoes', 'etiquetas'];
    const temPermissao = usuarioLogado.permissoes.includes(paginaAtiva) || permissoesExtra.includes(paginaAtiva);

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">

            {/* 🚀 TOASTER GLOBAL */}
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                    },
                    success: {
                        iconTheme: { primary: '#22c55e', secondary: '#fff' }
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#fff' }
                    }
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
                    {!temPermissao ? (
                        <div className="p-10 text-center mt-20">
                            <h2 className="text-2xl font-black text-red-500 mb-2">ACESSO NEGADO</h2>
                            <p className="text-slate-500">Você não tem permissão para visualizar esta tela.</p>
                        </div>
                    ) : (
                        <>
                            {paginaAtiva === 'dash' && <Dashboard setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'pdv' && <Pdv setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'vendas' && <GestaoVendas setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'fila-caixa' && <FilaPedidosCaixa setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'caixa' && <ControleCaixa />}
                            {paginaAtiva === 'relatorio-comissoes' && <RelatorioComissoes />}

                            {paginaAtiva === 'revisoes' && <PainelRevisoes />}

                            {/* 🚀 TELA DO GERADOR DE ETIQUETAS */}
                            {paginaAtiva === 'etiquetas' && <GeradorEtiquetas />}

                            {paginaAtiva === 'estoque' && <Produtos />}
                            {paginaAtiva === 'marcas' && <Marcas />}
                            {paginaAtiva === 'ajuste_estoque' && <AjusteEstoque />}
                            {paginaAtiva === 'parceiros' && <Parceiros />}
                            {paginaAtiva === 'previsao' && <PrevisaoCompras />}
                            {paginaAtiva === 'compras' && <ImportarXml />}
                            {paginaAtiva === 'fiscal' && <CargaNcm />}
                            {paginaAtiva === 'faltas' && <RelatorioFaltas />}
                            {paginaAtiva === 'contas-receber' && <ContasReceber />}
                            {paginaAtiva === 'contas-pagar' && <ContasPagar />}
                            {paginaAtiva === 'dre' && <FluxoCaixaDre />}
                            {paginaAtiva === 'bancos' && <ContasBancarias />}
                            {paginaAtiva === 'plano-contas' && <PlanoContas />}
                            {paginaAtiva === 'conciliacao' && <ConciliacaoBancaria />}
                            {paginaAtiva === 'usuarios' && <GestaoUsuarios />}
                            {paginaAtiva === 'auditoria' && <Auditoria />}
                            {paginaAtiva === 'configuracoes' && <Configuracoes />}
                            {paginaAtiva === 'manual' && <ManualUsuario onVoltar={() => setPaginaAtiva('dash')} />}

                            {paginaAtiva === 'recibo-avulso' && <ReciboAvulso setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'historico-recibos' && <HistoricoRecibos setPaginaAtiva={setPaginaAtiva} />}

                            {paginaAtiva === 'regras-fiscais' && <RegrasFiscais setPaginaAtiva={setPaginaAtiva} />}
                            {paginaAtiva === 'categorias' && <Categorias />}
                            {paginaAtiva === 'gerenciador-nfe' && <GerenciadorFiscal setPaginaAtiva={setPaginaAtiva} />}

                            {paginaAtiva === 'emitir-nfe-avulsa' && <EmitirNfeAvulsa setPaginaAtiva={setPaginaAtiva} />}
                        </>
                    )}
                </div>
            </main>

            <WidgetCalculadora />
        </div>
    );
}

export default App;