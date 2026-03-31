import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileHeroCard({
    kicker,
    title,
    subtitle,
    badgeLabel,
    badgeValue,
    accent = '#93c5fd',
    backgroundColor = '#0f172a'
}) {
    return (
        <View style={[styles.card, { backgroundColor }]}>
            <View style={{ flex: 1 }}>
                {kicker ? <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text> : null}
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {badgeValue !== undefined ? (
                <View style={styles.badge}>
                    {badgeLabel ? <Text style={[styles.badgeLabel, { color: accent }]}>{badgeLabel}</Text> : null}
                    <Text style={styles.badgeValue}>{badgeValue}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        gap: 12
    },
    kicker: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 20, fontWeight: '900', color: '#f8fafc', marginTop: 6 },
    subtitle: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginTop: 8, lineHeight: 18 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 80
    },
    badgeLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    badgeValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 6 }
});
