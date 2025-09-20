"use client";

import { Box, Button, Container, Typography, Paper, Grid, Card, CardContent, Avatar, Chip, TextField, Divider, IconButton, Collapse, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useState, useEffect, useRef, Suspense } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

// Map component
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
  <Box ref={mapRef} sx={{ width: '100%', height: '500px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>{mapError && (<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}><Typography color="error">{mapError}</Typography></Box>)}</Box>
)), { ssr: false });

export default function Test() {
  const [selectedVehicle, setSelectedVehicle] = useState('motorcycle');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Luggage tracking states
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
  const [eta, setEta] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  
  // Refs for map functionality
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routeSegmentsRef = useRef([]);
  const supabase = createClientComponentClient();
  const previousValidContractIdRef = useRef("");
  const scriptLoadingRef = useRef(false);
  const mapInitializedRef = useRef(false);
  const currentContractIdRef = useRef("");
  
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
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Fetch contract and luggage info from Supabase
  const fetchData = async (id = contractId) => {
    if (!id.trim()) return;
    
    console.log('fetchData called with ID:', id);
    
    const shouldShowErrors = id.length >= previousValidContractIdRef.current.length;
    
    if (shouldShowErrors) {
      setError(null);
    }
    
    setLoading(true);
    try {
      console.log('Fetching contract data for ID from Supabase:', id);
      let joinedError = null;
      const { data: joinedData, error: errJoined } = await supabase
        .from('contracts')
        .select(`
          id, contract_status_id, airline_id, delivery_id,
          owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          luggage_description, luggage_quantity,
          flight_number,
          delivery_address, address_line_1, address_line_2,
          pickup_location, current_location, drop_off_location,
          pickup_location_geo, current_location_geo, drop_off_location_geo,
          remarks, passenger_form, passenger_id, proof_of_delivery,
          created_at, cancelled_at, accepted_at, pickup_at, delivered_at,
          delivery_charge, delivery_surcharge, delivery_discount,
          summary_id,
          airline:airline_id (*),
          delivery:delivery_id (*),
          contract_status:contract_status_id (id, status_name)
        `)
        .eq('id', id)
        .is('summary_id', null)
        .single();

      if (!errJoined && joinedData) {
        previousValidContractIdRef.current = id;
        const newContract = {
          ...joinedData,
          pickup_location_geo: joinedData.pickup_location_geo || null,
          drop_off_location_geo: joinedData.drop_off_location_geo || null,
          current_location_geo: joinedData.current_location_geo || null
        };
        setContract(prev => {
          const shouldUpdate = JSON.stringify(prev) !== JSON.stringify(newContract);
          return shouldUpdate ? newContract : prev;
        });
        setExpanded(true); // Auto-expand when contract is found
        return;
      }

      joinedError = errJoined;
      if (joinedError) {
        console.warn('Joined select blocked or failed, falling back to base columns:', JSON.stringify(joinedError || {}, null, 2));
      }

      console.log('Fetching contract data (fallback base columns):', id);
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id, contract_status_id, airline_id, delivery_id,
          owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          luggage_description, luggage_weight, luggage_quantity,
          flight_number, case_number,
          delivery_address, address_line_1, address_line_2,
          pickup_location, current_location, drop_off_location,
          pickup_location_geo, current_location_geo, drop_off_location_geo,
          remarks, passenger_form, passenger_id, proof_of_delivery,
          created_at, cancelled_at, accepted_at, pickup_at, delivered_at,
          delivery_charge, delivery_surcharge, delivery_discount,
          summary_id
        `)
        .eq('id', id)
        .is('summary_id', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || (error.message && error.message.includes('no) rows returned'))) {
          if (shouldShowErrors) {
            setError('No contract data found');
            setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
          return;
        }
        console.error('Supabase error fetching contract (fallback):', JSON.stringify(error || {}, null, 2));
        throw new Error('Contract not found');
      }

      if (data) {
        let statusObj = null;
        if (data.contract_status_id != null) {
          const { data: statusRow } = await supabase
            .from('contract_status')
            .select('id, status_name')
            .eq('id', data.contract_status_id)
            .maybeSingle();
          statusObj = statusRow || null;
        }
        let airlineObj = null;
        if (data.airline_id) {
          const { data: airlineRow } = await supabase
            .from('profiles')
            .select('id, first_name, middle_initial, last_name, suffix, email, contact_number')
            .eq('id', data.airline_id)
            .maybeSingle();
          airlineObj = airlineRow || null;
        }
        let deliveryObj = null;
        if (data.delivery_id) {
          const { data: deliveryRow } = await supabase
            .from('profiles')
            .select('id, first_name, middle_initial, last_name, suffix, email, contact_number')
            .eq('id', data.delivery_id)
            .maybeSingle();
          deliveryObj = deliveryRow || null;
        }
        
        previousValidContractIdRef.current = id;
        
        const newContract = {
          ...data,
          pickup_location_geo: data.pickup_location_geo || null,
          drop_off_location_geo: data.drop_off_location_geo || null,
          current_location_geo: data.current_location_geo || null,
          contract_status: statusObj,
          airline: airlineObj,
          delivery: deliveryObj
        };
        console.log('Processed contract data:', newContract);
        setContract(prev => {
          const shouldUpdate = JSON.stringify(prev) !== JSON.stringify(newContract);
          return shouldUpdate ? newContract : prev;
        });
        setExpanded(true); // Auto-expand when contract is found
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
    } finally {
      setLoading(false);
    }
  };

  // Reset map/markers when contractId changes
  useEffect(() => {
    if (!contractId) return;
    
    console.log('Contract ID changed, resetting map and fetching data:', contractId);
    
    mapInitializedRef.current = false;
    currentContractIdRef.current = contractId;
    
    if (map) setMap(null);
    if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
    if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; }
    
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

        if (updatedRow?.current_location_geo?.coordinates) {
          const newPosition = {
            lat: updatedRow.current_location_geo.coordinates[1],
            lng: updatedRow.current_location_geo.coordinates[0]
          };

          if (Array.isArray(pathRef.current)) {
            const lastPoint = pathRef.current[pathRef.current.length - 1];
            pathRef.current.push(newPosition);
            if (lastPoint && map && window?.google) {
              await updatePolylineWithDirections(lastPoint, newPosition);
            }
          }

          if (map && updatedRow.current_location_geo?.coordinates) {
            await updateMapLocation();
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
  }, [contractId, supabase]);

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

      const newPolyline = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
      });

      if (!polylineRef.current) {
        polylineRef.current = [];
      }
      polylineRef.current.push(newPolyline);
    } catch (error) {
      console.error('Error getting directions:', error);
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

    if (polylineRef.current) {
      polylineRef.current.forEach(polyline => polyline.setMap(null));
      polylineRef.current = [];
    }
    routeSegmentsRef.current = [];

    for (let i = 0; i < pathRef.current.length - 1; i++) {
      await updatePolylineWithDirections(pathRef.current[i], pathRef.current[i + 1]);
    }
  };

  // Google Maps script loader
  useEffect(() => {
    if (!isScriptLoaded && !window.google && !scriptLoadingRef.current) {
      console.log('Loading Google Maps script...');
      scriptLoadingRef.current = true;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        setIsScriptLoaded(true);
        scriptLoadingRef.current = false;
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps:', error);
        setMapError('Failed to load Google Maps');
        scriptLoadingRef.current = false;
      };
      document.head.appendChild(script);
    }
  }, [isScriptLoaded]);

  // Initialize map when script is loaded and contract is available
  useEffect(() => {
    if (isScriptLoaded && contract && !map && mapRef.current && !mapInitializedRef.current && currentContractIdRef.current === contract.id) {
      const hasLocationData = contract.pickup_location_geo?.coordinates || 
                             contract.drop_off_location_geo?.coordinates || 
                             contract.current_location_geo?.coordinates;
      
      if (hasLocationData) {
        console.log('Initializing map with location data...');
        mapInitializedRef.current = true;
        const timer = setTimeout(() => {
          initMap();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        console.log('No location data available, skipping map initialization');
        mapInitializedRef.current = true;
      }
    }
  }, [isScriptLoaded, contract, map]);

  // Map initialization
  const initMap = () => {
    if (!window.google || !mapRef.current || !contract || currentContractIdRef.current !== contract.id) {
      return;
    }
    
    const hasLocationData = contract.pickup_location_geo?.coordinates || 
                           contract.drop_off_location_geo?.coordinates || 
                           contract.current_location_geo?.coordinates;
    
    if (!hasLocationData) {
      console.log('No location data available for map initialization');
      return;
    }
    
    try {
      console.log('Initializing map with contract:', contract);
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
      } else {
        console.log('No markers to display, using default center');
        newMap.setCenter(defaultCenter);
        newMap.setZoom(10);
      }

      console.log('Map initialization completed successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(error.message);
    }
  };

  // Update map location
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
          console.log('Updating marker position:', newPosition);
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
          console.log('Marker is no longer valid, recreating...');
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
      if (error.message.includes('Cannot read properties of undefined')) {
        console.log('Attempting to recreate marker...');
        currentLocationMarkerRef.current = null;
      }
    }
  };

  // Polling effect for location updates
  useEffect(() => {
    let pollInterval;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const startPolling = () => {
      if (contract?.id) {
        console.log('Starting location polling for contract:', contract.id);
        pollInterval = setInterval(async () => {
          try {
            const { data, error } = await supabase
              .from('contracts')
              .select(`
                id, contract_status_id, airline_id, delivery_id,
                owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
                luggage_description, luggage_weight, luggage_quantity,
                flight_number, case_number,
                delivery_address, address_line_1, address_line_2,
                pickup_location, current_location, drop_off_location,
                pickup_location_geo, current_location_geo, drop_off_location_geo,
                remarks, passenger_form, passenger_id, proof_of_delivery,
                created_at, cancelled_at, accepted_at, pickup_at, delivered_at,
                delivery_charge, delivery_surcharge, delivery_discount,
                summary_id
              `)
              .eq('id', contract.id)
              .is('summary_id', null)
              .single();

            if (error) {
              if (error.code === 'PGRST116' || (error.message && error.message.includes('no) rows returned'))) {
                return;
              }
              throw error;
            }

            if (data) {
              let statusObj = null;
              if (data.contract_status_id != null) {
                const { data: statusRow } = await supabase
                  .from('contract_status')
                  .select('id, status_name')
                  .eq('id', data.contract_status_id)
                  .maybeSingle();
                statusObj = statusRow || null;
              }

              setContract(prev => ({
                ...prev,
                ...data,
                contract_status: statusObj ?? prev?.contract_status ?? null
              }));
              if (data.current_location_geo?.coordinates) {
                await updateMapLocation();
              }
              retryCount = 0;
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

  // Handle search
  const handleSearch = (id = contractId) => {
    if (!id.trim()) {
      setSnackbarMessage("Contract ID cannot be empty.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    fetchData(id);
  };

  // Expand/collapse
  const handleExpandClick = () => { setExpanded(!expanded); };

  const handleClearSearch = () => {
    setContractId("");
    setContract(null);
    setError(null);
    setExpanded(false);
    previousValidContractIdRef.current = "";
    currentContractIdRef.current = "";
    mapInitializedRef.current = false;
    if (map) setMap(null);
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.map = null;
      currentLocationMarkerRef.current = null;
    }
    setSnackbarOpen(false);
  };

  // Show snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Calculate route details
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
      console.error('Error calculating route:', error);
      return { distance: null, duration: null };
    }
  };

  // Format duration
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

      if (details.duration) {
        const etaTime = new Date(Date.now() + details.duration * 1000);
        setEta(etaTime);
      }
    };

    updateRouteDetails();
  }, [contract?.current_location_geo?.coordinates]);

  const deliveryVehicles = [
    {
      id: 'motorcycle',
      name: 'Motorcycle',
      weight: '200kg',
      baseFare: '₱49',
      perKm: '₱6/km',
      icon: '🛵',
      description: 'Cheapest delivery option; perfect for small items such as food and documents.'
    },
    {
      id: 'sedan',
      name: 'Sedan',
      weight: '300kg',
      baseFare: '₱100',
      perKm: '₱18/km',
      icon: '🚗',
      description: 'Cakes, Food trays & Fragile goods'
    },
    {
      id: 'suv',
      name: 'Subcompact SUV',
      weight: '600kg',
      baseFare: '₱115',
      perKm: '₱20/km',
      icon: '🚙',
      description: 'Small appliances (microwave, fan)'
    },
    {
      id: 'van',
      name: '7-seater SUV / Small Van',
      weight: '800kg',
      baseFare: '₱200',
      perKm: '₱20/km',
      icon: '🚐',
      description: 'Appliance (TV or Aircon), Gaming setup'
    },
    {
      id: 'pickup',
      name: 'Pickup',
      weight: '1,000kg',
      baseFare: '₱250',
      perKm: '₱25/km',
      icon: '🛻',
      description: 'Furniture and bulky items'
    },
    {
      id: 'truck',
      name: 'Truck',
      weight: '7,000kg',
      baseFare: '₱4,320',
      perKm: '₱48/km',
      icon: '🚛',
      description: 'Good for general business delivery'
    }
  ];

  const services = [
    {
      icon: '🚚',
      title: 'Express Delivery',
      description: 'Same-day delivery for urgent shipments across the city',
      features: ['Real-time tracking', 'Priority handling', 'Guaranteed delivery']
    },
    {
      icon: '📦',
      title: 'Package Handling',
      description: 'Professional handling of fragile and valuable items',
      features: ['Insurance included', 'Careful packaging', 'Signature required']
    },
    {
      icon: '🌍',
      title: 'International Shipping',
      description: 'Worldwide delivery with customs handling',
      features: ['Documentation support', 'Customs clearance', 'Global tracking']
    },
    {
      icon: '🏢',
      title: 'Business Solutions',
      description: 'Tailored logistics solutions for businesses',
      features: ['Bulk discounts', 'Dedicated account manager', 'API integration']
    },
    {
      icon: '🛡️',
      title: 'Secure Transport',
      description: 'High-security transport for valuable items',
      features: ['Armed escort', 'GPS monitoring', '24/7 surveillance']
    },
    {
      icon: '🌱',
      title: 'Eco-Friendly Delivery',
      description: 'Green delivery options for environmentally conscious customers',
      features: ['Electric vehicles', 'Carbon offset', 'Sustainable packaging']
    }
  ];

  const features = [
    {
      icon: '💰',
      title: 'Affordable rates',
      description: 'Transparent pricing with no hidden costs'
    },
    {
      icon: '⚡',
      title: 'Fast order matching',
      description: 'Match orders and deliver your goods immediately'
    },
    {
      icon: '🚚',
      title: 'Wide-ranging delivery vehicles',
      description: 'Motorcycle, sedan, MPV, pick-up & truck delivery services'
    },
    {
      icon: '🗺️',
      title: '48 serviceable areas',
      description: 'Island-wide coverage across Luzon and in Cebu'
    },
    {
      icon: '🛡️',
      title: 'Safe delivery',
      description: 'Professional partner drivers to deliver packages safely'
    },
    {
      icon: '📍',
      title: 'Real-time Tracking',
      description: 'Track orders real-time from pick-up to drop-off'
    }
  ];

     return (
     <Layout>
      {/* Header */}
      <Box
        sx={{
          background: '#214d22',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <img src="/images/white-logo.png" alt="Logo" width={40} height={40} style={{ marginRight: 12 }} />
              <Typography variant="h5" fontWeight={700} color="white">
                EasyTrack
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Button 
                variant="contained" 
                href="/"
                sx={{ 
                  bgcolor: 'white', 
                  color: '#214d22',
                  '&:hover': { bgcolor: '#f0f0f0' }
                }}
              >
                Home
              </Button>
              <Button color="inherit" href="/services" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Our Services
              </Button>
              <Button color="inherit" href="/about" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                About Us
              </Button>
              
              <Button color="inherit" href="/contact" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                Contact Us
              </Button>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#214d22',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                DP
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

       {/* Welcome Section with Wave Background */}
        <Box
          sx={{
            backgroundImage: ` url(/images/wavebg.svg)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            color: 'white',
            py: 3, // reduced padding so container almost hugs text
            mt: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg" sx={{ py: 0 }}> {/* remove extra padding from Container */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.4, // smaller gap between texts
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                mb: 0, // no extra space below
              }}
            >
              Hi, Delivery Partner
            </Typography>
          </Container>
        </Box>


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
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={6}>
            {/* Text Content */}
            <Box flex={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  lineHeight: 1.2,
                  color: 'white',
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
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    fontWeight: 700, 
                    color: '#214d22', 
                    mb: 2
                  }}
                >
                  Track My Luggage
                </Typography>
                
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', sm: 'row' }} 
                  gap={3} 
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
                          {loading && <CircularProgress size={20} />}
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
                        backgroundColor: 'white',
                        borderRadius: 2,
                        height: 48,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                          borderWidth: 1,
                          borderRadius: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.4)',
                          borderWidth: 1,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#214d22',
                          borderWidth: 1,
                        },
                        transition: 'all 0.2s ease',
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        color: '#214d22',
                        backgroundColor: 'transparent',
                        '&::placeholder': {
                          color: '#999999',
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
                      flex: 1,
                      minWidth: { xs: '100%', sm: 120 },
                      bgcolor: '#214d22',
                      color: 'white',
                      borderRadius: 2,
                      height: 48,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(33, 77, 34, 0.3)',
                      '&:hover': {
                        bgcolor: '#1a3d1b',
                        boxShadow: '0 4px 12px rgba(33, 77, 34, 0.4)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? 'Tracking...' : 'Track Now'}
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
            <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 400,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
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
                    color: 'white',
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
                    color: 'white',
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
        <Box sx={{ py: 6, bgcolor: '#f8f8f0' }}>
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
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#FF9800', border: '2px solid #F57C00' }} />
                  <Typography variant="body2">Drop-off Location</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#2196F3', border: '2px solid #1976D2' }} />
                  <Typography variant="body2">Pickup Location</Typography>
                </Box>
                {contract?.current_location_geo?.coordinates && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#4CAF50', border: '2px solid #388E3C' }} />
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

      {/* Services Section */}
       <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               Your 24/7 delivery app partner
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               Fast. Simple. Affordable.
             </Typography>
           </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                                     <Avatar
                     sx={{
                       width: 60,
                       height: 60,
                       mx: 'auto',
                       mb: 2,
                       bgcolor: '#214d22',
                       fontSize: '1.5rem'
                     }}
                   >
                     {feature.icon}
                   </Avatar>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     {feature.title}
                   </Typography>
                   <Typography variant="body2" sx={{ color: '#666666' }}>
                     {feature.description}
                   </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

             {/* Our Services Section */}
       <Box sx={{ py: 8, bgcolor: '#f8f8f0' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               What We Offer
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               From local deliveries to international shipping, we've got you covered
             </Typography>
           </Box>

           <Grid container spacing={4}>
             {services.map((service, index) => (
               <Grid item xs={12} sm={6} md={4} key={index}>
                 <Card
                   sx={{
                     height: '100%',
                     textAlign: 'center',
                     p: 3,
                     borderRadius: 3,
                     boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                     transition: 'transform 0.3s ease',
                     '&:hover': {
                       transform: 'translateY(-5px)',
                       boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                     }
                   }}
                 >
                   <Avatar
                     sx={{
                       width: 80,
                       height: 80,
                       mx: 'auto',
                       mb: 2,
                       bgcolor: '#214d22',
                       fontSize: '2rem'
                     }}
                   >
                     {service.icon}
                   </Avatar>
                   <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     {service.title}
                   </Typography>
                   <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
                     {service.description}
                   </Typography>
                   
                   <Box sx={{ mb: 2 }}>
                     {service.features.map((feature, featureIndex) => (
                       <Chip
                         key={featureIndex}
                         label={feature}
                         size="small"
                         sx={{
                           m: 0.5,
                           bgcolor: '#214d22',
                           color: 'white',
                           fontSize: '0.75rem'
                         }}
                       />
                     ))}
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         </Container>
       </Box>

       {/* Get in Touch Section */}
       <Box sx={{ py: 8, bgcolor: 'white' }}>
         <Container maxWidth="lg">
           <Box textAlign="center" mb={6}>
             <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#214d22' }}>
               Get in Touch with Us
             </Typography>
             <Typography variant="h5" sx={{ fontWeight: 300, color: '#666666' }}>
               Ready to start your delivery journey? Contact us today!
             </Typography>
           </Box>

           <Grid container spacing={4}>
             <Grid item xs={12} md={6}>
               <Card
                 sx={{
                   p: 4,
                   borderRadius: 3,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                   border: '2px solid #214d22'
                 }}
               >
                 <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#214d22' }}>
                   Contact Information
                 </Typography>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📞 Phone
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     +63 912 345 6789
                   </Typography>
                 </Box>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📧 Email
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     info@easytrack.com
                   </Typography>
                 </Box>
                 <Box sx={{ mb: 3 }}>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     📍 Address
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     123 Logistics Street, Metro Manila, Philippines
                   </Typography>
                 </Box>
                 <Box>
                   <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#214d22' }}>
                     🕒 Business Hours
                   </Typography>
                   <Typography variant="body1" sx={{ color: '#666666' }}>
                     Monday - Friday: 8:00 AM - 6:00 PM<br />
                     Saturday: 9:00 AM - 4:00 PM<br />
                     Sunday: Closed
                   </Typography>
                 </Box>
               </Card>
             </Grid>
             <Grid item xs={12} md={6}>
               <Card
                 sx={{
                   p: 4,
                   borderRadius: 3,
                   boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                   border: '2px solid #214d22'
                 }}
               >
                 <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#214d22' }}>
                   Quick Contact Form
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
                       bgcolor: '#214d22',
                       color: 'white',
                       py: 1.5,
                       fontSize: '1.1rem',
                       fontWeight: 600,
                       borderRadius: 3,
                       textTransform: 'none',
                       '&:hover': {
                         bgcolor: '#1a3d1b'
                       }
                     }}
                   >
                     Send Message
                   </Button>
                 </Box>
               </Card>
             </Grid>
           </Grid>
         </Container>
       </Box>

             {/* CTA Section */}
       <Box
         sx={{
           background: '#214d22',
           color: 'white',
           py: 8,
           textAlign: 'center'
         }}
       >
         <Container maxWidth="md">
           <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
             Ready to roll?
           </Typography>
           <Typography variant="h6" sx={{ fontWeight: 300, mb: 4, opacity: 0.9 }}>
           Partner with EasyTrack and start delivering what matters today.
           </Typography>
           <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
             <Button
               variant="contained"
               size="large"
               sx={{
                 bgcolor: '#ffffff',
                 color: '#214d22',
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 fontWeight: 600,
                 borderRadius: 3,
                 textTransform: 'none',
                 '&:hover': {
                   bgcolor: '#f0f0f0'
                 }
               }}
             >
               Download App
             </Button>
             <Button
               variant="outlined"
               size="large"
               sx={{
                 borderColor: 'white',
                 color: 'white',
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 fontWeight: 600,
                 borderRadius: 3,
                 textTransform: 'none',
                 '&:hover': {
                   borderColor: 'white',
                   bgcolor: 'rgba(255,255,255,0.1)'
                 }
               }}
             >
               Learn More
             </Button>
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
  );
}