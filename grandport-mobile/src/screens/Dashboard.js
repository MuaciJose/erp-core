import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import { STORAGE_KEYS } from '../api/session';

const SALES_MODULES = [
    { titulo: 'PDV Mobile', subtitulo: 'Orcamento e venda', icone: 'shopping-cart', corFundo: '#fef3c7', corIcone: '#b45309', rota: 'orcamento', permissao: 'pdv' },
    { titulo: 'Documentos', subtitulo: 'Orcamentos e pedidos', icone: 'file-text', corFundo: '#dbeafe', corIcone: '#2563eb', rota: 'vendas', permissao: 'vendas' },
    { titulo: 'Clientes', subtitulo: 'Consulta e cadastro', icone: 'users', corFundo: '#f3e8ff', corIcone: '#9333ea', rota: 'parceiros', permissao: 'parceiros' },
    { titulo: 'Vistoria', subtitulo: 'Fotos e assinatura', icone: 'check-circle', corFundo: '#dcfce7', corIcone: '#16a34a', rota: 'checklist', permissao: 'checklist' }
];

const STOCK_MODULES = [
    { titulo: 'Receber carga', subtitulo: 'Conferencia cega', icone: 'box', corFundo: '#dcfce7', corIcone: '#16a34a', rota: 'recebimento', permissao: 'estoque' },
    { titulo: 'Separacao', subtitulo: 'Modo picking', icone: 'layers', corFundo: '#fae8ff', corIcone: '#c026d3', rota: 'separacao', permissao: 'vendas' },
    { titulo: 'Pecas', subtitulo: 'Gestao de produtos', icone: 'package', corFundo: '#e2e8f0', corIcone: '#475569', rota: 'produtos', permissao: 'estoque' },
    { titulo: 'Inventario', subtitulo: 'Bipagem e ajuste', icone: 'maximize', corFundo: '#e0f2fe', corIcone: '#0284c7', rota: 'inventario', permissao: 'ajuste_estoque' }
];

