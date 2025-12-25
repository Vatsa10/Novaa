import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

export interface FunctionCall {
    name: string;
    parameters: Record<string, string>;
}

export const parseVoiceCommand = async (command: string): Promise<FunctionCall> => {
    try {
        const response = await axios.post(`${API_URL}/parse-command`, {
            command,
        });
        return response.data;
    } catch (error: any) {
        console.error('Voice command parsing error:', error);

        // Fallback: treat as search
        if (error.response?.status === 503) {
            throw new Error('Backend server is not running');
        }

        return {
            name: 'search_web',
            parameters: { query: command },
        };
    }
};
