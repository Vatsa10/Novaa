import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface VoiceRecognitionResult {
    transcript: string;
    isFinal: boolean;
}

export interface VoiceRecognitionHook {
    isListening: boolean;
    transcript: string;
    error: string | null;
    isSupported: boolean;
    startListening: () => Promise<void>;
    stopListening: () => void;
}

export const useVoiceRecognition = (
    onResult?: (result: VoiceRecognitionResult) => void
): VoiceRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    // For web Speech API
    const webRecognitionRef = useRef<any>(null);

    // Check platform support
    useEffect(() => {
        const checkSupport = async () => {
            if (Platform.OS === 'web') {
                // Check for Web Speech API
                setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
            } else {
                // Check for expo-speech-recognition support
                try {
                    const result = await ExpoSpeechRecognitionModule.getStateAsync();
                    setIsSupported(true);
                } catch (e) {
                    setIsSupported(false);
                }
            }
        };

        checkSupport();
    }, []);

    // Initialize Web Speech API (for web platform)
    useEffect(() => {
        if (Platform.OS === 'web' && isSupported) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

            if (SpeechRecognition) {
                webRecognitionRef.current = new SpeechRecognition();
                webRecognitionRef.current.continuous = false;
                webRecognitionRef.current.interimResults = true;
                webRecognitionRef.current.lang = 'en-US';

                webRecognitionRef.current.onresult = (event: any) => {
                    const result = event.results[event.results.length - 1];
                    const transcriptText = result[0].transcript;
                    setTranscript(transcriptText);

                    if (onResult) {
                        onResult({
                            transcript: transcriptText,
                            isFinal: result.isFinal,
                        });
                    }
                };

                webRecognitionRef.current.onerror = (event: any) => {
                    console.error('Web Speech recognition error:', event.error);
                    setError(event.error);
                    setIsListening(false);
                };

                webRecognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (webRecognitionRef.current) {
                try {
                    webRecognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }
        };
    }, [isSupported, onResult]);

    // Handle native speech recognition events (iOS/Android)
    useSpeechRecognitionEvent('start', () => {
        setIsListening(true);
        setError(null);
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
    });

    useSpeechRecognitionEvent('result', (event) => {
        const transcriptText = event.results[0]?.transcript || '';
        setTranscript(transcriptText);

        if (onResult) {
            onResult({
                transcript: transcriptText,
                isFinal: event.isFinal,
            });
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.error('Native speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
    });

    const startListening = useCallback(async () => {
        setError(null);
        setTranscript('');

        if (Platform.OS === 'web') {
            // Web Speech API
            if (webRecognitionRef.current) {
                try {
                    webRecognitionRef.current.start();
                    setIsListening(true);
                } catch (e: any) {
                    setError(e.message);
                    console.error('Failed to start web recognition:', e);
                }
            }
        } else {
            // Native (iOS/Android)
            try {
                // Request permissions
                const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

                if (status !== 'granted') {
                    setError('Microphone permission denied');
                    return;
                }

                // Start recognition
                await ExpoSpeechRecognitionModule.start({
                    lang: 'en-US',
                    interimResults: true,
                    maxAlternatives: 1,
                    continuous: false,
                    requiresOnDeviceRecognition: false,
                    addsPunctuation: false,
                    contextualStrings: [
                        'open',
                        'search',
                        'go back',
                        'go forward',
                        'refresh',
                        'google',
                        'youtube',
                        'wikipedia',
                    ],
                });

                setIsListening(true);
            } catch (e: any) {
                setError(e.message);
                console.error('Failed to start native recognition:', e);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (Platform.OS === 'web') {
            if (webRecognitionRef.current) {
                try {
                    webRecognitionRef.current.stop();
                } catch (e) {
                    console.error('Failed to stop web recognition:', e);
                }
            }
        } else {
            try {
                ExpoSpeechRecognitionModule.stop();
            } catch (e) {
                console.error('Failed to stop native recognition:', e);
            }
        }
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
    };
};
