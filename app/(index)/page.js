"use client";

import { Box, Button, Container, Typography, Paper, TextField, Divider, IconButton, Collapse, CircularProgress, Snackbar, Alert, ThemeProvider, Card } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';
import { isMainDomain, isWwwDomain, getDomainConfig } from '../../config/domains';
import { useRouter } from 'next/navigation';
import { getTheme } from '../theme';

const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
  <Box ref={mapRef} sx={{ width: '100%', height: '500px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>{mapError && (<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}><Typography color="error">{mapError}</Typography></Box>)}</Box>
)), { ssr: false });

export default function Test() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contractId, setContractId] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [map, setMap] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [routeDetails, setRouteDetails] = useState({ distance: null, duration: null });
  const [totalRouteDetails, setTotalRouteDetails] = useState({ distance: null, duration: null });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routeSegmentsRef = useRef([]);
  const previousValidContractIdRef = useRef("");
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const config = getDomainConfig();
      
      if (isWwwDomain(hostname)) {
        const redirectUrl = `https://${config.mainDomain}${window.location.pathname}`;
        window.location.replace(redirectUrl);
        return;
      }
      
      if (isMainDomain(hostname)) {
        router.replace('/admin');
        return;
      }
    }
  }, [router]);
  
  const images = [
    'https://www.shutterstock.com/image-photo/closeup-detail-view-cargo-cart-600nw-2423113091.jpg',
    'https://media.istockphoto.com/id/1266783840/photo/loading-of-cargo-containers-to-airplane.jpg?s=612x612&w=0&k=20&c=QpTBf9neFD8AMrYgk7BZrhQcGIqLnIzjwKk8yyWArwk=',
    'https://static.vecteezy.com/system/resources/thumbnails/050/391/215/small/check-in-counter-transportation-system-holiday-moving-journey-airport-fly-travel-essentials-arrival-suitcase-on-a-conveyor-belt-at-the-airport-seen-from-a-worm-s-eye-view-photo.jpg',
    'https://static.vecteezy.com/system/resources/previews/026/463/814/large_2x/suitcases-in-airport-departure-lounge-airplane-in-background-summer-vacation-concept-traveler-suitcases-in-airport-terminal-waiting-area-empty-hall-interior-with-large-windows-generative-ai-photo.jpg',
    'https://media.istockphoto.com/id/933320678/video/passengers-taking-their-luggage-off-the-baggage-carousel-at-the-airport.jpg?s=640x640&k=20&c=r2skyzM131skxh0n_2oS_RQC1M0sN6PJfQQ7DNd0t_0='
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const fetchData = async (id = contractId) => {
    if (!id.trim()) return;
    
    const shouldShowErrors = id.length >= previousValidContractIdRef.current.length;
    
    if (shouldShowErrors) {
      setError(null);
    }
    
    setLoading(true);
    try {
      const { data: contracts, error: mainContractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id);

      if (mainContractError) {
        throw new Error(`Database error: ${mainContractError.message}`);
      }

      if (!contracts || contracts.length === 0) {
        throw new Error(`Contract ID "${id}" (make sure that it's the contract id) not found.`);
      }

      const contract = contracts[0];

      let luggage = [];
      if (contract.id) {
        const { data: luggageData, error: luggageError } = await supabase
          .from('luggage')
          .select('*')
          .eq('contract_id', contract.id);

        if (!luggageError && luggageData) {
          luggage = luggageData;
        }
      }

      let route_history = [];
      if (contract.id) {
        const { data: routeData, error: routeError } = await supabase
          .from('route_history')
          .select('*')
          .eq('contract_id', contract.id)
          .order('created_at', { ascending: true });

        if (!routeError && routeData) {
          route_history = routeData.map(route => ({
            lat: route.latitude,
            lng: route.longitude,
            timestamp: route.created_at
          }));
        }
      }
      
      if (contract) {
        previousValidContractIdRef.current = id;
        
        const newContract = {
          ...contract,
          luggage: luggage || [],
          pickup_location_geo: contract.pickup_location_geo || null,
          drop_off_location_geo: contract.drop_off_location_geo || null,
          current_location_geo: contract.current_location_geo || null,
          route_history: route_history || []
        };
        
        setContract(prev => {
          return JSON.stringify(prev) !== JSON.stringify(newContract) ? newContract : prev;
        });
        setExpanded(true);
      } else {
        if (shouldShowErrors) {
          setError('No contract data found');
          setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    } catch (err) {
      if (shouldShowErrors) {
        setError(err.message || 'Failed to fetch contract');
        setSnackbarMessage(`Contract ID "${id}" (make sure that it's the contract id) not found.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contractId) return;
    
    if (map) setMap(null);
    if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
    if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; }
    
    fetchData(contractId);
  }, [contractId]);

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
      } catch (err) {
        // Handle error silently
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

      const newPolyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: 'success.main',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
      });

      if (!polylineRef.current) {
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
    } catch (error) {
      const fallbackPath = [start, end];
      routeSegmentsRef.current.push(fallbackPath);

      const newPolyline = new window.google.maps.Polyline({
        path: fallbackPath,
        geodesic: true,
        strokeColor: 'success.main',
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

  useEffect(() => {
    if (!contract) return;

    if (typeof window !== 'undefined' && window.google) {
      if (!isScriptLoaded) setIsScriptLoaded(true);
      return;
    }

    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      script.onerror = (error) => {
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

  useEffect(() => {
    if (isScriptLoaded && contract && !map) {
      initMap();
    }
  }, [isScriptLoaded, contract, map]);

  const initMap = () => {
    if (!window.google || !mapRef.current || !contract) {
      return;
    }
    
    try {
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

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      directionsServiceRef.current = new window.google.maps.DirectionsService();

      const markers = [];

      if (contract.current_location_geo?.coordinates) {
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

      if (contract.pickup_location_geo?.coordinates) {
        const pickupMarker = new window.google.maps.marker.PinElement({
          scale: 1,
          background: 'info.main',
          borderColor: 'info.dark',
          glyphColor: 'info.contrastText'
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
        const dropoffMarker = new window.google.maps.marker.PinElement({
          scale: 1,
          background: 'warning.main',
          borderColor: 'warning.dark',
          glyphColor: 'warning.contrastText'
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
    } catch (error) {
      setMapError(error.message);
    }
  };

  const updateMapLocation = async () => {
    if (!map || !window.google) {
      return;
    }
    
    if (!currentLocationMarkerRef.current || !contract?.current_location_geo?.coordinates) {
      return;
    }

    try {
      if (contract?.current_location_geo?.coordinates) {
        const newPosition = {
          lat: contract.current_location_geo.coordinates[1],
          lng: contract.current_location_geo.coordinates[0]
        };

        if (currentLocationMarkerRef.current && currentLocationMarkerRef.current.map) {
          currentLocationMarkerRef.current.position = newPosition;
          
          map.setCenter(newPosition);
          
          if (pathRef.current) {
            pathRef.current.push(newPosition);
            
            if (pathRef.current.length >= 2) {
              const start = pathRef.current[pathRef.current.length - 2];
              const end = pathRef.current[pathRef.current.length - 1];
              await updatePolylineWithDirections(start, end);
            }
          }
        } else {
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
                <circle cx="12" cy="12" r="10" fill="success.main" fill-opacity="0.6"/>
                <circle cx="12" cy="12" r="8" fill="success.main" fill-opacity="0.8"/>
                <circle cx="12" cy="12" r="6" fill="success.main" fill-opacity="0.9"/>
                <circle cx="12" cy="12" r="4" fill="success.main"/>
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
      if (error.message.includes('Cannot read properties of undefined')) {
        currentLocationMarkerRef.current = null;
      }
    }
  };

  const handleSearch = (id = contractId) => {
    if (!id.trim()) {
      setSnackbarMessage("Contract ID cannot be empty.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    fetchData(id);
  };

  const handleExpandClick = () => { setExpanded(!expanded); };

  const handleClearSearch = () => {
    setContractId("");
    setContract(null);
    setError(null);
    setExpanded(false);
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
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const calculateRouteDetails = async (origin, destination) => {
    if (!directionsServiceRef.current || !origin || !destination) {
      return { distance: null, duration: null };
    }
    
    try {
      const result = await directionsServiceRef.current.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      });

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0].legs[0];
        return {
          distance: route.distance.value / 1000,
          duration: route.duration_in_traffic?.value || route.duration.value
        };
      }
      return { distance: null, duration: null };
    } catch (error) {
      return { distance: null, duration: null };
    }
  };

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

  useEffect(() => {
    const updateRouteDetails = async () => {
      const hasCurrentLocation = contract?.current_location_geo?.coordinates;
      const hasDropoffLocation = contract?.drop_off_location_geo?.coordinates;
      const hasPickupLocation = contract?.pickup_location_geo?.coordinates;
      
      if (!hasDropoffLocation || !hasPickupLocation) {
        return;
      }
      
      if (!hasCurrentLocation) {
        const pickupLocation = {
          lat: contract.pickup_location_geo.coordinates[1],
          lng: contract.pickup_location_geo.coordinates[0]
        };
        const dropoffLocation = {
          lat: contract.drop_off_location_geo.coordinates[1],
          lng: contract.drop_off_location_geo.coordinates[0]
        };
        
        const totalDetails = await calculateRouteDetails(pickupLocation, dropoffLocation);
        setTotalRouteDetails(totalDetails);
        setRouteDetails({ distance: totalDetails.distance, duration: totalDetails.duration });
        setProgress(0);
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

      const details = await calculateRouteDetails(currentLocation, dropoffLocation);
      setRouteDetails(details);

      const totalDetails = await calculateRouteDetails(pickupLocation, dropoffLocation);
      setTotalRouteDetails(totalDetails);

      if (totalDetails.distance) {
        const progressPercentage = Math.max(0, Math.min(100, 
          (1 - (details.distance / totalDetails.distance)) * 100
        ));
        setProgress(progressPercentage);
      }
    };

    updateRouteDetails();
  }, [contract?.current_location_geo?.coordinates]);

  return (
     <ThemeProvider theme={getTheme("light")}>
      <Layout>
       <Navbar currentPage="home" />



      {/* Carousel Section with Wave Background */}
      <Box
        sx={{
          backgroundImage: 'url(/images/wavebg.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          py: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', md: 'row' }} 
            alignItems={{ xs: 'center', md: 'flex-start' }}
            justifyContent="space-between"
            gap={{ xs: 4, md: 6 }}
            minHeight={{ xs: 'auto', md: '500px' }}
          >
            {/* Text Content */}
            <Box 
              flex={{ xs: '1 1 auto', md: '1 1 50%' }}
              sx={{ 
                textAlign: { xs: 'center', md: 'left' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  lineHeight: 1.2,
                  color: 'primary.contrastText',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                Deliver Faster
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 300,
                  mb: 4,
                  color: 'rgba(255, 255, 255, 0.95)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                On-demand delivery platform.<br />
                Get your order matched in 30 seconds.
              </Typography>
              
              {/* Tracking Container */}
              <Paper 
                elevation={4}
                sx={{ 
                  maxWidth: 500, 
                  width: '100%',
                  textAlign: 'left', 
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    borderColor: 'primary.dark'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    fontWeight: 700, 
                    color: 'primary.main', 
                    mb: 2
                  }}
                >
                  Track My Luggage
                </Typography>
                
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', sm: 'row' }} 
                  gap={{ xs: 2, sm: 3 }} 
                  alignItems="stretch"
                  sx={{ mb: 2 }}
                >
                  <TextField
                    fullWidth
                    placeholder="Enter Contract ID"
                    variant="outlined"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <>
                          {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                              <CircularProgress 
                                size={20} 
                                thickness={4}
                                sx={{ color: 'primary.main' }}
                              />
                            </Box>
                          )}
                          {contractId && !loading && (
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
                          )}
                        </>
                      )
                    }}
                    sx={{ 
                      flex: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        height: 48,
                        '& fieldset': {
                          borderColor: 'divider',
                          borderWidth: 1,
                          borderRadius: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'text.secondary',
                          borderWidth: 1,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 1,
                        },
                        transition: 'all 0.2s ease',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        color: 'primary.main',
                        backgroundColor: 'transparent',
                        '&::placeholder': {
                          color: 'text.secondary',
                          opacity: 1,
                          fontWeight: 400,
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => handleSearch()}
                    disabled={loading}
                    sx={{ 
                      flex: { xs: '0 0 auto', sm: 1 },
                      width: { xs: '100%', sm: 'auto' },
                      minWidth: { xs: '100%', sm: 120 },
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      borderRadius: 2,
                      height: 48,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(33, 77, 34, 0.3)',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: '0 4px 12px rgba(33, 77, 34, 0.4)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} thickness={4} sx={{ color: 'inherit' }} />
                        Tracking...
                      </Box>
                    ) : (
                      'Track Now'
                    )}
                  </Button>
                </Box>
                
                {/* Error Display */}
                {error && (
                  <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {error}
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* Image Carousel */}
            <Box 
              flex={{ xs: '0 0 auto', md: '1 1 50%' }}
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '2px solid',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                {images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: index === currentImageIndex ? 1 : 0,
                      transition: 'opacity 0.5s ease-in-out',
                      backgroundImage: `url(${image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                ))}
                
                {/* Navigation Dots */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                    zIndex: 10
                  }}
                >
                  {images.map((_, dotIndex) => (
                    <Box
                      key={dotIndex}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: dotIndex === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: dotIndex === currentImageIndex ? 'white' : 'rgba(255,255,255,0.8)'
                        }
                      }}
                      onClick={() => setCurrentImageIndex(dotIndex)}
                    />
                  ))}
                </Box>

                {/* Navigation Arrows */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'primary.contrastText',
                    fontSize: 20,
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)',
                      transform: 'translateY(-50%) scale(1.1)',
                    }
                  }}
                  onClick={() => setCurrentImageIndex((prevIndex) => 
                    prevIndex === 0 ? images.length - 1 : prevIndex - 1
                  )}
                >
                  ‹
                </Box>
                
                <Box
                  sx={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'primary.contrastText',
                    fontSize: 20,
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    zIndex: 10,
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)',
                      transform: 'translateY(-50%) scale(1.1)',
                    }
                  }}
                  onClick={() => setCurrentImageIndex((prevIndex) => 
                    (prevIndex + 1) % images.length
                  )}
                >
                  ›
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Expanding Luggage Tracking Section */}
      {contract && (
        <Box sx={{ py: 6, bgcolor: 'background.default' }}>
          <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
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
                  <Typography variant="body2">
                    <b>Owner Name:</b> <span>
                      {contract.owner_first_name || contract.owner_middle_initial || contract.owner_last_name 
                        ? `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                        : 'N/A'}
                    </span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Owner Contact:</b> <span>{contract.owner_contact || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Flight Number:</b> <span>{contract.flight_number || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Case Number:</b> <span>{contract.case_number || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Luggage Description:</b> <span>{contract.luggage_description || 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Luggage Weight:</b> <span>{contract.luggage_weight ? `${contract.luggage_weight} kg` : 'N/A'}</span>
                  </Typography>
                  <Typography variant="body2">
                    <b>Luggage Quantity:</b> <span>{contract.luggage_quantity || 'N/A'}</span>
                  </Typography>
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
            
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider', mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Live Tracking</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'warning.main', border: '2px solid', borderColor: 'warning.dark' }} />
                  <Typography variant="body2">Drop-off Location</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'info.main', border: '2px solid', borderColor: 'info.dark' }} />
                  <Typography variant="body2">Pickup Location</Typography>
                </Box>
                {contract?.current_location_geo?.coordinates && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'success.main', border: '2px solid', borderColor: 'success.dark' }} />
                    <Typography variant="body2">Current Location</Typography>
                  </Box>
                )}
              </Box>
              
              {/* Progress and ETA Section */}
              <Box sx={{ mb: 2 }}>
                {contract?.current_location_geo?.coordinates ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Route Distance
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {totalRouteDetails.distance ? `${totalRouteDetails.distance.toFixed(1)} km` : 'Calculating...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated Travel Time
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {totalRouteDetails.duration ? formatDuration(totalRouteDetails.duration) : 'Calculating...'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body2" color="warning.main" fontWeight="bold">
                        Awaiting pickup
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
              
              {/* Map Component */}
              {isScriptLoaded && contract && (
                <MapComponent mapRef={mapRef} mapError={mapError} />
              )}
              {isScriptLoaded && !contract && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No contract data available for map display
                  </Typography>
                </Box>
              )}
              {!isScriptLoaded && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', flexDirection: 'column', gap: 2 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading map...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Container>
        </Box>
      )}

      {/* Contact Section */}
      <Box id="contact" sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box 
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center" 
            mb={6}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Get in Touch with Us
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 300, color: 'text.secondary' }}>
              Ready to start your delivery journey? Contact us today!
            </Typography>
          </Box>

          <Box 
            display="flex"
            justifyContent="center"
            width="100%"
          >
            <Box 
              sx={{ 
                width: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
                maxWidth: 600
              }}
            >
              <Card
                sx={{
                  p: 4,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                  Send us a Message
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    variant="outlined"
                    multiline
                    rows={4}
                    sx={{ mb: 3 }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    Send Message
                  </Button>
                </Box>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      
      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      </Layout>
     </ThemeProvider>
  );
}