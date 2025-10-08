"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Autocomplete, CircularProgress, Snackbar, Divider, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';

// Date filter options
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



// Filter contracts by date
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
                firstDayOfWeek.setHours(0, 0, 0, 0);
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                lastDayOfWeek.setHours(23, 59, 59, 999);
                return createdAt >= firstDayOfWeek && createdAt <= lastDayOfWeek;
            }
            case 'lastWeek': {
                const firstDayOfThisWeek = new Date(now);
                firstDayOfThisWeek.setDate(now.getDate() - now.getDay());
                firstDayOfThisWeek.setHours(0, 0, 0, 0);
                const firstDayOfLastWeek = new Date(firstDayOfThisWeek);
                firstDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 7);
                const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
                lastDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() + 6);
                lastDayOfLastWeek.setHours(23, 59, 59, 999);
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
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [map, setMap] = useState(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [isFormMounted, setIsFormMounted] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
    const [contract, setContract] = useState({
        province: "",
        city: "",
        addressLine1: "",
        addressLine2: "",
        barangay: "",
        postalCode: "",
        contact: ""
    });
    const [luggageForms, setLuggageForms] = useState([{ firstName: "", middleInitial: "", lastName: "", suffix: "", flightNo: "", luggageDescriptions: [""], quantity: "1", contact: "" }]);
    const [pickupAddress, setPickupAddress] = useState({ 
        terminal: "", 
        bay: "", 
        location: "",
        coordinates: { lat: null, lng: null }
    });
    const [dropoffAddress, setDropoffAddress] = useState({ location: null, lat: null, lng: null });
    const [placeOptions, setPlaceOptions] = useState([]);
    const [placeLoading, setPlaceLoading] = useState(false);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const [contractList, setContractList] = useState([]);
    const [contractListLoading, setContractListLoading] = useState(false);
    const [contractListError, setContractListError] = useState(null);
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
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsContract, setDetailsContract] = useState(null);
    const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
    const [pickupImageUrl, setPickupImageUrl] = useState(null);
    const [pickupLoading, setPickupLoading] = useState(false);
    const [pickupError, setPickupError] = useState('');
    const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
    const [deliveryImageUrl, setDeliveryImageUrl] = useState(null);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryError, setDeliveryError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [flightPrefix, setFlightPrefix] = useState('');
    const [mapCity, setMapCity] = useState('');
    const [mapCityPrice, setMapCityPrice] = useState(0);

    // Terminal coordinates data
    const terminalCoordinates = {
        'Terminal 1': { lat: 14.508963226090515, lng: 121.00417400814496 },
        'Terminal 2': { lat: 14.511166725278645, lng: 121.01288969053523 },
        'Terminal 3': { lat: 14.5201168528943, lng: 121.01377520505147 },
        'Terminal 4': { lat: 14.525440177319647, lng: 121.00111980000001 }
    };

    // Mount component
    useEffect(() => { setMounted(true); setIsFormMounted(true); }, []);

    // Check verification status
    useEffect(() => {
        const checkVerification = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push('/contractor/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('verify_status_id, verify_status(status_name)')
                    .eq('id', session.user.id)
                    .single();

                const verified = profile?.verify_status?.status_name === 'Verified';
                setIsVerified(verified);
                
                if (!verified) {
                    console.log('[BookingPage] User not verified');
                }
            } catch (error) {
                console.error('[BookingPage] Error checking verification:', error);
                setIsVerified(false);
            } finally {
                setVerificationLoading(false);
            }
        };

        checkVerification();
    }, [supabase, router]);

    // Load Philippine address data
    useEffect(() => {
        const loadAddressData = async () => {
            try {
                // Load regions and filter by specified region codes
                const regionResponse = await fetch('/ph-address/region.json');
                const allRegions = await regionResponse.json();
                const allowedRegionCodes = ['01', '02', '03', '04', '05', '13', '14', '17'];
                const filteredRegions = allRegions.filter(region => 
                    allowedRegionCodes.includes(region.region_code)
                );
                setRegions(filteredRegions);

                // Load provinces and filter by allowed regions
                const provinceResponse = await fetch('/ph-address/province.json');
                const allProvinces = await provinceResponse.json();
                const filteredProvinces = allProvinces.filter(province => 
                    allowedRegionCodes.includes(province.region_code)
                );
                setProvinces(filteredProvinces);

                // Load cities
                const cityResponse = await fetch('/ph-address/city.json');
                const allCities = await cityResponse.json();
                setCities(allCities);

                // Load barangays
                const barangayResponse = await fetch('/ph-address/barangay.json');
                const allBarangays = await barangayResponse.json();
                setBarangays(allBarangays);

                setAddressData({
                    regions: filteredRegions,
                    provinces: filteredProvinces,
                    cities: allCities,
                    barangays: allBarangays
                });
            } catch (error) {
                console.error('Error loading address data:', error);
            }
        };

        loadAddressData();
    }, []);

    // (Postal code auto-fill removed; keep manual entry only)

    // Philippine address data state
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [addressData, setAddressData] = useState({
        regions: [],
        provinces: [],
        cities: [],
        barangays: []
    });
    // (Postal code dataset state removed)

    // Filtered data based on selections
    const [filteredProvinces, setFilteredProvinces] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [filteredBarangays, setFilteredBarangays] = useState([]);

    // Fetch flight prefix based on user's corporation
    useEffect(() => {
        const fetchFlightPrefix = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('corporation_id')
                    .eq('id', user.id)
                    .single();
                const corporationId = profile?.corporation_id;
                if (!corporationId) return;
                const { data: corp } = await supabase
                    .from('profiles_corporation')
                    .select('flight_prefix')
                    .eq('id', corporationId)
                    .single();
                setFlightPrefix(corp?.flight_prefix || '');
            } catch (_) { /* ignore */ }
        };
        fetchFlightPrefix();
    }, []);

    // Load Google Maps script
    useEffect(() => {
        if (mounted && !isScriptLoaded && activeTab === 1) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
            script.async = true;
            script.defer = true;
            script.onload = () => { setIsScriptLoaded(true); setIsGoogleMapsReady(true); };
            script.onerror = (e) => { setMapError('Failed to load Google Maps'); };
            document.head.appendChild(script);
            return () => { if (document.head.contains(script)) { document.head.removeChild(script); } };
        }
    }, [mounted, activeTab]);

    // Initialize map
    useEffect(() => {
        if (mounted && isGoogleMapsReady && !map && activeTab === 1) {
            const timer = setTimeout(() => { initMap(); }, 100);
            return () => clearTimeout(timer);
        }
    }, [mounted, isGoogleMapsReady, activeTab]);

    useEffect(() => {
        if (window.google && map && activeTab === 1) {
            try {
                autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                placesServiceRef.current = new window.google.maps.places.PlacesService(map);
            } catch (error) { }
        }
    }, [map, activeTab]);

    useEffect(() => {
        if (activeTab !== 1 && map) {
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
            setMap(null);
        }
    }, [activeTab]);

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

    // Cascading dropdown handlers
    const handleRegionChange = (value) => {
        setSelectedRegion(value);
        setSelectedProvince('');
        setSelectedCity('');
        setContract(prev => ({ ...prev, province: '', city: '', barangay: '' }));
        
        // Filter provinces by selected region
        const filtered = provinces.filter(province => province.region_code === value);
        setFilteredProvinces(filtered);
        setFilteredCities([]);
        setFilteredBarangays([]);
    };

    const handleProvinceChange = (value) => {
        setSelectedProvince(value);
        setSelectedCity('');
        setContract(prev => ({ ...prev, city: '', barangay: '', postalCode: '' }));
        
        // Find the province code for the selected province name
        const selectedProvinceData = provinces.find(province => province.province_name === value);
        if (selectedProvinceData) {
            // Filter cities by selected province code
            const filtered = cities.filter(city => city.province_code === selectedProvinceData.province_code);
            setFilteredCities(filtered);
        } else {
            setFilteredCities([]);
        }
        setFilteredBarangays([]);
    };

    const handleCityChange = (value) => {
        setSelectedCity(value);
        setContract(prev => ({ ...prev, barangay: '', postalCode: '' }));
        
        // Find the city code for the selected city name
        const selectedCityData = cities.find(city => city.city_name === value);
        if (selectedCityData) {
            // Filter barangays by selected city code
            const filtered = barangays.filter(barangay => barangay.city_code === selectedCityData.city_code);
            setFilteredBarangays(filtered);
        } else {
            setFilteredBarangays([]);
        }
    };

    // (Postal code extraction helpers removed)

    // (Postal code municipality lookup removed)

    // (Postal code auto-fill effect removed)

    // Remove Google-based and drop-off parsing logic (no longer used)

    // Contract form handlers
    const handlePickupAddressChange = (field, value) => {
        setPickupAddress(prev => {
            const newState = { ...prev, [field]: value };
            
            // Update location string and coordinates when terminal or bay changes
            if (field === 'terminal' || field === 'bay') {
                if (newState.terminal && newState.bay) {
                    newState.location = `${newState.terminal}, Bay ${newState.bay}`;
                    if (terminalCoordinates[newState.terminal]) {
                        newState.coordinates = terminalCoordinates[newState.terminal];
                    }
                } else {
                    newState.location = '';
                    newState.coordinates = { lat: null, lng: null };
                }
            }
            
            return newState;
        });
        
        // Clear validation error for this field
        if (validationErrors.pickupLocation) {
            setValidationErrors(prev => ({ ...prev, pickupLocation: null }));
        }
    };
    const handleDropoffAddressChange = (field, value) => {
        setDropoffAddress(prev => ({ ...prev, [field]: value }));
        // Clear validation errors for dropoff fields
        if (validationErrors.dropoffLocation) {
            setValidationErrors(prev => ({ ...prev, dropoffLocation: null }));
        }
        if (validationErrors.dropoffCoordinates) {
            setValidationErrors(prev => ({ ...prev, dropoffCoordinates: null }));
        }
    };
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
        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
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
                setPricingData(pricingMap);
            } catch (error) {
                console.error('Error in fetchPricingData:', error);
            }
        };

        fetchPricingData();
    }, []);

    // Normalize strings for city matching (e.g., Ã±/ñ -> n, remove accents)
    const normalizeCityString = (value) => {
        if (!value) return '';
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip diacritics
            .replace(/ñ/g, 'n')
            .replace(/Ã±/g, 'n')
            .trim();
    };

    // Get delivery charge for city
    const getDeliveryChargeForCity = (cityName) => {
        if (!cityName) return null;
        const cleanCity = cityName.replace(/\s*City\s*$/i, '').trim();
        const normTarget = normalizeCityString(cleanCity);

        // Exact normalized match
        const exactKey = Object.keys(pricingData).find((k) => normalizeCityString(k) === normTarget);
        if (exactKey !== undefined) return pricingData[exactKey];

        // Partial normalized match
        const partialKey = Object.keys(pricingData).find((k) => {
            const nk = normalizeCityString(k);
            return nk.includes(normTarget) || normTarget.includes(nk);
        });
        if (partialKey !== undefined) return pricingData[partialKey];

        return null;
    };

    // Calculate pricing
    const basePrice = mapCityPrice || 0;
    const passengerCount = (luggageForms || []).length;

    // Per-passenger multiplier based on that passenger's luggage quantity
    const getMultiplierForQty = (quantity) => {
        const qty = Number(quantity || 0);
        let m = 1;
        if (qty >= 4) m++;
        if (qty >= 7) m++;
        if (qty >= 10) m++;
        if (qty >= 13) m++;
        return m;
    };

    // Build per-passenger breakdown using individual multipliers
    const passengerCostBreakdown = (luggageForms || []).map((form, idx) => {
        const qty = Number(form?.quantity || 0);
        const tiers = getMultiplierForQty(qty);
        const surchargeCount = Math.max(0, tiers - 1);
        const surchargeAmount = surchargeCount * basePrice;
        const amount = basePrice + surchargeAmount; // additive increments per tier
        const surchargeText = surchargeCount === 0
            ? 'No surcharge'
            : `+${surchargeCount} tier(s) after 3 luggages: ₱${Number(surchargeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (base ₱${Number(basePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${surchargeCount})`;
        const fullName = `${(form.firstName || '').trim()} ${(form.middleInitial || '').trim()} ${(form.lastName || '').trim()}${form.suffix ? ` ${form.suffix}` : ''}`
            .replace(/  +/g, ' ')
            .trim();
        return {
            index: idx,
            name: fullName || `Passenger ${idx + 1}`,
            quantity: qty,
            amount,
            surchargeCount,
            surchargeAmount,
            surchargeText
        };
    });

    // Estimated total is now the sum of per-passenger amounts
    const estimatedTotalPrice = (passengerCostBreakdown || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalLuggages = (luggageForms || []).reduce((sum, form) => {
        const qty = Number(form?.quantity || 0);
        return sum + (isNaN(qty) ? 0 : qty);
    }, 0);

    // Update city and price when drop-off coordinates change
    useEffect(() => {
        const updateMapCityAndPrice = async () => {
            try {
                if (!dropoffAddress.lat || !dropoffAddress.lng) {
                    setMapCity('');
                    setMapCityPrice(0);
                    return;
                }
                const cityName = await getCityFromCoordinates(dropoffAddress.lat, dropoffAddress.lng);
                setMapCity(cityName || '');
                const price = cityName ? getDeliveryChargeForCity(cityName) : null;
                setMapCityPrice(typeof price === 'number' ? price : 0);
            } catch (_) {
                setMapCity('');
                setMapCityPrice(0);
            }
        };
        updateMapCityAndPrice();
    }, [dropoffAddress.lat, dropoffAddress.lng, pricingData]);

    const getCityFromCoordinates = async (lat, lng) => {
        if (!window.google) return null;

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(new Error(`Geocoding failed: ${status}`));
                });
            });

            if (!response?.[0]) return null;

            let city = response[0].address_components.find(
                component => component.types.includes('locality')
            )?.long_name;

            if (!city) {
                city = response[0].address_components.find(
                    component => component.types.includes('administrative_area_level_1')
                )?.long_name;
            }

            return city?.replace(/\s*City\s*$/i, '').trim() || null;
        } catch (error) {
            console.error('Error getting city from coordinates:', error);
            return null;
        }
    };

    const handleLuggageFormChange = (index, field, value) => {
        setLuggageForms(prev => {
            const newForms = [...prev];

            if (field === 'contact') {
                newForms[index] = { ...newForms[index], [field]: value ? formatPhoneNumber(value) : '' };
            } else if (['firstName', 'middleInitial', 'lastName', 'suffix', 'flightNo', 'quantity'].includes(field)) {
                newForms[index] = { ...newForms[index], [field]: value };
            }

            if (field === 'quantity') {
                const quantity = parseInt(value) || 0;
                const currentDescriptions = newForms[index].luggageDescriptions || [""];

                if (quantity > currentDescriptions.length) {
                    const newDescriptions = [...currentDescriptions];
                    for (let i = currentDescriptions.length; i < quantity; i++) {
                        newDescriptions.push("");
                    }
                    newForms[index].luggageDescriptions = newDescriptions;
                } else if (quantity < currentDescriptions.length) {
                    newForms[index].luggageDescriptions = currentDescriptions.slice(0, quantity);
                }
            }

            return newForms;
        });

        if (validationErrors.luggage?.[index]?.[field]) {
            setValidationErrors(prev => ({
                ...prev,
                luggage: prev.luggage.map((formErrors, i) =>
                    i === index ? { ...formErrors, [field]: null } : formErrors
                )
            }));
        }
    };

    const handleLuggageDescriptionChange = (formIndex, descIndex, value) => {
        setLuggageForms(prev => {
            const newForms = [...prev];
            const newDescriptions = [...newForms[formIndex].luggageDescriptions];
            newDescriptions[descIndex] = value;
            newForms[formIndex].luggageDescriptions = newDescriptions;
            return newForms;
        });

        if (validationErrors.luggage?.[formIndex]?.luggageDescriptions?.[descIndex]) {
            setValidationErrors(prev => ({
                ...prev,
                luggage: prev.luggage.map((formErrors, i) =>
                    i === formIndex ? {
                        ...formErrors,
                        luggageDescriptions: formErrors.luggageDescriptions?.map((descError, j) =>
                            j === descIndex ? null : descError
                        )
                    } : formErrors
                )
            }));
        }
    };

    const handleAddLuggageForm = () => {
        if (luggageForms.length < 15) {
            setLuggageForms(prev => [...prev, { 
                firstName: "", middleInitial: "", lastName: "", suffix: "", 
                flightNo: "", luggageDescriptions: [""], quantity: "1", contact: "" 
            }]);
        }
    };



    const handleRemoveLuggageForm = (index) => {
        setLuggageForms(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearLuggageForm = (index) => {
        setLuggageForms(prev => {
            const newForms = [...prev];
            newForms[index] = { 
                firstName: "", 
                middleInitial: "", 
                lastName: "", 
                suffix: "", 
                flightNo: "", 
                luggageDescriptions: [""], 
                quantity: "1", 
                contact: "" 
            };
            return newForms;
        });

        // Clear validation errors for this form
        if (validationErrors.luggage?.[index]) {
            setValidationErrors(prev => ({
                ...prev,
                luggage: prev.luggage.map((formErrors, i) =>
                    i === index ? {} : formErrors
                )
            }));
        }
    };


    const validateForm = () => {
        const errors = {};

        if (!pickupAddress.terminal?.trim()) {
            errors.pickupLocation = 'Terminal selection is required';
        }
        if (!pickupAddress.bay) {
            errors.pickupLocation = 'Bay selection is required';
        }

        if (!dropoffAddress.location?.trim()) {
            errors.dropoffLocation = 'Drop-off location is required';
        }

        if (!dropoffAddress.lat || !dropoffAddress.lng) {
            errors.dropoffCoordinates = 'Please select a valid drop-off location on the map';
        }

        if (!selectedRegion?.trim()) {
            errors.region = 'Region is required';
        }
        if (!contract.province?.trim()) {
            errors.province = 'Province is required';
        }
        if (!contract.city?.trim()) {
            errors.city = 'City/Municipality is required';
        }
        if (!contract.barangay?.trim()) {
            errors.barangay = 'Barangay is required';
        }
        if (!contract.postalCode?.trim()) {
            errors.postalCode = 'Postal code is required';
        }
        if (!contract.addressLine1?.trim()) {
            errors.addressLine1 = 'Address line 1 is required';
        }

        const luggageErrors = [];

        // Check for duplicate passenger names
        const normalizedFullNameCounts = luggageForms.reduce((acc, form) => {
            const parts = [form.firstName, form.middleInitial, form.lastName, form.suffix]
                .map(v => (v || '').trim())
                .filter(Boolean);
            const norm = parts.join(' ').toLowerCase();
            if (norm) acc[norm] = (acc[norm] || 0) + 1;
            return acc;
        }, {});

        luggageForms.forEach((form, index) => {
            const formErrors = {};

            // Require first and last names
            if (!form.firstName || form.firstName.trim() === '') {
                formErrors.firstName = 'First name is required';
            }
            if (!form.lastName || form.lastName.trim() === '') {
                formErrors.lastName = 'Last name is required';
            }

            const normalized = [form.firstName, form.middleInitial, form.lastName, form.suffix]
                .map(v => (v || '').trim())
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            if (normalized && normalizedFullNameCounts[normalized] > 1) {
                formErrors.firstName = formErrors.firstName || 'Duplicate passenger name';
                formErrors.lastName = formErrors.lastName || 'Duplicate passenger name';
            }
            if (!form.flightNo || form.flightNo.trim() === '') {
                formErrors.flightNo = 'Flight number is required';
            }
            if (!form.contact || form.contact.trim() === '') {
                formErrors.contact = 'Contact number is required';
            } else if (!/^\+63\s\d{3}\s\d{3}\s\d{4}$/.test(form.contact.trim())) {
                formErrors.contact = 'Contact number must be in format: +63 XXX XXX XXXX';
            }
            if (!form.luggageDescriptions?.length) {
                formErrors.luggageDescriptions = ['Luggage descriptions are required'];
            } else {
                const descriptionErrors = [];
                form.luggageDescriptions.forEach((desc, descIndex) => {
                    if (!desc?.trim()) {
                        descriptionErrors[descIndex] = 'Luggage description is required';
                    }
                });
                if (descriptionErrors.some(error => error)) {
                    formErrors.luggageDescriptions = descriptionErrors;
                }
            }
            if (!form.quantity || form.quantity.trim() === '') {
                formErrors.quantity = 'Quantity is required';
            } else if (Number(form.quantity) < 1 || Number(form.quantity) > 15) {
                formErrors.quantity = 'Quantity must be between 1 and 15';
            }

            if (Object.keys(formErrors).length > 0) {
                luggageErrors[index] = formErrors;
            }
        });

        if (luggageErrors.length > 0) {
            errors.luggage = luggageErrors;
        }

        return errors;
    };

    const handleSubmit = async () => {
        setValidationErrors({});

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setSnackbarMessage('Please fill in all required fields correctly');
            setSnackbarOpen(true);
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error('Error getting user:', userError);
                setSnackbarMessage('Authentication error. Please try again.');
                setSnackbarOpen(true);
                return;
            }

            const contractTrackingIDs = luggageForms.map(() => generateTrackingID());

            let city = null;
            if (dropoffAddress.lat && dropoffAddress.lng) {
                city = await getCityFromCoordinates(dropoffAddress.lat, dropoffAddress.lng);
            }

            let deliveryCharge = 0;
            if (city) {
                const charge = getDeliveryChargeForCity(city);
                if (typeof charge === 'number') deliveryCharge = charge;
            }

            for (let i = 0; i < luggageForms.length; i++) {
                const form = luggageForms[i];
                const perPassenger = passengerCostBreakdown?.[i];
                const deliveryCharge = basePrice; // base city price only
                const deliverySurcharge = Number(perPassenger?.surchargeAmount || 0);
                const contractData = {
                    id: contractTrackingIDs[i],
                    airline_id: user.id,
                    pickup_location: pickupAddress.location,
                    pickup_location_geo: pickupAddress.coordinates.lat && pickupAddress.coordinates.lng ? 
                        { type: 'Point', coordinates: [pickupAddress.coordinates.lng, pickupAddress.coordinates.lat] } : null,
                    drop_off_location: dropoffAddress.location,
                    drop_off_location_geo: { type: 'Point', coordinates: [dropoffAddress.lng, dropoffAddress.lat] },
                    owner_first_name: form.firstName || null,
                    owner_middle_initial: form.middleInitial || null,
                    owner_last_name: `${form.lastName || ''}${form.suffix ? ` ${form.suffix}` : ''}`.trim() || null,
                    owner_contact: form.contact,
                    luggage_description: form.luggageDescriptions.join(', '),
                    luggage_quantity: form.quantity,
                    flight_number: `${flightPrefix || ''}${form.flightNo || ''}`.trim(),
                    delivery_address: [
                        contract.province,
                        contract.city,
                        contract.barangay,
                        contract.postalCode
                    ].filter(Boolean).join(', '),
                    address_line_1: contract.addressLine1 || null,
                    address_line_2: contract.addressLine2 || null,
                    delivery_charge: deliveryCharge,
                    delivery_surcharge: deliverySurcharge
                };

                const { error: contractError } = await supabase
                    .from('contracts')
                    .insert(contractData);

                if (contractError) {
                    console.error('Error inserting contract:', contractError);
                    return;
                }
            }

            setSnackbarMessage('Booking created successfully!');
            setSnackbarOpen(true);
            
            // Reset form
            setContract({
                province: "", city: "", addressLine1: "", addressLine2: "",
                barangay: "", postalCode: "", contact: ""
            });
            setSelectedRegion('');
            setSelectedProvince('');
            setSelectedCity('');
            setFilteredProvinces([]);
            setFilteredCities([]);
            setFilteredBarangays([]);
            setLuggageForms([{ firstName: "", middleInitial: "", lastName: "", suffix: "", flightNo: "", luggageDescriptions: [""], quantity: "1", contact: "" }]);
            setPickupAddress({ terminal: "", bay: "", location: "", coordinates: { lat: null, lng: null } });
            setDropoffAddress({ location: null, lat: null, lng: null });
            setValidationErrors({});
            setActiveTab(0);
            router.refresh();
        } catch (error) {
            console.error('Error submitting contract:', error);
            setSnackbarMessage('Error creating booking. Please try again.');
            setSnackbarOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openConfirm = () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setSnackbarMessage('Please fill in all required fields correctly');
            setSnackbarOpen(true);
            return;
        }
        setConfirmOpen(true);
    };
    const closeConfirm = () => setConfirmOpen(false);

    const handleTabChange = (event, newValue) => { setActiveTab(newValue); };

    const fetchContracts = async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setContractListLoading(true);
        }
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
                    id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
                    pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
                    contract_status_id, contract_status(status_name), airline_id, delivery_id,
                    delivery_charge, owner_first_name, owner_middle_initial, owner_last_name,
                    owner_contact, luggage_description, luggage_quantity, flight_number,
                    delivery_address, address_line_1, address_line_2,
                    airline:airline_id (*), delivery:delivery_id (*)
                `)
                .eq('airline_id', user.id)
                .order('created_at', { ascending: false });

            if (contractError) throw contractError;
            setContractList(contracts || []);
        } catch (err) {
            setContractListError(err.message || 'Failed to fetch contracts');
        } finally {
            if (isInitialLoad) {
                setContractListLoading(false);
            }
        }
    };

    useEffect(() => {
        if (activeTab === 0) {
            fetchContracts(true);
            const interval = setInterval(() => fetchContracts(false), 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab]);


    const handleTrackContract = (contractId) => {
        router.push(`/contractor/luggage-tracking?contractId=${contractId}`);
    };

    const handleViewDetails = (contract) => {
        setDetailsContract(contract);
        setDetailsOpen(true);
    };

    const handleDetailsClose = () => {
        setDetailsOpen(false);
        setDetailsContract(null);
    };

    const openProofOfPickup = async (contractId) => {
        setPickupDialogOpen(true);
        setPickupLoading(true);
        setPickupError('');
        setPickupImageUrl(null);
        try {
            const res = await fetch(`/api/admin?action=getProofOfPickup&contractId=${contractId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch proof of pickup');
            setPickupImageUrl(data.proof_of_pickup);
        } catch (e) {
            setPickupError(e.message || 'Failed to fetch proof of pickup');
        } finally {
            setPickupLoading(false);
        }
    };

    const openProofOfDelivery = async (contractId) => {
        setDeliveryDialogOpen(true);
        setDeliveryLoading(true);
        setDeliveryError('');
        setDeliveryImageUrl(null);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getProofOfDelivery', params: { contract_id: contractId } })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch proof of delivery');
            setDeliveryImageUrl(data.proof_of_delivery);
        } catch (e) {
            setDeliveryError(e.message || 'Failed to fetch proof of delivery');
        } finally {
            setDeliveryLoading(false);
        }
    };

    // Filter contracts based on status
    const filteredContracts = contractList.filter(contract => {
        // Apply status filter
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

    // Apply search filter (by ID, locations, or status)
    const searchNormalized = searchQuery.trim().toLowerCase();
    const filteredContractsWithSearch = filteredContracts.filter(contract => {
        if (!searchNormalized) return true;
        const idMatch = String(contract.id).toLowerCase().includes(searchNormalized);
        const pickupMatch = (contract.pickup_location || '').toLowerCase().includes(searchNormalized);
        const dropoffMatch = (contract.drop_off_location || '').toLowerCase().includes(searchNormalized);
        const statusMatch = (contract.contract_status?.status_name || '').toLowerCase().includes(searchNormalized);
        return idMatch || pickupMatch || dropoffMatch || statusMatch;
    });

    // Apply date filter
    const dateFilteredContracts = filterByDate(filteredContractsWithSearch, dateFilter);

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

    // Check if coordinates are within Luzon bounds
    const isWithinLuzonBounds = (lat, lng) => {
        return lat >= 12.5 && lat <= 18.5 && lng >= 119.5 && lng <= 122.5;
    };

    // Format phone number
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

    // Handle phone focus
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

    // Show loading while checking verification
    if (verificationLoading) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                bgcolor: theme.palette.background.default, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Checking verification status...
                    </Typography>
                </Box>
            </Box>
        );
    }

    // Show verification message if not verified
    if (!isVerified) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                bgcolor: theme.palette.background.default, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 4
            }}>
                <Box sx={{ 
                    textAlign: 'center', 
                    maxWidth: 500,
                    p: 4,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: 2
                }}>
                    <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        bgcolor: 'warning.main', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                    }}>
                        <Typography variant="h3" sx={{ color: 'white' }}>⚠️</Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'warning.main' }}>
                        Account Not Verified
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: theme.palette.mode === 'dark' ? 'white' : 'black' }}>
                        You need to complete your profile verification before accessing the booking system. 
                        Please complete your profile information and upload your government ID documents.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={() => router.push('/contractor/profile')}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Complete Profile Verification
                    </Button>
                </Box>
            </Box>
        );
    }

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
                        {!contractListLoading && !contractListError && contractList.length === 0 && (<Typography align="center" sx={{ mb: 4 }}>No contracts found</Typography>)}

                        {mounted && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flexShrink: 0 }}>
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <FormControl size="small" sx={{ minWidth: 180 }}>
                                            <InputLabel>Filter by Status</InputLabel>
                                            <Select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                label="Filter by Status"
                                            >
                                                {filterOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl size="small" sx={{ minWidth: 180 }}>
                                            <InputLabel>Filter by Date</InputLabel>
                                            <Select
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                                label="Filter by Date"
                                            >
                                                {dateOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            size="small"
                                            placeholder="Search Contract"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            sx={{ minWidth: 240 }}
                                            InputProps={{
                                                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
                                                endAdornment: (
                                                    searchQuery ?
                                                        <ClearIcon
                                                            fontSize="small"
                                                            onClick={() => setSearchQuery('')}
                                                            sx={{ cursor: 'pointer', color: 'text.secondary' }}
                                                        /> : null
                                                )
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contract ID</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pickup Location</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Drop-off Location</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Flight Number</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timeline</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dateFilteredContracts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} align="center">
                                                        <Typography color="text.secondary">No contracts found</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                getPaginatedContracts().map((contract) => (
                                                    <TableRow key={`contract-${contract.id}`} hover>
                                                        <TableCell>{contract.id}</TableCell>
                                                        <TableCell>{contract.pickup_location || 'N/A'}</TableCell>
                                                        <TableCell>{contract.drop_off_location || 'N/A'}</TableCell>
                                                        <TableCell>{contract.flight_number || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {contract.delivery_address || `${contract.address_line_1 || ''} ${contract.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {contract.delivery_charge !== null && contract.delivery_charge !== undefined && !isNaN(Number(contract.delivery_charge))
                                                                ? `₱${Number(contract.delivery_charge).toLocaleString()}`
                                                                : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{contract.contract_status?.status_name || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2"><b>Created:</b> {contract.created_at ? new Date(contract.created_at).toLocaleString() : 'N/A'}</Typography>
                                                            <Typography variant="body2"><b>Accepted:</b> {contract.accepted_at ? new Date(contract.accepted_at).toLocaleString() : 'N/A'}</Typography>
                                                            <Typography variant="body2"><b>Pickup:</b> {contract.pickup_at ? new Date(contract.pickup_at).toLocaleString() : 'N/A'}</Typography>
                                                            <Typography variant="body2"><b>Delivered:</b> {contract.delivered_at ? new Date(contract.delivered_at).toLocaleString() : 'N/A'}</Typography>
                                                            <Typography variant="body2"><b>Cancelled:</b> {contract.cancelled_at ? new Date(contract.cancelled_at).toLocaleString() : 'N/A'}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={<LocationOnIcon />}
                                                                    onClick={() => handleTrackContract(contract.id)}
                                                                    disabled={(() => { const s = (contract.contract_status?.status_name || '').toLowerCase(); return ['delivered', 'failed', 'cancelled'].some(k => s.includes(k)); })()}
                                                                    fullWidth
                                                                >
                                                                    Track
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => handleViewDetails(contract)}
                                                                    fullWidth
                                                                >
                                                                    View Details
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => openProofOfPickup(contract.id)}
                                                                    disabled={(contract.contract_status?.status_name || '').toLowerCase() === 'cancelled'}
                                                                    fullWidth
                                                                >
                                                                    Proof of Pickup
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => openProofOfDelivery(contract.id)}
                                                                    disabled={(contract.contract_status?.status_name || '').toLowerCase() === 'cancelled'}
                                                                    fullWidth
                                                                >
                                                                    Proof of Delivery
                                                                </Button>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleCancelClick(contract.id)}
                                                                    disabled={(() => { const s = (contract.contract_status?.status_name || '').toLowerCase(); return ['delivered', 'failed', 'cancelled'].some(k => s.includes(k)); })()}
                                                                    fullWidth
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
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
                {activeTab === 1 && (<Box>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Pickup Location</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <FormControl fullWidth size="small" required error={!!validationErrors.pickupLocation}>
                                    <InputLabel>Terminal</InputLabel>
                                    <Select
                                        value={pickupAddress.terminal || ""}
                                        label="Terminal"
                                        onChange={(e) => handlePickupAddressChange("terminal", e.target.value)}
                                        required
                                    >
                                        {Object.keys(terminalCoordinates).map((terminal) => (
                                            <MenuItem key={terminal} value={terminal}>
                                                {terminal}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" required error={!!validationErrors.pickupLocation}>
                                    <InputLabel>Bay</InputLabel>
                                    <Select
                                        value={pickupAddress.bay || ""}
                                        label="Bay"
                                        onChange={(e) => handlePickupAddressChange("bay", e.target.value)}
                                        required
                                        disabled={!pickupAddress.terminal}
                                    >
                                        {[...Array(20)].map((_, i) => (
                                            <MenuItem key={`bay-${i + 1}`} value={i + 1}>
                                                Bay {i + 1}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            {validationErrors.pickupLocation && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {validationErrors.pickupLocation}
                                </Typography>
                            )}
                            {pickupAddress.location && (
                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                                    <strong>Selected Location:</strong> {pickupAddress.location}
                                </Typography>
                            )}
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
                                                error={!!validationErrors.dropoffLocation}
                                                helperText={validationErrors.dropoffLocation}
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
                            {validationErrors.dropoffCoordinates && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {validationErrors.dropoffCoordinates}
                                </Typography>
                            )}
                            {mounted && <MapComponent mapRef={mapRef} mapError={mapError} />}
                        </Box>
                    </Paper>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <FormControl fullWidth size="small" required error={!!validationErrors.region}>
                                    <InputLabel>Region</InputLabel>
                                    <Select
                                        value={selectedRegion}
                                        label="Region"
                                        onChange={(e) => handleRegionChange(e.target.value)}
                                    >
                                        {regions.map((region) => (
                                            <MenuItem key={region.region_code} value={region.region_code}>
                                                {region.region_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validationErrors.region && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {validationErrors.region}
                                        </Typography>
                                    )}
                                </FormControl>
                                <FormControl fullWidth size="small" required error={!!validationErrors.province}>
                                    <InputLabel>Province</InputLabel>
                                    <Select
                                        value={contract.province}
                                        label="Province"
                                        onChange={(e) => {
                                            handleProvinceChange(e.target.value);
                                            handleInputChange("province", e.target.value);
                                        }}
                                        disabled={!selectedRegion}
                                    >
                                        {filteredProvinces.map((province) => (
                                            <MenuItem key={province.province_code} value={province.province_name}>
                                                {province.province_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validationErrors.province && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {validationErrors.province}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <FormControl fullWidth size="small" required error={!!validationErrors.city}>
                                    <InputLabel>City/Municipality</InputLabel>
                                    <Select
                                        value={contract.city}
                                        label="City/Municipality"
                                        onChange={(e) => {
                                            handleCityChange(e.target.value);
                                            handleInputChange("city", e.target.value);
                                        }}
                                        disabled={!selectedProvince}
                                    >
                                        {filteredCities.map((city) => (
                                            <MenuItem key={`${city.city_code}-${city.city_name}`} value={city.city_name}>
                                                {city.city_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validationErrors.city && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {validationErrors.city}
                                        </Typography>
                                    )}
                                </FormControl>
                                <FormControl fullWidth size="small" required error={!!validationErrors.barangay}>
                                    <InputLabel>Barangay</InputLabel>
                                    <Select
                                        value={contract.barangay}
                                        label="Barangay"
                                        onChange={(e) => handleInputChange("barangay", e.target.value)}
                                        disabled={!selectedCity}
                                    >
                                        {filteredBarangays.map((barangay) => (
                                            <MenuItem key={barangay.brgy_code} value={barangay.brgy_name}>
                                                {barangay.brgy_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validationErrors.barangay && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {validationErrors.barangay}
                                        </Typography>
                                    )}
                                </FormControl>
                                <TextField
                                    label="Postal Code"
                                    fullWidth
                                    size="small"
                                    value={contract.postalCode || ""}
                                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                                    required
                                    error={!!validationErrors.postalCode}
                                    helperText={validationErrors.postalCode}
                                    inputProps={{ maxLength: 10 }}
                                />
                            </Box>
                            <TextField
                                label="Address Line 1"
                                fullWidth
                                size="small"
                                value={contract.addressLine1 || ""}
                                onChange={(e) => handleInputChange("addressLine1", e.target.value.slice(0, 200))}
                                required
                                error={!!validationErrors.addressLine1}
                                helperText={validationErrors.addressLine1}
                                placeholder="e.g., 123 Main Street, Building Name, Unit Number"
                                inputProps={{ maxLength: 200 }}
                                InputProps={{
                                    endAdornment: contract.addressLine1 ? (
                                        <IconButton size="small" onClick={() => handleInputChange("addressLine1", "")} edge="end">
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    ) : null,
                                }}
                            />
                            <TextField
                                label="Address Line 2 & Landmark Details (Optional)"
                                fullWidth
                                size="small"
                                value={contract.addressLine2 || ""}
                                onChange={(e) => handleInputChange("addressLine2", e.target.value.slice(0, 200))}
                                placeholder="e.g., Subdivision, Village, Near SM Mall, Beside Jollibee, Gate 2, etc."
                                inputProps={{ maxLength: 200 }}
                                InputProps={{
                                    endAdornment: contract.addressLine2 ? (
                                        <IconButton size="small" onClick={() => handleInputChange("addressLine2", "")} edge="end">
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    ) : null,
                                }}
                            />
                        </Box>
                    </Paper>
                    <Box sx={{ maxWidth: 700, mx: "auto", mt: 3 }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3} sx={{ color: 'primary.main' }}>
                            Passenger Information
                        </Typography>
                        {luggageForms.map((form, index) => (
                            <Paper 
                                key={index} 
                                elevation={2} 
                                sx={{ 
                                    mb: 4, 
                                    p: 3, 
                                    position: 'relative',
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.background.paper
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                        Passenger {index + 1}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="warning"
                                            onClick={() => handleClearLuggageForm(index)}
                                            sx={{ minWidth: 'auto', px: 1.5 }}
                                        >
                                            Clear Fields
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveLuggageForm(index)}
                                            sx={{
                                                color: 'error.main',
                                                '&:hover': {
                                                    backgroundColor: 'error.light',
                                                    color: 'error.contrastText'
                                                }
                                            }}
                                            title="Remove this passenger"
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                        </Box>
                                    </Box>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <TextField
                                            label="First Name"
                                            fullWidth
                                            size="small"
                                            value={form.firstName}
                                            onChange={(e) => handleLuggageFormChange(index, "firstName", e.target.value.slice(0, 100))}
                                            required
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].firstName)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].firstName}
                                            inputProps={{ maxLength: 100 }}
                                            InputProps={{
                                                endAdornment: form.firstName ? (
                                                    <IconButton size="small" onClick={() => handleLuggageFormChange(index, "firstName", "")} edge="end">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null,
                                            }}
                                        />
                                        <TextField
                                            label="Middle Initial"
                                            fullWidth
                                            size="small"
                                            value={form.middleInitial}
                                            onChange={(e) => handleLuggageFormChange(index, "middleInitial", e.target.value.slice(0, 5))}
                                            inputProps={{ maxLength: 5 }}
                                            InputProps={{
                                                endAdornment: form.middleInitial ? (
                                                    <IconButton size="small" onClick={() => handleLuggageFormChange(index, "middleInitial", "")} edge="end">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null,
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <TextField
                                            label="Last Name"
                                            fullWidth
                                            size="small"
                                            value={form.lastName}
                                            onChange={(e) => handleLuggageFormChange(index, "lastName", e.target.value.slice(0, 100))}
                                            required
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].lastName)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].lastName}
                                            inputProps={{ maxLength: 100 }}
                                            InputProps={{
                                                endAdornment: form.lastName ? (
                                                    <IconButton size="small" onClick={() => handleLuggageFormChange(index, "lastName", "")} edge="end">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null,
                                            }}
                                        />
                                        <TextField
                                            label="Suffix"
                                            fullWidth
                                            size="small"
                                            value={form.suffix}
                                            onChange={(e) => handleLuggageFormChange(index, "suffix", e.target.value.slice(0, 20))}
                                            inputProps={{ maxLength: 20 }}
                                            InputProps={{
                                                endAdornment: form.suffix ? (
                                                    <IconButton size="small" onClick={() => handleLuggageFormChange(index, "suffix", "")} edge="end">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null,
                                            }}
                                        />
                                    </Box>
                                    {/* Dynamic luggage description fields based on quantity */}
                                    {form.luggageDescriptions && form.luggageDescriptions.map((description, descIndex) => (
                                        <Box key={descIndex}>
                                            {descIndex === 3 && (
                                                <Typography 
                                                    variant="subtitle2" 
                                                    sx={{ 
                                                        color: 'primary.main', 
                                                        fontWeight: 700, 
                                                        mb: 1, 
                                                        mt: 1,
                                                        borderTop: `2px solid ${theme.palette.primary.main}`,
                                                        pt: 1
                                                    }}
                                                >
                                                    Additional Luggage
                                                </Typography>
                                            )}
                                            <TextField
                                                label={`Luggage Description ${descIndex + 1}`}
                                                fullWidth
                                                size="small"
                                                value={description}
                                                onChange={(e) => handleLuggageDescriptionChange(index, descIndex, e.target.value.slice(0, 200))}
                                                required
                                                error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].luggageDescriptions && validationErrors.luggage[index].luggageDescriptions[descIndex])}
                                                helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].luggageDescriptions && validationErrors.luggage[index].luggageDescriptions[descIndex]}
                                                inputProps={{ maxLength: 200 }}
                                                sx={{ mb: 1 }}
                                            />
                                        </Box>
                                    ))}
                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <TextField
                                            label="Contact Number"
                                            fullWidth
                                            size="small"
                                            value={form.contact}
                                            onChange={(e) => handleLuggageFormChange(index, "contact", e.target.value)}
                                            onFocus={() => {
                                                if (!form.contact) {
                                                    handleLuggageFormChange(index, "contact", "+63");
                                                }
                                            }}
                                            required
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].contact)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].contact}
                                            placeholder="+63 XXX XXX XXXX"
                                            sx={{ width: '40%' }}
                                            inputProps={{
                                                pattern: '^\\+63\\s\\d{3}\\s\\d{3}\\s\\d{4}$',
                                                maxLength: 17 // +63 XXX XXX XXXX format
                                            }}
                                            InputProps={{
                                                endAdornment: form.contact ? (
                                                    <IconButton size="small" onClick={() => handleLuggageFormChange(index, "contact", "")} edge="end">
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
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow alphanumeric characters and limit to 8 characters
                                                const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                                                handleLuggageFormChange(index, "flightNo", alphanumericValue);
                                            }}
                                            required
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].flightNo)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].flightNo}
                                            sx={{ width: '30%' }}
                                            inputProps={{
                                                maxLength: 6,
                                                pattern: '^[a-zA-Z0-9]{1,6}$'
                                            }}
                                            InputProps={{
                                                startAdornment: !!flightPrefix ? (
                                                    <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                                        {flightPrefix}
                                                    </Typography>
                                                ) : undefined
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
                                                if (value === '' || (Number(value) >= 1 && Number(value) <= 15)) {
                                                    handleLuggageFormChange(index, "quantity", value);
                                                }
                                            }}
                                            required
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].quantity)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].quantity}
                                            sx={{ width: '30%' }}
                                            inputProps={{
                                                min: 1,
                                                max: 15,
                                                step: 1
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                    
                    <Box sx={{ maxWidth: 700, mx: "auto", mt: 2, mb: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={handleAddLuggageForm}
                                startIcon={<AddIcon />}
                                disabled={luggageForms.length >= 15}
                                size="large"
                            >
                                Add Another Passenger
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ 
                        position: 'fixed', 
                        top: '50%', 
                        right: 20, 
                        transform: 'translateY(-50%)',
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        zIndex: 1000,
                        backgroundColor: theme.palette.background.paper,
                        padding: 2,
                        borderRadius: 2,
                        boxShadow: 3,
                        border: `1px solid ${theme.palette.divider}`
                    }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Estimated Price
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {(passengerCostBreakdown || []).map((p) => (
                                    <Box key={`price-break-${p.index}`} sx={{ mb: 0.75 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Passenger {p.index + 1}=
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                ₱{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, ml: 2 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Base Price =
                                            </Typography>
                                            <Typography variant="caption">
                                                ₱{Number(basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, ml: 2 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Surcharge (x{p.quantity}) =
                                            </Typography>
                                            <Typography variant="caption">
                                                ₱{Number(p.surchargeAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1.5 }}>
                                Estimated Total: ₱{Number(estimatedTotalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={openConfirm}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
                        </Button>
                    </Box>
                </Box>)}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={() => setSnackbarOpen(false)}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{
                        '& .MuiSnackbarContent-root': {
                            backgroundColor: snackbarMessage?.includes('successfully') ? theme.palette.success.main : theme.palette.error.main,
                            color: snackbarMessage?.includes('successfully') ? theme.palette.success.contrastText : theme.palette.error.contrastText
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

                <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="md" fullWidth>
                    <DialogTitle>Confirm Booking Details</DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Overview</Typography>
                            <Box sx={{ ml: 1, mb: 2 }}>
                                <Typography variant="body2"><b>Pickup:</b> <span>{pickupAddress.location || 'N/A'}</span></Typography>
                                <Typography variant="body2"><b>Drop-off:</b> <span>{dropoffAddress.location || 'N/A'}</span></Typography>
                                <Typography variant="body2"><b>Address:</b> <span>{[contract.addressLine1, contract.addressLine2].filter(Boolean).join(' ') || 'N/A'}</span></Typography>
                                <Typography variant="body2"><b>Province/City/Barangay:</b> <span>{[contract.province, contract.city, contract.barangay].filter(Boolean).join(', ') || 'N/A'}</span></Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Passengers</Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                {luggageForms.map((form, idx) => (
                                    <Box key={`conf-pass-${idx}`} sx={{ mb: 1 }}>
                                        <Typography variant="body2">
                                            <b>{idx + 1}.</b> {`${form.firstName || ''} ${form.middleInitial || ''} ${form.lastName || ''}${form.suffix ? ` ${form.suffix}` : ''}`.replace(/  +/g, ' ').trim() || 'N/A'} — Flight: {form.flightNo || 'N/A'} — Qty: {form.quantity || '0'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Pricing</Typography>
                            <Box sx={{ ml: 1 }}>
                                <Typography variant="body2"><b>Base price per tier:</b> <span>₱{Number(basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></Typography>
                                <Typography variant="body2"><b>Total luggages:</b> <span>{totalLuggages}</span></Typography>
                                <Typography variant="body2"><b>Pricing rule:</b> <span>Base price increases after every 3 luggages per passenger.</span></Typography>
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Per-passenger breakdown</Typography>
                                    {(passengerCostBreakdown || []).map((p) => (
                                        <Box key={`confirm-price-break-${p.index}`} sx={{ mb: 0.75 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                                <Typography variant="body2">
                                                    {p.name} (x{p.quantity})
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    ₱{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Base: ₱{Number(basePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — {p.surchargeText}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>Total: ₱{Number(estimatedTotalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeConfirm} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={async () => { setConfirmOpen(false); await handleSubmit(); }} variant="contained" disabled={isSubmitting}>Confirm & Create</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
                    <DialogTitle>Contract Details</DialogTitle>
                    <DialogContent dividers>
                        {detailsContract && (
                            <Box sx={{ minWidth: 400 }}>
                                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Contract ID: <span style={{ color: 'primary.main', fontWeight: 400 }}>{detailsContract.id}</span>
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Location Information
                                </Typography>
                                <Box sx={{ ml: 1, mb: 1 }}>
                                    <Typography variant="body2">
                                        <b>Pickup:</b> <span>{detailsContract.pickup_location || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Drop-off:</b> <span>{detailsContract.drop_off_location || 'N/A'}</span>
                                    </Typography>
                                    {detailsContract.delivery_charge !== null && detailsContract.delivery_charge !== undefined && !isNaN(Number(detailsContract.delivery_charge)) ? (
                                        <Typography variant="body2">
                                            <b>Price:</b> <span>₱{Number(detailsContract.delivery_charge).toLocaleString()}</span>
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2">
                                            <b>Price:</b> <span>N/A</span>
                                        </Typography>
                                    )}
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Passenger Information
                                </Typography>
                                <Box sx={{ ml: 1, mb: 1 }}>
                                    <Typography variant="body2">
                                        <b>Name:</b> <span>{`${detailsContract.owner_first_name || ''}${detailsContract.owner_middle_initial ? ' ' + detailsContract.owner_middle_initial : ''}${detailsContract.owner_last_name ? ' ' + detailsContract.owner_last_name : ''}${detailsContract.owner_suffix ? ' ' + detailsContract.owner_suffix : ''}`.trim() || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Contact Number:</b> <span>{detailsContract.owner_contact || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Address:</b> <span>{detailsContract.delivery_address || 'N/A'}</span>
                                    </Typography>
                                    {detailsContract.address_line_1 && (
                                        <Typography variant="body2">
                                            <b>Address Line 1:</b> <span>{detailsContract.address_line_1}</span>
                                        </Typography>
                                    )}
                                    {detailsContract.address_line_2 && (
                                        <Typography variant="body2">
                                            <b>Address Line 2 / Landmark Details:</b> <span>{detailsContract.address_line_2}</span>
                                        </Typography>
                                    )}
                                    <Typography variant="body2">
                                        <b>Quantity:</b> <span>{detailsContract.luggage_quantity || 'N/A'}</span>
                                    </Typography>
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <b>Luggage Description(s):</b>
                                        </Typography>
                                        {(() => {
                                            const items = (detailsContract.luggage_description || '')
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean);
                                            if (items.length === 0) {
                                                return (
                                                    <Typography variant="body2">N/A</Typography>
                                                );
                                            }
                                            return (
                                                <Box sx={{ ml: 2 }}>
                                                    {items.map((desc, idx) => (
                                                        <Typography key={`desc-${idx}`} variant="body2">{idx + 1}. {desc}</Typography>
                                                    ))}
                                                </Box>
                                            );
                                        })()}
                                    </Box>
                                    <Typography variant="body2">
                                        <b>Flight Number:</b> <span>{detailsContract.flight_number || 'N/A'}</span>
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Airline Personnel Information
                                </Typography>
                                <Box sx={{ ml: 1, mb: 1 }}>
                                    <Typography variant="body2">
                                        <b>Airline Personnel:</b>{' '}
                                        <span>
                                            {detailsContract.airline
                                                ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${detailsContract.airline.last_name || ''
                                                    }${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`
                                                    .replace(/  +/g, ' ')
                                                    .trim()
                                                : 'N/A'}
                                        </span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Email:</b>{' '}
                                        <span>{detailsContract.airline?.email || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Contact:</b>{' '}
                                        <span>{detailsContract.airline?.contact_number || 'N/A'}</span>
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Delivery Personnel Information
                                </Typography>
                                <Box sx={{ ml: 1, mb: 1 }}>
                                    <Typography variant="body2">
                                        <b>Delivery Personnel:</b>{' '}
                                        <span>
                                            {detailsContract.delivery
                                                ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${detailsContract.delivery.last_name || ''
                                                    }${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`
                                                    .replace(/  +/g, ' ')
                                                    .trim()
                                                : 'N/A'}
                                        </span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Email:</b>{' '}
                                        <span>{detailsContract.delivery?.email || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Contact:</b>{' '}
                                        <span>{detailsContract.delivery?.contact_number || 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Status:</b>{' '}
                                        <span style={{ color: 'primary.main', fontWeight: 700 }}>
                                            {detailsContract.contract_status?.status_name || 'N/A'}
                                        </span>
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                    Timeline
                                </Typography>
                                <Box sx={{ ml: 1, mb: 1 }}>
                                    <Typography variant="body2">
                                        <b>Created:</b>{' '}
                                        <span>{detailsContract.created_at ? new Date(detailsContract.created_at).toLocaleString() : 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Accepted:</b>{' '}
                                        <span>{detailsContract.accepted_at ? new Date(detailsContract.accepted_at).toLocaleString() : 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Pickup:</b>{' '}
                                        <span>{detailsContract.pickup_at ? new Date(detailsContract.pickup_at).toLocaleString() : 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Delivered:</b>{' '}
                                        <span>{detailsContract.delivered_at ? new Date(detailsContract.delivered_at).toLocaleString() : 'N/A'}</span>
                                    </Typography>
                                    <Typography variant="body2">
                                        <b>Cancelled:</b>{' '}
                                        <span>{detailsContract.cancelled_at ? new Date(detailsContract.cancelled_at).toLocaleString() : 'N/A'}</span>
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDetailsClose} color="primary">Close</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={pickupDialogOpen} onClose={() => setPickupDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Proof of Pickup</DialogTitle>
                    <DialogContent dividers>
                        {pickupLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}
                        {!pickupLoading && pickupError && (
                            <Typography color="error">{pickupError}</Typography>
                        )}
                        {!pickupLoading && !pickupError && pickupImageUrl && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                                <img src={pickupImageUrl} alt="Proof of Pickup" style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }} />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPickupDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={deliveryDialogOpen} onClose={() => setDeliveryDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Proof of Delivery</DialogTitle>
                    <DialogContent dividers>
                        {deliveryLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}
                        {!deliveryLoading && deliveryError && (
                            <Typography color="error">{deliveryError}</Typography>
                        )}
                        {!deliveryLoading && !deliveryError && deliveryImageUrl && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                                <img src={deliveryImageUrl} alt="Proof of Delivery" style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }} />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeliveryDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </>)}
        </Box>
    );
}