import React, { useState, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import api from '../../api/axios';
import { ModalFechamento } from './ModalFechamento';

export const Pdv = () => {
    const [carrinho, setCarrinho] = useState([]);
    const [busca, setBusca] = useState("");
    const [resultados, setResultados] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const inputBuscaRef = useRef(null);
    const audioBip = new Audio('/sounds/bip.mp3');

    // --- LÓGICA DE ATALHOS ---
    useHotkeys('f2', (e) => {
        e.preventDefault();
        inputBuscaRef.current?.focus();
    }, { preventDefault: true });

    useHotkeys('f10', (e) => {
        e.preventDefault();
        if (carrinho.length > 0) {
            setModalAberto(true);
        } else {
            alert("Adicione produtos antes de finalizar!");
        }
    }, { preventDefault: true }, [carrinho]);

    useHotkeys('esc', (e) => {
        e.preventDefault();
        if (modalAberto) {
            setModalAberto(false);
        } else if (busca) {
            setBusca("");
            setResultados([]);
        } else if (carrinho.length > 0) {
            if (window.confirm("Deseja limpar todo o carrinho?")) {
                setCarrinho([]);
            }
        }
    }, { preventDefault: true }, [busca, carrinho, modalAberto]);

    // --- LÓGICA DO COMPONENTE ---
    const tocarBip = () => {
        audioBip.currentTime = 0;
        audioBip.play();
    };

    // Busca produtos enquanto digita (debounce simples)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (busca.length > 2 && !busca.includes('*')) {
                try {
                    const res = await api.get(`/api/produtos?busca=${busca}`);
                    setResultados(res.data);
                } catch (error) {
                    console.error("Erro na busca:", error);
                }
            } else {
                setResultados([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    const adicionarAoCarrinho = (produto, qtd = 1) => {
        tocarBip();
        const itemExistente = carrinho.find(item => item.id === produto.id);

        if (itemExistente) {
            setCarrinho(carrinho.map(item =>
                item.id === produto.id ? { ...item, qtd: item.qtd + qtd } : item
            ));
        } else {
            setCarrinho(prev => [...prev, { ...produto, qtd: qtd }]);
        }
        
        setBusca("");
        setResultados([]);
        inputBuscaRef.current?.focus();
    };

    const handleKeyDownBusca = async (e) => {
        if (e.key === 'Enter') {
            // Lógica para código de barras ou multiplicador
            let qtd = 1;
            let termo = busca;

            if (busca.includes('*')) {
                const partes = busca.split('*');
                qtd = parseInt(partes[0], 10) || 1;
                termo = partes[1];
            }

            // Se for um código de barras exato ou se houver apenas 1 resultado na lista
            if (resultados.length === 1) {
                adicionarAoCarrinho(resultados[0], qtd);
            } else {
                // Tenta buscar por código de barras exato
                try {
                    const res = await api.get(`/api/produtos/barcode/${termo}`);
                    adicionarAoCarrinho(res.data, qtd);
                } catch (err) {
                    // Se não achou por código de barras e tem vários resultados, foca na lista (opcional)
                    // ou apenas mantém a lista aberta para o usuário clicar
                }
            }
        }
    };

    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + (item.precoVenda * item.qtd), 0);
    };

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const finalizarVenda = async () => {
        const dadosVenda = {
            itens: carrinho.map(item => ({ produtoId: item.id, quantidade: item.qtd })),
            pagamento: 'DINHEIRO' // Isso virá do Modal no futuro
        };

        try {
            const resVenda = await api.post('/api/vendas', dadosVenda);
            const vendaId = resVenda.data.id;

            const resPdf = await api.get(`/api/vendas/relatorios/${vendaId}/pdf`, { responseType: 'blob' });

            const fileURL = URL.createObjectURL(resPdf.data);
            const printWindow = window.open(fileURL);
            printWindow.onload = () => printWindow.print();

            setCarrinho([]);
            setModalAberto(false);
            alert(`Venda #${vendaId} concluída com sucesso!`);
        } catch (err) {
            console.error(err);
            alert(`Erro ao finalizar venda: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-200 relative">
            <header className="bg-blue-900 text-white p-2 rounded-t-lg flex justify-around text-xs shadow-lg">
                <span>[F2] Buscar Peça</span>
                <span>[F10] Finalizar e Imprimir</span>
                <span>[ESC] Limpar</span>
            </header>

            <div className="p-4 relative z-10">
                <input 
                    ref={inputBuscaRef}
                    type="text"
                    className="w-full p-4 border-2 border-blue-500 rounded-lg text-xl shadow-inner"
                    placeholder="Ex: 3*SKU123, 'Amortecedor Uno' ou bipe o código (F2 para focar)"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={handleKeyDownBusca}
                    autoFocus
                />

                {/* Lista de Sugestões */}
                {resultados.length > 0 && (
                    <div className="absolute left-4 right-4 top-20 bg-white shadow-2xl rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                        {resultados.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => adicionarAoCarrinho(p)}
                                className="flex items-center gap-4 p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <img 
                                    src={p.fotoUrl || 'https://via.placeholder.com/150'} 
                                    className="w-16 h-16 rounded object-cover border border-gray-200" 
                                    alt={p.nome} 
                                />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-lg">{p.nome}</h4>
                                    {p.aplicacao && (
                                        <p className="text-xs text-blue-600 uppercase font-bold mt-1">
                                            Aplica-se em: {p.aplicacao}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        Marca: {p.marca?.nome || 'Genérica'} | SKU: {p.sku} | Estoque: {p.quantidadeEstoque}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-green-700 block">
                                        {formatCurrency(p.precoVenda)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <main className="flex-1 overflow-y-auto px-4 z-0">
                <table className="w-full bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-800 text-white">
                        <tr className="text-left">
                            <th className="p-3 w-2/5">Peça</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Preço Unit.</th>
                            <th className="p-3">Qtd</th>
                            <th className="p-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carrinho.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{item.nome}</td>
                                <td className="p-3 text-gray-600">{item.sku}</td>
                                <td className="p-3">{formatCurrency(item.precoVenda)}</td>
                                <td className="p-3 font-bold">{item.qtd}</td>
                                <td className="p-3 text-right font-semibold">{formatCurrency(item.precoVenda * item.qtd)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            
            <footer className="mt-auto bg-gray-800 text-white p-4 flex justify-between items-center rounded-lg shadow-2xl m-4">
                <div>
                    <p className="text-gray-400">Total de Itens: {carrinho.length}</p>
                    <p className="text-4xl font-bold text-green-400">{formatCurrency(calcularTotal())}</p>
                </div>
                <button 
                    onClick={() => setModalAberto(true)}
                    className="bg-green-500 hover:bg-green-600 px-12 py-4 rounded-xl text-2xl font-black transition-all transform hover:scale-105 shadow-lg"
                    disabled={carrinho.length === 0}
                >
                    FINALIZAR (F10)
                </button>
            </footer>

            <ModalFechamento 
                isOpen={modalAberto} 
                onClose={() => setModalAberto(false)} 
                onFinalizar={finalizarVenda}
                totalVenda={calcularTotal()}
            />
        </div>
    );
};
