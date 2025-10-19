"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Box, Tabs, Tab, Typography, Paper, Button, CircularProgress, Divider, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Radio, Snackbar, TablePagination, Select, MenuItem, useTheme, FormControl, InputLabel } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'N/A';
  }
};

const dateOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
];

function filterByDate(contracts, filter) {
  if (filter === 'all') return contracts;
  const now = new Date();
  return contracts.filter(contract => {
    const createdAt = contract.created_at ? new Date(contract.created_at) : null;
    if (!createdAt) return false;
    switch (filter) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return createdAt.toDateString() === yesterday.toDateString();
      }
      case 'thisWeek': {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfWeek && createdAt <= lastDayOfWeek;
      }
      case 'lastWeek': {
        const firstDayOfThisWeek = new Date(now);
        firstDayOfThisWeek.setDate(now.getDate() - now.getDay());
        firstDayOfThisWeek.setHours(0,0,0,0);
        const firstDayOfLastWeek = new Date(firstDayOfThisWeek);
        firstDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 7);
        const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
        lastDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() + 6);
        lastDayOfLastWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfLastWeek && createdAt <= lastDayOfLastWeek;
      }
      case 'thisMonth':
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      case 'lastMonth': {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        return createdAt.getMonth() === lastMonth.getMonth() && createdAt.getFullYear() === lastMonth.getFullYear();
      }
      case 'thisYear':
        return createdAt.getFullYear() === now.getFullYear();
      case 'lastYear':
        return createdAt.getFullYear() === now.getFullYear() - 1;
      default:
        return true;
    }
  });
}

