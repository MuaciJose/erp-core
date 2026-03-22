import React, { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message'; // 🚀 IMPORTANDO O TOAST

export default function Scanner({ onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{color: '#fff', textAlign: 'center', marginBottom: 20}}>Libere a câmera, Comandante.</Text>
                <Button onPress={requestPermission} title="Permitir Câmera" />
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);

        // 🚀 O ALERTA ANTIGO MORREU! AGORA É UM TOAST PROFISSIONAL:
        Toast.show({
            type: 'info', // Cor azul de "informação"
            text1: 'Código Capturado!',
            text2: `Lendo: ${data}...`,
            position: 'top',
            visibilityTime: 1500, // Fica na tela só por 1 segundo e meio
        });

        onScan(data);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            {scanned && <Button title={'Escanear novamente'} onPress={() => setScanned(false)} />}
        </View>
    );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' } });