import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../api/axios';

// ============================================================================
// 🔍 AUTOCOMPLETE MOBILE
// ============================================================================
const AutocompleteMobile = ({ label, placeholder, onSearch, onSelect, displayValue, renderItem, initialValue }) => {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        if (initialValue) {
            setBusca(displayValue(initialValue));
        }
    }, [initialValue]);

    const handleTextChange = async (texto) => {
        setBusca(texto);
        setAberto(true); // Abre a caixa imediatamente para dar feedback

        if (texto.length >= 2) {
            setCarregando(true);
            try {
                const data = await onSearch(texto);
                setResultados(Array.isArray(data) ? data : (data.content || data.data || []));
            } catch (error) {
                console.log("Erro na busca:", error);
            } finally {
                setCarregando(false);
            }
        } else {
            setResultados([]);
            onSelect(null); // Limpa a seleção se o usuário apagar
        }
    };

    const handleSelect = (item) => {
        setBusca(displayValue(item));
        onSelect(item);
        setAberto(false);
    };

    return (
        <View style={{ zIndex: aberto ? 100 : 1, position: 'relative' }}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.inputFlex}
                    value={busca}
                    onChangeText={handleTextChange}
                    placeholder={placeholder}
                    onFocus={() => { setAberto(true); }}
                />
                {carregando && <ActivityIndicator size="small" color="#3b82f6" style={{ paddingRight: 10 }} />}
            </View>

            {aberto && (
                <View style={styles.dropdown}>
                    {/* Se tem menos de 2 letras, mostra o aviso */}
                    {busca.length < 2 && !carregando && (
                        <Text style={{ padding: 15, color: '#94a3b8', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>
                            Digite pelo menos 2 caracteres para buscar no servidor...
                        </Text>
                    )}

                    {/* Se digitou 2 letras, carregou, mas não achou nada */}
                    {busca.length >= 2 && !carregando && resultados.length === 0 && (
                        <Text style={{ padding: 15, color: '#ef4444', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>
                            Nenhum resultado encontrado.
                        </Text>
                    )}

                    {/* Se achou, mostra a lista */}
                    {resultados.slice(0, 5).map((item, index) => (
                        <TouchableOpacity key={index} style={styles.dropItem} onPress={() => handleSelect(item)}>
                            {renderItem(item)}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// ============================================================================
// 📱 TELA PRINCIPAL (CADASTRO / EDIÇÃO)
// ============================================================================
export default function CadastroProduto({ onVoltar, produtoParaEditar }) {
    const isEditing = !!produtoParaEditar;

    const [lendoEan, setLendoEan] = useState(false);
    const [imagem, setImagem] = useState(null);
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        sku: '',
        nome: '',
        descricao: '',
        aplicacao: '',
        localizacao: '',
        referenciaOriginal: '',
        codigoBarras: '',
        precoCusto: '',
        precoVenda: '',
        quantidadeEstoque: '',
        estoqueMinimo: '5',
        marcaId: '',
        ncmCodigo: '',
        fotoUrl: ''
    });

    useEffect(() => {
        if (isEditing && produtoParaEditar) {
            // 🚀 EXTRAÇÃO BLINDADA PARA NÃO DAR CAMPO VAZIO
            const idMarca = produtoParaEditar.marca?.id || produtoParaEditar.marcaId || '';
            const codNcm = produtoParaEditar.ncm?.codigo || produtoParaEditar.ncm?.Codigo || produtoParaEditar.ncm?.id || produtoParaEditar.ncmCodigo || '';

            setForm({
                sku: produtoParaEditar.sku || '',
                nome: produtoParaEditar.nome || '',
                descricao: produtoParaEditar.descricao || '',
                aplicacao: produtoParaEditar.aplicacao || '',
                localizacao: produtoParaEditar.localizacao || '',
                referenciaOriginal: produtoParaEditar.referenciaOriginal || '',
                codigoBarras: produtoParaEditar.codigoBarras || '',
                precoCusto: produtoParaEditar.precoCusto?.toString() || '',
                precoVenda: produtoParaEditar.precoVenda?.toString() || '',
                quantidadeEstoque: produtoParaEditar.quantidadeEstoque?.toString() || '',
                estoqueMinimo: produtoParaEditar.estoqueMinimo?.toString() || '5',
                marcaId: idMarca,
                ncmCodigo: String(codNcm),
                fotoUrl: produtoParaEditar.fotoUrl || ''
            });
            setPreview(produtoParaEditar.fotoUrl || produtoParaEditar.fotoLocalPath);
        }
    }, [produtoParaEditar, isEditing]);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const buscarNcm = async (termo) => {
        const res = await api.get(`/api/ncm?busca=${termo}`);
        return res.data;
    };

    // BLINDAGEM DUPLA NA MARCA
    const buscarMarca = async (termo) => {
        try {
            // Plano A: Tenta a rota de busca inteligente
            const res = await api.get(`/api/marcas/buscar?nome=${termo}`);
            return res.data;
        } catch (error) {
            // Plano B: Se a rota de busca não existir no Java, ele puxa todas as marcas e filtra no celular na hora!
            console.log("Plano A falhou, buscando todas as marcas...");
            const res = await api.get(`/api/marcas`);
            const lista = Array.isArray(res.data) ? res.data : (res.data.content || []);
            return lista.filter(m => m.nome.toLowerCase().includes(termo.toLowerCase()));
        }
    };

    const tirarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Toast.show({ type: 'error', text1: 'Permissão Negada' });

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
        });

        if (!result.canceled) {
            setImagem(result.assets[0].uri);
            setPreview(result.assets[0].uri);
            handleChange('fotoUrl', '');
        }
    };

    const handleSubmit = async () => {
        console.log("Valores antes de salvar -> Marca:", form.marcaId, "NCM:", form.ncmCodigo);

        if (!form.marcaId || !form.ncmCodigo) {
            return Toast.show({ type: 'error', text1: 'Atenção!', text2: 'A Marca e o NCM precisam ser selecionados na lista.' });
        }
        if (!form.nome || !form.sku) {
            return Toast.show({ type: 'error', text1: 'Atenção!', text2: 'Nome e SKU são obrigatórios.' });
        }

        try {
            Toast.show({ type: 'info', text1: isEditing ? 'Atualizando...' : 'Salvando produto...' });

            const payload = {
                sku: form.sku,
                nome: form.nome,
                descricao: form.descricao || '',
                aplicacao: form.aplicacao || '',
                localizacao: form.localizacao || '',
                referenciaOriginal: form.referenciaOriginal || '',
                codigoBarras: form.codigoBarras || null,
                precoCusto: parseFloat(form.precoCusto.replace(',','.')) || 0,
                precoVenda: parseFloat(form.precoVenda.replace(',','.')) || 0,
                quantidadeEstoque: parseInt(form.quantidadeEstoque) || 0,
                estoqueMinimo: parseInt(form.estoqueMinimo) || 5,
                marcaId: parseInt(form.marcaId),
                ncmCodigo: form.ncmCodigo.replace(/\D/g, ''),
                fotoUrl: form.fotoUrl || '',
                ativo: true, origemMercadoria: 0, unidadeMedida: 'UN'
            };

            const formData = new FormData();

            const jsonPath = FileSystem.cacheDirectory + 'produto.json';
            await FileSystem.writeAsStringAsync(jsonPath, JSON.stringify(payload));
            formData.append('produto', { uri: jsonPath, name: 'produto.json', type: 'application/json' });

            if (imagem) {
                let filename = imagem.split('/').pop();
                formData.append('image', { uri: imagem, name: filename, type: 'image/jpeg' });
            }

            let tokenRaw = await AsyncStorage.getItem('grandport_token');
            let tokenLimpo = tokenRaw ? tokenRaw.replace(/['"]+/g, '') : '';

            const urlAlvo = isEditing ? `${api.defaults.baseURL}/api/produtos/${produtoParaEditar.id}` : `${api.defaults.baseURL}/api/produtos`;

            const response = await fetch(urlAlvo, {
                method: isEditing ? 'PUT' : 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${tokenLimpo}` },
            });

            if (!response.ok) {
                const erroMsg = await response.text();
                throw new Error(erroMsg);
            }

            Toast.show({ type: 'success', text1: isEditing ? 'Produto atualizado!' : 'Produto Cadastrado!' });
            onVoltar();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Erro ao salvar', text2: error.message.substring(0, 60) });
        }
    };

    if (lendoEan) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => { handleChange('codigoBarras', data); setLendoEan(false); }} />
                <TouchableOpacity onPress={() => setLendoEan(false)} style={styles.btnVoltarScan}><Text style={styles.btnTextoBranco}>CANCELAR SCAN</Text></TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity onPress={onVoltar} style={styles.btnVoltar}>
                        <Feather name="arrow-left" size={24} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.tituloHeader}>{isEditing ? 'Editar Produto' : 'Novo Produto'}</Text>
                </View>
            </View>

            <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>

                    <Text style={styles.label}>Descrição da Peça</Text>
                    <TextInput style={styles.input} value={form.nome} onChangeText={t => handleChange('nome', t)} />

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>SKU</Text>
                            <TextInput style={styles.input} value={form.sku} onChangeText={t => handleChange('sku', t)} />
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>EAN (Cód. Barras)</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.inputFlex} keyboardType="numeric" value={form.codigoBarras} onChangeText={t => handleChange('codigoBarras', t)} />
                                <TouchableOpacity onPress={() => setLendoEan(true)} style={styles.btnScan}><Feather name="maximize" size={20} color="#374151" /></TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.boxAzul}>
                        <Text style={styles.labelAzul}>REFERÊNCIA ORIGINAL</Text>
                        <TextInput style={styles.inputAzul} value={form.referenciaOriginal} onChangeText={t => handleChange('referenciaOriginal', t)} />
                    </View>

                    <Text style={styles.label}>Compatibilidade / Veículos</Text>
                    <TextInput style={[styles.input, {height: 60}]} multiline value={form.aplicacao} onChangeText={t => handleChange('aplicacao', t)} />

                    <View style={[styles.row, { zIndex: 10 }]}>
                        <View style={styles.col}>
                            {/* 🚀 MARCA BLINDADA */}
                            <AutocompleteMobile
                                label="Fabricante (Marca) *"
                                placeholder="Buscar..."
                                onSearch={buscarMarca}
                                onSelect={(m) => handleChange('marcaId', m ? m.id : '')}
                                displayValue={(m) => m?.nome || ''}
                                renderItem={(m) => <Text style={{fontWeight: 'bold', color: '#1f2937'}}>{m.nome}</Text>}
                                initialValue={produtoParaEditar?.marca}
                            />
                        </View>
                        <View style={styles.col}>
                            {/* 🚀 NCM BLINDADO CAÇANDO O CÓDIGO */}
                            <AutocompleteMobile
                                label="NCM (Fiscal) *"
                                placeholder="Ex: 8708..."
                                onSearch={buscarNcm}
                                onSelect={(n) => {
                                    // Pega o NCM venha como vier do back-end!
                                    const cod = n ? (n.codigo || n.Codigo || n.id || n.ncmCodigo || '') : '';
                                    handleChange('ncmCodigo', String(cod));
                                }}
                                displayValue={(n) => n?.codigo || n?.Codigo || n?.id || n?.ncmCodigo || ''}
                                renderItem={(n) => (
                                    <View>
                                        <Text style={{fontWeight: 'bold', color: '#1d4ed8'}}>{n.codigo || n.Codigo || n.id || n.ncmCodigo}</Text>
                                        <Text style={{fontSize: 12, color: '#6b7280'}} numberOfLines={1}>{n.descricao || n.Descricao}</Text>
                                    </View>
                                )}
                                initialValue={produtoParaEditar?.ncm}
                            />
                        </View>
                    </View>

                    <View style={[styles.row, {marginTop: 15}]}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Preço de Custo</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={form.precoCusto} onChangeText={t => handleChange('precoCusto', t)} />
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Preço de Venda</Text>
                            <TextInput style={[styles.input, styles.inputVenda]} keyboardType="numeric" value={form.precoVenda} onChangeText={t => handleChange('precoVenda', t)} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Estoque</Text>
                            <TextInput style={[styles.input, isEditing && styles.inputDisabled]} keyboardType="numeric" value={form.quantidadeEstoque} onChangeText={t => handleChange('quantidadeEstoque', t)} editable={!isEditing} />
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Estoque Mínimo</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={form.estoqueMinimo} onChangeText={t => handleChange('estoqueMinimo', t)} />
                        </View>
                    </View>

                    <View style={styles.boxLaranja}>
                        <Text style={styles.labelLaranja}>LOCALIZAÇÃO NO DEPÓSITO</Text>
                        <TextInput style={styles.inputLaranja} value={form.localizacao} onChangeText={t => handleChange('localizacao', t)} />
                    </View>

                    <Text style={styles.label}>Foto do Produto</Text>
                    <TextInput
                        style={[styles.input, {marginBottom: 10}]}
                        value={form.fotoUrl}
                        onChangeText={t => { handleChange('fotoUrl', t); setPreview(t); setImagem(null); }}
                        placeholder="https://link-da-imagem.com/foto.jpg"
                    />

                    <TouchableOpacity onPress={tirarFoto} style={styles.caixaFoto}>
                        {preview ? (
                            <Image source={{ uri: preview }} style={styles.previewImg} />
                        ) : (
                            <View style={styles.fotoPlaceholder}>
                                <Feather name="upload" size={40} color="#9ca3af" />
                            </View>
                        )}
                    </TouchableOpacity>

                </View>
                <View style={{height: 100}} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={onVoltar} style={styles.btnCancelar}><Text style={styles.btnTextoCinza}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={styles.btnSalvar}><Feather name="save" size={20} color="#fff" /><Text style={styles.btnTextoBranco}>{isEditing ? 'Salvar Alterações' : 'Salvar Produto'}</Text></TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { backgroundColor: '#fff', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', justifyContent: 'space-between' },
    tituloHeader: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    btnVoltar: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12 },

    formContainer: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20 },

    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 5, marginTop: 15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: '#fff' },
    inputFlex: { flex: 1, padding: 10, fontSize: 16, color: '#111827' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 10, fontSize: 16, color: '#111827', backgroundColor: '#fff' },
    inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
    inputVenda: { color: '#2563eb', fontWeight: 'bold' },

    row: { flexDirection: 'row', gap: 15 },
    col: { flex: 1 },
    btnScan: { padding: 10, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#d1d5db' },

    boxAzul: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 15 },
    labelAzul: { fontSize: 12, fontWeight: 'bold', color: '#1e40af', marginBottom: 5 },
    inputAzul: { backgroundColor: '#fff', padding: 10, borderRadius: 6, borderWidth: 2, borderColor: '#93c5fd', fontFamily: 'monospace', fontSize: 16 },

    boxLaranja: { backgroundColor: '#fff7ed', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#fed7aa', marginTop: 15 },
    labelLaranja: { fontSize: 12, fontWeight: 'bold', color: '#9a3412', marginBottom: 5 },
    inputLaranja: { backgroundColor: '#fff', padding: 10, borderRadius: 6, borderWidth: 2, borderColor: '#fdba74', fontFamily: 'monospace', fontSize: 16 },

    dropdown: { position: 'absolute', top: 75, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, overflow: 'hidden' },
    dropItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },

    caixaFoto: { borderWidth: 2, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', overflow: 'hidden' },
    fotoPlaceholder: { alignItems: 'center' },
    previewImg: { width: '100%', height: '100%', resizeMode: 'contain' },

    footer: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 15, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    btnCancelar: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db' },
    btnTextoCinza: { color: '#4b5563', fontWeight: '500' },
    btnSalvar: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, flexDirection: 'row', gap: 8, alignItems: 'center' },
    btnTextoBranco: { color: '#fff', fontWeight: '500' },

    btnVoltarScan: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ef4444', padding: 20, borderRadius: 16 }
});