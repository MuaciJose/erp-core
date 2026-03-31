const TOKEN_KEY = 'grandport_token';
const USER_KEY = 'grandport_user';
const REMEMBER_KEY = 'grandport_remember';

const storages = () => [window.localStorage, window.sessionStorage];

const readFirst = (key) => {
    for (const storage of storages()) {
        const value = storage.getItem(key);
        if (value) {
            return value;
        }
    }
    return null;
};

export const getStoredToken = () => readFirst(TOKEN_KEY);

export const getStoredUser = () => {
    const value = readFirst(USER_KEY);
    return value ? JSON.parse(value) : null;
};

export const persistSession = ({ token, user, remember }) => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);

    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
};

export const clearSession = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
};

export const updateStoredUser = (user) => {
    const token = getStoredToken();
    if (!token) {
        return;
    }
    const remember = window.localStorage.getItem(REMEMBER_KEY) === '1';
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
};

export const syncAuthHeader = (api) => {
    const token = getStoredToken();
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
    return token;
};
