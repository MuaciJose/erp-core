import { useState, useEffect } from 'react';
import api from '../../api/axios';

export const Pdv = () => {
    const [carrinho, setCarrinho] = useState([]);
    const [busca, setBusca] = useState("");
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');

    const adicionarProduto = async (e) => {
        if (e.key === 'Enter' && busca) {
            try {
                const res = await api.get(`/api/produtos/mobile/scan/${busca}`);
                const produtoExistente = carrinho.find(item => item.id === res.data.id);

                if (produtoExistente) {
                    setCarrinho(carrinho.map(item =>
                        item.id === res.data.id ? { ...item, qtd: item.qtd + 1 } : item
                    ));
                } else {
                    setCarrinho([...carrinho, { ...res.data, qtd: 1 }]);
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
        if (carrinho.length === 0) return alert("Carrinho vazio!");

        const dadosVenda = {
            itens: carrinho.map(item => ({
                produtoId: item.id,
                quantidade: item.qtd
            })),
            // O backend ainda não usa essa informação, mas é bom já enviar
            pagamento: metodoPagamento 
        };

        try {
            const resVenda = await api.post('/api/vendas', dadosVenda);
            const vendaId = resVenda.data.id;

            const resPdf = await api.get(`/api/vendas/relatorios/${vendaId}/pdf`, {
                responseType: 'blob'
            });

            const fileURL = URL.createObjectURL(resPdf.data);
            const printWindow = window.open(fileURL);
            
            // Espera o PDF carregar para chamar a impressão
            printWindow.onload = () => {
                printWindow.print();
                // URL.revokeObjectURL(fileURL); // Opcional: libera memória
            };

            setCarrinho([]);
            alert("Venda #" + vendaId + " concluída com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao finalizar venda: " + (err.response?.data?.message || err.message));
        }
    };
    
    // Atalho de teclado para finalizar a venda
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F10') {
                e.preventDefault();
                finalizarVenda();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [carrinho]); // Recria o listener se o carrinho mudar

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">PDV GrandPort - Balcão</h1>
                <input 
                    className="w-full p-4 border-2 border-blue-500 rounded-lg text-lg"
                    placeholder="Bipe o código de barras ou digite o SKU e pressione Enter..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={adicionarProduto}
                    autoFocus
                />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-200">
                        <tr className="text-left">
                            <th className="p-3">Peça</th>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Preço Unit.</th>
                            <th className="p-3">Qtd</th>
                            <th className="p-3">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carrinho.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.nome}</td>
                                <td className="p-3">{item.sku}</td>
                                <td className="p-3">{item.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="p-3">{item.qtd}</td>
                                <td className="p-3">{(item.precoVenda * item.qtd).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 bg-white border-t-2 flex justify-between items-center shadow-inner">
                <div className="text-3xl font-bold">Total: {calcularTotal()}</div>
                <button 
                    onClick={finalizarVenda}
                    className="bg-green-600 text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
                >
                    FINALIZAR E IMPRIMIR (F10)
                </button>
            </div>
        </div>
    );
};
