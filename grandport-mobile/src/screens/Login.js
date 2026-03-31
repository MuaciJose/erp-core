import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';
import { saveSession } from '../api/session';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);

    const fazerLogin = async () => {
        if (!username || !senha) {
            return Alert.alert("Atenção", "Preencha o usuário e a senha!");
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                username: username,
                senha: senha
            });

            const { token, usuario } = response.data;

            await saveSession(token, usuario || {});

            // Libera a passagem no App.js
            onLoginSuccess();

        } catch (error) {
            console.log("Erro Login:", error);
            Alert.alert("Acesso Negado", "Usuário ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.card}>

                {/* Cabeçalho */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Feather name="shield" size={32} color="#ffffff" />
                    </View>
                    <Text style={styles.titulo}>STM Sistemas</Text>
                    <Text style={styles.subtitulo}>Acesso Restrito ao Sistema</Text>
                </View>

                {/* Formulário */}
                <View style={styles.form}>

                    {/* Input Usuário */}
                    <Text style={styles.label}>Usuário de Acesso</Text>
                    <View style={styles.inputContainer}>
                        <Feather name="user" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: joao.silva"
                            placeholderTextColor="#94a3b8"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Input Senha */}
                    <Text style={styles.label}>Senha</Text>
                    <View style={styles.inputContainer}>
                        <Feather name="lock" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                            value={senha}
                            onChangeText={setSenha}
                            secureTextEntry={!mostrarSenha}
                        />
                        <TouchableOpacity
                            onPress={() => setMostrarSenha(!mostrarSenha)}
                            style={styles.eyeIcon}
                        >
                            <Feather
                                name={mostrarSenha ? "eye-off" : "eye"}
                                size={20}
                                color="#94a3b8"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Botão de Entrar */}
                    <TouchableOpacity
                        style={styles.botao}
                        onPress={fazerLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.botaoTexto}>ENTRAR NO ERP</Text>
                                <Feather name="arrow-right" size={20} color="#ffffff" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Rodapé */}
                    <Text style={styles.footerText}>
                        Esqueceu a senha? Contate o administrador.
                    </Text>

                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#f8fafc',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconContainer: {
        backgroundColor: '#2563eb',
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    titulo: {
        fontSize: 28,
        fontWeight: '900',
        color: '#2563eb',
        letterSpacing: -1,
    },
    subtitulo: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
    },
    form: {
        padding: 30,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        height: 56,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    eyeIcon: {
        padding: 4,
    },
    botao: {
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 12,
        marginTop: 10,
    },
    botaoTexto: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
        marginRight: 8,
    },
    footerText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 24,
    }
});
