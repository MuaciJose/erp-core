import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function OrcamentoMobile({ onVoltar }) {
    const [carrinho, setCartinho] = useState([]);
    const [busca, setBusca] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [resultados, setResultados] = useState([]);

    // Motor da Câmera
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // ============================================================================
    // 🔍 BUSCA DE PRODUTOS PARA ADICIONAR AO CARRINHO
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

            if (prod) adicionarAoCarrinho(prod);
            else Toast.show({ type: 'error', text1: 'Peça não encontrada!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao buscar código!' });
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
    // 🛒 GESTÃO DO CARRINHO
    // ============================================================================
    const adicionarAoCarrinho = (produto) => {
        const itemExistente = carrinho.find(item => item.id === produto.id);

        if (itemExistente) {
            setCartinho(carrinho.map(item =>
                item.id === produto.id ? { ...item, qtde: item.qtde + 1 } : item
            ));
        } else {
            setCartinho([{ ...produto, qtde: 1 }, ...carrinho]);
        }

        setBusca(''); // Limpa a busca após adicionar
        setResultados([]);
        Toast.show({ type: 'success', text1: 'Adicionado!', text2: produto.nome });
    };

    const alterarQuantidade = (id, delta) => {
        setCartinho(carrinho.map(item => {
            if (item.id === id) {
                const novaQtde = Math.max(1, item.qtde + delta);
                return { ...item, qtde: novaQtde };
            }
            return item;
        }));
    };

    const removerItem = (id) => {
        setCartinho(carrinho.filter(item => item.id !== id));
    };

    const valorTotal = carrinho.reduce((acc, item) => acc + ((item.precoVenda || 0) * item.qtde), 0);

    // ============================================================================
    // 💬 INTEGRAÇÃO WHATSAPP
    // ============================================================================
    const enviarWhatsApp = () => {
        if (carrinho.length === 0) {
            return Toast.show({ type: 'error', text1: 'Carrinho vazio!' });
        }

        let texto = `*ORÇAMENTO DE PEÇAS*\n\n`;
        carrinho.forEach(item => {
            texto += `🔹 ${item.qtde}x ${item.nome}\n`;
            texto += `   _Ref: ${item.sku}_\n`;
            texto += `   *R$ ${((item.precoVenda || 0) * item.qtde).toFixed(2)}*\n\n`;
        });
        texto += `*TOTAL GERAL: R$ ${valorTotal.toFixed(2)}*\n\n`;
        texto += `_Orçamento gerado via GrandPort ERP_`;

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
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                    <Text style={styles.titulo}>Orçamento Rápido</Text>
                    <Text style={styles.subtitulo}>{carrinho.length} itens no carrinho</Text>
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
                    {buscando && <ActivityIndicator size="small" color="#2563eb" style={{position: 'absolute', right: 65}} />}
                    <TouchableOpacity onPress={abrirCamera} style={styles.btnScan}>
                        <Feather name="maximize" size={20} color="#2563eb" />
                    </TouchableOpacity>
                </View>

                {/* RESULTADOS DA BUSCA (FLUTUANTE) */}
                {resultados.length > 0 && (
                    <View style={styles.resultadosBox}>
                        {resultados.slice(0, 4).map(prod => (
                            <TouchableOpacity key={prod.id} style={styles.itemResultado} onPress={() => adicionarAoCarrinho(prod)}>
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
            <FlatList
                data={carrinho}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.carrinhoList}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Feather name="shopping-cart" size={60} color="#cbd5e1" />
                        <Text style={styles.emptyTxt}>Carrinho Vazio</Text>
                        <Text style={styles.emptySub}>Busque ou bipe uma peça acima</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
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
                )}
            />

            {/* RODAPÉ DE FECHAMENTO */}
            <View style={styles.footer}>
                <View style={styles.totalBox}>
                    <Text style={styles.lblTotal}>TOTAL DO ORÇAMENTO</Text>
                    <Text style={styles.valTotal}>R$ {valorTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.btnZap} onPress={enviarWhatsApp}>
                    <Feather name="send" size={24} color="#fff" />
                    <Text style={styles.txtZap}>Enviar Orçamento</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#ca8a04', fontWeight: 'bold' },

    buscaContainer: { padding: 15, zIndex: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#3b82f6', borderRadius: 16, overflow: 'hidden', shadowColor: '#3b82f6', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    btnScan: { padding: 15, backgroundColor: '#eff6ff', borderLeftWidth: 1, borderLeftColor: '#bfdbfe' },

    resultadosBox: { position: 'absolute', top: 75, left: 15, right: 15, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    itemResultado: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    resNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    resSku: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '900' },

    carrinhoList: { padding: 15, paddingBottom: 30 },
    cartItem: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
    cartInfo: { flex: 1, paddingRight: 10 },
    cartNome: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    cartPreco: { fontSize: 16, fontWeight: '900', color: '#059669', marginTop: 5 },
    cartControles: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 5 },
    btnQtd: { padding: 10, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    txtQtd: { marginHorizontal: 15, fontSize: 16, fontWeight: 'black', color: '#1e293b' },
    btnRemover: { padding: 10, marginLeft: 5 },

    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    lblTotal: { fontSize: 12, fontWeight: 'black', color: '#64748b' },
    valTotal: { fontSize: 24, fontWeight: 'black', color: '#1e293b' },
    btnZap: { backgroundColor: '#22c55e', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    txtZap: { color: '#fff', fontSize: 16, fontWeight: 'black' },

    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },
    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyTxt: { marginTop: 10, fontSize: 18, fontWeight: 'black', color: '#94a3b8' },
    emptySub: { marginTop: 5, fontSize: 14, fontWeight: 'bold', color: '#cbd5e1' },
});