import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

import AuthNavigator from './src/navigation/AuthNavigator';
import CustomerNavigator from './src/navigation/CustomerNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import InstallationNavigator from './src/navigation/InstallationNavigator';
import theme from './src/styles/theme';

const AppNavigator = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Route based on user role
  switch (user?.role) {
    case 'admin':
      return <AdminNavigator />;
    case 'installation_team':
      return <InstallationNavigator />;
    case 'customer':
      return <CustomerNavigator />;
    default:
      // Fallback for unknown roles or if role is missing, default to Customer for safety
      return <CustomerNavigator />;
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
