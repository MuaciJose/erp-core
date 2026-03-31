import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Car, X, Calendar, PenTool, User, Gauge, CheckCircle,
    ClipboardCheck, Droplet, AlertTriangle, FileText, Camera, Printer, CalendarPlus
} from 'lucide-react'; // 🚀 IMPORTAMOS O ÍCONE DA IMPRESSORA AQUI!
import toast from 'react-hot-toast';
export const HistoricoVeiculoModal = ({ veiculo, cliente, onClose }) => {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);

    const abrirAgenda = () => {
        localStorage.setItem('agenda_quick_create', JSON.stringify({
            titulo: `Retorno do veículo ${veiculo.placa}`,
            descricao: `Contato sobre ${veiculo.marca} ${veiculo.modelo} • Placa ${veiculo.placa}`,
            setor: 'RECEPCAO',
            prioridade: 'NORMAL',
            status: 'AGENDADO',
            parceiroId: cliente?.id || null,
            veiculoId: veiculo.id,
            dataInicio: `${new Date().toISOString().slice(0, 10)}T09:00`,
            dataFim: `${new Date().toISOString().slice(0, 10)}T09:30`
        }));
        window.dispatchEvent(new CustomEvent('grandport:navigate', { detail: { page: 'agenda' } }));
        onClose?.();
    };

    useEffect(() => {
        const carregarHistorico = async () => {
            setLoading(true);
            try {
                // O back-end agora devolve a lista misturada (OS e Checklists) ordenada por data
                const res = await api.get(`/api/veiculos/${veiculo.id}/historico`);
                setHistorico(res.data);
            } catch (error) {
                console.error("Erro ao carregar histórico", error);
            } finally {
                setLoading(false);
            }
        };

        if (veiculo) carregarHistorico();
    }, [veiculo]);

    // 🚀 FUNÇÃO PARA ABRIR O PDF DO LAUDO (COM SEGURANÇA JWT)
    const handleImprimirLaudo = async (idVistoria) => {
        const toastId = toast.loading("Gerando Laudo Oficial...");
        try {
            // O Axios vai até o Java levando o Token e traz o PDF como um 'Blob' (Arquivo Bruto)
            const response = await api.get(`/api/checklists/${idVistoria}/laudo`, {
                responseType: 'blob'
            });

            // Transforma o arquivo bruto em um link temporário na memória do navegador
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Abre o PDF perfeitamente na nova aba
            window.open(fileURL, '_blank');
            toast.success("Laudo gerado com sucesso!", { id: toastId });

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar o laudo. Verifique o servidor.", { id: toastId });
        }
    };
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">

                {/* CABEÇALHO */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                            <Car size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-widest uppercase">PRONTUÁRIO DO VEÍCULO</h2>
                            <p className="text-blue-300 font-bold text-sm">
                                {veiculo.marca} {veiculo.modelo} • Placa: <span className="text-white bg-white/20 px-2 rounded uppercase">{veiculo.placa}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={abrirAgenda} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors">
                            <CalendarPlus size={14} /> Agendar
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <X size={24} className="text-slate-400 hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* CORPO DA LINHA DO TEMPO */}
                <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400 font-bold animate-pulse">
                            Buscando registros no sistema...
                        </div>
                    ) : historico.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-bold">
                            Nenhum registro encontrado para este veículo.
                        </div>
                    ) : (
                        <div className="relative border-l-4 border-slate-200 ml-6 space-y-10">
                            {historico.map((evento, index) => (
                                <div key={index} className="relative pl-8">

                                    {/* EVENTO TIPO: CHECKLIST / VISTORIA */}
                                    {evento.tipo === 'CHECKLIST' && (
                                        <>
                                            <div className="absolute -left-[14px] top-0 bg-orange-500 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-md">
                                                <div className="bg-white w-1.5 h-1.5 rounded-full"></div>
                                            </div>

                                            <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-orange-100 hover:shadow-md transition-shadow relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                                                    <ClipboardCheck size={12} /> Vistoria
                                                </div>

                                                {/* 🚀 CABEÇALHO DO CHECKLIST COM NÚMERO E BOTÃO PDF */}
                                                <div className="flex justify-between items-start mb-4 mt-2">
                                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                        <Calendar size={16} className="text-orange-500"/>
                                                        {new Date(evento.data).toLocaleDateString('pt-BR')} às {new Date(evento.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                        <span className="text-slate-400 font-medium ml-1 hidden md:inline">(Vistoria #{evento.idReferencia})</span>
                                                    </p>

                                                    <button
                                                        onClick={() => handleImprimirLaudo(evento.idReferencia)}
                                                        className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-500 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"
                                                        title="Imprimir Laudo em PDF"
                                                    >
                                                        <Printer size={14} /> Laudo PDF
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium text-slate-700 bg-orange-50/50 p-4 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Gauge size={16} className="text-slate-500" />
                                                        <span><strong className="text-slate-900">KM Entrada:</strong> {evento.dadosChecklist.kmAtual.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Droplet size={16} className="text-blue-500" />
                                                        <span><strong className="text-slate-900">Combustível:</strong> {evento.dadosChecklist.nivelCombustivel}</span>
                                                    </div>
                                                    {evento.dadosChecklist.itensAvariados && (
                                                        <div className="flex items-start gap-2 md:col-span-2">
                                                            <AlertTriangle size={16} className="text-red-500 mt-0.5" shrink-0 />
                                                            <span><strong className="text-slate-900">Avarias:</strong> {evento.dadosChecklist.itensAvariados}</span>
                                                        </div>
                                                    )}
                                                    {evento.dadosChecklist.observacoes && (
                                                        <div className="flex items-start gap-2 md:col-span-2">
                                                            <FileText size={16} className="text-slate-400 mt-0.5" shrink-0 />
                                                            <span className="italic text-slate-500">"{evento.dadosChecklist.observacoes}"</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* SEÇÃO DE FOTOS */}
                                                {evento.dadosChecklist.fotos && evento.dadosChecklist.fotos.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-orange-200/50">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                            <Camera size={12}/> Evidências Fotográficas
                                                        </p>
                                                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                                                            {evento.dadosChecklist.fotos.map((fotoUrl, imgIndex) => (
                                                                <div key={imgIndex} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm hover:border-orange-400 transition-colors cursor-pointer relative group">
                                                                    <img
                                                                        src={fotoUrl}
                                                                        alt={`Evidência ${imgIndex + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SEÇÃO DE ASSINATURA */}
                                                {evento.dadosChecklist.urlAssinaturaCliente && (
                                                    <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col items-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                                            <PenTool size={12}/> Assinatura do Cliente
                                                        </p>
                                                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 inline-block shadow-sm">
                                                            <img
                                                                src={evento.dadosChecklist.urlAssinaturaCliente}
                                                                alt="Assinatura Digital"
                                                                className="max-w-[200px] h-auto object-contain mix-blend-multiply"
                                                            />
                                                            <div className="border-t border-slate-300 mt-2 pt-2 text-center w-full">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                    Termo Aceito
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        </>
                                    )}

                                    {/* EVENTO TIPO: OS / VENDA DE PEÇAS */}
                                    {(evento.tipo === 'OS' || evento.tipo === 'VENDA') && (
                                        <>
                                            <div className="absolute -left-[14px] top-0 bg-blue-500 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-md">
                                                <div className="bg-white w-1.5 h-1.5 rounded-full"></div>
                                            </div>

                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                                                    <PenTool size={12} /> Ordem de Serviço
                                                </div>

                                                <div className="flex flex-wrap justify-between items-start mb-4 border-b border-dashed pb-4 gap-4 mt-2">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
                                                            <Calendar size={16} className="text-blue-500"/>
                                                            {new Date(evento.data).toLocaleDateString('pt-BR')} (OS #{evento.idReferencia})
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                                            <User size={14} className="text-slate-400"/> Responsável: {evento.dadosOs.clienteComprador}
                                                        </p>
                                                    </div>

                                                    <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 text-right">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 justify-end">
                                                            <Gauge size={12}/> KM Registrado
                                                        </p>
                                                        <p className="text-lg font-black text-slate-700">{evento.dadosOs.kmRegistrado ? evento.dadosOs.kmRegistrado.toLocaleString('pt-BR') : '---'} km</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                                        Serviços e Peças Aplicadas
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {evento.dadosOs.itens.map((item, i) => (
                                                            <li key={i} className="flex justify-between text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg">
                                                                <span className="flex items-center gap-2">
                                                                    <CheckCircle size={14} className="text-green-500" /> {item.descricao}
                                                                </span>
                                                                <span className="text-slate-500">R$ {item.valor.toFixed(2)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
