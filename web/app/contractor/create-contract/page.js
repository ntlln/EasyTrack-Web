"use client";

import { useState } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Grid, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
    const supabase = createClientComponentClient();
    // Theme and state setup
    const theme = useTheme();
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
        location: ""
    });

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

    // Styles
    const pageContainerStyles = { minHeight: "100vh", bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 2 };
    const contractFormStyles = { maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" };
    const deleteButtonStyles = { position: "absolute", top: 8, right: 8, color: theme.palette.grey[600] };
    const clearButtonStyles = { bgcolor: "#4a4a4a", color: "#fff", "&:hover": { bgcolor: "#333" } };
    const formContainerStyles = { display: "flex", flexDirection: "column", gap: 2, mb: 2 };
    const buttonContainerStyles = { display: "flex", justifyContent: "center", mt: 2 };
    const bottomButtonContainerStyles = { display: "flex", justifyContent: "center", mt: 4, gap: 2 };
    const brandContainerStyles = { display: "flex", justifyContent: "center", gap: 4, mt: 2 };

    return (
        <Box sx={pageContainerStyles}>
            <Typography variant="h4" fontWeight="bold" color="primary.main" mb={2}>Booking</Typography>

            <Box>
                <Paper elevation={3} sx={contractFormStyles}>
                    <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Pickup Location</Typography>
                    <Box sx={formContainerStyles}>
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
                            <>
                                <TextField
                                    label="Address Line 1"
                                    fullWidth
                                    size="small"
                                    value={pickupAddress.addressLine1}
                                    onChange={(e) => handlePickupAddressChange("addressLine1", e.target.value)}
                                />
                                <TextField
                                    label="Address Line 2"
                                    fullWidth
                                    size="small"
                                    value={pickupAddress.addressLine2}
                                    onChange={(e) => handlePickupAddressChange("addressLine2", e.target.value)}
                                />
                                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            label="Province"
                                            fullWidth
                                            size="small"
                                            value={pickupAddress.province}
                                            onChange={(e) => handlePickupAddressChange("province", e.target.value)}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            label="City"
                                            fullWidth
                                            size="small"
                                            value={pickupAddress.city}
                                            onChange={(e) => handlePickupAddressChange("city", e.target.value)}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            label="Barangay"
                                            fullWidth
                                            size="small"
                                            value={pickupAddress.barangay}
                                            onChange={(e) => handlePickupAddressChange("barangay", e.target.value)}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            label="Postal Code"
                                            fullWidth
                                            size="small"
                                            value={pickupAddress.postalCode}
                                            onChange={(e) => handlePickupAddressChange("postalCode", e.target.value)}
                                        />
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>
                </Paper>

                <Paper elevation={3} sx={{ ...contractFormStyles, mt: 3 }}>
                    <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Drop-off Location</Typography>
                    <Box sx={formContainerStyles}>
                        <TextField
                            label="Drop-off Location"
                            fullWidth
                            size="small"
                            placeholder="Select drop-off location"
                            value={dropoffAddress.location}
                            onChange={(e) => handleDropoffAddressChange("location", e.target.value)}
                        />
                    </Box>
                </Paper>

                {contracts.map((contract, index) => (
                    <Paper key={index} elevation={3} sx={contractFormStyles}>
                        <IconButton size="small" onClick={() => deleteContract(index)} sx={deleteButtonStyles} aria-label="delete form"><CloseIcon /></IconButton>
                        <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information {index + 1}</Typography>

                        <Box sx={formContainerStyles}>
                            <TextField 
                                label="Case Number" 
                                fullWidth 
                                size="small" 
                                value={contract.caseNumber} 
                                onChange={(e) => handleInputChange(index, "caseNumber", e.target.value)} 
                            />
                            <TextField 
                                label="Name" 
                                fullWidth 
                                size="small" 
                                value={contract.name} 
                                onChange={(e) => handleInputChange(index, "name", e.target.value)} 
                            />
                            <TextField 
                                label="Item Description" 
                                fullWidth 
                                size="small" 
                                value={contract.itemDescription} 
                                onChange={(e) => handleInputChange(index, "itemDescription", e.target.value)} 
                            />
                            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField 
                                        label="Contact Number" 
                                        fullWidth 
                                        size="small" 
                                        value={contract.contact} 
                                        onChange={(e) => handleInputChange(index, "contact", e.target.value)} 
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <TextField 
                                        label="Weight (kg)" 
                                        fullWidth 
                                        size="small" 
                                        value={contract.weight} 
                                        onChange={(e) => handleInputChange(index, "weight", e.target.value)} 
                                    />
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={buttonContainerStyles}>
                            <Button variant="contained" size="small" sx={clearButtonStyles} onClick={() => clearSingleContract(index)}>Clear Contract</Button>
                        </Box>
                    </Paper>
                ))}

                <Box sx={bottomButtonContainerStyles}>
                    <Button variant="outlined" onClick={addContract}>Add Another Form</Button>
                    <Button variant="contained" onClick={handleSubmit}>Send Contract</Button>
                </Box>
            </Box>

            <Box textAlign="center" mt={6}>
                <Typography variant="h6" fontWeight="bold">Partnered with:</Typography>
                <Box sx={brandContainerStyles}>
                    <Image src="/brand-3.png" alt="AirAsia" width={60} height={60} />
                </Box>
            </Box>
        </Box>
    );
}