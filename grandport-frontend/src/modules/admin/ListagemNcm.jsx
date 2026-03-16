import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, ChevronLeft, ChevronRight, Loader2, FileJson } from 'lucide-react';

export const ListagemNcm = () => {
    const [ncms, setNcms] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(false);

    const [paginaAtual, setPaginaAtual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const ITENS_POR_PAGINA = 15;

    useEffect(() => {
        const buscarDados = async () => {
            setCarregando(true);
            try {
                let termoMagico = busca.trim().toLowerCase();

                if (termoMagico.length > 0) {
                    // Se o usuário digitou apenas números (ex: 8708.20.90), tira os pontos
                    if (/^[0-9.]+$/.test(termoMagico)) {
                        termoMagico = termoMagico.replace(/\./g, '');
                    } else {
                        // 1. Tira os acentos caso o usuário tenha digitado "Óleo" ou "óleo"
                        termoMagico = termoMagico.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                        // 2. O TRUQUE MÁGICO: Transforma as vogais e o 'c/ç' no coringa '_'
                        // Exemplo: "travoes" vira "tr_v__s". O Banco vai achar "travões"!
                        // Exemplo 2: "oleo" vira "_l__". O Banco vai achar "óleo"!
                        termoMagico = termoMagico.replace(/[aeiouc]/g, '_');

                        // 3. Troca os espaços por '%' para achar palavras separadas
                        // Exemplo: "oleo soja" -> "_l__%s_j_" -> Acha "Óleo refinado de soja"
                        termoMagico = termoMagico.split(' ').filter(word => word !== '').join('%');
                    }
                }

                const response = await api.get(`/api/ncm/paginado`, {
                    params: {
                        page: paginaAtual,
                        size: ITENS_POR_PAGINA,
                        busca: termoMagico
                    }
                });

                setNcms(response.data.content || []);
                setTotalPaginas(response.data.totalPages || 1);
            } catch (error) {
                console.error("Erro ao buscar NCMs:", error);
                setNcms([]);
            } finally {
                setCarregando(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            buscarDados();
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [busca, paginaAtual]);

    const handleBusca = (e) => {
        setBusca(e.target.value);
        setPaginaAtual(0);
    };

    return (
        <div className="animate-fade-in flex flex-col h-full">

            <div className="flex items-center justify-between mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ex: travoes, trav, oleo soja..."
                        value={busca}
                        onChange={handleBusca}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden flex-1 flex flex-col bg-white shadow-sm">
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                            <th className="p-4 pl-6 w-48">Código NCM</th>
                            <th className="p-4">Descrição do Produto / Categoria</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                        {carregando ? (
                            <tr>
                                <td colSpan="2" className="p-16 text-center text-indigo-500">
                                    <Loader2 className="animate-spin mx-auto" size={32} />
                                </td>
                            </tr>
                        ) : ncms.length > 0 ? (
                            ncms.map((ncm, index) => {
                                const codigoFinal = ncm.codigo || ncm.Codigo || ncm.id || '---';
                                const descricaoFinal = ncm.descricao || ncm.Descricao || ncm.nome || 'SEM DESCRIÇÃO NA BASE';

                                return (
                                    <tr key={codigoFinal + index} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="p-4 pl-6 font-mono font-black text-indigo-700 text-base">
                                            {codigoFinal}
                                        </td>
                                        <td className="p-4 text-slate-700 font-bold text-xs uppercase">
                                            {descricaoFinal}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="2" className="p-10 text-center text-slate-400 font-bold">
                                    Nenhum NCM encontrado na base de dados {busca ? `para "${busca}"` : ''}.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginação */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Página {totalPaginas === 0 ? 0 : paginaAtual + 1} de {totalPaginas}
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPaginaAtual(prev => Math.max(0, prev - 1))}
                            disabled={paginaAtual === 0 || carregando}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setPaginaAtual(prev => Math.min(totalPaginas - 1, prev + 1))}
                            disabled={paginaAtual >= totalPaginas - 1 || carregando}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};