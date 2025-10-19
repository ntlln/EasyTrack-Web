"use client";

import { useEffect, useRef, useCallback } from 'react';

const TIMEOUT_DURATION = 30 * 60 * 1000;

export function useTimeoutManager() {
    const timeoutRef = useRef(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            window.location.reload();
        }, TIMEOUT_DURATION);
    }, []);

    const handleActivity = useCallback(() => {
        resetTimeout();
    }, [resetTimeout]);

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        resetTimeout();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleActivity, resetTimeout]);

    return { resetTimeout, handleActivity };
}
