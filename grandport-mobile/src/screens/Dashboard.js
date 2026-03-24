import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 🚀 1. NOVO IMPORT BLINDADO DA TELA
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export default function Dashboard({ onNavigate, onLogout }) {
    const [nomeUsuario, setNomeUsuario] = useState('Usuário');
    const [nomeEmpresa, setNomeEmpresa] = useState('A carregar...');
    const [saudacao, setSaudacao] = useState('Bem-vindo');
    const [carregandoHeader, setCarregandoHeader] = useState(true);

    const [resumo, setResumo] = useState(null);
    const [carregandoResumo, setCarregandoResumo] = useState(true);

    useEffect(() => {
        definirSaudacao();
        carregarIdentificacao();
        carregarResumo();
    }, []);

    const definirSaudacao = () => {
        const hora = new Date().getHours();
        if (hora >= 5 && hora < 12) setSaudacao('Bom dia');
        else if (hora >= 12 && hora < 18) setSaudacao('Boa tarde');
        else setSaudacao('Boa noite');
    };

    // ============================================================================
    // 👤 BUSCA NOME DO USUÁRIO E DA EMPRESA (AGORA COM TOKEN)
    // ============================================================================
    const carregarIdentificacao = async () => {
        setCarregandoHeader(true);
        try {
            const nomeSalvo = await AsyncStorage.getItem('grandport_user_nome');
            if (nomeSalvo) {
                setNomeUsuario(nomeSalvo.split(' ')[0]);
            }

            // 🚀 RESGATA O TOKEN PARA TER PERMISSÃO
            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            try {
                const res = await api.get('/api/configuracoes/empresa', {
                    headers: { 'Authorization': `Bearer ${tokenLimpo}` }
                });
                if (res.data && res.data.nomeFantasia) {
                    setNomeEmpresa(res.data.nomeFantasia);
                } else if (res.data && res.data.razaoSocial) {
                    setNomeEmpresa(res.data.razaoSocial);
                } else {
                    setNomeEmpresa('Minha Empresa');
                }
            } catch (err) {
                setNomeEmpresa('Sistema Mobile');
            }
        } catch (error) {
            console.log("Erro ao carregar identificação:", error);
        } finally {
            setCarregandoHeader(false);
        }
    };

    // ============================================================================
    // 📊 BUSCA OS DADOS DE RESUMO (AGORA COM TOKEN)
    // ============================================================================
    const carregarResumo = async () => {
        setCarregandoResumo(true);
        try {
            // 🚀 RESGATA O TOKEN PARA TER PERMISSÃO DE VER OS KPIS
            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            const res = await api.get('/api/dashboard/resumo', {
                headers: { 'Authorization': `Bearer ${tokenLimpo}` }
            });
            setResumo(res.data);
        } catch (error) {
            console.log("Erro ao carregar resumo do dashboard:", error);
        } finally {
            setCarregandoResumo(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {carregandoHeader ? (
                        <ActivityIndicator size="small" color="#64748b" />
                    ) : (
                        <View style={styles.badgeEmpresa}>
                            <Feather name="briefcase" size={12} color="#94a3b8" />
                            <Text style={styles.txtEmpresa}>{nomeEmpresa}</Text>
                        </View>
                    )}

                    <TouchableOpacity onPress={onLogout} style={styles.btnSair}>
                        <Feather name="log-out" size={16} color="#f8fafc" />
                        <Text style={styles.txtSair}>Sair</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.txtSaudacao}>{saudacao},</Text>
                <Text style={styles.txtNomeUsuario}>{nomeUsuario}!</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.resumoContainer}>
                    <Text style={styles.lblSessao}>VISÃO GERAL DO NEGÓCIO</Text>

                    {carregandoResumo ? (
                        <View style={styles.kpiLoading}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.txtLoadingKpi}>A processar métricas...</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>

                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcone, { backgroundColor: '#dcfce7' }]}>
                                    <Feather name="trending-up" size={20} color="#16a34a" />
                                </View>
                                <Text style={styles.kpiValor}>R$ {(resumo?.faturamentoMes || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
                                <Text style={styles.kpiTitulo}>Faturação Mensal</Text>
                            </View>

                            <View style={[styles.kpiCard, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
                                <View style={[styles.kpiIcone, { backgroundColor: '#fee2e2' }]}>
                                    <Feather name="alert-circle" size={20} color="#dc2626" />
                                </View>
                                <Text style={[styles.kpiValor, { color: '#dc2626' }]}>R$ {(resumo?.receberAtrasado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
                                <Text style={styles.kpiTitulo}>Contas em Atraso</Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcone, { backgroundColor: '#eff6ff' }]}>
                                    <Feather name="shopping-bag" size={20} color="#2563eb" />
                                </View>
                                <Text style={styles.kpiValor}>{resumo?.vendasHoje || 0}</Text>
                                <Text style={styles.kpiTitulo}>Pedidos Hoje</Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcone, { backgroundColor: '#ffedd5' }]}>
                                    <Feather name="package" size={20} color="#ea580c" />
                                </View>
                                <Text style={styles.kpiValor}>{resumo?.produtosBaixoEstoque || 0}</Text>
                                <Text style={styles.kpiTitulo}>Peças em Falta</Text>
                            </View>

                        </ScrollView>
                    )}

                    {!carregandoResumo && resumo?.crmAtrasados > 0 && (
                        <View style={styles.crmAlertBox}>
                            <Feather name="calendar" size={24} color="#ef4444" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.crmAlertTitle}>Atenção ao Pós-Venda</Text>
                                <Text style={styles.crmAlertSub}>Tem {resumo.crmAtrasados} revisões agendadas em atraso. Entre em contacto com os clientes.</Text>
                            </View>
                        </View>
                    )}
                </View>

                <Text style={styles.lblSessao}>MÓDULOS DE VENDAS</Text>

                <View style={styles.grid}>
                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('orcamento')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#fefce8' }]}>
                            <Feather name="shopping-cart" size={32} color="#ca8a04" />
                        </View>
                        <Text style={styles.tituloGrid}>PDV Mobile</Text>
                        <Text style={styles.subGrid}>Orçamento e Venda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('vendas')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#eff6ff' }]}>
                            <Feather name="file-text" size={32} color="#3b82f6" />
                        </View>
                        <Text style={styles.tituloGrid}>Documentos</Text>
                        <Text style={styles.subGrid}>Central de Vendas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('parceiros')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#faf5ff' }]}>
                            <Feather name="users" size={32} color="#a855f7" />
                        </View>
                        <Text style={styles.tituloGrid}>Clientes</Text>
                        <Text style={styles.subGrid}>Lista e Cadastro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('checklist')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#ecfdf5' }]}>
                            <Feather name="check-circle" size={32} color="#10b981" />
                        </View>
                        <Text style={styles.tituloGrid}>Vistoria</Text>
                        <Text style={styles.subGrid}>Fotos e Assinatura</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.lblSessao, { marginTop: 20 }]}>LOGÍSTICA E ESTOQUE</Text>

                <View style={styles.grid}>
                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('recebimento')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#f0fdf4' }]}>
                            <Feather name="box" size={32} color="#22c55e" />
                        </View>
                        <Text style={styles.tituloGrid}>Receber Carga</Text>
                        <Text style={styles.subGrid}>Conferência Cega</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('separacao')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#fdf4ff' }]}>
                            <Feather name="layers" size={32} color="#d946ef" />
                        </View>
                        <Text style={styles.tituloGrid}>Separação</Text>
                        <Text style={styles.subGrid}>Modo Picking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('produtos')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#f8fafc' }]}>
                            <Feather name="package" size={32} color="#64748b" />
                        </View>
                        <Text style={styles.tituloGrid}>Peças</Text>
                        <Text style={styles.subGrid}>Gestão de Produtos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnGrid} onPress={() => onNavigate('inventario')}>
                        <View style={[styles.iconeGrid, { backgroundColor: '#f0f9ff' }]}>
                            <Feather name="maximize" size={32} color="#0ea5e9" />
                        </View>
                        <Text style={styles.tituloGrid}>Inventário</Text>
                        <Text style={styles.subGrid}>Auditoria e Bipagem</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },

    header: { padding: 25, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 30, backgroundColor: '#0f172a' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    badgeEmpresa: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    txtEmpresa: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    btnSair: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    txtSair: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    txtSaudacao: { color: '#cbd5e1', fontSize: 16, fontWeight: 'bold' },
    txtNomeUsuario: { color: '#f8fafc', fontSize: 32, fontWeight: 'black', letterSpacing: 1, marginTop: 2 },

    scrollContent: { backgroundColor: '#f1f5f9', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 30, paddingBottom: 50, minHeight: '100%' },

    resumoContainer: { marginBottom: 25 },
    kpiLoading: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    txtLoadingKpi: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginTop: 10 },
    kpiScroll: { gap: 15, paddingBottom: 10 },
    kpiCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, width: 160, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginRight: 15 },
    kpiIcone: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    kpiValor: { fontSize: 18, fontWeight: 'black', color: '#1e293b', marginBottom: 2 },
    kpiTitulo: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },

    crmAlertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#fecaca', marginTop: 10 },
    crmAlertTitle: { fontSize: 14, fontWeight: 'black', color: '#dc2626' },
    crmAlertSub: { fontSize: 12, color: '#ef4444', fontWeight: 'bold', marginTop: 2 },

    lblSessao: { fontSize: 11, fontWeight: 'black', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

    btnGrid: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    iconeGrid: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    tituloGrid: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
    subGrid: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
});