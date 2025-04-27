import { Box, Card, CardContent, Typography, Grid } from "@mui/material"
import React from "react"

export default function page() {
  return (
    <Box p={4}>
      <Box mb={4}>
        <Typography variant="h3" color="primary.main" fontWeight={"bold"}>Dashboard</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", width: "35vh" }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">User Management</Typography>
              <Typography variant="body2" color="text.secondary">View Details</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", width: "35vh" }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">Delivery History & Reports</Typography>
              <Typography variant="body2" color="text.secondary">View Details</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", width: "35vh" }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">Luggage Tracking</Typography>
              <Typography variant="body2" color="text.secondary">View Details</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", width: "35vh" }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">Statistics</Typography>
              <Typography variant="body2" color="text.secondary">View Details</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", width: "35vh" }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">Message Center</Typography>
              <Typography variant="body2" color="text.secondary">View Details</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}