"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, Paper, Divider, IconButton, Collapse, CircularProgress } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Map component
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
  <Box ref={mapRef} sx={{ width: '100%', height: '500px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>{mapError && (<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}><Typography color="error">{mapError}</Typography></Box>)}</Box>
)), { ssr: false });

export default function Page() {
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
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const supabase = createClientComponentClient();

  // Handle contract ID from URL
  useEffect(() => {
    const idFromUrl = searchParams.get('contractId');
    if (idFromUrl) {
      setContractId(idFromUrl);
      handleSearch(idFromUrl);
    }
  }, [searchParams]);

  // Poll for current location updates
  useEffect(() => {
    let intervalId;
    const updateCurrentLocation = async () => {
      if (!contract?.id) return;
      try {
        const { data, error: locationError } = await supabase.from('contract').select('current_location_geo').eq('id', contract.id).single();
        if (locationError) throw locationError;
        if (data?.current_location_geo && map) {
          const newPosition = { lat: data.current_location_geo.coordinates[1], lng: data.current_location_geo.coordinates[0] };
          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.position = newPosition;
          } else {
            const currentLocationMarker = new window.google.maps.marker.PinElement({ scale: 1, background: '#FF9800', borderColor: '#F57C00', glyphColor: '#FFFFFF' });
            currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: map, position: newPosition, title: 'Current Location', content: currentLocationMarker.element, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY });
          }
        }
      } catch (err) {}
    };
    if (contract?.id && map) {
      updateCurrentLocation();
      intervalId = setInterval(updateCurrentLocation, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [contract?.id, map]);

  // Google Maps script loader
  useEffect(() => {
    if (contract && !isScriptLoaded && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => { setIsScriptLoaded(true); };
      script.onerror = () => { setMapError('Failed to load Google Maps'); };
      document.head.appendChild(script);
      return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }
  }, [contract, isScriptLoaded]);

  // Initialize map
  useEffect(() => { if (isScriptLoaded && contract && !map) { initMap(); } }, [isScriptLoaded, contract]);

  // Map initialization
  const initMap = () => {
    if (!window.google || !mapRef.current || !contract) return;
    try {
      const defaultLocation = contract.drop_off_location_geo ? { lat: contract.drop_off_location_geo.coordinates[1], lng: contract.drop_off_location_geo.coordinates[0] } : { lat: 14.5350, lng: 120.9821 };
      const mapOptions = { center: defaultLocation, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, mapTypeId: 'roadmap', mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID };
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      if (contract.drop_off_location_geo) {
        const dropoffMarker = new window.google.maps.marker.PinElement({ scale: 1, background: '#4CAF50', borderColor: '#388E3C', glyphColor: '#FFFFFF' });
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: newMap, position: defaultLocation, title: 'Drop-off Location', content: dropoffMarker.element, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY });
      }
      if (contract.pickup_location_geo) {
        const pickupMarker = new window.google.maps.marker.PinElement({ scale: 1, background: '#2196F3', borderColor: '#1976D2', glyphColor: '#FFFFFF' });
        new window.google.maps.marker.AdvancedMarkerElement({ map: newMap, position: { lat: contract.pickup_location_geo.coordinates[1], lng: contract.pickup_location_geo.coordinates[0] }, title: 'Pickup Location', content: pickupMarker.element, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY });
      }
      if (contract.current_location_geo) {
        const currentLocationMarker = new window.google.maps.marker.PinElement({ scale: 1, background: '#FF9800', borderColor: '#F57C00', glyphColor: '#FFFFFF' });
        currentLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: newMap, position: { lat: contract.current_location_geo.coordinates[1], lng: contract.current_location_geo.coordinates[0] }, title: 'Current Location', content: currentLocationMarker.element, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY });
      }
    } catch (error) { setMapError(error.message); }
  };

  // Contract search
  const handleSearch = async (id = contractId) => {
    if (!id.trim()) return;
    setLoading(true); setError(null); setContract(null); if (map) setMap(null); if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; } if (currentLocationMarkerRef.current) { currentLocationMarkerRef.current.map = null; currentLocationMarkerRef.current = null; } setIsScriptLoaded(false);
    try {
      const { data: contracts, error: contractError } = await supabase.from('contract').select(`id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at, pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo, current_location_geo, contract_status_id, contract_status(status_name), airline_id, delivery_id, airline:airline_id (*), delivery:delivery_id (*)`).eq('id', id).single();
      if (contractError) throw contractError;
      if (contracts) {
        const { data: luggage, error: luggageError } = await supabase.from('contract_luggage_information').select('*').eq('contract_id', contracts.id);
        if (luggageError) throw luggageError;
        setContract({ ...contracts, luggage: luggage || [] });
      }
    } catch (err) { setError(err.message || 'Failed to fetch contract'); } finally { setLoading(false); }
  };

  // Expand/collapse
  const handleExpandClick = () => { setExpanded(!expanded); };

  // Render
  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.push('/contractor/booking')} sx={{ mr: 1, color: 'primary.main' }}><ChevronLeftIcon /></IconButton>
          <Typography variant="h4" color="primary.main" fontWeight="bold">Luggage Tracking</Typography>
        </Box>
        <TextField label="Track Luggage" placeholder="Enter Contract ID" variant="outlined" size="small" value={contractId} onChange={(e) => setContractId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} sx={{ width: "300px", '& .MuiOutlinedInput-root': { '& input': { textAlign: 'right', paddingRight: '14px' } } }} />
      </Box>
      {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
      {error && (<Typography color="error" align="center">{error}</Typography>)}
      {contract && (<>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{contract.id}</span></Typography>
            <Divider sx={{ my: 1, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Location Information</Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_location || 'N/A'}</span></Typography>
              {contract.pickup_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup Coordinates:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off:</b> <span style={{ color: 'text.primary' }}>{contract.drop_off_location || 'N/A'}</span></Typography>
              {contract.drop_off_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off Coordinates:</b> <span style={{ color: 'text.primary' }}>{contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, position: 'relative', minHeight: 40 }}>{!expanded && (<IconButton onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more" sx={{ background: 'none', color: 'primary.main', borderRadius: 2, '&:hover': { color: 'primary.dark', background: 'none' } }}><ExpandMoreIcon /></IconButton>)}</Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Contractor Information</Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Name:</b> <span style={{ color: 'text.primary' }}>{contract.airline ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${contract.airline.last_name || ''}${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Email:</b> <span style={{ color: 'text.primary' }}>{contract.airline?.email || 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Contact:</b> <span style={{ color: 'text.primary' }}>{contract.airline?.contact_number || 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Name:</b> <span style={{ color: 'text.primary' }}>{contract.delivery ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${contract.delivery.last_name || ''}${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Email:</b> <span style={{ color: 'text.primary' }}>{contract.delivery?.email || 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Contact:</b> <span style={{ color: 'text.primary' }}>{contract.delivery?.contact_number || 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Status:</b> <span style={{ color: 'primary.main', fontWeight: 700 }}>{contract.contract_status?.status_name || 'N/A'}</span></Typography>
            </Box>
            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Luggage Information</Typography>
            <Box sx={{ ml: 1, mb: 1 }}>{contract.luggage.length === 0 && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}>No luggage info.</Typography>)}{contract.luggage.map((l, lidx) => (<Box key={l.id} sx={{ mb: 2, pl: 1 }}><Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>Luggage {lidx + 1}</Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Owner: <span style={{ color: 'text.primary' }}>{l.luggage_owner || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Case Number: <span style={{ color: 'text.primary' }}>{l.case_number || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Description: <span style={{ color: 'text.primary' }}>{l.item_description || 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Weight: <span style={{ color: 'text.primary' }}>{l.weight ? `${l.weight} kg` : 'N/A'}</span></Typography><Typography variant="body2" sx={{ color: '#bdbdbd' }}>Contact: <span style={{ color: 'text.primary' }}>{l.contact_number || 'N/A'}</span></Typography></Box>))}</Box>
            <Divider sx={{ my: 2, bgcolor: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Timeline</Typography>
            <Box sx={{ ml: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Created:</b> <span style={{ color: 'text.primary' }}>{contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Accepted:</b> <span style={{ color: 'text.primary' }}>{contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: 'text.primary' }}>{contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Delivered:</b> <span style={{ color: 'text.primary' }}>{contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}</span></Typography>
              <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Cancelled:</b> <span style={{ color: 'text.primary' }}>{contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}</span></Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><IconButton onClick={handleExpandClick} aria-expanded={expanded} aria-label="show less" sx={{ background: 'none', color: 'primary.main', borderRadius: 2, '&:hover': { color: 'primary.dark', background: 'none' } }}><ExpandMoreIcon /></IconButton></Box>
          </Collapse>
        </Paper>
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
      </>)}
    </Box>
  );
}