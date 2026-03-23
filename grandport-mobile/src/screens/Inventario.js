import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../api/axios';

export default function Inventario({ onVoltar }) {
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);
    const [processando, setProcessando] = useState(false);

    const [codigoManual, setCodigoManual] = useState('');
    const [produtoEncontrado, setProdutoEncontrado] = useState(null);
    const [novaQuantidade, setNovaQuantidade] = useState('');

    // ============================================================================
    // 🔍 MOTOR DE BUSCA (BIPAGEM OU MANUAL)
    // ============================================================================
    const buscarProduto = async (codigo) => {
        if (!codigo) return;

        setCameraAtiva(false);
        setProcessando(true);

        try {
            const res = await api.get(`/api/produtos?busca=${codigo}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);

            const prod = lista.find(p => p.codigoBarras === codigo || p.sku === codigo || p.referenciaOriginal === codigo);

            if (prod) {
                setProdutoEncontrado(prod);
                setNovaQuantidade(prod.quantidadeEstoque?.toString() || '0');
                Toast.show({ type: 'success', text1: 'Peça Localizada!' });
            } else {
                Toast.show({ type: 'error', text1: 'Não encontrado', text2: `Nenhuma peça com o código ${codigo}` });
            }
        } catch (error) {
            console.log(error);
            Toast.show({ type: 'error', text1: 'Falha na rede', text2: 'Erro ao buscar peça.' });
        } finally {
            setProcessando(false);
            setCodigoManual('');
        }
    };

    // ============================================================================
    // 🚀 SALVAR A NOVA CONTAGEM (USANDO A ROTA CORRETA DE AJUSTE DO BACKEND)
    // ============================================================================
    const salvarEstoque = async () => {
        if (!produtoEncontrado) return;

        setProcessando(true);
        try {
            Toast.show({ type: 'info', text1: 'Enviando ajuste para o ERP...' });

            const quantidadeNumerica = Number(novaQuantidade) >= 0 ? Number(novaQuantidade) : 0;

            // 🚀 PACOTE MINÚSCULO E DIRETO AO PONTO!
            const payload = {
                quantidade: quantidadeNumerica,
                motivo: "Ajuste via Coletor Mobile"
            };

            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            // 🚀 DISPARO PARA A ROTA ESPECÍFICA DE ESTOQUE (PATCH)
            const response = await fetch(`${api.defaults.baseURL}/api/produtos/${produtoEncontrado.id}/ajuste-estoque`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: {
                    'Authorization': `Bearer ${tokenLimpo}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) throw new Error(await response.text());

            Toast.show({ type: 'success', text1: 'Estoque Atualizado!', text2: `Novo saldo: ${quantidadeNumerica}` });
            setProdutoEncontrado(null);

        } catch (error) {
            console.log("Erro no servidor:", error.message);
            Toast.show({ type: 'error', text1: 'Falha no Ajuste:', text2: error.message.substring(0, 60) });
        } finally {
            setProcessando(false);
        }
    };

    // ============================================================================
    // 📹 TELA DA CÂMERA E RENDERIZAÇÃO
    // ============================================================================
    const abrirCamera = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) return Toast.show({ type: 'error', text1: 'Acesso à câmera negado' });
        }
        setCameraAtiva(true);
    };

    if (cameraAtiva) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => buscarProduto(data)} />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerBox} />
                    <Text style={styles.scannerText}>Aponte para o código de barras da peça</Text>
                </View>
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
                    <Feather name="arrow-left" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Feather name="maximize" size={20} color="#3b82f6" />
                    <Text style={styles.tituloHeader}>Coletor de Dados</Text>
                </View>
            </View>

            <View style={styles.content}>

                {!produtoEncontrado && (
                    <View style={styles.aguardandoContainer}>
                        <TouchableOpacity onPress={abrirCamera} style={styles.btnBiparGigante}>
                            <Feather name="maximize" size={80} color="#3b82f6" />
                            <Text style={styles.txtBiparGigante}>BIPAR CÓDIGO DE BARRAS</Text>
                            <Text style={styles.txtBiparSub}>Toque para abrir a câmera</Text>
                        </TouchableOpacity>

                        <View style={styles.divisor}>
                            <View style={styles.linha} />
                            <Text style={styles.txtOu}>OU DIGITE MANUALMENTE</Text>
                            <View style={styles.linha} />
                        </View>

                        <View style={styles.inputManualBox}>
                            <TextInput
                                style={styles.inputManual}
                                placeholder="SKU ou EAN..."
                                value={codigoManual}
                                onChangeText={setCodigoManual}
                                onSubmitEditing={() => buscarProduto(codigoManual)}
                                returnKeyType="search"
                            />
                            <TouchableOpacity onPress={() => buscarProduto(codigoManual)} style={styles.btnBuscaManual}>
                                {processando ? <ActivityIndicator color="#fff" /> : <Feather name="search" size={24} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {produtoEncontrado && (
                    <View style={styles.produtoContainer}>

                        <View style={styles.cardProduto}>
                            <View style={styles.fotoBox}>
                                {produtoEncontrado.fotoUrl || produtoEncontrado.fotoLocalPath ? (
                                    <Image source={{ uri: produtoEncontrado.fotoUrl || produtoEncontrado.fotoLocalPath }} style={styles.foto} />
                                ) : (
                                    <Feather name="package" size={40} color="#cbd5e1" />
                                )}
                            </View>
                            <View style={styles.dadosBox}>
                                <Text style={styles.skuProduto}>{produtoEncontrado.sku}</Text>
                                <Text style={styles.nomeProduto} numberOfLines={2}>{produtoEncontrado.nome}</Text>
                                <Text style={styles.marcaProduto}>{produtoEncontrado.marca?.nome || 'MARCA NÃO DEFINIDA'}</Text>
                            </View>
                        </View>

                        <View style={styles.estoqueBox}>
                            <Text style={styles.lblEstoque}>CONTAGEM ATUAL (FÍSICA)</Text>

                            <View style={styles.contadorRow}>
                                <TouchableOpacity
                                    onPress={() => setNovaQuantidade(String(Math.max(0, (parseInt(novaQuantidade)||0) - 1)))}
                                    style={styles.btnMenos}
                                >
                                    <Feather name="minus" size={32} color="#fff" />
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.inputEstoque}
                                    keyboardType="numeric"
                                    value={novaQuantidade}
                                    onChangeText={setNovaQuantidade}
                                    selectTextOnFocus
                                />

                                <TouchableOpacity
                                    onPress={() => setNovaQuantidade(String((parseInt(novaQuantidade)||0) + 1))}
                                    style={styles.btnMais}
                                >
                                    <Feather name="plus" size={32} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.lblDiferenca}>
                                O sistema registrava: {produtoEncontrado.quantidadeEstoque} {produtoEncontrado.unidadeMedida}
                            </Text>
                        </View>

                        <View style={styles.footerAcoes}>
                            <TouchableOpacity onPress={() => setProdutoEncontrado(null)} style={styles.btnCancelar}>
                                <Text style={styles.txtCancelar}>DESCARTAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={salvarEstoque} disabled={processando} style={styles.btnSalvar}>
                                {processando ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Feather name="check-circle" size={24} color="#fff" />
                                        <Text style={styles.txtSalvar}>CONFIRMAR SALDO</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                )}

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
    btnVoltar: { padding: 5, marginRight: 15 },
    headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tituloHeader: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
    content: { flex: 1, padding: 20, justifyContent: 'center' },
    aguardandoContainer: { flex: 1, justifyContent: 'center' },
    btnBiparGigante: { backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', borderRadius: 24, padding: 40, alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    txtBiparGigante: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 20 },
    txtBiparSub: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 5 },
    divisor: { flexDirection: 'row', alignItems: 'center', marginVertical: 40 },
    linha: { flex: 1, height: 1, backgroundColor: '#334155' },
    txtOu: { color: '#64748b', paddingHorizontal: 15, fontWeight: '900', fontSize: 12 },
    inputManualBox: { flexDirection: 'row', gap: 10 },
    inputManual: { flex: 1, backgroundColor: '#1e293b', color: '#f8fafc', fontSize: 18, fontWeight: 'bold', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
    btnBuscaManual: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center', width: 70 },
    scannerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
    scannerBox: { width: 250, height: 150, borderWidth: 4, borderColor: '#22c55e', borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    scannerText: { color: '#22c55e', fontWeight: '900', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10 },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },
    produtoContainer: { flex: 1, justifyContent: 'center' },
    cardProduto: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, flexDirection: 'row', gap: 15, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    fotoBox: { width: 80, height: 80, backgroundColor: '#0f172a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    foto: { width: '100%', height: '100%', resizeMode: 'cover' },
    dadosBox: { flex: 1 },
    skuProduto: { color: '#3b82f6', fontSize: 14, fontWeight: '900', fontFamily: 'monospace', marginBottom: 5 },
    nomeProduto: { color: '#f8fafc', fontSize: 18, fontWeight: 'black' },
    marcaProduto: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase' },
    estoqueBox: { backgroundColor: '#1e293b', padding: 30, borderRadius: 20, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    lblEstoque: { color: '#94a3b8', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
    contadorRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    btnMenos: { backgroundColor: '#ef4444', width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    btnMais: { backgroundColor: '#22c55e', width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    inputEstoque: { backgroundColor: '#0f172a', color: '#f8fafc', fontSize: 40, fontWeight: 'black', textAlign: 'center', width: 120, height: 80, borderRadius: 20, borderWidth: 2, borderColor: '#3b82f6' },
    lblDiferenca: { color: '#64748b', fontSize: 14, fontWeight: 'bold', marginTop: 20 },
    footerAcoes: { flexDirection: 'row', gap: 15, marginTop: 30 },
    btnCancelar: { flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#334155', alignItems: 'center' },
    txtCancelar: { color: '#94a3b8', fontWeight: '900', fontSize: 14 },
    btnSalvar: { flex: 2, backgroundColor: '#22c55e', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 },
    txtSalvar: { color: '#fff', fontWeight: '900', fontSize: 16 },
});