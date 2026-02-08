import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
    PanResponder,
} from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import theme from '../../styles/theme';

const { width } = Dimensions.get('window');
const DELETE_THRESHOLD = -80;

// Animated Cart Item with Swipe to Delete
const AnimatedCartItem = ({ item, index, formatPrice, updateQuantity, onRemove }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const quantityScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, []);

    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dx < 0) {
                translateX.setValue(gestureState.dx);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx < DELETE_THRESHOLD) {
                Animated.timing(translateX, {
                    toValue: -width,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => onRemove(item));
            } else {
                Animated.spring(translateX, {
                    toValue: 0,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: true,
                }).start();
            }
        },
    }), []);

    const animateQuantity = () => {
        Animated.sequence([
            Animated.timing(quantityScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.spring(quantityScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]).start();
    };

    const handleQuantityChange = (newQuantity) => {
        animateQuantity();
        updateQuantity(item._id, newQuantity);
    };

    const deleteOpacity = translateX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0],
    });

    return (
        <Animated.View style={[styles.cartItemWrapper, { transform: [{ scale: scaleAnim }] }]}>
            {/* Delete Background */}
            <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
                <LinearGradient
                    colors={['#EF4444', '#F97316']}
                    style={styles.deleteGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.deleteBackgroundText}>🗑️ Delete</Text>
                </LinearGradient>
            </Animated.View>

            {/* Cart Item */}
            <Animated.View
                style={[styles.cartItem, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                <View style={styles.itemImageContainer}>
                    <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                        style={styles.itemImage}
                    />
                    <View style={styles.imageBadge}>
                        <Text style={styles.imageBadgeText}>×{item.quantity}</Text>
                    </View>
                </View>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)} each</Text>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(item.quantity - 1)}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.quantityButtonGradient}
                            >
                                <Text style={styles.quantityButtonText}>−</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <Animated.View style={[styles.quantityDisplay, { transform: [{ scale: quantityScale }] }]}>
                            <Text style={styles.quantity}>{item.quantity}</Text>
                        </Animated.View>
                        <TouchableOpacity
                            style={[styles.quantityButton, item.quantity >= item.stock && styles.quantityButtonDisabled]}
                            onPress={() => handleQuantityChange(item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={item.quantity >= item.stock ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6']}
                                style={styles.quantityButtonGradient}
                            >
                                <Text style={styles.quantityButtonText}>+</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.itemRight}>
                    <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onRemove(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

// Animated Price Display
const AnimatedPrice = ({ value, formatPrice, style }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
            ]).start();
            prevValue.current = value;
        }
    }, [value]);

    return (
        <Animated.Text style={[style, { transform: [{ scale: scaleAnim }] }]}>
            {formatPrice(value)}
        </Animated.Text>
    );
};

