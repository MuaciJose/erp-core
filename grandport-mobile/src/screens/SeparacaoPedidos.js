import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { Audio } from 'expo-av'; // 🚀 1. RECRUTANDO O MOTOR DE ÁUDIO
import api from '../api/axios';

export default function SeparacaoPedidos({ onVoltar }) {
    const [numPedido, setNumPedido] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [pedidoAtual, setPedidoAtual] = useState(null);

    // Motor da Câmera
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // 🚀 2. ESTADO DO SOM DO BIP
    const [somBip, setSomBip] = useState();

    // ============================================================================
    // 🔊 MOTOR DE ÁUDIO (CARREGAMENTO E DISPARO)
    // ============================================================================
    async function carregarSom() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/bip.mp3') // Certifique-se que o arquivo existe nesta pasta!
            );
            setSomBip(sound);
        } catch (error) {
            console.log("Erro ao carregar áudio:", error);
        }
    }

    async function tocarBip() {
        if (somBip) {
            await somBip.replayAsync(); // Toca instantaneamente
        }
    }

    useEffect(() => {
        carregarSom();
        return () => {
            if (somBip) somBip.unloadAsync(); // Limpa a memória ao sair da tela
        };
    }, []);

    // ============================================================================
    // 🔍 BUSCA DO PEDIDO (COM TRAVA DE SEGURANÇA)
    // ============================================================================
    const buscarPedido = async () => {
        if (numPedido.length < 1) return Toast.show({ type: 'info', text1: 'Digite o número do pedido' });

        setBuscando(true);
        try {
            // 🚀 BATE NA SUA ROTA REAL DE VENDAS DO SPRING BOOT
            const res = await api.get(`/api/vendas/${numPedido}`);
            const vendaDb = res.data;

            // 🚀 TRAVA DE SEGURANÇA REATIVADA: Bloqueia pedidos já separados
            if (vendaDb.status === 'CONCLUIDA' || vendaDb.status === 'AGUARDANDO_PAGAMENTO') {
                setNumPedido('');
                return Alert.alert(
                    "Pedido já Separado! ⚠️",
                    `Este pedido (#${vendaDb.id}) já foi conferido e está no Caixa ou já foi Entregue.\n\nNão é permitido separar novamente.`
                );
            }

            if (!vendaDb.itens || vendaDb.itens.length === 0) {
                return Toast.show({ type: 'error', text1: 'Pedido Vazio!', text2: 'Esta venda não possui itens.' });
            }

            // Mapeia os itens do Java para o formato do nosso Coletor
            const itensMapeados = vendaDb.itens.map(itemVenda => ({
                id: itemVenda.id,
                produto: itemVenda.produto,
                qtdeSolicitada: itemVenda.quantidade,
                qtdeSeparada: 0
            }));

            // Monta o cabeçalho do pedido
            setPedidoAtual({
                numero: vendaDb.id,
                cliente: vendaDb.cliente?.nome || 'CONSUMIDOR FINAL',
                vendedor: vendaDb.vendedorNome || 'Não informado',
                status: vendaDb.status,
                itens: itensMapeados,
                dadosOriginais: vendaDb // 🚀 Guardado para podermos fechar o pedido depois
            });

            Toast.show({ type: 'success', text1: 'Ordem de Separação Localizada!' });
        } catch (error) {
            console.log(error);
            Toast.show({ type: 'error', text1: 'Erro ao buscar', text2: 'Pedido não encontrado ou erro de rede.' });
        } finally {
            setBuscando(false);
        }
    };

    // ============================================================================
    // 📸 MOTOR DE SCANNER (VALIDAÇÃO DE PEÇA E BIP)
    // ============================================================================
    const abrirCamera = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) return Toast.show({ type: 'error', text1: 'Câmera bloqueada!' });
        }
        setCameraAtiva(true);
    };

    const lidarComScan = async ({ data }) => {
        setCameraAtiva(false); // Fecha a câmera

        if (!pedidoAtual) return;

        // Procura se a peça lida pertence a este pedido
        const itemEncontrado = pedidoAtual.itens.find(i =>
            i.produto.codigoBarras === data || i.produto.sku === data
        );

        if (!itemEncontrado) {
            return Toast.show({ type: 'error', text1: '⚠️ ERRO DE SEPARAÇÃO', text2: 'Esta peça NÃO pertence a este pedido!', visibilityTime: 5000 });
        }

        if (itemEncontrado.qtdeSeparada >= itemEncontrado.qtdeSolicitada) {
            return Toast.show({ type: 'info', text1: 'Atenção', text2: 'Você já separou todas as unidades desta peça!' });
        }

        // 🚀 3. TOCA O BIP ASSIM QUE A PEÇA FOR VALIDADA COM SUCESSO!
        await tocarBip();

        // Atualiza a quantidade separada
        const novosItens = pedidoAtual.itens.map(i => {
            if (i.id === itemEncontrado.id) {
                return { ...i, qtdeSeparada: i.qtdeSeparada + 1 };
            }
            return i;
        });

        setPedidoAtual({ ...pedidoAtual, itens: novosItens });
        Toast.show({ type: 'success', text1: '✅ Peça Correta!', text2: `${itemEncontrado.produto.nome} conferido.` });
    };

    // ============================================================================
    // 🚀 FINALIZAR SEPARAÇÃO E MANDAR PRO CAIXA (JAVA)
    // ============================================================================
    const finalizarSeparacao = async () => {
        const incompleto = pedidoAtual.itens.some(i => i.qtdeSeparada < i.qtdeSolicitada);

        if (incompleto) {
            return Toast.show({ type: 'error', text1: 'Pedido Incompleto!', text2: 'Ainda faltam peças para separar.' });
        }

        setSalvando(true);
        try {
            // 🚀 ENVIO REAL PARA O JAVA MUDANDO O STATUS!
            const payload = {
                ...pedidoAtual.dadosOriginais,
                status: 'AGUARDANDO_PAGAMENTO',
                observacoes: (pedidoAtual.dadosOriginais.observacoes || "") + "\n[Separação realizada via Mobile]"
            };

            await api.put(`/api/vendas/${pedidoAtual.numero}`, payload);

            Alert.alert("Sucesso! ✅", "Separação concluída. O pedido foi enviado para o Caixa e a baixa no estoque foi autorizada.");
            setPedidoAtual(null);
            setNumPedido('');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao fechar pedido no servidor' });
        } finally {
            setSalvando(false);
        }
    };

    const progresso = pedidoAtual ?
        (pedidoAtual.itens.reduce((acc, i) => acc + i.qtdeSeparada, 0) / pedidoAtual.itens.reduce((acc, i) => acc + i.qtdeSolicitada, 0)) * 100
        : 0;

    // ============================================================================
    // 🎨 RENDERIZAÇÃO
    // ============================================================================
    if (cameraAtiva) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={lidarComScan} />
                <View style={styles.scannerOverlay}>
                    <View style={[styles.scannerBox, { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
                    <Text style={[styles.scannerText, { color: '#8b5cf6' }]}>Bipe a peça que você pegou na prateleira</Text>
                </View>
                <TouchableOpacity onPress={() => setCameraAtiva(false)} style={styles.btnVoltarScan}>
                    <Text style={styles.btnTextoBranco}>CANCELAR CONFERÊNCIA</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                    <Text style={styles.titulo}>Modo Picking</Text>
                    <Text style={styles.subtitulo}>Separação de Pedidos</Text>
                </View>
            </View>

            {/* BUSCA DO PEDIDO */}
            {!pedidoAtual ? (
                <View style={styles.buscaContainer}>
                    <View style={styles.caixaBusca}>
                        <Feather name="file-text" size={40} color="#cbd5e1" style={{marginBottom: 20}} />
                        <Text style={styles.lblBusca}>Qual o N.º do Pedido/Venda?</Text>
                        <TextInput
                            style={styles.inputBusca}
                            placeholder="Ex: 1025"
                            value={numPedido}
                            onChangeText={setNumPedido}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.btnBuscar} onPress={buscarPedido} disabled={buscando}>
                            {buscando ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtBuscar}>Localizar no Servidor</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    {/* INFO DO PEDIDO E PROGRESSO */}
                    <View style={styles.infoPedidoBox}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View>
                                <Text style={styles.lblPedido}>VENDA #{pedidoAtual.numero} • {pedidoAtual.status}</Text>
                                <Text style={styles.txtCliente}>{pedidoAtual.cliente}</Text>
                                <Text style={styles.txtVendedor}>Vend: {pedidoAtual.vendedor}</Text>
                            </View>
                            <TouchableOpacity onPress={abrirCamera} style={styles.btnScanGigante}>
                                <Feather name="maximize" size={24} color="#fff" />
                                <Text style={styles.txtBtnScan}>Bipar Peça</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.barraProgressoFundo}>
                            <View style={[styles.barraProgresso, { width: `${progresso}%` }]} />
                        </View>
                    </View>

                    {/* LISTA DE ITENS PARA PEGAR */}
                    <FlatList
                        data={pedidoAtual.itens}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listaItens}
                        renderItem={({ item }) => {
                            const completo = item.qtdeSeparada === item.qtdeSolicitada;
                            return (
                                <View style={[styles.itemBox, completo && styles.itemCompleto]}>
                                    <View style={styles.itemIcone}>
                                        <Feather name={completo ? "check-circle" : "circle"} size={24} color={completo ? "#10b981" : "#cbd5e1"} />
                                    </View>
                                    <View style={styles.itemDados}>
                                        <Text style={[styles.itemNome, completo && {color: '#64748b', textDecorationLine: 'line-through'}]} numberOfLines={2}>
                                            {item.produto.nome}
                                        </Text>
                                        <Text style={styles.itemSku}>{item.produto.sku}</Text>
                                    </View>
                                    <View style={styles.itemQtdBox}>
                                        <Text style={[styles.itemQtd, completo && {color: '#10b981'}]}>
                                            {item.qtdeSeparada} / {item.qtdeSolicitada}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />

                    {/* RODAPÉ */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.btnFinalizar, (progresso < 100 || salvando) && {backgroundColor: '#cbd5e1'}]} onPress={finalizarSeparacao} disabled={progresso < 100 || salvando}>
                            {salvando ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Feather name="check" size={24} color="#fff" />
                                    <Text style={styles.txtFinalizar}>Concluir Separação</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#8b5cf6', fontWeight: 'bold' },

    buscaContainer: { flex: 1, justifyContent: 'center', padding: 20 },
    caixaBusca: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
    lblBusca: { fontSize: 18, fontWeight: 'black', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
    inputBusca: { width: '100%', backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, fontSize: 24, fontWeight: 'black', textAlign: 'center', color: '#8b5cf6', marginBottom: 20 },
    btnBuscar: { width: '100%', backgroundColor: '#8b5cf6', padding: 20, borderRadius: 16, alignItems: 'center' },
    txtBuscar: { color: '#fff', fontSize: 16, fontWeight: 'black' },

    infoPedidoBox: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    lblPedido: { fontSize: 11, fontWeight: 'black', color: '#94a3b8', letterSpacing: 1 },
    txtCliente: { fontSize: 18, fontWeight: 'black', color: '#1e293b', marginTop: 2 },
    txtVendedor: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 2 },
    btnScanGigante: { backgroundColor: '#8b5cf6', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, shadowColor: '#8b5cf6', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
    txtBtnScan: { color: '#fff', fontWeight: 'black', fontSize: 12 },

    barraProgressoFundo: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, marginTop: 20, overflow: 'hidden' },
    barraProgresso: { height: '100%', backgroundColor: '#10b981' },

    listaItens: { padding: 15, paddingBottom: 30 },
    itemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    itemCompleto: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' },
    itemIcone: { marginRight: 15 },
    itemDados: { flex: 1 },
    itemNome: { fontSize: 14, fontWeight: 'black', color: '#1e293b' },
    itemSku: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginTop: 2 },
    itemQtdBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginLeft: 10 },
    itemQtd: { fontSize: 16, fontWeight: 'black', color: '#334155' },

    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    btnFinalizar: { backgroundColor: '#10b981', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    txtFinalizar: { color: '#fff', fontSize: 18, fontWeight: 'black' },

    scannerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
    scannerBox: { width: 250, height: 150, borderWidth: 4, borderRadius: 20 },
    scannerText: { fontWeight: '900', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 10 },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },
});