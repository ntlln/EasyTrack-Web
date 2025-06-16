"use client";

import { Box, Typography, Grid, TextField, Button, MenuItem, Alert, Snackbar } from "@mui/material";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createUser } from './actions';

export default function Page() {
    // Client setup
    const router = useRouter();
    const supabase = createClientComponentClient();

    // State setup
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({ email: "", role_id: "" });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);

    // Data fetching
    useEffect(() => {
        const fetchRoles = async () => {
            const { data, error } = await supabase.from('profiles_roles').select('*');
            if (!error && data) setRoles(data);
        };
        fetchRoles();
    }, []);

    // Event handlers
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.email || !formData.role_id) {
            setSnackbar({ open: true, message: "Please fill in all required fields", severity: 'error' });
            setLoading(false);
            return;
        }

        try {
            await createUser(formData);
            setSnackbar({ open: true, message: "Account created successfully! Login credentials have been sent to the user's email.", severity: 'success' });
            setFormData({ email: "", role_id: "" });
            setTimeout(() => router.push('/egc-admin/user-management'), 1500);
        } catch (error) {
            setSnackbar({ open: true, message: error.message || "An error occurred during signup", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Styles
    const containerStyles = { width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: "background.default" };
    const formContainerStyles = { display: "flex", flexDirection: "column", width: { xs: '90vw', sm: '400px', md: '50vh' }, backgroundColor: "background.default", boxShadow: 5, borderRadius: 3, alignItems: "center", pt: 5, pb: 5, gap: 2 };
    const titleStyles = { color: "primary", fontWeight: "bold", mb: 2, align: "center" };
    const formStyles = { width: '100%' };
    const gridItemStyles = { width: '70%' };
    const buttonContainerStyles = { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 2 };
    const buttonStyles = { height: "50px" };
    const alertStyles = { width: '100%' };

    return (
        <Box sx={containerStyles}>
            <Box sx={formContainerStyles}>
                <Typography variant="h4" component="h1" sx={titleStyles}>Create New Account</Typography>
                <form onSubmit={handleSubmit} style={formStyles}>
                    <Grid container spacing={3} direction="column" alignItems="center">
                        <Grid item xs={12} sx={gridItemStyles}>
                            <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        </Grid>
                        <Grid item xs={12} sx={gridItemStyles}>
                            <TextField fullWidth select placeholder="Select Role" label="Role" name="role_id" value={formData.role_id} onChange={handleChange} required>
                                <MenuItem value="" disabled>Select a role</MenuItem>
                                {roles.map((role) => (
                                    <MenuItem key={role.id} value={role.id}>{role.role_name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sx={gridItemStyles}>
                            <Box sx={buttonContainerStyles}>
                                <Button variant="outlined" onClick={() => setFormData({ email: "", role_id: "" })} fullWidth sx={buttonStyles} disabled={loading}>Clear</Button>
                                <Button type="submit" variant="contained" color="primary" fullWidth sx={buttonStyles} disabled={loading}>
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={alertStyles}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}