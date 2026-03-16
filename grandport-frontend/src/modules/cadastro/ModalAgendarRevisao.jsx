import React, { useState, useEffect } from 'react';
import { Calendar, X, Save, Car, User, Phone, Wrench, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const ModalAgendarRevisao = ({ isOpen, onClose, clientePreSelecionado }) => {
    const dataSugestao = new Date();
    dataSugestao.setMonth(dataSugestao.getMonth() + 6);
    const dataPadrao = dataSugestao.toISOString().split('T')[0];

    // 🚀 ESTADOS DA BUSCA INTELIGENTE
    const [buscaCliente, setBuscaCliente] = useState('');
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [veiculosLista, setVeiculosLista] = useState([]);

    const [form, setForm] = useState({
        parceiroId: null,
        clienteNome: '',
        clienteTelefone: '',
        veiculoId: null,
        veiculoDescricao: '',
        veiculoPlaca: '',
        servico: 'Revisão Geral',
        dataPrevista: dataPadrao
    });

    const [salvando, setSalvando] = useState(false);


    // Quando o modal abre, verifica se já veio cliente da tela de Vendas
    useEffect(() => {
        if (isOpen) {
            if (clientePreSelecionado && clientePreSelecionado.nome) {
                // 1. Preenche o formulário com o que veio da tela anterior
                setForm(prev => ({
                    ...prev,
                    parceiroId: clientePreSelecionado.id || null,
                    clienteNome: clientePreSelecionado.nome || '',
                    clienteTelefone: clientePreSelecionado.telefone || '',
                    veiculoId: clientePreSelecionado.veiculoId || null,
                    veiculoDescricao: clientePreSelecionado.veiculo || '',
                    veiculoPlaca: clientePreSelecionado.placa || ''
                }));
                setBuscaCliente(clientePreSelecionado.nome);

                // 2. 🚀 NOVIDADE: Se já temos o ID do cliente, buscamos a lista de carros dele
                // Isso garante que o <select> de veículos dentro do modal não fique vazio!
                if (clientePreSelecionado.id) {
                    api.get(`/api/veiculos/cliente/${clientePreSelecionado.id}`)
                        .then(res => setVeiculosLista(res.data || []))
                        .catch(err => console.error("Erro ao carregar veículos no modal CRM", err));
                }
            } else {
                // Reseta tudo se abrir o modal "limpo"
                setForm({
                    parceiroId: null, clienteNome: '', clienteTelefone: '',
                    veiculoId: null, veiculoDescricao: '', veiculoPlaca: '',
                    servico: 'Revisão Geral', dataPrevista: dataPadrao
                });
                setBuscaCliente('');
                setVeiculosLista([]);
            }
        }
    }, [isOpen, clientePreSelecionado]);

    // Motor de busca de clientes ao digitar
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaCliente.length > 2 && buscaCliente !== form.clienteNome) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    setResultadosClientes(res.data.filter(p => p.tipo === 'CLIENTE' || p.tipo === 'AMBOS'));
                } catch (e) {
                    setResultadosClientes([]);
                }
            } else {
                setResultadosClientes([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaCliente, form.clienteNome]);

    // Quando clica no cliente da lista
    const selecionarCliente = async (cliente) => {
        setBuscaCliente(cliente.nome);
        setResultadosClientes([]);
        setForm(prev => ({
            ...prev,
            parceiroId: cliente.id,
            clienteNome: cliente.nome,
            clienteTelefone: cliente.telefone || '',
            veiculoId: null,
            veiculoDescricao: '',
            veiculoPlaca: ''
        }));

        // Já busca os veículos dele automaticamente
        try {
            const res = await api.get(`/api/veiculos/cliente/${cliente.id}`);
            const veiculosDb = res.data || [];
            setVeiculosLista(veiculosDb);

            // Se ele só tiver 1 carro, já preenche sozinho!
            if (veiculosDb.length === 1) {
                selecionarVeiculo(veiculosDb[0]);
            }
        } catch (e) {
            setVeiculosLista([]);
        }
    };

    const selecionarVeiculo = (veiculo) => {
        setForm(prev => ({
            ...prev,
            veiculoId: veiculo.id,
            veiculoDescricao: `${veiculo.marca} ${veiculo.modelo}`,
            veiculoPlaca: veiculo.placa
        }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSalvando(true);
        const toastId = toast.loading("Agendando revisão...");

        try {
            // Se o usuário digitou um nome e não clicou na busca, garantimos o nome digitado
            const payload = {
                ...form,
                clienteNome: form.parceiroId ? form.clienteNome : buscaCliente,
                status: 'PENDENTE'
            };

            await api.post('/api/revisoes', payload);
            toast.success("Revisão agendada para o CRM com sucesso!", { id: toastId });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao agendar a revisão.", { id: toastId });
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-visible border border-slate-200">

                <div className="bg-indigo-600 p-6 flex justify-between items-center text-white rounded-t-3xl">
                    <div>
                        <h3 className="font-black text-xl flex items-center gap-2"><Calendar size={24} /> Agendar Próxima Revisão</h3>
                        <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mt-1">Lançar alerta no CRM de Pós-Venda</p>
                    </div>
                    <button onClick={onClose} className="bg-indigo-500 hover:bg-red-500 p-2 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* BUSCA DE CLIENTE INTELIGENTE */}
                    <div className="relative">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Search size={12}/> Buscar Cliente no Banco</label>
                        <input
                            required
                            type="text"
                            value={buscaCliente}
                            onChange={e => {
                                setBuscaCliente(e.target.value);
                                if (form.parceiroId) setForm({...form, parceiroId: null}); // Desvincula se ele apagar o nome
                            }}
                            className={`w-full p-3 border-2 rounded-xl font-bold text-sm outline-none transition-colors ${form.parceiroId ? 'border-green-400 bg-green-50 text-green-800' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-700'}`}
                            placeholder="Digite o nome para buscar..."
                        />

                        {/* DROPDOWN DE CLIENTES */}
                        {resultadosClientes.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {resultadosClientes.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => selecionarCliente(c)}
                                        className="p-3 cursor-pointer border-b hover:bg-indigo-50 font-bold text-sm text-slate-700 flex justify-between items-center"
                                    >
                                        <span>{c.nome}</span>
                                        <span className="text-xs text-slate-400 font-normal">{c.telefone}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Phone size={12}/> WhatsApp</label>
                            <input required type="text" value={form.clienteTelefone} onChange={e => setForm({...form, clienteTelefone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" placeholder="(11) 99999-9999" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Car size={12}/> Escolher Veículo</label>
                            {veiculosLista.length > 0 ? (
                                <select
                                    value={form.veiculoId || ''}
                                    onChange={(e) => {
                                        const v = veiculosLista.find(v => v.id.toString() === e.target.value);
                                        if (v) selecionarVeiculo(v);
                                    }}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                                >
                                    <option value="">Selecione o Veículo...</option>
                                    {veiculosLista.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                                </select>
                            ) : (
                                <input required type="text" value={form.veiculoDescricao} onChange={e => setForm({...form, veiculoDescricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" placeholder="Ex: Honda Civic" />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1">Placa</label>
                            <input required type="text" value={form.veiculoPlaca} onChange={e => setForm({...form, veiculoPlaca: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 uppercase" placeholder="ABC-1234" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Wrench size={12}/> Serviço</label>
                            <input required type="text" value={form.servico} onChange={e => setForm({...form, servico: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" placeholder="Ex: Troca de Óleo" />
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <label className="text-[10px] font-black text-indigo-800 uppercase flex items-center gap-1 mb-2"><Calendar size={14}/> Data do Alerta no Painel CRM</label>
                        <input required type="date" value={form.dataPrevista} onChange={e => setForm({...form, dataPrevista: e.target.value})} className="w-full p-4 bg-white border-2 border-indigo-200 rounded-xl font-black text-indigo-700 outline-none focus:border-indigo-500 text-lg" />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancelar</button>
                        <button type="submit" disabled={salvando} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Save size={18}/> {salvando ? 'Salvando...' : 'Agendar no CRM'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};