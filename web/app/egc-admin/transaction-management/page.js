"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, Menu, MenuItem, CircularProgress, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Collapse, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { PDFDownloadLink, Document, Page as PDFPage, Text, View, Font } from '@react-pdf/renderer';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Register fonts from local public/fonts directory
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: '/fonts/Roboto-VariableFont_wdth,wght.ttf',
            fontWeight: 'normal',
            fontStyle: 'normal',
        },
        {
            src: '/fonts/Roboto-VariableFont_wdth,wght.ttf',
            fontWeight: 'bold',
            fontStyle: 'normal',
        },
        {
            src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf',
            fontWeight: 'normal',
            fontStyle: 'italic',
        },
        {
            src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf',
            fontWeight: 'bold',
            fontStyle: 'italic',
        },
    ],
});
Font.register({
    family: 'NotoSans',
    src: 'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNb4g.woff2',
});

// Utility: format date for table
const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

// PDF Receipt component
const ReceiptPDF = ({ contracts = [], dateRange }) => {
    // Ensure contracts is always an array and has valid data
    const safeContracts = React.useMemo(() => {
        if (!Array.isArray(contracts)) return [];
        return contracts.filter(c => c && typeof c === 'object');
    }, [contracts]);

    // If no valid contracts, return empty document
    if (safeContracts.length === 0) {
        return (
            <Document>
                <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>No contracts selected</Text>
                    </View>
                </PDFPage>
            </Document>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } catch { return 'N/A'; }
    };

    // Calculate totals safely
    const subtotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_charge) || 0), 0);
    const surchargeTotal = safeContracts.reduce((sum, c) => sum + (Number(c.surcharge) || 0), 0);
    const discountAvg = safeContracts.length > 0 
        ? safeContracts.reduce((sum, c) => sum + (Number(c.discount) || 0), 0) / safeContracts.length 
        : 0;
    const getRowAmount = (c) => (Number(c.delivery_charge) || 0) + (Number(c.surcharge) || 0);
    const totalAmount = safeContracts.reduce((sum, c) => {
        const delivery_charge = Number(c.delivery_charge) || 0;
        const surcharge = Number(c.surcharge) || 0;
        const discount = Number(c.discount) || 0;
        return sum + (delivery_charge + surcharge) * (1 - discount / 100);
    }, 0);

    return (
        <Document>
            <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>GHE TRANSMITTAL - AIRPORT CLIENTS PROPERTY IRREGULARITY SUMMARY REPORT</Text>
                    <Text style={{ fontSize: 14, marginTop: 4 }}>{dateRange || 'No date range specified'}</Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' }}>
                        <Text style={{ flex: 0.5, fontWeight: 'bold', padding: 4 }}>No.</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 4 }}>NAME</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 4 }}>FLIGHT No.</Text>
                        <Text style={{ flex: 3, fontWeight: 'bold', padding: 4 }}>ADDRESS</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 4 }}>DATE RECEIVED</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4 }}>STATUS</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4 }}>AMOUNT</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 4 }}>REMARKS</Text>
                    </View>
                    {safeContracts.map((c, idx) => (
                        <View key={c.id || idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                            <Text style={{ flex: 0.5, padding: 4 }}>{idx + 1}</Text>
                            <Text style={{ flex: 2, padding: 4 }}>{c.luggage?.[0]?.luggage_owner || c.airline?.first_name || 'N/A'}</Text>
                            <Text style={{ flex: 1, padding: 4 }}>{c.luggage?.[0]?.flight_number || 'N/A'}</Text>
                            <Text style={{ flex: 3, padding: 4 }}>{c.luggage?.[0]?.address || c.drop_off_location || 'N/A'}</Text>
                            <Text style={{ flex: 2, padding: 4 }}>{formatDate(c.delivered_at || c.created_at)}</Text>
                            <Text style={{ flex: 1.5, padding: 4 }}>{c.contract_status?.status_name || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 4, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{getRowAmount(c).toFixed(2)}</Text>
                            <Text style={{ flex: 1, padding: 4 }}>{c.contract_status?.status_name === 'Delivery Failed' ? 'Delivery Failed' : ''}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 4, textAlign: 'right' }}>Subtotal:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{subtotal.toFixed(2)}</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 4, textAlign: 'right' }}>Surcharge Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{surchargeTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 4, textAlign: 'right' }}>Discount (Average):</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4, fontFamily: 'Roboto' }}>{discountAvg.toFixed(2)}%</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: '#000', backgroundColor: '#eee' }}>
                        <Text style={{ flex: 9.5, fontWeight: 'bold', padding: 4, textAlign: 'right' }}>TOTAL</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 4, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-between' }}>
                    <View>
                        <Text>Received by: _______________, Date: _______________</Text>
                        <Text style={{ fontWeight: 'bold', marginTop: 8 }}>AIRLINE'S REPRESENTATIVE</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text>GENERATED ON: {formatDate(new Date().toISOString())}</Text>
                        <Text>*************SUBMITTED ALL ORIGINAL SIGNED PIR*****</Text>
                        <Text>Total PIR submitted: {safeContracts.length}</Text>
                    </View>
                </View>
            </PDFPage>
        </Document>
    );
};

