"use client";

import Sidebar from "../components/contractor-sidebar/page";
import '../globals.css';
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Layout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Only check session for non-login pages
    if (pathname === "/contractor/login" || pathname === "/contractor/forgot-password" || pathname === "/contractor/reset-password") {
      setCheckingSession(false);
      return;
    }
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        router.replace("/contractor/login");
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', session.user.id)
        .single();
      const { data: contractorRole } = await supabase
        .from('profiles_roles')
        .select('id')
        .eq('role_name', 'Airline Staff')
        .single();
      if (!profile || !contractorRole || Number(profile.role_id) !== Number(contractorRole.id)) {
        router.replace("/contractor/login");
        return;
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [pathname]);

  if (checkingSession) {
    return null; // or a loading spinner
  }

  if (pathname === "/contractor/login" || pathname === "/contractor/forgot-password" || pathname === "/contractor/reset-password") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: "24px", marginLeft: "280px", backgroundColor: "background.default", minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}