import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import {
    initializeOnDeviceInference,
    setInferenceMode,
    getInferenceMode,
    isOnDeviceAvailable,
    getInferenceStats,
    InferenceMode,
} from '../../services/voiceService';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
    const [inferenceMode, setLocalInferenceMode] = useState<InferenceMode>(InferenceMode.AUTO);
    const [onDeviceReady, setOnDeviceReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modelPath, setModelPath] = useState<string | null>(null);
    const [stats, setStats] = useState(getInferenceStats());

    useEffect(() => {
        refreshStats();
    }, []);

    const refreshStats = () => {
        const currentStats = getInferenceStats();
        setStats(currentStats);
        setLocalInferenceMode(currentStats.mode);
        setOnDeviceReady(currentStats.onDeviceAvailable);
    };

    const handleLoadModel = async () => {
        try {
            // Pick a .gguf file
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Accept all files (we'll filter by extension)
                copyToCacheDirectory: false,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];

            if (!file.name.endsWith('.gguf')) {
                Alert.alert('Invalid File', 'Please select a .gguf model file');
                return;
            }

            setIsLoading(true);
            setModelPath(file.uri);

            // Initialize on-device inference
            const success = await initializeOnDeviceInference(file.uri);

            if (success) {
                Alert.alert(
                    'Success',
                    'Model loaded successfully! On-device inference is now available.',
                    [{ text: 'OK', onPress: refreshStats }]
                );
            } else {
                Alert.alert(
                    'Error',
                    'Failed to load model. Make sure you selected a valid FunctionGemma .gguf file.',
                    [{ text: 'OK' }]
                );
            }

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = (mode: InferenceMode) => {
        if (mode === InferenceMode.ON_DEVICE && !onDeviceReady) {
            Alert.alert(
                'Model Not Loaded',
                'Please load a model first to use on-device inference.',
                [{ text: 'OK' }]
            );
            return;
        }

        setInferenceMode(mode);
        setLocalInferenceMode(mode);
        refreshStats();
    };

    const getModeIcon = (mode: InferenceMode): string => {
        switch (mode) {
            case InferenceMode.ON_DEVICE:
                return 'phone-portrait';
            case InferenceMode.BACKEND:
                return 'cloud';
            case InferenceMode.AUTO:
                return 'flash';
        }
    };

    const getModeDescription = (mode: InferenceMode): string => {
        switch (mode) {
            case InferenceMode.ON_DEVICE:
                return 'All inference runs locally on your device. Fastest and most private.';
            case InferenceMode.BACKEND:
                return 'Uses remote backend server. Requires network connection.';
            case InferenceMode.AUTO:
                return 'Tries on-device first, falls back to backend if unavailable.';
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.title}>AI Settings</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Configure on-device inference and model settings
                    </ThemedText>
                </View>

                {/* Model Status */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Model Status</ThemedText>

                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <Ionicons
                                name={onDeviceReady ? 'checkmark-circle' : 'close-circle'}
                                size={24}
                                color={onDeviceReady ? '#34C759' : '#FF3B30'}
                            />
                            <View style={styles.statusText}>
                                <ThemedText style={styles.statusLabel}>On-Device Inference</ThemedText>
                                <ThemedText style={styles.statusValue}>
                                    {onDeviceReady ? 'Ready' : 'Not Available'}
                                </ThemedText>
                            </View>
                        </View>

                        {modelPath && (
                            <ThemedText style={styles.modelPath} numberOfLines={1}>
                                {modelPath}
                            </ThemedText>
                        )}

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLoadModel}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="download" size={20} color="#fff" />
                                    <ThemedText style={styles.buttonText}>
                                        {onDeviceReady ? 'Reload Model' : 'Load Model'}
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Inference Mode */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Inference Mode</ThemedText>

                    {[InferenceMode.AUTO, InferenceMode.ON_DEVICE, InferenceMode.BACKEND].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.modeCard,
                                inferenceMode === mode && styles.modeCardActive,
                            ]}
                            onPress={() => handleModeChange(mode)}
                        >
                            <View style={styles.modeHeader}>
                                <Ionicons
                                    name={getModeIcon(mode) as any}
                                    size={24}
                                    color={inferenceMode === mode ? '#007AFF' : '#666'}
                                />
                                <ThemedText style={[
                                    styles.modeTitle,
                                    inferenceMode === mode && styles.modeTitleActive,
                                ]}>
                                    {mode.replace('_', ' ').toUpperCase()}
                                </ThemedText>
                                {inferenceMode === mode && (
                                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                                )}
                            </View>
                            <ThemedText style={styles.modeDescription}>
                                {getModeDescription(mode)}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Backend Info */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Backend Server</ThemedText>
                    <View style={styles.infoCard}>
                        <ThemedText style={styles.infoLabel}>URL:</ThemedText>
                        <ThemedText style={styles.infoValue}>{stats.backendUrl}</ThemedText>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>How to Load Model</ThemedText>
                    <View style={styles.instructionsCard}>
                        <ThemedText style={styles.instructionStep}>
                            1. Download FunctionGemma-270M-IT GGUF model
                        </ThemedText>
                        <ThemedText style={styles.instructionStep}>
                            2. Transfer the .gguf file to your device
                        </ThemedText>
                        <ThemedText style={styles.instructionStep}>
                            3. Tap "Load Model" and select the file
                        </ThemedText>
                        <ThemedText style={styles.instructionStep}>
                            4. Wait for model to load (may take 10-30 seconds)
                        </ThemedText>
                        <ThemedText style={styles.instructionStep}>
                            5. Switch to "ON DEVICE" mode for offline usage
                        </ThemedText>
                    </View>
                </View>

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    statusCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusText: {
        marginLeft: 12,
        flex: 1,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusValue: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    modelPath: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modeCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modeCardActive: {
        borderColor: '#007AFF',
        backgroundColor: '#E6F4FE',
    },
    modeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    modeTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    modeTitleActive: {
        color: '#007AFF',
    },
    modeDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    infoCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: '#666',
    },
    instructionsCard: {
        backgroundColor: '#FFF9E6',
        borderRadius: 12,
        padding: 16,
    },
    instructionStep: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
});
