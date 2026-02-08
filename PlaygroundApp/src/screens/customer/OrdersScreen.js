import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import theme, { getStatusColor, getStatusBackground } from '../../styles/theme';

const { width } = Dimensions.get('window');

// Animated Order Card Component
const AnimatedOrderCard = ({ item, index, formatPrice, formatDate, getStatusEmoji, navigation }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    // Order status timeline
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statuses.indexOf(item.status);
    const isCancelled = item.status === 'cancelled';

    const getTimelineGradient = (status) => {
        const gradients = {
            pending: ['#F59E0B', '#FBBF24'],
            confirmed: ['#10B981', '#34D399'],
            processing: ['#3B82F6', '#60A5FA'],
            shipped: ['#8B5CF6', '#A855F7'],
            delivered: ['#10B981', '#34D399'],
            cancelled: ['#EF4444', '#F87171'],
        };
        return gradients[status] || ['#94A3B8', '#CBD5E1'];
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    opacity: opacityAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ],
                }
            ]}
        >
            <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdContainer}>
                        <Text style={styles.orderId}>Order #{item._id.slice(-8).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>📅 {formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
                        <LinearGradient
                            colors={getTimelineGradient(item.status)}
                            style={styles.statusGlow}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                        <Text style={styles.statusEmoji}>{getStatusEmoji(item.status)}</Text>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Status Timeline */}
                {!isCancelled && (
                    <View style={styles.timelineContainer}>
                        {statuses.map((status, idx) => {
                            const isCompleted = idx <= currentStatusIndex;
                            const isCurrent = idx === currentStatusIndex;
                            return (
                                <View key={status} style={styles.timelineStep}>
                                    <View style={styles.timelineDotContainer}>
                                        {isCompleted ? (
                                            <LinearGradient
                                                colors={getTimelineGradient(item.status)}
                                                style={[styles.timelineDot, isCurrent && styles.timelineDotCurrent]}
                                            >
                                                {isCurrent && <View style={styles.dotPulse} />}
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.timelineDot, styles.timelineDotIncomplete]} />
                                        )}
                                        {idx < statuses.length - 1 && (
                                            <View style={[
                                                styles.timelineLine,
                                                isCompleted && styles.timelineLineCompleted
                                            ]} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.timelineLabel,
                                        isCompleted ? styles.timelineLabelCompleted : styles.timelineLabelIncomplete
                                    ]}>
                                        {status.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {isCancelled && (
                    <View style={styles.cancelledBanner}>
                        <LinearGradient
                            colors={['rgba(239, 68, 68, 0.1)', 'rgba(248, 113, 113, 0.1)']}
                            style={styles.cancelledGradient}
                        />
                        <Text style={styles.cancelledText}>❌ This order has been cancelled</Text>
                    </View>
                )}

                <View style={styles.orderDivider} />

                {/* Order Items with enhanced styling */}
                <View style={styles.orderItems}>
                    {item.items.slice(0, 2).map((orderItem, idx) => (
                        <View key={idx} style={styles.orderItemRow}>
                            <View style={styles.itemIconContainer}>
                                <Text style={styles.itemIcon}>📦</Text>
                            </View>
                            <Text style={styles.orderItemName} numberOfLines={1}>
                                {orderItem.equipment?.name || 'Equipment'}
                            </Text>
                            <View style={styles.qtyBadge}>
                                <Text style={styles.orderItemQty}>×{orderItem.quantity}</Text>
                            </View>
                        </View>
                    ))}
                    {item.items.length > 2 && (
                        <TouchableOpacity style={styles.moreItemsButton}>
                            <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.orderFooter}>
                    <View>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewDetailsButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('OrderDetail', { order: item })}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.viewDetailsGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.viewDetailsText}>View Details</Text>
                            <Text style={styles.viewDetailsArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const OrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const statsAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(statsAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await api.get('/orders/my-orders');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusEmoji = (status) => {
        const emojis = {
            pending: '⏳',
            confirmed: '✅',
            processing: '🔄',
            shipped: '🚚',
            delivered: '📦',
            cancelled: '❌',
        };
        return emojis[status] || '📋';
    };

    // Calculate stats
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

    const renderHeader = () => (
        <>
            <Animated.View style={{ opacity: headerAnim }}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerDecor1} />
                    <View style={styles.headerDecor2} />
                    <Text style={styles.headerTitle}>📦 My Orders</Text>
                    <Text style={styles.headerSubtitle}>{orders.length} orders placed</Text>
                </LinearGradient>
            </Animated.View>

            {/* Stats Cards */}
            {orders.length > 0 && (
                <Animated.View
                    style={[
                        styles.statsContainer,
                        {
                            opacity: statsAnim,
                            transform: [{
                                translateY: statsAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0]
                                })
                            }]
                        }
                    ]}
                >
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                            style={styles.statGradient}
                        />
                        <Text style={styles.statIcon}>💳</Text>
                        <Text style={styles.statValue}>{formatPrice(totalSpent)}</Text>
                        <Text style={styles.statLabel}>Total Spent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.1)']}
                            style={styles.statGradient}
                        />
                        <Text style={styles.statIcon}>✅</Text>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedOrders}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['rgba(245, 158, 11, 0.1)', 'rgba(251, 191, 36, 0.1)']}
                            style={styles.statGradient}
                        />
                        <Text style={styles.statIcon}>🚀</Text>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{activeOrders}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                </Animated.View>
            )}
        </>
    );

    const renderOrderCard = ({ item, index }) => (
        <AnimatedOrderCard
            item={item}
            index={index}
            formatPrice={formatPrice}
            formatDate={formatDate}
            getStatusEmoji={getStatusEmoji}
            navigation={navigation}
        />
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIconContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
                <Text style={styles.loadingText}>Loading your orders...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrderCard}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Animated.View
                            style={[
                                styles.emptyContent,
                                { transform: [{ scale: statsAnim }] }
                            ]}
                        >
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.emptyIconGradient}
                                >
                                    <Text style={styles.emptyIcon}>📦</Text>
                                </LinearGradient>
                            </View>
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
                            <TouchableOpacity
                                style={styles.shopButton}
                                onPress={() => navigation.navigate('Home')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                                    style={styles.shopButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.shopButtonText}>🛍️ Start Shopping</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                }
                showsVerticalScrollIndicator={false}
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
        backgroundColor: theme.colors.background,
    },
    loadingIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textSecondary,
        ...theme.typography.body,
    },
    header: {
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl,
        overflow: 'hidden',
    },
    headerDecor1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -50,
    },
    headerDecor2: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -30,
        left: -30,
    },
    headerTitle: {
        ...theme.typography.h1,
        color: '#fff',
    },
    headerSubtitle: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
        ...theme.shadows.sm,
        overflow: 'hidden',
    },
    statGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    statValue: {
        ...theme.typography.h4,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    statLabel: {
        ...theme.typography.overline,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    cardWrapper: {
        marginTop: theme.spacing.md,
    },
    orderCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.md,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderIdContainer: {
        flex: 1,
    },
    orderId: {
        ...theme.typography.h4,
        color: theme.colors.text,
    },
    orderDate: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        gap: 6,
        overflow: 'hidden',
    },
    statusGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
    },
    statusEmoji: {
        fontSize: 14,
    },
    statusText: {
        ...theme.typography.caption,
        fontWeight: '700',
    },
    timelineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.sm,
    },
    timelineStep: {
        alignItems: 'center',
        flex: 1,
    },
    timelineDotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        position: 'relative',
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    timelineDotCurrent: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    dotPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    timelineDotIncomplete: {
        backgroundColor: theme.colors.border,
    },
    timelineLine: {
        position: 'absolute',
        left: '60%',
        right: '-40%',
        height: 3,
        backgroundColor: theme.colors.border,
        zIndex: 0,
    },
    timelineLineCompleted: {
        backgroundColor: theme.colors.primary,
    },
    timelineLabel: {
        ...theme.typography.overline,
        marginTop: 6,
    },
    timelineLabelCompleted: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    timelineLabelIncomplete: {
        color: theme.colors.textLight,
    },
    cancelledBanner: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    cancelledGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cancelledText: {
        ...theme.typography.bodySmall,
        color: '#EF4444',
        textAlign: 'center',
        fontWeight: '600',
    },
    orderDivider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: theme.spacing.sm,
    },
    orderItems: {
        gap: theme.spacing.sm,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    itemIcon: {
        fontSize: 14,
    },
    orderItemName: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    qtyBadge: {
        backgroundColor: theme.colors.surfaceVariant,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    orderItemQty: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    moreItemsButton: {
        paddingVertical: theme.spacing.xs,
    },
    moreItems: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    totalLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    totalAmount: {
        ...theme.typography.h3,
        color: theme.colors.primary,
        fontWeight: '800',
    },
    viewDetailsButton: {
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    viewDetailsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    viewDetailsText: {
        ...theme.typography.caption,
        color: '#fff',
        fontWeight: '700',
    },
    viewDetailsArrow: {
        color: '#fff',
        fontWeight: '700',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxl,
        marginTop: theme.spacing.xxl,
    },
    emptyContent: {
        alignItems: 'center',
    },
    emptyIconContainer: {
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        ...theme.shadows.glow,
    },
    emptyIconGradient: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 45,
    },
    emptyTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    shopButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.glow,
    },
    shopButtonGradient: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xxl,
    },
    shopButtonText: {
        ...theme.typography.button,
        color: '#fff',
    },
});

export default OrdersScreen;
