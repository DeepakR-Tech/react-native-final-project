import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { Button, Chip, Divider, TextInput, RadioButton } from 'react-native-paper';
import api from '../../api/axios';
import theme, { getStatusColor } from '../../styles/theme';

const InstallationDetailScreen = ({ route, navigation }) => {
    const { installation } = route.params;
    const [status, setStatus] = useState(installation.status);
    const [notes, setNotes] = useState(installation.teamNotes || '');
    const [loading, setLoading] = useState(false);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatusLabel = (s) => {
        const labels = {
            scheduled: 'Scheduled',
            in_progress: 'In Progress',
            on_hold: 'On Hold',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return labels[s] || s;
    };

    const handleUpdateStatus = async () => {
        setLoading(true);
        try {
            const response = await api.put(`/installations/${installation._id}/status`, {
                status,
                note: `Status updated to ${getStatusLabel(status)}`,
            });

            if (response.data.success) {
                Alert.alert('Success', 'Installation status updated');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            const response = await api.put(`/installations/${installation._id}/notes`, {
                teamNotes: notes,
            });

            if (response.data.success) {
                Alert.alert('Success', 'Notes saved');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to save notes');
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.orderNumber}>#{installation.order?.orderNumber}</Text>
                <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(installation.status) + '20' }]}
                    textStyle={[styles.statusText, { color: getStatusColor(installation.status) }]}
                >
                    {getStatusLabel(installation.status)}
                </Chip>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Schedule</Text>
                <Text style={styles.dateText}>{formatDate(installation.scheduledDate)}</Text>
                {installation.scheduledTime && (
                    <Text style={styles.timeText}>
                        ⏰ {installation.scheduledTime.start} - {installation.scheduledTime.end}
                    </Text>
                )}
                {installation.estimatedDuration && (
                    <Text style={styles.durationText}>
                        ⏱️ Estimated: {installation.estimatedDuration} hours
                    </Text>
                )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 Customer Details</Text>
                <Text style={styles.customerName}>{installation.customer?.name}</Text>
                <Text style={styles.customerInfo}>📞 {installation.customer?.phone || 'N/A'}</Text>
                <Text style={styles.customerInfo}>📧 {installation.customer?.email}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Location</Text>
                <Text style={styles.addressText}>
                    {installation.location?.address?.street}
                </Text>
                <Text style={styles.addressText}>
                    {installation.location?.address?.city}, {installation.location?.address?.state}
                </Text>
                <Text style={styles.addressText}>
                    {installation.location?.address?.zipCode}
                </Text>
                {installation.location?.landmark && (
                    <Text style={styles.landmark}>🏗️ Landmark: {installation.location.landmark}</Text>
                )}
                {installation.location?.accessInstructions && (
                    <Text style={styles.instructions}>
                        ℹ️ {installation.location.accessInstructions}
                    </Text>
                )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔧 Equipment to Install</Text>
                {installation.equipmentList?.map((item, index) => (
                    <View key={index} style={styles.equipmentItem}>
                        <View style={styles.equipmentInfo}>
                            <Text style={styles.equipmentName}>{item.name}</Text>
                            <Text style={styles.equipmentQty}>Qty: {item.quantity}</Text>
                        </View>
                        <Chip
                            style={[
                                styles.equipmentStatus,
                                { backgroundColor: getStatusColor(item.installationStatus === 'completed' ? 'completed' : 'pending') + '20' }
                            ]}
                            textStyle={{
                                color: getStatusColor(item.installationStatus === 'completed' ? 'completed' : 'pending'),
                                fontSize: 10,
                            }}
                        >
                            {item.installationStatus?.toUpperCase() || 'PENDING'}
                        </Chip>
                    </View>
                ))}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔄 Update Status</Text>
                <RadioButton.Group onValueChange={setStatus} value={status}>
                    <View style={styles.radioRow}>
                        <RadioButton value="scheduled" color={theme.colors.primary} />
                        <Text style={styles.radioLabel}>Scheduled</Text>
                    </View>
                    <View style={styles.radioRow}>
                        <RadioButton value="in_progress" color={theme.colors.warning} />
                        <Text style={styles.radioLabel}>In Progress</Text>
                    </View>
                    <View style={styles.radioRow}>
                        <RadioButton value="on_hold" color={theme.colors.error} />
                        <Text style={styles.radioLabel}>On Hold</Text>
                    </View>
                    <View style={styles.radioRow}>
                        <RadioButton value="completed" color={theme.colors.success} />
                        <Text style={styles.radioLabel}>Completed</Text>
                    </View>
                </RadioButton.Group>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Team Notes</Text>
                <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.notesInput}
                    placeholder="Add notes about the installation..."
                    outlineColor={theme.colors.border}
                    activeOutlineColor={theme.colors.primary}
                />
                <Button
                    mode="outlined"
                    onPress={handleSaveNotes}
                    style={styles.saveNotesButton}
                    textColor={theme.colors.primary}
                >
                    Save Notes
                </Button>
            </View>

            <Button
                mode="contained"
                onPress={handleUpdateStatus}
                style={styles.updateButton}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.primary}
                loading={loading}
                disabled={loading || status === installation.status}
            >
                Update Installation Status
            </Button>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
    },
    orderNumber: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    statusChip: {
        height: 32,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    divider: {
        height: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    dateText: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '500',
    },
    timeText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    durationText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    customerName: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
    },
    customerInfo: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    landmark: {
        ...theme.typography.bodySmall,
        color: theme.colors.info,
        marginTop: theme.spacing.sm,
    },
    instructions: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    equipmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    equipmentInfo: {
        flex: 1,
    },
    equipmentName: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    equipmentQty: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    equipmentStatus: {
        height: 24,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
    },
    radioLabel: {
        ...theme.typography.body,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    notesInput: {
        backgroundColor: theme.colors.surface,
    },
    saveNotesButton: {
        marginTop: theme.spacing.md,
    },
    updateButton: {
        margin: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
    },
    buttonContent: {
        paddingVertical: theme.spacing.sm,
    },
    bottomPadding: {
        height: theme.spacing.xl,
    },
});

export default InstallationDetailScreen;