export default function Dashboard({ onNavigate, onLogout }) {
    const [nomeUsuario, setNomeUsuario] = useState('Usuario');
    const [nomeEmpresa, setNomeEmpresa] = useState('A carregar...');
    const [saudacao, setSaudacao] = useState('Bem-vindo');
    const [carregandoHeader, setCarregandoHeader] = useState(true);
    const [resumo, setResumo] = useState(null);
    const [carregandoResumo, setCarregandoResumo] = useState(true);
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

    const carregarIdentificacao = async () => {
        setCarregandoHeader(true);
        try {
            const nomeSalvo = await AsyncStorage.getItem(STORAGE_KEYS.userName);
            if (nomeSalvo) setNomeUsuario(nomeSalvo.split(' ')[0]);

            const permissoesSalvas = await AsyncStorage.getItem(STORAGE_KEYS.permissions);
            if (permissoesSalvas) setPermissoes(JSON.parse(permissoesSalvas));

            try {
                const res = await api.get('/api/configuracoes/empresa');
                if (res.data?.nomeFantasia) setNomeEmpresa(res.data.nomeFantasia);
                else if (res.data?.razaoSocial) setNomeEmpresa(res.data.razaoSocial);
                else setNomeEmpresa('Minha Empresa');
            } catch (err) {
                setNomeEmpresa('Sistema Mobile');
            }
        } catch (error) {
            console.log('Erro ao carregar identificação:', error);
        } finally {
            setCarregandoHeader(false);
        }
    };

    const carregarResumo = async () => {
        setCarregandoResumo(true);
        try {
            const res = await api.get('/api/dashboard/resumo');
            setResumo(res.data);
        } catch (error) {
            console.log('Erro ao carregar resumo:', error);
        } finally {
            setCarregandoResumo(false);
        }
    };

    const temAcesso = (chave) => permissoes.includes(chave);

    const tentarAcessar = (rota, chavePermissao) => {
        if (temAcesso(chavePermissao)) {
            onNavigate(rota);
            return;
        }

        Toast.show({
            type: 'error',
            text1: 'Acesso negado',
            text2: 'Seu perfil nao pode acessar este modulo.'
        });
    };

    const stats = useMemo(() => ([
        {
            titulo: 'Faturamento',
            valor: `R$ ${(resumo?.faturamentoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            legenda: 'Mes atual',
            icone: 'trending-up',
            cor: '#16a34a',
            fundo: '#dcfce7'
        },
        {
            titulo: 'Atrasos',
            valor: `R$ ${(resumo?.receberAtrasado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            legenda: 'Contas vencidas',
            icone: 'alert-circle',
            cor: '#dc2626',
            fundo: '#fee2e2'
        },
        {
            titulo: 'Pedidos hoje',
            valor: `${resumo?.vendasHoje || 0}`,
            legenda: 'Fluxo do dia',
            icone: 'shopping-bag',
            cor: '#2563eb',
            fundo: '#dbeafe'
        },
        {
            titulo: 'Pecas em falta',
            valor: `${resumo?.produtosBaixoEstoque || 0}`,
            legenda: 'Baixo estoque',
            icone: 'package',
            cor: '#ea580c',
            fundo: '#ffedd5'
        }
    ]), [resumo]);

    const quickActions = useMemo(() => {
        const prioridade = ['checklist', 'inventario', 'orcamento', 'vendas'];
        const origem = [...SALES_MODULES, ...STOCK_MODULES];
        return prioridade
            .map(id => origem.find(item => item.rota === id))
            .filter(Boolean)
            .filter(item => temAcesso(item.permissao));
    }, [permissoes]);

    const renderModuleCard = (item) => {
        const liberado = temAcesso(item.permissao);
        return (
            <TouchableOpacity
                key={item.rota}
                style={[styles.moduleCard, !liberado && styles.moduleCardLocked]}
                activeOpacity={liberado ? 0.85 : 1}
                onPress={() => tentarAcessar(item.rota, item.permissao)}
            >
                {!liberado && <Feather name="lock" size={16} color="#94a3b8" style={styles.lockIcon} />}
                <View style={[styles.moduleIcon, { backgroundColor: liberado ? item.corFundo : '#f1f5f9' }]}>
                    <Feather name={item.icone} size={24} color={liberado ? item.corIcone : '#cbd5e1'} />
                </View>
                <Text style={[styles.moduleTitle, !liberado && styles.moduleTitleLocked]}>
                    {item.titulo}
                </Text>
                <Text style={[styles.moduleSubtitle, !liberado && styles.moduleSubtitleLocked]}>
                    {item.subtitulo}
                </Text>
            </TouchableOpacity>
        );
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
                <Text style={styles.txtNomeUsuario}>{nomeUsuario}</Text>
                <Text style={styles.txtContexto}>Central mobile de operacao comercial e estoque</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.heroTextBox}>
                        <Text style={styles.heroKicker}>Painel do dia</Text>
                        <Text style={styles.heroTitle}>Operacao na palma da mao</Text>
                        <Text style={styles.heroSubtitle}>
                            Recepcao, balcao, estoque e documentos com foco em velocidade.
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.heroPrimaryButton} onPress={() => onNavigate('orcamento')}>
                        <Feather name="plus" size={18} color="#0f172a" />
                        <Text style={styles.heroPrimaryText}>Novo documento</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Acesso rapido</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
                    {quickActions.map(action => (
                        <TouchableOpacity
                            key={action.rota}
                            style={styles.quickActionCard}
                            onPress={() => tentarAcessar(action.rota, action.permissao)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: action.corFundo }]}>
                                <Feather name={action.icone} size={18} color={action.corIcone} />
                            </View>
                            <Text style={styles.quickActionTitle}>{action.titulo}</Text>
                            <Text style={styles.quickActionSubtitle}>{action.subtitulo}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionLabel}>Radar do negocio</Text>
                {carregandoResumo ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>A processar metricas...</Text>
                    </View>
                ) : (
                    <View style={styles.statsGrid}>
                        {stats.map(stat => (
                            <View key={stat.titulo} style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: stat.fundo }]}>
                                    <Feather name={stat.icone} size={20} color={stat.cor} />
                                </View>
                                <Text style={styles.statTitle}>{stat.titulo}</Text>
                                <Text style={styles.statValue}>{stat.valor}</Text>
                                <Text style={styles.statLegend}>{stat.legenda}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {!carregandoResumo && resumo?.crmAtrasados > 0 && (
                    <View style={styles.alertBox}>
                        <Feather name="calendar" size={22} color="#dc2626" />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>Pos-venda pede atencao</Text>
                            <Text style={styles.alertSubtitle}>
                                Existem {resumo.crmAtrasados} revisoes em atraso para contato.
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionLabel}>Vendas e atendimento</Text>
                <View style={styles.moduleGrid}>
                    {SALES_MODULES.map(renderModuleCard)}
                </View>

                <Text style={styles.sectionLabel}>Estoque e logistica</Text>
                <View style={styles.moduleGrid}>
                    {STOCK_MODULES.map(renderModuleCard)}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'ios' ? 6 : 18,
        paddingBottom: 28,
        backgroundColor: '#0f172a'
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    badgeEmpresa: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999
    },
    txtEmpresa: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    btnSair: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999
    },
    txtSair: { color: '#fff', fontSize: 12, fontWeight: '800' },
    txtSaudacao: { color: '#cbd5e1', fontSize: 16, fontWeight: '700' },
    txtNomeUsuario: { color: '#f8fafc', fontSize: 31, fontWeight: '900', marginTop: 2 },
    txtContexto: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 6 },
    scrollContent: {
        backgroundColor: '#f1f5f9',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 42
    },
    heroCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3
    },
    heroTextBox: { marginBottom: 16 },
    heroKicker: {
        color: '#2563eb',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5
    },
    heroTitle: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 6 },
    heroSubtitle: { color: '#64748b', fontSize: 14, fontWeight: '600', marginTop: 8, lineHeight: 20 },
    heroPrimaryButton: {
        backgroundColor: '#fde68a',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    heroPrimaryText: { color: '#0f172a', fontSize: 14, fontWeight: '900' },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.6,
        marginTop: 22,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase'
    },
    quickActionsRow: { paddingBottom: 4 },
    quickActionCard: {
        width: 150,
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 12
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    quickActionTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
    quickActionSubtitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 4, lineHeight: 16 },
    loadingBox: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingVertical: 28,
        alignItems: 'center'
    },
    loadingText: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 10 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    statCard: {
        width: '48.2%',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    statTitle: { fontSize: 11, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
    statValue: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 8 },
    statLegend: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginTop: 4 },
    alertBox: {
        marginTop: 4,
        backgroundColor: '#fef2f2',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    alertContent: { flex: 1, marginLeft: 10 },
    alertTitle: { color: '#dc2626', fontSize: 14, fontWeight: '900' },
    alertSubtitle: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginTop: 3, lineHeight: 18 },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    moduleCard: {
        width: '48.2%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        position: 'relative'
    },
    moduleCardLocked: {
        backgroundColor: '#f8fafc',
        borderColor: '#f1f5f9',
        shadowOpacity: 0,
        elevation: 0
    },
    lockIcon: { position: 'absolute', top: 14, right: 14 },
    moduleIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
    },
    moduleTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
    moduleTitleLocked: { color: '#94a3b8' },
    moduleSubtitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 5, lineHeight: 16 },
    moduleSubtitleLocked: { color: '#cbd5e1' }
});
