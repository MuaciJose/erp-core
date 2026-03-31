import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import Toast from 'react-native-toast-message';
import api from '../api/axios';
import { getApiBaseUrl, getAuthHeaders } from '../api/session';

const ETAPAS = [
    { id: 'veiculo', label: 'Veiculo' },
    { id: 'dados', label: 'Dados' },
    { id: 'avarias', label: 'Avarias' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'assinatura', label: 'Assinar' }
];

const ETAPA_META = {
    veiculo: {
        titulo: 'Selecione o veículo da recepção',
        descricao: 'Busque por placa ou modelo para iniciar a vistoria.'
    },
    dados: {
        titulo: 'Registre os dados de entrada',
        descricao: 'Quilometragem e combustível ficam visíveis no comprovante.'
    },
    avarias: {
        titulo: 'Marque avarias e observações',
        descricao: 'Use as marcações para reduzir dúvidas na entrega.'
    },
    fotos: {
        titulo: 'Anexe evidências',
        descricao: 'Fotografe painel, danos, acessórios e itens deixados no carro.'
    },
    assinatura: {
        titulo: 'Formalize com a assinatura',
        descricao: 'A recepção só fica pronta após a confirmação do cliente.'
    }
};

export default function ChecklistMobile({ onVoltar }) {
    const [veiculos, setVeiculos] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [etapaAtual, setEtapaAtual] = useState('veiculo');

    const [kmAtual, setKmAtual] = useState('');
    const [nivelCombustivel, setNivelCombustivel] = useState('');
    const [avariadasSelecionadas, setAvariadasSelecionadas] = useState([]);
    const [observacoes, setObservacoes] = useState('');
    const [fotosCapturadas, setFotosCapturadas] = useState([]);

    const [modalAssinatura, setModalAssinatura] = useState(false);
    const [assinaturaBase64, setAssinaturaBase64] = useState(null);
    const refAssinatura = useRef();

    const niveisCombustivel = ['Reserva', '1/4', 'Meio Tanque', '3/4', 'Cheio'];
    const tagsAvarias = [
        'Arranhão Para-choque Diant.', 'Arranhão Para-choque Tras.',
        'Amassado Porta Dir.', 'Amassado Porta Esq.',
        'Vidro Trincado', 'Pneu Careca', 'Farol/Lanterna Quebrada',
        'Pintura Queimada', 'Retrovisor Danificado', 'Bancos Rasgados', 'Sem Estepe'
    ];

    useEffect(() => {
        const buscarVeiculos = async () => {
            try {
                const res = await api.get('/api/veiculos');
                setVeiculos(res.data);
            } catch (error) {
                Toast.show({ type: 'error', text1: 'Erro ao buscar veículos' });
            }
        };
        buscarVeiculos();
    }, []);

    const veiculosFiltrados = useMemo(() => (
        veiculos.filter(v =>
            (v.placa && v.placa.toLowerCase().includes(termoBusca.toLowerCase())) ||
            (v.modelo && v.modelo.toLowerCase().includes(termoBusca.toLowerCase()))
        )
    ), [veiculos, termoBusca]);

    const toggleAvaria = (tag) => {
        setAvariadasSelecionadas(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const tirarFoto = async () => {
        if (fotosCapturadas.length >= 4) {
            return Toast.show({ type: 'error', text1: 'Limite de 4 fotos atingido!' });
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            return Toast.show({ type: 'error', text1: 'Permissão de câmera negada!' });
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.5
        });

        if (!result.canceled) {
            setFotosCapturadas(prev => [...prev, result.assets[0]]);
        }
    };

    const removerFoto = (index) => {
        setFotosCapturadas(prev => prev.filter((_, i) => i !== index));
    };

    const handleOKAssinatura = (signature) => {
        setAssinaturaBase64(signature);
        setModalAssinatura(false);
        Toast.show({ type: 'success', text1: 'Assinatura registada!' });
    };

    const handleClearAssinatura = () => {
        refAssinatura.current?.clearSignature();
    };

    const handleConfirmaAssinatura = () => {
        refAssinatura.current?.readSignature();
    };

    const handleSalvarChecklist = async () => {
        if (!veiculoSelecionado) return Toast.show({ type: 'error', text1: 'Selecione um veículo!' });
        if (!kmAtual) return Toast.show({ type: 'error', text1: 'Informe o KM de entrada!' });
        if (!nivelCombustivel) return Toast.show({ type: 'error', text1: 'Informe o combustível!' });
        if (!assinaturaBase64) return Toast.show({ type: 'error', text1: 'Assinatura obrigatória!' });

        setLoading(true);
        try {
            const payload = {
                veiculoId: veiculoSelecionado.id,
                clienteId: veiculoSelecionado.cliente?.id || null,
                kmAtual: parseInt(kmAtual, 10),
                nivelCombustivel,
                itensAvariados: avariadasSelecionadas.join(', '),
                observacoesGerais: observacoes
            };

            const response = await api.post('/api/checklists', payload);
            const checklistCriado = response.data;

            Toast.show({ type: 'info', text1: 'A enviar evidências e assinatura...' });

            const enviarArquivo = async (uri, rota, nomeArquivo) => {
                const formData = new FormData();
                formData.append(rota.includes('assinatura') ? 'assinatura' : 'foto', {
                    uri,
                    name: nomeArquivo,
                    type: 'image/jpeg'
                });
                await fetch(`${getApiBaseUrl()}${rota}`, {
                    method: 'POST',
                    body: formData,
                    headers: await getAuthHeaders()
                });
            };

            await enviarArquivo(assinaturaBase64, `/api/checklists/${checklistCriado.id}/assinatura`, 'assinatura.jpg');

            for (let i = 0; i < fotosCapturadas.length; i += 1) {
                await enviarArquivo(fotosCapturadas[i].uri, `/api/checklists/${checklistCriado.id}/fotos`, `foto_${i}.jpg`);
            }

            Alert.alert('Sucesso', 'Vistoria oficializada e arquivada no sistema.', [{ text: 'OK', onPress: onVoltar }]);
        } catch (error) {
            console.log('Erro Vistoria:', error);
            Toast.show({ type: 'error', text1: 'Falha crítica ao salvar vistoria.' });
        } finally {
            setLoading(false);
        }
    };

    const irParaProximaEtapa = () => {
        if (etapaAtual === 'veiculo') {
            if (!veiculoSelecionado) return Toast.show({ type: 'error', text1: 'Selecione um veículo.' });
            setEtapaAtual('dados');
            return;
        }
        if (etapaAtual === 'dados') {
            if (!kmAtual || !nivelCombustivel) return Toast.show({ type: 'error', text1: 'Preencha KM e combustível.' });
            setEtapaAtual('avarias');
            return;
        }
        if (etapaAtual === 'avarias') {
            setEtapaAtual('fotos');
            return;
        }
        if (etapaAtual === 'fotos') {
            setEtapaAtual('assinatura');
        }
    };

    const voltarEtapa = () => {
        if (etapaAtual === 'assinatura') return setEtapaAtual('fotos');
        if (etapaAtual === 'fotos') return setEtapaAtual('avarias');
        if (etapaAtual === 'avarias') return setEtapaAtual('dados');
        if (etapaAtual === 'dados') return setEtapaAtual('veiculo');
        onVoltar();
    };

    const etapaConcluida = (id) => {
        if (id === 'veiculo') return !!veiculoSelecionado;
        if (id === 'dados') return !!veiculoSelecionado && !!kmAtual && !!nivelCombustivel;
        if (id === 'avarias') return avariadasSelecionadas.length > 0 || !!observacoes;
        if (id === 'fotos') return fotosCapturadas.length > 0;
        if (id === 'assinatura') return !!assinaturaBase64;
        return false;
    };

    const etapaAtualIndex = ETAPAS.findIndex((etapa) => etapa.id === etapaAtual);
    const progressoPercentual = Math.round(((etapaAtualIndex + 1) / ETAPAS.length) * 100);
    const etapaMetaAtual = ETAPA_META[etapaAtual];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={22} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.headerTextBox}>
                    <Text style={styles.kicker}>Recepcao mobile</Text>
                    <Text style={styles.titulo}>Vistoria de entrada</Text>
                    <Text style={styles.subtitulo}>Fluxo guiado para recepção do veículo</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.progressKicker}>Etapa atual</Text>
                            <Text style={styles.progressTitle}>{etapaMetaAtual.titulo}</Text>
                            <Text style={styles.progressSubtitle}>{etapaMetaAtual.descricao}</Text>
                        </View>
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressBadgeValue}>{progressoPercentual}%</Text>
                            <Text style={styles.progressBadgeLabel}>feito</Text>
                        </View>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressoPercentual}%` }]} />
                    </View>
                </View>

                <View style={styles.stepRow}>
                    {ETAPAS.map((etapa, index) => {
                        const ativa = etapaAtual === etapa.id;
                        const concluida = etapaConcluida(etapa.id);
                        return (
                            <View key={etapa.id} style={styles.stepItem}>
                                <View style={[styles.stepBubble, ativa && styles.stepBubbleActive, !ativa && concluida && styles.stepBubbleDone]}>
                                    <Text style={[styles.stepBubbleText, (ativa || concluida) && styles.stepBubbleTextActive]}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.stepLabel, ativa && styles.stepLabelActive]}>{etapa.label}</Text>
                            </View>
                        );
                    })}
                </View>

                {veiculoSelecionado && (
                    <View style={styles.vehicleHero}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.vehicleHeroKicker}>Veículo selecionado</Text>
                            <Text style={styles.vehicleHeroPlate}>{veiculoSelecionado.placa}</Text>
                            <Text style={styles.vehicleHeroModel}>{veiculoSelecionado.modelo}</Text>
                            <Text style={styles.vehicleHeroOwner}>{veiculoSelecionado.cliente?.nome || 'Sem proprietário'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setVeiculoSelecionado(null); setEtapaAtual('veiculo'); }} style={styles.vehicleHeroClose}>
                            <Feather name="x" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Combustível</Text>
                        <Text style={styles.summaryValue}>{nivelCombustivel || 'Pendente'}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Fotos</Text>
                        <Text style={styles.summaryValue}>{fotosCapturadas.length}/4</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Assinatura</Text>
                        <Text style={styles.summaryValue}>{assinaturaBase64 ? 'OK' : 'Pendente'}</Text>
                    </View>
                </View>

                {etapaAtual === 'veiculo' && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Buscar veículo</Text>
                        <View style={styles.searchBox}>
                            <Feather name="search" size={18} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Digite placa ou modelo..."
                                value={termoBusca}
                                onChangeText={setTermoBusca}
                                autoCapitalize="characters"
                            />
                        </View>

                        {veiculosFiltrados.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="search" size={24} color="#94a3b8" />
                                <Text style={styles.emptyTitle}>Nenhum veículo encontrado</Text>
                                <Text style={styles.emptySubtitle}>Tente buscar por outra placa ou modelo.</Text>
                            </View>
                        ) : veiculosFiltrados.slice(0, 8).map(v => (
                            <TouchableOpacity
                                key={v.id}
                                style={styles.vehicleItem}
                                onPress={() => {
                                    setVeiculoSelecionado(v);
                                    setEtapaAtual('dados');
                                }}
                            >
                                <View>
                                    <Text style={styles.vehicleItemPlate}>{v.placa}</Text>
                                    <Text style={styles.vehicleItemModel}>{v.modelo}</Text>
                                    <Text style={styles.vehicleItemOwner}>{v.cliente?.nome || 'Sem proprietário'}</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {etapaAtual === 'dados' && veiculoSelecionado && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Dados vitais</Text>

                        <Text style={styles.fieldLabel}>Quilometragem</Text>
                        <View style={styles.kmBox}>
                            <TextInput
                                style={styles.inputKm}
                                placeholder="54000"
                                keyboardType="numeric"
                                value={kmAtual}
                                onChangeText={setKmAtual}
                            />
                            <Text style={styles.kmSuffix}>KM</Text>
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Nível de combustível</Text>
                        <View style={styles.fuelGrid}>
                            {niveisCombustivel.map((nivel, index) => (
                                <TouchableOpacity
                                    key={nivel}
                                    onPress={() => setNivelCombustivel(nivel)}
                                    style={[
                                        styles.fuelButton,
                                        nivelCombustivel === nivel && (index === 0 ? styles.fuelButtonReserve : styles.fuelButtonActive)
                                    ]}
                                >
                                    <Text style={[styles.fuelButtonText, nivelCombustivel === nivel && styles.fuelButtonTextActive]}>
                                        {nivel}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {etapaAtual === 'avarias' && veiculoSelecionado && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionLabel}>Avarias e observações</Text>
                            <Text style={styles.sectionBadge}>{avariadasSelecionadas.length} marcadas</Text>
                        </View>

                        <View style={styles.chipsWrap}>
                            {tagsAvarias.map(tag => {
                                const ativo = avariadasSelecionadas.includes(tag);
                                return (
                                    <TouchableOpacity key={tag} onPress={() => toggleAvaria(tag)} style={[styles.chip, ativo && styles.chipActive]}>
                                        {ativo && <Feather name="check-circle" size={14} color="#ef4444" />}
                                        <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{tag}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Observações extras</Text>
                        <TextInput
                            style={styles.inputObs}
                            multiline
                            numberOfLines={4}
                            placeholder="Pertences de valor, rádio quebrado, detalhes extras..."
                            value={observacoes}
                            onChangeText={setObservacoes}
                        />
                    </View>
                )}

                {etapaAtual === 'fotos' && veiculoSelecionado && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionLabel}>Evidências fotográficas</Text>
                            <Text style={styles.sectionBadge}>{fotosCapturadas.length}/4</Text>
                        </View>

                        <TouchableOpacity onPress={tirarFoto} style={styles.photoCTA}>
                            <Feather name="camera" size={26} color="#2563eb" />
                            <Text style={styles.photoCTATitle}>Abrir câmera</Text>
                            <Text style={styles.photoCTASubtitle}>Tire fotos do painel, danos ou itens deixados no veículo</Text>
                        </TouchableOpacity>

                        {fotosCapturadas.length > 0 && (
                            <View style={styles.photosGrid}>
                                {fotosCapturadas.map((foto, index) => (
                                    <View key={index} style={styles.photoCard}>
                                        <Image source={{ uri: foto.uri }} style={styles.photoThumb} />
                                        <TouchableOpacity onPress={() => removerFoto(index)} style={styles.btnRemoverFoto}>
                                            <Feather name="x" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {etapaAtual === 'assinatura' && veiculoSelecionado && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Assinatura do cliente</Text>
                        <Text style={styles.legalText}>
                            O cliente confirma o estado do veículo e concorda com as informações registradas acima.
                        </Text>

                        {assinaturaBase64 ? (
                            <View style={styles.signatureDoneBox}>
                                <Image source={{ uri: assinaturaBase64 }} style={styles.signaturePreview} />
                                <TouchableOpacity onPress={() => setModalAssinatura(true)} style={styles.signatureRetry}>
                                    <Text style={styles.signatureRetryText}>Refazer assinatura</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setModalAssinatura(true)} style={styles.signatureCTA}>
                                <Feather name="edit-2" size={22} color="#2563eb" />
                                <Text style={styles.signatureCTATitle}>Toque para assinar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footerBar}>
                <TouchableOpacity style={styles.footerSecondary} onPress={voltarEtapa}>
                    <Text style={styles.footerSecondaryText}>Voltar</Text>
                </TouchableOpacity>

                {etapaAtual !== 'assinatura' ? (
                    <TouchableOpacity style={styles.footerPrimary} onPress={irParaProximaEtapa}>
                        <Text style={styles.footerPrimaryText}>Próximo</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.footerPrimary, loading && styles.footerPrimaryDisabled]} onPress={handleSalvarChecklist} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.footerPrimaryText}>Salvar vistoria</Text>}
                    </TouchableOpacity>
                )}
            </View>

            <Modal visible={modalAssinatura} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assinatura do cliente</Text>
                            <TouchableOpacity onPress={() => setModalAssinatura(false)}>
                                <Feather name="x" size={22} color="#ef4444" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.signatureCanvasBox}>
                            <SignatureScreen
                                ref={refAssinatura}
                                onOK={handleOKAssinatura}
                                webStyle={signaturePadStyle}
                                descriptionText=""
                                clearText=""
                                confirmText=""
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={handleClearAssinatura} style={styles.modalActionSecondary}>
                                <Text style={styles.modalActionSecondaryText}>Limpar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmaAssinatura} style={styles.modalActionPrimary}>
                                <Text style={styles.modalActionPrimaryText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const signaturePadStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
    margin: 0px;
  }
  body,html {
    width: 100%;
    height: 100%;
  }
`;

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
    kicker: { fontSize: 11, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2 },
    titulo: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 },
    subtitulo: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: 4 },
    scrollContent: { padding: 16, paddingBottom: 108 },
    progressCard: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#dbeafe',
        padding: 18,
        marginBottom: 14
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    progressKicker: { color: '#2563eb', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
    progressTitle: { color: '#0f172a', fontSize: 17, fontWeight: '900', marginTop: 6 },
    progressSubtitle: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, lineHeight: 18 },
    progressBadge: {
        minWidth: 74,
        backgroundColor: '#eff6ff',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    progressBadgeValue: { color: '#1d4ed8', fontSize: 18, fontWeight: '900' },
    progressBadgeLabel: { color: '#2563eb', fontSize: 10, fontWeight: '800', marginTop: 2 },
    progressTrack: { height: 10, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 16 },
    progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#2563eb' },
    stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepBubble: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6
    },
    stepBubbleActive: { backgroundColor: '#2563eb' },
    stepBubbleDone: { backgroundColor: '#16a34a' },
    stepBubbleText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    stepBubbleTextActive: { color: '#fff' },
    stepLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },
    stepLabelActive: { color: '#2563eb' },
    vehicleHero: {
        backgroundColor: '#0f172a',
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        flexDirection: 'row'
    },
    vehicleHeroKicker: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
    vehicleHeroPlate: { color: '#60a5fa', fontSize: 30, fontWeight: '900', marginTop: 6, letterSpacing: 2 },
    vehicleHeroModel: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 4 },
    vehicleHeroOwner: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 8 },
    vehicleHeroClose: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center'
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
    summaryCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14
    },
    summaryLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    summaryValue: { color: '#0f172a', fontSize: 13, fontWeight: '900', marginTop: 8 },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14
    },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2 },
    sectionBadge: { backgroundColor: '#f1f5f9', color: '#64748b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden', fontSize: 10, fontWeight: '900' },
    searchBox: {
        marginTop: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center'
    },
    searchInput: { flex: 1, paddingVertical: 14, marginLeft: 10, fontSize: 15, fontWeight: '700', color: '#0f172a' },
    vehicleItem: {
        marginTop: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    vehicleItemPlate: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: 1.6 },
    vehicleItemModel: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 4 },
    vehicleItemOwner: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginTop: 4 },
    emptyState: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        backgroundColor: '#f8fafc',
        paddingVertical: 26,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginTop: 14
    },
    emptyTitle: { color: '#0f172a', fontSize: 14, fontWeight: '900', marginTop: 10 },
    emptySubtitle: { color: '#64748b', fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
    fieldLabel: { fontSize: 12, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    kmBox: {
        marginTop: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18
    },
    inputKm: { flex: 1, textAlign: 'center', fontSize: 40, fontWeight: '900', color: '#0f172a', paddingVertical: 18 },
    kmSuffix: { fontSize: 14, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    fuelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    fuelButton: {
        width: '48%',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10
    },
    fuelButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    fuelButtonReserve: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    fuelButtonText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
    fuelButtonTextActive: { color: '#fff' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginRight: 8,
        marginBottom: 8,
        gap: 6
    },
    chipActive: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    chipText: { color: '#475569', fontSize: 12, fontWeight: '800' },
    chipTextActive: { color: '#ef4444' },
    inputObs: {
        marginTop: 10,
        minHeight: 110,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '600'
    },
    photoCTA: {
        marginTop: 14,
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#93c5fd',
        paddingVertical: 26,
        alignItems: 'center',
        justifyContent: 'center'
    },
    photoCTATitle: { marginTop: 10, fontSize: 15, fontWeight: '900', color: '#1d4ed8' },
    photoCTASubtitle: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#2563eb', textAlign: 'center', paddingHorizontal: 18 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 },
    photoCard: { width: '48%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 10, backgroundColor: '#e2e8f0' },
    photoThumb: { width: '100%', height: '100%' },
    btnRemoverFoto: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center'
    },
    legalText: { marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '600', lineHeight: 20 },
    signatureCTA: {
        marginTop: 16,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 20,
        paddingVertical: 24,
        alignItems: 'center'
    },
    signatureCTATitle: { marginTop: 10, fontSize: 14, fontWeight: '900', color: '#1d4ed8' },
    signatureDoneBox: {
        marginTop: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        backgroundColor: '#f0fdf4',
        padding: 12
    },
    signaturePreview: { width: '100%', height: 110, resizeMode: 'contain' },
    signatureRetry: { alignSelf: 'center', marginTop: 10 },
    signatureRetryText: { color: '#ef4444', fontWeight: '800', fontSize: 13 },
    footerBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 22,
        gap: 10
    },
    footerSecondary: {
        flex: 1,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16
    },
    footerSecondaryText: { color: '#475569', fontSize: 14, fontWeight: '900' },
    footerPrimary: {
        flex: 1.4,
        borderRadius: 18,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16
    },
    footerPrimaryDisabled: { opacity: 0.7 },
    footerPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900' },
    modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', justifyContent: 'center', padding: 16 },
    modalBox: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
    signatureCanvasBox: { height: 320, backgroundColor: '#f8fafc' },
    modalActions: { flexDirection: 'row', padding: 16, gap: 10 },
    modalActionSecondary: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15
    },
    modalActionSecondaryText: { color: '#475569', fontSize: 14, fontWeight: '900' },
    modalActionPrimary: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15
    },
    modalActionPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900' }
});
