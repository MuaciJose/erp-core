import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Lock, Unlock, DollarSign, CreditCard, Smartphone, ArrowDownCircle, Printer } from 'lucide-react';

export const ControleCaixa = () => {
    const [caixa, setCaixa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalAcao, setModalAcao] = useState(null);
    const [valorInput, setValorInput] = useState('');

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

    useEffect(() => { carregarCaixa(); }, []);

    const handleAbrirCaixa = async () => {
        try {
            await api.post('/api/caixa/abrir', { saldoInicial: parseFloat(valorInput || 0) });
            setModalAcao(null);
            carregarCaixa();
        } catch (error) {
            alert('Erro ao abrir caixa: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleSangria = async () => {
        try {
            await api.post('/api/caixa/sangria', { valor: parseFloat(valorInput), motivo: 'Retirada manual' });
            setModalAcao(null);
            setValorInput('');
            carregarCaixa();
        } catch (error) {
            alert('Erro ao registrar sangria: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFecharCaixa = async () => {
        if (window.confirm("Tem certeza que deseja fechar o caixa? Esta ação é irreversível para o dia.")) {
            try {
                await api.post('/api/caixa/fechar', { valorInformado: parseFloat(valorInput || 0) });
                setModalAcao(null);
                setValorInput('');
                carregarCaixa();
                alert("Caixa fechado com sucesso!");
            } catch (error) {
                alert('Erro ao fechar caixa: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    if (loading) return <div className="p-8 font-bold text-gray-500">A carregar informações do caixa...</div>;

    if (caixa.status === 'FECHADO') {
        return (
            <div className="p-8 max-w-2xl mx-auto mt-20">
                <div className="bg-white p-10 rounded-3xl shadow-xl border">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={48} className="text-slate-400" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">CAIXA FECHADO</h1>
                    <p className="text-slate-500 mb-8">O terminal de vendas está bloqueado. Abra o caixa para começar.</p>
                    <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-left">
                        <label className="block text-sm font-bold text-blue-800 uppercase mb-2">Fundo de Troco (Saldo Inicial)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-4 text-blue-600 font-black text-xl">R$</span>
                            <input type="number" value={valorInput} onChange={(e) => setValorInput(e.target.value)} className="w-full pl-12 pr-4 py-4 text-2xl font-black text-blue-700 bg-white border-2 border-blue-200 rounded-xl" placeholder="0.00" autoFocus />
                        </div>
                    </div>
                    <button onClick={handleAbrirCaixa} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                        <Unlock size={24} /> ABRIR CAIXA
                    </button>
                </div>
            </div>
        );
    }

    const totalEmCaixaFisico = (caixa.saldoInicial + caixa.dinheiro) - caixa.sangrias;
    const faturamentoTotal = caixa.dinheiro + caixa.cartao + caixa.pix;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Unlock className="text-green-500" /> CAIXA ABERTO</h1>
                    <p className="text-slate-500 font-bold mt-1">Operador: Caixa 01</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { setValorInput(''); setModalAcao('SANGRIA'); }} className="bg-orange-100 text-orange-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2"><ArrowDownCircle size={20} /> SANGRIA</button>
                    <button onClick={() => { setValorInput(''); setModalAcao('FECHAR'); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2"><Lock size={20} /> FECHAR CAIXA</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-green-500"><p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><DollarSign size={16}/> Dinheiro</p><h2 className="text-2xl font-black mt-2">R$ {caixa.dinheiro.toFixed(2)}</h2></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500"><p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><CreditCard size={16}/> Cartão</p><h2 className="text-2xl font-black mt-2">R$ {caixa.cartao.toFixed(2)}</h2></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-purple-500"><p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><Smartphone size={16}/> PIX</p><h2 className="text-2xl font-black mt-2">R$ {caixa.pix.toFixed(2)}</h2></div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white"><p className="text-sm font-bold text-slate-400 uppercase">Faturamento Total</p><h2 className="text-3xl font-black text-blue-400 mt-1">R$ {faturamentoTotal.toFixed(2)}</h2></div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border">
                <div className="bg-slate-50 p-6 border-b"><h3 className="font-black text-lg text-slate-700">RESUMO DA GAVETA (Dinheiro)</h3></div>
                <div className="p-8 flex justify-between items-center">
                    <div className="space-y-4">
                        <div className="flex justify-between w-64 text-slate-600"><span>Troco Inicial:</span><span className="font-bold">R$ {caixa.saldoInicial.toFixed(2)}</span></div>
                        <div className="flex justify-between w-64 text-green-600"><span>(+) Entradas Dinheiro:</span><span className="font-bold">R$ {caixa.dinheiro.toFixed(2)}</span></div>
                        <div className="flex justify-between w-64 text-red-600 border-b pb-4"><span>(-) Sangrias:</span><span className="font-bold">R$ {caixa.sangrias.toFixed(2)}</span></div>
                        <div className="flex justify-between w-64 text-slate-900 text-lg"><span className="font-black">SALDO ESPERADO:</span><span className="font-black">R$ {totalEmCaixaFisico.toFixed(2)}</span></div>
                    </div>
                    <div className="text-center opacity-20"><Printer size={100} /></div>
                </div>
            </div>

            {modalAcao && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-black mb-2 text-slate-800">{modalAcao === 'SANGRIA' ? 'Registrar Retirada' : 'Fechamento de Caixa'}</h2>
                        <p className="text-slate-500 mb-6">{modalAcao === 'SANGRIA' ? 'Informe o valor a retirar.' : 'Informe o valor total contado na gaveta.'}</p>
                        <div className="relative mb-8">
                            <span className="absolute left-4 top-4 text-slate-400 font-black text-xl">R$</span>
                            <input type="number" autoFocus value={valorInput} onChange={(e) => setValorInput(e.target.value)} className="w-full pl-12 pr-4 py-4 text-2xl font-black text-slate-800 bg-slate-50 border-2 rounded-xl" placeholder="0.00" />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setModalAcao(null)} className="flex-1 py-4 text-slate-500 font-bold rounded-xl">CANCELAR</button>
                            <button onClick={modalAcao === 'SANGRIA' ? handleSangria : handleFecharCaixa} className={`flex-1 py-4 text-white font-black rounded-xl ${modalAcao === 'SANGRIA' ? 'bg-orange-600' : 'bg-red-600'}`}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
