import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TeamDashboard from '../screens/installation/TeamDashboard';
import InstallationDetailScreen from '../screens/installation/InstallationDetailScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import theme from '../styles/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TasksStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
        }}
    >
        <Stack.Screen name="TasksMain" component={TeamDashboard} options={{ headerShown: false }} />
        <Stack.Screen
            name="InstallationDetail"
            component={InstallationDetailScreen}
            options={{ title: 'Installation Details' }}
        />
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

const InstallationNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let icon;
                    if (route.name === 'Tasks') icon = '🔧';
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
            <Tab.Screen name="Tasks" component={TasksStack} options={{ title: 'My Tasks' }} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default InstallationNavigator;
