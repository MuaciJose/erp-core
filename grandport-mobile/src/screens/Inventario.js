import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import api from '../api/axios';
import Scanner from '../components/Scanner';

export const Inventario = () => {
    const [produto, setProduto] = useState(null);

    const buscarProduto = async (ean) => {
        try {
            // Toca o som de Bip no sucesso
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/bip.mp3')
            );
            await sound.playAsync();

            // Lembre-se de configurar o IP correto no seu arquivo axios.js
            const res = await api.get(`/api/produtos/mobile/scan/${ean}`);
            setProduto(res.data);

        } catch (err) {
            // Vibra o celular em caso de erro
            Vibration.vibrate();
            console.error(err);
            alert("Peça não encontrada no estoque da GrandPort");
        }
    };

    return (
        <View style={styles.container}>
            {!produto ? (
                <Scanner onScan={buscarProduto} />
            ) : (
                <View style={styles.detailsContainer}>
                    <Image
                        // ATENÇÃO: Substitua 'SEU_IP' pelo IP da máquina onde o backend está rodando
                        source={{ uri: `http://SEU_IP:8080${produto.fotoLocalPath}` }}
                        style={styles.productImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.productName}>{produto.nome}</Text>
                    <Text style={styles.productInfo}>SKU: {produto.sku}</Text>
                    <Text style={styles.productStock}>Estoque Atual: {produto.quantidadeEstoque}</Text>
                    <Button title="Escanear Outra Peça" onPress={() => setProduto(null)} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    detailsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    productImage: {
        width: 250,
        height: 250,
        marginBottom: 20,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    productInfo: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 5,
    },
    productStock: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'blue',
        marginBottom: 30,
    },
});