"use client";

import { useState, useEffect } from "react";
import { Box, MenuItem, TextField, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Menu, Pagination, InputAdornment } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

export default function Page() {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactions = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    passengerName: "placeholder",
    passengerContact: "placeholder",
    deliveryAddress: "placeholder",
    airportLocation: "placeholder",
    luggageType: "placeholder",
    luggageQuantity: "placeholder",
    assignedPersonnel: "placeholder",
    pickupTime: "placeholder",
    deliveryTime: "placeholder",
    totalTransitTime: "placeholder",
    deliveryStatus: i % 4 === 0 ? "Failed" : i % 3 === 0 ? "Pending" : i % 2 === 0 ? "Completed" : "In Transit",
    deliveryIssuesReported: "placeholder",
    resolutionStatus: "placeholder",
  }));

  const totalTransactions = transactions.length;
  const completedCount = transactions.filter(t => t.deliveryStatus === "Completed").length;
  const pendingCount = transactions.filter(t => t.deliveryStatus === "Pending").length;
  const failedCount = transactions.filter(t => t.deliveryStatus === "Failed").length;

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
    setFromDate(null);
    setToDate(null);
  };

  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  return (
    <Box sx={{ pt: 4, display: "flex", flexDirection: "column", gap: 4, overflowX: "hidden" }}>
      <Box><Typography variant="h3" color="primary.main" fontWeight="bold">History & Reports</Typography></Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <TextField placeholder="Search for transaction" size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ flex: "1", minWidth: "250px" }} />

        <Box sx={{ px: 2, py: 1, borderRadius: 2, border: "1px solid #ccc", minWidth: "120px", textAlign: "center" }}><Typography variant="body2" fontWeight="bold">Total</Typography><Typography>{totalTransactions.toLocaleString()}</Typography></Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, border: "1px solid #ccc", minWidth: "120px", textAlign: "center" }}><Typography variant="body2" fontWeight="bold">Completed</Typography><Typography>{completedCount.toLocaleString()}</Typography></Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, border: "1px solid #ccc", minWidth: "120px", textAlign: "center" }}><Typography variant="body2" fontWeight="bold">Pending</Typography><Typography>{pendingCount.toLocaleString()}</Typography></Box>
        <Box sx={{ px: 2, py: 1, borderRadius: 2, border: "1px solid #ccc", minWidth: "120px", textAlign: "center" }}><Typography variant="body2" fontWeight="bold">Failed</Typography><Typography>{failedCount.toLocaleString()}</Typography></Box>

        {mounted && (
          <>
            <TextField size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }} sx={{ minWidth: "150px" }} value={fromDate || ""} onChange={(e) => setFromDate(e.target.value)} />
            <TextField size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }} sx={{ minWidth: "150px" }} value={toDate || ""} onChange={(e) => setToDate(e.target.value)} />
          </>
        )}

        <IconButton onClick={handleRefresh} sx={{ border: "1px solid #ccc", borderRadius: 2, p: 1 }}><RefreshIcon /></IconButton>
      </Box>

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <TableContainer component={Paper} sx={{ maxWidth: "100vw" }}>
          <Table sx={{ width: "100%" }}>
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
                <TableCell>Pickup Time</TableCell>
                <TableCell>Delivery Time</TableCell>
                <TableCell>Total Transit Time</TableCell>
                <TableCell>Delivery Status</TableCell>
                <TableCell>Delivery Issues Reported</TableCell>
                <TableCell>Resolution Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.passengerName}</TableCell>
                  <TableCell>{transaction.passengerContact}</TableCell>
                  <TableCell>{transaction.deliveryAddress}</TableCell>
                  <TableCell>{transaction.airportLocation}</TableCell>
                  <TableCell>{transaction.luggageType}</TableCell>
                  <TableCell>{transaction.luggageQuantity}</TableCell>
                  <TableCell>{transaction.assignedPersonnel}</TableCell>
                  <TableCell>{transaction.pickupTime}</TableCell>
                  <TableCell>{transaction.deliveryTime}</TableCell>
                  <TableCell>{transaction.totalTransitTime}</TableCell>
                  <TableCell>{transaction.deliveryStatus}</TableCell>
                  <TableCell>{transaction.deliveryIssuesReported}</TableCell>
                  <TableCell>{transaction.resolutionStatus}</TableCell>
                  <TableCell><IconButton onClick={(event) => handleOpenMenu(event, transaction)}><MoreVertIcon /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2">Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, transactions.length)} of {transactions.length} transactions</Typography>
            <Pagination count={totalPages} page={page + 1} onChange={handleChangePage} color="primary" shape="rounded" siblingCount={1} boundaryCount={2} showFirstButton showLastButton />
          </Box>
        </TableContainer>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        <MenuItem onClick={handleTrack}>Track</MenuItem>
        <MenuItem onClick={handleContact}>Contact</MenuItem>
      </Menu>
    </Box>
  );
}