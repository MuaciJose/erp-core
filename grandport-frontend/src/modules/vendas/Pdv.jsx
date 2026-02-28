import React, { useState, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import api from '../../api/axios';

export const Pdv = () => {
    const [carrinho, setCarrinho] = useState([]);
    const [busca, setBusca] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const inputBuscaRef = useRef(null);

    // --- LÓGICA DE ATALHOS ---
    useHotkeys('f2', (e) => {
        e.preventDefault();
        inputBuscaRef.current?.focus();
    }, { preventDefault: true });

    useHotkeys('f10', (e) => {
        e.preventDefault();
        if (carrinho.length > 0) {
            finalizarVenda();
        } else {
            alert("Adicione produtos antes de finalizar!");
        }
    }, { preventDefault: true }, [carrinho]);

    useHotkeys('esc', (e) => {
        e.preventDefault();
        if (busca) {
            setBusca("");
        } else if (carrinho.length > 0) {
            if (window.confirm("Deseja limpar todo o carrinho?")) {
                setCarrinho([]);
            }
        }
    }, { preventDefault: true }, [busca, carrinho]);

    // --- LÓGICA DO COMPONENTE ---
    const tocarBip = () => {
        const audio = new Audio('/sounds/bip.mp3');
        audio.volume = 0.5; // Volume médio para não incomodar
        audio.play();
    };

    const adicionarProduto = async (e) => {
        if (e.key === 'Enter' && busca) {
            let qtd = 1;
            let buscaLimpa = busca;

            if (busca.includes('*')) {
                const partes = busca.split('*');
                qtd = parseInt(partes[0], 10) || 1;
                buscaLimpa = partes[1];
            }

            if (!buscaLimpa) return;

            try {
                const res = await api.get(`/api/produtos/mobile/scan/${buscaLimpa}`);
                const produtoEncontrado = res.data;
                
                tocarBip();

                const itemExistente = carrinho.find(item => item.id === produtoEncontrado.id);

                if (itemExistente) {
                    setCarrinho(carrinho.map(item =>
                        item.id === produtoEncontrado.id ? { ...item, qtd: item.qtd + qtd } : item
                    ));
                } else {
                    setCarrinho(prev => [...prev, { ...produtoEncontrado, qtd: qtd }]);
                }
                
                setBusca("");
            } catch (error) {
                alert("Produto não encontrado!");
            }
        }
    };

    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + (item.precoVenda * item.qtd), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const finalizarVenda = async () => {
        if (carrinho.length === 0) return;

        const dadosVenda = {
            itens: carrinho.map(item => ({ produtoId: item.id, quantidade: item.qtd })),
            pagamento: metodoPagamento
        };

        try {
            const resVenda = await api.post('/api/vendas', dadosVenda);
            const vendaId = resVenda.data.id;

            const resPdf = await api.get(`/api/vendas/relatorios/${vendaId}/pdf`, { responseType: 'blob' });

            const fileURL = URL.createObjectURL(resPdf.data);
            const printWindow = window.open(fileURL);
            printWindow.onload = () => printWindow.print();

            setCarrinho([]);
            alert(`Venda #${vendaId} concluída com sucesso!`);
        } catch (err) {
            console.error(err);
            alert(`Erro ao finalizar venda: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <header className="bg-blue-900 text-white p-2 rounded-t-lg flex justify-around text-xs shadow-lg">
                <span>[F2] Buscar Peça</span>
                <span>[F10] Finalizar e Imprimir</span>
                <span>[ESC] Limpar</span>
            </header>

            <div className="p-4">
                <input 
                    ref={inputBuscaRef}
                    type="text"
                    className="w-full p-4 border-2 border-blue-500 rounded-lg text-xl shadow-inner"
                    placeholder="Ex: 3*SKU123 ou bipe o código de barras (F2 para focar)"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={adicionarProduto}
                    autoFocus
                />
            </div>
            
            <main className="flex-1 overflow-y-auto px-4">
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
                                <td className="p-3">{item.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-3 font-bold">{item.qtd}</td>
                                <td className="p-3 text-right font-semibold">{(item.precoVenda * item.qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            
            <footer className="mt-auto bg-gray-800 text-white p-4 flex justify-between items-center rounded-lg shadow-2xl m-4">
                <div>
                    <p className="text-gray-400">Total de Itens: {carrinho.length}</p>
                    <p className="text-4xl font-bold text-green-400">{calcularTotal()}</p>
                </div>
                <button 
                    onClick={finalizarVenda}
                    className="bg-green-500 hover:bg-green-600 px-12 py-4 rounded-xl text-2xl font-black transition-all transform hover:scale-105 shadow-lg"
                    disabled={carrinho.length === 0}
                >
                    FINALIZAR (F10)
                </button>
            </footer>
        </div>
    );
};
