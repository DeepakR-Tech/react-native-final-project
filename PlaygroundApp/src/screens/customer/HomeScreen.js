import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    Pressable,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Searchbar, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import theme from '../../styles/theme';
import { getEquipmentImage } from '../../utils/equipmentImages';

// Animated Card Component with scale and shadow effects
const AnimatedCard = ({ item, index, navigation, formatPrice, numColumns }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(50)).current;
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        // Staggered entrance animation
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 50, // Reduced delay for faster perception
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.spring(scaleAnim, {
            toValue: 1.05,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
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

    const imageSource = item.image && item.image.startsWith('http')
        ? { uri: item.image }
        : getEquipmentImage(item.name, item.category);

    const isNew = Math.random() > 0.7; // Randomly mark some as "New"
    const isHot = item.stock <= 5 && item.stock > 0;

    const cardWidth = Platform.OS === 'web' ? '100%' : undefined; // Let flex handle width on web grid

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    opacity: opacityAnim,
                    transform: [
                        { translateY: translateYAnim },
                        { scale: scaleAnim }
                    ],
                    width: cardWidth,
                    flex: 1,
                }
            ]}
        >
            <Pressable
                style={[
                    styles.card,
                    isHovered && styles.cardHovered
                ]}
                onPress={() => navigation.navigate('EquipmentDetail', { equipment: item })}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={imageSource}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.05)']}
                        style={styles.imageOverlay}
                    />

                    {/* Badges */}
                    {isNew && (
                        <View style={styles.newBadge}>
                            <LinearGradient
                                colors={['#10B981', '#34D399']}
                                style={styles.badgeGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.badgeText}>✨ NEW</Text>
                            </LinearGradient>
                        </View>
                    )}

                    {isHot && !isNew && (
                        <View style={styles.hotBadge}>
                            <LinearGradient
                                colors={['#EF4444', '#F97316']}
                                style={styles.badgeGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.badgeText}>🔥 HOT</Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Wishlist Heart */}
                    <TouchableOpacity style={styles.heartButton} activeOpacity={0.8}>
                        <Text style={styles.heartIcon}>🤍</Text>
                    </TouchableOpacity>

                    {item.installationRequired && (
                        <View style={styles.installBadge}>
                            <Text style={styles.installText}>🔧</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{item.category}</Text>
                    </View>
                    <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatPrice(item.price)}</Text>
                        {item.rating?.average > 0 && (
                            <View style={styles.ratingContainer}>
                                <Text style={styles.ratingStar}>⭐</Text>
                                <Text style={styles.rating}>{item.rating.average.toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                    {/* Stock indicator */}
                    <View style={styles.stockIndicator}>
                        <View style={[
                            styles.stockDot,
                            { backgroundColor: item.stock > 10 ? '#10B981' : item.stock > 5 ? '#F59E0B' : '#EF4444' }
                        ]} />
                        <Text style={styles.stockLabel}>
                            {item.stock > 10 ? 'In Stock' : item.stock > 0 ? `Only ${item.stock} left` : 'Out of Stock'}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const getCategoryEmoji = (category) => {
    const emojis = {
        'Swings': '🎠',
        'Slides': '🛝',
        'Climbing Equipment': '🧗',
        'Spring Riders': '🐴',
        'Seesaws': '⚖️',
        'Merry-Go-Rounds': '🎡',
        'Sand Play': '🏖️',
        'Fitness Equipment': '💪',
        'Playhouses': '🏠',
    };
    return emojis[category] || '🎢';
};

const CategoryCard = ({ item, selectedCategory, setSelectedCategory }) => {
    const isSelected = selectedCategory === item.name;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        setSelectedCategory(isSelected ? null : item.name);
    };

    const handleHoverIn = () => setIsHovered(true);
    const handleHoverOut = () => setIsHovered(false);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    isHovered && styles.categoryCardHovered
                ]}
                onPress={handlePress}
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
            >
                {isSelected && (
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.categoryGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}
                <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.name)}</Text>
                <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.categoryCount, isSelected && styles.categoryCountSelected]}>
                    {item.count} items
                </Text>
            </Pressable>
        </Animated.View>
    );
};

