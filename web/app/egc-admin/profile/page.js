'use client';

import React, { useEffect, useState } from 'react';
import { Box, Grid, CardContent, Typography, Button, Avatar, Paper, IconButton, Alert, CircularProgress, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import dynamic from 'next/dynamic';

// Dynamically import ReactCrop with no SSR
const ReactCrop = dynamic(() => import('react-image-crop').then(mod => mod.default), {
    ssr: false
});

// Import the CSS in a way that works with Next.js
import 'react-image-crop/dist/ReactCrop.css';

export default function Page() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    // Profile states
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    // UI states
    const [uploading, setUploading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // UI states
    const [resetOpen, setResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ message: '', severity: '' });
    const [uploadError, setUploadError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [changePwOpen, setChangePwOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePwLoading, setChangePwLoading] = useState(false);

    // Add new states for image cropping
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [crop, setCrop] = useState({
        unit: 'px',
        width: 0,
        height: 0,
        x: 0,
        y: 0
    });
    const [imgSrc, setImgSrc] = useState('');
    const [imgRef, setImgRef] = useState(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Add tab state
    const [tabIndex, setTabIndex] = useState(0);

    // Add state for ID type name
    const [idTypeName, setIdTypeName] = useState('');

    useEffect(() => { fetchProfile(); }, []);

    useEffect(() => {
        // Fetch the ID type name if profile is loaded and gov_id_type exists
        const fetchIdTypeName = async () => {
            if (profile?.gov_id_type) {
                const { data, error } = await supabase
                    .from('verify_info_type')
                    .select('id_type_name')
                    .eq('id', profile.gov_id_type)
                    .single();
                if (data && data.id_type_name) setIdTypeName(data.id_type_name);
            }
        };
        fetchIdTypeName();
    }, [profile]);

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const email = session.user.email;
            setUserEmail(email);

            const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
            if (error) return;

            if (data) {
                setProfile(data);
                setProfileImage(data.pfp_id || null);
                await fetchRoleName(data.role_id);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchRoleName = async (roleId) => {
        if (!roleId) return;
        const { data: roleData } = await supabase.from('profiles_roles').select('role_name').eq('id', roleId).single();
        if (roleData?.role_name) setRoleName(roleData.role_name);
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

        // Reset states before loading new image
        setImgRef(null);
        setIsImageLoaded(false);
        setCrop({
            unit: 'px',
            width: 0,
            height: 0,
            x: 0,
            y: 0
        });

        // Read the file and open crop dialog
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImgSrc(reader.result);
            setSelectedFile(file);
            setCropDialogOpen(true);
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = async (e) => {
        try {
            const { width, height } = e.currentTarget;
            const { centerCrop, makeAspectCrop } = await import('react-image-crop');

            console.log('Image loaded with dimensions:', { width, height });

            // Set image reference first
            const imageElement = e.currentTarget;
            setImgRef(imageElement);
            setIsImageLoaded(true);

            // Calculate the size of the crop area (90% of the smaller dimension)
            const cropSize = Math.min(width, height) * 0.9;

            // Calculate the position to center the crop
            const x = (width - cropSize) / 2;
            const y = (height - cropSize) / 2;

            // Initialize crop with a centered square
            const initialCrop = {
                unit: 'px',
                width: cropSize,
                height: cropSize,
                x: x,
                y: y
            };

            console.log('Initial crop data:', initialCrop);
            setCrop(initialCrop);
        } catch (error) {
            console.error('Error in onImageLoad:', error);
            setUploadError('Failed to initialize image crop');
            setSnackbarOpen(true);
        }
    };

    const getCroppedImg = () => {
        if (!imgRef || !crop) return null;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.naturalWidth / imgRef.width;
        const scaleY = imgRef.naturalHeight / imgRef.height;

        // Calculate the actual pixel values
        const pixelRatio = window.devicePixelRatio;
        canvas.width = Math.floor(crop.width * scaleX);
        canvas.height = Math.floor(crop.height * scaleY);

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Set image smoothing
        ctx.imageSmoothingQuality = 'high';
        ctx.imageSmoothingEnabled = true;

        // Draw the cropped image
        ctx.drawImage(
            imgRef,
            Math.floor(crop.x * scaleX),
            Math.floor(crop.y * scaleY),
            Math.floor(crop.width * scaleX),
            Math.floor(crop.height * scaleY),
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error('Canvas to Blob conversion failed');
                        resolve(null);
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                0.95
            );
        });
    };

    const handleCropComplete = async () => {
        try {
            if (!imgRef) {
                console.error('No image reference available');
                setUploadError('Please wait for the image to load completely');
                setSnackbarOpen(true);
                return;
            }

            setUploading(true);
            setUploadError(null);

            console.log('Crop state:', crop);
            console.log('Image ref:', imgRef);

            // Validate crop data
            if (!crop || !crop.width || !crop.height) {
                console.error('Invalid crop data:', crop);
                throw new Error('Invalid crop data. Please try again.');
            }

            const croppedImage = await getCroppedImg();
            if (!croppedImage) {
                console.error('Failed to generate cropped image');
                throw new Error('Failed to generate cropped image. Please try again.');
            }

            // Convert blob to File
            const croppedFile = new File([croppedImage], selectedFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });

            await deleteOldProfileImage();
            await uploadNewProfileImage(croppedFile);

            setCropDialogOpen(false);
            setImgSrc('');
            setSelectedFile(null);
            setImgRef(null);
            setIsImageLoaded(false);
            setCrop({
                unit: 'px',
                width: 0,
                height: 0,
                x: 0,
                y: 0
            });
        } catch (error) {
            console.error('Crop error:', error);
            setUploadError(error.message || 'Failed to process image');
            setSnackbarOpen(true);
        } finally {
            setUploading(false);
        }
    };

    const deleteOldProfileImage = async () => {
        if (!profile?.pfp_id) return;
        try {
            const url = new URL(profile.pfp_id);
            const pathMatch = url.pathname.match(/admin\/([^.]+)\.(\w+)/);
            if (!pathMatch) return;
            const fileName = pathMatch[1];
            const fileExt = pathMatch[2];
            const filePath = `admin/${fileName}.${fileExt}`;

            await supabase.storage.from('profile-images').remove([filePath]);
            await supabase.from('profiles').update({ pfp_id: null }).eq('id', profile.id);
        } catch (error) {
            console.error('Error in deleteOldProfileImage:', error);
        }
    };

    const uploadNewProfileImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}.${fileExt}`;
            const filePath = `admin/${fileName}`;

            await deleteOldProfileImage();

            const { error: uploadError } = await supabase.storage.from('profile-images').upload(filePath, file, { upsert: true, cacheControl: '3600' });
            if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

            const { data: signedData, error: urlError } = await supabase.storage.from('profile-images').createSignedUrl(filePath, 60 * 60 * 24 * 365);
            if (urlError || !signedData?.signedUrl) throw new Error('Failed to generate signed URL');

            const { error: updateError } = await supabase.from('profiles').update({ pfp_id: signedData.signedUrl }).eq('id', profile.id).select();
            if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

            setProfileImage(signedData.signedUrl);
            setProfile(prevProfile => ({ ...prevProfile, pfp_id: signedData.signedUrl }));
        } catch (error) {
            console.error('Error in uploadNewProfileImage:', error);
            setUploadError(error.message || 'Failed to upload image');
            setSnackbarOpen(true);
            throw error;
        }
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
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/egc-admin/profile/reset-password` });
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

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            setSnackbarMessage('Please fill in all password fields.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setSnackbarMessage('Passwords do not match.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        setChangePwLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setSnackbarMessage(error.message || 'Failed to change password.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            } else {
                setSnackbarMessage('Password changed successfully!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setChangePwOpen(false);
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            setSnackbarMessage('Failed to change password.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setChangePwLoading(false);
        }
    };

    if (!profile) return <Box p={4}><Typography>No profile found.</Typography></Box>;

    const user = {
        fullName: `${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}${profile.suffix ? ` ${profile.suffix}` : ''}`.replace(/  +/g, ' ').trim(),
        employeeId: profile.id || '',
        role: roleName || '',
        dateRegistered: profile.created_at ? new Date(profile.created_at).toLocaleString() : '',
        lastUpdated: profile.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Never',
        lastSignIn: profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString() : 'Never',
        email: profile.email || '',
        password: '********',
        contactNumber: profile.contact_number || 'Not provided',
        birthDate: profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'Not provided',
        emergencyContact: profile.emergency_contact_name || 'Not provided',
        emergencyContactNumber: profile.emergency_contact_number || 'Not provided',
    };

    return (
        <Box sx={{ pt: 2, px: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ width: "100%", maxWidth: "1000px", display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={() => router.push("/egc-admin/")} sx={{ color: "primary.main" }}>
                    <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h4" color="primary.main" fontWeight="bold">Profile</Typography>
            </Box>

            <Paper elevation={3} sx={{ borderRadius: 2, background: theme.palette.background.paper }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Box sx={{ position: "relative" }}>
                                <Avatar alt={user.fullName} src={profileImage || "/avatar.png"} sx={{ width: 100, height: 100, border: "2px solid", borderColor: "primary.main" }} />
                                <input accept="image/*" style={{ display: "none" }} id="profile-image-upload" type="file" onChange={handleImageUpload} disabled={uploading} />
                                <label htmlFor="profile-image-upload">
                                    <IconButton component="span" sx={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "primary.main", color: "white", "&:hover": { backgroundColor: "primary.dark" } }} disabled={uploading}>
                                        {uploading ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraIcon />}
                                    </IconButton>
                                </label>
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>{user.fullName}</Typography>
                                <Typography color="primary.main" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>{user.role}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Button variant="contained" onClick={() => router.push("/egc-admin/profile/edit-profile")} sx={{ borderRadius: 2, textTransform: "none", px: 3 }}>Edit Profile</Button>
                            <Button variant="outlined" color="primary" onClick={() => setChangePwOpen(true)} sx={{ borderRadius: 2, textTransform: "none", px: 3 }}>Change Password</Button>
                        </Box>
                    </Box>
                </CardContent>
            </Paper>

            {/* Tabs for info sections */}
            <Paper elevation={2} sx={{ borderRadius: 2, background: theme.palette.background.paper }}>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="profile info tabs" sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab label="About Me" />
                    <Tab label="Image Requirements" />
                    <Tab label="Emergency Contact" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                    {tabIndex === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                                <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: "2px solid", borderColor: "primary.light", pb: 1 }}>Personal Information</Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Employee ID:</Typography>
                                        <Typography fontWeight="medium">{user.employeeId}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Full Name:</Typography>
                                        <Typography fontWeight="medium">{user.fullName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Contact Number:</Typography>
                                        <Typography fontWeight="medium">{user.contactNumber}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Birth Date:</Typography>
                                        <Typography fontWeight="medium">{user.birthDate}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                                <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: "2px solid", borderColor: "primary.light", pb: 1 }}>Account Information</Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Email Address:</Typography>
                                        <Typography fontWeight="medium">{user.email}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Role:</Typography>
                                        <Typography fontWeight="medium">{user.role}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Date of Registration:</Typography>
                                        <Typography fontWeight="medium">{user.dateRegistered}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Last Updated:</Typography>
                                        <Typography fontWeight="medium">{user.lastUpdated}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Last Sign In:</Typography>
                                        <Typography fontWeight="medium">{user.lastSignIn}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    {tabIndex === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start', xs: 'center' }, justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={1}>
                                    {idTypeName ? `${idTypeName} (Front)` : 'ID Type (Front)'}
                                </Typography>
                                {profile?.gov_id_proof ? (
                                    <img src={profile.gov_id_proof} alt="ID Front" style={{ maxWidth: 450, maxHeight: 320, borderRadius: 10, border: '2px solid #ccc' }} />
                                ) : (
                                    <Typography color="text.secondary">No image uploaded</Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={1}>
                                    {idTypeName ? `${idTypeName} (Back)` : 'ID Type (Back)'}
                                </Typography>
                                {profile?.gov_id_proof_back ? (
                                    <img src={profile.gov_id_proof_back} alt="ID Back" style={{ maxWidth: 450, maxHeight: 320, borderRadius: 10, border: '2px solid #ccc' }} />
                                ) : (
                                    <Typography color="text.secondary">No image uploaded</Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                    {tabIndex === 2 && (
                        <Box sx={{ flex: 1, minWidth: 280 }}>
                            <Typography variant="h6" mb={3} color="primary.main" sx={{ borderBottom: "2px solid", borderColor: "primary.light", pb: 1, width: '100%' }}>Emergency Contact</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Contact Name:</Typography>
                                    <Typography fontWeight="medium">{user.emergencyContact}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography color="text.secondary" fontSize="0.9rem" sx={{ minWidth: 130 }}>Contact Number:</Typography>
                                    <Typography fontWeight="medium">{user.emergencyContactNumber}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Dialog open={resetOpen} onClose={() => { setResetOpen(false); setResetStatus({ message: "", severity: "" }); setResetEmail(""); }} PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: theme.shadows[4] } }}>
                <DialogTitle variant="h5" sx={{ color: theme.palette.text.primary, textAlign: "center", border: "none", outline: "none" }}>Change Password</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 350, pt: 3 }}>
                    <Typography fontSize={14} color={theme.palette.text.secondary}>Enter your registered email to receive a password reset link</Typography>
                    <TextField label="Email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter your email" required sx={{ width: "100%" }} InputLabelProps={{ sx: { color: theme.palette.text.secondary, "&.Mui-focused": { color: theme.palette.primary.main } } }} />
                    {resetStatus.message && <Alert severity={resetStatus.severity} sx={{ width: "100%" }}>{resetStatus.message}</Alert>}
                </DialogContent>
                <DialogActions sx={{ flexDirection: "column", gap: 1.5, alignItems: "center", justifyContent: "center", pb: 2, bgcolor: theme.palette.background.paper }}>
                    <Button sx={{ width: "70%" }} variant="contained" color="primary" onClick={handleResetPassword} disabled={resetLoading || !resetEmail}>{resetLoading ? "Sending..." : "Send Reset Link"}</Button>
                    <Button sx={{ width: "70%" }} onClick={() => { setResetOpen(false); setResetStatus({ message: "", severity: "" }); setResetEmail(""); }} color="secondary" disabled={resetLoading}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={changePwOpen} onClose={() => { setChangePwOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} fullWidth maxWidth="xs" PaperProps={{ sx: { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: theme.shadows[4] } }}>
                <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%", pt: 6 }}>
                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, textAlign: "center", fontWeight: "bold", mb: 2 }}>Change Password</Typography>
                    <TextField label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" required fullWidth InputLabelProps={{ sx: { color: theme.palette.text.secondary, "&.Mui-focused": { color: theme.palette.primary.main } } }} />
                    <TextField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" required fullWidth InputLabelProps={{ sx: { color: theme.palette.text.secondary, "&.Mui-focused": { color: theme.palette.primary.main } } }} />
                    <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required fullWidth InputLabelProps={{ sx: { color: theme.palette.text.secondary, "&.Mui-focused": { color: theme.palette.primary.main } } }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center", justifyContent: "center", width: "100%", pb: 2, mt: 2 }}>
                        <Button sx={{ width: "70%" }} variant="contained" color="primary" onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !confirmPassword}>{changePwLoading ? "Changing..." : "Change Password"}</Button>
                        <Button sx={{ width: "70%" }} onClick={() => { setChangePwOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} color="secondary" disabled={changePwLoading}>Cancel</Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog
                open={cropDialogOpen}
                onClose={() => {
                    setCropDialogOpen(false);
                    setImgSrc('');
                    setSelectedFile(null);
                    setImgRef(null);
                    setIsImageLoaded(false);
                    setCrop({
                        unit: 'px',
                        width: 0,
                        height: 0,
                        x: 0,
                        y: 0
                    });
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        boxShadow: theme.shadows[4]
                    }
                }}
            >
                <DialogTitle variant="h5" sx={{ color: theme.palette.text.primary, textAlign: "center" }}>
                    Crop Profile Picture
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 2 }}>
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => {
                                console.log('Crop changed:', c);
                                setCrop(c);
                            }}
                            aspect={1}
                            circularCrop
                            keepRatio
                            minWidth={50}
                            minHeight={50}
                        >
                            <img
                                src={imgSrc}
                                onLoad={onImageLoad}
                                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                alt="Crop preview"
                                crossOrigin="anonymous"
                                loading="eager"
                                ref={(el) => {
                                    if (el) {
                                        setImgRef(el);
                                    }
                                }}
                            />
                        </ReactCrop>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: "column", gap: 1.5, alignItems: "center", justifyContent: "center", pb: 2 }}>
                    <Button
                        sx={{ width: "70%" }}
                        variant="contained"
                        color="primary"
                        onClick={handleCropComplete}
                        disabled={uploading || !imgRef}
                    >
                        {uploading ? "Processing..." : !imgRef ? "Loading..." : "Apply Crop"}
                    </Button>
                    <Button
                        sx={{ width: "70%" }}
                        onClick={() => {
                            setCropDialogOpen(false);
                            setImgSrc('');
                            setSelectedFile(null);
                            setImgRef(null);
                            setIsImageLoaded(false);
                            setCrop({
                                unit: 'px',
                                width: 0,
                                height: 0,
                                x: 0,
                                y: 0
                            });
                        }}
                        color="secondary"
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={(_, reason) => { if (reason !== "clickaway") setSnackbarOpen(false); }} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>{snackbarMessage || uploadError}</Alert>
            </Snackbar>
        </Box>
    );
}