import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function SeparacaoPedidos({ onVoltar }) {
    const [numPedido, setNumPedido] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [pedidoAtual, setPedidoAtual] = useState(null);

    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // ============================================================================
    // 🔍 BUSCA DO PEDIDO COM VALIDAÇÃO DE STATUS
    // ============================================================================
    const buscarPedido = async () => {
        if (numPedido.length < 1) return Toast.show({ type: 'info', text1: 'Digite o número do pedido' });

        setBuscando(true);
        try {
            const res = await api.get(`/api/vendas/${numPedido}`);
            const vendaDb = res.data;

            // 🚀 SEGURANÇA 1: BLOQUEIO DE PEDIDO JÁ SEPARADO/FINALIZADO
            if (vendaDb.status === 'CONCLUIDA' || vendaDb.status === 'AGUARDANDO_PAGAMENTO') {
                setNumPedido('');
                return Alert.alert(
                    "Pedido já Separado! ⚠️",
                    `Este pedido (#${vendaDb.id}) já foi conferido e está no Caixa ou já foi Entregue.\n\nNão é permitido separar novamente.`
                );
            }

            const itensMapeados = vendaDb.itens.map(itemVenda => ({
                id: itemVenda.id,
                produto: itemVenda.produto,
                qtdeSolicitada: itemVenda.quantidade,
                qtdeSeparada: 0
            }));

            setPedidoAtual({
                numero: vendaDb.id,
                cliente: vendaDb.cliente?.nome || 'CONSUMIDOR FINAL',
                status: vendaDb.status,
                itens: itensMapeados,
                dadosOriginais: vendaDb // Guardamos para o payload de fechamento
            });

            Toast.show({ type: 'success', text1: 'Separação Iniciada!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Pedido não localizado' });
        } finally {
            setBuscando(false);
        }
    };

    // ============================================================================
    // 📸 SCANNER
    // ============================================================================
    const lidarComScan = ({ data }) => {
        setCameraAtiva(false);
        if (!pedidoAtual) return;

        const itemEncontrado = pedidoAtual.itens.find(i =>
            i.produto.codigoBarras === data || i.produto.sku === data
        );

        if (!itemEncontrado) {
            return Alert.alert("❌ PEÇA ERRADA!", "Esta peça não pertence a este pedido. Devolva-a para a prateleira!");
        }

        if (itemEncontrado.qtdeSeparada >= itemEncontrado.qtdeSolicitada) {
            return Toast.show({ type: 'info', text1: 'Item já completo!' });
        }

        const novosItens = pedidoAtual.itens.map(i => {
            if (i.id === itemEncontrado.id) return { ...i, qtdeSeparada: i.qtdeSeparada + 1 };
            return i;
        });

        setPedidoAtual({ ...pedidoAtual, itens: novosItens });
        Toast.show({ type: 'success', text1: 'Check-in OK', text2: itemEncontrado.produto.nome });
    };

    // ============================================================================
    // 🚀 FINALIZAR E DAR BAIXA NO STATUS (JAVA)
    // ============================================================================
    const finalizarSeparacao = async () => {
        const incompleto = pedidoAtual.itens.some(i => i.qtdeSeparada < i.qtdeSolicitada);
        if (incompleto) return Alert.alert("Atenção", "Você ainda não bipou todos os itens deste pedido!");

        setSalvando(true);
        try {
            // 🚀 SEGURANÇA 2: MUDAR STATUS NO JAVA PARA "AGUARDANDO_PAGAMENTO"
            // Isso faz com que o pedido suma da lista de separação e vá pro caixa
            const payload = {
                ...pedidoAtual.dadosOriginais,
                status: 'AGUARDANDO_PAGAMENTO', // Muda o status oficial
                observacoes: (pedidoAtual.dadosOriginais.observacoes || "") + "\n[Separação realizada via Mobile]"
            };

            await api.put(`/api/vendas/${pedidoAtual.numero}`, payload);

            Alert.alert("Sucesso! ✅", "Separação concluída. O pedido foi enviado para o Caixa.");
            setPedidoAtual(null);
            setNumPedido('');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao salvar separação' });
        } finally {
            setSalvando(false);
        }
    };

    // Estilos de suporte...
    const progresso = pedidoAtual ?
        (pedidoAtual.itens.reduce((acc, i) => acc + i.qtdeSeparada, 0) / pedidoAtual.itens.reduce((acc, i) => acc + i.qtdeSolicitada, 0)) * 100
        : 0;

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
                <View>
                    <Text style={styles.titulo}>Picking Seguro</Text>
                    <Text style={styles.subtitulo}>Conferência de Saída</Text>
                </View>
            </View>

            {!pedidoAtual ? (
                <View style={styles.buscaContainer}>
                    <View style={styles.caixaBusca}>
                        <Feather name="package" size={50} color="#8b5cf6" style={{marginBottom: 15}} />
                        <Text style={styles.lblBusca}>Digite o Pedido para Separar</Text>
                        <TextInput
                            style={styles.inputBusca}
                            placeholder="Ex: 1025"
                            value={numPedido}
                            onChangeText={setNumPedido}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={styles.btnBuscar} onPress={buscarPedido} disabled={buscando}>
                            {buscando ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtBuscar}>Iniciar Conferência</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.infoPedidoBox}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{flex: 1}}>
                                <Text style={styles.lblPedido}>CONFERINDO PEDIDO #{pedidoAtual.numero}</Text>
                                <Text style={styles.txtCliente}>{pedidoAtual.cliente}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setCameraAtiva(true)} style={styles.btnScanGigante}>
                                <Feather name="maximize" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.barraProgressoFundo}>
                            <View style={[styles.barraProgresso, { width: `${progresso}%` }]} />
                        </View>
                    </View>

                    <FlatList
                        data={pedidoAtual.itens}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listaItens}
                        renderItem={({ item }) => {
                            const completo = item.qtdeSeparada === item.qtdeSolicitada;
                            return (
                                <View style={[styles.itemBox, completo && styles.itemCompleto]}>
                                    <Feather name={completo ? "check-circle" : "circle"} size={24} color={completo ? "#10b981" : "#cbd5e1"} />
                                    <View style={{flex: 1, marginLeft: 15}}>
                                        <Text style={[styles.itemNome, completo && {color: '#94a3b8'}]}>{item.produto.nome}</Text>
                                        <Text style={styles.itemSku}>{item.produto.sku}</Text>
                                    </View>
                                    <Text style={[styles.itemQtd, completo && {color: '#10b981'}]}>{item.qtdeSeparada}/{item.qtdeSolicitada}</Text>
                                </View>
                            );
                        }}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.btnFinalizar, (progresso < 100 || salvando) && {backgroundColor: '#cbd5e1'}]}
                            onPress={finalizarSeparacao}
                            disabled={progresso < 100 || salvando}
                        >
                            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtFinalizar}>Concluir e Enviar p/ Caixa</Text>}
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
    buscaContainer: { flex: 1, justifyContent: 'center', padding: 25 },
    caixaBusca: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 4 },
    lblBusca: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginBottom: 15 },
    inputBusca: { width: '100%', backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, fontSize: 24, fontWeight: 'black', textAlign: 'center', color: '#8b5cf6', marginBottom: 20 },
    btnBuscar: { width: '100%', backgroundColor: '#8b5cf6', padding: 20, borderRadius: 16, alignItems: 'center' },
    txtBuscar: { color: '#fff', fontSize: 16, fontWeight: 'black' },
    infoPedidoBox: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    lblPedido: { fontSize: 10, fontWeight: 'black', color: '#94a3b8' },
    txtCliente: { fontSize: 18, fontWeight: 'black', color: '#1e293b' },
    btnScanGigante: { backgroundColor: '#8b5cf6', padding: 15, borderRadius: 12 },
    barraProgressoFundo: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 15, overflow: 'hidden' },
    barraProgresso: { height: '100%', backgroundColor: '#10b981' },
    listaItens: { padding: 15 },
    itemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWeight: 1, borderColor: '#e2e8f0' },
    itemCompleto: { opacity: 0.6 },
    itemNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    itemSku: { fontSize: 11, color: '#94a3b8' },
    itemQtd: { fontSize: 16, fontWeight: 'black' },
    footer: { padding: 20, backgroundColor: '#fff' },
    btnFinalizar: { backgroundColor: '#10b981', padding: 20, borderRadius: 16, alignItems: 'center' },
    txtFinalizar: { color: '#fff', fontSize: 16, fontWeight: 'black' },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900' }
});