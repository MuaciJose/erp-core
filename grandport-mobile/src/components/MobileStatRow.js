import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileStatRow({ items = [] }) {
    if (!items.length) return null;

    return (
        <View style={styles.row}>
            {items.map((item) => (
                <View key={item.label} style={styles.card}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.value} numberOfLines={1}>{item.value}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, paddingHorizontal: 15, marginTop: 12 },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14
    },
    label: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
    value: { fontSize: 13, fontWeight: '900', color: '#1e293b', marginTop: 8 }
});
