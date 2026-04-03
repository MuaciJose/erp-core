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
    HelpCircle,
    MessageCircle,
    Shield
} from 'lucide-react';
import apiSidebar from '../api/axios';
import { ERP_MODULE_GROUPS, ROTAS_LIVRES_ERP } from '../utils/moduleCatalog';

export const Sidebar = ({ paginaAtiva, setPaginaAtiva, usuarioLogado, onLogout, onOpenPlatformConsole }) => {
    const [menuExpandido, setMenuExpandido] = useState('vendas');
    const [isRetratil, setIsRetratil] = useState(false);
    const [nomeEmpresa, setNomeEmpresa] = useState('GRANDPORT ERP');
    const [resumoAgenda, setResumoAgenda] = useState(null);
    const [contadorAtendimento, setContadorAtendimento] = useState(0);

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

    useEffect(() => {
        const carregarResumoAgenda = async () => {
            try {
                const hoje = new Date().toISOString().slice(0, 10);
                const res = await apiSidebar.get('/api/agenda/resumo', { params: { data: hoje } });
                setResumoAgenda(res.data || null);
            } catch (err) {
                console.log("Não foi possível carregar o resumo da agenda na sidebar.", err);
            }
        };

        carregarResumoAgenda();
        const intervalo = window.setInterval(carregarResumoAgenda, 120000);
        return () => window.clearInterval(intervalo);
    }, []);

    useEffect(() => {
        const carregarPendenciasAtendimento = async () => {
            try {
                const res = await apiSidebar.get('/api/atendimentos/meus');
                const lista = Array.isArray(res.data) ? res.data : [];
                setContadorAtendimento(lista.filter((item) => item.status === 'AGUARDANDO_CLIENTE').length);
            } catch (err) {
                setContadorAtendimento(0);
            }
        };

        carregarPendenciasAtendimento();
        const intervalo = window.setInterval(carregarPendenciasAtendimento, 120000);
        return () => window.clearInterval(intervalo);
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
    const isPlatformAdmin = usuarioLogado?.tipoAcesso === 'PLATFORM_ADMIN';
    const isTenantAdmin = usuarioLogado?.tipoAcesso === 'TENANT_ADMIN';

    const iconMap = {
        dashboard: <LayoutDashboard size={20} />,
        vendas: <ShoppingCart size={20} />,
        crm: <MessageCircle size={20} />,
        estoque: <Package size={20} />,
        financeiro: <DollarSign size={20} />,
        administrativo: <Users size={20} />,
        configuracoes: <Settings size={20} />,
        manual: <HelpCircle size={20} />
    };

    const menus = ERP_MODULE_GROUPS.map((grupo) => {
        if (grupo.telas) {
            return {
                id: grupo.id,
                titulo: grupo.titulo,
                icone: iconMap[grupo.icone],
                submenus: grupo.telas.map((item) => ({
                    titulo: item.menuTitulo || item.nome,
                    acao: item.acao,
                    permissao: item.permissao,
                    platformOnly: item.platformOnly
                }))
            };
        }

        return {
            id: grupo.id,
            titulo: grupo.titulo,
            icone: iconMap[grupo.icone],
            acao: grupo.acao
        };
    });

    const menusFiltrados = menus.map(menu => {
        if (menu.submenus) {
            // Verifica se o usuário tem permissão para alguma tela do submenu
            const submenusPermitidos = menu.submenus.filter(sub => {
                if (sub.platformOnly) return isPlatformAdmin;
                if (isTenantAdmin) return true;
                return permissoesUsuario.includes(sub.permissao || sub.acao) || ROTAS_LIVRES_ERP.includes(sub.acao);
            });
            // Se tiver pelo menos um submenu liberado, renderiza o menu principal
            if (submenusPermitidos.length > 0) return { ...menu, submenus: submenusPermitidos };
            return null;
        }

        // Menus sem submenus (Dashboard, Config, Manual)
        if (isTenantAdmin || ROTAS_LIVRES_ERP.includes(menu.acao) || permissoesUsuario.includes(menu.acao)) {
            return menu;
        }
        return null;
    }).filter(menu => menu !== null);

    const contadorAgenda = resumoAgenda ? ((resumoAgenda.atrasados || 0) > 0 ? resumoAgenda.atrasados : (resumoAgenda.hoje || 0)) : 0;

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
                {isPlatformAdmin && !isRetratil && (
                    <button
                        onClick={onOpenPlatformConsole}
                        className="w-full mb-3 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-left text-white transition hover:bg-blue-500/20"
                    >
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-blue-300" />
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">Plataforma</div>
                                <div className="text-sm font-black">Voltar ao Console SaaS</div>
                            </div>
                        </div>
                    </button>
                )}
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
                                                {sub.acao === 'agenda' && contadorAgenda > 0 && (
                                                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                        (resumoAgenda?.atrasados || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {contadorAgenda}
                                                    </span>
                                                )}
                                                {sub.acao === 'atendimento' && contadorAtendimento > 0 && (
                                                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                                                        {contadorAtendimento}
                                                    </span>
                                                )}
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
