import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './src/screens/Login';
import Dashboard from './src/screens/Dashboard';
// 🚀 CORREÇÃO 1: Tirei as chaves {} da importação!
import Inventario from './src/screens/Inventario';
import CadastroProduto from './src/screens/CadastroProduto';
import Produtos from './src/screens/Produtos';
import PrevisaoCompras from './src/screens/PrevisaoCompras';
import OrcamentoMobile from './src/screens/OrcamentoMobile';
import RecebimentoMercadoria from './src/screens/RecebimentoMercadoria';
import SeparacaoPedidos from './src/screens/SeparacaoPedidos';

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [telaAtual, setTelaAtual] = useState('login');

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const token = await AsyncStorage.getItem('grandport_token');
        if (token) setTelaAtual('dashboard');
      } catch (error) { console.error(error); }
      finally { setCarregando(false); }
    };
    verificarAcesso();
  }, []);

  if (carregando) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
      <View style={styles.container}>

        {telaAtual === 'login' && <Login onLoginSuccess={() => setTelaAtual('dashboard')} />}

        {telaAtual === 'dashboard' && (
            <Dashboard
                onNavigate={(tela) => setTelaAtual(tela)}
                onLogout={() => setTelaAtual('login')}
            />
        )}

        {/* 🚀 CORREÇÃO 2: Mudei o nome da propriedade para 'onVoltar' */}
        {telaAtual === 'inventario' && (
            <Inventario onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'cadastro' && (
            <CadastroProduto onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'produtos' && (
            <Produtos onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'previsao' && (
            <PrevisaoCompras onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'orcamento' && (
            <OrcamentoMobile onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'recebimento' && (
            <RecebimentoMercadoria onVoltar={() => setTelaAtual('dashboard')} />
        )}

        {telaAtual === 'picking' && (
            <SeparacaoPedidos onVoltar={() => setTelaAtual('dashboard')} />
        )}

        <StatusBar style="auto" />
        <Toast />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }
});