import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../api/session';

const STATUS_FILTERS = ['TODOS', 'AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO'];

const hojeIso = () => new Date().toISOString().slice(0, 10);

const normalizarTelefone = (telefone) => {
    if (!telefone) return '';
    let apenasDigitos = String(telefone).replace(/\D/g, '');
    if (!apenasDigitos) return '';
    if (!apenasDigitos.startsWith('55')) {
        apenasDigitos = `55${apenasDigitos}`;
    }
    return apenasDigitos;
};

const formatarDataHora = (valor) => {
    if (!valor) return '--';
    const data = new Date(valor);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const corStatus = (status) => {
    switch (status) {
        case 'CONCLUIDO':
            return { fundo: '#dcfce7', texto: '#166534' };
        case 'EM_ANDAMENTO':
            return { fundo: '#fef3c7', texto: '#a16207' };
        case 'CONFIRMADO':
            return { fundo: '#dbeafe', texto: '#1d4ed8' };
        default:
            return { fundo: '#e2e8f0', texto: '#475569' };
    }
};

export default function AgendaMobile({ onVoltar }) {
    const [filtroStatus, setFiltroStatus] = useState('TODOS');
    const [carregando, setCarregando] = useState(true);
    const [agenda, setAgenda] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [draft, setDraft] = useState(null);
    const [indiceFilaContato, setIndiceFilaContato] = useState(0);

    const carregarAgenda = async () => {
        setCarregando(true);
        try {
            const [agendaRes, resumoRes] = await Promise.all([
                api.get('/api/agenda', {
                    params: {
                        dataInicio: hojeIso(),
                        dataFim: hojeIso(),
                        status: filtroStatus === 'TODOS' ? undefined : filtroStatus
                    }
                }),
                api.get('/api/agenda/resumo', { params: { data: hojeIso() } })
            ]);
            setAgenda(agendaRes.data || []);
            setResumo(resumoRes.data || null);
        } catch (error) {
            console.log(error);
            Toast.show({ type: 'error', text1: 'Falha ao carregar agenda' });
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarAgenda();
    }, [filtroStatus]);

    useEffect(() => {
        const carregarDraft = async () => {
            try {
                const salvo = await AsyncStorage.getItem(STORAGE_KEYS.agendaDraft);
                setDraft(salvo ? JSON.parse(salvo) : null);
            } catch (error) {
                setDraft(null);
            }
        };
        carregarDraft();
    }, []);

    const compromissosOrdenados = useMemo(
        () => [...agenda].sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio)),
        [agenda]
    );

    const filaContato = useMemo(
        () => compromissosOrdenados.filter((item) => item.lembreteWhatsApp && item.parceiroTelefone && item.status !== 'CONCLUIDO' && item.status !== 'CANCELADO'),
        [compromissosOrdenados]
    );

    const contatoAtual = filaContato[indiceFilaContato] || null;

    useEffect(() => {
        if (indiceFilaContato >= filaContato.length) {
            setIndiceFilaContato(0);
        }
    }, [filaContato.length, indiceFilaContato]);

    const atualizarStatus = async (id, status) => {
        try {
            await api.patch(`/api/agenda/${id}/status`, { status });
            Toast.show({ type: 'success', text1: `Status alterado para ${status}` });
            carregarAgenda();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Não foi possível atualizar o status' });
        }
    };

    const excluirCompromisso = async (id) => {
        try {
            await api.delete(`/api/agenda/${id}`);
            Toast.show({ type: 'success', text1: 'Compromisso excluído' });
            carregarAgenda();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Não foi possível excluir o compromisso' });
        }
    };

    const abrirWhatsApp = async (item) => {
        const telefone = normalizarTelefone(item.parceiroTelefone);
        if (!telefone) {
            Toast.show({ type: 'error', text1: 'Compromisso sem telefone válido' });
            return;
        }

        const mensagem = encodeURIComponent(`Olá${item.parceiroNome ? ` ${item.parceiroNome}` : ''}, estamos a confirmar o compromisso "${item.titulo}" agendado para ${formatarDataHora(item.dataInicio)}.`);
        const url = `whatsapp://send?phone=${telefone}&text=${mensagem}`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'WhatsApp indisponível neste aparelho' });
        }
    };

    const irParaProximoContato = () => {
        if (filaContato.length <= 1) return;
        setIndiceFilaContato((prev) => (prev + 1) % filaContato.length);
    };

    const salvarDraft = async () => {
        if (!draft?.titulo || !draft?.dataInicio || !draft?.dataFim) {
            Toast.show({ type: 'error', text1: 'Rascunho da agenda incompleto' });
            return;
        }
        try {
            await api.post('/api/agenda', {
                titulo: draft.titulo,
                descricao: draft.descricao || '',
                tipo: 'COMPROMISSO',
                setor: 'COMERCIAL',
                prioridade: 'NORMAL',
                status: 'AGENDADO',
                dataInicio: draft.dataInicio,
                dataFim: draft.dataFim,
                parceiroId: draft.parceiroId || null,
                lembreteWhatsApp: !!draft.lembreteWhatsApp,
                observacaoInterna: 'Criado a partir do mobile.'
            });
            await AsyncStorage.removeItem(STORAGE_KEYS.agendaDraft);
            setDraft(null);
            Toast.show({ type: 'success', text1: 'Compromisso criado na agenda' });
            carregarAgenda();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Não foi possível criar o compromisso' });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={22} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.headerTextBox}>
                    <Text style={styles.kicker}>Agenda operacional</Text>
                    <Text style={styles.titulo}>Compromissos do dia</Text>
                    <Text style={styles.subtitulo}>Confirmar, concluir e acompanhar os próximos atendimentos</Text>
                </View>
            </View>

            <View style={styles.heroCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heroKicker}>Hoje</Text>
                    <Text style={styles.heroTitle}>{resumo?.hoje || 0} compromissos planejados</Text>
                    <Text style={styles.heroSubtitle}>Use essa tela para tocar a agenda sem abrir o ERP completo.</Text>
                </View>
                <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeLabel}>Atrasos</Text>
                    <Text style={styles.heroBadgeValue}>{resumo?.atrasados || 0}</Text>
                </View>
            </View>

            {draft ? (
                <View style={styles.draftCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.draftKicker}>Rascunho vindo de clientes</Text>
                        <Text style={styles.draftTitle}>{draft.titulo}</Text>
                        <Text style={styles.draftSubtitle}>{draft.descricao || 'Compromisso pronto para confirmação.'}</Text>
                    </View>
                    <TouchableOpacity style={styles.draftButton} onPress={salvarDraft}>
                        <Text style={styles.draftButtonText}>Criar</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {contatoAtual ? (
                <View style={styles.queueCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.queueKicker}>Fila de contato</Text>
                        <Text style={styles.queueTitle}>{contatoAtual.parceiroNome || contatoAtual.titulo}</Text>
                        <Text style={styles.queueSubtitle}>{contatoAtual.titulo} • {formatarDataHora(contatoAtual.dataInicio)}</Text>
                    </View>
                    <View style={styles.queueActions}>
                        <TouchableOpacity style={styles.queueAction} onPress={() => abrirWhatsApp(contatoAtual)}>
                            <Feather name="message-circle" size={18} color="#16a34a" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.queuePrimary} onPress={async () => { await atualizarStatus(contatoAtual.id, 'CONCLUIDO'); setTimeout(irParaProximoContato, 250); }}>
                            <Text style={styles.queuePrimaryText}>Concluir</Text>
                        </TouchableOpacity>
                        {filaContato.length > 1 ? (
                            <TouchableOpacity style={styles.queueNext} onPress={irParaProximoContato}>
                                <Text style={styles.queueNextText}>Próximo</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>{resumo?.total || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Concluídos</Text>
                    <Text style={styles.statValue}>{resumo?.concluidos || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Alta prioridade</Text>
                    <Text style={styles.statValue}>{resumo?.altaPrioridade || 0}</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {STATUS_FILTERS.map((item) => {
                    const ativo = filtroStatus === item;
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[styles.filterPill, ativo && styles.filterPillActive]}
                            onPress={() => setFiltroStatus(item)}
                        >
                            <Text style={[styles.filterText, ativo && styles.filterTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {carregando ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>A carregar agenda...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {compromissosOrdenados.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Feather name="calendar" size={28} color="#94a3b8" />
                            <Text style={styles.emptyTitle}>Sem compromissos no filtro atual</Text>
                            <Text style={styles.emptySubtitle}>Altere o status para visualizar outros compromissos.</Text>
                        </View>
                    ) : (
                        compromissosOrdenados.map((item) => {
                            const cor = corStatus(item.status);
                            return (
                                <View key={item.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.statusBadge, { backgroundColor: cor.fundo }]}>
                                            <Text style={[styles.statusBadgeText, { color: cor.texto }]}>{item.status}</Text>
                                        </View>
                                        <Text style={styles.cardTime}>{formatarDataHora(item.dataInicio)}</Text>
                                    </View>

                                    <Text style={styles.cardTitle}>{item.titulo}</Text>
                                    {item.descricao ? <Text style={styles.cardDescription}>{item.descricao}</Text> : null}

                                    <View style={styles.metaRow}>
                                        {item.usuarioResponsavelNome ? (
                                            <Text style={styles.metaText}><Feather name="user" size={12} color="#64748b" /> {item.usuarioResponsavelNome}</Text>
                                        ) : null}
                                        {item.veiculoPlaca ? (
                                            <Text style={styles.metaText}><Feather name="truck" size={12} color="#64748b" /> {item.veiculoPlaca}</Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity style={styles.secondaryButton} onPress={() => atualizarStatus(item.id, 'CONFIRMADO')}>
                                            <Text style={styles.secondaryButtonText}>Confirmar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.primaryButton} onPress={() => atualizarStatus(item.id, 'CONCLUIDO')}>
                                            <Text style={styles.primaryButtonText}>Concluir</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.deleteButton} onPress={() => excluirCompromisso(item.id)}>
                                            <Feather name="trash-2" size={18} color="#dc2626" />
                                        </TouchableOpacity>
                                        {item.lembreteWhatsApp && item.parceiroTelefone ? (
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => abrirWhatsApp(item)}
                                            >
                                                <Feather name="message-circle" size={18} color="#16a34a" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef2f7' },
    header: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        paddingTop: 52,
        paddingBottom: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    btnVoltar: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    headerTextBox: { flex: 1 },
    kicker: { fontSize: 11, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.1 },
    titulo: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 },
    subtitulo: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: 4 },
    heroCard: {
        margin: 15,
        backgroundColor: '#0f172a',
        borderRadius: 24,
        padding: 18,
        flexDirection: 'row',
        gap: 14
    },
    heroKicker: { color: '#93c5fd', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
    heroTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 8 },
    heroSubtitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 8, lineHeight: 18 },
    heroBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 88
    },
    heroBadgeLabel: { color: '#93c5fd', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    heroBadgeValue: { color: '#fff', fontSize: 13, fontWeight: '900', marginTop: 6 },
    draftCard: {
        marginHorizontal: 15,
        marginTop: -2,
        marginBottom: 8,
        backgroundColor: '#fffbeb',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#fde68a',
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center'
    },
    draftKicker: { color: '#b45309', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    draftTitle: { color: '#78350f', fontSize: 15, fontWeight: '900', marginTop: 6 },
    draftSubtitle: { color: '#92400e', fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 18 },
    draftButton: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14
    },
    draftButtonText: { color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    queueCard: {
        marginHorizontal: 15,
        marginBottom: 8,
        backgroundColor: '#ecfdf5',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        padding: 16
    },
    queueKicker: { color: '#15803d', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    queueTitle: { color: '#14532d', fontSize: 16, fontWeight: '900', marginTop: 6 },
    queueSubtitle: { color: '#166534', fontSize: 12, fontWeight: '700', marginTop: 4, lineHeight: 18 },
    queueActions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
    queueAction: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    queuePrimary: {
        flex: 1,
        backgroundColor: '#166534',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12
    },
    queuePrimaryText: { color: '#fff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    queueNext: {
        backgroundColor: '#dcfce7',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12
    },
    queueNextText: { color: '#166534', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 15 },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14
    },
    statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { color: '#0f172a', fontSize: 16, fontWeight: '900', marginTop: 8 },
    filterRow: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 6, gap: 8 },
    filterPill: {
        backgroundColor: '#fff',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 14,
        paddingVertical: 10
    },
    filterPillActive: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
    filterText: { fontSize: 12, fontWeight: '900', color: '#475569' },
    filterTextActive: { color: '#1d4ed8' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748b', fontWeight: '700' },
    scrollContent: { padding: 15, paddingTop: 10, paddingBottom: 30 },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 28,
        alignItems: 'center'
    },
    emptyTitle: { color: '#0f172a', fontSize: 15, fontWeight: '900', marginTop: 10 },
    emptySubtitle: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        marginBottom: 12
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    statusBadgeText: { fontSize: 10, fontWeight: '900' },
    cardTime: { color: '#64748b', fontSize: 12, fontWeight: '800' },
    cardTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900', marginTop: 12 },
    cardDescription: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, lineHeight: 18 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    metaText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#e2e8f0',
        borderRadius: 14,
        alignItems: 'center',
        paddingVertical: 12
    },
    secondaryButtonText: { color: '#475569', fontWeight: '900', fontSize: 12 },
    primaryButton: {
        flex: 1.1,
        backgroundColor: '#0f172a',
        borderRadius: 14,
        alignItems: 'center',
        paddingVertical: 12
    },
    primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#bbf7d0'
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fecaca'
    }
});
