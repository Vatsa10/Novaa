/**
 * FunctionGemma Engine for on-device inference
 * 
 * This module provides a unified interface for running FunctionGemma locally
 * across different platforms (iOS, Android, Web).
 * 
 * Architecture:
 * - iOS/Android: Uses react-native-llama (llama.cpp bindings)
 * - Web: Uses llama.cpp WASM (future)
 * - Fallback: Uses remote backend API
 */

import { Platform } from 'react-native';

// Type definitions
export interface FunctionCall {
    name: string;
    parameters: Record<string, string>;
}

export interface ModelConfig {
    modelPath?: string;
    nGpuLayers?: number;
    nCtx?: number;
    nBatch?: number;
    nThreads?: number;
}

export interface InferenceOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}

// Function declarations in FunctionGemma format
const FUNCTION_DECLARATIONS = `<start_function_declaration>declaration:open_browser{description:<escape>Opens a web browser to the specified URL<escape>,parameters:{type:<escape>OBJECT<escape>,properties:{url:{type:<escape>STRING<escape>,description:<escape>The URL to open<escape>}},required:[url]}}<end_function_declaration>
<start_function_declaration>declaration:search_web{description:<escape>Searches the web using a search engine<escape>,parameters:{type:<escape>OBJECT<escape>,properties:{query:{type:<escape>STRING<escape>,description:<escape>The search query<escape>}},required:[query]}}<end_function_declaration>
<start_function_declaration>declaration:go_back{description:<escape>Navigate back in browser history<escape>,parameters:{type:<escape>OBJECT<escape>,properties:{},required:[]}}<end_function_declaration>
<start_function_declaration>declaration:go_forward{description:<escape>Navigate forward in browser history<escape>,parameters:{type:<escape>OBJECT<escape>,properties:{},required:[]}}<end_function_declaration>
<start_function_declaration>declaration:refresh_page{description:<escape>Refresh the current page<escape>,parameters:{type:<escape>OBJECT<escape>,properties:{},required:[]}}<end_function_declaration>`;

/**
 * FunctionGemma inference engine
 */
export class FunctionGemmaEngine {
    private isLoaded: boolean = false;
    private loadError: string | null = null;
    private llamaContext: any = null;

    constructor() {
        console.log('[FunctionGemma] Engine initialized');
    }

    /**
     * Get the path to the bundled model (if it exists)
     */
    private getBundledModelPath(): string | null {
        if (Platform.OS === 'web') {
            return null; // Web doesn't support bundled assets
        }

        // For native platforms, the model should be in assets/models/
        // The exact path depends on the platform
        if (Platform.OS === 'android') {
            // Android: assets are in the APK
            return 'file:///android_asset/models/functiongemma-270m-it-Q4_K_M.gguf';
        } else if (Platform.OS === 'ios') {
            // iOS: assets are in the app bundle
            // llama.rn will handle the bundle path automatically
            return 'functiongemma-270m-it-Q4_K_M.gguf';
        }

        return null;
    }

    /**
     * Try to auto-load the bundled model
     */
    async tryLoadBundledModel(): Promise<boolean> {
        const bundledPath = this.getBundledModelPath();

        if (!bundledPath) {
            console.log('[FunctionGemma] No bundled model path for this platform');
            return false;
        }

        console.log('[FunctionGemma] Attempting to load bundled model from:', bundledPath);
        return await this.loadModel(bundledPath);
    }

    /**
     * Load the model from specified path
     * @param modelPath Path to .gguf model file
     * @param config Optional model configuration
     */
    async loadModel(modelPath: string, config?: ModelConfig): Promise<boolean> {
        try {
            console.log('[FunctionGemma] Loading model from:', modelPath);

            if (Platform.OS === 'web') {
                // Web platform - would use llama.cpp WASM
                this.loadError = 'Web platform not yet supported for on-device inference';
                console.warn('[FunctionGemma]', this.loadError);
                return false;
            }

            // Try to load llama.rn (if available)
            try {
                // Dynamic import to avoid errors if module doesn't exist
                const { initLlama } = await import('llama.rn');

                this.llamaContext = await initLlama({
                    model: modelPath,
                    use_mlock: true,
                    n_gpu_layers: config?.nGpuLayers ?? 99, // Use Metal/GPU acceleration
                    n_ctx: config?.nCtx ?? 2048,
                    n_batch: config?.nBatch ?? 512,
                    n_threads: config?.nThreads ?? 4,
                });

                this.isLoaded = true;
                this.loadError = null;
                console.log('[FunctionGemma] Model loaded successfully');
                return true;

            } catch (importError) {
                this.loadError = 'llama.rn not installed. Install with: npm install llama.rn';
                console.warn('[FunctionGemma]', this.loadError);
                return false;
            }

        } catch (error: any) {
            this.loadError = error.message;
            console.error('[FunctionGemma] Load error:', error);
            return false;
        }
    }

