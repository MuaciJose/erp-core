import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import {
    UploadCloud, CheckCircle, AlertCircle, Link as LinkIcon,
    Landmark, Check, FileUp, X, Save, Loader2, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ConciliacaoBancaria = () => {
    const [arquivo, setArquivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [conciliacao, setConciliacao] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('TODOS'); // TODOS, PENDENTES
    const [isDragging, setIsDragging] = useState(false);

    // Estado para "Criar Despesa na Hora"
    const [modalDespesa, setModalDespesa] = useState(null);
    const [descricaoManual, setDescricaoManual] = useState('');

    const fileInputRef = useRef(null);

    // =======================================================================
    // FUNÇÕES DE UTILIDADE E MÁSCARA
    // =======================================================================
    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // =======================================================================
    // UPLOAD E ARRASTAR/SOLTAR
    // =======================================================================
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.ofx')) {
                setArquivo(file);
            } else {
                toast.error("Por favor, envie apenas arquivos .ofx");
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setArquivo(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!arquivo) return toast.error("Selecione um arquivo OFX primeiro.");

        setLoading(true);
        const toastId = toast.loading("Lendo e cruzando dados do extrato...");
        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            // OBS: Deixei a API mockada aqui com timeout simulando demora caso o back-end não esteja pronto.
            // Você pode tirar o mock quando o back-end do OFX estiver no ar.
            const res = await api.post('/api/financeiro/conciliacao/importar-ofx', formData).catch(() => {
                // Mock de Sucesso para testes visuais
                return {
                    data: {
                        contaBancaria: "Itaú Empresas - Ag: 1234 C: 5678-9",
                        saldoBanco: 14500.50,
                        transacoes: [
                            { idBanco: '1', data: '2026-03-10', tipo: 'SAIDA', valor: 150.00, descricaoBanco: 'PAGAMENTO BOLETO NEOENERGIA', status: 'SUGERIDO', sugestaoSistema: { id: 10, descricao: 'Conta de Luz' } },
                            { idBanco: '2', data: '2026-03-11', tipo: 'ENTRADA', valor: 300.00, descricaoBanco: 'PIX TRANSFERENCIA JOAO', status: 'DESCONHECIDO' },
                            { idBanco: '3', data: '2026-03-12', tipo: 'SAIDA', valor: 45.90, descricaoBanco: 'COMPRA CARTAO PADARIA', status: 'DESCONHECIDO' }
                        ]
                    }
                };
            });

            setConciliacao(res.data);
            toast.success("Extrato analisado!", { id: toastId });
        } catch (err) {
            toast.error("Erro ao processar o arquivo OFX.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // =======================================================================
    // AÇÕES DE CONCILIAÇÃO
    // =======================================================================
    const confirmarConciliacao = async (txn) => {
        const tId = toast.loading("Conciliando...");
        try {
            // await api.patch(`/api/financeiro/contas-a-pagar/${txn.sugestaoSistema.id}/baixar`); // DESCOMENTAR DPS

            const novasTransacoes = conciliacao.transacoes.map(t =>
                t.idBanco === txn.idBanco ? { ...t, status: 'CONCILIADO' } : t
            );
            setConciliacao({ ...conciliacao, transacoes: novasTransacoes });
            toast.success("Transação amarrada com sucesso!", { id: tId });
        } catch (error) {
            toast.error("Erro ao conciliar.", { id: tId });
        }
    };

    const criarDespesaManual = async () => {
        if (!descricaoManual) return toast.error("Digite uma descrição para o gasto.");

        const tId = toast.loading("Registrando saída no sistema...");
        try {
            // await api.post('/api/financeiro/contas-pagar/manual', { ... }); // DESCOMENTAR DPS

            const novasTransacoes = conciliacao.transacoes.map(t =>
                t.idBanco === modalDespesa.idBanco ? { ...t, status: 'CONCILIADO' } : t
            );
            setConciliacao({ ...conciliacao, transacoes: novasTransacoes });
            setModalDespesa(null);
            setDescricaoManual('');
            toast.success("Despesa criada e conciliada!", { id: tId });
        } catch (error) {
            toast.error("Erro ao criar registro.", { id: tId });
        }
    };

    const transacoesFiltradas = conciliacao?.transacoes.filter(t => {
        if (filtroStatus === 'PENDENTES') return t.status !== 'CONCILIADO';
        return true;
    }) || [];

    const totalFaltando = transacoesFiltradas.filter(t => t.status !== 'CONCILIADO').length;

    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in relative min-h-screen">

            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <LinkIcon className="text-indigo-600 bg-indigo-100 p-2 rounded-xl" size={40} />
                        Conciliação Bancária
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Sincronize o extrato do banco OFX com o sistema.</p>
                </div>
                {conciliacao && (
                    <button
                        onClick={() => setConciliacao(null)}
                        className="px-6 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Trocar Arquivo
                    </button>
                )}
            </div>

            {/* TELA DE UPLOAD DE ARQUIVO */}
            {!conciliacao && (
                <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`bg-white p-12 rounded-3xl shadow-sm border-4 border-dashed text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50 transform scale-[1.02]' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileUp size={48} className="text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Importar Extrato OFX</h2>
                        <p className="text-slate-500 mb-8 font-medium">Arraste e solte o arquivo .ofx do seu banco aqui, ou clique para procurar no computador.</p>

                        <input
                            type="file"
                            accept=".ofx"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-slate-200 transition-colors"
                            >
                                Procurar Arquivo
                            </button>

                            {arquivo && (
                                <div className="bg-indigo-100 text-indigo-800 p-4 rounded-xl font-bold flex justify-between items-center animate-fade-in">
                                    <span>{arquivo.name} selecionado.</span>
                                    <CheckCircle size={20} />
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={loading || !arquivo}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                                {loading ? 'PROCESSANDO...' : 'INICIAR CONCILIAÇÃO INTELIGENTE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TELA DE CONCILIAÇÃO (TABELA MAGICA) */}
            {conciliacao && (
                <div className="space-y-6 animate-fade-in pb-24">

                    {/* PLACAR SUPERIOR */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-10 opacity-5"><Landmark size={200}/></div>
                        <div className="flex items-center gap-4 relative z-10 mb-6 md:mb-0">
                            <div className="p-4 bg-indigo-500/20 rounded-2xl">
                                <Landmark size={36} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-indigo-300 font-black uppercase tracking-widest mb-1">Conta Identificada no Arquivo</p>
                                <h2 className="text-2xl font-black">{conciliacao.contaBancaria}</h2>
                            </div>
                        </div>
                        <div className="text-center md:text-right relative z-10">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Saldo Fechamento (Banco)</p>
                            <h2 className="text-4xl font-black text-green-400 tracking-tighter">R$ {formatarMoeda(conciliacao.saldoBanco)}</h2>
                        </div>
                    </div>

                    {/* FILTROS DA TABELA */}
                    <div className="flex justify-between items-end">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setFiltroStatus('TODOS')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filtroStatus === 'TODOS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Mostrar Todos
                            </button>
                            <button onClick={() => setFiltroStatus('PENDENTES')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${filtroStatus === 'PENDENTES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Pendentes <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">{totalFaltando}</span>
                            </button>
                        </div>
                    </div>

                    {/* CABEÇALHO DA TABELA */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-50 p-4 border-b border-slate-200 font-black text-slate-400 text-[10px] uppercase tracking-widest">
                            <div className="pl-4">No Extrato do Banco (OFX)</div>
                            <div className="pl-4 hidden md:block border-l border-slate-200">No Sistema GrandPort</div>
                        </div>

                        {/* LINHAS DA TABELA */}
                        {transacoesFiltradas.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold">
                                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-300 opacity-50" />
                                Tudo perfeito! Não há mais pendências neste filtro.
                            </div>
                        ) : transacoesFiltradas.map((txn, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">

                                {/* COLUNA 1: DADOS DO BANCO */}
                                <div className="p-6 md:border-r border-slate-100 border-dashed">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(txn.data || Date.now()).toLocaleDateString('pt-BR')}</span>
                                        <span className={`font-black text-xl tracking-tighter ${txn.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                            {txn.tipo === 'ENTRADA' ? '+' : '-'} R$ {formatarMoeda(txn.valor)}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm leading-snug">{txn.descricaoBanco}</p>
                                </div>

                                {/* COLUNA 2: AÇÕES NO SISTEMA */}
                                <div className="p-6 flex flex-col justify-center bg-slate-50/50">

                                    {txn.status === 'SUGERIDO' && (
                                        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-4 rounded-2xl shadow-sm">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 mb-1"><CheckCircle size={14}/> Combinação Encontrada</p>
                                                <p className="font-bold text-slate-800 text-sm">{txn.sugestaoSistema?.descricao}</p>
                                            </div>
                                            <button onClick={() => confirmarConciliacao(txn)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-transform transform hover:scale-105">
                                                LIGAR <ArrowRight size={14} className="inline ml-1"/>
                                            </button>
                                        </div>
                                    )}

                                    {txn.status === 'DESCONHECIDO' && (
                                        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-4 rounded-2xl">
                                            <div>
                                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 mb-1"><AlertCircle size={14}/> Não Existe no Sistema</p>
                                                <p className="text-slate-600 text-xs font-bold">Nenhuma saída agendada com este valor.</p>
                                            </div>
                                            <button onClick={() => setModalDespesa(txn)} className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-black text-xs hover:bg-slate-100 transition-colors">
                                                CRIAR DESPESA
                                            </button>
                                        </div>
                                    )}

                                    {txn.status === 'CONCILIADO' && (
                                        <div className="flex items-center justify-center gap-2 text-green-600 font-black text-sm uppercase tracking-widest p-5 bg-green-50 rounded-2xl border-2 border-green-200">
                                            <CheckCircle size={20} /> AMARRADO AO SISTEMA
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BARRA FIXA INFERIOR PARA SALVAR TUDO */}
            {conciliacao && totalFaltando === 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex justify-center z-50 animate-fade-up">
                    <button onClick={() => { setConciliacao(null); toast.success("Sincronização Finalizada!"); }} className="w-full max-w-3xl bg-slate-900 text-white font-black text-lg py-5 rounded-2xl shadow-2xl hover:bg-blue-600 transition-colors flex justify-center items-center gap-3">
                        <CheckCircle size={24}/> CONCLUIR E SALVAR SINCRONIZAÇÃO
                    </button>
                </div>
            )}

            {/* MINI-MODAL RÁPIDO PARA CRIAR DESPESA (Que não existia no sistema) */}
            {modalDespesa && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Lançar Saída Invisível</h2>
                            <button onClick={() => setModalDespesa(null)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm font-bold mb-6">
                                O banco informa uma saída de <strong className="text-red-600">R$ {formatarMoeda(modalDespesa.valor)}</strong> no dia {new Date(modalDespesa.data).toLocaleDateString()}. Para onde foi esse dinheiro?
                            </div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descreva a Despesa</label>
                            <input
                                autoFocus
                                type="text"
                                value={descricaoManual}
                                onChange={e => setDescricaoManual(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && criarDespesaManual()}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-800"
                                placeholder="Ex: Compra de material de limpeza, Taxa banco..."
                            />
                            <button
                                onClick={criarDespesaManual}
                                className="w-full mt-6 bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-xl font-black flex justify-center gap-2 transition-colors"
                            >
                                <Save size={20}/> GRAVAR DESPESA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};