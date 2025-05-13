"use client"
import { Box, Typography, Button, TextField } from "@mui/material";
import { Global } from '@emotion/react';

export default function Page() {
  return (
    <>
      <Global styles={{ 'html, body': { margin: 0, padding: 0, height: '100%', overflow: 'hidden' } }} />
      <Box sx={{ display: "flex", width: "100vw", height: "100vh", justifyContent: "center", alignItems: "center", backgroundImage: "url(/login-bg.png)", backgroundSize: "80%", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundopacity: "30%", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", width: "50vh", height: "auto", backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }}>
          <Typography variant="h3" sx={{ color: "primary.main", fontWeight: "bold" }}>EasyTrack</Typography>
          <Typography color="secondary.main">Reset Password</Typography>
          <TextField label="New Password" type="password" placeholder="Enter new password" required sx={{ width: "70%" }} />
          <TextField label="Confirm Password" type="password" placeholder="Confirm new password" required sx={{ width: "70%" }} />
          <Button variant="contained" color="primary" sx={{ width: "40%" }}>Reset Password</Button>
        </Box>
      </Box>
    </>
  );
}