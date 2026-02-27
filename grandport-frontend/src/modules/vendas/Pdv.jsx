import { useState } from 'react';
import api from '../../api/axios';

export const Pdv = () => {
    const [carrinho, setCarrinho] = useState([]);
    const [busca, setBusca] = useState("");

    const adicionarProduto = async (e) => {
        if (e.key === 'Enter') {
            // Chamada ao endpoint mobile/scan que criamos no Spring!
            const res = await api.get(`/api/produtos/mobile/scan/${busca}`);
            setCarrinho([...carrinho, { ...res.data, qtd: 1 }]);
            setBusca("");
        }
    };

    return (
        <div className="p-6 bg-gray-100 h-screen">
            <h1 className="text-2xl font-bold mb-4">PDV GrandPort - Balcão</h1>
            <input 
                className="w-full p-4 border-2 border-blue-500 rounded-lg"
                placeholder="Bipe o código de barras ou digite o SKU..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={adicionarProduto}
            />
            
            <table className="w-full mt-6 bg-white rounded-lg shadow">
                <thead>
                    <tr className="bg-gray-200">
                        <th>Peça</th>
                        <th>Marca</th>
                        <th>Preço</th>
                        <th>Qtd</th>
                    </tr>
                </thead>
                <tbody>
                    {carrinho.map(item => (
                        <tr key={item.id}>
                            <td>{item.nome}</td>
                            <td>{item.marca.nome}</td>
                            <td>R$ {item.precoVenda}</td>
                            <td>{item.qtd}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
