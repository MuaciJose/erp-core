import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Pdv } from './modules/vendas/Pdv';
import { Login } from './modules/auth/Login';

function App() {
    const [paginaAtiva, setPaginaAtiva] = useState('dash');
    const [logado, setLogado] = useState(!!localStorage.getItem('token'));

    if (!logado) return <Login onLoginSuccess={() => setLogado(true)} />;

    return (
        // h-screen garante que o app ocupe a altura total da janela
        // w-screen garante que o app ocupe a largura total da janela
        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">

            {/* Sidebar com largura fixa */}
            <Sidebar setPaginaAtiva={setPaginaAtiva} />

            {/* O main deve ter flex-1 para ocupar o resto do espaço */}
            <main className="flex-1 h-full overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto"> {/* Opcional: limita a largura máxima do conteúdo */}
                    {paginaAtiva === 'dash' && <Dashboard />}
                    {paginaAtiva === 'vendas' && <Pdv />}
                    {/* Outras páginas... */}
                </div>
            </main>

        </div>
    );
}

export default App;
