"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Box, Typography, TextField, Paper, Divider, IconButton, Collapse, CircularProgress, Snackbar, Alert } from "@mui/material";
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
  const [mounted, setMounted] = useState(false);
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
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const routeSegmentsRef = useRef([]);
  const supabase = createClientComponentClient();
  const previousValidContractIdRef = useRef("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  
  // Add refs to prevent loops
  const scriptLoadingRef = useRef(false);
  const mapInitializedRef = useRef(false);
  const currentContractIdRef = useRef("");

  // Mount effect
  useEffect(() => {
    console.log('Component mounted');
    setMounted(true);
  }, []);

  // Handle contract ID from URL
  useEffect(() => {
    const idFromUrl = searchParams.get('contractId');
    if (idFromUrl) {
      console.log('Contract ID from URL:', idFromUrl);
      setContractId(idFromUrl);
      // Don't call handleSearch here, let the contractId effect handle it
    }
  }, [searchParams]);

  // Fetch contract and luggage info directly from Supabase (contracts table)
  const fetchData = async (id = contractId) => {
    if (!id.trim()) return;
    
    console.log('fetchData called with ID:', id);
    
    // Only show errors if the current ID is longer than the previous valid ID
    // This prevents showing errors when user is reducing the contract ID
    const shouldShowErrors = id.length >= previousValidContractIdRef.current.length;
    
    if (shouldShowErrors) {
      setError(null);
    }
    
    setLoading(true);
    try {
      console.log('Fetching contract data for ID from Supabase (admin-like joined select):', id);
      let joinedError = null;
      const { data: joinedData, error: errJoined } = await supabase
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
        // Gracefully handle 'no rows' to avoid noisy errors in UI
        if (error.code === 'PGRST116' || (error.message && error.message.includes('no) rows returned'))) {
          if (shouldShowErrors) {
            setError('No contract data found');
            setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
          return; // Stop further processing
        }
        console.error('Supabase error fetching contract (fallback):', JSON.stringify(error || {}, null, 2));
        throw new Error('Contract not found');
      }

      if (data) {
        // Optionally fetch related rows if policies allow
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
        // Update the previous valid contract ID
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
          console.log('Contract state update:', { shouldUpdate, prevContract: prev, newContract });
          return shouldUpdate ? newContract : prev;
        });
      } else {
        if (shouldShowErrors) {
          setError('No contract data found');
          // Show toast notification for invalid contract ID
          setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
    } catch (err) { 
      console.error('Error fetching contract:', err);
      if (shouldShowErrors) {
        setError(err.message || 'Failed to fetch contract');
        // Show toast notification for invalid contract ID
        setSnackbarMessage('Invalid luggage tracking ID. No contract found.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset map/markers only when contractId changes
  useEffect(() => {
    if (!contractId) return;
    
    console.log('Contract ID changed, resetting map and fetching data:', contractId);
    
    // Reset initialization flags for new contract
    mapInitializedRef.current = false;
    currentContractIdRef.current = contractId;
    
    // Reset map and markers
    if (map) setMap(null);
    if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; }
    if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; }
    
    // Don't reset isScriptLoaded - keep the script loaded
    fetchData(contractId);
  }, [contractId]);

  // Real-time subscription for contract changes (mirror admin)
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

        // Update path and map when current location changes
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

          // Only update map location if map is initialized and we have current location data
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
  }, [contractId, supabase]); // Removed map from dependencies to prevent re-subscription

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

  // Google Maps script loader - only load once
  useEffect(() => {
    console.log('Script loader effect:', { mounted, isScriptLoaded, hasGoogle: !!window.google, scriptLoading: scriptLoadingRef.current });
    
    if (mounted && !isScriptLoaded && !window.google && !scriptLoadingRef.current) {
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
  }, [mounted, isScriptLoaded]);

  // Initialize map when script is loaded and contract is available - only once per contract
  useEffect(() => {
    console.log('Map initialization effect triggered:', {
      isScriptLoaded,
      hasContract: !!contract,
      hasMap: !!map,
      hasMapRef: !!mapRef.current,
      mapInitialized: mapInitializedRef.current,
      currentContractId: currentContractIdRef.current,
      contractId: contract?.id
    });

    if (isScriptLoaded && contract && !map && mapRef.current && !mapInitializedRef.current && currentContractIdRef.current === contract.id) {
      // Check if we have at least pickup or dropoff location coordinates
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
        // Mark as initialized even without location data to prevent infinite waiting
        mapInitializedRef.current = true;
      }
    }
  }, [isScriptLoaded, contract, map]);

  // Additional effect to trigger map initialization when all conditions are met
  useEffect(() => {
    if (isScriptLoaded && contract && mapRef.current && !map && !mapInitializedRef.current) {
      console.log('Additional map initialization check triggered');
      
      // Force a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (isScriptLoaded && contract && mapRef.current && !map && !mapInitializedRef.current) {
          console.log('Forcing map initialization...');
          mapInitializedRef.current = true;
          initMap();
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isScriptLoaded, contract, mapRef.current]);

  // Debug effect to track initialization state
  useEffect(() => {
    console.log('Debug - Current state:', {
      mounted,
      isScriptLoaded,
      hasContract: !!contract,
      contractId: contract?.id,
      hasMap: !!map,
      hasMapRef: !!mapRef.current,
      mapInitialized: mapInitializedRef.current,
      currentContractId: currentContractIdRef.current,
      hasLocationData: !!(contract?.pickup_location_geo?.coordinates || contract?.drop_off_location_geo?.coordinates || contract?.current_location_geo?.coordinates)
    });
  }, [mounted, isScriptLoaded, contract, map, mapRef.current]);

  // Map initialization
  const initMap = () => {
    console.log('initMap called with:', {
      hasGoogle: !!window.google,
      hasMapRef: !!mapRef.current,
      hasContract: !!contract,
      currentContractId: currentContractIdRef.current,
      contractId: contract?.id,
      contractData: contract
    });

    if (!window.google || !mapRef.current || !contract || currentContractIdRef.current !== contract.id) {
      console.log('Map initialization skipped:', {
        hasGoogle: !!window.google,
        hasMapRef: !!mapRef.current,
        hasContract: !!contract,
        currentContractId: currentContractIdRef.current,
        contractId: contract?.id
      });
      return;
    }
    
    // Check if we have any location data to display
    const hasLocationData = contract.pickup_location_geo?.coordinates || 
                           contract.drop_off_location_geo?.coordinates || 
                           contract.current_location_geo?.coordinates;
    
    if (!hasLocationData) {
      console.log('No location data available for map initialization');
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

      // Draw complete route if we have route history
      if (pathRef.current.length >= 2) {
        console.log('Drawing route history:', pathRef.current);
        drawCompleteRoute();
      }

      if (markers.length > 0) {
        if (contract.current_location_geo?.coordinates) {
          // If we have current location, center on it
          const currentPosition = {
            lat: contract.current_location_geo.coordinates[1],
            lng: contract.current_location_geo.coordinates[0]
          };
          newMap.setCenter(currentPosition);
          newMap.setZoom(15);
        } else {
          // If no current location, fit bounds to show pickup and dropoff locations
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
        // If no markers at all, use default center
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

  // Update map location with improved error handling
  const updateMapLocation = async () => {
    if (!map || !window.google) {
      console.log('Map not initialized yet, skipping location update');
      return;
    }
    
    // Only update if we have a current location marker and current location data
    if (!currentLocationMarkerRef.current || !contract?.current_location_geo?.coordinates) {
      console.log('No current location marker or location data, skipping update');
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

  // Update the polling effect with retry mechanism (mirror admin, use API)
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
              // Ignore 'no rows' during polling; just skip this tick
              if (error.code === 'PGRST116' || (error.message && error.message.includes('no) rows returned'))) {
                return;
              }
              throw error;
            }

            if (data) {
              // If contract_status_name is shown in UI, try to fetch status once in polling as well
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

  // Replace handleSearch to use fetchData
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
    // Don't reset isScriptLoaded - keep the script loaded for future use
    setSnackbarOpen(false); // Close snackbar on clear
  };

  // Show snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
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
          distance: route.distance.value / 1000, // Convert meters to kilometers
          duration: route.duration_in_traffic?.value || route.duration.value // Duration in seconds
        };
      }
      return { distance: null, duration: null };
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
      
      // Check if we have the minimum required coordinates
      const hasCurrentLocation = contract?.current_location_geo?.coordinates;
      const hasDropoffLocation = contract?.drop_off_location_geo?.coordinates;
      const hasPickupLocation = contract?.pickup_location_geo?.coordinates;
      
      if (!hasDropoffLocation || !hasPickupLocation) {
        console.log('Missing required coordinates:', {
          dropoff: !!hasDropoffLocation,
          pickup: !!hasPickupLocation
        });
        return;
      }
      
      // If no current location, show total route only
      if (!hasCurrentLocation) {
        console.log('No current location, showing total route only');
        const pickupLocation = {
          lat: contract.pickup_location_geo.coordinates[1],
          lng: contract.pickup_location_geo.coordinates[0]
        };
        const dropoffLocation = {
          lat: contract.drop_off_location_geo.coordinates[1],
          lng: contract.drop_off_location_geo.coordinates[0]
        };
        
        // Calculate total route details
        const totalDetails = await calculateRouteDetails(pickupLocation, dropoffLocation);
        setTotalRouteDetails(totalDetails);
        setRouteDetails({ distance: totalDetails.distance, duration: totalDetails.duration });
        setProgress(0); // No progress since delivery hasn't started
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
            Track Your Luggage
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
            />
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => router.push('/contractor/booking')} sx={{ mr: 1, color: 'primary.main' }}><ChevronLeftIcon /></IconButton>
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
                // Show progress when we have current location
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
                // Show total route info when no current location
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
            {mounted ? (
              <>
                {!isScriptLoaded && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px', flexDirection: 'column', gap: 2 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                      Loading map...
                    </Typography>
                  </Box>
                )}
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
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                <CircularProgress />
              </Box>
            )}
          </Paper>
        </>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}