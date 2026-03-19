import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Search, FileText, Printer, CheckCircle, Package, User,
    Trash2, ArrowRight, Save, FolderOpen, Car, X, RefreshCw,
    AlertTriangle, MessageCircle, XCircle, Smartphone, Loader2, ArrowLeft, Receipt, FileDown,
    Image as ImageIcon, Ban, Info, Calendar, Plus,
    Gauge
} from 'lucide-react';

import toast from 'react-hot-toast';

import { ModalAgendarRevisao } from '../cadastro/ModalAgendarRevisao';
import { ModalCadastroVeiculoRapido } from '../cadastro/ModalCadastroVeiculoRapido';

export const OrcamentoPedido = ({ orcamentoParaEditar, onVoltar, onIrParaNota }) => {
    const [modo, setModo] = useState('ORCAMENTO');
    const [itens, setItens] = useState([]);
    const [orcamentoId, setOrcamentoId] = useState(null);

    const [notaFiscalInfo, setNotaFiscalInfo] = useState(null);

    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [indexFocadoCliente, setIndexFocadoCliente] = useState(-1);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');
    const [kmVeiculo, setKmVeiculo] = useState('');

    const [empresaConfig, setEmpresaConfig] = useState({
        nomeFantasia: '', razaoSocial: '', enderecoString: '', cnpj: '', telefone: '', mensagemRodape: ''
    });

    const [buscaPeca, setBuscaPeca] = useState('');
    const [resultadosPecas, setResultadosPecas] = useState([]);
    const [indexFocadoPeca, setIndexFocadoPeca] = useState(-1);

    const [previewImagemPeca, setPreviewImagemPeca] = useState(null);

    const [modalAplicacao, setModalAplicacao] = useState({ aberto: false, texto: '', nome: '' });
    const [filtroModal, setFiltroModal] = useState('');

    const [modalCrmAberto, setModalCrmAberto] = useState(false);
    const [modalVeiculoAberto, setModalVeiculoAberto] = useState(false);

    const inputPecaRef = useRef(null);
    const inputClienteRef = useRef(null);
    const inputDescontoRef = useRef(null);

    const fecharModalConsulta = () => {
        setModalAplicacao({ aberto: false, texto: '', nome: '' });
        setFiltroModal('');
        setTimeout(() => {
            if (inputPecaRef.current) {
                inputPecaRef.current.focus();
            }
        }, 50);
    };

    const todasAsLinhasApp = modalAplicacao.texto
        ? modalAplicacao.texto.split(/[;|\n,\/]/).map(i => i.trim()).filter(i => i.length > 1)
        : [];

    const linhasFiltradasApp = todasAsLinhasApp.filter(l => l.toLowerCase().includes(filtroModal.toLowerCase()));

    const [descontoTipo, setDescontoTipo] = useState('VALOR');
    const [descontoInput, setDescontoInput] = useState('');
    const [modalListaAberto, setModalListaAberto] = useState(false);
    const [orcamentosSalvos, setOrcamentosSalvos] = useState([]);

    const [indexFocadoLista, setIndexFocadoLista] = useState(-1);

    const [modalVendaPerdidaAberto, setModalVendaPerdidaAberto] = useState(false);
    const [motivoVendaPerdida, setMotivoVendaPerdida] = useState('');
    const [observacaoVendaPerdida, setObservacaoVendaPerdida] = useState('');

    const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);
    const [justificativaCancelamento, setJustificativaCancelamento] = useState('');
    const [cancelandoNfe, setCancelandoNfe] = useState(false);

    const [statusZap, setStatusZap] = useState(null);
    const [checandoZap, setChecandoZap] = useState(false);

    const extrairErroBackend = (error, mensagemPadrao) => {
        if (error?.response?.status === 403) return "Acesso Negado: Rota bloqueada pelo servidor (Erro 403).";
        if (error?.response?.status === 401) return "Sessão expirada. Por favor, recarregue a página e faça login novamente.";

        if (error?.response?.data) {
            if (typeof error.response.data === 'string') return error.response.data;
            if (error.response.data.message) return error.response.data.message;
            if (error.response.data.error) return error.response.data.error;
        }
        return error?.message || mensagemPadrao;
    };

    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null || isNaN(Number(valor))) return '0,00';
        return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleMudancaMoeda = (valorDigitado, callback) => {
        const apenasDigitos = valorDigitado.replace(/\D/g, '');
        const valorRealFloat = Number(apenasDigitos) / 100;
        callback(valorRealFloat);
    };

    const subtotal = itens.reduce((acc, item) => acc + ((item.preco || 0) * (item.qtd || 0)), 0);

    let valorDescontoReal = 0;
    const descInputVal = parseFloat(descontoInput) || 0;

    if (descontoTipo === 'VALOR') {
        valorDescontoReal = descInputVal;
    } else {
        valorDescontoReal = subtotal * (descInputVal / 100);
    }

    valorDescontoReal = Math.min(valorDescontoReal, subtotal);
    const totalFinal = Math.max(0, subtotal - valorDescontoReal);

    const veiculoDetalhado = clienteSelecionado?.veiculos?.find(v => String(v.id) === String(veiculoSelecionado));

    const limparCliente = () => {
        setClienteSelecionado(null);
        setBuscaCliente('');
        setVeiculoSelecionado('');
        setKmVeiculo('');
        setIndexFocadoCliente(-1);
    };

    const getNcmString = (ncmInfo) => {
        if (!ncmInfo) return '';
        if (typeof ncmInfo === 'string') return ncmInfo;
        return ncmInfo.codigo || ncmInfo.Codigo || '';
    };

    const extrairItensBackend = (itensBack, statusDoc) => {
        const isBaixadoNoBanco = statusDoc === 'PEDIDO' || statusDoc === 'AGUARDANDO_PAGAMENTO';

        return (itensBack || []).map(i => {
            const estoqueFisico = i.produto?.quantidadeEstoque ?? i.estoqueDisponivel ?? 0;
            const qtd = i.quantidade || i.qtd || 1;

            return {
                id: i.produto?.id || i.produtoId || i.id,
                produtoId: i.produto?.id || i.produtoId || i.id,
                codigo: i.produto?.sku || i.codigo || '---',
                nome: i.produto?.nome || i.nome,
                qtd: qtd,
                preco: i.precoUnitario || i.preco || 0,
                estoqueFisicoReal: estoqueFisico,
                qtdBaixada: isBaixadoNoBanco ? qtd : 0,
                ncm: getNcmString(i.produto?.ncm) || getNcmString(i.ncm),
                origem: i.produto?.origemMercadoria || 0,
                cest: i.produto?.cest || '',
                fotoUrl: i.produto?.fotoUrl || i.fotoUrl || '',
                fotoLocalPath: i.produto?.fotoLocalPath || i.fotoLocalPath || ''
            };
        });
    };

    const sincronizarEstoqueSilencioso = async (listaItensAtual) => {
        if(listaItensAtual.length === 0) return;
        try {
            const res = await api.get('/api/produtos');
            const todosProdutos = res.data;
            setItens(itensAntigos => itensAntigos.map(item => {
                const prod = todosProdutos.find(p => p.id === item.produtoId);
                return prod ? { ...item, estoqueFisicoReal: prod.quantidadeEstoque } : item;
            }));
        } catch(e) { console.error(e); }
    };

    const forcarSincronizacaoEstoque = async () => {
        if(itens.length === 0) return toast.success("A tela já está atualizada.");
        const loadId = toast.loading("Buscando dados fresquinhos do estoque...");
        try {
            await sincronizarEstoqueSilencioso(itens);
            toast.success("Estoque sincronizado com sucesso!", { id: loadId });
        } catch (e) {
            toast.error(extrairErroBackend(e, "Falha ao sincronizar o estoque."), { id: loadId });
        }
    };

    useEffect(() => {
        if (orcamentoParaEditar) {
            setOrcamentoId(orcamentoParaEditar.id);
            setModo(orcamentoParaEditar.status || 'ORCAMENTO');

            if (orcamentoParaEditar.desconto > 0) {
                setDescontoTipo('VALOR');
                setDescontoInput(orcamentoParaEditar.desconto.toString());
            }

            if (orcamentoParaEditar.notaFiscal) {
                setNotaFiscalInfo(orcamentoParaEditar.notaFiscal);
            } else {
                setNotaFiscalInfo(null);
            }

            if (orcamentoParaEditar.kmVeiculo) {
                setKmVeiculo(orcamentoParaEditar.kmVeiculo.toString());
            }

            const itensMapeados = extrairItensBackend(orcamentoParaEditar.itens, orcamentoParaEditar.status);
            setItens(itensMapeados);

            sincronizarEstoqueSilencioso(itensMapeados).catch(console.error);

            const restaurarDadosCliente = async () => {
                const termoBusca = orcamentoParaEditar.cliente?.nome || orcamentoParaEditar.cliente;
                if (termoBusca && termoBusca !== 'Consumidor Final') {
                    try {
                        const res = await api.get(`/api/parceiros?busca=${termoBusca}`);
                        const clienteFull = res.data.find(c => c.nome === termoBusca);
                        if (clienteFull) {
                            setClienteSelecionado(clienteFull);
                            setBuscaCliente(clienteFull.nome);
                            const resV = await api.get(`/api/veiculos/cliente/${clienteFull.id}`);
                            setClienteSelecionado(prev => ({ ...prev, veiculos: resV.data || [] }));
                            if (orcamentoParaEditar.veiculo?.id) {
                                setVeiculoSelecionado(orcamentoParaEditar.veiculo.id.toString());
                            }
                        }
                    } catch (e) { console.error(e); }
                }
            };

            restaurarDadosCliente().catch(console.error);
        }
    }, [orcamentoParaEditar]);

    useEffect(() => {
        api.get('/api/configuracoes').then(res => {
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setEmpresaConfig({
                    nomeFantasia: data?.nomeFantasia || 'GRANDPORT ERP',
                    razaoSocial: data?.razaoSocial || '',
                    enderecoString: data?.endereco || '',
                    cnpj: data?.cnpj || '',
                    telefone: data?.telefone || '',
                    mensagemRodape: data?.mensagemRodape || 'Orçamento válido por 5 dias.'
                });
            }
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaCliente.length > 2 && !clienteSelecionado) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    setResultadosClientes(res.data.filter(p => p.tipo === 'CLIENTE' || p.tipo === 'AMBOS'));
                    setIndexFocadoCliente(0);
                } catch (e) { setResultadosClientes([]); }
            } else { setResultadosClientes([]); setIndexFocadoCliente(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaCliente, clienteSelecionado]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaPeca.trim().length > 1) {
                try {
                    const termosBusca = buscaPeca.toLowerCase().split(' ').filter(t => t.trim() !== '');
                    const termoPrincipal = encodeURIComponent(termosBusca[0]);
                    const res = await api.get(`/api/produtos?busca=${termoPrincipal}`);

                    const resultadosInteligentes = res.data.filter(peca => {
                        const textoDaPeca = `${peca.nome || ''} ${peca.sku || ''} ${peca.codigoBarras || ''} ${peca.referenciaOriginal || ''} ${peca.aplicacao || ''}`.toLowerCase();
                        return termosBusca.every(termo => textoDaPeca.includes(termo));
                    });

                    setResultadosPecas(resultadosInteligentes);
                    setIndexFocadoPeca(resultadosInteligentes.length > 0 ? 0 : -1);
                } catch (e) {
                    setResultadosPecas([]);
                    setIndexFocadoPeca(-1);
                }
            } else {
                setResultadosPecas([]);
                setIndexFocadoPeca(-1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaPeca]);

    const selecionarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setBuscaCliente(cliente.nome);
        setResultadosClientes([]);
        setIndexFocadoCliente(-1);
        api.get(`/api/veiculos/cliente/${cliente.id}`).then(res => {
            setClienteSelecionado(prev => ({ ...prev, veiculos: res.data || [] }));
            if(res.data?.length === 1) {
                setVeiculoSelecionado(res.data[0].id.toString());
                if (res.data[0].km) {
                    setKmVeiculo(res.data[0].km.toString());
                }
            }
        });
    };

    const handleKeyDownCliente = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndexFocadoCliente(p => Math.min(resultadosClientes.length - 1, p + 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndexFocadoCliente(p => Math.max(0, p - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (indexFocadoCliente >= 0 && resultadosClientes[indexFocadoCliente]) {
                selecionarCliente(resultadosClientes[indexFocadoCliente]);
                inputPecaRef.current?.focus();
            }
        } else if (e.key === 'Escape') {
            setResultadosClientes([]);
            setIndexFocadoCliente(-1);
        }
    };

    const handleQtdKeyDown = (e, index) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = document.querySelector(`input[data-row-index="${index + 1}"]`);
            if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = document.querySelector(`input[data-row-index="${index - 1}"]`);
            if (prev) prev.focus();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            inputDescontoRef.current?.focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            inputPecaRef.current?.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            inputPecaRef.current?.focus();
        }
    };

    const adicionarItem = (peca) => {
        const existe = itens.find(i => i.id === peca.id || i.produtoId === peca.id);
        if (existe) {
            setItens(itens.map(i => (i.id === peca.id || i.produtoId === peca.id) ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItens([...itens, {
                produtoId: peca.id,
                id: peca.id,
                codigo: peca.sku,
                nome: peca.nome,
                qtd: 1,
                preco: peca.precoVenda || 0,
                estoqueFisicoReal: peca.quantidadeEstoque || 0,
                qtdBaixada: 0,
                ncm: getNcmString(peca.ncm),
                origem: peca.origemMercadoria || 0,
                cest: peca.cest || '',
                fotoUrl: peca.fotoUrl || '',
                fotoLocalPath: peca.fotoLocalPath || ''
            }]);
        }
        toast.success("Item adicionado");
        setBuscaPeca(''); setResultadosPecas([]); inputPecaRef.current?.focus();
    };

    const emitirNFe = () => {
        if (!orcamentoId) return toast.error("Salve o pedido primeiro antes de faturar!");
        if (!clienteSelecionado) return toast.error("Para emitir NF-e, é obrigatório selecionar um cliente!");
        if (!clienteSelecionado.documento) return toast.error(`O cliente ${clienteSelecionado.nome} não possui CPF/CNPJ cadastrado!`);

        const produtosSemNcm = itens.filter(i => !i.ncm);
        if (produtosSemNcm.length > 0) {
            return toast.error(`⚠️ O produto "${produtosSemNcm[0].nome}" está sem NCM. A SEFAZ rejeitará a nota.`);
        }

        const dadosParaFaturar = {
            vendaId: orcamentoId,
            cliente: clienteSelecionado,
            veiculo: veiculoDetalhado,
            itens: itens,
            subtotal: subtotal,
            desconto: valorDescontoReal,
            totalFinal: totalFinal
        };

        if (onIrParaNota) {
            onIrParaNota(dadosParaFaturar);
        } else {
            toast.error("Erro na integração da tela fiscal.");
        }
    };

    const cancelarNFe = async () => {
        if (justificativaCancelamento.length < 15) {
            return toast.error("A justificativa deve ter no mínimo 15 caracteres (Regra da SEFAZ).");
        }

        setCancelandoNfe(true);
        const loadId = toast.loading("Transmitindo evento de cancelamento para a SEFAZ...");

        try {
            await api.post(`/api/vendas/${orcamentoId}/cancelar-nfe`, { justificativa: justificativaCancelamento });
            toast.success("NF-e Cancelada com sucesso e inutilizada na SEFAZ!", { id: loadId, duration: 5000 });

            setNotaFiscalInfo(null);
            setModalCancelamentoAberto(false);
            setJustificativaCancelamento('');

        } catch (e) {
            toast.error(extrairErroBackend(e, "Rejeição da SEFAZ ao tentar cancelar a NF-e."), { id: loadId, duration: 6000 });
        } finally {
            setCancelandoNfe(false);
        }
    };

    const abrirPDFDanfe = () => {
        if (notaFiscalInfo && notaFiscalInfo.urlDanfe) {
            window.open(notaFiscalInfo.urlDanfe, '_blank');
        } else {
            toast.error("O PDF da nota ainda não está disponível.");
        }
    };

    const verificarConexaoZap = async () => {
        setChecandoZap(true);
        try {
            const res = await api.get('/api/vendas/whatsapp/status');
            const estado = res.data?.instance?.state || res.data?.state;
            setStatusZap(estado);
            if (estado === 'open') {
                toast.success("Conexão WhatsApp Ativa!");
            } else {
                toast.error("WhatsApp Desconectado.");
            }
        } catch (error) {
            setStatusZap('error');
            toast.error(extrairErroBackend(error, "Falha ao validar motor WhatsApp."));
        } finally {
            setChecandoZap(false);
        }
    };

    const acionarWhatsApp = async () => {
        if (!orcamentoId) return toast.error("Salve o rascunho ou pedido antes de enviar pelo WhatsApp!");
        if (!clienteSelecionado?.telefone) return toast.error("O cliente não possui um número de telefone cadastrado.");

        const loadId = toast.loading("Gerando PDF e disparando via WhatsApp...");
        try {
            const response = await api.post(`/api/vendas/${orcamentoId}/enviar-whatsapp`);
            toast.success(response.data?.message || "Documento enviado com sucesso!", { id: loadId });
        } catch (e) {
            toast.error(extrairErroBackend(e, "Falha ao enviar via WhatsApp."), { id: loadId, duration: 5000 });
        }
    };

    const processarVendaAPI = async (statusDesejado) => {
        if (itens.length === 0) return toast.error("O documento não possui itens.");

        const statusFinal = statusDesejado;
        const loadId = toast.loading(statusFinal === 'PEDIDO' ? "Salvando pedido..." : "Processando...");

        const payload = {
            id: orcamentoId,
            status: statusFinal,
            itens: itens.map(i => ({ produtoId: i.produtoId || i.id, quantidade: i.qtd, precoUnitario: i.preco })),
            desconto: valorDescontoReal,
            parceiroId: clienteSelecionado?.id || null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null,
            kmVeiculo: kmVeiculo ? parseInt(kmVeiculo) : null
        };

        try {
            let res;
            if (orcamentoId) {
                res = await api.put(`/api/vendas/${orcamentoId}`, payload);
            } else {
                res = await api.post(statusFinal === 'PEDIDO' ? '/api/vendas/pedido' : '/api/vendas/orcamento', payload);
                setOrcamentoId(res.data.id);
            }

            toast.success(statusFinal === 'PEDIDO' ? "Convertido em Pedido!" : "Operação concluída!", { id: loadId });

            if (res.data && res.data.itens) {
                setItens(extrairItensBackend(res.data.itens, res.data.status));
            }

            setModo(statusFinal);

            if (statusFinal === 'AGUARDANDO_PAGAMENTO') {
                limparEcra();
                if (onVoltar) onVoltar();
            }
        } catch (e) {
            const erroReal = extrairErroBackend(e, "Falha ao processar venda no servidor.");
            toast.error(erroReal, { id: loadId, duration: 6000, style: { fontWeight: 'bold' } });
        }
    };

    const registrarVendaPerdida = async () => {
        if (itens.length === 0 && !buscaPeca) return toast.error("Adicione itens ou busque uma peça para registrar a perda.");
        if (!motivoVendaPerdida) return toast.error("Selecione o motivo da perda.");

        const loadId = toast.loading("Registrando venda perdida...");
        const payload = {
            parceiroId: clienteSelecionado?.id || null,
            veiculoId: veiculoSelecionado ? parseInt(veiculoSelecionado) : null,
            motivo: motivoVendaPerdida,
            observacoes: observacaoVendaPerdida,
            valorTotal: totalFinal,
            termoBuscado: itens.length === 0 ? buscaPeca : null,
            itens: itens.map(i => ({ produtoId: i.produtoId || i.id, quantidade: i.qtd, precoUnitario: i.preco }))
        };

        try {
            await api.post('/api/vendas-perdidas', payload);
            toast.success("Venda perdida registrada para análise!", { id: loadId });
            setModalVendaPerdidaAberto(false);
            setMotivoVendaPerdida('');
            setObservacaoVendaPerdida('');
            limparEcra();
        } catch (e) {
            toast.error(extrairErroBackend(e, "Erro ao registrar venda perdida."), { id: loadId });
        }
    };

    const limparEcra = () => {
        setItens([]);
        limparCliente();
        setModo('ORCAMENTO');
        setOrcamentoId(null);
        setDescontoInput('');
        setNotaFiscalInfo(null);
        inputClienteRef.current?.focus();
    };

    const carregarOrcamentoLocal = (orcamento) => {
        setOrcamentoId(orcamento.id);
        setModo(orcamento.status);
        if (orcamento.desconto > 0) {
            setDescontoTipo('VALOR');
            setDescontoInput(orcamento.desconto.toString());
        } else {
            setDescontoInput('');
        }

        if (orcamento.notaFiscal) {
            setNotaFiscalInfo(orcamento.notaFiscal);
        } else {
            setNotaFiscalInfo(null);
        }

        if (orcamento.clienteObj) selecionarCliente(orcamento.clienteObj);
        else limparCliente();

        const itensFormatados = extrairItensBackend(orcamento.itensRaw, orcamento.status);
        setItens(itensFormatados);
        setModalListaAberto(false);

        toast.success(`Documento #${orcamento.id} reaberto.`);
        sincronizarEstoqueSilencioso(itensFormatados).catch(console.error);
    };

    // 🚀 AQUI É O NOVO MOTOR DE IMPRESSÃO VIA JAVA!
    const imprimirDocumento = async () => {
        if (!orcamentoId) return toast.error("Salve o documento (F8) antes de imprimir!");

        const toastId = toast.loading('Buscando PDF no servidor...');
        try {
            const response = await api.get(`/api/vendas/${orcamentoId}/imprimir-pdf`, { responseType: 'blob' });
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
            toast.success("Documento gerado com sucesso!", { id: toastId });
        } catch (error) {
            toast.error("Erro ao gerar o PDF. Verifique a conexão com o servidor.", { id: toastId });
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (modalCrmAberto) {
                if (e.key === 'Escape') setModalCrmAberto(false);
                return;
            }
            if (modalAplicacao.aberto) {
                if (e.key === 'Escape') fecharModalConsulta();
                return;
            }
            if (modalListaAberto) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setIndexFocadoLista(p => Math.min(orcamentosSalvos.length - 1, p + 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexFocadoLista(p => Math.max(0, p - 1)); }
                else if (e.key === 'Enter') { e.preventDefault(); if (indexFocadoLista >= 0 && orcamentosSalvos[indexFocadoLista]) carregarOrcamentoLocal(orcamentosSalvos[indexFocadoLista]); }
                else if (e.key === 'Escape') setModalListaAberto(false);
                return;
            }
            if (modalVendaPerdidaAberto) {
                if (e.key === 'Escape') setModalVendaPerdidaAberto(false);
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') registrarVendaPerdida();
                return;
            }
            if (modalCancelamentoAberto) {
                if (e.key === 'Escape') setModalCancelamentoAberto(false);
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') cancelarNFe();
                return;
            }

            if (e.altKey && (e.key === 'a' || e.key === 'A')) {
                if (!modalAplicacao.aberto && resultadosPecas.length > 0 && indexFocadoPeca >= 0) {
                    e.preventDefault();
                    const pecaFocada = resultadosPecas[indexFocadoPeca];
                    setModalAplicacao({ aberto: true, texto: pecaFocada.aplicacao, nome: pecaFocada.nome });
                }
            }

            switch (e.key) {
                case 'F2': e.preventDefault(); inputClienteRef.current?.focus(); break;
                case 'F3': e.preventDefault(); inputPecaRef.current?.focus(); break;
                case 'F4': e.preventDefault(); inputDescontoRef.current?.focus(); break;
                case 'F5': e.preventDefault(); forcarSincronizacaoEstoque(); break;
                case 'F6': e.preventDefault(); setModalListaAberto(true); setIndexFocadoLista(0); break;
                case 'F7': e.preventDefault(); setModalVendaPerdidaAberto(true); break;
                case 'F8': e.preventDefault(); processarVendaAPI(modo); break;
                case 'F9':
                    e.preventDefault();
                    if (!notaFiscalInfo) {
                        if (e.ctrlKey || e.metaKey) processarVendaAPI('AGUARDANDO_PAGAMENTO');
                        else processarVendaAPI('PEDIDO');
                    }
                    break;
                case 'F10': e.preventDefault(); if (orcamentoId && !notaFiscalInfo) emitirNFe(); break;
                case 'F11': e.preventDefault(); acionarWhatsApp(); break;
                case 'F12': e.preventDefault(); setModalCrmAberto(true); break;
                case 'p':
                case 'P':
                    if (e.ctrlKey || e.metaKey) { e.preventDefault(); imprimirDocumento(); } // 🚀 ATALHO ATUALIZADO
                    break;
                case 'Escape':
                    if (resultadosClientes.length > 0) { setResultadosClientes([]); setIndexFocadoCliente(-1); }
                    if (resultadosPecas.length > 0) { setResultadosPecas([]); setIndexFocadoPeca(-1); }
                    else if (onVoltar && !notaFiscalInfo) onVoltar();
                    break;
                default: break;
            }

            if (e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); limparEcra(); }
            if (e.altKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); document.getElementById('select-veiculo')?.focus(); }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [modalListaAberto, modalVendaPerdidaAberto, modalCancelamentoAberto, modo, orcamentoId, notaFiscalInfo, itens, clienteSelecionado, veiculoDetalhado, subtotal, valorDescontoReal, totalFinal, orcamentosSalvos, indexFocadoLista, resultadosClientes, resultadosPecas, justificativaCancelamento, cancelandoNfe, modalAplicacao.aberto, modalCrmAberto]);

    return (
        <div className="flex flex-col h-full bg-white relative z-[15]">
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-in relative">

                <ModalAgendarRevisao
                    isOpen={modalCrmAberto}
                    onClose={() => setModalCrmAberto(false)}
                    clientePreSelecionado={clienteSelecionado ? {
                        id: clienteSelecionado.id,
                        nome: clienteSelecionado.nome,
                        telefone: clienteSelecionado.telefone,
                        veiculoId: veiculoDetalhado?.id,
                        veiculo: veiculoDetalhado ? `${veiculoDetalhado.marca} ${veiculoDetalhado.modelo}` : '',
                        placa: veiculoDetalhado?.placa || ''
                    } : null}
                />

                {modalAplicacao.aberto && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 text-left">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
                            <div className="bg-blue-600 p-6 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="font-black text-lg flex items-center gap-2"><Car size={20}/> Consultar Veículos</h3>
                                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">{modalAplicacao.nome}</p>
                                </div>
                                <button onClick={fecharModalConsulta} className="bg-blue-500 hover:bg-red-500 p-2 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-slate-100 border-b shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Pesquisar modelo, ano ou motor..."
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={filtroModal}
                                        onChange={(e) => setFiltroModal(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto bg-slate-50 custom-scrollbar flex-1">
                                {linhasFiltradasApp.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {linhasFiltradasApp.map((linha, idx) => (
                                            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm flex items-center gap-3 shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all group animate-fade-in">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                    <Car size={16} />
                                                </div>
                                                {linha}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-slate-400">
                                        <Ban className="mx-auto mb-4 opacity-20" size={60} />
                                        <p className="font-black text-lg">Nada encontrado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white border-t flex justify-between items-center px-8 shrink-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase">
                                    {linhasFiltradasApp.length} encontrados
                                </span>
                                <button onClick={fecharModalConsulta} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-xs tracking-widest uppercase">
                                    FECHAR (ESC)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {onVoltar && (
                    <div className="mb-4">
                        <button
                            onClick={onVoltar}
                            title="Voltar para a listagem principal (Esc)"
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Voltar para Lista
                        </button>
                    </div>
                )}

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 z-40">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl text-white shadow-inner ${modo === 'PEDIDO' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                <FileText size={24}/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none flex items-center gap-3">
                                    {modo} #{orcamentoId || 'NOVO'}
                                    {notaFiscalInfo && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md tracking-widest uppercase border border-green-200"><Receipt size={10} className="inline mr-1 -mt-0.5"/> NFE GERADA</span>}
                                </h1>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Preenchimento de balcão</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => setModalListaAberto(true)} title="Abrir lista de orçamentos salvos e pendentes (F6)" className="px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200"><FolderOpen size={14} /> SALVOS (F6)</button>
                            <button onClick={limparEcra} title="Limpar todos os campos (Alt+L)" className="px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200"><Trash2 size={14} /> LIMPAR (Alt+L)</button>
                            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

                            <button onClick={() => setModalCrmAberto(true)} title="Agendar próxima revisão do cliente (F12)" className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-black flex items-center gap-2 transition-all shadow-sm border border-indigo-200 hover:border-indigo-600">
                                <Calendar size={14} /> CRM (F12)
                            </button>

                            {orcamentoId && !notaFiscalInfo && (
                                <button onClick={emitirNFe} title="Ajustar e Emitir NF-e (F10)" className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-black flex items-center gap-2 transition-all shadow-sm border border-purple-200 hover:border-purple-600">
                                    <Receipt size={16} /> EMITIR NF-E (F10)
                                </button>
                            )}

                            {orcamentoId && notaFiscalInfo && (
                                <div className="flex items-center rounded-lg border border-green-500 bg-green-50 overflow-hidden shadow-sm shadow-green-500/20">
                                    <button onClick={abrirPDFDanfe} title="Abrir espelho (DANFE) da Nota para impressão" className="px-4 py-2 text-green-700 hover:bg-green-600 hover:text-white font-black text-xs transition-colors flex items-center gap-2">
                                        <Printer size={16}/> IMPRIMIR DANFE
                                    </button>
                                    <button onClick={abrirPDFDanfe} title="Baixar XML Original" className="px-3 py-2 border-l border-green-200 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
                                        <FileDown size={16}/>
                                    </button>
                                    <button onClick={() => setModalCancelamentoAberto(true)} title="Cancelar NF-e na SEFAZ" className="px-3 py-2 border-l border-red-200 bg-white text-red-600 hover:bg-red-600 hover:text-white font-black text-xs transition-colors flex items-center gap-1">
                                        <Trash2 size={14}/> CANCELAR
                                    </button>
                                </div>
                            )}

                            {orcamentoId && <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>}

                            <button onClick={forcarSincronizacaoEstoque} title="Consultar o estoque real atualizado dos itens (F5)" className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><RefreshCw size={14} /> ATUALIZAR ESTOQUE (F5)</button>

                            <button onClick={() => setModalVendaPerdidaAberto(true)} title="Registrar motivo pelo qual o cliente não fechou a venda (F7)" className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><XCircle size={14} /> PERDA (F7)</button>
                            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

                            <button onClick={() => processarVendaAPI(modo)} title="Salvar progresso atual (F8)" className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><Save size={14}/> SALVAR (F8)</button>

                            {/* 🚀 NOVO BOTÃO DE IMPRESSÃO QUE CHAMA O BACKEND */}
                            <button onClick={imprimirDocumento} title="Gerar impressão PDF do documento atual (Ctrl+P)" className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><Printer size={14}/> IMPRIMIR (Ctrl+P)</button>

                            <div className="flex items-center rounded-lg border border-green-200 bg-green-50 overflow-hidden ml-1">
                                <button type="button" onClick={verificarConexaoZap} disabled={checandoZap} className="p-2 border-r border-green-200 text-green-600 hover:bg-green-100 transition-colors" title="Verificar se o motor do WhatsApp está conectado">
                                    {checandoZap ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} className={statusZap === 'open' ? 'animate-pulse' : ''} />}
                                </button>
                                <button onClick={acionarWhatsApp} title="Enviar PDF deste documento para o WhatsApp do cliente (F11)" className="px-3 py-2 text-green-700 hover:bg-green-100 text-xs font-black flex items-center gap-2 transition-colors">
                                    <MessageCircle size={14}/> WHATSAPP (F11)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                ref={inputClienteRef}
                                type="text"
                                placeholder="Pesquisar Cliente (F2)..."
                                value={buscaCliente}
                                onChange={(e) => { setBuscaCliente(e.target.value); setIndexFocadoCliente(-1); }}
                                onKeyDown={handleKeyDownCliente}
                                disabled={!!clienteSelecionado || notaFiscalInfo}
                                className="w-full pl-10 pr-10 py-3 border-2 rounded-xl font-bold focus:border-blue-500 bg-slate-50 outline-none transition-all disabled:opacity-50"
                            />
                            {clienteSelecionado && !notaFiscalInfo && <button onClick={limparCliente} title="Remover cliente selecionado" className="absolute right-3 top-3 text-red-400"><X size={20}/></button>}
                            {resultadosClientes.length > 0 && !clienteSelecionado && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    {resultadosClientes.map((c, idx) => (
                                        <div
                                            key={c.id}
                                            onClick={() => selecionarCliente(c)}
                                            className={`p-4 cursor-pointer border-b font-bold transition-colors ${idx === indexFocadoCliente ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-700'}`}
                                        >
                                            {c.nome} {c.documento && <span className={`text-xs ml-2 ${idx === indexFocadoCliente ? 'text-blue-200' : 'text-slate-400'}`}>({c.documento})</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Car className="absolute left-3 top-3 text-slate-400" size={20} />
                                <select
                                    id="select-veiculo"
                                    value={veiculoSelecionado}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setVeiculoSelecionado(val);
                                        if (val && clienteSelecionado?.veiculos) {
                                            const veic = clienteSelecionado.veiculos.find(v => String(v.id) === String(val));
                                            if (veic && veic.km) {
                                                setKmVeiculo(veic.km.toString());
                                                toast.success(`Último KM (${veic.km}) carregado!`, { icon: '⏱️', id: 'toast-km' });
                                            } else {
                                                setKmVeiculo('');
                                            }
                                        } else {
                                            setKmVeiculo('');
                                        }
                                    }}
                                    disabled={!clienteSelecionado || notaFiscalInfo}
                                    className="w-full pl-10 pr-4 py-3 border-2 rounded-xl font-bold bg-slate-50 outline-none appearance-none focus:border-blue-500 transition-all disabled:opacity-50"
                                >
                                    <option value="">Selecione o Veículo...</option>
                                    {clienteSelecionado?.veiculos?.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
                                </select>
                            </div>

                            <div className="relative w-32">
                                <Gauge className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    placeholder="KM..."
                                    value={kmVeiculo}
                                    onChange={(e) => setKmVeiculo(e.target.value)}
                                    disabled={notaFiscalInfo}
                                    className="w-full pl-10 pr-2 py-3 border-2 rounded-xl font-bold bg-white focus:border-blue-600 outline-none transition-all disabled:bg-slate-50"
                                />
                            </div>

                            {clienteSelecionado && !notaFiscalInfo && (
                                <button
                                    onClick={() => setModalVeiculoAberto(true)}
                                    title="Cadastrar novo veículo para este cliente"
                                    className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <Plus size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col z-[60] relative overflow-visible">

                    <div className="relative border-b border-slate-200 bg-slate-50 p-2 z-[70] rounded-t-3xl">
                        <Search className="absolute left-6 top-5 text-blue-500" size={20} />
                        <input
                            ref={inputPecaRef}
                            type="text"
                            value={buscaPeca}
                            disabled={!!notaFiscalInfo}
                            onChange={(e) => { setBuscaPeca(e.target.value); setIndexFocadoPeca(-1); }}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') { e.preventDefault(); setIndexFocadoPeca(p => Math.min(resultadosPecas.length - 1, p + 1)); }
                                else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexFocadoPeca(p => Math.max(0, p - 1)); }
                                else if (e.key === 'Enter' && indexFocadoPeca >= 0 && resultadosPecas[indexFocadoPeca]) { adicionarItem(resultadosPecas[indexFocadoPeca]); }
                                else if (e.altKey && (e.key === 'a' || e.key === 'A') && indexFocadoPeca >= 0 && resultadosPecas[indexFocadoPeca]) {
                                    e.preventDefault();
                                    setModalAplicacao({ aberto: true, texto: resultadosPecas[indexFocadoPeca].aplicacao, nome: resultadosPecas[indexFocadoPeca].nome });
                                }
                            }}
                            placeholder={notaFiscalInfo ? "Venda fiscalizada. Não é possível alterar itens." : "Pesquisar peça (F3)..."}
                            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-inner focus:border-blue-600 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />

                        {resultadosPecas.length > 0 && (
                            <div className="absolute top-[calc(100%+4px)] left-0 w-full mt-1 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] border-2 border-blue-500 z-[100] max-h-[40vh] overflow-y-auto mx-2 w-[calc(100%-16px)] custom-scrollbar">
                                {resultadosPecas.map((peca, idx) => {
                                    const temFoto = peca.fotoUrl || peca.fotoLocalPath;
                                    return (
                                        <div
                                            key={peca.id}
                                            className={`p-4 border-b flex justify-between items-center cursor-pointer transition-colors ${idx === indexFocadoPeca ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                                            onMouseEnter={() => setIndexFocadoPeca(idx)}
                                        >
                                            <div className="flex items-center gap-4 flex-1" onClick={() => adicionarItem(peca)}>
                                                <div
                                                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${idx === indexFocadoPeca ? 'bg-white/20' : 'bg-slate-100 border border-slate-200'}`}
                                                    onMouseEnter={() => { if(temFoto) setPreviewImagemPeca(temFoto); }}
                                                    onMouseLeave={() => setPreviewImagemPeca(null)}
                                                >
                                                    {temFoto ? (
                                                        <img src={temFoto} alt="Peca" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={20} className={idx === indexFocadoPeca ? 'text-white' : 'text-slate-300'} />
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-bold text-md leading-tight flex items-center gap-2">
                                                        {peca.nome}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className={`text-xs font-mono ${idx === indexFocadoPeca ? 'text-blue-200' : 'text-slate-500'}`}>{peca.sku}</p>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${idx === indexFocadoPeca ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>ESTOQUE: {peca.quantidadeEstoque ?? 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setModalAplicacao({ aberto: true, texto: peca.aplicacao, nome: peca.nome }); }}
                                                    className={`p-2 rounded-lg transition-colors border ${idx === indexFocadoPeca ? 'bg-white/20 border-white/40 text-white hover:bg-white/30' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                                    title="Ver Aplicação (Alt + A)"
                                                >
                                                    <Info size={20} />
                                                </button>
                                                <p className="font-black text-lg min-w-[100px] text-right" onClick={() => adicionarItem(peca)}>R$ {formatarMoeda(peca.precoVenda)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 z-10">
                        <table className="w-full text-left">
                            <thead className="bg-white text-[10px] font-black uppercase text-slate-400 sticky top-0 border-b border-slate-100 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-16 text-center">Foto</th>
                                <th className="p-4 w-24">SKU</th>
                                <th className="p-4">Descrição da Peça</th>
                                <th className="p-4 text-center w-24">Qtd</th>
                                <th className="p-4 text-right pr-6 w-32">Subtotal</th>
                                <th className="p-4 w-12"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itens.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold bg-slate-50/50">
                                        Nenhum item adicionado ao documento ainda.
                                    </td>
                                </tr>
                            )}
                            {itens.map((item, index) => {
                                const disponivelFinal = (item.estoqueFisicoReal || 0) + (item.qtdBaixada || 0);
                                const faltaEstoque = item.qtd > disponivelFinal;

                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${faltaEstoque ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-4 text-center">
                                            <div
                                                className="w-10 h-10 mx-auto rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                                                onMouseEnter={() => {
                                                    const img = item.fotoUrl || item.fotoLocalPath;
                                                    if(img) setPreviewImagemPeca(img);
                                                }}
                                                onMouseLeave={() => setPreviewImagemPeca(null)}
                                            >
                                                {item.fotoUrl || item.fotoLocalPath ? (
                                                    <img src={item.fotoUrl || item.fotoLocalPath} alt="Peca" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={16} className="text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500">{item.codigo}</td>
                                        <td className="p-4 font-bold text-slate-800 text-sm">
                                            <div className="flex items-center gap-2">
                                                <p>{item.nome}</p>
                                                {item.ncm ? (
                                                    <span title="Produto possui NCM e está pronto para NF-e" className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black border border-purple-200">NCM: {item.ncm}</span>
                                                ) : (
                                                    <span title="⚠️ Sem NCM! A NF-e será rejeitada." className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black border border-red-200 flex items-center gap-1"><AlertTriangle size={8}/> SEM NCM</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Disponível no sistema: {disponivelFinal}</p>
                                            {faltaEstoque && <span className="text-[10px] font-black text-red-600 flex items-center gap-1 uppercase tracking-tighter mt-1"><AlertTriangle size={10}/> Faltam {item.qtd - disponivelFinal}</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                disabled={!!notaFiscalInfo}
                                                data-row-index={index}
                                                onKeyDown={(e) => handleQtdKeyDown(e, index)}
                                                title="Setas para cima/baixo/esq/dir para navegar"
                                                value={item.qtd}
                                                onChange={(e) => setItens(itens.map(i => i.id === item.id ? { ...i, qtd: Math.max(1, parseInt(e.target.value) || 1) } : i))}
                                                className={`w-16 p-2 text-center font-black bg-white border-2 rounded-lg outline-none disabled:bg-transparent disabled:border-transparent ${faltaEstoque ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 focus:border-blue-500'}`}
                                            />
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-800 pr-6">R$ {formatarMoeda(item.preco * item.qtd)}</td>
                                        <td className="p-4 text-center">
                                            {!notaFiscalInfo && (
                                                <button onClick={() => setItens(itens.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 p-2 transition-colors" title="Remover Peça"><Trash2 size={18} /></button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {itens.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end items-end md:items-center gap-6 z-10">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal dos Itens</p>
                                <p className="font-black text-xl text-slate-700">R$ {formatarMoeda(subtotal)}</p>
                            </div>

                            <div className="flex flex-col items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aplicar Desconto</p>
                                <div className={`flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 shadow-sm transition-colors ${notaFiscalInfo ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus-within:border-blue-400'}`}>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                            disabled={!!notaFiscalInfo}
                                            onClick={() => setDescontoTipo('VALOR')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${descontoTipo === 'VALOR' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >R$</button>
                                        <button
                                            disabled={!!notaFiscalInfo}
                                            onClick={() => setDescontoTipo('PERCENTUAL')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${descontoTipo === 'PERCENTUAL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >%</button>
                                    </div>
                                    <input
                                        ref={inputDescontoRef}
                                        type="text"
                                        disabled={!!notaFiscalInfo}
                                        value={formatarMoeda(descontoInput)}
                                        onChange={(e) => handleMudancaMoeda(e.target.value, val => setDescontoInput(val.toString()))}
                                        placeholder="0,00 (F4)"
                                        className="w-24 p-2 text-right font-black text-red-600 bg-transparent outline-none text-lg disabled:opacity-70"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 text-white rounded-b-3xl border-t-4 border-blue-500 p-6 flex flex-col lg:flex-row justify-between items-center shadow-2xl mt-0 relative z-40">

                    <div className="text-slate-400 font-bold text-sm mb-6 lg:mb-0 flex items-center gap-2">
                        <div className="bg-slate-800 p-2 rounded-lg"><Package size={16}/></div>
                        {itens.length} {itens.length === 1 ? 'item adicionado' : 'itens adicionados'}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">

                        <div className="text-center md:text-right bg-slate-800 p-4 rounded-2xl md:bg-transparent md:p-0 w-full md:w-auto md:mr-4">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Total Líquido Final</span>
                            <h2 className="text-4xl lg:text-5xl font-black text-green-400 tracking-tighter leading-none">R$ {formatarMoeda(totalFinal)}</h2>
                            {valorDescontoReal > 0 && <p className="text-xs text-red-400 font-bold mt-1 uppercase tracking-widest">Desconto Aplicado: - R$ {formatarMoeda(valorDescontoReal)}</p>}
                        </div>

                        {!notaFiscalInfo ? (
                            modo === 'ORCAMENTO' ? (
                                <button onClick={() => processarVendaAPI('PEDIDO')} title="Converter em pedido firme (F9)" className="w-full md:w-auto px-8 py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 transition-all text-lg group">
                                    CONVERTER EM PEDIDO (F9) <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
                                </button>
                            ) : (
                                <button onClick={() => processarVendaAPI('AGUARDANDO_PAGAMENTO')} title="Finalizar e enviar para caixa (Ctrl+F9)" className="w-full md:w-auto px-8 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all text-lg group">
                                    ENVIAR PRO CAIXA (Ctrl+F9) <CheckCircle size={24} className="group-hover:scale-110 transition-transform"/>
                                </button>
                            )
                        ) : (
                            <div className="w-full md:w-auto px-8 py-5 bg-slate-800 text-green-400 font-black rounded-2xl flex items-center justify-center gap-3 shadow-inner border border-slate-700 cursor-not-allowed">
                                <Receipt size={24} /> VENDA FISCALIZADA (NF-e)
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalCancelamentoAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-red-600">
                        <div className="bg-red-600 p-6 flex justify-between items-center text-white">
                            <h2 className="font-black tracking-widest flex items-center gap-2"><AlertTriangle /> CANCELAR NF-E</h2>
                            <button onClick={() => setModalCancelamentoAberto(false)} disabled={cancelandoNfe} title="Fechar (Esc)" className="hover:text-red-200 transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <p className="text-sm text-slate-600 font-medium">Atenção: O cancelamento é irreversível e será transmitido para a SEFAZ. É exigida uma justificativa.</p>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase">Justificativa (Mín. 15 caracteres) *</label>
                                <textarea
                                    autoFocus
                                    value={justificativaCancelamento}
                                    onChange={(e) => setJustificativaCancelamento(e.target.value)}
                                    rows="3"
                                    disabled={cancelandoNfe}
                                    className={`w-full p-3 border-2 rounded-xl outline-none mt-1 bg-white shadow-sm transition-colors ${justificativaCancelamento.length >= 15 ? 'border-green-400 focus:border-green-600' : 'border-red-300 focus:border-red-500'}`}
                                    placeholder="Ex: Cliente desistiu da compra antes da saída da mercadoria."
                                />
                                <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${justificativaCancelamento.length < 15 ? 'text-red-500' : 'text-green-600'}`}>
                                    {justificativaCancelamento.length} / 15 Caracteres digitados
                                </p>
                            </div>
                            <button
                                onClick={cancelarNFe}
                                disabled={cancelandoNfe || justificativaCancelamento.length < 15}
                                title="Enviar cancelamento (Ctrl+Enter)"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelandoNfe ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                                {cancelandoNfe ? "PROCESSANDO NA SEFAZ..." : "CONFIRMAR CANCELAMENTO"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalVendaPerdidaAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-red-600 p-6 flex justify-between items-center text-white">
                            <h2 className="font-black tracking-widest flex items-center gap-2"><XCircle /> REGISTRAR PERDA</h2>
                            <button onClick={() => setModalVendaPerdidaAberto(false)} title="Fechar e cancelar registro de perda (Esc)" className="hover:text-red-200 transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-6 space-y-5 bg-slate-50">
                            <p className="text-sm text-slate-600 font-medium">Por que o cliente desistiu da compra? Este registro é essencial para melhorarmos nossos preços e estoques.</p>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Motivo Principal *</label>
                                <select autoFocus value={motivoVendaPerdida} onChange={(e) => setMotivoVendaPerdida(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:border-red-500 outline-none mt-1 bg-white shadow-sm">
                                    <option value="">Selecione um motivo...</option><option value="PRECO">Preço Alto / Sem Desconto</option><option value="ESTOQUE">Falta de Estoque</option><option value="CONCORRENCIA">Fechou com a Concorrência</option><option value="PRAZO">Prazo de Entrega longo</option><option value="NAO_ENCONTRADO">Peça não encontrada</option><option value="OUTROS">Outros Motivos</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Observações (Opcional)</label>
                                <textarea value={observacaoVendaPerdida} onChange={(e) => setObservacaoVendaPerdida(e.target.value)} rows="3" className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 outline-none mt-1 bg-white shadow-sm" placeholder="Ex: Cliente achou a peça 20 reais mais barata na loja X..." />
                            </div>
                            <button onClick={registrarVendaPerdida} title="Salvar perda (Ctrl+Enter)" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg mt-2 transition-colors flex items-center justify-center gap-2">
                                <XCircle size={20} /> CONFIRMAR PERDA (Ctrl+Enter)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalListaAberto && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white"><h2 className="text-xl font-black tracking-widest flex items-center gap-2"><FolderOpen /> ORÇAMENTOS PENDENTES (Use as setas para navegar)</h2><button onClick={() => setModalListaAberto(false)} title="Fechar lista de orçamentos (Esc)"><X size={24}/></button></div>
                        <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                            {orcamentosSalvos.map((orc, index) => (
                                <div
                                    key={orc.id}
                                    onClick={() => carregarOrcamentoLocal(orc)}
                                    onMouseEnter={() => setIndexFocadoLista(index)}
                                    title={`Reabrir orçamento #${orc.id} (Enter)`}
                                    className={`p-5 rounded-2xl mb-4 flex justify-between items-center cursor-pointer transition-all ${indexFocadoLista === index ? 'bg-blue-50 border-2 border-blue-400 shadow-md transform scale-[1.01]' : 'bg-white border border-slate-200 hover:shadow-sm'}`}
                                >
                                    <div><p className={`font-bold text-lg ${indexFocadoLista === index ? 'text-blue-800' : 'text-slate-800'}`}>{orc.cliente}</p><p className="text-xs text-slate-400 font-bold">{new Date(orc.data).toLocaleString()}</p></div>
                                    <p className={`font-black text-xl ${indexFocadoLista === index ? 'text-blue-600' : 'text-slate-800'}`}>R$ {formatarMoeda(orc.valor)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ModalCadastroVeiculoRapido
                isOpen={modalVeiculoAberto}
                onClose={() => setModalVeiculoAberto(false)}
                clienteId={clienteSelecionado?.id}
                onSucesso={(veiculoNovo) => {
                    setClienteSelecionado(prev => ({
                        ...prev,
                        veiculos: [...(prev.veiculos || []), veiculoNovo]
                    }));
                    setVeiculoSelecionado(veiculoNovo.id.toString());
                    if (veiculoNovo.km) {
                        setKmVeiculo(veiculoNovo.km.toString());
                    }
                    setModalVeiculoAberto(false);

                    setTimeout(() => {
                        setModalCrmAberto(true);
                        toast.success("Veículo pronto! Agora agende a revisão sugerida.", { icon: '📅' });
                    }, 400);
                }}
            />

            {previewImagemPeca && (
                <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-2 rounded-3xl shadow-2xl">
                        <img
                            src={previewImagemPeca}
                            alt="Visualização da Peça"
                            className="max-w-2xl max-h-[70vh] rounded-2xl object-contain"
                            onError={(e) => {
                                setPreviewImagemPeca(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};