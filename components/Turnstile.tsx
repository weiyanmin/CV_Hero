"use client";

import { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
    onVerify: (token: string) => void;
    onError?: () => void;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: {
                sitekey: string;
                callback: (token: string) => void;
                'error-callback'?: () => void;
                theme?: 'light' | 'dark' | 'auto';
                size?: 'normal' | 'compact';
            }) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onloadTurnstileCallback?: () => void;
    }
}

export default function Turnstile({ onVerify, onError }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const renderWidget = useCallback(() => {
        if (!siteKey) {
            console.warn("Turnstile site key not configured, auto-verifying");
            onVerify("dev-mode-token");
            return;
        }

        if (containerRef.current && window.turnstile && !widgetIdRef.current) {
            try {
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: (token: string) => {
                        console.log("Turnstile verified!");
                        onVerify(token);
                    },
                    'error-callback': () => {
                        console.error("Turnstile error");
                        onError?.();
                    },
                    theme: 'light',
                    size: 'normal',
                });
                console.log("Turnstile widget rendered:", widgetIdRef.current);
            } catch (e) {
                console.error("Failed to render Turnstile:", e);
            }
        }
    }, [siteKey, onVerify, onError]);

    useEffect(() => {
        // If no site key, auto-verify immediately
        if (!siteKey) {
            console.warn("No Turnstile site key, using dev mode");
            onVerify("dev-mode-token");
            return;
        }

        // Check if script is already loaded
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (existingScript) {
            // Script exists, wait for it to load
            const checkInterval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(checkInterval);
                    renderWidget();
                }
            }, 100);
            return () => clearInterval(checkInterval);
        }

        // Load the script
        if (!scriptLoadedRef.current) {
            scriptLoadedRef.current = true;

            window.onloadTurnstileCallback = () => {
                console.log("Turnstile script loaded!");
                renderWidget();
            };

            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
            script.async = true;
            document.head.appendChild(script);
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [siteKey, renderWidget, onVerify]);

    // Don't render container if no siteKey (dev mode)
    if (!siteKey) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            id="turnstile-container"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '1rem 0',
                minHeight: '65px', // Reserve space for widget
                maxWidth: '100%',
                overflow: 'hidden',
                transform: 'scale(0.9)',
                transformOrigin: 'center center'
            }}
        />
    );
}
