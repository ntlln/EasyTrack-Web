"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Box, Typography, TextField, Paper, Divider, IconButton, Collapse, CircularProgress } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
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
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);
  const [routeDetails, setRouteDetails] = useState({ distance: null, duration: null });
  const [totalRouteDetails, setTotalRouteDetails] = useState({ distance: null, duration: null });
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routeSegmentsRef = useRef([]);
  const supabase = createClientComponentClient();

  // Handle contract ID from URL
  useEffect(() => {
    const idFromUrl = searchParams.get('contractId');
    if (idFromUrl) {
      setContractId(idFromUrl);
      handleSearch(idFromUrl);
    }
  }, [searchParams]);

  // Fetch contract and luggage info (moved out for reuse)
  const fetchData = async (id = contractId) => {
    if (!id.trim()) return;
    setError(null);
    try {
      console.log('Fetching contract data for ID:', id);
      const response = await fetch(`/api/admin?contractId=${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contract data');
      }
      const { data } = await response.json();
      console.log('Received contract data:', data);
      
      if (data) {
        // Ensure all required fields are present
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
      } else {
        setError('No contract data found');
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError(err.message || 'Failed to fetch contract');
    }
  };

  // Reset map/markers only when contractId changes
  useEffect(() => {
    if (!contractId) return;
    console.log('Contract ID changed:', contractId);
    // Reset map and markers
    if (map) setMap(null);
    if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
    if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; }
    setIsScriptLoaded(false);
    fetchData(contractId);
  }, [contractId]);

  // Poll for current location updates (map only)
  const updateMapLocation = async () => {
    if (!map || !window.google || !currentLocationMarkerRef.current) {
      console.log('Map or marker not initialized yet, skipping location update');
      return;
    }

    try {
      if (contract?.current_location_geo?.coordinates) {
        const newPosition = {
          lat: contract.current_location_geo.coordinates[1],
          lng: contract.current_location_geo.coordinates[0]
        };

        // Check if the marker is still valid
        if (currentLocationMarkerRef.current && currentLocationMarkerRef.current.map) {
          console.log('Updating marker position:', newPosition);
          currentLocationMarkerRef.current.position = newPosition;
          
          // Update map center to follow the marker
          map.setCenter(newPosition);
          
          // Add the new position to the path
          if (pathRef.current) {
            pathRef.current.push(newPosition);
            
            // Draw the new route segment
            if (pathRef.current.length >= 2) {
              const start = pathRef.current[pathRef.current.length - 2];
              const end = pathRef.current[pathRef.current.length - 1];
              await updatePolylineWithDirections(start, end);
            }
          }
        } else {
          console.log('Marker is no longer valid, recreating...');
          // Recreate the marker if it's no longer valid
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
            map: map,
            position: newPosition,
            title: 'Current Location',
            content: currentLocationMarker,
            collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
          });
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
      // If there's an error with the marker, try to recreate it
      if (error.message.includes('Cannot read properties of undefined')) {
        console.log('Attempting to recreate marker...');
        currentLocationMarkerRef.current = null;
        // The next location update will recreate the marker
      }
    }
  };

  // Update the polling effect to handle errors
  useEffect(() => {
    let pollInterval;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const startPolling = () => {
      if (contract?.id) {
        console.log('Starting location polling for contract:', contract.id);
        pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/admin?action=getContract&contractId=${contract.id}`);
            if (!response.ok) throw new Error('Failed to fetch contract data');
            
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            if (result.data) {
              setContract(result.data);
              await updateMapLocation();
              retryCount = 0; // Reset retry count on successful update
            }
          } catch (error) {
            console.error('Error polling location:', error);
            retryCount++;
            
            if (retryCount >= MAX_RETRIES) {
              console.log('Max retries reached, stopping polling');
              clearInterval(pollInterval);
              setMapError('Failed to update location after multiple attempts');
            }
          }
        }, 5000);
      }
    };

    startPolling();

    return () => {
      if (pollInterval) {
        console.log('Clearing polling interval');
        clearInterval(pollInterval);
      }
    };
  }, [contract?.id]);

  // Real-time subscription for contract changes
  useEffect(() => {
    if (!contractId) return;
    const subscription = supabase
      .channel(`contract-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contract',
          filter: `id=eq.${contractId}`,
        },
        () => fetchData(contractId)
      )
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [contractId]);

  // Update polyline with directions
  const updatePolylineWithDirections = async (start, end) => {
    if (!directionsServiceRef.current || !map) return;

    try {
      const result = await directionsServiceRef.current.route({
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      const routePath = result.routes[0].overview_path;
      routeSegmentsRef.current.push(routePath);

      // Create a new polyline for this segment
      const newPolyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
      });

      // Store the polyline reference
      if (!polylineRef.current) {
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
    } catch (error) {
      console.error('Error getting directions:', error);
      // Fallback to straight line if directions service fails
      const fallbackPath = [start, end];
      routeSegmentsRef.current.push(fallbackPath);

      const newPolyline = new window.google.maps.Polyline({
        path: fallbackPath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: map
      });

      if (!polylineRef.current) {
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
    }
  };

  // Draw complete route history
  const drawCompleteRoute = async () => {
    if (!directionsServiceRef.current || !map || pathRef.current.length < 2) return;

    // Clear existing polylines
    if (polylineRef.current) {
      polylineRef.current.forEach(polyline => polyline.setMap(null));
      polylineRef.current = [];
    }
    routeSegmentsRef.current = [];

    // Draw route segments
    for (let i = 0; i < pathRef.current.length - 1; i++) {
      await updatePolylineWithDirections(pathRef.current[i], pathRef.current[i + 1]);
    }
  };

  // Google Maps script loader
  useEffect(() => {
    if (contract && !isScriptLoaded && !window.google) {
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
      // Load route_history if available
      if (contract.route_history && Array.isArray(contract.route_history) && contract.route_history.length > 0) {
        pathRef.current = contract.route_history.map(point => ({ lat: point.lat, lng: point.lng }));
      } else if (contract.current_location_geo?.coordinates) {
        pathRef.current = [{
          lat: contract.current_location_geo.coordinates[1],
          lng: contract.current_location_geo.coordinates[0]
        }];
      } else {
        pathRef.current = [];
      }
      
      if (polylineRef.current) {
        polylineRef.current.forEach(polyline => polyline.setMap(null));
        polylineRef.current = [];
      }
      routeSegmentsRef.current = [];

      const defaultCenter = { lat: 14.5350, lng: 120.9821 };
      const mapOptions = {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
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
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.8;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
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

      // Draw complete route if we have route history
      if (pathRef.current.length >= 2) {
        console.log('Drawing route history:', pathRef.current);
        drawCompleteRoute();
      }

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

  // Function to calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Function to calculate route details using Google Maps Directions Service
  const calculateRouteDetails = async (origin, destination) => {
    if (!directionsServiceRef.current || !origin || !destination) {
      console.log('Missing required parameters for route calculation:', {
        hasDirectionsService: !!directionsServiceRef.current,
        origin,
        destination
      });
      return { distance: null, duration: null };
    }
    
    try {
      console.log('Calculating route details with coordinates:', {
        current: origin,
        dropoff: destination,
        pickup: contract?.pickup_location_geo?.coordinates
      });

      const result = await directionsServiceRef.current.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      });

      if (!result || !result.routes || result.routes.length === 0) {
        console.warn('No routes found in the response:', result);
        return { distance: null, duration: null };
      }

      const route = result.routes[0].legs[0];
      return {
        distance: route.distance.value / 1000, // Convert meters to kilometers
        duration: route.duration_in_traffic?.value || route.duration.value // Duration in seconds
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return { distance: null, duration: null };
    }
  };

  // Function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'Calculating...';
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

  // Update route details when location changes
  useEffect(() => {
    const updateRouteDetails = async () => {
      console.log('Location changed, checking coordinates...');
      if (!contract?.current_location_geo?.coordinates || 
          !contract?.drop_off_location_geo?.coordinates || 
          !contract?.pickup_location_geo?.coordinates) {
        console.log('Missing coordinates:', {
          current: !!contract?.current_location_geo?.coordinates,
          dropoff: !!contract?.drop_off_location_geo?.coordinates,
          pickup: !!contract?.pickup_location_geo?.coordinates
        });
        return;
      }

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

      console.log('Calculating route details with coordinates:', {
        current: currentLocation,
        dropoff: dropoffLocation,
        pickup: pickupLocation
      });

      // Calculate current route details
      const details = await calculateRouteDetails(currentLocation, dropoffLocation);
      setRouteDetails(details);

      // Calculate total route details
      const totalDetails = await calculateRouteDetails(pickupLocation, dropoffLocation);
      setTotalRouteDetails(totalDetails);

      // Calculate progress
      if (totalDetails.distance) {
        const progressPercentage = Math.max(0, Math.min(100, 
          (1 - (details.distance / totalDetails.distance)) * 100
        ));
        console.log('Delivery Progress:', {
          progress: `${Math.round(progressPercentage)}%`,
          distanceRemaining: `${details.distance?.toFixed(1)} km`,
          eta: details.duration ? formatDuration(details.duration) : 'Calculating...'
        });
        setProgress(progressPercentage);
      }

      // Calculate ETA
      if (details.duration) {
        const etaTime = new Date(Date.now() + details.duration * 1000);
        setEta(etaTime);
      }
    };

    updateRouteDetails();
  }, [contract?.current_location_geo?.coordinates]);

  // Replace handleSearch to use fetchData
  const handleSearch = (id = contractId) => fetchData(id);

  // Expand/collapse
  const handleExpandClick = () => { setExpanded(!expanded); };

  const handleClearSearch = () => {
    setContractId("");
    setContract(null);
    if (map) setMap(null);
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.map = null;
      currentLocationMarkerRef.current = null;
    }
    setIsScriptLoaded(false);
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
                      Case Number: <span>{l.case_number || 'N/A'}</span>
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
                      Weight: <span>{l.weight ? `${l.weight} kg` : 'N/A'}</span>
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
            <Typography variant="h6" sx={{ mb: 2 }}>Live Tracking</Typography>
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
            {/* Progress and ETA Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Progress
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8, mb: 1 }}>
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    width: `${progress}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Distance Remaining
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {routeDetails.distance ? `${routeDetails.distance.toFixed(1)} km` : 'Calculating...'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Time of Arrival
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="bold">
                  {routeDetails.duration ? formatDuration(routeDetails.duration) : 'Calculating...'}
                </Typography>
              </Box>
            </Box>
            <MapComponent mapRef={mapRef} mapError={mapError} />
          </Paper>
        </>
      )}
    </Box>
  );
}
