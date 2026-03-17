import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    DollarSign,
    Package,
    Users,
    Settings,
    ChevronDown,
    ChevronRight,
    ShoppingCart,
    LogOut,
    Menu,
    ChevronLeft,
    HelpCircle
} from 'lucide-react';
import apiSidebar from '../api/axios';

export const Sidebar = ({ paginaAtiva, setPaginaAtiva, usuarioLogado, onLogout }) => {
    const [menuExpandido, setMenuExpandido] = useState('vendas');
    const [isRetratil, setIsRetratil] = useState(false);
    const [nomeEmpresa, setNomeEmpresa] = useState('GRANDPORT ERP');

    useEffect(() => {
        apiSidebar.get('/api/configuracoes')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                if (data && data.nomeFantasia) {
                    setNomeEmpresa(data.nomeFantasia);
                }
            })
            .catch(err => console.log("Não foi possível carregar o nome da empresa na sidebar.", err));
    }, []);

    const toggleMenu = (menuId) => {
        if (isRetratil) {
            setIsRetratil(false);
            setMenuExpandido(menuId);
        } else {
            setMenuExpandido(menuExpandido === menuId ? null : menuId);
        }
    };

    const permissoesUsuario = usuarioLogado?.permissoes || [];

    const menus = [
        { id: 'dashboard', titulo: 'Dashboard', icone: <LayoutDashboard size={20} />, acao: 'dash' },
        {
            id: 'vendas', titulo: 'Vendas & Frente de Loja', icone: <ShoppingCart size={20} />,
            submenus: [
                { titulo: 'Ponto de Venda (PDV)', acao: 'pdv' },
                { titulo: 'Balcão / Central', acao: 'vendas' },
                { titulo: 'Painel de OS (Kanban)', acao: 'os' },
                { titulo: 'Consulta de OS (Lista)', acao: 'listagem-os' }, // 🚀 ADICIONADO AQUI
                { titulo: 'Fila do Caixa', acao: 'fila-caixa' },
                { titulo: 'Controle de Caixa', acao: 'caixa' },
                { titulo: 'Relatório de Comissões', acao: 'relatorio-comissoes' },
                { titulo: 'CRM de Revisões', acao: 'revisoes' }
            ]
        },
        {
            id: 'estoque', titulo: 'Estoque & Compras', icone: <Package size={20} />,
            submenus: [
                { titulo: 'Buscar Peças', acao: 'estoque' },
                { titulo: 'Marcas', acao: 'marcas' },
                { titulo: 'Categorias', acao: 'categorias' },
                { titulo: 'Gerador de Etiquetas', acao: 'etiquetas' },
                { titulo: 'Ajuste de Estoque', acao: 'ajuste_estoque' },
                { titulo: 'Importar NF-e (XML)', acao: 'compras' },
                { titulo: 'Previsão de Compras', acao: 'previsao' },
                { titulo: 'Relatório de Faltas', acao: 'faltas' }
            ]
        },
        {
            id: 'financeiro', titulo: 'Financeiro', icone: <DollarSign size={20} />,
            submenus: [
                { titulo: 'Contas a Pagar', acao: 'contas-pagar' },
                { titulo: 'Contas a Receber', acao: 'contas-receber' },
                { titulo: 'Contas Bancárias', acao: 'bancos' },
                { titulo: 'Conciliação Bancária', acao: 'conciliacao' },
                { titulo: 'Plano de Contas', acao: 'plano-contas' },
                { titulo: 'Resultado (DRE)', acao: 'dre' },
                { titulo: 'Recibo Avulso', acao: 'recibo-avulso' }
            ]
        },
        {
            id: 'cadastros', titulo: 'Administrativo', icone: <Users size={20} />,
            submenus: [
                { titulo: 'Clientes & Fornecedores', acao: 'parceiros' },
                { titulo: 'Tabela de Mão de Obra', acao: 'servicos' },
                { titulo: 'Equipe e Acessos', acao: 'usuarios' },
                { titulo: 'Auditoria de Sistema', acao: 'auditoria' },
                { titulo: 'Fiscal / NCM', acao: 'fiscal' },
                { titulo: 'Regras Fiscais (NF-e)', acao: 'regras-fiscais' },
                { titulo: 'Gerenciador de NF-e', acao: 'gerenciador-nfe' },
                { titulo: 'Emitir NF-e Avulsa', acao: 'emitir-nfe-avulsa' }
            ]
        },
        { id: 'configuracoes', titulo: 'Configurações', icone: <Settings size={20} />, acao: 'configuracoes' },
        { id: 'manual', titulo: 'Manual do Usuário', icone: <HelpCircle size={20} />, acao: 'manual' }
    ];

    // 🚀 INCLUÍDO AQUI TAMBÉM
    const rotasLivres = ['manual', 'listagem-os', 'os'];

    const menusFiltrados = menus.map(menu => {
        if (menu.submenus) {
            const submenusPermitidos = menu.submenus.filter(sub =>
                permissoesUsuario.includes(sub.acao) || rotasLivres.includes(sub.acao)
            );
            if (submenusPermitidos.length > 0) return { ...menu, submenus: submenusPermitidos };
            return null;
        }

        if (rotasLivres.includes(menu.acao) || permissoesUsuario.includes(menu.acao)) {
            return menu;
        }
        return null;
    }).filter(menu => menu !== null);

    return (
        <aside
            className={`${isRetratil ? 'w-20' : 'w-72'} bg-slate-900 text-white h-screen flex flex-col shadow-2xl transition-all duration-300 z-50 relative`}
        >
            <button
                onClick={() => setIsRetratil(!isRetratil)}
                className="absolute -right-3 top-8 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-slate-900 z-50 transition-colors"
                title={isRetratil ? "Expandir Menu" : "Recolher Menu"}
            >
                {isRetratil ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={`p-6 border-b border-slate-800 flex items-center transition-all ${isRetratil ? 'justify-center px-0' : 'justify-start'}`}>
                {isRetratil ? (
                    <Menu size={28} className="text-blue-400" />
                ) : (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 truncate uppercase">
                            {nomeEmpresa}
                        </h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Powered by STM Sistemas
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar overflow-x-hidden">
                {menusFiltrados.map((menu, indexOuter) => (
                    <div key={menu.id || indexOuter} className="relative group">
                        {menu.submenus ? (
                            <>
                                <button
                                    onClick={() => toggleMenu(menu.id)}
                                    title={isRetratil ? menu.titulo : ""}
                                    className={`w-full flex items-center p-3 rounded-xl transition-all font-bold ${
                                        menuExpandido === menu.id || menu.submenus.some(sub => sub.acao === paginaAtiva)
                                            ? 'bg-slate-800 text-blue-400'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } ${isRetratil ? 'justify-center' : 'justify-between'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {menu.icone}
                                        {!isRetratil && <span className="truncate">{menu.titulo}</span>}
                                    </div>
                                    {!isRetratil && (menuExpandido === menu.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                                </button>

                                {isRetratil && (
                                    <div className="absolute left-16 top-0 hidden group-hover:block bg-slate-800 text-white p-2 rounded-lg shadow-xl z-50 w-48 border border-slate-700">
                                        <p className="text-xs font-black text-blue-400 mb-2 px-2 uppercase">{menu.titulo}</p>
                                        {menu.submenus.map((sub, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPaginaAtiva(sub.acao)}
                                                className={`w-full text-left p-2 rounded text-xs font-semibold hover:bg-slate-700 transition-colors ${paginaAtiva === sub.acao ? 'text-white' : 'text-slate-400'}`}
                                            >
                                                {sub.titulo}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!isRetratil && menuExpandido === menu.id && (
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
                                                <span className={`${paginaAtiva === sub.acao ? 'ml-1' : 'ml-3'} truncate`}>{sub.titulo}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setPaginaAtiva(menu.acao);
                                    if(isRetratil) setIsRetratil(false);
                                }}
                                title={isRetratil ? menu.titulo : ""}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${
                                    paginaAtiva === menu.acao
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                } ${isRetratil ? 'justify-center' : ''}`}
                            >
                                {menu.icone}
                                {!isRetratil && <span className="truncate">{menu.titulo}</span>}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className={`p-4 border-t border-slate-800 bg-slate-900 transition-all ${isRetratil ? 'flex flex-col items-center gap-4 px-0' : ''}`}>
                <div className={`flex items-center ${isRetratil ? 'justify-center' : 'justify-between'} w-full`}>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                            {usuarioLogado?.nome?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        {!isRetratil && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{usuarioLogado?.nome?.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Usuário Logado</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onLogout}
                        className={`p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors ${isRetratil ? 'mt-2' : ''}`}
                        title="Sair do Sistema"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
};