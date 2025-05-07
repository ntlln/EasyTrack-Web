"use client";

import { Box, Typography, Grid, TextField, Button, MenuItem, Alert, Snackbar } from "@mui/material";
import { useState } from "react";

export default function CreateAccount() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        role: "user"
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const roles = [
        { value: "admin", label: "Administrator" },
        { value: "manager", label: "Manager" },
        { value: "user", label: "Regular User" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password) {
            setError("Please fill in all required fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Here you would typically make an API call to create the account
        console.log("Creating account with data:", formData);

        // Show success message
        setSuccess(true);
        setError("");

        // Reset form
        setFormData({ email: "", password: "", confirmPassword: "", role: "user" });
    };

    return (
        <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: "background.default" }} >
            <Box sx={{ display: "flex", flexDirection: "column", width: { xs: '90vw', sm: '400px', md: '50vh' }, backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 }}>
                <Typography variant="h4" component="h1" color="primary" fontWeight="bold" mb={2} align="center">
                    Create New Account
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Grid container spacing={3} direction="column" alignItems="center">
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <TextField fullWidth select label="Role" name="role" value={formData.role} onChange={handleChange} required>
                                {roles.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>
                                        {role.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 2 }}>
                                <Button variant="outlined" onClick={() => setFormData({ email: "", password: "", confirmPassword: "", role: "user" })} fullWidth sx={{ height: "50px" }}>Clear</Button>
                                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ height: "50px" }}>Create Account</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Box>
            {/* Error Message */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
                <Alert severity="error" onClose={() => setError("")}>
                    {error}
                </Alert>
            </Snackbar>
            {/* Success Message */}
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert severity="success" onClose={() => setSuccess(false)}>
                    Account created successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
}