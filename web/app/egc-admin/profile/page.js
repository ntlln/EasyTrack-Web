'use client';

import React, { useEffect, useState } from 'react';
import { Box, Grid, CardContent, Typography, Button, Avatar, Paper, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from '@mui/material/styles';
import LockResetIcon from '@mui/icons-material/LockReset';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roleName, setRoleName] = useState("");
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const [resetOpen, setResetOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) return;
            const userEmail = session.user.email;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', userEmail)
                .single();
            if (data) setProfile(data);
            setLoading(false);
            // Fetch role name if role_id exists
            if (data && data.role_id) {
                const { data: roleData } = await supabase
                    .from('profiles_roles')
                    .select('role_name')
                    .eq('id', data.role_id)
                    .single();
                if (roleData && roleData.role_name) setRoleName(roleData.role_name);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;
    if (!profile) return <Box p={4}><Typography>No profile found.</Typography></Box>;

    const user = {
        fullName: `${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}`.replace(/  +/g, ' ').trim(),
        employeeId: profile.id || '',
        role: roleName || '',
        dateRegistered: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '',
        email: profile.email || '',
        password: '********',
    };

    const handleEditProfile = () => {
        router.push('/egc-admin/profile/edit-profile');
    };

    // Use theme default background for card and paper
    const cardBg = theme.palette.background.paper;
    const paperBg = theme.palette.background.paper;

    return (
        <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 2, md: 4 } }}>
            <Typography variant="h3" mb={4} color='primary.main' fontWeight={'bold'} sx={{ textAlign: 'center', fontSize: { xs: '2rem', md: '2.5rem' } }} >
                Profile
            </Typography>

            {/* Profile Card */}
            <Paper elevation={3} sx={{ mb: 4, borderRadius: 2, background: cardBg }}>
                <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
                        <Box display="flex" alignItems="center" gap={3}>
                            <Avatar alt={user.fullName} src="/avatar.png" sx={{ width: 100, height: 100, border: '2px solid', borderColor: 'primary.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {user.fullName}
                                </Typography>
                                <Typography color="primary.main" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {user.role}
                                </Typography>
                            </Box>
                        </Box>
                        <Button variant="contained" component="label" sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
                            Update Profile Picture
                            <input hidden accept="image/*" multiple type="file" />
                        </Button>
                    </Box>
                </CardContent>
            </Paper>

            {/* Information Section */}
            <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: paperBg }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                                Personal Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Full Name</Typography>
                                    <Typography fontWeight="medium">{user.fullName}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Employee ID</Typography>
                                    <Typography fontWeight="medium">{user.employeeId}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Role</Typography>
                                    <Typography fontWeight="medium">{user.role}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Date of Registration</Typography>
                                    <Typography fontWeight="medium">{user.dateRegistered}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                {/* Account Credentials */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: paperBg }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                                Account Credentials
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Email Address</Typography>
                                    <Typography fontWeight="medium">{user.email}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Password</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography fontWeight="medium">{user.password}</Typography>
                                        <IconButton color="primary" aria-label="Reset Password" onClick={() => setResetOpen(true)}>
                                            <LockResetIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box display="flex" gap={2} mt={4} flexWrap="wrap" justifyContent="center">
                <Button variant="contained" onClick={handleEditProfile} sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1 }}>Edit Profile</Button>
                <Button variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1 }}>Delete Account</Button>
            </Box>

            {/* Reset Password Modal */}
            <Dialog 
                open={resetOpen} 
                onClose={() => setResetOpen(false)}
                sx={{
                  '& .MuiDialog-paper': {
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
                    border: 'none !important',
                    outline: 'none !important',
                    borderWidth: '0 !important',
                    borderStyle: 'none !important',
                    borderColor: 'transparent !important',
                    boxShadowColor: 'transparent',
                    boxShadowInset: 'none',
                  }
                }}
            >
                <DialogTitle variant="h5" sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, textAlign: 'center', border: 'none', outline: 'none' }}>Change Password</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 350, pt: 3, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                    <Typography fontSize={14} color={theme.palette.text.secondary}>Change your password</Typography>
                    <TextField label="Email" type="email" placeholder="Enter your email" required sx={{ width: "100%" }} />
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1.5, alignItems: 'center', justifyContent: 'center', pb: 2, bgcolor: theme.palette.background.paper }}>
                    <Button sx={{ width: '70%' }} variant="contained" color="primary">Send Reset Link</Button>
                    <Button sx={{ width: '70%' }} onClick={() => setResetOpen(false)} color="secondary">Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}