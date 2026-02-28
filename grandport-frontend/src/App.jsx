import React, { useState, useEffect } from 'react';
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

function App() {
    const [paginaAtiva, setPaginaAtiva] = useState('dash');
    const [logado, setLogado] = useState(!!localStorage.getItem('token'));
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFSChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    if (!logado) {
        return <Login onLoginSuccess={() => setLogado(true)} />;
    }

    return (
        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
            
            {!isFullScreen && (
                <Sidebar setPaginaAtiva={setPaginaAtiva} paginaAtiva={paginaAtiva} />
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
                </div>
            </main>
        </div>
    );
}

export default App;
