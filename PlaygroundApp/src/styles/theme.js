// Premium Theme for Playground Management App
// Modern design with gradients, glassmorphism, and rich aesthetics

export const theme = {
    colors: {
        // Primary Gradient Colors
        primary: '#6366F1',
        primaryDark: '#4F46E5',
        primaryLight: '#818CF8',
        primaryGradient: ['#6366F1', '#8B5CF6', '#A855F7'],

        // Secondary Colors
        secondary: '#EC4899',
        secondaryLight: '#F472B6',
        secondaryGradient: ['#EC4899', '#F472B6'],

        // Accent Colors
        accent: '#06B6D4',
        accentLight: '#22D3EE',
        gold: '#F59E0B',
        goldLight: '#FBBF24',

        // Background Colors
        background: '#F8FAFC',
        backgroundDark: '#0F172A',
        surface: '#FFFFFF',
        surfaceVariant: '#F1F5F9',

        // Glass Effect Colors
        glass: 'rgba(255, 255, 255, 0.85)',
        glassDark: 'rgba(15, 23, 42, 0.85)',
        glassLight: 'rgba(255, 255, 255, 0.95)',
        glassBorder: 'rgba(255, 255, 255, 0.3)',

        // Text Colors
        text: '#1E293B',
        textSecondary: '#64748B',
        textLight: '#94A3B8',
        textOnPrimary: '#FFFFFF',
        textOnDark: '#F8FAFC',

        // Status Colors
        error: '#EF4444',
        errorLight: '#FEE2E2',
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
        warningLight: '#FEF3C7',
        info: '#3B82F6',
        infoLight: '#DBEAFE',

        // Border Colors
        border: '#E2E8F0',
        borderLight: '#F1F5F9',
        divider: '#F1F5F9',

        // Status colors for orders
        statusPending: '#F59E0B',
        statusConfirmed: '#3B82F6',
        statusProcessing: '#8B5CF6',
        statusShipped: '#06B6D4',
        statusDelivered: '#10B981',
        statusCompleted: '#10B981',
        statusCancelled: '#EF4444',
        statusInProgress: '#F97316',
        statusScheduled: '#3B82F6',
        statusOnHold: '#F59E0B',
    },

    // Gradient Presets
    gradients: {
        primary: ['#6366F1', '#8B5CF6'],
        secondary: ['#EC4899', '#F472B6'],
        purple: ['#7C3AED', '#A855F7'],
        sunset: ['#F59E0B', '#EF4444'],
        ocean: ['#06B6D4', '#3B82F6'],
        emerald: ['#10B981', '#34D399'],
        dark: ['#1E293B', '#334155'],
        premium: ['#6366F1', '#EC4899'],
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },

    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        full: 9999,
    },

    shadows: {
        none: {
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
        xs: {
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
        },
        xl: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
        },
        glow: {
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
        glowSecondary: {
            shadowColor: '#EC4899',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
    },

    typography: {
        hero: {
            fontSize: 40,
            fontWeight: '800',
            lineHeight: 48,
            letterSpacing: -1,
        },
        h1: {
            fontSize: 32,
            fontWeight: '700',
            lineHeight: 40,
            letterSpacing: -0.5,
        },
        h2: {
            fontSize: 24,
            fontWeight: '700',
            lineHeight: 32,
            letterSpacing: -0.3,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
        },
        h4: {
            fontSize: 18,
            fontWeight: '600',
            lineHeight: 26,
        },
        body: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
        },
        bodyMedium: {
            fontSize: 16,
            fontWeight: '500',
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: '500',
            lineHeight: 16,
            letterSpacing: 0.5,
        },
        overline: {
            fontSize: 10,
            fontWeight: '600',
            lineHeight: 14,
            letterSpacing: 1,
            textTransform: 'uppercase',
        },
        button: {
            fontSize: 16,
            fontWeight: '600',
            lineHeight: 24,
            letterSpacing: 0.5,
        },
    },

    // Animation Durations
    animation: {
        fast: 150,
        normal: 250,
        slow: 400,
        verySlow: 600,
    },
};

// Helper function to get status color
export const getStatusColor = (status) => {
    const statusColors = {
        pending: theme.colors.statusPending,
        confirmed: theme.colors.statusConfirmed,
        processing: theme.colors.statusProcessing,
        shipped: theme.colors.statusShipped,
        delivered: theme.colors.statusDelivered,
        completed: theme.colors.statusCompleted,
        cancelled: theme.colors.statusCancelled,
        in_progress: theme.colors.statusInProgress,
        scheduled: theme.colors.statusScheduled,
        on_hold: theme.colors.statusOnHold,
        installation_scheduled: theme.colors.statusScheduled,
        installation_in_progress: theme.colors.statusInProgress,
    };

    return statusColors[status] || theme.colors.textSecondary;
};

// Helper function to get status background
export const getStatusBackground = (status) => {
    const colors = {
        pending: theme.colors.warningLight,
        confirmed: theme.colors.infoLight,
        processing: '#F3E8FF',
        shipped: '#CFFAFE',
        delivered: theme.colors.successLight,
        completed: theme.colors.successLight,
        cancelled: theme.colors.errorLight,
        in_progress: '#FFEDD5',
        scheduled: theme.colors.infoLight,
        on_hold: theme.colors.warningLight,
    };

    return colors[status] || theme.colors.surfaceVariant;
};

// Helper function to get status text color (for better contrast)
export const getStatusTextColor = (status) => {
    const colors = {
        pending: '#92400E', // Darker Orange
        confirmed: '#1E40AF', // Darker Blue
        processing: '#6B21A8', // Darker Purple
        shipped: '#155E75', // Darker Cyan
        delivered: '#065F46', // Darker Green
        completed: '#065F46',
        cancelled: '#991B1B', // Darker Red
        in_progress: '#9A3412',
        scheduled: '#1E40AF',
        on_hold: '#92400E',
        installation_scheduled: '#1E40AF',
        installation_in_progress: '#9A3412',
    };
    return colors[status] || theme.colors.textSecondary;
};

export default theme;