const HomeScreen = ({ navigation }) => {
    const [equipment, setEquipment] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { getTotalItems } = useCart();
    const { user } = useAuth();
    const { width: windowWidth } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    // Responsive calculations
    const isDesktop = windowWidth >= 1024;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
    const contentMaxWidth = 1200;

    // Animations
    const scrollY = useRef(new Animated.Value(0)).current;
    const fabScale = useRef(new Animated.Value(1)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const bannerScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(bannerScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for FAB
        const pulseAnimation = () => {
            Animated.sequence([
                Animated.timing(fabScale, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(fabScale, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start(() => pulseAnimation());
        };
        if (getTotalItems() > 0) {
            pulseAnimation();
        }
    }, [getTotalItems()]);

    const fetchEquipment = useCallback(async () => {
        try {
            const params = {};
            if (selectedCategory) params.category = selectedCategory;
            if (searchQuery) params.search = searchQuery;
            params.isAvailable = true;

            const response = await api.get('/equipment', { params });
            if (response.data.success) {
                setEquipment(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching equipment:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/equipment/categories');
            if (response.data.success) {
                setCategories(response.data.data.filter(cat => cat.count > 0));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchEquipment();
        fetchCategories();
    }, [fetchEquipment]);

    useEffect(() => {
        if (refreshing) {
            fetchEquipment();
        }
    }, [refreshing, fetchEquipment]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const renderWelcomeBanner = () => (
        <Animated.View style={{ transform: [{ scale: bannerScale }] }}>
            <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.welcomeBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.bannerDecor1, isWeb && styles.bannerDecorWeb]} />
                <View style={[styles.bannerDecor2, isWeb && styles.bannerDecorWeb]} />
                <View style={[styles.bannerDecor3, isWeb && styles.bannerDecorWeb]} />
                <View style={styles.bannerContent}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Guest'} 👋</Text>
                    <Text style={styles.bannerSubtext}>Build the perfect playground for your space!</Text>
                </View>
                <View style={styles.bannerEmojiContainer}>
                    <Text style={styles.bannerEmoji}>🎢</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderQuickStats = () => (
        <View style={styles.statsContainer}>
            {[
                { value: equipment.length, label: 'Products', color: '#6366F1', icon: '📦' },
                { value: categories.length, label: 'Categories', color: '#8B5CF6', icon: '📂' },
                { value: '24/7', label: 'Support', color: '#EC4899', icon: '💬' },
                { value: 'Free', label: 'Install', color: '#10B981', icon: '🔧' },
            ].map((stat, index) => (
                <Pressable
                    key={index}
                    style={({ hovered }) => [
                        styles.statCard,
                        hovered && styles.statCardHovered
                    ]}
                >
                    <Text style={styles.statIcon}>{stat.icon}</Text>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
            ))}
        </View>
    );

    const renderPromoCard = () => (
        <Pressable
            style={({ hovered }) => [
                styles.promoCardContainer,
                hovered && styles.promoCardHovered
            ]}
        >
            <LinearGradient
                colors={['#F59E0B', '#F97316']}
                style={styles.promoCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.promoDecor} />
                <View style={styles.promoContent}>
                    <View style={styles.promoLabelContainer}>
                        <Text style={styles.promoLabel}>🔥 SPECIAL OFFER</Text>
                    </View>
                    <Text style={styles.promoTitle}>Free Installation</Text>
                    <Text style={styles.promoSubtitle}>On orders above ₹50,000</Text>
                </View>
                <View style={styles.promoEmojiContainer}>
                    <Text style={styles.promoEmoji}>🎁</Text>
                </View>
            </LinearGradient>
        </Pressable>
    );

    const renderEquipmentCard = ({ item, index }) => (
        <AnimatedCard
            item={item}
            index={index}
            navigation={navigation}
            formatPrice={formatPrice}
            numColumns={numColumns}
        />
    );

    const renderHeader = () => (
        <Animated.View style={{ opacity: headerOpacity }}>
            {renderWelcomeBanner()}

            <View style={[
                styles.searchContainer,
                isWeb && { maxWidth: 600, alignSelf: 'center', width: '100%' }
            ]}>
                <Searchbar
                    placeholder="Search playground equipment..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor={theme.colors.primary}
                    onSubmitEditing={fetchEquipment}
                    elevation={0}
                />
            </View>

            {renderQuickStats()}
            {renderPromoCard()}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📂 Browse by Category</Text>
            </View>

            {isWeb ? (
                <View style={styles.categoryGrid}>
                    {categories.map((item) => (
                        <CategoryCard
                            key={item.name}
                            item={item}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    ))}
                </View>
            ) : (
                <FlatList
                    horizontal
                    data={categories}
                    renderItem={({ item }) => (
                        <CategoryCard
                            item={item}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    )}
                    keyExtractor={(item) => item.name}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                />
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🛒 Popular Equipment</Text>
                <TouchableOpacity onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setRefreshing(true);
                }}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIconContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
                <Text style={styles.loadingText}>Loading amazing equipment...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.contentContainer, isWeb && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                <Animated.FlatList
                    data={equipment}
                    renderItem={renderEquipmentCard}
                    keyExtractor={(item) => item._id}
                    numColumns={numColumns}
                    key={numColumns} // Force re-render when columns change
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
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
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>No equipment found</Text>
                            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
                        </View>
                    }
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                />
            </View>

            {/* Floating Cart Button */}
            <Animated.View style={[styles.fab, { transform: [{ scale: getTotalItems() > 0 ? fabScale : 1 }] }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Cart')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.fabIcon}>🛒</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
            {getTotalItems() > 0 && (
                <Animated.View style={[styles.cartBadge, { transform: [{ scale: fabScale }] }]}>
                    <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        // Shadow for desktop centering effect
        ...Platform.select({
            web: {
                boxShadow: '0 0 40px rgba(0,0,0,0.05)',
                minHeight: '100vh',
            }
        })
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
        marginBottom: theme.spacing.md,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.textSecondary,
        ...theme.typography.body,
    },
    welcomeBanner: {
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        borderBottomLeftRadius: Platform.OS === 'web' ? 30 : 0,
        borderBottomRightRadius: Platform.OS === 'web' ? 30 : 0,
    },
    bannerDecor1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -50,
    },
    bannerDecor2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -50,
        left: -30,
    },
    bannerDecor3: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: 20,
        left: '50%',
    },
    bannerDecorWeb: {
        opacity: 0.2, // Subtle on larger screens
    },
    bannerContent: {
        flex: 1,
        zIndex: 1,
    },
    welcomeText: {
        ...theme.typography.bodySmall,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        ...theme.typography.hero,
        color: '#fff',
        fontSize: 28,
        letterSpacing: 0.5,
    },
    bannerSubtext: {
        ...theme.typography.bodySmall,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing.xs,
    },
    bannerEmojiContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    bannerEmoji: {
        fontSize: 45,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.md,
        marginTop: -20,
    },
    searchBar: {
        borderRadius: theme.borderRadius.xl,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.md,
    },
    searchInput: {
        ...theme.typography.body,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.sm,
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    statCardHovered: {
        transform: [{ translateY: -2 }],
        ...theme.shadows.md,
    },
    statIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    statValue: {
        ...theme.typography.h4,
        fontWeight: '700',
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    promoCardContainer: {
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    promoCardHovered: {
        transform: [{ scale: 1.02 }],
    },
    promoCard: {
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...theme.shadows.lg,
        overflow: 'hidden',
    },
    promoDecor: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
        right: -30,
        top: -30,
    },
    promoContent: {
        flex: 1,
    },
    promoLabelContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.xs,
    },
    promoLabel: {
        ...theme.typography.caption,
        color: '#fff',
        fontWeight: '700',
    },
    promoTitle: {
        ...theme.typography.h2,
        color: '#fff',
        fontWeight: '800',
    },
    promoSubtitle: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    promoEmojiContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoEmoji: {
        fontSize: 35,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    seeAll: {
        ...theme.typography.bodySmall,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    categoryList: {
        paddingHorizontal: theme.spacing.md,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.sm,
        justifyContent: 'center',
    },
    categoryCard: {
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        margin: theme.spacing.xs,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
        minWidth: 100,
        ...theme.shadows.sm,
        overflow: 'hidden',
        position: 'relative',
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    categoryCardHovered: {
        transform: [{ translateY: -2 }],
        borderColor: theme.colors.primary,
        borderWidth: 1,
    },
    categoryCardSelected: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    categoryGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    categoryEmoji: {
        fontSize: 28,
        marginBottom: theme.spacing.xs,
    },
    categoryName: {
        ...theme.typography.caption,
        color: theme.colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    categoryNameSelected: {
        color: theme.colors.primary,
    },
    categoryCount: {
        ...theme.typography.overline,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    categoryCountSelected: {
        color: theme.colors.primary,
    },
    listContent: {
        paddingHorizontal: theme.spacing.sm,
        paddingBottom: 100,
    },
    cardWrapper: {
        margin: theme.spacing.sm,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
        cursor: Platform.OS === 'web' ? 'pointer' : 'auto',
    },
    cardHovered: {
        ...theme.shadows.lg,
        transform: [{ scale: 1.02 }],
    },
    imageContainer: {
        position: 'relative',
        aspectRatio: 1.2,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    newBadge: {
        position: 'absolute',
        top: 10,
        left: 0,
        overflow: 'hidden',
        borderTopRightRadius: theme.borderRadius.sm,
        borderBottomRightRadius: theme.borderRadius.sm,
        elevation: 3,
    },
    hotBadge: {
        position: 'absolute',
        top: 10,
        left: 0,
        overflow: 'hidden',
        borderTopRightRadius: theme.borderRadius.sm,
        borderBottomRightRadius: theme.borderRadius.sm,
        elevation: 3,
    },
    badgeGradient: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    heartIcon: {
        fontSize: 16,
    },
    installBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    installText: {
        fontSize: 12,
        color: '#fff',
    },
    cardContent: {
        padding: theme.spacing.md,
    },
    categoryPill: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
        marginBottom: 4,
    },
    categoryPillText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    name: {
        ...theme.typography.body,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
        height: 40,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    price: {
        ...theme.typography.h4,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingStar: {
        fontSize: 10,
        marginRight: 2,
    },
    rating: {
        fontSize: 10,
        fontWeight: '700',
        color: '#F57F17',
    },
    stockIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stockDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    stockLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        ...theme.shadows.lg,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabIcon: {
        fontSize: 24,
    },
    cartBadge: {
        position: 'absolute',
        bottom: 75,
        right: 30,
        backgroundColor: '#EF4444',
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#fff',
        ...theme.shadows.sm,
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: theme.spacing.xxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    emptyTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    emptySubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
});

export default HomeScreen;
