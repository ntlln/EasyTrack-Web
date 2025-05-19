"use client";

import {
  Box, Typography, Button, TextField, Checkbox,
  Snackbar, Alert, CircularProgress
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  getLoginStatus,
  incrementLoginAttempt,
  resetLoginAttempts,
  MAX_ATTEMPTS,
  COOLDOWN_MINUTES
} from "@/utils/auth";

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState({ canAttempt: true, remainingTime: 0, attempts: 0 });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/egc-admin/");
    };
    checkSession();
  }, []);

  useEffect(() => {
    setLoginStatus(getLoginStatus(email));
  }, [email]);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSnackbar({ open: false, message: "", severity: "error" });

    const status = getLoginStatus(email);
    if (!status.canAttempt) {
      setSnackbar({
        open: true,
        message: `Too many failed attempts. Please wait ${status.remainingTime} minutes.`,
        severity: "error",
      });
      setEmail(""); setPassword(""); setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const attempts = incrementLoginAttempt(email);
        const remaining = MAX_ATTEMPTS - attempts;

        setSnackbar({
          open: true,
          message: remaining > 0
            ? `Invalid credentials. ${remaining} attempts remaining.`
            : `Too many failed attempts. Please wait ${COOLDOWN_MINUTES} minutes.`,
          severity: "error",
        });

        setPassword("");
        setIsLoading(false);
        setLoginStatus(getLoginStatus(email));
        return;
      }

      const userId = data.user.id;

      const { data: adminRole } = await supabase
        .from("profiles_roles")
        .select("id")
        .eq("role_name", "Administrator")
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("role_id, profiles_status(status_name)")
        .eq("id", userId)
        .single();

      if (!adminRole || !profile) {
        await supabase.auth.signOut();
        throw new Error("User role or profile not found.");
      }

      if (profile.profiles_status?.status_name === "Deactivated") {
        await supabase.auth.signOut();
        throw new Error("This account has been deactivated.");
      }

      if (Number(profile.role_id) !== Number(adminRole.id)) {
        await supabase.auth.signOut();
        setSnackbar({ 
          open: true, 
          message: "Access denied: Only administrators can log in here.", 
          severity: "error" 
        });
        setEmail(""); setPassword(""); setIsLoading(false);
        return;
      }

      resetLoginAttempts(email);

      await supabase
        .from("profiles")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", userId);

      router.push("/egc-admin/");
    } catch (error) {
      console.error("Login error:", error);
      setSnackbar({ open: true, message: error.message || "Login failed", severity: "error" });
      setEmail(""); setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyles = {
    display: "flex", height: "100vh", justifyContent: "center", alignItems: "center",
    backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center"
  };
  const formContainerStyles = {
    display: "flex", flexDirection: "column", width: "50vh",
    backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2
  };
  const formStyles = {
    width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px"
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={formContainerStyles}>
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
        <Typography color="secondary.main">Login to EasyTrack</Typography>

        <form onSubmit={handleLogin} style={formStyles}>
          <TextField
            label="Email" type="email" required fullWidth
            value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            sx={{ width: "70%" }}
          />
          <TextField
            label="Password" type="password" required fullWidth
            value={password} onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || !loginStatus.canAttempt}
            sx={{ width: "70%" }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "70%" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <Typography sx={{ fontSize: ".85rem", color: "secondary.main" }}>
                Remember me
              </Typography>
            </Box>
            <Typography
              color="secondary.main"
              onClick={() => router.push("./forgot-password")}
              sx={{ fontSize: ".85rem", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              Forgot Password?
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !loginStatus.canAttempt}
            sx={{ width: "40%", position: "relative" }}
          >
            Login
            {isLoading && <CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", marginTop: -12, marginLeft: -12 }} />}
          </Button>
        </form>

        <Box sx={{ display: "flex", gap: 5 }}>
          <Typography sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>Terms</Typography>
          <Typography sx={{ fontSize: ".75rem", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>Privacy</Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}