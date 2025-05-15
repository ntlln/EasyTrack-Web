"use client";

import { useState } from "react";
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";

export default function ContractingPage() {
    const theme = useTheme();
    const [itemCount, setItemCount] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [contracts, setContracts] = useState([]);

    const handleCountSubmit = () => {
        const count = parseInt(inputValue);
        if (!isNaN(count) && count > 0) {
            setItemCount(count);
            setContracts(Array.from({ length: count }, () => ({ name: "", contact: "", luggage: "", address: "", image: null })));
        }
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
        updatedContracts[index] = { name: "", contact: "", luggage: "", address: "", image: null };
        setContracts(updatedContracts);
    };

    const deleteContract = (index) => {
        const updatedContracts = contracts.filter((_, i) => i !== index);
        setContracts(updatedContracts);
        setItemCount(updatedContracts.length);
    };

    const addContract = () => {
        setContracts([...contracts, { name: "", contact: "", luggage: "", address: "", image: null }]);
        setItemCount(contracts.length + 1);
    };

    const handleSubmit = () => {
        console.log(contracts);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, color: theme.palette.text.primary, p: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="primary.main" mb={2}>Contracting</Typography>

            {!itemCount ? (
                <Paper elevation={3} sx={{ maxWidth: 400, mx: "auto", p: 4, borderRadius: 3, backgroundColor: theme.palette.background.paper, textAlign: "center" }}>
                    <Typography variant="h6" mb={2}>How many items do you want to contract?</Typography>
                    <TextField type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
                    <Button variant="contained" onClick={handleCountSubmit}>Proceed</Button>
                </Paper>
            ) : (
                <Box>
                    {contracts.map((contract, index) => (
                        <Paper key={index} elevation={3} sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 4, pt: 2, borderRadius: 3, backgroundColor: theme.palette.background.paper, position: "relative" }}>
                            <IconButton size="small" onClick={() => deleteContract(index)} sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.grey[600] }} aria-label="delete form">
                                <CloseIcon />
                            </IconButton>

                            <Typography variant="h6" fontWeight="bold" align="center" mb={3}>Delivery Information {index + 1}</Typography>

                            <Box display="flex" flexDirection="column" gap={2} mb={2}>
                                <TextField label="Name" fullWidth size="small" value={contract.name} onChange={(e) => handleInputChange(index, "name", e.target.value)} />
                                <TextField label="Contact" fullWidth size="small" value={contract.contact} onChange={(e) => handleInputChange(index, "contact", e.target.value)} />
                                <TextField label="Luggage Information" fullWidth size="small" value={contract.luggage} onChange={(e) => handleInputChange(index, "luggage", e.target.value)} />
                                <TextField label="House/ Unit/ Bldg No./ Street/ Barangay" fullWidth size="small" value={contract.address} onChange={(e) => handleInputChange(index, "address", e.target.value)} />
                                <Box>
                                    <Typography variant="body2" mb={1}>Upload Image</Typography>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(index, e.target.files[0])} />
                                    {contract.image && <Typography variant="body2" mt={1}>Selected file: {contract.image.name}</Typography>}
                                </Box>
                            </Box>

                            <Box display="flex" justifyContent="center" mt={2}>
                                <Button variant="contained" size="small" sx={{ bgcolor: "#4a4a4a", color: "#fff", "&:hover": { bgcolor: "#333" } }} onClick={() => clearSingleContract(index)}>Clear Contract</Button>
                            </Box>
                        </Paper>
                    ))}

                    <Box display="flex" justifyContent="center" mt={4} gap={2}>
                        <Button variant="outlined" onClick={addContract}>Add Another Form</Button>
                        <Button variant="contained" onClick={handleSubmit}>Send Contract</Button>
                    </Box>
                </Box>
            )}

            <Box textAlign="center" mt={6}>
                <Typography variant="h6" fontWeight="bold">Contracting as:</Typography>
                <Box display="flex" justifyContent="center" gap={4} mt={2}>
                    <Image src="/brand-3.png" alt="AirAsia" width={60} height={60} />
                    <Image src="/brand-4.png" alt="Philippine Airlines" width={60} height={60} />
                    <Image src="/brand-5.png" alt="Cebu Pacific" width={60} height={60} />
                </Box>
            </Box>
        </Box>
    );
}