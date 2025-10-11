"use client";

import { useEffect, useRef, useCallback } from 'react';

// Timeout duration in milliseconds (30 minutes)
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export function useTimeoutManager() {
    const timeoutRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Reset the timeout
    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        lastActivityRef.current = Date.now();
        
        timeoutRef.current = setTimeout(() => {
            try {
                // Force page refresh instead of logout
                console.log('System refresh due to inactivity');
                window.location.reload();
            } catch (error) {
                console.error('Error during system refresh:', error);
                // Fallback: force page refresh
                window.location.reload();
            }
        }, TIMEOUT_DURATION);
    }, []);

    // Handle user activity
    const handleActivity = useCallback(() => {
        resetTimeout();
    }, [resetTimeout]);

    // Set up event listeners for user activity
    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initial timeout setup
        resetTimeout();

        // Cleanup function
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleActivity, resetTimeout]);

    // Return the reset function for manual use
    return { resetTimeout, handleActivity };
}
