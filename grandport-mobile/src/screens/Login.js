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
    Platform,
    ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../api/axios';
import { saveSession, updateStoredUser } from '../api/session';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mfaState, setMfaState] = useState(null);
    const [codigoMfa, setCodigoMfa] = useState('');
    const [sessaoPendente, setSessaoPendente] = useState(null);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

    const finalizarLogin = async (data) => {
        const { token, usuario } = data;
        await saveSession(token, usuario || {});
        if (usuario?.forcePasswordChange) {
            setSessaoPendente({ token, usuario });
            return;
        }
        onLoginSuccess();
    };

    const fazerLogin = async () => {
        if (!username || !senha) {
            return Alert.alert('Atenção', 'Preencha o usuário e a senha!');
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { username, senha });
            const data = response.data;

            if (data?.mfaRequired || data?.mfaSetupRequired) {
                setMfaState(data);
                return;
            }

            await finalizarLogin(data);
        } catch (error) {
            console.log('Erro Login:', error);
            Alert.alert('Acesso Negado', error?.response?.data?.error || 'Usuário ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    const validarMfa = async () => {
        if (!codigoMfa) {
            return Alert.alert('MFA', 'Informe o código do autenticador.');
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/mfa/verify', {
                challengeToken: mfaState.challengeToken,
                code: codigoMfa
            });
            setMfaState(null);
            setCodigoMfa('');
            await finalizarLogin(response.data);
        } catch (error) {
            Alert.alert('MFA', error?.response?.data?.error || 'Não foi possível validar o código.');
        } finally {
            setLoading(false);
        }
    };

    const trocarSenhaObrigatoria = async () => {
        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            return Alert.alert('Senha', 'Preencha a senha atual e a nova senha.');
        }
        if (novaSenha !== confirmarNovaSenha) {
            return Alert.alert('Senha', 'A confirmação da nova senha não confere.');
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/trocar-senha', {
                senhaAtual,
                novaSenha
            });
            await updateStoredUser(response.data || {});
            setSessaoPendente(null);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarNovaSenha('');
            onLoginSuccess();
        } catch (error) {
            Alert.alert('Senha', error?.response?.data?.error || 'Não foi possível trocar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Feather name="shield" size={32} color="#ffffff" />
                        </View>
                        <Text style={styles.titulo}>STM Sistemas</Text>
                        <Text style={styles.subtitulo}>Acesso Restrito ao Sistema</Text>
                    </View>

                    <View style={styles.form}>
                        {!mfaState && !sessaoPendente && (
                            <>
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
                                    <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.eyeIcon}>
                                        <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {mfaState && !sessaoPendente && (
                            <>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoTitle}>{mfaState.mfaSetupRequired ? 'Configuração MFA' : 'Verificação MFA'}</Text>
                                    <Text style={styles.infoText}>{mfaState.message}</Text>
                                    {mfaState.setupSecret ? (
                                        <View style={styles.secretBox}>
                                            <Text style={styles.secretLabel}>Chave manual</Text>
                                            <Text style={styles.secretValue}>{mfaState.setupSecret}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={styles.label}>Código do autenticador</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="shield" size={20} color="#94a3b8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="123456"
                                        placeholderTextColor="#94a3b8"
                                        value={codigoMfa}
                                        onChangeText={(value) => setCodigoMfa(value.replace(/\D/g, '').slice(0, 6))}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </>
                        )}

                        {sessaoPendente && (
                            <>
                                <View style={styles.infoBoxWarning}>
                                    <Text style={styles.infoTitleWarning}>Troca obrigatória de senha</Text>
                                    <Text style={styles.infoText}>Sua senha atual precisa ser substituída antes de continuar.</Text>
                                </View>
                                <Text style={styles.label}>Senha atual</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="lock" size={20} color="#94a3b8" />
                                    <TextInput style={styles.input} value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry placeholder="••••••••" placeholderTextColor="#94a3b8" />
                                </View>
                                <Text style={styles.label}>Nova senha</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="key" size={20} color="#94a3b8" />
                                    <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="Nova senha forte" placeholderTextColor="#94a3b8" />
                                </View>
                                <Text style={styles.label}>Confirmar nova senha</Text>
                                <View style={styles.inputContainer}>
                                    <Feather name="key" size={20} color="#94a3b8" />
                                    <TextInput style={styles.input} value={confirmarNovaSenha} onChangeText={setConfirmarNovaSenha} secureTextEntry placeholder="Repita a nova senha" placeholderTextColor="#94a3b8" />
                                </View>
                                <Text style={styles.hint}>Use no mínimo 10 caracteres com maiúscula, minúscula, número e símbolo.</Text>
                            </>
                        )}

                        {!mfaState && !sessaoPendente && (
                            <TouchableOpacity style={styles.botao} onPress={fazerLogin} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.botaoTexto}>ENTRAR NO ERP</Text>
                                        <Feather name="arrow-right" size={20} color="#ffffff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {mfaState && !sessaoPendente && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.botaoSecundario} onPress={() => { setMfaState(null); setCodigoMfa(''); }}>
                                    <Text style={styles.botaoSecundarioTexto}>VOLTAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.botao, styles.botaoCompacto]} onPress={validarMfa} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>VALIDAR</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        {sessaoPendente && (
                            <TouchableOpacity style={styles.botao} onPress={trocarSenhaObrigatoria} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>ATUALIZAR SENHA</Text>}
                            </TouchableOpacity>
                        )}

                        <Text style={styles.footerText}>Esqueceu a senha? Contate o administrador.</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
    infoBox: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    infoBoxWarning: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fdba74',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        color: '#1d4ed8',
        letterSpacing: 1,
    },
    infoTitleWarning: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        color: '#c2410c',
        letterSpacing: 1,
    },
    infoText: {
        marginTop: 8,
        color: '#334155',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },
    secretBox: {
        marginTop: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbeafe',
        padding: 12,
    },
    secretLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: '900',
        color: '#64748b',
    },
    secretValue: {
        marginTop: 4,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        color: '#0f172a',
        fontWeight: '700',
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
    botaoCompacto: {
        flex: 1,
        marginTop: 0,
    },
    botaoTexto: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 16,
        marginRight: 8,
    },
    botaoSecundario: {
        flex: 1,
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoSecundarioTexto: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '900',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    hint: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 10,
    },
    footerText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 24,
    }
});
