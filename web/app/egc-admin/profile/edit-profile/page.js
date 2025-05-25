"use client";

import { Box, Typography, Grid, TextField, MenuItem, InputAdornment, IconButton, Button, useTheme, Snackbar, Alert } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";

export default function Page() {
  // Client and refs setup
  const theme = useTheme();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef(null);
  const fileInputBackRef = useRef(null);

  // Bank list
  const banks = ["BDO Unibank, Inc. (BDO)", "Land Bank of the Philippines (LANDBANK)", "Metropolitan Bank and Trust Company (Metrobank)", "Bank of the Philippine Islands (BPI)", "China Banking Corporation (Chinabank)", "Rizal Commercial Banking Corporation (RCBC)", "Philippine National Bank (PNB)", "Security Bank Corporation", "Union Bank of the Philippines (UnionBank)", "Development Bank of the Philippines (DBP)"];

  // State setup
  const [form, setForm] = useState({ first_name: "", middle_initial: "", last_name: "", suffix: "", contact_number: "", birth_date: "", emergency_contact_name: "", emergency_contact_number: "", gov_id_number: "", gov_id_proof: "", gov_id_proof_back: "", bank_name: "", account_number: "", account_name: "" });
  const [loading, setLoading] = useState(false);
  const [original, setOriginal] = useState(null);
  const [govIdTypes, setGovIdTypes] = useState([]);
  const [selectedGovIdType, setSelectedGovIdType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const menuProps = { PaperProps: { style: { maxHeight: 48 * 5 } } };

  // Data fetching
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('first_name, middle_initial, last_name, suffix, contact_number, birth_date, emergency_contact_name, emergency_contact_number, gov_id_type, gov_id_number, gov_id_proof, gov_id_proof_back, bank_name, account_number, account_name').eq('email', session.user.email).single();
      if (data) {
        const cleanData = { first_name: data.first_name || "", middle_initial: data.middle_initial || "", last_name: data.last_name || "", suffix: data.suffix || "", contact_number: data.contact_number || "", birth_date: data.birth_date || "", emergency_contact_name: data.emergency_contact_name || "", emergency_contact_number: data.emergency_contact_number || "", gov_id_number: data.gov_id_number || "", gov_id_proof: data.gov_id_proof || "", gov_id_proof_back: data.gov_id_proof_back || "", bank_name: data.bank_name || "", account_number: data.account_number || "", account_name: data.account_name || "" };
        setForm(cleanData);
        setOriginal(cleanData);
        if (data.gov_id_type) setSelectedGovIdType(String(data.gov_id_type));
      }
      setLoading(false);
    };
    const fetchGovIdTypes = async () => {
      const { data } = await supabase.from('verify_info_type').select('id, id_type_name');
      if (data) setGovIdTypes(data);
    };
    fetchProfile();
    fetchGovIdTypes();
  }, []);

  // Event handlers
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };
  const handleSave = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const updates = {};
    Object.keys(form).forEach(key => { if (form[key] !== (original?.[key] ?? "")) updates[key] = form[key]; });
    if (selectedGovIdType) updates.gov_id_type = selectedGovIdType;
    if (Object.keys(updates).length === 0) { setLoading(false); router.push("/egc-admin/profile"); return; }
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('profiles').update(updates).eq('email', session.user.email);
    setLoading(false);
    if (!error) router.push("/egc-admin/profile");
  };
  const handleClear = () => { window.location.reload(); };
  const handleFileUpload = async (event, type) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profileData } = await supabase.from('profiles').select('id, gov_id_proof, gov_id_proof_back').eq('email', session.user.email).single();
      if (!profileData) throw new Error('Failed to get user profile');
      const oldUrl = type === 'front' ? profileData.gov_id_proof : profileData.gov_id_proof_back;
      if (oldUrl) {
        try {
          const url = new URL(oldUrl);
          const pathMatch = url.pathname.match(/admin\/([^.]+_[^./]+)\.(\w+)/);
          if (pathMatch) await supabase.storage.from('gov-id').remove([`admin/${pathMatch[1]}.${pathMatch[2]}`]);
        } catch (e) { }
      }
      const fileExt = file.name.split('.').pop();
      const filePath = `admin/${profileData.id}_${type}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('gov-id').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { signedUrl } } = await supabase.storage.from('gov-id').createSignedUrl(filePath, 31536000);
      if (!signedUrl) throw new Error('Failed to get signed URL');
      const { error: updateError } = await supabase.from('profiles').update({ [type === 'front' ? 'gov_id_proof' : 'gov_id_proof_back']: signedUrl }).eq('email', session.user.email);
      if (updateError) throw updateError;
      setForm(prev => ({ ...prev, [type === 'front' ? 'gov_id_proof' : 'gov_id_proof_back']: signedUrl }));
      setSnackbarMessage('Image uploaded successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error uploading file. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally { setUploading(false); }
  };
  const triggerFileInput = (type) => { (type === 'front' ? fileInputRef : fileInputBackRef).current?.click(); };

  // Styles
  const pageStyles = { p: 4, maxWidth: "1400px", mx: "auto" };
  const headerStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 };
  const backButtonStyles = { display: "flex", alignItems: "center", gap: 2 };
  const formStyles = { minWidth: 300 };
  const buttonContainerStyles = { mt: 4, display: "flex", justifyContent: "center", gap: 2 };
  const fileInputStyles = { display: 'none' };
  const alertStyles = { width: '100%' };

  return (
    <Box sx={pageStyles}>
      <Box sx={headerStyles}>
        <Box sx={backButtonStyles}>
          <IconButton onClick={() => router.push("/egc-admin/profile")} sx={{ color: "primary.main" }}><ChevronLeftIcon /></IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">Edit Profile</Typography>
        </Box>
      </Box>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Personal Information</Typography>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={4}><TextField fullWidth sx={formStyles} label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth sx={formStyles} label="Middle Name" name="middle_initial" value={form.middle_initial} onChange={handleChange} required /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth sx={formStyles} label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth sx={formStyles} label="Suffix" name="suffix" value={form.suffix} onChange={handleChange} placeholder="Jr., Sr., III, etc." /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Contact Number" name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="+63 XXX XXX XXXX" required /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Date of Birth" name="birth_date" value={form.birth_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} required /></Grid>
        </Grid>

        <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Emergency Contact</Typography>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Emergency Contact Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} required /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Contact Number" name="emergency_contact_number" value={form.emergency_contact_number} onChange={handleChange} required /></Grid>
        </Grid>

        <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Identification & Verification</Typography>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth sx={formStyles} label="Government ID Type" select SelectProps={{ MenuProps: menuProps }} value={selectedGovIdType ?? ""} onChange={e => setSelectedGovIdType(e.target.value)} required>
              {govIdTypes.map((type) => <MenuItem key={type.id} value={String(type.id)}>{type.id_type_name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Government ID Number" name="gov_id_number" value={form.gov_id_number} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'front')} style={fileInputStyles} accept="image/*" />
            <TextField fullWidth sx={formStyles} label="Upload Government ID (Front)" value={form.gov_id_proof ? 'Image uploaded' : ''} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => triggerFileInput('front')} disabled={uploading}><UploadIcon /></IconButton></InputAdornment>, readOnly: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <input type="file" ref={fileInputBackRef} onChange={(e) => handleFileUpload(e, 'back')} style={fileInputStyles} accept="image/*" />
            <TextField fullWidth sx={formStyles} label="Upload Government ID (Back)" value={form.gov_id_proof_back ? 'Image uploaded' : ''} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => triggerFileInput('back')} disabled={uploading}><UploadIcon /></IconButton></InputAdornment>, readOnly: true }} />
          </Grid>
        </Grid>

        <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Bank Details (For Salary & Reimbursement)</Typography>
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth sx={formStyles} label="Bank Name" select SelectProps={{ MenuProps: menuProps }} name="bank_name" value={form.bank_name} onChange={handleChange}>
              {banks.map((bank) => <MenuItem key={bank} value={bank}>{bank}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth sx={formStyles} label="Account Number" placeholder="e.g., 012345678901" name="account_number" value={form.account_number} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField fullWidth sx={formStyles} label="Account Name" placeholder="e.g., Juan D. Santos" name="account_name" value={form.account_name} onChange={handleChange} /></Grid>
        </Grid>

        <Box sx={buttonContainerStyles}>
          <Button variant="outlined" color="inherit" onClick={handleClear}>Clear All Fields</Button>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </Box>
      </form>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={alertStyles}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
}