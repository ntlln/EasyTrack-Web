"use client"
import { Box, Typography, Button, TextField } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter()
  return (
    <Box sx={{ display: "flex", width: "auto", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%" }} >

      <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2, }} >
        <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }} >EasyTrack</Typography>
        <Typography color="secondary.main" >Reset Password</Typography>

        <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "70%" }} />

        <Button variant="contained" color="primary" sx={{ width: "40%" }} onClick={() => router.push("./")}>Login</Button>

        <Typography color="secondary.main" sx={{ fontSize: "1rem", textDecoration: "none", cursor: "pointer", "&:hover": { textDecoration: "underline", color: "primary.main" } }}>Back to Login</Typography>
      </Box>
    </Box>
  )
}