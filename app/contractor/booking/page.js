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
    const [contract, setContract] = useState({ 
        province: "", 
        city: "", 
        addressLine1: "", 
        addressLine2: "", 
        barangay: "", 
        postalCode: "", 
        contact: "" 
    });
    const [luggageForms, setLuggageForms] = useState([{ name: "", flightNo: "", itemDescription: "", quantity: "" }]);
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
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Location dropdown states for Google Places
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
    const [locationError, setLocationError] = useState(null);

    // Mount
    useEffect(() => { setMounted(true); setIsFormMounted(true); }, []);

    // Initialize provinces immediately on mount (based on image regions)
    useEffect(() => {
        const regionProvinces = [
            // Regional classifications
            'NCR',
            'North Luzon', 
            'South Luzon',
            
            // Specific provinces
            'Batangas',
            'Bulacan', 
            'Cavite',
            'Laguna',
            'Pampanga',
            'Rizal'
        ];

        const provinceList = regionProvinces.map(province => ({
            value: province,
            label: province
        }));
        
        setProvinces(provinceList);
    }, []);

    // Fetch cities for selected province using Google Places API
    const fetchCities = async (province) => {
        console.log('Fetching cities for province:', province);
        setIsLoadingCities(true);
        setLocationError(null);
        
        try {
            // For now, always use fallback data to ensure it works
            // TODO: Re-enable Google Places API once it's properly configured
            const fallbackCities = getFallbackCities(province);
            console.log('Fallback cities for', province, ':', fallbackCities);
            setCities(fallbackCities);
            
            // Check if Google Places API is available (disabled for now)
            if (false && window.google && autocompleteServiceRef.current) {
                // Use Google Places Autocomplete for cities
                const request = {
                    input: `${province} cities Philippines`,
                    types: ['(cities)'],
                    componentRestrictions: { country: 'ph' },
                    fields: ['name', 'formatted_address', 'address_components']
                };

                autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
                    console.log('Google Places API response:', { status, predictions });
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        // Filter and process cities
                        const cityList = predictions
                            .filter(prediction => {
                                const address = prediction.description.toLowerCase();
                                return address.includes(province.toLowerCase()) || 
                                       address.includes('philippines');
                            })
                            .map(prediction => ({
                                value: prediction.description,
                                label: prediction.description
                            }))
                            .slice(0, 30); // Limit to 30 cities
                        
                        console.log('Filtered cities:', cityList);
                        setCities(cityList);
                    } else {
                        // Fallback to predefined cities
                        const fallbackCities = getFallbackCities(province);
                        console.log('Using fallback cities:', fallbackCities);
                        setCities(fallbackCities);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
            setLocationError('Failed to load cities');
            // Fallback to predefined cities
            const fallbackCities = getFallbackCities(province);
            setCities(fallbackCities);
        } finally {
            setIsLoadingCities(false);
        }
    };


    // Fallback cities for regions and provinces (based on image)
    const getFallbackCities = (province) => {
        const fallbackData = {
            // Regional classifications
            'NCR': ['Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Pateros', 'San Juan', 'Taguig', 'Valenzuela'],
            'North Luzon': [
                // Ilocos Region
                'Laoag', 'Batac', 'Pagudpud', 'Bangui', 'Burgos', 'Currimao', 'Dingras', 'Dumalneg', 'Marcos', 'Nueva Era', 'Piddig', 'Pinili', 'San Nicolas', 'Sarrat', 'Solsona', 'Vintar',
                'Vigan', 'Candon', 'Bantay', 'Cabugao', 'Caoayan', 'Cervantes', 'Galimuyod', 'Gregorio del Pilar', 'Lidlidda', 'Magsingal', 'Nagbukel', 'Narvacan', 'Quirino', 'Salcedo', 'San Emilio', 'San Esteban', 'San Ildefonso', 'San Juan', 'San Vicente', 'Santa', 'Santa Catalina', 'Santa Cruz', 'Santa Lucia', 'Santa Maria', 'Santiago', 'Santo Domingo', 'Sigay', 'Sinait', 'Sugpon', 'Suyo', 'Tagudin',
                'San Fernando (La Union)', 'Agoo', 'Aringay', 'Bacnotan', 'Bagulin', 'Balaoan', 'Bangar', 'Bauang', 'Burgos', 'Caba', 'Luna', 'Naguilian', 'Pugo', 'Rosario', 'San Gabriel', 'Santo Tomas', 'Santol', 'Sudipen', 'Tubao',
                'Dagupan', 'San Carlos', 'Urdaneta', 'Alaminos', 'Alcala', 'Anda', 'Asingan', 'Balungao', 'Bani', 'Basista', 'Bautista', 'Bayambang', 'Binalonan', 'Binmaley', 'Bolinao', 'Bugallon', 'Burgos', 'Calasiao', 'Dasol', 'Infanta', 'Labrador', 'Laoac', 'Lingayen', 'Mabini', 'Malasiqui', 'Manaoag', 'Mangaldan', 'Mangatarem', 'Mapandan', 'Natividad', 'Pozorrubio', 'Rosales', 'San Fabian', 'San Jacinto', 'San Manuel', 'San Nicolas', 'San Quintin', 'Santa Barbara', 'Santa Maria', 'Santo Tomas', 'Sison', 'Sual', 'Tayug', 'Umingan', 'Urbiztondo', 'Villasis',
                // Cagayan Valley
                'Tuguegarao', 'Abulug', 'Alcala', 'Allacapan', 'Amulung', 'Aparri', 'Baggao', 'Ballesteros', 'Buguey', 'Calayan', 'Camalaniugan', 'Claveria', 'Enrile', 'Gattaran', 'Gonzaga', 'Iguig', 'Lal-lo', 'Lasam', 'Pamplona', 'Peñablanca', 'Piat', 'Rizal', 'Sanchez-Mira', 'Santa Ana', 'Santa Praxedes', 'Santa Teresita', 'Santo Niño', 'Solana', 'Tuao',
                'Ilagan', 'Alicia', 'Angadanan', 'Aurora', 'Benito Soliven', 'Burgos', 'Cabagan', 'Cabatuan', 'Cauayan', 'Cordon', 'Dinapigue', 'Divilacan', 'Echague', 'Gamu', 'Jones', 'Luna', 'Maconacon', 'Mallig', 'Naguilian', 'Palanan', 'Quezon', 'Quirino', 'Ramon', 'Reina Mercedes', 'Roxas', 'San Agustin', 'San Guillermo', 'San Isidro', 'San Manuel', 'San Mariano', 'San Mateo', 'San Pablo', 'Santa Maria', 'Santiago', 'Santo Tomas', 'Tumauini',
                'Bayombong', 'Alfonso Castañeda', 'Ambaguio', 'Aritao', 'Bagabag', 'Bambang', 'Diadi', 'Dupax del Norte', 'Dupax del Sur', 'Kasibu', 'Kayapa', 'Quezon', 'Santa Fe', 'Solano', 'Villaverde',
                'Cabarroguis', 'Aglipay', 'Diffun', 'Maddela', 'Nagtipunan', 'Saguday',
                // Central Luzon
                'Baler', 'Casiguran', 'Dilasag', 'Dinalungan', 'Dingalan', 'Dipaculao', 'Maria Aurora', 'San Luis',
                'Balanga', 'Abucay', 'Bagac', 'Dinalupihan', 'Hermosa', 'Limay', 'Mariveles', 'Morong', 'Orani', 'Pilar', 'Samal',
                'Malolos', 'Angat', 'Balagtas', 'Baliuag', 'Bocaue', 'Bulakan', 'Bustos', 'Calumpit', 'Doña Remedios Trinidad', 'Guiguinto', 'Hagonoy', 'Marilao', 'Meycauayan', 'Norzagaray', 'Obando', 'Pandi', 'Paombong', 'Plaridel', 'Pulilan', 'San Ildefonso', 'San Jose del Monte', 'San Miguel', 'San Rafael', 'Santa Maria',
                'Cabanatuan', 'Aliaga', 'Bongabon', 'Cabiao', 'Carranglan', 'Cuyapo', 'Gabaldon', 'General Mamerto Natividad', 'General Tinio', 'Gapan', 'Guimba', 'Jaen', 'Laur', 'Licab', 'Llanera', 'Lupao', 'Muñoz', 'Nampicuan', 'Palayan', 'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal', 'San Antonio', 'San Isidro', 'San Jose', 'San Leonardo', 'Santa Rosa', 'Santo Domingo', 'Talavera', 'Talugtug', 'Zaragoza',
                'San Fernando (Pampanga)', 'Angeles', 'Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Mabalacat', 'Macabebe', 'Magalang', 'Masantol', 'Mexico', 'Minalin', 'Porac', 'San Luis', 'San Simon', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Sasmuan',
                'Tarlac City', 'Anao', 'Bamban', 'Camiling', 'Capas', 'Concepcion', 'Gerona', 'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos', 'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria',
                'Olongapo', 'Botolan', 'Cabangan', 'Candelaria', 'Castillejos', 'Iba', 'Masinloc', 'Palauig', 'San Antonio', 'San Felipe', 'San Marcelino', 'San Narciso', 'Santa Cruz', 'Subic',
                // Cordillera Administrative Region
                'Baguio', 'La Trinidad', 'Atok', 'Bakun', 'Bokod', 'Buguias', 'Itogon', 'Kabayan', 'Kapangan', 'Kibungan', 'Mankayan', 'Sablan', 'Tuba', 'Tublay',
                'Bangued', 'Boliney', 'Bucay', 'Bucloc', 'Daguioman', 'Danglas', 'Dolores', 'La Paz', 'Lacub', 'Lagangilang', 'Lagayan', 'Langiden', 'Licuan-Baay', 'Luba', 'Malibcong', 'Manabo', 'Peñarrubia', 'Pidigan', 'Pilar', 'Sallapadan', 'San Isidro', 'San Juan', 'San Quintin', 'Tayum', 'Tineg', 'Tubo', 'Villaviciosa',
                'Kabugao', 'Calanasan', 'Conner', 'Flora', 'Luna', 'Pudtol', 'Santa Marcela',
                'Lagawe', 'Aguinaldo', 'Alfonso Lista', 'Asipulo', 'Banaue', 'Hingyon', 'Hungduan', 'Kiangan', 'Lamut', 'Mayoyao', 'Tinoc',
                'Tabuk', 'Balbalan', 'Lubuagan', 'Pasil', 'Pinukpuk', 'Rizal', 'Tanudan', 'Tinglayan',
                'Bontoc', 'Barlig', 'Bauko', 'Besao', 'Natonin', 'Paracelis', 'Sabangan', 'Sadanga', 'Sagada', 'Tadian'
            ],
            'South Luzon': [
                // CALABARZON
                'Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Malvar', 'Balayan', 'Calaca', 'Lemery', 'Nasugbu', 'Taal', 'Talisay', 'Tuy', 'Agoncillo', 'Alitagtag', 'Balete', 'Bauan', 'Calatagan', 'Cuenca', 'Ibaan', 'Laurel', 'Lian', 'Lobo', 'Mabini', 'Mataasnakahoy', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas', 'San Pascual', 'Santa Teresita', 'Taysan', 'Tingloy',
                'Trece Martires', 'Alfonso', 'Amadeo', 'Bacoor', 'Carmona', 'Cavite City', 'Dasmariñas', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'General Trias', 'Imus', 'Indang', 'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Tanza', 'Ternate',
                'Calamba', 'San Pedro', 'Santa Rosa', 'Biñan', 'Cabuyao', 'San Pablo', 'Los Baños', 'Sta. Cruz', 'Pila', 'Liliw', 'Alaminos', 'Bay', 'Calauan', 'Cavinti', 'Famy', 'Kalayaan', 'Luisiana', 'Lumban', 'Mabitac', 'Magdalena', 'Majayjay', 'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 'Pangil', 'Rizal', 'Siniloan', 'Victoria',
                'Lucena', 'Agdangan', 'Alabat', 'Atimonan', 'Buenavista', 'Burdeos', 'Calauag', 'Candelaria', 'Catanauan', 'Dolores', 'General Luna', 'General Nakar', 'Guinayangan', 'Gumaca', 'Infanta', 'Jomalig', 'Lopez', 'Lucban', 'Macalelon', 'Mauban', 'Mulanay', 'Padre Burgos', 'Pagbilao', 'Panukulan', 'Patnanungan', 'Perez', 'Pitogo', 'Plaridel', 'Polillo', 'Quezon', 'Real', 'Sampaloc', 'San Andres', 'San Antonio', 'San Francisco', 'San Narciso', 'Sariaya', 'Tagkawayan', 'Tayabas', 'Tiaong', 'Unisan',
                'Antipolo', 'Angono', 'Baras', 'Binangonan', 'Cainta', 'Cardona', 'Jala-Jala', 'Morong', 'Pililla', 'Rodriguez', 'San Mateo', 'Tanay', 'Taytay', 'Teresa',
                // MIMAROPA
                'Boac', 'Buenavista', 'Gasan', 'Mogpog', 'Santa Cruz', 'Torrijos',
                'Mamburao', 'Abra de Ilog', 'Calintaan', 'Looc', 'Lubang', 'Magsaysay', 'Paluan', 'Rizal', 'Sablayan', 'San Jose', 'Santa Cruz',
                'Calapan', 'Baco', 'Bansud', 'Bongabon', 'Bulalacao', 'Gloria', 'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera', 'Roxas', 'San Teodoro', 'Socorro', 'Victoria',
                'Puerto Princesa', 'Aborlan', 'Agutaya', 'Araceli', 'Balabac', 'Bataraza', 'Brooke\'s Point', 'Busuanga', 'Cagayancillo', 'Coron', 'Culion', 'Cuyo', 'Dumaran', 'El Nido', 'Kalayaan', 'Linapacan', 'Magsaysay', 'Narra', 'Quezon', 'Rizal', 'Roxas', 'San Vicente', 'Sofronio Española', 'Taytay',
                'Romblon', 'Alcantara', 'Banton', 'Cajidiocan', 'Calatrava', 'Concepcion', 'Corcuera', 'Ferrol', 'Looc', 'Magdiwang', 'Odiongan', 'San Agustin', 'San Andres', 'San Fernando', 'San Jose', 'Santa Fe', 'Santa Maria',
                // Bicol Region
                'Legazpi', 'Bacacay', 'Camalig', 'Daraga', 'Guinobatan', 'Jovellar', 'Libon', 'Ligao', 'Malilipot', 'Malinao', 'Manito', 'Oas', 'Pio Duran', 'Polangui', 'Rapu-Rapu', 'Santo Domingo', 'Tabaco', 'Tiwi',
                'Daet', 'Basud', 'Capalonga', 'Jose Panganiban', 'Labo', 'Mercedes', 'Paracale', 'San Lorenzo Ruiz', 'San Vicente', 'Santa Elena', 'Talisay', 'Vinzons',
                'Naga', 'Iriga', 'Baao', 'Balatan', 'Bato', 'Bombon', 'Buhi', 'Bula', 'Cabusao', 'Calabanga', 'Camaligan', 'Canaman', 'Caramoan', 'Del Gallego', 'Gainza', 'Garchitorena', 'Goa', 'Lagonoy', 'Libmanan', 'Lupi', 'Magarao', 'Milaor', 'Minalabac', 'Nabua', 'Ocampo', 'Pamplona', 'Pasacao', 'Pili', 'Presentacion', 'Ragay', 'Sagñay', 'San Fernando', 'San Jose', 'Sipocot', 'Siruma', 'Tigaon', 'Tinambac',
                'Virac', 'Bagamanoc', 'Baras', 'Bato', 'Caramoran', 'Gigmoto', 'Pandan', 'Panganiban', 'San Andres', 'San Miguel', 'Viga',
                'Masbate City', 'Aroroy', 'Baleno', 'Balud', 'Batuan', 'Cataingan', 'Cawayan', 'Claveria', 'Dimasalang', 'Esperanza', 'Mandaon', 'Milagros', 'Mobo', 'Monreal', 'Palanas', 'Pio V. Corpuz', 'Placer', 'San Fernando', 'San Jacinto', 'San Pascual', 'Uson',
                'Sorsogon City', 'Barcelona', 'Bulan', 'Bulusan', 'Casiguran', 'Castilla', 'Donsol', 'Gubat', 'Irosin', 'Juban', 'Magallanes', 'Matnog', 'Pilar', 'Prieto Diaz', 'Santa Magdalena'
            ],
            
            // Specific provinces from image
            'Batangas': ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Malvar', 'Balayan', 'Calaca', 'Lemery', 'Nasugbu', 'Taal', 'Talisay', 'Tuy', 'Agoncillo', 'Alitagtag', 'Balete', 'Bauan', 'Calatagan', 'Cuenca', 'Ibaan', 'Laurel', 'Lian', 'Lobo', 'Mabini', 'Mataasnakahoy', 'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Nicolas', 'San Pascual', 'Santa Teresita', 'Taysan', 'Tingloy'],
            'Bulacan': ['Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 'Guiguinto', 'Pulilan', 'Plaridel', 'Santa Maria', 'Balagtas', 'Angat', 'Baliuag', 'Bulakan', 'Bustos', 'Calumpit', 'Doña Remedios Trinidad', 'Hagonoy', 'Norzagaray', 'Obando', 'Pandi', 'Paombong', 'San Ildefonso', 'San Miguel', 'San Rafael'],
            'Cavite': ['Bacoor', 'Imus', 'Dasmarinas', 'Tagaytay', 'Trece Martires', 'General Trias', 'Kawit', 'Noveleta', 'Rosario', 'Silang', 'Alfonso', 'Amadeo', 'Carmona', 'Cavite City', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'Indang', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Tanza', 'Ternate'],
            'Laguna': ['Calamba', 'San Pedro', 'Santa Rosa', 'Biñan', 'Cabuyao', 'San Pablo', 'Los Baños', 'Sta. Cruz', 'Pila', 'Liliw', 'Alaminos', 'Bay', 'Calauan', 'Cavinti', 'Famy', 'Kalayaan', 'Luisiana', 'Lumban', 'Mabitac', 'Magdalena', 'Majayjay', 'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 'Pangil', 'Rizal', 'Siniloan', 'Victoria'],
            'Pampanga': ['San Fernando', 'Angeles', 'Mabalacat', 'Mexico', 'Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang', 'Masantol', 'Minalin', 'Porac', 'San Luis', 'San Simon', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Sasmuan'],
            'Rizal': ['Antipolo', 'Taytay', 'Cainta', 'Angono', 'Binangonan', 'Montalban', 'San Mateo', 'Marikina', 'Pasig', 'Taguig', 'Baras', 'Cardona', 'Jala-Jala', 'Morong', 'Pililla', 'Rodriguez', 'Tanay', 'Teresa']
        };
        
        const cities = fallbackData[province] || [];
        return cities.map(city => ({
            value: city,
            label: city
        }));
    };

    // Fetch barangays for selected city using Google Places API
    const fetchBarangays = async (city, province) => {
        console.log('Fetching barangays for city:', city, 'province:', province);
        setIsLoadingBarangays(true);
        setLocationError(null);
        
        try {
            // For now, always use fallback data to ensure it works
            // TODO: Re-enable Google Places API once it's properly configured
            const fallbackBarangays = getFallbackBarangays(city);
            console.log('Fallback barangays for', city, ':', fallbackBarangays);
            setBarangays(fallbackBarangays);
            
            // Check if Google Places API is available (disabled for now)
            if (false && window.google && autocompleteServiceRef.current) {
                // Use Google Places Autocomplete for barangays
                const request = {
                    input: `${city} barangays ${province} Philippines`,
                    types: ['establishment', 'point_of_interest'],
                    componentRestrictions: { country: 'ph' },
                    fields: ['name', 'formatted_address', 'address_components']
                };

                autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
                    console.log('Google Places API response for barangays:', { status, predictions });
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        // Filter and process barangays
                        const barangayList = predictions
                            .filter(prediction => {
                                const address = prediction.description.toLowerCase();
                                return address.includes(city.toLowerCase()) && 
                                       address.includes(province.toLowerCase());
                            })
                            .map(prediction => ({
                                value: prediction.description,
                                label: prediction.description
                            }))
                            .slice(0, 20); // Limit to 20 barangays
                        
                        console.log('Filtered barangays:', barangayList);
                        setBarangays(barangayList);
                    } else {
                        // Fallback to predefined barangays
                        const fallbackBarangays = getFallbackBarangays(city);
                        console.log('Using fallback barangays:', fallbackBarangays);
                        setBarangays(fallbackBarangays);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching barangays:', error);
            setLocationError('Failed to load barangays');
            // Fallback to predefined barangays
            const fallbackBarangays = getFallbackBarangays(city);
            setBarangays(fallbackBarangays);
        } finally {
            setIsLoadingBarangays(false);
        }
    };

    // Fallback barangays for major cities
    const getFallbackBarangays = (city) => {
        const fallbackData = {
            // NCR Barangays
            'Manila': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Alicia', 'Amihan', 'Apolonio Samson', 'Baesa', 'Bagbag', 'Bagong Silangan', 'Bagong Pag-asa', 'Bahay Toro', 'Balingasa', 'Balong Bato', 'Bungad', 'Camp Aguinaldo', 'Central', 'Claro', 'Damaso', 'Diliman', 'E. Rodriguez', 'East Kamias', 'Escopa', 'Fairview', 'Holy Spirit', 'Katipunan', 'Loyola Heights', 'Malaya', 'Marilag', 'Masagana', 'Matandang Balara', 'Milagrosa', 'Pansol', 'Philam', 'Pinagkaisahan', 'Pinyahan', 'Project 4', 'Quirino 3-A', 'Quirino 3-B', 'Roxas', 'Sacred Heart', 'Salvacion', 'San Antonio', 'San Isidro', 'San Martin de Porres', 'San Roque', 'Santa Cruz', 'Santa Lucia', 'Santa Monica', 'Santo Cristo', 'Santo Domingo', 'Santo Niño', 'Sikatuna Village', 'Silangan', 'Socorro', 'St. Ignatius', 'St. Peter', 'Tagumpay', 'Tatalon', 'Teachers Village East', 'Teachers Village West', 'Ugong Norte', 'Unang Sigaw', 'Valencia', 'Vasra', 'Veterans Village', 'Villa Maria Clara', 'West Kamias', 'White Plains'],
            'Quezon City': ['Alicia', 'Amihan', 'Apolonio Samson', 'Baesa', 'Bagbag', 'Bagong Silangan', 'Bagong Pag-asa', 'Bahay Toro', 'Balingasa', 'Balong Bato'],
            'Makati': ['Ayala', 'Bel-Air', 'Cembo', 'Comembo', 'Dasmariñas', 'Forbes Park', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Kasilawan', 'La Paz'],
            'Taguig': ['Bagumbayan', 'Bambang', 'Calzada', 'Hagonoy', 'Ibayo-Tipas', 'Ligid-Tipas', 'Lower Bicutan', 'Maharlika Village', 'Napindan', 'New Lower Bicutan'],
            'Caloocan': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Bagong Silang', 'Camarin', 'Libis', 'Maypajo', 'Sangandaan'],
            'Las Piñas': ['Almanza Uno', 'Almanza Dos', 'CAA-BF International', 'Daniel Fajardo', 'Elias Aldana', 'Ilaya', 'Manuyo Uno', 'Manuyo Dos', 'Pamplona Uno', 'Pamplona Dos'],
            'Malabon': ['Acacia', 'Baritan', 'Bayan-Bayanan', 'Catmon', 'Concepcion', 'Dampalit', 'Flores', 'Hulong Duhat', 'Ibaba', 'Longos'],
            'Mandaluyong': ['Addition Hills', 'Bagong Silang', 'Barangka Drive', 'Barangka Ibaba', 'Barangka Ilaya', 'Barangka Itaas', 'Buayang Bato', 'Burol', 'Daang Bakal', 'Hagdang Bato Itaas'],
            'Marikina': ['Barangay I (Jesus)', 'Barangay II (Concepcion)', 'Barangay III (San Roque)', 'Barangay IV (Santo Niño)', 'Barangay V (Santa Elena)', 'Barangay VI (San Jose)', 'Barangay VII (San Miguel)', 'Barangay VIII (San Antonio)', 'Barangay IX (San Isidro)', 'Barangay X (San Gabriel)'],
            'Muntinlupa': ['Alabang', 'Ayala Alabang', 'Bayanan', 'Buli', 'Cupang', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan', 'New Alabang'],
            'Navotas': ['Bagumbayan North', 'Bagumbayan South', 'Bangkulasi', 'Daanghari', 'Navotas East', 'Navotas West', 'North Bay Boulevard North', 'North Bay Boulevard South', 'San Jose', 'San Rafael Village'],
            'Parañaque': ['Baclaran', 'BF Homes', 'Don Bosco', 'La Huerta', 'Marcelo Green', 'Merville', 'Moonwalk', 'San Antonio', 'San Dionisio', 'San Isidro'],
            'Pasay': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10'],
            'Pasig': ['Bagong Ilog', 'Bagong Katipunan', 'Bambang', 'Buting', 'Caniogan', 'Dela Paz', 'Kalawaan', 'Kapasigan', 'Kapitolyo', 'Malinao'],
            'Pateros': ['Aguho', 'Magtanggol', 'San Pedro', 'San Roque', 'Santo Rosario', 'Sta. Ana', 'Sta. Cruz', 'Sta. Elena', 'Sto. Rosario Kanluran', 'Tabacalera'],
            'San Juan': ['Balong-Bato', 'Batino', 'Corazon de Jesus', 'Ermitaño', 'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse'],
            'Valenzuela': ['Arkong Bato', 'Balangkas', 'Bignay', 'Bisig', 'Canumay East', 'Canumay West', 'Coloong', 'Dalandanan', 'Gen. T. de Leon', 'Isla'],
            'Bacoor': ['Alima', 'Aniban I', 'Aniban II', 'Aniban III', 'Aniban IV', 'Aniban V', 'Banalo', 'Bayanan', 'Camposanto', 'Daang Bukid'],
            'Imus': ['Alapan I-A', 'Alapan I-B', 'Alapan I-C', 'Alapan II-A', 'Alapan II-B', 'Anabu I-A', 'Anabu I-B', 'Anabu I-C', 'Anabu I-D', 'Anabu I-E'],
            'Dasmarinas': ['Burol I', 'Burol II', 'Burol III', 'Emmanuel Bergado I', 'Emmanuel Bergado II', 'Emmanuel Bergado III', 'Fatima I', 'Fatima II', 'Fatima III', 'Fatima IV'],
            'Tagaytay': ['Bagong Silang', 'Calvary Hill', 'Francisco', 'Guinhawa', 'Iruhin East', 'Iruhin West', 'Kaybagal North', 'Kaybagal South', 'Maharlika East', 'Maharlika West'],
            'Calamba': ['Bagong Kalsada', 'Banadero', 'Banlic', 'Barandal', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI'],
            'San Pedro': ['Bagong Silang', 'Calendola', 'Cuyab', 'Estrella', 'Guyong', 'Landayan', 'Langgam', 'Laram', 'Magsaysay', 'Narra'],
            'Santa Rosa': ['Aplaya', 'Balibago', 'Caingin', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Kanluran', 'Labas', 'Macabling'],
            'Antipolo': ['Bagong Nayon', 'Beverly Hills', 'Cupang', 'Dalig', 'Dela Paz', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntindilaw', 'San Isidro'],
            'Taytay': ['Dolores', 'San Juan', 'San Isidro', 'San Antonio', 'Muzon', 'Santa Ana', 'San Jose', 'Santo Niño', 'San Miguel', 'San Roque'],
            
            // Batangas Province Cities
            'Batangas City': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24'],
            'Lipa': ['Adya', 'Anilao', 'Anilao-Labac', 'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Cumba', 'Dagatan', 'Duhatan', 'Halang', 'Inosloban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Marawoy', 'Marauoy', 'Mataas na Lupa', 'Munting Pulo', 'Pagolingin Bata', 'Pagolingin East', 'Pagolingin West', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Poblacion Barangay 8', 'Poblacion Barangay 9', 'Poblacion Barangay 10', 'Poblacion Barangay 11', 'Poblacion Barangay 12', 'Pusil', 'Quezon', 'Sabang', 'Sampaguita', 'San Benito', 'San Carlos', 'San Celestino', 'San Francisco', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian', 'Santo Niño', 'Santo Toribio', 'Sapac', 'Sico', 'Talisay', 'Tambo', 'Tangob', 'Tanguay', 'Tibig', 'Tipacan'],
            'Tanauan': ['Altura Bata', 'Altura Matanda', 'Ambulong', 'Balele', 'Banjo East', 'Banjo Laurel', 'Banjo West', 'Bilog-bilog', 'Boot', 'Bugaan East', 'Bugaan West', 'Bulihan', 'Cale', 'Darasa', 'Gonzales', 'Hidalgo', 'Janopol Eastern', 'Janopol Oriental', 'Laurel', 'Luyos', 'Malaking Pulo', 'Maria Paz', 'Montana', 'Natatas', 'Pagaspas', 'Pantay Bata', 'Pantay Matanda', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Sala', 'Sambat', 'San Jose', 'Santol', 'Sulpoc', 'Suplang', 'Talahib Pandayan', 'Talahib Payapa', 'Trapiche', 'Ulango', 'Wawa'],
            
            // Bulacan Province Cities
            'Malolos': ['Anilao', 'Atlag', 'Babatnin', 'Bagna', 'Bagong Nayon', 'Balayong', 'Balite', 'Bangkal', 'Barihan', 'Bulihan', 'Bungahan', 'Caingin', 'Calero', 'Caliligawan', 'Canalate', 'Caniogan', 'Catmon', 'Cofradia', 'Dakila', 'Guinhawa', 'Liang', 'Ligas', 'Longos', 'Look 1st', 'Look 2nd', 'Lugam', 'Mabolo', 'Mahabang Parang', 'Masile', 'Matimbo', 'Mojon', 'Namayan', 'Niugan', 'Pamarawan', 'Panasahan', 'Pinagbakahan', 'San Agustin', 'San Gabriel', 'San Juan', 'San Pablo', 'San Vicente', 'Santa Ana', 'Santa Rosa', 'Santiago', 'Santissima Trinidad', 'Santo Cristo', 'Santo Rosario', 'Sumapang Bata', 'Sumapang Matanda', 'Taal', 'Tikay'],
            'Meycauayan': ['Bagbaguin', 'Bahay Pare', 'Bancal', 'Banga', 'Bayugo', 'Calvario', 'Camalig', 'Hulo', 'Iba', 'Langka', 'Lawa', 'Libtong', 'Liputan', 'Longos', 'Malhacan', 'Pajo', 'Pandayan', 'Pantoc', 'Perez', 'Poblacion', 'Saluysoy', 'Tugatog', 'Ubihan', 'Zamora'],
            
            // Cavite Province Cities  
            'Bacoor': ['Alima', 'Aniban I', 'Aniban II', 'Aniban III', 'Aniban IV', 'Aniban V', 'Banalo', 'Bayanan', 'Camposanto', 'Daang Bukid', 'Daang Hari', 'Digman', 'Dulong Bayan', 'Ginintuang Silangan', 'Habay I', 'Habay II', 'Kaingin', 'Ligas I', 'Ligas II', 'Ligas III', 'Mabolo I', 'Mabolo II', 'Mabolo III', 'Maliksi I', 'Maliksi II', 'Maliksi III', 'Molino I', 'Molino II', 'Molino III', 'Molino IV', 'Molino V', 'Molino VI', 'Molino VII', 'Niog I', 'Niog II', 'Niog III', 'Panapaan I', 'Panapaan II', 'Panapaan III', 'Panapaan IV', 'Panapaan V', 'Panapaan VI', 'Panapaan VII', 'Panapaan VIII', 'Queen\'s Row Central', 'Queen\'s Row East', 'Queen\'s Row West', 'Real I', 'Real II', 'Salinas I', 'Salinas II', 'Salinas III', 'San Nicolas I', 'San Nicolas II', 'San Nicolas III', 'Springville', 'Tabing Dagat', 'Talaba I', 'Talaba II', 'Talaba III', 'Talaba IV', 'Talaba V', 'Talaba VI', 'Talaba VII', 'Villa Rosario', 'Zapote I', 'Zapote II', 'Zapote III', 'Zapote IV', 'Zapote V'],
            'Imus': ['Alapan I-A', 'Alapan I-B', 'Alapan I-C', 'Alapan II-A', 'Alapan II-B', 'Anabu I-A', 'Anabu I-B', 'Anabu I-C', 'Anabu I-D', 'Anabu I-E', 'Anabu I-F', 'Anabu I-G', 'Anabu I-H', 'Anabu I-I', 'Anabu I-J', 'Anabu II-A', 'Anabu II-B', 'Anabu II-C', 'Anabu II-D', 'Anabu II-E', 'Anabu II-F', 'Bayan Luma I', 'Bayan Luma II', 'Bayan Luma III', 'Bayan Luma IV', 'Bayan Luma V', 'Bayan Luma VI', 'Bayan Luma VII', 'Bayan Luma VIII', 'Bayan Luma IX', 'Bucandala I', 'Bucandala II', 'Bucandala III', 'Bucandala IV', 'Bucandala V', 'Malagasang I-A', 'Malagasang I-B', 'Malagasang I-C', 'Malagasang I-D', 'Malagasang I-E', 'Malagasang I-F', 'Malagasang I-G', 'Malagasang II-A', 'Malagasang II-B', 'Malagasang II-C', 'Malagasang II-D', 'Malagasang II-E', 'Malagasang II-F', 'Medicion I-A', 'Medicion I-B', 'Medicion I-C', 'Medicion I-D', 'Medicion II-A', 'Medicion II-B', 'Medicion II-C', 'Medicion II-D', 'Medicion II-E', 'Medicion II-F', 'Pag-asa I', 'Pag-asa II', 'Pag-asa III', 'Palico I', 'Palico II', 'Palico III', 'Palico IV', 'Poblacion I-A', 'Poblacion I-B', 'Poblacion I-C', 'Poblacion II-A', 'Poblacion II-B', 'Poblacion III-A', 'Poblacion III-B', 'Poblacion IV-A', 'Poblacion IV-B', 'Poblacion IV-C', 'Poblacion IV-D', 'Tangduhan', 'Tanzang Luma I', 'Tanzang Luma II', 'Tanzang Luma III', 'Tanzang Luma IV', 'Tanzang Luma V', 'Tanzang Luma VI', 'Toclong I-A', 'Toclong I-B', 'Toclong I-C', 'Toclong II-A', 'Toclong II-B'],
            
            // Laguna Province Cities
            'Calamba': ['Bagong Kalsada', 'Banadero', 'Banlic', 'Barandal', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI', 'Barangay VII', 'Batino', 'Bunggo', 'Burol', 'Camaligan', 'Canlubang', 'Halang', 'Hornalan', 'Kay-Anlog', 'Laguna', 'Lawa', 'Lecheria', 'Lingga', 'Looc', 'Mabato', 'Majada Labas', 'Majada Out', 'Makiling', 'Mapagong', 'Masili', 'Maunong', 'Mayapa', 'Milagrosa', 'Paciano Rizal', 'Palingon', 'Palo-Alto', 'Pansol', 'Parian', 'Poblacion', 'Punta', 'Puting Lupa', 'Real', 'Saimsim', 'Sampiruhan', 'San Cristobal', 'San Jose', 'San Juan', 'Sirang Lupa', 'Sucol', 'Turbina', 'Ulango', 'Uwisan'],
            'San Pedro': ['Bagong Silang', 'Calendola', 'Cuyab', 'Estrella', 'Guyong', 'Landayan', 'Langgam', 'Laram', 'Magsaysay', 'Narra', 'Nueva', 'Pacita I', 'Pacita II', 'Poblacion', 'Riverside', 'Rosario', 'Sacred Heart', 'Sampaguita Village', 'San Antonio', 'San Jose', 'San Roque', 'San Vicente', 'Santo Niño', 'United Bayanihan', 'United Better Living'],
            'Santa Rosa': ['Aplaya', 'Balibago', 'Caingin', 'Dila', 'Dita', 'Don Jose', 'Ibaba', 'Kanluran', 'Labas', 'Macabling', 'Malusak', 'Market Area', 'Pooc', 'Pulong Santa Cruz', 'Santo Domingo', 'Sinalhan', 'Tagapo'],
            
            // Pampanga Province Cities
            'San Fernando': ['Alasas', 'Baliti', 'Bulaon', 'Calulut', 'Dela Paz Norte', 'Dela Paz Sur', 'Dolores', 'Juliana', 'Lara', 'Lourdes', 'Magliman', 'Malino', 'Maimpis', 'Malpitic', 'Panipuan', 'Poblacion', 'Pulung Bulu', 'Quebiawan', 'San Agustin', 'San Felipe', 'San Isidro', 'San Jose', 'San Juan', 'San Nicolas', 'San Pedro', 'Santa Lucia', 'Santa Teresita', 'Santo Niño', 'Santo Rosario', 'Sindalan', 'Telabastagan'],
            'Angeles': ['Agapito del Rosario', 'Amsic', 'Balibago', 'Capaya', 'Claro M. Recto', 'Cuayan', 'Cutcut', 'Cutud', 'Lourdes Northwest', 'Lourdes Sur', 'Lourdes Sur East', 'Malabanias', 'Margot', 'Mining', 'Ninoy Aquino', 'Pampang', 'Pulung Cacutud', 'Pulung Maragul', 'Salapungan', 'San Jose', 'San Nicolas', 'Santa Teresita', 'Santa Trinidad', 'Santo Cristo', 'Santo Domingo', 'Sapalibutad', 'Sapangbato', 'Tabun', 'Timog', 'Uli', 'Virgen delos Remedios'],
            
            // Rizal Province Cities
            'Antipolo': ['Bagong Nayon', 'Beverly Hills', 'Cupang', 'Dalig', 'Dela Paz', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntindilaw', 'San Isidro', 'San Jose', 'San Juan', 'San Luis', 'San Roque', 'Santa Cruz', 'Santo Niño', 'Taktak'],
            'Taytay': ['Dolores', 'San Juan', 'San Isidro', 'San Antonio', 'Muzon', 'Santa Ana', 'San Jose', 'Santo Niño', 'San Miguel', 'San Roque'],
            'Cainta': ['Dayap', 'Karangalan', 'San Andres', 'San Isidro', 'San Juan', 'Santa Rosa']
        };
        
        const barangays = fallbackData[city] || [];
        return barangays.map(barangay => ({
            value: barangay,
            label: barangay
        }));
    };

    // Location dropdown handlers
    const handleProvinceChange = (event) => {
        const province = event.target.value;
        setSelectedProvince(province);
        setSelectedCity('');
        setSelectedBarangay('');
        setCities([]);
        setBarangays([]);
        
        // Update contract state
        setContract(prev => ({
            ...prev,
            province: province,
            city: '',
            barangay: '',
            postalCode: ''
        }));

        if (province) {
            fetchCities(province);
        }
    };

    const handleCityChange = (event) => {
        const city = event.target.value;
        setSelectedCity(city);
        setSelectedBarangay('');
        setBarangays([]);
        
        // Update contract state
        setContract(prev => ({
            ...prev,
            city: city,
            barangay: '',
            postalCode: ''
        }));

        if (city && selectedProvince) {
            fetchBarangays(city, selectedProvince);
        }
    };

    const handleBarangayChange = (event) => {
        const barangay = event.target.value;
        setSelectedBarangay(barangay);
        
        // Generate a mock postal code based on the barangay selection
        // In a real implementation, you would use Google Places API to get the actual postal code
        const mockPostalCode = generateMockPostalCode(selectedProvince, selectedCity, barangay);
        
        setContract(prev => ({
            ...prev,
            barangay: barangay,
            postalCode: mockPostalCode
        }));
    };

    // Generate mock postal code based on location
    const generateMockPostalCode = (province, city, barangay) => {
        const postalCodeMap = {
            'NCR': {
                'Manila': '1000',
                'Quezon City': '1100',
                'Caloocan': '1400',
                'Las Piñas': '1740',
                'Makati': '1200',
                'Malabon': '1470',
                'Mandaluyong': '1550',
                'Marikina': '1800',
                'Muntinlupa': '1770',
                'Navotas': '1485',
                'Parañaque': '1700',
                'Pasay': '1300',
                'Pasig': '1600',
                'Pateros': '1620',
                'San Juan': '1500',
                'Taguig': '1630',
                'Valenzuela': '1440'
            },
            'North Luzon': {
                'Baguio': '2600',
                'Laoag': '2900',
                'Vigan': '2700',
                'Dagupan': '2400',
                'Tuguegarao': '3500',
                'Ilagan': '3300',
                'Bayombong': '3700',
                'Cabanatuan': '3100',
                'San Fernando (Pampanga)': '2000',
                'Tarlac City': '2300',
                'Olongapo': '2200',
                'Balanga': '2100',
                'Malolos': '3000',
                'Baler': '3200'
            },
            'South Luzon': {
                'Legazpi': '4500',
                'Naga': '4400',
                'Sorsogon City': '4700',
                'Puerto Princesa': '5300',
                'Calapan': '5200',
                'Mamburao': '5100',
                'Boac': '4900',
                'Romblon': '5500',
                'Lucena': '4300',
                'Tayabas': '4327',
                'Calauag': '4318',
                'Gumaca': '4303',
                'Sariaya': '4322',
                'Candelaria': '4323',
                'Dolores': '4326'
            },
            'Cavite': {
                'Bacoor': '4102',
                'Imus': '4103',
                'Dasmarinas': '4114',
                'Tagaytay': '4120'
            },
            'Laguna': {
                'Calamba': '4027',
                'San Pedro': '4023',
                'Santa Rosa': '4026'
            },
            'Rizal': {
                'Antipolo': '1870',
                'Taytay': '1920'
            }
        };
        
        return postalCodeMap[province]?.[city] || '0000';
    };

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
    const handlePickupAddressChange = (field, value) => { 
        setPickupAddress(prev => ({ ...prev, [field]: value })); 
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
        // Clear validation error for this field
        if (validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index][field]) {
            setValidationErrors(prev => ({
                ...prev,
                luggage: prev.luggage.map((formErrors, i) => 
                    i === index ? { ...formErrors, [field]: null } : formErrors
                )
            }));
        }
    };

    // Add function to add new passenger form
    const handleAddLuggageForm = () => {
        if (luggageForms.length < 15) {
            setLuggageForms(prev => [...prev, { name: "", flightNo: "", itemDescription: "", quantity: "" }]);
        }
    };

    // Add function to remove luggage form
    const handleRemoveLuggageForm = (index) => {
        setLuggageForms(prev => prev.filter((_, i) => i !== index));
    };


    // Validation function
    const validateForm = () => {
        const errors = {};

        // Validate pickup location
        if (!pickupAddress.location || pickupAddress.location.trim() === '') {
            errors.pickupLocation = 'Pickup location is required';
        }

        // Validate dropoff location
        if (!dropoffAddress.location || dropoffAddress.location.trim() === '') {
            errors.dropoffLocation = 'Drop-off location is required';
        }

        // Validate dropoff coordinates
        if (!dropoffAddress.lat || !dropoffAddress.lng) {
            errors.dropoffCoordinates = 'Please select a valid drop-off location on the map';
        }

        // Validate delivery address fields (from dropdowns)
        if (!contract.province || contract.province.trim() === '') {
            errors.province = 'Province is required';
        }
        if (!contract.city || contract.city.trim() === '') {
            errors.city = 'City/Municipality is required';
        }
        if (!contract.barangay || contract.barangay.trim() === '') {
            errors.barangay = 'Barangay is required';
        }
        if (!contract.postalCode || contract.postalCode.trim() === '') {
            errors.postalCode = 'Postal code is required';
        }
        if (!contract.addressLine1 || contract.addressLine1.trim() === '') {
            errors.addressLine1 = 'Address line 1 is required';
        }

        // Validate contact number
        if (!contract.contact || contract.contact.trim() === '') {
            errors.contact = 'Contact number is required';
        } else if (!/^\+63\s\d{3}\s\d{3}\s\d{4}$/.test(contract.contact.trim())) {
            errors.contact = 'Contact number must be in format: +63 XXX XXX XXXX';
        }

        // Validate luggage forms
        const luggageErrors = [];
        luggageForms.forEach((form, index) => {
            const formErrors = {};
            
            if (!form.name || form.name.trim() === '') {
                formErrors.name = 'Name is required';
            }
            if (!form.caseNumber || form.caseNumber.trim() === '') {
                formErrors.caseNumber = 'Case number is required';
            }
            if (!form.flightNo || form.flightNo.trim() === '') {
                formErrors.flightNo = 'Flight number is required';
            }
            if (!form.itemDescription || form.itemDescription.trim() === '') {
                formErrors.itemDescription = 'Item description is required';
            }
            if (!form.weight || form.weight.trim() === '') {
                formErrors.weight = 'Weight is required';
            } else if (Number(form.weight) <= 0 || Number(form.weight) > 100) {
                formErrors.weight = 'Weight must be between 0.1 and 100 kg';
            }
            if (!form.quantity || form.quantity.trim() === '') {
                formErrors.quantity = 'Quantity is required';
            } else if (Number(form.quantity) < 1 || Number(form.quantity) > 10) {
                formErrors.quantity = 'Quantity must be between 1 and 10';
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

    // Modify handleSubmit to handle multiple luggage forms
    const handleSubmit = async () => { 
        // Clear previous validation errors
        setValidationErrors({});
        
        // Validate form
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
                    // Delivery address fields
                    delivery_address: [
                        contract.province,
                        contract.city,
                        contract.barangay,
                        contract.postalCode
                    ].filter(Boolean).join(', '),
                    address_line_1: contract.addressLine1 || null,
                    address_line_2: contract.addressLine2 || null,
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

            setSnackbarMessage('Booking created successfully!');
            setSnackbarOpen(true);
            // Reset form
            setContract({ 
                province: "", 
                city: "", 
                addressLine1: "", 
                addressLine2: "", 
                barangay: "", 
                postalCode: "", 
                contact: "" 
            }); // Only keep address and contact in the main contract
            setLuggageForms([{ name: "", flightNo: "", itemDescription: "", quantity: "" }]);
            setPickupAddress({ location: "", addressLine1: "", addressLine2: "", province: "", city: "", barangay: "", postalCode: "" });
            setDropoffAddress({ location: null, lat: null, lng: null });
            // Reset location dropdowns
            setSelectedProvince('');
            setSelectedCity('');
            setSelectedBarangay('');
            setCities([]);
            setBarangays([]);
            setLocationError(null);
            // Clear validation errors
            setValidationErrors({});
            // Switch to contract list tab and refresh
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
                        luggage_quantity,
                        flight_number,
                        delivery_address,
                        address_line_1,
                        address_line_2,
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
                                                            Contact Number: <span>{contract.owner_contact || 'N/A'}</span>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Address: <span>{contract.delivery_address || 'N/A'}</span>
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
                            <FormControl fullWidth size="small" required error={!!validationErrors.pickupLocation}>
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
                                {validationErrors.pickupLocation && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                        {validationErrors.pickupLocation}
                                    </Typography>
                                )}
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
                            {locationError && (
                                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                                    {locationError}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={provinces}
                                    value={provinces.find(province => province.value === selectedProvince) || null}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            handleProvinceChange({ target: { value: newValue.value } });
                                        } else {
                                            handleProvinceChange({ target: { value: '' } });
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        // Allow typing and searching
                                        if (newInputValue) {
                                            setSelectedProvince(newInputValue);
                                            setSelectedCity('');
                                            setSelectedBarangay('');
                                            setCities([]);
                                            setBarangays([]);
                                            
                                            // Update contract state
                                            setContract(prev => ({
                                                ...prev,
                                                province: newInputValue,
                                                city: '',
                                                barangay: '',
                                                postalCode: ''
                                            }));
                                            
                                            // Fetch cities for the typed province
                                            fetchCities(newInputValue);
                                        }
                                    }}
                                    getOptionLabel={(option) => option.label || option}
                                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                                    disabled={provinces.length === 0}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Province"
                                            required
                                            error={!!validationErrors.province}
                                            helperText={validationErrors.province}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.value}>
                                            {option.label}
                                        </li>
                                    )}
                                    ListboxProps={{
                                        style: {
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }
                                    }}
                                    freeSolo
                                    selectOnFocus
                                    clearOnBlur
                                    handleHomeEndKeys
                                />
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={cities}
                                    value={cities.find(city => city.value === selectedCity) || null}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            handleCityChange({ target: { value: newValue.value } });
                                        } else {
                                            handleCityChange({ target: { value: '' } });
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        // Allow typing and searching
                                        if (newInputValue) {
                                            setSelectedCity(newInputValue);
                                            setSelectedBarangay('');
                                            setBarangays([]);
                                            
                                            // Update contract state
                                            setContract(prev => ({
                                                ...prev,
                                                city: newInputValue,
                                                barangay: '',
                                                postalCode: ''
                                            }));
                                            
                                            // Fetch barangays for the typed city
                                            if (selectedProvince) {
                                                fetchBarangays(newInputValue, selectedProvince);
                                            }
                                        }
                                    }}
                                    getOptionLabel={(option) => option.label || option}
                                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                                    disabled={cities.length === 0 || isLoadingCities}
                                    loading={isLoadingCities}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="City/Municipality"
                                            required
                                            error={!!validationErrors.city}
                                            helperText={validationErrors.city}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoadingCities ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.value}>
                                            {option.label}
                                        </li>
                                    )}
                                    ListboxProps={{
                                        style: {
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }
                                    }}
                                    freeSolo
                                    selectOnFocus
                                    clearOnBlur
                                    handleHomeEndKeys
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={barangays}
                                    value={barangays.find(barangay => barangay.value === selectedBarangay) || null}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            handleBarangayChange({ target: { value: newValue.value } });
                                        } else {
                                            handleBarangayChange({ target: { value: '' } });
                                        }
                                    }}
                                    onInputChange={(event, newInputValue) => {
                                        // Allow typing and searching
                                        if (newInputValue) {
                                            setSelectedBarangay(newInputValue);
                                            
                                            // Update contract state
                                            setContract(prev => ({
                                                ...prev,
                                                barangay: newInputValue,
                                                postalCode: generateMockPostalCode(selectedProvince, selectedCity, newInputValue)
                                            }));
                                        }
                                    }}
                                    getOptionLabel={(option) => option.label || option}
                                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                                    disabled={barangays.length === 0 || isLoadingBarangays}
                                    loading={isLoadingBarangays}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Barangay"
                                            required
                                            error={!!validationErrors.barangay}
                                            helperText={validationErrors.barangay}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoadingBarangays ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.value}>
                                            {option.label}
                                        </li>
                                    )}
                                    ListboxProps={{
                                        style: {
                                            maxHeight: 300,
                                            overflow: 'auto'
                                        }
                                    }}
                                    freeSolo
                                    selectOnFocus
                                    clearOnBlur
                                    handleHomeEndKeys
                                />
                                <TextField 
                                    label="Postal Code" 
                                    fullWidth 
                                    size="small" 
                                    value={contract.postalCode || ""} 
                                    onChange={(e) => {
                                        setContract(prev => ({
                                            ...prev,
                                            postalCode: e.target.value
                                        }));
                                    }}
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
                                label="Address Line 2 (Optional)" 
                                fullWidth 
                                size="small" 
                                value={contract.addressLine2 || ""} 
                                onChange={(e) => handleInputChange("addressLine2", e.target.value.slice(0, 200))} 
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
                    <Paper elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 3, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Passenger Information</Typography>
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
                                    Passenger {index + 1}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <TextField 
                                        label="Name" 
                                        fullWidth 
                                        size="small" 
                                        value={form.name} 
                                        onChange={(e) => handleLuggageFormChange(index, "name", e.target.value.slice(0, 100))} 
                                        required 
                                        error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].name)}
                                        helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].name}
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
                                        label="Item Description" 
                                        fullWidth 
                                        size="small" 
                                        value={form.itemDescription} 
                                        onChange={(e) => handleLuggageFormChange(index, "itemDescription", e.target.value.slice(0, 200))} 
                                        required 
                                        error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].itemDescription)}
                                        helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].itemDescription}
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
                                            error={!!validationErrors.contact}
                                            helperText={validationErrors.contact}
                                            placeholder="+63 XXX XXX XXXX"
                                            sx={{ width: '40%' }}
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
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow alphanumeric characters and limit to 8 characters
                                                const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
                                                handleLuggageFormChange(index, "flightNo", alphanumericValue);
                                            }} 
                                            required 
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].flightNo)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].flightNo}
                                            sx={{ width: '30%' }} 
                                            inputProps={{ 
                                                maxLength: 8,
                                                pattern: '^[a-zA-Z0-9]{1,8}$'
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
                                                if (value === '' || (Number(value) >= 1 && Number(value) <= 3)) {
                                                    handleLuggageFormChange(index, "quantity", value);
                                                }
                                            }} 
                                            required 
                                            error={!!(validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].quantity)}
                                            helperText={validationErrors.luggage && validationErrors.luggage[index] && validationErrors.luggage[index].quantity}
                                            sx={{ width: '30%' }}
                                            inputProps={{ 
                                                min: 1,
                                                max: 3,
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
                            disabled={luggageForms.length >= 15}
                            sx={{ mt: 2 }}
                        >
                            Add Another Passenger
                        </Button>
                    </Paper>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
                        </Button>
                    </Box>
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
            </>)}
        </Box>
    );
}