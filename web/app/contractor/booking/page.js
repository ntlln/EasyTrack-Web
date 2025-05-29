"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Autocomplete, CircularProgress, Snackbar, Divider, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Map component
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
    <Box ref={mapRef} sx={{ width: '100%', height: '300px', mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative', bgcolor: 'background.default' }}>
        {mapError && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'error.main' }}>
                <Typography color="error">{mapError}</Typography>
            </Box>
        )}
    </Box>
)), { ssr: false });

export default function Page() {
    const router = useRouter();
    // State
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const autocompleteRef = useRef(null); const inputRef = useRef(null); const mapRef = useRef(null); const markerRef = useRef(null);
    const [map, setMap] = useState(null); const [isScriptLoaded, setIsScriptLoaded] = useState(false); const [mapError, setMapError] = useState(null); const updateTimeoutRef = useRef(null);
    const [mounted, setMounted] = useState(false); const [isFormMounted, setIsFormMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(0); const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
    const [contracts, setContracts] = useState([{ name: "", caseNumber: "", itemDescription: "", contact: "", weight: "", quantity: "" }]);
    const [pickupAddress, setPickupAddress] = useState({ location: "", addressLine1: "", addressLine2: "", province: "", city: "", barangay: "", postalCode: "" });
    const [dropoffAddress, setDropoffAddress] = useState({ location: "", lat: null, lng: null });
    const [placeOptions, setPlaceOptions] = useState([]); const [placeLoading, setPlaceLoading] = useState(false); const autocompleteServiceRef = useRef(null); const placesServiceRef = useRef(null);
    const [contractList, setContractList] = useState([]); const [contractListLoading, setContractListLoading] = useState(false); const [contractListError, setContractListError] = useState(null); const [expandedContracts, setExpandedContracts] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Mount
    useEffect(() => { setMounted(true); setIsFormMounted(true); }, []);

    // Google Maps script
    useEffect(() => { if (mounted && !isScriptLoaded && activeTab === 1) { const script = document.createElement('script'); script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`; script.async = true; script.defer = true; script.onload = () => { setIsScriptLoaded(true); setIsGoogleMapsReady(true); }; script.onerror = (e) => { setMapError('Failed to load Google Maps'); }; document.head.appendChild(script); return () => { if (document.head.contains(script)) { document.head.removeChild(script); } }; } }, [mounted, activeTab]);

    // Map init
    useEffect(() => { if (mounted && isGoogleMapsReady && !map && activeTab === 1) { const timer = setTimeout(() => { initMap(); }, 100); return () => clearTimeout(timer); } }, [mounted, isGoogleMapsReady, activeTab]);
    useEffect(() => { if (window.google && map && activeTab === 1) { try { autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService(); placesServiceRef.current = new window.google.maps.places.PlacesService(map); } catch (error) { } } }, [map, activeTab]);
    useEffect(() => { if (activeTab !== 1 && map) { if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; } setMap(null); } }, [activeTab]);

    // Map functions
    const initMap = () => { if (!window.google || !mapRef.current) return; try { const defaultLocation = { lat: 14.5350, lng: 120.9821 }; const mapOptions = { center: defaultLocation, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, mapTypeId: 'roadmap', mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID }; const newMap = new window.google.maps.Map(mapRef.current, mapOptions); setMap(newMap); const markerView = new window.google.maps.marker.PinElement({ scale: 1, background: theme.palette.primary.main, borderColor: theme.palette.primary.dark, glyphColor: '#FFFFFF' }); markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: newMap, position: defaultLocation, title: 'SM Mall of Asia', content: markerView.element, gmpDraggable: true, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY }); setDropoffAddress({ location: 'SM Mall of Asia, Pasay, Metro Manila', lat: defaultLocation.lat, lng: defaultLocation.lng }); let isDragging = false; newMap.addListener('dragstart', () => { isDragging = true; }); newMap.addListener('dragend', () => { isDragging = false; const center = newMap.getCenter(); if (markerRef.current) { markerRef.current.position = center; updateAddressFromPosition(center); } }); newMap.addListener('zoom_changed', () => { if (markerRef.current) { const markerPosition = markerRef.current.position; newMap.panTo(markerPosition); } }); newMap.addListener('click', (event) => { const lat = event.latLng.lat(); const lng = event.latLng.lng(); updateMarkerAndAddress({ lat, lng }); }); markerRef.current.addListener('dragend', () => { const position = markerRef.current.position; updateAddressFromPosition(position); }); } catch (error) { setMapError(error.message); } };
    const updateAddressFromPosition = (position) => { const lat = position.lat(); const lng = position.lng(); const geocoder = new window.google.maps.Geocoder(); geocoder.geocode({ location: { lat, lng } }, (results, status) => { if (status === 'OK' && results[0]) { setDropoffAddress(prev => ({ ...prev, location: results[0].formatted_address, lat: lat, lng: lng })); } }); };
    const updateMarkerAndAddress = (position) => { if (!window.google || !map) return; const markerView = new window.google.maps.marker.PinElement({ scale: 1, background: theme.palette.primary.main, borderColor: theme.palette.primary.dark, glyphColor: '#FFFFFF' }); if (markerRef.current) { markerRef.current.position = position; } else { markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: map, position: position, content: markerView.element, gmpDraggable: true, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY }); } map.panTo(position); const geocoder = new window.google.maps.Geocoder(); geocoder.geocode({ location: position }, (results, status) => { if (status === 'OK' && results[0]) { const formattedAddress = results[0].formatted_address; setDropoffAddress(prev => ({ ...prev, location: formattedAddress, lat: position.lat, lng: position.lng })); } }); };
    const updateMapLocation = useCallback((position, address) => { if (!window.google || !map) return; const markerView = new window.google.maps.marker.PinElement({ scale: 1, background: theme.palette.primary.main, borderColor: theme.palette.primary.dark, glyphColor: '#FFFFFF' }); if (markerRef.current) { markerRef.current.map = null; } markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: map, position: position, title: address, content: markerView.element, gmpDraggable: true, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY }); map.panTo(position); map.setZoom(15); markerRef.current.addListener('dragend', () => { const newPosition = markerRef.current.position; const lat = newPosition.lat; const lng = newPosition.lng; const geocoder = new window.google.maps.Geocoder(); geocoder.geocode({ location: { lat, lng }, componentRestrictions: { country: 'ph' } }, (results, status) => { if (status === 'OK' && results[0]) { setDropoffAddress(prev => ({ ...prev, location: results[0].formatted_address, lat: lat, lng: lng })); } }); }); setTimeout(() => { window.google.maps.event.trigger(map, 'resize'); map.setCenter(position); }, 100); }, [map]);

    // Google Places
    const fetchPlaceSuggestions = (input) => { if (!input || !autocompleteServiceRef.current) { setPlaceOptions([]); return; } setPlaceLoading(true); autocompleteServiceRef.current.getPlacePredictions({ input, types: ['geocode', 'establishment'], componentRestrictions: { country: 'ph' } }, (predictions, status) => { if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) { setPlaceOptions(predictions); } else { setPlaceOptions([]); } setPlaceLoading(false); }); };
    const handleDropoffInputChange = (event, value) => { setDropoffAddress(prev => ({ ...prev, location: value })); fetchPlaceSuggestions(value); };
    const handleDropoffSelect = (event, value) => { if (!value || !placesServiceRef.current) return; setDropoffAddress(prev => ({ ...prev, location: value.description })); placesServiceRef.current.getDetails({ placeId: value.place_id }, (data, status) => { if (status === window.google.maps.places.PlacesServiceStatus.OK && data && data.geometry) { const loc = data.geometry.location; const newPosition = { lat: loc.lat(), lng: loc.lng() }; updateMapLocation(newPosition, data.formatted_address || value.description); setDropoffAddress(prev => ({ ...prev, location: data.formatted_address || value.description, lat: newPosition.lat, lng: newPosition.lng })); } }); };

    // Contract form handlers
    const handlePickupAddressChange = (field, value) => { setPickupAddress(prev => ({ ...prev, [field]: value })); };
    const handleDropoffAddressChange = (field, value) => { setDropoffAddress(prev => ({ ...prev, [field]: value })); };
    const handleInputChange = (index, field, value) => { const updatedContracts = [...contracts]; updatedContracts[index][field] = value; setContracts(updatedContracts); };
    const handleImageChange = (index, file) => { const updatedContracts = [...contracts]; updatedContracts[index].image = file; setContracts(updatedContracts); };
    const clearSingleContract = (index) => { const updatedContracts = [...contracts]; updatedContracts[index] = { name: "", caseNumber: "", itemDescription: "", contact: "", weight: "", quantity: "" }; setContracts(updatedContracts); };
    const deleteContract = (index) => { const updatedContracts = contracts.filter((_, i) => i !== index); setContracts(updatedContracts); };
    const addContract = () => { setContracts([...contracts, { name: "", caseNumber: "", itemDescription: "", contact: "", weight: "", quantity: "" }]); };

    // Submit contract
    const handleSubmit = async () => { try { const { data: { user }, error: userError } = await supabase.auth.getUser(); if (userError) return; const totalLuggageQuantity = contracts.reduce((sum, contract) => sum + Number(contract.quantity || 0), 0); const contractData = { luggage_quantity: totalLuggageQuantity, airline_id: user.id, pickup_location: pickupAddress.location, drop_off_location: dropoffAddress.location, drop_off_location_geo: { type: 'Point', coordinates: [dropoffAddress.lng, dropoffAddress.lat] } }; const { data: insertedContract, error: contractError } = await supabase.from('contract').insert(contractData).select().single(); if (contractError) return; const formattedData = contracts.map(contract => ({ case_number: contract.caseNumber, luggage_owner: contract.name, contact_number: contract.contact, item_description: contract.itemDescription, weight: contract.weight, quantity: contract.quantity, contract_id: insertedContract.id })); const { data, error } = await supabase.from('contract_luggage_information').insert(formattedData); if (error) return; setSnackbarOpen(true); router.refresh(); } catch (error) { } };

    // Tab change
    const handleTabChange = (event, newValue) => { setActiveTab(newValue); };

    // Fetch contract list
    useEffect(() => { const fetchContracts = async () => { setContractListLoading(true); setContractListError(null); try { const { data: contracts, error: contractError } = await supabase.from('contract').select(`id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at, pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo, contract_status_id, contract_status(status_name), airline_id, delivery_id, airline:airline_id (*), delivery:delivery_id (*)`).order('created_at', { ascending: false }); if (contractError) throw contractError; if (!contracts || contracts.length === 0) { setContractList([]); return; } const contractIds = contracts.map(c => c.id); const { data: luggage, error: luggageError } = await supabase.from('contract_luggage_information').select('*').in('contract_id', contractIds); if (luggageError) throw luggageError; const luggageByContract = {}; luggage.forEach(l => { if (!luggageByContract[l.contract_id]) luggageByContract[l.contract_id] = []; luggageByContract[l.contract_id].push(l); }); const contractsWithLuggage = contracts.map(c => ({ ...c, luggage: luggageByContract[c.id] || [] })); setContractList(contractsWithLuggage); } catch (err) { setContractListError(err.message || 'Failed to fetch contracts'); } finally { setContractListLoading(false); } }; if (activeTab === 0) fetchContracts(); }, [activeTab]);

    // Expand/collapse
    const handleExpandClick = (contractId) => { setExpandedContracts((prev) => prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId]); };

    const handleTrackContract = (contractId) => {
        router.push(`/contractor/luggage-tracking?contractId=${contractId}`);
    };

    // Render
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 2 }}>
            {mounted && (<>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main }, '& .MuiTab-root': { color: theme.palette.text.primary, '&.Mui-selected': { color: theme.palette.primary.main } } }}>
                        <Tab label="Contract List" />
                        <Tab label="Booking" />
                    </Tabs>
                </Box>
                {activeTab === 0 && (<Box>
                    {contractListLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
                    {contractListError && (<Typography color="error" align="center">{contractListError}</Typography>)}
                    {!contractListLoading && !contractListError && contractList.length === 0 && (<Typography align="center">No contracts found.</Typography>)}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {contractList.map((contract, idx) => (
                            <Paper key={`contract-${contract.id}`} elevation={3} sx={{ p: 3, borderRadius: 3, background: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.12)', mb: 2, position: 'relative', overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{contract.id}</span></Typography>
                                        <Divider sx={{ my: 1, bgcolor: theme.palette.primary.main }} />
                                        <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>Location Information</Typography>
                                        <Box sx={{ ml: 1, mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: theme.palette.text.primary }}>{contract.pickup_location || 'N/A'}</span></Typography>
                                            {contract.pickup_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup Coordinates:</b> <span style={{ color: theme.palette.text.primary }}>{contract.pickup_location_geo.coordinates[1].toFixed(6)}, {contract.pickup_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
                                            <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off:</b> <span style={{ color: theme.palette.text.primary }}>{contract.drop_off_location || 'N/A'}</span></Typography>
                                            {contract.drop_off_location_geo && (<Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Drop-off Coordinates:</b> <span style={{ color: theme.palette.text.primary }}>{contract.drop_off_location_geo.coordinates[1].toFixed(6)}, {contract.drop_off_location_geo.coordinates[0].toFixed(6)}</span></Typography>)}
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<LocationOnIcon />}
                                        onClick={() => handleTrackContract(contract.id)}
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.primary.dark,
                                            },
                                        }}
                                    >
                                        Track
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, position: 'relative', minHeight: 40 }}>
                                    {!expandedContracts.includes(contract.id) && (<IconButton onClick={() => handleExpandClick(contract.id)} aria-expanded={expandedContracts.includes(contract.id)} aria-label="show more" sx={{ background: 'none', color: theme.palette.primary.main, borderRadius: 2, '&:hover': { color: theme.palette.primary.dark, background: 'none' } }}><ExpandMoreIcon /></IconButton>)}
                                </Box>
                                <Collapse in={expandedContracts.includes(contract.id)} timeout="auto" unmountOnExit>
                                    <Divider sx={{ my: 2, bgcolor: theme.palette.primary.main }} />
                                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>Contractor Information</Typography>
                                    <Box sx={{ ml: 1, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Name:</b> <span style={{ color: theme.palette.text.primary }}>{contract.airline ? `${contract.airline.first_name || ''} ${contract.airline.middle_initial || ''} ${contract.airline.last_name || ''}${contract.airline.suffix ? ` ${contract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Email:</b> <span style={{ color: theme.palette.text.primary }}>{contract.airline?.email || 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Contractor Contact:</b> <span style={{ color: theme.palette.text.primary }}>{contract.airline?.contact_number || 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Name:</b> <span style={{ color: theme.palette.text.primary }}>{contract.delivery ? `${contract.delivery.first_name || ''} ${contract.delivery.middle_initial || ''} ${contract.delivery.last_name || ''}${contract.delivery.suffix ? ` ${contract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Email:</b> <span style={{ color: theme.palette.text.primary }}>{contract.delivery?.email || 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Subcontractor Contact:</b> <span style={{ color: theme.palette.text.primary }}>{contract.delivery?.contact_number || 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Status:</b> <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>{contract.contract_status?.status_name || 'N/A'}</span></Typography>
                                    </Box>
                                    <Divider sx={{ my: 2, bgcolor: theme.palette.primary.main }} />
                                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>Luggage Information</Typography>
                                    <Box sx={{ ml: 1, mb: 1 }}>
                                        {contract.luggage.length === 0 && <Typography variant="body2" sx={{ color: '#bdbdbd' }}>No luggage info.</Typography>}
                                        {contract.luggage.map((l, lidx) => (
                                            <Box key={`luggage-${contract.id}-${lidx}`} sx={{ mb: 2, pl: 1 }}>
                                                <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>Luggage {lidx + 1}</Typography>
                                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>Owner: <span style={{ color: theme.palette.text.primary }}>{l.luggage_owner || 'N/A'}</span></Typography>
                                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>Case Number: <span style={{ color: theme.palette.text.primary }}>{l.case_number || 'N/A'}</span></Typography>
                                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>Description: <span style={{ color: theme.palette.text.primary }}>{l.item_description || 'N/A'}</span></Typography>
                                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>Weight: <span style={{ color: theme.palette.text.primary }}>{l.weight ? `${l.weight} kg` : 'N/A'}</span></Typography>
                                                <Typography variant="body2" sx={{ color: '#bdbdbd' }}>Contact: <span style={{ color: theme.palette.text.primary }}>{l.contact_number || 'N/A'}</span></Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Divider sx={{ my: 2, bgcolor: theme.palette.primary.main }} />
                                    <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>Timeline</Typography>
                                    <Box sx={{ ml: 1, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Created:</b> <span style={{ color: theme.palette.text.primary }}>{contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Accepted:</b> <span style={{ color: theme.palette.text.primary }}>{contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Pickup:</b> <span style={{ color: theme.palette.text.primary }}>{contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Delivered:</b> <span style={{ color: theme.palette.text.primary }}>{contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}</span></Typography>
                                        <Typography variant="body2" sx={{ color: '#bdbdbd' }}><b>Cancelled:</b> <span style={{ color: theme.palette.text.primary }}>{contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}</span></Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <IconButton onClick={() => handleExpandClick(contract.id)} aria-expanded={expandedContracts.includes(contract.id)} aria-label="show less" sx={{ background: 'none', color: theme.palette.primary.main, borderRadius: 2, '&:hover': { color: theme.palette.primary.dark, background: 'none' } }}><ExpandMoreIcon /></IconButton>
                                    </Box>
                                </Collapse>
                            </Paper>
                        ))}
                    </Box>
                </Box>)}
                {activeTab === 1 && (<Box> {/* Booking Form */}
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Pickup Location</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Pickup Location</InputLabel>
                                <Select value={pickupAddress.location} label="Pickup Location" onChange={(e) => handlePickupAddressChange("location", e.target.value)} required>
                                    {[...Array(12)].map((_, i) => (<MenuItem key={`terminal-${i + 1}`} value={`Terminal 3, Bay ${i + 1}`}>{`Terminal 3, Bay ${i + 1}`}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 3, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Drop-off Location</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            {isFormMounted && (<Box><Autocomplete freeSolo filterOptions={(x) => x} options={placeOptions} getOptionLabel={(option) => option.description || ''} loading={placeLoading} inputValue={dropoffAddress.location} onInputChange={handleDropoffInputChange} onChange={handleDropoffSelect} renderInput={(params) => (<TextField {...params} label="Drop-off Location" fullWidth size="small" placeholder="Search for a location" required InputProps={{ ...params.InputProps, endAdornment: (<>{placeLoading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>), autoComplete: 'off', }} sx={{ mb: 1 }} />)} /></Box>)}
                            {mounted && <MapComponent mapRef={mapRef} mapError={mapError} />}
                        </Box>
                    </Paper>
                    {contracts.map((contract, index) => (
                        <Paper key={`contract-form-${index}`} elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                            <IconButton size="small" onClick={() => deleteContract(index)} sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.grey[600] }} aria-label="delete form">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information {index + 1}</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                                <TextField label="Case Number" fullWidth size="small" value={contract.caseNumber} onChange={(e) => handleInputChange(index, "caseNumber", e.target.value)} required />
                                <TextField label="Name" fullWidth size="small" value={contract.name} onChange={(e) => handleInputChange(index, "name", e.target.value)} required />
                                <TextField label="Item Description" fullWidth size="small" value={contract.itemDescription} onChange={(e) => handleInputChange(index, "itemDescription", e.target.value)} required />
                                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                    <TextField label="Contact Number" fullWidth size="small" value={contract.contact} onChange={(e) => handleInputChange(index, "contact", e.target.value)} required />
                                    <TextField label="Weight (kg)" fullWidth size="small" type="number" value={contract.weight} onChange={(e) => handleInputChange(index, "weight", e.target.value)} required />
                                    <TextField label="Luggage Quantity" fullWidth size="small" type="number" value={contract.quantity} onChange={(e) => handleInputChange(index, "quantity", e.target.value)} required />
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                <Button variant="contained" size="small" sx={{ bgcolor: "#4a4a4a", color: "#fff", "&:hover": { bgcolor: "#333" } }} onClick={() => clearSingleContract(index)}>Clear Contract</Button>
                            </Box>
                        </Paper>
                    ))}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}><Button variant="outlined" onClick={addContract}>Add Another Form</Button><Button variant="contained" onClick={handleSubmit}>Send Contract</Button></Box>
                    <Box sx={{ textAlign: "center", mt: 6 }}><Typography variant="h6" fontWeight="bold">Partnered with:</Typography><Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}><Image src="/brand-3.png" alt="AirAsia" width={60} height={60} /></Box></Box>
                </Box>)}
                <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} message="Booking Complete" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
            </>)}
        </Box>
    );
}