import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
    token: 'grandport_token',
    user: 'grandport_user',
    userName: 'grandport_user_nome',
    permissions: 'grandport_user_permissoes',
    agendaDraft: 'grandport_agenda_draft'
};

export const getApiBaseUrl = () =>
    process.env.EXPO_PUBLIC_API_URL?.trim() || (() => {
        throw new Error('EXPO_PUBLIC_API_URL não configurada para o app mobile.');
    })();

export const getCleanToken = async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    return token ? token.replace(/['"]+/g, '') : '';
};

export const getAuthHeaders = async (extraHeaders = {}) => {
    const token = await getCleanToken();
    return token
        ? { Authorization: `Bearer ${token}`, ...extraHeaders }
        : { ...extraHeaders };
};

export const saveSession = async (token, usuario = {}) => {
    await AsyncStorage.multiSet([
        [STORAGE_KEYS.token, token || ''],
        [STORAGE_KEYS.user, JSON.stringify(usuario || {})],
        [STORAGE_KEYS.userName, usuario?.nome || 'Usuário'],
        [STORAGE_KEYS.permissions, JSON.stringify(usuario?.permissoes || [])]
    ]);
};

export const updateStoredUser = async (usuario = {}) => {
    await AsyncStorage.multiSet([
        [STORAGE_KEYS.user, JSON.stringify(usuario || {})],
        [STORAGE_KEYS.userName, usuario?.nome || 'Usuário'],
        [STORAGE_KEYS.permissions, JSON.stringify(usuario?.permissoes || [])]
    ]);
};

export const clearSession = async () => {
    await AsyncStorage.multiRemove([
        STORAGE_KEYS.token,
        STORAGE_KEYS.user,
        STORAGE_KEYS.userName,
        STORAGE_KEYS.permissions
    ]);
};
