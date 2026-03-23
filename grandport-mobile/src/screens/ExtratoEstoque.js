import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';

export default function ExtratoEstoque({ produto, onVoltar }) {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarHistorico();
    }, []);

    const carregarHistorico = async () => {
        try {
            // Vai buscar TODAS as movimentações ao backend
            const res = await api.get('/api/produtos/movimentacoes');

            // Filtra no telemóvel apenas as movimentações desta peça específica
            const historicoPeca = res.data.filter(m => m.produtoSku === produto.sku);

            // Ordena da mais recente para a mais antiga
            historicoPeca.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

            setMovimentacoes(historicoPeca);
        } catch (error) {
            console.log("Erro ao carregar extrato:", error);
        } finally {
            setCarregando(false);
        }
    };

    const formatarData = (dataHora) => {
        if (!dataHora) return 'Data desconhecida';
        try {
            const data = new Date(dataHora);
            return data.toLocaleDateString('pt-PT') + ' às ' + data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dataHora;
        }
    };

    const renderMovimento = ({ item, index }) => {
        const isEntrada = item.tipo === 'ENTRADA';
        const isUltimo = index === movimentacoes.length - 1;

        return (
            <View style={styles.timelineContainer}>
                {/* LINHA VERTICAL E ÍCONE */}
                <View style={styles.linhaEsquerda}>
                    <View style={[styles.bolinha, { backgroundColor: isEntrada ? '#10b981' : '#ef4444' }]}>
                        <Feather name={isEntrada ? 'arrow-down-left' : 'arrow-up-right'} size={14} color="#fff" />
                    </View>
                    {!isUltimo && <View style={styles.linhaVertical} />}
                </View>

                {/* CARTÃO DE DADOS */}
                <View style={styles.cardMovimento}>
                    <View style={styles.cardTopo}>
                        <Text style={[styles.txtTipo, { color: isEntrada ? '#10b981' : '#ef4444' }]}>
                            {item.tipo}
                        </Text>
                        <Text style={styles.txtData}>{formatarData(item.dataHora)}</Text>
                    </View>

                    <Text style={styles.txtMotivo} numberOfLines={2}>{item.motivo || 'Sem motivo registado'}</Text>

                    <View style={styles.cardRodape}>
                        <View style={styles.saldoBox}>
                            <Text style={styles.lblSaldo}>SALDO ANTERIOR</Text>
                            <Text style={styles.valSaldo}>{item.saldoAnterior}</Text>
                        </View>

                        <Feather name="arrow-right" size={16} color="#cbd5e1" style={{ marginHorizontal: 10 }} />

                        <View style={styles.saldoBox}>
                            <Text style={styles.lblSaldo}>NOVO SALDO</Text>
                            <Text style={[styles.valSaldo, { color: '#1e293b', fontWeight: 'black' }]}>{item.saldoAtual}</Text>
                        </View>

                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={[styles.valQtd, { color: isEntrada ? '#10b981' : '#ef4444' }]}>
                                {isEntrada ? '+' : '-'}{item.quantidade}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.titulo}>Auditoria de Estoque</Text>
                    <Text style={styles.subtitulo} numberOfLines={1}>{produto.sku} • {produto.nome}</Text>
                </View>
            </View>

            {/* LISTA (LINHA DO TEMPO) */}
            {carregando ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#d97706" />
                    <Text style={styles.loadingTxt}>A carregar registos de segurança...</Text>
                </View>
            ) : (
                <FlatList
                    data={movimentacoes}
                    keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                    renderItem={renderMovimento}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <Feather name="clock" size={60} color="#cbd5e1" />
                            <Text style={styles.emptyTxt}>Nenhum registo encontrado</Text>
                            <Text style={styles.emptySub}>Esta peça ainda não teve movimentações.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    headerInfo: { flex: 1 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#d97706', fontWeight: 'bold' },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: 'bold' },
    emptyTxt: { marginTop: 15, fontSize: 18, fontWeight: 'black', color: '#94a3b8' },
    emptySub: { marginTop: 5, fontSize: 14, fontWeight: 'bold', color: '#cbd5e1' },

    listContent: { padding: 20, paddingBottom: 50 },

    timelineContainer: { flexDirection: 'row', marginBottom: 10 },
    linhaEsquerda: { width: 30, alignItems: 'center' },
    bolinha: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 3, borderColor: '#f8fafc' },
    linhaVertical: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: -5, marginBottom: -15 },

    cardMovimento: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 15, marginLeft: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    txtTipo: { fontSize: 11, fontWeight: 'black', letterSpacing: 1 },
    txtData: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },

    txtMotivo: { fontSize: 14, color: '#334155', fontWeight: '600', marginBottom: 15 },

    cardRodape: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 10 },
    saldoBox: { alignItems: 'flex-start' },
    lblSaldo: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
    valSaldo: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
    valQtd: { fontSize: 18, fontWeight: 'black' },
});