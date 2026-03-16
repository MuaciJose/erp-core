import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    Wrench, Car, User, Search, Plus, Trash2, CheckCircle, Save,
    Image as ImageIcon, Info, FileText, AlertTriangle, MessageCircle,
    Printer, Gauge, Fuel, ChevronDown, Package, Percent, DollarSign, Calendar
} from 'lucide-react';

export const OrdemServico = ({ osParaEditar, onVoltar }) => {
    // ==========================================
    // 🚀 ESTADOS DA CAPA DA OS
    // ==========================================
    const [osId, setOsId] = useState(null);
    const [status, setStatus] = useState('ORCAMENTO');

    const [buscaCliente, setBuscaCliente] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [resultadosClientes, setResultadosClientes] = useState([]);
    const [indexFocadoCliente, setIndexFocadoCliente] = useState(-1);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState('');
    const [kmVeiculo, setKmVeiculo] = useState('');
    const [nivelCombustivel, setNivelCombustivel] = useState('MEIO_TANQUE');

    const [defeitoRelatado, setDefeitoRelatado] = useState('');
    const [diagnosticoTecnico, setDiagnosticoTecnico] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [imprimirLaudo, setImprimirLaudo] = useState(true);

    // 🚀 CRM: Próxima Revisão
    const [dataProximaRevisao, setDataProximaRevisao] = useState('');
    const [obsProximaRevisao, setObsProximaRevisao] = useState('');

    const [descontoInput, setDescontoInput] = useState('0');
    const [tipoDesconto, setTipoDesconto] = useState('VALOR');

    // ==========================================
    // 🚀 ESTADOS DOS ITENS & MODAIS
    // ==========================================
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

    const [modalAplicacao, setModalAplicacao] = useState({ aberto: false, texto: '', nome: '' });
    const [modalFaturarAberto, setModalFaturarAberto] = useState(false); // 🚀 NOVO MODAL DE FATURAR

    const inputClienteRef = useRef(null);
    const inputPecaRef = useRef(null);
    const inputServicoRef = useRef(null);
    const listaClientesRef = useRef(null);
    const listaPecasRef = useRef(null);
    const listaServicosRef = useRef(null);

    const isFaturada = status === 'FATURADA';

    const notificar = (tipo, msg) => {
        if(tipo === 'sucesso') toast.success(msg, { duration: 3000 });
        else if(tipo === 'erro') toast.error(msg, { duration: 4000 });
        else toast(msg, { icon: '⚠️' });
    };

    const Tooltip = ({ texto, alignRight = false }) => (
        <div className="relative group cursor-pointer inline-block ml-2 align-middle">
            <Info size={14} className="text-slate-400 hover:text-blue-500 transition-colors" />
            <div className={`absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] uppercase font-bold tracking-widest rounded shadow-xl z-50 text-center ${alignRight ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                {texto}
                <div className={`absolute top-full border-4 border-transparent border-t-slate-800 ${alignRight ? 'right-1' : 'left-1/2 -translate-x-1/2'}`}></div>
            </div>
        </div>
    );

    useEffect(() => {
        api.get('/api/usuarios').then(res => {
            const listaMecanicos = res.data.filter(u => u.isMecanico === true || u.ativo);
            setMecanicos(listaMecanicos);
        });
        api.get('/api/configuracoes').then(res => {
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setEmpresaConfig({ nomeFantasia: data?.nomeFantasia || 'OFICINA' });
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
            setNivelCombustivel(osParaEditar.nivelCombustivel || 'MEIO_TANQUE');
            setDefeitoRelatado(osParaEditar.defeitoRelatado || '');
            setDiagnosticoTecnico(osParaEditar.diagnosticoTecnico || '');
            setObservacoes(osParaEditar.observacoes || '');

            setTipoDesconto('VALOR');
            setDescontoInput(osParaEditar.desconto > 0 ? osParaEditar.desconto.toString() : '');

            if (osParaEditar.itensPecas) {
                setItensPecas(osParaEditar.itensPecas.map(p => ({
                    produtoId: p.produto.id, codigo: p.produto.sku, nome: p.produto.nome,
                    qtd: p.quantidade, preco: p.precoUnitario, fotoUrl: p.produto.fotoUrl
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
        const timer = setTimeout(async () => {
            if (buscaPeca.trim().length > 1 && !isFaturada) {
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
    }, [buscaPeca, isFaturada]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaServico.trim().length > 1 && !isFaturada) {
                try {
                    const res = await api.get(`/api/servicos?busca=${encodeURIComponent(buscaServico)}`);
                    setResultadosServicos(res.data);
                    setIndexFocadoServico(res.data.length > 0 ? 0 : -1);
                } catch (e) { setResultadosServicos([]); setIndexFocadoServico(-1); }
            } else { setResultadosServicos([]); setIndexFocadoServico(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaServico, isFaturada]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (buscaCliente.length > 2 && (!clienteSelecionado || buscaCliente !== clienteSelecionado.nome) && !isFaturada) {
                try {
                    const res = await api.get(`/api/parceiros?busca=${buscaCliente}`);
                    setResultadosClientes(res.data);
                    setIndexFocadoCliente(res.data.length > 0 ? 0 : -1);
                } catch (e) { setResultadosClientes([]); setIndexFocadoCliente(-1); }
            } else { setResultadosClientes([]); setIndexFocadoCliente(-1); }
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaCliente, clienteSelecionado, isFaturada]);

    const adicionarPeca = (peca) => {
        if (isFaturada) return;
        const existe = itensPecas.find(i => i.produtoId === peca.id);
        if (existe) {
            setItensPecas(itensPecas.map(i => i.produtoId === peca.id ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItensPecas([...itensPecas, {
                produtoId: peca.id, codigo: peca.sku, nome: peca.nome,
                qtd: 1, preco: peca.precoVenda, estoque: peca.quantidadeEstoque,
                fotoUrl: peca.fotoUrl || peca.fotoLocalPath
            }]);
        }
        notificar('sucesso', 'Peça adicionada!');
        setBuscaPeca(''); setResultadosPecas([]); inputPecaRef.current?.focus();
    };

    const adicionarServico = (serv) => {
        if (isFaturada) return;
        const existe = itensServicos.find(i => i.servicoId === serv.id);
        if (existe) {
            setItensServicos(itensServicos.map(i => i.servicoId === serv.id ? { ...i, qtd: i.qtd + 1 } : i));
        } else {
            setItensServicos([...itensServicos, {
                servicoId: serv.id, codigo: serv.codigo, nome: serv.nome,
                qtd: 1, preco: serv.preco, mecanicoId: ''
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
        if (isFaturada) return;
        setClienteSelecionado(null);
        setBuscaCliente('');
        setVeiculoSelecionado('');
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
            if(e.key === 'F2' && !isFaturada) { e.preventDefault(); inputClienteRef.current?.focus(); }
            if(e.key === 'F3' && !isFaturada) { e.preventDefault(); inputPecaRef.current?.focus(); }
            if(e.key === 'F4' && !isFaturada) { e.preventDefault(); inputServicoRef.current?.focus(); }
            if(e.key === 'Escape') {
                setModalAplicacao({aberto:false, texto:'', nome:''});
                setModalFaturarAberto(false);
                setResultadosPecas([]); setResultadosServicos([]); setResultadosClientes([]);
            }
            if((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                if (!isFaturada) salvarOrdemServico();
            }
            if((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                imprimirOrdemServicoSilenciosa();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [clienteSelecionado, itensPecas, itensServicos, defeitoRelatado, isFaturada]);

    // ==========================================
    // 🚀 CÁLCULOS E SALVAMENTO
    // ==========================================
    const totalPecas = itensPecas.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    const totalServicos = itensServicos.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    const subtotalOS = totalPecas + totalServicos;

    const valorDescontoDigitado = parseFloat(descontoInput) || 0;
    const valorDescontoCalculado = tipoDesconto === 'PERCENTUAL'
        ? (subtotalOS * (valorDescontoDigitado / 100))
        : valorDescontoDigitado;

    const totalGeral = Math.max(0, subtotalOS - valorDescontoCalculado);
    const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const salvarOrdemServico = async () => {
        if(isFaturada) return;
        if(!clienteSelecionado) return notificar('erro', 'Selecione um cliente para a OS!');
        const servicoSemMecanico = itensServicos.find(s => !s.mecanicoId);
        if(servicoSemMecanico) return notificar('erro', `Falta selecionar o mecânico para o serviço: ${servicoSemMecanico.nome}`);

        const payload = {
            clienteId: clienteSelecionado.id,
            veiculoId: veiculoSelecionado || null,
            kmEntrada: kmVeiculo ? parseInt(kmVeiculo) : null,
            nivelCombustivel: nivelCombustivel,
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
            return true; // Retorna true para saber se deu certo
        } catch (error) {
            toast.error("Erro ao salvar a OS no servidor.", { id: loadId });
            return false;
        }
    };

    // ==========================================
    // 🚀 O BOTÃO VERDE (FATURAMENTO SEM NATIVE CONFIRM)
    // ==========================================
    const abrirModalFaturamento = () => {
        if (isFaturada) return notificar('aviso', 'Esta OS já foi faturada!');
        if (!osId) return notificar('erro', 'Salve a OS primeiro antes de faturar.');
        setModalFaturarAberto(true);
    };

    const confirmarFaturamento = async () => {
        setModalFaturarAberto(false);
        const salvou = await salvarOrdemServico(); // Salva possíveis edições finais
        if(!salvou) return;

        const loadId = toast.loading("Faturando Ordem de Serviço e baixando estoque...");
        try {
            await api.post(`/api/os/${osId}/faturar`);

            // 🚀 MÁGICA: Se preencheu a revisão, agenda no CRM!
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
                } catch(err) { console.log("Erro ao salvar revisão", err); }
            }

            setStatus('FATURADA');
            toast.success("OS Faturada com sucesso! Peças baixadas.", { id: loadId });
            if (onVoltar) setTimeout(() => onVoltar(), 2000);
        } catch (error) {
            const msg = error.response?.data?.message || "Erro ao faturar a OS.";
            toast.error(msg, { id: loadId });
        }
    };

    // ==========================================
    // 🚀 IMPRESSÃO SILENCIOSA VIA IFRAME
    // ==========================================
    const imprimirOrdemServicoSilenciosa = () => {
        if(!clienteSelecionado) return notificar('erro', 'Salve a OS com um cliente antes de imprimir.');
        const toastId = toast.loading('Gerando documento para impressão...');

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        const veiculoObj = clienteSelecionado?.veiculos?.find(v => v.id === parseInt(veiculoSelecionado));
        const nomeVeiculo = veiculoObj ? `${veiculoObj.marca} ${veiculoObj.modelo} - Placa: ${veiculoObj.placa}` : 'Não informado';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 20px; color: #000; font-size: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                    .header p { margin: 5px 0 0 0; font-size: 14px; }
                    .section-title { background: #eee; padding: 5px; font-weight: bold; text-transform: uppercase; border: 1px solid #ccc; margin-top: 15px; }
                    table { border-collapse: collapse; margin-top: 10px; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                    th { background: #f9f9f9; }
                    .text-right { text-align: right; }
                    .laudo-box { border: 1px solid #000; padding: 15px; margin-top: 5px; background: #fafafa; font-size: 13px; line-height: 1.5; min-height: 50px; }
                    .totals { width: 300px; float: right; margin-top: 20px; border: 1px solid #000; padding: 10px; }
                    .totals p { margin: 5px 0; display: flex; justify-content: space-between; font-weight: bold; }
                    .totals .final { font-size: 16px; border-top: 1px solid #000; padding-top: 5px; }
                    .clear { clear: both; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${empresaConfig.nomeFantasia}</h1>
                    <p>ORDEM DE SERVIÇO Nº ${osId || 'RASCUNHO'} - STATUS: ${status}</p>
                </div>

                <div class="section-title">Dados do Cliente e Veículo</div>
                <table>
                    <tr>
                        <td width="50%"><b>Cliente:</b> ${clienteSelecionado?.nome || 'Não informado'}</td>
                        <td width="50%"><b>Veículo:</b> ${nomeVeiculo}</td>
                    </tr>
                    <tr>
                        <td><b>KM Atual:</b> ${kmVeiculo || 'N/A'}</td>
                        <td><b>Combustível:</b> ${nivelCombustivel}</td>
                    </tr>
                </table>

                ${(observacoes && imprimirLaudo) ? `
                <div class="section-title">Parecer Técnico / O Que Foi Feito</div>
                <div class="laudo-box">
                    ${observacoes.replace(/\n/g, '<br/>')}
                </div>
                ` : ''}

                ${itensServicos.length > 0 ? `
                <div class="section-title">Mão de Obra (Serviços Executados)</div>
                <table>
                    <tr><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Valor Un.</th><th class="text-right">Subtotal</th></tr>
                    ${itensServicos.map(s => `<tr><td>${s.nome}</td><td class="text-right">${s.qtd}</td><td class="text-right">R$ ${formatarMoeda(s.preco)}</td><td class="text-right">R$ ${formatarMoeda(s.preco * s.qtd)}</td></tr>`).join('')}
                </table>` : ''}

                ${itensPecas.length > 0 ? `
                <div class="section-title">Peças e Produtos Aplicados</div>
                <table>
                    <tr><th>Código</th><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Valor Un.</th><th class="text-right">Subtotal</th></tr>
                    ${itensPecas.map(p => `<tr><td>${p.codigo}</td><td>${p.nome}</td><td class="text-right">${p.qtd}</td><td class="text-right">R$ ${formatarMoeda(p.preco)}</td><td class="text-right">R$ ${formatarMoeda(p.preco * p.qtd)}</td></tr>`).join('')}
                </table>` : ''}

                <div class="totals">
                    <p><span>Subtotal:</span> <span>R$ ${formatarMoeda(subtotalOS)}</span></p>
                    ${valorDescontoCalculado > 0 ? `<p><span>Desconto:</span> <span>- R$ ${formatarMoeda(valorDescontoCalculado)}</span></p>` : ''}
                    <p class="final"><span>TOTAL A PAGAR:</span> <span>R$ ${formatarMoeda(totalGeral)}</span></p>
                </div>
                <div class="clear"></div>

                <div style="margin-top: 50px; text-align: center;">
                    <p>____________________________________________________</p>
                    <p>Assinatura do Cliente / De Acordo</p>
                </div>

                <script> window.onload = function() { setTimeout(function() { window.print(); }, 400); } </script>
            </body>
            </html>
        `;
        doc.open(); doc.write(htmlContent); doc.close();
        toast.success("Documento enviado para a impressora!", { id: toastId });
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 10000);
    };

    const renderCombustivelVisual = () => {
        const niveis = [
            { id: 'RESERVA', cor: 'bg-red-500', titulo: 'Reserva' },
            { id: 'UM_QUARTO', cor: 'bg-orange-500', titulo: '1/4' },
            { id: 'MEIO_TANQUE', cor: 'bg-yellow-400', titulo: '1/2' },
            { id: 'TRES_QUARTOS', cor: 'bg-lime-400', titulo: '3/4' },
            { id: 'CHEIO', cor: 'bg-green-500', titulo: 'Cheio' },
        ];
        const indiceSelecionado = niveis.findIndex(n => n.id === nivelCombustivel);

        return (
            <div className={`flex items-center gap-1 w-full h-12 bg-slate-100 p-1.5 rounded-xl border-2 border-slate-200 ${isFaturada ? 'opacity-60 pointer-events-none' : ''}`}>
                {niveis.map((nivel, index) => {
                    const ativo = index <= indiceSelecionado;
                    return (
                        <div
                            key={nivel.id}
                            onClick={() => !isFaturada && setNivelCombustivel(nivel.id)}
                            title={nivel.titulo}
                            className={`flex-1 h-full rounded cursor-pointer transition-all duration-300 ${ativo ? nivel.cor + ' shadow-inner' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                            {index === indiceSelecionado && <span className="flex items-center justify-center h-full text-[10px] font-black text-white/90 drop-shadow-md">{nivel.titulo}</span>}
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative z-10 animate-fade-in custom-scrollbar overflow-y-auto p-4 md:p-8">

            {/* 🚀 CABEÇALHO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
                        <Wrench size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            ORDEM DE SERVIÇO {osId ? `#${osId}` : '- NOVA'}
                        </h1>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border mt-1 inline-block ${isFaturada ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            STATUS: {status}
                        </span>
                        {!isFaturada && (
                            <div className="hidden md:inline-flex items-center gap-2 ml-4">
                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase border border-slate-200">F2: Cliente</span>
                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase border border-slate-200">F3: Peça</span>
                                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase border border-slate-200">F4: Serviço</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {onVoltar && (
                        <button onClick={onVoltar} className="p-3 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm text-xs font-bold uppercase tracking-widest">
                            Voltar
                        </button>
                    )}
                    <button
                        onClick={salvarOrdemServico}
                        disabled={isFaturada}
                        title="Ctrl+S"
                        className={`flex-1 md:flex-none px-4 py-3 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs tracking-widest transition-transform ${isFaturada ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'}`}
                    >
                        <Save size={16}/> Salvar OS
                    </button>
                    <button onClick={imprimirOrdemServicoSilenciosa} title="Ctrl+P" className="p-3 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm">
                        <Printer size={18}/>
                    </button>
                    {osId && (
                        <>
                            <button
                                onClick={abrirModalFaturamento}
                                disabled={isFaturada}
                                className={`px-4 py-3 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs tracking-widest transition-all ${isFaturada ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'}`}
                            >
                                <CheckCircle size={16}/> {isFaturada ? 'FATURADO' : 'Faturar e Baixar Estoque'}
                            </button>
                            <button className={`p-3 rounded-xl transition-colors border ${isFaturada ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}`}>
                                <MessageCircle size={18}/>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isFaturada && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-2xl shadow-sm flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={24} />
                    <div>
                        <h4 className="font-black text-emerald-800 uppercase tracking-widest text-sm">Ordem de Serviço Fechada</h4>
                        <p className="text-xs font-medium text-emerald-700">Esta OS já foi faturada. O estoque foi baixado e os dados estão bloqueados para edição.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

                {/* 🚀 DADOS DO VEÍCULO E CLIENTE */}
                <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
                        <User size={16}/> 1. Identificação
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cliente *</label>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputClienteRef}
                                    type="text"
                                    value={buscaCliente}
                                    onChange={(e) => setBuscaCliente(e.target.value)}
                                    onKeyDown={(e) => onKeyDownBuscaGenerica(e, indexFocadoCliente, setIndexFocadoCliente, resultadosClientes, selecionarCliente, listaClientesRef)}
                                    disabled={!!clienteSelecionado || isFaturada}
                                    placeholder="Buscar Cliente (F2)..."
                                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 disabled:opacity-60 disabled:bg-slate-100"
                                />
                                {(clienteSelecionado && !isFaturada) && (
                                    <button onClick={removerCliente} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100" title="Trocar Cliente"><Trash2 size={18}/></button>
                                )}
                            </div>
                            {resultadosClientes.length > 0 && !clienteSelecionado && !isFaturada && (
                                <div ref={listaClientesRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {resultadosClientes.map((c, idx) => (
                                        <div key={c.id} onClick={() => selecionarCliente(c)} onMouseEnter={() => setIndexFocadoCliente(idx)} className={`p-3 cursor-pointer border-b font-bold text-sm ${idx === indexFocadoCliente ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-slate-800'}`}>
                                            {c.nome} {c.documento && <span className={`text-xs ml-2 ${idx === indexFocadoCliente ? 'text-indigo-200' : 'text-slate-400'}`}>({c.documento})</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Veículo *</label>
                            <select
                                value={veiculoSelecionado}
                                onChange={(e) => setVeiculoSelecionado(e.target.value)}
                                disabled={!clienteSelecionado || isFaturada}
                                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 disabled:opacity-60"
                            >
                                <option value="">Selecione o Veículo...</option>
                                {clienteSelecionado?.veiculos?.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Gauge size={12}/> KM Atual</label>
                            <input type="number" disabled={isFaturada} value={kmVeiculo} onChange={e => setKmVeiculo(e.target.value)} className="w-full h-12 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 disabled:opacity-60" placeholder="Ex: 54000" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Fuel size={12}/> Nível de Combustível</label>
                            {renderCombustivelVisual()}
                        </div>
                    </div>
                </div>

                {/* 🚀 CHECK-IN / DIAGNÓSTICO / PARECER */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 flex flex-col">
                    <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest border-b pb-2 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16}/> 2. Relatos e Parecer Técnico
                    </h3>

                    <div className="flex-1 space-y-3 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Reclamação do Cliente</label>
                            <textarea disabled={isFaturada} value={defeitoRelatado} onChange={e => setDefeitoRelatado(e.target.value)} placeholder="Ex: Barulho ao frear..." className="w-full p-2 bg-red-50/50 border-2 border-red-100 rounded-xl text-sm font-medium outline-none focus:border-red-300 resize-none min-h-[50px] disabled:opacity-60" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Diagnóstico (Mecânico)</label>
                            <textarea disabled={isFaturada} value={diagnosticoTecnico} onChange={e => setDiagnosticoTecnico(e.target.value)} placeholder="Ex: Pastilhas gastas..." className="w-full p-2 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl text-sm font-medium outline-none focus:border-emerald-300 resize-none min-h-[50px] disabled:opacity-60" />
                        </div>

                        {/* 🚀 CAMPO O QUE FOI FEITO COM REVISÃO AO LADO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3 mt-1">
                            {/* O que foi feito */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center">
                                        Laudo / O que foi Feito?
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer group bg-indigo-50 px-1.5 py-0.5 rounded hover:bg-indigo-100 transition-colors">
                                        <span className="text-[9px] font-bold text-indigo-700 uppercase">Imprimir?</span>
                                        <input type="checkbox" checked={imprimirLaudo} onChange={e => setImprimirLaudo(e.target.checked)} className="accent-indigo-600" />
                                    </label>
                                </div>
                                <textarea disabled={isFaturada} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Ex: Troca de pastilhas..." className="w-full p-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400 resize-none min-h-[60px] placeholder:text-indigo-300 shadow-inner disabled:opacity-60" />
                            </div>

                            {/* 🚀 AGENDAR PRÓXIMA REVISÃO CRM */}
                            <div className="flex flex-col bg-purple-50 p-2 rounded-xl border-2 border-purple-200 shadow-inner">
                                <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Calendar size={12}/> Próxima Revisão (CRM)
                                </label>
                                <input
                                    type="date"
                                    disabled={isFaturada}
                                    value={dataProximaRevisao}
                                    onChange={e => setDataProximaRevisao(e.target.value)}
                                    className="w-full mb-2 p-1.5 bg-white border border-purple-200 rounded text-xs font-bold text-purple-900 outline-none focus:border-purple-500 disabled:opacity-60"
                                />
                                <input
                                    type="text"
                                    disabled={isFaturada || !dataProximaRevisao}
                                    value={obsProximaRevisao}
                                    onChange={e => setObsProximaRevisao(e.target.value)}
                                    placeholder={dataProximaRevisao ? "Ex: Trocar correia dentada" : "Selecione a data primeiro..."}
                                    className="w-full p-1.5 bg-white border border-purple-200 rounded text-xs outline-none focus:border-purple-500 disabled:opacity-60 disabled:bg-purple-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚀 ÁREA MISTA: MÃO DE OBRA E PEÇAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* --- BLOCO MÃO DE OBRA --- */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-orange-50 border-b border-orange-100 p-4 relative">
                        <h3 className="font-black text-orange-800 uppercase tracking-widest text-sm flex items-center gap-2 mb-3">
                            <Wrench size={18}/> Mão de Obra (Serviços) <Tooltip texto="Busque os serviços (F4) e selecione qual mecânico vai executar cada um."/>
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                            <input
                                ref={inputServicoRef}
                                type="text"
                                value={buscaServico}
                                onChange={e => setBuscaServico(e.target.value)}
                                onKeyDown={(e) => onKeyDownBuscaGenerica(e, indexFocadoServico, setIndexFocadoServico, resultadosServicos, adicionarServico, listaServicosRef)}
                                disabled={isFaturada}
                                placeholder="Buscar Serviço (F4)..."
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-orange-200 rounded-xl text-sm font-bold shadow-sm focus:border-orange-500 outline-none disabled:opacity-60 disabled:bg-slate-100"
                            />
                            {resultadosServicos.length > 0 && !isFaturada && (
                                <div ref={listaServicosRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {resultadosServicos.map((serv, idx) => (
                                        <div key={serv.id} onClick={() => adicionarServico(serv)} onMouseEnter={() => setIndexFocadoServico(idx)} className={`p-3 cursor-pointer border-b flex justify-between items-center ${idx === indexFocadoServico ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 text-slate-800'}`}>
                                            <span className="font-bold text-sm">{serv.nome}</span>
                                            <span className="font-black">R$ {formatarMoeda(serv.preco)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[250px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 border-b border-slate-100">
                            <tr>
                                <th className="p-3">Serviço</th>
                                <th className="p-3">Mecânico Executante</th>
                                <th className="p-3 text-right">Valor</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itensServicos.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-400 font-bold">Nenhum serviço adicionado.</td></tr>}
                            {itensServicos.map((item) => (
                                <tr key={item.servicoId} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700 text-sm">{item.nome}</td>
                                    <td className="p-3">
                                        <select
                                            disabled={isFaturada}
                                            value={item.mecanicoId}
                                            onChange={(e) => setItensServicos(itensServicos.map(i => i.servicoId === item.servicoId ? { ...i, mecanicoId: e.target.value } : i))}
                                            className={`w-full p-2 rounded-lg font-bold text-xs outline-none border-2 transition-colors disabled:opacity-70 ${!item.mecanicoId ? 'bg-red-50 border-red-300 text-red-700 focus:border-red-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`}
                                        >
                                            <option value="">-- QUEM VAI FAZER? --</option>
                                            {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3 text-right font-black text-orange-600">R$ {formatarMoeda(item.preco)}</td>
                                    <td className="p-3 text-center">
                                        <button disabled={isFaturada} onClick={() => setItensServicos(itensServicos.filter(i => i.servicoId !== item.servicoId))} className="text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-300"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- BLOCO DE PEÇAS --- */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-blue-50 border-b border-blue-100 p-4 relative">
                        <h3 className="font-black text-blue-800 uppercase tracking-widest text-sm flex items-center gap-2 mb-3">
                            <Package size={18}/> Peças / Produtos <Tooltip texto="Busque por código, barras, aplicação ou referência cruzada (F3)."/>
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                            <input
                                ref={inputPecaRef}
                                type="text"
                                value={buscaPeca}
                                onChange={e => setBuscaPeca(e.target.value)}
                                disabled={isFaturada}
                                onKeyDown={(e) => {
                                    if(e.altKey && e.key === 'a' && indexFocadoPeca >= 0) {
                                        e.preventDefault();
                                        setModalAplicacao({ aberto: true, texto: resultadosPecas[indexFocadoPeca].aplicacao, nome: resultadosPecas[indexFocadoPeca].nome });
                                    } else {
                                        onKeyDownBuscaGenerica(e, indexFocadoPeca, setIndexFocadoPeca, resultadosPecas, adicionarPeca, listaPecasRef);
                                    }
                                }}
                                placeholder="Buscar Peça (F3)..."
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-sm font-bold shadow-sm focus:border-blue-500 outline-none disabled:opacity-60 disabled:bg-slate-100"
                            />
                            {resultadosPecas.length > 0 && !isFaturada && (
                                <div ref={listaPecasRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
                                    {resultadosPecas.map((peca, idx) => (
                                        <div key={peca.id} className={`p-3 border-b flex justify-between items-center cursor-pointer ${idx === indexFocadoPeca ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-800'}`} onMouseEnter={() => setIndexFocadoPeca(idx)}>
                                            <div className="flex items-center gap-3 flex-1" onClick={() => adicionarPeca(peca)}>
                                                <div className={`w-10 h-10 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 ${peca.fotoUrl ? '' : 'border border-slate-200'}`} onMouseEnter={() => peca.fotoUrl && setPreviewImagem(peca.fotoUrl)} onMouseLeave={() => setPreviewImagem(null)}>
                                                    {peca.fotoUrl ? <img src={peca.fotoUrl} alt="Peca" className="w-full h-full object-cover" /> : <ImageIcon size={16} className={idx === indexFocadoPeca ? "text-blue-300" : "text-slate-300"}/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight">{peca.nome}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-mono ${idx === indexFocadoPeca ? 'text-blue-200' : 'text-slate-500'}`}>{peca.sku}</span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${idx === indexFocadoPeca ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>Estoque: {peca.quantidadeEstoque}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={(e) => { e.stopPropagation(); setModalAplicacao({ aberto: true, texto: peca.aplicacao, nome: peca.nome }); }} className={`p-1.5 rounded transition-colors ${idx === indexFocadoPeca ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`} title="Ver Aplicação (Alt+A)"><Info size={16}/></button>
                                                <p className="font-black" onClick={() => adicionarPeca(peca)}>R$ {formatarMoeda(peca.precoVenda)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[250px] custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 border-b border-slate-100">
                            <tr>
                                <th className="p-3 w-12 text-center">Img</th>
                                <th className="p-3">Peça</th>
                                <th className="p-3 text-center w-16">Qtd</th>
                                <th className="p-3 text-right">Subtotal</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {itensPecas.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400 font-bold">Nenhuma peça adicionada.</td></tr>}
                            {itensPecas.map((item) => (
                                <tr key={item.produtoId} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-center">
                                        <div className="w-8 h-8 rounded bg-slate-100 mx-auto flex items-center justify-center overflow-hidden border border-slate-200" onMouseEnter={() => item.fotoUrl && setPreviewImagem(item.fotoUrl)} onMouseLeave={() => setPreviewImagem(null)}>
                                            {item.fotoUrl ? <img src={item.fotoUrl} alt="Peca" className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-slate-300"/>}
                                        </div>
                                    </td>
                                    <td className="p-3 font-bold text-slate-700 text-sm">
                                        <p className="truncate max-w-[150px]" title={item.nome}>{item.nome}</p>
                                        <p className="text-[9px] text-slate-400 font-mono">{item.codigo}</p>
                                    </td>
                                    <td className="p-3 text-center">
                                        <input disabled={isFaturada} type="number" value={item.qtd} onChange={(e) => setItensPecas(itensPecas.map(i => i.produtoId === item.produtoId ? { ...i, qtd: Math.max(1, parseInt(e.target.value) || 1) } : i))} className="w-12 p-1.5 text-center font-black bg-white border-2 border-slate-200 rounded outline-none focus:border-blue-500 text-xs disabled:opacity-70 disabled:bg-slate-100" />
                                    </td>
                                    <td className="p-3 text-right font-black text-blue-600">R$ {formatarMoeda(item.preco * item.qtd)}</td>
                                    <td className="p-3 text-center">
                                        <button disabled={isFaturada} onClick={() => setItensPecas(itensPecas.filter(i => i.produtoId !== item.produtoId))} className="text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-300"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🚀 RODAPÉ DE TOTAIS E NOVO DESCONTO (R$ e %) */}
            <div className="bg-slate-900 rounded-3xl border-t-4 border-indigo-500 p-6 flex flex-col lg:flex-row justify-between items-center shadow-2xl sticky bottom-4 z-40">
                <div className="flex items-center gap-6 mb-4 lg:mb-0">
                    <div className="text-slate-400">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Total Mão de Obra</p>
                        <p className="text-xl font-black text-orange-400">R$ {formatarMoeda(totalServicos)}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-700"></div>
                    <div className="text-slate-400">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Total Peças</p>
                        <p className="text-xl font-black text-blue-400">R$ {formatarMoeda(totalPecas)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">

                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desconto</p>
                            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                                <button
                                    onClick={() => setTipoDesconto('VALOR')}
                                    disabled={isFaturada}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded transition-colors ${tipoDesconto === 'VALOR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    R$
                                </button>
                                <button
                                    onClick={() => setTipoDesconto('PERCENTUAL')}
                                    disabled={isFaturada}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded transition-colors ${tipoDesconto === 'PERCENTUAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    %
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-500">
                                {tipoDesconto === 'VALOR' ? 'R$' : '%'}
                            </span>
                            <input
                                disabled={isFaturada}
                                type="number"
                                value={descontoInput}
                                onChange={e => setDescontoInput(e.target.value)}
                                className="w-32 py-2 pr-3 pl-8 bg-slate-800 border border-slate-700 text-red-400 font-black rounded-lg text-right outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800 px-6 py-3 rounded-2xl shadow-inner border border-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Total Final da OS</span>
                        <h2 className="text-4xl font-black text-emerald-400 tracking-tighter leading-none">R$ {formatarMoeda(totalGeral)}</h2>
                    </div>
                </div>
            </div>

            {/* 🚀 MODAL PROFISSIONAL DE CONFIRMAÇÃO DE FATURAMENTO */}
            {modalFaturarAberto && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-center border-t-4 border-emerald-500">
                        <div className="p-8">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <DollarSign size={40} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Faturar Ordem de Serviço?</h2>
                            <p className="text-slate-500 font-medium mb-6">
                                Esta ação irá <b className="text-emerald-600">receber o valor no caixa</b> e <b className="text-red-500">baixar as peças do estoque definitivamente</b>. A OS não poderá mais ser alterada.
                            </p>

                            {dataProximaRevisao && (
                                <div className="bg-purple-50 text-purple-700 p-3 rounded-xl text-xs font-bold mb-6 flex items-center justify-center gap-2 border border-purple-200">
                                    <Calendar size={14}/> Uma revisão será agendada no CRM para {new Date(dataProximaRevisao).toLocaleDateString('pt-BR')}.
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => setModalFaturarAberto(false)} className="flex-1 p-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs">
                                    Cancelar
                                </button>
                                <button onClick={confirmarFaturamento} className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-black hover:bg-emerald-600 transition-transform hover:scale-105 uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/30">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚀 OVERLAYS (FOTO E APLICAÇÃO) */}
            {previewImagem && (
                <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-2 rounded-3xl shadow-2xl">
                        <img src={previewImagem} alt="Preview" className="max-w-2xl max-h-[70vh] rounded-2xl object-contain" />
                    </div>
                </div>
            )}

            {modalAplicacao.aberto && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 text-left">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-lg flex items-center gap-2"><Car size={20}/> Aplicação Veicular</h3>
                                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">{modalAplicacao.nome}</p>
                            </div>
                            <button onClick={() => setModalAplicacao({aberto:false, texto:'', nome:''})} className="bg-blue-500 hover:bg-red-500 p-2 rounded-xl transition-colors">Fechar (Esc)</button>
                        </div>
                        <div className="p-6 bg-slate-50 max-h-[60vh] overflow-y-auto">
                            {modalAplicacao.texto ? modalAplicacao.texto.split(/[;|\n,\/]/).map((linha, idx) => linha.trim() && (
                                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-sm mb-2 shadow-sm flex items-center gap-3"><Car size={16} className="text-blue-500"/> {linha}</div>
                            )) : <p className="text-center text-slate-400 font-bold p-10">Nenhuma aplicação cadastrada para esta peça.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};