import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user from storage on app start
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (err) {
            console.error('Error loading user:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', { email, password });

            if (response.data.success) {
                const { data, token: authToken } = response.data;

                await AsyncStorage.setItem('token', authToken);
                await AsyncStorage.setItem('user', JSON.stringify(data));

                setToken(authToken);
                setUser(data);

                return { success: true, user: data };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, message };
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await api.post('/auth/register', userData);

            if (response.data.success) {
                const { data, token: authToken } = response.data;

                await AsyncStorage.setItem('token', authToken);
                await AsyncStorage.setItem('user', JSON.stringify(data));

                setToken(authToken);
                setUser(data);

                return { success: true, user: data };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setError(null);
            const response = await api.put('/auth/updateprofile', profileData);

            if (response.data.success) {
                const updatedUser = response.data.data;
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return { success: true, user: updatedUser };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Update failed';
            setError(message);
            return { success: false, message };
        }
    };

    const updateUser = async (updatedUserData) => {
        try {
            await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
            setUser(updatedUserData);
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateProfile,
        updateUser,
        setError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
