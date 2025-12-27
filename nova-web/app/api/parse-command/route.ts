import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

const SYSTEM_PROMPT = `You are a browser command parser. Convert natural language commands into structured function calls.

Available functions:
1. open_browser(url: string) - Navigate to a URL
2. search_web(query: string) - Search Google
3. go_back() - Browser back
4. go_forward() - Browser forward
5. refresh_page() - Reload page

Return ONLY valid JSON in this format:
{"name": "function_name", "parameters": {"param": "value"}}

Examples:
"open google" → {"name": "open_browser", "parameters": {"url": "google.com"}}
"search for cats" → {"name": "search_web", "parameters": {"query": "cats"}}
"go back" → {"name": "go_back", "parameters": {}}`;

export async function POST(request: NextRequest) {
    try {
        const { command } = await request.json();

        if (!command || typeof command !== 'string') {
            return NextResponse.json(
                { error: 'Invalid command' },
                { status: 400 }
            );
        }

        // Call Ollama with FunctionGemma
        const response = await ollama.generate({
            model: 'functiongemma',
            prompt: `${SYSTEM_PROMPT}\n\nUser command: "${command}"\n\nFunction call:`,
            stream: false,
            options: {
                temperature: 0.0, // Greedy sampling for deterministic output
                num_predict: 100,
            },
        });

        // Parse the response
        let functionCall;
        try {
            const jsonMatch = response.response.match(/\{[^}]+\}/);
            if (jsonMatch) {
                functionCall = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // Fallback to search
            console.warn('Failed to parse function call, falling back to search:', parseError);
            functionCall = {
                name: 'search_web',
                parameters: { query: command },
            };
        }

        return NextResponse.json(functionCall);

    } catch (error: any) {
        console.error('Ollama API error:', error);

        // Check if Ollama is running
        if (error.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { error: 'Ollama is not running. Please start Ollama and pull functiongemma model.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to process command' },
            { status: 500 }
        );
    }
}
