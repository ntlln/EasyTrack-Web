"use client";

import { Box, Typography, Grid, TextField, Button, MenuItem, Alert, Snackbar } from "@mui/material";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CreateAccount() {
    const supabase = createClientComponentClient();
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        const fetchRoles = async () => {
            const { data, error } = await supabase.from('profiles_roles').select('*');
            if (!error && data) {
                setRoles(data);
            }
        };
        fetchRoles();
    }, []);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        role_id: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Basic validation
        if (!formData.email || !formData.password || !formData.role_id) {
            setError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Sign up the user with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (authError) throw authError;

            // Create a profile record in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email: formData.email,
                        role_id: formData.role_id
                    }
                ]);

            if (profileError) throw profileError;

            // Show success message
            setSuccess(true);
            setError("");

            // Reset form
            setFormData({ email: "", password: "", confirmPassword: "", role_id: "" });
        } catch (error) {
            setError(error.message || "An error occurred during signup");
        } finally {
            setLoading(false);
        }
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
                            <TextField
                                fullWidth
                                select
                                placeholder="Select Role"
                                label="Role"
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="" disabled>Select a role</MenuItem>
                                {roles.map((role) => (
                                    <MenuItem key={role.id} value={role.id}>
                                        {role.role_name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sx={{ width: '70%' }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 2 }}>
                                <Button variant="outlined" onClick={() => setFormData({ email: "", password: "", confirmPassword: "", role_id: "" })} fullWidth sx={{ height: "50px" }} disabled={loading}>Clear</Button>
                                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ height: "50px" }} disabled={loading}>
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
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