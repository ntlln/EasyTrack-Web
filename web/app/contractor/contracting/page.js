"use client";

import { Box, Typography, TextField, Button, Paper, useTheme } from "@mui/material";
import Image from "next/image";

export default function ContractingPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: theme.palette.background.default,
                color: theme.palette.text.primary,
                p: 2,
            }}
        >
            <Typography variant="h3" fontWeight="bold" color="primary.main" mb={2}>
                Contracting
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    maxWidth: 700,
                    mx: "auto",
                    p: 4,
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                }}
            >
                <Typography variant="h6" fontWeight="bold" align="center" mb={3}>
                    Delivery Information
                </Typography>

                <Box display="flex" flexDirection="column" gap={2} mb={2}>
                    <Box>
                        <Typography mb={1}>Name</Typography>
                        <TextField fullWidth size="small" />
                    </Box>
                    <Box>
                        <Typography mb={1}>Contact</Typography>
                        <TextField fullWidth size="small" />
                    </Box>
                    <Box>
                        <Typography mb={1}>Luggage Information</Typography>
                        <TextField fullWidth size="small" />
                    </Box>
                    <Box>
                        <Typography mb={1}>Item</Typography>
                        <TextField fullWidth size="small" />
                    </Box>
                    <Box>
                        <Typography mb={1}>House/ Unit/ Bldg No./ Street/ Barangay</Typography>
                        <TextField fullWidth size="small" />
                    </Box>
                </Box>

                <Box display="flex" justifyContent="center" mt={4} gap={2}>
                    <Button variant="contained" sx={{ bgcolor: "#4a4a4a", color: "#fff", "&:hover": { bgcolor: "#333" } }}>
                        Clear Contract
                    </Button>
                    <Button variant="contained">
                        Send Contract
                    </Button>
                </Box>
            </Paper>

            <Box textAlign="center" mt={6}>
                <Typography variant="h6" fontWeight="bold">
                    Contracting as:
                </Typography>
                <Box display="flex" justifyContent="center" gap={4} mt={2}>
                    <Image src="/brand-3.png" alt="AirAsia" width={60} height={60} />
                    <Image src="/brand-4.png" alt="Philippine Airlines" width={60} height={60} />
                    <Image src="/brand-5.png" alt="Cebu Pacific" width={60} height={60} />
                </Box>
            </Box>
        </Box>
    );
}
