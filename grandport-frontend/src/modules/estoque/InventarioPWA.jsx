import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Ajuste o caminho da sua API se necessário
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanBarcode, MapPin, Package, CheckCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

// ==========================================
// 📷 1. COMPONENTE SCANNER WEB
// ==========================================
const ScannerWeb = ({ onScan }) => {
    useEffect(() => {
        // Inicializa o leitor de câmera para o Navegador
        const scanner = new Html5QrcodeScanner("leitor-codigo", {
            qrbox: { width: 250, height: 100 }, // Formato retangular para EAN e Códigos de Barras
            fps: 10,
        });

        scanner.render(
            (textoLido) => {
                scanner.clear(); // Para a câmera ao ler com sucesso
                onScan(textoLido);
            },
            (erro) => {
                // Ignora erros de frame vazio (quando a câmera não acha nenhum código)
            }
        );

        return () => {
            scanner.clear().catch(e => console.error("Erro ao limpar scanner", e));
        };
    }, [onScan]);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 text-white p-4 rounded-t-xl w-full max-w-sm text-center font-bold flex items-center justify-center gap-2">
                <ScanBarcode size={20} /> Aponte a Câmera
            </div>
            <div id="leitor-codigo" className="w-full max-w-sm bg-white border-2 border-slate-900 rounded-b-xl overflow-hidden"></div>
            <p className="text-xs text-slate-500 mt-4 text-center font-medium">
                Nota: O acesso à câmera requer conexão segura (HTTPS) ou Localhost.
            </p>
        </div>
    );
};

