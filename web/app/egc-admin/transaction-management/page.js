"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, Menu, MenuItem, CircularProgress, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Collapse, TextField, Snackbar, Alert, Tabs, Tab, FormControl, InputLabel, Select } from '@mui/material';
import { useRouter } from 'next/navigation';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { PDFDownloadLink, Document, Page as PDFPage, Text, View, Font, Image } from '@react-pdf/renderer';
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
            <PDFPage size="A4" style={{ padding: 12, fontSize: 10, fontFamily: 'Roboto' }}>
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>GHE TRANSMITTAL - AIRPORT CLIENTS PROPERTY IRREGULARITY SUMMARY REPORT</Text>
                    <Text style={{ fontSize: 14, marginTop: 2 }}>{dateRange || 'No date range specified'}</Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' }}>
                        <Text style={{ flex: 0.5, fontWeight: 'bold', padding: 2 }}>No.</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2 }}>Tracking ID</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 2 }}>Luggage Owner</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2 }}>Flight No.</Text>
                        <Text style={{ flex: 3, fontWeight: 'bold', padding: 2 }}>Address</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 2 }}>Date Received</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2 }}>Status</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2 }}>Amount</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2 }}>Remarks</Text>
                    </View>
                    {safeContracts.map((c, idx) => (
                        <View key={c.id || idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                            <Text style={{ flex: 0.5, padding: 2 }}>{idx + 1}</Text>
                            <Text style={{ flex: 1, padding: 2 }}>{c.id}</Text>
                            <Text style={{ flex: 2, padding: 2 }}>{c.luggage?.[0]?.luggage_owner || 'N/A'}</Text>
                            <Text style={{ flex: 1, padding: 2 }}>{c.luggage?.[0]?.flight_number || 'N/A'}</Text>
                            <Text style={{ flex: 3, padding: 2 }}>{c.drop_off_location || 'N/A'}</Text>
                            <Text style={{ flex: 2, padding: 2 }}>{formatDate(c.delivered_at || c.created_at)}</Text>
                            <Text style={{ flex: 1.5, padding: 2 }}>{c.contract_status?.status_name || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{getRowAmount(c).toFixed(2)}</Text>
                            <Text style={{ flex: 1, padding: 2 }}>{c.contract_status?.status_name === 'Delivery Failed' ? 'Delivery Failed' : ''}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 2, textAlign: 'right' }}>Subtotal:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{subtotal.toFixed(2)}</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 2, textAlign: 'right' }}>Surcharge Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{surchargeTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 7.5, fontWeight: 'bold', padding: 2, textAlign: 'right' }}>Discount (Average):</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto' }}>{discountAvg.toFixed(2)}%</Text>
                        <Text style={{ flex: 2 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: '#000', backgroundColor: '#eee' }}>
                        <Text style={{ flex: 9.5, fontWeight: 'bold', padding: 2, textAlign: 'right' }}>TOTAL</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto' }}>{'\u20B1\u00A0'}{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
                    <View>
                        <Text>Received by: _______________, Date: _______________</Text>
                        <Text style={{ fontWeight: 'bold', marginTop: 4 }}>AIRLINE'S REPRESENTATIVE</Text>
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
    const [tabValue, setTabValue] = useState(0);
    const [selectedPricingType, setSelectedPricingType] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [priceValue, setPriceValue] = useState('');
    const [pricingRegions, setPricingRegions] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(true);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingPrice, setLoadingPrice] = useState(false);
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
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [pdfDownloadRef, setPdfDownloadRef] = useState(null);
    const [pricingTable, setPricingTable] = useState([]);
    const [loadingPricingTable, setLoadingPricingTable] = useState(true);
    const [pricingPage, setPricingPage] = useState(0);
    const [pricingRowsPerPage, setPricingRowsPerPage] = useState(10);
    const [selectedPricingRows, setSelectedPricingRows] = useState([]);
    const [regionFilter, setRegionFilter] = useState('');
    const [citySearch, setCitySearch] = useState('');
    // Add new state for edit price dialog
    const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
    const [editPriceValue, setEditPriceValue] = useState('');
    const [editPriceLoading, setEditPriceLoading] = useState(false);
    const [editPriceError, setEditPriceError] = useState('');
    const [selectedPricingRow, setSelectedPricingRow] = useState(null);
    // Add new state for confirmation dialog
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingPriceUpdate, setPendingPriceUpdate] = useState(null);

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

    // Fetch pricing regions
    useEffect(() => {
        const fetchPricingRegions = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'getPricingRegion'
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch pricing regions');
                }

                const data = await response.json();
                setPricingRegions(data.regions || []);
            } catch (error) {
                console.error('Error fetching pricing regions:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to load pricing regions',
                    severity: 'error'
                });
            } finally {
                setLoadingRegions(false);
            }
        };

        fetchPricingRegions();
    }, []);

    // Fetch cities when region changes
    useEffect(() => {
        if (!selectedLocation) {
            setCities([]);
            setSelectedCity('');
            return;
        }
        setLoadingCities(true);
        setSelectedCity('');
        const fetchCities = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getCitiesByRegion',
                        params: { region_id: selectedLocation }
                    })
                });
                if (!response.ok) throw new Error('Failed to fetch cities');
                const data = await response.json();
                setCities(data.cities || []);
            } catch (error) {
                setCities([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load cities',
                    severity: 'error'
                });
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, [selectedLocation]);

    // Fetch price when city changes
    useEffect(() => {
        if (!selectedCity) {
            setPriceValue('');
            return;
        }
        setLoadingPrice(true);
        const fetchPrice = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getPriceByCity',
                        params: { city_id: selectedCity }
                    })
                });
                if (!response.ok) throw new Error('Failed to fetch price');
                const data = await response.json();
                setPriceValue(data.price ?? '');
            } catch (error) {
                setPriceValue('');
                setSnackbar({
                    open: true,
                    message: 'Failed to load price',
                    severity: 'error'
                });
            } finally {
                setLoadingPrice(false);
            }
        };
        fetchPrice();
    }, [selectedCity]);

    // Fetch all pricing data for the table
    useEffect(() => {
        if (tabValue !== 1) return;
        setLoadingPricingTable(true);
        const fetchPricingTable = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getAllPricing' })
                });
                if (!response.ok) throw new Error('Failed to fetch pricing table');
                const data = await response.json();
                setPricingTable(data.pricing || []);
            } catch (error) {
                setPricingTable([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load pricing table',
                    severity: 'error'
                });
            } finally {
                setLoadingPricingTable(false);
            }
        };
        fetchPricingTable();
    }, [tabValue]);

    // Filter data based on selected month using created_at
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
                return status !== 'cancelled';
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
        setPage(0); // Reset to first page when month changes
    };

    // Modify the existing PDF button click handler
    const handlePDFButtonClick = () => {
        const contracts = getSelectedContracts();
        if (contracts.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please select at least one delivered or delivery failed contract',
                severity: 'warning'
            });
            return;
        }
        setShouldRenderPDF(true);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        // Reset form when switching tabs
        if (newValue === 1) {
            setSelectedPricingType('');
            setSelectedLocation('');
            setPriceValue('');
        }
    };

    // Checkbox handlers
    const isPricingRowSelected = (id) => selectedPricingRows.includes(id);
    const handleSelectPricingRow = (id) => {
        setSelectedPricingRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };
    const handleSelectAllPricingRows = (event) => {
        if (event.target.checked) {
            const pageRowIds = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).map((row) => row.id);
            setSelectedPricingRows((prev) => Array.from(new Set([...prev, ...pageRowIds])));
        } else {
            const pageRowIds = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).map((row) => row.id);
            setSelectedPricingRows((prev) => prev.filter((id) => !pageRowIds.includes(id)));
        }
    };
    const allPagePricingRowsSelected = pricingTable.length > 0 && pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).every((row) => selectedPricingRows.includes(row.id));
    const somePagePricingRowsSelected = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).some((row) => selectedPricingRows.includes(row.id));

    // Get unique regions for filter
    const uniqueRegions = Array.from(new Set(pricingTable.map(row => row.region))).filter(Boolean);

    // Filtered table data
    const filteredPricingTable = pricingTable.filter(row => {
        const regionMatch = !regionFilter || row.region === regionFilter;
        const cityMatch = !citySearch || row.city.toLowerCase().includes(citySearch.toLowerCase());
        return regionMatch && cityMatch;
    });

    // Pagination logic
    const paginatedPricingTable = filteredPricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage);
    const pageCount = Math.ceil(filteredPricingTable.length / pricingRowsPerPage);

    // Pagination controls
    const handleFirstPage = () => setPricingPage(0);
    const handleLastPage = () => setPricingPage(pageCount - 1);
    const handlePrevPage = () => setPricingPage(prev => Math.max(prev - 1, 0));
    const handleNextPage = () => setPricingPage(prev => Math.min(prev + 1, pageCount - 1));
    const handleSkipBack = () => setPricingPage(prev => Math.max(prev - 10, 0));
    const handleSkipForward = () => setPricingPage(prev => Math.min(prev + 10, pageCount - 1));
    const handleRowsPerPageChange = (event) => {
        setPricingRowsPerPage(parseInt(event.target.value, 10));
        setPricingPage(0);
    };

    // Modify the edit price handlers
    const handleEditPriceClick = (row) => {
        setSelectedPricingRow(row);
        setEditPriceValue(row.price.toString());
        setEditPriceError('');
        setEditPriceDialogOpen(true);
    };

    const handleEditPriceClose = () => {
        setEditPriceDialogOpen(false);
        setEditPriceValue('');
        setEditPriceError('');
        setSelectedPricingRow(null);
    };

    const handleEditPriceSubmit = () => {
        if (!selectedPricingRow) return;
        
        const newPrice = Number(editPriceValue);
        if (isNaN(newPrice) || newPrice < 0) {
            setEditPriceError('Please enter a valid price (0 or greater)');
            return;
        }

        // Store the pending update and show confirmation dialog
        setPendingPriceUpdate({
            city_id: selectedPricingRow.id,
            price: newPrice,
            city: selectedPricingRow.city,
            region: selectedPricingRow.region,
            oldPrice: selectedPricingRow.price
        });
        setConfirmDialogOpen(true);
        handleEditPriceClose();
    };

    const handleConfirmUpdate = async () => {
        if (!pendingPriceUpdate) return;

        setEditPriceLoading(true);
        setEditPriceError('');

        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updatePrice',
                    params: {
                        city_id: pendingPriceUpdate.city_id,
                        price: pendingPriceUpdate.price
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update price');
            }

            const { data } = await response.json();

            // Update the local state with the new price and updated_at timestamp
            setPricingTable(prev => prev.map(row => 
                row.id === pendingPriceUpdate.city_id 
                    ? { 
                        ...row, 
                        price: pendingPriceUpdate.price,
                        updated_at: data.updated_at 
                    }
                    : row
            ));

            setSnackbar({
                open: true,
                message: 'Price updated successfully',
                severity: 'success'
            });
        } catch (error) {
            setEditPriceError(error.message || 'Failed to update price');
            setSnackbar({
                open: true,
                message: error.message || 'Failed to update price',
                severity: 'error'
            });
        } finally {
            setEditPriceLoading(false);
            setConfirmDialogOpen(false);
            setPendingPriceUpdate(null);
        }
    };

    const handleCancelUpdate = () => {
        setConfirmDialogOpen(false);
        setPendingPriceUpdate(null);
    };

    // Render
    if (loading) return (<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading...</Typography></Box>);
    if (error) return (<Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>);
    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="transaction management tabs"
                    centered
                >
                    <Tab label="Transaction Management" />
                    <Tab label="Pricing Update" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
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
                                    document={<ReceiptPDF 
                                        contracts={getSelectedContracts()} 
                                        dateRange={handleGeneratePDF()} 
                                    />}
                                    fileName={`GHE-Transmittal-Report-${format(selectedMonth, 'MMMM-yyyy')}.pdf`}
                                >
                                    {({ loading, error }) => (
                                        <Button 
                                            variant="contained" 
                                            color="secondary"
                                            disabled={loading || error}
                                        >
                                            {loading ? 'Generating PDF...' : error ? 'Error generating PDF' : 'Download PDF Receipt'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            ) : (
                                <Button 
                                    variant="contained" 
                                    color={selectedRows.length > 0 ? "primary" : "secondary"}
                                    onClick={handlePDFButtonClick}
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
                                    <TableCell sx={{ color: 'white' }}>Tracking ID</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Luggage Owner</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Flight No.</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Address</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Date Received</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Remarks</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                                    const status = row.contract_status?.status_name || row.contract_status_id || '';
                                    const delivery_charge = Number(row.delivery_charge) || 0;
                                    const surcharge = Number(row.surcharge) || 0;
                                    const discount = Number(row.discount) || 0;
                                    const total = (delivery_charge + surcharge) * (1 - discount / 100);
                                    const remarks = status === 'Delivery Failed' ? 'Delivery Failed' : '';
                                    
                                    return (
                                        <TableRow key={row.id} selected={isRowSelected(row.id)}>
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isRowSelected(row.id)} onChange={() => handleSelectRow(row.id)} inputProps={{ 'aria-label': `select contract ${row.id}` }} />
                                            </TableCell>
                                            <TableCell>{row.id}</TableCell>
                                            <TableCell>{row.luggage?.[0]?.luggage_owner || 'N/A'}</TableCell>
                                            <TableCell>{row.luggage?.[0]?.flight_number || 'N/A'}</TableCell>
                                            <TableCell>{row.drop_off_location || 'N/A'}</TableCell>
                                            <TableCell>{formatDate(row.delivered_at || row.created_at)}</TableCell>
                                            <TableCell>{status}</TableCell>
                                            <TableCell>₱{total.toFixed(2)}</TableCell>
                                            <TableCell>{remarks}</TableCell>
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
                </Box>
            )}

            {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                    <Box sx={{ width: '100%', mb: 4 }}>
                        {/* Filters */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <FormControl sx={{ minWidth: 180 }} size="small">
                                <InputLabel id="region-filter-label">Filter by Region</InputLabel>
                                <Select
                                    labelId="region-filter-label"
                                    value={regionFilter}
                                    label="Filter by Region"
                                    onChange={e => setRegionFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Regions</MenuItem>
                                    {uniqueRegions.map(region => (
                                        <MenuItem key={region} value={region}>{region}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                size="small"
                                label="Search City"
                                value={citySearch}
                                onChange={e => setCitySearch(e.target.value)}
                                sx={{ minWidth: 180 }}
                            />
                        </Box>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                        <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                            <Checkbox
                                                indeterminate={somePagePricingRowsSelected && !allPagePricingRowsSelected}
                                                checked={allPagePricingRowsSelected}
                                                onChange={handleSelectAllPricingRows}
                                                inputProps={{ 'aria-label': 'select all pricing rows' }}
                                                sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: 'white' }}><b>Region</b></TableCell>
                                        <TableCell sx={{ color: 'white' }}><b>City</b></TableCell>
                                        <TableCell align="right" sx={{ color: 'white' }}><b>Price (₱)</b></TableCell>
                                        <TableCell sx={{ color: 'white' }}><b>Last Updated</b></TableCell>
                                        <TableCell sx={{ color: 'white' }} align="center"><b>Action</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingPricingTable ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <CircularProgress size={24} /> Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedPricingTable.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No pricing data available</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPricingTable.map((row) => (
                                            <TableRow key={row.id} selected={isPricingRowSelected(row.id)}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isPricingRowSelected(row.id)}
                                                        onChange={() => handleSelectPricingRow(row.id)}
                                                        inputProps={{ 'aria-label': `select pricing row ${row.id}` }}
                                                    />
                                                </TableCell>
                                                <TableCell>{row.region}</TableCell>
                                                <TableCell>{row.city}</TableCell>
                                                <TableCell align="right">₱{row.price}</TableCell>
                                                <TableCell>
                                                    {row.updated_at ? new Date(row.updated_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'Never'}
                                                </TableCell>
                                                <TableCell align="center" sx={{ p: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => handleEditPriceClick(row)}
                                                        >
                                                            Edit Price
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {/* Custom Pagination Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <InputLabel id="rows-per-page-label">Rows</InputLabel>
                                <Select
                                    labelId="rows-per-page-label"
                                    value={pricingRowsPerPage}
                                    label="Rows"
                                    onChange={handleRowsPerPageChange}
                                >
                                    {[10, 25, 50, 100].map(opt => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button onClick={handleFirstPage} disabled={pricingPage === 0}>&laquo; First</Button>
                                <Button onClick={handleSkipBack} disabled={pricingPage < 10}>&lt;&lt; -10</Button>
                                <Button onClick={handlePrevPage} disabled={pricingPage === 0}>&lt; Prev</Button>
                                <Typography sx={{ mx: 1 }}>Page {pageCount === 0 ? 0 : pricingPage + 1} of {pageCount}</Typography>
                                <Button onClick={handleNextPage} disabled={pricingPage >= pageCount - 1}>Next &gt;</Button>
                                <Button onClick={handleSkipForward} disabled={pricingPage > pageCount - 11}>+10 &gt;&gt;</Button>
                                <Button onClick={handleLastPage} disabled={pricingPage >= pageCount - 1}>Last &raquo;</Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}

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
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            {/* Add the Edit Price Dialog */}
            <Dialog 
                open={editPriceDialogOpen} 
                onClose={handleEditPriceClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Edit Price</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ pt: 1 }}>
                        <Typography gutterBottom>
                            Update price for {selectedPricingRow?.city} ({selectedPricingRow?.region})
                        </Typography>
                        <TextField
                            label="Price (₱)"
                            type="number"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 0, step: "0.01" }}
                            disabled={editPriceLoading}
                            error={!!editPriceError}
                            helperText={editPriceError}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleEditPriceClose} 
                        disabled={editPriceLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEditPriceSubmit} 
                        color="primary"
                        disabled={editPriceLoading || !editPriceValue}
                    >
                        {editPriceLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Add the Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelUpdate}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Confirm Price Update</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ pt: 1 }}>
                        <Typography gutterBottom>
                            Are you sure you want to update the price for {pendingPriceUpdate?.city} ({pendingPriceUpdate?.region})?
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Current Price: ₱{pendingPriceUpdate?.oldPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                New Price: ₱{pendingPriceUpdate?.price}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Price Difference: ₱{(pendingPriceUpdate?.price - pendingPriceUpdate?.oldPrice).toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCancelUpdate}
                        disabled={editPriceLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmUpdate}
                        color="primary"
                        disabled={editPriceLoading}
                        variant="contained"
                    >
                        {editPriceLoading ? 'Updating...' : 'Confirm Update'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TransactionManagement;