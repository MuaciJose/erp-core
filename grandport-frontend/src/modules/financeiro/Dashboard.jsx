import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    DollarSign, TrendingUp, PackageSearch, AlertTriangle,
    Calendar, ArrowRight, Activity, Layers,
    BarChart3, PieChart as PieIcon, Printer,
    CalendarClock, CheckCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { PainelInteligencia } from './PainelInteligencia';
import { getStoredUser } from '../../utils/authStorage';

// 🚀 IMPORTAÇÃO DO BANNER DO PWA
import { InstallPWABanner } from '../../components/InstallPWABanner';

export const Dashboard = ({ setPaginaAtiva }) => {
    const [resumo, setResumo] = useState(null);
    const [agendaHoje, setAgendaHoje] = useState([]);
    const [loading, setLoading] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState('geral');

    // 🚀 ESTADO PARA O NOME DO USUÁRIO
    const [nomeUsuario, setNomeUsuario] = useState('Admin');

    const CORES = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

    const abrirAgendaComFiltro = (filtro) => {
        localStorage.setItem('agenda_quick_filter', filtro);
        setPaginaAtiva('agenda');
    };

    const abrirCriacaoRapidaAgenda = () => {
        const hoje = new Date();
        const dataBase = hoje.toISOString().slice(0, 10);
        localStorage.setItem('agenda_quick_create', JSON.stringify({
            titulo: 'Novo compromisso do dashboard',
            setor: 'COMERCIAL',
            prioridade: 'NORMAL',
            status: 'AGENDADO',
            dataInicio: `${dataBase}T09:00`,
            dataFim: `${dataBase}T09:30`
        }));
        setPaginaAtiva('agenda');
    };

    useEffect(() => {
        const userObj = getStoredUser();
        if (userObj) {
            const nomeCompleto = userObj.nome || userObj.nomeCompleto || 'Admin';
            setNomeUsuario(nomeCompleto.split(' ')[0]);
        }

        const carregarDashboard = async () => {
            try {
                const hoje = new Date().toISOString().slice(0, 10);
                const [resumoRes, agendaRes] = await Promise.all([
                    api.get('/api/dashboard/resumo'),
                    api.get('/api/agenda', { params: { dataInicio: hoje, dataFim: hoje } })
                ]);
                setResumo(resumoRes.data);
                setAgendaHoje((agendaRes.data || []).slice(0, 5));
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        carregarDashboard();
    }, []);

    // =========================================================================
    // 🚀 O NOVO MOTOR DE IMPRESSÃO (Abre nova aba "limpa" estilo Nota Fiscal)
    // =========================================================================
    const handleImprimir = () => {
        // Abre uma aba em branco
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups no seu navegador para gerar o relatório.");
            return;
        }

        const dataAtual = new Date().toLocaleString('pt-BR');

        // Monta as linhas da tabela de produtos do ranking
        const linhasTopProdutos = (resumo?.topProdutos || []).map((prod, index) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #333;">${prod.nome}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${prod.qtd} un</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${(prod.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        // Monta a lista de alertas
        const linhasAlertas = (resumo?.alertas || []).length > 0
            ? (resumo.alertas).map(alerta => `<li style="margin-bottom: 6px;"><strong>[${alerta.tipo}]</strong> ${alerta.msg}</li>`).join('')
            : '<li>Tudo operando normalmente. Nenhum alerta crítico.</li>';

        // Constrói o HTML puro (perfeito para papel A4)
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório Gerencial - Dashboard</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0 auto; max-width: 900px; font-size: 12px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
                    .header h1 { font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; color: #000; }
                    .header p { margin: 5px 0 0; color: #64748b; font-size: 11px; font-weight: bold; }
                    .data-box { text-align: right; font-size: 11px; color: #64748b; font-weight: bold; }
                    
                    .kpi-grid { display: flex; gap: 15px; margin-bottom: 40px; }
                    .kpi-card { flex: 1; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: left; }
                    .kpi-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; margin-bottom: 5px; }
                    .kpi-value { font-size: 24px; font-weight: 900; color: #0f172a; display: block; }
                    .kpi-danger .kpi-title { color: #ef4444; }
                    .kpi-danger .kpi-value { color: #dc2626; }
                    
                    h2 { font-size: 14px; text-transform: uppercase; font-weight: 900; color: #000; border-bottom: 1px solid #000; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 11px; }
                    th { border-bottom: 2px solid #000; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 900; color: #000; }
                    th.center { text-align: center; }
                    th.right { text-align: right; }
                    
                    .alertas-box { border: 1px dashed #94a3b8; padding: 20px; border-radius: 8px; background-color: #f8fafc; }
                    ul { margin: 0; padding-left: 20px; color: #334155; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>RESUMO GERENCIAL E DESEMPENHO</h1>
                        <p>Sistema ERP GrandPort</p>
                    </div>
                    <div class="data-box">
                        Emitido por: ${nomeUsuario}<br/>
                        Em: ${dataAtual}
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <span class="kpi-title">Faturamento Mensal</span>
                        <span class="kpi-value">R$ ${(resumo?.faturamentoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="kpi-card kpi-danger" style="border-color: #fca5a5; background-color: #fef2f2;">
                        <span class="kpi-title">Contas em Atraso</span>
                        <span class="kpi-value">R$ ${(resumo?.receberAtrasado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="kpi-card">
                        <span class="kpi-title">Pedidos Hoje</span>
                        <span class="kpi-value">${resumo?.vendasHoje || 0}</span>
                    </div>
                    <div class="kpi-card">
                        <span class="kpi-title">Peças com Baixo Estoque</span>
                        <span class="kpi-value">${resumo?.produtosBaixoEstoque || 0}</span>
                    </div>
                </div>

                <h2>Curva A - Produtos com Maior Saída</h2>
                <table>
                    <thead>
                        <tr>
                            <th class="center" style="width: 50px;">SKU / POS</th>
                            <th>DESCRIÇÃO DO PRODUTO</th>
                            <th class="center" style="width: 100px;">QTD VENDIDA</th>
                            <th class="right" style="width: 120px;">VALOR UNIT.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasTopProdutos || '<tr><td colspan="4" style="text-align: center; padding: 15px;">Sem dados de vendas recentes.</td></tr>'}
                    </tbody>
                </table>

                <h2>Painel de Alertas e Notificações</h2>
                <div class="alertas-box">
                    <ul>${linhasAlertas}</ul>
                </div>
                
                <script>
                    window.onload = function() { 
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        // Escreve o HTML na aba nova e carrega
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black tracking-widest text-xs uppercase italic">Sincronizando Motores...</p>
            </div>
        </div>
    );

    if (!resumo) return (
        <div className="p-20 text-center flex flex-col items-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Erro de Conexão</h2>
            <p className="text-slate-500">Não foi possível buscar os dados do servidor.</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Tentar Novamente</button>
        </div>
    );

    const dadosVendasSemanal = resumo.vendasSemanal || [
        { name: 'Seg', vendas: 0 }, { name: 'Ter', vendas: 0 },
        { name: 'Qua', vendas: 0 }, { name: 'Qui', vendas: 0 },
        { name: 'Sex', vendas: 0 }, { name: 'Sab', vendas: 0 },
        { name: 'Dom', vendas: 0 },
    ];

    const dadosCategorias = resumo.vendasPorCategoria || [{ name: 'Sem Categoria', value: 100 }];
    const totalCategorias = dadosCategorias.reduce((acc, curr) => acc + curr.value, 0) || 1;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in bg-gray-50/50 min-h-screen">

            {/* 🚀 BANNER DO PWA AQUI NO TOPO */}
            <InstallPWABanner />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 mt-2">
                <div className="text-left">
                    <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">Painel de Controle</span>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Olá, {nomeUsuario}! 👋</h1>
                    <p className="text-slate-500 flex items-center gap-2 mt-2 font-medium">
                        <Calendar size={18} className="text-slate-400" />
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
                    <button onClick={() => setAbaAtiva('geral')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${abaAtiva === 'geral' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-gray-100'}`}>
                        OPERACIONAL
                    </button>
                    <button onClick={() => setAbaAtiva('relatorios')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${abaAtiva === 'relatorios' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-gray-100'}`}>
                        RELATÓRIOS & GRÁFICOS
                    </button>
                </div>
            </div>

            <PainelInteligencia compacto />

            {abaAtiva === 'geral' ? (
                <div className="animate-fade-in">
                    {/* 🚀 4 KPIs PRINCIPAIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 text-left">
                            <div className="flex justify-between items-start mb-6"><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={28} /></div></div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">R$ {(resumo.faturamentoMes || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Receita Mensal</p>
                        </div>

                        <div onClick={() => setPaginaAtiva('contas-receber')} className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 cursor-pointer text-left hover:border-red-200 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6"><div className="p-4 bg-red-50 text-red-600 rounded-2xl"><DollarSign size={28} /></div></div>
                            <h2 className="text-3xl font-black text-red-600 tracking-tighter">R$ {(resumo.receberAtrasado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Em Atraso</p>
                        </div>

                        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 text-left">
                            <div className="flex justify-between items-start mb-6"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><PackageSearch size={28} /></div></div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{resumo.vendasHoje || 0}</h2>
                            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Pedidos Hoje</p>
                        </div>

                        <div onClick={() => setPaginaAtiva('previsao')} className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 cursor-pointer text-left hover:border-orange-200 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><AlertTriangle size={28} /></div></div>
                            <h2 className="text-3xl font-black text-orange-600 tracking-tighter">{resumo.produtosBaixoEstoque || 0}</h2>
                            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Peças em Falta</p>
                        </div>
                    </div>

                    {/* 🚀 NOVO CARD DE DESTAQUE: PÓS-VENDA CRM */}
                    <div className="mb-10 animate-fade-in">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group text-left">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
                                        <CalendarClock className="text-indigo-600" size={26} /> Pós-Venda (CRM)
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Oportunidades de retorno e revisão de veículos</p>
                                </div>
                                <button onClick={() => setPaginaAtiva('revisoes')} className="text-xs font-black text-indigo-700 hover:text-white flex items-center gap-2 bg-indigo-50 hover:bg-indigo-600 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                    VER PAINEL DE CRM <ArrowRight size={16}/>
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 relative z-10">
                                <div onClick={() => setPaginaAtiva('revisoes')} className="flex-1 bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-red-100 hover:shadow-md transition-all">
                                    <AlertTriangle size={24} className="text-red-500 mb-2" />
                                    <span className="text-4xl font-black text-red-600 leading-none mb-1">{resumo?.crmAtrasados || 0}</span>
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.15em]">Revisões Atrasadas</span>
                                </div>

                                <div onClick={() => setPaginaAtiva('crm')} className="flex-1 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-100 hover:shadow-md transition-all">
                                    <CheckCircle size={24} className="text-indigo-500 mb-2" />
                                    <span className="text-4xl font-black text-indigo-600 leading-none mb-1">{resumo?.crmHoje || 0}</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Agendadas para Hoje</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 animate-fade-in">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-left">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl flex items-center gap-3">
                                        <CalendarClock className="text-blue-600" size={24} /> Agenda do Dia
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Compromissos operacionais e comerciais previstos para hoje</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={abrirCriacaoRapidaAgenda} className="text-xs font-black text-emerald-700 hover:text-white flex items-center gap-2 bg-emerald-50 hover:bg-emerald-600 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                        NOVO COMPROMISSO
                                    </button>
                                    <button onClick={() => abrirAgendaComFiltro('atrasados')} className="text-xs font-black text-rose-700 hover:text-white flex items-center gap-2 bg-rose-50 hover:bg-rose-600 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                        VER ATRASADOS
                                    </button>
                                    <button onClick={() => abrirAgendaComFiltro('hoje')} className="text-xs font-black text-blue-700 hover:text-white flex items-center gap-2 bg-blue-50 hover:bg-blue-600 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                        ABRIR AGENDA <ArrowRight size={16}/>
                                    </button>
                                </div>
                            </div>

                            {agendaHoje.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-400">
                                    Nenhum compromisso agendado para hoje.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {agendaHoje.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setPaginaAtiva('agenda')}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-5 py-4 text-left transition-colors"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div>
                                                    <div className="text-base font-black text-slate-800">{item.titulo}</div>
                                                    <div className="mt-1 text-sm font-medium text-slate-500">
                                                        {new Date(item.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        {item.usuarioResponsavelNome ? ` • ${item.usuarioResponsavelNome}` : ''}
                                                        {item.parceiroNome ? ` • ${item.parceiroNome}` : ''}
                                                    </div>
                                                </div>
                                                <div className="text-xs font-black uppercase tracking-wider text-blue-700">
                                                    {item.status}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🚀 TOP PERFORMANCE E LOGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-10">
                                <div><h3 className="font-black text-xl text-slate-800">Top Performance</h3><p className="text-slate-400 text-sm font-medium">Produtos com maior saída</p></div>
                                <button onClick={() => setPaginaAtiva('estoque')} className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all"><ArrowRight size={20} /></button>
                            </div>
                            <div className="space-y-8">
                                {(resumo.topProdutos || []).map((prod, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-4"><span className="text-2xl font-black text-slate-200">0{i + 1}</span><span className="font-black text-slate-700 uppercase tracking-tight">{prod.nome}</span></div>
                                            <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">R$ {(prod.valor || 0).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-100">
                                            <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(prod.qtd / (resumo.topProdutos[0]?.qtd || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Layers size={120} /></div>
                            <h3 className="font-black text-xl text-white mb-8 flex items-center gap-3"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div> LOGS</h3>
                            <div className="space-y-5 relative z-10">
                                {(resumo.alertas || []).map((alerta, i) => (
                                    <div key={i} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-2"><div className={`w-1.5 h-1.5 rounded-full ${alerta.tipo === 'FINANCEIRO' ? 'bg-red-50' : 'bg-orange-500'}`}></div><span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{alerta.tipo}</span></div>
                                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{alerta.msg}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={24}/></div>
                                <div><h3 className="font-black text-xl text-slate-800">Fluxo de Vendas</h3><p className="text-slate-400 text-sm font-medium italic">Vendas brutas realizadas nos últimos 7 dias</p></div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dadosVendasSemanal}>
                                        <defs>
                                            <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                                        <Area type="monotone" dataKey="vendas" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorVendas)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
                            <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-2"><PieIcon className="text-purple-600" /> Mix Categorias</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={dadosCategorias} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {dadosCategorias.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {dadosCategorias.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: CORES[i]}}></div> <span className="text-slate-500 uppercase">{c.name}</span></div>
                                        <span className="text-slate-900">{((c.value/totalCategorias)*100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                        <div className="text-left flex items-center gap-4">
                            <div className="p-4 bg-slate-800 rounded-full text-blue-400">
                                <Printer size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white">Exportar Relatório</h4>
                                <p className="text-slate-400 font-medium">Gere um PDF ou imprima em papel com layout formatado estilo Nota Fiscal.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleImprimir}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-2 tracking-tighter"
                        >
                            IMPRIMIR AGORA <BarChart3 size={20}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
