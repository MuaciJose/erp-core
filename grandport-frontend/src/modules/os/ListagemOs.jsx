import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    Search, LayoutList, Printer, Eye, Clock, User, Car, DollarSign,
    CheckCircle, AlertTriangle, FileText, ChevronRight
} from 'lucide-react';

export const ListagemOs = ({ setPaginaAtiva }) => {
    const [ordens, setOrdens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [empresaConfig, setEmpresaConfig] = useState({ nomeFantasia: 'OFICINA' });

    useEffect(() => {
        const carregarDados = async () => {
            setLoading(true);
            try {
                const [resOs, resConfig] = await Promise.all([
                    api.get('/api/os'),
                    api.get('/api/configuracoes').catch(() => ({ data: { nomeFantasia: 'OFICINA' } }))
                ]);

                // Ordena da mais nova para a mais antiga (ID decrescente)
                const osOrdenadas = resOs.data.sort((a, b) => b.id - a.id);
                setOrdens(osOrdenadas);

                const configData = Array.isArray(resConfig.data) ? resConfig.data[0] : resConfig.data;
                setEmpresaConfig({ nomeFantasia: configData?.nomeFantasia || 'OFICINA' });
            } catch (error) {
                toast.error("Erro ao carregar a lista de OS.");
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, []);

    // 🚀 FILTRO INTELIGENTE (Busca por Nome, Placa, ID ou Status)
    const ordensFiltradas = ordens.filter(os => {
        const termo = busca.toLowerCase();
        const matchBusca =
            os.id.toString().includes(termo) ||
            (os.cliente?.nome || '').toLowerCase().includes(termo) ||
            (os.veiculo?.placa || '').toLowerCase().includes(termo);

        const matchStatus = filtroStatus === 'TODOS' || os.status === filtroStatus;

        return matchBusca && matchStatus;
    });

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const getStatusBadge = (status) => {
        const badges = {
            'ORCAMENTO': <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-slate-200">Orçamento</span>,
            'AGUARDANDO_APROVACAO': <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-yellow-200">Aguard. Aprov.</span>,
            'EM_EXECUCAO': <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-blue-200">Em Execução</span>,
            'AGUARDANDO_PECA': <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-red-200">Aguard. Peça</span>,
            'FINALIZADA': <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-emerald-200">Finalizada</span>,
            'FATURADA': <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest border border-purple-200"><CheckCircle size={10} className="inline mr-1 mb-0.5"/> Faturada</span>,
            'CANCELADA': <span className="bg-slate-800 text-white px-2 py-1 rounded font-black text-[9px] uppercase tracking-widest">Cancelada</span>,
        };
        return badges[status] || badges['ORCAMENTO'];
    };

    // 🚀 IMPRESSÃO RÁPIDA DIRETO DA LISTAGEM
    const imprimirOs = (os) => {
        const toastId = toast.loading(`Gerando impressão da OS #${os.id}...`);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        const nomeVeiculo = os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo} - Placa: ${os.veiculo.placa}` : 'Não informado';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 20px; color: #000; font-size: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                    .header p { margin: 5px 0 0 0; font-size: 14px; }
                    .section-title { background: #eee; padding: 5px; font-weight: bold; text-transform: uppercase; border: 1px solid #ccc; margin-top: 15px; }
                    table { border-collapse: collapse; margin-top: 10px; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                    th { background: #f9f9f9; }
                    .text-right { text-align: right; }
                    .laudo-box { border: 1px solid #000; padding: 15px; margin-top: 5px; background: #fafafa; font-size: 13px; line-height: 1.5; min-height: 50px; }
                    .totals { width: 300px; float: right; margin-top: 20px; border: 1px solid #000; padding: 10px; }
                    .totals p { margin: 5px 0; display: flex; justify-content: space-between; font-weight: bold; }
                    .totals .final { font-size: 16px; border-top: 1px solid #000; padding-top: 5px; }
                    .clear { clear: both; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${empresaConfig.nomeFantasia}</h1>
                    <p>ORDEM DE SERVIÇO Nº ${os.id} - STATUS: ${os.status}</p>
                </div>
                <div class="section-title">Dados do Cliente e Veículo</div>
                <table>
                    <tr><td width="50%"><b>Cliente:</b> ${os.cliente?.nome || 'Não informado'}</td><td width="50%"><b>Veículo:</b> ${nomeVeiculo}</td></tr>
                    <tr><td><b>KM Atual:</b> ${os.kmEntrada || 'N/A'}</td><td><b>Combustível:</b> ${os.nivelCombustivel || 'N/A'}</td></tr>
                </table>
                ${(os.observacoes) ? `<div class="section-title">Parecer Técnico / O Que Foi Feito</div><div class="laudo-box">${os.observacoes.replace(/\n/g, '<br/>')}</div>` : ''}
                ${(os.itensServicos && os.itensServicos.length > 0) ? `
                <div class="section-title">Mão de Obra (Serviços)</div>
                <table>
                    <tr><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Valor Un.</th><th class="text-right">Subtotal</th></tr>
                    ${os.itensServicos.map(s => `<tr><td>${s.servico?.nome || 'Serviço'}</td><td class="text-right">${s.quantidade}</td><td class="text-right">R$ ${formatarMoeda(s.precoUnitario)}</td><td class="text-right">R$ ${formatarMoeda(s.precoUnitario * s.quantidade)}</td></tr>`).join('')}
                </table>` : ''}
                ${(os.itensPecas && os.itensPecas.length > 0) ? `
                <div class="section-title">Peças e Produtos Aplicados</div>
                <table>
                    <tr><th>Código</th><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Valor Un.</th><th class="text-right">Subtotal</th></tr>
                    ${os.itensPecas.map(p => `<tr><td>${p.produto?.sku || ''}</td><td>${p.produto?.nome || 'Peça'}</td><td class="text-right">${p.quantidade}</td><td class="text-right">R$ ${formatarMoeda(p.precoUnitario)}</td><td class="text-right">R$ ${formatarMoeda(p.precoUnitario * p.quantidade)}</td></tr>`).join('')}
                </table>` : ''}
                <div class="totals">
                    <p><span>Subtotal:</span> <span>R$ ${formatarMoeda(os.valorTotal + (os.desconto || 0))}</span></p>
                    ${os.desconto > 0 ? `<p><span>Desconto:</span> <span>- R$ ${formatarMoeda(os.desconto)}</span></p>` : ''}
                    <p class="final"><span>TOTAL A PAGAR:</span> <span>R$ ${formatarMoeda(os.valorTotal)}</span></p>
                </div>
                <div class="clear"></div>
                <div style="margin-top: 50px; text-align: center;"><p>____________________________________________________</p><p>Assinatura do Cliente / De Acordo</p></div>
                <script> window.onload = function() { setTimeout(function() { window.print(); }, 400); } </script>
            </body>
            </html>
        `;
        doc.open(); doc.write(htmlContent); doc.close();
        toast.success("Enviado para a impressora!", { id: toastId });
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 10000);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col animate-fade-in">

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <LayoutList className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={36} />
                        CONSULTA DE OS (HISTÓRICO)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Busque, visualize e reimprima qualquer Ordem de Serviço</p>
                </div>
                <button
                    onClick={() => setPaginaAtiva('os')} // Redireciona para o Kanban/Nova OS
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 uppercase tracking-widest text-sm transition-transform hover:scale-105"
                >
                    Ir para o Kanban de Produção <ChevronRight size={18} />
                </button>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 shrink-0">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por Nº da OS, Nome do Cliente ou Placa..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full p-3 border-2 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="ORCAMENTO">Orçamento</option>
                        <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                        <option value="EM_EXECUCAO">Em Execução</option>
                        <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                        <option value="FINALIZADA">Finalizada (Pronto p/ Entregar)</option>
                        <option value="FATURADA">Faturada (Paga)</option>
                        <option value="CANCELADA">Cancelada</option>
                    </select>
                </div>
            </div>

            {/* TABELA DE RESULTADOS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center font-black text-slate-400 animate-pulse text-lg">
                        Buscando histórico...
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 border-b border-slate-200 z-10">
                            <tr>
                                <th className="p-4 pl-6 text-center w-20">Nº OS</th>
                                <th className="p-4">Data / Status</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Veículo / Placa</th>
                                <th className="p-4 text-right">Valor Total</th>
                                <th className="p-4 text-center pr-6">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {ordensFiltradas.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-bold text-lg">Nenhuma OS encontrada com estes filtros.</td></tr>
                            ) : ordensFiltradas.map(os => (
                                <tr key={os.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 pl-6 text-center">
                                        <span className="font-black text-slate-700 bg-slate-100 px-2 py-1 rounded">#{os.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> {new Date(os.dataEntrada).toLocaleDateString('pt-BR')}</span>
                                            {getStatusBadge(os.status)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 flex items-center gap-2"><User size={14} className="text-slate-400"/> {os.cliente?.nome || 'Balcão / S/N'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <Car size={14} className="text-indigo-400"/>
                                            {os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo}` : 'N/A'}
                                        </p>
                                        {os.veiculo?.placa && <p className="text-[10px] font-mono text-slate-400 ml-5">{os.veiculo.placa}</p>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-black text-emerald-600 text-lg flex items-center justify-end gap-1"><DollarSign size={16}/> {formatarMoeda(os.valorTotal)}</p>
                                    </td>
                                    <td className="p-4 pr-6">
                                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => imprimirOs(os)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors" title="Reimprimir OS">
                                                <Printer size={18}/>
                                            </button>
                                            <button onClick={() => toast("Para visualizar detalhes, acesse o Kanban e clique no Card da OS.", {icon: 'ℹ️'})} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Ver Detalhes">
                                                <Eye size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};