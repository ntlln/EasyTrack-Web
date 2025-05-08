"use client";

import Sidebar from "../components/admin-sidebar/page";
import '../globals.css';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [checkingSession, setCheckingSession] = useState(true);
  const isAuthPage = pathname === "/egc-admin/login" || pathname === "/egc-admin/forgot-password";

  useEffect(() => {
    if (isAuthPage) {
      setCheckingSession(false);
      return;
    }
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        router.replace("/egc-admin/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', session.user.id)
        .single();
      const { data: adminRole } = await supabase
        .from('profiles_roles')
        .select('id')
        .eq('role_name', 'Administrator')
        .single();
      if (!profile || !adminRole || Number(profile.role_id) !== Number(adminRole.id)) {
        router.replace("/egc-admin/login");
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [pathname]);

  if (checkingSession) {
    return null; // or a loading spinner
  }

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
