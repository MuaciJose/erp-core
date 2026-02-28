import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Wallet, Landmark, Smartphone, Plus, ArrowRightLeft, X, Save } from 'lucide-react';

const ModalNovaConta = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({ 
        nome: '', 
        tipo: 'BANCO', 
        saldoAtual: 0,
        numeroBanco: '',
        agencia: '',
        numeroConta: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/financeiro/contas-bancarias', form);
            alert("Conta cadastrada com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            alert("Erro ao cadastrar conta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800">Nova Conta</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome da Conta</label>
                        <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" placeholder="Ex: Itaú Empresa, Caixa Gaveta..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold">
                            <option value="BANCO">Banco</option>
                            <option value="CAIXA_FISICO">Caixa Físico</option>
                            <option value="CARTEIRA_DIGITAL">Carteira Digital (PIX)</option>
                        </select>
                    </div>

                    {form.tipo === 'BANCO' && (
                        <div className="grid grid-cols-3 gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in">
                            <div>
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Nº Banco</label>
                                <input type="text" value={form.numeroBanco} onChange={e => setForm({...form, numeroBanco: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-sm" placeholder="001" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Agência</label>
                                <input type="text" value={form.agencia} onChange={e => setForm({...form, agencia: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-sm" placeholder="0001" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Conta</label>
                                <input type="text" value={form.numeroConta} onChange={e => setForm({...form, numeroConta: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-sm" placeholder="12345-6" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Saldo Inicial (R$)</label>
                        <input type="number" step="0.01" required value={form.saldoAtual} onChange={e => setForm({...form, saldoAtual: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-black text-blue-600" />
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">CANCELAR</button>
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                            <Save size={20}/> {loading ? 'SALVANDO...' : 'SALVAR CONTA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ModalTransferencia = ({ contas, onClose, onSuccess }) => {
    const [form, setForm] = useState({ contaOrigemId: '', contaDestinoId: '', valor: 0 });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.contaOrigemId === form.contaDestinoId) {
            alert("As contas de origem e destino devem ser diferentes.");
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/financeiro/contas-bancarias/transferir', form);
            alert("Transferência realizada com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            alert("Erro ao realizar transferência: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800">Transferir</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Conta de Origem</label>
                        <select required value={form.contaOrigemId} onChange={e => setForm({...form, contaOrigemId: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold">
                            <option value="">Selecione...</option>
                            {contas.map(c => <option key={c.id} value={c.id}>{c.nome} (R$ {c.saldoAtual.toFixed(2)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Conta de Destino</label>
                        <select required value={form.contaDestinoId} onChange={e => setForm({...form, contaDestinoId: e.target.value})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold">
                            <option value="">Selecione...</option>
                            {contas.map(c => <option key={c.id} value={c.id}>{c.nome} (R$ {c.saldoAtual.toFixed(2)})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor (R$)</label>
                        <input type="number" step="0.01" required value={form.valor} onChange={e => setForm({...form, valor: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-black text-blue-600" />
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">CANCELAR</button>
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                            <ArrowRightLeft size={20}/> {loading ? 'PROCESSANDO...' : 'CONFIRMAR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ContasBancarias = () => {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAcao, setModalAcao] = useState(null); // 'NOVA' ou 'TRANSFERIR'

    const carregarContas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/financeiro/contas-bancarias');
            setContas(res.data);
        } catch (error) {
            console.error("Erro ao carregar contas bancárias", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarContas(); }, []);

    const saldoTotal = contas.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

    const renderIcone = (tipo) => {
        if (tipo === 'CAIXA_FISICO') return <Wallet size={28} className="text-orange-600" />;
        if (tipo === 'BANCO') return <Landmark size={28} className="text-blue-600" />;
        return <Smartphone size={28} className="text-purple-600" />;
    };

    if (loading) return <div className="p-8 text-center font-bold text-gray-500">Carregando tesouraria...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Landmark className="text-blue-600 bg-blue-100 p-1 rounded-lg" size={36} /> 
                        CONTAS BANCÁRIAS E CAIXA
                    </h1>
                    <p className="text-slate-500 mt-1">Gestão de saldos e tesouraria</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setModalAcao('TRANSFERIR')}
                        className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200"
                    >
                        <ArrowRightLeft size={20} /> TRANSFERIR
                    </button>
                    <button 
                        onClick={() => setModalAcao('NOVA')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"
                    >
                        <Plus size={20} /> NOVA CONTA
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white mb-8 flex justify-between items-center">
                <div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Saldo Total Consolidado</p>
                    <h2 className="text-5xl font-black text-green-400">R$ {saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contas.map(conta => (
                    <div key={conta.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl ${
                                conta.tipo === 'CAIXA_FISICO' ? 'bg-orange-50' : 
                                conta.tipo === 'BANCO' ? 'bg-blue-50' : 'bg-purple-50'
                            }`}>
                                {renderIcone(conta.tipo)}
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                {conta.tipo?.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-700 text-lg mb-1">{conta.nome}</h3>
                        {conta.tipo === 'BANCO' && (
                            <p className="text-[10px] text-slate-400 font-mono mb-2">
                                B: {conta.numeroBanco} | A: {conta.agencia} | C: {conta.numeroConta}
                            </p>
                        )}
                        <p className="text-3xl font-black text-slate-900">R$ {(conta.saldoAtual || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                ))}
                {contas.length === 0 && (
                    <div className="col-span-3 p-12 text-center text-gray-400 italic bg-gray-50 rounded-3xl border-2 border-dashed">
                        Nenhuma conta bancária cadastrada.
                    </div>
                )}
            </div>

            {modalAcao === 'NOVA' && (
                <ModalNovaConta 
                    onClose={() => setModalAcao(null)}
                    onSuccess={carregarContas}
                />
            )}

            {modalAcao === 'TRANSFERIR' && (
                <ModalTransferencia 
                    contas={contas}
                    onClose={() => setModalAcao(null)}
                    onSuccess={carregarContas}
                />
            )}
        </div>
    );
};
