import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function Dashboard({ onNavigate, onLogout }) {
    const [nomeUsuario, setNomeUsuario] = useState('Usuário');
    const [nomeEmpresa, setNomeEmpresa] = useState('A carregar...');
    const [saudacao, setSaudacao] = useState('Bem-vindo');
    const [carregandoHeader, setCarregandoHeader] = useState(true);

    const [resumo, setResumo] = useState(null);
    const [carregandoResumo, setCarregandoResumo] = useState(true);

    // 🚀 ESTADO QUE GUARDA AS CHAVES (PERMISSÕES) DO USUÁRIO
    const [permissoes, setPermissoes] = useState([]);

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
    // 👤 BUSCA DADOS E PERMISSÕES NO COFRE DO CELULAR
    // ============================================================================
    const carregarIdentificacao = async () => {
        setCarregandoHeader(true);
        try {
            const nomeSalvo = await AsyncStorage.getItem('grandport_user_nome');
            if (nomeSalvo) setNomeUsuario(nomeSalvo.split(' ')[0]);

            // 🚀 LÊ AS PERMISSÕES SALVAS NO LOGIN
            const permissoesSalvas = await AsyncStorage.getItem('grandport_user_permissoes');
            if (permissoesSalvas) {
                setPermissoes(JSON.parse(permissoesSalvas));
            }

            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            try {
                const res = await api.get('/api/configuracoes/empresa', {
                    headers: { 'Authorization': `Bearer ${tokenLimpo}` }
                });
                if (res.data && res.data.nomeFantasia) setNomeEmpresa(res.data.nomeFantasia);
                else if (res.data && res.data.razaoSocial) setNomeEmpresa(res.data.razaoSocial);
                else setNomeEmpresa('Minha Empresa');
            } catch (err) { setNomeEmpresa('Sistema Mobile'); }
        } catch (error) { console.log("Erro ao carregar identificação:", error); }
        finally { setCarregandoHeader(false); }
    };

    const carregarResumo = async () => {
        setCarregandoResumo(true);
        try {
            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            const res = await api.get('/api/dashboard/resumo', {
                headers: { 'Authorization': `Bearer ${tokenLimpo}` }
            });
            setResumo(res.data);
        } catch (error) { console.log("Erro ao carregar resumo:", error); }
        finally { setCarregandoResumo(false); }
    };

    // ============================================================================
    // 🛡️ MOTOR DE VERIFICAÇÃO DE ACESSO
    // ============================================================================
    const temAcesso = (chave) => {
        return permissoes.includes(chave);
    };

    const tentarAcessar = (rota, chavePermissao) => {
        if (temAcesso(chavePermissao)) {
            onNavigate(rota);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Acesso Negado 🛑',
                text2: 'Você não tem permissão para acessar este módulo.'
            });
        }
    };

    const BotaoModulo = ({ titulo, subtitulo, icone, corFundo, corIcone, rota, chavePermissao }) => {
        const liberado = temAcesso(chavePermissao);

        return (
            <TouchableOpacity
                style={[styles.btnGrid, !liberado && styles.btnBloqueado]}
                onPress={() => tentarAcessar(rota, chavePermissao)}
                activeOpacity={liberado ? 0.7 : 1}
            >
                {!liberado && <Feather name="lock" size={16} color="#94a3b8" style={styles.iconeCadeado} />}
                <View style={[styles.iconeGrid, { backgroundColor: liberado ? corFundo : '#f1f5f9' }]}>
                    <Feather name={icone} size={32} color={liberado ? corIcone : '#cbd5e1'} />
                </View>
                <Text style={[styles.tituloGrid, !liberado && { color: '#94a3b8' }]}>{titulo}</Text>
                <Text style={[styles.subGrid, !liberado && { color: '#cbd5e1' }]}>{subtitulo}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {carregandoHeader ? <ActivityIndicator size="small" color="#64748b" /> : (
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

                {/* 🚀 BLINDAGEM DA VISÃO GERAL: Só aparece se tiver a chave 'dash' */}
                {temAcesso('dash') && (
                    <View style={styles.resumoContainer}>
                        <Text style={styles.lblSessao}>VISÃO GERAL DO NEGÓCIO</Text>
                        {carregandoResumo ? (
                            <View style={styles.kpiLoading}><ActivityIndicator size="large" color="#3b82f6" /><Text style={styles.txtLoadingKpi}>A processar métricas...</Text></View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
                                <View style={styles.kpiCard}>
                                    <View style={[styles.kpiIcone, { backgroundColor: '#dcfce7' }]}><Feather name="trending-up" size={20} color="#16a34a" /></View>
                                    <Text style={styles.kpiValor}>R$ {(resumo?.faturamentoMes || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
                                    <Text style={styles.kpiTitulo}>Faturação Mensal</Text>
                                </View>
                                <View style={[styles.kpiCard, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
                                    <View style={[styles.kpiIcone, { backgroundColor: '#fee2e2' }]}><Feather name="alert-circle" size={20} color="#dc2626" /></View>
                                    <Text style={[styles.kpiValor, { color: '#dc2626' }]}>R$ {(resumo?.receberAtrasado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
                                    <Text style={styles.kpiTitulo}>Contas em Atraso</Text>
                                </View>
                                <View style={styles.kpiCard}>
                                    <View style={[styles.kpiIcone, { backgroundColor: '#eff6ff' }]}><Feather name="shopping-bag" size={20} color="#2563eb" /></View>
                                    <Text style={styles.kpiValor}>{resumo?.vendasHoje || 0}</Text>
                                    <Text style={styles.kpiTitulo}>Pedidos Hoje</Text>
                                </View>
                                <View style={styles.kpiCard}>
                                    <View style={[styles.kpiIcone, { backgroundColor: '#ffedd5' }]}><Feather name="package" size={20} color="#ea580c" /></View>
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
                )}

                <Text style={[styles.lblSessao, !temAcesso('dash') && { marginTop: 10 }]}>MÓDULOS DE VENDAS</Text>
                <View style={styles.grid}>
                    <BotaoModulo titulo="PDV Mobile" subtitulo="Orçamento e Venda" icone="shopping-cart" corFundo="#fefce8" corIcone="#ca8a04" rota="orcamento" chavePermissao="pdv" />
                    <BotaoModulo titulo="Documentos" subtitulo="Central de Vendas" icone="file-text" corFundo="#eff6ff" corIcone="#3b82f6" rota="vendas" chavePermissao="vendas" />
                    <BotaoModulo titulo="Clientes" subtitulo="Lista e Cadastro" icone="users" corFundo="#faf5ff" corIcone="#a855f7" rota="parceiros" chavePermissao="parceiros" />
                    <BotaoModulo titulo="Vistoria" subtitulo="Fotos e Assinatura" icone="check-circle" corFundo="#ecfdf5" corIcone="#10b981" rota="checklist" chavePermissao="checklist" />
                </View>

                <Text style={[styles.lblSessao, { marginTop: 20 }]}>LOGÍSTICA E ESTOQUE</Text>
                <View style={styles.grid}>
                    <BotaoModulo titulo="Receber Carga" subtitulo="Conferência Cega" icone="box" corFundo="#f0fdf4" corIcone="#22c55e" rota="recebimento" chavePermissao="estoque" />
                    <BotaoModulo titulo="Separação" subtitulo="Modo Picking" icone="layers" corFundo="#fdf4ff" corIcone="#d946ef" rota="separacao" chavePermissao="vendas" />
                    <BotaoModulo titulo="Peças" subtitulo="Gestão de Produtos" icone="package" corFundo="#f8fafc" corIcone="#64748b" rota="produtos" chavePermissao="estoque" />
                    <BotaoModulo titulo="Inventário" subtitulo="Auditoria e Bipagem" icone="maximize" corFundo="#f0f9ff" corIcone="#0ea5e9" rota="inventario" chavePermissao="ajuste_estoque" />
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
    btnGrid: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, position: 'relative' },
    btnBloqueado: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', shadowOpacity: 0, elevation: 0 },
    iconeCadeado: { position: 'absolute', top: 15, right: 15 },
    iconeGrid: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    tituloGrid: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
    subGrid: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginTop: 4 },
});