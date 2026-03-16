import React, { useState } from 'react';
import { X, Save, Car, Hash, PenTool } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const ModalCadastroVeiculoRapido = ({ isOpen, onClose, clienteId, onSucesso }) => {
    const [form, setForm] = useState({
        placa: '',
        marca: '',
        modelo: '',
        ano: '',
        km: ''
    });
    const [salvando, setSalvando] = useState(false);

    if (!isOpen) return null;

// Dentro do seu ModalCadastroVeiculoRapido.jsx, certifique-se de que a chamada está assim:
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clienteId) return toast.error("Selecione um cliente primeiro!");

        setSalvando(true);
        try {
            // 🚀 A MÁGICA ESTÁ NESSA LINHA ABAIXO:
            // Passamos o clienteId na URL conforme o seu VeiculoController pede
            const res = await api.post(`/api/veiculos/cliente/${clienteId}`, form);

            toast.success("Veículo cadastrado com sucesso!");
            onSucesso(res.data);
            onClose();
        } catch (error) {
            console.error(error);
            // Se cair aqui com 409, é porque a placa já existe (seu catch no Java)
            if (error.response?.status === 409) {
                toast.error("Esta placa já está cadastrada para outro cliente!");
            } else {
                toast.error("Erro ao cadastrar veículo. Verifique os dados.");
            }
        } finally {
            setSalvando(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 text-left">
                <div className="bg-slate-800 p-5 flex justify-between items-center text-white">
                    <h3 className="font-black flex items-center gap-2 uppercase tracking-tighter"><Car size={20}/> Novo Veículo</h3>
                    <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-lg"><X size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Hash size={12}/> Placa *</label>
                        <input required type="text" value={form.placa} onChange={e => setForm({...form, placa: e.target.value.toUpperCase()})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" placeholder="ABC-1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Marca</label>
                            <input required type="text" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Ex: Ford" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Modelo</label>
                            <input required type="text" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Ex: Ka" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Ano</label>
                            <input type="text" value={form.ano} onChange={e => setForm({...form, ano: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="2020" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">KM Atual</label>
                            <input type="number" value={form.km} onChange={e => setForm({...form, km: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="0" />
                        </div>
                    </div>

                    <button type="submit" disabled={salvando} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                        {salvando ? 'Salvando...' : <><Save size={18}/> Cadastrar Veículo</>}
                    </button>
                </form>
            </div>
        </div>
    );
};