import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios'; // Nosso rádio comunicador

export default function Configuracoes() {
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🚀 O Celular agora liga para o Java e pede os dados reais!
        const buscarDadosEmpresa = async () => {
            try {
                const res = await api.get('/api/configuracoes');

                // O Java pode devolver uma lista ou um objeto. Tratamos os dois casos:
                const dadosReais = Array.isArray(res.data) ? res.data[0] : res.data;

                setEmpresa(dadosReais);
            } catch (error) {
                console.log("Erro ao buscar empresa:", error);
                Alert.alert("Erro de Comunicação", "Não foi possível carregar os dados do servidor.");
            } finally {
                setLoading(false);
            }
        };

        buscarDadosEmpresa();
    }, []);

    // Se estiver carregando, mostra a rodinha girando
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Buscando dados no servidor...</Text>
            </View>
        );
    }

    // Se a API não devolveu nada
    if (!empresa) {
        return (
            <View style={styles.loadingContainer}>
                <Feather name="alert-triangle" size={40} color="#f59e0b" />
                <Text style={styles.loadingText}>Nenhuma empresa configurada no ERP.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Feather name="briefcase" size={32} color="#ffffff" />
                </View>
                {/* 🚀 PUXANDO DADOS REAIS DO BANCO! */}
                <Text style={styles.titulo}>{empresa.nomeFantasia || 'Nome Não Informado'}</Text>
                <Text style={styles.subtitulo}>{empresa.razaoSocial || 'Razão Social Não Informada'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Dados Oficiais</Text>

                <View style={styles.infoRow}>
                    <Feather name="file-text" size={18} color="#64748b" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>CNPJ</Text>
                        <Text style={styles.valor}>{empresa.cnpj || 'Não cadastrado'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="phone" size={18} color="#64748b" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>WhatsApp / Telefone</Text>
                        <Text style={styles.valor}>{empresa.telefone || 'Não cadastrado'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Feather name="mail" size={18} color="#64748b" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>E-mail</Text>
                        <Text style={styles.valor}>{empresa.email || 'Não cadastrado'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Localização</Text>

                <View style={styles.infoRow}>
                    <Feather name="map-pin" size={18} color="#64748b" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>Endereço Completo</Text>
                        <Text style={styles.valor}>
                            {empresa.logradouro ? `${empresa.logradouro}, ${empresa.numero || 'S/N'}` : 'Endereço não cadastrado'}
                        </Text>
                        <Text style={styles.valor}>
                            {empresa.bairro ? `${empresa.bairro} - ${empresa.cidade}/${empresa.uf}` : ''}
                        </Text>
                        <Text style={styles.valor}>
                            {empresa.cep ? `CEP: ${empresa.cep}` : ''}
                        </Text>
                    </View>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#64748b', fontWeight: 'bold' },
    header: { backgroundColor: '#0f172a', padding: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10, marginBottom: 20 },
    iconContainer: { backgroundColor: '#2563eb', width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    titulo: { fontSize: 24, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
    subtitulo: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
    card: { backgroundColor: '#ffffff', marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    sectionTitle: { fontSize: 12, fontWeight: 'black', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    infoTextContainer: { marginLeft: 12, flex: 1 },
    label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
    valor: { fontSize: 15, fontWeight: '600', color: '#334155' }
});