"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

// Dynamically import the map component to avoid hydration issues
const MapComponent = dynamic(() => Promise.resolve(({ mapRef, mapError }) => (
    <Box 
        ref={mapRef} 
        sx={{ 
            width: '100%', 
            height: '300px', 
            mt: 2,
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            bgcolor: 'background.default'
        }} 
    >
        {mapError && (
            <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'error.main'
            }}>
                <Typography color="error">{mapError}</Typography>
            </Box>
        )}
    </Box>
)), { ssr: false });

export default function Page() {
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const autocompleteRef = useRef(null);
    const inputRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [map, setMap] = useState(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const updateTimeoutRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const [isFormMounted, setIsFormMounted] = useState(false);
    const [contracts, setContracts] = useState([{ 
        name: "", 
        caseNumber: "",
        itemDescription: "", 
        contact: "",
        weight: ""
    }]);
    const [pickupAddress, setPickupAddress] = useState({
        location: "",
        addressLine1: "",
        addressLine2: "",
        province: "",
        city: "",
        barangay: "",
        postalCode: ""
    });
    const [dropoffAddress, setDropoffAddress] = useState({
        location: "",
        lat: null,
        lng: null
    });

    // State for Google Places Autocomplete
    const [placeOptions, setPlaceOptions] = useState([]);
    const [placeLoading, setPlaceLoading] = useState(false);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);

    // Initialize component mount state
    useEffect(() => {
        setMounted(true);
        setIsFormMounted(true);
    }, []);

    // Initialize map when component mounts and script is loaded
    useEffect(() => {
        if (mounted && isScriptLoaded && !map) {
            initMap();
        }
    }, [mounted, isScriptLoaded]);

    // Initialize AutocompleteService and PlacesService when map is ready
    useEffect(() => {
        if (window.google && map) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
            placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        }
    }, [map]);

    const initMap = () => {
        if (!window.google || !mapRef.current) {
            console.log('Google Maps not loaded or map container not ready');
            return;
        }

        try {
            // SM Mall of Asia coordinates
            const defaultLocation = { lat: 14.5350, lng: 120.9821 };
            
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

            // Create marker content element
            const markerView = new window.google.maps.marker.PinElement({
                scale: 1,
                background: theme.palette.primary.main,
                borderColor: theme.palette.primary.dark,
                glyphColor: '#FFFFFF'
            });

            // Add default marker for SM Mall of Asia with improved draggable behavior
            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                map: newMap,
                position: defaultLocation,
                title: 'SM Mall of Asia',
                content: markerView.element,
                gmpDraggable: true,
                collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
            });

            // Set initial address
            const initialAddress = 'SM Mall of Asia, Pasay, Metro Manila';
            setDropoffAddress({
                location: initialAddress,
                lat: defaultLocation.lat,
                lng: defaultLocation.lng
            });

            let isDragging = false;

            // Add dragstart listener
            newMap.addListener('dragstart', () => {
                isDragging = true;
            });

            // Add dragend listener
            newMap.addListener('dragend', () => {
                isDragging = false;
                const center = newMap.getCenter();
                if (markerRef.current) {
                    markerRef.current.position = center;
                    updateAddressFromPosition(center);
                }
            });

            // Add zoom_changed listener to keep marker centered
            newMap.addListener('zoom_changed', () => {
                if (markerRef.current) {
                    const markerPosition = markerRef.current.position;
                    newMap.panTo(markerPosition);
                }
            });

            // Add click listener to the map
            newMap.addListener('click', (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                updateMarkerAndAddress({ lat, lng });
            });

            // Add dragend listener to marker
            markerRef.current.addListener('dragend', () => {
                const position = markerRef.current.position;
                updateAddressFromPosition(position);
            });

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Map initialization error:', error);
            setMapError(error.message);
        }
    };

    const updateAddressFromPosition = (position) => {
        const lat = position.lat();
        const lng = position.lng();

        // Update address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ 
            location: { lat, lng }
        }, (results, status) => {
            if (status === 'OK' && results[0]) {
                setDropoffAddress(prev => ({
                    ...prev,
                    location: results[0].formatted_address,
                    lat: lat,
                    lng: lng
                }));
            }
        });
    };

    const updateMarkerAndAddress = (position) => {
        if (!window.google || !map) return;

        // Create marker content element
        const markerView = new window.google.maps.marker.PinElement({
            scale: 1,
            background: theme.palette.primary.main,
            borderColor: theme.palette.primary.dark,
            glyphColor: '#FFFFFF'
        });

        // Update marker position
        if (markerRef.current) {
            markerRef.current.position = position;
        } else {
            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: position,
                content: markerView.element,
                gmpDraggable: true,
                collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
            });
        }

        // Center map on marker
        map.panTo(position);

        // Update address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ 
            location: position
        }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const formattedAddress = results[0].formatted_address;
                setDropoffAddress(prev => ({
                    ...prev,
                    location: formattedAddress,
                    lat: position.lat,
                    lng: position.lng
                }));
            }
        });
    };

    const updateMapLocation = useCallback((position, address) => {
        if (!window.google || !map) return;

        // Create marker content element
        const markerView = new window.google.maps.marker.PinElement({
            scale: 1,
            background: theme.palette.primary.main,
            borderColor: theme.palette.primary.dark,
            glyphColor: '#FFFFFF'
        });

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.map = null;
        }

        // Create new marker
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: position,
            title: address,
            content: markerView.element,
            gmpDraggable: true,
            collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });

        // Update map position
        map.panTo(position);
        map.setZoom(15);

        // Add dragend listener
        markerRef.current.addListener('dragend', () => {
            const newPosition = markerRef.current.position;
            const lat = newPosition.lat;
            const lng = newPosition.lng;

            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ 
                location: { lat, lng },
                componentRestrictions: {
                    country: 'ph'
                }
            }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setDropoffAddress(prev => ({
                        ...prev,
                        location: results[0].formatted_address,
                        lat: lat,
                        lng: lng
                    }));
                }
            });
        });

        // Force map resize and recenter
        setTimeout(() => {
            window.google.maps.event.trigger(map, 'resize');
            map.setCenter(position);
        }, 100);
    }, [map]);

    // Fetch Google Places suggestions using AutocompleteService
    const fetchPlaceSuggestions = (input) => {
        if (!input || !autocompleteServiceRef.current) {
            setPlaceOptions([]);
            return;
        }
        setPlaceLoading(true);
        autocompleteServiceRef.current.getPlacePredictions(
            {
                input,
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'ph' }
            },
            (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setPlaceOptions(predictions);
                } else {
                    setPlaceOptions([]);
                }
                setPlaceLoading(false);
            }
        );
    };

    // Handle input change for Autocomplete
    const handleDropoffInputChange = (event, value) => {
        setDropoffAddress(prev => ({ ...prev, location: value }));
        fetchPlaceSuggestions(value);
    };

    // Handle selection from Autocomplete
    const handleDropoffSelect = (event, value) => {
        if (!value || !placesServiceRef.current) return;
        setDropoffAddress(prev => ({ ...prev, location: value.description }));
        // Fetch place details
        placesServiceRef.current.getDetails({ placeId: value.place_id }, (data, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && data && data.geometry) {
                const loc = data.geometry.location;
                const newPosition = { lat: loc.lat(), lng: loc.lng() };
                updateMapLocation(newPosition, data.formatted_address || value.description);
                setDropoffAddress(prev => ({
                    ...prev,
                    location: data.formatted_address || value.description,
                    lat: newPosition.lat,
                    lng: newPosition.lng
                }));
            }
        });
    };

    // Contract handlers
    const handlePickupAddressChange = (field, value) => {
        setPickupAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDropoffAddressChange = (field, value) => {
        setDropoffAddress(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleInputChange = (index, field, value) => {
        const updatedContracts = [...contracts];
        updatedContracts[index][field] = value;
        setContracts(updatedContracts);
    };

    const handleImageChange = (index, file) => {
        const updatedContracts = [...contracts];
        updatedContracts[index].image = file;
        setContracts(updatedContracts);
    };

    const clearSingleContract = (index) => {
        const updatedContracts = [...contracts];
        updatedContracts[index] = { 
            name: "", 
            caseNumber: "",
            itemDescription: "", 
            contact: "",
            weight: ""
        };
        setContracts(updatedContracts);
    };

    const deleteContract = (index) => {
        const updatedContracts = contracts.filter((_, i) => i !== index);
        setContracts(updatedContracts);
    };

    const addContract = () => {
        setContracts([...contracts, { 
            name: "", 
            caseNumber: "",
            itemDescription: "", 
            contact: "",
            weight: ""
        }]);
    };

    const handleSubmit = async () => {
        try {
            // Get the current user's ID
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Error getting user:', userError);
                return;
            }

            // First, insert into contract table
            const { data: contractData, error: contractError } = await supabase
                .from('contract')
                .insert({
                    luggage_quantity: contracts.length,
                    airline_id: user.id
                })
                .select()
                .single();

            if (contractError) {
                console.error('Error inserting contract:', contractError);
                return;
            }

            // Transform the contracts data to match the database schema
            const formattedData = contracts.map(contract => ({
                case_number: contract.caseNumber,
                luggage_owner: contract.name,
                contact_number: contract.contact,
                item_description: contract.itemDescription,
                weight: contract.weight,
                contract_id: contractData.id // Link to the contract
            }));

            // Insert the luggage information
            const { data, error } = await supabase
                .from('contract_luggage_information')
                .insert(formattedData);

            if (error) {
                console.error('Error inserting luggage information:', error);
                return;
            }

            console.log('Data inserted successfully:', data);
            // You might want to show a success message to the user here
            // and possibly redirect them to another page

        } catch (error) {
            console.error('Error submitting form:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <Box sx={{ 
            minHeight: "100vh", 
            bgcolor: theme.palette.background.default, 
            color: theme.palette.text.primary, 
            p: 2 
        }}>
            {mounted && (
                <>
                    <Script
                        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`}
                        strategy="afterInteractive"
                        onLoad={() => {
                            console.log('Google Maps script loaded successfully');
                            setIsScriptLoaded(true);
                        }}
                        onError={(e) => {
                            console.error('Error loading Google Maps script:', e);
                            setMapError('Failed to load Google Maps');
                        }}
                    />
                    <Typography variant="h4" fontWeight="bold" color="primary.main" mb={2}>Booking</Typography>

                    <Box>
                        <Paper elevation={3} sx={{ 
                            maxWidth: 700, 
                            mx: "auto", 
                            mt: 4, 
                            p: 4, 
                            pt: 2, 
                            borderRadius: 3, 
                            backgroundColor: theme.palette.background.paper, 
                            position: "relative" 
                        }}>
                            <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Pickup Location</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Pickup Location</InputLabel>
                                    <Select
                                        value={pickupAddress.location}
                                        label="Pickup Location"
                                        onChange={(e) => handlePickupAddressChange("location", e.target.value)}
                                    >
                                        <MenuItem value="terminal3_bay10">Terminal 3, Bay 10</MenuItem>
                                        <MenuItem value="custom">Custom Location</MenuItem>
                                    </Select>
                                </FormControl>

                                {pickupAddress.location === "custom" && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                            <TextField
                                label="Address Line 1"
                                fullWidth
                                size="small"
                                value={pickupAddress.addressLine1}
                                onChange={(e) => handlePickupAddressChange("addressLine1", e.target.value)}
                            />
                                        </Grid>
                                        <Grid item xs={12}>
                            <TextField
                                label="Address Line 2"
                                fullWidth
                                size="small"
                                value={pickupAddress.addressLine2}
                                onChange={(e) => handlePickupAddressChange("addressLine2", e.target.value)}
                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Province"
                                        fullWidth
                                        size="small"
                                        value={pickupAddress.province}
                                        onChange={(e) => handlePickupAddressChange("province", e.target.value)}
                                    />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="City"
                                        fullWidth
                                        size="small"
                                        value={pickupAddress.city}
                                        onChange={(e) => handlePickupAddressChange("city", e.target.value)}
                                    />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Barangay"
                                        fullWidth
                                        size="small"
                                        value={pickupAddress.barangay}
                                        onChange={(e) => handlePickupAddressChange("barangay", e.target.value)}
                                    />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Postal Code"
                                        fullWidth
                                        size="small"
                                        value={pickupAddress.postalCode}
                                        onChange={(e) => handlePickupAddressChange("postalCode", e.target.value)}
                                    />
                                        </Grid>
                                    </Grid>
                                )}
                        </Box>
                    </Paper>

                        <Paper elevation={3} sx={{ 
                            maxWidth: 700, 
                            mx: "auto", 
                            mt: 3, 
                            p: 4, 
                            pt: 2, 
                            borderRadius: 3, 
                            backgroundColor: theme.palette.background.paper, 
                            position: "relative" 
                        }}>
                            <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Drop-off Location</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                                {isFormMounted && (
                                    <Box>
                                        <Autocomplete
                                            freeSolo
                                            filterOptions={(x) => x}
                                            options={placeOptions}
                                            getOptionLabel={(option) => option.description || ''}
                                            loading={placeLoading}
                                            inputValue={dropoffAddress.location}
                                            onInputChange={handleDropoffInputChange}
                                            onChange={handleDropoffSelect}
                                            renderInput={(params) => (
                            <TextField
                                                    {...params}
                                                    label="Drop-off Location"
                                fullWidth
                                size="small"
                                                    placeholder="Search for a location"
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {placeLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                        autoComplete: 'off',
                                                    }}
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                    />
                                </Box>
                                )}
                                {mounted && <MapComponent mapRef={mapRef} mapError={mapError} />}
                        </Box>
                    </Paper>

                    {contracts.map((contract, index) => (
                            <Paper key={index} elevation={3} sx={{ 
                                maxWidth: 700, 
                                mx: "auto", 
                                mt: 4, 
                                p: 4, 
                                pt: 2, 
                                borderRadius: 3, 
                                backgroundColor: theme.palette.background.paper, 
                                position: "relative" 
                            }}>
                                <IconButton 
                                    size="small" 
                                    onClick={() => deleteContract(index)} 
                                    sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.grey[600] }} 
                                    aria-label="delete form"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography variant="h6" fontWeight="bold" align="center" mb={3}>
                                    Delivery Information {index + 1}
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                <TextField 
                                    label="Case Number" 
                                    fullWidth 
                                    size="small" 
                                    value={contract.caseNumber} 
                                    onChange={(e) => handleInputChange(index, "caseNumber", e.target.value)} 
                                />
                                        </Grid>
                                        <Grid item xs={12}>
                                <TextField 
                                    label="Name" 
                                    fullWidth 
                                    size="small" 
                                    value={contract.name} 
                                    onChange={(e) => handleInputChange(index, "name", e.target.value)} 
                                />
                                        </Grid>
                                        <Grid item xs={12}>
                                <TextField 
                                    label="Item Description" 
                                    fullWidth 
                                    size="small" 
                                    value={contract.itemDescription} 
                                    onChange={(e) => handleInputChange(index, "itemDescription", e.target.value)} 
                                />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Contact Number" 
                                            fullWidth 
                                            size="small" 
                                            value={contract.contact} 
                                            onChange={(e) => handleInputChange(index, "contact", e.target.value)} 
                                        />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Weight (kg)" 
                                            fullWidth 
                                            size="small" 
                                            value={contract.weight} 
                                            onChange={(e) => handleInputChange(index, "weight", e.target.value)} 
                                        />
                                        </Grid>
                                    </Grid>
                            </Box>

                                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        sx={{ bgcolor: "#4a4a4a", color: "#fff", "&:hover": { bgcolor: "#333" } }} 
                                        onClick={() => clearSingleContract(index)}
                                    >
                                        Clear Contract
                                    </Button>
                            </Box>
                        </Paper>
                    ))}

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                        <Button variant="outlined" onClick={addContract}>Add Another Form</Button>
                        <Button variant="contained" onClick={handleSubmit}>Send Contract</Button>
                    </Box>
                </Box>

                    <Box sx={{ textAlign: "center", mt: 6 }}>
                        <Typography variant="h6" fontWeight="bold">Partnered with:</Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}>
                    <Image src="/brand-3.png" alt="AirAsia" width={60} height={60} />
                </Box>
            </Box>
                </>
            )}
        </Box>
    );
}