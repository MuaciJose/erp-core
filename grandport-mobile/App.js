import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message'; // 🚀 1. IMPORTANDO O TOAST
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './src/screens/Login';
import { Inventario } from './src/screens/Inventario';

export default function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Quando o app abre, ele vai no cofre ver se já tem o token salvo
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const token = await AsyncStorage.getItem('grandport_token');
        if (token) {
          setEstaLogado(true); // Achou a chave! Pode liberar a entrada.
        }
      } catch (error) {
        console.error("Erro ao ler a memória do celular:", error);
      } finally {
        setCarregando(false); // Terminou de procurar, pode tirar a tela de carregamento
      }
    };
    verificarAcesso();
  }, []);

  // Tela de "Carregando..." enquanto o app procura a chave
  if (carregando) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <StatusBar style="light" />
        </View>
    );
  }

  // O Roteamento de Combate
  return (
      <View style={styles.container}>
        {estaLogado ? (
            <Inventario />
        ) : (
            <Login onLoginSuccess={() => setEstaLogado(true)} />
        )}
        <StatusBar style="auto" />

        {/* 🚀 2. O TOAST FICA AQUI, OLHANDO TUDO LÁ DE CIMA! */}
        <Toast />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  }
});