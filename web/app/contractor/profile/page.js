'use client';

import React, { useEffect, useState } from 'react';
import { Box, Grid, CardContent, Typography, Button, Avatar, Paper, IconButton, Alert, CircularProgress, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import dynamic from 'next/dynamic';
import 'react-image-crop/dist/ReactCrop.css';

const ReactCrop = dynamic(() => import('react-image-crop').then(mod => mod.default), { ssr: false });

export default function ProfilePage() {
    // State and client setup
    const router = useRouter();
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
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
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
    const [imgSrc, setImgSrc] = useState('');
    const [imgRef, setImgRef] = useState(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Data fetching
    useEffect(() => { fetchProfile(); }, []);

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
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const fetchRoleName = async (roleId) => {
        if (!roleId) return;
        const { data: roleData } = await supabase.from('profiles_roles').select('role_name').eq('id', roleId).single();
        if (roleData?.role_name) setRoleName(roleData.role_name);
    };

    // Image handling
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setUploadError('Please upload an image file'); setSnackbarOpen(true); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError('File size should be less than 5MB'); setSnackbarOpen(true); return; }
        setImgRef(null);
        setIsImageLoaded(false);
        setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
        const reader = new FileReader();
        reader.addEventListener('load', () => { setImgSrc(reader.result); setSelectedFile(file); setCropDialogOpen(true); });
        reader.readAsDataURL(file);
    };

    const onImageLoad = async (e) => {
        try {
            const { width, height } = e.currentTarget;
            const { centerCrop, makeAspectCrop } = await import('react-image-crop');
            const imageElement = e.currentTarget;
            setImgRef(imageElement);
            setIsImageLoaded(true);
            const initialCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height);
            setCrop(initialCrop);
        } catch (error) {
            setUploadError('Failed to initialize image crop');
            setSnackbarOpen(true);
        }
    };

    const getCroppedImg = () => {
        if (!imgRef || !crop) return null;
        const canvas = document.createElement('canvas');
        const scaleX = imgRef.naturalWidth / imgRef.width;
        const scaleY = imgRef.naturalHeight / imgRef.height;
        canvas.width = Math.floor(crop.width * scaleX);
        canvas.height = Math.floor(crop.height * scaleY);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.imageSmoothingQuality = 'high';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(imgRef, Math.floor(crop.x * scaleX), Math.floor(crop.y * scaleY), Math.floor(crop.width * scaleX), Math.floor(crop.height * scaleY), 0, 0, canvas.width, canvas.height);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => { if (!blob) { resolve(null); return; } resolve(blob); }, 'image/jpeg', 0.95);
        });
    };

    const handleCropComplete = async () => {
        try {
            if (!imgRef) { setUploadError('Please wait for the image to load completely'); setSnackbarOpen(true); return; }
            setUploading(true);
            setUploadError(null);
            if (!crop || !crop.width || !crop.height) throw new Error('Invalid crop data. Please try again.');
            const croppedImage = await getCroppedImg();
            if (!croppedImage) throw new Error('Failed to generate cropped image. Please try again.');
            const croppedFile = new File([croppedImage], selectedFile.name, { type: 'image/jpeg', lastModified: Date.now() });
            await deleteOldProfileImage();
            await uploadNewProfileImage(croppedFile);
            setCropDialogOpen(false);
            setImgSrc('');
            setSelectedFile(null);
            setImgRef(null);
            setIsImageLoaded(false);
            setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
        } catch (error) {
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
            const pathMatch = url.pathname.match(/airlines\/([^.]+)\.(\w+)/);
            if (!pathMatch) return;
            const fileName = pathMatch[1];
            const fileExt = pathMatch[2];
            const filePath = `airlines/${fileName}.${fileExt}`;
            await supabase.storage.from('profile-images').remove([filePath]);
            await supabase.from('profiles').update({ pfp_id: null }).eq('id', profile.id);
        } catch (error) {}
    };

    const uploadNewProfileImage = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}.${fileExt}`;
            const filePath = `airlines/${fileName}`;
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
            setUploadError(error.message || 'Failed to upload image');
            setSnackbarOpen(true);
            throw error;
        }
    };

    // Password management
    const handleResetPassword = async () => {
        setResetLoading(true);
        setResetStatus({ message: '', severity: '' });
        if (resetEmail !== userEmail) { setResetStatus({ message: 'Please enter your registered email address', severity: 'error' }); setResetLoading(false); return; }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/contractor/profile/reset-password` });
            if (error) throw error;
            setResetStatus({ message: 'Password reset link sent to your email', severity: 'success' });
            setTimeout(() => { setResetOpen(false); setResetStatus({ message: '', severity: '' }); setResetEmail(''); }, 2000);
        } catch (error) {
            setResetStatus({ message: error.message || 'Failed to send reset link', severity: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) { setSnackbarMessage('Please fill in all password fields.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
        if (newPassword !== confirmPassword) { setSnackbarMessage('Passwords do not match.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
        setChangePwLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) { setSnackbarMessage(error.message || 'Failed to change password.'); setSnackbarSeverity('error'); setSnackbarOpen(true); }
            else { setSnackbarMessage('Password changed successfully!'); setSnackbarSeverity('success'); setSnackbarOpen(true); setChangePwOpen(false); setNewPassword(""); setConfirmPassword(""); }
        } catch (err) {
            setSnackbarMessage('Failed to change password.'); setSnackbarSeverity('error'); setSnackbarOpen(true);
        } finally {
            setChangePwLoading(false);
        }
    };

    // Styling constants
    const containerStyles = { pt: 2, px: 4, display: "flex", flexDirection: "column", gap: 4 };
    const headerStyles = { width: "100%", maxWidth: "1000px", display: "flex", alignItems: "center", gap: 2 };
    const profileCardStyles = { borderRadius: 2, background: theme.palette.background.paper };
    const profileContentStyles = { p: 4 };
    const profileHeaderStyles = { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3 };
    const avatarContainerStyles = { position: "relative" };
    const avatarStyles = { width: 100, height: 100, border: '2px solid', borderColor: 'primary.main' };
    const uploadButtonStyles = { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } };
    const buttonStyles = { borderRadius: 2, textTransform: 'none', px: 3 };
    const infoCardStyles = { height: '100%', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, background: theme.palette.background.paper };
    const infoContentStyles = { p: 3 };
    const sectionTitleStyles = { mb: 3, color: "primary.main", borderBottom: '2px solid', borderColor: 'primary.light', pb: 1 };
    const infoBoxStyles = { display: 'flex', flexDirection: 'column', gap: 2 };
    const labelStyles = { color: "text.secondary", fontSize: "0.9rem" };
    const dialogStyles = { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: theme.shadows[4] };
    const dialogContentStyles = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', pt: 6 };
    const dialogTitleStyles = { color: theme.palette.text.primary, textAlign: 'center', fontWeight: 'bold', mb: 2 };
    const inputLabelStyles = { color: theme.palette.text.secondary, '&.Mui-focused': { color: theme.palette.primary.main } };
    const dialogActionsStyles = { display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', justifyContent: 'center', width: '100%', pb: 2, mt: 2 };
    const actionButtonStyles = { width: '70%' };

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress color="primary" /></Box>;
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
        <Box sx={containerStyles}>
            <Box sx={headerStyles}>
                <IconButton onClick={() => router.push("/contractor/")} sx={{ color: "primary.main" }}><ChevronLeftIcon /></IconButton>
                <Typography variant="h3" color="primary.main" fontWeight="bold">Profile</Typography>
            </Box>

            <Paper elevation={3} sx={profileCardStyles}>
                <CardContent sx={profileContentStyles}>
                    <Box sx={profileHeaderStyles}>
                        <Box display="flex" alignItems="center" gap={3}>
                            <Box sx={avatarContainerStyles}>
                                <Avatar alt={user.fullName} src={profileImage || "/avatar.png"} sx={avatarStyles} />
                                <input accept="image/*" style={{ display: 'none' }} id="profile-image-upload" type="file" onChange={handleImageUpload} disabled={uploading} />
                                <label htmlFor="profile-image-upload">
                                    <IconButton component="span" sx={uploadButtonStyles} disabled={uploading}>
                                        {uploading ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraIcon />}
                                    </IconButton>
                                </label>
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>{user.fullName}</Typography>
                                <Typography color="primary.main" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.role}</Typography>
                            </Box>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <Button variant="contained" onClick={() => router.push('/contractor/profile/edit-profile')} sx={buttonStyles}>Edit Profile</Button>
                            <Button variant="outlined" color="primary" onClick={() => setChangePwOpen(true)} sx={buttonStyles}>Change Password</Button>
                        </Box>
                    </Box>
                </CardContent>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={infoCardStyles}>
                        <CardContent sx={infoContentStyles}>
                            <Typography variant="h6" sx={sectionTitleStyles}>Personal Information</Typography>
                            <Box sx={infoBoxStyles}>
                                <Box><Typography sx={labelStyles}>Employee ID</Typography><Typography fontWeight="medium">{user.employeeId}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Full Name</Typography><Typography fontWeight="medium">{user.fullName}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Contact Number</Typography><Typography fontWeight="medium">{user.contactNumber}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Birth Date</Typography><Typography fontWeight="medium">{user.birthDate}</Typography></Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={infoCardStyles}>
                        <CardContent sx={infoContentStyles}>
                            <Typography variant="h6" sx={sectionTitleStyles}>Emergency Contact Information</Typography>
                            <Box sx={infoBoxStyles}>
                                <Box><Typography sx={labelStyles}>Emergency Contact Name</Typography><Typography fontWeight="medium">{user.emergencyContact}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Emergency Contact Number</Typography><Typography fontWeight="medium">{user.emergencyContactNumber}</Typography></Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={infoCardStyles}>
                        <CardContent sx={infoContentStyles}>
                            <Typography variant="h6" sx={sectionTitleStyles}>Account Information</Typography>
                            <Box sx={infoBoxStyles}>
                                <Box><Typography sx={labelStyles}>Email Address</Typography><Typography fontWeight="medium">{user.email}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Role</Typography><Typography fontWeight="medium">{user.role}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Date of Registration</Typography><Typography fontWeight="medium">{user.dateRegistered}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Last Updated</Typography><Typography fontWeight="medium">{user.lastUpdated}</Typography></Box>
                                <Box><Typography sx={labelStyles}>Last Sign In</Typography><Typography fontWeight="medium">{user.lastSignIn}</Typography></Box>
                            </Box>
                        </CardContent>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog open={resetOpen} onClose={() => { setResetOpen(false); setResetStatus({ message: '', severity: '' }); setResetEmail(''); }} PaperProps={{ sx: dialogStyles }}>
                <DialogTitle variant="h5" sx={dialogTitleStyles}>Change Password</DialogTitle>
                <DialogContent sx={dialogContentStyles}>
                    <Typography fontSize={14} color={theme.palette.text.secondary}>Enter your registered email to receive a password reset link</Typography>
                    <TextField label="Email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter your email" required sx={{ width: "100%" }} InputLabelProps={{ sx: inputLabelStyles }} />
                    {resetStatus.message && <Alert severity={resetStatus.severity} sx={{ width: '100%' }}>{resetStatus.message}</Alert>}
                </DialogContent>
                <DialogActions sx={dialogActionsStyles}>
                    <Button sx={actionButtonStyles} variant="contained" color="primary" onClick={handleResetPassword} disabled={resetLoading || !resetEmail}>{resetLoading ? 'Sending...' : 'Send Reset Link'}</Button>
                    <Button sx={actionButtonStyles} onClick={() => { setResetOpen(false); setResetStatus({ message: '', severity: '' }); setResetEmail(''); }} color="secondary" disabled={resetLoading}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={changePwOpen} onClose={() => { setChangePwOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} fullWidth maxWidth="xs" PaperProps={{ sx: dialogStyles }}>
                <DialogContent sx={dialogContentStyles}>
                    <Typography variant="h5" sx={dialogTitleStyles}>Change Password</Typography>
                    <TextField label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" required fullWidth InputLabelProps={{ sx: inputLabelStyles }} />
                    <TextField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" required fullWidth InputLabelProps={{ sx: inputLabelStyles }} />
                    <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required fullWidth InputLabelProps={{ sx: inputLabelStyles }} />
                    <Box sx={dialogActionsStyles}>
                        <Button sx={actionButtonStyles} variant="contained" color="primary" onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !confirmPassword}>{changePwLoading ? 'Changing...' : 'Change Password'}</Button>
                        <Button sx={actionButtonStyles} onClick={() => { setChangePwOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} color="secondary" disabled={changePwLoading}>Cancel</Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={cropDialogOpen} onClose={() => { setCropDialogOpen(false); setImgSrc(''); setSelectedFile(null); setImgRef(null); setIsImageLoaded(false); setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 }); }} maxWidth="md" fullWidth PaperProps={{ sx: dialogStyles }}>
                <DialogTitle variant="h5" sx={dialogTitleStyles}>Crop Profile Picture</DialogTitle>
                <DialogContent sx={dialogContentStyles}>
                    {imgSrc && (
                        <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} circularCrop keepRatio minWidth={50} minHeight={50}>
                            <img src={imgSrc} onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: '70vh' }} alt="Crop preview" crossOrigin="anonymous" loading="eager" ref={el => { if (el) setImgRef(el); }} />
                        </ReactCrop>
                    )}
                </DialogContent>
                <DialogActions sx={dialogActionsStyles}>
                    <Button sx={actionButtonStyles} variant="contained" color="primary" onClick={handleCropComplete} disabled={uploading || !imgRef}>{uploading ? "Processing..." : !imgRef ? "Loading..." : "Apply Crop"}</Button>
                    <Button sx={actionButtonStyles} onClick={() => { setCropDialogOpen(false); setImgSrc(''); setSelectedFile(null); setImgRef(null); setIsImageLoaded(false); setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 }); }} color="secondary" disabled={uploading}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={(_, reason) => { if (reason !== 'clickaway') setSnackbarOpen(false); }} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage || uploadError}</Alert>
            </Snackbar>
        </Box>
    );
}