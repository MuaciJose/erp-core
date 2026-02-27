import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/financeiro/Dashboard';
import { Pdv } from './modules/vendas/Pdv';
import { Login } from './modules/auth/Login';

function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('dash');
  const [logado, setLogado] = useState(!!localStorage.getItem('token'));

  if (!logado) {
    return <Login onLoginSuccess={() => setLogado(true)} />;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar setPaginaAtiva={setPaginaAtiva} />
      <main className="flex-1 overflow-y-auto">
        {paginaAtiva === 'dash' && <Dashboard />}
        {paginaAtiva === 'vendas' && <Pdv />}
        {/* Adicione as outras telas conforme criarmos */}
      </main>
    </div>
  );
}

export default App;
