'use client';

import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Avatar, Divider } from '@mui/material';

export default function ProfilePage() {
    const user = {
        fullName: "Ana Reyes Dela Cruz",
        employeeId: "AIR123456",
        role: "System Administrator",
        dateRegistered: "January 1, 2024",
        email: "ana.********@airline.com",
        password: "********",
    };

    return (
        <Box p={3}>
            <Typography variant="h4" mb={3}>Profile</Typography>

            {/* Profile Card */}
            <Card sx={{ mb: 4 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar alt={user.fullName} src="/avatar.png" sx={{ width: 80, height: 80 }} />
                        <Box>
                            <Typography variant="h6">{user.fullName}</Typography>
                            <Typography color="text.secondary">{user.role}</Typography>
                        </Box>
                    </Box>
                    <Button variant="outlined" component="label">
                        Update Profile Picture
                        <input hidden accept="image/*" multiple type="file" />
                    </Button>
                </CardContent>
            </Card>

            {/* Information Section */}
            <Grid container spacing={2}>
                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2}>Personal Information</Typography>
                            <Typography><strong>Full Name:</strong> {user.fullName}</Typography>
                            <Typography><strong>Employee ID:</strong> {user.employeeId}</Typography>
                            <Typography><strong>Role:</strong> {user.role}</Typography>
                            <Typography><strong>Date of Registration:</strong> {user.dateRegistered}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Account Credentials */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" mb={2}>Account Credentials</Typography>
                            <Typography><strong>Email Address:</strong> {user.email}</Typography>
                            <Typography><strong>Password:</strong> {user.password}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Buttons */}
            <Box display="flex" gap={2} mt={4}>
                <Button variant="contained" color="success">
                    Show Credentials
                </Button>
                <Button variant="contained" color="inherit">
                    Edit Account
                </Button>
            </Box>

            {/* Delete Account */}
            <Box mt={2}>
                <Button variant="contained" color="error">
                    Delete Account
                </Button>
            </Box>
        </Box>
    );
}