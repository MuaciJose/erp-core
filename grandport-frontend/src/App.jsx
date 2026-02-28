import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Pdv } from './modules/vendas/Pdv';
import { Produtos } from './modules/estoque/Produtos';
import { ImportarXml } from './modules/compras/ImportarXml';
import { Login } from './modules/auth/Login';
// Importação do novo módulo fiscal
import { CargaNcm } from './modules/admin/CargaNcm';

function App() {
    const [paginaAtiva, setPaginaAtiva] = useState('dash');
    const [logado, setLogado] = useState(!!localStorage.getItem('token'));

    if (!logado) {
        return <Login onLoginSuccess={() => setLogado(true)} />;
    }

    return (
        /* Ajuste: h-screen e w-screen com overflow-hidden no pai
           evitam que a tela fique "pela metade" ou com barras de rolagem duplas.
        */
        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">

            {/* Sidebar fixa à esquerda */}
            <Sidebar setPaginaAtiva={setPaginaAtiva} paginaAtiva={paginaAtiva} />

            {/* Área de conteúdo principal: flex-1 faz ocupar o resto da largura.
                overflow-y-auto permite rolar apenas o conteúdo se for longo.
            */}
            <main className="flex-1 h-full overflow-y-auto p-4">
                <div className="max-w-[1600px] mx-auto">
                    {paginaAtiva === 'dash' && <Dashboard />}

                    {paginaAtiva === 'vendas' && <Pdv />}

                    {paginaAtiva === 'estoque' && <Produtos />}

                    {paginaAtiva === 'compras' && <ImportarXml />}

                    {/* Nova Rota para Carga de NCM via JSON */}
                    {paginaAtiva === 'fiscal' && <CargaNcm />}
                </div>
            </main>

        </div>
    );
}

export default App;