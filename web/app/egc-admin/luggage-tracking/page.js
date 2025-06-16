"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, Button, IconButton, CircularProgress, Divider, Collapse, TextField } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

// Add formatDate helper function at the top level
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

const Page = () => {
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
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const supabase = createClientComponentClient();
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const directionsServiceRef = useRef(null);
  const routeSegmentsRef = useRef([]);

  // Move fetchContracts outside useEffect
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch contract list
  useEffect(() => {
    if (!mounted) return;
    fetchContracts();
  }, [mounted]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleMapsReady(true);
      setIsScriptLoaded(true);
      directionsServiceRef.current = new window.google.maps.DirectionsService();
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

        // Initialize map with a default center (Manila)
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

        console.log('Creating map with initial options:', mapOptions);
        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        setMap(newMap);
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        console.log('Map created successfully');

        // Load route_history if available
        if (searchedContract.route_history && Array.isArray(searchedContract.route_history) && searchedContract.route_history.length > 0) {
          pathRef.current = searchedContract.route_history.map(point => ({ lat: point.lat, lng: point.lng }));
        } else if (searchedContract.current_location_geo?.coordinates) {
          pathRef.current = [{
            lat: searchedContract.current_location_geo.coordinates[1],
            lng: searchedContract.current_location_geo.coordinates[0]
          }];
        } else {
          pathRef.current = [];
        }
        if (polylineRef.current) {
          polylineRef.current.forEach(polyline => polyline.setMap(null));
          polylineRef.current = [];
        }
        routeSegmentsRef.current = [];

        // Add all markers first
        const markers = [];

        // Add current location marker
        if (searchedContract.current_location_geo?.coordinates) {
          console.log('Adding current location marker');
          const currentPosition = {
            lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
            lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
          };
          
          console.log('Current location position:', currentPosition);
          
          // Create a custom SVG marker for current location
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
          console.log('Current location marker added to map');
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
          markers.push(pickupPosition);
        }

        // Add drop-off location marker
        if (searchedContract.drop_off_location_geo?.coordinates) {
          console.log('Adding drop-off marker');
          const dropoffMarker = new window.google.maps.marker.PinElement({ 
            scale: 1, 
            background: '#FF9800', 
            borderColor: '#F57C00', 
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
          markers.push(dropoffPosition);
        }

        // After all markers are added, center the map
        if (markers.length > 0) {
          if (searchedContract.current_location_geo?.coordinates) {
            const currentPosition = {
              lat: parseFloat(searchedContract.current_location_geo.coordinates[1]),
              lng: parseFloat(searchedContract.current_location_geo.coordinates[0])
            };
            newMap.setCenter(currentPosition);
            newMap.setZoom(15);
            console.log('Map centered on current location');
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
            console.log('Map fitted to show all markers');
          }
        }

        // Draw complete route if we have route history
        if (pathRef.current.length >= 2) {
          drawCompleteRoute(newMap, pathRef.current);
        }

      } catch (error) {
        console.error('Error in map initialization:', error);
        setMapError(error.message);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isScriptLoaded, contractList, mapRef, activeSearch, setMap]);

  // Update the polling effect for real-time updates
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

        console.log('New position received:', newPosition);

        // Update current location marker
        if (currentLocationMarkerRef.current) {
          console.log('Updating existing current location marker');
          currentLocationMarkerRef.current.position = newPosition;
        } else {
          console.log('Creating new current location marker');
          // Create a custom SVG marker for current location
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
            map: map,
            position: newPosition,
            title: 'Current Location',
            content: currentLocationMarker,
            collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
          });
        }

        // Update path and polyline from route_history if available
        let routeHistory = result.data.route_history && Array.isArray(result.data.route_history) ? result.data.route_history : [];
        console.log('Route history from API:', routeHistory);
        
        // Convert route history to path points
        const newPathPoints = routeHistory.map(point => ({ lat: point.lat, lng: point.lng }));
        
        // Add the new position if it's not already the last point
        if (!newPathPoints.length || 
            (newPathPoints[newPathPoints.length - 1].lat !== newPosition.lat || 
             newPathPoints[newPathPoints.length - 1].lng !== newPosition.lng)) {
          console.log('Adding new position to path');
          newPathPoints.push(newPosition);
        }

        // Update pathRef with new points
        pathRef.current = newPathPoints;
        console.log('Updated path points:', pathRef.current);

        // If we have at least 2 points, update the polyline
        if (pathRef.current.length >= 2) {
          console.log('Drawing complete route with updated points');
          await drawCompleteRoute(map, pathRef.current);
        }

        // Save updated route_history to Supabase
        console.log('Saving updated route history to Supabase');
        await fetch(`/api/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateRouteHistory',
            params: {
              contractId: searchedContract.id,
              route_history: pathRef.current.map(point => ({ lat: point.lat, lng: point.lng }))
            }
          })
        });

        setMapError(null);
      } catch (err) {
        console.error('Error updating location:', err);
        setMapError(err.message);
      } finally {
        isPolling = false;
      }
    };

    if (activeSearch && mapRef.current) {
      console.log('Starting location polling');
      updateCurrentLocation();
      intervalId = setInterval(updateCurrentLocation, 5000);
    }

    return () => {
      if (intervalId) {
        console.log('Cleaning up location polling interval');
        clearInterval(intervalId);
      }
    };
  }, [contractList, mapRef, activeSearch, map]);

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

  // Helper to update polyline with directions between two points (road-based)
  const updatePolylineWithDirections = async (start, end, mapInstance) => {
    console.log('updatePolylineWithDirections called with:', { start, end });
    if (!directionsServiceRef.current || !mapInstance) {
      console.error('Missing required dependencies:', { 
        hasDirectionsService: !!directionsServiceRef.current, 
        hasMapInstance: !!mapInstance 
      });
      return;
    }

    try {
      console.log('Requesting directions from Google Maps API...');
      const result = await directionsServiceRef.current.route({
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      console.log('Directions received:', result);
      const routePath = result.routes[0].overview_path;
      console.log('Route path points:', routePath);
      routeSegmentsRef.current.push(routePath);

      // Create a new polyline for this segment
      console.log('Creating new polyline with path:', routePath);
      const newPolyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: mapInstance
      });

      // Store the polyline reference
      if (!polylineRef.current) {
        console.log('Initializing polylineRef array');
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
      console.log('Current polyline count:', polylineRef.current.length);
    } catch (error) {
      console.error('Error getting directions:', error);
      console.log('Falling back to straight line between points');
      // Fallback to straight line if directions service fails
      const fallbackPath = [start, end];
      routeSegmentsRef.current.push(fallbackPath);

      console.log('Creating fallback polyline with path:', fallbackPath);
      const newPolyline = new window.google.maps.Polyline({
        path: fallbackPath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: mapInstance
      });

      if (!polylineRef.current) {
        console.log('Initializing polylineRef array for fallback');
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
      console.log('Current polyline count after fallback:', polylineRef.current.length);
    }
  };

  // Helper to draw complete route history
  const drawCompleteRoute = async (mapInstance, pathArr) => {
    console.log('drawCompleteRoute called with path array:', pathArr);
    if (!directionsServiceRef.current || !mapInstance || !pathArr || pathArr.length < 2) {
      console.error('Invalid parameters for drawCompleteRoute:', {
        hasDirectionsService: !!directionsServiceRef.current,
        hasMapInstance: !!mapInstance,
        pathArrLength: pathArr?.length
      });
      return;
    }

    // Clear existing polylines
    if (polylineRef.current) {
      console.log('Clearing existing polylines:', polylineRef.current.length);
      polylineRef.current.forEach(polyline => polyline.setMap(null));
      polylineRef.current = [];
    }
    routeSegmentsRef.current = [];

    // Draw route segments
    console.log('Drawing route segments...');
    for (let i = 0; i < pathArr.length - 1; i++) {
      console.log(`Drawing segment ${i + 1}/${pathArr.length - 1}:`, {
        start: pathArr[i],
        end: pathArr[i + 1]
      });
      await updatePolylineWithDirections(pathArr[i], pathArr[i + 1], mapInstance);
    }
    console.log('Route drawing complete');
  };

  if (!mounted) {
    return null; // Prevent hydration errors: only render on client
  }

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
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
                            {contract.delivery_charge !== null && !isNaN(Number(contract.delivery_charge)) ? (
                              <Typography variant="body2">
                                <b>Price:</b> <span>₱{Number(contract.delivery_charge).toLocaleString()}</span>
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                <b>Price:</b> <span>N/A</span>
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
                              mt: 1
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
                            <Typography variant="body2">
                              No luggage info.
                            </Typography>
                          )}
                          {contract.luggage.map((l, lidx) => (
                            <Box key={`luggage-${contract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                Luggage {lidx + 1}
                              </Typography>
                              <Typography variant="body2">
                                Owner: <span>{l.luggage_owner || 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2">
                                Flight Number: <span>{l.flight_number || 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2">
                                Case Number: <span>{l.case_number || 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2">
                                Description: <span>{l.item_description || 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2">
                                Weight: <span>{l.weight ? `${l.weight} kg` : 'N/A'}</span>
                              </Typography>
                              <Typography variant="body2">
                                Contact: <span>{l.contact_number || 'N/A'}</span>
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
                            <span>{formatDate(contract.created_at)}</span>
                          </Typography>
                          <Typography variant="body2">
                            <b>Accepted:</b>{' '}
                            <span>
                              {contract.accepted_at ? formatDate(contract.accepted_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            <b>Pickup:</b>{' '}
                            <span>
                              {contract.pickup_at ? formatDate(contract.pickup_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            <b>Delivered:</b>{' '}
                            <span>
                              {contract.delivered_at ? formatDate(contract.delivered_at) : 'N/A'}
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            <b>Cancelled:</b>{' '}
                            <span>
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
