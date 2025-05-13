'use client';

import React, { useEffect, useState } from 'react';
import { Box, Grid, CardContent, Typography, Button, Avatar, Paper, IconButton, Alert, CircularProgress, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from '@mui/material/styles';
import LockResetIcon from '@mui/icons-material/LockReset';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const theme = useTheme();

    // Profile states
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    // Loading states
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // UI states
    const [resetOpen, setResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ message: '', severity: '' });
    const [uploadError, setUploadError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const email = session.user.email;
        setUserEmail(email);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (data) {
            setProfile(data);
            await fetchProfileImage(data);
            await fetchRoleName(data.role_id);
        }
        setLoading(false);
    };

    const fetchProfileImage = async (profileData) => {
        if (!profileData['pfp_id']) {
            setProfileImage(null);
            return;
        }

        try {
            const cleanFileName = profileData['pfp_id'].trim();
            const filePath = `admin/${cleanFileName}`;

            const { data: signedData, error: signedError } = await supabase
                .storage
                .from('profile-images')
                .createSignedUrl(filePath, 60 * 60);

            if (signedError || !signedData?.signedUrl) {
                setProfileImage(null);
                return;
            }

            setProfileImage(signedData.signedUrl);
        } catch (error) {
            console.error('Error fetching profile image:', error);
            setProfileImage(null);
        }
    };

    const fetchRoleName = async (roleId) => {
        if (!roleId) return;

        const { data: roleData } = await supabase
            .from('profiles_roles')
            .select('role_name')
            .eq('id', roleId)
            .single();

        if (roleData?.role_name) {
            setRoleName(roleData.role_name);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please upload an image file');
            setSnackbarOpen(true);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size should be less than 5MB');
            setSnackbarOpen(true);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            await deleteOldProfileImage();
            await uploadNewProfileImage(file);
        } catch (error) {
            setUploadError(error.message || 'Failed to upload image');
            setSnackbarOpen(true);
        } finally {
            setUploading(false);
        }
    };

    const deleteOldProfileImage = async () => {
        if (!profile?.['pfp_id']) return;

        const oldFileName = profile['pfp_id'].trim();
        const oldFilePath = `admin/${oldFileName}`;

        const { error: deleteError } = await supabase.storage
            .from('profile-images')
            .remove([oldFilePath]);

        if (deleteError) {
            console.warn('Could not delete old profile image:', deleteError.message);
        }
    };

    const uploadNewProfileImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `admin/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(filePath, file, {
                upsert: true,
                cacheControl: '3600'
            });

        if (uploadError) throw new Error(uploadError.message);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ ['pfp_id']: fileName })
            .eq('id', profile.id);

        if (updateError) throw new Error('Failed to update profile with new image');

        const { data: signedData, error: urlError } = await supabase
            .storage
            .from('profile-images')
            .createSignedUrl(filePath, 60 * 60);

        if (urlError || !signedData?.signedUrl) throw new Error('Failed to generate signed URL');

        setProfileImage(signedData.signedUrl);
    };

    const handleResetPassword = async () => {
        setResetLoading(true);
        setResetStatus({ message: '', severity: '' });

        if (resetEmail !== userEmail) {
            setResetStatus({ message: 'Please enter your registered email address', severity: 'error' });
            setResetLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/egc-admin/profile/reset-password`,
            });

            if (error) throw error;

            setResetStatus({ message: 'Password reset link sent to your email', severity: 'success' });
            setTimeout(() => {
                setResetOpen(false);
                setResetStatus({ message: '', severity: '' });
                setResetEmail('');
            }, 2000);

        } catch (error) {
            setResetStatus({ message: error.message || 'Failed to send reset link', severity: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    const handleSnackbarClose = (_, reason) => {
        if (reason !== 'clickaway') setSnackbarOpen(false);
    };

    const handleEditProfile = () => {
        router.push('/egc-admin/profile/edit-profile');
    };

    if (loading) return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
        >
            <CircularProgress color="primary" />
        </Box>
    );

    if (!profile) return <Box p={4}><Typography>No profile found.</Typography></Box>;

    const user = {
        fullName: `${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}`.replace(/  +/g, ' ').trim(),
        employeeId: profile.id || '',
        role: roleName || '',
        dateRegistered: profile.created_at ? new Date(profile.created_at).toLocaleString() : '',
        email: profile.email || '',
        password: '********',
        contactNumber: profile.contact_number || 'Not provided',
        birthDate: profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'Not provided',
        emergencyContact: profile.emergency_contact_name || 'Not provided',
        emergencyContactNumber: profile.emergency_contact_number || 'Not provided',
    };

    return (
        <Box pt={2} px={4} display="flex" flexDirection="column" gap={4}>
            <Box width="100%" maxWidth="1000px">
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                    Profile
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ borderRadius: 2, background: theme.palette.background.paper }}>
                <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
                        <Box display="flex" alignItems="center" gap={3}>
                            <Box position="relative">
                                <Avatar
                                    alt={user.fullName}
                                    src={profileImage || "/avatar.png"}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        border: '2px solid',
                                        borderColor: 'primary.main'
                                    }}
                                />
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="profile-image-upload"
                                    type="file"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <label htmlFor="profile-image-upload">
                                    <IconButton
                                        component="span"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                        }}
                                        disabled={uploading}
                                    >
                                        {uploading ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraIcon />}
                                    </IconButton>
                                </label>
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {user.fullName}
                                </Typography>
                                <Typography color="primary.main" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                    {user.role}
                                </Typography>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <Button
                                variant="contained"
                                onClick={handleEditProfile}
                                sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                            >
                                Edit Profile
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: theme.palette.background.paper }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                                Personal Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Employee ID</Typography>
                                    <Typography fontWeight="medium">{user.employeeId}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Full Name</Typography>
                                    <Typography fontWeight="medium">{user.fullName}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Contact Number</Typography>
                                    <Typography fontWeight="medium">{user.contactNumber}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Birth Date</Typography>
                                    <Typography fontWeight="medium">{user.birthDate}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: theme.palette.background.paper }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                                Emergency Contact Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Emergency Contact Name</Typography>
                                    <Typography fontWeight="medium">{user.emergencyContact}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Emergency Contact Number</Typography>
                                    <Typography fontWeight="medium">{user.emergencyContactNumber}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: theme.palette.background.paper }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 }}>
                                Account Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Email Address</Typography>
                                    <Typography fontWeight="medium">{user.email}</Typography>
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" fontSize="0.9rem">Password</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography fontWeight="medium">********</Typography>
                                        <IconButton color="primary" aria-label="Reset Password" onClick={() => setResetOpen(true)}>
                                            <LockResetIcon />
                                        </IconButton>
                                    </Box>
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
            </Grid>

            <Dialog
                open={resetOpen}
                onClose={() => {
                    setResetOpen(false);
                    setResetStatus({ message: '', severity: '' });
                    setResetEmail('');
                }}
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
                <DialogTitle variant="h5" sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, textAlign: 'center', border: 'none', outline: 'none' }}>
                    Change Password
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 350, pt: 3, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                    <Typography fontSize={14} color={theme.palette.text.secondary}>
                        Enter your registered email to receive a password reset link
                    </Typography>
                    <TextField
                        label="Email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        sx={{ width: "100%" }}
                    />
                    {resetStatus.message && (
                        <Alert severity={resetStatus.severity} sx={{ width: '100%' }}>
                            {resetStatus.message}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1.5, alignItems: 'center', justifyContent: 'center', pb: 2, bgcolor: theme.palette.background.paper }}>
                    <Button
                        sx={{ width: '70%' }}
                        variant="contained"
                        color="primary"
                        onClick={handleResetPassword}
                        disabled={resetLoading || !resetEmail}
                    >
                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <Button
                        sx={{ width: '70%' }}
                        onClick={() => {
                            setResetOpen(false);
                            setResetStatus({ message: '', severity: '' });
                            setResetEmail('');
                        }}
                        color="secondary"
                        disabled={resetLoading}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
                    {uploadError}
                </Alert>
            </Snackbar>
        </Box>
    );
}