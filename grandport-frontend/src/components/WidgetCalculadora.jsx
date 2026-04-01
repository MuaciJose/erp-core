import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calculator, X, DollarSign, Percent, PieChart, Info } from 'lucide-react';
import { getStoredUser } from '../utils/authStorage';

export const WidgetCalculadora = () => {
    const [aberto, setAberto] = useState(false);
    const [usuario, setUsuario] = useState(null);

    // Valores de Entrada
    const [custo, setCusto] = useState(100.00);
    const [frete, setFrete] = useState(0.00);
    
    // Percentuais
    const [imposto, setImposto] = useState(8.0);
    const [cartao, setCartao] = useState(3.5);
    const [comissao, setComissao] = useState(2.0);
    const [custoFixo, setCustoFixo] = useState(15.0);
    const [lucroDesejado, setLucroDesejado] = useState(20.0);

    // Resultados
    const [precoSugerido, setPrecoSugerido] = useState(0);
    const [lucroReais, setLucroReais] = useState(0);
    const [markupMultiplicador, setMarkupMultiplicador] = useState(0);
    const [erro, setErro] = useState('');

    useEffect(() => {
        setUsuario(getStoredUser());
    }, [aberto]);

    useEffect(() => {
        const custoTotal = parseFloat(custo || 0) + parseFloat(frete || 0);
        const totalPercentuais = parseFloat(imposto || 0) + parseFloat(cartao || 0) + 
                                 parseFloat(comissao || 0) + parseFloat(custoFixo || 0) + 
                                 parseFloat(lucroDesejado || 0);

        if (totalPercentuais >= 100) {
            setErro('A soma dos percentuais não pode ser ≥ 100%.');
            setPrecoSugerido(0);
            return;
        } else {
            setErro('');
        }

        const preco = custoTotal / (1 - (totalPercentuais / 100));
        const lucro = preco * (parseFloat(lucroDesejado || 0) / 100);
        const markupFinal = custoTotal > 0 ? (((preco / custoTotal) - 1) * 100) : 0;

        setPrecoSugerido(preco);
        setLucroReais(lucro);
        setMarkupMultiplicador(markupFinal);
    }, [custo, frete, imposto, cartao, comissao, custoFixo, lucroDesejado]);

    const registrarAuditoria = async () => {
        try {
            await api.post('/api/auditoria/registrar', {
                modulo: 'SISTEMA',
                acao: 'SIMULACAO_PRECO',
                detalhes: `Simulou preço: Custo R$ ${custo} -> Venda R$ ${precoSugerido.toFixed(2)} (Lucro: ${lucroDesejado}%)`
            });
        } catch (e) {
            console.error("Erro ao auditar calculadora", e);
        }
    };

    const handleCopiar = () => {
        navigator.clipboard.writeText(markupMultiplicador.toFixed(2));
        alert(`Markup de ${markupMultiplicador.toFixed(2)}% copiado!`);
        registrarAuditoria();
    };

    // Se o usuário não tiver a permissão 'calculadora', não renderiza nada
    if (!usuario || !usuario.permissoes.includes('calculadora')) {
        return null;
    }

    return (
        <>
            {/* O BOTÃO FLUTUANTE */}
            <button 
                onClick={() => setAberto(true)}
                className={`fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all z-40 flex items-center justify-center ${aberto ? 'hidden' : 'block'}`}
                title="Abrir Calculadora de Markup"
            >
                <Calculator size={28} />
            </button>

            {/* O PAINEL LATERAL */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${aberto ? 'translate-x-0' : 'translate-x-full'}`}>
                
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-lg tracking-widest">CALCULADORA</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Markup e Margem Real</p>
                        </div>
                    </div>
                    <button onClick={() => setAberto(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Preço de Venda Sugerido</p>
                        <h2 className="text-4xl font-black text-green-400 mb-4">R$ {precoSugerido.toFixed(2)}</h2>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Lucro Líquido</p>
                                <p className="text-lg font-black text-white">R$ {lucroReais.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Markup no Sistema</p>
                                <p className="text-lg font-black text-blue-400">+{markupMultiplicador.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>

                    {erro && <div className="p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl text-center border border-red-200">{erro}</div>}

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-black text-sm text-slate-800 border-b pb-2">1. Custos de Entrada</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo (NF)</label>
                                <input type="number" value={custo} onChange={e => setCusto(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-slate-700 outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frete (R$)</label>
                                <input type="number" value={frete} onChange={e => setFrete(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-slate-700 outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-black text-sm text-slate-800 border-b pb-2">2. Despesas da Loja (%)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Imposto DAS</label>
                                <input type="number" step="0.1" value={imposto} onChange={e => setImposto(e.target.value)} className="w-full p-2 bg-orange-50 border border-orange-100 rounded-lg font-bold text-orange-700 outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Taxa Cartão</label>
                                <input type="number" step="0.1" value={cartao} onChange={e => setCartao(e.target.value)} className="w-full p-2 bg-orange-50 border border-orange-100 rounded-lg font-bold text-orange-700 outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Comissão Vend.</label>
                                <input type="number" step="0.1" value={comissao} onChange={e => setComissao(e.target.value)} className="w-full p-2 bg-orange-50 border border-orange-100 rounded-lg font-bold text-orange-700 outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rateio Custo Fixo</label>
                                <input type="number" step="0.1" value={custoFixo} onChange={e => setCustoFixo(e.target.value)} className="w-full p-2 bg-blue-50 border border-blue-100 rounded-lg font-bold text-blue-700 outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-5 rounded-2xl border border-green-200 shadow-inner">
                        <label className="block text-xs font-black text-green-700 uppercase mb-2 text-center">3. Lucro Líquido Desejado (%)</label>
                        <div className="flex justify-center items-center gap-2">
                            <input type="number" step="0.1" value={lucroDesejado} onChange={e => setLucroDesejado(e.target.value)} className="w-32 p-3 text-center bg-white border-2 border-green-300 rounded-xl font-black text-green-700 text-xl outline-none focus:border-green-600" />
                            <span className="text-xl font-black text-green-600">%</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCopiar}
                        className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl transition-colors shadow-sm"
                    >
                        COPIAR MARKUP (+{markupMultiplicador.toFixed(2)}%)
                    </button>
                    
                </div>
            </div>
            
            {aberto && (
                <div 
                    onClick={() => setAberto(false)} 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                ></div>
            )}
        </>
    );
};
