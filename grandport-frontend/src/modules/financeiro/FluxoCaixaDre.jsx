import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    PieChart, TrendingUp, TrendingDown, DollarSign,
    Calendar, Target, Printer, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FluxoCaixaDre = () => {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // 🚀 Estado para guardar o nome oficial da empresa
    const [nomeEmpresa, setNomeEmpresa] = useState('Carregando Empresa...');

    const carregarDre = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/financeiro/dre?mesAno=${mesAno}`);
            setDados(res.data);
        } catch (error) {
            toast.error("Erro ao calcular lucratividade.");
        } finally {
            setLoading(false);
        }
    };

    // 🚀 Função corrigida para bater na rota exata do seu Controller Java
    const carregarConfiguracoes = async () => {
        try {
            // A rota correta do seu ConfiguracaoController
            const res = await api.get('/api/configuracoes');

            // O seu Java devolve o objeto ConfiguracaoSistema inteiro
            // Vamos procurar as chaves mais prováveis de ter o nome da empresa
            const nomeAPI = res.data?.nomeFantasia || res.data?.razaoSocial || res.data?.nomeEmpresa;

            if (nomeAPI) {
                setNomeEmpresa(nomeAPI);
                return;
            }
        } catch (error) {
            console.log("Erro ao buscar da API, tentando cache local...");
        }

        // Fallback para o cache ou nome padrão
        const nomeCache = localStorage.getItem('nomeEmpresa')
            || localStorage.getItem('nomeFantasia');

        setNomeEmpresa(nomeCache || "GrandPort Auto Peças");
    };

    useEffect(() => {
        carregarDre();
        carregarConfiguracoes();
    }, [mesAno]);

    // =======================================================================
    // 🚀 IMPRESSÃO DO RELATÓRIO OFICIAL
    // =======================================================================
    const imprimirRelatorio = () => {
        const printWindow = window.open('', '_blank');

        const [ano, mes] = mesAno.split('-');
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesExtenso = `${meses[parseInt(mes) - 1]} de ${ano}`;

        const receitaLiquida = dados.receitaBruta - dados.devolucoesDescontos;
        const lucroBruto = receitaLiquida - dados.cmv;
        const totalDespesas = Object.values(dados.despesasOperacionais || {}).reduce((a, b) => a + b, 0);
        const lucroLiquido = lucroBruto - totalDespesas;
        const margemLiquida = dados.receitaBruta > 0 ? ((lucroLiquido / dados.receitaBruta) * 100).toFixed(1) : 0;

        const format = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let despesasHtml = '';
        Object.entries(dados.despesasOperacionais || {}).forEach(([nome, valor]) => {
            despesasHtml += `
                <div class="row">
                    <span class="ident padding-left">${nome.toUpperCase()}</span>
                    <span>${format(valor)}</span>
                </div>
            `;
        });

        if (Object.keys(dados.despesasOperacionais || {}).length === 0) {
            despesasHtml = `<div class="row"><span class="ident padding-left italic">Nenhuma despesa no período</span><span>R$ 0,00</span></div>`;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>DRE - ${mesExtenso}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; }
                    .header p { margin: 0; color: #666; font-size: 14px; }
                    .dre-container { width: 100%; border: 1px solid #ccc; border-collapse: collapse; }
                    .row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
                    .row.title { background: #f8f9fa; font-weight: bold; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
                    .row.total { font-weight: bold; font-size: 16px; background: #eef2f5;}
                    .row.result { font-weight: bold; font-size: 18px; background: ${lucroLiquido >= 0 ? '#e6f4ea' : '#fdeded'}; border: 2px solid ${lucroLiquido >= 0 ? '#28a745' : '#dc3545'}; }
                    .ident { color: #555; }
                    .padding-left { padding-left: 20px; }
                    .text-right { text-align: right; }
                    .italic { font-style: italic; }
                    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Demonstração do Resultado do Exercício (DRE)</h1>
                    <p>Empresa: <strong>${nomeEmpresa}</strong></p>
                    <p>Período de Apuração: <strong>${mesExtenso}</strong></p>
                </div>

                <div class="dre-container">
                    <div class="row title">
                        <span>(+) RECEITA BRUTA DE VENDAS</span>
                        <span>${format(dados.receitaBruta)}</span>
                    </div>
                    <div class="row">
                        <span class="ident">(-) Devoluções e Descontos</span>
                        <span>${format(dados.devolucoesDescontos)}</span>
                    </div>
                    <div class="row total">
                        <span>(=) RECEITA LÍQUIDA</span>
                        <span>${format(receitaLiquida)}</span>
                    </div>

                    <div class="row mt-10">
                        <span class="ident">(-) CMV (Custo da Mercadoria Vendida)</span>
                        <span>${format(dados.cmv)}</span>
                    </div>
                    <div class="row total">
                        <span>(=) LUCRO BRUTO</span>
                        <span>${format(lucroBruto)}</span>
                    </div>

                    <div class="row title mt-10">
                        <span>(-) DESPESAS OPERACIONAIS</span>
                        <span></span>
                    </div>
                    ${despesasHtml}
                    <div class="row total">
                        <span>(=) Total de Despesas</span>
                        <span>${format(totalDespesas)}</span>
                    </div>

                    <div class="row result mt-20">
                        <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO (Margem: ${margemLiquida}%)</span>
                        <span>${format(lucroLiquido)}</span>
                    </div>
                </div>

                <div class="footer">
                    Gerado pelo Sistema ${nomeEmpresa} em ${new Date().toLocaleString('pt-BR')}
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400"><Loader2 className="animate-spin mr-2" size={32}/> CALCULANDO LUCRATIVIDADE...</div>;
    if (!dados) return <div className="p-8 text-center text-red-500 font-bold">Erro ao carregar dados do DRE.</div>;

    const receitaLiquida = dados.receitaBruta - dados.devolucoesDescontos;
    const lucroBruto = receitaLiquida - dados.cmv;
    const totalDespesas = Object.values(dados.despesasOperacionais || {}).reduce((acc, val) => acc + val, 0);
    const lucroLiquido = lucroBruto - totalDespesas;
    const margemLiquida = dados.receitaBruta > 0 ? (lucroLiquido / dados.receitaBruta) * 100 : 0;

    const formatCurrency = (val) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in pb-24">

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <PieChart className="text-blue-600 bg-blue-100 p-2 rounded-xl" size={40} />
                        Resultados e DRE
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Acompanhe a saúde financeira da sua empresa.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex-1 md:flex-none">
                        <Calendar className="text-blue-600 ml-2" size={20} />
                        <input
                            type="month"
                            value={mesAno}
                            onChange={(e) => setMesAno(e.target.value)}
                            className="p-2 outline-none font-black text-slate-700 bg-transparent cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={imprimirRelatorio}
                        className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg transition-transform transform hover:-translate-y-1"
                    >
                        <Printer size={20}/> IMPRIMIR
                    </button>
                </div>
            </div>

            {/* PLACARES RESUMIDOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><TrendingUp size={100}/></div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Faturamento Bruto
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(dados.receitaBruta)}</h2>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><TrendingDown size={100}/></div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Saídas (Custo + Despesa)
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(dados.cmv + totalDespesas)}</h2>
                </div>

                <div className={`p-8 rounded-3xl shadow-xl text-white relative overflow-hidden transition-colors ${lucroLiquido >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign size={120}/></div>
                    <div className="text-xs font-black text-white/80 uppercase tracking-widest flex items-center gap-2 mb-2 relative z-10">
                        Lucro Líquido Real
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter relative z-10">{formatCurrency(lucroLiquido)}</h2>
                    <div className="mt-4 relative z-10">
                        <span className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                            Margem: {margemLiquida.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* TABELA DRE CASCATA */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                        <Target size={20} className="text-blue-500"/> DRE Detalhado (Cascata)
                    </h3>
                </div>

                <div className="p-8 md:p-12 font-mono">
                    <div className="space-y-2">

                        {/* RECEITAS */}
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl text-green-800 border border-green-100">
                            <span className="font-black text-lg">(+) RECEITA BRUTA DE VENDAS</span>
                            <span className="font-black text-xl tracking-tighter">{formatCurrency(dados.receitaBruta)}</span>
                        </div>

                        <div className="flex justify-between items-center px-6 py-3 text-red-500 font-bold border-b border-dashed border-slate-200">
                            <span>(-) Devoluções e Descontos Concedidos</span>
                            <span>{formatCurrency(dados.devolucoesDescontos)}</span>
                        </div>

                        <div className="flex justify-between items-center p-4 text-slate-800 font-black text-xl bg-slate-50 rounded-xl border border-slate-200 mt-2">
                            <span>(=) RECEITA LÍQUIDA</span>
                            <span className="tracking-tighter">{formatCurrency(receitaLiquida)}</span>
                        </div>

                        {/* CUSTOS DIRETOS */}
                        <div className="flex justify-between items-center px-6 py-4 text-orange-600 mt-6 border-l-4 border-orange-400 bg-orange-50/50">
                            <div>
                                <span className="font-black text-lg block">(-) CMV (Custo da Mercadoria Vendida)</span>
                                <span className="text-xs font-sans font-bold opacity-80">Preço de custo pago ao fornecedor pelos produtos vendidos.</span>
                            </div>
                            <span className="font-black text-xl tracking-tighter">{formatCurrency(dados.cmv)}</span>
                        </div>

                        <div className="flex justify-between items-center p-4 text-blue-700 font-black text-xl bg-blue-50 rounded-xl border border-blue-200 mt-2">
                            <span>(=) LUCRO BRUTO (Lucro sobre a venda)</span>
                            <span className="tracking-tighter">{formatCurrency(lucroBruto)}</span>
                        </div>

                        {/* DESPESAS FIXAS/VARIÁVEIS */}
                        <div className="mt-8 pt-6 border-t-2 border-slate-800">
                            <span className="font-black text-lg text-slate-800 px-4 block mb-4">(-) DESPESAS OPERACIONAIS</span>

                            <div className="space-y-1 px-8 text-slate-600 font-bold text-sm">
                                {Object.entries(dados.despesasOperacionais || {}).map(([nome, valor]) => (
                                    <div key={nome} className="flex justify-between border-b border-slate-100 py-2 hover:bg-slate-50 transition-colors px-4 rounded-lg">
                                        <span className="uppercase">{nome}</span>
                                        <span>{formatCurrency(valor)}</span>
                                    </div>
                                ))}
                                {Object.keys(dados.despesasOperacionais || {}).length === 0 && (
                                    <p className="text-sm text-slate-400 italic py-4 px-4 bg-slate-50 rounded-xl text-center font-sans">
                                        Nenhuma despesa registrada como PAGA neste mês.
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center px-6 py-4 text-red-600 font-black text-lg bg-red-50 rounded-xl border border-red-200 mt-4">
                                <span>Total de Despesas Operacionais</span>
                                <span className="tracking-tighter">{formatCurrency(totalDespesas)}</span>
                            </div>
                        </div>

                        {/* RESULTADO FINAL */}
                        <div className={`flex justify-between items-center p-8 rounded-3xl mt-8 border-4 shadow-xl ${lucroLiquido >= 0 ? 'bg-green-50 border-green-400 text-green-900' : 'bg-red-50 border-red-400 text-red-900'}`}>
                            <div>
                                <span className="font-black text-2xl md:text-3xl block">(=) RESULTADO LÍQUIDO</span>
                                <span className="text-sm font-sans font-bold opacity-80 uppercase tracking-widest mt-1 block">O que realmente sobrou na empresa</span>
                            </div>
                            <span className="font-black text-4xl md:text-5xl tracking-tighter">{formatCurrency(lucroLiquido)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};