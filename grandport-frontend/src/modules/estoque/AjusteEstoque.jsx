import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Search, Package, ArrowDownToLine, ArrowUpFromLine, ClipboardList,
    Save, CheckCircle, AlertTriangle, Info, X, Boxes
} from 'lucide-react';

export const AjusteEstoque = () => {
    // ESTADOS
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);

    // FORMULÁRIO DE AJUSTE
    const [tipoAjuste, setTipoAjuste] = useState('ENTRADA'); // ENTRADA, SAIDA, INVENTARIO
    const [quantidadeDigitada, setQuantidadeDigitada] = useState('');
    const [motivo, setMotivo] = useState('');

    const [notificacao, setNotificacao] = useState(null);
    const [carregando, setCarregando] = useState(false);

    const inputBuscaRef = useRef(null);

    const showToast = (tipo, titulo, mensagem) => {
        setNotificacao({ tipo, titulo, mensagem });
        setTimeout(() => setNotificacao(null), 4000);
    };

    // BUSCA DE PRODUTOS
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (busca.length > 2) {
                try {
                    const res = await api.get(`/api/produtos?busca=${busca}`);
                    setResultados(res.data);
                } catch (error) {
                    setResultados([]);
                }
            } else {
                setResultados([]);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [busca]);

    const selecionarProduto = (produto) => {
        setProdutoSelecionado(produto);
        setBusca('');
        setResultados([]);
        setQuantidadeDigitada('');
        setMotivo('');
    };

    const limparSelecao = () => {
        setProdutoSelecionado(null);
        setQuantidadeDigitada('');
        setMotivo('');
        setTimeout(() => inputBuscaRef.current?.focus(), 100);
    };

    // CÁLCULO DO NOVO SALDO
    const saldoAtual = produtoSelecionado?.quantidadeEstoque ?? 0;
    const valorDigitado = parseInt(quantidadeDigitada) || 0;

    let novoSaldo = saldoAtual;
    if (tipoAjuste === 'ENTRADA') novoSaldo = saldoAtual + valorDigitado;
    if (tipoAjuste === 'SAIDA') novoSaldo = saldoAtual - valorDigitado;
    if (tipoAjuste === 'INVENTARIO') novoSaldo = valorDigitado;

    // SALVAR AJUSTE NO BACKEND
    const confirmarAjuste = async () => {
        if (!produtoSelecionado) return;
        if (valorDigitado <= 0 && tipoAjuste !== 'INVENTARIO') {
            return showToast('aviso', 'Quantidade Inválida', 'Digite um valor maior que zero.');
        }
        if (tipoAjuste === 'INVENTARIO' && quantidadeDigitada === '') {
            return showToast('aviso', 'Quantidade Inválida', 'Digite o saldo físico atual.');
        }
        if (novoSaldo < 0 && !produtoSelecionado.permitirEstoqueNegativo) {
            return showToast('erro', 'Estoque Negativo', 'Esta operação deixará o estoque negativo, o que não é permitido para este produto.');
        }
        if (!motivo || motivo.trim().length < 3) {
            return showToast('aviso', 'Motivo Obrigatório', 'Escreva uma justificativa clara para este ajuste (ex: Compra NF 123, Quebra, Contagem).');
        }

        setCarregando(true);
        try {
            // O Java espera a nova quantidade absoluta e o motivo
            const payload = {
                quantidade: novoSaldo,
                motivo: `[${tipoAjuste}] ${motivo}` // Adiciona a tag do tipo para ficar bonito na auditoria do backend
            };

            const res = await api.patch(`/api/produtos/${produtoSelecionado.id}/ajuste-estoque`, payload);

            showToast('sucesso', 'Estoque Atualizado', `O saldo de ${produtoSelecionado.nome} foi ajustado para ${res.data.quantidadeEstoque}.`);

            // Atualiza a tela mantendo o produto selecionado com o novo saldo
            setProdutoSelecionado(res.data);
            setQuantidadeDigitada('');
            setMotivo('');

        } catch (error) {
            console.error(error);
            showToast('erro', 'Erro ao Ajustar', 'Ocorreu uma falha de comunicação com o servidor.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in relative">
            {/* NOTIFICAÇÃO PROFISSIONAL */}
            {notificacao && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in w-full max-w-md px-4">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-l-4 ${notificacao.tipo === 'sucesso' ? 'bg-green-50 border-green-500 text-green-800' : notificacao.tipo === 'erro' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-orange-50 border-orange-500 text-orange-800'}`}>
                        <div className="mt-1">
                            {notificacao.tipo === 'sucesso' && <CheckCircle size={24} />}
                            {notificacao.tipo === 'erro' && <AlertTriangle size={24} />}
                            {notificacao.tipo === 'aviso' && <Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg">{notificacao.titulo}</h4>
                            <p className="text-sm font-medium mt-1">{notificacao.mensagem}</p>
                        </div>
                        <button onClick={() => setNotificacao(null)} className="text-slate-400 hover:text-slate-700 p-1"><X size={20}/></button>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Boxes className="text-blue-600 bg-blue-100 p-1.5 rounded-xl" size={40} /> CONTROLE DE INVENTÁRIO</h1>
                <p className="text-slate-500 mt-1">Ajuste de saldos, entradas avulsas e perdas de produtos.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* LADO ESQUERDO: BUSCA E PRODUTO */}
                <div className="w-full md:w-1/2 space-y-6">
                    {!produtoSelecionado ? (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative z-30">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Buscar Produto para Ajuste</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-4 text-slate-400" size={24} />
                                <input ref={inputBuscaRef} type="text" placeholder="Código, SKU ou Nome..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-bold text-slate-800 focus:border-blue-500 outline-none transition-colors" />
                            </div>

                            {resultados.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
                                    {resultados.map((peca) => (
                                        <div key={peca.id} onClick={() => selecionarProduto(peca)} className="flex justify-between items-center p-4 cursor-pointer border-b hover:bg-blue-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-800">{peca.nome}</p>
                                                <p className="text-xs font-mono text-slate-500">{peca.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Saldo Atual</p>
                                                <p className={`font-black ${peca.quantidadeEstoque > 0 ? 'text-blue-600' : 'text-red-500'}`}>{peca.quantidadeEstoque ?? 0} {peca.unidadeMedida}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-blue-500 relative">
                            <button onClick={limparSelecao} className="absolute right-4 top-4 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 p-1.5 rounded-full"><X size={18}/></button>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <Package size={32} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Produto Selecionado</p>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight pr-8">{produtoSelecionado.nome}</h3>
                                    <p className="text-xs font-mono text-slate-500 mt-1">{produtoSelecionado.sku} • {produtoSelecionado.marca?.nome}</p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-200">
                                <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Saldo no Sistema</p>
                                <p className="font-black text-3xl text-slate-800">{saldoAtual}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* LADO DIREITO: TIPO DE AJUSTE E VALORES */}
                <div className={`w-full md:w-1/2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 transition-opacity duration-300 ${!produtoSelecionado ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">1. Tipo de Operação</label>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <button onClick={() => {setTipoAjuste('ENTRADA'); setQuantidadeDigitada('');}} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all ${tipoAjuste === 'ENTRADA' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            <ArrowDownToLine size={20} /> ENTRADA
                        </button>
                        <button onClick={() => {setTipoAjuste('SAIDA'); setQuantidadeDigitada('');}} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all ${tipoAjuste === 'SAIDA' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            <ArrowUpFromLine size={20} /> SAÍDA
                        </button>
                        <button onClick={() => {setTipoAjuste('INVENTARIO'); setQuantidadeDigitada('');}} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all ${tipoAjuste === 'INVENTARIO' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            <ClipboardList size={20} /> BALANÇO
                        </button>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                                {tipoAjuste === 'ENTRADA' ? 'Qtd a Adicionar' : tipoAjuste === 'SAIDA' ? 'Qtd a Remover' : 'Nova Contagem Física'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={quantidadeDigitada}
                                onChange={e => setQuantidadeDigitada(e.target.value)}
                                className="w-full p-4 border-2 border-slate-200 rounded-xl font-black text-2xl outline-none focus:border-blue-500 text-center bg-slate-50"
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-center bg-slate-900 rounded-xl p-4 text-center border-b-4 border-blue-500">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Resultado Final</p>
                            <p className={`font-black text-3xl ${novoSaldo < 0 ? 'text-red-500' : 'text-white'}`}>{novoSaldo}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Motivo / Justificativa *</label>
                        <input
                            type="text"
                            placeholder={tipoAjuste === 'ENTRADA' ? 'Ex: Compra NF 1234, Devolução de Cliente...' : tipoAjuste === 'SAIDA' ? 'Ex: Quebra, Defeito, Uso Interno...' : 'Ex: Contagem de inventário mensal'}
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            className="w-full p-4 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={confirmarAjuste}
                        disabled={carregando || !produtoSelecionado}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 transform hover:scale-[1.02]"
                    >
                        <Save size={20} /> {carregando ? 'PROCESSANDO...' : 'CONFIRMAR AJUSTE'}
                    </button>
                </div>
            </div>
        </div>
    );
};