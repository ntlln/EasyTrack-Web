"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function IndexLayout({ children }) {
    const pathname = usePathname();

    useEffect(() => {
        document.title = pathname === '/about' ? 'EasyTrack | About' : 'EasyTrack';
    }, [pathname]);

    return children;
}
