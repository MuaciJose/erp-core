import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, ArrowLeft, UserPlus, Loader2 } from 'lucide-react';

export const CriarParceiro = ({ onSucesso, onCancelar, parceiroParaEditar }) => {
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
        }
    });
    const [loadingCnpj, setLoadingCnpj] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const isEditing = !!parceiroParaEditar?.id; // Verifica se tem ID para ser edição

    useEffect(() => {
        if (isEditing) {
            setParceiro({
                ...parceiroParaEditar,
                endereco: parceiroParaEditar.endereco || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', ibge: '' }
            });
        }
    }, [parceiroParaEditar, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'ibge'].includes(name)) {
            setParceiro(prev => ({ ...prev, endereco: { ...prev.endereco, [name]: value } }));
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
                    cidade: dados.city || '',
                    estado: dados.state || '',
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
        <div className="p-8 max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl border border-gray-100">
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cidade</label>
                        <input name="cidade" type="text" value={parceiro.endereco.cidade || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cód. IBGE</label>
                        <input name="ibge" type="text" value={parceiro.endereco.ibge || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                </div>

                <div className="md:col-span-3 mt-4">
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-slate-200">
                        <Save size={20} /> {isEditing ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO'}
                    </button>
                </div>
            </form>
        </div>
    );
};
