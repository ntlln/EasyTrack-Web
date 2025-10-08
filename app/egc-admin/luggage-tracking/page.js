"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Box, Typography, TextField, Paper, Divider, IconButton, Collapse, CircularProgress, Snackbar, Alert, Button } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Map component
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
  <Box ref={mapRef} sx={{ width: '100%', height: '500px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>{mapError && (<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}><Typography color="error">{mapError}</Typography></Box>)}</Box>
)), { ssr: false });

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LuggageTrackingContent />
        </Suspense>
    );
}

function LuggageTrackingContent() {
  // State and hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const [contractId, setContractId] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [map, setMap] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const autoDirectionsRequestedRef = useRef(false);
  
  // Directions API related state
  const [routeData, setRouteData] = useState({
    eta: null,
    distanceRemaining: null,
    progress: 0,
    polyline: null,
    totalDistance: null
  });
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directionsError, setDirectionsError] = useState(null);
  const [lastDirectionsRequest, setLastDirectionsRequest] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const supabase = createClientComponentClient();
  const previousValidContractIdRef = useRef("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const didInitialRefreshRef = useRef(false);

  // Mount-only fallback to capture contractId immediately on first client render
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const idFromUrl = new URLSearchParams(window.location.search).get('contractId');
      if (idFromUrl) {
        if (!didInitialRefreshRef.current) {
          didInitialRefreshRef.current = true;
          router.refresh();
          setTimeout(() => {
            setContractId((prev) => prev || idFromUrl);
            if (!contract) {
              handleSearch(idFromUrl);
            }
          }, 50);
        } else {
          setContractId((prev) => prev || idFromUrl);
          if (!contract) {
            handleSearch(idFromUrl);
          }
        }
      }
    } catch {}
  }, []);

  // Handle contract ID from URL (robust for localhost/navigation)
  useEffect(() => {
    try {
      let idFromUrl = null;
      if (typeof window !== 'undefined') {
        idFromUrl = new URLSearchParams(window.location.search).get('contractId');
      }
      if (!idFromUrl) {
        idFromUrl = searchParams.get('contractId');
      }
      if (idFromUrl && idFromUrl !== contractId) {
        if (!didInitialRefreshRef.current) {
          didInitialRefreshRef.current = true;
          router.refresh();
          setTimeout(() => {
            setContractId(idFromUrl);
            handleSearch(idFromUrl);
          }, 50);
        } else {
          setContractId(idFromUrl);
          handleSearch(idFromUrl);
        }
      }
    } catch (e) {
      // no-op
    }
  }, [searchParams]);

  // Fetch contract and luggage info
  const fetchData = async (id = contractId) => {
    if (!id.trim()) return;
    
    const shouldShowErrors = id.length >= previousValidContractIdRef.current.length;
    
    if (shouldShowErrors) {
      setError(null);
    }
    
    try {
      console.log('Fetching contract data for ID:', id);
      const response = await fetch(`/api/admin?contractId=${id}&includeSummarized=1`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contract data');
      }
      const { data } = await response.json();
      console.log('Received contract data:', data);
      
      if (data) {
        previousValidContractIdRef.current = id;
        
        const newContract = {
          ...data,
          luggage: data.luggage || [],
          pickup_location_geo: data.pickup_location_geo || null,
          drop_off_location_geo: data.drop_off_location_geo || null,
          current_location_geo: data.current_location_geo || null,
          route_history: data.route_history || []
        };
        console.log('Processed contract data:', newContract);
        
        setContract(prev => {
          return JSON.stringify(prev) !== JSON.stringify(newContract) ? newContract : prev;
        });
        
        // Clear previous route data when contract changes
        setRouteData({
          eta: null,
          distanceRemaining: null,
          progress: 0,
          polyline: null,
          totalDistance: null
        });
      } else {
        if (shouldShowErrors) {
          setError('No contract data found');
          setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      if (shouldShowErrors) {
        setError(err.message || 'Failed to fetch contract');
        setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Reset map/markers only when contractId changes
  useEffect(() => {
    if (!contractId) return;
    console.log('Contract ID changed:', contractId);
    if (map) setMap(null);
    if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
    if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; }
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    setIsScriptLoaded(false);
    fetchData(contractId);
  }, [contractId]);

  // Real-time subscription for contract changes
  useEffect(() => {
    if (!contractId) return;

    const handleRealtimeUpdate = async (payload) => {
      try {
        const updatedRow = payload?.new;
        if (!updatedRow) return;

        setContract((prev) => {
          const merged = prev ? { ...prev, ...updatedRow } : updatedRow;
          return merged;
        });

        // Update current location marker if it exists
        if (updatedRow?.current_location_geo?.coordinates && currentLocationMarkerRef.current && map) {
          const newPosition = {
            lat: updatedRow.current_location_geo.coordinates[1],
            lng: updatedRow.current_location_geo.coordinates[0]
          };
          
          if (currentLocationMarkerRef.current && currentLocationMarkerRef.current.map) {
            currentLocationMarkerRef.current.position = newPosition;
            map.setCenter(newPosition);
          }
        }
      } catch (err) {
        console.error('Realtime update handling error:', err);
      }
    };

    const channelContract = supabase
      .channel(`contract-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contract',
          filter: `id=eq.${contractId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe();

    const channelContracts = supabase
      .channel(`contracts-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      channelContract.unsubscribe();
      channelContracts.unsubscribe();
    };
  }, [contractId, supabase, map]);

  // Google Maps script loader
  useEffect(() => {
    if (!contract) return;

    // If Google Maps is already available (loaded elsewhere), mark as loaded
    if (typeof window !== 'undefined' && window.google) {
      if (!isScriptLoaded) setIsScriptLoaded(true);
      return;
    }

    if (!isScriptLoaded) {
      console.log('Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        setIsScriptLoaded(true);
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps:', error);
        setMapError('Failed to load Google Maps');
      };
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [contract, isScriptLoaded]);

  // Initialize map
  useEffect(() => {
    if (isScriptLoaded && contract && !map) {
      console.log('Initializing map...');
      initMap();
    }
  }, [isScriptLoaded, contract, map]);

  // Auto-run directions once when map and contract are ready (after clicking Track)
  useEffect(() => {
    if (map && contract && !autoDirectionsRequestedRef.current) {
      autoDirectionsRequestedRef.current = true;
      // Fire and forget; internal guards handle missing coordinates/cooldown
      handleGetDirections();
    }
  }, [map, contract]);

  // Map initialization
  const initMap = () => {
    if (!window.google || !mapRef.current || !contract) {
      console.log('Map initialization skipped:', {
        hasGoogle: !!window.google,
        hasMapRef: !!mapRef.current,
        hasContract: !!contract
      });
      return;
    }
    
    try {
      console.log('Initializing map with contract:', contract);
      
      const defaultCenter = { lat: 14.5350, lng: 120.9821 };
      const mapOptions = {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        scaleControl: false,
        rotateControl: false,
        panControl: false,
        mapTypeId: 'roadmap',
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID,
        gestureHandling: 'greedy',
        draggableCursor: 'grab',
        draggingCursor: 'grabbing'
      };

      console.log('Creating new map instance...');
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      directionsServiceRef.current = new window.google.maps.DirectionsService();

      const markers = [];

      // Add current location marker
      if (contract.current_location_geo?.coordinates) {
        console.log('Adding current location marker:', contract.current_location_geo.coordinates);
        const currentPosition = {
          lat: contract.current_location_geo.coordinates[1],
          lng: contract.current_location_geo.coordinates[0]
        };

        const currentLocationMarker = document.createElement('div');
        currentLocationMarker.innerHTML = `
          <style>
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            .location-marker {
              animation: pulse 2s infinite;
              filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.8));
            }
          </style>
          <div class="location-marker">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#4CAF50" fill-opacity="0.6"/>
              <circle cx="12" cy="12" r="8" fill="#4CAF50" fill-opacity="0.8"/>
              <circle cx="12" cy="12" r="6" fill="#4CAF50" fill-opacity="0.9"/>
              <circle cx="12" cy="12" r="4" fill="#4CAF50"/>
              <circle cx="12" cy="12" r="2" fill="white"/>
            </svg>
          </div>
        `;
        
        currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: currentPosition,
          title: 'Current Location',
          content: currentLocationMarker,
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });

        markers.push(currentPosition);
      }

      // Add pickup location marker
      if (contract.pickup_location_geo?.coordinates) {
        console.log('Adding pickup location marker:', contract.pickup_location_geo.coordinates);
        const pickupMarker = new window.google.maps.marker.PinElement({
          scale: 1,
          background: '#2196F3',
          borderColor: '#1976D2',
          glyphColor: '#FFFFFF'
        });

        const pickupPosition = {
          lat: contract.pickup_location_geo.coordinates[1],
          lng: contract.pickup_location_geo.coordinates[0]
        };

        new window.google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: pickupPosition,
          title: 'Pickup Location',
          content: pickupMarker.element,
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });

        markers.push(pickupPosition);
      }

      // Add drop-off location marker
      if (contract.drop_off_location_geo?.coordinates) {
        console.log('Adding drop-off location marker:', contract.drop_off_location_geo.coordinates);
        const dropoffMarker = new window.google.maps.marker.PinElement({
          scale: 1,
          background: '#FF9800',
          borderColor: '#F57C00',
          glyphColor: '#FFFFFF'
        });

        const dropoffPosition = {
          lat: contract.drop_off_location_geo.coordinates[1],
          lng: contract.drop_off_location_geo.coordinates[0]
        };

        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: dropoffPosition,
          title: 'Drop-off Location',
          content: dropoffMarker.element,
          collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });

        markers.push(dropoffPosition);
      }

      // Fit bounds to show all markers
      if (markers.length > 0) {
        if (contract.current_location_geo?.coordinates) {
          const currentPosition = {
            lat: contract.current_location_geo.coordinates[1],
            lng: contract.current_location_geo.coordinates[0]
          };
          newMap.setCenter(currentPosition);
          newMap.setZoom(15);
        } else {
          const bounds = new window.google.maps.LatLngBounds();
          markers.forEach(marker => bounds.extend(marker));
          newMap.fitBounds(bounds);
          const padding = 0.02;
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          bounds.extend({ lat: ne.lat() + padding, lng: ne.lng() + padding });
          bounds.extend({ lat: sw.lat() - padding, lng: sw.lng() - padding });
          newMap.fitBounds(bounds);
        }
      }

      console.log('Map initialization completed successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(error.message);
    }
  };

  // Function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  };

  // Cooldown effect - updates every second
  useEffect(() => {
    let cooldownInterval;
    
    if (cooldownRemaining > 0) {
      cooldownInterval = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    };
  }, [cooldownRemaining]);

  // Button-triggered directions calculation - EXACTLY 2 API CALLS
  const handleGetDirections = async () => {
    if (!directionsServiceRef.current || !contract || !map) {
      setDirectionsError('Map or directions service not available');
      return;
    }

    if (!contract.current_location_geo?.coordinates || 
        !contract.drop_off_location_geo?.coordinates || 
        !contract.pickup_location_geo?.coordinates) {
      setDirectionsError('Missing required location coordinates');
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastRequest = now - lastDirectionsRequest;
    const cooldownTime = 60 * 1000; // 60 seconds in milliseconds

    if (timeSinceLastRequest < cooldownTime) {
      const remaining = Math.ceil((cooldownTime - timeSinceLastRequest) / 1000);
      setCooldownRemaining(remaining);
      setDirectionsError(`Please wait ${remaining} seconds before requesting directions again`);
      return;
    }

    setIsLoadingDirections(true);
    setDirectionsError(null);
    setLastDirectionsRequest(now);

    try {
      const currentLocation = {
        lat: contract.current_location_geo.coordinates[1],
        lng: contract.current_location_geo.coordinates[0]
      };
      const dropoffLocation = {
        lat: contract.drop_off_location_geo.coordinates[1],
        lng: contract.drop_off_location_geo.coordinates[0]
      };
      const pickupLocation = {
        lat: contract.pickup_location_geo.coordinates[1],
        lng: contract.pickup_location_geo.coordinates[0]
      };

      console.log('Making 2 Directions API requests...');
      
      // REQUEST 1: Current location to drop-off location (for ETA, distance remaining, and polyline)
      const currentToDropoffPromise = directionsServiceRef.current.route({
        origin: currentLocation,
        destination: dropoffLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      });

      // REQUEST 2: Pickup location to drop-off location (for total distance to calculate progress)
      const pickupToDropoffPromise = directionsServiceRef.current.route({
        origin: pickupLocation,
        destination: dropoffLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      });

      // Wait for both requests to complete
      const [currentToDropoffResult, pickupToDropoffResult] = await Promise.all([
        currentToDropoffPromise,
        pickupToDropoffPromise
      ]);

      console.log('Both Directions API requests completed');

      // Process REQUEST 1 results
      const currentRoute = currentToDropoffResult.routes[0].legs[0];
      const distanceRemaining = currentRoute.distance.value / 1000; // Convert to km
      const duration = currentRoute.duration_in_traffic?.value || currentRoute.duration.value; // Duration in seconds
      const eta = new Date(Date.now() + duration * 1000);

      // Process REQUEST 2 results
      const totalRoute = pickupToDropoffResult.routes[0].legs[0];
      const totalDistance = totalRoute.distance.value / 1000; // Convert to km

      // Calculate progress
      const progress = Math.max(0, Math.min(100, 
        (1 - (distanceRemaining / totalDistance)) * 100
      ));

      // Clear existing polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Draw polyline from current location to drop-off
      const routePath = currentToDropoffResult.routes[0].overview_path;
      polylineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
      });

      // Update state with calculated values
      setRouteData({
        eta,
        distanceRemaining,
        progress,
        polyline: routePath,
        totalDistance
      });

      console.log('Route calculations completed:', {
        distanceRemaining: `${distanceRemaining.toFixed(1)} km`,
        progress: `${Math.round(progress)}%`,
        eta: eta.toLocaleTimeString(),
        totalDistance: `${totalDistance.toFixed(1)} km`
      });

    } catch (error) {
      console.error('Error calculating directions:', error);
      setDirectionsError(error.message || 'Failed to calculate directions');
    } finally {
      setIsLoadingDirections(false);
    }
  };

  const handleSearch = (id = contractId) => {
    fetchData(id);
  };

  const handleExpandClick = () => { setExpanded(!expanded); };

  const handleClearSearch = () => {
    setContractId("");
    setContract(null);
    setError(null);
    previousValidContractIdRef.current = "";
    if (map) setMap(null);
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.map = null;
      currentLocationMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    setIsScriptLoaded(false);
    setSnackbarOpen(false);
    setRouteData({
      eta: null,
      distanceRemaining: null,
      progress: 0,
      polyline: null,
      totalDistance: null
    });
    setLastDirectionsRequest(0);
    setCooldownRemaining(0);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Render
  return (
    <Box sx={{display: "flex", flexDirection: "column", gap: 4 }}>
      {!contract ? (
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          minHeight: "80vh",
          gap: 2
        }}>
          <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mb: 2 }}>
            Track Luggage
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: "100%",
            maxWidth: "400px"
          }}>
            <TextField 
              label="Track Luggage" 
              placeholder="Enter Contract ID" 
              variant="outlined" 
              size="small" 
              value={contractId} 
              onChange={(e) => setContractId(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
              sx={{ width: "100%" }}
              InputProps={{
                endAdornment: contractId && (
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Box>
          {error && (<Typography color="error" align="center">{error}</Typography>)}
          <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => router.push('/egc-admin/')} sx={{ mr: 1, color: 'primary.main' }}><ChevronLeftIcon /></IconButton>
              <Typography variant="h4" color="primary.main" fontWeight="bold">Luggage Tracking</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField 
                label="Track Luggage" 
                placeholder="Enter Contract ID" 
                variant="outlined" 
                size="small" 
                value={contractId} 
                onChange={(e) => setContractId(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                sx={{ width: "300px" }}
                InputProps={{
                  endAdornment: contractId && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'text.primary'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Box>
          </Box>
          {error && (<Typography color="error" align="center">{error}</Typography>)}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Contract ID: <span style={{ fontWeight: 400 }}>{contract.id}</span>
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Location Information
                </Typography>
                <Box sx={{ ml: 1, mb: 1 }}>
                  <Typography variant="body2">
                    <b>Pickup:</b> <span>{contract.pickup_location || 'N/A'}</span>
                  </Typography>
                  {contract.pickup_location_geo && (
                    <Typography variant="body2">
                      <b>Pickup Coordinates:</b>{' '}
                      <span>
                        {contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}
                      </span>
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <b>Drop-off:</b> <span>{contract.drop_off_location || 'N/A'}</span>
                  </Typography>
                  {contract.drop_off_location_geo && (
                    <Typography variant="body2">
                      <b>Drop-off Coordinates:</b>{' '}
                      <span>
                        {contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}
                      </span>
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ml: 2 }}>
                <IconButton
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                  size="small"
                  sx={{ 
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark'
                    },
                    mt: 3
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
            </Box>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Contractor Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Contractor Name:</b>{' '}
                  <span>
                    {contract.airline
                      ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${
                          contract.airline.last_name || ''
                        }${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Contractor Email:</b>{' '}
                  <span>{contract.airline?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Contractor Contact:</b>{' '}
                  <span>{contract.airline?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Subcontractor Name:</b>{' '}
                  <span>
                    {contract.delivery
                      ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${
                          contract.delivery.last_name || ''
                        }${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`
                          .replace(/  +/g, ' ')
                          .trim()
                      : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Subcontractor Email:</b>{' '}
                  <span>{contract.delivery?.email || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Subcontractor Contact:</b>{' '}
                  <span>{contract.delivery?.contact_number || 'N/A'}</span>
                </Typography>
                <Typography variant="body2">
                  <b>Status:</b>{' '}
                  <span style={{ fontWeight: 700 }}>
                    {contract.contract_status?.status_name || 'N/A'}
                  </span>
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Luggage Information
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                {(!contract.luggage || contract.luggage.length === 0) && (
                  <Typography variant="body2">
                    No luggage info.
                  </Typography>
                )}
                {contract.luggage && contract.luggage.map((l, lidx) => (
                  <Box key={l.id} sx={{ mb: 2, pl: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      Luggage {lidx + 1}
                    </Typography>
                    <Typography variant="body2">
                      Flight Number: <span>{l.flight_number || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      Name: <span>{l.luggage_owner || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      Contact Number: <span>{l.contact_number || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      Address: <span>{l.address || 'N/A'}</span>
                    </Typography>
                    <Typography variant="body2">
                      Description: <span>{l.item_description || 'N/A'}</span>
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Timeline
              </Typography>
              <Box sx={{ ml: 1, mb: 1 }}>
                <Typography variant="body2">
                  <b>Created:</b>{' '}
                  <span>
                    {contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Accepted:</b>{' '}
                  <span>
                    {contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Pickup:</b>{' '}
                  <span>
                    {contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Delivered:</b>{' '}
                  <span>
                    {contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <b>Cancelled:</b>{' '}
                  <span>
                    {contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}
                  </span>
                </Typography>
              </Box>
            </Collapse>
          </Paper>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Live Tracking</Typography>
              <Button
                variant="contained"
                startIcon={isLoadingDirections ? <CircularProgress size={16} color="inherit" /> : <DirectionsIcon />}
                onClick={handleGetDirections}
                disabled={isLoadingDirections || !map || !directionsServiceRef.current || cooldownRemaining > 0}
                size="small"
                sx={{ 
                  minWidth: '140px',
                  textTransform: 'none'
                }}
              >
                {isLoadingDirections ? 'Calculating...' : 
                 cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Get Directions'}
              </Button>
            </Box>
            
            {directionsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {directionsError}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#FF9800', border: '2px solid #F57C00' }} />
                <Typography variant="body2">Drop-off Location</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#2196F3', border: '2px solid #1976D2' }} />
                <Typography variant="body2">Pickup Location</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#4CAF50', border: '2px solid #388E3C' }} />
                <Typography variant="body2">Current Location</Typography>
              </Box>
            </Box>
            
            {/* Route Information Display */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                Route Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">Distance Remaining</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {routeData.distanceRemaining ? `${routeData.distanceRemaining.toFixed(1)} km` : 'Click "Get Directions"'}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">Estimated Time of Arrival</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {routeData.eta ? routeData.eta.toLocaleTimeString() : 'Click "Get Directions"'}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">Total Distance</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {routeData.totalDistance ? `${routeData.totalDistance.toFixed(1)} km` : 'Click "Get Directions"'}
                  </Typography>
                </Paper>
              </Box>
              
              {/* Progress Bar Section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Progress
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    {Math.round(routeData.progress)}%
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: 1,
                      bgcolor: routeData.progress > 0 ? 'primary.main' : 'grey.300',
                      width: `${routeData.progress}%`,
                      transition: 'width 0.5s ease-in-out'
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {routeData.progress > 0 ? 
                    `Progress calculated from pickup to drop-off location` : 
                    'Click "Get Directions" to calculate progress'
                  }
                </Typography>
              </Box>
            </Box>
            
            <MapComponent mapRef={mapRef} mapError={mapError} />
          </Paper>
        </>
      )}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}