const ContractList = ({ onTrackContract, initialSearch, setRedirectContractId, initialStatus }) => {
  const [contractList, setContractList] = useState([]);
  const [contractListLoading, setContractListLoading] = useState(false);
  const [contractListError, setContractListError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsContract, setDetailsContract] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pickupImageUrl, setPickupImageUrl] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState('');
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [deliveryImageUrl, setDeliveryImageUrl] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'transit', label: 'Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);

  const fetchContracts = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setContractListLoading(true);
    }
    setContractListError(null);
    try {
      const response = await fetch('/api/admin?action=allContracts');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch contracts');
      }

      setContractList(result.data || []);
    } catch (err) {
      setContractListError(err.message || 'Failed to fetch contracts');
    } finally {
      if (isInitialLoad) {
        setContractListLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;

    fetchContracts(true);

    const interval = setInterval(() => {
      fetchContracts(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  const filteredContracts = contractList.filter(contract => {
    if (statusFilter !== 'all') {
      const statusId = contract.contract_status?.id;
      const statusMap = {
        'available': 1,
        'accepted': 3,
        'transit': [4, 7],
        'delivered': 5,
        'failed': 6,
        'cancelled': 2
      };
      const expectedStatus = statusMap[statusFilter];
      if (Array.isArray(expectedStatus)) {
        if (!expectedStatus.includes(statusId)) return false;
      } else if (statusId !== expectedStatus) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const search = searchQuery.trim().toLowerCase();
      const idMatch = String(contract.id).toLowerCase().includes(search);
      const pickupMatch = (contract.pickup_location || '').toLowerCase().includes(search);
      const dropoffMatch = (contract.drop_off_location || '').toLowerCase().includes(search);
      const statusMatch = (contract.contract_status?.status_name || '').toLowerCase().includes(search);
      if (!(idMatch || pickupMatch || dropoffMatch || statusMatch)) return false;
    }

    return true;
  });

  const getFilteredContracts = () => {
    const dateFiltered = filterByDate(filteredContracts, dateFilter);
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return dateFiltered.slice(startIndex, endIndex);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCancelClick = (contractId) => {
    setSelectedContractId(contractId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedContractId) return;
    setCancelling(true);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancelContract',
          params: { contractId: selectedContractId }
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to cancel contract');
      
      setSnackbarMessage('Contract cancelled successfully');
      setSnackbarOpen(true);
      
      const contractsResponse = await fetch('/api/admin?action=allContracts');
      const contractsResult = await contractsResponse.json();
      if (contractsResponse.ok) {
        setContractList(contractsResult.data || []);
      }
    } catch (err) {
      setSnackbarMessage(err.message || 'Failed to cancel contract');
      setSnackbarOpen(true);
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setSelectedContractId(null);
    }
  };

  const handleCancelClose = () => {
    setCancelDialogOpen(false);
    setSelectedContractId(null);
  };

  const handleViewDetails = (contract) => {
    setDetailsContract(contract);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setDetailsContract(null);
  };

  const openProofOfPickup = async (contractId) => {
    setPickupDialogOpen(true);
    setPickupLoading(true);
    setPickupError('');
    setPickupImageUrl(null);
    try {
      const res = await fetch(`/api/admin?action=getProofOfPickup&contractId=${contractId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch proof of pickup');
      setPickupImageUrl(data.proof_of_pickup);
    } catch (e) {
      setPickupError(e.message || 'Failed to fetch proof of pickup');
    } finally {
      setPickupLoading(false);
    }
  };

  const openProofOfDelivery = async (contractId) => {
    setDeliveryDialogOpen(true);
    setDeliveryLoading(true);
    setDeliveryError('');
    setDeliveryImageUrl(null);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProofOfDelivery', params: { contract_id: contractId } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch proof of delivery');
      setDeliveryImageUrl(data.proof_of_delivery);
    } catch (e) {
      setDeliveryError(e.message || 'Failed to fetch proof of delivery');
    } finally {
      setDeliveryLoading(false);
    }
  };

  return (
    <Box>
      {/* Filters moved into table toolbar below */}

      {contractListLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {contractListError && (
        <Typography color="error" align="center">{contractListError}</Typography>
      )}
      {!contractListLoading && !contractListError && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, px: '10px', pb: 1, flexWrap: 'wrap' }}>
            <Box sx={{ flexShrink: 0 }}>
              <TablePagination
                rowsPerPageOptions={[15, 25, 50, 100]}
                component="div"
                count={filteredContracts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filter by Status"
                >
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
                <InputLabel>Filter by Date</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Filter by Date"
                >
                  {dateOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search Contract"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
                  endAdornment: (
                    searchQuery ?
                      <ClearIcon 
                        fontSize="small" 
                        onClick={() => setSearchQuery('')} 
                        sx={{ cursor: 'pointer', color: 'text.secondary' }}
                      /> : null
                  )
                }}
              />
            </Box>
          </Box>
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, width: 'calc(100% - 20px)', mx: '10px' }}>
            <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contract ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pickup Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Drop-off Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Flight Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Airline Personnel</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Delivery Personnel</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timeline</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contractList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography color="text.secondary">No contracts found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredContracts().map((contract) => (
                  <TableRow key={`contract-${contract.id}`} hover>
                    <TableCell>{contract.id}</TableCell>
                    <TableCell>{contract.pickup_location || 'N/A'}</TableCell>
                    <TableCell>{contract.drop_off_location || 'N/A'}</TableCell>
                    <TableCell>{contract.flight_number || 'N/A'}</TableCell>
                    <TableCell>
                      {contract.luggage?.[0]?.address || 
                       `${contract.delivery_address || ''} ${contract.address_line_1 || ''} ${contract.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 
                       'N/A'}
                    </TableCell>
                    <TableCell>
                      {contract.delivery_charge !== null && !isNaN(Number(contract.delivery_charge))
                        ? `₱${Number(contract.delivery_charge).toLocaleString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {contract.airline
                        ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${
                            contract.airline.last_name || ''
                          }${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`
                            .replace(/  +/g, ' ')
                            .trim()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {contract.delivery
                        ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${
                            contract.delivery.last_name || ''
                          }${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`
                            .replace(/  +/g, ' ')
                            .trim()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{contract.contract_status?.status_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2"><b>Created:</b> {formatDate(contract.created_at)}</Typography>
                      <Typography variant="body2"><b>Accepted:</b> {contract.accepted_at ? formatDate(contract.accepted_at) : 'N/A'}</Typography>
                      <Typography variant="body2"><b>Pickup:</b> {contract.pickup_at ? formatDate(contract.pickup_at) : 'N/A'}</Typography>
                      <Typography variant="body2"><b>Delivered:</b> {contract.delivered_at ? formatDate(contract.delivered_at) : 'N/A'}</Typography>
                      <Typography variant="body2"><b>Cancelled:</b> {contract.cancelled_at ? formatDate(contract.cancelled_at) : 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<LocationOnIcon />}
                          onClick={() => onTrackContract(contract.id)}
                          disabled={contract.contract_status?.id === 5 || contract.contract_status?.id === 2 || contract.contract_status?.id === 6}
                          fullWidth
                        >
                          Track
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewDetails(contract)}
                          fullWidth
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => openProofOfPickup(contract.id)}
                          disabled={contract.contract_status?.id === 2}
                          fullWidth
                        >
                          Proof of Pickup
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => openProofOfDelivery(contract.id)}
                          disabled={contract.contract_status?.id === 2}
                          fullWidth
                        >
                          Proof of Delivery
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleCancelClick(contract.id)}
                          disabled={[2,5,6].includes(contract.contract_status?.id)}
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}

      {/* Update pagination controls */}
      {!contractListLoading && !contractListError && filteredContracts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[15, 25, 50, 100]}
            component="div"
            count={filteredContracts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
          />
        </Box>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelClose}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this contract? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose} disabled={cancelling}>
            No, Keep It
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog for Contract List */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent dividers>
          {detailsContract && (
            <Box sx={{ minWidth: 400 }}>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Contract ID: <span style={{ color: 'primary.main', fontWeight: 400 }}>{detailsContract.id}</span>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Location Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Pickup:</b> <span>{detailsContract.pickup_location || 'N/A'}</span>
                </Typography>
                {detailsContract.pickup_location_geo && (
                  <Typography variant="body2">
                    <b>Pickup Coordinates:</b>{' '}
                    <span>
                      {detailsContract.pickup_location_geo.coordinates[1].toFixed(6)}, {detailsContract.pickup_location_geo.coordinates[0].toFixed(6)}
                    </span>
                  </Typography>
                )}
                <Typography variant="body2">
                  <b>Drop-off:</b> <span>{detailsContract.drop_off_location || 'N/A'}</span>
                </Typography>
                {detailsContract.drop_off_location_geo && (
                  <Typography variant="body2">
                    <b>Drop-off Coordinates:</b>{' '}
                    <span>
                      {detailsContract.drop_off_location_geo.coordinates[1].toFixed(6)}, {detailsContract.drop_off_location_geo.coordinates[0].toFixed(6)}
                    </span>
                  </Typography>
                )}
                {detailsContract.delivery_charge !== null && !isNaN(Number(detailsContract.delivery_charge)) ? (
                  <Typography variant="body2">
                    <b>Price:</b> <span>₱{Number(detailsContract.delivery_charge).toLocaleString()}</span>
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    <b>Price:</b> <span>N/A</span>
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Passenger Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                {detailsContract.luggage.length === 0 && (
                  <Typography variant="body2">
                    No passenger info.
                  </Typography>
                )}
                {detailsContract.luggage.map((l, lidx) => (
                  <Box key={`luggage-${detailsContract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                    <Typography variant="body2">
                      <b>Name:</b> <span>{l.luggage_owner || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Contact Number:</b> <span>{l.contact_number || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Address:</b> <span>{l.address || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Quantity:</b> <span>{l.quantity || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Description:</b> <span>{l.item_description || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Flight Number:</b> <span>{l.flight_number || 'N/A'}</span>
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Airline Personnel Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Airline Personnel:</b>{' '}
                  <span>
                    {detailsContract.airline
                      ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${
                          detailsContract.airline.last_name || ''
                        }${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Email:</b>{' '}
                  <span>{detailsContract.airline?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Contact:</b>{' '}
                  <span>{detailsContract.airline?.contact_number || 'N/A'}</span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Delivery Personnel Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Delivery Personnel:</b>{' '}
                  <span>
                    {detailsContract.delivery
                      ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${
                          detailsContract.delivery.last_name || ''
                        }${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Email:</b>{' '}
                  <span>{detailsContract.delivery?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Contact:</b>{' '}
                  <span>{detailsContract.delivery?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Status:</b>{' '}
                  <span style={{ color: 'primary.main', fontWeight: 700 }}>
                    {detailsContract.contract_status?.status_name || 'N/A'}
                  </span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Timeline
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Created:</b>{' '}
                  <span>{formatDate(detailsContract.created_at)}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Accepted:</b>{' '}
                  <span>
                    {detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Pickup:</b>{' '}
                  <span>
                    {detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Delivered:</b>{' '}
                  <span>
                    {detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Cancelled:</b>{' '}
                  <span>
                    {detailsContract.cancelled_at ? formatDate(detailsContract.cancelled_at) : 'N/A'}
                  </span>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Proof of Pickup Dialog */}
      <Dialog open={pickupDialogOpen} onClose={() => setPickupDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Proof of Pickup</DialogTitle>
        <DialogContent dividers>
          {pickupLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {!pickupLoading && pickupError && (
            <Typography color="error">{pickupError}</Typography>
          )}
          {!pickupLoading && !pickupError && pickupImageUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
              <img 
                src={pickupImageUrl} 
                alt="Proof of Pickup" 
                style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }} 
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Proof of Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onClose={() => setDeliveryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Proof of Delivery</DialogTitle>
        <DialogContent dividers>
          {deliveryLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {!deliveryLoading && deliveryError && (
            <Typography color="error">{deliveryError}</Typography>
          )}
          {!deliveryLoading && !deliveryError && deliveryImageUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
              <img 
                src={deliveryImageUrl} 
                alt="Proof of Delivery" 
                style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }} 
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'primary.main',
            color: '#fff'
          }
        }}
      />
    </Box>
  );
};

const LuggageAssignments = ({ onAssignmentComplete }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsContract, setDetailsContract] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const contractsResponse = await fetch('/api/admin');
      const contractsResult = await contractsResponse.json();

      if (!contractsResponse.ok) {
        throw new Error(contractsResult.error || 'Failed to fetch contracts');
      }

      const availableContracts = (contractsResult.data || []).filter(
        contract => contract.contract_status?.id === 1
      );
      
      setAssignments(availableContracts);

      const personnelResponse = await fetch('/api/admin?action=delivery-personnel');
      const personnelResult = await personnelResponse.json();

      if (!personnelResponse.ok) {
        throw new Error(personnelResult.error || 'Failed to fetch delivery personnel');
      }

      setDeliveryPersonnel(personnelResult.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;

    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  const handleAssign = (contract) => {
    setSelectedContract(contract);
    setAssignDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setAssignDialogOpen(false);
    setSelectedContract(null);
    setSelectedPersonnel(null);
  };

  const handleConfirmAssign = async () => {
    if (!selectedContract || !selectedPersonnel) return;

    setAssigning(true);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignContract',
          params: {
            contractId: selectedContract.id,
            deliveryId: selectedPersonnel.id,
            accepted_at: new Date().toISOString()
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign contract');
      }

      setAssignments(prev => prev.filter(c => c.id !== selectedContract.id));
      handleCloseDialog();
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedContract.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to assign contract');
    } finally {
      setAssigning(false);
    }
  };

  const handleViewDetails = (contract) => {
    setDetailsContract(contract);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setDetailsContract(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPaginatedAssignments = () => {
    const dateFiltered = filterByDate(assignments, dateFilter);
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return dateFiltered.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" sx={{ my: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flexShrink: 0 }}>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={assignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 2 }}>Filter by Date:</Typography>
          <Select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180, bgcolor: isDark ? theme.palette.background.paper : '#fff', color: theme.palette.text.primary, borderRadius: 1 }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDark ? theme.palette.background.paper : '#fff',
                  color: theme.palette.text.primary,
                },
              },
            }}
          >
            {dateOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contract ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pickup Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Drop-off Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Flight Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Airline Personnel</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Delivery Personnel</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timeline</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography color="text.secondary">No available contracts for assignment</Typography>
                </TableCell>
              </TableRow>
            ) : (
              getPaginatedAssignments().map((assignment) => (
                <TableRow 
                  key={assignment.id} 
                  hover
                  sx={{
                    opacity: assignment.contract_status?.id === 2 ? 0.5 : 1,
                    '&:hover': {
                      opacity: assignment.contract_status?.id === 2 ? 0.5 : 1
                    }
                  }}
                >
                  <TableCell>{assignment.id}</TableCell>
                  <TableCell>{assignment.pickup_location || 'N/A'}</TableCell>
                  <TableCell>{assignment.drop_off_location || 'N/A'}</TableCell>
                  <TableCell>{assignment.luggage?.[0]?.flight_number || 'N/A'}</TableCell>
                  <TableCell>
                    {assignment.luggage?.[0]?.address || 
                     `${assignment.delivery_address || ''} ${assignment.address_line_1 || ''} ${assignment.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 
                     'N/A'}
                  </TableCell>
                  <TableCell>
                    {assignment.delivery_charge !== null && !isNaN(Number(assignment.delivery_charge))
                      ? `₱${Number(assignment.delivery_charge).toLocaleString()}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {assignment.airline
                      ? `${assignment.airline.first_name || ''} ${assignment.airline.middle_initial || ''} ${
                          assignment.airline.last_name || ''
                        }${assignment.airline.suffix ? ` ${assignment.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {assignment.delivery
                      ? `${assignment.delivery.first_name || ''} ${assignment.delivery.middle_initial || ''} ${
                          assignment.delivery.last_name || ''
                        }${assignment.delivery.suffix ? ` ${assignment.delivery.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{assignment.contract_status?.status_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2"><b>Created:</b> {formatDate(assignment.created_at)}</Typography>
                    <Typography variant="body2"><b>Accepted:</b> {assignment.accepted_at ? formatDate(assignment.accepted_at) : 'N/A'}</Typography>
                    <Typography variant="body2"><b>Pickup:</b> {assignment.pickup_at ? formatDate(assignment.pickup_at) : 'N/A'}</Typography>
                    <Typography variant="body2"><b>Delivered:</b> {assignment.delivered_at ? formatDate(assignment.delivered_at) : 'N/A'}</Typography>
                    <Typography variant="body2"><b>Cancelled:</b> {assignment.cancelled_at ? formatDate(assignment.cancelled_at) : 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '120px' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewDetails(assignment)}
                        fullWidth
                        disabled={assignment.contract_status?.id === 2}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAssign(assignment)}
                        fullWidth
                        disabled={assignment.contract_status?.id === 2}
                      >
                        Assign
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add pagination for assignments */}
      {assignments.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={assignments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
          />
        </Box>
      )}

      {/* Assignment Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Delivery Personnel</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a delivery personnel to assign:
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {deliveryPersonnel.map((personnel) => (
                <Box
                  key={personnel.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    border: '1px solid',
                    borderColor: selectedPersonnel?.id === personnel.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedPersonnel(personnel)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">
                      {`${personnel.first_name || ''} ${personnel.middle_initial || ''} ${
                        personnel.last_name || ''
                      }${personnel.suffix ? ` ${personnel.suffix}` : ''}`.replace(/  +/g, ' ').trim()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {personnel.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {personnel.contact_number}
                    </Typography>
                  </Box>
                  <Radio
                    checked={selectedPersonnel?.id === personnel.id}
                    onChange={() => setSelectedPersonnel(personnel)}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAssign}
            variant="contained"
            disabled={!selectedPersonnel || assigning}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent dividers>
          {detailsContract && (
            <Box sx={{ minWidth: 400 }}>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Contract ID: <span style={{ color: 'primary.main', fontWeight: 400 }}>{detailsContract.id}</span>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Location Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Pickup:</b> <span>{detailsContract.pickup_location || 'N/A'}</span>
                </Typography>
                {detailsContract.pickup_location_geo && (
                  <Typography variant="body2">
                    <b>Pickup Coordinates:</b>{' '}
                    <span>
                      {detailsContract.pickup_location_geo.coordinates[1].toFixed(6)}, {detailsContract.pickup_location_geo.coordinates[0].toFixed(6)}
                    </span>
                  </Typography>
                )}
                <Typography variant="body2">
                  <b>Drop-off:</b> <span>{detailsContract.drop_off_location || 'N/A'}</span>
                </Typography>
                {detailsContract.drop_off_location_geo && (
                  <Typography variant="body2">
                    <b>Drop-off Coordinates:</b>{' '}
                    <span>
                      {detailsContract.drop_off_location_geo.coordinates[1].toFixed(6)}, {detailsContract.drop_off_location_geo.coordinates[0].toFixed(6)}
                    </span>
                  </Typography>
                )}
                {detailsContract.delivery_charge !== null && !isNaN(Number(detailsContract.delivery_charge)) ? (
                  <Typography variant="body2">
                    <b>Price:</b> <span>₱{Number(detailsContract.delivery_charge).toLocaleString()}</span>
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    <b>Price:</b> <span>N/A</span>
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Passenger Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                {detailsContract.luggage.length === 0 && (
                  <Typography variant="body2">
                    No passenger info.
                  </Typography>
                )}
                {detailsContract.luggage.map((l, lidx) => (
                  <Box key={`luggage-${detailsContract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                    <Typography variant="body2">
                      <b>Name:</b> <span>{l.luggage_owner || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Contact Number:</b> <span>{l.contact_number || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Address:</b> <span>{l.address || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Quantity:</b> <span>{l.quantity || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Description:</b> <span>{l.item_description || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      <b>Flight Number:</b> <span>{l.flight_number || 'N/A'}</span>
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Airline Personnel Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Airline Personnel:</b>{' '}
                  <span>
                    {detailsContract.airline
                      ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${
                          detailsContract.airline.last_name || ''
                        }${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Email:</b>{' '}
                  <span>{detailsContract.airline?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Contact:</b>{' '}
                  <span>{detailsContract.airline?.contact_number || 'N/A'}</span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Delivery Personnel Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Delivery Personnel:</b>{' '}
                  <span>
                    {detailsContract.delivery
                      ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${
                          detailsContract.delivery.last_name || ''
                        }${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Email:</b>{' '}
                  <span>{detailsContract.delivery?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Contact:</b>{' '}
                  <span>{detailsContract.delivery?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Status:</b>{' '}
                  <span style={{ color: 'primary.main', fontWeight: 700 }}>
                    {detailsContract.contract_status?.status_name || 'N/A'}
                  </span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Timeline
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Created:</b>{' '}
                  <span>{formatDate(detailsContract.created_at)}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Accepted:</b>{' '}
                  <span>
                    {detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Pickup:</b>{' '}
                  <span>
                    {detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Delivered:</b>{' '}
                  <span>
                    {detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Cancelled:</b>{' '}
                  <span>
                    {detailsContract.cancelled_at ? formatDate(detailsContract.cancelled_at) : 'N/A'}
                  </span>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const Page = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [redirectContractId, setRedirectContractId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const router = useRouter();

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      const valid = ['all','available','accepted','transit','delivered','failed','cancelled'];
      if (statusParam && valid.includes(statusParam)) {
        setSelectedTab(0);
      }
    } catch {}
  }, []);

  const handleTrackContract = (contractId) => {
    router.push('/admin/luggage-tracking');
    setTimeout(() => {
      localStorage.setItem('trackContractId', contractId);
    }, 100);
  };

  const handleAssignmentComplete = (contractId) => {
    setSnackbarMessage('Luggage assigned successfully');
    setSnackbarOpen(true);
  };


  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
      <Tabs value={selectedTab} onChange={handleTabChange} aria-label="navigation tabs" centered>
        <Tab label="Contract List" />
        <Tab label="Luggage Assignments" />
      </Tabs>

      {selectedTab === 0 && <ContractList onTrackContract={handleTrackContract} initialSearch={redirectContractId} setRedirectContractId={setRedirectContractId} initialStatus={(typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('status') : null) || 'all'} />}
      {selectedTab === 1 && <LuggageAssignments onAssignmentComplete={handleAssignmentComplete} />}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'primary.main',
            color: '#fff'
          }
        }}
      />
    </Box>
  );
};

export default dynamic(() => Promise.resolve(Page), {
  ssr: false
});