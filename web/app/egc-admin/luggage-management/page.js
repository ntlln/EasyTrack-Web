"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Tabs, Tab, Typography, Paper, Button, IconButton, CircularProgress, Divider, Collapse, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Radio } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SearchIcon from '@mui/icons-material/Search';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Map component
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
  <Box ref={mapRef} sx={{ width: '100%', height: '500px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>
    {mapError && (
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}>
        <Typography color="error">{mapError}</Typography>
      </Box>
    )}
  </Box>
)), { ssr: false });

// Contract List Component
const ContractList = ({ onTrackContract, initialSearch }) => {
  const [contractList, setContractList] = useState([]);
  const [contractListLoading, setContractListLoading] = useState(false);
  const [contractListError, setContractListError] = useState(null);
  const [expandedContracts, setExpandedContracts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const supabase = createClientComponentClient();
  const router = useRouter();

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

  // Autofill search if initialSearch is provided
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setActiveSearch(initialSearch);
    }
  }, [initialSearch]);

  // Fetch contract list
  useEffect(() => {
    if (!mounted) return;

    const fetchContracts = async () => {
      setContractListLoading(true);
      setContractListError(null);
      try {
        const response = await fetch('/api/admin');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch contracts');
        }

        setContractList(result.data || []);
      } catch (err) {
        console.error('Error in fetchContracts:', err);
        setContractListError(err.message || 'Failed to fetch contracts');
      } finally {
        setContractListLoading(false);
      }
    };

    fetchContracts();
  }, [mounted]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    // Reset search state when switching tabs
    if (newValue === 0) {
      setSearchQuery('');
      setActiveSearch('');
    }
  };

  const handleExpandClick = (contractId) => {
    setExpandedContracts((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setActiveSearch('');
      return;
    }
    setActiveSearch(searchQuery);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter contracts based on status
  const filteredContracts = contractList.filter(contract => {
    if (statusFilter === 'all') return true;
    const status = contract.contract_status?.status_name?.toLowerCase();
    switch (statusFilter) {
      case 'available':
        return status === 'available for pickup';
      case 'accepted':
        return status === 'accepted - awaiting pickup';
      case 'transit':
        return status === 'in transit';
      case 'delivered':
        return status === 'delivered';
      case 'failed':
        return status === 'delivery failed';
      case 'cancelled':
        return status === 'cancelled';
      default:
        return false;
    }
  });

  const handleTrackContract = (contractId) => {
    onTrackContract(contractId);
  };

  // Helper to get current filter/search contracts with pagination
  const getFilteredContracts = () => {
    const filtered = filteredContracts.filter(contract =>
      !activeSearch || String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
    );
    
    // Apply pagination
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          label="Search Contract ID"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ width: '100%', maxWidth: '400px' }}
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSearch}
                size="small"
              >
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <Box sx={{ maxWidth: '800px', mx: 'auto', width: '100%', mb: 3, overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1, p: 1, minWidth: 'max-content', justifyContent: 'center' }}>
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "contained" : "outlined"}
              onClick={() => setStatusFilter(option.value)}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                px: 2,
                whiteSpace: 'nowrap',
                minWidth: '100px',
                borderColor: statusFilter === option.value ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: statusFilter === option.value ? 'primary.main' : 'transparent'
                }
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      </Box>

      {contractListLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {contractListError && (
        <Typography color="error" align="center">{contractListError}</Typography>
      )}
      {!contractListLoading && !contractListError && contractList.length === 0 && (
        <Typography align="center">No contracts found.</Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '800px', mx: 'auto', width: '100%' }}>
        {getFilteredContracts().map((contract) => (
          <Paper key={`contract-${contract.id}`} elevation={3} sx={{ p: 3, borderRadius: 3, mb: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{contract.id}</span>
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Location Information
                </Typography>
                <Box sx={{ ml: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    <b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_location || 'N/A'}</span>
                  </Typography>
                  {contract.pickup_location_geo && (
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      <b>Pickup Coordinates:</b>{' '}
                      <span style={{ color: 'text.primary' }}>
                        {contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}
                      </span>
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    <b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{contract.drop_off_location || 'N/A'}</span>
                  </Typography>
                  {contract.drop_off_location_geo && (
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      <b>Drop-off Coordinates:</b>{' '}
                      <span style={{ color: 'text.primary' }}>
                        {contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}
                      </span>
                    </Typography>
                  )}
                  {contract.delivery_charge !== null && !isNaN(Number(contract.delivery_charge)) ? (
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      <b>Price:</b> <span style={{ color: 'text.primary' }}>₱{Number(contract.delivery_charge).toLocaleString()}</span>
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      <b>Price:</b> <span style={{ color: 'text.primary' }}>N/A</span>
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ml: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<LocationOnIcon />}
                  onClick={() => handleTrackContract(contract.id)}
                  sx={{ mb: 1 }}
                >
                  Track
                </Button>
                <IconButton
                  onClick={() => handleExpandClick(contract.id)}
                  aria-expanded={expandedContracts.includes(contract.id)}
                  aria-label="show more"
                  size="small"
                  sx={{ 
                    transform: expandedContracts.includes(contract.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark'
                    },
                    mt: 5
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>
            <Collapse in={expandedContracts.includes(contract.id)} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Contractor Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Contractor Name:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.airline
                      ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${
                          contract.airline.last_name || ''
                        }${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Contractor Email:</b>{' '}
                  <span style={{ color: 'text.primary' }}>{contract.airline?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Contractor Contact:</b>{' '}
                  <span style={{ color: 'text.primary' }}>{contract.airline?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Subcontractor Name:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.delivery
                      ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${
                          contract.delivery.last_name || ''
                        }${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Subcontractor Email:</b>{' '}
                  <span style={{ color: 'text.primary' }}>{contract.delivery?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Subcontractor Contact:</b>{' '}
                  <span style={{ color: 'text.primary' }}>{contract.delivery?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Status:</b>{' '}
                  <span style={{ color: 'primary.main', fontWeight: 700 }}>
                    {contract.contract_status?.status_name || 'N/A'}
                  </span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Luggage Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                {contract.luggage.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    No luggage info.
                  </Typography>
                )}
                {contract.luggage.map((l, lidx) => (
                  <Box key={`luggage-${contract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      Luggage {lidx + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      Flight Number: <span style={{ color: 'text.primary' }}>{l.flight_number || 'N/A'}</span>
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
                  <span style={{ color: 'text.primary' }}>
                    {contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Accepted:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Pickup:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Delivered:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Cancelled:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
              </Box>
            </Collapse>
          </Paper>
        ))}
      </Box>

      {/* Update pagination controls */}
      {!contractListLoading && !contractListError && filteredContracts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {`Page ${page + 1} of ${Math.ceil(filteredContracts.length / rowsPerPage)}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={() => setPage(0)}
                disabled={page === 0}
                size="small"
              >
                First
              </Button>
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                size="small"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(filteredContracts.length / rowsPerPage) - 1}
                size="small"
              >
                Next
              </Button>
              <Button
                onClick={() => setPage(Math.ceil(filteredContracts.length / rowsPerPage) - 1)}
                disabled={page >= Math.ceil(filteredContracts.length / rowsPerPage) - 1}
                size="small"
              >
                Last
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Add LuggageAssignments component
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch contracts
        const contractsResponse = await fetch('/api/admin');
        const contractsResult = await contractsResponse.json();

        if (!contractsResponse.ok) {
          throw new Error(contractsResult.error || 'Failed to fetch contracts');
        }

        // Filter for available contracts only
        const availableContracts = (contractsResult.data || []).filter(
          contract => contract.contract_status?.status_name?.toLowerCase() === 'available for pickup'
        );
        
        setAssignments(availableContracts);

        // Fetch delivery personnel
        const personnelResponse = await fetch('/api/admin?action=delivery-personnel');
        const personnelResult = await personnelResponse.json();

        if (!personnelResponse.ok) {
          throw new Error(personnelResult.error || 'Failed to fetch delivery personnel');
        }

        setDeliveryPersonnel(personnelResult.data || []);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assignContract',
          params: {
            contractId: selectedContract.id,
            deliveryId: selectedPersonnel.id
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign contract');
      }

      // Update the local state to remove the assigned contract
      setAssignments(prev => prev.filter(c => c.id !== selectedContract.id));
      handleCloseDialog();
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedContract.id);
      }
    } catch (err) {
      console.error('Error assigning contract:', err);
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

  // Format date helper function
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
      console.error('Error formatting date:', error);
      return 'N/A';
    }
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
    <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', p: 2 }}>
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contract ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pickup Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Drop-off Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Flight Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Airline Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Luggage Details</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">No available contracts for assignment</Typography>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>{assignment.id}</TableCell>
                  <TableCell>{assignment.pickup_location || 'N/A'}</TableCell>
                  <TableCell>{assignment.drop_off_location || 'N/A'}</TableCell>
                  <TableCell>{assignment.luggage?.[0]?.flight_number || 'N/A'}</TableCell>
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
                    {assignment.luggage && assignment.luggage.length > 0 ? (
                      <Box>
                        {assignment.luggage.map((l, idx) => (
                          <Box key={idx} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              <strong>Owner:</strong> {l.luggage_owner || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Case #:</strong> {l.case_number || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Weight:</strong> {l.weight ? `${l.weight} kg` : 'N/A'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      'No luggage info'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(assignment)}
                        fullWidth
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAssign(assignment)}
                        fullWidth
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
                      ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${
                          detailsContract.airline.last_name || ''
                        }${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
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
                {detailsContract.luggage.length === 0 && (
                  <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                    No luggage info.
                  </Typography>
                )}
                {detailsContract.luggage.map((l, lidx) => (
                  <Box key={`luggage-${detailsContract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      Luggage {lidx + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                      Flight Number: <span style={{ color: 'text.primary' }}>{l.flight_number || 'N/A'}</span>
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
                  <span style={{ color: 'text.primary' }}>
                    {detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Pickup:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Delivered:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
                    {detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                  <b>Cancelled:</b>{' '}
                  <span style={{ color: 'text.primary' }}>
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

// Main Page Component
const Page = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contractList, setContractList] = useState([]);
  const [error, setError] = useState(null);
  const [expandedContracts, setExpandedContracts] = useState([]);
  const [map, setMap] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const supabase = createClientComponentClient();
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10; // Changed from 2 to 10 items per page
  const [redirectContractId, setRedirectContractId] = useState(null);
  const [trackContractId, setTrackContractId] = useState(null);

  // Clear redirectContractId after search is set
  useEffect(() => {
    if (selectedTab === 0 && redirectContractId) {
      // Clear after a short delay to avoid repeated autofill
      const timer = setTimeout(() => setRedirectContractId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedTab, redirectContractId]);

  // Clear trackContractId after search is set
  useEffect(() => {
    if (selectedTab === 2 && trackContractId) {
      const timer = setTimeout(() => setTrackContractId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedTab, trackContractId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch contract list
  useEffect(() => {
    if (!mounted) return;

    const fetchContracts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Starting contract fetch...');
        const response = await fetch('/api/admin');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch contracts');
        }

        console.log('Contracts fetched:', result.data);
        setContractList(result.data || []);
      } catch (err) {
        console.error('Error in fetchContracts:', err);
        setError(err.message || 'Failed to fetch contracts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, [mounted]);

  // Load Google Maps script
  useEffect(() => {
    if (selectedTab !== 1) return; // Only load when luggage tracking tab is selected
    if (window.google) {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [selectedTab]);

  // Initialize map
  useEffect(() => {
    if (selectedTab !== 1) return; // Only initialize map when luggage tracking tab is selected
    if (!isScriptLoaded || !contractList.length || !mapRef.current) return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [isScriptLoaded, contractList, selectedTab, activeSearch]);

  // Poll for current location updates
  useEffect(() => {
    let intervalId;
    let isPolling = false;

    const updateCurrentLocation = async () => {
      if (isPolling) return;
      if (!contractList.length || !activeSearch || !mapRef.current) return;
      try {
        isPolling = true;
        const searchedContract = contractList.find(contract => 
          String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
        );
        if (!searchedContract) return;
        const response = await fetch(`/api/admin?contractId=${searchedContract.id}`);
        if (!response.ok) return;
        const result = await response.json();
        if (!result.data?.current_location_geo) return;

        const newPosition = {
          lat: result.data.current_location_geo.coordinates[1],
          lng: result.data.current_location_geo.coordinates[0]
        };

        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.position = newPosition;
        } else {
          const currentLocationMarker = new window.google.maps.marker.PinElement({
            scale: 1,
            background: '#FF9800',
            borderColor: '#F57C00',
            glyphColor: '#FFFFFF'
          });
          
          currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: newPosition,
            title: 'Current Location',
            content: currentLocationMarker.element,
            collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
          });
        }

        setMapError(null);
      } catch (err) {
        console.error('Error updating location:', err);
        setMapError(err.message);
      } finally {
        isPolling = false;
      }
    };

    if (activeSearch && mapRef.current) {
      updateCurrentLocation();
      intervalId = setInterval(updateCurrentLocation, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [contractList, mapRef, activeSearch, map]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    // Reset search state when switching tabs
    if (newValue === 0) {
      setSearchQuery('');
      setActiveSearch('');
    }
  };

  const handleExpandClick = (contractId) => {
    setExpandedContracts((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setActiveSearch('');
      return;
    }
    setActiveSearch(searchQuery);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Initialize map
  const initMap = () => {
    if (!window.google || !mapRef.current || !contractList.length) {
      console.log('Map initialization conditions not met:', {
        hasGoogle: !!window.google,
        hasMapRef: !!mapRef.current,
        hasContracts: contractList.length > 0
      });
      return;
    }

    try {
      // Find the contract that matches the search query
      const searchedContract = contractList.find(contract => 
        String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
      );

      if (!searchedContract) {
        console.log('No matching contract found for search:', activeSearch);
        return;
      }

      console.log('Found contract for map:', searchedContract);
      console.log('Contract location data:', {
        current: searchedContract.current_location_geo,
        dropoff: searchedContract.drop_off_location_geo,
        pickup: searchedContract.pickup_location_geo
      });

      // Determine the center location based on available coordinates
      let defaultLocation;
      
      if (searchedContract.current_location_geo?.coordinates) {
        defaultLocation = {
          lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
        };
        console.log('Using current location as center:', defaultLocation);
      } else if (searchedContract.drop_off_location_geo?.coordinates) {
        defaultLocation = {
          lat: parseFloat(searchedContract.drop_off_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.drop_off_location_geo.coordinates[0])
        };
        console.log('Using drop-off location as center:', defaultLocation);
      } else {
        defaultLocation = { lat: 14.5350, lng: 120.9821 }; // Default to Manila
        console.log('No valid coordinates found, using Manila as center:', defaultLocation);
      }

      const mapOptions = { 
        center: defaultLocation, 
        zoom: 15, 
        mapTypeControl: false, 
        streetViewControl: false, 
        fullscreenControl: false, 
        mapTypeId: 'roadmap', 
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID 
      };

      console.log('Creating map with options:', mapOptions);
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      console.log('Map created successfully');

      // Add current location marker first
      if (searchedContract.current_location_geo?.coordinates) {
        console.log('Adding initial current location marker');
        const currentLocationMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#FF9800', 
          borderColor: '#F57C00', 
          glyphColor: '#FFFFFF' 
        });
        
        const currentPosition = {
          lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
        };
        
        console.log('Initial current location position:', currentPosition);
        
        currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: currentPosition, 
          title: 'Current Location', 
          content: currentLocationMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
        console.log('Initial current location marker added to map');
      }

      // Add drop-off location marker
      if (searchedContract.drop_off_location_geo?.coordinates) {
        console.log('Adding drop-off marker');
        const dropoffMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#4CAF50', 
          borderColor: '#388E3C', 
          glyphColor: '#FFFFFF' 
        });
        
        const dropoffPosition = {
          lat: parseFloat(searchedContract.drop_off_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.drop_off_location_geo.coordinates[0])
        };
        
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: dropoffPosition, 
          title: 'Drop-off Location', 
          content: dropoffMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
      }

      // Add pickup location marker
      if (searchedContract.pickup_location_geo?.coordinates) {
        console.log('Adding pickup marker');
        const pickupMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#2196F3', 
          borderColor: '#1976D2', 
          glyphColor: '#FFFFFF' 
        });
        
        const pickupPosition = {
          lat: parseFloat(searchedContract.pickup_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.pickup_location_geo.coordinates[0])
        };
        
        new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: pickupPosition, 
          title: 'Pickup Location', 
          content: pickupMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
      }

      console.log('Map initialization completed successfully');

    } catch (error) {
      console.error('Error in map initialization:', error);
      setMapError(error.message);
    }
  };

  const handleTrackContract = (contractId) => {
    setTrackContractId(contractId.toString());
    setSelectedTab(2); // Switch to luggage tracking tab
  };

  // Handler for assignment completion
  const handleAssignmentComplete = (contractId) => {
    setRedirectContractId(contractId);
    setSelectedTab(0); // Switch to Contract List
  };

  if (!mounted) {
    return null; // Prevent hydration errors: only render on client
  }

  // Format date helper function
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
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
      <Tabs value={selectedTab} onChange={handleTabChange} aria-label="navigation tabs" centered>
        <Tab label="Contract List" />
        <Tab label="Luggage Assignments" />
        <Tab label="Luggage Tracking" />
      </Tabs>

      {selectedTab === 0 && <ContractList onTrackContract={handleTrackContract} initialSearch={redirectContractId} />}
      {selectedTab === 1 && <LuggageAssignments onAssignmentComplete={handleAssignmentComplete} />}
      {selectedTab === 2 && (
        <LuggageTrackingTab
          contractList={contractList}
          isLoading={isLoading}
          error={error}
          expandedContracts={expandedContracts}
          setExpandedContracts={setExpandedContracts}
          mapRef={mapRef}
          mapError={mapError}
          formatDate={formatDate}
          trackContractId={trackContractId}
          setSearchQuery={setSearchQuery}
          setActiveSearch={setActiveSearch}
          searchQuery={searchQuery}
          activeSearch={activeSearch}
          handleKeyPress={handleKeyPress}
          handleSearch={handleSearch}
          setMap={setMap}
          isScriptLoaded={isScriptLoaded}
          setIsScriptLoaded={setIsScriptLoaded}
          isGoogleMapsReady={isGoogleMapsReady}
          setIsGoogleMapsReady={setIsGoogleMapsReady}
          supabase={supabase}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
        />
      )}
    </Box>
  );
};

// Add a new LuggageTrackingTab component to handle the search autofill and UI
const LuggageTrackingTab = ({
  contractList,
  isLoading,
  error,
  expandedContracts,
  setExpandedContracts,
  mapRef,
  mapError,
  formatDate,
  trackContractId,
  setSearchQuery,
  setActiveSearch,
  searchQuery,
  activeSearch,
  handleKeyPress,
  handleSearch,
  setMap,
  isScriptLoaded,
  setIsScriptLoaded,
  isGoogleMapsReady,
  setIsGoogleMapsReady,
  supabase,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  rowsPerPage
}) => {
  // Autofill search if trackContractId is provided
  useEffect(() => {
    if (trackContractId) {
      setSearchQuery(trackContractId);
      setActiveSearch(trackContractId);
    }
  }, [trackContractId, setSearchQuery, setActiveSearch]);

  // Load Google Maps script when this tab is mounted
  useEffect(() => {
    if (window.google) {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Initialize map when script is loaded, contractList is ready, and activeSearch changes
  useEffect(() => {
    if (!isScriptLoaded || !contractList.length || !mapRef.current || !activeSearch) return;
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find the contract that matches the search query
      const searchedContract = contractList.find(contract => 
        String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
      );
      if (!searchedContract) return;
      // Determine the center location based on available coordinates
      let defaultLocation;
      if (searchedContract.current_location_geo?.coordinates) {
        defaultLocation = {
          lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
        };
      } else if (searchedContract.drop_off_location_geo?.coordinates) {
        defaultLocation = {
          lat: parseFloat(searchedContract.drop_off_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.drop_off_location_geo.coordinates[0])
        };
      } else {
        defaultLocation = { lat: 14.5350, lng: 120.9821 }; // Default to Manila
      }
      const mapOptions = { 
        center: defaultLocation, 
        zoom: 15, 
        mapTypeControl: false, 
        streetViewControl: false, 
        fullscreenControl: false, 
        mapTypeId: 'roadmap', 
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID 
      };
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      // Add current location marker first
      if (searchedContract.current_location_geo?.coordinates) {
        const currentLocationMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#FF9800', 
          borderColor: '#F57C00', 
          glyphColor: '#FFFFFF' 
        });
        const currentPosition = {
          lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
        };
        new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: currentPosition, 
          title: 'Current Location', 
          content: currentLocationMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
      }
      // Add drop-off location marker
      if (searchedContract.drop_off_location_geo?.coordinates) {
        const dropoffMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#4CAF50', 
          borderColor: '#388E3C', 
          glyphColor: '#FFFFFF' 
        });
        const dropoffPosition = {
          lat: parseFloat(searchedContract.drop_off_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.drop_off_location_geo.coordinates[0])
        };
        new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: dropoffPosition, 
          title: 'Drop-off Location', 
          content: dropoffMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
      }
      // Add pickup location marker
      if (searchedContract.pickup_location_geo?.coordinates) {
        const pickupMarker = new window.google.maps.marker.PinElement({ 
          scale: 1, 
          background: '#2196F3', 
          borderColor: '#1976D2', 
          glyphColor: '#FFFFFF' 
        });
        const pickupPosition = {
          lat: parseFloat(searchedContract.pickup_location_geo.coordinates[1]),
          lng: parseFloat(searchedContract.pickup_location_geo.coordinates[0])
        };
        new window.google.maps.marker.AdvancedMarkerElement({ 
          map: newMap, 
          position: pickupPosition, 
          title: 'Pickup Location', 
          content: pickupMarker.element, 
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isScriptLoaded, contractList, mapRef, activeSearch, setMap]);

  // Poll for current location updates
  useEffect(() => {
    let intervalId;
    let isPolling = false;
    const updateCurrentLocation = async () => {
      if (isPolling) return;
      if (!contractList.length || !activeSearch || !mapRef.current) return;
      try {
        isPolling = true;
        const searchedContract = contractList.find(contract => 
          String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
        );
        if (!searchedContract) return;
        const response = await fetch(`/api/admin?contractId=${searchedContract.id}`);
        if (!response.ok) return;
        const result = await response.json();
        if (!result.data?.current_location_geo) return;
        // You can update the map marker here if you want live updates
      } catch (err) {
        // Optionally handle polling errors
      } finally {
        isPolling = false;
      }
    };
    if (activeSearch && mapRef.current) {
      updateCurrentLocation();
      intervalId = setInterval(updateCurrentLocation, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [contractList, mapRef, activeSearch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          label="Search Contract ID"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ width: '100%', maxWidth: '400px' }}
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSearch}
                disabled={isLoading}
                size="small"
              >
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" align="center" sx={{ my: 4 }}>{error}</Typography>
      )}

      {!isLoading && !error && (
        <>
          {!activeSearch && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Typography variant="h6" color="text.secondary">
                Enter a contract ID and press Enter to track luggage
              </Typography>
            </Box>
          )}
          
          {activeSearch && contractList.length === 0 && (
            <Typography align="center">No contracts found.</Typography>
          )}

          {activeSearch && contractList.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '1200px', mx: 'auto', width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {contractList
                  .filter(contract => 
                    String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
                  )
                  .map((contract) => (
                    <Paper key={`contract-${contract.id}`} elevation={3} sx={{ p: 3, borderRadius: 3, mb: 2, width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                            Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{contract.id}</span>
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                            Location Information
                          </Typography>
                          <Box sx={{ ml: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                              <b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_location || 'N/A'}</span>
                            </Typography>
                            {contract.pickup_location_geo && (
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                <b>Pickup Coordinates:</b>{' '}
                                <span style={{ color: 'text.primary' }}>
                                  {contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}
                                </span>
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                              <b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{contract.drop_off_location || 'N/A'}</span>
                            </Typography>
                            {contract.drop_off_location_geo && (
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                <b>Drop-off Coordinates:</b>{' '}
                                <span style={{ color: 'text.primary' }}>
                                  {contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}
                                </span>
                              </Typography>
                            )}
                            {contract.delivery_charge !== null && !isNaN(Number(contract.delivery_charge)) ? (
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                <b>Price:</b> <span style={{ color: 'text.primary' }}>₱{Number(contract.delivery_charge).toLocaleString()}</span>
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                <b>Price:</b> <span style={{ color: 'text.primary' }}>N/A</span>
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ml: 2 }}>
                          <IconButton
                            onClick={() => setExpandedContracts((prev) => prev.includes(contract.id) ? prev.filter((id) => id !== contract.id) : [...prev, contract.id])}
                            aria-expanded={expandedContracts.includes(contract.id)}
                            aria-label="show more"
                            size="small"
                            sx={{ 
                              transform: expandedContracts.includes(contract.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s',
                              color: 'primary.main',
                              '&:hover': {
                                color: 'primary.dark'
                              },
                              mt: 10
                            }}
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Collapse in={expandedContracts.includes(contract.id)} timeout="auto" unmountOnExit>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                          Luggage Information
                        </Typography>
                        <Box sx={{ ml: 1, mb: 1 }}>
                          {contract.luggage.length === 0 && (
                            <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                              No luggage info.
                            </Typography>
                          )}
                          {contract.luggage.map((l, lidx) => (
                            <Box key={`luggage-${contract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                Luggage {lidx + 1}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                                Flight Number: <span style={{ color: 'text.primary' }}>{l.flight_number || 'N/A'}</span>
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
                            <span style={{ color: 'text.primary' }}>{formatDate(contract.created_at)}</span>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                            <b>Accepted:</b>{' '}
                            <span style={{ color: 'text.primary' }}>
                              {contract.accepted_at ? formatDate(contract.accepted_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                            <b>Pickup:</b>{' '}
                            <span style={{ color: 'text.primary' }}>
                              {contract.pickup_at ? formatDate(contract.pickup_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                            <b>Delivered:</b>{' '}
                            <span style={{ color: 'text.primary' }}>
                              {contract.delivered_at ? formatDate(contract.delivered_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#bdbdbd' }}>
                            <b>Cancelled:</b>{' '}
                            <span style={{ color: 'text.primary' }}>
                              {contract.cancelled_at ? formatDate(contract.cancelled_at) : 'N/A'}
                            </span>
                          </Typography>
                        </Box>
                      </Collapse>
                    </Paper>
                  ))}
              </Box>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Live Tracking</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#4CAF50', border: '2px solid #388E3C' }} />
                    <Typography variant="body2">Drop-off Location</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#2196F3', border: '2px solid #1976D2' }} />
                    <Typography variant="body2">Pickup Location</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#FF9800', border: '2px solid #F57C00' }} />
                    <Typography variant="body2">Current Location</Typography>
                  </Box>
                </Box>
                <MapComponent mapRef={mapRef} mapError={mapError} />
              </Paper>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Export with dynamic import and no SSR
export default dynamic(() => Promise.resolve(Page), {
  ssr: false
});