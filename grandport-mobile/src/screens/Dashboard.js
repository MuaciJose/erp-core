import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function Dashboard({ onNavigate, onLogout }) {
    const [carregando, setCarregando] = useState(false);
    const [alertas, setAlertas] = useState(0);
    const [saudacao, setSaudacao] = useState('');

    // ============================================================================
    // ⚙️ INICIALIZAÇÃO E DADOS
    // ============================================================================
    useEffect(() => {
        definirSaudacao();
        carregarResumo();
    }, []);

    const definirSaudacao = () => {
        const hora = new Date().getHours();
        if (hora < 12) setSaudacao('Bom dia');
        else if (hora < 18) setSaudacao('Boa tarde');
        else setSaudacao('Boa noite');
    };

    const carregarResumo = async () => {
        setCarregando(true);
        try {
            // Busca quantos produtos estão com estoque abaixo do mínimo
            const resAlertas = await api.get('/api/produtos/alertas');
            setAlertas(resAlertas.data?.length || 0);
        } catch (error) {
            console.log("Erro ao carregar dashboard:", error);
            // Silencioso, para não travar a tela principal se a rota falhar
        } finally {
            setCarregando(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('grandport_token');
        Toast.show({ type: 'info', text1: 'Sessão Encerrada' });
        onLogout();
    };

    // ============================================================================
    // 🎨 COMPONENTES DA TELA
    // ============================================================================
    return (
        <View style={styles.container}>

            {/* CABEÇALHO EXECUTIVO */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.saudacaoTxt}>{saudacao},</Text>
                        <Text style={styles.nomeTxt}>Comandante</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.btnLogout}>
                        <Feather name="power" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* PLACAR DE RESUMO (STATUS DO ESTOQUE) */}
                <View style={styles.placarContainer}>
                    <View style={styles.placarCard}>
                        <View style={styles.placarIconeAzul}>
                            <Feather name="package" size={24} color="#3b82f6" />
                        </View>
                        <View>
                            <Text style={styles.placarTitulo}>Status Base</Text>
                            <Text style={styles.placarValor}>Online</Text>
                        </View>
                    </View>

                    {/* 👇 Transformamos em TouchableOpacity 👇 */}
                    <TouchableOpacity style={styles.placarCard} onPress={() => onNavigate('previsao')}>
                        <View style={[styles.placarIconeAzul, { backgroundColor: alertas > 0 ? '#fee2e2' : '#dcfce7' }]}>
                            <Feather name="alert-triangle" size={24} color={alertas > 0 ? "#ef4444" : "#22c55e"} />
                        </View>
                        <View>
                            <Text style={styles.placarTitulo}>Estoque Baixo</Text>
                            <Text style={[styles.placarValor, { color: alertas > 0 ? '#ef4444' : '#1e293b' }]}>
                                {carregando ? <ActivityIndicator size="small" color="#ef4444" /> : `${alertas} peças`}
                            </Text>
                        </View>
                    </TouchableOpacity>


                </View>
            </View>

            {/* CORPO DO PAINEL (MENU GRID) */}
            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarResumo} />}
            >
                <Text style={styles.secaoTitulo}>Menu de Operações</Text>

                <View style={styles.grid}>

                    {/* BOTÃO 1: CONSULTA DE PEÇAS (Abre a lista completa) */}
                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('produtos')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#eff6ff' }]}>
                            <Feather name="search" size={32} color="#2563eb" />
                        </View>
                        <Text style={styles.tituloGrid}>Gestão de Peças</Text>
                        <Text style={styles.subGrid}>Consulta, Edição e Aplicação</Text>
                    </TouchableOpacity>

                    {/* BOTÃO 2: COLETOR DE DADOS (Abre a Câmera/Inventário) */}
                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('inventario')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#f0fdf4' }]}>
                            <Feather name="maximize" size={32} color="#16a34a" />
                        </View>
                        <Text style={styles.tituloGrid}>Coletor (Scanner)</Text>
                        <Text style={styles.subGrid}>Ajuste Rápido e Inventário</Text>
                    </TouchableOpacity>

                    {/* BOTÃO 3: ORÇAMENTO / PDV MOBILE */}
                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('orcamento')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#fefce8' }]}>
                            <Feather name="shopping-cart" size={32} color="#ca8a04" />
                        </View>
                        <Text style={styles.tituloGrid}>PDV Mobile</Text>
                        <Text style={styles.subGrid}>Orçamento pelo WhatsApp</Text>
                    </TouchableOpacity>

                    {/* BOTÃO 4: RELATÓRIOS (Futuro) */}
                    <TouchableOpacity style={[styles.btnGrid, { opacity: 0.6 }]} disabled>
                        <View style={[styles.iconeGrid, { backgroundColor: '#f3e8ff' }]}>
                            <Feather name="pie-chart" size={32} color="#7c3aed" />
                        </View>
                        <Text style={styles.tituloGrid}>Relatórios</Text>
                        <Text style={styles.subGrid}>Em breve...</Text>
                    </TouchableOpacity>

                </View>

                <View style={styles.footerInfo}>
                    <Text style={styles.versaoTxt}>GrandPort ERP Mobile v1.0</Text>
                    <Text style={styles.syncTxt}><Feather name="wifi" size={12}/> Conectado ao Servidor Oficial</Text>
                </View>
                <View style={{height: 50}} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    // CABEÇALHO ESCURO (Centro de Comando)
    header: { backgroundColor: '#0f172a', paddingTop: 60, paddingHorizontal: 25, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, zIndex: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    saudacaoTxt: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
    nomeTxt: { color: '#f8fafc', fontSize: 24, fontWeight: 'black' },
    btnLogout: { backgroundColor: '#1e293b', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155' },

    // PLACAR DE STATUS
    placarContainer: { flexDirection: 'row', gap: 15, marginTop: 30 },
    placarCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#334155' },
    placarIconeAzul: { backgroundColor: '#1e3a8a', padding: 10, borderRadius: 12 },
    placarTitulo: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    placarValor: { color: '#f8fafc', fontSize: 18, fontWeight: 'black', marginTop: 2 },

    // CORPO E MENU GRID
    body: { flex: 1, padding: 25, marginTop: -20 },
    secaoTitulo: { fontSize: 16, fontWeight: 'black', color: '#334155', marginBottom: 15, marginLeft: 5 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    btnGrid: { width: '47%', backgroundColor: '#fff', padding: 20, borderRadius: 24, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 5 },
    iconeGrid: { padding: 15, borderRadius: 16, marginBottom: 15 },
    tituloGrid: { fontSize: 15, fontWeight: 'black', color: '#1e293b', marginBottom: 5 },
    subGrid: { fontSize: 11, color: '#64748b', fontWeight: 'bold' },

    // RODAPÉ INFORMATIVO
    footerInfo: { alignItems: 'center', marginTop: 40 },
    versaoTxt: { color: '#94a3b8', fontWeight: '900', fontSize: 12 },
    syncTxt: { color: '#10b981', fontWeight: 'bold', fontSize: 10, marginTop: 5 },
});