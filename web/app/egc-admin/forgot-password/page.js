"use client"
import { Box, Typography, Button, TextField } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get('from') === 'profile';
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    // Try to send the reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    // (Optional) Check if the email is an admin in your profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      setSuccess("Reset link has been sent to your email.");
      setLoading(false);
      return;
    }

    // Check if admin
    const { data: adminRole, error: adminRoleError } = await supabase
      .from('profiles_roles')
      .select('id')
      .eq('role_name', 'Administrator')
      .single();

    if (adminRoleError || !adminRole || Number(profile.role_id) !== Number(adminRole.id)) {
      setSuccess("Reset link has been sent to your email.");
      setLoading(false);
      return;
    }

    setSuccess("Reset link has been sent to your email.");
    setLoading(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "auto",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url(/login-bg.png)",
        backgroundSize: "80%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundopacity: "30%"
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "50vh",
          height: "auto",
          backgroundColor: "background.default",
          boxShadow: 5,
          borderRadius: 3,
          alignItems: "center",
          pt: 5,
          pb: 5,
          gap: 2
        }}
      >
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>
          EasyTrack
        </Typography>
        <Typography color="secondary.main">Reset Password</Typography>

        <TextField
          label="Email"
          type="email"
          placeholder="Enter your email"
          required
          sx={{ width: "70%" }}
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button
          variant="contained"
          color="primary"
          sx={{ width: "40%" }}
          onClick={handleForgotPassword}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </Button>

        {error && (
          <Typography color="error" sx={{ width: "70%", textAlign: "center" }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="success.main" sx={{ width: "70%", textAlign: "center" }}>
            {success}
          </Typography>
        )}

        <Typography
          color="secondary.main"
          sx={{
            fontSize: "1rem",
            textDecoration: "none",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline", color: "primary.main" }
          }}
          onClick={() => router.push(fromProfile ? "/egc-admin/profile" : "/egc-admin/login")}
        >
          Back to {fromProfile ? "Profile" : "Login"}
        </Typography>
      </Box>
    </Box>
  )
}