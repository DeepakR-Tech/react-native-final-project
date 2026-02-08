import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput as RNTextInput,
} from 'react-native';
import { Searchbar, ActivityIndicator, FAB, TextInput, Button, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import theme from '../../styles/theme';
import { getEquipmentImage } from '../../utils/equipmentImages';

const ManageEquipmentScreen = ({ navigation }) => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        isAvailable: true,
        installationRequired: false,
    });

    const fetchEquipment = useCallback(async () => {
        try {
            const response = await api.get('/equipment', {
                params: {
                    search: searchQuery,
                    limit: 100 // Fetch all for now or implement pagination later
                }
            });
            if (response.data.success) {
                setEquipment(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching equipment:', error);
            Alert.alert('Error', 'Failed to load equipment');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchEquipment();
    }, [fetchEquipment]);

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            description: item.description,
            price: item.price.toString(),
            stock: item.stock.toString(),
            image: item.image || '',
            isAvailable: item.isAvailable,
            installationRequired: item.installationRequired || false,
        });
        setModalVisible(true);
    };

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            category: 'Swings', // Default
            description: '',
            price: '',
            stock: '0',
            image: '',
            isAvailable: true,
            installationRequired: false,
        });
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
            };

            if (editingItem) {
                await api.put(`/equipment/${editingItem._id}`, payload);
                Alert.alert('Success', 'Equipment updated successfully');
            } else {
                await api.post('/equipment', payload);
                Alert.alert('Success', 'Equipment added successfully');
            }
            setModalVisible(false);
            fetchEquipment();
        } catch (error) {
            console.error('Error saving equipment:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save equipment');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this equipment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/equipment/${id}`);
                            fetchEquipment();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete equipment');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.stock > 0 ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
                    <Text style={[styles.statusText, { color: item.stock > 0 ? theme.colors.success : theme.colors.error }]}>
                        {item.stock > 0 ? `In Stock (${item.stock})` : 'Out of Stock'}
                    </Text>
                </View>
            </View>
            <Text style={styles.cardSubtitle}>{item.category} • ₹{item.price}</Text>

            <View style={styles.cardActions}>
                <Button
                    mode="outlined"
                    onPress={() => handleEdit(item)}
                    style={styles.actionButton}
                    textColor={theme.colors.primary}
                >
                    Edit
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDelete(item._id)}
                    style={styles.actionButton}
                    textColor={theme.colors.error}
                >
                    Delete
                </Button>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Manage Equipment</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Searchbar
                    placeholder="Search equipment..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={1}
                />

                {loading ? (
                    <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                ) : (
                    <FlatList
                        data={equipment}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.list}
                        refreshing={refreshing}
                        onRefresh={fetchEquipment}
                        ListEmptyComponent={<Text style={styles.emptyText}>No equipment found</Text>}
                    />
                )}
            </View>

            <FAB
                style={styles.fab}
                icon="plus"
                onPress={handleAdd}
                label="Add New"
                color="#fff"
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Equipment' : 'Add New Equipment'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.formScroll}>
                        <TextInput
                            label="Name"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Category"
                            value={formData.category}
                            onChangeText={(text) => setFormData({ ...formData, category: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Price (₹)"
                            value={formData.price}
                            onChangeText={(text) => setFormData({ ...formData, price: text })}
                            keyboardType="numeric"
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Stock Quantity"
                            value={formData.stock}
                            onChangeText={(text) => setFormData({ ...formData, stock: text })}
                            keyboardType="numeric"
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Description"
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            mode="outlined"
                        />

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Available for Sale</Text>
                            <Switch
                                value={formData.isAvailable}
                                onValueChange={(val) => setFormData({ ...formData, isAvailable: val })}
                                color={theme.colors.primary}
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            style={styles.submitButton}
                            buttonColor={theme.colors.primary}
                        >
                            {editingItem ? 'Update Equipment' : 'Add Equipment'}
                        </Button>
                    </ScrollView>
                </View>
            </Modal>
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
    },
    headerTitle: {
        ...theme.typography.h2,
        color: '#fff',
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
        paddingBottom: 80,
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
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        ...theme.typography.h4,
        color: theme.colors.text,
        flex: 1,
    },
    cardSubtitle: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionButton: {
        borderColor: theme.colors.border,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: theme.colors.primary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        marginTop: 40,
    },
    modalTitle: {
        ...theme.typography.h3,
    },
    closeButton: {
        fontSize: 24,
        color: theme.colors.text,
    },
    formScroll: {
        padding: theme.spacing.lg,
    },
    input: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    switchLabel: {
        ...theme.typography.bodyMedium,
    },
    submitButton: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xxl,
    },
});

export default ManageEquipmentScreen;
