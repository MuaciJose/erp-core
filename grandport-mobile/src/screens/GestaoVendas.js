import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal, ScrollView, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function GestaoVendas({ onVoltar, onNavigate }) {
    const [vendas, setVendas] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);

    // Controle do Espelho (Modal de Detalhes)
    const [vendaSelecionada, setVendaSelecionada] = useState(null);

    // ============================================================================
    // 🛡️ BLINDAGEM TÁTICA: EXTRATOR DE NOME SEGURO
    // ============================================================================
    const getNomeCliente = (clienteData) => {
        if (!clienteData) return "Consumidor Final";
        if (typeof clienteData === 'string') return clienteData; // Se o Java mandar só o texto
        if (clienteData.nome) return clienteData.nome; // Se o Java mandar o pacote completo
        return "Consumidor Final";
    };

    // ============================================================================
    // 📡 BUSCA DE DADOS NO SERVIDOR
    // ============================================================================
    const carregarVendas = async () => {
        setCarregando(true);
        try {
            const res = await api.get('/api/vendas');
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            setVendas(lista);
        } catch (error) {
            console.log("Erro ao carregar vendas:", error);
            Toast.show({ type: 'error', text1: 'Falha na conexão', text2: 'Não foi possível carregar a lista.' });
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarVendas();
    }, []);

    // ============================================================================
    // 🔍 FILTRO LOCAL E FORMATAÇÃO
    // ============================================================================
    const vendasFiltradas = vendas.filter(v => {
        const termo = busca.toLowerCase();
        const idMatch = v.id?.toString().includes(termo);
        const clienteMatch = getNomeCliente(v.cliente).toLowerCase().includes(termo);
        const veiculoMatch = (v.veiculo?.modelo || "").toLowerCase().includes(termo);
        return idMatch || clienteMatch || veiculoMatch;
    });

    const formatarData = (dataHora) => {
        if (!dataHora) return '--/--/----';
        try {
            const d = new Date(dataHora);
            return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
        } catch (e) { return dataHora; }
    };

    // ============================================================================
    // 🎨 RENDERIZADOR DOS STATUS (BADGES)
    // ============================================================================
    const renderBadgeStatus = (status) => {
        switch(status) {
            case 'ORCAMENTO':
                return <View style={[styles.badge, {backgroundColor: '#eff6ff', borderColor: '#bfdbfe'}]}><Feather name="file-text" size={10} color="#2563eb" /><Text style={[styles.badgeTxt, {color: '#2563eb'}]}>Orçamento</Text></View>;
            case 'PEDIDO':
                return <View style={[styles.badge, {backgroundColor: '#fff7ed', borderColor: '#fed7aa'}]}><Feather name="package" size={10} color="#ea580c" /><Text style={[styles.badgeTxt, {color: '#ea580c'}]}>Pedido</Text></View>;
            case 'AGUARDANDO_PAGAMENTO':
                return <View style={[styles.badge, {backgroundColor: '#faf5ff', borderColor: '#e9d5ff'}]}><Feather name="credit-card" size={10} color="#9333ea" /><Text style={[styles.badgeTxt, {color: '#9333ea'}]}>No Caixa</Text></View>;
            case 'CONCLUIDA':
                return <View style={[styles.badge, {backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'}]}><Feather name="check-circle" size={10} color="#16a34a" /><Text style={[styles.badgeTxt, {color: '#16a34a'}]}>Faturado</Text></View>;
            default:
                return <View style={[styles.badge, {backgroundColor: '#f1f5f9', borderColor: '#e2e8f0'}]}><Text style={[styles.badgeTxt, {color: '#64748b'}]}>{status}</Text></View>;
        }
    };

    // ============================================================================
    // 💬 WHATSAPP DO ESPELHO DA VENDA
    // ============================================================================
    const enviarWhatsAppEspelho = () => {
        if (!vendaSelecionada) return;

        let texto = `*RESUMO DO DOCUMENTO #${vendaSelecionada.id}*\n`;
        texto += `👤 Cliente: *${getNomeCliente(vendaSelecionada.cliente)}*\n`;
        texto += `📅 Data: ${formatarData(vendaSelecionada.dataHora)}\n\n`;

        const itens = vendaSelecionada.itens || [];
        itens.forEach(item => {
            const nome = item.produto?.nome || item.nome;
            const qtd = item.quantidade || item.qtd;
            const preco = item.precoUnitario || item.preco || 0;
            texto += `🔹 ${qtd}x ${nome}\n   *R$ ${(preco * qtd).toFixed(2)}*\n\n`;
        });

        if (vendaSelecionada.desconto > 0) texto += `Desconto: - R$ ${vendaSelecionada.desconto.toFixed(2)}\n`;
        texto += `*TOTAL GERAL: R$ ${(vendaSelecionada.valorTotal || vendaSelecionada.total || 0).toFixed(2)}*\n\n`;

        const url = `whatsapp://send?text=${encodeURIComponent(texto)}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Toast.show({ type: 'error', text1: 'WhatsApp não instalado!' });
        });
    };

    // ============================================================================
    // 🎨 RENDERIZAÇÃO DA TELA
    // ============================================================================
    return (
        <View style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.titulo}>Central de Vendas</Text>
                        <Text style={styles.subtitulo}>Acompanhe orçamentos e pedidos</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => onNavigate('orcamento')} style={styles.btnNovo}>
                    <Feather name="plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* BARRA DE BUSCA */}
            <View style={styles.buscaContainer}>
                <View style={styles.inputWrapper}>
                    <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar Nº, Cliente ou Veículo..."
                        value={busca}
                        onChangeText={setBusca}
                    />
                    {busca.length > 0 && (
                        <TouchableOpacity onPress={() => setBusca('')} style={{padding: 10}}>
                            <Feather name="x" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* LISTA DE VENDAS */}
            {carregando ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingTxt}>Buscando registros no servidor...</Text>
                </View>
            ) : (
                <FlatList
                    data={vendasFiltradas}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.lista}
                    refreshing={carregando}
                    onRefresh={carregarVendas}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <Feather name="inbox" size={60} color="#cbd5e1" />
                            <Text style={styles.emptyTxt}>Nenhuma venda encontrada.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => setVendaSelecionada(item)}>
                            <View style={styles.cardTopo}>
                                <Text style={styles.txtId}>#{item.id}</Text>
                                {renderBadgeStatus(item.status)}
                            </View>

                            {/* 🚀 NOME BLINDADO AQUI */}
                            <Text style={styles.txtCliente} numberOfLines={1}>
                                {getNomeCliente(item.cliente)}
                            </Text>

                            {item.veiculo && (
                                <Text style={styles.txtVeiculo}><Feather name="truck" size={12}/> {item.veiculo.modelo}</Text>
                            )}

                            <View style={styles.cardRodape}>
                                <Text style={styles.txtData}><Feather name="clock" size={12}/> {formatarData(item.dataHora)}</Text>
                                <Text style={styles.txtTotal}>R$ {(item.valorTotal || item.total || 0).toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* ============================================================================ */}
            {/* 🔍 MODAL DO ESPELHO DA VENDA (RESUMO)                                        */}
            {/* ============================================================================ */}
            <Modal visible={!!vendaSelecionada} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        {/* HEADER DO MODAL */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitulo}>RESUMO #{vendaSelecionada?.id}</Text>
                                <Text style={styles.modalSub}>{formatarData(vendaSelecionada?.dataHora)}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setVendaSelecionada(null)} style={styles.btnFecharModal}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* DADOS DO CLIENTE */}
                            <View style={styles.infoBox}>
                                <Text style={styles.lblInfo}>CLIENTE</Text>
                                {/* 🚀 NOME BLINDADO NO MODAL TAMBÉM */}
                                <Text style={styles.valInfo}>{getNomeCliente(vendaSelecionada?.cliente)}</Text>
                                {vendaSelecionada?.veiculo && (
                                    <Text style={styles.valSubInfo}><Feather name="truck" size={12}/> {vendaSelecionada.veiculo.modelo} ({vendaSelecionada.veiculo.placa})</Text>
                                )}
                            </View>

                            {/* LISTA DE ITENS */}
                            <Text style={[styles.lblInfo, { marginTop: 15, marginBottom: 5 }]}>ITENS DO DOCUMENTO</Text>
                            {(vendaSelecionada?.itens || []).map((item, idx) => {
                                const nome = item.produto?.nome || item.nome;
                                const qtd = item.quantidade || item.qtd;
                                const preco = item.precoUnitario || item.preco || 0;
                                return (
                                    <View key={idx} style={styles.itemRow}>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.itemNome} numberOfLines={2}>{nome}</Text>
                                            <Text style={styles.itemPreco}>{qtd} un x R$ {preco.toFixed(2)}</Text>
                                        </View>
                                        <Text style={styles.itemTotal}>R$ {(qtd * preco).toFixed(2)}</Text>
                                    </View>
                                );
                            })}

                            {/* TOTAIS */}
                            <View style={styles.totaisBox}>
                                <View style={styles.linhaTotal}>
                                    <Text style={styles.lblTot}>Subtotal:</Text>
                                    <Text style={styles.valTot}>R$ {(vendaSelecionada?.valorSubtotal || vendaSelecionada?.subtotal || 0).toFixed(2)}</Text>
                                </View>
                                {(vendaSelecionada?.desconto > 0) && (
                                    <View style={styles.linhaTotal}>
                                        <Text style={styles.lblTot}>Desconto:</Text>
                                        <Text style={[styles.valTot, {color: '#ef4444'}]}>- R$ {vendaSelecionada.desconto.toFixed(2)}</Text>
                                    </View>
                                )}
                                <View style={[styles.linhaTotal, { borderTopWidth: 1, borderColor: '#334155', paddingTop: 10, marginTop: 10 }]}>
                                    <Text style={[styles.lblTot, {color: '#f8fafc', fontWeight: 'black', fontSize: 16}]}>TOTAL GERAL:</Text>
                                    <Text style={[styles.valTot, {color: '#4ade80', fontWeight: 'black', fontSize: 24}]}>
                                        R$ {(vendaSelecionada?.valorTotal || vendaSelecionada?.total || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* RODAPÉ DO MODAL (AÇÕES) */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.btnAcaoModal} onPress={enviarWhatsAppEspelho}>
                                <Feather name="message-circle" size={20} color="#22c55e" />
                                <Text style={[styles.txtBtnModal, {color: '#22c55e'}]}>Enviar no WhatsApp</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

        </View>
    );
}

// ============================================================================
// 🎨 ESTILOS
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
    btnNovo: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },

    buscaContainer: { padding: 15 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

    lista: { paddingHorizontal: 15, paddingBottom: 30 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: 'bold' },
    emptyTxt: { marginTop: 15, fontSize: 18, fontWeight: 'black', color: '#94a3b8' },

    card: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    txtId: { fontSize: 16, fontWeight: 'black', color: '#1e293b' },

    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    badgeTxt: { fontSize: 10, fontWeight: 'black', textTransform: 'uppercase' },

    txtCliente: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
    txtVeiculo: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 2 },

    cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    txtData: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
    txtTotal: { fontSize: 18, fontWeight: 'black', color: '#10b981' },

    // MODAL ESPELHO
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#f8fafc', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
    modalHeader: { backgroundColor: '#1e293b', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitulo: { fontSize: 22, fontWeight: 'black', color: '#fff' },
    modalSub: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginTop: 2 },
    btnFecharModal: { backgroundColor: '#334155', padding: 8, borderRadius: 12 },

    modalBody: { padding: 20 },
    infoBox: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    lblInfo: { fontSize: 10, fontWeight: 'black', color: '#94a3b8', letterSpacing: 1 },
    valInfo: { fontSize: 18, fontWeight: 'black', color: '#1e293b', marginTop: 2 },
    valSubInfo: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 2 },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    itemNome: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    itemPreco: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', marginTop: 2 },
    itemTotal: { fontSize: 16, fontWeight: 'black', color: '#1e293b' },

    totaisBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginTop: 10, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    linhaTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    lblTot: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
    valTot: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },

    modalFooter: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    btnAcaoModal: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', padding: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    txtBtnModal: { fontSize: 16, fontWeight: 'black', color: '#22c55e' },
});