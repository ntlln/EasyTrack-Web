"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Paper, Grid, IconButton, Button, CardContent, Avatar, Tabs, Tab } from "@mui/material";
import { ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTheme } from '@mui/material/styles';

export default function ViewProfile({ params }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [idTypeName, setIdTypeName] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, [params.id]);

  useEffect(() => {
    const fetchIdTypeName = async () => {
      if (user?.gov_id_type) {
        const { data } = await supabase.from('verify_info_type').select('id_type_name').eq('id', user.gov_id_type).single();
        if (data?.id_type_name) setIdTypeName(data.id_type_name);
      }
    };
    fetchIdTypeName();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          middle_initial,
          last_name,
          suffix,
          role_id,
          user_status_id,
          profiles_status (status_name),
          profiles_roles (role_name),
          created_at,
          updated_at,
          last_sign_in_at,
          contact_number,
          birth_date,
          emergency_contact_name,
          emergency_contact_number,
          gov_id_type,
          gov_id_proof,
          gov_id_proof_back,
          pfp_id
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const containerStyles = {display: "flex", flexDirection: "column", gap: 4 };
  const headerStyles = { width: "100%", maxWidth: "1000px", display: "flex", alignItems: "center", gap: 2 };
  const profileCardStyles = { borderRadius: 2, background: theme.palette.background.paper };
  const profileContentStyles = { p: 4 };
  const profileHeaderStyles = { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 3 };
  const avatarStyles = { width: 100, height: 100, border: "2px solid", borderColor: "primary.main" };
  const buttonContainerStyles = { display: "flex", flexDirection: "column", gap: 2 };
  const buttonStyles = { borderRadius: 2, textTransform: "none", px: 3 };
  const tabsStyles = { borderBottom: 1, borderColor: 'divider', px: 2 };
  const tabContentStyles = { p: 3 };
  const infoSectionStyles = { display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap' };
  const infoBoxStyles = { flex: 1, minWidth: 280 };
  const sectionTitleStyles = { mb: 3, color: "primary.main", borderBottom: "2px solid", borderColor: "primary.light", pb: 1 };
  const infoItemStyles = { display: 'flex', alignItems: 'center', gap: 2 };
  const labelStyles = { color: "text.secondary", fontSize: "0.9rem", minWidth: 130 };
  const valueStyles = { fontWeight: "medium" };
  const imageContainerStyles = { display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start', xs: 'center' }, justifyContent: 'center' };
  const imageBoxStyles = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 };
  const imageStyles = { maxWidth: 450, maxHeight: 320, borderRadius: 10, border: '2px solid #ccc' };

  if (loading) return <Box p={4} display="flex" justifyContent="center" alignItems="center"><Typography>Loading...</Typography></Box>;
  if (error) return <Box p={4} display="flex" justifyContent="center" alignItems="center"><Typography color="error">{error}</Typography></Box>;
  if (!user) return <Box p={4} display="flex" justifyContent="center" alignItems="center"><Typography>User not found</Typography></Box>;

  const userData = {
    fullName: `${user.first_name || ''} ${user.middle_initial || ''} ${user.last_name || ''}${user.suffix ? ` ${user.suffix}` : ''}`.replace(/  +/g, ' ').trim(),
    employeeId: user.id || '',
    role: user.role_id === 3 ? 'Contractor' : (user.profiles_roles?.role_name || ''),
    role_id: user.role_id,
    dateRegistered: user.created_at ? new Date(user.created_at).toLocaleString() : '',
    lastUpdated: user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Never',
    lastSignIn: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
    email: user.email || '',
    contactNumber: user.contact_number || 'Not provided',
    birthDate: user.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'Not provided',
    emergencyContact: user.emergency_contact_name || 'Not provided',
    emergencyContactNumber: user.emergency_contact_number || 'Not provided',
  };

  return (
    <Box sx={containerStyles}>
      <Box sx={headerStyles}>
        <IconButton onClick={() => router.push('/egc-admin/user-management')} sx={{ color: "primary.main" }}><ChevronLeftIcon /></IconButton>
        <Typography variant="h4" color="primary.main" fontWeight="bold">User Profile</Typography>
      </Box>

      <Paper elevation={3} sx={profileCardStyles}>
        <CardContent sx={profileContentStyles}>
          <Box sx={profileHeaderStyles}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar alt={userData.fullName} src={user.pfp_id || "/avatar.png"} sx={avatarStyles} />
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>{userData.fullName}</Typography>
                <Typography color="primary.main" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>{userData.role}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Paper>

      <Paper elevation={2} sx={profileCardStyles}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="profile info tabs" sx={tabsStyles}>
          <Tab label="About Me" />
          <Tab label="Image Requirements" />
          <Tab label="Emergency Contact" />
        </Tabs>
        <Box sx={tabContentStyles}>
          {tabIndex === 0 && (
            <Box sx={infoSectionStyles}>
              <Box sx={infoBoxStyles}>
                <Typography variant="h6" sx={sectionTitleStyles}>Personal Information</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Employee ID:</Typography><Typography sx={valueStyles}>{userData.employeeId}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Full Name:</Typography><Typography sx={valueStyles}>{userData.fullName}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Contact Number:</Typography><Typography sx={valueStyles}>{userData.contactNumber}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Birth Date:</Typography><Typography sx={valueStyles}>{userData.birthDate}</Typography></Box>
                </Box>
              </Box>
              <Box sx={infoBoxStyles}>
                <Typography variant="h6" sx={sectionTitleStyles}>Account Information</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Email Address:</Typography><Typography sx={valueStyles}>{userData.email}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Role:</Typography><Typography sx={valueStyles}>{userData.role}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Date of Registration:</Typography><Typography sx={valueStyles}>{userData.dateRegistered}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Last Updated:</Typography><Typography sx={valueStyles}>{userData.lastUpdated}</Typography></Box>
                  <Box sx={infoItemStyles}><Typography sx={labelStyles}>Last Sign In:</Typography><Typography sx={valueStyles}>{userData.lastSignIn}</Typography></Box>
                </Box>
              </Box>
            </Box>
          )}
          {tabIndex === 1 && (
            <Box sx={imageContainerStyles}>
              <Box sx={imageBoxStyles}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={1}>{idTypeName ? `${idTypeName} (Front)` : 'ID Type (Front)'}</Typography>
                {user?.gov_id_proof ? <img src={user.gov_id_proof} alt="ID Front" style={imageStyles} /> : <Typography color="text.secondary">No image uploaded</Typography>}
              </Box>
              <Box sx={imageBoxStyles}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={1}>{idTypeName ? `${idTypeName} (Back)` : 'ID Type (Back)'}</Typography>
                {user?.gov_id_proof_back ? <img src={user.gov_id_proof_back} alt="ID Back" style={imageStyles} /> : <Typography color="text.secondary">No image uploaded</Typography>}
              </Box>
            </Box>
          )}
          {tabIndex === 2 && (
            <Box sx={infoBoxStyles}>
              <Typography variant="h6" sx={{ ...sectionTitleStyles, width: '100%' }}>Emergency Contact</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={infoItemStyles}><Typography sx={labelStyles}>Contact Name:</Typography><Typography sx={valueStyles}>{userData.emergencyContact}</Typography></Box>
                <Box sx={infoItemStyles}><Typography sx={labelStyles}>Contact Number:</Typography><Typography sx={valueStyles}>{userData.emergencyContactNumber}</Typography></Box>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 