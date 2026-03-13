import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, ArrowLeft, UserPlus, Loader2, DollarSign, CalendarClock } from 'lucide-react';
import { VeiculosCliente } from './VeiculosCliente';

export const CriarParceiro = ({ onSucesso, onCancelar, parceiroParaEditar, parceirosLista }) => {
    const [parceiro, setParceiro] = useState({
        nome: '',
        documento: '',
        email: '',
        telefone: '',
        tipo: 'CLIENTE',
        endereco: {
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            ibge: ''
        },
        limiteCredito: 0,
        saldoDevedor: 0,
        intervaloDiasPagamento: 30 // 🚀 NOVO CAMPO: Padrão 30 dias
    });

    const [loadingCnpj, setLoadingCnpj] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const isEditing = !!parceiroParaEditar?.id;

    // 🚀 ESTADOS DO IBGE
    const [estadosIbge, setEstadosIbge] = useState([]);
    const [cidadesIbge, setCidadesIbge] = useState([]);
    const [loadingIbge, setLoadingIbge] = useState(false);

    // =======================================================================
    // 🚀 MÁSCARA MONETÁRIA (Para o Limite de Crédito)
    // =======================================================================
    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleLimiteCreditoChange = (valorDigitado) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        setParceiro(prev => ({ ...prev, limiteCredito: valorRealFloat }));
    };

    // 1. CARREGAR PARCEIRO PARA EDIÇÃO
    useEffect(() => {
        if (isEditing) {
            setParceiro({
                ...parceiroParaEditar,
                endereco: parceiroParaEditar.endereco || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', ibge: '' },
                limiteCredito: parceiroParaEditar.limiteCredito || 0,
                saldoDevedor: parceiroParaEditar.saldoDevedor || 0,
                intervaloDiasPagamento: parceiroParaEditar.intervaloDiasPagamento || 30
            });
        }
    }, [parceiroParaEditar, isEditing]);

    // 2. BUSCAR ESTADOS (UFs) DO IBGE AO ABRIR A TELA
    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(data => setEstadosIbge(data))
            .catch(err => console.error("Erro ao carregar Estados IBGE:", err));
    }, []);

    // 3. BUSCAR CIDADES QUANDO O ESTADO MUDAR
    useEffect(() => {
        const ufAtual = parceiro.endereco.estado;
        if (!ufAtual) {
            setCidadesIbge([]);
            return;
        }

        setLoadingIbge(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufAtual}/municipios?orderBy=nome`)
            .then(res => res.json())
            .then(data => setCidadesIbge(data))
            .catch(err => console.error("Erro ao carregar Municípios IBGE:", err))
            .finally(() => setLoadingIbge(false));
    }, [parceiro.endereco.estado]);

    // 4. OBSERVADOR INTELIGENTE
    useEffect(() => {
        if (parceiro.endereco.cidade && cidadesIbge.length > 0) {
            const cidadeFormatada = parceiro.endereco.cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const cidadeEncontrada = cidadesIbge.find(c =>
                c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === cidadeFormatada
            );

            if (cidadeEncontrada && parceiro.endereco.ibge !== cidadeEncontrada.id.toString()) {
                setParceiro(prev => ({
                    ...prev,
                    endereco: {
                        ...prev.endereco,
                        ibge: cidadeEncontrada.id.toString(),
                        cidade: cidadeEncontrada.nome
                    }
                }));
            }
        }
    }, [parceiro.endereco.cidade, cidadesIbge]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'ibge'].includes(name)) {
            setParceiro(prev => {
                const novoEndereco = { ...prev.endereco, [name]: value };
                if (name === 'estado' && prev.endereco.estado !== value) {
                    novoEndereco.cidade = '';
                    novoEndereco.ibge = '';
                }
                return { ...prev, endereco: novoEndereco };
            });
        } else if (name === 'intervaloDiasPagamento') {
            // Garante que o intervalo seja salvo como número
            setParceiro(prev => ({ ...prev, [name]: parseInt(value) || 30 }));
        } else {
            setParceiro(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleConsultaCnpj = async () => {
        const cnpj = parceiro.documento.replace(/[^0-9]/g, '');
        if (cnpj.length !== 14) return;

        setLoadingCnpj(true);
        try {
            const res = await api.get(`/api/parceiros/consulta-cnpj/${cnpj}`);
            const dados = res.data;
            setParceiro(prev => ({
                ...prev,
                nome: dados.razao_social || '',
                telefone: dados.ddd_telefone_1 || '',
                endereco: {
                    ...prev.endereco,
                    cep: dados.cep || '',
                    logradouro: dados.logradouro || '',
                    numero: dados.numero || '',
                    bairro: dados.bairro || '',
                    cidade: dados.municipio || '',
                    estado: dados.uf || '',
                    ibge: dados.codigo_ibge_municipio || '',
                }
            }));
        } catch (error) {
            console.error("Erro ao consultar CNPJ:", error);
            alert("CNPJ não encontrado ou inválido.");
        } finally {
            setLoadingCnpj(false);
        }
    };

    const handleConsultaCep = async () => {
        const cep = parceiro.endereco.cep.replace(/[^0-9]/g, '');
        if (cep.length !== 8) return;

        setLoadingCep(true);
        try {
            const res = await api.get(`/api/parceiros/consulta-cep/${cep}`);
            const dados = res.data;
            setParceiro(prev => ({
                ...prev,
                endereco: {
                    ...prev.endereco,
                    logradouro: dados.street || '',
                    bairro: dados.neighborhood || '',
                    estado: dados.state || '',
                    cidade: dados.city || '',
                    ibge: dados.ibge || '',
                }
            }));
        } catch (error) {
            console.error("Erro ao consultar CEP:", error);
            alert("CEP não encontrado.");
        } finally {
            setLoadingCep(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/api/parceiros/${parceiro.id}`, parceiro);
                alert("Parceiro atualizado com sucesso!");
            } else {
                await api.post('/api/parceiros', parceiro);
                alert("Parceiro cadastrado com sucesso!");
            }
            onSucesso();
        } catch (err) {
            alert("Erro ao salvar. Verifique se o CPF/CNPJ já existe.");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onCancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-black flex items-center gap-2 italic text-gray-700">
                        <UserPlus className="text-blue-600" /> {isEditing ? 'EDITAR PARCEIRO' : 'CADASTRO DE PARCEIRO'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
                        <select name="tipo" value={parceiro.tipo || 'CLIENTE'} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-blue-600">
                            <option value="CLIENTE">CLIENTE</option>
                            <option value="FORNECEDOR">FORNECEDOR</option>
                            <option value="AMBOS">AMBOS</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo / Razão Social</label>
                        <input name="nome" type="text" required value={parceiro.nome || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" placeholder="Ex: João da Silva ou Distribuidora de Peças LTDA" />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">CPF / CNPJ</label>
                        <input name="documento" type="text" required value={parceiro.documento || ''} onChange={handleChange} onBlur={handleConsultaCnpj} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-mono" placeholder="Digite e saia do campo" />
                        {loadingCnpj && <Loader2 className="absolute right-3 top-9 animate-spin text-blue-500" />}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefone / WhatsApp</label>
                        <input name="telefone" type="text" value={parceiro.telefone || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" placeholder="(00) 0.0000-0000" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
                        <input name="email" type="email" value={parceiro.email || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" placeholder="contato@email.com" />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">CEP</label>
                        <input name="cep" type="text" value={parceiro.endereco.cep || ''} onChange={handleChange} onBlur={handleConsultaCep} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                        {loadingCep && <Loader2 className="absolute right-3 top-9 animate-spin text-blue-500" />}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço (Logradouro)</label>
                        <input name="logradouro" type="text" value={parceiro.endereco.logradouro || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Número</label>
                        <input name="numero" type="text" value={parceiro.endereco.numero || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bairro</label>
                        <input name="bairro" type="text" value={parceiro.endereco.bairro || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado (UF)</label>
                        <select name="estado" value={parceiro.endereco.estado || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none">
                            <option value="">Selecione a UF...</option>
                            {estadosIbge.map(uf => (
                                <option key={uf.id} value={uf.sigla}>{uf.nome} ({uf.sigla})</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cidade</label>
                        <select name="cidade" value={parceiro.endereco.cidade || ''} onChange={handleChange} disabled={!parceiro.endereco.estado || loadingIbge} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none disabled:opacity-50">
                            <option value="">
                                {!parceiro.endereco.estado ? 'Selecione a UF primeiro...' : 'Selecione a Cidade...'}
                            </option>
                            {cidadesIbge.map(c => (
                                <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                        {loadingIbge && <Loader2 className="absolute right-3 top-9 animate-spin text-blue-500" />}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cód. IBGE</label>
                        <input name="ibge" type="text" value={parceiro.endereco.ibge || ''} readOnly className="w-full p-3 bg-gray-100 border-2 border-gray-100 rounded-xl outline-none text-gray-500 cursor-not-allowed font-bold" placeholder="Automático" title="O Código IBGE é preenchido automaticamente ao selecionar a cidade." />
                    </div>

                    {/* 🚀 SESSÃO DE CRÉDITO (ATUALIZADA) */}
                    <div className="md:col-span-3 border-t pt-6 mt-4">
                        <h3 className="text-sm font-black text-blue-600 mb-4 flex items-center gap-2">
                            <DollarSign size={16} /> CONFIGURAÇÕES DE CRÉDITO E PAGAMENTO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                            {/* CAMPO DE LIMITE COM MÁSCARA MONETÁRIA */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Limite de Crédito</label>
                                <div className="flex items-center gap-2 bg-blue-50 border-2 border-blue-100 p-2 rounded-xl focus-within:border-blue-500 transition-colors">
                                    <span className="text-sm font-black text-blue-300 pl-1">R$</span>
                                    <input
                                        name="limiteCredito"
                                        type="text"
                                        value={formatarMoeda(parceiro.limiteCredito)}
                                        onChange={(e) => handleLimiteCreditoChange(e.target.value)}
                                        className="w-full bg-transparent outline-none font-black text-blue-700 text-lg"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* 🚀 NOVO CAMPO: INTERVALO DE PAGAMENTO */}
                            {/* 🚀 CAMPO DE INTERVALO FLEXÍVEL */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                    <CalendarClock size={12}/> Intervalo entre Parcelas (Dias)
                                </label>
                                <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 p-2 rounded-xl focus-within:border-blue-500 transition-colors">
                                    <input
                                        name="intervaloDiasPagamento"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={parceiro.intervaloDiasPagamento || 30}
                                        onChange={handleChange}
                                        className="w-full bg-transparent outline-none font-black text-gray-700 text-lg"
                                        placeholder="Ex: 30"
                                    />
                                    <span className="text-xs font-bold text-gray-400 pr-2">DIAS</span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 italic">* Padrão de mercado é 30 dias.</p>
                            </div>

                            <div className="bg-gray-100 p-3 rounded-xl flex flex-col justify-center">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Saldo Devedor Atual</label>
                                <p className="text-xl font-black text-red-600">R$ {parceiro.saldoDevedor?.toFixed(2) || '0.00'}</p>
                            </div>

                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col justify-center">
                                <label className="block text-[10px] font-bold text-green-600 uppercase">Crédito Disponível</label>
                                <p className="text-xl font-black text-green-700">R$ {Math.max(0, (parceiro.limiteCredito || 0) - (parceiro.saldoDevedor || 0)).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 mt-4">
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-slate-200">
                            <Save size={20} /> {isEditing ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Seção de Veículos (Apenas para Clientes existentes) */}
            {isEditing && (parceiro.tipo === 'CLIENTE' || parceiro.tipo === 'AMBOS') && (
                <VeiculosCliente
                    clienteAtual={parceiro}
                    clientesLista={parceirosLista}
                />
            )}
        </div>
    );
};