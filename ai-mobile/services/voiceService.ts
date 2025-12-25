import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getFunctionGemmaEngine, FunctionCall } from './llamaEngine';

const getBackendUrl = () => {
    if (Platform.OS === 'android' && !Constants.isDevice) {
        return 'http://10.0.2.2:8000';
    }

    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:8000`;
    }

    return 'http://localhost:8000';
}

const API_URL = getBackendUrl();

export type { FunctionCall };

export enum InferenceMode {
    ON_DEVICE = 'on_device',
    BACKEND = 'backend',
    AUTO = 'auto',
}

let currentMode: InferenceMode = InferenceMode.AUTO;
let onDeviceAvailable = false;
let autoInitAttempted = false;

/**
 * Auto-initialize on-device inference with bundled model
 * Call this on app startup
 */
export async function autoInitializeOnDevice(): Promise<boolean> {
    if (autoInitAttempted) {
        return onDeviceAvailable;
    }

    autoInitAttempted = true;
    console.log('[VoiceService] Auto-initializing on-device inference...');

    try {
        const engine = getFunctionGemmaEngine();
        const success = await engine.tryLoadBundledModel();

        if (success) {
            onDeviceAvailable = true;
            console.log('[VoiceService] Bundled model loaded successfully!');
            return true;
        } else {
            console.log('[VoiceService] No bundled model found or failed to load');
            return false;
        }
    } catch (error) {
        console.warn('[VoiceService] Auto-init failed:', error);
        return false;
    }
}

/**
 * Initialize on-device inference
 * @param modelPath Path to the .gguf model file
 * @returns true if successful
 */
export async function initializeOnDeviceInference(modelPath: string): Promise<boolean> {
    try {
        const engine = getFunctionGemmaEngine();
        const success = await engine.loadModel(modelPath);

        if (success) {
            onDeviceAvailable = true;
            console.log('[VoiceService] On-device inference initialized');
            return true;
        } else {
            console.warn('[VoiceService] On-device inference failed:', engine.getLoadError());
            return false;
        }
    } catch (error) {
        console.error('[VoiceService] Failed to initialize on-device inference:', error);
        return false;
    }
}

/**
 * Set the inference mode
 */
export function setInferenceMode(mode: InferenceMode): void {
    currentMode = mode;
    console.log('[VoiceService] Inference mode set to:', mode);
}

/**
 * Get current inference mode
 */
export function getInferenceMode(): InferenceMode {
    return currentMode;
}

/**
 * Check if on-device inference is available
 */
export function isOnDeviceAvailable(): boolean {
    return onDeviceAvailable;
}

/**
 * Parse voice command using on-device inference
 */
async function parseCommandOnDevice(command: string): Promise<FunctionCall> {
    const engine = getFunctionGemmaEngine();

    if (!engine.isModelLoaded()) {
        throw new Error('On-device model not loaded');
    }

    return await engine.parseCommand(command);
}

/**
 * Parse voice command using backend API
 */
async function parseCommandViaBackend(command: string): Promise<FunctionCall> {
    try {
        const response = await axios.post(`${API_URL}/parse-command`, {
            command,
        }, {
            timeout: 10000, // 10 second timeout
        });
        return response.data;
    } catch (error: any) {
        console.error('Backend parsing error:', error);

        if (error.response?.status === 503) {
            throw new Error('Backend server is not running');
        }

        // Fallback: treat as search
        return {
            name: 'search_web',
            parameters: { query: command },
        };
    }
}

/**
 * Parse voice command with automatic fallback
 * 
 * Strategy:
 * 1. If mode is ON_DEVICE: use on-device only
 * 2. If mode is BACKEND: use backend only
 * 3. If mode is AUTO: try on-device first, fallback to backend
 */
export async function parseVoiceCommand(command: string): Promise<FunctionCall> {
    console.log(`[VoiceService] Parsing command (mode: ${currentMode}):`, command);

    try {
        switch (currentMode) {
            case InferenceMode.ON_DEVICE:
                return await parseCommandOnDevice(command);

            case InferenceMode.BACKEND:
                return await parseCommandViaBackend(command);

            case InferenceMode.AUTO:
            default:
                // Try on-device first if available
                if (onDeviceAvailable) {
                    try {
                        const result = await parseCommandOnDevice(command);
                        console.log('[VoiceService] Used on-device inference');
                        return result;
                    } catch (onDeviceError) {
                        console.warn('[VoiceService] On-device failed, falling back to backend:', onDeviceError);
                        // Fall through to backend
                    }
                }

                // Fallback to backend
                const result = await parseCommandViaBackend(command);
                console.log('[VoiceService] Used backend inference');
                return result;
        }
    } catch (error: any) {
        console.error('[VoiceService] All parsing methods failed:', error);
        throw error;
    }
}

/**
 * Get inference statistics
 */
export function getInferenceStats(): {
    mode: InferenceMode;
    onDeviceAvailable: boolean;
    backendUrl: string;
} {
    return {
        mode: currentMode,
        onDeviceAvailable,
        backendUrl: API_URL,
    };
}
