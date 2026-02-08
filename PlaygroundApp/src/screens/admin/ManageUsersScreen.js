import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    RefreshControl,
} from 'react-native';
import { Searchbar, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import theme from '../../styles/theme';

const ManageUsersScreen = ({ navigation, route }) => {
    const { roleFilter, title } = route.params || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/auth/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return theme.colors.error;
            case 'installation_team': return theme.colors.warning;
            default: return theme.colors.primary;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                    <Text style={styles.roleText}>
                        {item.role === 'installation_team' ? 'TEAM' : item.role.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardDetails}>
                <Text style={styles.detailText}>📞 {item.phone || 'N/A'}</Text>
                <Text style={styles.detailText}>📅 Joined: {formatDate(item.createdAt)}</Text>
            </View>

            {item.role !== 'admin' && (
                <View style={styles.cardActions}>
                    {/* Placeholder for future actions like Delete or promote */}
                    <Button
                        mode="text"
                        textColor={theme.colors.error}
                        onPress={() => Alert.alert('Coming Soon', 'Delete/Edit user functionality implementation pending')}
                    >
                        Remove User
                    </Button>
                </View>
            )}
        </View>
    );

    const filteredUsers = users.filter(user =>
        (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!roleFilter || user.role === roleFilter)
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>{title || 'Manage Users'}</Text>
                <Text style={styles.headerSubtitle}>{filteredUsers.length} {roleFilter ? 'team members' : 'registered users'}</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Searchbar
                    placeholder="Search users..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={1}
                />

                {loading ? (
                    <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                        }
                        ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
                    />
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
        paddingTop: 60,
        paddingBottom: theme.spacing.xl,
    },
    headerTitle: {
        ...theme.typography.h2,
        color: '#fff',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    searchBar: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    list: {
        paddingBottom: 20,
    },
    loader: {
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.textSecondary,
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    userInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    userName: {
        ...theme.typography.h4,
        color: theme.colors.text,
    },
    userEmail: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    cardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    detailText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    cardActions: {
        marginTop: theme.spacing.sm,
        alignItems: 'flex-end',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});

export default ManageUsersScreen;
