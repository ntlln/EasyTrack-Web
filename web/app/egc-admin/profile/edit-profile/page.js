"use client";

import { Box, Typography, Grid, TextField, MenuItem, InputAdornment, IconButton, Button, useTheme } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";

export default function EditProfile() {
  const theme = useTheme();

  const banks = ["BDO", "BPI", "Metrobank", "Landbank", "PNB"];

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
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="First Name" required /> </Grid>
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="Middle Name" required /> </Grid>
        <Grid item xs={12} sm={4}> <TextField fullWidth sx={{ minWidth: 300 }} label="Last Name" required /> </Grid>
        <Grid item xs={12} sm={6}> <TextField fullWidth sx={{ minWidth: 300 }} label="Contact Number" placeholder="+63 XXX XXX XXXX" required /> </Grid>
        <Grid item xs={12} sm={6}> <TextField fullWidth sx={{ minWidth: 300 }} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} required /> </Grid>
      </Grid>

      {/* Emergency Contact */}
      <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Emergency Contact</Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Emergency Contact Name" required /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth sx={{ minWidth: 300 }} label="Contact Number" required /></Grid>
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
        <Button variant="contained">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}