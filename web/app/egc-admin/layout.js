"use client";

import Sidebar from "../components/admin-sidebar/page";
import '../globals.css';
import { usePathname } from "next/navigation";

export default function Layout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/egc-admin/login" || pathname === "/egc-admin/forgot-password";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      {!isAuthPage && <Sidebar />}

      {/* Main Content */}
      <div style={{ 
        flexGrow: 1, 
        padding: "24px", 
        marginLeft: isAuthPage ? "0" : "280px", 
        backgroundColor: "background.default", 
        minHeight: "100vh" 
      }}>
        {children}
      </div>
    </div>
  );
}
