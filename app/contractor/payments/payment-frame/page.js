"use client";

import { Box, Typography, Paper, Button, TextField, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";

export default function Page() {
    const theme = useTheme();

    // Styles
    const containerStyles = { height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" };
    const headerStyles = { px: 4, pt: 4 };
    const contentStyles = { flexGrow: 0.5, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" };
    const paperStyles = { width: "100%", maxWidth: 600, borderRadius: 3, p: 4 };
    const sectionStyles = { mb: 4 };
    const cardContainerStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2 };
    const addButtonStyles = { backgroundColor: "success.main", textTransform: "none", "&:hover": { backgroundColor: "success.dark" } };
    const inputContainerStyles = { display: "flex", gap: 2, mb: 2 };
    const billingAddressStyles = { mb: 4 };
    const buttonContainerStyles = { display: "flex", justifyContent: "space-between" };
    const cancelButtonStyles = { bgcolor: "#4a4a4a", color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#333" } };
    const payButtonStyles = { textTransform: "none" };

    return (
        <Box sx={containerStyles}>
            <Box sx={headerStyles}>
                <Typography variant="h3" fontWeight="bold" color="primary.main">Payment</Typography>
            </Box>

            <Box sx={contentStyles}>
                <Paper elevation={2} sx={paperStyles}>
                    <Box sx={sectionStyles}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>Payment Method</Typography>

                        <Box sx={cardContainerStyles}>
                            <Box>
                                <Typography fontWeight="bold">VISA **** 4242</Typography>
                                <Typography variant="body2" color="text.secondary">Expires 08/2025</Typography>
                            </Box>
                            <Typography fontWeight="bold" color="primary.main">Default</Typography>
                        </Box>

                        <Button startIcon={<AddIcon />} variant="contained" sx={addButtonStyles}>Add Payment Method</Button>
                    </Box>

                    <Box>
                        <Typography variant="h6" fontWeight="bold" mb={2}>Billing Details</Typography>

                        <Box sx={inputContainerStyles}>
                            <TextField fullWidth size="small" label="Name on Card" placeholder="e.g., Jose Dela Cruz" />
                            <TextField fullWidth size="small" label="Email" placeholder="e.g., jose@example.com" />
                        </Box>

                        <TextField fullWidth size="small" label="Billing Address" placeholder="e.g., 123 Main St." sx={billingAddressStyles} />
                    </Box>

                    <Box sx={buttonContainerStyles}>
                        <Button variant="contained" startIcon={<CancelIcon />} sx={cancelButtonStyles}>Cancel Payment</Button>
                        <Button variant="contained" color="success" endIcon={<PaymentIcon />} sx={payButtonStyles}>Pay</Button>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}