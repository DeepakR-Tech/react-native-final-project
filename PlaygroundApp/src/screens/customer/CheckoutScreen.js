import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
} from 'react-native';
import { TextInput, Button, RadioButton, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import theme from '../../styles/theme';

const { width } = Dimensions.get('window');

// Step Indicator Component
const StepIndicator = ({ currentStep, steps }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: currentStep,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
        }).start();
    }, [currentStep]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, steps.length - 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepsRow}>
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <View key={step.label} style={styles.stepItem}>
                            <View style={[
                                styles.stepCircle,
                                isCompleted && styles.stepCircleCompleted,
                                isCurrent && styles.stepCircleCurrent,
                            ]}>
                                {isCompleted ? (
                                    <Text style={styles.stepCheckmark}>✓</Text>
                                ) : (
                                    <Text style={[
                                        styles.stepNumber,
                                        isCurrent && styles.stepNumberCurrent
                                    ]}>{index + 1}</Text>
                                )}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                (isCompleted || isCurrent) && styles.stepLabelActive
                            ]}>{step.label}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg} />
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.progressGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

// Payment Method Card Component
const PaymentMethodCard = ({ method, selected, onSelect, icon, title, description }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
        ]).start();
        onSelect(method);
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[styles.paymentCard, selected && styles.paymentCardSelected]}
                onPress={handlePress}
                activeOpacity={0.9}
            >
                {selected && (
                    <LinearGradient
                        colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                        style={styles.paymentCardGradient}
                    />
                )}
                <View style={styles.paymentIconContainer}>
                    <Text style={styles.paymentIcon}>{icon}</Text>
                </View>
                <View style={styles.paymentContent}>
                    <Text style={styles.paymentTitle}>{title}</Text>
                    <Text style={styles.paymentDescription}>{description}</Text>
                </View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const CheckoutScreen = ({ navigation }) => {
    const { items, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [address, setAddress] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
    });

    // Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(30)).current;
    const orderSuccessAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(contentAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Card details state
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
    });

    // Installation location state
    const [installationLocation, setInstallationLocation] = useState({
        address: '',
        coordinates: { latitude: null, longitude: null }
    });
    const [layoutImage, setLayoutImage] = useState(null);
    const [layoutNotes, setLayoutNotes] = useState('');

    const steps = [
        { label: 'Address', icon: '📍' },
        { label: 'Installation', icon: '🏗️' },
        { label: 'Payment', icon: '💳' },
        { label: 'Review', icon: '📋' },
    ];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const subtotal = getTotal();
    const tax = subtotal * 0.18;
    const shipping = subtotal > 50000 ? 0 : 2000;
    const total = subtotal + tax + shipping;

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setInstallationLocation(prev => ({
                ...prev,
                coordinates: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                }
            }));
            Alert.alert('Success', 'Location captured successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLocationLoading(false);
        }
    };

    const pickLayoutImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable gallery permissions to upload images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setLayoutImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const validateAddress = () => {
        const required = ['name', 'phone', 'street', 'city', 'state', 'zipCode'];
        for (const field of required) {
            if (!address[field]?.trim()) {
                Alert.alert('Error', `Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        return true;
    };

    const validateCard = () => {
        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
            const { cardNumber, cardholderName, expiryDate, cvv } = cardDetails;

            if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
                Alert.alert('Error', 'Please enter a valid 16-digit card number');
                return false;
            }
            if (!cardholderName?.trim()) {
                Alert.alert('Error', 'Please enter cardholder name');
                return false;
            }
            if (!expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate)) {
                Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
                return false;
            }
            if (!cvv || cvv.length < 3) {
                Alert.alert('Error', 'Please enter a valid CVV');
                return false;
            }
        }
        return true;
    };

    const formatCardNumber = (text) => {
        const cleaned = text.replace(/\D/g, '').slice(0, 16);
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted;
    };

    const formatExpiryDate = (text) => {
        const cleaned = text.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    const handleNextStep = () => {
        if (currentStep === 0 && !validateAddress()) return;
        if (currentStep === 2 && !validateCard()) return;

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handlePlaceOrder = async () => {
        if (!validateAddress()) return;
        if (!validateCard()) return;

        setLoading(true);
        try {
            const orderData = {
                items: items.map(item => ({
                    equipment: item._id,
                    quantity: item.quantity,
                })),
                shippingAddress: address,
                paymentMethod,
                installationLocation: installationLocation.address || installationLocation.coordinates.latitude ? installationLocation : undefined,
                layoutImage,
                layoutNotes,
            };

            const response = await api.post('/orders', orderData);

            if (response.data.success) {
                clearCart();

                // Show success animation
                Animated.sequence([
                    Animated.timing(orderSuccessAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]).start();

                Alert.alert(
                    '🎉 Order Placed Successfully!',
                    `Your order #${response.data.data.orderNumber} has been placed. We'll send you updates on your email.`,
                    [
                        {
                            text: 'View Orders',
                            onPress: () => navigation.navigate('Orders'),
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const renderAddressStep = () => (
        <Animated.View style={[styles.stepContent, { transform: [{ translateY: contentAnim }] }]}>
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>📍</Text>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>
                </View>
                <TextInput
                    label="Full Name"
                    value={address.name}
                    onChangeText={(text) => setAddress({ ...address, name: text })}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="account" />}
                />
                <TextInput
                    label="Phone Number"
                    value={address.phone}
                    onChangeText={(text) => setAddress({ ...address, phone: text })}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="phone" />}
                />
                <TextInput
                    label="Street Address"
                    value={address.street}
                    onChangeText={(text) => setAddress({ ...address, street: text })}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="home" />}
                />
                <View style={styles.row}>
                    <TextInput
                        label="City"
                        value={address.city}
                        onChangeText={(text) => setAddress({ ...address, city: text })}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        outlineColor={theme.colors.border}
                        activeOutlineColor={theme.colors.primary}
                    />
                    <TextInput
                        label="State"
                        value={address.state}
                        onChangeText={(text) => setAddress({ ...address, state: text })}
                        mode="outlined"
                        style={[styles.input, styles.halfInput]}
                        outlineColor={theme.colors.border}
                        activeOutlineColor={theme.colors.primary}
                    />
                </View>
                <TextInput
                    label="ZIP Code"
                    value={address.zipCode}
                    onChangeText={(text) => setAddress({ ...address, zipCode: text })}
                    mode="outlined"
                    style={[styles.input, { width: '50%' }]}
                    keyboardType="numeric"
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="map-marker" />}
                />
            </View>
        </Animated.View>
    );

    const renderInstallationStep = () => (
        <Animated.View style={[styles.stepContent, { transform: [{ translateY: contentAnim }] }]}>
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>🏗️</Text>
                    <Text style={styles.sectionTitle}>Installation Details</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Where should we install the equipment?</Text>

                <TextInput
                    label="Installation Address"
                    value={installationLocation.address}
                    onChangeText={(text) => setInstallationLocation(prev => ({ ...prev, address: text }))}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={2}
                    placeholder="Enter the address where equipment will be installed"
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                />

                <View style={styles.locationRow}>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={getCurrentLocation}
                        disabled={locationLoading}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.locationButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {locationLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.locationButtonIcon}>📍</Text>
                                    <Text style={styles.locationButtonText}>Use Current Location</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    {installationLocation.coordinates.latitude && (
                        <View style={styles.coordinatesContainer}>
                            <Text style={styles.coordinatesText}>
                                📌 {installationLocation.coordinates.latitude.toFixed(4)}, {installationLocation.coordinates.longitude.toFixed(4)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.layoutSection}>
                    <Text style={styles.layoutLabel}>Layout Image (Optional)</Text>
                    <Text style={styles.layoutHint}>Upload a photo or sketch of your playground area</Text>

                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickLayoutImage}>
                        {layoutImage ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: layoutImage }} style={styles.layoutImagePreview} />
                                <View style={styles.imageOverlay}>
                                    <Text style={styles.changeImageText}>📷 Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.imagePickerPlaceholder}>
                                <LinearGradient
                                    colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                                    style={styles.placeholderGradient}
                                />
                                <Text style={styles.imagePickerIcon}>📷</Text>
                                <Text style={styles.imagePickerText}>Tap to upload layout image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <TextInput
                    label="Layout Notes"
                    value={layoutNotes}
                    onChangeText={setLayoutNotes}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    placeholder="Describe the area size, surface type, special requirements..."
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                />
            </View>
        </Animated.View>
    );

    const renderPaymentStep = () => (
        <Animated.View style={[styles.stepContent, { transform: [{ translateY: contentAnim }] }]}>
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>💳</Text>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                </View>

                <View style={styles.paymentMethods}>
                    <PaymentMethodCard
                        method="credit_card"
                        selected={paymentMethod === 'credit_card'}
                        onSelect={setPaymentMethod}
                        icon="💳"
                        title="Credit Card"
                        description="Visa, Mastercard, American Express, RuPay"
                    />
                    <PaymentMethodCard
                        method="debit_card"
                        selected={paymentMethod === 'debit_card'}
                        onSelect={setPaymentMethod}
                        icon="🏦"
                        title="Debit Card"
                        description="All major bank debit cards accepted"
                    />
                    <PaymentMethodCard
                        method="cod"
                        selected={paymentMethod === 'cod'}
                        onSelect={setPaymentMethod}
                        icon="💵"
                        title="Cash on Delivery"
                        description="Pay when equipment is delivered"
                    />
                </View>

                {/* Card Input Form */}
                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                    <View style={styles.cardInputContainer}>
                        <Text style={styles.cardInputTitle}>
                            {paymentMethod === 'credit_card' ? 'Credit Card' : 'Debit Card'} Details
                        </Text>
                        <TextInput
                            label="Card Number"
                            value={cardDetails.cardNumber}
                            onChangeText={(text) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(text) })}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            maxLength={19}
                            placeholder="1234 5678 9012 3456"
                            left={<TextInput.Icon icon="credit-card" />}
                            outlineColor={theme.colors.border}
                            activeOutlineColor={theme.colors.primary}
                        />
                        <TextInput
                            label="Cardholder Name"
                            value={cardDetails.cardholderName}
                            onChangeText={(text) => setCardDetails({ ...cardDetails, cardholderName: text.toUpperCase() })}
                            mode="outlined"
                            style={styles.input}
                            autoCapitalize="characters"
                            placeholder="JOHN DOE"
                            left={<TextInput.Icon icon="account" />}
                            outlineColor={theme.colors.border}
                            activeOutlineColor={theme.colors.primary}
                        />
                        <View style={styles.cardRow}>
                            <TextInput
                                label="Expiry Date"
                                value={cardDetails.expiryDate}
                                onChangeText={(text) => setCardDetails({ ...cardDetails, expiryDate: formatExpiryDate(text) })}
                                mode="outlined"
                                style={[styles.input, styles.cardHalfInput]}
                                keyboardType="numeric"
                                maxLength={5}
                                placeholder="MM/YY"
                                left={<TextInput.Icon icon="calendar" />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                            />
                            <TextInput
                                label="CVV"
                                value={cardDetails.cvv}
                                onChangeText={(text) => setCardDetails({ ...cardDetails, cvv: text.replace(/\D/g, '').slice(0, 4) })}
                                mode="outlined"
                                style={[styles.input, styles.cardHalfInput]}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                placeholder="***"
                                left={<TextInput.Icon icon="lock" />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                            />
                        </View>
                        <View style={styles.securePaymentBadge}>
                            <Text style={styles.secureIcon}>🔒</Text>
                            <Text style={styles.secureText}>Your payment information is encrypted and secure</Text>
                        </View>
                    </View>
                )}
            </View>
        </Animated.View>
    );

    const renderReviewStep = () => (
        <Animated.View style={[styles.stepContent, { transform: [{ translateY: contentAnim }] }]}>
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>📋</Text>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsSummary}>
                    {items.slice(0, 3).map((item, index) => (
                        <View key={item._id} style={styles.summaryItem}>
                            <Text style={styles.summaryItemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.summaryItemQty}>×{item.quantity}</Text>
                            <Text style={styles.summaryItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                        </View>
                    ))}
                    {items.length > 3 && (
                        <Text style={styles.moreItemsText}>+{items.length - 3} more items</Text>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Price Breakdown */}
                <View style={styles.priceBreakdown}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Subtotal ({items.length} items)</Text>
                        <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>GST (18%)</Text>
                        <Text style={styles.priceValue}>{formatPrice(tax)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Shipping</Text>
                        <Text style={[styles.priceValue, shipping === 0 && styles.freeText]}>
                            {shipping === 0 ? '✨ FREE' : formatPrice(shipping)}
                        </Text>
                    </View>
                </View>

                <View style={styles.totalContainer}>
                    <LinearGradient
                        colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                        style={styles.totalGradient}
                    />
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                </View>

                {/* Delivery Info */}
                <View style={styles.deliveryInfo}>
                    <View style={styles.deliveryItem}>
                        <Text style={styles.deliveryIcon}>📍</Text>
                        <View>
                            <Text style={styles.deliveryTitle}>Delivery Address</Text>
                            <Text style={styles.deliveryText}>
                                {address.street}, {address.city}, {address.state} - {address.zipCode}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.deliveryItem}>
                        <Text style={styles.deliveryIcon}>💳</Text>
                        <View>
                            <Text style={styles.deliveryTitle}>Payment</Text>
                            <Text style={styles.deliveryText}>
                                {paymentMethod === 'cod' ? 'Cash on Delivery' :
                                    paymentMethod === 'credit_card' ? 'Credit Card' : 'Debit Card'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderAddressStep();
            case 1: return renderInstallationStep();
            case 2: return renderPaymentStep();
            case 3: return renderReviewStep();
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View style={{ opacity: headerAnim }}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerDecor1} />
                    <View style={styles.headerDecor2} />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <Text style={styles.headerSubtitle}>{items.length} items • {formatPrice(total)}</Text>
                </LinearGradient>
            </Animated.View>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} steps={steps} />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderCurrentStep()}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
                {currentStep > 0 && (
                    <TouchableOpacity
                        style={styles.prevButton}
                        onPress={handlePreviousStep}
                    >
                        <Text style={styles.prevButtonText}>← Back</Text>
                    </TouchableOpacity>
                )}
                {currentStep < steps.length - 1 ? (
                    <TouchableOpacity
                        style={[styles.nextButton, currentStep === 0 && { flex: 1 }]}
                        onPress={handleNextStep}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.nextButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.nextButtonText}>Continue</Text>
                            <Text style={styles.nextArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handlePlaceOrder}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#10B981', '#34D399']}
                            style={styles.nextButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>🎉 Place Order</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}
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
        padding: theme.spacing.lg,
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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -20,
        left: -20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    backIcon: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '600',
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
    stepIndicatorContainer: {
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        ...theme.shadows.sm,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepCircleCompleted: {
        backgroundColor: theme.colors.primary,
    },
    stepCircleCurrent: {
        backgroundColor: theme.colors.primary,
        borderWidth: 3,
        borderColor: theme.colors.primary + '40',
    },
    stepCheckmark: {
        color: '#fff',
        fontWeight: '700',
    },
    stepNumber: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    stepNumberCurrent: {
        color: '#fff',
    },
    stepLabel: {
        ...theme.typography.overline,
        color: theme.colors.textLight,
    },
    stepLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressGradient: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    stepContent: {
        padding: theme.spacing.md,
    },
    sectionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionEmoji: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    sectionSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        marginTop: -theme.spacing.sm,
    },
    input: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    row: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    locationButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    locationButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    locationButtonIcon: {
        fontSize: 16,
    },
    locationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    coordinatesContainer: {
        backgroundColor: theme.colors.successLight,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
    },
    coordinatesText: {
        ...theme.typography.caption,
        color: theme.colors.success,
    },
    layoutSection: {
        marginBottom: theme.spacing.md,
    },
    layoutLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    layoutHint: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    imagePickerButton: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    imagePickerPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
        position: 'relative',
    },
    placeholderGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    imagePickerIcon: {
        fontSize: 40,
        marginBottom: theme.spacing.sm,
    },
    imagePickerText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    layoutImagePreview: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: theme.spacing.sm,
        alignItems: 'center',
    },
    changeImageText: {
        color: '#fff',
        fontWeight: '600',
    },
    paymentMethods: {
        gap: theme.spacing.sm,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    paymentCardSelected: {
        borderColor: theme.colors.primary,
    },
    paymentCardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    paymentIcon: {
        fontSize: 24,
    },
    paymentContent: {
        flex: 1,
    },
    paymentTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    paymentDescription: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: theme.colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    cardInputContainer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    cardInputTitle: {
        ...theme.typography.h4,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    cardRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    cardHalfInput: {
        flex: 1,
    },
    securePaymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.successLight,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },
    secureIcon: {
        fontSize: 16,
    },
    secureText: {
        ...theme.typography.caption,
        color: theme.colors.success,
        flex: 1,
    },
    itemsSummary: {
        gap: theme.spacing.sm,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItemName: {
        flex: 1,
        ...theme.typography.body,
        color: theme.colors.text,
    },
    summaryItemQty: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginHorizontal: theme.spacing.sm,
    },
    summaryItemPrice: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
    },
    moreItemsText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: theme.spacing.md,
    },
    priceBreakdown: {
        gap: theme.spacing.xs,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceLabel: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    priceValue: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    freeText: {
        color: theme.colors.success,
        fontWeight: '700',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.md,
        overflow: 'hidden',
    },
    totalGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    totalLabel: {
        ...theme.typography.h4,
        color: theme.colors.text,
    },
    totalValue: {
        ...theme.typography.h2,
        color: theme.colors.primary,
        fontWeight: '800',
    },
    deliveryInfo: {
        marginTop: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    deliveryItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    deliveryIcon: {
        fontSize: 20,
        marginRight: theme.spacing.sm,
    },
    deliveryTitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    deliveryText: {
        ...theme.typography.body,
        color: theme.colors.text,
        marginTop: 2,
    },
    bottomPadding: {
        height: theme.spacing.xxl,
    },
    navigationContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        gap: theme.spacing.md,
    },
    prevButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        justifyContent: 'center',
    },
    prevButtonText: {
        ...theme.typography.button,
        color: theme.colors.textSecondary,
    },
    nextButton: {
        flex: 1,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    nextButtonText: {
        ...theme.typography.button,
        color: '#fff',
        fontWeight: '700',
    },
    nextArrow: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default CheckoutScreen;
