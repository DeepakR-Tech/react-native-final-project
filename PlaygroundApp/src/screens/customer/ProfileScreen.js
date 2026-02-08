import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Animated,
    Dimensions,
} from 'react-native';
import { Divider, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import theme from '../../styles/theme';

const { width } = Dimensions.get('window');

// Animated Stat Card Component
const AnimatedStatCard = ({ icon, value, label, color, delay = 0 }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 6,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: scaleAnim,
                    transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
                }
            ]}
        >
            <LinearGradient
                colors={[color + '20', color + '10']}
                style={styles.statCardGradient}
            />
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

// Animated Menu Item Component
const AnimatedMenuItem = ({ emoji, title, subtitle, onPress, isDestructive, index }) => {
    const slideAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                delay: index * 50,
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

    return (
        <Animated.View
            style={{
                opacity: opacityAnim,
                transform: [{ translateX: slideAnim }, { scale: scaleAnim }]
            }}
        >
            <TouchableOpacity
                style={styles.menuItem}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <View style={[styles.menuIcon, isDestructive && styles.menuIconDestructive]}>
                    <Text style={styles.menuEmoji}>{emoji}</Text>
                </View>
                <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>
                        {title}
                    </Text>
                    {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
                </View>
                <View style={styles.menuArrowContainer}>
                    <Text style={styles.menuArrow}>›</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ProfileScreen = ({ navigation }) => {
    const { user, logout, updateUser } = useAuth();
    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [addressesVisible, setAddressesVisible] = useState(false);
    const [addAddressVisible, setAddAddressVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);

    // Animation refs
    const headerAnim = useRef(new Animated.Value(0)).current;
    const avatarScaleAnim = useRef(new Animated.Value(0)).current;
    const avatarPulseAnim = useRef(new Animated.Value(1)).current;

    // Edit Profile state
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');

    // Change Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Addresses state
    const [addresses, setAddresses] = useState([]);
    const [addressLabel, setAddressLabel] = useState('Home');
    const [addressStreet, setAddressStreet] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [addressZip, setAddressZip] = useState('');
    const [editingAddressId, setEditingAddressId] = useState(null);

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(avatarScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 6,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Avatar pulse animation
        const startPulse = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(avatarPulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(avatarPulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };
        startPulse();

        // Fetch orders for stats
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/my-orders');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.log('Error fetching orders:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            '👋 Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: logout, style: 'destructive' },
            ]
        );
    };

    const handleEditProfile = async () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/auth/profile', {
                name: editName.trim(),
                phone: editPhone.trim(),
            });

            if (response.data.success) {
                if (updateUser) {
                    updateUser(response.data.data);
                }
                Alert.alert('Success', 'Profile updated successfully');
                setEditProfileVisible(false);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/auth/password', {
                currentPassword,
                newPassword,
            });

            if (response.data.success) {
                Alert.alert('Success', 'Password changed successfully');
                setChangePasswordVisible(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async () => {
        try {
            const response = await api.get('/auth/addresses');
            if (response.data.success) {
                setAddresses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const handleSaveAddress = async () => {
        if (!addressStreet || !addressCity || !addressState || !addressZip) {
            Alert.alert('Error', 'Please fill all address fields');
            return;
        }

        setLoading(true);
        try {
            const addressData = {
                label: addressLabel,
                street: addressStreet,
                city: addressCity,
                state: addressState,
                zipCode: addressZip,
            };

            let response;
            if (editingAddressId) {
                response = await api.put(`/auth/addresses/${editingAddressId}`, addressData);
            } else {
                response = await api.post('/auth/addresses', addressData);
            }

            if (response.data.success) {
                setAddresses(response.data.data);
                Alert.alert('Success', editingAddressId ? 'Address updated!' : 'Address added!');
                resetAddressForm();
                setAddAddressVisible(false);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAddress = (addressId) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.delete(`/auth/addresses/${addressId}`);
                            if (response.data.success) {
                                setAddresses(response.data.data);
                                Alert.alert('Success', 'Address deleted!');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete address');
                        }
                    },
                },
            ]
        );
    };

    const resetAddressForm = () => {
        setAddressLabel('Home');
        setAddressStreet('');
        setAddressCity('');
        setAddressState('');
        setAddressZip('');
        setEditingAddressId(null);
    };

    const openAddressesModal = () => {
        fetchAddresses();
        setAddressesVisible(true);
    };

    const getRoleLabel = (role) => {
        const labels = {
            customer: 'Customer',
            admin: 'Administrator',
            installation_team: 'Installation Team',
        };
        return labels[role] || role;
    };

    const getRoleEmoji = (role) => {
        const icons = {
            customer: '👤',
            admin: '🛡️',
            installation_team: '🔧',
        };
        return icons[role] || '👤';
    };

    // Calculate stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

    const formatPrice = (price) => {
        if (price >= 100000) {
            return `₹${(price / 100000).toFixed(1)}L`;
        }
        if (price >= 1000) {
            return `₹${(price / 1000).toFixed(0)}K`;
        }
        return `₹${price}`;
    };

    const renderEditProfileModal = () => (
        <Modal
            visible={editProfileVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditProfileVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>✏️ Edit Profile</Text>
                        <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.colors.textLight}
                    />

                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="Enter your phone number"
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="phone-pad"
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditProfileVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleEditProfile}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.saveButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderChangePasswordModal = () => (
        <Modal
            visible={changePasswordVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setChangePasswordVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>🔒 Change Password</Text>
                        <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={theme.colors.textLight}
                        secureTextEntry
                    />

                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={theme.colors.textLight}
                        secureTextEntry
                    />

                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={theme.colors.textLight}
                        secureTextEntry
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setChangePasswordVisible(false);
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.saveButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Change</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderAddressesModal = () => (
        <Modal
            visible={addressesVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAddressesVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>📍 Saved Addresses</Text>
                        <TouchableOpacity onPress={() => setAddressesVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                        {addresses.length === 0 ? (
                            <View style={styles.emptyAddress}>
                                <Text style={styles.emptyAddressIcon}>📍</Text>
                                <Text style={styles.emptyAddressText}>No saved addresses</Text>
                            </View>
                        ) : (
                            addresses.map((addr) => (
                                <View key={addr._id} style={styles.addressCard}>
                                    <View style={styles.addressHeader}>
                                        <View style={styles.addressLabelBadge}>
                                            <Text style={styles.addressLabelText}>{addr.label}</Text>
                                        </View>
                                        {addr.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultText}>Default</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.addressText}>
                                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                                    </Text>
                                    <View style={styles.addressActions}>
                                        <TouchableOpacity
                                            style={styles.addressActionBtn}
                                            onPress={() => {
                                                setEditingAddressId(addr._id);
                                                setAddressLabel(addr.label);
                                                setAddressStreet(addr.street);
                                                setAddressCity(addr.city);
                                                setAddressState(addr.state);
                                                setAddressZip(addr.zipCode);
                                                setAddAddressVisible(true);
                                            }}
                                        >
                                            <Text style={styles.addressActionText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.addressActionBtn, styles.deleteBtn]}
                                            onPress={() => handleDeleteAddress(addr._id)}
                                        >
                                            <Text style={styles.deleteActionText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.addAddressButton}
                        onPress={() => {
                            resetAddressForm();
                            setAddAddressVisible(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.addAddressGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.addAddressBtnText}>+ Add New Address</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderAddAddressModal = () => (
        <Modal
            visible={addAddressVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAddAddressVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingAddressId ? '✏️ Edit Address' : '📍 Add Address'}
                        </Text>
                        <TouchableOpacity onPress={() => setAddAddressVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Label</Text>
                    <View style={styles.labelPicker}>
                        {['Home', 'Work', 'Other'].map((label) => (
                            <TouchableOpacity
                                key={label}
                                style={[
                                    styles.labelOption,
                                    addressLabel === label && styles.labelOptionActive
                                ]}
                                onPress={() => setAddressLabel(label)}
                            >
                                <Text style={[
                                    styles.labelOptionText,
                                    addressLabel === label && styles.labelOptionTextActive
                                ]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.inputLabel}>Street Address</Text>
                    <TextInput
                        style={styles.input}
                        value={addressStreet}
                        onChangeText={setAddressStreet}
                        placeholder="123 Main Street"
                        placeholderTextColor={theme.colors.textLight}
                    />

                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={addressCity}
                        onChangeText={setAddressCity}
                        placeholder="Mumbai"
                        placeholderTextColor={theme.colors.textLight}
                    />

                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput
                        style={styles.input}
                        value={addressState}
                        onChangeText={setAddressState}
                        placeholder="Maharashtra"
                        placeholderTextColor={theme.colors.textLight}
                    />

                    <Text style={styles.inputLabel}>ZIP Code</Text>
                    <TextInput
                        style={styles.input}
                        value={addressZip}
                        onChangeText={setAddressZip}
                        placeholder="400001"
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="numeric"
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setAddAddressVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveAddress}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.saveButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header with Gradient */}
            <Animated.View style={{ opacity: headerAnim }}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerDecor1} />
                    <View style={styles.headerDecor2} />
                    <View style={styles.headerDecor3} />

                    <Animated.View
                        style={[
                            styles.avatarContainer,
                            { transform: [{ scale: Animated.multiply(avatarScaleAnim, avatarPulseAnim) }] }
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.15)']}
                            style={styles.avatarOuter}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            </LinearGradient>
                        </LinearGradient>
                    </Animated.View>

                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.roleContainer}>
                        <Text style={styles.roleEmoji}>{getRoleEmoji(user?.role)}</Text>
                        <Text style={styles.roleLabel}>{getRoleLabel(user?.role)}</Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <AnimatedStatCard
                    icon="📦"
                    value={totalOrders.toString()}
                    label="Orders"
                    color="#6366F1"
                    delay={0}
                />
                <AnimatedStatCard
                    icon="💰"
                    value={formatPrice(totalSpent)}
                    label="Spent"
                    color="#10B981"
                    delay={100}
                />
                <AnimatedStatCard
                    icon="📅"
                    value={memberSince.toString()}
                    label="Since"
                    color="#F59E0B"
                    delay={200}
                />
            </View>

            {/* Settings Sections */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACCOUNT</Text>
                <View style={styles.menuCard}>
                    <AnimatedMenuItem
                        emoji="✏️"
                        title="Edit Profile"
                        subtitle="Update your name and phone"
                        onPress={() => {
                            setEditName(user?.name || '');
                            setEditPhone(user?.phone || '');
                            setEditProfileVisible(true);
                        }}
                        index={0}
                    />
                    <Divider style={styles.divider} />
                    <AnimatedMenuItem
                        emoji="🔒"
                        title="Change Password"
                        subtitle="Update your password"
                        onPress={() => setChangePasswordVisible(true)}
                        index={1}
                    />
                    <Divider style={styles.divider} />
                    <AnimatedMenuItem
                        emoji="📍"
                        title="Saved Addresses"
                        subtitle="Manage delivery addresses"
                        onPress={openAddressesModal}
                        index={2}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ORDERS</Text>
                <View style={styles.menuCard}>
                    <AnimatedMenuItem
                        emoji="📦"
                        title="Order History"
                        subtitle="View all your orders"
                        onPress={() => navigation.navigate('Orders')}
                        index={3}
                    />
                    <Divider style={styles.divider} />
                    <AnimatedMenuItem
                        emoji="🔧"
                        title="Installation Status"
                        subtitle="Track equipment installation"
                        onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}
                        index={4}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SUPPORT</Text>
                <View style={styles.menuCard}>
                    <AnimatedMenuItem
                        emoji="❓"
                        title="Help & Support"
                        subtitle="FAQs and contact support"
                        onPress={() => Alert.alert('Contact Support', 'Email: support@playground.com\nPhone: +91 1234567890')}
                        index={5}
                    />
                    <Divider style={styles.divider} />
                    <AnimatedMenuItem
                        emoji="ℹ️"
                        title="About"
                        subtitle="App version and info"
                        onPress={() => Alert.alert('About', 'Playground Equipment App\nVersion 1.0.0\n\n© 2026 Playground Systems')}
                        index={6}
                    />
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['rgba(239, 68, 68, 0.1)', 'rgba(248, 113, 113, 0.1)']}
                    style={styles.logoutGradient}
                >
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.logoutText}>Logout</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* App Version */}
            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Playground App v1.0.0</Text>
                <Text style={styles.copyrightText}>Made with ❤️ in India</Text>
            </View>

            <View style={styles.bottomPadding} />

            {renderEditProfileModal()}
            {renderChangePasswordModal()}
            {renderAddressesModal()}
            {renderAddAddressModal()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xxl + 20,
        overflow: 'hidden',
    },
    headerDecor1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -60,
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
    headerDecor3: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: 40,
        left: 40,
    },
    avatarContainer: {
        marginBottom: theme.spacing.md,
    },
    avatarOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 45,
        fontWeight: '700',
        color: '#fff',
    },
    userName: {
        ...theme.typography.h2,
        color: '#fff',
        marginBottom: theme.spacing.xs,
    },
    userEmail: {
        ...theme.typography.body,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing.md,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    roleEmoji: {
        fontSize: 16,
        marginRight: theme.spacing.xs,
    },
    roleLabel: {
        color: '#fff',
        fontWeight: '600',
        ...theme.typography.bodySmall,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        marginTop: -30,
        gap: theme.spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadows.md,
        overflow: 'hidden',
    },
    statCardGradient: {
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
        ...theme.typography.h3,
        fontWeight: '800',
    },
    statLabel: {
        ...theme.typography.overline,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    section: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.overline,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    menuCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.sm,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    menuIcon: {
        marginRight: theme.spacing.md,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIconDestructive: {
        backgroundColor: theme.colors.error + '15',
    },
    menuEmoji: {
        fontSize: 20,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    menuTitleDestructive: {
        color: theme.colors.error,
    },
    menuSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    menuArrowContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuArrow: {
        fontSize: 16,
        color: theme.colors.textLight,
        fontWeight: '600',
    },
    divider: {
        marginLeft: 68,
    },
    logoutButton: {
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.xl,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1.5,
        borderColor: theme.colors.error,
        overflow: 'hidden',
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    logoutIcon: {
        fontSize: 20,
    },
    logoutText: {
        ...theme.typography.button,
        color: theme.colors.error,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
    },
    versionText: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
    },
    copyrightText: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
        marginTop: 4,
    },
    bottomPadding: {
        height: theme.spacing.xxl,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xl,
        width: '100%',
        maxWidth: 400,
        ...theme.shadows.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    modalClose: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        padding: theme.spacing.xs,
    },
    inputLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: theme.colors.surfaceVariant,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...theme.typography.button,
        color: theme.colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    saveButtonText: {
        ...theme.typography.button,
        color: '#fff',
    },
    // Address styles
    emptyAddress: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
    },
    emptyAddressIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    emptyAddressText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    addressCard: {
        backgroundColor: theme.colors.surfaceVariant,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    addressLabelBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    addressLabelText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    defaultBadge: {
        backgroundColor: theme.colors.success + '20',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    defaultText: {
        ...theme.typography.caption,
        color: theme.colors.success,
        fontWeight: '600',
    },
    addressText: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    addressActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    addressActionBtn: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.primary + '15',
    },
    addressActionText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    deleteBtn: {
        backgroundColor: theme.colors.error + '15',
    },
    deleteActionText: {
        ...theme.typography.caption,
        color: theme.colors.error,
        fontWeight: '600',
    },
    addAddressButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginTop: theme.spacing.md,
    },
    addAddressGradient: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    addAddressBtnText: {
        ...theme.typography.button,
        color: '#fff',
    },
    labelPicker: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    labelOption: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    labelOptionActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    labelOptionText: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
    },
    labelOptionTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default ProfileScreen;