// ==========================================
// ⚙️ 2. COMPONENTE AJUSTE DE ESTOQUE
// ==========================================
const AjusteEstoque = ({ produto, onUpdate }) => {
    const [novaQtd, setNovaQtd] = useState(produto.quantidadeEstoque?.toString() || "0");
    const [salvando, setSalvando] = useState(false);

    const confirmarAjuste = async () => {
        if (!novaQtd || isNaN(novaQtd)) return toast.error("Digite uma quantidade válida!");

        setSalvando(true);
        try {
            await api.patch(`/api/produtos/${produto.id}/ajuste-estoque`, {
                quantidade: parseInt(novaQtd),
                motivo: "Inventário Manual PWA"
            });
            toast.success("Estoque atualizado com sucesso!");

            // Vibra o celular (se o navegador suportar) para confirmar sucesso
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            onUpdate();
        } catch (err) {
            toast.error("Erro ao atualizar o saldo.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6">
            <label className="text-xs font-black text-slate-500 uppercase block mb-2">Contagem Física Real:</label>
            <div className="flex gap-2">
                <input
                    type="number"
                    value={novaQtd}
                    onChange={(e) => setNovaQtd(e.target.value)}
                    className="flex-1 text-center font-black text-2xl bg-white border-2 border-slate-300 rounded-lg focus:border-indigo-500 outline-none p-2"
                />
                <button
                    onClick={confirmarAjuste}
                    disabled={salvando}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-lg uppercase transition-colors flex items-center justify-center shadow-md active:scale-95"
                >
                    {salvando ? <RefreshCw size={20} className="animate-spin" /> : 'Salvar'}
                </button>
            </div>
        </div>
    );
};

// ==========================================
// 📦 3. COMPONENTE DETALHE DO PRODUTO
// ==========================================
const DetalheProduto = ({ produto, onVoltar, onReload }) => {
    const [similares, setSimilares] = useState([]);

    useEffect(() => {
        const carregarSimilares = async () => {
            try {
                const res = await api.get(`/api/produtos/${produto.id}/similares`);
                setSimilares(res.data);
            } catch (error) {
                console.error("Erro ao carregar similares", error);
            }
        };
        carregarSimilares();
    }, [produto.id]);

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // Tratamento de imagem para a Web (Apontando para a base da sua API)
    const apiBaseUrl = api.defaults.baseURL?.replace(/\/$/, '') || '';
    const urlImagem = produto.fotoUrl || (produto.fotoLocalPath ? `${apiBaseUrl}${produto.fotoLocalPath}` : 'https://via.placeholder.com/300?text=Sem+Foto');

    return (
        <div className="flex flex-col h-full bg-white pb-20 animate-fade-in relative z-50">
            {/* Header Fixo Mobile */}
            <div className="bg-slate-900 text-white p-4 sticky top-0 z-10 flex items-center gap-4 shadow-md">
                <button onClick={onVoltar} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-black truncate flex-1 text-lg">Detalhes da Peça</h1>
            </div>

            <div className="p-4 overflow-y-auto">
                {/* Foto Centralizada */}
                <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex justify-center border border-slate-100">
                    <img src={urlImagem} alt={produto.nome} className="w-48 h-48 object-contain rounded-lg shadow-sm" />
                </div>

                {/* Info Principal */}
                <div className="mb-4">
                    <h2 className="text-xl font-black text-slate-800 leading-tight mb-1">{produto.nome}</h2>
                    <p className="text-sm font-bold text-slate-500 mb-3">Marca: {produto.marca?.nome || 'Genérica'}</p>

                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg mb-2 shadow-sm">
                        <Package size={16} />
                        <span className="font-black text-sm uppercase tracking-wider">Estoque Atual: {produto.quantidadeEstoque} un</span>
                    </div>
                </div>

                {/* Componente Ajuste */}
                <AjusteEstoque produto={produto} onUpdate={onReload} />

                {/* Localização (Destaque Laranja) */}
                <div className="bg-orange-50 border-2 border-orange-400 p-4 rounded-xl text-center mb-6 shadow-sm">
                    <p className="text-xs font-black text-orange-600 uppercase mb-1 flex items-center justify-center gap-1">
                        <MapPin size={14} /> Onde Encontrar
                    </p>
                    <p className="text-2xl font-black text-orange-700">{produto.localizacao || "NÃO ENDEREÇADO"}</p>
                </div>

                {/* Aplicações */}
                <h3 className="text-sm font-black text-slate-700 uppercase mb-2">Aplicações</h3>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 text-sm text-slate-700 shadow-inner">
                    {produto.aplicacao || "Nenhuma aplicação específica cadastrada."}
                </div>

                {/* Similares Cruzados */}
                <h3 className="text-sm font-black text-slate-700 uppercase mb-1">Equivalentes (Ref. Original)</h3>
                <p className="text-xs font-bold text-blue-600 mb-3">Cód: {produto.referenciaOriginal || 'N/A'}</p>

                <div className="space-y-3 mb-6">
                    {similares.length === 0 ? (
                        <p className="text-xs text-slate-400 italic flex items-center gap-1">
                            <AlertTriangle size={14}/> Nenhuma outra marca em estoque.
                        </p>
                    ) : (
                        similares.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
                                <img src={item.fotoUrl || 'https://via.placeholder.com/50'} alt="Similar" className="w-12 h-12 object-cover rounded-lg border border-slate-100" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.nome}</p>
                                    <p className="text-xs text-slate-500">Marca: {item.marca?.nome}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">{item.quantidadeEstoque} un</p>
                                    <p className="text-xs font-bold text-slate-500">R$ {formatarMoeda(item.precoVenda)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Preço Fixo Rodapé */}
                <div className="border-t-2 border-dashed border-slate-200 pt-4 mb-8 flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-500 uppercase">Preço de Venda</span>
                    <span className="text-3xl font-black text-emerald-600">R$ {formatarMoeda(produto.precoVenda)}</span>
                </div>

                <button
                    onClick={onVoltar}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-transform"
                >
                    <ScanBarcode size={20} /> Escanear Outra Peça
                </button>
            </div>
        </div>
    );
};

// ==========================================
// 📱 4. TELA PRINCIPAL DE INVENTÁRIO (O PAI DE TODOS)
// ==========================================
export const InventarioPWA = ({ setPaginaAtiva }) => {
    const [produto, setProduto] = useState(null);

    const buscarProduto = async (codigoEan) => {
        try {
            // Toca o BIP (Nativo do Navegador) - O arquivo bip.mp3 deve estar na pasta /public
            const bip = new Audio('/bip.mp3');
            bip.play().catch(e => console.log("Áudio automático bloqueado até interação do usuário."));

            const res = await api.get(`/api/produtos/mobile/scan/${codigoEan}`);
            setProduto(res.data);

            // Vibra curto para sucesso
            if (navigator.vibrate) navigator.vibrate(100);

        } catch (err) {
            // Vibra longo para erro
            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
            toast.error("Peça não encontrada no estoque da GrandPort", { duration: 4000 });
        }
    };

    const recarregarProduto = async () => {
        if (produto && produto.codigoBarras) {
            await buscarProduto(produto.codigoBarras);
        }
    };

    // Se achou o produto, mostra os detalhes. Se não, mostra a câmera.
    if (produto) {
        return <DetalheProduto produto={produto} onVoltar={() => setProduto(null)} onReload={recarregarProduto} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-4 animate-fade-in">

            {/* 🚀 BOTÃO DE VOLTAR AO MENU PRINCIPAL DO ERP */}
            {setPaginaAtiva && (
                <div className="px-4 mb-2">
                    <button
                        // Mude o 'dashboard' abaixo para o nome da tela principal do seu ERP
                        onClick={() => setPaginaAtiva('dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 w-fit transition-all active:scale-95 hover:border-slate-300"
                    >
                        <ArrowLeft size={18} /> Voltar ao Menu
                    </button>
                </div>
            )}

            <div className="text-center px-4 mb-6 mt-2">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inventário Rápido</h1>
                <p className="text-sm text-slate-500 mt-1">Modo Coletor de Dados PWA</p>
            </div>

            <div className="flex-1 flex flex-col justify-center pb-20">
                <ScannerWeb onScan={buscarProduto} />
            </div>
        </div>
    );
};

export default InventarioPWA;
