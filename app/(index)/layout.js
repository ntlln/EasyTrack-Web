"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function IndexLayout({ children }) {
    const pathname = usePathname();

    // Update document title when pathname changes
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.title = getPageTitle();
        }
    }, [pathname]);

    // Generate page title based on current path
    const getPageTitle = () => {
        if (!pathname) return 'EasyTrack';
        
        // Home page
        if (pathname === '/') {
            return 'EasyTrack';
        }
        
        // About page
        if (pathname === '/about') {
            return 'EasyTrack | About';
        }
        
        // Default fallback
        return 'EasyTrack';
    };

    return children;
}
