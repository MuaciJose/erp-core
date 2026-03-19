import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Calendar, Users, Wrench, Package, Info, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const RelatorioComissoes = () => {
    const [datas, setDatas] = useState({ inicio: '', fim: '' });
    const [vendedorSelecionado, setVendedorSelecionado] = useState('');

    const [dadosCalculados, setDadosCalculados] = useState([]);
    const [equipe, setEquipe] = useState([]);
    const [configuracaoGlobal, setConfiguracaoGlobal] = useState(null);
    const [empresa, setEmpresa] = useState({ nomeFantasia: 'Carregando...', razaoSocial: '', cnpj: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const carregarDadosIniciais = async () => {
            try {
                const [resEmpresa, resEquipe] = await Promise.all([
                    api.get('/api/configuracoes'),
                    api.get('/api/usuarios')
                ]);
                const configData = Array.isArray(resEmpresa.data) ? resEmpresa.data[0] : resEmpresa.data;
                setEmpresa(configData);
                setConfiguracaoGlobal(configData);
                setEquipe(resEquipe.data);
            } catch (error) {
                toast.error("Erro ao carregar dados da empresa/equipe.");
            }
        };
        carregarDadosIniciais();
    }, []);

    // =========================================================================
    // 🚀 BATE NA ROTA DO JAVA PARA PEGAR OS DADOS MASTIGADOS
    // =========================================================================
    const gerarRelatorio = async () => {
        if (!datas.inicio || !datas.fim) return toast.error("Selecione o período inicial e final.");

        const idToast = toast.loading("Calculando cascata de comissões no servidor (V8)...");
        setLoading(true);

        try {
            let url = `/api/relatorios/comissoes?inicio=${datas.inicio}&fim=${datas.fim}`;
            if (vendedorSelecionado) {
                url += `&vendedorId=${vendedorSelecionado}`;
            }

            const res = await api.get(url);

            // 🚀 O JAVA AGORA ENTREGA TUDO 100% MASTIGADO E CALCULADO!
            setDadosCalculados(res.data);

            if (res.data.length === 0) {
                toast.error("Nenhuma comissão gerada para os filtros informados.", { id: idToast });
            } else {
                toast.success("Cálculo processado com sucesso!", { id: idToast });
            }
        } catch (error) {
            console.error(error);
            toast.error("Falha de comunicação com o servidor.", { id: idToast });
        } finally {
            setLoading(false);
        }
    };


    // =========================================================================
    // 🚀 O NOVO MOTOR QUE CHAMA O THYMELEAF NO JAVA (PDF BLINDADO)
    // =========================================================================
    const imprimirRelatorioOficial = async () => {
        if (!datas.inicio || !datas.fim) return toast.error("Selecione o período inicial e final.");

        const idToast = toast.loading("Gerando PDF blindado no servidor...");
        try {
            let url = `/api/relatorios/comissoes/pdf?inicio=${datas.inicio}&fim=${datas.fim}`;
            if (vendedorSelecionado) {
                url += `&vendedorId=${vendedorSelecionado}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            window.open(fileURL, '_blank');
            toast.success("Documento gerado com sucesso!", { id: idToast });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar o PDF no servidor.", { id: idToast });
        }
    };

    const formatarData = (dataStr) => {
        if (!dataStr) return '__/__/____';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            {/* CABEÇALHO E FILTROS */}
            <div className="print:hidden mb-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Users className="text-emerald-600 bg-emerald-100 p-1.5 rounded-xl" size={40} />
                        Fechamento de Comissões
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Relatório inteligente com regra de prioridade (Item vs Configuração Padrão).</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Período de Apuração</label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 px-4">
                            <Calendar size={18} className="text-slate-400" />
                            <input type="date" className="bg-transparent font-bold text-slate-700 outline-none w-full" onChange={(e) => setDatas({...datas, inicio: e.target.value})} />
                            <span className="text-slate-300 font-bold">até</span>
                            <input type="date" className="bg-transparent font-bold text-slate-700 outline-none w-full" onChange={(e) => setDatas({...datas, fim: e.target.value})} />
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Filtrar por Colaborador</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500" value={vendedorSelecionado} onChange={(e) => setVendedorSelecionado(e.target.value)}>
                            <option value="">Equipe Completa (Todos)</option>
                            {equipe.map(user => <option key={user.id} value={user.id}>{user.nome}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={gerarRelatorio} disabled={loading} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 tracking-widest text-xs uppercase">
                            {loading ? 'CALCULANDO...' : 'GERAR'}
                        </button>

                        {/* 🚀 BOTÃO VERDE AGORA CHAMA O JAVA (PDF) */}
                        <button onClick={imprimirRelatorioOficial} disabled={dadosCalculados.length === 0} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all">
                            <Printer size={18}/> IMPRIMIR
                        </button>
                    </div>
                </div>
            </div>

            {/* ÁREA DO DOCUMENTO VIRTUAL NA TELA */}
            <div className="bg-white p-12 print:p-0 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:border-none min-h-[500px]">

                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                            {empresa.nomeFantasia ? empresa.nomeFantasia.toUpperCase() : 'NOME DA EMPRESA'}
                        </h1>
                        <p className="font-black text-slate-500 uppercase tracking-widest text-sm mt-1 flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-500"/>
                            Demonstrativo de Comissões
                        </p>
                        {empresa.cnpj && <p className="text-xs text-slate-400 mt-1 font-bold">CNPJ: {empresa.cnpj}</p>}
                    </div>
                    <div className="text-right text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="uppercase tracking-widest mb-1">Período de Apuração</p>
                        <p className="text-sm font-black text-slate-700">{formatarData(datas.inicio)} a {formatarData(datas.fim)}</p>
                        <p className="mt-2 text-[9px]">Calculado em: {new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                {dadosCalculados.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 print:hidden">
                        <Info className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-bold text-lg">Pronto para calcular!</p>
                        <p className="text-slate-400 text-sm mt-1">Selecione as datas acima e clique em Gerar.</p>
                    </div>
                ) : (
                    dadosCalculados.map((membro) => (
                        <div key={membro.id} className="mb-16 break-inside-avoid">

                            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shadow-lg print:bg-slate-100 print:text-slate-900 print:shadow-none print:border-2 print:border-slate-900">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 print:text-slate-500">Colaborador</p>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{membro.nome}</h2>
                                </div>
                                <div className="flex gap-8 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Cálculo</p>
                                        <p className="font-bold text-lg">R$ {membro.totalBase.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                    </div>
                                    <div className="text-right border-l border-slate-700 pl-8 print:border-slate-300">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest print:text-slate-900">Comissão Líquida a Pagar</p>
                                        <p className="font-black text-emerald-400 text-2xl print:text-slate-900">R$ {membro.totalComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24">Doc. Origem</th>
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24">Tipo</th>
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição do Item / Serviço</th>
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Regra Aplicada</th>
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Valor Base</th>
                                    <th className="py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Comissão R$</th>
                                </tr>
                                </thead>
                                <tbody>
                                {membro.detalhes.map((linha, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 font-black text-slate-700 text-xs">{linha.origem}</td>
                                        <td className="py-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center w-max gap-1 ${linha.tipoItem === 'PEÇA' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {linha.tipoItem === 'PEÇA' ? <Package size={10}/> : <Wrench size={10}/>} {linha.tipoItem}
                                                </span>
                                        </td>
                                        <td className="py-3 font-bold text-slate-600 truncate max-w-[200px]" title={linha.descricao}>{linha.descricao}</td>
                                        <td className="py-3">
                                                <span className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1">
                                                    <b className="text-emerald-600 text-xs">{linha.percAplicado}%</b>
                                                    via {linha.tipoRegra}
                                                </span>
                                        </td>
                                        <td className="py-3 text-right font-bold text-slate-500">R$ {linha.valorBase.toFixed(2)}</td>
                                        <td className="py-3 text-right font-black text-emerald-600 bg-emerald-50/30">R$ {linha.valorComissao.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};