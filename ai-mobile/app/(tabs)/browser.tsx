import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { parseVoiceCommand } from '../../services/voiceService';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

export default function VoiceBrowserScreen() {
    const [url, setUrl] = useState('https://www.google.com');
    const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const webViewRef = useRef<WebView>(null);
    const feedbackOpacity = useRef(new Animated.Value(0)).current;
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use cross-platform voice recognition hook
    const {
        isListening,
        transcript,
        error: voiceError,
        isSupported,
        startListening,
        stopListening,
    } = useVoiceRecognition({
        onResult: (result) => {
            if (result.isFinal) {
                processVoiceCommand(result.transcript);
            } else {
                // Show interim results
                showFeedbackPanel(result.transcript, 'Listening...');
            }
        },
    });

    useEffect(() => {
        if (voiceError) {
            showFeedbackPanel('', `Voice Error: ${voiceError}`, true);
        }
    }, [voiceError]);

    useEffect(() => {
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, []);

    const handleVoiceButtonPress = async () => {
        if (!isSupported) {
            Alert.alert(
                'Not Supported',
                'Voice recognition is not supported on this device or browser.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (isListening) {
            stopListening();
        } else {
            setStatus('Listening...');
            showFeedbackPanel('', 'Listening...');
            await startListening();
        }
    };

    const processVoiceCommand = async (command: string) => {
        setIsProcessing(true);
        setStatus('Processing...');
        showFeedbackPanel(command, 'Processing...');

        try {
            const functionCall = await parseVoiceCommand(command);
            executeFunction(functionCall, command);
        } catch (error: any) {
            showFeedbackPanel(command, `Error: ${error.message}`, true);
        } finally {
            setIsProcessing(false);
        }
    };

    const executeFunction = (functionCall: any, originalCommand: string) => {
        console.log('Executing:', functionCall.name, functionCall.parameters);

        switch (functionCall.name) {
            case 'open_browser':
                if (functionCall.parameters.url) {
                    const normalizedUrl = normalizeURL(functionCall.parameters.url);
                    showFeedbackPanel(originalCommand, `Opening ${normalizedUrl}...`);
                    loadURL(normalizedUrl);
                } else {
                    showFeedbackPanel(originalCommand, 'No URL provided', true);
                }
                break;

            case 'search_web':
                if (functionCall.parameters.query) {
                    const query = encodeURIComponent(functionCall.parameters.query);
                    const searchUrl = `https://www.google.com/search?q=${query}`;
                    showFeedbackPanel(originalCommand, `Searching for "${functionCall.parameters.query}"...`);
                    loadURL(searchUrl);
                } else {
                    showFeedbackPanel(originalCommand, 'No search query provided', true);
                }
                break;

            case 'go_back':
                showFeedbackPanel(originalCommand, 'Going back...');
                webViewRef.current?.goBack();
                break;

            case 'go_forward':
                showFeedbackPanel(originalCommand, 'Going forward...');
                webViewRef.current?.goForward();
                break;

            case 'refresh_page':
                showFeedbackPanel(originalCommand, 'Refreshing page...');
                webViewRef.current?.reload();
                break;

            default:
                showFeedbackPanel(originalCommand, `Unknown command: ${functionCall.name}`, true);
        }

        scheduleFeedbackHide();
    };

    const normalizeURL = (urlString: string): string => {
        let normalized = urlString.trim();

        if (!normalized.includes('://')) {
            normalized = `https://${normalized}`;
        }

        if (!normalized.includes('.') && !normalized.includes('localhost')) {
            normalized = normalized.replace('https://', 'https://www.');
            normalized += '.com';
        }

        return normalized;
    };

    const loadURL = (urlString: string) => {
        setUrl(urlString);
        setCurrentUrl(urlString);
    };

    const handleUrlSubmit = () => {
        const normalized = normalizeURL(currentUrl);
        loadURL(normalized);
    };

    const showFeedbackPanel = (transcriptText: string, statusText: string, isError = false) => {
        // Note: transcript is managed by the voice recognition hook
        // We show transcriptText in the feedback panel directly
        setStatus(statusText);
        setShowFeedback(true);

        Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const scheduleFeedbackHide = (delay = 3000) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);

        hideTimer.current = setTimeout(() => {
            Animated.timing(feedbackOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShowFeedback(false);
            });
        }, delay);
    };

    return (
        <ThemedView style={styles.container}>
            {/* Navigation Bar */}
            <View style={styles.navBar}>
                <TextInput
                    style={styles.urlBar}
                    value={currentUrl}
                    onChangeText={setCurrentUrl}
                    onSubmitEditing={handleUrlSubmit}
                    placeholder="Enter URL or use voice command"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="go"
                />

                <TouchableOpacity
                    style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                    onPress={handleVoiceButtonPress}
                    disabled={isProcessing}
                >
                    <Ionicons
                        name={isListening ? 'stop' : 'mic'}
                        size={24}
                        color={isListening ? '#ff3b30' : '#007AFF'}
                    />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={styles.webView}
                onNavigationStateChange={(navState) => {
                    setCurrentUrl(navState.url);
                }}
            />

            {/* Feedback Panel */}
            {showFeedback && (
                <Animated.View style={[styles.feedbackPanel, { opacity: feedbackOpacity }]}>
                    {transcript ? (
                        <ThemedText style={styles.transcript}>"{transcript}"</ThemedText>
                    ) : null}

                    <View style={styles.statusRow}>
                        <ThemedText style={styles.status}>{status}</ThemedText>
                        {isProcessing && <ActivityIndicator size="small" style={styles.spinner} />}
                    </View>
                </Animated.View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    urlBar: {
        flex: 1,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    voiceButton: {
        width: 44,
        height: 44,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
    },
    voiceButtonActive: {
        backgroundColor: '#ffe5e5',
    },
    webView: {
        flex: 1,
    },
    feedbackPanel: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    transcript: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    status: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    spinner: {
        marginLeft: 8,
    },
});
