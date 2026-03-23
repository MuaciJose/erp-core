import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Dashboard({ onNavigate, onLogout }) {

    const fazerLogout = async () => {
        await AsyncStorage.removeItem('grandport_token');
        onLogout();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.saudacao}>Bem-vindo, Comandante</Text>
                    <Text style={styles.titulo}>Painel de Controle</Text>
                </View>
                <TouchableOpacity onPress={fazerLogout} style={styles.btnSair}>
                    <Feather name="log-out" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {/* 📦 BOTÃO DO INVENTÁRIO (O QUE JÁ TEMOS) */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('inventario')}>
                    <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                        <Feather name="maximize" size={32} color="#2563eb" />
                    </View>
                    <Text style={styles.cardTitle}>Coletor de Estoque</Text>
                    <Text style={styles.cardDesc}>Escanear peças e ajustar contagem</Text>
                </TouchableOpacity>

                {/* ➕ BOTÃO DE CADASTRAR PEÇA NOVA */}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('cadastro')}>
                    <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                        <Feather name="plus-circle" size={32} color="#16a34a" />
                    </View>
                    <Text style={styles.cardTitle}>Cadastrar Peça</Text>
                    <Text style={styles.cardDesc}>Adicionar novo produto com foto</Text>
                </TouchableOpacity>

                {/* + BOTÂO DE LISTAGEM DE PECAS*/}
                <TouchableOpacity style={styles.card} onPress={() => onNavigate('produtos')}>
                    <View style={[styles.iconBox, { backgroundColor: '#fee2e' }]}>
                        <Feather name="package" size={32} color="#ef4444" />
                    </View>
                    <Text style={styles.cardTitle}>Consulta de Peças</Text>
                    <Text style={styles.cardDesc}>Verificar estoque, preço e aplicação</Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: '#0f172a', padding: 30, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    saudacao: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    titulo: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
    btnSair: { backgroundColor: '#1e293b', p: 12, borderRadius: 12, padding: 10 },
    grid: { padding: 20, gap: 20, marginTop: 10 },
    card: { backgroundColor: '#ffffff', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    iconBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
    cardDesc: { fontSize: 14, color: '#64748b', fontWeight: '500' }
});