import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageOrdersScreen from '../screens/admin/ManageOrdersScreen';
import ManageEquipmentScreen from '../screens/admin/ManageEquipmentScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import OrderDetailScreen from '../screens/customer/OrderDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import theme from '../styles/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="DashboardMain" component={AdminDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="ManageOrders" component={ManageOrdersScreen} options={{ title: 'Manage Orders' }} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users', headerShown: false }} />
        <Stack.Screen name="ManageInstallations" component={ManageOrdersScreen} options={{ title: 'Installations' }} />
        <Stack.Screen name="ManageEquipment" component={ManageEquipmentScreen} options={{ title: 'Manage Equipment', headerShown: false }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </Stack.Navigator>
);

const OrdersStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="OrdersList" component={ManageOrdersScreen} options={{ title: 'All Orders' }} />
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
    </Stack.Navigator>
);

const AdminNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let icon;
                    if (route.name === 'Dashboard') icon = '📊';
                    else if (route.name === 'Orders') icon = '📋';
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
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default AdminNavigator;
