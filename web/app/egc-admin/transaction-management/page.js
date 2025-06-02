"use client";

import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    Collapse,
    TextField,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

const TransactionManagement = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsContract, setDetailsContract] = useState(null);
    const [surchargeOpen, setSurchargeOpen] = useState(false);
    const [surchargeValue, setSurchargeValue] = useState('');
    const [surchargeLoading, setSurchargeLoading] = useState(false);
    const [surchargeError, setSurchargeError] = useState('');
    const [surchargeContract, setSurchargeContract] = useState(null);
    const [discountOpen, setDiscountOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState('');
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState('');
    const [discountContract, setDiscountContract] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/admin/contracts');
                const json = await res.json();
                if (json.data) {
                    setData(json.data);
                } else {
                    setData([]);
                }
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        if (action === 'view' && selectedRow) {
            setDetailsContract(selectedRow);
            setDetailsOpen(true);
        } else if (action === 'surcharge' && selectedRow) {
            setSurchargeContract(selectedRow);
            setSurchargeValue(selectedRow.surcharge || '');
            setSurchargeError('');
            setSurchargeOpen(true);
        } else if (action === 'discount' && selectedRow) {
            setDiscountContract(selectedRow);
            setDiscountValue(selectedRow.discount || '');
            setDiscountError('');
            setDiscountOpen(true);
        }
        handleMenuClose();
    };

    const handleDetailsClose = () => {
        setDetailsOpen(false);
        setDetailsContract(null);
    };

    const handleSurchargeClose = () => {
        setSurchargeOpen(false);
        setSurchargeValue('');
        setSurchargeError('');
        setSurchargeContract(null);
    };

    // Surcharge validation helper (allow 0 or any positive number)
    const isSurchargeValid = (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    };

    const handleSurchargeSubmit = async () => {
        if (!surchargeContract) return;
        if (!isSurchargeValid(surchargeValue)) {
            setSurchargeError('Surcharge must be 0 or a positive number.');
            return;
        }
        setSurchargeLoading(true);
        setSurchargeError('');
        try {
            const res = await fetch('/api/admin/transactions/surcharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId: surchargeContract.id, surcharge: Number(surchargeValue) })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update surcharge');
            // Update local data
            setData((prev) => prev.map(row => {
                if (row.id === surchargeContract.id) {
                    const delivery_charge = Number(row.delivery_charge) || 0;
                    const surcharge = Number(surchargeValue) || 0;
                    const discount = Number(row.discount) || 0;
                    const total = (delivery_charge + surcharge) * (1 - discount / 100);
                    return { ...row, surcharge, total };
                }
                return row;
            }));
            handleSurchargeClose();
        } catch (err) {
            setSurchargeError(err.message || 'Failed to update surcharge');
        } finally {
            setSurchargeLoading(false);
        }
    };

    const handleDiscountClose = () => {
        setDiscountOpen(false);
        setDiscountValue('');
        setDiscountError('');
        setDiscountContract(null);
    };

    // Discount validation helper
    const isDiscountValid = (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 100;
    };

    const handleDiscountSubmit = async () => {
        if (!discountContract) return;
        if (!isDiscountValid(discountValue)) {
            setDiscountError('Discount must be between 0 and 100.');
            return;
        }
        setDiscountLoading(true);
        setDiscountError('');
        try {
            const res = await fetch('/api/admin/transactions/discount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId: discountContract.id, discount: Number(discountValue) })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update discount');
            // Update local data and recalculate total
            setData((prev) => prev.map(row => {
                if (row.id === discountContract.id) {
                    const delivery_charge = Number(row.delivery_charge) || 0;
                    const surcharge = Number(row.surcharge) || 0;
                    const discount = Number(discountValue) || 0;
                    const total = (delivery_charge + surcharge) * (1 - discount / 100);
                    return { ...row, discount, total };
                }
                return row;
            }));
            handleDiscountClose();
        } catch (err) {
            setDiscountError(err.message || 'Failed to update discount');
        } finally {
            setDiscountLoading(false);
        }
    };

    const isRowSelected = (id) => selectedRows.includes(id);
    const handleSelectRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => row.id);
            setSelectedRows((prev) => Array.from(new Set([...prev, ...allIds])));
        } else {
            const pageIds = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => row.id);
            setSelectedRows((prev) => prev.filter((id) => !pageIds.includes(id)));
        }
    };
    const allPageRowsSelected = data.length > 0 && data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).every((row) => selectedRows.includes(row.id));
    const somePageRowsSelected = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).some((row) => selectedRows.includes(row.id));

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading...</Typography>
            </Box>
        );
    }
    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" color="primary.main" sx={{ mb: 3 }}>
                Transaction Management
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={somePageRowsSelected && !allPageRowsSelected}
                                    checked={allPageRowsSelected}
                                    onChange={handleSelectAll}
                                    inputProps={{ 'aria-label': 'select all contracts' }}
                                />
                            </TableCell>
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
                        {data
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                // Compose airline name from available fields
                                let airlineName = row.airline_id || '';
                                if (row.airline) {
                                    const { first_name, middle_initial, last_name, suffix } = row.airline;
                                    airlineName = [first_name, middle_initial, last_name, suffix]
                                        .filter(Boolean)
                                        .join(' ')
                                        .replace(/  +/g, ' ')
                                        .trim();
                                    if (!airlineName) airlineName = row.airline_id || '';
                                }
                                const deliveryName = row.delivery ? `${row.delivery.first_name || ''} ${row.delivery.last_name || ''}`.trim() : row.delivery_id || '';
                                const status = row.contract_status?.status_name || row.contract_status_id || '';
                                const delivery_charge = Number(row.delivery_charge) || 0;
                                const surcharge = Number(row.surcharge) || 0;
                                const discount = Number(row.discount) || 0;
                                const total = (delivery_charge + surcharge) * (1 - discount / 100);
                                return (
                                    <TableRow key={row.id} selected={isRowSelected(row.id)}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={isRowSelected(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                                inputProps={{ 'aria-label': `select contract ${row.id}` }}
                                            />
                                        </TableCell>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell>{status}</TableCell>
                                        <TableCell>{formatDate(row.delivered_at)}</TableCell>
                                        <TableCell>{row.drop_off_location}</TableCell>
                                        <TableCell>{airlineName}</TableCell>
                                        <TableCell>{deliveryName}</TableCell>
                                        <TableCell>${delivery_charge}</TableCell>
                                        <TableCell>${surcharge}</TableCell>
                                        <TableCell>{discount !== undefined ? `${discount}%` : '0%'}</TableCell>
                                        <TableCell>${total}</TableCell>
                                        <TableCell>{formatDate(row.created_at)}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuClick(e, row)}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10]}
                    component="div"
                    count={data.length}
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
                <MenuItem onClick={() => handleAction('surcharge')}>Surcharge</MenuItem>
                <MenuItem onClick={() => handleAction('discount')}>Discount</MenuItem>
            </Menu>
            {/* Details Dialog */}
            <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
                <DialogTitle>Contract Details</DialogTitle>
                <DialogContent dividers>
                    {detailsContract && (
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{detailsContract.id}</span>
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Location Information
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Pickup:</b> <span style={{ color: 'text.primary' }}>{detailsContract.pickup_location || 'N/A'}</span>
                                </Typography>
                                {detailsContract.pickup_location_geo && (
                                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                        <b>Pickup Coordinates:</b>{' '}
                                        <span style={{ color: 'text.primary' }}>
                                            {detailsContract.pickup_location_geo.coordinates[1].toFixed(6)}, {detailsContract.pickup_location_geo.coordinates[0].toFixed(6)}
                                        </span>
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{detailsContract.drop_off_location || 'N/A'}</span>
                                </Typography>
                                {detailsContract.drop_off_location_geo && (
                                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                        <b>Drop-off Coordinates:</b>{' '}
                                        <span style={{ color: 'text.primary' }}>
                                            {detailsContract.drop_off_location_geo.coordinates[1].toFixed(6)}, {detailsContract.drop_off_location_geo.coordinates[0].toFixed(6)}
                                        </span>
                                    </Typography>
                                )}
                                {detailsContract.delivery_charge !== null && !isNaN(Number(detailsContract.delivery_charge)) ? (
                                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                        <b>Price:</b> <span style={{ color: 'text.primary' }}>₱{Number(detailsContract.delivery_charge).toLocaleString()}</span>
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                        <b>Price:</b> <span style={{ color: 'text.primary' }}>N/A</span>
                                    </Typography>
                                )}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Contractor Information
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Contractor Name:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>
                                        {detailsContract.airline
                                            ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${detailsContract.airline.last_name || ''}${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim()
                                            : 'N/A'}
                                    </span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Contractor Email:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.airline?.email || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Contractor Contact:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.airline?.contact_number || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Subcontractor Name:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>
                                        {detailsContract.delivery
                                            ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${detailsContract.delivery.last_name || ''}${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim()
                                            : 'N/A'}
                                    </span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Subcontractor Email:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.delivery?.email || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Subcontractor Contact:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.delivery?.contact_number || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Status:</b>{' '}
                                    <span style={{ color: 'primary.main', fontWeight: 700 }}>
                                        {detailsContract.contract_status?.status_name || 'N/A'}
                                    </span>
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Luggage Information
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                {detailsContract.luggage && detailsContract.luggage.length === 0 && (
                                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                        No luggage info.
                                    </Typography>
                                )}
                                {detailsContract.luggage && detailsContract.luggage.map((l, lidx) => (
                                    <Box key={`luggage-${detailsContract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                            Luggage {lidx + 1}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                            Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                            Case Number: <span style={{ color: 'text.primary' }}>{l.case_number || 'N/A'}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                            Description: <span style={{ color: 'text.primary' }}>{l.item_description || 'N/A'}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                            Weight: <span style={{ color: 'text.primary' }}>{l.weight ? `${l.weight} kg` : 'N/A'}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                            Contact: <span style={{ color: 'text.primary' }}>{l.contact_number || 'N/A'}</span>
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Timeline
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Created:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{formatDate(detailsContract.created_at)}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Accepted:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Pickup:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Delivered:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                    <b>Cancelled:</b>{' '}
                                    <span style={{ color: 'text.primary' }}>{detailsContract.cancelled_at ? formatDate(detailsContract.cancelled_at) : 'N/A'}</span>
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDetailsClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
            {/* Surcharge Dialog */}
            <Dialog open={surchargeOpen} onClose={handleSurchargeClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Surcharge</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the surcharge amount for contract <b>{surchargeContract?.id}</b>:</Typography>
                    <TextField
                        label="Surcharge"
                        type="text"
                        value={surchargeValue}
                        onChange={e => setSurchargeValue(e.target.value)}
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0 }}
                        disabled={surchargeLoading}
                    />
                    {surchargeError && <Typography color="error">{surchargeError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSurchargeClose} disabled={surchargeLoading}>Cancel</Button>
                    <Button onClick={handleSurchargeSubmit} color="primary" disabled={surchargeLoading || surchargeValue === ''}>
                        {surchargeLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Discount Dialog */}
            <Dialog open={discountOpen} onClose={handleDiscountClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Discount (%)</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the discount percentage for contract <b>{discountContract?.id}</b>:</Typography>
                    <TextField
                        label="Discount (%)"
                        type="text"
                        value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0, max: 100 }}
                        disabled={discountLoading}
                    />
                    {discountError && <Typography color="error">{discountError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDiscountClose} disabled={discountLoading}>Cancel</Button>
                    <Button onClick={handleDiscountSubmit} color="primary" disabled={discountLoading || discountValue === ''}>
                        {discountLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TransactionManagement;