import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from './src/screens/Login';
import AppShell from './src/components/AppShell';
import { APP_ROUTES } from './src/navigation/routes';
import { clearSession, STORAGE_KEYS } from './src/api/session';

export default function App() {
    const [carregando, setCarregando] = useState(true);
    const [stack, setStack] = useState([{ key: 'login' }]);

    const rotaAtual = stack[stack.length - 1]?.key || 'login';
    const routeDefinition = APP_ROUTES[rotaAtual];
    const ScreenComponent = routeDefinition?.component;

    useEffect(() => {
        const verificarAcesso = async () => {
            try {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
                if (token) {
                    setStack([{ key: 'dashboard' }]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setCarregando(false);
            }
        };

        verificarAcesso();
    }, []);

    const navigate = (routeKey, options = {}) => {
        if (routeKey === 'login') {
            setStack([{ key: 'login' }]);
            return;
        }

        if (options.replace) {
            setStack(prev => {
                if (prev[0]?.key === 'login') {
                    return [{ key: routeKey }];
                }
                return [prev[0], { key: routeKey }];
            });
            return;
        }

        setStack(prev => [...prev, { key: routeKey }]);
    };

    const goBack = () => {
        setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };

    const resetToDashboard = () => {
        setStack([{ key: 'dashboard' }]);
    };

    const handleLogout = async () => {
        await clearSession();
        setStack([{ key: 'login' }]);
    };

    if (carregando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (rotaAtual === 'login') {
        return (
            <View style={styles.container}>
                <Login onLoginSuccess={() => setStack([{ key: 'dashboard' }])} />
                <StatusBar style="auto" />
                <Toast />
            </View>
        );
    }

    const screenProps = {
        onVoltar: routeDefinition?.showTabBar ? resetToDashboard : goBack,
        onNavigate: navigate,
        onLogout: handleLogout
    };

    return (
        <View style={styles.container}>
            <AppShell currentRouteKey={rotaAtual} onNavigate={navigate}>
                {ScreenComponent ? <ScreenComponent {...screenProps} /> : null}
            </AppShell>
            <StatusBar style="auto" />
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }
});
