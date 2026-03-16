import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import {
    Tags, Search, Printer, Plus, Minus, Settings2,
    Box, MapPin, DollarSign, Loader2, Info, Sliders, Type, Hash
} from 'lucide-react';

export const GeradorEtiquetas = () => {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [indexFocado, setIndexFocado] = useState(-1);

    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [quantidade, setQuantidade] = useState(1);

    const inputBuscaRef = useRef(null);

    // ==========================================
    // 🚀 CONFIGURAÇÕES VISUAIS BÁSICAS
    // ==========================================
    const [mostrarPreco, setMostrarPreco] = useState(true);
    const [mostrarLocalizacao, setMostrarLocalizacao] = useState(true);
    const [mostrarNomeEmpresa, setMostrarNomeEmpresa] = useState(true);
    const [mostrarNumerosCodigo, setMostrarNumerosCodigo] = useState(true);

    // ==========================================
    // 🚀 CONFIGURAÇÕES AVANÇADAS (TAMANHOS)
    // ==========================================
    const [larguraMm, setLarguraMm] = useState(50); // Padrão 50mm
    const [alturaMm, setAlturaMm] = useState(30);   // Padrão 30mm
    const [tamanhoFonteNome, setTamanhoFonteNome] = useState(9); // px
    const [tamanhoFontePreco, setTamanhoFontePreco] = useState(12); // px
    const [alturaBarras, setAlturaBarras] = useState(35); // px da barra

    const [empresaConfig, setEmpresaConfig] = useState({ nomeFantasia: 'AUTOPEÇAS' });

    // =================================================================================
    // SISTEMA DE NOTIFICAÇÕES PROFISSIONAIS (TOASTS)
    // =================================================================================
    const notificar = (tipo, titulo, msg) => {
        const conteudo = (
            <div>
                <strong className="block text-sm">{titulo}</strong>
                <span className="text-xs text-slate-100 block">{msg}</span>
            </div>
        );
        if (tipo === 'sucesso') toast.success(conteudo, { duration: 4000 });
        else if (tipo === 'erro') toast.error(conteudo, { duration: 5000 });
        else toast(conteudo, { icon: '⚠️', duration: 4000, style: { background: '#f59e0b', color: '#fff' } });
    };

    // =================================================================================
    // TOOLTIP COMPONENT
    // =================================================================================
    const Tooltip = ({ texto }) => (
        <div className="relative group cursor-pointer inline-block ml-2 align-middle">
            <Info size={16} className="text-slate-400 hover:text-indigo-500 transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-[12px] font-bold rounded-xl shadow-xl z-50 text-center leading-relaxed">
                {texto}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
    );

    useEffect(() => {
        api.get('/api/configuracoes').then(res => {
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setEmpresaConfig({ nomeFantasia: data?.nomeFantasia || 'AUTOPEÇAS' });
            }
        }).catch(() => {});
    }, []);

    // Motor de Busca Inteligente
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (busca.trim().length > 1) {
                setBuscando(true);
                try {
                    const res = await api.get(`/api/produtos?busca=${encodeURIComponent(busca)}`);
                    setResultados(res.data);
                    setIndexFocado(res.data.length > 0 ? 0 : -1);
                } catch (e) {
                    setResultados([]);
                    setIndexFocado(-1);
                } finally {
                    setBuscando(false);
                }
            } else {
                setResultados([]);
                setIndexFocado(-1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busca]);

    // =================================================================================
    // TECLADO INTELIGENTE GLOBAL E LOCAL
    // =================================================================================
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // F3 para focar na busca
            if (e.key === 'F3') {
                e.preventDefault();
                inputBuscaRef.current?.focus();
            }
            // Esc para limpar a tela
            if (e.key === 'Escape') {
                setResultados([]);
                setBusca('');
                setProdutoSelecionado(null);
                setIndexFocado(-1);
            }
            // Ctrl + P para imprimir
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                if (produtoSelecionado) imprimirEtiquetas();
                else notificar('aviso', 'Atenção', 'Selecione um produto antes de imprimir.');
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [produtoSelecionado, quantidade]); // dependências do Ctrl+P

    const handleKeyDownBusca = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndexFocado(prev => Math.min(resultados.length - 1, prev + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndexFocado(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (indexFocado >= 0 && resultados[indexFocado]) {
                selecionarProduto(resultados[indexFocado]);
            }
        }
    };

    const selecionarProduto = (prod) => {
        setProdutoSelecionado(prod);
        setBusca('');
        setResultados([]);
        setIndexFocado(-1);
        setQuantidade(1);
        notificar('sucesso', 'Produto Carregado', `Configurando etiqueta para: ${prod.nome}`);
    };

    const formatarMoeda = (valor) => {
        return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 🚀 MOTOR DE IMPRESSÃO DINÂMICO
    const imprimirEtiquetas = () => {
        if (!produtoSelecionado) return notificar('erro', 'Ação Negada', 'Selecione um produto primeiro.');

        const toastId = toast.loading('Gerando comunicação com a impressora...');

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        const barcodeSvg = document.getElementById('barcode-container').innerHTML;

        const etiquetasHtml = Array.from({ length: quantidade }).map(() => `
            <div class="etiqueta">
                ${mostrarNomeEmpresa ? `<div class="empresa">${empresaConfig.nomeFantasia}</div>` : ''}
                <div class="nome-produto">${produtoSelecionado.nome}</div>
                <div class="barcode-wrapper">${barcodeSvg}</div>
                <div class="info-rodape">
                    ${mostrarLocalizacao ? `<span class="local">Ref: ${produtoSelecionado.localizacao || 'ESTOQUE'}</span>` : '<span></span>'}
                    ${mostrarPreco ? `<span class="preco">R$ ${formatarMoeda(produtoSelecionado.precoVenda)}</span>` : '<span></span>'}
                </div>
            </div>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Impressão de Etiquetas</title>
                <style>
                    body, html { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: #fff; color: #000; }
                    
                    @page { 
                        size: ${larguraMm}mm ${alturaMm}mm; 
                        margin: 0; 
                    }

                    .etiqueta {
                        width: ${larguraMm - 1}mm;
                        height: ${alturaMm - 1}mm;
                        padding: 1mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        page-break-after: always;
                    }

                    .empresa { 
                        font-size: ${tamanhoFonteNome - 2}px; 
                        font-weight: bold; 
                        text-align: center; 
                        text-transform: uppercase; 
                        border-bottom: 1px solid #000; 
                        margin-bottom: 1px; 
                        padding-bottom: 1px; 
                    }
                    
                    .nome-produto { 
                        font-size: ${tamanhoFonteNome}px; 
                        font-weight: 900; 
                        text-align: center; 
                        text-transform: uppercase; 
                        white-space: nowrap; 
                        overflow: hidden; 
                        text-overflow: ellipsis; 
                        line-height: 1.1; 
                        margin-bottom: 2px; 
                    }
                    
                    .barcode-wrapper { 
                        text-align: center; 
                        flex: 1; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        overflow: hidden; 
                    }
                    
                    .barcode-wrapper svg { 
                        max-width: 100%; 
                        height: 100%; 
                        object-fit: contain; 
                    }
                    
                    .info-rodape { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-end;
                        font-weight: 900; 
                        margin-top: 1px; 
                    }
                    
                    .local {
                        font-size: ${tamanhoFonteNome - 2}px;
                    }

                    .preco { 
                        font-size: ${tamanhoFontePreco}px; 
                    }
                </style>
            </head>
            <body>
                ${etiquetasHtml}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    }
                </script>
            </body>
            </html>
        `;

        doc.open();
        doc.write(htmlContent);
        doc.close();

        toast.success("Documento enviado para a impressora!", { id: toastId });

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 10000);
    };

    const codigoParaEtiqueta = produtoSelecionado?.codigoBarras || produtoSelecionado?.sku || '00000000';

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Tags className="text-indigo-600 bg-indigo-100 p-1.5 rounded-lg" size={36} />
                        GERADOR DE ETIQUETAS
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Configure e imprima etiquetas padronizadas para prateleiras</p>
                </div>
                <div className="hidden md:flex gap-4">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-200">F3: Buscar</span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-200">Ctrl+P: Imprimir</span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-200">Esc: Limpar</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* COLUNA ESQUERDA: CONFIGURAÇÕES E BUSCA */}
                <div className="lg:col-span-7 space-y-6">

                    {/* MOTOR DE BUSCA */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative z-50">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                            1. Selecione a Peça <Tooltip texto="Digite o nome, SKU ou Código de barras. Use as setas para navegar e Enter para confirmar."/>
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                            <input
                                ref={inputBuscaRef}
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                onKeyDown={handleKeyDownBusca}
                                placeholder="Digite o nome, código ou referência (F3)..."
                                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all text-lg shadow-inner"
                            />
                            {buscando && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={20} />}
                        </div>

                        {resultados.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-indigo-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-[100]">
                                {resultados.map((prod, idx) => (
                                    <div
                                        key={prod.id}
                                        onClick={() => selecionarProduto(prod)}
                                        onMouseEnter={() => setIndexFocado(idx)}
                                        className={`p-4 border-b border-slate-100 cursor-pointer transition-colors flex justify-between items-center ${idx === indexFocado ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-slate-800'}`}
                                    >
                                        <div>
                                            <p className="font-bold">{prod.nome}</p>
                                            <p className={`text-xs font-mono mt-1 ${idx === indexFocado ? 'text-indigo-200' : 'text-slate-500'}`}>{prod.sku} • {prod.marca?.nome}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${idx === indexFocado ? 'text-white' : 'text-indigo-600'}`}>R$ {formatarMoeda(prod.precoVenda)}</p>
                                            <p className={`text-[10px] font-bold uppercase ${idx === indexFocado ? 'text-indigo-200' : 'text-slate-400'}`}>Estoque: {prod.quantidadeEstoque}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CONFIGURAÇÕES AVANÇADAS */}
                    <div className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${produtoSelecionado ? 'border-indigo-300' : 'border-slate-200 opacity-50 pointer-events-none'}`}>
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 size={18} className="text-slate-500"/>
                                <h3 className="font-black text-sm text-slate-700 uppercase tracking-widest">2. Ajustes Visuais da Etiqueta</h3>
                            </div>
                            <Tooltip texto="Configure o que será impresso e ajuste os milímetros exatos para casar com o seu rolo da impressora térmica (ex: Zebra, Argox)." />
                        </div>

                        <div className="p-6 space-y-6">
                            {/* O que exibir */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">O que imprimir?</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <label className="flex items-center gap-2 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={mostrarPreco} onChange={(e) => setMostrarPreco(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                        <span className="font-bold text-xs text-slate-700 flex items-center gap-1"><DollarSign size={14}/> Preço</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={mostrarLocalizacao} onChange={(e) => setMostrarLocalizacao(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                        <span className="font-bold text-xs text-slate-700 flex items-center gap-1"><MapPin size={14}/> Local</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={mostrarNomeEmpresa} onChange={(e) => setMostrarNomeEmpresa(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                        <span className="font-bold text-xs text-slate-700 flex items-center gap-1"><Box size={14}/> Loja</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" title="Mostra os números abaixo das barras">
                                        <input type="checkbox" checked={mostrarNumerosCodigo} onChange={(e) => setMostrarNumerosCodigo(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                                        <span className="font-bold text-xs text-slate-700 flex items-center gap-1"><Hash size={14}/> SKU</span>
                                    </label>
                                </div>
                            </div>

                            {/* Tamanho Físico */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                    <Sliders size={12}/> Dimensões do Papel (Milímetros)
                                    <Tooltip texto="Verifique a medida física do seu rolo de etiquetas. O padrão mais comum é 50x30mm."/>
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Largura (mm)</span>
                                        <input type="number" value={larguraMm} onChange={e => setLarguraMm(e.target.value)} className="w-16 p-1 text-center font-black bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Altura (mm)</span>
                                        <input type="number" value={alturaMm} onChange={e => setAlturaMm(e.target.value)} className="w-16 p-1 text-center font-black bg-white border border-slate-300 rounded outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Tamanho das Fontes */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                    <Type size={12}/> Tamanho das Letras
                                    <Tooltip texto="Ajuste o tamanho da letra se o texto estiver sendo cortado ou se a leitura do código de barras estiver falhando."/>
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                                        <span className="text-xs font-bold text-slate-600 text-center">Texto</span>
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setTamanhoFonteNome(Math.max(6, tamanhoFonteNome - 1))} className="p-1 bg-white border rounded hover:bg-slate-100"><Minus size={14}/></button>
                                            <span className="font-black">{tamanhoFonteNome}</span>
                                            <button onClick={() => setTamanhoFonteNome(tamanhoFonteNome + 1)} className="p-1 bg-white border rounded hover:bg-slate-100"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                                        <span className="text-xs font-bold text-slate-600 text-center">Preço</span>
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setTamanhoFontePreco(Math.max(8, tamanhoFontePreco - 1))} className="p-1 bg-white border rounded hover:bg-slate-100"><Minus size={14}/></button>
                                            <span className="font-black">{tamanhoFontePreco}</span>
                                            <button onClick={() => setTamanhoFontePreco(tamanhoFontePreco + 1)} className="p-1 bg-white border rounded hover:bg-slate-100"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                                        <span className="text-xs font-bold text-slate-600 text-center">Barras</span>
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setAlturaBarras(Math.max(20, alturaBarras - 5))} className="p-1 bg-white border rounded hover:bg-slate-100"><Minus size={14}/></button>
                                            <span className="font-black">{alturaBarras}</span>
                                            <button onClick={() => setAlturaBarras(alturaBarras + 5)} className="p-1 bg-white border rounded hover:bg-slate-100"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: PREVIEW E AÇÃO */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col h-full relative overflow-hidden z-10">

                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl z-0"></div>

                        <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2 z-10">
                            <Printer size={18} className="text-indigo-400"/> Pré-visualização
                        </h3>

                        {produtoSelecionado ? (
                            <div className="flex-1 flex flex-col items-center justify-start mt-4 z-10">

                                {/* O DESENHO DA ETIQUETA (Simulando proporções) */}
                                <div
                                    className="bg-white text-black rounded shadow-[0_0_20px_rgba(255,255,255,0.2)] flex flex-col justify-between overflow-hidden transition-all duration-300"
                                    style={{
                                        width: larguraMm * 4, // Zoom de 4x para facilitar a visualização na tela
                                        height: alturaMm * 4,
                                        padding: 4,
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {mostrarNomeEmpresa && (
                                        <div className="text-center border-b border-slate-800 pb-0.5 mb-1">
                                            <p className="font-black uppercase tracking-widest" style={{ fontSize: (tamanhoFonteNome - 2) * 1.5 }}>
                                                {empresaConfig.nomeFantasia}
                                            </p>
                                        </div>
                                    )}

                                    <h4 className="font-black text-center leading-tight mb-1 uppercase truncate" title={produtoSelecionado.nome} style={{ fontSize: tamanhoFonteNome * 1.5 }}>
                                        {produtoSelecionado.nome}
                                    </h4>

                                    <div id="barcode-container" className="flex justify-center flex-1 items-center overflow-hidden w-full">
                                        <Barcode
                                            value={codigoParaEtiqueta}
                                            format="CODE128"
                                            width={1.5}
                                            height={alturaBarras}
                                            fontSize={mostrarNumerosCodigo ? 12 : 0}
                                            margin={0}
                                            background="#ffffff"
                                            displayValue={mostrarNumerosCodigo}
                                        />
                                    </div>

                                    <div className="flex justify-between items-end mt-1 pt-1 border-t border-slate-200">
                                        {mostrarLocalizacao ? (
                                            <div className="font-bold text-slate-500 uppercase" style={{ fontSize: (tamanhoFonteNome - 2) * 1.5 }}>
                                                LOC: {produtoSelecionado.localizacao || 'ESTOQUE'}
                                            </div>
                                        ) : <div></div>}

                                        {mostrarPreco && (
                                            <div className="font-black text-slate-900 leading-none" style={{ fontSize: tamanhoFontePreco * 1.5 }}>
                                                R$ {formatarMoeda(produtoSelecionado.precoVenda)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-10 w-full flex items-center justify-between bg-slate-800 p-2 rounded-2xl border border-slate-700">
                                    <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"><Minus size={24}/></button>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Quantidade</p>
                                        <span className="font-black text-3xl text-white block">{quantidade}</span>
                                    </div>
                                    <button onClick={() => setQuantidade(quantidade + 1)} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/30"><Plus size={24}/></button>
                                </div>

                                <button
                                    onClick={imprimirEtiquetas}
                                    title="Ctrl + P"
                                    className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-transform transform hover:scale-[1.02] shadow-xl shadow-emerald-500/20 text-lg uppercase tracking-widest"
                                >
                                    <Printer size={24} /> IMPRIMIR AGORA (CTRL+P)
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center z-10 border-2 border-dashed border-slate-700 rounded-2xl p-6 bg-slate-800/50">
                                <Tags size={48} className="text-slate-600 mb-4" />
                                <p className="text-slate-400 font-bold text-lg">Nenhuma peça selecionada.</p>
                                <p className="text-slate-500 text-sm mt-2">Busque um produto ao lado para liberar as configurações da etiqueta.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};