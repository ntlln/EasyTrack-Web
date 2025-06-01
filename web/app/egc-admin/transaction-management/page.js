"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const TransactionManagement = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    // Mock data - replace with actual data from your API
    const mockData = [
        {
            id: 1,
            contractId: 'CT001',
            status: 'Completed',
            completionDate: '2024-03-20',
            dropOff: 'Terminal 1',
            airlineName: 'Emirates',
            deliveryName: 'John Doe',
            charge: 100,
            surcharge: 10,
            discount: 5,
            total: 105,
            createdAt: '2024-03-19',
        },
        // Add more mock data as needed
    ];

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleAction = (action) => {
        // Handle different actions here
        console.log(`Action ${action} for row:`, selectedRow);
        handleMenuClose();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" color="primary.main" sx={{ mb: 3 }}>
                Transaction Management
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Contract ID</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Completion Date</TableCell>
                            <TableCell>Drop Off</TableCell>
                            <TableCell>Airline Name</TableCell>
                            <TableCell>Delivery Name</TableCell>
                            <TableCell>Charge</TableCell>
                            <TableCell>Surcharge</TableCell>
                            <TableCell>Discount</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockData
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.contractId}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                    <TableCell>{row.completionDate}</TableCell>
                                    <TableCell>{row.dropOff}</TableCell>
                                    <TableCell>{row.airlineName}</TableCell>
                                    <TableCell>{row.deliveryName}</TableCell>
                                    <TableCell>${row.charge}</TableCell>
                                    <TableCell>${row.surcharge}</TableCell>
                                    <TableCell>${row.discount}</TableCell>
                                    <TableCell>${row.total}</TableCell>
                                    <TableCell>{row.createdAt}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuClick(e, row)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10]}
                    component="div"
                    count={mockData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleAction('view')}>View Details</MenuItem>
                <MenuItem onClick={() => handleAction('edit')}>Edit</MenuItem>
                <MenuItem onClick={() => handleAction('delete')}>Delete</MenuItem>
            </Menu>
        </Box>
    );
};

export default TransactionManagement;