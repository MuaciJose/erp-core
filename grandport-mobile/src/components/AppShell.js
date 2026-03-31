import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TAB_ROUTES } from '../navigation/routes';

export default function AppShell({ currentRouteKey, onNavigate, children }) {
    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <View style={styles.content}>{children}</View>
            <View style={styles.tabBar}>
                {TAB_ROUTES.map(route => {
                    const ativo = currentRouteKey === route.key;
                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={[styles.tabButton, ativo && styles.tabButtonActive]}
                            onPress={() => onNavigate(route.key, { replace: true })}
                        >
                            <Feather name={route.tabIcon} size={18} color={ativo ? '#2563eb' : '#64748b'} />
                            <Text style={[styles.tabLabel, ativo && styles.tabLabelActive]}>
                                {route.tabLabel}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#e2e8f0'
    },
    content: {
        flex: 1
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 10
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 16,
        gap: 4
    },
    tabButtonActive: {
        backgroundColor: '#eff6ff'
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748b'
    },
    tabLabelActive: {
        color: '#2563eb'
    }
});
