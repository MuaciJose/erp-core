import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Calendar, Users } from 'lucide-react';
// --- 🚀 IMPORTAÇÃO DO TOAST ---
import toast from 'react-hot-toast';

export const RelatorioComissoes = () => {
    const [datas, setDatas] = useState({ inicio: '', fim: '' });
    const [vendedorSelecionado, setVendedorSelecionado] = useState('');

    const [dados, setDados] = useState([]);
    const [equipe, setEquipe] = useState([]);
    const [loading, setLoading] = useState(false);
    const [empresa, setEmpresa] = useState({ nomeFantasia: 'Carregando...', razaoSocial: '', cnpj: '' });

    useEffect(() => {
        const carregarDadosIniciais = async () => {
            try {
                const [resEmpresa, resEquipe] = await Promise.all([
                    api.get('/api/configuracoes'),
                    api.get('/api/usuarios')
                ]);
                setEmpresa(resEmpresa.data);
                setEquipe(resEquipe.data);
            } catch (error) {
                console.error("Erro ao carregar dados iniciais", error);
                toast.error("Erro ao carregar dados da empresa/equipe.");
            }
        };
        carregarDadosIniciais();
    }, []);

    const gerarRelatorio = async () => {
        if (!datas.inicio || !datas.fim) {
            toast.error("Selecione o período de início e fim.");
            return;
        }

        const idToast = toast.loading("Buscando comissões no servidor...");
        setLoading(true);
        try {
            let url = `/api/vendas/relatorios/comissoes?inicio=${datas.inicio}&fim=${datas.fim}`;

            if (vendedorSelecionado) {
                url += `&vendedorId=${vendedorSelecionado}`;
            }

            const res = await api.get(url);
            setDados(res.data);

            if (res.data.length === 0) {
                toast.dismiss(idToast);
                toast("Nenhum registro encontrado para este período.", { icon: 'ℹ️' });
            } else {
                toast.success("Relatório gerado com sucesso!", { id: idToast });
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar dados. Verifique sua conexão.", { id: idToast });
        } finally {
            setLoading(false);
        }
    };

    const formatarData = (dataStr) => {
        if (!dataStr) return '__/__/____';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* FILTROS - Somente visíveis na tela */}
            <div className="print:hidden bg-white p-6 rounded-3xl shadow-sm border mb-8 flex flex-col md:flex-row items-end gap-6">

                {/* CAMPO: DATAS */}
                <div className="flex-1">
                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 mb-2">
                        <Calendar size={14}/> Período do Relatório
                    </label>
                    <div className="flex gap-2">
                        <input type="date" className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                               onChange={(e) => setDatas({...datas, inicio: e.target.value})} />
                        <input type="date" className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                               onChange={(e) => setDatas({...datas, fim: e.target.value})} />
                    </div>
                </div>

                {/* CAMPO: VENDEDOR */}
                <div className="w-full md:w-64">
                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 mb-2">
                        <Users size={14}/> Filtrar Vendedor
                    </label>
                    <select
                        className="w-full p-3 bg-slate-50 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                        value={vendedorSelecionado}
                        onChange={(e) => setVendedorSelecionado(e.target.value)}
                    >
                        <option value="">Todos os Vendedores</option>
                        {equipe.map(user => (
                            <option key={user.id} value={user.id}>{user.nome}</option>
                        ))}
                    </select>
                </div>

                <button onClick={gerarRelatorio} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-black transition-all">
                    {loading ? 'PROCESSANDO...' : 'GERAR RELATÓRIO'}
                </button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                    <Printer size={20}/> IMPRIMIR
                </button>
            </div>

            {/* ÁREA DE IMPRESSÃO */}
            <div className="bg-white p-10 print:p-0">

                {/* CABEÇALHO DO RELATÓRIO */}
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {empresa.nomeFantasia ? empresa.nomeFantasia.toUpperCase() : 'NOME DA EMPRESA'}
                        </h1>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">Relatório Consolidado de Comissões</p>
                        {empresa.cnpj && <p className="text-xs text-slate-400 mt-1 font-semibold">CNPJ: {empresa.cnpj}</p>}
                    </div>
                    <div className="text-right text-xs font-bold text-slate-400">
                        <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                        <p>Período: {formatarData(datas.inicio)} até {formatarData(datas.fim)}</p>
                    </div>
                </div>

                {dados.length === 0 ? (
                    <p className="text-center py-20 text-slate-400 font-bold italic border-2 border-dashed rounded-3xl">
                        Nenhum dado encontrado. Ajuste os filtros e clique em Gerar Relatório.
                    </p>
                ) : (
                    dados.map((vendedor) => (
                        <div key={vendedor.vendedorNome} className="mb-12 break-inside-avoid">
                            {/* CABEÇALHO DO VENDEDOR */}
                            <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                    Vendedor: {vendedor.vendedorNome}
                                </h2>
                                <div className="flex gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Vendido</p>
                                        <p className="font-black text-slate-900">R$ {vendedor.valorTotalVendido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                    </div>
                                    <div className="text-right border-l-2 border-slate-200 pl-6">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Comissão Total</p>
                                        <p className="font-black text-blue-600 text-lg">R$ {vendedor.totalComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TABELA DE DETALHES */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="py-2 text-[10px] font-black uppercase text-slate-400">ID Venda</th>
                                    <th className="py-2 text-[10px] font-black uppercase text-slate-400">Data/Hora</th>
                                    <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right">Valor Venda</th>
                                    <th className="py-2 text-[10px] font-black uppercase text-slate-400 text-right">Comissão Gerada</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vendedor.vendasDetalhes.map(venda => (
                                    <tr key={venda.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-2 font-bold text-slate-700">#{venda.id}</td>
                                        <td className="py-2 text-sm text-slate-500">{new Date(venda.data).toLocaleDateString('pt-BR')}</td>
                                        <td className="py-2 text-right font-bold text-slate-700">R$ {venda.total.toFixed(2)}</td>
                                        <td className="py-2 text-right font-black text-blue-600">R$ {venda.comissao.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}

                {/* RODAPÉ DO DOCUMENTO */}
                <div className="mt-20 border-t-2 border-slate-900 pt-8 flex justify-between items-center break-inside-avoid">
                    <div className="w-64 border-t border-slate-300 text-center pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assinatura do Responsável</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-900 uppercase">{empresa.razaoSocial || empresa.nomeFantasia || 'SISTEMA ERP'}</p>
                        <p className="text-[10px] font-bold text-slate-400">Documento Interno - {new Date().getFullYear()}</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .shadow-sm { box-shadow: none !important; }
                    @page { margin: 1cm; }
                }
            `}} />
        </div>
    );
};