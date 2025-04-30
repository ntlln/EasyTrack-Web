"use client";

import { useState } from "react";
import { Box, MenuItem, TextField, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Menu, Pagination } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function Page() {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const deliveries = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    passengerName: "placeholder",
    passengerContact: "placeholder",
    deliveryAddress: "placeholder",
    airportLocation: "placeholder",
    luggageType: "placeholder",
    luggageQuantity: "placeholder",
    assignedPersonnel: "placeholder",
    vehicleDetails: "placeholder",
    pickupTime: "placeholder",
    estimatedDeliveryTime: "placeholder",
    currentStatus: "placeholder",
  }));

  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
  };

  const handleOpenMenu = (event, account) => {
    setAnchorEl(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAccount(null);
  };

  const handleTrack = () => {
    console.log("Track", selectedAccount);
    handleCloseMenu();
  };

  const handleContact = () => {
    console.log("Contact", selectedAccount);
    handleCloseMenu();
  };

  const handleRefresh = () => {
    console.log("Refreshed!");
    // In a real app, you could re-fetch data here
  };

  const totalPages = Math.ceil(deliveries.length / rowsPerPage);

  return (
    <Box p={4} display="flex" flexDirection="column" gap={4}>
      <Box>
        <Typography variant="h3" color="primary.main" fontWeight="bold">
          Luggage Tracking
        </Typography>
      </Box>

      {/* Top bar with Refresh and Search aligned right */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
        <TextField label="Search" size="small" sx={{ width: "250px" }} />
      </Box>

      <Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tracking ID</TableCell>
                <TableCell>Passenger Name</TableCell>
                <TableCell>Passenger Contact Number</TableCell>
                <TableCell>Delivery Address</TableCell>
                <TableCell>Airport Location</TableCell>
                <TableCell>Luggage Type</TableCell>
                <TableCell>Luggage Quantity</TableCell>
                <TableCell>Assigned Delivery Personnel</TableCell>
                <TableCell>Delivery Vehicle Details</TableCell>
                <TableCell>Pickup Time</TableCell>
                <TableCell>Estimated Delivery Time</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {deliveries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{delivery.id}</TableCell>
                    <TableCell>{delivery.passengerName}</TableCell>
                    <TableCell>{delivery.passengerContact}</TableCell>
                    <TableCell>{delivery.deliveryAddress}</TableCell>
                    <TableCell>{delivery.airportLocation}</TableCell>
                    <TableCell>{delivery.luggageType}</TableCell>
                    <TableCell>{delivery.luggageQuantity}</TableCell>
                    <TableCell>{delivery.assignedPersonnel}</TableCell>
                    <TableCell>{delivery.vehicleDetails}</TableCell>
                    <TableCell>{delivery.pickupTime}</TableCell>
                    <TableCell>{delivery.estimatedDeliveryTime}</TableCell>
                    <TableCell>{delivery.currentStatus}</TableCell>
                    <TableCell>
                      <IconButton onClick={(event) => handleOpenMenu(event, delivery)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Pagination with Showing info */}
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2} flexWrap="wrap">
            <Typography variant="body2">
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, deliveries.length)} of {deliveries.length} ongoing deliveries
            </Typography>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handleChangePage}
              color="primary"
              shape="rounded"
              siblingCount={1}
              boundaryCount={2}
              showFirstButton
              showLastButton
            />
          </Box>
        </TableContainer>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={handleTrack}>Track</MenuItem>
        <MenuItem onClick={handleContact}>Contact</MenuItem>
      </Menu>
    </Box>
  );
}