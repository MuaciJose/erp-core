import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, Plus, Search, Phone, MapPin, Building2, Edit, FileText, History } from 'lucide-react';
import { CriarParceiro } from './CriarParceiro';
import { ExtratoParceiro } from '../financeiro/ExtratoParceiro';
import { HistoricoClienteModal } from './HistoricoClienteModal';

export const Parceiros = () => {
    const [parceiros, setParceiros] = useState([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [parceiroEmEdicao, setParceiroEmEdicao] = useState(null);
    const [extratoAberto, setExtratoAberto] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('CLIENTE');
    const [clienteParaHistorico, setClienteParaHistorico] = useState(null);

    const carregarParceiros = async () => {
        try {
            const res = await api.get('/api/parceiros');
            setParceiros(res.data);
        } catch (error) {
            console.error("Erro ao carregar parceiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarParceiros(); }, []);

    const filtrados = parceiros
        .filter(p => {
            if (abaAtiva === 'CLIENTE') return p.tipo === 'CLIENTE' || p.tipo === 'AMBOS';
            if (abaAtiva === 'FORNECEDOR') return p.tipo === 'FORNECEDOR' || p.tipo === 'AMBOS';
            return true;
        })
        .filter(p => 
            p.nome.toLowerCase().includes(busca.toLowerCase()) || 
            (p.documento && p.documento.includes(busca))
        );

    if (parceiroEmEdicao) {
        return <CriarParceiro 
                    parceiroParaEditar={parceiroEmEdicao}
                    parceirosLista={parceiros}
                    onSucesso={() => { setParceiroEmEdicao(null); carregarParceiros(); }} 
                    onCancelar={() => setParceiroEmEdicao(null)} 
                />;
    }

    if (extratoAberto) {
        return <ExtratoParceiro clienteId={extratoAberto} onVoltar={() => setExtratoAberto(null)} />;
    }

    if (loading) return <div className="p-8 text-center">Carregando parceiros...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black flex items-center gap-2 text-gray-800">
                    <Users className="text-blue-600" /> Clientes e Fornecedores
                </h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CPF ou CNPJ..." 
                            className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setParceiroEmEdicao({})}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                    >
                        <Plus size={20} /> Novo Parceiro
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b">
                <button 
                    onClick={() => setAbaAtiva('CLIENTE')}
                    className={`pb-4 px-4 font-bold transition-colors ${abaAtiva === 'CLIENTE' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    CLIENTES
                </button>
                <button 
                    onClick={() => setAbaAtiva('FORNECEDOR')}
                    className={`pb-4 px-4 font-bold transition-colors ${abaAtiva === 'FORNECEDOR' ? 'border-b-4 border-purple-600 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    FORNECEDORES
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtrados.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.tipo !== 'FORNECEDOR' && (
                                <button onClick={() => setClienteParaHistorico(p)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-600" title="Ver Histórico de Compras">
                                    <History size={16} />
                                </button>
                            )}
                            <button onClick={() => setExtratoAberto(p.id)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-600" title="Ver Extrato">
                                <FileText size={16} />
                            </button>
                            <button onClick={() => setParceiroEmEdicao(p)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-600" title="Editar">
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${p.tipo === 'FORNECEDOR' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                <Building2 size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-1 bg-gray-100 rounded text-gray-500">
                                {p.tipo}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{p.nome}</h3>
                        <p className="text-sm text-gray-400 mb-4">{p.documento}</p>
                        
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} /> {p.telefone || '(00) 0000-0000'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin size={14} /> {p.endereco?.cidade || 'Não informada'}
                            </div>
                        </div>
                    </div>
                ))}
                {filtrados.length === 0 && !loading && (
                    <p className="col-span-3 text-center text-gray-400 py-12">Nenhum parceiro encontrado nesta categoria.</p>
                )}
            </div>

            {clienteParaHistorico && (
                <HistoricoClienteModal 
                    cliente={clienteParaHistorico} 
                    onClose={() => setClienteParaHistorico(null)} 
                />
            )}
        </div>
    );
};
