"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Tabs, Tab } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';

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
    const [activeTab, setActiveTab] = useState(0); // Set default to Contract List tab (index 0)
    const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
    const [contracts, setContracts] = useState([{
        name: "",
        caseNumber: "",
        itemDescription: "",
        contact: "",
        weight: "",
        quantity: ""
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

    // Handle Google Maps script loading only when Booking tab is active
    useEffect(() => {
        if (mounted && !isScriptLoaded && activeTab === 1) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('Google Maps script loaded successfully');
                setIsScriptLoaded(true);
                setIsGoogleMapsReady(true);
            };
            
            script.onerror = (e) => {
                console.error('Error loading Google Maps script:', e);
                setMapError('Failed to load Google Maps');
            };

            document.head.appendChild(script);

            return () => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        }
    }, [mounted, activeTab]);

    // Initialize map when Booking tab is active and script is loaded
    useEffect(() => {
        if (mounted && isGoogleMapsReady && !map && activeTab === 1) {
            const timer = setTimeout(() => {
                initMap();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [mounted, isGoogleMapsReady, activeTab]);

    // Initialize AutocompleteService and PlacesService when map is ready and Booking tab is active
    useEffect(() => {
        if (window.google && map && activeTab === 1) {
            try {
                autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                placesServiceRef.current = new window.google.maps.places.PlacesService(map);
            } catch (error) {
                console.error('Error initializing Google services:', error);
            }
        }
    }, [map, activeTab]);

    // Cleanup map when switching away from Booking tab
    useEffect(() => {
        if (activeTab !== 1 && map) {
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
            setMap(null);
        }
    }, [activeTab]);

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
            weight: "",
            quantity: ""
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
            weight: "",
            quantity: ""
        }]);
    };

    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleSubmit = async () => {
        try {
            // Get the current user's ID
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('Error getting user:', userError);
                return;
            }

            // Calculate total luggage quantity
            const totalLuggageQuantity = contracts.reduce((sum, contract) => sum + Number(contract.quantity || 0), 0);

            // Log the coordinates for debugging
            console.log('Drop-off coordinates:', {
                lat: dropoffAddress.lat,
                lng: dropoffAddress.lng
            });

            // First, insert into contract table
            const contractData = {
                luggage_quantity: totalLuggageQuantity,
                airline_id: user.id,
                pickup_location: pickupAddress.location,
                drop_off_location: dropoffAddress.location,
                drop_off_location_geo: {
                    type: 'Point',
                    coordinates: [dropoffAddress.lng, dropoffAddress.lat]
                }
            };

            console.log('Contract data to be inserted:', contractData);

            const { data: insertedContract, error: contractError } = await supabase
                .from('contract')
                .insert(contractData)
                .select()
                .single();

            if (contractError) {
                console.error('Error inserting contract:', contractError);
                return;
            }

            console.log('Contract inserted successfully:', insertedContract);

            // Transform the contracts data to match the database schema
            const formattedData = contracts.map(contract => ({
                case_number: contract.caseNumber,
                luggage_owner: contract.name,
                contact_number: contract.contact,
                item_description: contract.itemDescription,
                weight: contract.weight,
                quantity: contract.quantity,
                contract_id: insertedContract.id // Link to the contract
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
            setSnackbarOpen(true);

        } catch (error) {
            console.error('Error submitting form:', error);
            // You might want to show an error message to the user here
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTabs-indicator': {
                                    backgroundColor: theme.palette.primary.main,
                                },
                                '& .MuiTab-root': {
                                    color: theme.palette.text.primary,
                                    '&.Mui-selected': {
                                        color: theme.palette.primary.main,
                                    },
                                },
                            }}
                        >
                            <Tab label="Contract List" />
                            <Tab label="Booking" />
                        </Tabs>
                    </Box>

                    {activeTab === 0 && (
                        <Box>
                            {/* Contract List content will go here */}
                            <Typography variant="h6" align="center">Contract List</Typography>
                        </Box>
                    )}

                    {activeTab === 1 && (
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
                                    <FormControl fullWidth size="small" required>
                                        <InputLabel>Pickup Location</InputLabel>
                                        <Select
                                            value={pickupAddress.location}
                                            label="Pickup Location"
                                            onChange={(e) => handlePickupAddressChange("location", e.target.value)}
                                            required
                                        >
                                            {[...Array(12)].map((_, i) => (
                                                <MenuItem key={i+1} value={`Terminal 3, Bay ${i+1}`}>{`Terminal 3, Bay ${i+1}`}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
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
                                                        required
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
                                        <TextField
                                            label="Case Number"
                                            fullWidth
                                            size="small"
                                            value={contract.caseNumber}
                                            onChange={(e) => handleInputChange(index, "caseNumber", e.target.value)}
                                            required
                                        />
                                        <TextField
                                            label="Name"
                                            fullWidth
                                            size="small"
                                            value={contract.name}
                                            onChange={(e) => handleInputChange(index, "name", e.target.value)}
                                            required
                                        />
                                        <TextField
                                            label="Item Description"
                                            fullWidth
                                            size="small"
                                            value={contract.itemDescription}
                                            onChange={(e) => handleInputChange(index, "itemDescription", e.target.value)}
                                            required
                                        />
                                        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                            <TextField
                                                label="Contact Number"
                                                fullWidth
                                                size="small"
                                                value={contract.contact}
                                                onChange={(e) => handleInputChange(index, "contact", e.target.value)}
                                                required
                                            />
                                            <TextField
                                                label="Weight (kg)"
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={contract.weight}
                                                onChange={(e) => handleInputChange(index, "weight", e.target.value)}
                                                required
                                            />
                                            <TextField
                                                label="Luggage Quantity"
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={contract.quantity}
                                                onChange={(e) => handleInputChange(index, "quantity", e.target.value)}
                                                required
                                            />
                                        </Box>
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

                            <Box sx={{ textAlign: "center", mt: 6 }}>
                                <Typography variant="h6" fontWeight="bold">Partnered with:</Typography>
                                <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}>
                                    <Image src="/brand-3.png" alt="AirAsia" width={60} height={60} />
                                </Box>
                            </Box>
                        </Box>
                    )}

                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={4000}
                        onClose={() => setSnackbarOpen(false)}
                        message="Booking Complete"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    />
                </>
            )}
        </Box>
    );
}