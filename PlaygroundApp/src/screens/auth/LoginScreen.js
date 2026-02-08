import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
    Modal,
    TextInput as RNTextInput,
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import theme from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, error, setError } = useAuth();

    // Forgot Password state
    const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Animate logo
        Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Animate form
        Animated.parallel([
            Animated.timing(formOpacity, {
                toValue: 1,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(formTranslateY, {
                toValue: 0,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!newPassword || !confirmNewPassword) {
            Alert.alert('Error', 'Please enter and confirm your new password');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setResetLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', {
                email: resetEmail.trim().toLowerCase(),
                newPassword: newPassword,
            });

            if (response.data.success) {
                Alert.alert('Success! 🎉', response.data.message, [
                    {
                        text: 'OK',
                        onPress: () => {
                            setForgotPasswordVisible(false);
                            setResetEmail('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                            // Optionally pre-fill the email
                            setEmail(resetEmail.trim().toLowerCase());
                        },
                    },
                ]);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setResetLoading(false);
        }
    };

    const renderForgotPasswordModal = () => (
        <Modal
            visible={forgotPasswordVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setForgotPasswordVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <TouchableOpacity
                            onPress={() => setForgotPasswordVisible(false)}
                            style={styles.modalCloseButton}
                        >
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>
                        Enter your email and new password to reset your account password.
                    </Text>

                    <Text style={styles.inputLabel}>Email Address</Text>
                    <RNTextInput
                        style={styles.modalInput}
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        placeholder="Enter your email"
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>New Password</Text>
                    <RNTextInput
                        style={styles.modalInput}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={theme.colors.textLight}
                        secureTextEntry
                    />

                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <RNTextInput
                        style={styles.modalInput}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={theme.colors.textLight}
                        secureTextEntry
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setForgotPasswordVisible(false);
                                setResetEmail('');
                                setNewPassword('');
                                setConfirmNewPassword('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleForgotPassword}
                            disabled={resetLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={resetLoading ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6']}
                                style={styles.resetButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {resetLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.resetButtonText}>Reset Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Section */}
                    <Animated.View
                        style={[
                            styles.header,
                            { transform: [{ scale: logoScale }] }
                        ]}
                    >
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoEmoji}>🎢</Text>
                        </View>
                        <Text style={styles.title}>Playground</Text>
                        <Text style={styles.subtitle}>Management System</Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            {
                                opacity: formOpacity,
                                transform: [{ translateY: formTranslateY }]
                            }
                        ]}
                    >
                        <Text style={styles.formTitle}>Welcome Back! 👋</Text>
                        <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                label="Email Address"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setError(null);
                                }}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                                outlineStyle={styles.inputOutline}
                                theme={{ roundness: 12 }}
                            />

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError(null);
                                }}
                                mode="outlined"
                                style={styles.input}
                                secureTextEntry={!showPassword}
                                left={<TextInput.Icon icon="lock-outline" color={theme.colors.primary} />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        onPress={() => setShowPassword(!showPassword)}
                                        color={theme.colors.textSecondary}
                                    />
                                }
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                                outlineStyle={styles.inputOutline}
                                theme={{ roundness: 12 }}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => setForgotPasswordVisible(true)}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6']}
                                style={styles.loginButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={() => Alert.alert('Coming Soon', 'Google login will be available in a future update!')}
                            >
                                <Text style={styles.socialIcon}>🌐</Text>
                                <Text style={styles.socialText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={() => Alert.alert('Coming Soon', 'Facebook login will be available in a future update!')}
                            >
                                <Text style={styles.socialIcon}>📘</Text>
                                <Text style={styles.socialText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderForgotPasswordModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    circle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -100,
        right: -100,
    },
    circle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 100,
        left: -80,
    },
    circle3: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        bottom: 200,
        right: 20,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoEmoji: {
        fontSize: 50,
    },
    title: {
        ...theme.typography.hero,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        ...theme.typography.body,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: theme.spacing.xs,
    },
    formCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xl,
        ...theme.shadows.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    formTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    formSubtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    inputContainer: {
        gap: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surface,
    },
    inputOutline: {
        borderRadius: 12,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    forgotPasswordText: {
        ...theme.typography.bodySmall,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.glow,
    },
    loginButtonDisabled: {
        ...theme.shadows.sm,
    },
    loginButtonGradient: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        ...theme.typography.button,
        color: '#fff',
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    dividerText: {
        marginHorizontal: theme.spacing.md,
        color: theme.colors.textSecondary,
        ...theme.typography.caption,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        gap: theme.spacing.sm,
    },
    socialIcon: {
        fontSize: 20,
    },
    socialText: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    registerLink: {
        ...theme.typography.body,
        color: theme.colors.primary,
        fontWeight: '700',
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
        marginBottom: theme.spacing.sm,
    },
    modalTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    modalCloseButton: {
        padding: theme.spacing.xs,
    },
    modalClose: {
        fontSize: 24,
        color: theme.colors.textSecondary,
    },
    modalSubtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.md,
    },
    modalInput: {
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
    resetButton: {
        flex: 1,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    resetButtonGradient: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    resetButtonText: {
        ...theme.typography.button,
        color: '#fff',
    },
});

export default LoginScreen;
