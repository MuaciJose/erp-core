import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../api/axios';

export default function Parceiros({ onVoltar, onSelecionarCliente }) {
    const [parceiros, setParceiros] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [telaAtual, setTelaAtual] = useState('lista'); // 'lista' ou 'novo'

    // Formulario Novo
    const [form, setForm] = useState({ nome: '', documento: '', telefone: '', tipo: 'CLIENTE' });
    const [salvando, setSalvando] = useState(false);

    const carregarParceiros = async () => {
        setCarregando(true);
        try {
            const res = await api.get('/api/parceiros');
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            setParceiros(lista);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao carregar parceiros' });
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => { carregarParceiros(); }, []);

    const parceirosFiltrados = parceiros.filter(p => {
        const termo = busca.toLowerCase();
        return (p.nome || '').toLowerCase().includes(termo) ||
            (p.documento || '').includes(termo) ||
            (p.telefone || '').includes(termo);
    });

    const salvarParceiro = async () => {
        if (!form.nome || !form.documento) {
            return Toast.show({ type: 'error', text1: 'Atenção', text2: 'Nome e CPF/CNPJ são obrigatórios!' });
        }

        setSalvando(true);
        try {
            const payload = {
                ...form,
                email: '',
                endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', ibge: '' },
                limiteCredito: 0,
                intervaloDiasPagamento: 30
            };

            const res = await api.post('/api/parceiros', payload);
            Toast.show({ type: 'success', text1: 'Cliente Cadastrado!' });

            // 🚀 SE ESTIVERMOS NO ORÇAMENTO, JÁ DEVOLVE O CLIENTE PRONTO!
            if (onSelecionarCliente) {
                onSelecionarCliente(res.data);
            } else {
                setTelaAtual('lista');
                carregarParceiros();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao salvar', text2: 'Verifique se o CPF já existe.' });
        } finally {
            setSalvando(false);
        }
    };

    if (telaAtual === 'novo') {
        return (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setTelaAtual('lista')} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.titulo}>Novo Cliente</Text>
                </View>

                <ScrollView style={styles.formBox} keyboardShouldPersistTaps="handled">
                    <Text style={styles.lblSessao}>Cadastro Rápido (Pista)</Text>

                    <Text style={styles.label}>Nome Completo / Razão Social *</Text>
                    <TextInput style={styles.input} value={form.nome} onChangeText={t => setForm({...form, nome: t})} placeholder="Ex: João da Silva" />

                    <Text style={styles.label}>CPF ou CNPJ *</Text>
                    <TextInput style={styles.input} value={form.documento} onChangeText={t => setForm({...form, documento: t})} keyboardType="numeric" placeholder="Apenas números" />

                    <Text style={styles.label}>Telefone / WhatsApp</Text>
                    <TextInput style={styles.input} value={form.telefone} onChangeText={t => setForm({...form, telefone: t})} keyboardType="phone-pad" placeholder="(00) 00000-0000" />

                    <TouchableOpacity style={[styles.btnSalvar, salvando && {opacity: 0.7}]} onPress={salvarParceiro} disabled={salvando}>
                        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.txtSalvar}>CADASTRAR E SELECIONAR</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.titulo}>Parceiros</Text>
                        <Text style={styles.subtitulo}>{parceirosFiltrados.length} registos</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => { setForm({nome:'', documento:'', telefone:'', tipo:'CLIENTE'}); setTelaAtual('novo'); }} style={styles.btnNovo}>
                    <Feather name="user-plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.buscaContainer}>
                <View style={styles.inputWrapper}>
                    <Feather name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput style={styles.searchInput} placeholder="Buscar nome ou documento..." value={busca} onChangeText={setBusca} />
                </View>
            </View>

            {carregando ? (
                <View style={styles.centerBox}><ActivityIndicator size="large" color="#3b82f6" /></View>
            ) : (
                <FlatList
                    data={parceirosFiltrados}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.lista}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => onSelecionarCliente ? onSelecionarCliente(item) : null}>
                            <View style={styles.cardIcone}><Feather name="user" size={24} color="#3b82f6" /></View>
                            <View style={{flex: 1}}>
                                <Text style={styles.txtNome} numberOfLines={1}>{item.nome}</Text>
                                <Text style={styles.txtDoc}>{item.documento || 'S/ Doc'}</Text>
                            </View>
                            {item.telefone && (
                                <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=55${item.telefone.replace(/\D/g,'')}`)} style={styles.btnZap}>
                                    <Feather name="message-circle" size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 15 },
    titulo: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
    subtitulo: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
    btnNovo: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },

    buscaContainer: { padding: 15 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
    searchIcon: { position: 'absolute', left: 15, zIndex: 10 },
    searchInput: { flex: 1, padding: 15, paddingLeft: 45, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

    lista: { paddingHorizontal: 15, paddingBottom: 30 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 15 },
    cardIcone: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 12 },
    txtNome: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    txtDoc: { fontSize: 12, color: '#64748b', fontWeight: '900', marginTop: 2 },
    btnZap: { backgroundColor: '#22c55e', padding: 10, borderRadius: 10 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Formulario Novo
    formBox: { padding: 20 },
    lblSessao: { fontSize: 14, fontWeight: 'black', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 12, fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    btnSalvar: { backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30 },
    txtSalvar: { color: '#fff', fontWeight: 'black', fontSize: 16 }
});