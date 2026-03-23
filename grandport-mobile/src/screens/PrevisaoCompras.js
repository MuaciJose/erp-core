import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';

export default function PrevisaoCompras({ onVoltar }) {
    const [previsoes, setPrevisoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarPrevisoes();
    }, []);

    const carregarPrevisoes = async () => {
        try {
            const res = await api.get('/api/estoque/previsao-reposicao');
            setPrevisoes(res.data);
        } catch (error) {
            console.error("Erro ao carregar previsões:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderPrevisao = ({ item }) => {
        const critico = item.diasRestantes <= 7;

        return (
            <View style={[styles.card, critico ? styles.cardCritico : styles.cardNormal]}>

                {/* TOPO: NOME E ALERTA */}
                <View style={styles.cardHeader}>
                    <Text style={styles.nomeProduto} numberOfLines={2}>{item.nome}</Text>
                    {critico && <Feather name="alert-circle" size={24} color="#ef4444" />}
                </View>

                {/* DADOS DE GIRO (Média e Dias) */}
                <View style={styles.giroBox}>
                    <View style={styles.giroItem}>
                        <Feather name="trending-up" size={14} color="#64748b" />
                        <Text style={styles.giroTxt}>{item.mediaVendaDiaria.toFixed(2)} / dia</Text>
                    </View>
                    <View style={styles.giroItem}>
                        <Feather name="calendar" size={14} color="#64748b" />
                        <Text style={[styles.giroTxt, critico && { color: '#ef4444', fontWeight: '900' }]}>
                            Rende {item.diasRestantes} dias
                        </Text>
                    </View>
                </View>

                {/* RODAPÉ: ESTOQUE VS SUGESTÃO */}
                <View style={styles.footerValores}>
                    <View style={styles.estoqueBox}>
                        <Text style={styles.lblEstoque}>ESTOQUE ATUAL</Text>
                        <Text style={[styles.valEstoque, item.estoqueAtual <= 5 && { color: '#ef4444' }]}>
                            {item.estoqueAtual}
                        </Text>
                    </View>

                    <View style={styles.sugestaoBox}>
                        <Text style={styles.lblSugestao}>SUGESTÃO DE COMPRA</Text>
                        <Text style={styles.valSugestao}>+ {item.sugestaoCompra}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.titulo}>Planejamento</Text>
                        <Text style={styles.subtitulo}>Sugestões baseadas no giro de 30 dias</Text>
                    </View>
                </View>
                <View style={styles.iconBox}>
                    <Feather name="shopping-cart" size={24} color="#ea580c" />
                </View>
            </View>

            {/* LISTA */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingTxt}>Analisando inteligência de estoque...</Text>
                </View>
            ) : (
                <FlatList
                    data={previsoes}
                    keyExtractor={item => item.produtoId.toString()}
                    renderItem={renderPrevisao}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Feather name="check-circle" size={60} color="#10b981" />
                            <Text style={styles.emptyTxt}>Estoque 100% Saudável!</Text>
                            <Text style={styles.emptySub}>Nenhuma compra urgente necessária.</Text>
                        </View>
                    }
                />
            )}
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
    iconBox: { backgroundColor: '#fff7ed', padding: 10, borderRadius: 12 },

    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingTxt: { marginTop: 15, color: '#64748b', fontWeight: 'bold' },

    listContent: { padding: 20, paddingBottom: 50 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 2 },
    cardNormal: { borderColor: '#f8fafc' },
    cardCritico: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
    nomeProduto: { flex: 1, fontSize: 16, fontWeight: '900', color: '#1e293b' },

    giroBox: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 20 },
    giroItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    giroTxt: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },

    footerValores: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 15 },

    estoqueBox: { alignItems: 'center' },
    lblEstoque: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
    valEstoque: { fontSize: 22, fontWeight: 'black', color: '#1e293b' },

    sugestaoBox: { backgroundColor: '#fff7ed', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', alignItems: 'center', minWidth: 140 },
    lblSugestao: { fontSize: 10, fontWeight: '900', color: '#ea580c', letterSpacing: 1 },
    valSugestao: { fontSize: 24, fontWeight: 'black', color: '#c2410c' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyTxt: { marginTop: 15, fontSize: 18, fontWeight: '900', color: '#10b981' },
    emptySub: { marginTop: 5, fontSize: 14, fontWeight: 'bold', color: '#94a3b8' },
});