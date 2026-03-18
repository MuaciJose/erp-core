import React, { useState, useEffect, useRef } from 'react';
import {
    Car, Camera, CheckCircle, AlertTriangle, FileText,
    Droplet, Gauge, ChevronLeft, ChevronRight, Save, Search, X, ImagePlus, PenTool
} from 'lucide-react';

import api from '../../api/axios';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas'; // 🚀 A BIBLIOTECA DE ASSINATURA AQUI!
import imageCompression from 'browser-image-compression';


export const ChecklistTablet = ({ setPaginaAtiva }) => {
    const [loading, setLoading] = useState(false);
    const [veiculos, setVeiculos] = useState([]);

    // Estados do Formulário
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [kmAtual, setKmAtual] = useState('');
    const [nivelCombustivel, setNivelCombustivel] = useState('');
    const [avariadasSelecionadas, setAvariadasSelecionadas] = useState([]);
    const [observacoes, setObservacoes] = useState('');
    const [termoBusca, setTermoBusca] = useState('');

    // Estado para as fotos capturadas
    const [fotosCapturadas, setFotosCapturadas] = useState([]);
    const fileInputRef = useRef(null);

    // 🚀 REFERÊNCIA PARA CONTROLAR O QUADRO DE ASSINATURA
    const sigCanvas = useRef(null);

    // Dicionário Rápido para o Tablet
    const niveisCombustivel = ['Reserva', '1/4', 'Meio Tanque', '3/4', 'Cheio'];
    const tagsAvarias = [
        'Arranhão Para-choque Diant.', 'Arranhão Para-choque Tras.',
        'Amassado Porta Dir.', 'Amassado Porta Esq.',
        'Vidro Trincado', 'Pneu Careca', 'Farol/Lanterna Quebrada',
        'Pintura Queimada', 'Retrovisor Danificado', 'Bancos Rasgados', 'Sem Estepe'
    ];

    useEffect(() => {
        const buscarVeiculos = async () => {
            try {
                const res = await api.get('/api/veiculos');
                setVeiculos(res.data);
            } catch (error) {
                toast.error("Erro ao buscar veículos cadastrados.");
            }
        };
        buscarVeiculos();
    }, []);

    const toggleAvaria = (tag) => {
        setAvariadasSelecionadas(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleCaptureFoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (fotosCapturadas.length >= 4) {
            toast.error("Limite de 4 evidências fotográficas atingido.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Por favor, selecione apenas imagens.");
            return;
        }

        const loadId = toast.loading("Processando imagem...");

        try {
            // 🧠 COMPRESSÃO INTELIGENTE
            const tamanhoMB = file.size / 1024 / 1024;

            const options = {
                maxSizeMB: tamanhoMB > 3 ? 0.3 : 0.2, // adapta automaticamente
                maxWidthOrHeight: 1280,
                useWebWorker: true,
                exifOrientation: true // 🚀 corrige rotação automaticamente
            };

            const compressedFile = await imageCompression(file, options);

            const miniaturaUrl = URL.createObjectURL(compressedFile);

            setFotosCapturadas(prev => [
                ...prev,
                { file: compressedFile, miniaturaUrl }
            ]);

            toast.dismiss(loadId);

        } catch (error) {
            console.error("Erro ao comprimir imagem:", error);
            toast.error("Erro ao processar a imagem.", { id: loadId });
        }
    };

    const removerFoto = (index) => {
        setFotosCapturadas(prev => prev.filter((_, i) => i !== index));
    };

    // 🚀 FUNÇÃO PARA LIMPAR A ASSINATURA SE O CLIENTE ERRAR
    const limparAssinatura = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    // 🚀 SALVAR CHECKLIST + UPLOAD DAS FOTOS E ASSINATURA
    const handleSalvarChecklist = async () => {
        if (!veiculoSelecionado) return toast.error("Selecione um veículo primeiro!");
        if (!kmAtual) return toast.error("Informe a Quilometragem de entrada!");
        if (!nivelCombustivel) return toast.error("Informe o nível de combustível!");

        // 🚀 TRAVA: assinatura obrigatória
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            return toast.error("A assinatura do cliente é obrigatória para validade jurídica!");
        }

        setLoading(true);
        const loadId = toast.loading("Salvando Vistoria...");

        try {
            // 1. Dados principais
            const payload = {
                veiculoId: veiculoSelecionado.id,
                clienteId: veiculoSelecionado.cliente?.id || null,
                kmAtual: parseInt(kmAtual),
                nivelCombustivel: nivelCombustivel,
                itensAvariados: avariadasSelecionadas.join(', '),
                observacoesGerais: observacoes
            };

            const response = await api.post('/api/checklists', payload);
            const checklistCriado = response.data;

            // 2. Assinatura → PNG
            const assinaturaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
            const resAssinatura = await fetch(assinaturaBase64);
            const blobAssinatura = await resAssinatura.blob();

            const formDataAssinatura = new FormData();
            formDataAssinatura.append('assinatura', blobAssinatura, 'assinatura.png');

            // 3. Upload assinatura
            await api.post(
                `/api/checklists/${checklistCriado.id}/assinatura`,
                formDataAssinatura,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            // 4. Upload das fotos (🚀 AGORA EM PARALELO)
            if (fotosCapturadas.length > 0) {
                toast.loading(`Enviando ${fotosCapturadas.length} fotos...`, { id: loadId });

                await Promise.all(
                    fotosCapturadas.map(foto => {
                        const formData = new FormData();
                        formData.append('foto', foto.file);

                        return api.post(
                            `/api/checklists/${checklistCriado.id}/fotos`,
                            formData,
                            { headers: { 'Content-Type': 'multipart/form-data' } }
                        );
                    })
                );
            }

            toast.success("Vistoria oficializada com Sucesso!", { id: loadId });

            setTimeout(() => setPaginaAtiva('dash'), 1500);

        } catch (error) {
            console.error(error);

            const erroDetalhado =
                error.response?.data?.message ||
                error.response?.data ||
                error.message;

            alert("ERRO DO SERVIDOR: " + JSON.stringify(erroDetalhado));

            toast.error("Erro ao salvar o checklist. Tente novamente.", { id: loadId });

        } finally {
            setLoading(false);
        }
    };

    const veiculosFiltrados = veiculos.filter(v =>
        (v.placa && v.placa.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (v.modelo && v.modelo.toLowerCase().includes(termoBusca.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 animate-fade-in font-sans selection:bg-blue-200">

            {/* CABEÇALHO TABLET */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 sticky top-4 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPaginaAtiva('dash')} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors active:scale-95">
                        <ChevronLeft size={28} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <CheckCircle className="text-blue-600" size={32} />
                            VISTORIA DE ENTRADA
                        </h1>
                        <p className="text-slate-500 font-bold mt-1 text-sm uppercase tracking-widest">Recepção do Veículo</p>
                    </div>
                </div>

                {veiculoSelecionado && (
                    <button
                        onClick={handleSalvarChecklist}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 transition-transform active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <span className="animate-spin">⏳</span> : <Save size={24} />}
                        SALVAR VISTORIA
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COLUNA ESQUERDA: SELEÇÃO E DADOS VITAIS */}
                <div className="lg:col-span-5 space-y-6">
                    {!veiculoSelecionado ? (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Car className="text-blue-500"/> Selecionar Veículo</h2>
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input
                                    type="text"
                                    placeholder="Digite a PLACA ou MODELO..."
                                    value={termoBusca}
                                    onChange={e => setTermoBusca(e.target.value)}
                                    className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none text-lg font-black text-slate-700 uppercase"
                                />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {veiculosFiltrados.slice(0, 10).map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setVeiculoSelecionado(v)}
                                        className="p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center active:scale-95 bg-white"
                                    >
                                        <div>
                                            <p className="font-black text-2xl text-slate-800 uppercase tracking-widest">{v.placa}</p>
                                            <p className="font-bold text-slate-500 text-sm mt-1">{v.modelo}</p>
                                        </div>
                                        <ChevronRight size={24} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 text-white relative overflow-hidden">
                            <Car className="absolute -right-4 -bottom-4 text-slate-700/50" size={120} />
                            <button onClick={() => setVeiculoSelecionado(null)} className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 p-2 rounded-xl transition-colors"><X size={20}/></button>

                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Veículo Selecionado</h2>
                            <p className="font-black text-4xl tracking-widest text-blue-400 mb-2">{veiculoSelecionado.placa}</p>
                            <p className="font-bold text-lg text-slate-200">{veiculoSelecionado.modelo}</p>
                            <div className="mt-4 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 backdrop-blur-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Proprietário</p>
                                <p className="font-bold">{veiculoSelecionado.cliente?.nome || 'Não vinculado'}</p>
                            </div>
                        </div>
                    )}

                    {veiculoSelecionado && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-8">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2"><Gauge className="text-orange-500"/> Quilometragem de Entrada</h2>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Ex: 54000"
                                        value={kmAtual}
                                        onChange={e => setKmAtual(e.target.value)}
                                        className="w-full text-center py-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-orange-500 focus:bg-white outline-none text-4xl font-black text-slate-700 tracking-wider appearance-none"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">KM</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2"><Droplet className="text-blue-500"/> Nível de Combustível</h2>
                                <div className="grid grid-cols-5 gap-2">
                                    {niveisCombustivel.map((nivel, index) => (
                                        <button
                                            key={nivel}
                                            onClick={() => setNivelCombustivel(nivel)}
                                            className={`py-6 rounded-2xl font-black text-xs md:text-sm transition-all flex flex-col items-center justify-center gap-2 border-2 active:scale-95 ${
                                                nivelCombustivel === nivel
                                                    ? index === 0 ? 'bg-red-500 border-red-600 text-white shadow-lg' : 'bg-blue-500 border-blue-600 text-white shadow-lg'
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-end gap-0.5 h-6">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className={`w-1.5 md:w-2 rounded-t-sm ${i <= index - 1 || index === 4 ? 'bg-current' : 'bg-current opacity-20'} ${i === 0 ? 'h-3' : i === 1 ? 'h-4' : i === 2 ? 'h-5' : 'h-6'}`}></div>
                                                ))}
                                            </div>
                                            {nivel}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUNA DIREITA: AVARIAS, FOTOS E ASSINATURA */}
                <div className="lg:col-span-7 space-y-6">
                    {veiculoSelecionado && (
                        <>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><AlertTriangle className="text-red-500"/> Mapeamento de Avarias</h2>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{avariadasSelecionadas.length} marcadas</span>
                                </div>
                                <p className="text-sm text-slate-500 font-bold mb-4">Toque nos botões para registrar os danos visíveis no veículo:</p>

                                <div className="flex flex-wrap gap-3">
                                    {tagsAvarias.map(tag => {
                                        const selecionada = avariadasSelecionadas.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleAvaria(tag)}
                                                className={`px-4 py-3 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex items-center gap-2 ${
                                                    selecionada
                                                        ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                {selecionada && <CheckCircle size={16} />}
                                                {tag}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <label className="text-sm font-black text-slate-600 mb-2 flex items-center gap-2"><FileText size={16}/> Observações ou Avarias Extras</label>
                                    <textarea
                                        rows="3"
                                        value={observacoes}
                                        onChange={e => setObservacoes(e.target.value)}
                                        placeholder="Digite aqui se o cliente deixou itens de valor no carro, restrições especiais..."
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none text-slate-700 font-medium resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Camera className="text-blue-500"/> Evidências Fotográficas</h2>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{fotosCapturadas.length}/4 fotos</span>
                                </div>
                                <p className="text-sm text-slate-500 font-bold mb-6">Tire fotos do painel (KM) ou dos danos apontados acima.</p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handleCaptureFoto}
                                    className="hidden"
                                />

                                {fotosCapturadas.length === 0 ? (
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="bg-blue-50 p-10 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                            <ImagePlus size={40} />
                                        </div>
                                        <h3 className="font-black text-lg text-blue-900 mb-1">Toque para abrir a Câmera</h3>
                                        <p className="text-sm text-blue-700 font-medium mb-4">As fotos ficarão anexadas ao Prontuário do veículo.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {fotosCapturadas.map((foto, index) => (
                                            <div key={index} className="relative group rounded-2xl overflow-hidden aspect-square border-2 border-slate-200 shadow-sm">
                                                <img src={foto.miniaturaUrl} alt={`Evidência ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removerFoto(index)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        {fotosCapturadas.length < 4 && (
                                            <div
                                                onClick={() => fileInputRef.current.click()}
                                                className="rounded-2xl border-2 border-dashed border-slate-300 aspect-square flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                            >
                                                <ImagePlus size={32} className="mb-2" />
                                                <span className="text-xs font-black uppercase tracking-widest">Adicionar</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 🚀 MÓDULO DE ASSINATURA DIGITAL */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <PenTool className="text-blue-500"/> Assinatura do Cliente
                                    </h2>
                                    <button
                                        onClick={limparAssinatura}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                                    >
                                        Limpar / Refazer
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 font-bold mb-4">
                                    Declaro que acompanhei a vistoria e concordo com as avarias e o estado do veículo descritos acima.
                                </p>

                                <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor="black"
                                        canvasProps={{
                                            className: 'signature-canvas w-full h-40 cursor-crosshair'
                                        }}
                                    />
                                </div>
                                <div className="text-center mt-2 border-t border-slate-200 pt-2 w-3/4 mx-auto">
                                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                                        {veiculoSelecionado.cliente?.nome || 'Assinatura do Responsável'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};