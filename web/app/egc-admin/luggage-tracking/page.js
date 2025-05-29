"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Tabs, Tab, Typography, Paper, Button, IconButton, CircularProgress, Divider, Collapse, TextField } from "@mui/material";
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
const ContractList = () => {
  const [contractList, setContractList] = useState([]);
  const [contractListLoading, setContractListLoading] = useState(false);
  const [contractListError, setContractListError] = useState(null);
  const [expandedContracts, setExpandedContracts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch contract list
  useEffect(() => {
    if (!mounted) return;

    const fetchContracts = async () => {
      setContractListLoading(true);
      setContractListError(null);
      try {
        console.log('Starting contract fetch...');
        const response = await fetch('/api/admin/contracts');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch contracts');
        }

        console.log('Contracts fetched:', result.data);
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

  if (!mounted) {
    return null; // Return null instead of loading state to prevent hydration mismatch
  }

  // Expand/collapse handler
  const handleExpandClick = (contractId) => {
    setExpandedContracts((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleTrackContract = (contractId) => {
    router.push(`/egc-admin/luggage-tracking?contractId=${contractId}`);
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
        {contractList
          .filter(contract => 
            !activeSearch || 
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
        const response = await fetch('/api/admin/contracts');
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

  // Google Maps script loader
  useEffect(() => {
    if (activeSearch && contractList.length > 0 && !isScriptLoaded && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => { setIsScriptLoaded(true); };
      script.onerror = () => { setMapError('Failed to load Google Maps'); };
      document.head.appendChild(script);
      return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }
  }, [activeSearch, contractList, isScriptLoaded]);

  // Initialize map
  useEffect(() => {
    if (isScriptLoaded && contractList.length > 0 && !map && mapRef.current) {
      initMap();
    }
  }, [isScriptLoaded, contractList, map]);

  // Poll for current location updates
  useEffect(() => {
    let intervalId;
    let isPolling = false;

    const updateCurrentLocation = async () => {
      // Prevent multiple simultaneous requests
      if (isPolling) {
        console.log('Skipping update - previous request still in progress');
        return;
      }

      if (!contractList.length || !activeSearch || !map) {
        console.log('Skipping location update - missing requirements:', {
          hasContracts: contractList.length > 0,
          hasActiveSearch: !!activeSearch,
          hasMap: !!map
        });
        return;
      }
      
      try {
        isPolling = true;
        // Find the contract that matches the search query
        const searchedContract = contractList.find(contract => 
          String(contract.id).toLowerCase().includes(activeSearch.toLowerCase())
        );

        if (!searchedContract) {
          console.log('No contract found for search:', activeSearch);
          return;
        }

        console.log('Fetching current location for contract:', searchedContract.id);

        // Fetch current location from the API route
        const response = await fetch(`/api/admin/contracts/contract-location?contractId=${searchedContract.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.data?.current_location_geo) {
          console.log('No current location data available for contract:', searchedContract.id);
          return;
        }

        const newPosition = {
          lat: result.data.current_location_geo.coordinates[1],
          lng: result.data.current_location_geo.coordinates[0]
        };

        console.log('Updating current location marker to:', newPosition);

        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.position = newPosition;
        } else {
          console.log('Creating new current location marker');
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

        // Clear any previous error messages if update was successful
        setMapError(null);
      } catch (err) {
        console.error('Error updating location:', err);
        setMapError(err.message);
      } finally {
        isPolling = false;
      }
    };

    const startPolling = () => {
      if (activeSearch && map) {
        console.log('Starting current location updates for contract:', activeSearch);
        // Initial update
        updateCurrentLocation();
        // Then poll every 5 seconds
        intervalId = setInterval(updateCurrentLocation, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        console.log('Stopping current location updates');
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start polling when component mounts or when dependencies change
    startPolling();

    // Cleanup function
    return () => {
      stopPolling();
    };
  }, [contractList, map, activeSearch]);

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

  if (!mounted) {
    return null; // Return null instead of loading state to prevent hydration mismatch
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
        <Tab label="Luggage Tracking" />
      </Tabs>

      {selectedTab === 0 && <ContractList />}
      {selectedTab === 1 && (
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
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ml: 2 }}>
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
                                  {formatDate(contract.created_at)}
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
      )}
    </Box>
  );
};

// Export with dynamic import and no SSR
export default dynamic(() => Promise.resolve(Page), {
  ssr: false
});