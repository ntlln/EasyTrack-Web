"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Autocomplete, CircularProgress, Snackbar, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from "@mui/material";
import LoadingSpinner from '../../components/LoadingSpinner';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import { fetchBaseDeliveryFeeForAddress, fetchPricingRegions, fetchCitiesByRegion } from '../../../utils/pricingUtils';

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
    const supabase = createClientComponentClient();
    const theme = useTheme();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);

    const [map, setMap] = useState(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
    const [contract, setContract] = useState({
        province: "", city: "", addressLine1: "", addressLine2: "",
        barangay: "", postalCode: "", contact: ""
    });
    const [luggageForms, setLuggageForms] = useState([{
        firstName: "", middleInitial: "", lastName: "", suffix: "",
        flightNo: "", luggageDescriptions: [""], quantity: "1", contact: ""
    }]);
    const [pickupAddress, setPickupAddress] = useState({
        terminal: "", bay: "", location: "", coordinates: { lat: null, lng: null }
    });
    const [dropoffAddress, setDropoffAddress] = useState({ location: null, lat: null, lng: null });
    const [placeOptions, setPlaceOptions] = useState([]);
    const [placeLoading, setPlaceLoading] = useState(false);
    const [contractList, setContractList] = useState([]);
    const [contractListLoading, setContractListLoading] = useState(false);
    const [contractListError, setContractListError] = useState(null);
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
    const [pricingRegions, setPricingRegions] = useState([]);
    const [pricingCities, setPricingCities] = useState([]);
    const [selectedPricingRegion, setSelectedPricingRegion] = useState(null);
    const [selectedPricingCity, setSelectedPricingCity] = useState('');
    const [loadingPricingData, setLoadingPricingData] = useState(false);
    const [pricingStatus, setPricingStatus] = useState(null);

    const terminalCoordinates = {
        'Terminal 1': { lat: 14.508963226090515, lng: 121.00417400814496 },
        'Terminal 2': { lat: 14.511166725278645, lng: 121.01288969053523 },
        'Terminal 3': { lat: 14.5201168528943, lng: 121.01377520505147 },
    };

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const checkVerification = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push('/airline/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('verify_status_id, verify_status(status_name)')
                    .eq('id', session.user.id)
                    .single();

                const verified = profile?.verify_status?.status_name === 'Verified';
                setIsVerified(verified);
            } catch (error) {
                setIsVerified(false);
            } finally {
                setVerificationLoading(false);
            }
        };

        checkVerification();
    }, [supabase, router]);

    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredProvinces, setFilteredProvinces] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [filteredBarangays, setFilteredBarangays] = useState([]);


    useEffect(() => {
        const loadAddressData = async () => {
            try {
                const regionResponse = await fetch(`/ph-address/region.json`, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!regionResponse.ok) {
                    throw new Error(`Failed to fetch regions: ${regionResponse.status}`);
                }
                const allRegions = await regionResponse.json();
                const allowedRegionCodes = ['01', '02', '03', '04', '05', '13', '14', '17'];
                const filteredRegions = allRegions.filter(region =>
                    allowedRegionCodes.includes(region.region_code)
                );
                setRegions(filteredRegions);

                // Load provinces
                const provinceResponse = await fetch(`/ph-address/province.json`, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!provinceResponse.ok) {
                    throw new Error(`Failed to fetch provinces: ${provinceResponse.status}`);
                }
                const allProvinces = await provinceResponse.json();
                const filteredProvinces = allProvinces.filter(province =>
                    allowedRegionCodes.includes(province.region_code)
                );
                setProvinces(filteredProvinces);

                // Load cities
                const cityResponse = await fetch(`/ph-address/city.json`, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!cityResponse.ok) {
                    throw new Error(`Failed to fetch cities: ${cityResponse.status}`);
                }
                const allCities = await cityResponse.json();
                const provinceCodes = filteredProvinces.map(p => p.province_code);
                const filteredCities = allCities.filter(city =>
                    provinceCodes.includes(city.province_code)
                );
                setCities(filteredCities);

                // Load barangays
                const barangayResponse = await fetch(`/ph-address/barangay.json`, {
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!barangayResponse.ok) {
                    throw new Error(`Failed to fetch barangays: ${barangayResponse.status}`);
                }
                const allBarangays = await barangayResponse.json();
                const cityCodes = filteredCities.map(c => c.city_code);
                const filteredBarangays = allBarangays.filter(barangay =>
                    cityCodes.includes(barangay.city_code)
                );
                setBarangays(filteredBarangays);

            } catch (error) {
                setSnackbarMessage('Failed to load address data. Please refresh the page.');
                setSnackbarOpen(true);
            }
        };

        loadAddressData();
    }, []);

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
            } catch (_) {}
        };
        fetchFlightPrefix();
    }, []);

    useEffect(() => {
        if (mounted && !isScriptLoaded && activeTab === 1) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google && window.google.maps) {
                    const originalWarn = console.warn;
                    console.warn = (...args) => {
                        if (args[0] && args[0].includes && args[0].includes('Vector Map')) {
                            return;
                        }
                        originalWarn.apply(console, args);
                    };
                }
                setIsScriptLoaded(true);
                setIsGoogleMapsReady(true);
            };
            script.onerror = (e) => { setMapError('Failed to load Google Maps'); };
            document.head.appendChild(script);
            return () => { if (document.head.contains(script)) { document.head.removeChild(script); } };
        }
    }, [mounted, activeTab]);

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
            } catch (error) {}
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


    const initMap = () => {
        if (!window.google || !mapRef.current) return;
        try {
            const luzonBounds = new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(12.5, 119.5),
                new window.google.maps.LatLng(18.5, 122.5)
            );

            const defaultLocation = { lat: 14.5091, lng: 121.0120 };
            const mapOptions = {
                center: defaultLocation,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeId: 'roadmap',
                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID,
                restriction: {
                    latLngBounds: luzonBounds,
                    strictBounds: false
                },
                minZoom: 5,
                maxZoom: 18
            };

            const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
            setMap(newMap);

            const markerView = new window.google.maps.marker.PinElement({
                scale: 1,
                background: theme.palette.primary.main,
                borderColor: theme.palette.primary.dark,
                glyphColor: 'primary.contrastText'
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

                clearPricingSelections();

                updateMarkerAndAddress({ lat, lng });
            });

            markerRef.current.addListener('dragend', () => {
                const position = markerRef.current.position;

                clearPricingSelections();

                updateAddressFromPosition(position);
            });
        } catch (error) {
            setMapError(error.message);
        }
    };


    const updateAddressFromPosition = (position) => {
        const lat = position.lat();
        const lng = position.lng();

        clearPricingSelections();

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const top = results[0];
                setDropoffAddress(prev => ({ ...prev, location: top.formatted_address, lat: lat, lng: lng }));
                const parsed = parsePhAdministrativeComponents(top.address_components);
                backfillAddressSelections(parsed);

                fetchAndSetDeliveryFee(top.formatted_address);
            }
        });
    };

    const updateMarkerAndAddress = (position) => {
        if (!window.google || !map) return;

        clearPricingSelections();

        const markerView = new window.google.maps.marker.PinElement({
            scale: 1,
            background: theme.palette.primary.main,
            borderColor: theme.palette.primary.dark,
            glyphColor: '#FFFFFF'
        });
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
        map.panTo(position);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const top = results[0];
                const formattedAddress = top.formatted_address;
                setDropoffAddress(prev => ({ ...prev, location: formattedAddress, lat: position.lat, lng: position.lng }));
                const parsed = parsePhAdministrativeComponents(top.address_components);
                backfillAddressSelections(parsed);

                fetchAndSetDeliveryFee(formattedAddress);
            }
        });
    };
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

        const isPickupLocation = address.toLowerCase().includes('terminal');
        map.setZoom(isPickupLocation ? 14 : 15);

        markerRef.current.addListener('dragend', () => {
            const newPosition = markerRef.current.position;
            const lat = newPosition.lat;
            const lng = newPosition.lng;
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng }, componentRestrictions: { country: 'ph' } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const top = results[0];
                    setDropoffAddress(prev => ({
                        ...prev,
                        location: top.formatted_address,
                        lat: lat,
                        lng: lng
                    }));
                    const parsed = parsePhAdministrativeComponents(top.address_components);
                    backfillAddressSelections(parsed);
                    fetchAndSetDeliveryFee(top.formatted_address);
                }
            });
        });

        setTimeout(() => {
            window.google.maps.event.trigger(map, 'resize');
            map.setCenter(position);
        }, 100);
    }, [map]);

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
                new window.google.maps.LatLng(12.5, 119.5),
                new window.google.maps.LatLng(18.5, 122.5)
            ),
            strictBounds: false
        }, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setPlaceOptions(predictions);
            } else {
                setPlaceOptions([]);
            }
            setPlaceLoading(false);
        });
    };

    const debouncedFetchPlaceSuggestions = (input) => {
        if (!input || input.trim() === '') {
            setPlaceOptions([]);
            setPlaceLoading(false);
            return;
        }

        setTimeout(() => {
            fetchPlaceSuggestions(input);
        }, 3000);
    };

    const handleDropoffInputChange = (event, value) => {
        setDropoffAddress(prev => ({ ...prev, location: value }));
        debouncedFetchPlaceSuggestions(value);
    };

    const handleDropoffSelect = (event, value) => {
        if (!value || !placesServiceRef.current) return;


        clearPricingSelections();

        setDropoffAddress(prev => ({ ...prev, location: value.description }));
        placesServiceRef.current.getDetails({ placeId: value.place_id }, (data, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && data && data.geometry) {
                const loc = data.geometry.location;
                const newPosition = { lat: loc.lat(), lng: loc.lng() };

                if (!isWithinLuzonBounds(newPosition.lat, newPosition.lng)) {
                    setSnackbarMessage('This place is not covered by our service');
                    setSnackbarOpen(true);
                    return;
                }

                const resolvedAddress = data.formatted_address || value.description;
                updateMapLocation(newPosition, resolvedAddress);
                setDropoffAddress(prev => ({
                    ...prev,
                    location: resolvedAddress,
                    lat: newPosition.lat,
                    lng: newPosition.lng
                }));

                const parsed = parsePhAdministrativeComponents(data.address_components || []);
                backfillAddressSelections(parsed);

                fetchAndSetDeliveryFee(resolvedAddress);
            }
        });
    };

    const handleRegionChange = (regionCode) => {
        setSelectedRegion(regionCode);
        setSelectedProvince('');
        setSelectedCity('');
        setContract(prev => ({ ...prev, province: '', city: '', barangay: '', postalCode: '' }));

        const filtered = provinces.filter(province => province.region_code === regionCode);
        setFilteredProvinces(filtered);
        setFilteredCities([]);
        setFilteredBarangays([]);
    };

    const handleProvinceChange = (value) => {
        setSelectedProvince(value);
        setSelectedCity('');
        setContract(prev => ({ ...prev, city: '', barangay: '', postalCode: '' }));

        const selectedProvinceData = provinces.find(province => province.province_name === value);
        if (selectedProvinceData) {
            setSelectedRegion(selectedProvinceData.region_code);
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

        const selectedCityData = cities.find(city => city.city_name === value);
        if (selectedCityData) {
            // Filter barangays by city code
            const filtered = barangays.filter(barangay => barangay.city_code === selectedCityData.city_code);
            setFilteredBarangays(filtered);

            // Don't auto-fill postal code here - wait for barangay selection
        } else {
            setFilteredBarangays([]);
        }
    };

    const handleBarangayChange = (value) => {
        setContract(prev => ({ ...prev, barangay: value, postalCode: '' }));

        // Only populate postal code after barangay is selected
        if (value) {
            // First try to find postal code from the selected city
            const selectedCityData = cities.find(city => city.city_name === contract.city);
            if (selectedCityData && selectedCityData.postal_code) {
                setContract(prev => ({ ...prev, postalCode: selectedCityData.postal_code }));
            } else {
                // If no city postal code, try to find the barangay in the full barangays list
                // to get postal code from the city that contains this barangay
                const selectedBarangayData = barangays.find(barangay => barangay.brgy_name === value);
                if (selectedBarangayData) {
                    // Find the city that contains this barangay
                    const cityForBarangay = cities.find(city => city.city_code === selectedBarangayData.city_code);
                    if (cityForBarangay && cityForBarangay.postal_code) {
                        setContract(prev => ({ ...prev, postalCode: cityForBarangay.postal_code }));
                    }
                }
            }
        }
    };

    const handlePickupAddressChange = (field, value) => {
        setPickupAddress(prev => {
            const newState = { ...prev, [field]: value };

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

        if (validationErrors.pickupLocation) {
            setValidationErrors(prev => ({ ...prev, pickupLocation: null }));
        }
    };

    const handleDropoffAddressChange = (field, value) => {
        setDropoffAddress(prev => ({ ...prev, [field]: value }));
        if (validationErrors.dropoffLocation) {
            setValidationErrors(prev => ({ ...prev, dropoffLocation: null }));
        }
        if (validationErrors.dropoffCoordinates) {
            setValidationErrors(prev => ({ ...prev, dropoffCoordinates: null }));
        }
    };

    const handleInputChange = (field, value) => {
        if (field === 'contact') {
            if (!value) {
                setContract(prev => ({ ...prev, [field]: '' }));
            } else {
                const formatted = formatPhoneNumber(value);
                setContract(prev => ({ ...prev, [field]: formatted }));
            }
        } else {
            setContract(prev => ({ ...prev, [field]: value }));
        }
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const generateTrackingID = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const randomPart = [...Array(4)].map(() => Math.random().toString(36)[2].toUpperCase()).join('');
        return `${year}${month}${day}MKTP${randomPart}`;
    };

    useEffect(() => {
        const loadPricingRegions = async () => {
            try {
                setLoadingPricingData(true);
                const regions = await fetchPricingRegions();
                setPricingRegions(regions);
            } catch (error) {
                setSnackbarMessage('Failed to load pricing regions');
                setSnackbarOpen(true);
            } finally {
                setLoadingPricingData(false);
            }
        };

        loadPricingRegions();
    }, []);

    useEffect(() => {
        const loadCitiesByRegion = async () => {
            if (!selectedPricingRegion) {
                setPricingCities([]);
                return;
            }

            try {
                setLoadingPricingData(true);
                const cities = await fetchCitiesByRegion(selectedPricingRegion.id);
                setPricingCities(cities);
            } catch (error) {
                setSnackbarMessage('Failed to load cities');
                setSnackbarOpen(true);
                setPricingCities([]);
            } finally {
                setLoadingPricingData(false);
            }
        };

        loadCitiesByRegion();
    }, [selectedPricingRegion]);




    const fetchAndSetDeliveryFee = async (address) => {
        try {
            if (!address || !address.trim()) {
                setMapCityPrice(0);
                setPricingStatus(null);
                return;
            }

            let cityName = '';
            let regionName = '';

            if (window.google) {
                try {
                    const geocoder = new window.google.maps.Geocoder();
                    const results = await new Promise((resolve, reject) => {
                        geocoder.geocode({ address }, (res, status) => {
                            if (status === 'OK') resolve(res);
                            else reject(new Error(status));
                        });
                    });

                    if (results && results.length > 0) {
                        const comps = results[0].address_components || [];
                        const cityComp = comps.find(c => (c.types || []).includes('locality'))
                            || comps.find(c => (c.types || []).includes('administrative_area_level_3'))
                            || comps.find(c => (c.types || []).includes('administrative_area_level_2'));
                        const regionComp = comps.find(c => (c.types || []).includes('administrative_area_level_1'))
                            || comps.find(c => (c.types || []).includes('administrative_area_level_2'));

                        cityName = (cityComp?.long_name || '').replace(/\s*City\s*$/i, '').trim();
                        regionName = (regionComp?.long_name || '').trim();

                    }
                } catch (error) {}
            }

            if (cityName && regionName) {
                // Use the pricing table lookup based on extracted city and region
                const { fee, status } = await fetchBaseDeliveryFeeForAddress(cityName, regionName);
                setMapCityPrice(fee);
                setPricingStatus(status);

                if (status === 'ok') {
                    setMapCity(cityName);
                } else if (status === 'no_pricing') {
                    setSnackbarMessage('No pricing data available for this location');
                    setSnackbarOpen(true);
                } else if (status === 'no_match') {
                    setSnackbarMessage('This location is either invalid or out of delivery bounds');
                    setSnackbarOpen(true);
                }
            } else {
                setMapCityPrice(0);
                setPricingStatus('no_match');
                setSnackbarMessage('The selected address is either invalid or out of bounds');
                setSnackbarOpen(true);
            }
        } catch (err) {
            setMapCityPrice(0);
            setPricingStatus('no_match');
        }
    };

    const normalizePhName = (value) => {
        if (!value) return '';
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ñ/g, 'n')
            .replace(/ã±/g, 'n')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const findRegionByName = (name) => {
        const target = normalizePhName(name)
            .replace(/ region$/i, '')
            .replace(/^region\s*/i, '')
            .replace(/\b(ncr)\b/i, 'national capital region');
        return regions.find(r => normalizePhName(r.region_name).includes(target) || target.includes(normalizePhName(r.region_name)));
    };

    const findProvinceByName = (name) => {
        const target = normalizePhName(name)
            .replace(/ province$/i, '')
            .replace(/^province\s*/i, '');
        return provinces.find(p => normalizePhName(p.province_name) === target || normalizePhName(p.province_name).includes(target) || target.includes(normalizePhName(p.province_name)));
    };

    const findCityByName = (name) => {
        const target = normalizePhName(name).replace(/\s*city\s*$/i, '');
        return cities.find(c => normalizePhName(c.city_name) === target || normalizePhName(c.city_name).includes(target) || target.includes(normalizePhName(c.city_name)));
    };

    const findBarangayByNameWithinCity = (brgyName, cityData) => {
        if (!cityData) return undefined;
        const target = normalizePhName(brgyName)
            .replace(/^barangay\s*/i, '')
            .replace(/^brgy\.?\s*/i, '');
        const brgys = barangays.filter(b => b.city_code === cityData.city_code);
        return brgys.find(b => normalizePhName(b.brgy_name) === target);
    };

    const parsePhAdministrativeComponents = (components) => {
        if (!components) return {};
        let regionName = null;
        let provinceName = null;
        let cityName = null;
        let barangayName = null;
        let postalCode = null;

        components.forEach(comp => {
            const types = comp.types || [];
            const long = comp.long_name || comp.short_name;
            if (!long) return;

            if (types.includes('postal_code')) {
                postalCode = long;
            }
            if (types.includes('administrative_area_level_1')) {
                regionName = long;
            }
            if (types.includes('administrative_area_level_2')) {
                provinceName = long;
            }
            if (types.includes('locality') || types.includes('administrative_area_level_3')) {
                cityName = cityName || long;
            }
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('political')) {
                const n = normalizePhName(long);
                if (n && (!cityName || n !== normalizePhName(cityName))) {
                    if (!/(district|zone|city|province|region)$/i.test(long)) {
                        barangayName = barangayName || long;
                    }
                }
            }
        });

        if (!provinceName && regionName && /national capital region|ncr/i.test(regionName)) {
            provinceName = 'Metro Manila';
        }

        return { regionName, provinceName, cityName, barangayName, postalCode };
    };

    const backfillAddressSelections = (parsed) => {
        const { regionName, provinceName, cityName, barangayName, postalCode } = parsed || {};

        let region = regionName ? findRegionByName(regionName) : undefined;
        if (!region && cityName) {
            const cd = findCityByName(cityName);
            if (cd) {
                region = regions.find(r => r.region_code === cd.region_code);
            }
        }
        const resolvedRegionCode = region?.region_code || '';
        if (resolvedRegionCode) {
            setSelectedRegion(resolvedRegionCode);
            const provs = provinces.filter(p => p.region_code === resolvedRegionCode);
            setFilteredProvinces(provs);
        }

        let province = provinceName ? findProvinceByName(provinceName) : undefined;
        if (!province && cityName) {
            const cd = findCityByName(cityName);
            if (cd) {
                province = provinces.find(p => p.province_code === cd.province_code);
            }
        }
        if (province) {
            setContract(prev => ({ ...prev, province: province.province_name }));
            const citiesInProv = cities.filter(c => c.province_code === province.province_code);
            setFilteredCities(citiesInProv);
        }

        let cityData = cityName ? findCityByName(cityName) : undefined;
        if (!cityData && province) {
            const target = normalizePhName(cityName || '');
            const candidates = cities.filter(c => c.province_code === province.province_code);
            cityData = candidates.find(c => normalizePhName(c.city_name).includes(target) || target.includes(normalizePhName(c.city_name)));
        }
        if (cityData) {
            setContract(prev => ({ ...prev, city: cityData.city_name }));
            const brgys = barangays.filter(b => b.city_code === cityData.city_code);
            setFilteredBarangays(brgys);
        }

        let barangayData = barangayName ? findBarangayByNameWithinCity(barangayName, cityData) : undefined;
        if (barangayData) {
            setContract(prev => ({ ...prev, barangay: barangayData.brgy_name }));
        }

        if (postalCode) {
            setContract(prev => ({ ...prev, postalCode }));
        } else if (cityData && cityData.postal_code) {
            setContract(prev => ({ ...prev, postalCode: cityData.postal_code }));
        }
    };


    const basePrice = mapCityPrice > 0 ? mapCityPrice : 0;

    const clearPricingSelections = () => {
        setSelectedPricingRegion(null);
        setSelectedPricingCity('');
        setMapCityPrice(0);
        setPricingStatus(null);
        setMapCity('');
    };

    const getMultiplierForQty = (quantity) => {
        const qty = Number(quantity || 0);
        let m = 1;
        if (qty >= 4) m++;
        if (qty >= 7) m++;
        if (qty >= 10) m++;
        if (qty >= 13) m++;
        return m;
    };

    const passengerCostBreakdown = luggageForms.map((form, idx) => {
        const qty = Number(form?.quantity || 0);
        const tiers = getMultiplierForQty(qty);
        const surchargeCount = Math.max(0, tiers - 1);
        const surchargeAmount = surchargeCount * basePrice;
        const amount = basePrice + surchargeAmount;
        const surchargeText = surchargeCount === 0
            ? 'No surcharge'
            : `+${surchargeCount} tier(s) after 4, 7, 10, 13 luggages: ₱${surchargeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (base ₱${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${surchargeCount})`;
        const fullName = [form.firstName, form.middleInitial, form.lastName, form.suffix]
            .filter(Boolean)
            .join(' ')
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

    const estimatedTotalPrice = passengerCostBreakdown.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalLuggages = luggageForms.reduce((sum, form) => sum + (Number(form?.quantity) || 0), 0);

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
                const newDescriptions = [...currentDescriptions, ...Array(quantity - currentDescriptions.length).fill("")];
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

        if (validationErrors.luggage?.[index]) {
            setValidationErrors(prev => ({
                ...prev,
                luggage: prev.luggage.map((formErrors, i) => i === index ? {} : formErrors)
            }));
        }
    };


    // Validate all form fields and return error messages
    const validateForm = () => {
        const errors = {};

        if (!pickupAddress.terminal?.trim() || !pickupAddress.bay) {
            errors.pickupLocation = 'Terminal and bay selection are required';
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
        if (contract.barangay && !contract.postalCode?.trim()) {
            errors.postalCode = 'Postal code is required';
        }
        if (!contract.addressLine1?.trim()) {
            errors.addressLine1 = 'Address line 1 is required';
        }

        const luggageErrors = [];

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
                formErrors.firstName = 'Duplicate passenger name';
                formErrors.lastName = 'Duplicate passenger name';
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

    // Handle form submission for creating new luggage booking contracts
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
                setSnackbarMessage('Authentication error. Please try again.');
                setSnackbarOpen(true);
                return;
            }

            const contractTrackingIDs = luggageForms.map(() => generateTrackingID());


            const baseDeliveryCharge = mapCityPrice || 0;

            for (let i = 0; i < luggageForms.length; i++) {
                const form = luggageForms[i];
                const perPassenger = passengerCostBreakdown?.[i];
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
                    delivery_charge: baseDeliveryCharge,
                    delivery_surcharge: deliverySurcharge
                };

                const { error: contractError } = await supabase
                    .from('contracts')
                    .insert(contractData);

                if (contractError) {
                    return;
                }
            }

            setSnackbarMessage('Booking created successfully!');
            setSnackbarOpen(true);

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

    const handleTabChange = (event, newValue) => setActiveTab(newValue);

    // Fetch all contracts for the current airline with filtering and pagination
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
        router.push('/airline/luggage-tracking');
        setTimeout(() => {
            localStorage.setItem('trackContractId', contractId);
        }, 100);
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
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getProofOfPickup', params: { contract_id: contractId } })
            });
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

    const statusMap = {
        'available': 'available for pickup',
        'accepted': 'accepted - awaiting pickup',
        'transit': 'in transit',
        'delivered': 'delivered',
        'failed': 'delivery failed',
        'cancelled': 'cancelled'
    };

    const filteredContracts = contractList.filter(contract => {
        if (statusFilter === 'all') return true;
        const status = contract.contract_status?.status_name?.toLowerCase();
        return status === statusMap[statusFilter];
    });

    const searchNormalized = searchQuery.trim().toLowerCase();
    const filteredContractsWithSearch = filteredContracts.filter(contract => {
        if (!searchNormalized) return true;
        const searchableText = [
            String(contract.id),
            contract.pickup_location || '',
            contract.drop_off_location || '',
            contract.contract_status?.status_name || ''
        ].join(' ').toLowerCase();
        return searchableText.includes(searchNormalized);
    });

    const dateFilteredContracts = filterByDate(filteredContractsWithSearch, dateFilter);

    const getPaginatedContracts = () => dateFilteredContracts.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const handleChangePage = (event, newPage) => setPage(newPage);
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

    const isWithinLuzonBounds = (lat, lng) => lat >= 12.5 && lat <= 18.5 && lng >= 119.5 && lng <= 122.5;

    const formatPhoneNumber = (value) => {
        if (!value) return '';

        const phoneNumber = value.replace(/\D/g, '');

        let trimmedNumber = phoneNumber;
        if (trimmedNumber.startsWith('63')) {
            trimmedNumber = trimmedNumber.slice(2);
        } else if (trimmedNumber.startsWith('0')) {
            trimmedNumber = trimmedNumber.slice(1);
        }
        trimmedNumber = trimmedNumber.slice(0, 10);

        if (trimmedNumber.length === 0) return '+63 ';
        if (trimmedNumber.length <= 3) return `+63 ${trimmedNumber}`;
        if (trimmedNumber.length <= 6) return `+63 ${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3)}`;
        return `+63 ${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3, 6)} ${trimmedNumber.slice(6)}`;
    };


    const handleCancelClick = (contractId) => {
        setSelectedContractId(contractId);
        setCancelDialogOpen(true);
    };

    // Cancel a contract and update the contract list
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

    if (verificationLoading) {
        return <LoadingSpinner />;
    }

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
                        onClick={() => router.push('/airline/profile')}
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
                        {contractListLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress sx={{ color: 'primary.main' }} /></Box>)}
                        {contractListError && (<Typography color="error" align="center">{contractListError}</Typography>)}

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
                                                            {contract.delivery_charge && !isNaN(Number(contract.delivery_charge))
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
                                                                    disabled={contract.contract_status_id !== 1}
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

                        {/* Primary Location Selection - Pricing Database */}
                        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: theme.palette.background.default, border: `2px solid ${theme.palette.primary.main}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, flex: 1 }}>
                                    Select Delivery Location
                                </Typography>
                                {loadingPricingData && <CircularProgress size={20} color="primary" />}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    options={pricingRegions?.map(region => region.region) || []}
                                    value={selectedPricingRegion?.region || ''}
                                    loading={loadingPricingData}
                                    onChange={(event, newValue) => {
                                        const selectedRegion = pricingRegions.find(r => r.region === newValue);
                                        if (selectedRegion) {
                                            setSelectedPricingRegion(selectedRegion);
                                            setSelectedPricingCity('');
                                            setMapCityPrice(0);
                                            setPricingStatus(null);
                                            setMapCity('');
                                        } else {
                                            // If no exact match, clear selection
                                            setSelectedPricingRegion(null);
                                            setSelectedPricingCity('');
                                            setMapCityPrice(0);
                                            setPricingStatus(null);
                                            setMapCity('');
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        // Allow free text input but clear selection if no match
                                        if (!newInputValue) {
                                            setSelectedPricingRegion(null);
                                            setSelectedPricingCity('');
                                            setMapCityPrice(0);
                                            setPricingStatus(null);
                                            setMapCity('');
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Region"
                                            size="medium"
                                            placeholder="Type to search regions..."
                                        />
                                    )}
                                />

                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    options={(() => {
                                        if (!pricingCities || pricingCities.length === 0) return [];
                                        
                                        // Sort cities: priced cities first (alphabetically), then unpriced cities (alphabetically)
                                        const sortedCities = [...pricingCities].sort((a, b) => {
                                            const aHasPrice = a.price && a.price > 0;
                                            const bHasPrice = b.price && b.price > 0;
                                            
                                            // If both have prices or both don't have prices, sort alphabetically
                                            if (aHasPrice === bHasPrice) {
                                                return a.city.localeCompare(b.city);
                                            }
                                            
                                            // Priced cities come first
                                            return bHasPrice - aHasPrice;
                                        });
                                        
                                        return sortedCities.map(city => city.city);
                                    })()}
                                    value={selectedPricingCity}
                                    loading={loadingPricingData}
                                    disabled={!selectedPricingRegion}
                                    onChange={async (event, newValue) => {
                                        const selectedCity = pricingCities.find(c => c.city === newValue);
                                        if (selectedCity) {
                                            setSelectedPricingCity(newValue);
                                            const price = Number(selectedCity.price) || 0;
                                            setMapCityPrice(price);
                                            setPricingStatus('ok');
                                            setMapCity(selectedCity.city);

                                            // Update dropoff address with selected city
                                            const fullAddress = `${selectedCity.city}, ${selectedPricingRegion?.region || ''}, Philippines`;
                                            setDropoffAddress(prev => ({
                                                ...prev,
                                                location: fullAddress,
                                                lat: null,
                                                lng: null
                                            }));

                                            // Geocode the selected city and re-center the map
                                            if (window.google && map) {
                                                try {
                                                    const geocoder = new window.google.maps.Geocoder();
                                                    const results = await new Promise((resolve, reject) => {
                                                        geocoder.geocode({ address: fullAddress }, (res, status) => {
                                                            if (status === 'OK') resolve(res);
                                                            else reject(new Error(status));
                                                        });
                                                    });

                                                    if (results && results.length > 0) {
                                                        const location = results[0].geometry.location;
                                                        const lat = location.lat();
                                                        const lng = location.lng();

                                                        // Update coordinates
                                                        setDropoffAddress(prev => ({
                                                            ...prev,
                                                            lat: lat,
                                                            lng: lng
                                                        }));

                                                        // Update marker position first
                                                        if (markerRef.current) {
                                                            markerRef.current.position = { lat, lng };
                                                        }

                                                        // Re-center map to the selected city with smooth animation
                                                        map.panTo({ lat, lng });
                                                        map.setZoom(12);

                                                        // Ensure map is properly focused on the new location
                                                        setTimeout(() => {
                                                            map.panTo({ lat, lng });
                                                            window.google.maps.event.trigger(map, 'resize');
                                                        }, 100);
                                                    }
                } catch (error) {
                    setSnackbarMessage('Could not locate city on map');
                    setSnackbarOpen(true);
                }
                                            }
                                        } else {
                                            // If no exact match, clear pricing but keep the text
                                            setSelectedPricingCity(newValue);
                                            setMapCityPrice(0);
                                            setPricingStatus(null);
                                            setMapCity('');
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setSelectedPricingCity(newInputValue);
                                        // Clear pricing when typing manually
                                        if (newInputValue !== selectedPricingCity) {
                                            setMapCityPrice(0);
                                            setPricingStatus(null);
                                            setMapCity('');
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select City"
                                            size="medium"
                                            placeholder="Type to search cities..."
                                            disabled={!selectedPricingRegion}
                                        />
                                    )}
                                    renderOption={(props, option) => {
                                        const city = pricingCities.find(c => c.city === option);
                                        const hasPrice = city && city.price && city.price > 0;
                                        return (
                                            <Box component="li" {...props}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: hasPrice ? 600 : 400 }}>
                                                        {option}
                                                    </Typography>
                                                    {hasPrice ? (
                                                        <Typography variant="body2" sx={{
                                                            color: 'primary.main',
                                                            fontWeight: 'bold',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            ml: 2,
                                                            border: `1px solid ${theme.palette.primary.main}`,
                                                            backgroundColor: theme.palette.primary.light + '20'
                                                        }}>
                                                            ₱{city.price.toFixed(2)}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" sx={{
                                                            color: 'text.secondary',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            ml: 2,
                                                            border: `1px solid ${theme.palette.divider}`,
                                                            fontStyle: 'italic'
                                                        }}>
                                                            No pricing
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    }}
                                />
                            </Box>

                            {selectedPricingCity && (
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    backgroundColor: theme.palette.background.paper
                                }}>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                        ✓ Selected: {selectedPricingCity} - ₱{mapCityPrice.toFixed(2)} base delivery fee
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Secondary Location Selection - Map Interface */}
                        <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, backgroundColor: theme.palette.background.default }}>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {mounted && (
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
                                                    label="Search for a location (optional)"
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Search for a location"
                                                    error={!!validationErrors.dropoffLocation}
                                                    helperText={validationErrors.dropoffLocation}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {placeLoading ? <CircularProgress color="inherit" size={20} sx={{ color: 'primary.main' }} /> : null}
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
                    </Paper>
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 3, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information</Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    options={regions?.map(region => region.region_name) || []}
                                    value={contract.region || ''}
                                    loading={regions.length === 0}
                                    onChange={(event, newValue) => {
                                        const selectedRegion = regions.find(r => r.region_name === newValue);
                                        if (selectedRegion) {
                                            handleRegionChange(selectedRegion.region_code);
                                            setContract(prev => ({ ...prev, region: newValue }));
                                        } else {
                                            setContract(prev => ({ ...prev, region: newValue }));
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setContract(prev => ({ ...prev, region: newInputValue }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Region"
                                            size="small"
                                            required
                                            error={!!validationErrors.region}
                                            helperText={validationErrors.region}
                                        />
                                    )}
                                />
                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    options={filteredProvinces?.map(province => province.province_name) || []}
                                    value={contract.province || ''}
                                    loading={filteredProvinces.length === 0 && regions.length > 0}
                                    onChange={(event, newValue) => {
                                        const selectedProvince = filteredProvinces.find(p => p.province_name === newValue);
                                        if (selectedProvince) {
                                            handleProvinceChange(newValue);
                                            setContract(prev => ({ ...prev, province: newValue }));
                                        } else {
                                            setContract(prev => ({ ...prev, province: newValue }));
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setContract(prev => ({ ...prev, province: newInputValue }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Province"
                                            size="small"
                                            required
                                            error={!!validationErrors.province}
                                            helperText={validationErrors.province}
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <Autocomplete
                                    freeSolo
                                    sx={{ flex: 2 }}
                                    options={filteredCities?.map(city => city.city_name) || []}
                                    value={contract.city || ''}
                                    loading={filteredCities.length === 0 && filteredProvinces.length > 0}
                                    onChange={(event, newValue) => {
                                        const selectedCity = filteredCities.find(c => c.city_name === newValue);
                                        if (selectedCity) {
                                            handleCityChange(newValue);
                                            setContract(prev => ({ ...prev, city: newValue }));
                                        } else {
                                            setContract(prev => ({ ...prev, city: newValue }));
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setContract(prev => ({ ...prev, city: newInputValue }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="City/Municipality"
                                            size="small"
                                            required
                                            error={!!validationErrors.city}
                                            helperText={validationErrors.city}
                                        />
                                    )}
                                />
                                <Autocomplete
                                    freeSolo
                                    sx={{ flex: 2 }}
                                    options={filteredBarangays?.map(barangay => barangay.brgy_name) || []}
                                    value={contract.barangay || ''}
                                    loading={filteredBarangays.length === 0 && filteredCities.length > 0}
                                    onChange={(event, newValue) => {
                                        const selectedBarangay = filteredBarangays.find(b => b.brgy_name === newValue);
                                        if (selectedBarangay) {
                                            handleBarangayChange(newValue);
                                            setContract(prev => ({ ...prev, barangay: newValue }));
                                        } else {
                                            setContract(prev => ({ ...prev, barangay: newValue }));
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        setContract(prev => ({ ...prev, barangay: newInputValue }));
                                        // Also trigger postal code lookup for manual input
                                        handleBarangayChange(newInputValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Barangay"
                                            size="small"
                                            required
                                            error={!!validationErrors.barangay}
                                            helperText={validationErrors.barangay}
                                        />
                                    )}
                                />
                                <TextField
                                    label="Postal Code"
                                    sx={{ flex: 1, minWidth: 120 }}
                                    size="small"
                                    value={contract.postalCode || ""}
                                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                                    required={!!contract.barangay}
                                    error={!!validationErrors.postalCode}
                                    helperText={validationErrors.postalCode}
                                    disabled={!contract.barangay}
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
                                        {luggageForms.length > 1 && (
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
                                        )}
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
                                            onFocus={() => !form.contact && handleLuggageFormChange(index, "contact", "+63")}
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
                                                    <Typography variant="body2" sx={{
                                                        mr: 1,
                                                        color: theme.palette.mode === 'dark' ? 'white' : 'black',
                                                        whiteSpace: 'nowrap',
                                                        fontWeight: 500
                                                    }}>
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
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" sx={{ color: 'inherit' }} /> : null}
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
                                <Typography variant="body2"><b>Delivery location:</b> <span>{mapCity || contract.city || selectedPricingCity || 'Not selected'}</span></Typography>
                                <Typography variant="body2"><b>Total luggages:</b> <span>{totalLuggages}</span></Typography>
                                <Typography variant="body2"><b>Pricing rule:</b> <span>Base price increases after 4, 7, 10, and 13 luggages per passenger.</span></Typography>
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
                                                Base: ₱{Number(basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — {p.surchargeText}
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
                                    <Typography variant="body2">
                                        <b>Price:</b> <span>
                                            {detailsContract.delivery_charge && !isNaN(Number(detailsContract.delivery_charge))
                                                ? `₱${Number(detailsContract.delivery_charge).toLocaleString()}`
                                                : 'N/A'}
                                        </span>
                                    </Typography>
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
                                <CircularProgress sx={{ color: 'primary.main' }} />
                            </Box>
                        )}
                        {!pickupLoading && pickupError && (
                            <Typography color="error">{pickupError}</Typography>
                        )}
                        {!pickupLoading && !pickupError && pickupImageUrl && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                                <img 
                                    src={pickupImageUrl} 
                                    alt="Proof of Pickup" 
                                    style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }} 
                                />
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
                                <CircularProgress sx={{ color: 'primary.main' }} />
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