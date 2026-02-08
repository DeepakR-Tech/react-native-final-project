import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Chip, ActivityIndicator, FAB, Menu, IconButton } from 'react-native-paper';
import api from '../../api/axios';
import theme, { getStatusColor, getStatusBackground, getStatusTextColor } from '../../styles/theme';

const ManageOrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await api.get('/orders');
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

    const updateOrderStatus = async (orderId, status) => {
        try {
            const response = await api.put(`/orders/${orderId}/status`, { status });
            if (response.data.success) {
                fetchOrders();
                Alert.alert('Success', 'Order status updated');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        }
        setMenuVisible(null);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            installation_scheduled: 'Installation Scheduled',
            installation_in_progress: 'Installing',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return labels[status] || status;
    };

    const statusOptions = [
        'pending', 'confirmed', 'processing', 'shipped',
        'delivered', 'installation_scheduled', 'completed', 'cancelled'
    ];

    const renderOrderCard = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    <Text style={styles.customerName}>{item.user?.name}</Text>
                    <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Menu
                    visible={menuVisible === item._id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={
                        <IconButton
                            icon="dots-vertical"
                            onPress={() => setMenuVisible(item._id)}
                        />
                    }
                >
                    {statusOptions.map((status) => (
                        <Menu.Item
                            key={status}
                            onPress={() => updateOrderStatus(item._id, status)}
                            title={getStatusLabel(status)}
                            disabled={item.status === status}
                        />
                    ))}
                </Menu>
            </View>

            <View style={styles.statusRow}>
                <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusBackground(item.status) }]}
                    textStyle={[styles.statusText, { color: getStatusTextColor(item.status) }]}
                >
                    {getStatusLabel(item.status)}
                </Chip>
                <Chip
                    style={[
                        styles.paymentChip,
                        { backgroundColor: item.paymentStatus === 'paid' ? theme.colors.successLight : theme.colors.warningLight }
                    ]}
                    textStyle={{
                        color: item.paymentStatus === 'paid' ? '#065F46' : '#92400E', // Dark Green : Dark Orange
                        fontSize: 12,
                        fontWeight: '700'
                    }}
                >
                    {item.paymentStatus.toUpperCase()}
                </Chip>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.itemsCount}>{item.items.length} items</Text>
                <Text style={styles.orderTotal}>{formatPrice(item.grandTotal)}</Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => navigation.navigate('OrderDetail', { order: item })}
                >
                    <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                {item.status === 'delivered' && (
                    <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={() => navigation.navigate('ScheduleInstallation', { order: item })}
                    >
                        <Text style={styles.scheduleButtonText}>Schedule Installation</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
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
            <FlatList
                data={orders}
                renderItem={renderOrderCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders found</Text>
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
    listContent: {
        padding: theme.spacing.md,
    },
    orderCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
    orderDate: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    statusChip: {
        // height: 28, // Removed to prevent clipping
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paymentChip: {
        // height: 28, // Removed to prevent clipping
        borderRadius: theme.borderRadius.full,
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    itemsCount: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    orderTotal: {
        ...theme.typography.h3,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    viewButton: {
        flex: 1,
        backgroundColor: theme.colors.primary + '15',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    viewButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    scheduleButton: {
        flex: 1,
        backgroundColor: theme.colors.success,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    scheduleButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
    },
});

export default ManageOrdersScreen;
