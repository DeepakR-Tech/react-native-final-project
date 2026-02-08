import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import theme from '../../styles/theme';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const [ordersRes, equipmentRes, usersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/equipment'),
                api.get('/auth/users'),
            ]);

            const orders = ordersRes.data.success ? ordersRes.data.data : [];
            const equipment = equipmentRes.data.success ? equipmentRes.data.data : [];
            const users = usersRes.data.success ? usersRes.data.data : [];

            const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const pendingOrders = orders.filter(o => o.status === 'pending').length;
            const processingOrders = orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length;

            setStats({
                totalOrders: orders.length,
                totalRevenue,
                pendingOrders,
                processingOrders,
                totalEquipment: equipment.length,
                totalUsers: users.length,
            });

            setRecentOrders(orders.slice(0, 5));
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatPrice = (price) => {
        if (price >= 100000) {
            return '₹' + (price / 100000).toFixed(1) + 'L';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const StatCard = ({ title, value, emoji, gradient, subtitle }) => (
        <TouchableOpacity style={styles.statCard} activeOpacity={0.9}>
            <LinearGradient
                colors={gradient}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.statCardContent}>
                    <View style={styles.statEmojiContainer}>
                        <Text style={styles.statEmoji}>{emoji}</Text>
                    </View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statTitle}>{title}</Text>
                    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const QuickAction = ({ title, emoji, onPress }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.quickActionTitle}>{title}</Text>
            <Text style={styles.quickActionArrow}>→</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary]}
                />
            }
        >
            {/* Header */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />
                <View style={styles.headerContent}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.adminName}>{user?.name?.split(' ')[0] || 'Admin'} 👑</Text>
                    <Text style={styles.headerSubtext}>Here's your dashboard overview</Text>
                </View>
            </LinearGradient>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Revenue"
                    value={formatPrice(stats?.totalRevenue || 0)}
                    emoji="💰"
                    gradient={['#10B981', '#34D399']}
                    subtitle="All time"
                />
                <StatCard
                    title="Total Orders"
                    value={stats?.totalOrders || 0}
                    emoji="📦"
                    gradient={['#6366F1', '#8B5CF6']}
                />
                <StatCard
                    title="Pending"
                    value={stats?.pendingOrders || 0}
                    emoji="⏳"
                    gradient={['#F59E0B', '#FBBF24']}
                    subtitle="Needs attention"
                />
                <StatCard
                    title="Processing"
                    value={stats?.processingOrders || 0}
                    emoji="🔄"
                    gradient={['#3B82F6', '#60A5FA']}
                />
            </View>

            {/* Quick Stats Bar */}
            <View style={styles.quickStatsBar}>
                <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{stats?.totalEquipment || 0}</Text>
                    <Text style={styles.quickStatLabel}>Products</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                    <Text style={styles.quickStatValue}>{stats?.totalUsers || 0}</Text>
                    <Text style={styles.quickStatLabel}>Users</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                    <Text style={[styles.quickStatValue, { color: theme.colors.success }]}>Active</Text>
                    <Text style={styles.quickStatLabel}>Status</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsCard}>
                    <QuickAction
                        title="Manage Orders"
                        emoji="📋"
                        onPress={() => navigation.navigate('ManageOrders')}
                    />
                    <View style={styles.actionDivider} />
                    <QuickAction
                        title="View All Equipment"
                        emoji="🎢"
                        onPress={() => navigation.navigate('ManageEquipment')}
                    />
                    <View style={styles.actionDivider} />
                    <QuickAction
                        title="User Management"
                        emoji="👥"
                        onPress={() => navigation.navigate('ManageUsers')}
                    />
                    <View style={styles.actionDivider} />
                    <QuickAction
                        title="Installation Teams"
                        emoji="🔧"
                        onPress={() => navigation.navigate('ManageUsers', {
                            roleFilter: 'installation_team',
                            title: 'Installation Team'
                        })}
                    />
                </View>
            </View>

            {/* Recent Orders */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ManageOrders')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.recentOrdersCard}>
                    {recentOrders.length === 0 ? (
                        <Text style={styles.noOrders}>No orders yet</Text>
                    ) : (
                        recentOrders.map((order, index) => (
                            <View key={order._id}>
                                <View style={styles.orderItem}>
                                    <View style={styles.orderInfo}>
                                        <Text style={styles.orderIdText}>
                                            #{order._id.slice(-6).toUpperCase()}
                                        </Text>
                                        <Text style={styles.orderCustomer}>
                                            {order.user?.name || 'Customer'}
                                        </Text>
                                    </View>
                                    <View style={styles.orderMeta}>
                                        <Text style={styles.orderAmount}>
                                            {formatPrice(order.totalAmount)}
                                        </Text>
                                        <View style={[
                                            styles.orderStatusBadge,
                                            { backgroundColor: theme.colors[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`] + '20' }
                                        ]}>
                                            <Text style={[
                                                styles.orderStatusText,
                                                { color: theme.colors[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`] }
                                            ]}>
                                                {order.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                {index < recentOrders.length - 1 && <View style={styles.orderDivider} />}
                            </View>
                        ))
                    )}
                </View>
            </View>

            <View style={styles.bottomPadding} />
        </ScrollView>
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
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textSecondary,
        ...theme.typography.body,
    },
    header: {
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xxxl,
        overflow: 'hidden',
    },
    headerDecor1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -60,
    },
    headerDecor2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -40,
        left: -40,
    },
    headerContent: {
        zIndex: 1,
    },
    welcomeText: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.8)',
    },
    adminName: {
        ...theme.typography.hero,
        color: '#fff',
        fontSize: 32,
    },
    headerSubtext: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing.xs,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.sm,
        marginTop: -theme.spacing.xl,
    },
    statCard: {
        width: (width - 48) / 2,
        margin: theme.spacing.xs,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    statCardGradient: {
        padding: theme.spacing.lg,
    },
    statCardContent: {
        alignItems: 'flex-start',
    },
    statEmojiContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    statEmoji: {
        fontSize: 22,
    },
    statValue: {
        ...theme.typography.h2,
        color: '#fff',
        fontWeight: '800',
    },
    statTitle: {
        ...theme.typography.bodySmall,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    statSubtitle: {
        ...theme.typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    quickStatsBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.sm,
    },
    quickStat: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatValue: {
        ...theme.typography.h3,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    quickStatLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: theme.spacing.xs,
    },
    section: {
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    seeAll: {
        ...theme.typography.bodySmall,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    quickActionsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.sm,
        overflow: 'hidden',
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    quickActionEmoji: {
        fontSize: 20,
    },
    quickActionTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        flex: 1,
    },
    quickActionArrow: {
        ...theme.typography.body,
        color: theme.colors.textLight,
    },
    actionDivider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginLeft: 68,
    },
    recentOrdersCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
    },
    noOrders: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        padding: theme.spacing.lg,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    orderInfo: {
        flex: 1,
    },
    orderIdText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    orderCustomer: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    orderMeta: {
        alignItems: 'flex-end',
    },
    orderAmount: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    orderStatusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
        marginTop: 4,
    },
    orderStatusText: {
        ...theme.typography.overline,
        fontWeight: '600',
    },
    orderDivider: {
        height: 1,
        backgroundColor: theme.colors.divider,
    },
    bottomPadding: {
        height: theme.spacing.xxl,
    },
});

export default AdminDashboard;
