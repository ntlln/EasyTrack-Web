"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Autocomplete, CircularProgress, Snackbar, Divider, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';

// Add dateOptions constant
const dateOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
];

// Add filterByDate helper function
function filterByDate(contracts, filter) {
  if (filter === 'all') return contracts;
  const now = new Date();
  return contracts.filter(contract => {
    const createdAt = contract.created_at ? new Date(contract.created_at) : null;
    if (!createdAt) return false;
    switch (filter) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return createdAt.toDateString() === yesterday.toDateString();
      }
      case 'thisWeek': {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfWeek && createdAt <= lastDayOfWeek;
      }
      case 'lastWeek': {
        const firstDayOfThisWeek = new Date(now);
        firstDayOfThisWeek.setDate(now.getDate() - now.getDay());
        firstDayOfThisWeek.setHours(0,0,0,0);
        const firstDayOfLastWeek = new Date(firstDayOfThisWeek);
        firstDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 7);
        const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
        lastDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() + 6);
        lastDayOfLastWeek.setHours(23,59,59,999);
        return createdAt >= firstDayOfLastWeek && createdAt <= lastDayOfLastWeek;
      }
      case 'thisMonth':
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      case 'lastMonth': {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        return createdAt.getMonth() === lastMonth.getMonth() && createdAt.getFullYear() === lastMonth.getFullYear();
      }
      case 'thisYear':
        return createdAt.getFullYear() === now.getFullYear();
      case 'lastYear':
        return createdAt.getFullYear() === now.getFullYear() - 1;
      default:
        return true;
    }
  });
}

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
    const [contract, setContract] = useState({ address: "", contact: "" });
    const [luggageForms, setLuggageForms] = useState([{ name: "", caseNumber: "", flightNo: "", itemDescription: "", weight: "", quantity: "" }]);
    const [pickupAddress, setPickupAddress] = useState({ location: "", addressLine1: "", addressLine2: "", province: "", city: "", barangay: "", postalCode: "" });
    const [dropoffAddress, setDropoffAddress] = useState({ location: null, lat: null, lng: null });
    const [placeOptions, setPlaceOptions] = useState([]); const [placeLoading, setPlaceLoading] = useState(false); const autocompleteServiceRef = useRef(null); const placesServiceRef = useRef(null);
    const [contractList, setContractList] = useState([]); const [contractListLoading, setContractListLoading] = useState(false); const [contractListError, setContractListError] = useState(null); const [expandedContracts, setExpandedContracts] = useState([]);
    const [pricingData, setPricingData] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Mount
    useEffect(() => { setMounted(true); setIsFormMounted(true); }, []);

    // Google Maps script
    useEffect(() => { if (mounted && !isScriptLoaded && activeTab === 1) { const script = document.createElement('script'); script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`; script.async = true; script.defer = true; script.onload = () => { setIsScriptLoaded(true); setIsGoogleMapsReady(true); }; script.onerror = (e) => { setMapError('Failed to load Google Maps'); }; document.head.appendChild(script); return () => { if (document.head.contains(script)) { document.head.removeChild(script); } }; } }, [mounted, activeTab]);

    // Map init
    useEffect(() => { if (mounted && isGoogleMapsReady && !map && activeTab === 1) { const timer = setTimeout(() => { initMap(); }, 100); return () => clearTimeout(timer); } }, [mounted, isGoogleMapsReady, activeTab]);
    useEffect(() => { if (window.google && map && activeTab === 1) { try { autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService(); placesServiceRef.current = new window.google.maps.places.PlacesService(map); } catch (error) { } } }, [map, activeTab]);
    useEffect(() => { if (activeTab !== 1 && map) { if (markerRef.current) { markerRef.current.map = null; markerRef.current = null; } setMap(null); } }, [activeTab]);

    // Map functions
    const initMap = () => { 
        if (!window.google || !mapRef.current) return; 
        try { 
            // Define Luzon bounds
            const luzonBounds = new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(12.5, 119.5), // Southwest corner
                new window.google.maps.LatLng(18.5, 122.5)  // Northeast corner
            );

            // NAIA Terminal 3 coordinates
            const defaultLocation = { lat: 14.5091, lng: 121.0120 }; // NAIA Terminal 3
            const mapOptions = { 
                center: defaultLocation, 
                zoom: 15, // Zoomed out a bit to show more of the surrounding area
                mapTypeControl: false, 
                streetViewControl: false, 
                fullscreenControl: false, 
                mapTypeId: 'roadmap', 
                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID,
                restriction: {
                    latLngBounds: luzonBounds,
                    strictBounds: false // Allow panning outside bounds
                },
                minZoom: 5, // Allow zooming out more
                maxZoom: 18 // Prevent zooming in too close
            }; 

            const newMap = new window.google.maps.Map(mapRef.current, mapOptions); 
            setMap(newMap); 

            const markerView = new window.google.maps.marker.PinElement({ 
                scale: 1, 
                background: theme.palette.primary.main, 
                borderColor: theme.palette.primary.dark, 
                glyphColor: '#FFFFFF' 
            }); 

            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
                map: newMap, 
                position: defaultLocation, 
                title: 'NAIA Terminal 3, Bay 10', 
                content: markerView.element, 
                gmpDraggable: true, 
                collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
            }); 

            setDropoffAddress({ 
                location: 'NAIA Terminal 3, Bay 10, Pasay, Metro Manila', 
                lat: defaultLocation.lat, 
                lng: defaultLocation.lng 
            }); 

            let isDragging = false; 
            newMap.addListener('dragstart', () => { isDragging = true; }); 
            newMap.addListener('dragend', () => { 
                isDragging = false; 
                const center = newMap.getCenter(); 
                if (markerRef.current) { 
                    markerRef.current.position = center; 
                    updateAddressFromPosition(center); 
                } 
            }); 

            newMap.addListener('zoom_changed', () => { 
                if (markerRef.current) { 
                    const markerPosition = markerRef.current.position; 
                    newMap.panTo(markerPosition); 
                } 
            }); 

            newMap.addListener('click', (event) => { 
                const lat = event.latLng.lat(); 
                const lng = event.latLng.lng(); 
                updateMarkerAndAddress({ lat, lng }); 
            }); 

            markerRef.current.addListener('dragend', () => { 
                const position = markerRef.current.position; 
                updateAddressFromPosition(position); 
            }); 
        } catch (error) { 
            setMapError(error.message); 
        } 
    };
    const updateAddressFromPosition = (position) => { const lat = position.lat(); const lng = position.lng(); const geocoder = new window.google.maps.Geocoder(); geocoder.geocode({ location: { lat, lng } }, (results, status) => { if (status === 'OK' && results[0]) { setDropoffAddress(prev => ({ ...prev, location: results[0].formatted_address, lat: lat, lng: lng })); } }); };
    const updateMarkerAndAddress = (position) => { if (!window.google || !map) return; const markerView = new window.google.maps.marker.PinElement({ scale: 1, background: theme.palette.primary.main, borderColor: theme.palette.primary.dark, glyphColor: '#FFFFFF' }); if (markerRef.current) { markerRef.current.position = position; } else { markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ map: map, position: position, content: markerView.element, gmpDraggable: true, collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY }); } map.panTo(position); const geocoder = new window.google.maps.Geocoder(); geocoder.geocode({ location: position }, (results, status) => { if (status === 'OK' && results[0]) { const formattedAddress = results[0].formatted_address; setDropoffAddress(prev => ({ ...prev, location: formattedAddress, lat: position.lat, lng: position.lng })); } }); };
    const updateMapLocation = useCallback((position, address) => { 
        if (!window.google || !map) return; 
        const markerView = new window.google.maps.marker.PinElement({ 
            scale: 1, 
            background: theme.palette.primary.main, 
            borderColor: theme.palette.primary.dark, 
            glyphColor: '#FFFFFF' 
        }); 

        if (markerRef.current) { 
            markerRef.current.map = null; 
        } 

        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({ 
            map: map, 
            position: position, 
            title: address, 
            content: markerView.element, 
            gmpDraggable: true, 
            collisionBehavior: window.google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY 
        }); 

        map.panTo(position);
        
        // Set zoom level based on whether it's a pickup location
        const isPickupLocation = address.toLowerCase().includes('terminal');
        map.setZoom(isPickupLocation ? 14 : 15); // Zoom out more for terminal locations

        markerRef.current.addListener('dragend', () => { 
            const newPosition = markerRef.current.position; 
            const lat = newPosition.lat; 
            const lng = newPosition.lng; 
            const geocoder = new window.google.maps.Geocoder(); 
            geocoder.geocode({ location: { lat, lng }, componentRestrictions: { country: 'ph' } }, (results, status) => { 
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

        setTimeout(() => { 
            window.google.maps.event.trigger(map, 'resize'); 
            map.setCenter(position); 
        }, 100); 
    }, [map]);

    // Google Places
    const fetchPlaceSuggestions = (input) => { 
        if (!input || !autocompleteServiceRef.current) { 
            setPlaceOptions([]); 
            return; 
        } 
        setPlaceLoading(true); 
        autocompleteServiceRef.current.getPlacePredictions({ 
            input, 
            types: ['geocode', 'establishment'], 
            componentRestrictions: { country: 'ph' },
            bounds: new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(12.5, 119.5), // Southwest corner
                new window.google.maps.LatLng(18.5, 122.5)  // Northeast corner
            ),
            strictBounds: false // Allow suggestions outside bounds
        }, (predictions, status) => { 
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) { 
                setPlaceOptions(predictions); 
            } else { 
                setPlaceOptions([]); 
            } 
            setPlaceLoading(false); 
        }); 
    };
    const handleDropoffInputChange = (event, value) => { setDropoffAddress(prev => ({ ...prev, location: value })); fetchPlaceSuggestions(value); };
    const handleDropoffSelect = (event, value) => { 
        if (!value || !placesServiceRef.current) return; 
        setDropoffAddress(prev => ({ ...prev, location: value.description })); 
        placesServiceRef.current.getDetails({ placeId: value.place_id }, (data, status) => { 
            if (status === window.google.maps.places.PlacesServiceStatus.OK && data && data.geometry) { 
                const loc = data.geometry.location; 
                const newPosition = { lat: loc.lat(), lng: loc.lng() }; 
                
                // Check if the location is within Luzon bounds
                if (!isWithinLuzonBounds(newPosition.lat, newPosition.lng)) {
                    setSnackbarMessage('This place is not covered by our service');
                    setSnackbarOpen(true);
                    return;
                }

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

    // Contract form handlers
    const handlePickupAddressChange = (field, value) => { setPickupAddress(prev => ({ ...prev, [field]: value })); };
    const handleDropoffAddressChange = (field, value) => { setDropoffAddress(prev => ({ ...prev, [field]: value })); };
    const handleInputChange = (field, value) => {
        if (field === 'contact') {
            // Handle backspace and empty values
            if (!value) {
                setContract(prev => ({ ...prev, [field]: '' }));
            } else {
                // Only format if we have input
                const formatted = formatPhoneNumber(value);
                setContract(prev => ({ ...prev, [field]: formatted }));
            }
        } else {
            setContract(prev => ({ ...prev, [field]: value }));
        }
    };
    const handleImageChange = (file) => { setContract(prev => ({ ...prev, image: file })); };

    // Generate tracking ID with format 'YYYYMMDDMKTPxxxx'
    const generateTrackingID = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const randomPart = [...Array(4)].map(() => Math.random().toString(36)[2].toUpperCase()).join('')
        return `${year}${month}${day}MKTP${randomPart}`
    }

    // Generate luggage tracking ID with format 'YYYYMMDDTRKLGxxxx'
    const generateLuggageTrackingID = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const randomPart = [...Array(4)].map(() => Math.random().toString(36)[2].toUpperCase()).join('')
        return `${year}${month}${day}TRKLG${randomPart}`
    }

    // Fetch pricing data
    useEffect(() => {
        const fetchPricingData = async () => {
            try {
                const { data: pricing, error } = await supabase
                    .from('pricing')
                    .select('city, price');
                
                if (error) {
                    console.error('Error fetching pricing data:', error);
                    return;
                }
                
                if (!pricing || pricing.length === 0) {
                    console.warn('No pricing data found in the database');
                    return;
                }
                
                const pricingMap = {};
                pricing.forEach(item => {
                    if (!item.city || item.price === null || item.price === undefined) {
                        console.warn('Invalid pricing data:', item);
                        return;
                    }
                    pricingMap[item.city] = Number(item.price);
                });
                console.log('Pricing data loaded:', pricingMap);
                setPricingData(pricingMap);
            } catch (error) {
                console.error('Error in fetchPricingData:', error);
            }
        };
        
        fetchPricingData();
    }, []);

    // Function to get city from coordinates
    const getCityFromCoordinates = async (lat, lng) => {
        if (!window.google) {
            console.error('Google Maps not loaded');
            return null;
        }
        
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode(
                    { location: { lat, lng } },
                    (results, status) => {
                        if (status === 'OK') resolve(results);
                        else reject(new Error(`Geocoding failed: ${status}`));
                    }
                );
            });

            if (!response || !response[0]) {
                console.warn('No results found for coordinates:', { lat, lng });
                return null;
            }

            // Log the full address components for debugging
            console.log('Full address components:', response[0].address_components);

            // First try to find the city (locality)
            let city = response[0].address_components.find(
                component => component.types.includes('locality')
            )?.long_name;

            // If no city found, try administrative_area_level_1 (province)
            if (!city) {
                city = response[0].address_components.find(
                    component => component.types.includes('administrative_area_level_1')
                )?.long_name;
            }

            if (!city) {
                console.warn('No city/province found in address components:', response[0].address_components);
                return null;
            }

            // Remove "City" suffix if present
            city = city.replace(/\s*City\s*$/i, '').trim();
            console.log('Found city/province:', city);
            return city;
        } catch (error) {
            console.error('Error getting city from coordinates:', error);
            return null;
        }
    };

    // Add new function to handle luggage form changes
    const handleLuggageFormChange = (index, field, value) => {
        setLuggageForms(prev => {
            const newForms = [...prev];
            newForms[index] = { ...newForms[index], [field]: value };
            return newForms;
        });
    };

    // Add function to add new luggage form
    const handleAddLuggageForm = () => {
        setLuggageForms(prev => [...prev, { name: "", caseNumber: "", flightNo: "", itemDescription: "", weight: "", quantity: "" }]);
    };

    // Add function to remove luggage form
    const handleRemoveLuggageForm = (index) => {
        setLuggageForms(prev => prev.filter((_, i) => i !== index));
    };

    // Modify handleSubmit to handle multiple luggage forms
    const handleSubmit = async () => { 
        try { 
            const { data: { user }, error: userError } = await supabase.auth.getUser(); 
            if (userError) {
                console.error('Error getting user:', userError);
                return;
            }

            // Generate tracking IDs for each luggage form
            const contractTrackingIDs = luggageForms.map(() => generateTrackingID());
            const luggageTrackingIDs = luggageForms.map(() => generateLuggageTrackingID());

            // Step 1: Determine the city from coordinates
            let city = null;
            if (dropoffAddress.lat && dropoffAddress.lng) {
                city = await getCityFromCoordinates(dropoffAddress.lat, dropoffAddress.lng);
                console.log('Determined city:', city);
            } else {
                console.warn('No coordinates available for city determination');
            }

            // Step 2: Fetch price for the determined city
            let deliveryCharge = null;
            if (city) {
                // Remove "City" suffix if present for database lookup
                const cleanCity = city.replace(/\s*City\s*$/i, '').trim();
                console.log('Clean city for lookup:', cleanCity);
                
                // Log all available cities in pricing data
                console.log('Available cities in pricing data:', Object.keys(pricingData));
                
                // Try exact match first
                deliveryCharge = pricingData[cleanCity];
                
                // If no exact match, try case-insensitive match
                if (deliveryCharge === undefined) {
                    const cityLower = cleanCity.toLowerCase();
                    const matchingCity = Object.keys(pricingData).find(
                        pricingCity => pricingCity.toLowerCase() === cityLower
                    );
                    if (matchingCity) {
                        deliveryCharge = pricingData[matchingCity];
                        console.log('Found case-insensitive match:', matchingCity);
                    }
                }

                // If still no match, try partial match
                if (deliveryCharge === undefined) {
                    const cityLower = cleanCity.toLowerCase();
                    const matchingCity = Object.keys(pricingData).find(
                        pricingCity => pricingCity.toLowerCase().includes(cityLower) || 
                                     cityLower.includes(pricingCity.toLowerCase())
                    );
                    if (matchingCity) {
                        deliveryCharge = pricingData[matchingCity];
                        console.log('Found partial match:', matchingCity);
                    }
                }

                console.log('City lookup:', {
                    original: city,
                    clean: cleanCity,
                    price: deliveryCharge,
                    availableCities: Object.keys(pricingData),
                    pricingData: pricingData
                });
            } else {
                console.warn('Could not determine city for price lookup');
            }

            // Helper to split a full name into first/middle/last
            const splitName = (fullName) => {
                if (!fullName) return { first: null, middle: null, last: null };
                const parts = fullName.trim().split(/\s+/);
                if (parts.length === 1) return { first: parts[0], middle: null, last: null };
                if (parts.length === 2) return { first: parts[0], middle: null, last: parts[1] };
                return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
            };

            // Step 3: Create contracts for each form (no more separate luggage table)
            for (let i = 0; i < luggageForms.length; i++) {
                const form = luggageForms[i];
                const names = splitName(form.name);
                
                // Prepare contract data for this luggage
                const contractData = { 
                    id: contractTrackingIDs[i],
                    airline_id: user.id,
                    // Pickup and drop-off
                    pickup_location: pickupAddress.location, 
                    drop_off_location: dropoffAddress.location, 
                    drop_off_location_geo: { type: 'Point', coordinates: [dropoffAddress.lng, dropoffAddress.lat] },
                    // Owner and luggage details
                    owner_first_name: names.first,
                    owner_middle_initial: names.middle,
                    owner_last_name: names.last,
                    owner_contact: contract.contact,
                    luggage_description: form.itemDescription,
                    luggage_weight: form.weight,
                    luggage_quantity: form.quantity,
                    case_number: form.caseNumber,
                    flight_number: form.flightNo,
                    // Delivery address and pricing
                    delivery_address: contract.address,
                    delivery_charge: deliveryCharge
                }; 

                console.log('Submitting contract data:', contractData);

                // Insert contract data
                const { data: insertedContract, error: contractError } = await supabase
                    .from('contracts')
                    .insert(contractData)
                    .select()
                    .single(); 

                if (contractError) {
                    console.error('Error inserting contract:', contractError);
                    return;
                }
            }

            setSnackbarOpen(true);
            // Reset form
            setContract({ address: "", contact: "" }); // Only keep address and contact in the main contract
            setLuggageForms([{ name: "", caseNumber: "", flightNo: "", itemDescription: "", weight: "", quantity: "" }]);
            setPickupAddress({ location: "", addressLine1: "", addressLine2: "", province: "", city: "", barangay: "", postalCode: "" });
            setDropoffAddress({ location: null, lat: null, lng: null });
            // Switch to contract list tab and refresh
            setActiveTab(0);
            router.refresh();
        } catch (error) { 
            console.error('Error submitting contract:', error);
        } 
    };

    // Tab change
    const handleTabChange = (event, newValue) => { setActiveTab(newValue); };

    // Fetch contract list
    useEffect(() => {
        const fetchContracts = async () => {
            setContractListLoading(true);
            setContractListError(null);
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!user) {
                    setContractList([]);
                    return;
                }
                const { data: contracts, error: contractError } = await supabase
                    .from('contracts')
                    .select(`
                        id,
                        created_at,
                        accepted_at,
                        pickup_at,
                        delivered_at,
                        cancelled_at,
                        pickup_location,
                        pickup_location_geo,
                        drop_off_location,
                        drop_off_location_geo,
                        contract_status_id,
                        contract_status(status_name),
                        airline_id,
                        delivery_id,
                        delivery_charge,
                        owner_first_name,
                        owner_middle_initial,
                        owner_last_name,
                        owner_contact,
                        luggage_description,
                        luggage_weight,
                        luggage_quantity,
                        case_number,
                        flight_number,
                        delivery_address,
                        airline:airline_id (*),
                        delivery:delivery_id (*)
                    `)
                    .eq('airline_id', user.id)
                    .order('created_at', { ascending: false });

                if (contractError) throw contractError;

                if (!contracts || contracts.length === 0) {
                    setContractList([]);
                    return;
                }

                setContractList(contracts);
            } catch (err) {
                setContractListError(err.message || 'Failed to fetch contracts');
            } finally {
                setContractListLoading(false);
            }
        };

        if (activeTab === 0) {
            fetchContracts();
        }
    }, [activeTab]);

    // Expand/collapse
    const handleExpandClick = (contractId) => { setExpandedContracts((prev) => prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId]); };

    const handleTrackContract = (contractId) => {
        router.push(`/contractor/luggage-tracking?contractId=${contractId}`);
    };

    // Filter contracts based on status and date
    const filteredContracts = contractList.filter(contract => {
        // First apply status filter
        if (statusFilter !== 'all') {
            const status = contract.contract_status?.status_name?.toLowerCase();
            switch (statusFilter) {
                case 'available':
                    if (status !== 'available for pickup') return false;
                    break;
                case 'accepted':
                    if (status !== 'accepted - awaiting pickup') return false;
                    break;
                case 'transit':
                    if (status !== 'in transit') return false;
                    break;
                case 'delivered':
                    if (status !== 'delivered') return false;
                    break;
                case 'failed':
                    if (status !== 'delivery failed') return false;
                    break;
                case 'cancelled':
                    if (status !== 'cancelled') return false;
                    break;
                default:
                    return false;
            }
        }
        return true;
    });

    // Apply date filter
    const dateFilteredContracts = filterByDate(filteredContracts, dateFilter);

    // Get paginated contracts
    const getPaginatedContracts = () => {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return dateFilteredContracts.slice(startIndex, endIndex);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'available', label: 'Available' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'transit', label: 'Transit' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    // Function to check if coordinates are within Luzon bounds
    const isWithinLuzonBounds = (lat, lng) => {
        return lat >= 12.5 && lat <= 18.5 && lng >= 119.5 && lng <= 122.5;
    };

    // Add phone number formatting function
    const formatPhoneNumber = (value) => {
        // If empty, return empty string
        if (!value) return '';
        
        // Remove all non-digit characters
        const phoneNumber = value.replace(/\D/g, '');
        
        // Only allow up to 10 digits after the country code
        let trimmedNumber = phoneNumber;
        if (trimmedNumber.startsWith('63')) {
            trimmedNumber = trimmedNumber.slice(2);
        } else if (trimmedNumber.startsWith('0')) {
            trimmedNumber = trimmedNumber.slice(1);
        }
        trimmedNumber = trimmedNumber.slice(0, 10);
        
        // Format as +63 XXX XXX XXXX
        if (trimmedNumber.length === 0) return '+63 ';
        if (trimmedNumber.length <= 3) return `+63 ${trimmedNumber}`;
        if (trimmedNumber.length <= 6) return `+63 ${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3)}`;
        return `+63 ${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3, 6)} ${trimmedNumber.slice(6)}`;
    };

    // Add onFocus handler for phone number
    const handlePhoneFocus = () => {
        if (!contract.contact) {
            setContract(prev => ({ ...prev, contact: '+63' }));
        }
    };

    const handleCancelClick = (contractId) => {
        setSelectedContractId(contractId);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedContractId) return;
        setCancelling(true);
        try {
            const { error } = await supabase
                .from('contracts')
                .update({ contract_status_id: 2 })
                .eq('id', selectedContractId);

            if (error) throw error;

            setSnackbarMessage('Contract cancelled successfully');
            setSnackbarOpen(true);

            // Refresh contract list in state
            setContractList((prev) =>
                prev.map((c) =>
                    c.id === selectedContractId
                        ? { ...c, contract_status_id: 2, contract_status: { status_name: 'Cancelled' } }
                        : c
                )
            );
        } catch (err) {
            setSnackbarMessage(err.message || 'Failed to cancel contract');
            setSnackbarOpen(true);
        } finally {
            setCancelling(false);
            setCancelDialogOpen(false);
            setSelectedContractId(null);
        }
    };

    const handleCancelClose = () => {
        setCancelDialogOpen(false);
        setSelectedContractId(null);
    };

    // Render
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 2 }}>
            {mounted && (<>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main }, '& .MuiTab-root': { color: theme.palette.text.primary, '&.Mui-selected': { color: theme.palette.primary.main } } }}>
                        <Tab label="Contract List" /><Tab label="Booking" />
                    </Tabs>
                </Box>
                {activeTab === 0 && (
                    <Box>
                        {contractListLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
                        {contractListError && (<Typography color="error" align="center">{contractListError}</Typography>)}
                        <Box sx={{ maxWidth: '800px', mx: 'auto', width: '100%', mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, p: 1 }}>
                                <Box sx={{ display: 'flex', gap: 1, whiteSpace: 'nowrap' }}>
                                    {filterOptions.map((option) => (
                                        <Button
                                            key={option.value}
                                            variant={statusFilter === option.value ? "contained" : "outlined"}
                                            onClick={() => setStatusFilter(option.value)}
                                            sx={{
                                                borderRadius: '20px',
                                                textTransform: 'none',
                                                px: 2,
                                                whiteSpace: 'nowrap',
                                                minWidth: '100px',
                                                borderColor: statusFilter === option.value ? 'primary.main' : 'divider',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    bgcolor: statusFilter === option.value ? 'primary.main' : 'transparent'
                                                }
                                            }}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </Box>
                                <Divider orientation="vertical" flexItem />
                                <FormControl size="small" sx={{ minWidth: 180, flexShrink: 0 }}>
                                    <InputLabel>Filter by Date</InputLabel>
                                    <Select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        label="Filter by Date"
                                        sx={{
                                            borderRadius: '20px',
                                            '& .MuiSelect-select': {
                                                textTransform: 'none'
                                            }
                                        }}
                                    >
                                        {dateOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                        {!contractListLoading && !contractListError && contractList.length === 0 && (<Typography align="center" sx={{ mb: 4 }}>No contracts found</Typography>)}
                        {mounted && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '800px', mx: 'auto', width: '100%' }}>
                                {getPaginatedContracts().map((contract, idx) => (
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
                                                    {contract.city && (
                                                        <Typography variant="body2">
                                                            <b>City:</b> <span>{contract.city}</span>
                                                        </Typography>
                                                    )}
                                                    {contract.price !== null && (
                                                        <Typography variant="body2">
                                                            <b>Price:</b> <span>₱{Number(contract.delivery_charge).toLocaleString()}</span>
                                                        </Typography>
                                                    )}
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
                                                <Button
                                                    variant="contained"
                                                    startIcon={<LocationOnIcon />}
                                                    onClick={() => handleTrackContract(contract.id)}
                                                    sx={{ mb: 1, minWidth: '120px' }}
                                                    disabled={contract.contract_status?.status_name?.toLowerCase() === 'cancelled'}
                                                >
                                                    Track
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleCancelClick(contract.id)}
                                                    sx={{ mb: 1, minWidth: '120px' }}
                                                    disabled={contract.contract_status?.status_name?.toLowerCase() === 'cancelled'}
                                                >
                                                    Cancel
                                                </Button>
                                                <IconButton
                                                    onClick={() => handleExpandClick(contract.id)}
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
                                                        mt: 3
                                                    }}
                                                >
                                                    <ExpandMoreIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Collapse in={expandedContracts.includes(contract.id)} timeout="auto" unmountOnExit>
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
                                                {!contract.luggage_description && !contract.case_number && !contract.flight_number && (
                                                    <Typography variant="body2">
                                                        No luggage info.
                                                    </Typography>
                                                )}
                                                {!!(contract.luggage_description || contract.case_number || contract.flight_number) && (
                                                    <Box sx={{ mb: 2, pl: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                                            Luggage
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Name: <span>{`${contract.owner_first_name || ''}${contract.owner_middle_initial ? ' ' + contract.owner_middle_initial : ''}${contract.owner_last_name ? ' ' + contract.owner_last_name : ''}`.trim() || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Case Number: <span>{contract.case_number || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Contact Number: <span>{contract.owner_contact || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Address: <span>{contract.delivery_address || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Weight: <span>{contract.luggage_weight ? `${contract.luggage_weight} kg` : 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Quantity: <span>{contract.luggage_quantity || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Description: <span>{contract.luggage_description || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Flight Number: <span>{contract.flight_number || 'N/A'}</span>
                                                        </Typography>
                                                    </Box>
                                                )}
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
                                ))}
                            </Box>
                        )}
                        {/* Add pagination controls */}
                        {!contractListLoading && !contractListError && dateFilteredContracts.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={dateFilteredContracts.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Rows per page:"
                                />
                            </Box>
                        )}
                    </Box>
                )}
                {activeTab === 1 && (<Box> {/* Booking Form */}
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Pickup Location</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Pickup Location</InputLabel>
                                <Select 
                                    value={pickupAddress.location || ""} 
                                    label="Pickup Location" 
                                    onChange={(e) => handlePickupAddressChange("location", e.target.value)} 
                                    required
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <MenuItem key={`terminal-${i + 1}`} value={`Terminal 3, Bay ${i + 1}`}>
                                            {`Terminal 3, Bay ${i + 1}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 3, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Drop-off Location</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            {isFormMounted && (
                                <Box>
                                    <Autocomplete
                                        freeSolo
                                        filterOptions={(x) => x}
                                        options={placeOptions || []}
                                        getOptionLabel={(option) => {
                                            if (typeof option === 'string') return option;
                                            return option.description || '';
                                        }}
                                        loading={placeLoading}
                                        inputValue={dropoffAddress.location || ''}
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
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <TextField 
                                label="Address" 
                                fullWidth 
                                size="small" 
                                value={contract.address} 
                                onChange={(e) => handleInputChange("address", e.target.value.slice(0, 200))} 
                                required 
                                inputProps={{ maxLength: 200 }}
                                InputProps={{ 
                                    endAdornment: contract.address ? (
                                        <IconButton size="small" onClick={() => handleInputChange("address", "")} edge="end">
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    ) : null, 
                                }} 
                            />
                        </Box>
                    </Paper>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 3, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Luggage Information</Typography>
                        {luggageForms.map((form, index) => (
                            <Box key={index} sx={{ mb: 4, position: 'relative' }}>
                                {index > 0 && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveLuggageForm(index)}
                                        sx={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                            color: 'error.main'
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                )}
                                <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
                                    Luggage {index + 1}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <TextField 
                                        label="Name" 
                                        fullWidth 
                                        size="small" 
                                        value={form.name} 
                                        onChange={(e) => handleLuggageFormChange(index, "name", e.target.value.slice(0, 100))} 
                                        required 
                                        inputProps={{ maxLength: 100 }}
                                        InputProps={{ 
                                            endAdornment: form.name ? (
                                                <IconButton size="small" onClick={() => handleLuggageFormChange(index, "name", "")} edge="end">
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            ) : null, 
                                        }} 
                                    />
                                    <TextField 
                                        label="Case Number" 
                                        fullWidth 
                                        size="small" 
                                        value={form.caseNumber} 
                                        onChange={(e) => handleLuggageFormChange(index, "caseNumber", e.target.value.slice(0, 20))} 
                                        required 
                                        inputProps={{ maxLength: 20 }}
                                    />
                                    <TextField 
                                        label="Item Description" 
                                        fullWidth 
                                        size="small" 
                                        value={form.itemDescription} 
                                        onChange={(e) => handleLuggageFormChange(index, "itemDescription", e.target.value.slice(0, 200))} 
                                        required 
                                        inputProps={{ maxLength: 200 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <TextField 
                                            label="Contact Number" 
                                            fullWidth 
                                            size="small" 
                                            value={contract.contact} 
                                            onChange={(e) => handleInputChange("contact", e.target.value)} 
                                            onFocus={handlePhoneFocus}
                                            required 
                                            placeholder="+63 XXX XXX XXXX"
                                            sx={{ width: '30%' }}
                                            inputProps={{
                                                pattern: '^\\+63\\s\\d{3}\\s\\d{3}\\s\\d{4}$',
                                                maxLength: 17 // +63 XXX XXX XXXX format
                                            }}
                                            InputProps={{ 
                                                endAdornment: contract.contact ? (
                                                    <IconButton size="small" onClick={() => handleInputChange("contact", "")} edge="end">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null, 
                                            }}
                                        />
                                        <TextField 
                                            label="Flight No." 
                                            fullWidth 
                                            size="small" 
                                            value={form.flightNo} 
                                            onChange={(e) => handleLuggageFormChange(index, "flightNo", e.target.value.slice(0, 10))} 
                                            required 
                                            sx={{ width: '25%' }} 
                                            inputProps={{ maxLength: 10 }}
                                        />
                                        <TextField 
                                            label="Weight (kg)" 
                                            fullWidth 
                                            size="small" 
                                            type="number" 
                                            value={form.weight} 
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
                                                    handleLuggageFormChange(index, "weight", value);
                                                }
                                            }} 
                                            required 
                                            sx={{ width: '20%' }}
                                            inputProps={{ 
                                                min: 0,
                                                max: 100,
                                                step: 0.1
                                            }}
                                        />
                                        <TextField 
                                            label="Luggage Quantity" 
                                            fullWidth 
                                            size="small" 
                                            type="number" 
                                            value={form.quantity} 
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || (Number(value) >= 1 && Number(value) <= 10)) {
                                                    handleLuggageFormChange(index, "quantity", value);
                                                }
                                            }} 
                                            required 
                                            sx={{ width: '25%' }}
                                            inputProps={{ 
                                                min: 1,
                                                max: 10,
                                                step: 1
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={handleAddLuggageForm}
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                        >
                            Add Another Luggage
                        </Button>
                    </Paper>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}><Button variant="contained" onClick={handleSubmit}>Create Booking</Button></Box>
                    <Box sx={{ textAlign: "center", mt: 6 }}><Typography variant="h6" fontWeight="bold">Partnered with:</Typography><Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}><Image src="/brand-3.png" alt="AirAsia" width={60} height={60} /></Box></Box>
                </Box>)}
                <Snackbar 
                    open={snackbarOpen} 
                    autoHideDuration={4000} 
                    onClose={() => setSnackbarOpen(false)} 
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{
                        '& .MuiSnackbarContent-root': {
                            backgroundColor: theme.palette.error.main,
                            color: theme.palette.error.contrastText
                        }
                    }}
                />
                <Dialog
                    open={cancelDialogOpen}
                    onClose={handleCancelClose}
                    aria-labelledby="cancel-dialog-title"
                >
                    <DialogTitle id="cancel-dialog-title">Confirm Cancellation</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to cancel this contract? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelClose} disabled={cancelling}>
                            No, Keep It
                        </Button>
                        <Button
                            onClick={handleCancelConfirm}
                            color="error"
                            variant="contained"
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling...' : 'Yes, Cancel Contract'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>)}
        </Box>
    );
}