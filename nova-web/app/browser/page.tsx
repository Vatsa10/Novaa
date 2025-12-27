'use client';

import { useState, useRef, useEffect } from 'react';

interface FunctionCall {
    name: string;
    parameters: Record<string, string>;
}

export default function VoiceBrowser() {
    const [url, setUrl] = useState('https://www.google.com');
    const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const recognitionRef = useRef<any>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const result = event.results[event.results.length - 1];
                    const transcriptText = result[0].transcript;
                    setTranscript(transcriptText);

                    if (result.isFinal) {
                        processVoiceCommand(transcriptText);
                    } else {
                        showFeedbackPanel(transcriptText, 'Listening...');
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setStatus(`Error: ${event.error}`);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    const handleVoiceButtonClick = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setStatus('Listening...');
            setShowFeedback(true);
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const processVoiceCommand = async (command: string) => {
        setIsProcessing(true);
        setStatus('Processing...');
        showFeedbackPanel(command, 'Processing...');

        try {
            const response = await fetch('/api/parse-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to process command');
            }

            const functionCall: FunctionCall = await response.json();
            executeFunction(functionCall, command);

        } catch (error: any) {
            showFeedbackPanel(command, `Error: ${error.message}`, true);
        } finally {
            setIsProcessing(false);
        }
    };

    const executeFunction = (functionCall: FunctionCall, originalCommand: string) => {
        console.log('[VoiceBrowser] Executing:', functionCall.name, functionCall.parameters);

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
                window.history.back();
                break;

            case 'go_forward':
                showFeedbackPanel(originalCommand, 'Going forward...');
                window.history.forward();
                break;

            case 'refresh_page':
                showFeedbackPanel(originalCommand, 'Refreshing page...');
                if (iframeRef.current) {
                    iframeRef.current.src = currentUrl;
                }
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

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUrl.trim()) {
            const normalized = normalizeURL(currentUrl);
            loadURL(normalized);
        }
    };

    const showFeedbackPanel = (transcriptText: string, statusText: string, isError = false) => {
        setTranscript(transcriptText);
        setStatus(statusText);
        setShowFeedback(true);

        if (isError) {
            scheduleFeedbackHide(5000);
        }
    };

    const scheduleFeedbackHide = (delay = 3000) => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            setShowFeedback(false);
        }, delay);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Navigation Bar */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 p-4">
                    <form onSubmit={handleUrlSubmit} className="flex-1">
                        <input
                            type="text"
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            placeholder="Enter URL or use voice command"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>

                    <button
                        onClick={handleVoiceButtonClick}
                        disabled={isProcessing}
                        className={`p-3 rounded-full transition-colors ${isListening
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isListening ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <rect x="6" y="6" width="8" height="8" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* WebView (iframe) */}
            <iframe
                ref={iframeRef}
                src={url}
                className="flex-1 w-full border-0"
                title="Browser"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />

            {/* Feedback Panel */}
            {showFeedback && (
                <div className="fixed bottom-6 left-6 right-6 bg-white rounded-xl shadow-lg p-4 border border-gray-200 animate-fade-in">
                    {transcript && (
                        <p className="text-base font-semibold text-gray-900 mb-2">
                            &quot;{transcript}&quot;
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <p className={`text-sm ${status.includes('Error') ? 'text-red-600' : 'text-gray-600'}`}>
                            {status}
                        </p>
                        {isProcessing && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
