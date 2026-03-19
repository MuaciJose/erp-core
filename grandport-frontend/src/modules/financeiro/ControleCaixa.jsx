import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Lock, Unlock, DollarSign, CreditCard, Smartphone, ArrowDownCircle, Printer, Delete, X, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const ControleCaixa = () => {
    const [caixa, setCaixa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalAcao, setModalAcao] = useState(null);

    const [valorRaw, setValorRaw] = useState(0);
    const [valorFormatado, setValorFormatado] = useState('0,00');

    // 🚀 NOVOS ESTADOS: Operador Logado e Data de Hoje
    const [operador, setOperador] = useState('Carregando...');
    const [dataAtual, setDataAtual] = useState('');

    const carregarCaixa = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/caixa/atual');
            setCaixa(res.data);
        } catch (err) {
            setCaixa({ status: 'FECHADO' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarCaixa();

        // 🚀 GERA A DATA BONITA AUTOMATICAMENTE
        const opcoesData = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dataFormatada = new Date().toLocaleDateString('pt-BR', opcoesData);
        setDataAtual(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)); // Primeira letra maiúscula

        // 🚀 TENTA DESCOBRIR QUEM É O USUÁRIO LOGADO
        const buscarUsuarioLogado = async () => {
            try {
                // 1. Tenta achar em chaves de texto simples
                let nomeAchado = localStorage.getItem('nome') ||
                    localStorage.getItem('usuarioNome') ||
                    localStorage.getItem('username');

                // 2. Se não achou, tenta ver se você salvou como um Objeto (JSON)
                if (!nomeAchado) {
                    const objUsuario = localStorage.getItem('usuario') || localStorage.getItem('user');
                    if (objUsuario) {
                        const parsed = JSON.parse(objUsuario);
                        nomeAchado = parsed.nome || parsed.username || parsed.login;
                    }
                }

                // Se achou no cache do navegador, usa ele e encerra!
                if (nomeAchado) {
                    setOperador(nomeAchado);
                    return;
                }

                // 3. Em último caso, tenta bater no Java
                const res = await api.get('/api/usuarios/me');
                setOperador(res.data.nome || res.data.username || 'Admin');

            } catch (error) {
                console.log("Erro ao buscar operador:", error);
                setOperador('Admin'); // Se tudo der errado, coloca Admin como estepe!
            }
        };
        buscarUsuarioLogado();
    }, []);

    const atualizarValor = (novoValorRaw) => {
        if (novoValorRaw > 99999999) return;
        setValorRaw(novoValorRaw);
        const formatado = (novoValorRaw / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setValorFormatado(formatado);
    };

    const handleTeclado = (tecla) => {
        if (tecla === 'C') {
            atualizarValor(0);
        } else if (tecla === 'BACKSPACE') {
            atualizarValor(Math.floor(valorRaw / 10));
        } else {
            atualizarValor((valorRaw * 10) + parseInt(tecla, 10));
        }
    };

    const handleInputChange = (e) => {
        const apenasNumeros = e.target.value.replace(/\D/g, '');
        atualizarValor(Number(apenasNumeros));
    };

    const resetarEntrada = () => {
        setValorRaw(0);
        setValorFormatado('0,00');
    };

    const valorEmReais = valorRaw / 100;

    const handleAbrirCaixa = async () => {
        const idToast = toast.loading("Abrindo o caixa...");
        try {
            await api.post('/api/caixa/abrir', { saldoInicial: valorEmReais });
            setModalAcao(null);
            resetarEntrada();
            carregarCaixa();
            toast.success("Caixa aberto com sucesso!", { id: idToast });
        } catch (error) {
            toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast });
        }
    };

    const handleSangria = async () => {
        if (valorEmReais <= 0) return toast.error("Informe um valor maior que zero.");

        const idToast = toast.loading("Registrando retirada...");
        try {
            await api.post('/api/caixa/sangria', { valor: valorEmReais, motivo: 'Retirada manual' });
            setModalAcao(null);
            resetarEntrada();
            carregarCaixa();
            toast.success("Sangria registrada!", { id: idToast });
        } catch (error) {
            toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast });
        }
    };

    const handleFecharCaixa = async () => {
        const idToast = toast.loading("Fechando caixa e gerando relatório...");
        try {
            // 1. Fecha o caixa no servidor
            await api.post('/api/caixa/fechar', { valorInformado: valorEmReais });

            // 2. 🚀 AUTO-IMPRESSÃO: Abre o PDF na mesma hora!
            try {
                const response = await api.get('/api/caixa/pdf', { responseType: 'blob' });
                const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                window.open(fileURL, '_blank');
            } catch (err) {
                console.error("Erro na auto-impressão", err);
            }

            // 3. Limpa a tela
            setModalAcao(null);
            resetarEntrada();
            carregarCaixa();
            toast.success("Caixa encerrado com sucesso!", { id: idToast });
        } catch (error) {
            toast.error('Erro: ' + (error.response?.data?.message || error.message), { id: idToast });
        }
    };

    const imprimirRelatorioCaixa = async () => {
        const idToast = toast.loading("Gerando relatório oficial do caixa...");
        try {
            const response = await api.get('/api/caixa/pdf', { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
            toast.success("Documento gerado com sucesso!", { id: idToast });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar o PDF no servidor.", { id: idToast });
        }
    };

    const TecladoVirtual = () => (
        <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleTeclado(num)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xl font-black py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-slate-200">
                    {num}
                </button>
            ))}
            <button onClick={() => handleTeclado('C')} className="bg-red-50 hover:bg-red-100 text-red-500 text-xl font-black py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-red-200">
                C
            </button>
            <button onClick={() => handleTeclado(0)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xl font-black py-4 rounded-xl transition-all active:scale-95 shadow-sm border border-slate-200">
                0
            </button>
            <button onClick={() => handleTeclado('BACKSPACE')} className="bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-sm border border-slate-200">
                <Delete size={28} />
            </button>
        </div>
    );

    if (loading) return <div className="p-8 font-bold text-slate-400 text-center animate-pulse mt-20">Acessando a gaveta...</div>;

    if (caixa.status === 'FECHADO') {
        return (
            <div className="p-8 max-w-lg mx-auto mt-10 animate-fade-in">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Lock size={40} className="text-slate-400" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">CAIXA FECHADO</h1>

                    {/* 🚀 INFORMAÇÕES DO USUÁRIO NA TELA FECHADA */}
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                        <span className="flex items-center gap-1"><User size={14} className="text-blue-500"/> {operador}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={14} className="text-blue-500"/> {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 mb-6">
                        <label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-3">Saldo Inicial na Gaveta (R$)</label>
                        <input
                            type="text"
                            value={valorFormatado}
                            onChange={handleInputChange}
                            className="w-full py-4 text-center text-4xl font-black text-blue-700 bg-white border-2 border-blue-200 rounded-2xl outline-none focus:border-blue-500 transition-colors shadow-inner"
                            autoFocus
                        />
                        <TecladoVirtual />
                    </div>

                    <button onClick={handleAbrirCaixa} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/30">
                        <Unlock size={24} /> ABRIR TERMINAL
                    </button>

                    {/* 🚀 NOVO BOTÃO DE REIMPRESSÃO DO ÚLTIMO DIA */}
                    <button onClick={imprimirRelatorioCaixa} className="w-full mt-4 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                        <Printer size={18} /> REIMPRIMIR FECHAMENTO ANTERIOR
                    </button>
                </div>
            </div>
        );
    }

    const totalEmCaixaFisico = (caixa.saldoInicial + caixa.dinheiro) - caixa.sangrias;
    const faturamentoTotal = caixa.dinheiro + caixa.cartao + caixa.pix;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-xl"><Unlock className="text-green-600" size={28}/></div>
                        CAIXA ABERTO
                    </h1>
                    {/* 🚀 INFORMAÇÕES DO USUÁRIO NA TELA ABERTA */}
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 mt-2 ml-1">
                        <span className="flex items-center gap-1.5"><User size={16} className="text-blue-500"/> {operador}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500"/> {dataAtual}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button onClick={imprimirRelatorioCaixa} className="flex-1 md:flex-none bg-white border-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                        <Printer size={20} /> IMPRIMIR
                    </button>
                    <button onClick={() => { resetarEntrada(); setModalAcao('SANGRIA'); }} className="flex-1 md:flex-none bg-orange-100 text-orange-700 hover:bg-orange-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                        <ArrowDownCircle size={20} /> SANGRIA
                    </button>
                    <button onClick={() => { resetarEntrada(); setModalAcao('FECHAR'); }} className="flex-1 md:flex-none bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg">
                        <Lock size={20} /> FECHAR CAIXA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-green-500 relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><DollarSign size={16} className="text-green-500"/> Dinheiro</p>
                    <h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.dinheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                    <DollarSign size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500 relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><CreditCard size={16} className="text-blue-500"/> Cartão</p>
                    <h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.cartao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                    <CreditCard size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-t-4 border-t-purple-500 relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10"><Smartphone size={16} className="text-purple-500"/> PIX</p>
                    <h2 className="text-3xl font-black mt-3 text-slate-700 relative z-10">R$ {caixa.pix.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                    <Smartphone size={80} className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-110 transition-transform"/>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Faturamento Total</p>
                    <h2 className="text-4xl font-black text-blue-400 mt-2 relative z-10">R$ {faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <h3 className="font-black text-lg text-slate-800 tracking-tight">RESUMO FÍSICO DA GAVETA (Dinheiro)</h3>
                </div>
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-5 w-full md:w-auto text-sm md:text-base">
                        <div className="flex justify-between md:w-80 text-slate-600">
                            <span className="font-medium">Troco Inicial:</span>
                            <span className="font-black">R$ {caixa.saldoInicial.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between md:w-80 text-green-600">
                            <span className="font-medium">(+) Entradas Dinheiro:</span>
                            <span className="font-black">R$ {caixa.dinheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between md:w-80 text-red-500 border-b border-slate-100 pb-5">
                            <span className="font-medium">(-) Retiradas/Sangrias:</span>
                            <span className="font-black">R$ {caixa.sangrias.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between md:w-80 text-slate-900 text-xl pt-2">
                            <span className="font-black">SALDO ESPERADO:</span>
                            <span className="font-black">R$ {totalEmCaixaFisico.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                    <div className="hidden md:block opacity-5 bg-slate-50 p-8 rounded-full">
                        <DollarSign size={120} />
                    </div>
                </div>
            </div>

            {modalAcao && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative">
                        <button onClick={() => setModalAcao(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>

                        <div className="mb-6 mt-2">
                            <h2 className="text-2xl font-black text-slate-800">{modalAcao === 'SANGRIA' ? 'Registrar Sangria' : 'Fechamento de Caixa'}</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                {modalAcao === 'SANGRIA' ? 'Informe o valor em espécie a retirar.' : 'Informe o valor total contado na gaveta.'}
                            </p>
                        </div>

                        <div className="mb-6">
                            <input
                                type="text"
                                value={valorFormatado}
                                onChange={handleInputChange}
                                className={`w-full py-4 text-center text-3xl font-black bg-slate-50 border-2 rounded-2xl outline-none transition-colors shadow-inner ${modalAcao === 'SANGRIA' ? 'text-orange-600 border-orange-200 focus:border-orange-500' : 'text-red-600 border-red-200 focus:border-red-500'}`}
                                autoFocus
                            />
                            <TecladoVirtual />
                        </div>

                        <button
                            onClick={modalAcao === 'SANGRIA' ? handleSangria : handleFecharCaixa}
                            className={`w-full py-5 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95 ${modalAcao === 'SANGRIA' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
                        >
                            {modalAcao === 'SANGRIA' ? 'CONFIRMAR RETIRADA' : 'ENCERRAR OPERAÇÃO'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};