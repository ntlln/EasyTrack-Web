"use client"
import { Box, Typography, Button, TextField } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const router = useRouter()
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        router.push("/egc-admin/dashboard");
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (pathname === "/egc-admin/login") {
        const userId = data.user.id;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role_id')
          .eq('id', userId)
          .single();
        if (profileError || !profile) {
          setError("Unable to fetch user profile.");
          setLoading(false);
          return;
        }
        const { data: adminRole, error: adminRoleError } = await supabase
          .from('profiles_roles')
          .select('id')
          .eq('role_name', 'Administrator')
          .single();
        if (adminRoleError || !adminRole) {
          setError("Unable to verify admin role.");
          setLoading(false);
          return;
        }
        if (profile.role_id !== adminRole.id) {
          setError("Access denied: Only administrators can log in here.");
          setLoading(false);
          return;
        }

        // Update last_sign_in_at
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating last sign in:', updateError);
        }
      }
      router.push("./");
    }
  };

  return (
    <Box sx={{ display: "flex", width: "auto", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%" }} >

      <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2, }} >
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }} >EasyTrack</Typography>
        <Typography color="secondary.main" >Login to EasyTrack</Typography>

        <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "70%" }}
          value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />

        <TextField label="Password" type="password" placeholder="Enter your password" required sx={{ width: "70%" }}
          value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "70%" }}>
          <Typography color="secondary.main" onClick={() => router.push("./forgot-password")} sx={{ fontSize: ".85rem", textDecoration: "none", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Forgot Password?</Typography>
        </Box>

        {error && <Typography color="error" sx={{ width: "70%", textAlign: "center" }}>{error}</Typography>}

        <Button variant="contained" color="primary" sx={{ width: "40%" }} onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Box sx={{ display: "flex", gap: 5 }}>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", textDecoration: "none", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Terms and Conditions</Typography>
          <Typography color="secondary.main" sx={{ fontSize: ".75rem", textDecoration: "none", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>Privacy Policy</Typography>
        </Box>
      </Box>
    </Box>
  )
}