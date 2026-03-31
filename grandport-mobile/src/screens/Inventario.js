import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import api from '../api/axios';
import { getApiBaseUrl, getAuthHeaders } from '../api/session';

const HISTORY_KEY = 'grandport_mobile_inventario_historico';

export default function Inventario({ onVoltar }) {
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [codigoManual, setCodigoManual] = useState('');
    const [produtoEncontrado, setProdutoEncontrado] = useState(null);
    const [novaQuantidade, setNovaQuantidade] = useState('');
    const [modoOperacao, setModoOperacao] = useState('CONSULTA');
    const [historico, setHistorico] = useState([]);

    const playerBip = useAudioPlayer(require('../../assets/bip.mp3'));

    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const salvo = await AsyncStorage.getItem(HISTORY_KEY);
                if (salvo) setHistorico(JSON.parse(salvo));
            } catch (error) {
                console.log('Erro ao carregar histórico mobile:', error);
            }
        };

        carregarHistorico();
    }, []);

    const tocarBip = () => {
        playerBip.seekTo(0);
        playerBip.play();
    };

    const registrarHistorico = async (produto, codigo) => {
        const proximoHistorico = [
            {
                id: produto.id,
                nome: produto.nome,
                sku: produto.sku,
                codigo,
                quantidadeEstoque: produto.quantidadeEstoque,
                localizacao: produto.localizacao || 'Sem endereço',
                dataHora: new Date().toISOString()
            },
            ...historico.filter(item => item.id !== produto.id)
        ].slice(0, 8);

        setHistorico(proximoHistorico);
        try {
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(proximoHistorico));
        } catch (error) {
            console.log('Erro ao guardar histórico mobile:', error);
        }
    };

    const buscarProduto = async (codigo) => {
        if (!codigo) return;

        setCameraAtiva(false);
        setProcessando(true);

        try {
            const res = await api.get(`/api/produtos?busca=${codigo}`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            const prod = lista.find(p => p.codigoBarras === codigo || p.sku === codigo || p.referenciaOriginal === codigo);

            if (prod) {
                tocarBip();
                setProdutoEncontrado(prod);
                setNovaQuantidade(prod.quantidadeEstoque?.toString() || '0');
                await registrarHistorico(prod, codigo);
                Toast.show({ type: 'success', text1: 'Peça localizada!' });
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

    const salvarEstoque = async () => {
        if (!produtoEncontrado) return;

        setProcessando(true);
        try {
            const quantidadeNumerica = Number(novaQuantidade) >= 0 ? Number(novaQuantidade) : 0;

            const payload = {
                quantidade: quantidadeNumerica,
                motivo: modoOperacao === 'CONFERENCIA' ? 'Ajuste via Conferência Mobile' : 'Ajuste via Coletor Mobile'
            };

            const response = await fetch(`${getApiBaseUrl()}/api/produtos/${produtoEncontrado.id}/ajuste-estoque`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: await getAuthHeaders({ 'Content-Type': 'application/json' })
            });

            if (!response.ok) throw new Error(await response.text());

            Toast.show({ type: 'success', text1: 'Estoque atualizado!', text2: `Novo saldo: ${quantidadeNumerica}` });
            setProdutoEncontrado(null);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Falha no ajuste', text2: error.message.substring(0, 60) });
        } finally {
            setProcessando(false);
        }
    };

    const abrirCamera = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) {
                return Toast.show({ type: 'error', text1: 'Acesso à câmera negado' });
            }
        }
        setCameraAtiva(true);
    };

    const cabecalhoHistorico = useMemo(() => (
        historico.length === 0 ? (
            <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                    <Text style={styles.sectionLabel}>Últimos scans</Text>
                    <Text style={styles.historyBadge}>0</Text>
                </View>
                <View style={styles.emptyState}>
                    <Feather name="clock" size={22} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>Sem histórico por enquanto</Text>
                    <Text style={styles.emptySubtitle}>Os últimos códigos lidos aparecerão aqui para reconsulta rápida.</Text>
                </View>
            </View>
        ) : (
            <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                    <Text style={styles.sectionLabel}>Últimos scans</Text>
                    <View style={styles.historyHeaderActions}>
                        <Text style={styles.historyBadge}>{historico.length}</Text>
                        <TouchableOpacity
                            onPress={async () => {
                                setHistorico([]);
                                await AsyncStorage.removeItem(HISTORY_KEY);
                            }}
                            style={styles.historyClear}
                        >
                            <Text style={styles.historyClearText}>Limpar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {historico.map(item => (
                    <TouchableOpacity key={`${item.id}-${item.dataHora}`} style={styles.historyItem} onPress={() => buscarProduto(item.codigo)}>
                        <View style={styles.historyIcon}>
                            <Feather name="package" size={16} color="#475569" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historyTitle} numberOfLines={1}>{item.nome}</Text>
                            <Text style={styles.historySubtitle}>{item.localizacao}</Text>
                        </View>
                        <Text style={styles.historyQty}>{item.quantidadeEstoque}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )
    ), [historico]);

    if (cameraAtiva) {
        return (
            <View style={styles.scannerScreen}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => buscarProduto(data)} />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerBox} />
                    <Text style={styles.scannerText}>Aponte para o código da peça</Text>
                </View>
                <TouchableOpacity onPress={() => setCameraAtiva(false)} style={styles.btnVoltarScan}>
                    <Text style={styles.btnTextoBranco}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={22} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.headerTextBox}>
                    <Text style={styles.kicker}>Estoque mobile</Text>
                    <Text style={styles.tituloHeader}>Coletor de dados</Text>
                    <Text style={styles.subHeader}>Consulta, conferência e ajuste rápido</Text>
                </View>
            </View>

            {!produtoEncontrado ? (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.heroCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroKicker}>Operação ativa</Text>
                            <Text style={styles.heroTitle}>{modoOperacao === 'CONFERENCIA' ? 'Conferência de estoque' : 'Consulta rápida de peça'}</Text>
                            <Text style={styles.heroSubtitle}>
                                {modoOperacao === 'CONFERENCIA'
                                    ? 'Bipe, compare a contagem física e confirme o saldo sem sair da tela.'
                                    : 'Use câmera ou busca manual para localizar peça, endereço e saldo na hora.'}
                            </Text>
                        </View>
                        <View style={styles.heroPill}>
                            <Text style={styles.heroPillLabel}>Modo</Text>
                            <Text style={styles.heroPillValue}>{modoOperacao === 'CONFERENCIA' ? 'Conferência' : 'Consulta'}</Text>
                        </View>
                    </View>

                    <View style={styles.modeRow}>
                        <TouchableOpacity
                            style={[styles.modeCard, modoOperacao === 'CONSULTA' && styles.modeCardActive]}
                            onPress={() => setModoOperacao('CONSULTA')}
                        >
                            <Text style={[styles.modeTitle, modoOperacao === 'CONSULTA' && styles.modeTitleActive]}>Consulta</Text>
                            <Text style={[styles.modeSubtitle, modoOperacao === 'CONSULTA' && styles.modeSubtitleActive]}>Saldo, localização e referência</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeCard, modoOperacao === 'CONFERENCIA' && styles.modeCardConference]}
                            onPress={() => setModoOperacao('CONFERENCIA')}
                        >
                            <Text style={[styles.modeTitle, modoOperacao === 'CONFERENCIA' && styles.modeTitleWhite]}>Conferência</Text>
                            <Text style={[styles.modeSubtitle, modoOperacao === 'CONFERENCIA' && styles.modeSubtitleWhite]}>Validar contagem e corrigir</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={abrirCamera} style={styles.scanCTA}>
                        <Feather name="maximize" size={58} color="#2563eb" />
                        <Text style={styles.scanCTATitle}>Bipar código de barras</Text>
                        <Text style={styles.scanCTASubtitle}>Toque para abrir a câmera e localizar a peça na hora</Text>
                    </TouchableOpacity>

                    <View style={styles.manualCard}>
                        <Text style={styles.sectionLabel}>Busca manual</Text>
                        <View style={styles.inputManualBox}>
                            <TextInput
                                style={styles.inputManual}
                                placeholder="SKU, EAN ou referência..."
                                placeholderTextColor="#94a3b8"
                                value={codigoManual}
                                onChangeText={setCodigoManual}
                                onSubmitEditing={() => buscarProduto(codigoManual)}
                                returnKeyType="search"
                            />
                            <TouchableOpacity onPress={() => buscarProduto(codigoManual)} style={styles.btnBuscaManual}>
                                {processando ? <ActivityIndicator color="#fff" /> : <Feather name="search" size={22} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {cabecalhoHistorico}
                </ScrollView>
            ) : (
                <View style={styles.productContent}>
                    <View style={styles.productHeaderCard}>
                        <View style={styles.fotoBox}>
                            {produtoEncontrado.fotoUrl || produtoEncontrado.fotoLocalPath ? (
                                <Image source={{ uri: produtoEncontrado.fotoUrl || produtoEncontrado.fotoLocalPath }} style={styles.foto} />
                            ) : (
                                <Feather name="package" size={36} color="#cbd5e1" />
                            )}
                        </View>
                        <View style={styles.productHeaderText}>
                            <Text style={styles.skuProduto}>{produtoEncontrado.sku}</Text>
                            <Text style={styles.nomeProduto} numberOfLines={2}>{produtoEncontrado.nome}</Text>
                            <Text style={styles.marcaProduto}>{produtoEncontrado.marca?.nome || 'Marca não definida'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoStrip}>
                        <View style={styles.infoPill}>
                            <Text style={styles.infoPillLabel}>Localização</Text>
                            <Text style={styles.infoPillValue}>{produtoEncontrado.localizacao || 'Sem endereço'}</Text>
                        </View>
                        <View style={styles.infoPill}>
                            <Text style={styles.infoPillLabel}>Sistema</Text>
                            <Text style={styles.infoPillValue}>{produtoEncontrado.quantidadeEstoque} {produtoEncontrado.unidadeMedida}</Text>
                        </View>
                    </View>

                    <View style={styles.counterCard}>
                        <Text style={styles.sectionLabel}>Contagem física atual</Text>
                        <View style={styles.contadorRow}>
                            <TouchableOpacity
                                onPress={() => setNovaQuantidade(String(Math.max(0, (parseInt(novaQuantidade, 10) || 0) - 1)))}
                                style={styles.btnMenos}
                            >
                                <Feather name="minus" size={28} color="#fff" />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.inputEstoque}
                                keyboardType="numeric"
                                value={novaQuantidade}
                                onChangeText={setNovaQuantidade}
                                selectTextOnFocus
                            />

                            <TouchableOpacity
                                onPress={() => setNovaQuantidade(String((parseInt(novaQuantidade, 10) || 0) + 1))}
                                style={styles.btnMais}
                            >
                                <Feather name="plus" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.lblDiferenca}>
                            Ajuste em modo {modoOperacao === 'CONFERENCIA' ? 'conferência' : 'consulta'}.
                        </Text>
                    </View>

                    <View style={styles.footerAcoes}>
                        <TouchableOpacity onPress={() => setProdutoEncontrado(null)} style={styles.btnCancelar}>
                            <Text style={styles.txtCancelar}>Descartar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={salvarEstoque} disabled={processando} style={styles.btnSalvar}>
                            {processando ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Feather name="check-circle" size={22} color="#fff" />
                                    <Text style={styles.txtSalvar}>Confirmar saldo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef2f7' },
    header: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        paddingTop: 52,
        paddingBottom: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    btnVoltar: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    headerTextBox: { flex: 1 },
    kicker: { fontSize: 11, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.1 },
    tituloHeader: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 4 },
    subHeader: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 4 },
    scrollContent: { padding: 16, paddingBottom: 30 },
    heroCard: {
        backgroundColor: '#0f172a',
        borderRadius: 24,
        padding: 18,
        marginBottom: 14,
        flexDirection: 'row',
        gap: 14
    },
    heroKicker: { color: '#93c5fd', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
    heroTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 8 },
    heroSubtitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 8, lineHeight: 18 },
    heroPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 88
    },
    heroPillLabel: { color: '#93c5fd', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    heroPillValue: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 6 },
    modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    modeCard: {
        width: '48%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        padding: 16
    },
    modeCardActive: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
    modeCardConference: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
    modeTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
    modeTitleActive: { color: '#1d4ed8' },
    modeTitleWhite: { color: '#fff' },
    modeSubtitle: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 6, lineHeight: 18 },
    modeSubtitleActive: { color: '#2563eb' },
    modeSubtitleWhite: { color: '#94a3b8' },
    scanCTA: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#bfdbfe',
        borderStyle: 'dashed',
        paddingVertical: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
    },
    scanCTATitle: { fontSize: 18, fontWeight: '900', color: '#1d4ed8', marginTop: 14 },
    scanCTASubtitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 26, lineHeight: 20 },
    manualCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 18,
        marginBottom: 14
    },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2 },
    inputManualBox: { flexDirection: 'row', gap: 10, marginTop: 14 },
    inputManual: {
        flex: 1,
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    btnBuscaManual: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: 62
    },
    historySection: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 18
    },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    historyBadge: { backgroundColor: '#f1f5f9', color: '#64748b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden', fontSize: 10, fontWeight: '900' },
    historyClear: {
        backgroundColor: '#fee2e2',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    historyClearText: { color: '#b91c1c', fontSize: 10, fontWeight: '900' },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 10
    },
    historyIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    historyTitle: { color: '#0f172a', fontSize: 13, fontWeight: '900' },
    historySubtitle: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 3 },
    historyQty: { color: '#0f172a', fontSize: 14, fontWeight: '900' },
    emptyState: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        backgroundColor: '#f8fafc',
        paddingVertical: 24,
        paddingHorizontal: 18,
        alignItems: 'center'
    },
    emptyTitle: { color: '#0f172a', fontSize: 14, fontWeight: '900', marginTop: 10 },
    emptySubtitle: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center', lineHeight: 18 },
    scannerScreen: { flex: 1, backgroundColor: '#000' },
    scannerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
    scannerBox: { width: 250, height: 150, borderWidth: 4, borderColor: '#22c55e', borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.08)' },
    scannerText: { color: '#22c55e', fontWeight: '900', marginTop: 20, fontSize: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 18, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 15 },
    productContent: { flex: 1, padding: 16 },
    productHeaderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 18,
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center'
    },
    fotoBox: { width: 88, height: 88, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    foto: { width: '100%', height: '100%', resizeMode: 'cover' },
    productHeaderText: { flex: 1 },
    skuProduto: { color: '#2563eb', fontSize: 13, fontWeight: '900', marginBottom: 6 },
    nomeProduto: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
    marcaProduto: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },
    infoStrip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    infoPill: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14
    },
    infoPillLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    infoPillValue: { color: '#0f172a', fontSize: 13, fontWeight: '800', marginTop: 8 },
    counterCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 20,
        marginTop: 14
    },
    contadorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
    btnMenos: { backgroundColor: '#ef4444', width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    btnMais: { backgroundColor: '#16a34a', width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    inputEstoque: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontSize: 38,
        fontWeight: '900',
        textAlign: 'center',
        width: 130,
        height: 82,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#bfdbfe'
    },
    lblDiferenca: { color: '#64748b', fontSize: 13, fontWeight: '700', marginTop: 18, textAlign: 'center' },
    footerAcoes: { flexDirection: 'row', gap: 12, marginTop: 18 },
    btnCancelar: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
    txtCancelar: { color: '#475569', fontWeight: '900', fontSize: 14 },
    btnSalvar: {
        flex: 1.4,
        backgroundColor: '#0f172a',
        paddingVertical: 18,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },
    txtSalvar: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
