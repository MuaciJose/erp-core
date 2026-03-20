import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Lock, Unlock, DollarSign, CreditCard, Smartphone, ArrowDownCircle, Printer, Delete, X, User, Calendar, History, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const ControleCaixa = () => {
    const [caixa, setCaixa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalAcao, setModalAcao] = useState(null);
    const [valorRaw, setValorRaw] = useState(0);
    const [valorFormatado, setValorFormatado] = useState('0,00');
    const [operador, setOperador] = useState('Carregando...');
    const [dataAtual, setDataAtual] = useState('');

    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [historicoCaixas, setHistoricoCaixas] = useState([]);
    const [filtroPesquisa, setFiltroPesquisa] = useState('');
    const [paginaAtual, setPaginaAtual] = useState(1);
    const itensPorPagina = 5;

    const traduzirDataJava = (dataDoJava) => {
        if (!dataDoJava) return '';
        if (Array.isArray(dataDoJava)) {
            const dataObj = new Date(dataDoJava[0], dataDoJava[1] - 1, dataDoJava[2], dataDoJava[3] || 0, dataDoJava[4] || 0);
            return dataObj.toLocaleString('pt-BR');
        }
        const dataObj = new Date(dataDoJava);
        if (isNaN(dataObj.getTime())) return 'Data Indisponível';
        return dataObj.toLocaleString('pt-BR');
    };

    const carregarCaixa = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/caixa/atual');
            setCaixa(res.data);
        } catch (err) {
            setCaixa({ status: 'FECHADO' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        carregarCaixa();
        const opcoesData = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dataFormatada = new Date().toLocaleDateString('pt-BR', opcoesData);
        setDataAtual(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1));
    }, []);

    useEffect(() => {
        const buscarUsuarioLogado = () => {
            try {
                let nomeAchado = localStorage.getItem('nome') || localStorage.getItem('usuarioNome') || localStorage.getItem('username');
                if (!nomeAchado) {
                    const objUsuario = localStorage.getItem('usuario') || localStorage.getItem('user');
                    if (objUsuario) {
                        const parsed = JSON.parse(objUsuario);
                        nomeAchado = parsed.nome || parsed.username || parsed.login;
                    }
                }
                setOperador(nomeAchado || 'Admin');
            } catch (error) { setOperador('Admin'); }
        };
        buscarUsuarioLogado();
    }, []);

    const atualizarValor = (novoValorRaw) => {
        if (novoValorRaw > 99999999) return;
        setValorRaw(novoValorRaw);
        setValorFormatado((novoValorRaw / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleTeclado = (tecla) => {
        if (tecla === 'C') atualizarValor(0);
        else if (tecla === 'BACKSPACE') atualizarValor(Math.floor(valorRaw / 10));
        else atualizarValor((valorRaw * 10) + parseInt(tecla, 10));
    };

    const resetarEntrada = () => {
        setValorRaw(0); setValorFormatado('0,00');
    };

    const valorEmReais = valorRaw / 100;

    const handleAbrirCaixa = async () => {
        const idToast = toast.loading("Abrindo o caixa...");
        try {
            await api.post('/api/caixa/abrir', { saldoInicial: valorEmReais });
            setModalAcao(null); resetarEntrada(); carregarCaixa();
            toast.success("Caixa aberto com sucesso!", { id: idToast });
        } catch (error) { toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast }); }
    };

    const handleSangria = async () => {
        if (valorEmReais <= 0) return toast.error("Informe um valor maior que zero.");
        const idToast = toast.loading("Registrando retirada...");
        try {
            await api.post('/api/caixa/sangria', { valor: valorEmReais, motivo: 'Retirada manual' });
            setModalAcao(null); resetarEntrada(); carregarCaixa();
            toast.success("Sangria registrada!", { id: idToast });
        } catch (error) { toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast }); }
    };

    const handleFecharCaixa = async () => {
        const idToast = toast.loading("Fechando caixa...");
        try {
            await api.post('/api/caixa/fechar', { valorInformado: valorEmReais });
            imprimirRelatorioCaixa(null);
            setModalAcao(null); resetarEntrada(); carregarCaixa();
            toast.success("Caixa encerrado com sucesso!", { id: idToast });
        } catch (error) { toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast }); }
    };

    const imprimirRelatorioCaixa = async (idCaixa = null) => {
        const idToast = toast.loading("Gerando relatório...");
        try {
            const url = idCaixa ? `/api/caixa/pdf?id=${idCaixa}` : '/api/caixa/pdf';
            const response = await api.get(url, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
            toast.success("Documento gerado!", { id: idToast });
        } catch (error) { toast.error("Erro ao gerar PDF.", { id: idToast }); }
    };

    const abrirHistorico = async () => {
        const loadId = toast.loading("Buscando histórico...");
        try {
            const res = await api.get('/api/caixa');
            setHistoricoCaixas(res.data);
            setPaginaAtual(1);
            setFiltroPesquisa('');
            setModalHistoricoAberto(true);
            toast.dismiss(loadId);
        } catch (e) { toast.error("Falha ao buscar histórico.", { id: loadId }); }
    };

    const caixasFiltrados = historicoCaixas.filter(c => {
        const termoBusca = filtroPesquisa.toLowerCase();
        const idCaixa = c.id ? c.id.toString() : '';
        const dataAbertura = traduzirDataJava(c.dataAbertura).toLowerCase();
        const nomeOp = c.operadorNome ? c.operadorNome.toLowerCase() : '';
        return idCaixa.includes(termoBusca) || dataAbertura.includes(termoBusca) || nomeOp.includes(termoBusca);
    });

    const indexOfLastItem = paginaAtual * itensPorPagina;
    const indexOfFirstItem = indexOfLastItem - itensPorPagina;
    const caixasPaginados = caixasFiltrados.slice(indexOfFirstItem, indexOfLastItem);
    const totalPaginas = Math.ceil(caixasFiltrados.length / itensPorPagina);

    // 🚀 O TECLADO VIRTUAL FOI REESCRITO PARA NÃO PERDER O FOCO
    const renderTeclado = () => (
        <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleTeclado(num)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xl font-black py-4 rounded-xl shadow-sm border border-slate-200">{num}</button>
            ))}
            <button onClick={() => handleTeclado('C')} className="bg-red-50 hover:bg-red-100 text-red-500 text-xl font-black py-4 rounded-xl shadow-sm border border-red-200">C</button>
            <button onClick={() => handleTeclado(0)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xl font-black py-4 rounded-xl shadow-sm border border-slate-200">0</button>
            <button onClick={() => handleTeclado('BACKSPACE')} className="bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-xl flex items-center justify-center shadow-sm border border-slate-200"><Delete size={28} /></button>
        </div>
    );

    // 🚀 O MODAL DE HISTÓRICO FOI REESCRITO PARA NÃO BUGAR A DIGITAÇÃO
    const renderModalHistorico = () => {
        if (!modalHistoricoAberto) return null;

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-black flex items-center gap-3"><History size={24}/> Histórico de Caixas</h2>
                        <button onClick={() => setModalHistoricoAberto(false)} className="hover:text-red-400 transition-colors"><X size={24}/></button>
                    </div>

                    <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input
                                type="text"
                                placeholder="Buscar por ID, Data ou Nome do Operador..."
                                value={filtroPesquisa}
                                onChange={(e) => {
                                    setFiltroPesquisa(e.target.value);
                                    setPaginaAtual(1);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-sm shadow-sm transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                        {caixasPaginados.length === 0 ? (
                            <div className="text-center text-slate-400 py-16 flex flex-col items-center">
                                <History size={48} className="mb-4 opacity-20"/>
                                <p className="font-black text-lg">Nenhum caixa encontrado com esses filtros.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {caixasPaginados.map(c => (
                                    <div key={c.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-400 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-4 rounded-xl text-white shadow-inner ${c.status === 'ABERTO' ? 'bg-green-500' : 'bg-slate-700'}`}>
                                                {c.status === 'ABERTO' ? <Unlock size={24}/> : <Lock size={24}/>}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">Caixa #{c.id || 'N/D'}</h3>
                                                <p className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1"><User size={12}/> {c.operadorNome || 'Não informado'}</p>
                                                <p className="text-xs font-bold text-slate-500 mt-1">Abertura: <span className="text-slate-700">{traduzirDataJava(c.dataAbertura)}</span></p>
                                                <p className="text-xs font-bold text-slate-500">Fechamento: <span className="text-slate-700">{c.dataFechamento ? traduzirDataJava(c.dataFechamento) : '(Em andamento)'}</span></p>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <button onClick={() => imprimirRelatorioCaixa(c.id)} className="w-full md:w-auto bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                                <Printer size={18}/> REIMPRIMIR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                            <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft size={20}/></button>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Página {paginaAtual} de {totalPaginas}</span>
                            <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight size={20}/></button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 font-bold text-slate-400 text-center animate-pulse mt-20">Acessando a gaveta...</div>;

    if (caixa.status === 'FECHADO') {
        return (
            <div className="p-8 max-w-lg mx-auto mt-10 animate-fade-in relative">
                <button onClick={abrirHistorico} className="absolute -top-10 right-4 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"><History size={16}/> Ver Histórico</button>
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Lock size={40} className="text-slate-400" /></div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">CAIXA FECHADO</h1>
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                        <span className="flex items-center gap-1"><User size={14} className="text-blue-500"/> {operador}</span><span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-blue-500"/> {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 mb-6">
                        <label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-3">Saldo Inicial na Gaveta (R$)</label>
                        <input type="text" value={valorFormatado} onChange={(e) => atualizarValor(Number(e.target.value.replace(/\D/g, '')))} className="w-full py-4 text-center text-4xl font-black text-blue-700 bg-white border-2 border-blue-200 rounded-2xl outline-none focus:border-blue-500 transition-colors shadow-inner" autoFocus />
                        {renderTeclado()}
                    </div>
                    <button onClick={handleAbrirCaixa} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30"><Unlock size={24} /> ABRIR TERMINAL</button>
                    <button onClick={() => imprimirRelatorioCaixa(null)} className="w-full mt-4 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"><Printer size={18} /> REIMPRIMIR ÚLTIMO FECHAMENTO</button>
                </div>
                {renderModalHistorico()}
            </div>
        );
    }

    const totalEmCaixaFisico = (caixa.saldoInicial + caixa.dinheiro) - caixa.sangrias;
    const faturamentoTotal = caixa.dinheiro + caixa.cartao + caixa.pix;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><div className="bg-green-100 p-2 rounded-xl"><Unlock className="text-green-600" size={28}/></div>CAIXA ABERTO</h1>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 mt-2 ml-1">
                        <span className="flex items-center gap-1.5"><User size={16} className="text-blue-500"/> {operador}</span><span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500"/> {dataAtual}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button onClick={() => imprimirRelatorioCaixa(null)} className="flex-1 md:flex-none bg-white border-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"><Printer size={20} /> PARCIAL</button>
                    <button onClick={abrirHistorico} className="flex-1 md:flex-none bg-white border-2 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"><History size={20} /> HISTÓRICO</button>
                    <button onClick={() => { resetarEntrada(); setModalAcao('SANGRIA'); }} className="flex-1 md:flex-none bg-orange-100 text-orange-700 hover:bg-orange-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><ArrowDownCircle size={20} /> SANGRIA</button>
                    <button onClick={() => { resetarEntrada(); setModalAcao('FECHAR'); }} className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"><Lock size={20} /> FECHAR CAIXA</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-green-500 relative overflow-hidden group hover:shadow-md transition-all"><p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><DollarSign size={16} className="text-green-500"/> Dinheiro</p><h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.dinheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2><DollarSign size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/></div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500 relative overflow-hidden group hover:shadow-md transition-all"><p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><CreditCard size={16} className="text-blue-500"/> Cartão</p><h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.cartao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2><CreditCard size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/></div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-purple-500 relative overflow-hidden group hover:shadow-md transition-all"><p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><Smartphone size={16} className="text-purple-500"/> PIX</p><h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.pix.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2><Smartphone size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/></div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden"><p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Faturamento Total</p><h2 className="text-4xl font-black text-blue-400 mt-2 relative z-10">R$ {faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2><div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div></div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200"><h3 className="font-black text-lg text-slate-800 tracking-tight">RESUMO FÍSICO DA GAVETA (Dinheiro)</h3></div>
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-5 w-full md:w-auto text-sm md:text-base">
                        <div className="flex justify-between md:w-80 text-slate-600"><span className="font-medium">Troco Inicial:</span><span className="font-black">R$ {caixa.saldoInicial.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between md:w-80 text-green-600"><span className="font-medium">(+) Entradas Dinheiro:</span><span className="font-black">R$ {caixa.dinheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between md:w-80 text-red-500 border-b border-slate-100 pb-5"><span className="font-medium">(-) Retiradas/Sangrias:</span><span className="font-black">R$ {caixa.sangrias.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between md:w-80 text-slate-900 text-xl pt-2"><span className="font-black">SALDO ESPERADO:</span><span className="font-black">R$ {totalEmCaixaFisico.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                    </div>
                    <div className="hidden md:block opacity-5 bg-slate-50 p-8 rounded-full"><DollarSign size={120} /></div>
                </div>
            </div>

            {modalAcao && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative">
                        <button onClick={() => setModalAcao(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
                        <div className="mb-6 mt-2">
                            <h2 className="text-2xl font-black text-slate-800">{modalAcao === 'SANGRIA' ? 'Registrar Sangria' : 'Fechamento de Caixa'}</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">{modalAcao === 'SANGRIA' ? 'Informe o valor em espécie a retirar.' : 'Informe o valor total contado na gaveta.'}</p>
                        </div>
                        <div className="mb-6">
                            <input type="text" value={valorFormatado} onChange={(e) => atualizarValor(Number(e.target.value.replace(/\D/g, '')))} className={`w-full py-4 text-center text-3xl font-black bg-slate-50 border-2 rounded-2xl outline-none transition-colors shadow-inner ${modalAcao === 'SANGRIA' ? 'text-orange-600 border-orange-200 focus:border-orange-500' : 'text-red-600 border-red-200 focus:border-red-500'}`} autoFocus />
                            {renderTeclado()}
                        </div>
                        <button onClick={modalAcao === 'SANGRIA' ? handleSangria : handleFecharCaixa} className={`w-full py-5 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95 ${modalAcao === 'SANGRIA' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}>{modalAcao === 'SANGRIA' ? 'CONFIRMAR RETIRADA' : 'ENCERRAR OPERAÇÃO'}</button>
                    </div>
                </div>
            )}

            {renderModalHistorico()}
        </div>
    );
};