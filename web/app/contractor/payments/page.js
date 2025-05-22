"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, TextField, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Pagination, InputAdornment, Button } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';

export default function Page() {
    const [page, setPage] = useState(0);
    const router = useRouter();
    const rowsPerPage = 5;

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
        deliveryStatus: "Completed",
        deliveryIssuesReported: "placeholder",
        resolutionStatus: "placeholder"
    }));

    const totalPages = Math.ceil(transactions.length / rowsPerPage);

    const handleChangePage = (event, newPage) => setPage(newPage - 1);
    const handleRefresh = () => console.log("Refreshed!");
    const handlePay = () => router.push("/contractor/payments/payment-frame");

    return (
        <Box p={0}>
            <Typography variant="h3" fontWeight="bold" color="primary.main" mb={3}>Payments</Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <TextField size="small" placeholder="Search for transaction" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ borderRadius: "10px", width: 320, boxShadow: 1 }} />

                <Box display="flex" gap={2}>
                    <Button variant="contained" startIcon={<PaymentIcon />} onClick={handlePay} sx={{ textTransform: "none", px: 2, py: 1, fontSize: 14 }}>Pay</Button>
                    <IconButton onClick={handleRefresh} sx={{ bgcolor: "#4a4a4a", color: "#fff", borderRadius: "5px", px: 2, py: 1, fontSize: 14, "&:hover": { bgcolor: "#333" } }}><RefreshIcon sx={{ mr: 1 }} /> Refresh</IconButton>
                </Box>
            </Box>

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
                            <TableCell>Pickup Time</TableCell>
                            <TableCell>Delivery Time</TableCell>
                            <TableCell>Total Transit Time</TableCell>
                            <TableCell>Delivery Status</TableCell>
                            <TableCell>Delivery Issues Reported</TableCell>
                            <TableCell>Resolution Status</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.id}</TableCell>
                                <TableCell>{row.passengerName}</TableCell>
                                <TableCell>{row.passengerContact}</TableCell>
                                <TableCell>{row.deliveryAddress}</TableCell>
                                <TableCell>{row.airportLocation}</TableCell>
                                <TableCell>{row.luggageType}</TableCell>
                                <TableCell>{row.luggageQuantity}</TableCell>
                                <TableCell>{row.assignedPersonnel}</TableCell>
                                <TableCell>{row.pickupTime}</TableCell>
                                <TableCell>{row.deliveryTime}</TableCell>
                                <TableCell>{row.totalTransitTime}</TableCell>
                                <TableCell>{row.deliveryStatus}</TableCell>
                                <TableCell>{row.deliveryIssuesReported}</TableCell>
                                <TableCell>{row.resolutionStatus}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" alignItems="center" px={1} py={3}>
                <Typography variant="body2">Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, transactions.length)} of {transactions.length} completed deliveries</Typography>
                <Pagination count={totalPages} page={page + 1} onChange={handleChangePage} color="primary" shape="rounded" showFirstButton showLastButton />
            </Box>
        </Box>
    );
}