import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    DollarSign, 
    Package, 
    Users, 
    Settings, 
    ChevronDown, 
    ChevronRight,
    ShoppingCart,
    FileText,
    LogOut,
    PieChart,
    Landmark,
    Layers,
    Link as LinkIcon,
    Ban
} from 'lucide-react';

export const Sidebar = ({ paginaAtiva, setPaginaAtiva, usuarioLogado, onLogout }) => {
    const [menuExpandido, setMenuExpandido] = useState('financeiro');

    const toggleMenu = (menuId) => {
        setMenuExpandido(menuExpandido === menuId ? null : menuId);
    };

    const perfil = usuarioLogado?.perfil || 'VENDEDOR';

    const menus = [
        {
            id: 'dashboard',
            titulo: 'Dashboard',
            icone: <LayoutDashboard size={20} />,
            acao: 'dash'
        },
        {
            id: 'vendas',
            titulo: 'Vendas & PDV',
            icone: <ShoppingCart size={20} />,
            acao: 'vendas'
        },
        {
            id: 'estoque',
            titulo: 'Estoque & Compras',
            icone: <Package size={20} />,
            submenus: [
                { titulo: 'Buscar Peças', acao: 'estoque' },
                { titulo: 'Marcas', acao: 'marcas' },
                { titulo: 'Importar NF-e (XML)', acao: 'compras' },
                { titulo: 'Previsão de Compras', acao: 'previsao' },
                { titulo: 'Relatório de Faltas', acao: 'faltas' }
            ]
        },
        {
            id: 'financeiro',
            titulo: 'Financeiro',
            icone: <DollarSign size={20} />,
            submenus: [
                { titulo: 'Controle de Caixa', acao: 'caixa' },
                { titulo: 'Contas a Pagar', acao: 'contas-pagar' },
                { titulo: 'Contas a Receber', acao: 'contas-receber' },
                { titulo: 'Contas Bancárias', acao: 'bancos' },
                { titulo: 'Conciliação Bancária', acao: 'conciliacao' },
                { titulo: 'Plano de Contas', acao: 'plano-contas' },
                { titulo: 'Resultado (DRE)', acao: 'dre' }
            ]
        },
        {
            id: 'cadastros',
            titulo: 'Cadastros',
            icone: <Users size={20} />,
            submenus: [
                { titulo: 'Clientes & Fornecedores', acao: 'parceiros' },
                { titulo: 'Vendedores / Usuários', acao: 'usuarios' },
                { titulo: 'Fiscal / NCM', acao: 'fiscal' }
            ]
        },
        {
            id: 'configuracoes',
            titulo: 'Configurações',
            icone: <Settings size={20} />,
            acao: 'configuracoes'
        }
    ];

    // Lógica de Perfis de Acesso (RBAC)
    const menusPermitidos = menus.filter(menu => {
        if (menu.id === 'financeiro') {
            return perfil === 'ADMIN' || perfil === 'CAIXA';
        }
        if (menu.id === 'cadastros' || menu.id === 'configuracoes') {
            return perfil === 'ADMIN';
        }
        if (menu.id === 'estoque') {
            return perfil === 'ADMIN' || perfil === 'ESTOQUISTA';
        }
        return true; 
    });

    return (
        <aside className="w-72 bg-slate-900 text-white h-screen flex flex-col shadow-2xl transition-all z-50">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    GRANDPORT
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    ERP Autopeças
                </p>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                {menusPermitidos.map((menu) => (
                    <div key={menu.id}>
                        {menu.submenus ? (
                            <>
                                <button 
                                    onClick={() => toggleMenu(menu.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold ${
                                        menuExpandido === menu.id || menu.submenus.some(sub => sub.acao === paginaAtiva)
                                            ? 'bg-slate-800 text-blue-400' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {menu.icone}
                                        <span>{menu.titulo}</span>
                                    </div>
                                    {menuExpandido === menu.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>

                                {menuExpandido === menu.id && (
                                    <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-700 space-y-1 animate-fade-in">
                                        {menu.submenus.map((sub, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPaginaAtiva(sub.acao)}
                                                className={`w-full text-left p-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                                    paginaAtiva === sub.acao 
                                                        ? 'bg-blue-600 text-white shadow-md' 
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                }`}
                                            >
                                                {paginaAtiva === sub.acao && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                <span className={paginaAtiva === sub.acao ? 'ml-1' : 'ml-3'}>{sub.titulo}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <button 
                                onClick={() => {
                                    setPaginaAtiva(menu.acao);
                                    setMenuExpandido(null);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${
                                    paginaAtiva === menu.acao 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {menu.icone}
                                <span>{menu.titulo}</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white">
                            {usuarioLogado?.nome?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">{usuarioLogado?.nome?.split(' ')[0]}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{usuarioLogado?.perfil}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
};
