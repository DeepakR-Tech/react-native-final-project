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
} from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import theme from '../../styles/theme';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('customer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, error, setError } = useAuth();

    // Animations
    const formOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(formOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(formTranslateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const cleanEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        const result = await register({ name, email: cleanEmail, password, phone, role });
        setLoading(false);

        if (!result.success) {
            Alert.alert('Registration Failed', result.message);
        }
    };



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

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backIcon}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create Account</Text>
                        <Text style={styles.headerSubtitle}>Join us and get started!</Text>
                    </View>

                    {/* Form Card */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            {
                                opacity: formOpacity,
                                transform: [{ translateY: formTranslateY }]
                            }
                        ]}
                    >
                        {/* Role Selection */}


                        {/* Input Fields */}
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                label="Full Name"
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    setError(null);
                                }}
                                mode="outlined"
                                style={styles.input}
                                left={<TextInput.Icon icon="account-outline" color={theme.colors.primary} />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                                theme={{ roundness: 12 }}
                            />

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
                                theme={{ roundness: 12 }}
                            />

                            <TextInput
                                label="Phone Number (Optional)"
                                value={phone}
                                onChangeText={setPhone}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="phone-pad"
                                left={<TextInput.Icon icon="phone-outline" color={theme.colors.primary} />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
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
                                theme={{ roundness: 12 }}
                            />

                            <TextInput
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                mode="outlined"
                                style={styles.input}
                                secureTextEntry={!showPassword}
                                left={<TextInput.Icon icon="lock-check-outline" color={theme.colors.primary} />}
                                outlineColor={theme.colors.border}
                                activeOutlineColor={theme.colors.primary}
                                theme={{ roundness: 12 }}
                            />
                        </View>

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            By signing up, you agree to our{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6']}
                                style={styles.registerButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -80,
    },
    circle2: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: 150,
        left: -60,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    backIcon: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
    },
    headerTitle: {
        ...theme.typography.h1,
        color: '#fff',
        marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
        ...theme.typography.body,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    formCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xl,
        ...theme.shadows.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    sectionTitle: {
        ...theme.typography.h4,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    rolesContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    roleCard: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surfaceVariant,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    roleCardSelected: {
        borderColor: theme.colors.primary,
    },
    roleCardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    roleEmoji: {
        fontSize: 28,
        marginBottom: theme.spacing.xs,
    },
    roleLabel: {
        ...theme.typography.caption,
        color: theme.colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    roleLabelSelected: {
        color: theme.colors.primary,
    },
    roleDescription: {
        ...theme.typography.overline,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },
    roleDescriptionSelected: {
        color: theme.colors.primary,
    },
    inputContainer: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surface,
    },
    termsText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: 18,
    },
    termsLink: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    registerButton: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.glow,
        marginBottom: theme.spacing.lg,
    },
    registerButtonDisabled: {
        ...theme.shadows.sm,
    },
    registerButtonGradient: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerButtonText: {
        ...theme.typography.button,
        color: '#fff',
        fontWeight: '700',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    loginLink: {
        ...theme.typography.body,
        color: theme.colors.primary,
        fontWeight: '700',
    },
});

export default RegisterScreen;
