import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function RecebimentoMercadoria({ onVoltar }) {
    const [lote, setLote] = useState([]);
    const [busca, setBusca] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [resultados, setResultados] = useState([]);

    // Motor da Câmera
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // ============================================================================
    // 🔍 BUSCA DE PRODUTOS PARA ADICIONAR AO LOTE
    // ============================================================================
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (busca.length >= 2) realizarBusca(busca);
            else setResultados([]);
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    const realizarBusca = async (termo) => {
        setBuscando(true);
        try {
            const res = await api.get(`/api/produtos?busca=${termo}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            setResultados(lista);
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

            if (prod) adicionarAoLote(prod);
            else Toast.show({ type: 'error', text1: 'Peça não encontrada no sistema!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao buscar código lido!' });
        } finally {
            setBuscando(false);
        }
    };

    const abrirCamera = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) return Toast.show({ type: 'error', text1: 'Câmera bloqueada!' });
        }
        setCameraAtiva(true);
    };

    // ============================================================================
    // 📦 GESTÃO DO LOTE DE ENTRADA
    // ============================================================================
    const adicionarAoLote = (produto) => {
        const itemExistente = lote.find(item => item.produto.id === produto.id);

        if (itemExistente) {
            setLote(lote.map(item =>
                item.produto.id === produto.id ? { ...item, qtdeLida: item.qtdeLida + 1 } : item
            ));
        } else {
            setLote([{ produto, qtdeLida: 1 }, ...lote]);
        }

        setBusca('');
        setResultados([]);
        Toast.show({ type: 'success', text1: 'Peça Bipada!', text2: produto.nome });
    };

    const alterarQuantidade = (id, delta) => {
        setLote(lote.map(item => {
            if (item.produto.id === id) {
                const novaQtde = Math.max(1, item.qtdeLida + delta);
                return { ...item, qtdeLida: novaQtde };
            }
            return item;
        }));
    };

    const removerItem = (id) => {
        setLote(lote.filter(item => item.produto.id !== id));
    };

    const totalPecas = lote.reduce((acc, item) => acc + item.qtdeLida, 0);

    // ============================================================================
    // 🚀 SALVAR ENTRADA (MÚLTIPLOS DISPAROS PARA O JAVA)
    // ============================================================================
    const confirmarRecebimento = async () => {
        if (lote.length === 0) return Toast.show({ type: 'error', text1: 'O lote está vazio!' });

        setSalvando(true);
        try {
            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            Toast.show({ type: 'info', text1: 'A processar entrada...', text2: 'Não feche a aplicação.' });

            // Dispara a atualização para cada peça do lote
            for (const item of lote) {
                // Soma o estoque que já existia com o que acabou de chegar
                const novoSaldoFisico = (item.produto.quantidadeEstoque || 0) + item.qtdeLida;

                const payload = {
                    quantidade: novoSaldoFisico,
                    motivo: "Entrada via Conferência Cega (Mobile)"
                };

                const response = await fetch(`${api.defaults.baseURL}/api/produtos/${item.produto.id}/ajuste-estoque`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                    headers: {
                        'Authorization': `Bearer ${tokenLimpo}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) throw new Error(`Falha na peça: ${item.produto.nome}`);
            }

            Toast.show({ type: 'success', text1: 'Recebimento Concluído!', text2: `${totalPecas} peças adicionadas ao estoque.` });
            setLote([]); // Limpa o lote
            onVoltar(); // Volta para o painel

        } catch (error) {
            console.log("Erro no recebimento:", error.message);
            Toast.show({ type: 'error', text1: 'Erro Crítico:', text2: error.message });
        } finally {
            setSalvando(false);
        }
    };

    // ============================================================================
    // 🎨 RENDERIZAÇÃO
    // ============================================================================
    if (cameraAtiva) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={lidarComScan} />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerBox} />
                    <Text style={styles.scannerText}>Bipe a peça que chegou do fornecedor</Text>
                </View>
                <TouchableOpacity onPress={() => setCameraAtiva(false)} style={styles.btnVoltarScan}>
                    <Text style={styles.btnTextoBranco}>CANCELAR</Text>
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
                    <Text style={styles.titulo}>Receber Carga</Text>
                    <Text style={styles.subtitulo}>{lote.length} referências bipadas</Text>
                </View>
            </View>

            {/* BARRA DE BUSCA E SCANNER */}
            <View style={styles.buscaContainer}>
                <View style={styles.inputWrapper}>
                    <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nome, Cód ou Bipar Peça..."
                        value={busca}
                        onChangeText={setBusca}
                    />
                    {buscando && <ActivityIndicator size="small" color="#10b981" style={{position: 'absolute', right: 65}} />}
                    <TouchableOpacity onPress={abrirCamera} style={styles.btnScan}>
                        <Feather name="maximize" size={20} color="#10b981" />
                    </TouchableOpacity>
                </View>

                {/* RESULTADOS DA BUSCA (FLUTUANTE) */}
                {resultados.length > 0 && (
                    <View style={styles.resultadosBox}>
                        {resultados.slice(0, 4).map(prod => (
                            <TouchableOpacity key={prod.id} style={styles.itemResultado} onPress={() => adicionarAoLote(prod)}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.resNome} numberOfLines={1}>{prod.nome}</Text>
                                    <Text style={styles.resSku}>{prod.sku} • Saldo Atual: {prod.quantidadeEstoque}</Text>
                                </View>
                                <Feather name="download" size={24} color="#10b981" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* LISTA DO LOTE (CONFERÊNCIA) */}
            <FlatList
                data={lote}
                keyExtractor={item => item.produto.id.toString()}
                contentContainerStyle={styles.loteList}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Feather name="box" size={60} color="#cbd5e1" />
                        <Text style={styles.emptyTxt}>Aguardando Carga</Text>
                        <Text style={styles.emptySub}>Bipe a primeira caixa para começar a entrada</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.loteItem}>
                        <View style={styles.loteInfo}>
                            <Text style={styles.loteSku}>{item.produto.sku}</Text>
                            <Text style={styles.loteNome} numberOfLines={2}>{item.produto.nome}</Text>
                            <Text style={styles.loteEstoqueAntigo}>Tinha {item.produto.quantidadeEstoque || 0} na loja</Text>
                        </View>

                        <View style={styles.loteControles}>
                            <TouchableOpacity onPress={() => alterarQuantidade(item.produto.id, -1)} style={styles.btnQtd}>
                                <Feather name="minus" size={18} color="#475569" />
                            </TouchableOpacity>
                            <Text style={styles.txtQtd}>{item.qtdeLida}</Text>
                            <TouchableOpacity onPress={() => alterarQuantidade(item.produto.id, 1)} style={styles.btnQtd}>
                                <Feather name="plus" size={18} color="#475569" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removerItem(item.produto.id)} style={styles.btnRemover}>
                                <Feather name="trash-2" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* RODAPÉ DE FECHAMENTO */}
            <View style={styles.footer}>
                <View style={styles.totalBox}>
                    <Text style={styles.lblTotal}>TOTAL DE PEÇAS LIDAS</Text>
                    <Text style={styles.valTotal}>{totalPecas} UN</Text>
                </View>
                <TouchableOpacity style={[styles.btnFinalizar, salvando && { opacity: 0.7 }]} onPress={confirmarRecebimento} disabled={salvando}>
                    {salvando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Feather name="check-square" size={24} color="#fff" />
                            <Text style={styles.txtFinalizar}>Confirmar Entrada</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0fdf4' }, // Fundo esverdeado (tema de Entrada)
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#10b981', fontWeight: 'bold' },

    buscaContainer: { padding: 15, zIndex: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#10b981', borderRadius: 16, overflow: 'hidden', shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    btnScan: { padding: 15, backgroundColor: '#ecfdf5', borderLeftWidth: 1, borderLeftColor: '#a7f3d0' },

    resultadosBox: { position: 'absolute', top: 75, left: 15, right: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    itemResultado: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    resNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    resSku: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '900' },

    loteList: { padding: 15, paddingBottom: 30 },
    loteItem: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    loteInfo: { marginBottom: 15 },
    loteSku: { fontSize: 11, fontWeight: '900', color: '#10b981', fontFamily: 'monospace' },
    loteNome: { fontSize: 16, fontWeight: 'black', color: '#1e293b', marginTop: 2 },
    loteEstoqueAntigo: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold', marginTop: 2 },

    loteControles: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 5, alignSelf: 'flex-start' },
    btnQtd: { padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    txtQtd: { marginHorizontal: 20, fontSize: 20, fontWeight: 'black', color: '#1e293b' },
    btnRemover: { padding: 10, marginLeft: 15, backgroundColor: '#fef2f2', borderRadius: 8 },

    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    lblTotal: { fontSize: 12, fontWeight: 'black', color: '#64748b' },
    valTotal: { fontSize: 24, fontWeight: 'black', color: '#1e293b' },
    btnFinalizar: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    txtFinalizar: { color: '#fff', fontSize: 16, fontWeight: 'black' },

    scannerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
    scannerBox: { width: 250, height: 150, borderWidth: 4, borderColor: '#10b981', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    scannerText: { color: '#10b981', fontWeight: '900', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10 },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyTxt: { marginTop: 10, fontSize: 18, fontWeight: 'black', color: '#94a3b8' },
    emptySub: { marginTop: 5, fontSize: 14, fontWeight: 'bold', color: '#cbd5e1' },
});