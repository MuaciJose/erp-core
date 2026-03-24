import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Ajuste o caminho da sua API se necessário
import { TrendingUp, Package, BarChart3, Search, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const CurvaABC = () => {
    const [loading, setLoading] = useState(true);
    const [dadosABC, setDadosABC] = useState([]);
    const [busca, setBusca] = useState('');

    const CORES = {
        A: '#10b981', // Verde (Alta Importância)
        B: '#3b82f6', // Azul (Média Importância)
        C: '#f59e0b'  // Laranja (Baixa Importância)
    };

    useEffect(() => {
        carregarCurvaABC();
    }, []);

    const carregarCurvaABC = async () => {
        setLoading(true);
        try {
            // 🚀 LIGAÇÃO DIRETA COM O BACKEND JAVA:
            const res = await api.get('/api/relatorios/curva-abc');
            setDadosABC(res.data);
            setLoading(false);



        } catch (error) {
            console.error("Erro ao carregar Curva ABC", error);
            setLoading(false);
        }
    };

    // Resumo para os Cards Superiores
    const totais = {
        A: dadosABC.filter(i => i.classe === 'A').length,
        B: dadosABC.filter(i => i.classe === 'B').length,
        C: dadosABC.filter(i => i.classe === 'C').length,
        valorTotal: dadosABC.reduce((acc, curr) => acc + curr.valorTotal, 0)
    };

    // Dados para o Gráfico de Pizza
    const dadosGrafico = [
        { name: 'Classe A (80% da Receita)', value: dadosABC.filter(i => i.classe === 'A').reduce((acc, curr) => acc + curr.valorTotal, 0) },
        { name: 'Classe B (15% da Receita)', value: dadosABC.filter(i => i.classe === 'B').reduce((acc, curr) => acc + curr.valorTotal, 0) },
        { name: 'Classe C (5% da Receita)', value: dadosABC.filter(i => i.classe === 'C').reduce((acc, curr) => acc + curr.valorTotal, 0) },
    ];

    // 🚀 BUSCA INTELIGENTE: Procura por Nome, SKU ou Referência Cruzada
    const itensFiltrados = dadosABC.filter(item => {
        const termoBusca = busca.toLowerCase();
        const nomeMatch = item.nome?.toLowerCase().includes(termoBusca);
        const skuMatch = item.sku?.toLowerCase().includes(termoBusca);
        const refMatch = item.referenciaOriginal?.toLowerCase().includes(termoBusca);

        return nomeMatch || skuMatch || refMatch;
    });

    // 🚀 MOTOR DE EXPORTAÇÃO PARA EXCEL (CSV)
    const exportarCSV = () => {
        if (itensFiltrados.length === 0) {
            alert("Não há dados para exportar!");
            return;
        }

        // Cabeçalhos das colunas (Separados por ponto e vírgula para o Excel BR)
        const cabecalhos = ["SKU;Produto;Ref. Original;Qtd Vendida;Faturamento (R$);% Acumulado;Classe"];

        // Monta cada linha da tabela
        const linhas = itensFiltrados.map(item => {
            return [
                item.sku || "",
                `"${item.nome || ""}"`, // Aspas evitam que vírgulas no nome quebrem a planilha
                `"${item.referenciaOriginal || ""}"`,
                item.qtdVendida,
                item.valorTotal.toFixed(2).replace('.', ','), // Formato de moeda BR
                item.percAcumulado.toFixed(2).replace('.', ','),
                item.classe
            ].join(";");
        });

        // Junta tudo num arquivo de texto (com BOM UTF-8 para aceitar acentos)
        const csvString = "\uFEFF" + cabecalhos.concat(linhas).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Cria um link invisível, clica nele e depois destrói
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Relatorio_Curva_ABC_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse mt-20">
            <BarChart3 size={48} className="mb-4 text-blue-500" />
            <p className="font-bold tracking-widest uppercase text-sm">Calculando Curva de Faturamento...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-blue-600 bg-blue-100 p-1.5 rounded-xl" size={40} />
                        CURVA ABC DE PRODUTOS
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Análise de rentabilidade e importância dos itens no estoque.</p>
                </div>
                <button
                    onClick={exportarCSV}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Download size={18} /> EXPORTAR RELATÓRIO
                </button>
            </div>

            {/* CARDS DE RESUMO (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Analisado</span>
                    <span className="text-3xl font-black text-slate-800">R$ {totais.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30 shrink-0">A</div>
                    <div>
                        <span className="text-2xl font-black text-emerald-700">{totais.A}</span>
                        <span className="text-xs font-bold text-emerald-600 block uppercase tracking-wide">Produtos</span>
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30 shrink-0">B</div>
                    <div>
                        <span className="text-2xl font-black text-blue-700">{totais.B}</span>
                        <span className="text-xs font-bold text-blue-600 block uppercase tracking-wide">Produtos</span>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30 shrink-0">C</div>
                    <div>
                        <span className="text-2xl font-black text-amber-700">{totais.C}</span>
                        <span className="text-xs font-bold text-amber-600 block uppercase tracking-wide">Produtos</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LISTA DE PRODUTOS (TABELA) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-black text-lg text-slate-800 flex items-center gap-2"><Package size={20} className="text-slate-400"/> Ranking de Faturamento</h2>
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="Buscar produto, SKU ou Ref. Cruzada..."  // 🚀 ATUALIZADO
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                            />
                            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">SKU / Produto</th>
                                <th className="p-4 text-center">Qtd Vendida</th>
                                <th className="p-4 text-right">Faturamento (R$)</th>
                                <th className="p-4 text-center">% Acumulado</th>
                                <th className="p-4 pr-6 text-center">Classe</th>
                            </tr>
                            </thead>
                            <tbody>
                            {itensFiltrados.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-300 w-4">{index + 1}º</span>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.nome}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-600">{item.qtdVendida} un</td>
                                    <td className="p-4 text-right font-black text-slate-800">R$ {item.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold text-slate-500">{item.percAcumulado.toFixed(1)}%</span>
                                    </td>
                                    <td className="p-4 pr-6 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-white shadow-sm
                                                ${item.classe === 'A' ? 'bg-emerald-500' : item.classe === 'B' ? 'bg-blue-500' : 'bg-amber-500'}
                                            `}>
                                                {item.classe}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {itensFiltrados.length === 0 && (
                            <div className="p-8 text-center text-slate-500 font-bold">Nenhum produto encontrado.</div>
                        )}
                    </div>
                </div>

                {/* GRÁFICO LATERAL */}
                <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-6 flex flex-col relative overflow-hidden">

                    <h2 className="font-black text-lg text-white flex items-center gap-2 mb-2 relative z-10">
                        Distribuição Financeira
                    </h2>
                    <p className="text-slate-400 text-xs font-medium mb-6 relative z-10">Representatividade de cada classe na receita total.</p>

                    <div className="flex-1 min-h-[250px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dadosGrafico}
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dadosGrafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={Object.values(CORES)[index % 3]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 mt-4 relative z-10">
                        <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span className="text-slate-300">Classe A (80%)</span></div>
                            <span className="text-emerald-400">Alto Retorno</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> <span className="text-slate-300">Classe B (15%)</span></div>
                            <span className="text-blue-400">Intermediários</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-3 rounded-xl">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> <span className="text-slate-300">Classe C (5%)</span></div>
                            <span className="text-amber-400">Baixo Giro</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};