import { LayoutDashboard, ShoppingCart, Package, DollarSign, LogOut, FileText, Settings, Tag, Calculator, Ban, ShoppingBasket, Users, TrendingUp } from 'lucide-react';

export const Sidebar = ({ setPaginaAtiva }) => {
  const menuItens = [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'vendas', label: 'PDV / Vendas', icon: <ShoppingCart /> },
    { id: 'estoque', label: 'Estoque', icon: <Package /> },
    { id: 'marcas', label: 'Marcas', icon: <Tag /> },
    { id: 'parceiros', label: 'Clientes & Fornecedores', icon: <Users /> },
    { id: 'previsao', label: 'Previsão de Compras', icon: <ShoppingBasket /> },
    { id: 'compras', label: 'Compras (XML)', icon: <FileText /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign /> },
    { id: 'contas-receber', label: 'Contas a Receber', icon: <TrendingUp /> },
    { id: 'fechamento', label: 'Fechamento', icon: <Calculator /> },
    { id: 'faltas', label: 'Relatório de Faltas', icon: <Ban /> },
    { id: 'fiscal', label: 'Fiscal / NCM', icon: <Settings /> },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-10 text-blue-400">GRANDPORT ERP</h1>
      
      <nav className="flex-1 space-y-2">
        {menuItens.map(item => (
          <button 
            key={item.id}
            onClick={() => setPaginaAtiva(item.id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <button 
        onClick={() => { localStorage.clear(); window.location.reload(); }}
        className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-900/20 rounded-lg"
      >
        <LogOut /> Sair
      </button>
    </div>
  );
};
