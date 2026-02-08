import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../styles/theme';

const OrderDetailScreen = ({ route }) => {
    const { order } = route.params;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Order Details</Text>
                    <Text style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items</Text>
                        {order.items.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.equipment?.name || 'Equipment'}</Text>
                                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                                </View>
                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <View style={styles.addressCard}>
                            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
                            <Text style={styles.addressText}>{order.shippingAddress.street}</Text>
                            <Text style={styles.addressText}>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                            </Text>
                            <Text style={styles.addressText}>{order.shippingAddress.country}</Text>
                            <Text style={styles.addressPhone}>Phone: {order.shippingAddress.phone}</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl + 20,
        borderBottomLeftRadius: theme.borderRadius.xl,
        borderBottomRightRadius: theme.borderRadius.xl,
    },
    headerTitle: {
        ...theme.typography.h2,
        color: '#fff',
        marginBottom: theme.spacing.xs,
    },
    orderId: {
        ...theme.typography.h3,
        color: '#fff',
        opacity: 0.9,
    },
    orderDate: {
        ...theme.typography.body,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: theme.spacing.xs,
    },
    content: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.h4,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        fontWeight: '700',
    },
    statusBadge: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
    },
    statusText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        fontWeight: '600',
    },
    itemPrice: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    itemQuantity: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        fontWeight: '700',
        marginLeft: theme.spacing.md,
    },
    addressCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.sm,
    },
    addressName: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    addressPhone: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        fontWeight: '500',
    },
    footer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    totalValue: {
        ...theme.typography.h2,
        color: theme.colors.primary,
        fontWeight: '700',
    },
});

export default OrderDetailScreen;
