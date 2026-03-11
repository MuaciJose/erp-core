import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Clock, Download, Printer, Settings, Loader2, XCircle, FilePlus2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = () => {
    // 🚀 Mudamos de 'vendas' para 'notas' para abranger todas (PDV e Avulsas)
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    // Carrega TODAS as notas fiscais do banco (com e sem venda atrelada)
    const carregarNotas = async () => {
        setLoading(true);
        try {
            // 🚀 Agora busca direto do repositório de Notas Fiscais
            const res = await api.get('/api/fiscal/notas');
            setNotas(res.data);
        } catch (error) {
            console.error("Erro ao carregar notas fiscais:", error);
            toast.error("Erro ao carregar lista de notas do banco.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarNotas();
    }, []);

    // =========================================================================
    // 🚀 AÇÕES FISCAIS
    // =========================================================================

    // 1. Imprimir DANFE (Suporta PDV e Avulsa)
    const handleImprimirDanfe = async (nota) => {
        const loadId = toast.loading('Buscando PDF do DANFE...');

        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<h2 style="font-family: sans-serif; padding: 20px; color: #334155;">Gerando o seu PDF no servidor, por favor aguarde...</h2>');
        } else {
            toast.error("Por favor, permita os pop-ups no seu navegador para ver a nota.", { id: loadId });
        }

        try {
            // 🚀 Verifica se é nota do PDV ou Avulsa para chamar a rota correta do Java
            let url = '';
            if (nota.venda) {
                url = `/api/fiscal/${nota.id}/danfe`; // PDV Normal
            } else {
                url = `/api/fiscal/danfe/avulsa/${nota.chaveAcesso}`; // Nota Avulsa que criamos
            }

            const response = await api.get(url, {
                responseType: 'blob',
                headers: { 'Accept': 'application/pdf' }
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            if (pdfWindow) {
                pdfWindow.location.href = fileURL;
            } else {
                const link = document.createElement('a');
                link.href = fileURL;
                link.download = `DANFE_${nota.numero || nota.chaveAcesso}.pdf`;
                link.click();
            }
            toast.success('DANFE Gerado!', { id: loadId });
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao gerar PDF da nota.', { id: loadId });
            console.error("Erro ao gerar PDF:", error);
        }
    };

    // 2. Baixar XML para o Contador
    const handleBaixarXML = async (nfeId, chaveAcesso) => {
        const loadId = toast.loading('Baixando arquivo XML...');
        try {
            // No XML é a mesma rota (ele só lê o arquivo físico)
            const response = await api.get(`/api/fiscal/${nfeId}/xml`, { responseType: 'blob' });
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `NFe_${chaveAcesso}.xml`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('XML baixado com sucesso!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao baixar o arquivo XML. O arquivo não foi encontrado no servidor.', { id: loadId });
        }
    };

    // =========================================================================
    // RENDERIZAÇÃO E FILTROS
    // =========================================================================

    const notasFiltradas = notas.filter(nota => {
        const numeroVenda = nota.venda ? nota.venda.id.toString() : 'avulsa';
        const nomeCliente = nota.venda && nota.venda.cliente ? nota.venda.cliente.nome : 'avulsa manual';

        const matchBusca =
            (nota.numero && nota.numero.toString().includes(busca)) ||
            numeroVenda.includes(busca) ||
            nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
            (nota.chaveAcesso || '').includes(busca);

        const statusFiscal = nota.status || 'PENDENTE';
        let matchStatus = true;
        if (filtroStatus === 'PENDENTES') matchStatus = statusFiscal === 'CONTINGENCIA' || statusFiscal === 'PENDENTE';
        if (filtroStatus === 'AUTORIZADAS') matchStatus = statusFiscal === 'AUTORIZADA';
        if (filtroStatus === 'ERRO') matchStatus = statusFiscal === 'ERRO' || statusFiscal === 'REJEITADA';

        return matchBusca && matchStatus;
    });

    const BadgeStatusFiscal = ({ status }) => {
        if (!status || status === 'PENDENTE') return <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200"><Clock size={12}/> Pendente</span>;
        if (status === 'AUTORIZADA') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle size={12}/> Autorizada</span>;
        if (status === 'CONTINGENCIA') return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><AlertCircle size={12}/> Contingência (Offline)</span>;
        if (status === 'CANCELADA') return <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-300"><XCircle size={12}/> Cancelada</span>;
        return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><AlertCircle size={12}/> Rejeitada</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Módulo Fiscal (NF-e)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerenciamento Central de Notas Fiscais e XMLs.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.location.href = '/nfe-avulsa'} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20">
                        <FilePlus2 size={18} /> Emitir NF-e Avulsa
                    </button>
                    <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        <Settings size={18} /> Certificado
                    </button>
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por N.º Nota, Pedido, Cliente ou Chave de Acesso..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700 transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABELA DE NOTAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                        Carregando banco de dados fiscal...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                <th className="p-4 font-black">Nº Nota / Pedido</th>
                                <th className="p-4 font-black">Data de Emissão</th>
                                <th className="p-4 font-black">Origem / Cliente</th>
                                <th className="p-4 font-black">Status SEFAZ</th>
                                <th className="p-4 text-right font-black">Ações Fiscais</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {notasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">
                                        Nenhuma nota encontrada para o filtro selecionado.
                                    </td>
                                </tr>
                            ) : (
                                notasFiltradas.map(nota => (
                                    <tr key={nota.id} className="hover:bg-slate-50 transition-colors group">

                                        {/* COLUNA 1: NÚMERO DA NOTA E PEDIDO */}
                                        <td className="p-4">
                                            <p className="font-black text-slate-800 text-sm">NFe Nº {nota.numero}</p>
                                            {nota.venda ? (
                                                <span className="text-xs text-slate-500 font-medium">PDV: Venda #{nota.venda.id}</span>
                                            ) : (
                                                <span className="inline-block mt-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">
                                                    Nota Avulsa
                                                </span>
                                            )}
                                        </td>

                                        {/* COLUNA 2: DATA E HORA */}
                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')} <br/>
                                            <span className="text-xs text-slate-400">{new Date(nota.dataEmissao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>

                                        {/* COLUNA 3: CLIENTE (Lida com o null da Avulsa) */}
                                        <td className="p-4">
                                            {nota.venda ? (
                                                <>
                                                    <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{nota.venda.cliente?.nome || 'Consumidor Final'}</p>
                                                    <p className="font-black text-emerald-600 text-xs mt-0.5">R$ {(nota.venda.valorTotal || 0).toFixed(2)}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-purple-900 text-sm truncate max-w-[200px]">Emissão Manual</p>
                                                    <p className="font-bold text-slate-400 text-[10px] mt-0.5 uppercase">Lida do XML</p>
                                                </>
                                            )}
                                        </td>

                                        {/* COLUNA 4: STATUS E CHAVE */}
                                        <td className="p-4">
                                            <BadgeStatusFiscal status={nota.status} />
                                            {nota.chaveAcesso && (
                                                <p className="text-[10px] font-mono text-slate-400 mt-1" title="Chave de Acesso">
                                                    {nota.chaveAcesso}
                                                </p>
                                            )}
                                        </td>

                                        {/* COLUNA 5: BOTÕES */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {nota.status === 'AUTORIZADA' || nota.status === 'CONTINGENCIA' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleImprimirDanfe(nota)}
                                                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                                                            title="Visualizar/Imprimir DANFE"
                                                        >
                                                            <Printer size={14} /> DANFE
                                                        </button>
                                                        <button
                                                            onClick={() => handleBaixarXML(nota.id, nota.chaveAcesso)}
                                                            className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                                                            title="Baixar XML Original para o Contador"
                                                        >
                                                            <Download size={14} /> XML
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aguardando...</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};