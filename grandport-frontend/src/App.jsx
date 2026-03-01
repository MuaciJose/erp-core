import React, { useState, useEffect } from 'react';
import api from './api/axios';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Pdv } from './modules/vendas/Pdv';
import { Produtos } from './modules/estoque/Produtos';
import { Marcas } from './modules/estoque/Marcas';
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

function App() {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [paginaAtiva, setPaginaAtiva] = useState('dash');
    const [carregandoApp, setCarregandoApp] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('grandport_token');
        const userSaved = localStorage.getItem('grandport_user');
        
        if (token && userSaved) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUsuarioLogado(JSON.parse(userSaved));
        }
        setCarregandoApp(false);

        const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('grandport_token');
        localStorage.removeItem('grandport_user');
        api.defaults.headers.common['Authorization'] = '';
        setUsuarioLogado(null);
        window.location.reload();
    };

    if (carregandoApp) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white font-black tracking-widest">CARREGANDO GRANDPORT ERP...</div>;

    if (!usuarioLogado) {
        return <Login onLoginSuccess={(user) => setUsuarioLogado(user)} />;
    }

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
            
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
                    {paginaAtiva === 'dash' && <Dashboard setPaginaAtiva={setPaginaAtiva} />}
                    {paginaAtiva === 'vendas' && <Pdv />}
                    {paginaAtiva === 'estoque' && <Produtos />}
                    {paginaAtiva === 'marcas' && <Marcas />}
                    {paginaAtiva === 'parceiros' && <Parceiros />}
                    {paginaAtiva === 'previsao' && <PrevisaoCompras />}
                    {paginaAtiva === 'compras' && <ImportarXml />}
                    {paginaAtiva === 'fiscal' && <CargaNcm />}
                    {paginaAtiva === 'faltas' && <RelatorioFaltas />}
                    {paginaAtiva === 'contas-receber' && <ContasReceber />}
                    {paginaAtiva === 'contas-pagar' && <ContasPagar />}
                    {paginaAtiva === 'caixa' && <ControleCaixa />}
                    {paginaAtiva === 'dre' && <FluxoCaixaDre />}
                    {paginaAtiva === 'bancos' && <ContasBancarias />}
                    {paginaAtiva === 'plano-contas' && <PlanoContas />}
                    {paginaAtiva === 'conciliacao' && <ConciliacaoBancaria />}
                    {paginaAtiva === 'usuarios' && <GestaoUsuarios />}
                </div>
            </main>
        </div>
    );
}

export default App;
