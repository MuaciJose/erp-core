import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Alert, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { useAudioPlayer } from 'expo-audio'; // 🚀 1. NOVO MOTOR DE ÁUDIO RECRUTADO
import api from '../api/axios';
import { getApiBaseUrl, getAuthHeaders } from '../api/session';

export default function OrcamentoMobile({ onVoltar }) {
    // ============================================================================
    // ⚙️ ESTADOS DA APLICAÇÃO
    // ============================================================================
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [modalCliente, setModalCliente] = useState(false);
    const [buscaCliente, setBuscaCliente] = useState('');
    const [resultadosCliente, setResultadosCliente] = useState([]);
    const [buscandoCliente, setBuscandoCliente] = useState(false);

    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [kmVeiculo, setKmVeiculo] = useState('');
    const [desconto, setDesconto] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const [carrinho, setCartinho] = useState([]);
    const [busca, setBusca] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [resultados, setResultados] = useState([]);

    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // ============================================================================
    // 🔊 NOVO MOTOR DE ÁUDIO (EXPO-AUDIO)
    // ============================================================================
    const playerBip = useAudioPlayer(require('../../assets/bip.mp3'));

    const tocarBip = () => {
        playerBip.seekTo(0);
        playerBip.play();
    };

    // ============================================================================
    // 👤 BUSCA INTELIGENTE DE CLIENTES
    // ============================================================================
    useEffect(() => {
        const delay = setTimeout(() => {
            if (buscaCliente.trim().length >= 1) caçarCliente(buscaCliente);
            else setResultadosCliente([]);
        }, 250);
        return () => clearTimeout(delay);
    }, [buscaCliente]);

    const caçarCliente = async (termo) => {
        setBuscandoCliente(true);
        try {
            const termosBusca = termo.toLowerCase().split(' ').filter(t => t.trim() !== '');
            const termoPrincipal = encodeURIComponent(termosBusca[0]);

            const res = await api.get(`/api/parceiros?busca=${termoPrincipal}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);

            const resultadosInteligentes = lista.filter(cli => {
                const textoDoCliente = `${cli.nome || ''} ${cli.cpfCnpj || ''}`.toLowerCase();
                return termosBusca.every(t => textoDoCliente.includes(t));
            });

            setResultadosCliente(resultadosInteligentes);
        } catch (error) {
            console.log(error);
        } finally {
            setBuscandoCliente(false);
        }
    };

    const escolherCliente = async (cliente) => {
        setClienteSelecionado(cliente);
        setModalCliente(false);
        setBuscaCliente('');
        setResultadosCliente([]);
        setVeiculoSelecionado(null);
        setKmVeiculo('');

        Toast.show({ type: 'success', text1: 'Cliente Vinculado!', text2: 'A buscar veículos...' });

        try {
            const res = await api.get(`/api/veiculos/cliente/${cliente.id}`);
            const veiculos = res.data || [];
            setClienteSelecionado({ ...cliente, veiculos: veiculos });

            if (veiculos.length === 1) {
                setVeiculoSelecionado(veiculos[0]);
                if (veiculos[0].km) setKmVeiculo(veiculos[0].km.toString());
            }
        } catch (error) {
            console.log("Erro ao buscar veículos", error);
        }
    };

    const removerCliente = () => {
        setClienteSelecionado(null);
        setVeiculoSelecionado(null);
        setKmVeiculo('');
        Toast.show({ type: 'info', text1: 'Alterado para Consumidor Final' });
    };

    // ============================================================================
    // 🔍 BUSCA INTELIGENTE DE PEÇAS
    // ============================================================================
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busca.trim().length >= 1) realizarBusca(busca);
            else setResultados([]);
        }, 250);
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    const realizarBusca = async (termo) => {
        setBuscando(true);
        try {
            const termosBusca = termo.toLowerCase().split(' ').filter(t => t.trim() !== '');
            const termoPrincipal = encodeURIComponent(termosBusca[0]);

            const res = await api.get(`/api/produtos?busca=${termoPrincipal}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);

            const resultadosInteligentes = lista.filter(peca => {
                const textoDaPeca = `${peca.nome || ''} ${peca.sku || ''} ${peca.codigoBarras || ''}`.toLowerCase();
                return termosBusca.every(t => textoDaPeca.includes(t));
            });

            setResultados(resultadosInteligentes);
        } catch (error) {
            console.log(error);
        } finally {
            setBuscando(false);
        }
    };

    const lidarComScan = async ({ data }) => {
        setCameraAtiva(false);
        setBuscando(true);
        try {
            const res = await api.get(`/api/produtos?busca=${data}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            const prod = lista.find(p => p.codigoBarras === data || p.sku === data);

            if (prod) {
                tocarBip(); // 🚀 2. TOCA O BIP AO ENCONTRAR NO SCANNER!
                adicionarAoCarrinho(prod);
            } else {
                Toast.show({ type: 'error', text1: 'Peça não encontrada!' });
            }
        } catch (error) { Toast.show({ type: 'error', text1: 'Erro ao buscar código!' }); } finally { setBuscando(false); }
    };

    const abrirCamera = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) return Toast.show({ type: 'error', text1: 'Câmera bloqueada!' });
        }
        setCameraAtiva(true);
    };

    // ============================================================================
    // 🛒 GESTÃO DO CARRINHO
    // ============================================================================
    const adicionarAoCarrinho = (produto) => {
        const itemExistente = carrinho.find(item => item.id === produto.id);
        if (itemExistente) {
            setCartinho(carrinho.map(item => item.id === produto.id ? { ...item, qtde: item.qtde + 1 } : item));
        } else {
            setCartinho([{ ...produto, qtde: 1 }, ...carrinho]);
        }
        setBusca('');
        setResultados([]);
        Toast.show({ type: 'success', text1: 'Adicionado!', text2: produto.nome });
    };

    const alterarQuantidade = (id, delta) => {
        setCartinho(carrinho.map(item => {
            if (item.id === id) return { ...item, qtde: Math.max(1, item.qtde + delta) };
            return item;
        }));
    };

    const removerItem = (id) => setCartinho(carrinho.filter(item => item.id !== id));

    const subtotal = carrinho.reduce((acc, item) => acc + ((item.precoVenda || 0) * item.qtde), 0);
    const valorDescontoReal = parseFloat(desconto.replace(',', '.')) || 0;
    const totalFinal = Math.max(0, subtotal - valorDescontoReal);
    const quantidadeItens = carrinho.reduce((acc, item) => acc + item.qtde, 0);

    // ============================================================================
    // 🚀 SALVAR NO ERP
    // ============================================================================
    const gravarNoSistema = async (tipo) => {
        if (carrinho.length === 0) return Toast.show({ type: 'error', text1: 'Carrinho vazio!' });

        setSalvando(true);
        try {
            const payload = {
                observacoes: observacoes || (tipo === 'orcamento' ? "Orçamento salvo via Mobile" : "Venda iniciada via Mobile"),
                parceiroId: clienteSelecionado ? clienteSelecionado.id : null,
                veiculoId: veiculoSelecionado ? veiculoSelecionado.id : null,
                kmVeiculo: kmVeiculo ? parseInt(kmVeiculo) : null,
                desconto: valorDescontoReal,
                itens: carrinho.map(item => ({
                    produtoId: item.id,
                    quantidade: item.qtde,
                    precoUnitario: item.precoVenda || 0
                }))
            };

            const endpoint = tipo === 'orcamento' ? '/api/vendas/orcamento' : '/api/vendas/pedido';

            const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
            });

            if (!response.ok) {
                const erroTexto = await response.text();
                throw new Error(erroTexto || 'Erro ao gerar documento no servidor');
            }

            const vendaCriada = await response.json();

            Alert.alert(
                tipo === 'orcamento' ? "Orçamento Salvo! 📝" : "Pedido Registado! 🎉",
                tipo === 'orcamento'
                    ? `O Orçamento #${vendaCriada.id} foi guardado no sistema.`
                    : `O Pedido #${vendaCriada.id} foi enviado para o Caixa e Separação.`,
                [{ text: "OK, Limpar Tudo", onPress: () => limparTudo() }]
            );

        } catch (error) {
            Toast.show({ type: 'error', text1: 'Falha ao Gravar:', text2: error.message });
        } finally {
            setSalvando(false);
        }
    };

    const limparTudo = () => {
        setCartinho([]);
        setClienteSelecionado(null);
        setVeiculoSelecionado(null);
        setKmVeiculo('');
        setDesconto('');
        setObservacoes('');
    };

    const enviarWhatsApp = () => {
        if (carrinho.length === 0) return Toast.show({ type: 'error', text1: 'Carrinho vazio!' });

        let texto = `*ORÇAMENTO DE PEÇAS*\n`;
        texto += `👤 Cliente: *${clienteSelecionado ? clienteSelecionado.nome : 'Consumidor Final'}*\n`;
        if (veiculoSelecionado) texto += `🚗 Veículo: *${veiculoSelecionado.marca} ${veiculoSelecionado.modelo}*\n`;
        texto += `\n`;

        carrinho.forEach(item => {
            texto += `🔹 ${item.qtde}x ${item.nome}\n   *R$ ${((item.precoVenda || 0) * item.qtde).toFixed(2)}*\n\n`;
        });

        if (valorDescontoReal > 0) texto += `Desconto: - R$ ${valorDescontoReal.toFixed(2)}\n`;
        texto += `*TOTAL GERAL: R$ ${totalFinal.toFixed(2)}*\n\n`;

        const url = `whatsapp://send?text=${encodeURIComponent(texto)}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Toast.show({ type: 'error', text1: 'WhatsApp não instalado!' });
        });
    };

    // ============================================================================
    // 🎨 RENDERIZAÇÃO
    // ============================================================================
    if (cameraAtiva) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={lidarComScan} />
                <TouchableOpacity onPress={() => setCameraAtiva(false)} style={styles.btnVoltarScan}>
                    <Text style={styles.btnTextoBranco}>CANCELAR</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                    <Text style={styles.titulo}>PDV Mobile</Text>
                    <Text style={styles.subtitulo}>{carrinho.length} itens no carrinho</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.heroCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroKicker}>Balcão mobile</Text>
                        <Text style={styles.heroTitle}>Monte orçamento ou pedido</Text>
                        <Text style={styles.heroSubtitle}>Cliente, veículo, peças e fechamento em um fluxo só, com foco comercial.</Text>
                    </View>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeLabel}>Itens</Text>
                        <Text style={styles.heroBadgeValue}>{quantidadeItens}</Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Cliente</Text>
                        <Text style={styles.summaryValue} numberOfLines={1}>{clienteSelecionado?.nome || 'Consumidor final'}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Veículo</Text>
                        <Text style={styles.summaryValue} numberOfLines={1}>{veiculoSelecionado?.placa || 'Não vinculado'}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total</Text>
                        <Text style={styles.summaryValue}>R$ {totalFinal.toFixed(2)}</Text>
                    </View>
                </View>

                {/* CAIXA DO CLIENTE */}
                <TouchableOpacity style={styles.clienteBox} onPress={() => setModalCliente(true)}>
                    <View style={[styles.iconeCliente, clienteSelecionado ? {backgroundColor: '#ca8a04'} : {backgroundColor: '#f1f5f9'}]}>
                        <Feather name="user" size={20} color={clienteSelecionado ? "#fff" : "#94a3b8"} />
                    </View>
                    <View style={{flex: 1, marginLeft: 15}}>
                        <Text style={styles.lblCliente}>CLIENTE VINCULADO</Text>
                        <Text style={[styles.txtClienteNome, !clienteSelecionado && {color: '#94a3b8'}]} numberOfLines={1}>
                            {clienteSelecionado?.nome || 'Consumidor Final (Toque para alterar)'}
                        </Text>
                    </View>
                    {clienteSelecionado ? (
                        <TouchableOpacity onPress={removerCliente} style={{padding: 5}}>
                            <Feather name="x-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    ) : (
                        <Feather name="chevron-right" size={20} color="#cbd5e1" />
                    )}
                </TouchableOpacity>

                {/* CAIXA DE VEÍCULOS */}
                {clienteSelecionado?.veiculos?.length > 0 && (
                    <View style={styles.veiculoContainer}>
                        <Text style={styles.lblSessao}>Selecione o Veículo:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                            {clienteSelecionado.veiculos.map(v => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[styles.chipVeiculo, veiculoSelecionado?.id === v.id && styles.chipVeiculoAtivo]}
                                    onPress={() => {
                                        setVeiculoSelecionado(v);
                                        if (v.km) setKmVeiculo(v.km.toString());
                                    }}
                                >
                                    <Feather name="truck" size={14} color={veiculoSelecionado?.id === v.id ? "#fff" : "#64748b"} />
                                    <Text style={[styles.txtChipVeiculo, veiculoSelecionado?.id === v.id && {color: '#fff'}]}>
                                        {v.marca} {v.modelo} ({v.placa})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {veiculoSelecionado && (
                            <View style={styles.kmBox}>
                                <Text style={styles.lblSessao}>KM Atual:</Text>
                                <TextInput
                                    style={styles.inputKm}
                                    placeholder="Ex: 50000"
                                    keyboardType="numeric"
                                    value={kmVeiculo}
                                    onChangeText={setKmVeiculo}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* BARRA DE BUSCA E SCANNER */}
                <View style={styles.buscaContainer}>
                    <View style={styles.inputWrapper}>
                        <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar ou Bipar Peça..."
                            value={busca}
                            onChangeText={setBusca}
                        />
                        {buscando && <ActivityIndicator size="small" color="#2563eb" style={{position: 'absolute', right: 65}} />}
                        <TouchableOpacity onPress={abrirCamera} style={styles.btnScan}>
                            <Feather name="maximize" size={20} color="#2563eb" />
                        </TouchableOpacity>
                    </View>

                    {resultados.length > 0 && (
                        <View style={styles.resultadosBox}>
                            {resultados.slice(0, 4).map(prod => (
                                <TouchableOpacity key={prod.id} style={styles.itemResultado} onPress={() => {
                                    tocarBip(); // 🚀 TAMBÉM TOCA BIP AO SELECIONAR DA LISTA!
                                    adicionarAoCarrinho(prod);
                                }}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.resNome} numberOfLines={1}>{prod.nome}</Text>
                                        <Text style={styles.resSku}>{prod.sku} • R$ {(prod.precoVenda||0).toFixed(2)}</Text>
                                    </View>
                                    <Feather name="plus-circle" size={24} color="#10b981" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* LISTA DO CARRINHO */}
                <View style={styles.carrinhoList}>
                    {carrinho.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Feather name="shopping-cart" size={60} color="#cbd5e1" />
                            <Text style={styles.emptyTxt}>Carrinho Vazio</Text>
                            <Text style={styles.emptySub}>Busque ou bipe peças para vender</Text>
                        </View>
                    ) : (
                        carrinho.map(item => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={styles.cartInfo}>
                                    <Text style={styles.cartNome} numberOfLines={2}>{item.nome}</Text>
                                    <Text style={styles.cartPreco}>R$ {((item.precoVenda || 0) * item.qtde).toFixed(2)}</Text>
                                </View>

                                <View style={styles.cartControles}>
                                    <TouchableOpacity onPress={() => alterarQuantidade(item.id, -1)} style={styles.btnQtd}>
                                        <Feather name="minus" size={18} color="#475569" />
                                    </TouchableOpacity>
                                    <Text style={styles.txtQtd}>{item.qtde}</Text>
                                    <TouchableOpacity onPress={() => alterarQuantidade(item.id, 1)} style={styles.btnQtd}>
                                        <Feather name="plus" size={18} color="#475569" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removerItem(item.id)} style={styles.btnRemover}>
                                        <Feather name="trash-2" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* OBSERVAÇÕES */}
                <View style={styles.obsBox}>
                    <Text style={styles.lblSessao}>Observações / Anotações:</Text>
                    <TextInput
                        style={styles.inputObs}
                        placeholder="Garantia especial, validade, condições..."
                        multiline
                        numberOfLines={3}
                        value={observacoes}
                        onChangeText={setObservacoes}
                    />
                </View>
            </ScrollView>

            {/* RODAPÉ */}
            <View style={styles.footer}>
                <View style={styles.rowEntre}>
                    <Text style={styles.lblResumo}>Subtotal:</Text>
                    <Text style={styles.valResumo}>R$ {subtotal.toFixed(2)}</Text>
                </View>

                <View style={[styles.rowEntre, { borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 10, marginBottom: 10 }]}>
                    <Text style={[styles.lblResumo, { color: '#ef4444' }]}>Desconto (R$):</Text>
                    <TextInput
                        style={styles.inputDesconto}
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={desconto}
                        onChangeText={setDesconto}
                    />
                </View>

                <View style={styles.totalBox}>
                    <Text style={styles.lblTotal}>TOTAL A PAGAR</Text>
                    <Text style={styles.valTotal}>R$ {totalFinal.toFixed(2)}</Text>
                </View>

                <View style={styles.botoesAcao}>
                    <TouchableOpacity style={styles.btnZap} onPress={enviarWhatsApp}>
                        <Feather name="message-circle" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.btnOrcamento, salvando && {opacity: 0.7}]} onPress={() => gravarNoSistema('orcamento')} disabled={salvando}>
                        <Feather name="save" size={18} color="#fff" />
                        <Text style={styles.txtBtnAcao}>Salvar Orç.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.btnFinalizar, salvando && {opacity: 0.7}]} onPress={() => gravarNoSistema('pedido')} disabled={salvando}>
                        <Feather name="check-circle" size={18} color="#fff" />
                        <Text style={styles.txtBtnAcao}>P/ Caixa</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* MODAL DE CLIENTES */}
            <Modal visible={modalCliente} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalClienteBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitulo}>Buscar Cliente</Text>
                            <TouchableOpacity onPress={() => setModalCliente(false)} style={styles.btnFecharModal}>
                                <Feather name="x" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15}}>
                            <View style={[styles.modalInputBox, {flex: 1, marginBottom: 0}]}>
                                <Feather name="search" size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Digite o nome ou CPF do cliente..."
                                    value={buscaCliente}
                                    onChangeText={setBuscaCliente}
                                    autoFocus
                                />
                                {buscandoCliente && <ActivityIndicator size="small" color="#ca8a04" />}
                            </View>

                            {/* 🚀 BOTÃO PARA CRIAR CLIENTE NOVO NA HORA */}
                            <TouchableOpacity
                                onPress={() => { setModalCliente(false); /* Aqui você pode acionar uma rota se quiser */ }}
                                style={{backgroundColor: '#ca8a04', padding: 15, borderRadius: 16}}
                            >
                                <Feather name="user-plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalLista} keyboardShouldPersistTaps="handled">
                            {resultadosCliente.length > 0 ? (
                                resultadosCliente.map(cli => (
                                    <TouchableOpacity key={cli.id} style={styles.itemClienteModal} onPress={() => escolherCliente(cli)}>
                                        <View style={styles.modalIconeCliente}><Feather name="user" size={18} color="#ca8a04" /></View>
                                        <View>
                                            <Text style={styles.modalNomeCliente}>{cli.nome}</Text>
                                            <Text style={styles.modalDocCliente}>{cli.cpfCnpj || 'Documento não informado'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                buscaCliente.length >= 2 && !buscandoCliente && (
                                    <View style={styles.emptyModalBox}>
                                        <Feather name="user-x" size={40} color="#cbd5e1" />
                                        <Text style={styles.emptyModalTxt}>Cliente não encontrado.</Text>
                                    </View>
                                )
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#ca8a04', fontWeight: 'bold' },
    heroCard: {
        margin: 15,
        marginBottom: 0,
        backgroundColor: '#111827',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        gap: 12
    },
    heroKicker: { fontSize: 10, fontWeight: '900', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: 1 },
    heroTitle: { fontSize: 20, fontWeight: '900', color: '#f9fafb', marginTop: 6 },
    heroSubtitle: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginTop: 8, lineHeight: 18 },
    heroBadge: {
        minWidth: 76,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    heroBadgeLabel: { fontSize: 9, fontWeight: '900', color: '#fcd34d', textTransform: 'uppercase' },
    heroBadgeValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 6 },
    summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 15, marginTop: 12 },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14
    },
    summaryLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
    summaryValue: { fontSize: 13, fontWeight: '900', color: '#1e293b', marginTop: 8 },
    clienteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, marginBottom: 0, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    iconeCliente: { padding: 10, borderRadius: 12 },
    lblCliente: { fontSize: 10, fontWeight: 'black', color: '#94a3b8', letterSpacing: 1 },
    txtClienteNome: { fontSize: 14, fontWeight: '900', color: '#1e293b', marginTop: 2 },
    veiculoContainer: { marginHorizontal: 15, marginTop: 15, padding: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    lblSessao: { fontSize: 11, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: 5 },
    chipVeiculo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginRight: 10, gap: 8 },
    chipVeiculoAtivo: { backgroundColor: '#3b82f6' },
    txtChipVeiculo: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
    kmBox: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputKm: { flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontWeight: 'bold' },
    buscaContainer: { padding: 15, zIndex: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#ca8a04', borderRadius: 16, overflow: 'hidden' },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    btnScan: { padding: 15, backgroundColor: '#fefce8', borderLeftWidth: 1, borderLeftColor: '#fef08a' },
    resultadosBox: { position: 'absolute', top: 75, left: 15, right: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 10 },
    itemResultado: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    resNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    resSku: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '900' },
    carrinhoList: { paddingHorizontal: 15, paddingBottom: 10 },
    cartItem: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
    cartInfo: { flex: 1, paddingRight: 10 },
    cartNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    cartPreco: { fontSize: 16, fontWeight: '900', color: '#ca8a04', marginTop: 5 },
    cartControles: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 5 },
    btnQtd: { padding: 10, backgroundColor: '#fff', borderRadius: 8 },
    txtQtd: { marginHorizontal: 15, fontSize: 16, fontWeight: 'black', color: '#1e293b' },
    btnRemover: { padding: 10, marginLeft: 5 },
    obsBox: { marginHorizontal: 15, marginBottom: 20, padding: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    inputObs: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 60, textAlignVertical: 'top' },
    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    rowEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    lblResumo: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
    valResumo: { fontSize: 16, fontWeight: 'black', color: '#1e293b' },
    inputDesconto: { width: 100, textAlign: 'right', fontSize: 16, fontWeight: 'black', color: '#ef4444', backgroundColor: '#fef2f2', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
    totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    lblTotal: { fontSize: 12, fontWeight: 'black', color: '#64748b' },
    valTotal: { fontSize: 24, fontWeight: 'black', color: '#10b981' },
    botoesAcao: { flexDirection: 'row', gap: 8 },
    btnZap: { backgroundColor: '#22c55e', width: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    btnOrcamento: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnFinalizar: { flex: 1, backgroundColor: '#ca8a04', paddingVertical: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    txtBtnAcao: { color: '#fff', fontSize: 13, fontWeight: 'black' },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },
    emptyBox: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
    emptyTxt: { marginTop: 10, fontSize: 18, fontWeight: 'black', color: '#94a3b8' },
    emptySub: { marginTop: 5, fontSize: 14, fontWeight: 'bold', color: '#cbd5e1' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalClienteBox: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitulo: { fontSize: 20, fontWeight: 'black', color: '#1e293b' },
    btnFecharModal: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 12 },
    modalInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15 },
    modalInput: { flex: 1, paddingVertical: 15, paddingLeft: 10, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    modalLista: { flex: 1 },
    itemClienteModal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalIconeCliente: { backgroundColor: '#fefce8', padding: 10, borderRadius: 10, marginRight: 15 },
    modalNomeCliente: { fontSize: 16, fontWeight: 'black', color: '#1e293b' },
    modalDocCliente: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginTop: 2 },
    emptyModalBox: { alignItems: 'center', marginTop: 40 },
    emptyModalTxt: { marginTop: 10, color: '#94a3b8', fontWeight: 'bold' }
});