const CartScreen = ({ navigation }) => {
    const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(headerAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleRemoveItem = (item) => {
        Alert.alert(
            'Remove Item',
            `Remove ${item.name} from cart?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', onPress: () => removeFromCart(item._id), style: 'destructive' },
            ]
        );
    };

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: clearCart, style: 'destructive' },
            ]
        );
    };

    const handleCheckout = () => {
        navigation.navigate('Checkout');
    };

    const subtotal = getTotal();
    const discount = couponApplied ? subtotal * 0.1 : 0; // 10% discount
    const tax = (subtotal - discount) * 0.18; // 18% GST
    const shipping = subtotal > 50000 ? 0 : 2000;
    const total = subtotal - discount + tax + shipping;

    const renderCartItem = ({ item, index }) => (
        <AnimatedCartItem
            item={item}
            index={index}
            formatPrice={formatPrice}
            updateQuantity={updateQuantity}
            onRemove={handleRemoveItem}
        />
    );

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Animated.View style={[styles.emptyContent, { transform: [{ scale: headerAnim }] }]}>
                    <View style={styles.emptyIconContainer}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.emptyIconGradient}
                        >
                            <Text style={styles.emptyIcon}>🛒</Text>
                        </LinearGradient>
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add some playground equipment to get started</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('HomeMain')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.shopButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.shopButtonText}>🛍️ Browse Equipment</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Animated Header */}
            <Animated.View style={[styles.header, { transform: [{ scale: headerAnim }] }]}>
                <View>
                    <Text style={styles.headerTitle}>🛒 Shopping Cart</Text>
                    <Text style={styles.headerSubtitle}>{items.length} items • Swipe left to delete</Text>
                </View>
                <TouchableOpacity onPress={handleClearCart} activeOpacity={0.7}>
                    <LinearGradient
                        colors={['#EF4444', '#F97316']}
                        style={styles.clearButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.clearButton}>Clear All</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            <FlatList
                data={items}
                renderItem={renderCartItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                showsVerticalScrollIndicator={false}
            />

            {/* Premium Summary Card */}
            <View style={styles.summaryCard}>
                {/* Savings Badge */}
                {(couponApplied || shipping === 0) && (
                    <View style={styles.savingsBadge}>
                        <LinearGradient
                            colors={['#10B981', '#34D399']}
                            style={styles.savingsBadgeGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.savingsBadgeText}>
                                💰 You're saving {formatPrice(discount + (subtotal > 50000 ? 2000 : 0))}!
                            </Text>
                        </LinearGradient>
                    </View>
                )}

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
                    <AnimatedPrice value={subtotal} formatPrice={formatPrice} style={styles.summaryValue} />
                </View>

                {couponApplied && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.discountLabel}>🎉 Coupon Discount</Text>
                        <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
                    </View>
                )}

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GST (18%)</Text>
                    <AnimatedPrice value={tax} formatPrice={formatPrice} style={styles.summaryValue} />
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={[styles.summaryValue, shipping === 0 && styles.freeShipping]}>
                        {shipping === 0 ? '✨ FREE' : formatPrice(shipping)}
                    </Text>
                </View>

                {shipping > 0 && (
                    <View style={styles.shippingNote}>
                        <Text style={styles.shippingNoteIcon}>💡</Text>
                        <Text style={styles.shippingNoteText}>
                            Add ₹{(50000 - subtotal).toLocaleString()} more for free shipping
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(100, (subtotal / 50000) * 100)}%` }]} />
                        </View>
                    </View>
                )}

                <Divider style={styles.totalDivider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <AnimatedPrice value={total} formatPrice={formatPrice} style={styles.totalValue} />
                </View>

                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6', '#A855F7']}
                        style={styles.checkoutButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                        <Text style={styles.checkoutArrow}>→</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Secure Checkout Badge */}
                <View style={styles.securityBadge}>
                    <Text style={styles.securityIcon}>🔒</Text>
                    <Text style={styles.securityText}>Secure Checkout • 256-bit SSL Encryption</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    headerTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    headerSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    clearButtonGradient: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    clearButton: {
        ...theme.typography.caption,
        color: '#fff',
        fontWeight: '700',
    },
    listContent: {
        padding: theme.spacing.md,
    },
    cartItemWrapper: {
        position: 'relative',
    },
    deleteBackground: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
    },
    deleteGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: theme.spacing.lg,
    },
    deleteBackgroundText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        ...theme.shadows.md,
    },
    itemImageContainer: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    itemImage: {
        width: 90,
        height: 90,
        backgroundColor: theme.colors.surfaceVariant,
    },
    imageBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    imageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    itemDetails: {
        flex: 1,
        marginLeft: theme.spacing.md,
        justifyContent: 'center',
    },
    itemName: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    itemPrice: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    quantityButtonGradient: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonDisabled: {
        opacity: 0.5,
    },
    quantityButtonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
    },
    quantityDisplay: {
        paddingHorizontal: theme.spacing.md,
    },
    quantity: {
        ...theme.typography.h4,
        color: theme.colors.text,
        fontWeight: '700',
    },
    itemRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    itemTotal: {
        ...theme.typography.h4,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    deleteButton: {
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.errorLight,
        borderRadius: theme.borderRadius.full,
    },
    deleteIcon: {
        fontSize: 16,
    },
    separator: {
        height: theme.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background,
    },
    emptyContent: {
        alignItems: 'center',
    },
    emptyIconContainer: {
        borderRadius: 60,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        ...theme.shadows.glow,
    },
    emptyIconGradient: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 50,
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
    summaryCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderTopLeftRadius: theme.borderRadius.xxl,
        borderTopRightRadius: theme.borderRadius.xxl,
        ...theme.shadows.xl,
    },
    savingsBadge: {
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    savingsBadgeGradient: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
    },
    savingsBadgeText: {
        color: '#fff',
        fontWeight: '700',
        ...theme.typography.bodySmall,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    summaryValue: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    discountLabel: {
        ...theme.typography.body,
        color: theme.colors.success,
    },
    discountValue: {
        ...theme.typography.bodyMedium,
        color: theme.colors.success,
        fontWeight: '700',
    },
    freeShipping: {
        color: theme.colors.success,
        fontWeight: '700',
    },
    shippingNote: {
        backgroundColor: theme.colors.infoLight,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
    },
    shippingNoteIcon: {
        fontSize: 14,
        marginBottom: 4,
    },
    shippingNoteText: {
        ...theme.typography.caption,
        color: theme.colors.info,
        marginBottom: theme.spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.info,
        borderRadius: 3,
    },
    totalDivider: {
        marginVertical: theme.spacing.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    totalLabel: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    totalValue: {
        ...theme.typography.h1,
        color: theme.colors.primary,
        fontWeight: '800',
    },
    checkoutButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.glow,
    },
    checkoutButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    checkoutButtonText: {
        ...theme.typography.button,
        color: '#fff',
        fontWeight: '700',
    },
    checkoutArrow: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '700',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    securityIcon: {
        fontSize: 14,
    },
    securityText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
});

export default CartScreen;
