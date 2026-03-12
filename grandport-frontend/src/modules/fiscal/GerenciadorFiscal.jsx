import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, AlertCircle, Clock, Download, Printer, Settings, Loader2, XCircle, FilePlus2, Mail, CalendarDays, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const GerenciadorFiscal = ({ setPaginaAtiva }) => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');
    const [processandoId, setProcessandoId] = useState(null);

    // 🚀 ESTADOS DO MODAL DE FECHAMENTO
    const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
    const [fechamentoMes, setFechamentoMes] = useState(new Date().getMonth() + 1); // Mês atual
    const [fechamentoAno, setFechamentoAno] = useState(new Date().getFullYear()); // Ano atual
    const [fechamentoEmail, setFechamentoEmail] = useState('contador@contabilidade.com.br');
    const [enviandoLote, setEnviandoLote] = useState(false);

    // 🚀 NOVO ESTADO: A MENSAGEM CUSTOMIZADA
    const [fechamentoMensagem, setFechamentoMensagem] = useState('Olá Contador,\n\nSeguem em anexo os arquivos XML e PDFs referentes ao fechamento deste mês.\n\nQualquer dúvida, estamos à disposição.');

    const carregarDadosFiscais = async () => {
        setLoading(true);
        try {
            const [resVendas, resNotas] = await Promise.all([
                api.get('/api/vendas'),
                api.get('/api/fiscal/notas')
            ]);

            const unificados = [];

            const vendasPagas = resVendas.data.filter(v => v.status === 'CONCLUIDA' || v.status === 'PAGA');
            vendasPagas.forEach(v => {
                unificados.push({
                    uid: `venda_${v.id}`,
                    tipo: 'PDV',
                    vendaId: v.id,
                    nfeId: v.notaFiscal?.id || null,
                    numeroNota: v.notaFiscal?.numero || null,
                    data: v.dataHora || new Date().toISOString(),
                    clienteNome: v.cliente?.nome || 'Consumidor Final',
                    valorTotal: v.valorTotal || 0,
                    statusFiscal: v.notaFiscal?.status || 'PENDENTE',
                    chaveAcesso: v.notaFiscal?.chaveAcesso || null
                });
            });

            const notasAvulsas = resNotas.data.filter(n => !n.venda);
            notasAvulsas.forEach(n => {
                unificados.push({
                    uid: `nota_${n.id}`,
                    tipo: 'AVULSA',
                    vendaId: null,
                    nfeId: n.id,
                    numeroNota: n.numero,
                    data: n.dataEmissao || new Date().toISOString(),
                    clienteNome: 'Emissão Manual (Avulsa)',
                    valorTotal: null,
                    statusFiscal: n.status || 'AUTORIZADA',
                    chaveAcesso: n.chaveAcesso
                });
            });

            unificados.sort((a, b) => new Date(b.data) - new Date(a.data));
            setRegistros(unificados);
        } catch (error) {
            toast.error("Erro ao sincronizar as notas com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDadosFiscais();
    }, []);

    // =========================================================================
    // 🚀 LÓGICA DO FECHAMENTO MENSAL
    // =========================================================================
    const handleEnviarFechamento = async () => {
        if (!fechamentoEmail || !fechamentoEmail.includes('@')) return toast.error("Digite um e-mail válido!");

        // Filtra só as notas autorizadas que baterem com o mês e o ano selecionado
        const notasDoMes = registros.filter(reg => {
            if (reg.statusFiscal !== 'AUTORIZADA' || !reg.nfeId) return false;

            const dataReg = new Date(reg.data);
            const mesBate = (dataReg.getMonth() + 1) === parseInt(fechamentoMes);
            const anoBate = dataReg.getFullYear() === parseInt(fechamentoAno);
            return mesBate && anoBate;
        });

        if (notasDoMes.length === 0) {
            return toast.error(`Nenhuma nota Autorizada encontrada no período de ${fechamentoMes}/${fechamentoAno}.`);
        }

        const idsParaEnviar = notasDoMes.map(n => n.nfeId);

        setEnviandoLote(true);
        const loadId = toast.loading(`Gerando ${idsParaEnviar.length} PDFs e XMLs, aguarde...`);

        try {
            const mesFormatado = `${fechamentoMes.toString().padStart(2, '0')}-${fechamentoAno}`;
            // 🚀 MANDA A MENSAGEM NA URL AGORA
            const url = `/api/fiscal/enviar-lote-contador?email=${fechamentoEmail}&mesAno=${mesFormatado}&mensagem=${encodeURIComponent(fechamentoMensagem)}`;

            await api.post(url, idsParaEnviar);

            toast.success(`Fechamento enviado com sucesso! (${idsParaEnviar.length} notas)`, { id: loadId });
            setModalFechamentoAberto(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao enviar lote.', { id: loadId });
        } finally {
            setEnviandoLote(false);
        }
    };

    // =========================================================================
    // OUTRAS AÇÕES (PDV, Imprimir, XML)
    // =========================================================================
    const handleEmitirNotaPDV = async (vendaId) => {
        setProcessandoId(vendaId);
        const loadId = toast.loading('Transmitindo para a SEFAZ...');
        try {
            await api.post(`/api/fiscal/emitir/${vendaId}`);
            toast.success('Nota Autorizada com Sucesso!', { id: loadId });
            carregarDadosFiscais();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro na SEFAZ.', { id: loadId });
        } finally {
            setProcessandoId(null);
        }
    };

    const handleImprimirDanfe = async (registro) => {
        const loadId = toast.loading('Buscando PDF do DANFE...');
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) pdfWindow.document.write('<h2 style="font-family: sans-serif; padding: 20px;">Gerando PDF...</h2>');

        try {
            let url = registro.tipo === 'PDV' ? `/api/fiscal/${registro.nfeId}/danfe` : `/api/fiscal/danfe/avulsa/${registro.chaveAcesso}`;
            const response = await api.get(url, { responseType: 'blob', headers: { 'Accept': 'application/pdf' } });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            if (pdfWindow) pdfWindow.location.href = fileURL;
            else { const link = document.createElement('a'); link.href = fileURL; link.download = `DANFE_${registro.numeroNota || registro.chaveAcesso}.pdf`; link.click(); }
            toast.success('DANFE Aberto!', { id: loadId });
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao gerar PDF da nota.', { id: loadId });
        }
    };

    const handleBaixarXML = async (registro) => {
        const loadId = toast.loading('Baixando XML...');
        try {
            const response = await api.get(`/api/fiscal/${registro.nfeId}/xml`, { responseType: 'blob' });
            const fileURL = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = fileURL; link.setAttribute('download', `NFe_${registro.chaveAcesso}.xml`);
            document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
            toast.success('XML baixado!', { id: loadId });
        } catch (error) {
            toast.error('Erro ao baixar o arquivo XML.', { id: loadId });
        }
    };

    // 🚀 NOVO: Enviar Nota Única pro Contador
    const handleEnviarContador = async (registro) => {
        const emailDigitado = window.prompt("Digite o e-mail do contador:", "contador@contabilidade.com.br");
        if (!emailDigitado || !emailDigitado.includes('@')) {
            if(emailDigitado !== null) toast.error("E-mail inválido.");
            return;
        }

        const loadId = toast.loading('Enviando e-mail com anexo...');
        try {
            await api.post(`/api/fiscal/${registro.nfeId}/enviar-contador?email=${emailDigitado}`);
            toast.success('XML enviado com sucesso para o contador!', { id: loadId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao enviar o e-mail.', { id: loadId });
        }
    };

    const registrosFiltrados = registros.filter(reg => {
        const matchBusca = (reg.numeroNota?.toString().includes(busca)) || (reg.vendaId?.toString().includes(busca)) || (reg.clienteNome?.toLowerCase().includes(busca.toLowerCase())) || (reg.chaveAcesso?.includes(busca));
        let matchStatus = true;
        if (filtroStatus === 'PENDENTES') matchStatus = reg.statusFiscal === 'PENDENTE' || reg.statusFiscal === 'CONTINGENCIA';
        if (filtroStatus === 'AUTORIZADAS') matchStatus = reg.statusFiscal === 'AUTORIZADA';
        if (filtroStatus === 'ERRO') matchStatus = reg.statusFiscal === 'ERRO' || reg.statusFiscal === 'REJEITADA';
        return matchBusca && matchStatus;
    });

    const BadgeStatusFiscal = ({ status }) => {
        if (status === 'PENDENTE') return <span className="flex items-center gap-1 w-max text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200"><Clock size={12}/> Pendente</span>;
        if (status === 'AUTORIZADA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle size={12}/> Autorizada</span>;
        if (status === 'CONTINGENCIA') return <span className="flex items-center gap-1 w-max text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><AlertCircle size={12}/> Offline</span>;
        return <span className="flex items-center gap-1 w-max text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"><AlertCircle size={12}/> Rejeitada</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Módulo Fiscal (NF-e)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gerenciamento Central de Notas do PDV e Avulsas.</p>
                </div>
                <div className="flex gap-3">
                    {/* 🚀 BOTÃO DE FECHAMENTO MENSAL */}
                    <button
                        onClick={() => setModalFechamentoAberto(true)}
                        className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md"
                    >
                        <CalendarDays size={18} className="text-blue-400" /> Fechamento do Mês
                    </button>
                    <button
                        onClick={() => setPaginaAtiva('emitir-nfe-avulsa')}
                        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20"
                    >
                        <FilePlus2 size={18} /> Emitir NF-e Avulsa
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar por N.º Nota, Pedido, Cliente ou Chave..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-sm font-bold text-slate-700" />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    {['TODAS', 'PENDENTES', 'AUTORIZADAS', 'ERRO'].map(status => (
                        <button key={status} onClick={() => setFiltroStatus(status)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filtroStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center"><Loader2 size={40} className="animate-spin mb-4 text-blue-500" />Sincronizando notas...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
                                <th className="p-4 font-black">Identificação</th>
                                <th className="p-4 font-black">Data</th>
                                <th className="p-4 font-black">Cliente / Valor</th>
                                <th className="p-4 font-black">Status SEFAZ</th>
                                <th className="p-4 text-right font-black">Ações</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {registrosFiltrados.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">Nenhuma nota encontrada.</td></tr>
                            ) : (
                                registrosFiltrados.map(reg => (
                                    <tr key={reg.uid} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            {reg.numeroNota ? <p className="font-black text-slate-800 text-sm">NFe Nº {reg.numeroNota}</p> : <p className="font-black text-orange-500 text-sm">Sem Número</p>}
                                            {reg.tipo === 'PDV' ? <span className="text-xs text-slate-500 font-medium">Caixa: Venda #{reg.vendaId}</span> : <span className="inline-block mt-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">Nota Avulsa</span>}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            {new Date(reg.data).toLocaleDateString('pt-BR')} <br/>
                                            <span className="text-xs text-slate-400">{new Date(reg.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4">
                                            <p className={`font-bold text-sm truncate max-w-[200px] ${reg.tipo === 'AVULSA' ? 'text-purple-800' : 'text-slate-800'}`}>{reg.clienteNome}</p>
                                            {reg.valorTotal !== null && <p className="font-black text-emerald-600 text-xs mt-0.5">R$ {reg.valorTotal.toFixed(2)}</p>}
                                        </td>
                                        <td className="p-4">
                                            <BadgeStatusFiscal status={reg.statusFiscal} />
                                            {reg.chaveAcesso && <p className="text-[10px] font-mono text-slate-400 mt-1">{reg.chaveAcesso}</p>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {reg.tipo === 'PDV' && reg.statusFiscal === 'PENDENTE' && (
                                                    <button onClick={() => handleEmitirNotaPDV(reg.vendaId)} disabled={processandoId === reg.vendaId} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-colors disabled:opacity-50">
                                                        {processandoId === reg.vendaId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} AUTORIZAR
                                                    </button>
                                                )}
                                                {reg.chaveAcesso && (
                                                    <>
                                                        <button onClick={() => handleImprimirDanfe(reg)} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Imprimir DANFE"><Printer size={14} /></button>
                                                        <button onClick={() => handleBaixarXML(reg)} className="bg-white hover:bg-slate-100 text-green-700 border border-green-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Baixar XML"><Download size={14} /></button>

                                                        {/* 🚀 BOTÃO DE E-MAIL INDIVIDUAL */}
                                                        <button onClick={() => handleEnviarContador(reg)} className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm" title="Enviar para Contabilidade"><Mail size={14} /></button>
                                                    </>
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

            {/* 🚀 MODAL DE FECHAMENTO MENSAL */}
            {modalFechamentoAberto && (
                <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-200">
                        <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                            <h3 className="font-black text-lg flex items-center gap-2"><CalendarDays className="text-blue-400"/> Envio em Lote (Contador)</h3>
                            <button onClick={() => setModalFechamentoAberto(false)} className="hover:text-red-400 transition-colors p-1"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <p className="text-sm text-slate-600 font-medium">O sistema vai reunir <b>XMLs e PDFs (DANFE)</b> do período escolhido, compactar em um arquivo ZIP e enviar por e-mail.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mês</label>
                                    <select value={fechamentoMes} onChange={e=>setFechamentoMes(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                                        <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option>
                                        <option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option>
                                        <option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option>
                                        <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ano</label>
                                    <select value={fechamentoAno} onChange={e=>setFechamentoAno(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">E-mail da Contabilidade *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                    <input type="email" value={fechamentoEmail} onChange={e=>setFechamentoEmail(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white" placeholder="contador@..." />
                                </div>
                            </div>

                            {/* 🚀 A CAIXA DE MENSAGEM CUSTOMIZÁVEL */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mensagem no E-mail</label>
                                <textarea
                                    value={fechamentoMensagem}
                                    onChange={e=>setFechamentoMensagem(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 font-medium text-slate-700 bg-white h-24 resize-none custom-scrollbar"
                                    placeholder="Digite a mensagem para o contador..."
                                ></textarea>
                            </div>

                        </div>
                        <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setModalFechamentoAberto(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button
                                onClick={handleEnviarFechamento}
                                disabled={enviandoLote}
                                className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-transform transform hover:-translate-y-0.5 shadow-lg shadow-blue-600/30 flex items-center gap-2"
                            >
                                {enviandoLote ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>}
                                Enviar Lote
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};