import React, { useState, useEffect } from 'react';
import { Printer, FileText, User, DollarSign, Building2, History, Info } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const ReciboAvulso = ({ setPaginaAtiva }) => {
    const [configEmpresa, setConfigEmpresa] = useState({
        nomeFantasia: '', razaoSocial: '', cidade: '', cnpj: '', endereco: '', telefone: '', email: '', logoBase64: ''
    });

    const [dadosCompletos, setDadosCompletos] = useState(true);
    const [salvarNoBanco, setSalvarNoBanco] = useState(false);
    const [processando, setProcessando] = useState(false);

    // 🚀 NOVO: Estado para o texto final editável
    const [textoFinal, setTextoFinal] = useState("pelo que firmo(amos) o presente para que produza seus efeitos.");

    const [dados, setDados] = useState({
        pagador: '',
        valor: '',
        valorExtenso: '',
        referente: '',
        cidade: '',
        data: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        api.get('/api/configuracoes').then(res => {
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data) {
                setConfigEmpresa(data);
                setDados(prev => ({ ...prev, cidade: data.cidade || '' }));
            }
        });
    }, []);

    useEffect(() => {
        if (dados.valor) {
            const texto = escreverValorPorExtenso(dados.valor);
            setDados(prev => ({ ...prev, valorExtenso: texto }));
        } else {
            setDados(prev => ({ ...prev, valorExtenso: '' }));
        }
    }, [dados.valor]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDados(prev => ({ ...prev, [name]: value }));
    };

    const limparCampos = () => {
        setDados({
            pagador: '',
            valor: '',
            valorExtenso: '',
            referente: '',
            cidade: configEmpresa.cidade || '',
            data: new Date().toISOString().split('T')[0]
        });
        setSalvarNoBanco(false);
        setProcessando(false);
        setTextoFinal("pelo que firmo(amos) o presente para que produza seus efeitos."); // Restaura o texto padrão
    };

    const formatarMoeda = (valor) => {
        const n = parseFloat(valor) || 0;
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const processarRecibo = async () => {
        if (!dados.pagador.trim()) {
            return toast.error("O campo 'Recebemos de' é obrigatório!");
        }
        if (!dados.valor) {
            return toast.error("O campo 'A quantia de (R$)' é obrigatório!");
        }
        if (!dados.valorExtenso.trim()) {
            return toast.error("O campo 'Valor por Extenso' é obrigatório!");
        }
        if (!dados.referente.trim()) {
            return toast.error("O campo 'Referente a' é obrigatório!");
        }
        if (!dados.cidade.trim()) {
            return toast.error("O campo 'Cidade' é obrigatório!");
        }
        if (!dados.data) {
            return toast.error("O campo 'Data' é obrigatório!");
        }

        setProcessando(true);

        if (salvarNoBanco) {
            const loadId = toast.loading("Registrando recibo no financeiro...");
            try {
                await api.post('/api/financeiro/recibos', {
                    ...dados,
                    valor: parseFloat(dados.valor),
                    tipo: 'EMITIDO',
                    dataRegistro: new Date().toISOString()
                });
                toast.success("Recibo salvo com sucesso!", { id: loadId });
            } catch (error) {
                console.error(error);
                toast.error("Erro ao salvar no banco, tente novamente.", { id: loadId });
                setProcessando(false);
                return;
            }
        }

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                limparCampos();
            }, 1000);
        }, 500);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in relative min-h-screen">

            {/* BARRA DE TOPO */}
            <div className="mb-8 flex justify-between items-end print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FileText className="text-blue-600 bg-blue-100 p-1.5 rounded-xl" size={40} />
                        GERADOR DE RECIBO
                    </h1>
                    <p className="text-slate-500 mt-1">Preencha os dados abaixo. O sistema limpa os campos após salvar.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setPaginaAtiva('historico-recibos')}
                        className="group relative bg-white text-slate-600 px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border-2 border-slate-200 shadow-sm"
                    >
                        <History size={20} className="text-indigo-500" /> VER HISTÓRICO
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg pointer-events-none z-50">
                            Reimprimir recibos antigos
                        </span>
                    </button>

                    <button
                        onClick={processarRecibo}
                        disabled={processando}
                        className={`group relative ${processando ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'} text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all`}
                    >
                        <Printer size={20} /> {processando ? 'PROCESSANDO...' : (salvarNoBanco ? 'SALVAR E IMPRIMIR' : 'APENAS IMPRIMIR')}
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg pointer-events-none z-50">
                            Gera o recibo em tela cheia
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* COLUNA DO FORMULÁRIO */}
                <div className="w-full lg:w-[400px] space-y-4 print:hidden">
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 space-y-3">
                        <h2 className="font-black text-blue-400 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-2">
                            <Building2 size={14}/> Preferências do Documento
                        </h2>

                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-2xl border border-slate-700">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 group relative cursor-help w-max">
                                    <p className="text-white font-bold text-xs">Dados da Empresa</p>
                                    <Info size={14} className="text-slate-400" />
                                    <span className="absolute left-0 -top-8 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-50">
                                        Exibe sua logo e CNPJ no cabeçalho
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5">Mostrar logo e endereço</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={dadosCompletos} onChange={() => setDadosCompletos(!dadosCompletos)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-2xl border border-slate-700">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 group relative cursor-help w-max">
                                    <p className="text-white font-bold text-xs">Salvar no Histórico</p>
                                    <Info size={14} className="text-slate-400" />
                                    <span className="absolute left-0 -top-8 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-50">
                                        Grava no banco para controle
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5">Gravar no banco de dados</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={salvarNoBanco} onChange={() => setSalvarNoBanco(!salvarNoBanco)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="font-black text-slate-400 uppercase text-xs tracking-widest mb-2">Conteúdo do Recibo</h2>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Recebemos de <span className="text-red-500">*</span></label>
                            <div className="relative mt-1">
                                <User className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input type="text" name="pagador" value={dados.pagador} onChange={handleChange} placeholder="Nome do cliente" className="w-full pl-10 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">A quantia de (R$) <span className="text-red-500">*</span></label>
                            <div className="relative mt-1">
                                <DollarSign className="absolute left-3 top-3 text-slate-300" size={18} />
                                <input type="number" name="valor" value={dados.valor} onChange={handleChange} placeholder="0.00" className="w-full pl-10 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor por Extenso (Editável) <span className="text-red-500">*</span></label>
                            <textarea name="valorExtenso" value={dados.valorExtenso} onChange={handleChange} rows="2" className="w-full p-3 mt-1 bg-blue-50 border-2 border-blue-100 rounded-xl font-bold text-blue-800 text-xs outline-none transition-all" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Referente a <span className="text-red-500">*</span></label>
                            <textarea name="referente" value={dados.referente} onChange={handleChange} rows="2" placeholder="Ex: Pagamento da Venda #102..." className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                        </div>

                        {/* 🚀 NOVO: Campo Editável para o Texto de Fechamento */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Texto de Fechamento (Opcional):</label>
                            <textarea
                                value={textoFinal}
                                onChange={(e) => setTextoFinal(e.target.value)}
                                rows="2"
                                className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-600 text-xs outline-none transition-all focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cidade <span className="text-red-500">*</span></label>
                                <input type="text" name="cidade" value={dados.cidade} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data <span className="text-red-500">*</span></label>
                                <input type="date" name="data" value={dados.data} onChange={handleChange} className="w-full p-3 mt-1 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ÁREA DE IMPRESSÃO */}
                <div id="print-area-wrapper" className="flex-1 bg-white p-2 border border-slate-300 shadow-2xl rounded-sm print:p-0 min-h-[148mm]">
                    <div id="recibo-final" className="border-[3px] border-double border-slate-900 p-10 bg-white relative font-serif">

                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none text-center">
                            <h1 className="text-9xl font-black -rotate-12">RECIBO</h1>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10">

                                <div className="max-w-[65%]">
                                    {dadosCompletos ? (
                                        <div className="flex items-center gap-4">
                                            {configEmpresa.logoBase64 && <img src={configEmpresa.logoBase64} alt="Logo" className="w-16 h-16 object-contain" />}
                                            <div className="font-sans">
                                                <h2 className="text-2xl font-black uppercase leading-tight tracking-tighter">{configEmpresa.nomeFantasia || "MINHA AUTOPEÇAS"}</h2>
                                                <p className="text-[10px] font-bold text-slate-700 uppercase">{configEmpresa.razaoSocial}</p>
                                                <p className="text-[10px] text-slate-600 mt-1">{configEmpresa.endereco}</p>
                                                <p className="text-[10px] font-black uppercase">CNPJ: {configEmpresa.cnpj} {configEmpresa.telefone && ` | TEL: ${configEmpresa.telefone}`}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <h2 className="text-3xl font-black uppercase tracking-tighter font-sans">{configEmpresa.nomeFantasia || "RECIBO"}</h2>
                                    )}
                                </div>

                                <div className="text-right">
                                    <h1 className="text-4xl italic font-black text-slate-900 flex items-center justify-end gap-3">
                                        Recibo
                                    </h1>
                                    <div className="mt-3 inline-block border-2 border-slate-900 bg-slate-50 px-6 py-2 rounded-lg font-black text-3xl font-sans">
                                        {formatarMoeda(dados.valor)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-2xl leading-[3.8rem] text-justify text-slate-900">
                                Recebi(emos) de <span className="font-black border-b border-slate-400 px-2 uppercase">{dados.pagador || "...................................................................."}</span>,
                                a quantia de <span className="font-black border-b border-slate-400 px-2">{formatarMoeda(dados.valor)}</span>
                                (<span className="italic font-bold text-slate-700 px-2 lowercase">{dados.valorExtenso || "...................................................................................."}</span>),
                                referente a <span className="font-black border-b border-slate-400 px-2 uppercase">{dados.referente || "...................................................................."}</span>,
                                {/* 🚀 AQUI O TEXTO FINAL É RENDERIZADO DE FORMA DINÂMICA */}
                                {textoFinal}
                            </div>

                            <div className="mt-16 text-right text-xl font-bold uppercase tracking-tight">
                                {dados.cidade || "__________"}, {new Date(dados.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                            </div>

                            <div className="mt-24 flex flex-col items-center">
                                <div className="w-1/2 border-t-2 border-slate-900 text-center pt-4">
                                    <p className="text-xl font-black uppercase font-sans">{configEmpresa.nomeFantasia || 'A SUA EMPRESA'}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 font-sans">Assinatura do Emitente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: landscape; }
                    body * { visibility: hidden !important; }
                    
                    html, body, #root, main, div[class*="overflow-y-auto"] { 
                        height: auto !important; 
                        min-height: 0 !important;
                        overflow: visible !important; 
                        position: static !important;
                        background: white !important;
                    }

                    #print-area-wrapper, #print-area-wrapper * { 
                        visibility: visible !important; 
                    }

                    #print-area-wrapper {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    #recibo-final {
                        border: 3px double #000 !important;
                        padding: 40px !important;
                        margin: 1cm !important;
                    }

                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

function escreverValorPorExtenso(valor) {
    let v = valor.toString().replace(',', '.');
    if (isNaN(v) || v === "") return "";
    let unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    let dezena1 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    let dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    let centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    function converter_grupo(n) {
        let output = "";
        let c = Math.floor(n / 100); let d = Math.floor((n % 100) / 10); let u = n % 10;
        if (n === 100) return "cem";
        if (c > 0) output += centenas[c];
        if (d > 0 || u > 0) {
            if (c > 0) output += " e ";
            if (d === 1) output += dezena1[u];
            else { output += dezenas[d]; if (d > 0 && u > 0) output += " e "; output += unidades[u]; }
        }
        return output;
    }
    let partes = parseFloat(v).toFixed(2).split('.');
    let inteiro = parseInt(partes[0]); let centavos = parseInt(partes[1]);
    let resultado = "";
    if (inteiro > 0) {
        if (inteiro >= 1000000) {
            let milhao = Math.floor(inteiro / 1000000);
            resultado += converter_grupo(milhao) + (milhao > 1 ? " milhões" : " milhão");
            inteiro %= 1000000; if (inteiro > 0) resultado += " e ";
        }
        if (inteiro >= 1000) {
            let mil = Math.floor(inteiro / 1000);
            resultado += (mil === 1 ? "" : converter_grupo(mil)) + " mil";
            inteiro %= 1000; if (inteiro > 0) resultado += (inteiro < 100 || inteiro % 100 === 0 ? " e " : " ");
        }
        if (inteiro > 0) resultado += converter_grupo(inteiro);
        resultado += (parseInt(partes[0]) === 1 ? " real" : " reais");
    }
    if (centavos > 0) {
        if (resultado !== "") resultado += " e ";
        resultado += converter_grupo(centavos) + (centavos === 1 ? " centavo" : " centavos");
    }
    return resultado.trim();
}