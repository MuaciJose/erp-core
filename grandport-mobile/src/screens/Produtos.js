import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

// IMPORTAÇÃO DA TELA DE CADASTRO/EDIÇÃO
import CadastroProduto from './CadastroProduto';

export default function Produtos({ onVoltar, onNavigate }) {
    // Controle de Telas (Lista vs Formulário de Edição)
    const [telaAtual, setTelaAtual] = useState('lista');
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);

    const [produtos, setProdutos] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(false);

    // 🚀 ESTADOS DA CÂMERA DE BUSCA
    const [permissao, pedirPermissao] = useCameraPermissions();
    const [cameraAtiva, setCameraAtiva] = useState(false);

    // Estados dos Modais
    const [modalAplicacao, setModalAplicacao] = useState({ aberto: false, texto: '', nome: '' });
    const [filtroModal, setFiltroModal] = useState('');
    const [previewImagemModal, setPreviewImagemModal] = useState(null);

    // ============================================================================
    // 📡 BUSCA DE DADOS NO SERVIDOR
    // ============================================================================
    const carregarDados = async () => {
        setCarregando(true);
        try {
            const endpoint = busca ? `/api/produtos?busca=${busca}` : '/api/produtos';
            const resProd = await api.get(endpoint);
            setProdutos(resProd.data);
        } catch (error) {
            console.log(error);
            Toast.show({ type: 'error', text1: 'Erro de Conexão', text2: 'Não foi possível carregar as peças.' });
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            carregarDados();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [busca]);

    // ============================================================================
    // 📸 MOTOR DO SCANNER NA BARRA DE BUSCA
    // ============================================================================
    const abrirCameraBusca = async () => {
        if (!permissao?.granted) {
            const result = await pedirPermissao();
            if (!result.granted) return Toast.show({ type: 'error', text1: 'Acesso à câmera negado' });
        }
        setCameraAtiva(true);
    };

    const lidarComScan = ({ data }) => {
        setBusca(data); // Joga o código lido direto na barra de pesquisa!
        setCameraAtiva(false); // Fecha a câmera
        Toast.show({ type: 'success', text1: 'Código lido!', text2: data });
    };

    // ============================================================================
    // ⚙️ AÇÕES DA TELA
    // ============================================================================
    const abrirEditar = (prod) => {
        setProdutoSelecionado(prod);
        setTelaAtual('formulario');
    };

    const fecharModalConsulta = () => {
        setModalAplicacao({ aberto: false, texto: '', nome: '' });
        setFiltroModal('');
    };

    const todasAsLinhas = modalAplicacao.texto
        ? modalAplicacao.texto.split(/[;|\n,\/]/).map(item => item.trim()).filter(item => item.length > 1)
        : [];

    const linhasFiltradas = todasAsLinhas.filter(linha =>
        linha.toLowerCase().includes(filtroModal.toLowerCase())
    );

    // ============================================================================
    // 🎨 RENDERIZADOR DOS CARTÕES DE PRODUTO
    // ============================================================================
    const renderProduto = ({ item }) => {
        const estoqueBaixo = item.quantidadeEstoque <= (item.estoqueMinimo || 0);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <TouchableOpacity onPress={() => setPreviewImagemModal(item.fotoUrl || item.fotoLocalPath)}>
                        <View style={styles.fotoContainer}>
                            {item.fotoUrl || item.fotoLocalPath ? (
                                <Image source={{ uri: item.fotoUrl || item.fotoLocalPath }} style={styles.foto} />
                            ) : (
                                <Feather name="image" size={24} color="#94a3b8" />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.dadosProduto}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.skuTxt}>{item.sku}</Text>
                            <Feather name={item.ativo ? "check-circle" : "slash"} size={16} color={item.ativo ? "#22c55e" : "#ef4444"} />
                        </View>
                        <Text style={styles.nomeTxt} numberOfLines={2}>{item.nome}</Text>
                        <Text style={styles.marcaTxt}>{item.marca?.nome} • {item.categoria?.nome || 'S/ Cat'}</Text>
                    </View>
                </View>

                <View style={styles.cardMiddle}>
                    <View style={[styles.badgeEstoque, estoqueBaixo ? styles.badgeEstoqueBaixo : styles.badgeEstoqueNormal]}>
                        <Text style={[styles.estoqueTxt, estoqueBaixo ? styles.txtEstoqueBaixo : styles.txtEstoqueNormal]}>
                            {item.quantidadeEstoque} {item.unidadeMedida}
                        </Text>
                    </View>
                    <Text style={styles.precoTxt}>R$ {(item.precoVenda || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity onPress={() => setModalAplicacao({ aberto: true, texto: item.aplicacao, nome: item.nome })} style={[styles.btnAcao, {backgroundColor: '#eff6ff', borderColor: '#bfdbfe'}]}>
                        <Feather name="info" size={18} color="#2563eb" />
                        <Text style={[styles.btnAcaoTxt, {color: '#2563eb'}]}>Aplicação</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => abrirEditar(item)} style={[styles.btnAcao, {backgroundColor: '#f8fafc', borderColor: '#cbd5e1', flex: 0.8}]}>
                        <Feather name="edit" size={18} color="#475569" />
                        <Text style={[styles.btnAcaoTxt, {color: '#475569'}]}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ============================================================================
    // 📱 CONTROLE DE ROTEAMENTO INTERNO
    // ============================================================================

    // Se a câmera de pesquisa estiver aberta, renderiza tela preta de scan
    if (cameraAtiva) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={lidarComScan} />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerBox} />
                    <Text style={styles.scannerText}>Aponte para o código de barras para buscar</Text>
                </View>
                <TouchableOpacity onPress={() => setCameraAtiva(false)} style={styles.btnVoltarScan}>
                    <Text style={styles.btnTextoBranco}>CANCELAR BUSCA</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (telaAtual === 'formulario') {
        return (
            <CadastroProduto
                produtoParaEditar={produtoSelecionado}
                onVoltar={() => {
                    setTelaAtual('lista');
                    carregarDados();
                }}
            />
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.titulo}>Gestão de Peças</Text>
                        <Text style={styles.subtitulo}>Verifique estoque, preços e edite dados</Text>
                    </View>
                </View>

                <View style={styles.headerBtns}>
                    <TouchableOpacity onPress={() => onNavigate && onNavigate('inventario')} style={styles.btnColetor}>
                        <Feather name="maximize" size={20} color="#60a5fa" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 🚀 BARRA DE BUSCA ARTILHADA COM SCANNER */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nome, Cód, EAN ou Ref..."
                        value={busca}
                        onChangeText={setBusca}
                    />
                    {carregando && <ActivityIndicator size="small" color="#2563eb" style={{position: 'absolute', right: 65}} />}

                    {/* Botão de abrir a câmera */}
                    <TouchableOpacity onPress={abrirCameraBusca} style={styles.btnScanBar}>
                        <Feather name="maximize" size={20} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={produtos}
                keyExtractor={item => item.id.toString()}
                renderItem={renderProduto}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !carregando && (
                        <View style={styles.emptyBox}>
                            <Feather name="package" size={60} color="#cbd5e1" />
                            <Text style={styles.emptyTxt}>Nenhuma peça encontrada.</Text>
                        </View>
                    )
                }
            />

            {/* MODAL CONSULTA DE APLICAÇÃO */}
            <Modal visible={modalAplicacao.aberto} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalAppBox}>
                        <View style={styles.modalAppHeader}>
                            <View>
                                <Text style={styles.modalAppTitle}>Consultar Aplicação</Text>
                                <Text style={styles.modalAppSub} numberOfLines={1}>{modalAplicacao.nome}</Text>
                            </View>
                            <TouchableOpacity onPress={fecharModalConsulta} style={styles.btnFecharApp}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalAppSearch}>
                            <Feather name="search" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.modalAppInput}
                                placeholder="Modelo, motor, ano..."
                                value={filtroModal}
                                onChangeText={setFiltroModal}
                                autoFocus
                            />
                        </View>

                        <ScrollView style={styles.modalAppList}>
                            {linhasFiltradas.length > 0 ? (
                                linhasFiltradas.map((linha, idx) => (
                                    <View key={idx} style={styles.modalAppItem}>
                                        <View style={styles.carIcon}><Feather name="truck" size={16} color="#2563eb" /></View>
                                        <Text style={styles.modalAppText}>{linha}</Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyBox}>
                                    <Feather name="slash" size={40} color="#cbd5e1" />
                                    <Text style={styles.emptyTxt}>Veículo não encontrado.</Text>
                                </View>
                            )}
                        </ScrollView>
                        <View style={styles.modalAppFooter}>
                            <Text style={styles.modalAppFooterTxt}>{linhasFiltradas.length} de {todasAsLinhas.length} veículos compatíveis</Text>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* MODAL ZOOM DE IMAGEM */}
            <Modal visible={!!previewImagemModal} transparent={true} animationType="fade">
                <View style={styles.modalImgOverlay}>
                    <TouchableOpacity style={styles.btnFecharImg} onPress={() => setPreviewImagemModal(null)}>
                        <Feather name="x" size={30} color="#fff" />
                    </TouchableOpacity>
                    {previewImagemModal && (
                        <Image source={{ uri: previewImagemModal }} style={styles.imgZoom} resizeMode="contain" />
                    )}
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 'bold' },
    headerBtns: { flexDirection: 'row', gap: 10 },
    btnColetor: { backgroundColor: '#1e293b', padding: 12, borderRadius: 12 },

    // 🚀 ESTILOS DA NOVA BARRA DE BUSCA
    searchContainer: { margin: 15 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    btnScanBar: { padding: 15, backgroundColor: '#eff6ff', borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },

    // ESTILOS DA CÂMERA SOBREPOSTA
    scannerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
    scannerBox: { width: 250, height: 150, borderWidth: 4, borderColor: '#22c55e', borderRadius: 20, backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    scannerText: { color: '#22c55e', fontWeight: '900', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 10 },
    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 },
    btnTextoBranco: { color: '#fff', fontWeight: '900', fontSize: 16 },

    listContent: { paddingHorizontal: 15, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

    cardHeader: { flexDirection: 'row', gap: 15 },
    fotoContainer: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    foto: { width: '100%', height: '100%' },
    dadosProduto: { flex: 1 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    skuTxt: { fontSize: 12, fontWeight: '900', color: '#94a3b8', fontFamily: 'monospace' },
    nomeTxt: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginTop: 2 },
    marcaTxt: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 2, textTransform: 'uppercase' },

    cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    badgeEstoque: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeEstoqueNormal: { backgroundColor: '#dcfce7' },
    badgeEstoqueBaixo: { backgroundColor: '#fee2e2' },
    estoqueTxt: { fontSize: 12, fontWeight: '900' },
    txtEstoqueNormal: { color: '#16a34a' },
    txtEstoqueBaixo: { color: '#ef4444' },
    precoTxt: { fontSize: 18, fontWeight: '900', color: '#2563eb' },

    cardFooter: { flexDirection: 'row', gap: 10, marginTop: 5 },
    btnAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, gap: 5 },
    btnAcaoTxt: { fontSize: 12, fontWeight: '900' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyTxt: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#94a3b8' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalAppBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
    modalAppHeader: { backgroundColor: '#2563eb', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalAppTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    modalAppSub: { color: '#bfdbfe', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 2, width: 250 },
    btnFecharApp: { padding: 5 },
    modalAppSearch: { padding: 15, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
    modalAppInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    modalAppList: { flex: 1, padding: 15 },
    modalAppItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
    carIcon: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 8, marginRight: 15 },
    modalAppText: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#334155' },
    modalAppFooter: { padding: 15, borderTopWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    modalAppFooterTxt: { fontSize: 12, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },

    modalImgOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
    btnFecharImg: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    imgZoom: { width: '90%', height: '70%', borderRadius: 20 }
});