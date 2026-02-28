import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Ban } from 'lucide-react';

export const RelatorioFaltas = () => {
    const [faltas, setFaltas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregar = async () => {
            try {
                const res = await api.get('/api/vendas-perdidas/ranking');
                setFaltas(res.data);
            } catch (error) {
                console.error("Erro ao carregar ranking de faltas:", error);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando relatório...</div>;

    return (
        <div className="p-8 bg-white rounded-2xl shadow-sm max-w-4xl mx-auto">
            <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Ban className="text-red-600" /> OPORTUNIDADES PERDIDAS
            </h1>
            <p className="text-sm text-gray-500 mb-6 -mt-4">Peças mais procuradas pelos clientes que não foram encontradas no estoque nos últimos 7 dias.</p>
            
            <div className="space-y-4">
                {faltas.length === 0 ? (
                    <p className="text-center text-gray-400 italic py-8">Nenhuma venda perdida registrada na última semana.</p>
                ) : (
                    faltas.map((f, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                            <div>
                                <p className="font-bold text-lg uppercase text-red-800">{f.descricaoPeca}</p>
                                <p className="text-xs text-red-500 font-medium">PEDIDA <span className="font-black text-base">{f.quantidade}</span> VEZES ESTA SEMANA</p>
                            </div>
                            <button className="bg-white border-2 border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all">
                                COMPRAR AGORA
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
