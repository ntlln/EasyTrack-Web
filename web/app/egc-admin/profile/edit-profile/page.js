"use client";

import { Box, Typography, Grid, TextField, MenuItem, InputAdornment, IconButton, Button, useTheme } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const theme = useTheme();

  const banks = ["BDO", "BPI", "Metrobank", "Landbank", "PNB"];

  const [form, setForm] = useState({
    first_name: "",
    middle_initial: "",
    last_name: "",
    contact_number: "",
    birth_date: "",
    emergency_contact: "",
    "emergency_contact#": ""
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [original, setOriginal] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      const userEmail = session.user.email;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, middle_initial, last_name, contact_number, birth_date, emergency_contact, "emergency_contact#"')
        .eq('email', userEmail)
        .single();
      if (data) {
        const cleanData = {
          first_name: data.first_name || "",
          middle_initial: data.middle_initial || "",
          last_name: data.last_name || "",
          contact_number: data.contact_number || "",
          birth_date: data.birth_date || "",
          emergency_contact: data.emergency_contact || "",
          "emergency_contact#": data["emergency_contact#"] || ""
        };
        setForm(cleanData);
        setOriginal(cleanData);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;
    const userEmail = session.user.email;
    // Only update changed fields
    const updates = {};
    Object.keys(form).forEach(key => {
      if (form[key] !== (original ? original[key] : "")) {
        updates[key] = form[key];
      }
    });
    if (Object.keys(updates).length === 0) {
      setLoading(false);
      router.push("/egc-admin/profile");
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('email', userEmail);
    console.log('Supabase update error:', error);
    setLoading(false);
    if (!error) router.push("/egc-admin/profile");
  };

  const handleClear = () => {
    window.location.reload();
  };

  return (
    <Box p={4} maxWidth="1400px" mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Edit Profile
        </Typography>
      </Box>

      {/* Personal Information */}
      <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Personal Information</Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required /> </Grid>
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="Middle Name" name="middle_initial" value={form.middle_initial} onChange={handleChange} required /> </Grid>
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required /> </Grid>
        <Grid item xs={12} sm={6}> <TextField fullWidth sx={{ minWidth: 300 }} label="Contact Number" name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="+63 XXX XXX XXXX" required /> </Grid>
        <Grid item xs={12} sm={6}> <TextField fullWidth sx={{ minWidth: 300 }} label="Date of Birth" name="birth_date" value={form.birth_date} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} required /> </Grid>
      </Grid>

      {/* Emergency Contact */}
      <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Emergency Contact</Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Emergency Contact Name" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} required /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Contact Number" name="emergency_contact#" value={form["emergency_contact#"]} onChange={handleChange} required /></Grid>
      </Grid>

      {/* ID & Verification */}
      <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Identification & Verification</Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Government ID Type" required /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Government ID Number" required /></Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth sx={{ minWidth: 300 }} label="NBI Clearance Upload" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton><UploadIcon /></IconButton></InputAdornment> }} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth sx={{ minWidth: 300 }} label="Selfie with ID" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton><UploadIcon /></IconButton></InputAdornment> }} required />
        </Grid>
      </Grid>

      {/* Bank Info */}
      <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Bank Details (For Salary & Reimbursement)</Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth sx={{ minWidth: 300 }} label="Bank Name" select required>
            {banks.map((bank) => (
              <MenuItem key={bank} value={bank}>{bank}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth sx={{ minWidth: 300 }} label="Account Number" placeholder="e.g., 012345678901" required />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth sx={{ minWidth: 300 }} label="Account Name" placeholder="e.g., Juan D. Santos" required />
        </Grid>
      </Grid>

      {/* Submit/Reset */}
      <Box mt={4} display="flex" justifyContent="center" gap={2}>
        <Button variant="outlined" color="inherit" onClick={handleClear}>
          Clear All Fields
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}