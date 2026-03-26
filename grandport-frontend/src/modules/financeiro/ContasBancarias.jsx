import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Wallet, Landmark, Smartphone, Plus, ArrowRightLeft,
    Save, ArrowLeft, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ContasBancarias = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);

    // ? ESTADOS DE FLUXO
    const [modoAtual, setModoAtual] = useState('LISTA'); // LISTA, NOVA_CONTA, TRANSFERENCIA, EDITAR_CONTA
    const [processando, setProcessando] = useState(false);

    // 🚀 ESTADOS PARA NOVA CONTA (AGORA COM OS CAMPOS EDI BLINDADOS)
    const [formNovaConta, setFormNovaConta] = useState({
        nome: '', tipo: 'BANCO', numeroBanco: '', agencia: '', numeroConta: '',
        digitoConta: '', carteira: '', convenio: '', nossoNumeroAtual: '1', tipoCnab: '400'
    });
    const [saldoInicialInput, setSaldoInicialInput] = useState('0');

    // ESTADOS PARA EDIÇÃO DE CONTA
    const [contaEmEdicao, setContaEmEdicao] = useState(null);
    const [formEdicaoConta, setFormEdicaoConta] = useState({
        nome: '', tipo: 'BANCO', numeroBanco: '', agencia: '', numeroConta: '',
        digitoConta: '', carteira: '', convenio: '', nossoNumeroAtual: '1', tipoCnab: '400'
    });

    // ESTADOS PARA TRANSFERÊNCIA
    const [formTransf, setFormTransf] = useState({ contaOrigemId: '', contaDestinoId: '' });
    const [valorTransfInput, setValorTransfInput] = useState('0');

    // =======================================================================
    // MÁSCARAS E CALCULADORAS
    // =======================================================================
    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleValorChange = (setter) => (valorDigitado) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setter(valorRealFloat.toString());
    };

    // =======================================================================
    // BUSCA DE DADOS
    // =======================================================================
    const carregarContas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/financeiro/contas-bancarias');
            setContas(res.data);
        } catch (error) {
            toast.error("Erro ao carregar tesouraria.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (modoAtual === 'LISTA') carregarContas();
    }, [modoAtual]);

    const saldoTotal = contas.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

    const renderIcone = (tipo) => {
        if (tipo === 'CAIXA_FISICO') return <Wallet size={28} className="text-orange-600" />;
        if (tipo === 'BANCO') return <Landmark size={28} className="text-blue-600" />;
        return <Smartphone size={28} className="text-purple-600" />;
    };

    // =======================================================================
    // ? ATALHOS DE TECLADO (MODO NINJA COMPLETO)
    // =======================================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInputFocused = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT';

            // ATALHOS NA TELA PRINCIPAL (LISTA)
            if (modoAtual === 'LISTA' && !isInputFocused) {
                if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    abrirNovaConta();
                } else if (e.key.toLowerCase() === 't') {
                    e.preventDefault();
                    abrirTransferencia();
                }
            }

            // ATALHOS NAS TELAS DE FORMULÁRIO (NOVA_CONTA, EDITAR_CONTA OU TRANSFERENCIA)
            if (modoAtual === 'NOVA_CONTA' || modoAtual === 'EDITAR_CONTA' || modoAtual === 'TRANSFERENCIA') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    voltarParaLista();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!processando) {
                        if (modoAtual === 'NOVA_CONTA') submitNovaConta();
                        if (modoAtual === 'EDITAR_CONTA') submitEdicaoConta();
                        if (modoAtual === 'TRANSFERENCIA') submitTransferencia();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // =======================================================================
    // TRANSIÇÕES E AÇÕES
    // =======================================================================
    const abrirNovaConta = () => {
        // 🚀 Zera os campos EDI também
        setFormNovaConta({
            nome: '', tipo: 'BANCO', numeroBanco: '', agencia: '', numeroConta: '',
            digitoConta: '', carteira: '', convenio: '', nossoNumeroAtual: '1', tipoCnab: '400'
        });
        setSaldoInicialInput('0');
        setModoAtual('NOVA_CONTA');
    };

    const abrirEdicaoConta = (conta) => {
        setContaEmEdicao(conta);
        setFormEdicaoConta({
            nome: conta.nome,
            tipo: conta.tipo,
            numeroBanco: conta.numeroBanco || '',
            agencia: conta.agencia || '',
            numeroConta: conta.numeroConta || '',
            digitoConta: conta.digitoConta || '',
            carteira: conta.carteira || '',
            convenio: conta.convenio || '',
            nossoNumeroAtual: conta.nossoNumeroAtual || '1',
            tipoCnab: conta.tipoCnab || '400'
        });
        setModoAtual('EDITAR_CONTA');
    };

    const submitEdicaoConta = async () => {
        if (!formEdicaoConta.nome) return toast.error("Informe o nome da conta.");

        setProcessando(true);
        const toastId = toast.loading("Atualizando conta...");

        try {
            const payload = { ...formEdicaoConta };
            await api.put(`/api/financeiro/contas-bancarias/${contaEmEdicao.id}`, payload);
            toast.success("Conta atualizada com sucesso!", { id: toastId });
            setModoAtual('LISTA');
            setContaEmEdicao(null);
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao atualizar conta.";
            toast.error(msg, { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const excluirConta = async (conta) => {
        const confirmacao = window.confirm(`Tem certeza que deseja excluir a conta "${conta.nome}"?\n\n⚠️ Atenção: O saldo deve estar zerado para excluir.`);
        if (!confirmacao) return;

        const toastId = toast.loading("Excluindo conta...");

        try {
            await api.delete(`/api/financeiro/contas-bancarias/${conta.id}`);
            toast.success("Conta excluída com sucesso!", { id: toastId });
            carregarContas();
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao excluir conta.";
            toast.error(msg, { id: toastId });
        }
    };

    const abrirTransferencia = () => {
        setFormTransf({ contaOrigemId: '', contaDestinoId: '' });
        setValorTransfInput('0');
        setModoAtual('TRANSFERENCIA');
    };

    const voltarParaLista = () => setModoAtual('LISTA');

    const submitNovaConta = async () => {
        if (!formNovaConta.nome) return toast.error("Informe o nome da conta.");

        setProcessando(true);
        const toastId = toast.loading("Salvando nova conta...");

        try {
            const payload = {
                ...formNovaConta,
                saldoAtual: parseFloat(saldoInicialInput)
            };
            await api.post('/api/financeiro/contas-bancarias', payload);
            toast.success("Conta cadastrada com sucesso!", { id: toastId });
            setModoAtual('LISTA');
        } catch (error) {
            toast.error("Erro ao cadastrar conta.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    const submitTransferencia = async () => {
        const valorNumerico = parseFloat(valorTransfInput);

        if (!formTransf.contaOrigemId) return toast.error("Selecione a conta de origem.");
        if (!formTransf.contaDestinoId) return toast.error("Selecione a conta de destino.");
        if (formTransf.contaOrigemId === formTransf.contaDestinoId) return toast.error("As contas de origem e destino devem ser diferentes.");
        if (valorNumerico <= 0) return toast.error("O valor da transferência deve ser maior que zero.");

        const contaOrigem = contas.find(c => c.id.toString() === formTransf.contaOrigemId);
        if (contaOrigem && contaOrigem.saldoAtual < valorNumerico) {
            return toast.error(`Saldo insuficiente na conta origem. Saldo atual: R$ ${formatarMoeda(contaOrigem.saldoAtual)}`);
        }

        setProcessando(true);
        const toastId = toast.loading("Processando transferência...");

        try {
            const payload = {
                contaOrigemId: Number(formTransf.contaOrigemId),
                contaDestinoId: Number(formTransf.contaDestinoId),
                valor: valorNumerico
            };
            await api.post('/api/financeiro/contas-bancarias/transferir', payload);
            toast.success("Transferência realizada com sucesso!", { id: toastId });
            setModoAtual('LISTA');
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao realizar transferência.", { id: toastId });
        } finally {
            setProcessando(false);
        }
    };

    // =======================================================================
    // RENDERIZAÇÃO
    // =======================================================================

    if (modoAtual === 'LISTA') {
        if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400"><Loader2 className="animate-spin mr-2"/> ACESSANDO TESOURARIA...</div>;

        return (
            <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div title="Painel de controle financeiro">
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Landmark className="text-blue-600 bg-blue-100 p-2 rounded-xl" size={40} />
                            Tesouraria e Contas
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Gestão de saldos, caixas físicos e contas bancárias</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={abrirTransferencia}
                            title="Atalho: Pressione 'T'"
                            className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                        >
                            <ArrowRightLeft size={20} /> TRANSFERIR (T)
                        </button>
                        <button
                            onClick={abrirNovaConta}
                            title="Atalho: Pressione 'N'"
                            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg transition-transform transform hover:-translate-y-1"
                        >
                            <Plus size={20} /> NOVA CONTA (N)
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl text-white mb-10 relative overflow-hidden border-t-4 border-blue-500" title="Soma total de todo o dinheiro da empresa">
                    <div className="absolute -right-10 -top-10 opacity-10"><Wallet size={200}/></div>
                    <div className="relative z-10">
                        <p className="text-blue-400 font-black uppercase tracking-widest text-sm mb-2">Saldo Total Consolidado</p>
                        <h2 className="text-6xl font-black text-emerald-400 tracking-tighter">R$ {formatarMoeda(saldoTotal)}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {contas.map(conta => (
                        <div key={conta.id} className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100 hover:border-blue-300 transition-all hover:shadow-md flex flex-col justify-between min-h-[200px]" title={`Conta: ${conta.nome}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${
                                        conta.tipo === 'CAIXA_FISICO' ? 'bg-orange-50' :
                                            conta.tipo === 'BANCO' ? 'bg-blue-50' : 'bg-purple-50'
                                    }`}>
                                        {renderIcone(conta.tipo)}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                        {conta.tipo?.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{conta.nome}</h3>
                                {conta.tipo === 'BANCO' ? (
                                    <p className="text-[10px] font-bold text-slate-400 font-mono">
                                        B: {conta.numeroBanco || '---'} | Ag: {conta.agencia || '---'} | C: {conta.numeroConta || '---'}-{conta.digitoConta || 'X'}
                                    </p>
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-400">Moeda em espécie / PIX local</p>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Saldo Disponível</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight mb-4">R$ {formatarMoeda(conta.saldoAtual)}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => abrirEdicaoConta(conta)}
                                        title="Editar conta"
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        onClick={() => excluirConta(conta)}
                                        title="Excluir conta (saldo deve estar zerado)"
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-2 rounded-lg transition-colors"
                                    >
                                        🗑️ Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (modoAtual === 'NOVA_CONTA') {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} title="Atalho: Esc" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Tesouraria (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-blue-500">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Landmark className="text-blue-600" size={32} /> Criar Nova Conta
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mt-2">Cadastre uma nova gaveta de caixa, banco ou carteira digital.</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div title="Como essa conta será chamada no sistema">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Conta / Identificação</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={formNovaConta.nome}
                                    onChange={e => setFormNovaConta({...formNovaConta, nome: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Ex: Itaú Loja 01, Caixa Gaveta..."
                                />
                            </div>

                            <div title="Categoria para ícones e organização">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Conta</label>
                                <select
                                    value={formNovaConta.tipo}
                                    onChange={e => setFormNovaConta({...formNovaConta, tipo: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
                                >
                                    <option value="BANCO">Conta Bancária Oficial</option>
                                    <option value="CAIXA_FISICO">Caixa Físico (Dinheiro na Gaveta)</option>
                                    <option value="CARTEIRA_DIGITAL">Carteira Digital (MercadoPago, PagSeguro)</option>
                                </select>
                            </div>

                            {/* 🚀 O CAMPO DE BATALHA DO EDI! */}
                            {formNovaConta.tipo === 'BANCO' && (
                                <div className="space-y-4 p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 animate-fade-in">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-200 pb-2">Configurações de Remessa e Boleto</h3>

                                    {/* Linha 1: Banco, Agência, Conta, Dígito */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <div title="Código da Instituição (Ex: 001, 341)">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Nº Banco</label>
                                            <input type="text" value={formNovaConta.numeroBanco} onChange={e => setFormNovaConta({...formNovaConta, numeroBanco: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="341" />
                                        </div>
                                        <div title="Agência">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Agência</label>
                                            <input type="text" value={formNovaConta.agencia} onChange={e => setFormNovaConta({...formNovaConta, agencia: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="0001" />
                                        </div>
                                        <div title="Número da Conta">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Conta</label>
                                            <input type="text" value={formNovaConta.numeroConta} onChange={e => setFormNovaConta({...formNovaConta, numeroConta: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="12345" />
                                        </div>
                                        <div title="Dígito da Conta">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Dígito</label>
                                            <input type="text" value={formNovaConta.digitoConta} onChange={e => setFormNovaConta({...formNovaConta, digitoConta: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="6" />
                                        </div>
                                    </div>

                                    {/* Linha 2: EDI / CNAB */}
                                    <div className="grid grid-cols-4 gap-3 pt-2">
                                        <div title="Carteira de Cobrança">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Carteira</label>
                                            <input type="text" value={formNovaConta.carteira} onChange={e => setFormNovaConta({...formNovaConta, carteira: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="109" />
                                        </div>
                                        <div title="Convênio (BB/Caixa)">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Convênio</label>
                                            <input type="text" value={formNovaConta.convenio} onChange={e => setFormNovaConta({...formNovaConta, convenio: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="Op" />
                                        </div>
                                        <div title="Padrão CNAB">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">CNAB</label>
                                            <select value={formNovaConta.tipoCnab} onChange={e => setFormNovaConta({...formNovaConta, tipoCnab: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400 cursor-pointer">
                                                <option value="400">400</option>
                                                <option value="240">240</option>
                                            </select>
                                        </div>
                                        <div title="Nosso Número Atual">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Nosso N.º</label>
                                            <input type="number" value={formNovaConta.nossoNumeroAtual} onChange={e => setFormNovaConta({...formNovaConta, nossoNumeroAtual: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="1" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center bg-emerald-50 p-8 rounded-3xl border-2 border-emerald-100">
                            <label className="block text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Saldo Inicial da Conta</label>
                            <div className="flex items-center gap-3 bg-white border-2 border-emerald-200 p-4 rounded-2xl focus-within:border-emerald-500 transition-colors shadow-sm" title="Digite o valor atual desta conta">
                                <span className="text-xl font-black text-emerald-400 pl-2">R$</span>
                                <input
                                    type="text"
                                    value={formatarMoeda(saldoInicialInput)}
                                    onChange={(e) => handleValorChange(setSaldoInicialInput)(e.target.value)}
                                    className="w-full bg-transparent outline-none font-black text-emerald-700 text-4xl"
                                />
                            </div>
                            <p className="text-xs font-bold text-emerald-500 mt-4 flex items-center gap-1">
                                <AlertCircle size={14}/> Com quanto de dinheiro essa conta está começando?
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={submitNovaConta}
                            disabled={processando || !formNovaConta.nome}
                            title="Atalho: Ctrl + Enter"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <Save size={32}/>}
                            SALVAR NOVA CONTA (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (modoAtual === 'EDITAR_CONTA' && contaEmEdicao) {
        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} title="Atalho: Esc" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Tesouraria (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-blue-500">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Landmark className="text-blue-600" size={32} /> Editar Conta
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mt-2">Atualize os dados da conta: {contaEmEdicao.nome}</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div title="Como essa conta será chamada no sistema">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nome da Conta / Identificação</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={formEdicaoConta.nome}
                                    onChange={e => setFormEdicaoConta({...formEdicaoConta, nome: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Ex: Itaú Loja 01, Caixa Gaveta..."
                                />
                            </div>

                            <div title="Categoria para ícones e organização">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Conta</label>
                                <select
                                    value={formEdicaoConta.tipo}
                                    onChange={e => setFormEdicaoConta({...formEdicaoConta, tipo: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
                                >
                                    <option value="BANCO">Conta Bancária Oficial</option>
                                    <option value="CAIXA_FISICO">Caixa Físico (Dinheiro na Gaveta)</option>
                                    <option value="CARTEIRA_DIGITAL">Carteira Digital (MercadoPago, PagSeguro)</option>
                                </select>
                            </div>

                            {/* 🚀 O CAMPO DE BATALHA DO EDI! */}
                            {formEdicaoConta.tipo === 'BANCO' && (
                                <div className="space-y-4 p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 animate-fade-in">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-200 pb-2">Configurações de Remessa e Boleto</h3>

                                    {/* Linha 1: Banco, Agência, Conta, Dígito */}
                                    <div className="grid grid-cols-4 gap-3">
                                        <div title="Código da Instituição (Ex: 001, 341)">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Nº Banco</label>
                                            <input type="text" value={formEdicaoConta.numeroBanco} onChange={e => setFormEdicaoConta({...formEdicaoConta, numeroBanco: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="341" />
                                        </div>
                                        <div title="Agência">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Agência</label>
                                            <input type="text" value={formEdicaoConta.agencia} onChange={e => setFormEdicaoConta({...formEdicaoConta, agencia: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="0001" />
                                        </div>
                                        <div title="Número da Conta">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Conta</label>
                                            <input type="text" value={formEdicaoConta.numeroConta} onChange={e => setFormEdicaoConta({...formEdicaoConta, numeroConta: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="12345" />
                                        </div>
                                        <div title="Dígito da Conta">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Dígito</label>
                                            <input type="text" value={formEdicaoConta.digitoConta} onChange={e => setFormEdicaoConta({...formEdicaoConta, digitoConta: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="6" />
                                        </div>
                                    </div>

                                    {/* Linha 2: EDI / CNAB */}
                                    <div className="grid grid-cols-4 gap-3 pt-2">
                                        <div title="Carteira de Cobrança">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Carteira</label>
                                            <input type="text" value={formEdicaoConta.carteira} onChange={e => setFormEdicaoConta({...formEdicaoConta, carteira: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="109" />
                                        </div>
                                        <div title="Convênio (BB/Caixa)">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Convênio</label>
                                            <input type="text" value={formEdicaoConta.convenio} onChange={e => setFormEdicaoConta({...formEdicaoConta, convenio: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="Op" />
                                        </div>
                                        <div title="Padrão CNAB">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">CNAB</label>
                                            <select value={formEdicaoConta.tipoCnab} onChange={e => setFormEdicaoConta({...formEdicaoConta, tipoCnab: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400 cursor-pointer">
                                                <option value="400">400</option>
                                                <option value="240">240</option>
                                            </select>
                                        </div>
                                        <div title="Nosso Número Atual">
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Nosso N.º</label>
                                            <input type="number" value={formEdicaoConta.nossoNumeroAtual} onChange={e => setFormEdicaoConta({...formEdicaoConta, nossoNumeroAtual: e.target.value})} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl font-bold outline-none focus:border-blue-400" placeholder="1" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-emerald-50 p-8 rounded-3xl border-2 border-emerald-100">
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">ℹ️ Informações</p>
                            <div className="space-y-3 text-sm font-bold text-slate-700">
                                <p>💰 <strong>Saldo Atual:</strong> R$ {formatarMoeda(contaEmEdicao.saldoAtual)}</p>
                                <p className="text-xs text-slate-500">⚠️ O saldo não pode ser alterado aqui. Use Transferências para ajustar.</p>
                                <p className="text-xs text-slate-500 border-t border-emerald-200 pt-3 mt-3">✏️ Modifique os dados bancários e clique em SALVAR para confirmar as alterações.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={submitEdicaoConta}
                            disabled={processando || !formEdicaoConta.nome}
                            title="Atalho: Ctrl + Enter"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <Save size={32}/>}
                            SALVAR ALTERAÇÕES (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (modoAtual === 'TRANSFERENCIA') {
        const origemSelecionada = contas.find(c => c.id.toString() === formTransf.contaOrigemId);

        return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <button onClick={voltarParaLista} title="Atalho: Esc" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                    <ArrowLeft size={20} /> Voltar para Tesouraria (Esc)
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden border-t-8 border-slate-800">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <ArrowRightLeft className="text-slate-600" size={32} /> Transferência Interna
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mt-2">Mova dinheiro do Caixa para o Banco (Sangria) ou entre contas bancárias.</p>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 relative">
                            <div title="De onde o dinheiro vai sair">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Retirar Dinheiro De (Origem)</label>
                                <select
                                    value={formTransf.contaOrigemId}
                                    onChange={e => setFormTransf({...formTransf, contaOrigemId: e.target.value})}
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-red-500 outline-none font-bold text-slate-700 cursor-pointer shadow-sm"
                                >
                                    <option value="">Selecione a origem...</option>
                                    {contas.map(c => <option key={c.id} value={c.id}>{c.nome} (Saldo: R$ {formatarMoeda(c.saldoAtual)})</option>)}
                                </select>
                            </div>

                            <div className="absolute left-[10%] top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center border-4 border-white z-10 hidden md:flex">
                                <ArrowRightLeft size={14} className="text-slate-500 rotate-90" />
                            </div>

                            <div title="Para onde o dinheiro vai">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Enviar Dinheiro Para (Destino)</label>
                                <select
                                    value={formTransf.contaDestinoId}
                                    onChange={e => setFormTransf({...formTransf, contaDestinoId: e.target.value})}
                                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 outline-none font-bold text-slate-700 cursor-pointer shadow-sm"
                                >
                                    <option value="">Selecione o destino...</option>
                                    {contas.map(c => <option key={c.id} value={c.id} disabled={c.id.toString() === formTransf.contaOrigemId}>{c.nome}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center items-center">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Valor a Transferir</label>
                            <div className="flex items-center gap-3 bg-white border-4 border-slate-200 p-6 rounded-3xl focus-within:border-blue-500 transition-colors shadow-inner w-full" title="Digite a quantia que será movida">
                                <span className="text-2xl font-black text-slate-300 pl-2">R$</span>
                                <input
                                    type="text"
                                    autoFocus
                                    value={formatarMoeda(valorTransfInput)}
                                    onChange={(e) => handleValorChange(setValorTransfInput)(e.target.value)}
                                    className="w-full bg-transparent outline-none font-black text-slate-800 text-5xl text-center"
                                />
                            </div>

                            {origemSelecionada && (parseFloat(valorTransfInput) > origemSelecionada.saldoAtual) && (
                                <p className="text-xs font-bold text-red-500 mt-4 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                                    <AlertCircle size={14}/> Atenção: Saldo de origem insuficiente. A conta ficará negativa.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-100 border-t border-slate-200 flex gap-4">
                        <button
                            onClick={submitTransferencia}
                            disabled={processando || !formTransf.contaOrigemId || !formTransf.contaDestinoId || parseFloat(valorTransfInput) <= 0}
                            title="Atalho: Ctrl + Enter"
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-xl py-6 rounded-2xl shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none"
                        >
                            {processando ? <Loader2 size={32} className="animate-spin"/> : <CheckCircle size={32}/>}
                            CONFIRMAR TRANSFERÊNCIA (Ctrl+Enter)
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};