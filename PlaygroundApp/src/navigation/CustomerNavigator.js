import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/customer/HomeScreen';
import EquipmentDetailScreen from '../screens/customer/EquipmentDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import theme from '../styles/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: 'Equipment Details' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Shopping Cart' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    </Stack.Navigator>
);

const OrdersStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="OrdersList" component={OrdersScreen} options={{ title: 'My Orders' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Order History' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
);

const CustomerNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let icon;
                    if (route.name === 'Home') icon = '🏠';
                    else if (route.name === 'Orders') icon = '📦';
                    else if (route.name === 'Profile') icon = '👤';

                    return <Text style={{ fontSize: 22 }}>{icon}</Text>;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                headerShown: false,
                tabBarStyle: {
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default CustomerNavigator;
