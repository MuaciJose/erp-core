import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export default function ChecklistMobile({ onVoltar }) {
    const [veiculos, setVeiculos] = useState([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);

    // Formulário
    const [kmAtual, setKmAtual] = useState('');
    const [nivelCombustivel, setNivelCombustivel] = useState('');
    const [avariadasSelecionadas, setAvariadasSelecionadas] = useState([]);
    const [observacoes, setObservacoes] = useState('');
    const [fotosCapturadas, setFotosCapturadas] = useState([]);

    // Assinatura
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

    const veiculosFiltrados = veiculos.filter(v =>
        (v.placa && v.placa.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (v.modelo && v.modelo.toLowerCase().includes(termoBusca.toLowerCase()))
    );

    const toggleAvaria = (tag) => {
        setAvariadasSelecionadas(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const tirarFoto = async () => {
        if (fotosCapturadas.length >= 4) return Toast.show({ type: 'error', text1: 'Limite de 4 fotos atingido!' });

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Toast.show({ type: 'error', text1: 'Permissão de câmera negada!' });

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], quality: 0.5, // 🚀 Compressão automática nativa!
        });

        if (!result.canceled) {
            setFotosCapturadas([...fotosCapturadas, result.assets[0]]);
        }
    };

    const removerFoto = (index) => {
        setFotosCapturadas(prev => prev.filter((_, i) => i !== index));
    };

    // ============================================================================
    // ✍️ CONTROLE DA ASSINATURA DIGITAL
    // ============================================================================
    const handleOKAssinatura = (signature) => {
        setAssinaturaBase64(signature);
        setModalAssinatura(false);
        Toast.show({ type: 'success', text1: 'Assinatura Registada!' });
    };

    const handleClearAssinatura = () => { refAssinatura.current.clearSignature(); };
    const handleConfirmaAssinatura = () => { refAssinatura.current.readSignature(); };

    // ============================================================================
    // 🚀 SALVAR VISTORIA NO JAVA
    // ============================================================================
    const handleSalvarChecklist = async () => {
        if (!veiculoSelecionado) return Toast.show({ type: 'error', text1: 'Selecione um veículo!' });
        if (!kmAtual) return Toast.show({ type: 'error', text1: 'Informe o KM de Entrada!' });
        if (!nivelCombustivel) return Toast.show({ type: 'error', text1: 'Informe o Combustível!' });
        if (!assinaturaBase64) return Toast.show({ type: 'error', text1: 'Assinatura obrigatória!' });

        setLoading(true);
        try {
            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            // 1. DADOS PRINCIPAIS DO CHECKLIST
            const payload = {
                veiculoId: veiculoSelecionado.id,
                clienteId: veiculoSelecionado.cliente?.id || null,
                kmAtual: parseInt(kmAtual),
                nivelCombustivel: nivelCombustivel,
                itensAvariados: avariadasSelecionadas.join(', '),
                observacoesGerais: observacoes
            };

            const response = await api.post('/api/checklists', payload);
            const checklistCriado = response.data;

            // 2. ENVIO DA ASSINATURA E FOTOS (Múltiplos Disparos via FormData)
            Toast.show({ type: 'info', text1: 'A enviar evidências e assinatura...' });

            const enviarArquivo = async (uri, rota, nomeArquivo) => {
                const formData = new FormData();
                formData.append(rota.includes('assinatura') ? 'assinatura' : 'foto', {
                    uri: uri, name: nomeArquivo, type: 'image/jpeg'
                });
                await fetch(`${api.defaults.baseURL}${rota}`, {
                    method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${tokenLimpo}` }
                });
            };

            // Envia Assinatura (O componente devolve a URI pronta em Base64)
            await enviarArquivo(assinaturaBase64, `/api/checklists/${checklistCriado.id}/assinatura`, 'assinatura.jpg');

            // Envia Fotos
            for (let i = 0; i < fotosCapturadas.length; i++) {
                await enviarArquivo(fotosCapturadas[i].uri, `/api/checklists/${checklistCriado.id}/fotos`, `foto_${i}.jpg`);
            }

            Alert.alert("Sucesso! ✅", "Vistoria oficializada e arquivada no sistema.", [{ text: "OK", onPress: onVoltar }]);

        } catch (error) {
            console.log("Erro Vistoria:", error);
            Toast.show({ type: 'error', text1: 'Falha Crítica ao salvar vistoria.' });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // 🎨 RENDERIZAÇÃO
    // ============================================================================
    return (
        <View style={styles.container}>
            {/* CABEÇALHO */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                    <Feather name="arrow-left" size={24} color="#64748b" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.titulo}>Vistoria de Entrada</Text>
                    <Text style={styles.subtitulo}>Recepção do Veículo</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* 1. SELEÇÃO DO VEÍCULO */}
                {!veiculoSelecionado ? (
                    <View style={styles.card}>
                        <Text style={styles.lblSessao}><Feather name="search" size={14}/> Buscar Veículo no Pátio</Text>
                        <TextInput
                            style={styles.inputBusca}
                            placeholder="Digite a PLACA ou MODELO..."
                            value={termoBusca}
                            onChangeText={setTermoBusca}
                            autoCapitalize="characters"
                        />
                        {veiculosFiltrados.slice(0, 5).map(v => (
                            <TouchableOpacity key={v.id} style={styles.itemBuscaVeiculo} onPress={() => setVeiculoSelecionado(v)}>
                                <View>
                                    <Text style={styles.placaBusca}>{v.placa}</Text>
                                    <Text style={styles.modeloBusca}>{v.modelo}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#cbd5e1" />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TouchableOpacity style={styles.btnLimparVei} onPress={() => setVeiculoSelecionado(null)}>
                            <Feather name="x" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                        <Text style={styles.lblSessaoEscura}>VEÍCULO SELECIONADO</Text>
                        <Text style={styles.placaGrd}>{veiculoSelecionado.placa}</Text>
                        <Text style={styles.modeloGrd}>{veiculoSelecionado.modelo}</Text>
                        <Text style={styles.clienteGrd}><Feather name="user" size={12}/> {veiculoSelecionado.cliente?.nome || 'Sem Proprietário'}</Text>
                    </View>
                )}

                {/* SÓ MOSTRA O RESTO SE O VEÍCULO FOR ESCOLHIDO */}
                {veiculoSelecionado && (
                    <View style={{ gap: 20 }}>

                        {/* 2. DADOS VITAIS (KM E COMBUSTÍVEL) */}
                        <View style={styles.card}>
                            <Text style={styles.lblSessao}><Feather name="sliders" size={14}/> Quilometragem Atual</Text>
                            <TextInput
                                style={styles.inputKm}
                                placeholder="Ex: 54000"
                                keyboardType="numeric"
                                value={kmAtual}
                                onChangeText={setKmAtual}
                            />

                            <Text style={[styles.lblSessao, { marginTop: 20 }]}><Feather name="droplet" size={14}/> Nível de Combustível</Text>
                            <View style={styles.combustivelRow}>
                                {niveisCombustivel.map((nivel, index) => (
                                    <TouchableOpacity
                                        key={nivel}
                                        onPress={() => setNivelCombustivel(nivel)}
                                        style={[styles.btnCombustivel, nivelCombustivel === nivel && (index === 0 ? styles.btnCombReserva : styles.btnCombAtivo)]}
                                    >
                                        <Text style={[styles.txtComb, nivelCombustivel === nivel && {color: '#fff'}]}>{nivel}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 3. AVARIAS E OBSERVAÇÕES */}
                        <View style={styles.card}>
                            <Text style={styles.lblSessao}><Feather name="alert-triangle" size={14}/> Mapeamento de Avarias</Text>
                            <View style={styles.avariasGrid}>
                                {tagsAvarias.map(tag => {
                                    const ativo = avariadasSelecionadas.includes(tag);
                                    return (
                                        <TouchableOpacity key={tag} onPress={() => toggleAvaria(tag)} style={[styles.chipAvaria, ativo && styles.chipAvariaAtiva]}>
                                            {ativo && <Feather name="check-circle" size={14} color="#ef4444" />}
                                            <Text style={[styles.txtChipAvaria, ativo && {color: '#ef4444'}]}>{tag}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            <Text style={[styles.lblSessao, { marginTop: 20 }]}><Feather name="file-text" size={14}/> Observações Extras</Text>
                            <TextInput
                                style={styles.inputObs}
                                multiline
                                numberOfLines={3}
                                placeholder="Pertences de valor no carro, rádio quebrado..."
                                value={observacoes}
                                onChangeText={setObservacoes}
                            />
                        </View>

                        {/* 4. EVIDÊNCIAS FOTOGRÁFICAS */}
                        <View style={styles.card}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                                <Text style={styles.lblSessao}><Feather name="camera" size={14}/> Fotos ({fotosCapturadas.length}/4)</Text>
                                <TouchableOpacity onPress={tirarFoto} style={styles.btnTirarFoto}>
                                    <Feather name="camera" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {fotosCapturadas.length === 0 ? (
                                <Text style={styles.txtVazioCenter}>Nenhuma foto capturada.</Text>
                            ) : (
                                <View style={styles.fotosGrid}>
                                    {fotosCapturadas.map((foto, index) => (
                                        <View key={index} style={styles.fotoContainer}>
                                            <Image source={{ uri: foto.uri }} style={styles.fotoThumb} />
                                            <TouchableOpacity onPress={() => removerFoto(index)} style={styles.btnRemoverFoto}>
                                                <Feather name="x" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* 5. ASSINATURA */}
                        <View style={styles.card}>
                            <Text style={styles.lblSessao}><Feather name="pen-tool" size={14}/> Termo de Vistoria</Text>
                            <Text style={styles.txtLegal}>Declaro que acompanhei a vistoria e concordo com as avarias e o estado do veículo descritos acima.</Text>

                            {assinaturaBase64 ? (
                                <View style={styles.boxAssinaturaFeita}>
                                    <Image source={{ uri: assinaturaBase64 }} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
                                    <TouchableOpacity onPress={() => setModalAssinatura(true)} style={styles.btnRefazerAss}>
                                        <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Refazer Assinatura</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setModalAssinatura(true)} style={styles.btnAssinar}>
                                    <Feather name="edit-2" size={24} color="#3b82f6" />
                                    <Text style={styles.txtBtnAssinar}>TOCAR PARA ASSINAR</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>
                )}
            </ScrollView>

            {/* RODAPÉ FIXO DE SALVAR */}
            {veiculoSelecionado && (
                <View style={styles.footerFixo}>
                    <TouchableOpacity style={[styles.btnFinalizar, loading && {opacity: 0.7}]} onPress={handleSalvarChecklist} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Feather name="check-square" size={20} color="#fff" />
                                <Text style={styles.txtFinalizar}>SALVAR VISTORIA</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* MODAL DE ASSINATURA */}
            <Modal visible={modalAssinatura} animationType="slide" transparent={true}>
                <View style={styles.modalAssinaturaBg}>
                    <View style={styles.modalAssinaturaBox}>
                        <View style={styles.modalAssHeader}>
                            <Text style={styles.tituloAss}>Assinatura do Cliente</Text>
                            <TouchableOpacity onPress={() => setModalAssinatura(false)}><Feather name="x" size={24} color="#ef4444"/></TouchableOpacity>
                        </View>
                        <Text style={styles.subAss}>Desenhe com o dedo no quadro abaixo:</Text>

                        <View style={styles.quadroAssinatura}>
                            <SignatureScreen
                                ref={refAssinatura}
                                onOK={handleOKAssinatura}
                                onEmpty={() => Toast.show({ type: 'info', text1: 'O quadro está vazio.' })}
                                descriptionText="Assinatura do Responsável"
                                clearText="Limpar"
                                confirmText="Confirmar"
                                webStyle={`.m-signature-pad {box-shadow: none; border: none; } 
                                           .m-signature-pad--body {border: none;}
                                           .m-signature-pad--footer {display: none; margin: 0px;}
                                           body,html {height: 100%; width: 100%;}`
                                }
                            />
                        </View>

                        <View style={styles.botoesAssinatura}>
                            <TouchableOpacity style={styles.btnLimparAss} onPress={handleClearAssinatura}>
                                <Feather name="trash-2" size={18} color="#64748b" /><Text style={{color: '#64748b', fontWeight: 'bold'}}>LIMPAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSalvarAss} onPress={handleConfirmaAssinatura}>
                                <Feather name="check" size={18} color="#fff" /><Text style={{color: '#fff', fontWeight: 'black'}}>PRONTO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },

    card: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    lblSessao: { fontSize: 12, fontWeight: 'black', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },

    inputBusca: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, fontSize: 18, fontWeight: 'black', color: '#1e293b', borderBottomWidth: 2, borderColor: '#3b82f6', marginBottom: 10, textAlign: 'center' },
    itemBuscaVeiculo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    placaBusca: { fontSize: 18, fontWeight: 'black', color: '#1e293b' },
    modeloBusca: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

    btnLimparVei: { position: 'absolute', top: 15, right: 15, zIndex: 10, backgroundColor: '#334155', padding: 8, borderRadius: 10 },
    lblSessaoEscura: { fontSize: 10, fontWeight: 'black', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 },
    placaGrd: { fontSize: 32, fontWeight: 'black', color: '#60a5fa', letterSpacing: 2 },
    modeloGrd: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
    clienteGrd: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', backgroundColor: '#334155', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },

    inputKm: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, fontSize: 32, fontWeight: 'black', color: '#f97316', textAlign: 'center', borderWidth: 2, borderColor: '#fdba74' },

    combustivelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    btnCombustivel: { backgroundColor: '#f8fafc', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', minWidth: '30%', alignItems: 'center' },
    btnCombAtivo: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    btnCombReserva: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
    txtComb: { fontSize: 12, fontWeight: 'black', color: '#64748b' },

    avariasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chipAvaria: { backgroundColor: '#f8fafc', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 8 },
    chipAvariaAtiva: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
    txtChipAvaria: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

    inputObs: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, fontSize: 14, fontWeight: 'bold', color: '#334155', borderWidth: 1, borderColor: '#e2e8f0', minHeight: 80, textAlignVertical: 'top' },

    btnTirarFoto: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 12 },
    txtVazioCenter: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', paddingVertical: 20 },
    fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    fotoContainer: { width: 70, height: 70, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#e2e8f0' },
    fotoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
    btnRemoverFoto: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', padding: 5, borderRadius: 10 },

    txtLegal: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 20 },
    btnAssinar: { backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe', borderStyle: 'dashed', padding: 30, borderRadius: 20, alignItems: 'center', gap: 10 },
    txtBtnAssinar: { color: '#3b82f6', fontWeight: 'black', fontSize: 14 },
    boxAssinaturaFeita: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    btnRefazerAss: { marginTop: 10, padding: 10 },

    footerFixo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#e2e8f0', paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    btnFinalizar: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    txtFinalizar: { color: '#fff', fontSize: 16, fontWeight: 'black' },

    modalAssinaturaBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: 20 },
    modalAssinaturaBox: { backgroundColor: '#fff', borderRadius: 24, padding: 20, height: '60%' },
    modalAssHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    tituloAss: { fontSize: 20, fontWeight: 'black', color: '#1e293b' },
    subAss: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 20 },
    quadroAssinatura: { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', backgroundColor: '#f8fafc' },
    botoesAssinatura: { flexDirection: 'row', gap: 15, marginTop: 20 },
    btnLimparAss: { flex: 1, padding: 20, backgroundColor: '#f1f5f9', borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnSalvarAss: { flex: 1, padding: 20, backgroundColor: '#10b981', borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
});