    /**
     * Unload the model and free resources
     */
    async unloadModel(): Promise<void> {
        if (this.llamaContext) {
            try {
                await this.llamaContext.release();
            } catch (error) {
                console.error('[FunctionGemma] Error releasing context:', error);
            }
            this.llamaContext = null;
        }
        this.isLoaded = false;
        console.log('[FunctionGemma] Model unloaded');
    }

    /**
     * Parse a user command into a structured function call
     * @param userInput Natural language command
     * @param options Inference options
     */
    async parseCommand(
        userInput: string,
        options?: InferenceOptions
    ): Promise<FunctionCall> {
        if (!this.isLoaded || !this.llamaContext) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        const prompt = this.buildPrompt(userInput);
        console.log('[FunctionGemma] Prompt:', prompt);

        try {
            // Generate response using llama.cpp
            const response = await this.llamaContext.completion({
                prompt,
                n_predict: options?.maxTokens ?? 256,
                temperature: options?.temperature ?? 0.0, // Greedy for deterministic output
                top_p: options?.topP ?? 1.0,
                stop: ['<end_of_turn>'],
            });

            console.log('[FunctionGemma] Generated:', response.text);

            // Parse the JSON response
            const functionCall = this.parseResponse(response.text);
            return functionCall;

        } catch (error: any) {
            console.error('[FunctionGemma] Inference error:', error);
            throw new Error(`Inference failed: ${error.message}`);
        }
    }

    /**
     * Check if model is loaded
     */
    isModelLoaded(): boolean {
        return this.isLoaded;
    }

    /**
     * Get last load error
     */
    getLoadError(): string | null {
        return this.loadError;
    }

    /**
     * Build the FunctionGemma prompt with function declarations
     */
    private buildPrompt(userInput: string): string {
        return `<bos><start_of_turn>developer
You are a model that can do function calling with the following functions
${FUNCTION_DECLARATIONS}
<end_of_turn>
<start_of_turn>user
${userInput}<end_of_turn>
<start_of_turn>model
`;
    }

    /**
     * Parse the model's JSON response into a FunctionCall
     */
    private parseResponse(response: string): FunctionCall {
        // Clean up response
        let cleaned = response
            .replace(/<end_of_turn>/g, '')
            .trim();

        // Find JSON object
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');

        if (startIdx === -1 || endIdx === -1) {
            throw new Error('No JSON object found in response');
        }

        cleaned = cleaned.substring(startIdx, endIdx + 1);
        console.log('[FunctionGemma] Parsing JSON:', cleaned);

        try {
            const parsed = JSON.parse(cleaned);

            // Validate structure
            if (!parsed.name || typeof parsed.name !== 'string') {
                throw new Error('Invalid function call: missing or invalid "name" field');
            }

            // Ensure parameters is an object
            const parameters: Record<string, string> = {};
            if (parsed.parameters && typeof parsed.parameters === 'object') {
                // Convert all values to strings
                for (const [key, value] of Object.entries(parsed.parameters)) {
                    parameters[key] = String(value);
                }
            }

            return {
                name: parsed.name,
                parameters,
            };

        } catch (error: any) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }
}

// Singleton instance
let engineInstance: FunctionGemmaEngine | null = null;

/**
 * Get or create the global FunctionGemma engine instance
 */
export function getFunctionGemmaEngine(): FunctionGemmaEngine {
    if (!engineInstance) {
        engineInstance = new FunctionGemmaEngine();
    }
    return engineInstance;
}

/**
 * Release the global engine instance
 */
export async function releaseFunctionGemmaEngine(): Promise<void> {
    if (engineInstance) {
        await engineInstance.unloadModel();
        engineInstance = null;
    }
}
