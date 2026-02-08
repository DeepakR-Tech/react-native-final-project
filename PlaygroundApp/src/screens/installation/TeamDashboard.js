import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Chip, ActivityIndicator, Card } from 'react-native-paper';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import theme, { getStatusColor } from '../../styles/theme';

const TeamDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const [installations, setInstallations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInstallations = useCallback(async () => {
        try {
            const response = await api.get('/installations');
            if (response.data.success) {
                setInstallations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching installations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInstallations();
    }, [fetchInstallations]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInstallations();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const getStatusLabel = (status) => {
        const labels = {
            scheduled: 'Scheduled',
            in_progress: 'In Progress',
            on_hold: 'On Hold',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    const todayInstallations = installations.filter(inst => {
        const today = new Date().toDateString();
        const scheduled = new Date(inst.scheduledDate).toDateString();
        return today === scheduled && inst.status !== 'completed' && inst.status !== 'cancelled';
    });

    const upcomingInstallations = installations.filter(inst => {
        const today = new Date();
        const scheduled = new Date(inst.scheduledDate);
        return scheduled > today && inst.status !== 'completed' && inst.status !== 'cancelled';
    });

    const renderInstallationCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('InstallationDetail', { installation: item })}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderNumber}>#{item.order?.orderNumber}</Text>
                    <Text style={styles.customerName}>{item.customer?.name}</Text>
                </View>
                <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
                    textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                >
                    {getStatusLabel(item.status)}
                </Chip>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{formatDate(item.scheduledDate)}</Text>
                </View>
                {item.scheduledTime && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>⏰</Text>
                        <Text style={styles.detailText}>
                            {item.scheduledTime.start} - {item.scheduledTime.end}
                        </Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText} numberOfLines={1}>
                        {item.location?.address?.city}, {item.location?.address?.state}
                    </Text>
                </View>
            </View>

            <View style={styles.equipmentList}>
                <Text style={styles.equipmentTitle}>
                    {item.equipmentList?.length} equipment to install
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {user?.name}! 👷</Text>
                <Text style={styles.subtitle}>Your installation tasks</Text>
            </View>

            {todayInstallations.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔴 Today's Tasks</Text>
                    <FlatList
                        horizontal
                        data={todayInstallations}
                        renderItem={renderInstallationCard}
                        keyExtractor={(item) => item._id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 All Installations</Text>
                <Card style={styles.statsCard}>
                    <Card.Content style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {installations.filter(i => i.status === 'scheduled').length}
                            </Text>
                            <Text style={styles.statLabel}>Scheduled</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                                {installations.filter(i => i.status === 'in_progress').length}
                            </Text>
                            <Text style={styles.statLabel}>In Progress</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: theme.colors.success }]}>
                                {installations.filter(i => i.status === 'completed').length}
                            </Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                    </Card.Content>
                </Card>
            </View>

            <FlatList
                data={installations.filter(i => i.status !== 'completed' && i.status !== 'cancelled')}
                renderItem={renderInstallationCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>✅</Text>
                        <Text style={styles.emptyText}>No pending installations</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    greeting: {
        ...theme.typography.h2,
        color: '#fff',
    },
    subtitle: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing.xs,
    },
    section: {
        padding: theme.spacing.lg,
        paddingBottom: 0,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    horizontalList: {
        paddingRight: theme.spacing.lg,
    },
    statsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.h2,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    listContent: {
        padding: theme.spacing.lg,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginRight: theme.spacing.md,
        marginBottom: theme.spacing.md,
        minWidth: 280,
        ...theme.shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    orderNumber: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    customerName: {
        ...theme.typography.body,
        color: theme.colors.primary,
        marginTop: theme.spacing.xs,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardDetails: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        paddingTop: theme.spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    detailIcon: {
        marginRight: theme.spacing.sm,
        fontSize: 14,
    },
    detailText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    equipmentList: {
        marginTop: theme.spacing.sm,
    },
    equipmentTitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
});

export default TeamDashboard;
