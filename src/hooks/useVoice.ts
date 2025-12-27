'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    error: string | null;
}

export default function useVoice() {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        isSpeaking: false,
        transcript: '',
        error: null,
    });

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';
            }

            synthesisRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = useCallback((text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!synthesisRef.current) {
                setState(prev => ({ ...prev, error: 'Speech Synthesis not supported' }));
                resolve();
                return;
            }

            // Stop any current speech
            synthesisRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setState(prev => ({ ...prev, isSpeaking: true }));
            utterance.onend = () => {
                setState(prev => ({ ...prev, isSpeaking: false }));
                resolve();
            };
            utterance.onerror = (e) => {
                console.error('SpeechSynthesis error:', e);
                setState(prev => ({ ...prev, isSpeaking: false, error: 'Speech Synthesis failed' }));
                resolve();
            };

            synthesisRef.current.speak(utterance);
        });
    }, []);

    const listen = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!recognitionRef.current) {
                setState(prev => ({ ...prev, error: 'Speech Recognition not supported' }));
                reject('Not supported');
                return;
            }

            // If already listening, stop it first to reset
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // ignore
            }

            recognitionRef.current.onstart = () => {
                setState(prev => ({ ...prev, isListening: true, transcript: '', error: null }));
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setState(prev => ({ ...prev, transcript }));
                resolve(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    // No speech detected, resolve empty
                    resolve('');
                } else if (event.error === 'aborted') {
                    // Recognition was intentionally stopped
                    reject('aborted');
                } else if (event.error === 'audio-capture') {
                    const errorMsg = 'Microphone capture failed. Please ensure your microphone is connected and you have granted permission.';
                    setState(prev => ({ ...prev, isListening: false, error: errorMsg }));
                    reject(event.error);
                } else {
                    console.error('Speech recognition error', event.error);
                    setState(prev => ({ ...prev, isListening: false, error: `Speech recognition error: ${event.error}` }));
                    reject(event.error);
                }
            };

            recognitionRef.current.onend = () => {
                setState(prev => ({ ...prev, isListening: false }));
                // If it ended without result, resolve empty
                setTimeout(() => resolve(''), 100);
            };

            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Recognition start attempt failed:", e);
                // If it fails to start, resolve empty
                resolve('');
            }
        });
    }, []);

    const stop = useCallback(() => {
        try {
            recognitionRef.current?.stop();
        } catch (e) { }
        synthesisRef.current?.cancel();
        setState(prev => ({ ...prev, isListening: false, isSpeaking: false }));
    }, []);

    const abort = useCallback(() => {
        try {
            recognitionRef.current?.abort();
        } catch (e) { }
        synthesisRef.current?.cancel();
        setState(prev => ({ ...prev, isListening: false, isSpeaking: false }));
    }, []);

    return {
        ...state,
        speak,
        listen,
        stop,
        abort,
    };
}
