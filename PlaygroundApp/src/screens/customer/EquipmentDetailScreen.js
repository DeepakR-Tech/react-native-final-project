import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    Dimensions,
    Animated,
    Share,
} from 'react-native';
import { Chip, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import theme from '../../styles/theme';
import { getEquipmentImage } from '../../utils/equipmentImages';

const { width } = Dimensions.get('window');

const EquipmentDetailScreen = ({ route, navigation }) => {
    const { equipment } = route.params;
    const { addToCart, items } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    // Animations
    const buttonScale = useRef(new Animated.Value(1)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslate = useRef(new Animated.Value(50)).current;
    const imageScale = useRef(new Animated.Value(1.1)).current;
    const heartScale = useRef(new Animated.Value(1)).current;
    const specAnimations = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

    const isInCart = items.some((item) => item._id === equipment._id);
    const cartItem = items.find((item) => item._id === equipment._id);

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(contentTranslate, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(imageScale, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered spec animations
        specAnimations.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: 400 + index * 100,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToCart = () => {
        if (equipment.stock <= 0) {
            Alert.alert('Out of Stock', 'This item is currently unavailable');
            return;
        }

        // Animate button press
        Animated.sequence([
            Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.spring(buttonScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]).start();

        addToCart(equipment);
        Alert.alert(
            'Added to Cart! 🎉',
            `${equipment.name} has been added to your cart`,
            [
                { text: 'Continue Shopping', style: 'cancel' },
                { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
            ]
        );
    };

    const handleFavorite = () => {
        Animated.sequence([
            Animated.timing(heartScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
            Animated.spring(heartScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]).start();
        setIsFavorite(!isFavorite);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this amazing playground equipment: ${equipment.name} - ${formatPrice(equipment.price)} on Playground App!`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleQuantityChange = (delta) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= equipment.stock) {
            setQuantity(newQuantity);
        }
    };

    const SpecItem = ({ icon, label, value, index }) => (
        <Animated.View
            style={[
                styles.specItem,
                {
                    opacity: specAnimations[index] || 1,
                    transform: [{
                        translateX: specAnimations[index]?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-30, 0],
                        }) || 0
                    }]
                }
            ]}
        >
            <View style={styles.specIconContainer}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.specIconGradient}
                />
                <Text style={styles.specIcon}>{icon}</Text>
            </View>
            <View style={styles.specContent}>
                <Text style={styles.specLabel}>{label}</Text>
                <Text style={styles.specValue}>{value}</Text>
            </View>
        </Animated.View>
    );

    const imageSource = equipment.image && equipment.image.startsWith('http')
        ? { uri: equipment.image }
        : getEquipmentImage(equipment.name, equipment.category);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image with Animation */}
                <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }] }]}>
                    <Image
                        source={imageSource}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)']}
                        style={styles.imageGradient}
                    />

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                            style={styles.backButtonGradient}
                        >
                            <Text style={styles.backIcon}>←</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleFavorite}
                            >
                                <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleShare}
                        >
                            <Text style={styles.actionIcon}>📤</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stock Badge */}
                    <View style={styles.stockBadgeContainer}>
                        <LinearGradient
                            colors={equipment.stock > 5
                                ? ['#10B981', '#34D399']
                                : equipment.stock > 0
                                    ? ['#F59E0B', '#FBBF24']
                                    : ['#EF4444', '#F87171']}
                            style={styles.stockBadge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.stockText}>
                                {equipment.stock > 0 ? `${equipment.stock} in stock` : 'Out of stock'}
                            </Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: headerOpacity,
                            transform: [{ translateY: contentTranslate }]
                        }
                    ]}
                >
                    {/* Category Pill */}
                    <View style={styles.categoryRow}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryText}>{equipment.category}</Text>
                        </View>
                        {equipment.installationRequired && (
                            <View style={styles.installationPill}>
                                <Text style={styles.installationText}>🔧 Installation Included</Text>
                            </View>
                        )}
                    </View>

                    {/* Product Name */}
                    <Text style={styles.name}>{equipment.name}</Text>

                    {/* Price Card */}
                    <View style={styles.priceCard}>
                        <LinearGradient
                            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                            style={styles.priceCardGradient}
                        />
                        <View>
                            <Text style={styles.priceLabel}>Price</Text>
                            <Text style={styles.price}>{formatPrice(equipment.price)}</Text>
                        </View>
                        {equipment.rating?.average > 0 && (
                            <View style={styles.ratingCard}>
                                <View style={styles.ratingStars}>
                                    {[...Array(5)].map((_, i) => (
                                        <Text key={i} style={styles.star}>
                                            {i < Math.round(equipment.rating.average) ? '⭐' : '☆'}
                                        </Text>
                                    ))}
                                </View>
                                <Text style={styles.ratingText}>
                                    {equipment.rating.average.toFixed(1)} ({equipment.rating.count} reviews)
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Quantity Selector */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>📦 Quantity</Text>
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity
                                style={styles.qtyButton}
                                onPress={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                            >
                                <LinearGradient
                                    colors={quantity <= 1 ? ['#E2E8F0', '#E2E8F0'] : ['#6366F1', '#8B5CF6']}
                                    style={styles.qtyButtonGradient}
                                >
                                    <Text style={[styles.qtyButtonText, quantity <= 1 && styles.qtyButtonTextDisabled]}>−</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <View style={styles.qtyDisplay}>
                                <Text style={styles.qtyValue}>{quantity}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.qtyButton}
                                onPress={() => handleQuantityChange(1)}
                                disabled={quantity >= equipment.stock}
                            >
                                <LinearGradient
                                    colors={quantity >= equipment.stock ? ['#E2E8F0', '#E2E8F0'] : ['#6366F1', '#8B5CF6']}
                                    style={styles.qtyButtonGradient}
                                >
                                    <Text style={[styles.qtyButtonText, quantity >= equipment.stock && styles.qtyButtonTextDisabled]}>+</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.totalPrice}>= {formatPrice(equipment.price * quantity)}</Text>
                        </View>
                    </View>

                    {/* Colors (if available) */}
                    {equipment.specifications?.color?.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🎨 Available Colors</Text>
                            <View style={styles.colorContainer}>
                                {equipment.specifications.color.map((color, index) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            selectedColor === index && styles.colorOptionSelected
                                        ]}
                                        onPress={() => setSelectedColor(index)}
                                    >
                                        <Text style={styles.colorText}>{color}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Description</Text>
                        <Text style={styles.description}>{equipment.description}</Text>
                    </View>

                    {/* Specifications */}
                    {equipment.specifications && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📐 Specifications</Text>
                            <View style={styles.specsCard}>
                                {equipment.specifications.dimensions && (
                                    <SpecItem
                                        icon="📏"
                                        label="Dimensions"
                                        value={`${equipment.specifications.dimensions.length} × ${equipment.specifications.dimensions.width} × ${equipment.specifications.dimensions.height} ${equipment.specifications.dimensions.unit}`}
                                        index={0}
                                    />
                                )}
                                {equipment.specifications.material && (
                                    <SpecItem
                                        icon="🔧"
                                        label="Material"
                                        value={equipment.specifications.material}
                                        index={1}
                                    />
                                )}
                                {equipment.specifications.ageGroup && (
                                    <SpecItem
                                        icon="👶"
                                        label="Age Group"
                                        value={`${equipment.specifications.ageGroup.min} - ${equipment.specifications.ageGroup.max} years`}
                                        index={2}
                                    />
                                )}
                                {equipment.specifications.capacity && (
                                    <SpecItem
                                        icon="👥"
                                        label="Capacity"
                                        value={`${equipment.specifications.capacity} children`}
                                        index={3}
                                    />
                                )}
                            </View>

                            {/* Safety Features */}
                            {equipment.specifications.safetyFeatures?.length > 0 && (
                                <View style={styles.safetySection}>
                                    <Text style={styles.subSectionTitle}>🛡️ Safety Features</Text>
                                    <View style={styles.tagContainer}>
                                        {equipment.specifications.safetyFeatures.map((feature, index) => (
                                            <View key={index} style={styles.safetyTag}>
                                                <LinearGradient
                                                    colors={['rgba(16, 185, 129, 0.15)', 'rgba(52, 211, 153, 0.15)']}
                                                    style={styles.safetyTagGradient}
                                                />
                                                <Text style={styles.safetyTagText}>✓ {feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Info Cards */}
                    <View style={styles.infoCardsContainer}>
                        {equipment.installationRequired && (
                            <View style={styles.infoCard}>
                                <LinearGradient
                                    colors={['#3B82F6', '#60A5FA']}
                                    style={styles.infoCardGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.infoCardEmoji}>🔨</Text>
                                    <View style={styles.infoCardContent}>
                                        <Text style={styles.infoCardTitle}>Installation Included</Text>
                                        <Text style={styles.infoCardText}>
                                            Professional installation • {equipment.installationTime || 1} day(s)
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        )}

                        {equipment.warranty && (
                            <View style={styles.infoCard}>
                                <LinearGradient
                                    colors={['#10B981', '#34D399']}
                                    style={styles.infoCardGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.infoCardEmoji}>✅</Text>
                                    <View style={styles.infoCardContent}>
                                        <Text style={styles.infoCardTitle}>Warranty Covered</Text>
                                        <Text style={styles.infoCardText}>
                                            {equipment.warranty.duration} {equipment.warranty.unit} warranty
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        )}

                        <View style={styles.infoCard}>
                            <LinearGradient
                                colors={['#8B5CF6', '#A855F7']}
                                style={styles.infoCardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.infoCardEmoji}>🚚</Text>
                                <View style={styles.infoCardContent}>
                                    <Text style={styles.infoCardTitle}>Free Delivery</Text>
                                    <Text style={styles.infoCardText}>
                                        On orders above ₹50,000
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerPrice}>
                    <Text style={styles.footerLabel}>Total Price</Text>
                    <Text style={styles.footerAmount}>{formatPrice(equipment.price * quantity)}</Text>
                </View>
                <Animated.View style={{ transform: [{ scale: buttonScale }], flex: 1 }}>
                    <TouchableOpacity
                        style={[styles.addButton, equipment.stock <= 0 && styles.addButtonDisabled]}
                        onPress={handleAddToCart}
                        disabled={equipment.stock <= 0}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={equipment.stock <= 0 ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.addButtonIcon}>{isInCart ? '✓' : '🛒'}</Text>
                            <Text style={styles.addButtonText}>
                                {isInCart ? `In Cart (${cartItem?.quantity})` : 'Add to Cart'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 350,
        backgroundColor: theme.colors.surfaceVariant,
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 150,
    },
    backButton: {
        position: 'absolute',
        top: theme.spacing.xl,
        left: theme.spacing.md,
        borderRadius: 22,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    backButtonGradient: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: theme.colors.text,
        fontWeight: '600',
    },
    actionButtons: {
        position: 'absolute',
        top: theme.spacing.xl,
        right: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
        marginBottom: theme.spacing.sm,
    },
    actionIcon: {
        fontSize: 20,
    },
    stockBadgeContainer: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        left: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    stockBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    stockText: {
        color: '#fff',
        fontWeight: '700',
        ...theme.typography.caption,
    },
    content: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        marginTop: -theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius.xxl,
        borderTopRightRadius: theme.borderRadius.xxl,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    categoryPill: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    categoryText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    installationPill: {
        backgroundColor: theme.colors.info + '15',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    installationText: {
        ...theme.typography.caption,
        color: theme.colors.info,
        fontWeight: '600',
    },
    name: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    priceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.sm,
        overflow: 'hidden',
    },
    priceCardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    priceLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    price: {
        ...theme.typography.hero,
        color: theme.colors.primary,
        fontWeight: '800',
        fontSize: 28,
    },
    ratingCard: {
        alignItems: 'flex-end',
    },
    ratingStars: {
        flexDirection: 'row',
    },
    star: {
        fontSize: 14,
    },
    ratingText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    quantitySection: {
        marginBottom: theme.spacing.lg,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.sm,
    },
    qtyButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    qtyButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyButtonText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '700',
    },
    qtyButtonTextDisabled: {
        color: theme.colors.textSecondary,
    },
    qtyDisplay: {
        paddingHorizontal: theme.spacing.lg,
    },
    qtyValue: {
        ...theme.typography.h2,
        color: theme.colors.text,
        fontWeight: '800',
    },
    totalPrice: {
        ...theme.typography.h4,
        color: theme.colors.primary,
        fontWeight: '700',
        marginLeft: 'auto',
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    colorOption: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    colorOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    colorText: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        fontWeight: '600',
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        lineHeight: 26,
    },
    specsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    specIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        overflow: 'hidden',
    },
    specIconGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    specIcon: {
        fontSize: 20,
    },
    specContent: {
        flex: 1,
    },
    specLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    specValue: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginTop: 2,
    },
    safetySection: {
        marginTop: theme.spacing.lg,
    },
    subSectionTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    safetyTag: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    safetyTagGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    safetyTagText: {
        ...theme.typography.caption,
        color: theme.colors.success,
        fontWeight: '600',
    },
    infoCardsContainer: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    infoCard: {
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    infoCardGradient: {
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoCardEmoji: {
        fontSize: 32,
        marginRight: theme.spacing.md,
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardTitle: {
        ...theme.typography.bodyMedium,
        color: '#fff',
        fontWeight: '700',
    },
    infoCardText: {
        ...theme.typography.caption,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xxl,
        borderTopRightRadius: theme.borderRadius.xxl,
        ...theme.shadows.xl,
        gap: theme.spacing.md,
    },
    footerPrice: {
        flex: 0.5,
    },
    footerLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    footerAmount: {
        ...theme.typography.h2,
        color: theme.colors.primary,
        fontWeight: '800',
    },
    addButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.glow,
    },
    addButtonDisabled: {
        ...theme.shadows.none,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    addButtonIcon: {
        fontSize: 18,
    },
    addButtonText: {
        ...theme.typography.button,
        color: '#fff',
        fontWeight: '700',
    },
});

export default EquipmentDetailScreen;
