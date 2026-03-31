import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    Wrench, Car, User, Search, Plus, Trash2, CheckCircle, Save,
    Image as ImageIcon, Info, FileText, AlertTriangle, MessageCircle,
    Printer, Gauge, Fuel, ChevronDown, Package, Calendar, DollarSign, Send, X, CalendarPlus
} from 'lucide-react';

export const OrdemServico = ({ osParaEditar, onVoltar }) => {
    const [osId, setOsId] = useState(null);
    const [status, setStatus] = useState('ORCAMENTO');

    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [indexFocadoCliente, setIndexFocadoCliente] = useState(-1);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');

    const [kmVeiculo, setKmVeiculo] = useState('');
    const [kmVemDoChecklist, setKmVemDoChecklist] = useState(false);

    const [defeitoRelatado, setDefeitoRelatado] = useState('');
    const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [imprimirLaudo, setImprimirLaudo] = useState(true);

    const [descontoInput, setDescontoInput] = useState('');
    const [tipoDesconto, setTipoDesconto] = useState('VALOR');

    const [dataProximaRevisao, setDataProximaRevisao] = useState('');
    const [obsProximaRevisao, setObsProximaRevisao] = useState('');

    const [itensPecas, setItensPecas] = useState([]);
    const [itensServicos, setItensServicos] = useState([]);

    const [buscaPeca, setBuscaPeca] = useState('');
    const [resultadosPecas, setResultadosPecas] = useState([]);
    const [indexFocadoPeca, setIndexFocadoPeca] = useState(-1);
    const [previewImagem, setPreviewImagem] = useState(null);

    const [buscaServico, setBuscaServico] = useState('');
    const [resultadosServicos, setResultadosServicos] = useState([]);
    const [indexFocadoServico, setIndexFocadoServico] = useState(-1);

    const [mecanicos, setMecanicos] = useState([]);
    const [empresaConfig, setEmpresaConfig] = useState({ nomeFantasia: 'OFICINA' });

    const [permitirEstoqueNegativoGlobal, setPermitirEstoqueNegativoGlobal] = useState(false);

    const [modalAplicacao, setModalAplicacao] = useState({ aberto: false, texto: '', nome: '' });
    const [modalEnviarCaixaAberto, setModalEnviarCaixaAberto] = useState(false);

    const inputClienteRef = useRef(null);
    const inputPecaRef = useRef(null);
    const inputServicoRef = useRef(null);
    const listaClientesRef = useRef(null);
    const listaPecasRef = useRef(null);
    const listaServicosRef = useRef(null);

    const isBloqueada = status === 'FATURADA' || status === 'AGUARDANDO_PAGAMENTO';

    const notificar = (tipo, msg) => {
        if(tipo === 'sucesso') toast.success(msg, { duration: 3000 });
        else if(tipo === 'erro') toast.error(msg, { duration: 4000 });
        else toast(msg, { icon: '⚠️' });
    };

    useEffect(() => {
        api.get('/api/usuarios').then(res => {
            const listaMecanicos = res.data.filter(u => u.isMecanico === true || u.ativo);
            setMecanicos(listaMecanicos);
        });
        api.get('/api/configuracoes').then(res => {
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setEmpresaConfig({ nomeFantasia: data?.nomeFantasia || 'OFICINA' });
                setPermitirEstoqueNegativoGlobal(data?.permitirEstoqueNegativoGlobal === true);
            }
        }).catch(() => {});

        if (osParaEditar) {
            setOsId(osParaEditar.id);
            setStatus(osParaEditar.status);
            setClienteSelecionado(osParaEditar.cliente);
            setBuscaCliente(osParaEditar.cliente?.nome || '');

            if (osParaEditar.cliente?.id) {
                api.get(`/api/veiculos/cliente/${osParaEditar.cliente.id}`).then(res => {
                    setClienteSelecionado(prev => ({ ...prev, veiculos: res.data || [] }));
                    setVeiculoSelecionado(osParaEditar.veiculo?.id || '');
                });
            }

            setKmVeiculo(osParaEditar.kmEntrada || '');
            setKmVemDoChecklist(false);
            setDefeitoRelatado(osParaEditar.defeitoRelatado || '');
            setDiagnosticoTecnico(osParaEditar.diagnosticoTecnico || '');
            setObservacoes(osParaEditar.observacoes || '');

            setTipoDesconto('VALOR');
            setDescontoInput(osParaEditar.desconto > 0 ? osParaEditar.desconto.toString() : '');

            if (osParaEditar.itensPecas) {
                setItensPecas(osParaEditar.itensPecas.map(p => ({
                    produtoId: p.produto.id, codigo: p.produto.sku, nome: p.produto.nome,
                    qtd: p.quantidade, preco: p.precoUnitario, fotoUrl: p.produto.fotoUrl, aplicacao: p.produto.aplicacao
                })));
            }
            if (osParaEditar.itensServicos) {
                setItensServicos(osParaEditar.itensServicos.map(s => ({
                    servicoId: s.servico.id, codigo: s.servico.codigo, nome: s.servico.nome,
                    qtd: s.quantidade, preco: s.precoUnitario, mecanicoId: s.mecanico?.id || ''
                })));
            }
        }
    }, [osParaEditar]);

    useEffect(() => {
        if (!osId && veiculoSelecionado && !isBloqueada) {
            const buscarUltimoChecklist = async () => {
                try {
                    const res = await api.get(`/api/veiculos/${veiculoSelecionado}/historico`);
                    const checklists = res.data.filter(e => e.tipo === 'CHECKLIST');

                    if (checklists.length > 0) {
                        const ultimo = checklists[0];
                        if (ultimo.dadosChecklist && ultimo.dadosChecklist.kmAtual) {
                            setKmVeiculo(ultimo.dadosChecklist.kmAtual.toString());
                            setKmVemDoChecklist(true);
                            toast.success("KM importado da Vistoria com sucesso!");
                        } else {
                            setKmVemDoChecklist(false);
                        }
                    } else {
                        setKmVemDoChecklist(false);
                    }
                } catch (error) {
                    setKmVemDoChecklist(false);
                }
            };
            buscarUltimoChecklist();
        }
    }, [veiculoSelecionado, osId, isBloqueada]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaPeca.trim().length > 1 && !isBloqueada) {
                try {
                    const termosBusca = buscaPeca.toLowerCase().split(' ').filter(t => t.trim() !== '');
                    const res = await api.get(`/api/produtos?busca=${encodeURIComponent(termosBusca[0])}`);
                    const filtrados = res.data.filter(peca => {
                        const textoDaPeca = `${peca.nome || ''} ${peca.sku || ''} ${peca.codigoBarras || ''} ${peca.referenciaOriginal || ''} ${peca.aplicacao || ''}`.toLowerCase();
                        return termosBusca.every(termo => textoDaPeca.includes(termo));
                    });
                    setResultadosPecas(filtrados);
                    setIndexFocadoPeca(filtrados.length > 0 ? 0 : -1);
                } catch (e) { setResultadosPecas([]); setIndexFocadoPeca(-1); }
            } else { setResultadosPecas([]); setIndexFocadoPeca(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaPeca, isBloqueada]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaServico.trim().length > 1 && !isBloqueada) {
                try {
                    const res = await api.get(`/api/servicos?busca=${encodeURIComponent(buscaServico)}`);
                    setResultadosServicos(res.data);
                    setIndexFocadoServico(res.data.length > 0 ? 0 : -1);
                } catch (e) { setResultadosServicos([]); setIndexFocadoServico(-1); }
            } else { setResultadosServicos([]); setIndexFocadoServico(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaServico, isBloqueada]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaCliente.length > 2 && (!clienteSelecionado || buscaCliente !== clienteSelecionado.nome) && !isBloqueada) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    setResultadosClientes(res.data);
                    setIndexFocadoCliente(res.data.length > 0 ? 0 : -1);
                } catch (e) { setResultadosClientes([]); setIndexFocadoCliente(-1); }
            } else { setResultadosClientes([]); setIndexFocadoCliente(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaCliente, clienteSelecionado, isBloqueada]);

    const adicionarPeca = (peca) => {
        if (isBloqueada) return;
        const existe = itensPecas.find(i => i.produtoId === peca.id);
        if (existe) {
            setItensPecas(itensPecas.map(i => i.produtoId === peca.id ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItensPecas([...itensPecas, {
                produtoId: peca.id, codigo: peca.sku, nome: peca.nome,
                qtd: 1, preco: peca.precoVenda, estoque: peca.quantidadeEstoque,
                fotoUrl: peca.fotoUrl || peca.fotoLocalPath, aplicacao: peca.aplicacao
            }]);
        }
        notificar('sucesso', 'Peça adicionada!');
        setBuscaPeca(''); setResultadosPecas([]); inputPecaRef.current?.focus();
        setPreviewImagem(null);
    };

    const adicionarServico = (serv) => {
        if (isBloqueada) return;
        const existe = itensServicos.find(i => i.servicoId === serv.id);

        let idLogado = localStorage.getItem('usuarioId') || localStorage.getItem('userId') || '';
        if (!idLogado) {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    idLogado = payload.id || payload.userId || '';
                }
            } catch(e) {}
        }

        let mecanicoAuto = '';
        if (idLogado) {
            const m = mecanicos.find(m => m.id.toString() === idLogado.toString());
            if (m) mecanicoAuto = m.id.toString();
        }
        if (!mecanicoAuto && mecanicos.length > 0) {
            mecanicoAuto = mecanicos[0].id.toString();
        }

        if (existe) {
            setItensServicos(itensServicos.map(i => i.servicoId === serv.id ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItensServicos([...itensServicos, {
                servicoId: serv.id, codigo: serv.codigo, nome: serv.nome,
                qtd: 1, preco: serv.preco,
                mecanicoId: mecanicoAuto
            }]);
        }
        notificar('sucesso', 'Serviço adicionado!');
        setBuscaServico(''); setResultadosServicos([]); inputServicoRef.current?.focus();
    };

    const selecionarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setBuscaCliente(cliente.nome);
        setResultadosClientes([]);
        api.get(`/api/veiculos/cliente/${cliente.id}`).then(res => {
            setClienteSelecionado(prev => ({ ...prev, veiculos: res.data || [] }));
        });
    };

    const removerCliente = () => {
        if (isBloqueada) return;
        setClienteSelecionado(null);
        setBuscaCliente('');
        setVeiculoSelecionado('');
        setKmVeiculo('');
        setKmVemDoChecklist(false);
        setTimeout(() => inputClienteRef.current?.focus(), 100);
    };

    const handleScroll = (ref, index) => {
        if (ref.current && ref.current.children[index]) {
            ref.current.children[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    };

    const onKeyDownBuscaGenerica = (e, indexFocado, setIndexFocado, resultados, acaoSelecionar, refLista) => {
        if(e.key === 'ArrowDown') {
            e.preventDefault();
            setIndexFocado(p => { const newIdx = Math.min(resultados.length - 1, p + 1); handleScroll(refLista, newIdx); return newIdx; });
        } else if(e.key === 'ArrowUp') {
            e.preventDefault();
            setIndexFocado(p => { const newIdx = Math.max(0, p - 1); handleScroll(refLista, newIdx); return newIdx; });
        } else if(e.key === 'Enter') {
            e.preventDefault();
            if(indexFocado >= 0 && resultados[indexFocado]) {
                acaoSelecionar(resultados[indexFocado]);
            }
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if(e.key === 'F2' && !isBloqueada) { e.preventDefault(); inputClienteRef.current?.focus(); }
            if(e.key === 'F3' && !isBloqueada) { e.preventDefault(); inputPecaRef.current?.focus(); }
            if(e.key === 'F4' && !isBloqueada) { e.preventDefault(); inputServicoRef.current?.focus(); }
            if(e.key === 'Escape') {
                setModalAplicacao({aberto:false, texto:'', nome:''});
                setModalEnviarCaixaAberto(false);
                setPreviewImagem(null);
                setResultadosPecas([]); setResultadosServicos([]); setResultadosClientes([]);
            }
            if((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                if (!isBloqueada) salvarOrdemServico();
            }
            if((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                imprimirOS();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [clienteSelecionado, itensPecas, itensServicos, defeitoRelatado, isBloqueada]);

    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const handleMudancaDesconto = (valorDigitado) => {
        if (tipoDesconto === 'PERCENTUAL') {
            setDescontoInput(valorDigitado.replace(/[^0-9.]/g, ''));
        } else {
            const apenasDigitos = valorDigitado.replace(/\D/g, '');
            const valorRealFloat = Number(apenasDigitos) / 100;
            setDescontoInput(valorRealFloat > 0 ? valorRealFloat.toString() : '');
        }
    };

    const totalPecas = itensPecas.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    const totalServicos = itensServicos.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    const subtotalOS = totalPecas + totalServicos;

    const valorDescontoDigitado = parseFloat(descontoInput) || 0;
    const valorDescontoCalculado = tipoDesconto === 'PERCENTUAL'
        ? (subtotalOS * (valorDescontoDigitado / 100))
        : valorDescontoDigitado;

    const totalGeral = Math.max(0, subtotalOS - valorDescontoCalculado);

    const salvarOrdemServico = async () => {
        if(isBloqueada) return false;
        if(!clienteSelecionado) { notificar('erro', 'Selecione um cliente para a OS!'); return false; }
        const servicoSemMecanico = itensServicos.find(s => !s.mecanicoId);
        if(servicoSemMecanico) { notificar('erro', `Falta selecionar o mecânico para o serviço: ${servicoSemMecanico.nome}`); return false; }

        let consultorIdLogado = localStorage.getItem('usuarioId') || localStorage.getItem('userId') || null;
        if (!consultorIdLogado) {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    consultorIdLogado = payload.id || payload.userId || null;
                }
            } catch(e) {}
        }

        const payload = {
            clienteId: clienteSelecionado.id,
            veiculoId: veiculoSelecionado || null,
            consultorId: consultorIdLogado,
            kmEntrada: kmVeiculo ? parseInt(kmVeiculo) : null,
            nivelCombustivel: 'NAO_INFORMADO',
            defeitoRelatado,
            diagnosticoTecnico,
            observacoes,
            desconto: valorDescontoCalculado,
            pecas: itensPecas.map(p => ({ produtoId: p.produtoId, quantidade: p.qtd, precoUnitario: p.preco })),
            servicos: itensServicos.map(s => ({ servicoId: s.servicoId, mecanicoId: s.mecanicoId, quantidade: s.qtd, precoUnitario: s.preco }))
        };

        const loadId = toast.loading("Salvando Ordem de Serviço...");
        try {
            const res = osId ? await api.put(`/api/os/${osId}`, payload) : await api.post('/api/os', payload);
            setOsId(res.data.id);
            toast.success(`OS #${res.data.id} salva com sucesso!`, { id: loadId });
            return true;
        } catch (error) {
            toast.error("Erro ao salvar a OS no servidor.", { id: loadId });
            return false;
        }
    };

    const abrirModalEnviarCaixa = () => {
        if (isBloqueada) return notificar('aviso', 'Esta OS já foi fechada/enviada!');
        if (!osId) return notificar('erro', 'Salve a OS primeiro antes de enviar ao caixa.');
        setModalEnviarCaixaAberto(true);
    };

    const confirmarEnvioCaixa = async () => {
        if (!permitirEstoqueNegativoGlobal) {
            const pecasSemEstoque = itensPecas.filter(p => p.qtd > (p.estoque || 0));
            if (pecasSemEstoque.length > 0) {
                setModalEnviarCaixaAberto(false);
                const nomes = pecasSemEstoque.map(p => p.nome).join(', ');
                return toast.error(`ESTOQUE INSUFICIENTE!\nVocê não tem saldo para: ${nomes}.`, { duration: 6000 });
            }
        }

        setModalEnviarCaixaAberto(false);
        const salvou = await salvarOrdemServico();
        if(!salvou) return;

        const loadId = toast.loading("Enviando para a fila do caixa e baixando estoque...");
        try {
            await api.post(`/api/os/${osId}/enviar-caixa`);

            if (dataProximaRevisao) {
                try {
                    await api.post('/api/revisoes', {
                        clienteId: clienteSelecionado.id,
                        veiculoId: veiculoSelecionado || null,
                        dataPrevisao: dataProximaRevisao,
                        observacao: obsProximaRevisao || 'Revisão agendada pelo painel de OS.',
                        status: 'PENDENTE'
                    });
                    toast.success("Próxima revisão agendada no CRM!");
                } catch(err) {}
            }

            setStatus('AGUARDANDO_PAGAMENTO');
            toast.success("OS Enviada ao Caixa! Peças baixadas do estoque.", { id: loadId });
            if (onVoltar) setTimeout(() => onVoltar(), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao enviar a OS ao caixa.", { id: loadId });
        }
    };

    // =========================================================================
    // 🚀 1. BOTÃO DE WHATSAPP (ENVIA O PDF A4 FEITO EM JAVA)
    // =========================================================================
    const enviarWhatsApp = async () => {
        if (!osId) return notificar('erro', 'Salve a OS primeiro antes de enviar por WhatsApp.');
        if (!clienteSelecionado?.telefone) return notificar('erro', 'O cliente selecionado não possui telefone cadastrado.');

        const loadId = toast.loading('Gerando PDF e enviando para o WhatsApp do cliente...');
        try {
            await api.post(`/api/os/${osId}/enviar-whatsapp`);
            toast.success('OS enviada com sucesso pelo WhatsApp! ✅', { id: loadId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao enviar. Verifique o celular na aba Integrações.', { id: loadId });
        }
    };

    const criarCompromissoAgenda = async () => {
        if (!osId) return notificar('erro', 'Salve a OS primeiro antes de criar um compromisso.');

        const toastId = toast.loading('Criando compromisso na agenda corporativa...');
        try {
            await api.post(`/api/agenda/origens/os/${osId}`);
            toast.success('Compromisso criado na agenda corporativa!', { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao criar compromisso na agenda.', { id: toastId });
        }
    };

    // =========================================================================
    // 🖨️ 2. BOTÃO DE IMPRIMIR (PUXA O HTML DA CENTRAL DE LAYOUTS 'os')
    // =========================================================================
    const imprimirOS = async () => {
        if (!osId) return notificar('erro', 'Salve a OS antes de imprimir.');
        const toastId = toast.loading('Buscando Layout de Impressão (HTML)...');
        try {
            // O Java processa o Thymeleaf do layout 'os' e devolve o HTML puro
            const res = await api.get(`/api/os/${osId}/imprimir-html`);
            const htmlProcessado = res.data;

            // Abre uma nova janela invisível e joga o HTML lá dentro
            const printWindow = window.open('', '_blank');
            printWindow.document.write(htmlProcessado);
            printWindow.document.close();
            printWindow.focus();

            // Espera meio segundo para as imagens/css carregarem e chama a impressora
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

            toast.success("Documento gerado!", { id: toastId });
        } catch (error) {
            toast.error("Erro ao gerar a impressão HTML. A rota /imprimir-html existe no Backend?", { id: toastId });
        }
    };

    return (
        <div className="flex flex-col h-full max-h-full bg-slate-50 relative z-10 animate-fade-in overflow-hidden">

            {previewImagem && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] pointer-events-none animate-fade-in shadow-2xl border-4 border-white rounded-2xl overflow-hidden bg-white">
                    <img src={previewImagem} alt="Preview" className="max-w-[400px] max-h-[400px] object-contain" />
                    <div className="bg-slate-900 text-white text-center text-[10px] font-black tracking-widest py-2 uppercase">Pré-visualização da Peça</div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">

                <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-md">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                ORDEM DE SERVIÇO {osId ? `#${osId}` : '- NOVA'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isBloqueada ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    STATUS: {status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {onVoltar && (
                            <button onClick={onVoltar} className="p-2.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm text-xs font-bold uppercase">
                                Voltar
                            </button>
                        )}

                        <button
                            onClick={salvarOrdemServico}
                            disabled={isBloqueada}
                            className={`px-4 py-2.5 font-black rounded-lg shadow-md flex items-center gap-2 uppercase text-xs transition-transform ${isBloqueada ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'}`}
                        >
                            <Save size={16}/> Salvar
                        </button>

                        {/* 🚀 NOVO: BOTÃO WHATSAPP ELEGANT */}
                        <button
                            onClick={enviarWhatsApp}
                            disabled={!osId}
                            title="Enviar PDF A4 para o cliente via WhatsApp"
                            className="p-2.5 bg-white text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            <MessageCircle size={18}/>
                        </button>

                        <button
                            onClick={criarCompromissoAgenda}
                            disabled={!osId}
                            title="Criar compromisso na agenda corporativa"
                            className="p-2.5 bg-white text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            <CalendarPlus size={18}/>
                        </button>

                        {/* 🖨️ NOVO: BOTÃO DE IMPRESSÃO (CARREGA A CENTRAL DE LAYOUTS) */}
                        <button
                            onClick={imprimirOS}
                            disabled={!osId}
                            title="Imprimir na Térmica (Usando o layout da Central)"
                            className="p-2.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Printer size={18}/>
                        </button>

                        {osId && (
                            <button
                                onClick={abrirModalEnviarCaixa}
                                disabled={isBloqueada}
                                className={`px-4 py-2.5 font-black rounded-lg shadow-md flex items-center gap-2 uppercase text-xs transition-all ${isBloqueada ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'}`}
                            >
                                <Send size={16}/> {isBloqueada ? 'NO CAIXA' : 'Enviar Caixa'}
                            </button>
                        )}
                    </div>
                </div>

                {isBloqueada && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 rounded-r-xl shadow-sm flex items-center gap-3">
                        <CheckCircle className="text-emerald-500" size={20} />
                        <div>
                            <h4 className="font-black text-emerald-800 uppercase text-xs">
                                {status === 'FATURADA' ? 'OS Paga e Fechada' : 'OS no Caixa (Estoque Baixado)'}
                            </h4>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col">
                        <h3 className="font-black text-sm text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <User size={16} className="text-blue-500"/> 1. Identificação
                        </h3>
                        <div className="flex-1 space-y-3">
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Cliente *</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputClienteRef}
                                        type="text"
                                        value={buscaCliente}
                                        onChange={(e) => setBuscaCliente(e.target.value)}
                                        onKeyDown={(e) => onKeyDownBuscaGenerica(e, indexFocadoCliente, setIndexFocadoCliente, resultadosClientes, selecionarCliente, listaClientesRef)}
                                        disabled={!!clienteSelecionado || isBloqueada}
                                        placeholder="Buscar Cliente (F2)..."
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 disabled:opacity-60"
                                    />
                                    {(clienteSelecionado && !isBloqueada) && (
                                        <button onClick={removerCliente} className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                                    )}
                                </div>
                                {resultadosClientes.length > 0 && !clienteSelecionado && !isBloqueada && (
                                    <div ref={listaClientesRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {resultadosClientes.map((c, idx) => (
                                            <div key={c.id} onClick={() => selecionarCliente(c)} onMouseEnter={() => setIndexFocadoCliente(idx)} className={`p-3 cursor-pointer border-b text-xs font-bold ${idx === indexFocadoCliente ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50'}`}>
                                                {c.nome} {c.documento && <span className="ml-2 opacity-70">({c.documento})</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Veículo *</label>
                                    <select
                                        value={veiculoSelecionado}
                                        onChange={(e) => setVeiculoSelecionado(e.target.value)}
                                        disabled={!clienteSelecionado || isBloqueada}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 disabled:opacity-60"
                                    >
                                        <option value="">Selecione...</option>
                                        {clienteSelecionado?.veiculos?.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center justify-between">
                                        KM Atual
                                        {kmVemDoChecklist && <CheckCircle size={10} className="text-emerald-500" title="Veio da Vistoria"/>}
                                    </label>
                                    <input
                                        type="number"
                                        disabled={isBloqueada || kmVemDoChecklist}
                                        value={kmVeiculo}
                                        onChange={e => setKmVeiculo(e.target.value)}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-bold outline-none ${kmVemDoChecklist ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'} disabled:opacity-70`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col">
                        <h3 className="font-black text-sm text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <AlertTriangle size={16} className="text-orange-500"/> 2. Relatos e Parecer
                        </h3>

                        <div className="flex-1 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageCircle size={12} className="text-red-400"/> Reclamação</label>
                                    <textarea disabled={isBloqueada} value={defeitoRelatado} onChange={e => setDefeitoRelatado(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 min-h-[40px] resize-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><Wrench size={12} className="text-emerald-500"/> Diagnóstico</label>
                                    <textarea disabled={isBloqueada} value={diagnosticoTecnico} onChange={e => setDiagnosticoTecnico(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 min-h-[40px] resize-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><FileText size={12} className="text-blue-500"/> Laudo Final</label>
                                    </div>
                                    <textarea disabled={isBloqueada} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="O que foi feito..." className="w-full p-2 bg-blue-50/30 border border-blue-100 rounded-lg text-xs font-bold text-blue-900 outline-none focus:border-blue-400 min-h-[50px] resize-none" />
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={12} className="text-purple-500"/> Agendar Revisão</label>
                                    <input type="date" disabled={isBloqueada} value={dataProximaRevisao} onChange={e => setDataProximaRevisao(e.target.value)} className="w-full p-1.5 mb-1 bg-white border border-slate-200 rounded text-xs outline-none focus:border-purple-500" />
                                    <input type="text" disabled={isBloqueada || !dataProximaRevisao} value={obsProximaRevisao} onChange={e => setObsProximaRevisao(e.target.value)} placeholder="Obs. Revisão..." className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-purple-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[350px] xl:h-[400px]">
                        <div className="bg-orange-50 border-b border-orange-100 p-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                                <input
                                    ref={inputServicoRef}
                                    type="text"
                                    value={buscaServico}
                                    onChange={e => setBuscaServico(e.target.value)}
                                    onKeyDown={(e) => onKeyDownBuscaGenerica(e, indexFocadoServico, setIndexFocadoServico, resultadosServicos, adicionarServico, listaServicosRef)}
                                    disabled={isBloqueada}
                                    placeholder="Buscar Serviço (F4)..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-orange-200 rounded-lg text-sm font-bold outline-none focus:border-orange-500 disabled:opacity-60"
                                />
                                {resultadosServicos.length > 0 && !isBloqueada && (
                                    <div ref={listaServicosRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {resultadosServicos.map((serv, idx) => (
                                            <div key={serv.id} onClick={() => adicionarServico(serv)} onMouseEnter={() => setIndexFocadoServico(idx)} className={`p-3 cursor-pointer border-b flex justify-between items-center text-sm ${idx === indexFocadoServico ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 text-slate-800'}`}>
                                                <span className="font-bold">{serv.nome}</span>
                                                <span className="font-black">R$ {formatarMoeda(serv.preco)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 border-b border-slate-100">
                                <tr>
                                    <th className="p-2.5">Serviço</th>
                                    <th className="p-2.5">Executante</th>
                                    <th className="p-2.5 text-right">Valor</th>
                                    <th className="p-2.5 w-8"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {itensServicos.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-400 text-xs font-bold">Nenhum serviço adicionado.</td></tr>}
                                {itensServicos.map((item) => (
                                    <tr key={item.servicoId} className="hover:bg-slate-50">
                                        <td className="p-2.5 font-bold text-slate-700 text-sm">{item.nome}</td>
                                        <td className="p-2.5">
                                            <select
                                                disabled={isBloqueada}
                                                value={item.mecanicoId}
                                                onChange={(e) => setItensServicos(itensServicos.map(i => i.servicoId === item.servicoId ? { ...i, mecanicoId: e.target.value } : i))}
                                                className={`w-full p-1.5 rounded font-bold text-xs outline-none border ${!item.mecanicoId ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200'}`}
                                            >
                                                <option value="">-- SELECIONE --</option>
                                                {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2.5 text-right font-black text-orange-600 text-base">R$ {formatarMoeda(item.preco)}</td>
                                        <td className="p-2.5 text-center">
                                            <button disabled={isBloqueada} onClick={() => setItensServicos(itensServicos.filter(i => i.servicoId !== item.servicoId))} className="text-slate-300 hover:text-red-500 disabled:opacity-30"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[350px] xl:h-[400px]">
                        <div className="bg-blue-50 border-b border-blue-100 p-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                <input
                                    ref={inputPecaRef}
                                    type="text"
                                    value={buscaPeca}
                                    onChange={e => setBuscaPeca(e.target.value)}
                                    disabled={isBloqueada}
                                    onKeyDown={(e) => {
                                        if(e.altKey && e.key === 'a' && indexFocadoPeca >= 0) {
                                            e.preventDefault();
                                            setModalAplicacao({ aberto: true, texto: resultadosPecas[indexFocadoPeca].aplicacao, nome: resultadosPecas[indexFocadoPeca].nome });
                                        } else {
                                            onKeyDownBuscaGenerica(e, indexFocadoPeca, setIndexFocadoPeca, resultadosPecas, adicionarPeca, listaPecasRef);
                                        }
                                    }}
                                    placeholder="Buscar Peça (F3)... (Alt+A p/ Aplicação)"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 disabled:opacity-60"
                                />
                                {resultadosPecas.length > 0 && !isBloqueada && (
                                    <div ref={listaPecasRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {resultadosPecas.map((peca, idx) => (
                                            <div key={peca.id} className={`p-3 border-b flex justify-between items-center cursor-pointer ${idx === indexFocadoPeca ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-800'}`} onMouseEnter={() => setIndexFocadoPeca(idx)}>
                                                <div className="flex items-center gap-3 flex-1" onClick={() => adicionarPeca(peca)}>
                                                    <div className={`w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 ${peca.fotoUrl ? '' : 'border border-slate-200'}`} onMouseEnter={() => peca.fotoUrl && setPreviewImagem(peca.fotoUrl)} onMouseLeave={() => setPreviewImagem(null)}>
                                                        {peca.fotoUrl ? <img src={peca.fotoUrl} alt="Peca" className="w-full h-full object-cover" /> : <ImageIcon size={14} className={idx === indexFocadoPeca ? "text-blue-300" : "text-slate-300"}/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm leading-tight">{peca.nome}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[10px] font-mono ${idx === indexFocadoPeca ? 'text-blue-200' : 'text-slate-500'}`}>{peca.sku}</span>
                                                            <span className={`text-[9px] px-1 rounded font-black uppercase ${idx === indexFocadoPeca ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>Estoque: {peca.quantidadeEstoque}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={(e) => { e.stopPropagation(); setModalAplicacao({ aberto: true, texto: peca.aplicacao, nome: peca.nome }); }} className={`p-1.5 rounded transition-colors ${idx === indexFocadoPeca ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`} title="Alt+A"><Info size={14}/></button>
                                                    <p className="font-black text-sm" onClick={() => adicionarPeca(peca)}>R$ {formatarMoeda(peca.precoVenda)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 border-b border-slate-100">
                                <tr>
                                    <th className="p-2.5 w-10 text-center">Img</th>
                                    <th className="p-2.5">Peça</th>
                                    <th className="p-2.5 text-center w-14">Qtd</th>
                                    <th className="p-2.5 text-right">Subtotal</th>
                                    <th className="p-2.5 w-8"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {itensPecas.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400 text-xs font-bold">Nenhuma peça adicionada.</td></tr>}
                                {itensPecas.map((item) => (
                                    <tr key={item.produtoId} className="hover:bg-slate-50">
                                        <td className="p-2.5 text-center">
                                            <div className="w-8 h-8 rounded bg-slate-100 mx-auto flex items-center justify-center overflow-hidden border border-slate-200 cursor-pointer" onMouseEnter={() => item.fotoUrl && setPreviewImagem(item.fotoUrl)} onMouseLeave={() => setPreviewImagem(null)}>
                                                {item.fotoUrl ? <img src={item.fotoUrl} alt="Peca" className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-slate-300"/>}
                                            </div>
                                        </td>
                                        <td className="p-2.5 font-bold text-slate-700 text-sm">
                                            <p className="truncate max-w-[150px]" title={item.nome}>{item.nome}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-slate-400 font-mono">{item.codigo}</span>
                                                {item.aplicacao && (
                                                    <button onClick={() => setModalAplicacao({ aberto: true, texto: item.aplicacao, nome: item.nome })} className="text-[9px] text-blue-500 hover:text-blue-700 font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Info size={10}/> Aplicação
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2.5 text-center">
                                            <input disabled={isBloqueada} type="number" value={item.qtd} onChange={(e) => setItensPecas(itensPecas.map(i => i.produtoId === item.produtoId ? { ...i, qtd: Math.max(1, parseInt(e.target.value) || 1) } : i))} className="w-10 p-1 text-center font-black bg-white border border-slate-200 rounded outline-none focus:border-blue-500 text-sm disabled:opacity-70" />
                                        </td>
                                        <td className="p-2.5 text-right font-black text-blue-600 text-base">R$ {formatarMoeda(item.preco * item.qtd)}</td>
                                        <td className="p-2.5 text-center">
                                            <button disabled={isBloqueada} onClick={() => setItensPecas(itensPecas.filter(i => i.produtoId !== item.produtoId))} className="text-slate-300 hover:text-red-500 disabled:opacity-30"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div> {/* <-- FIM DA ÁREA ROLÁVEL --> */}

            <div className="shrink-0 bg-slate-50 p-4 md:px-6 md:pb-6 pt-4 border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-40 relative">
                <div className="bg-slate-900 rounded-2xl border-t-4 border-indigo-500 p-5 flex flex-col lg:flex-row justify-between items-center shadow-xl">
                    <div className="flex items-center gap-6 mb-4 lg:mb-0">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Total Mão de Obra</p>
                            <p className="text-lg font-black text-orange-400">R$ {formatarMoeda(totalServicos)}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700"></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Total Peças</p>
                            <p className="text-lg font-black text-blue-400">R$ {formatarMoeda(totalPecas)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <p className="text-[10px] font-black uppercase text-slate-400">Desconto</p>
                                <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                                    <button onClick={() => { setTipoDesconto('VALOR'); setDescontoInput(''); }} disabled={isBloqueada} className={`px-2 py-0.5 text-[9px] font-black rounded ${tipoDesconto === 'VALOR' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>R$</button>
                                    <button onClick={() => { setTipoDesconto('PERCENTUAL'); setDescontoInput(''); }} disabled={isBloqueada} className={`px-2 py-0.5 text-[9px] font-black rounded ${tipoDesconto === 'PERCENTUAL' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>%</button>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">{tipoDesconto === 'VALOR' ? 'R$' : '%'}</span>
                                <input
                                    disabled={isBloqueada}
                                    type="text"
                                    value={tipoDesconto === 'VALOR' ? (descontoInput ? formatarMoeda(descontoInput) : '') : descontoInput}
                                    onChange={e => handleMudancaDesconto(e.target.value)}
                                    className="w-28 py-1.5 pr-2 pl-7 bg-slate-800 border border-slate-700 text-red-400 font-black rounded text-right outline-none focus:border-red-500 disabled:opacity-50"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-800 px-5 py-2 rounded-xl shadow-inner border border-slate-700 text-right">
                            <span className="text-[10px] text-slate-400 font-black uppercase block mb-0.5">Total da OS</span>
                            <h2 className="text-3xl font-black text-emerald-400 leading-none">R$ {formatarMoeda(totalGeral)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {modalAplicacao.aberto && (
                <ModalAplicacaoPeca
                    modalAplicacao={modalAplicacao}
                    setModalAplicacao={setModalAplicacao}
                />
            )}

            {modalEnviarCaixaAberto && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-center border-t-4 border-emerald-500">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={28} className="text-emerald-500 ml-1" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-2">Enviar ao Caixa?</h2>
                            <p className="text-slate-500 text-sm font-medium mb-6">
                                A OS irá para a <b className="text-blue-600">Fila do Caixa</b> e <b className="text-red-500">baixará as peças do estoque</b>.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setModalEnviarCaixaAberto(false)} className="flex-1 p-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-xs uppercase">Cancelar</button>
                                <button onClick={confirmarEnvioCaixa} className="flex-1 bg-emerald-500 text-white p-2.5 rounded-xl font-black hover:bg-emerald-600 text-xs uppercase shadow-md">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ModalAplicacaoPeca = ({ modalAplicacao, setModalAplicacao }) => {
    const [filtro, setFiltro] = useState('');

    const formatarTexto = (texto) => {
        if (!texto) return [];
        let linhas = texto.split('\n');

        if (linhas.length === 1) {
            linhas = texto.replace(/(\S)\s+([A-Z]{4,}\s)/g, '$1\n$2').split('\n');
        }
        return linhas;
    };

    const linhas = formatarTexto(modalAplicacao.texto);

    const linhasFiltradas = linhas.filter(linha => {
        if (!filtro) return true;
        try {
            const regex = new RegExp(filtro, 'i');
            return regex.test(linha);
        } catch (e) {
            return linha.toLowerCase().includes(filtro.toLowerCase());
        }
    });

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col border-t-4 border-blue-500 overflow-hidden max-h-[90vh] md:max-h-[85vh]">

                <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Info className="text-blue-500"/> Aplicação da Peça
                        </h2>
                        <p className="text-blue-700 font-bold mt-1 text-sm">{modalAplicacao.nome}</p>
                    </div>
                    <button
                        onClick={() => setModalAplicacao({aberto: false, texto: '', nome: ''})}
                        className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                    >
                        <X size={24}/>
                    </button>
                </div>

                <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                        <input
                            type="text"
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                            placeholder="Filtrar aplicação (Suporta Regex. Ex: HONDA|FIAT ou 1\.6 16V)"
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    {linhasFiltradas.length > 0 ? (
                        <ul className="space-y-2">
                            {linhasFiltradas.map((linha, idx) => (
                                <li key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm flex items-start gap-3 hover:border-blue-300 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                                    <span className="leading-relaxed">{linha.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <AlertTriangle size={48} className="mb-3 opacity-30"/>
                            <p className="font-bold">Nenhuma aplicação encontrada para o filtro.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
