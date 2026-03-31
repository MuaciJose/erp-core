import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Car, ArrowRightLeft, Plus, History, X, Search, AlertTriangle, Lock } from 'lucide-react';
import { HistoricoVeiculoModal } from './HistoricoVeiculoModal';

export const VeiculosCliente = ({ clienteAtual, clientesLista }) => {
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalTransferencia, setModalTransferencia] = useState(false);
    const [carroSelecionado, setCarroSelecionado] = useState(null);
    const [novoDonoId, setNovoDonoId] = useState('');

    const [modalNovo, setModalNovo] = useState(false);
    const [novoCarro, setNovoCarro] = useState({ placa: '', marca: '', modelo: '', ano: '', km: '' });

    const [carroParaHistorico, setCarroParaHistorico] = useState(null);

    // ESTADOS PARA O CONFLITO DE PLACA
    const [veiculoConflito, setVeiculoConflito] = useState(null);
    const [senhaAutorizacao, setSenhaAutorizacao] = useState('');
    const [loadingTransferencia, setLoadingTransferencia] = useState(false);

    const carregarVeiculos = async () => {
        // 🚀 Proteção: Não busca se o ID for undefined ou nulo
        if (!clienteAtual?.id || clienteAtual.id === 'undefined') {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/api/veiculos/cliente/${clienteAtual.id}`);
            setVeiculos(res.data);
        } catch (error) {
            console.error("Erro ao carregar veículos", error);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 Atualizado: O useEffect agora só dispara se o ID for válido
    useEffect(() => {
        if (clienteAtual?.id) {
            carregarVeiculos();
        }
    }, [clienteAtual?.id]);

    const abrirTransferencia = (carro) => {
        setCarroSelecionado(carro);
        setModalTransferencia(true);
    };

    const confirmarTransferencia = async () => {
        if (!novoDonoId) return alert('Selecione o novo dono!');
        try {
            await api.post(`/api/veiculos/${carroSelecionado.id}/transferir`, { novoClienteId: parseInt(novoDonoId) });
            alert('Veículo transferido com sucesso!');
            setModalTransferencia(false);
            setNovoDonoId('');
            carregarVeiculos();
        } catch (error) {
            alert('Erro ao transferir veículo.');
        }
    };

    const salvarNovoCarro = async () => {
        // 🚀 Proteção: Garante que temos um cliente antes de salvar
        if (!clienteAtual?.id) return alert("Erro: Cliente não identificado.");

        try {
            await api.post(`/api/veiculos/cliente/${clienteAtual.id}`, novoCarro);
            alert('Veículo cadastrado com sucesso!');
            setModalNovo(false);
            setNovoCarro({ placa: '', marca: '', modelo: '', ano: '', km: '' });
            carregarVeiculos();
        } catch (error) {
            if (error.response && error.response.status === 409) {
                setModalNovo(false);
                setVeiculoConflito(error.response.data);
            } else {
                alert("Erro ao cadastrar o veículo.");
            }
        }
    };

    const confirmarTransferenciaForcada = async () => {
        if (!senhaAutorizacao) return alert("Digite sua senha para autorizar.");
        if (!clienteAtual?.id) return alert("Erro: Cliente destino não identificado.");

        setLoadingTransferencia(true);
        try {
            await api.post(`/api/veiculos/transferencia-forcada`, {
                veiculoId: veiculoConflito.veiculoId,
                novoClienteId: clienteAtual.id,
                senhaOperador: senhaAutorizacao
            });
            alert(`Sucesso! O veículo foi transferido para ${clienteAtual.nome}.`);
            setVeiculoConflito(null);
            setSenhaAutorizacao('');
            setNovoCarro({ placa: '', marca: '', modelo: '', ano: '', km: '' });
            carregarVeiculos();
        } catch (error) {
            alert("Senha incorreta ou sem permissão.");
        } finally {
            setLoadingTransferencia(false);
        }
    };

    // 🚀 Interface de carregamento amigável
    if (loading) return (
        <div className="p-10 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="font-bold text-slate-400">Acessando garagem...</p>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Car className="text-blue-600" />
                    GARAGEM DO CLIENTE
                </h3>
                <button
                    onClick={() => setModalNovo(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                    <Plus size={16} /> ADICIONAR VEÍCULO
                </button>
            </div>

            {veiculos.length === 0 ? (
                <div className="text-center p-8 text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum veículo cadastrado para este cliente.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {veiculos.map(carro => (
                        <div key={carro.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className="bg-white border-2 border-slate-300 rounded-lg p-2 flex flex-col items-center justify-center w-24 h-12 shadow-sm">
                                    <span className="font-mono font-black text-slate-800 tracking-widest text-sm leading-none uppercase">{carro.placa}</span>
                                </div>
                                <div>
                                    <p className="font-black text-slate-700">{carro.marca} {carro.modelo}</p>
                                    <p className="text-xs text-slate-500 font-bold">Ano: {carro.ano} • {carro.km ? carro.km.toLocaleString('pt-BR') : '---'} km</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setCarroParaHistorico(carro)} className="text-blue-600 bg-blue-100 hover:bg-blue-200 p-2 rounded-lg" title="Ver Histórico de Peças"><History size={16} /></button>
                                <button onClick={() => abrirTransferencia(carro)} className="text-orange-600 bg-orange-100 hover:bg-orange-200 p-2 rounded-lg" title="Transferir de Dono"><ArrowRightLeft size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: CONFLITO DE PLACA */}
            {veiculoConflito && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-red-600 p-6 flex items-center justify-center text-white">
                            <AlertTriangle size={48} className="animate-pulse" />
                        </div>
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-slate-800 text-center mb-2">Placa já Cadastrada!</h2>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-sm font-medium text-center mb-6 leading-relaxed">
                                A placa <span className="font-black bg-white px-2 py-1 rounded shadow-sm border border-red-200 mx-1 uppercase">{veiculoConflito.placa}</span>
                                já está registrada em nome de:<br/>
                                <span className="font-black text-lg block mt-2 text-red-900">{veiculoConflito.donoAtualNome}</span>
                            </div>
                            <p className="text-sm text-slate-500 text-center font-bold mb-6">
                                Deseja forçar a transferência para <span className="text-blue-600">{clienteAtual?.nome}</span>?
                            </p>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Lock size={14} className="text-slate-400" /> Senha de Autorização</label>
                                <input type="password" value={senhaAutorizacao} onChange={(e) => setSenhaAutorizacao(e.target.value)} placeholder="Sua senha do sistema..." className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-500 outline-none text-center text-lg font-bold tracking-widest text-slate-700" autoFocus />
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={confirmarTransferenciaForcada} disabled={loadingTransferencia} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-lg flex items-center justify-center gap-2 transition-all">
                                    {loadingTransferencia ? 'VERIFICANDO...' : <><ArrowRightLeft size={18} /> CONFIRMAR TRANSFERÊNCIA</>}
                                </button>
                                <button onClick={() => { setVeiculoConflito(null); setSenhaAutorizacao(''); }} className="w-full py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">CANCELAR OPERAÇÃO</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: TRANSFERIR VEÍCULO (PADRÃO) */}
            {modalTransferencia && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black tracking-widest flex items-center gap-2"><ArrowRightLeft /> TRANSFERIR VEÍCULO</h2>
                            <button onClick={() => setModalTransferencia(false)} className="hover:text-orange-200"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-orange-800 text-sm font-medium">
                                Você está transferindo o <strong>{carroSelecionado?.marca} {carroSelecionado?.modelo} (Placa: {carroSelecionado?.placa})</strong>.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quem é o novo dono?</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <select value={novoDonoId} onChange={(e) => setNovoDonoId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-orange-500 outline-none font-bold text-slate-700">
                                        <option value="">Selecione o cliente na lista...</option>
                                        {clientesLista.filter(c => c.id !== clienteAtual?.id).map(c => (
                                            <option key={c.id} value={c.id}>{c.nome} (CPF: {c.documento})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={confirmarTransferencia} className="w-full py-4 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 shadow-lg">CONFIRMAR TRANSFERÊNCIA</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADICIONAR NOVO CARRO */}
            {modalNovo && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-black flex items-center gap-2"><Car /> NOVO VEÍCULO</h2>
                            <button onClick={() => setModalNovo(false)} className="hover:text-red-400"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <input type="text" placeholder="Placa (Ex: ABC-1234)" value={novoCarro.placa} onChange={e => setNovoCarro({...novoCarro, placa: e.target.value})} className="w-full p-3 border-2 rounded-xl font-mono uppercase" />
                            <input type="text" placeholder="Marca (Ex: Fiat)" value={novoCarro.marca} onChange={e => setNovoCarro({...novoCarro, marca: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                            <input type="text" placeholder="Modelo (Ex: Palio Fire)" value={novoCarro.modelo} onChange={e => setNovoCarro({...novoCarro, modelo: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Ano (Ex: 2014)" value={novoCarro.ano} onChange={e => setNovoCarro({...novoCarro, ano: e.target.value})} className="w-full p-3 border-2 rounded-xl" />
                                <input type="number" placeholder="KM Atual (Ex: 85000)" value={novoCarro.km} onChange={e => setNovoCarro({...novoCarro, km: e.target.value})} className="w-full p-3 border-2 rounded-xl bg-orange-50 font-bold text-orange-700" />
                            </div>
                            <button onClick={salvarNovoCarro} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl mt-4 hover:bg-blue-700">SALVAR VEÍCULO</button>
                        </div>
                    </div>
                </div>
            )}

            {carroParaHistorico && (
                <HistoricoVeiculoModal
                    veiculo={carroParaHistorico}
                    cliente={clienteAtual}
                    onClose={() => setCarroParaHistorico(null)}
                />
            )}
        </div>
    );
};