// Transaction management main logic
const TransactionManagement = () => {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
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
    const [shouldRenderPDF, setShouldRenderPDF] = useState(false);

    // Data fetching
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/admin');
                const json = await res.json();
                setData(json.data || []);
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter data based on selected month
    const filteredData = React.useMemo(() => {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        return data.filter(contract => {
            const contractDate = new Date(contract.created_at);
            return contractDate >= monthStart && contractDate <= monthEnd;
        });
    }, [data, selectedMonth]);

    // Table and dialog handlers
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
    const handleMenuClick = (event, row) => { setAnchorEl(event.currentTarget); setSelectedRow(row); };
    const handleMenuClose = () => { setAnchorEl(null); setSelectedRow(null); };
    const handleAction = (action) => {
        if (action === 'view' && selectedRow) { setDetailsContract(selectedRow); setDetailsOpen(true); }
        else if (action === 'surcharge' && selectedRow) { setSurchargeContract(selectedRow); setSurchargeValue(selectedRow.surcharge || ''); setSurchargeError(''); setSurchargeOpen(true); }
        else if (action === 'discount' && selectedRow) { setDiscountContract(selectedRow); setDiscountValue(selectedRow.discount || ''); setDiscountError(''); setDiscountOpen(true); }
        handleMenuClose();
    };
    const handleDetailsClose = () => { setDetailsOpen(false); setDetailsContract(null); };
    const handleSurchargeClose = () => { setSurchargeOpen(false); setSurchargeValue(''); setSurchargeError(''); setSurchargeContract(null); };
    const isSurchargeValid = (val) => { const num = Number(val); return !isNaN(num) && num >= 0; };
    const handleSurchargeSubmit = async () => {
        if (!surchargeContract) return;
        if (!isSurchargeValid(surchargeValue)) { setSurchargeError('Surcharge must be 0 or a positive number.'); return; }
        setSurchargeLoading(true); setSurchargeError('');
        try {
            const res = await fetch('/api/admin', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    action: 'updateSurcharge',
                    params: { 
                        contractId: surchargeContract.id, 
                        surcharge: Number(surchargeValue) 
                    }
                }) 
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update surcharge');
            setData((prev) => prev.map(row => row.id === surchargeContract.id ? { ...row, surcharge: Number(surchargeValue) || 0, total: (Number(row.delivery_charge) + Number(surchargeValue)) * (1 - (Number(row.discount) || 0) / 100) } : row));
            handleSurchargeClose();
        } catch (err) { setSurchargeError(err.message || 'Failed to update surcharge'); } finally { setSurchargeLoading(false); }
    };
    const handleDiscountClose = () => { setDiscountOpen(false); setDiscountValue(''); setDiscountError(''); setDiscountContract(null); };
    const isDiscountValid = (val) => { const num = Number(val); return !isNaN(num) && num >= 0 && num <= 100; };
    const handleDiscountSubmit = async () => {
        if (!discountContract) return;
        if (!isDiscountValid(discountValue)) { setDiscountError('Discount must be between 0 and 100.'); return; }
        setDiscountLoading(true); setDiscountError('');
        try {
            const res = await fetch('/api/admin', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    action: 'updateDiscount',
                    params: { 
                        contractId: discountContract.id, 
                        discount: Number(discountValue) 
                    }
                }) 
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update discount');
            setData((prev) => prev.map(row => row.id === discountContract.id ? { ...row, discount: Number(discountValue) || 0, total: (Number(row.delivery_charge) + Number(row.surcharge)) * (1 - (Number(discountValue) || 0) / 100) } : row));
            handleDiscountClose();
        } catch (err) { setDiscountError(err.message || 'Failed to update discount'); } finally { setDiscountLoading(false); }
    };
    const isRowSelected = (id) => selectedRows.includes(id);
    const handleSelectRow = (id) => {
        setSelectedRows((prev) => {
            const newSelection = prev.includes(id) 
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id];
            setShouldRenderPDF(false);
            return newSelection;
        });
    };
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => row.id);
            setSelectedRows((prev) => Array.from(new Set([...prev, ...allIds])));
        } else {
            const pageIds = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => row.id);
            setSelectedRows((prev) => prev.filter((id) => !pageIds.includes(id)));
        }
        setShouldRenderPDF(false);
    };
    const allPageRowsSelected = filteredData.length > 0 && filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).every((row) => selectedRows.includes(row.id));
    const somePageRowsSelected = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).some((row) => selectedRows.includes(row.id));
    const getSelectedContracts = () => {
        try {
            const selectedContracts = data.filter(row => selectedRows.includes(row.id));
            return selectedContracts.filter(contract => {
                const status = contract.contract_status?.status_name?.toLowerCase() || '';
                return ['delivered', 'delivery failed'].includes(status);
            });
        } catch (error) {
            console.error('Error getting selected contracts:', error);
            return [];
        }
    };
    const handleGeneratePDF = () => {
        const contracts = getSelectedContracts();
        if (contracts.length > 0) {
            const minDate = contracts.reduce((min, c) => c.created_at && c.created_at < min ? c.created_at : min, contracts[0].created_at);
            const maxDate = contracts.reduce((max, c) => c.created_at && c.created_at > max ? c.created_at : max, contracts[0].created_at);
            return `${formatDate(minDate)} TO ${formatDate(maxDate)}`;
        } else {
            return 'No Data';
        }
    };

    const handleMonthChange = (newDate) => {
        setSelectedMonth(newDate);
        setSelectedRows([]); // Reset selection when month changes
    };

    // Render
    if (loading) return (<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading...</Typography></Box>);
    if (error) return (<Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>);
    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                        onClick={() => router.push('/egc-admin')} 
                        sx={{ 
                            color: 'primary.main',
                            mr: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(93, 135, 54, 0.1)'
                            }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h4" color="primary.main">Transaction Management</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            views={['month', 'year']}
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            slotProps={{
                                textField: {
                                    variant: 'outlined',
                                    size: 'small',
                                    sx: { width: 200 }
                                }
                            }}
                        />
                    </LocalizationProvider>
                    {shouldRenderPDF ? (
                        <PDFDownloadLink 
                            document={<ReceiptPDF contracts={getSelectedContracts()} dateRange={handleGeneratePDF()} />}
                            fileName={`GHE-Transmittal-Report-${format(selectedMonth, 'MMMM-yyyy')}.pdf`}
                        >
                            {({ loading, error }) => (
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    disabled={loading || error}
                                    sx={{ 
                                        position: 'relative',
                                        '&::after': {
                                            content: `"${getSelectedContracts().length}"`,
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 20,
                                            height: 20,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                >
                                    {loading ? 'Generating PDF...' : error ? 'Error generating PDF' : 'Generate PDF Receipt'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="secondary"
                            onClick={() => setShouldRenderPDF(true)}
                            sx={{ 
                                position: 'relative',
                                '&::after': {
                                    content: `"${getSelectedContracts().length}"`,
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }
                            }}
                        >
                            Generate PDF Receipt
                        </Button>
                    )}
                </Box>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                <Checkbox 
                                    indeterminate={somePageRowsSelected && !allPageRowsSelected} 
                                    checked={allPageRowsSelected} 
                                    onChange={handleSelectAll} 
                                    inputProps={{ 'aria-label': 'select all contracts' }}
                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                />
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>Contract ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white' }}>Completion Date</TableCell>
                            <TableCell sx={{ color: 'white' }}>Drop Off</TableCell>
                            <TableCell sx={{ color: 'white' }}>Airline Name</TableCell>
                            <TableCell sx={{ color: 'white' }}>Delivery Name</TableCell>
                            <TableCell sx={{ color: 'white' }}>Charge</TableCell>
                            <TableCell sx={{ color: 'white' }}>Surcharge</TableCell>
                            <TableCell sx={{ color: 'white' }}>Discount</TableCell>
                            <TableCell sx={{ color: 'white' }}>Total</TableCell>
                            <TableCell sx={{ color: 'white' }}>Created At</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                            let airlineName = row.airline_id || '';
                            if (row.airline) {
                                const { first_name, middle_initial, last_name, suffix } = row.airline;
                                airlineName = [first_name, middle_initial, last_name, suffix].filter(Boolean).join(' ').replace(/  +/g, ' ').trim();
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
                                        <Checkbox checked={isRowSelected(row.id)} onChange={() => handleSelectRow(row.id)} inputProps={{ 'aria-label': `select contract ${row.id}` }} />
                                    </TableCell>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{status}</TableCell>
                                    <TableCell>{formatDate(row.delivered_at)}</TableCell>
                                    <TableCell>{row.drop_off_location}</TableCell>
                                    <TableCell>{airlineName}</TableCell>
                                    <TableCell>{deliveryName}</TableCell>
                                    <TableCell>₱{delivery_charge.toFixed(2)}</TableCell>
                                    <TableCell>₱{surcharge.toFixed(2)}</TableCell>
                                    <TableCell>{discount !== undefined ? `${discount}%` : '0%'}</TableCell>
                                    <TableCell>₱{total.toFixed(2)}</TableCell>
                                    <TableCell>{formatDate(row.created_at)}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}><MoreVertIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination 
                    rowsPerPageOptions={[10]} 
                    component="div" 
                    count={filteredData.length} 
                    rowsPerPage={rowsPerPage} 
                    page={page} 
                    onPageChange={handleChangePage} 
                    onRowsPerPageChange={handleChangeRowsPerPage} 
                />
            </TableContainer>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleAction('view')}>View Details</MenuItem>
                <MenuItem onClick={() => handleAction('surcharge')}>Surcharge</MenuItem>
                <MenuItem onClick={() => handleAction('discount')}>Discount</MenuItem>
            </Menu>
            <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
                <DialogTitle>Contract Details</DialogTitle>
                <DialogContent dividers>
                    {detailsContract && (
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{detailsContract.id}</span></Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Location Information</Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: 'text.primary' }}>{detailsContract.pickup_location || 'N/A'}</span></Typography>
                                {detailsContract.pickup_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup Coordinates:</b> <span style={{ color: 'text.primary' }}>{detailsContract.pickup_location_geo.coordinates[1].toFixed(6)}, {detailsContract.pickup_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{detailsContract.drop_off_location || 'N/A'}</span></Typography>
                                {detailsContract.drop_off_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off Coordinates:</b> <span style={{ color: 'text.primary' }}>{detailsContract.drop_off_location_geo.coordinates[1].toFixed(6)}, {detailsContract.drop_off_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
                                {detailsContract.delivery_charge !== null && !isNaN(Number(detailsContract.delivery_charge)) ? (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Price:</b> <span style={{ color: 'text.primary' }}>₱{Number(detailsContract.delivery_charge).toLocaleString()}</span></Typography>) : (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Price:</b> <span style={{ color: 'text.primary' }}>N/A</span></Typography>)}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Contractor Information</Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Name:</b> <span style={{ color: 'text.primary' }}>{detailsContract.airline ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${detailsContract.airline.last_name || ''}${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Email:</b> <span style={{ color: 'text.primary' }}>{detailsContract.airline?.email || 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Contact:</b> <span style={{ color: 'text.primary' }}>{detailsContract.airline?.contact_number || 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Name:</b> <span style={{ color: 'text.primary' }}>{detailsContract.delivery ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${detailsContract.delivery.last_name || ''}${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Email:</b> <span style={{ color: 'text.primary' }}>{detailsContract.delivery?.email || 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Contact:</b> <span style={{ color: 'text.primary' }}>{detailsContract.delivery?.contact_number || 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Status:</b> <span style={{ color: 'primary.main', fontWeight: 700 }}>{detailsContract.contract_status?.status_name || 'N/A'}</span></Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Luggage Information</Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                {detailsContract.luggage && detailsContract.luggage.length === 0 && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}>No luggage info.</Typography>)}
                                {detailsContract.luggage && detailsContract.luggage.map((l, lidx) => (<Box key={`luggage-${detailsContract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}><Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>Luggage {lidx + 1}</Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Case Number: <span style={{ color: 'text.primary' }}>{l.case_number || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Description: <span style={{ color: 'text.primary' }}>{l.item_description || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Weight: <span style={{ color: 'text.primary' }}>{l.weight ? `${l.weight} kg` : 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Contact: <span style={{ color: 'text.primary' }}>{l.contact_number || 'N/A'}</span></Typography></Box>))}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Timeline</Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Created:</b> <span style={{ color: 'text.primary' }}>{formatDate(detailsContract.created_at)}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Accepted:</b> <span style={{ color: 'text.primary' }}>{detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: 'text.primary' }}>{detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Delivered:</b> <span style={{ color: 'text.primary' }}>{detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}</span></Typography>
                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Cancelled:</b> <span style={{ color: 'text.primary' }}>{detailsContract.cancelled_at ? formatDate(detailsContract.cancelled_at) : 'N/A'}</span></Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDetailsClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={surchargeOpen} onClose={handleSurchargeClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Surcharge</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the surcharge amount for contract <b>{surchargeContract?.id}</b>:</Typography>
                    <TextField label="Surcharge" type="text" value={surchargeValue} onChange={e => setSurchargeValue(e.target.value)} fullWidth margin="normal" inputProps={{ min: 0 }} disabled={surchargeLoading} />
                    {surchargeError && <Typography color="error">{surchargeError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSurchargeClose} disabled={surchargeLoading}>Cancel</Button>
                    <Button onClick={handleSurchargeSubmit} color="primary" disabled={surchargeLoading || surchargeValue === ''}>{surchargeLoading ? 'Saving...' : 'Save'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={discountOpen} onClose={handleDiscountClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Discount (%)</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the discount percentage for contract <b>{discountContract?.id}</b>:</Typography>
                    <TextField label="Discount (%)" type="text" value={discountValue} onChange={e => setDiscountValue(e.target.value)} fullWidth margin="normal" inputProps={{ min: 0, max: 100 }} disabled={discountLoading} />
                    {discountError && <Typography color="error">{discountError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDiscountClose} disabled={discountLoading}>Cancel</Button>
                    <Button onClick={handleDiscountSubmit} color="primary" disabled={discountLoading || discountValue === ''}>{discountLoading ? 'Saving...' : 'Save'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TransactionManagement;