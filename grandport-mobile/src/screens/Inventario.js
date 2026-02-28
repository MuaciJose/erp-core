import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Vibration, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import api from '../api/axios';
import Scanner from '../components/Scanner';

// Componente para Ajuste de Estoque (NOVO)
const AjusteEstoque = ({ produto, onUpdate }) => {
    const [novaQtd, setNovaQtd] = useState(produto.quantidadeEstoque.toString());

    const confirmarAjuste = async () => {
        try {
            await api.patch(`/api/produtos/${produto.id}/ajuste-estoque`, {
                quantidade: parseInt(novaQtd),
                motivo: "Inventário Manual Mobile"
            });
            Alert.alert("Sucesso", "Estoque da GrandPort atualizado!");
            onUpdate(); // Recarrega os dados da peça
        } catch (err) {
            Alert.alert("Erro", "Não foi possível atualizar o saldo.");
        }
    };

    return (
        <View style={styles.ajusteContainer}>
            <Text style={styles.ajusteLabel}>Contagem Física Real:</Text>
            <View style={styles.ajusteInputRow}>
                <TextInput
                    keyboardType="numeric"
                    style={styles.ajusteInput}
                    value={novaQtd}
                    onChangeText={setNovaQtd}
                />
                <TouchableOpacity
                    onPress={confirmarAjuste}
                    style={styles.ajusteBotao}
                >
                    <Text style={styles.ajusteBotaoTexto}>SALVAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Componente interno para exibir os detalhes
const DetalheProduto = ({ produto, onVoltar, onReload }) => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageContainer}>
                <Image
                    // Usa fotoUrl se existir, senão tenta o caminho local, senão placeholder
                    // ATENÇÃO: Substitua 'SEU_IP' pelo IP da sua máquina na rede local
                    source={{ uri: produto.fotoUrl || (produto.fotoLocalPath ? `http://SEU_IP:8080${produto.fotoLocalPath}` : 'https://via.placeholder.com/300') }}
                    style={styles.foto}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.nome}>{produto.nome}</Text>
                <Text style={styles.marca}>Marca: {produto.marca?.nome || 'Genérica'}</Text>

                <View style={styles.badgeEstoque}>
                    <Text style={styles.estoqueText}>Estoque Atual: {produto.quantidadeEstoque} un</Text>
                </View>

                {/* Componente de Ajuste de Estoque */}
                <AjusteEstoque produto={produto} onUpdate={onReload} />

                {/* Bloco de Localização */}
                <View style={styles.localizacaoCard}>
                    <Text style={styles.localizacaoLabel}>ONDE ENCONTRAR:</Text>
                    <Text style={styles.localizacaoValue}>
                        {produto.localizacao || "NÃO ENDEREÇADO"}
                    </Text>
                </View>

                <Text style={styles.label}>APLICAÇÕES / SIMILARES:</Text>
                <View style={styles.similarContainer}>
                    <Text style={styles.similarText}>
                        {produto.aplicacao || "Nenhuma aplicação específica cadastrada."}
                    </Text>
                </View>

                <View style={styles.precoContainer}>
                    <Text style={styles.precoLabel}>Preço de Venda</Text>
                    <Text style={styles.precoValue}>
                        R$ {produto.precoVenda ? produto.precoVenda.toFixed(2).replace('.', ',') : '0,00'}
                    </Text>
                </View>

                <View style={{ marginTop: 30, marginBottom: 40 }}>
                    <Button title="Escanear Outra Peça" onPress={onVoltar} />
                </View>
            </View>
        </ScrollView>
    );
};

export const Inventario = () => {
    const [produto, setProduto] = useState(null);

    const buscarProduto = async (ean) => {
        try {
            // Toca o som de Bip
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/bip.mp3')
            );
            await sound.playAsync();

            const res = await api.get(`/api/produtos/mobile/scan/${ean}`);
            setProduto(res.data);
        } catch (err) {
            Vibration.vibrate();
            alert("Peça não encontrada no estoque da GrandPort");
        }
    };

    const recarregarProduto = async () => {
        if (produto && produto.codigoBarras) {
            await buscarProduto(produto.codigoBarras);
        }
    };

    if (produto) {
        return <DetalheProduto produto={produto} onVoltar={() => setProduto(null)} onReload={recarregarProduto} />;
    }

    return (
        <View style={{ flex: 1 }}>
            <Scanner onScan={buscarProduto} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    imageContainer: { alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
    foto: { width: 250, height: 250, borderRadius: 10 },
    infoContainer: { padding: 20 },
    nome: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    marca: { fontSize: 16, color: '#666', marginBottom: 15 },
    badgeEstoque: { backgroundColor: '#e1f5fe', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
    estoqueText: { color: '#0288d1', fontWeight: 'bold', fontSize: 16 },

    // Estilos do Ajuste de Estoque
    ajusteContainer: { padding: 15, backgroundColor: '#f0f4f8', borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#cfd8dc' },
    ajusteLabel: { fontWeight: 'bold', marginBottom: 8, color: '#455a64' },
    ajusteInputRow: { flexDirection: 'row', gap: 10 },
    ajusteInput: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#b0bec5', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    ajusteBotao: { backgroundColor: '#2e7d32', paddingHorizontal: 20, borderRadius: 5, justifyContent: 'center' },
    ajusteBotaoTexto: { color: '#fff', fontWeight: 'bold' },

    // Estilos da Localização
    localizacaoCard: {
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ffb74d',
        alignItems: 'center'
    },
    localizacaoLabel: { fontSize: 12, color: '#e65100', fontWeight: 'bold', marginBottom: 4 },
    localizacaoValue: { fontSize: 20, fontWeight: '900', color: '#bf360c', textAlign: 'center' },

    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
    similarContainer: { padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 20 },
    similarText: { fontSize: 15, color: '#333', lineHeight: 22 },
    precoContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15, alignItems: 'flex-end' },
    precoLabel: { fontSize: 14, color: '#999', marginBottom: 4 },
    precoValue: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32' }
});