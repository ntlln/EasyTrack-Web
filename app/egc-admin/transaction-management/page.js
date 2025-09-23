"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, Menu, MenuItem, CircularProgress, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Collapse, TextField, Snackbar, Alert, Tabs, Tab, FormControl, InputLabel, Select } from '@mui/material';
import { useRouter } from 'next/navigation';

import MoreVertIcon from '@mui/icons-material/MoreVert';
/* Removed unused ChevronLeftIcon */
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import { CombinedSOAInvoicePDF as CombinedPDFTemplate } from '../../../utils/pdf-templates';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { format as formatDateFns } from 'date-fns';
/* Removed unused VisibilityIcon */

// Register fonts from local public/fonts directory
// Use a simple approach to avoid browser compatibility issues
try {
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: '/fonts/Roboto-VariableFont_wdth,wght.ttf',
            fontWeight: 'normal',
            fontStyle: 'normal',
        },
        {
            src: '/fonts/Roboto-VariableFont_wdth,wght.ttf',
            fontWeight: 'bold',
            fontStyle: 'normal',
        },
        {
            src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf',
            fontWeight: 'normal',
            fontStyle: 'italic',
        },
        {
            src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf',
            fontWeight: 'bold',
            fontStyle: 'italic',
        },
    ],
});
} catch (error) {
    // Font already registered, ignore error
    console.log('Roboto font already registered or error occurred:', error.message);
}

try {
Font.register({
    family: 'NotoSans',
    src: 'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNb4g.woff2',
});
} catch (error) {
    // Font already registered, ignore error
    console.log('NotoSans font already registered or error occurred:', error.message);
}

// Utility: format date for table
const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

// PDF Receipt component
const ReceiptPDF = ({ contracts = [], dateRange }) => {
    // Ensure contracts is always an array and has valid data
    const safeContracts = React.useMemo(() => {
        if (!Array.isArray(contracts)) return [];
        return contracts.filter(c => c && typeof c === 'object');
    }, [contracts]);

    // If no valid contracts, return empty document
    if (safeContracts.length === 0) {
        return (
            <Document>
                <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>No contracts selected</Text>
                    </View>
                </PDFPage>
            </Document>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } catch { return 'N/A'; }
    };

    // Calculate totals safely
    const subtotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_charge) || 0), 0);
    const surchargeTotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_surcharge || c.surcharge) || 0), 0);
    const discountTotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_discount || c.discount) || 0), 0);
    const getRowAmount = (c) => {
        const delivery_charge = Number(c.delivery_charge) || 0;
        const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
        const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
        return Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
    };
    const totalAmount = safeContracts.reduce((sum, c) => sum + getRowAmount(c), 0);

    return (
        <Document>
            <PDFPage size="A4" style={{ padding: 12, fontSize: 8, fontFamily: 'Roboto' }}>
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>GHE TRANSMITTAL - AIRPORT CLIENTS PROPERTY IRREGULARITY SUMMARY REPORT</Text>
                    <Text style={{ fontSize: 12, marginTop: 2 }}>{dateRange || 'No date range specified'}</Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' }}>
                        <Text style={{ flex: 0.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>No.</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Tracking ID</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Invoice No.</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Luggage Owner</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Flight No.</Text>
                        <Text style={{ flex: 2.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Address</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Date Received</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Status</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Amount</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Remarks</Text>
                    </View>
                    {safeContracts.map((c, idx) => (
                        <View key={c.id || idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                            <Text style={{ flex: 0.5, padding: 2, fontSize: 8 }}>{idx + 1}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.id}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{c.summary_id || 'N/A'}</Text>
                            <Text style={{ flex: 2, padding: 2, fontSize: 8 }}>{c.owner_first_name || c.owner_middle_initial || c.owner_last_name ? `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.flight_number || 'N/A'}</Text>
                            <Text style={{ flex: 2.5, padding: 2, fontSize: 8 }}>{c.drop_off_location || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{formatDate(c.delivered_at || c.created_at)}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{c.contract_status?.status_name || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{getRowAmount(c).toFixed(2)}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.contract_status?.status_name === 'Delivery Failed' ? 'Delivery Failed' : ''}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Subtotal:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{subtotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Surcharge Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{surchargeTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Discount Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{discountTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: '#000', backgroundColor: '#eee' }}>
                        <Text style={{ flex: 10.5, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>TOTAL</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ fontSize: 8 }}>Received by: _______________, Date: _______________</Text>
                        <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 8 }}>AIRLINE'S REPRESENTATIVE</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 8 }}>GENERATED ON: {formatDate(new Date().toISOString())}</Text>
                        <Text style={{ fontSize: 8 }}>*************SUBMITTED ALL ORIGINAL SIGNED PIR*****</Text>
                        <Text style={{ fontSize: 8 }}>Total PIR submitted: {safeContracts.length}</Text>
                    </View>
                </View>
            </PDFPage>
        </Document>
    );
};

// --- INVOICE PDF COMPONENT (BASIC FORMAT) ---
const InvoicePDF = ({ contracts = [], invoiceNumber = null }) => {
    const today = new Date();
    const todayFormatted = formatDateFns(today, 'MMMM d, yyyy');
    const invoiceNo = invoiceNumber || formatDateFns(today, 'yyyyMMdd');
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dueDate = formatDateFns(monthEnd, 'MMMM d, yyyy');
    const desc = `PIR Luggage Delivery – ${formatDateFns(monthStart, 'MMMM d, yyyy')} to ${formatDateFns(monthEnd, 'MMMM d, yyyy')}`;
    // Compute totals (VAT included in subtotal; VAT is not added on top)
    const subtotal = contracts.reduce((sum, c) => {
        const delivery_charge = Number(c.delivery_charge) || 0;
        const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
        const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
        return sum + Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
    }, 0);
    const vat = subtotal * 0.12;
    const totalAmount = subtotal; // Amount due is VAT-inclusive; do not add VAT on top
    return (
        <Document>
            <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto', position: 'relative' }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: '#2d3991', fontSize: 12 }}>GREEN HANGAR EMISSION TESTING CENTER</Text>
                        <Text style={{ fontWeight: 'bold', color: '#2d3991', fontSize: 10 }}>PROPRIETOR: JONALIZ L. CABALUNA</Text>
                        <Text style={{ fontSize: 9 }}>ATAYDE ST. BRGY.191 PASAY CITY</Text>
                        <Text style={{ fontSize: 9 }}>VAT REG. TIN: 234-449-892-00000</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 10 }}>BILL TO PHILLIPINES AIR ASIA INC.</Text>
                        <Text style={{ fontSize: 9 }}>2ND LEVEL MEZZANINE</Text>
                        <Text style={{ fontSize: 9 }}>AREA NAIA T3, PASAY CITY</Text>
                        <Text style={{ fontSize: 9 }}>TIN# 005-838-00016</Text>
                        <Text style={{ fontSize: 9, marginTop: 4 }}>DATE      {todayFormatted}</Text>
                        <Text style={{ fontSize: 9 }}>SOA #     {invoiceNo}</Text>
                    </View>
                </View>
                <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 8 }}>SALES INVOICE NO. {invoiceNo}</Text>
                {/* Terms Table */}
                <View style={{ flexDirection: 'row', backgroundColor: '#2d3991', color: 'white', fontWeight: 'bold', fontSize: 9 }}>
                    <Text style={{ flex: 1, padding: 4 }}>TERMS</Text>
                    <Text style={{ flex: 1, padding: 4 }}>PAYMENT METHOD</Text>
                    <Text style={{ flex: 1, padding: 4 }}>DUE DATE</Text>
                </View>
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#2d3991', fontSize: 9 }}>
                    <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}>30 DAYS</Text>
                    <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}>DOMESTIC FUNDS TRANSFER</Text>
                    <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}>{dueDate}</Text>
                </View>
                {/* Invoice Table */}
                <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#2d3991', color: 'white', fontWeight: 'bold', fontSize: 9 }}>
                        <Text style={{ flex: 0.5, padding: 4 }}>QTY</Text>
                        <Text style={{ flex: 1, padding: 4 }}>UNIT</Text>
                        <Text style={{ flex: 4, padding: 4 }}>DESCRIPTION</Text>
                        <Text style={{ flex: 1, padding: 4 }}>AMOUNT</Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#2d3991', fontSize: 9 }}>
                        <Text style={{ flex: 0.5, padding: 4, backgroundColor: '#f7f3d6' }}>{safeContracts.length}</Text>
                        <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}>PCS</Text>
                        <Text style={{ flex: 4, padding: 4, backgroundColor: '#f7f3d6' }}>{desc}</Text>
                        <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}>₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                    {/* Empty rows for formatting */}
                    {[...Array(7)].map((_, i) => (
                        <View key={i} style={{ flexDirection: 'row', fontSize: 9 }}>
                            <Text style={{ flex: 0.5, padding: 4, backgroundColor: '#f7f3d6' }}></Text>
                            <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}></Text>
                            <Text style={{ flex: 4, padding: 4, backgroundColor: '#f7f3d6' }}></Text>
                            <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}></Text>
                        </View>
                    ))}
                    {/* Note row */}
                    <View style={{ flexDirection: 'row', fontSize: 9 }}>
                        <Text style={{ flex: 6.5, padding: 4, backgroundColor: '#f7f3d6', fontWeight: 'bold' }}>Note: All Original Documents are Included in this statement</Text>
                        <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6' }}></Text>
                    </View>
                    {/* Total row */}
                    <View style={{ flexDirection: 'row', fontSize: 9 }}>
                        <Text style={{ flex: 6.5, padding: 4, backgroundColor: '#f7f3d6', fontWeight: 'bold', textAlign: 'right' }}>Total Amount Due:</Text>
                        <Text style={{ flex: 1, padding: 4, backgroundColor: '#f7f3d6', fontWeight: 'bold' }}>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </View>
                </View>
                {/* Footer Notes */}
                <Text style={{ fontSize: 9, marginTop: 8, fontWeight: 'bold' }}>Note: Please make check payable to JONALIZ L. CABALUNA</Text>
                {/* Summary Box */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                    <View style={{ width: 180, borderWidth: 1, borderColor: '#2d3991', padding: 8 }}>
                        <Text style={{ fontSize: 9 }}>RCBC ACCT NUMBER: 7591033191</Text>
                        <Text style={{ fontSize: 9 }}>VATABLE: {`₱${(subtotal - vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>VAT EXEMPT:</Text>
                        <Text style={{ fontSize: 9 }}>ZERO RATED:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL SALES:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL VAT: {`₱${vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>AMOUNT DUE: {`₱${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                    </View>
                </View>
                {/* Footer Signature Block - Always at the bottom */}
                <View style={{
                    position: 'absolute',
                    left: 24,
                    right: 24,
                    bottom: 24,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}>
                    <View>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#2d3991' }}>Prepared by: K. SAMKIAN</Text>
                        <Text style={{ fontSize: 8 }}>Revenue Supervisor</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#2d3991' }}>CHECKED BY: J.LARA</Text>
                        <Text style={{ fontSize: 8 }}>ACCOUNTING</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#2d3991' }}>RECEIVED BY: ___________</Text>
                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#2d3991' }}>DATE: {todayFormatted}</Text>
                    </View>
                </View>
            </PDFPage>
        </Document>
    );
};

// --- COMBINED SOA AND INVOICE PDF COMPONENT ---
const CombinedSOAInvoicePDF = ({ contracts = [], dateRange, invoiceNumber = null, proofOfDeliveryData = {} }) => {
    // Add error boundary and validation
    try {
    const today = new Date();
    const todayFormatted = formatDateFns(today, 'MMMM d, yyyy');
    const invoiceNo = invoiceNumber || formatDateFns(today, 'yyyyMMdd');
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dueDate = formatDateFns(monthEnd, 'MMMM d, yyyy');
    const desc = `PIR Luggage Delivery – ${formatDateFns(monthStart, 'MMMM d, yyyy')} to ${formatDateFns(monthEnd, 'MMMM d, yyyy')}`;
        
        // Ensure contracts is an array
        const safeContracts = Array.isArray(contracts) ? contracts : [];
        const soaNumber = (safeContracts[0] && (safeContracts[0].summary_id || safeContracts[0].summaryId)) || invoiceNo;
    
    // Calculate totals safely
        // Totals for SOA (VAT is included in totals; do not add on top)
        const subtotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_charge) || 0), 0);
        const surchargeTotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_surcharge || c.surcharge) || 0), 0);
        const discountTotal = safeContracts.reduce((sum, c) => sum + (Number(c.delivery_discount || c.discount) || 0), 0);
    const getRowAmount = (c) => {
        const delivery_charge = Number(c.delivery_charge) || 0;
        const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
        const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
        return Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
    };
        const totalAmount = safeContracts.reduce((sum, c) => sum + getRowAmount(c), 0);
    const vat = totalAmount * 0.12;
        const finalTotal = totalAmount; // Amount due equals total; VAT not added on top

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } catch { return 'N/A'; }
    };

    return (
        <Document>
            {/* First Page - Invoice */}
            <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12 }}>GREEN HANGAR EMISSION TESTING CENTER</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 10 }}>PROPRIETOR: JONALIZ L. CABALUNA</Text>
                        <Text style={{ fontSize: 9 }}>ATAYDE ST. BRGY.191 PASAY CITY</Text>
                        <Text style={{ fontSize: 9 }}>VAT REG. TIN: 234-449-892-00000</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 10 }}>BILL TO</Text>
                        <Text style={{ fontSize: 9 }}>PHILIPPINES AIR ASIA INC.</Text>
                        <Text style={{ fontSize: 9 }}>2ND LEVEL MEZZANINE</Text>
                        <Text style={{ fontSize: 9 }}>AREA NAIA T3, PASAY CITY</Text>
                        <Text style={{ fontSize: 9 }}>TIN# 005-838-00016</Text>
                    </View>
                </View>
                <View style={{ borderTopWidth: 1, borderColor: '#000', marginVertical: 10 }} />
                {/* Date and SOA row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>DATE:&nbsp;</Text>
                        <Text style={{ fontSize: 9 }}>{todayFormatted}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>SOA #:&nbsp;</Text>
                        <Text style={{ fontSize: 9 }}>{soaNumber}</Text>
                    </View>
                </View>
                <Text style={{ fontWeight: 'bold', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>SALES INVOICE NO. {invoiceNo}</Text>
                {/* Terms Table */}
                <View style={{ flexDirection: 'row', fontWeight: 'bold', fontSize: 9, borderWidth: 1, borderColor: '#000' }}>
                    <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>TERMS</Text>
                    <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>PAYMENT METHOD</Text>
                    <Text style={{ flex: 1, padding: 4 }}>DUE DATE</Text>
                </View>
                <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000' }}>
                    <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>30 DAYS</Text>
                    <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>DOMESTIC FUND TRANSFER</Text>
                    <Text style={{ flex: 1, padding: 4 }}>{dueDate}</Text>
                </View>
                {/* Invoice Table */}
                <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', fontWeight: 'bold', fontSize: 9, borderWidth: 1, borderColor: '#000' }}>
                        <Text style={{ flex: 0.5, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>QTY</Text>
                        <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>UNIT</Text>
                        <Text style={{ flex: 4, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>DESCRIPTION</Text>
                        <Text style={{ flex: 1, padding: 4 }}>TOTAL AMOUNT DUE</Text>
                    </View>
                    <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', minHeight: 20, alignItems: 'center' }}>
                        <Text style={{ flex: 0.5, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>{safeContracts.length}</Text>
                        <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>PCS</Text>
                        <Text style={{ flex: 4, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>{`PIRs Luggage Delivery - (${formatDateFns(monthStart, 'dd/MM/yyyy')} to ${formatDateFns(monthEnd, 'dd/MM/yyyy')})`}</Text>
                        <Text style={{ flex: 1, padding: 4 }}>PHP</Text>
                    </View>
                    {[...Array(7)].map((_, i) => (
                        <View key={i} style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', minHeight: 20, alignItems: 'center' }}>
                            <Text style={{ flex: 0.5, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                            <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                            <Text style={{ flex: 4, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                            <Text style={{ flex: 1, padding: 4 }}></Text>
                        </View>
                    ))}
                    {/* Note row - keep all column lines continuous; text in Description column */}
                    <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', minHeight: 20, alignItems: 'center' }}>
                        <Text style={{ flex: 0.5, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                        <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                        <Text style={{ flex: 4, padding: 4, borderRightWidth: 1, borderColor: '#000', fontWeight: 'bold' }}>Note: All Original Documents are Included in this statement</Text>
                        <Text style={{ flex: 1, padding: 4 }}></Text>
                    </View>
                    {/* Total row - align with columns and remove extra horizontal divider below */}
                    <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', minHeight: 20, alignItems: 'center' }}>
                        <Text style={{ flex: 0.5, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                        <Text style={{ flex: 1, padding: 4, borderRightWidth: 1, borderColor: '#000' }}></Text>
                        <Text style={{ flex: 4, padding: 4, borderRightWidth: 1, borderColor: '#000', fontWeight: 'bold', textAlign: 'right' }}>Total Amount Due:</Text>
                        <Text style={{ flex: 1, padding: 4, fontWeight: 'bold' }}>{`₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                    </View>
                </View>
                <Text style={{ fontSize: 9, marginTop: 8, fontWeight: 'bold' }}>Note: Please make check payable to JONALIZ L. CABALUNA</Text>
                {/* Summary Box */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                    <View style={{ width: 180, borderWidth: 1, borderColor: '#000', padding: 8 }}>
                        <Text style={{ fontSize: 9 }}>RCBC ACCT NUMBER: 7591033191</Text>
                        <Text style={{ fontSize: 9 }}>VATABLE: {`₱${(totalAmount - vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>VAT EXEMPT:</Text>
                        <Text style={{ fontSize: 9 }}>ZERO RATED:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL SALES:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL VAT: {`₱${vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>AMOUNT DUE: {`₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                    </View>
                </View>
                {/* Signature lines */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>PREPARED BY:</Text>
                        <View style={{ borderBottomWidth: 1, borderColor: '#000', marginTop: 16 }} />
                    </View>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>CHECKED BY:</Text>
                        <View style={{ borderBottomWidth: 1, borderColor: '#000', marginTop: 16 }} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>RECEIVED BY:</Text>
                        <View style={{ borderBottomWidth: 1, borderColor: '#000', marginTop: 16 }} />
                    </View>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>DATE:</Text>
                        <View style={{ borderBottomWidth: 1, borderColor: '#000', marginTop: 16 }} />
                    </View>
                </View>
            </PDFPage>

            {/* Second Page - SOA */}
            <PDFPage size="A4" style={{ padding: 12, fontSize: 8, fontFamily: 'Roboto' }}>
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>GHE TRANSMITTAL - AIRPORT CLIENTS PROPERTY IRREGULARITY SUMMARY REPORT</Text>
                    <Text style={{ fontSize: 12, marginTop: 2 }}>{dateRange || 'No date range specified'}</Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' }}>
                        <Text style={{ flex: 0.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>No.</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Tracking ID</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Invoice No.</Text>
                        <Text style={{ flex: 2, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Luggage Owner</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Flight No.</Text>
                        <Text style={{ flex: 2.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Address</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Date Received</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Status</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Amount</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', padding: 2, fontSize: 8 }}>Remarks</Text>
                    </View>
                    {safeContracts.map((c, idx) => (
                        <View key={c.id || idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                            <Text style={{ flex: 0.5, padding: 2, fontSize: 8 }}>{idx + 1}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.id}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{c.summary_id || 'N/A'}</Text>
                            <Text style={{ flex: 2, padding: 2, fontSize: 8 }}>{c.owner_first_name || c.owner_middle_initial || c.owner_last_name ? `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() : 'N/A'}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.flight_number || 'N/A'}</Text>
                            <Text style={{ flex: 2.5, padding: 2, fontSize: 8 }}>{c.drop_off_location || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{formatDate(c.delivered_at || c.created_at)}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontSize: 8 }}>{c.contract_status?.status_name || 'N/A'}</Text>
                            <Text style={{ flex: 1.5, padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{getRowAmount(c).toFixed(2)}</Text>
                            <Text style={{ flex: 1, padding: 2, fontSize: 8 }}>{c.contract_status?.status_name === 'Delivery Failed' ? 'Delivery Failed' : ''}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Subtotal:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{subtotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Surcharge Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{surchargeTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f7f7f7' }}>
                        <Text style={{ flex: 9, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>Discount Total:</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{discountTotal.toFixed(2)}</Text>
                        <Text style={{ flex: 1 }}></Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: '#000', backgroundColor: '#eee' }}>
                        <Text style={{ flex: 10.5, fontWeight: 'bold', padding: 2, textAlign: 'right', fontSize: 8 }}>TOTAL</Text>
                        <Text style={{ flex: 1.5, fontWeight: 'bold', padding: 2, fontFamily: 'Roboto', fontSize: 8 }}>{'\u20B1\u00A0'}{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ fontSize: 8 }}>Received by: _______________, Date: _______________</Text>
                        <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 8 }}>AIRLINE'S REPRESENTATIVE</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 8 }}>GENERATED ON: {formatDate(new Date().toISOString())}</Text>
                        <Text style={{ fontSize: 8 }}>*************SUBMITTED ALL ORIGINAL SIGNED PIR*****</Text>
                        <Text style={{ fontSize: 8 }}>Total PIR submitted: {safeContracts.length}</Text>
                    </View>
                </View>
            </PDFPage>

            {/* Proof of Delivery Pages - One per contract */}
            {safeContracts.map((contract, index) => {
                const podData = proofOfDeliveryData[contract.id];
                const ownerName = contract.owner_first_name || contract.owner_middle_initial || contract.owner_last_name 
                    ? `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                    : 'N/A';
                
                return (
                    <PDFPage key={`pod-${contract.id}`} size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d3991' }}>PROOF OF DELIVERY</Text>
                            <Text style={{ fontSize: 12, marginTop: 4 }}>Contract ID: {contract.id}</Text>
                    </View>
                        
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Contract Details:</Text>
                            <View style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Contract ID: {contract.id}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Luggage Owner: {ownerName}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Flight Number: {contract.flight_number || 'N/A'}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Pickup Location: {contract.pickup_location || 'N/A'}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Drop-off Location: {contract.drop_off_location || 'N/A'}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Delivery Date: {formatDate(contract.delivered_at || contract.created_at)}</Text>
                                <Text style={{ fontSize: 10, marginBottom: 2 }}>Status: {contract.contract_status?.status_name || 'N/A'}</Text>
                    </View>
                </View>

                        {podData && podData.proof_of_delivery ? (
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Proof of Delivery Image:</Text>
                <View style={{
                                    width: '100%', 
                                    height: 400,
                                    border: '1px solid #ddd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <Image 
                                        src={podData.proof_of_delivery} 
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                        }} 
                                        cache={false}
                                    />
                    </View>
                                {podData.delivery_timestamp && (
                                    <Text style={{ fontSize: 10, marginTop: 8, color: '#666' }}>
                                        Delivered at: {formatDate(podData.delivery_timestamp)}
                                    </Text>
                                )}
                    </View>
                        ) : (
                            <View style={{ alignItems: 'center', marginBottom: 16, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                                <Text style={{ fontSize: 12, color: '#666' }}>No proof of delivery available for this contract</Text>
                    </View>
                        )}

                        {/* Removed signature/date/time section as requested */}
                    </PDFPage>
                );
            })}
        </Document>
    );
    } catch (error) {
        console.error('Error in CombinedSOAInvoicePDF:', error);
        return (
            <Document>
                <PDFPage size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'red' }}>Error generating PDF</Text>
                        <Text style={{ fontSize: 12, marginTop: 4 }}>Please try again or contact support</Text>
                </View>
            </PDFPage>
        </Document>
    );
    }
};

// Transaction management main logic
const TransactionManagement = () => {
    const router = useRouter();
    const [tabValue, setTabValue] = useState(0);
    const [selectedPricingType, setSelectedPricingType] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [priceValue, setPriceValue] = useState('');
    const [pricingRegions, setPricingRegions] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(true);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsContract, setDetailsContract] = useState(null);
    const [surchargeOpen, setSurchargeOpen] = useState(false);
    const [surchargeValue, setSurchargeValue] = useState('');
    const [surchargeLoading, setSurchargeLoading] = useState(false);
    const [surchargeError, setSurchargeError] = useState('');
    const [surchargeContract, setSurchargeContract] = useState(null);
    const [discountOpen, setDiscountOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState('');
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState('');
    const [discountContract, setDiscountContract] = useState(null);
    const [shouldRenderCombinedPDF, setShouldRenderCombinedPDF] = useState(false);
    const [combinedPDFData, setCombinedPDFData] = useState(null);
    const pdfDownloadRef = useRef(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [pricingTable, setPricingTable] = useState([]);
    const [loadingPricingTable, setLoadingPricingTable] = useState(true);
    const [pricingPage, setPricingPage] = useState(0);
    const [pricingRowsPerPage, setPricingRowsPerPage] = useState(10);
    const [selectedPricingRows, setSelectedPricingRows] = useState([]);
    const [regionFilter, setRegionFilter] = useState('');
    const [citySearch, setCitySearch] = useState('');
    // Add new state for edit price dialog
    const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
    const [editPriceValue, setEditPriceValue] = useState('');
    const [editPriceLoading, setEditPriceLoading] = useState(false);
    const [editPriceError, setEditPriceError] = useState('');
    const [selectedPricingRow, setSelectedPricingRow] = useState(null);
    // Add new state for confirmation dialog
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingPriceUpdate, setPendingPriceUpdate] = useState(null);
    
    
    // Add new state for complete confirmation dialog
    const [completeConfirmDialogOpen, setCompleteConfirmDialogOpen] = useState(false);
    const [pendingCompleteSummary, setPendingCompleteSummary] = useState(null);
    
    // Add new state for summarize confirmation dialog
    const [summarizeConfirmDialogOpen, setSummarizeConfirmDialogOpen] = useState(false);
    const [pendingSummarizeData, setPendingSummarizeData] = useState(null);

    const [podOpen, setPodOpen] = useState(false);
    const [podContract, setPodContract] = useState(null);
    const [podImage, setPodImage] = useState(null);
    const [podLoading, setPodLoading] = useState(false);
    const [podError, setPodError] = useState(null);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [summaries, setSummaries] = useState([]);
    const [loadingSummaries, setLoadingSummaries] = useState(false);
    const [summariesError, setSummariesError] = useState(null);
    const [summaryDateSpans, setSummaryDateSpans] = useState({});
    const [loadingDateSpans, setLoadingDateSpans] = useState(false);
    // Preview dialog state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewSummary, setPreviewSummary] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewKey, setPreviewKey] = useState(0);
    const [eSignatureDataUrl, setESignatureDataUrl] = useState(null);
    // Corporations map for airline_id -> corporation name
    const [corporationsById, setCorporationsById] = useState(new Map());
    const [corporationFilter, setCorporationFilter] = useState('');
    
    // Sorting state for Summary table
    const [summarySortField, setSummarySortField] = useState('due_date');
    const [summarySortDirection, setSummarySortDirection] = useState('desc');
    
    // Sorting state for Pending table
    const [pendingSortField, setPendingSortField] = useState('created_at');
    const [pendingSortDirection, setPendingSortDirection] = useState('desc');
    
    // Sorting state for Pricing Update table
    const [pricingSortField, setPricingSortField] = useState('region');
    const [pricingSortDirection, setPricingSortDirection] = useState('asc');

    // Data fetching
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/admin?action=allContracts');
                const json = await res.json();
                setData(json.data || []);
                // Fetch corporations list once to map corporation_id -> name
                try {
                    const corpRes = await fetch('/api/admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getAllCorporations' })
                    });
                    if (corpRes.ok) {
                        const corpJson = await corpRes.json();
                        const map = new Map((corpJson.corporations || []).map(c => [c.id, c.corporation_name]));
                        setCorporationsById(map);
                    }
                } catch {}
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Silent background refresh every 5 seconds for Pending (Pay) tab only
    useEffect(() => {
        if (tabValue !== 0) return; // Only refresh when Pay tab is active
        let cancelled = false;
        const controller = new AbortController();

        const mergeUpdatedContracts = (prev, next) => {
            const previousById = new Map(prev.map(row => [row.id, row]));
            let hasChanges = false;

            const merged = (Array.isArray(next) ? next : []).map(nextRow => {
                const prevRow = previousById.get(nextRow.id);
                if (!prevRow) { hasChanges = true; return nextRow; }

                const isSame = (
                    prevRow.updated_at === nextRow.updated_at &&
                    prevRow.delivery_surcharge === nextRow.delivery_surcharge &&
                    prevRow.delivery_discount === nextRow.delivery_discount &&
                    prevRow.contract_status_id === nextRow.contract_status_id &&
                    prevRow.delivered_at === nextRow.delivered_at &&
                    prevRow.cancelled_at === nextRow.cancelled_at &&
                    prevRow.pickup_at === nextRow.pickup_at &&
                    prevRow.summary_id === nextRow.summary_id
                );

                if (isSame) return prevRow; // preserve reference to avoid re-render
                hasChanges = true;
                return { ...prevRow, ...nextRow };
            });

            if (!hasChanges && merged.length === prev.length) return prev;
            return merged;
        };

        const refreshPendingQuietly = async () => {
            try {
                const res = await fetch('/api/admin?action=allContracts', { signal: controller.signal });
                if (!res.ok) return;
                const json = await res.json();
                if (cancelled) return;
                setData(prev => mergeUpdatedContracts(prev, json.data || []));
            } catch {}
        };

        const interval = setInterval(() => {
            refreshPendingQuietly();
        }, 5000);

        // initial silent refresh
        refreshPendingQuietly();

        return () => {
            cancelled = true;
            controller.abort();
            clearInterval(interval);
        };
    }, [tabValue]);

    // Fetch pricing regions
    useEffect(() => {
        const fetchPricingRegions = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'getPricingRegion'
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch pricing regions');
                }

                const data = await response.json();
                setPricingRegions(data.regions || []);
            } catch (error) {
                console.error('Error fetching pricing regions:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to load pricing regions',
                    severity: 'error'
                });
            } finally {
                setLoadingRegions(false);
            }
        };

        fetchPricingRegions();
    }, []);

    // Fetch cities when region changes
    useEffect(() => {
        if (!selectedLocation) {
            setCities([]);
            setSelectedCity('');
            return;
        }
        setLoadingCities(true);
        setSelectedCity('');
        const fetchCities = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getCitiesByRegion',
                        params: { region_id: selectedLocation }
                    })
                });
                if (!response.ok) throw new Error('Failed to fetch cities');
                const data = await response.json();
                setCities(data.cities || []);
            } catch (error) {
                setCities([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load cities',
                    severity: 'error'
                });
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, [selectedLocation]);

    // Fetch price when city changes
    useEffect(() => {
        if (!selectedCity) {
            setPriceValue('');
            return;
        }
        setLoadingPrice(true);
        const fetchPrice = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getPriceByCity',
                        params: { city_id: selectedCity }
                    })
                });
                if (!response.ok) throw new Error('Failed to fetch price');
                const data = await response.json();
                setPriceValue(data.price ?? '');
            } catch (error) {
                setPriceValue('');
                setSnackbar({
                    open: true,
                    message: 'Failed to load price',
                    severity: 'error'
                });
            } finally {
                setLoadingPrice(false);
            }
        };
        fetchPrice();
    }, [selectedCity]);

    // Fetch all pricing data for the table
    useEffect(() => {
        if (tabValue !== 2) return;
        setLoadingPricingTable(true);
        const fetchPricingTable = async () => {
            try {
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getAllPricing' })
                });
                if (!response.ok) throw new Error('Failed to fetch pricing table');
                const data = await response.json();
                setPricingTable(data.pricing || []);
            } catch (error) {
                setPricingTable([]);
                setSnackbar({
                    open: true,
                    message: 'Failed to load pricing table',
                    severity: 'error'
                });
            } finally {
                setLoadingPricingTable(false);
            }
        };
        fetchPricingTable();
    }, [tabValue]);

    // Filter data based on selected month using created_at
    // Additionally, only include contracts with Delivered or Delivery Failed statuses (IDs 5 and 6)
    const filteredData = React.useMemo(() => {
        // Show ALL delivered or failed contracts regardless of month
        return data.filter(contract => {
            const statusId = Number(contract.contract_status_id);
            const statusOk = statusId === 5 || statusId === 6;
            if (!statusOk) return false;
            if (!corporationFilter) return true;
            const corpName = corporationsById.get(contract.airline?.corporation_id) || '';
            return corpName === corporationFilter;
        });
    }, [data, corporationFilter, corporationsById]);

    // Helpers for selection lock (already summarized/invoiced)
    const isRowLocked = (row) => {
        // Lock selection if the contract already has a summary in contracts.summary_id
        return Boolean(row.summary_id);
    };
    const selectableFilteredData = React.useMemo(() => filteredData.filter(row => !isRowLocked(row)), [filteredData]);

    // Table and dialog handlers
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
    const handleMenuClick = (event, row) => { setAnchorEl(event.currentTarget); setSelectedRow(row); };
    const handleMenuClose = () => { setAnchorEl(null); setSelectedRow(null); };
    const handleAction = (action) => {
        if (action === 'view' && selectedRow) { setDetailsContract(selectedRow); setDetailsOpen(true); }
        else if (action === 'surcharge' && selectedRow) { setSurchargeContract(selectedRow); setSurchargeValue(selectedRow.delivery_surcharge || ''); setSurchargeError(''); setSurchargeOpen(true); }
        else if (action === 'discount' && selectedRow) { setDiscountContract(selectedRow); setDiscountValue(selectedRow.delivery_discount || ''); setDiscountError(''); setDiscountOpen(true); }
        else if (action === 'pod' && selectedRow) { 
            setPodContract(selectedRow); 
            setPodOpen(true);
            fetchProofOfDelivery(selectedRow.id);
        }
        handleMenuClose();
    };
    const handleDetailsClose = () => { setDetailsOpen(false); setDetailsContract(null); };
    const handleSurchargeClose = () => { setSurchargeOpen(false); setSurchargeValue(''); setSurchargeError(''); setSurchargeContract(null); };
    const isSurchargeValid = (val) => { const num = Number(val); return !isNaN(num) && num >= 0; };
    const handleSurchargeSubmit = async () => {
        if (!surchargeContract) return;
        if (!isSurchargeValid(surchargeValue)) { setSurchargeError('Surcharge must be 0 or a positive number.'); return; }
        setSurchargeLoading(true); setSurchargeError('');
        try {
            const res = await fetch('/api/admin', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    action: 'updatedelivery_Surcharge',
                    params: { 
                        contractId: surchargeContract.id, 
                        delivery_surcharge: Number(surchargeValue) 
                    }
                }) 
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update surcharge');
            setData((prev) => prev.map(row => {
                if (row.id !== surchargeContract.id) return row;
                const delivery_charge = Number(row.delivery_charge) || 0;
                const delivery_surcharge = Number(surchargeValue) || 0;
                const delivery_discount = Number(row.delivery_discount) || 0;
                const total = Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
                return { ...row, delivery_surcharge, total };
            }));
            handleSurchargeClose();
        } catch (err) { setSurchargeError(err.message || 'Failed to update surcharge'); } finally { setSurchargeLoading(false); }
    };
    const handleDiscountClose = () => { setDiscountOpen(false); setDiscountValue(''); setDiscountError(''); setDiscountContract(null); };
    const isDiscountValid = (val) => { const num = Number(val); return !isNaN(num) && num >= 0; };
    const handleDiscountSubmit = async () => {
        if (!discountContract) return;
        if (!isDiscountValid(discountValue)) { setDiscountError('Discount must be 0 or a positive number.'); return; }
        setDiscountLoading(true); setDiscountError('');
        try {
            const res = await fetch('/api/admin', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    action: 'updatedelivery_discount',
                    params: { 
                        contractId: discountContract.id, 
                        delivery_discount: Number(discountValue) 
                    }
                }) 
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update discount');
            setData((prev) => prev.map(row => {
                if (row.id !== discountContract.id) return row;
                const delivery_charge = Number(row.delivery_charge) || 0;
                const delivery_surcharge = Number(row.delivery_surcharge) || 0;
                const delivery_discount = Number(discountValue) || 0;
                const total = Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
                return { ...row, delivery_discount, total };
            }));
            handleDiscountClose();
        } catch (err) { setDiscountError(err.message || 'Failed to update discount'); } finally { setDiscountLoading(false); }
    };
    const isRowSelected = (id) => selectedRows.includes(id);
    const handleSelectRow = (id) => {
        const row = filteredData.find(r => r.id === id);
        if (row && isRowLocked(row)) return; // block selecting locked rows
        setSelectedRows((prev) => {
            const newSelection = prev.includes(id) 
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id];
            return newSelection;
        });
    };
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = selectableFilteredData.map((row) => row.id);
            setSelectedRows((prev) => Array.from(new Set([...prev, ...allIds])));
        } else {
            const monthIds = selectableFilteredData.map((row) => row.id);
            setSelectedRows((prev) => prev.filter((id) => !monthIds.includes(id)));
        }
    };
    const pageRows = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const selectablePageRows = pageRows.filter(row => !isRowLocked(row));
    const allPageRowsSelected = selectablePageRows.length > 0 && selectablePageRows.every((row) => selectedRows.includes(row.id));
    const somePageRowsSelected = selectablePageRows.some((row) => selectedRows.includes(row.id));
    const getSelectedContracts = () => {
        try {
            const selectedContracts = data.filter(row => selectedRows.includes(row.id));
            return selectedContracts.filter(contract => {
                const status = contract.contract_status?.status_name?.toLowerCase() || '';
                return status !== 'cancelled';
            });
        } catch (error) {
            console.error('Error getting selected contracts:', error);
            return [];
        }
    };


    const handleMonthChange = (newDate) => {
        setSelectedMonth(newDate);
        setSelectedRows([]); // Reset selection when month changes
        setPage(0); // Reset to first page when month changes
    };



    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        // Reset form when switching tabs
        if (newValue === 1) {
            setSelectedPricingType('');
            setSelectedLocation('');
            setPriceValue('');
        }
    };

    // Checkbox handlers
    const isPricingRowSelected = (id) => selectedPricingRows.includes(id);
    const handleSelectPricingRow = (id) => {
        setSelectedPricingRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };
    const handleSelectAllPricingRows = (event) => {
        if (event.target.checked) {
            const pageRowIds = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).map((row) => row.id);
            setSelectedPricingRows((prev) => Array.from(new Set([...prev, ...pageRowIds])));
        } else {
            const pageRowIds = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).map((row) => row.id);
            setSelectedPricingRows((prev) => prev.filter((id) => !pageRowIds.includes(id)));
        }
    };
    const allPagePricingRowsSelected = pricingTable.length > 0 && pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).every((row) => selectedPricingRows.includes(row.id));
    const somePagePricingRowsSelected = pricingTable.slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage).some((row) => selectedPricingRows.includes(row.id));

    // Get unique regions for filter
    const uniqueRegions = Array.from(new Set(pricingTable.map(row => row.region))).filter(Boolean);

    // Filtered table data
    const filteredPricingTable = pricingTable.filter(row => {
        const regionMatch = !regionFilter || row.region === regionFilter;
        const cityMatch = !citySearch || row.city.toLowerCase().includes(citySearch.toLowerCase());
        return regionMatch && cityMatch;
    });

     // Sorting functions for Pricing Update table
     const handlePricingSort = (field) => {
         const isAsc = pricingSortField === field && pricingSortDirection === 'asc';
         setPricingSortDirection(isAsc ? 'desc' : 'asc');
         setPricingSortField(field);
     };

     const getSortedPricingData = () => {
         return [...filteredPricingTable].sort((a, b) => {
             let aValue, bValue;
             
             switch (pricingSortField) {
                 case 'region':
                     aValue = a.region || '';
                     bValue = b.region || '';
                     break;
                 case 'city':
                     aValue = a.city || '';
                     bValue = b.city || '';
                     break;
                 case 'price':
                     aValue = Number(a.price) || 0;
                     bValue = Number(b.price) || 0;
                     break;
                 case 'updated_at':
                     aValue = new Date(a.updated_at || 0);
                     bValue = new Date(b.updated_at || 0);
                     break;
                 default:
                     aValue = a[pricingSortField] || '';
                     bValue = b[pricingSortField] || '';
             }
             
             if (aValue < bValue) {
                 return pricingSortDirection === 'asc' ? -1 : 1;
             }
             if (aValue > bValue) {
                 return pricingSortDirection === 'asc' ? 1 : -1;
             }
             return 0;
         });
     };

     const getPricingSortIcon = (field) => {
         if (pricingSortField !== field) {
             return null;
         }
         return pricingSortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
     };

    // Pagination logic
     const paginatedPricingTable = getSortedPricingData().slice(pricingPage * pricingRowsPerPage, pricingPage * pricingRowsPerPage + pricingRowsPerPage);

    // Modify the edit price handlers
    const handleEditPriceClick = (row) => {
        setSelectedPricingRow(row);
        setEditPriceValue(row.price.toString());
        setEditPriceError('');
        setEditPriceDialogOpen(true);
    };

    const handleEditPriceClose = () => {
        setEditPriceDialogOpen(false);
        setEditPriceValue('');
        setEditPriceError('');
        setSelectedPricingRow(null);
    };

    const handleEditPriceSubmit = () => {
        if (!selectedPricingRow) return;
        
        const newPrice = Number(editPriceValue);
        if (isNaN(newPrice) || newPrice < 0) {
            setEditPriceError('Please enter a valid price (0 or greater)');
            return;
        }

        // Store the pending update and show confirmation dialog
        setPendingPriceUpdate({
            city_id: selectedPricingRow.id,
            price: newPrice,
            city: selectedPricingRow.city,
            region: selectedPricingRow.region,
            oldPrice: selectedPricingRow.price
        });
        setConfirmDialogOpen(true);
        handleEditPriceClose();
    };

    const handleConfirmUpdate = async () => {
        if (!pendingPriceUpdate) return;

        setEditPriceLoading(true);
        setEditPriceError('');

        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updatePrice',
                    params: {
                        city_id: pendingPriceUpdate.city_id,
                        price: pendingPriceUpdate.price
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update price');
            }

            const { data } = await response.json();

            // Update the local state with the new price and updated_at timestamp
            setPricingTable(prev => prev.map(row => 
                row.id === pendingPriceUpdate.city_id 
                    ? { 
                        ...row, 
                        price: pendingPriceUpdate.price,
                        updated_at: data.updated_at 
                    }
                    : row
            ));

            setSnackbar({
                open: true,
                message: 'Price updated successfully',
                severity: 'success'
            });
        } catch (error) {
            setEditPriceError(error.message || 'Failed to update price');
            setSnackbar({
                open: true,
                message: error.message || 'Failed to update price',
                severity: 'error'
            });
        } finally {
            setEditPriceLoading(false);
            setConfirmDialogOpen(false);
            setPendingPriceUpdate(null);
        }
    };

    const handleCancelUpdate = () => {
        setConfirmDialogOpen(false);
        setPendingPriceUpdate(null);
    };



    // Fetch summaries when Summary tab is selected
    useEffect(() => {
        if (tabValue !== 1) return;
        setLoadingSummaries(true);
        setSummariesError(null);
        fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getSummaries', params: {} })
        })
            .then(res => res.json())
            .then(async json => {
                if (json.error) throw new Error(json.error);
                const summaries = json.summaries || [];
                setSummaries(summaries);
                
                // Fetch date spans for each summary
                setLoadingDateSpans(true);
                const dateSpanPromises = summaries.map(async (summary) => {
                    try {
                        const response = await fetch('/api/admin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'getContractsBySingleSummaryId',
                                params: { summaryId: summary.id }
                            })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            const contracts = data.contracts || [];
                            
                            if (contracts.length > 0) {
                                const contractDates = contracts.map(c => new Date(c.created_at)).filter(date => !isNaN(date));
                                const minDate = new Date(Math.min(...contractDates));
                                const maxDate = new Date(Math.max(...contractDates));
                                const dateSpan = `${formatDateFns(minDate, 'MMM d')} to ${formatDateFns(maxDate, 'MMM d, yyyy')}`;
                                return { summaryId: summary.id, dateSpan };
                            }
                        }
                        return { summaryId: summary.id, dateSpan: 'N/A' };
                    } catch (error) {
                        console.error(`Error fetching date span for summary ${summary.id}:`, error);
                        return { summaryId: summary.id, dateSpan: 'N/A' };
                    }
                });
                
                const dateSpanResults = await Promise.all(dateSpanPromises);
                const dateSpanMap = {};
                dateSpanResults.forEach(result => {
                    dateSpanMap[result.summaryId] = result.dateSpan;
                });
                setSummaryDateSpans(dateSpanMap);
                setLoadingDateSpans(false);
            })
            .catch(err => setSummariesError(err.message || 'Failed to fetch summaries'))
            .finally(() => setLoadingSummaries(false));
    }, [tabValue]);





    // Sorting functions for Pending table
    const handlePendingSort = (field) => {
        const isAsc = pendingSortField === field && pendingSortDirection === 'asc';
        setPendingSortDirection(isAsc ? 'desc' : 'asc');
        setPendingSortField(field);
    };

    const getSortedPendingData = () => {
        return [...filteredData].sort((a, b) => {
            let aValue, bValue;
            
            switch (pendingSortField) {
                case 'id':
                    aValue = a.id;
                    bValue = b.id;
                    break;
                case 'owner_name':
                    aValue = `${a.owner_first_name || ''} ${a.owner_middle_initial || ''} ${a.owner_last_name || ''}`.trim();
                    bValue = `${b.owner_first_name || ''} ${b.owner_middle_initial || ''} ${b.owner_last_name || ''}`.trim();
                    break;
                case 'corporation':
                    aValue = (corporationsById.get(a.airline?.corporation_id) || '').toLowerCase();
                    bValue = (corporationsById.get(b.airline?.corporation_id) || '').toLowerCase();
                    break;
                case 'flight_number':
                    aValue = a.flight_number || '';
                    bValue = b.flight_number || '';
                    break;
                case 'drop_off_location':
                    aValue = a.drop_off_location || '';
                    bValue = b.drop_off_location || '';
                    break;
                case 'delivered_at':
                    aValue = new Date(a.delivered_at || a.created_at || 0);
                    bValue = new Date(b.delivered_at || b.created_at || 0);
                    break;
                case 'contract_status':
                    aValue = a.contract_status?.status_name || '';
                    bValue = b.contract_status?.status_name || '';
                    break;
                case 'amount':
                    const aDeliveryCharge = Number(a.delivery_charge) || 0;
                    const aDeliverySurcharge = Number(a.delivery_surcharge || a.surcharge) || 0;
                    const aDeliveryDiscount = Number(a.delivery_discount || a.discount) || 0;
                    aValue = Math.max(0, (aDeliveryCharge + aDeliverySurcharge) - aDeliveryDiscount);
                    
                    const bDeliveryCharge = Number(b.delivery_charge) || 0;
                    const bDeliverySurcharge = Number(b.delivery_surcharge || b.surcharge) || 0;
                    const bDeliveryDiscount = Number(b.delivery_discount || b.discount) || 0;
                    bValue = Math.max(0, (bDeliveryCharge + bDeliverySurcharge) - bDeliveryDiscount);
                    break;
                default:
                    aValue = a[pendingSortField] || '';
                    bValue = b[pendingSortField] || '';
            }
            
            if (aValue < bValue) {
                return pendingSortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return pendingSortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getPendingSortIcon = (field) => {
        if (pendingSortField !== field) {
            return null;
        }
        return pendingSortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
    };

    // Transaction Management pagination state
    const [tmPage, setTmPage] = useState(0);
    const [tmRowsPerPage, setTmRowsPerPage] = useState(10);
    const paginatedFilteredData = getSortedPendingData().slice(tmPage * tmRowsPerPage, tmPage * tmRowsPerPage + tmRowsPerPage);
    const handleTmPageChange = (event, newPage) => setTmPage(newPage);
    const handleTmRowsPerPageChange = (event) => {
        setTmRowsPerPage(parseInt(event.target.value, 10));
        setTmPage(0);
    };

    // Pricing Update pagination handlers
    const handlePricingPageChange = (event, newPage) => setPricingPage(newPage);
    const handlePricingRowsPerPageChange = (event) => {
        setPricingRowsPerPage(parseInt(event.target.value, 10));
        setPricingPage(0);
    };

    const handlePodClose = () => {
        setPodOpen(false);
        setPodContract(null);
        setPodImage(null);
        setPodError(null);
    };

    const handleSummarize = () => {
        const contracts = getSelectedContracts();
        if (contracts.length === 0) {
            setSnackbar({
                open: true,
                message: 'Please select at least one contract to summarize',
                severity: 'warning'
            });
            return;
        }

        // Generate summary ID and invoice ID with same alphanumeric characters
        const today = new Date();
        const datePart = formatDateFns(today, 'yyyyMMdd');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const commonId = `${datePart}${randomPart}`;
        const summaryId = `SUM${commonId}`;
        const invoiceId = `INV${commonId}`;

        // Calculate date span for contracts
        const contractDates = contracts.map(c => new Date(c.created_at)).filter(date => !isNaN(date));
        const minDate = contractDates.length > 0 ? new Date(Math.min(...contractDates)) : new Date();
        const maxDate = contractDates.length > 0 ? new Date(Math.max(...contractDates)) : new Date();
        
        const dateSpan = `${formatDateFns(minDate, 'MMM d')} to ${formatDateFns(maxDate, 'MMM d, yyyy')}`;

        // Calculate summary statistics
        const totalContracts = contracts.length;
        const totalAmount = contracts.reduce((sum, c) => {
            const delivery_charge = Number(c.delivery_charge) || 0;
            const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
            const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
            return sum + Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
        }, 0);
        
        const deliveredContracts = contracts.filter(c => c.contract_status?.status_name === 'Delivered').length;
        const failedContracts = contracts.filter(c => c.contract_status?.status_name === 'Delivery Failed').length;

        // Set pending data for confirmation dialog
        setPendingSummarizeData({
            summaryId,
            invoiceId,
            dateSpan,
            totalContracts,
            totalAmount,
            deliveredContracts,
            failedContracts,
            contracts
        });

        // Show confirmation dialog
        setSummarizeConfirmDialogOpen(true);
    };

    const handleSummaryClose = () => {
        setSummaryOpen(false);
        setSummaryData(null);
    };

    const handleConfirmSummarize = async () => {
        if (!pendingSummarizeData) return;

        try {
            const { summaryId, invoiceId, totalContracts, totalAmount, deliveredContracts, failedContracts, contracts } = pendingSummarizeData;
            
            // Create summary record and update contracts
            const contractIds = contracts.map(c => c.id);
            const createSummaryPayload = {
                action: 'createSummary',
                params: {
                    summaryId,
                    totalContracts,
                    totalAmount,
                    deliveredContracts,
                    failedContracts,
                    contractIds
                }
            };
            
            const createSummaryRes = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createSummaryPayload)
            });
            
            if (!createSummaryRes.ok) {
                const errorData = await createSummaryRes.json();
                throw new Error(errorData.error || 'Failed to create summary');
            }

            const result = await createSummaryRes.json();
            
            // Update the summary record with the generated invoice number
            const invoiceResponse = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSummaryInvoiceId',
                    params: {
                        summaryId: result.summary.id,
                        invoiceId: invoiceId
                    }
                })
            });
            
            if (!invoiceResponse.ok) {
                const errorData = await invoiceResponse.json();
                throw new Error(errorData.error || 'Failed to update invoice number');
            }

            
            const summary = {
                summaryId,
                totalContracts,
                totalAmount,
                deliveredContracts,
                failedContracts,
                contracts: contracts,
                summaryRecord: result.summary
            };
            
            setSummaryData(summary);
            setSummaryOpen(true);

            setSnackbar({
                open: true,
                message: `Summary created successfully with ID: ${summaryId} and Invoice ID: ${invoiceId}. Status remains as Pending.`,
                severity: 'success'
            });

            // Close confirmation dialog
            setSummarizeConfirmDialogOpen(false);
            setPendingSummarizeData(null);

            // Refresh the data to reflect the changes
            window.location.reload();
        } catch (error) {
            console.error('Error creating summary:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to create summary',
                severity: 'error'
            });
        }
    };

    const handleCancelSummarize = () => {
        setSummarizeConfirmDialogOpen(false);
        setPendingSummarizeData(null);
    };

     const handleViewSummaryDetails = (summary) => {
         // For now, just show the summary data in the existing summary dialog
         // You can expand this to fetch more detailed information if needed
         setSummaryData({
             summaryId: summary.id,
             totalContracts: 0, // This would need to be fetched from the database
             totalAmount: summary.total_charge || 0,
             deliveredContracts: 0, // This would need to be fetched from the database
             failedContracts: 0, // This would need to be fetched from the database
             contracts: [], // This would need to be fetched from the database
             summaryRecord: summary
         });
         setSummaryOpen(true);
     };


    // Complete summary handlers
    const handleCompleteSummary = (summary) => {
        setPendingCompleteSummary(summary);
        setCompleteConfirmDialogOpen(true);
    };

    const handleConfirmComplete = async () => {
        if (!pendingCompleteSummary) return;

        try {
            // Update the summary status to Issued a receipt (status_id = 2)
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSummaryStatus',
                    params: {
                        summaryId: pendingCompleteSummary.id,
                        statusId: 2
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update summary status');
            }
            
            // Update the local state to reflect the change
            setSummaries(prev => prev.map(s => 
                s.id === pendingCompleteSummary.id 
                    ? { ...s, status_id: 2, status_name: 'Issued a receipt' }
                    : s
            ));
            
            setSnackbar({
                open: true,
                message: `Summary ${pendingCompleteSummary.id} has been marked as Issued a receipt`,
                severity: 'success'
            });
            
            // Close the dialog
            setCompleteConfirmDialogOpen(false);
            setPendingCompleteSummary(null);
        } catch (error) {
            console.error('Error completing summary:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to complete summary',
                severity: 'error'
            });
            
            // Close the dialog even on error
            setCompleteConfirmDialogOpen(false);
            setPendingCompleteSummary(null);
        }
    };

    const handleCancelComplete = () => {
        setCompleteConfirmDialogOpen(false);
        setPendingCompleteSummary(null);
    };

    const handlePreviewClose = () => {
        setPreviewOpen(false);
        setPreviewDoc(null);
        setPreviewSummary(null);
        setPreviewError('');
    };

    const handlePreviewSave = async () => {
        try {
            if (!previewDoc) return;
            const blob = await pdf(previewDoc).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${previewSummary?.invoice_id || 'invoice'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Failed to save PDF', severity: 'error' });
        }
    };

    const handlePreviewShare = async () => {
        try {
            if (!previewDoc) return;
            const blob = await pdf(previewDoc).toBlob();
            const fileName = `${previewSummary?.invoice_id || 'invoice'}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Invoice & SOA',
                    text: 'Please find the generated Invoice & SOA PDF attached.'
                });
            } else {
                // Fallback to save if share is unsupported
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                setSnackbar({ open: true, message: 'Sharing not supported. PDF downloaded instead.', severity: 'info' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: err.message || 'Failed to share PDF', severity: 'error' });
        }
    };

    const openPreviewForSummary = async (summary) => {
        try {
            setPreviewLoading(true);
            setPreviewError('');
            setPreviewSummary(summary);
            // Reuse fetch logic from handleGenerateSummaryReport but without auto-download
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getContractsBySingleSummaryId',
                    params: { summaryId: summary.id }
                })
            });
            if (!response.ok) throw new Error('Failed to fetch contracts for summary');
            const data = await response.json();
            const contracts = data.contracts || [];
            if (contracts.length === 0) throw new Error('No contracts found for this summary');

            // Fetch proof of delivery for all contracts
            const proofOfDeliveryData = {};
            await Promise.all(contracts.map(async (contract) => {
                try {
                    const podResponse = await fetch('/api/admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getProofOfDelivery',
                            params: { contract_id: contract.id }
                        })
                    });
                    if (podResponse.ok) {
                        const podData = await podResponse.json();
                        if (podData.proof_of_delivery) {
                            proofOfDeliveryData[contract.id] = podData;
                        }
                    }
                } catch {}
            }));

            const minDate = contracts.reduce((min, c) => c.created_at && c.created_at < min ? c.created_at : min, contracts[0].created_at);
            const maxDate = contracts.reduce((max, c) => c.created_at && c.created_at > max ? c.created_at : max, contracts[0].created_at);
            const dateRange = `${formatDate(minDate)} TO ${formatDate(maxDate)}`;

            setCombinedPDFData({
                contracts,
                dateRange,
                invoiceNumber: summary.invoice_id || null,
                proofOfDeliveryData
            });
            setPreviewDoc(
                <CombinedPDFTemplate 
                    contracts={contracts}
                    dateRange={dateRange}
                    invoiceNumber={summary.invoice_id || null}
                    proofOfDeliveryData={proofOfDeliveryData}
                    eSignatureUrl={eSignatureDataUrl}
                />
            );
            setPreviewKey(prev => prev + 1);
            setPreviewOpen(true);
        } catch (error) {
            setPreviewError(error.message || 'Failed to load preview');
            setSnackbar({ open: true, message: error.message || 'Failed to load preview', severity: 'error' });
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerateSummaryReport = async (summary) => {
        try {
            // Prevent multiple simultaneous PDF generations
            if (shouldRenderCombinedPDF) {
                setSnackbar({
                    open: true,
                    message: 'PDF generation in progress. Please wait...',
                    severity: 'warning'
                });
                return;
            }

            // Reset previous PDF state
            setShouldRenderCombinedPDF(false);
            setCombinedPDFData(null);

            // Fetch contracts associated with this summary
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getContractsBySingleSummaryId',
                    params: { summaryId: summary.id }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch contracts for summary');
            }
            
            const data = await response.json();
            const contracts = data.contracts || [];
            
            if (contracts.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'No contracts found for this summary',
                    severity: 'warning'
                });
                return;
            }
            
            // Fetch proof of delivery for all contracts
            const proofOfDeliveryData = {};
            const podPromises = contracts.map(async (contract) => {
                try {
                    const podResponse = await fetch('/api/admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getProofOfDelivery',
                            params: { contract_id: contract.id }
                        })
                    });
                    
                    if (podResponse.ok) {
                        const podData = await podResponse.json();
                        if (podData.proof_of_delivery) {
                            proofOfDeliveryData[contract.id] = podData;
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching proof of delivery for contract ${contract.id}:`, error);
                }
            });
            
            await Promise.all(podPromises);
            
            // Generate date range for the contracts
            const minDate = contracts.reduce((min, c) => c.created_at && c.created_at < min ? c.created_at : min, contracts[0].created_at);
            const maxDate = contracts.reduce((max, c) => c.created_at && c.created_at > max ? c.created_at : max, contracts[0].created_at);
            const dateRange = `${formatDate(minDate)} TO ${formatDate(maxDate)}`;
            
            // Set the combined PDF data
            setCombinedPDFData({
                contracts,
                dateRange,
                invoiceNumber: summary.invoice_id || null,
                proofOfDeliveryData
            });
            
            // Trigger PDF generation
            setShouldRenderCombinedPDF(true);
            
            // Auto-trigger download after a short delay to ensure PDF is ready
            setTimeout(() => {
                if (pdfDownloadRef.current) {
                    pdfDownloadRef.current.click();
                }
                // Reset state after download
                setTimeout(() => {
                    setShouldRenderCombinedPDF(false);
                    setCombinedPDFData(null);
                }, 2000);
            }, 1500);
            
            setSnackbar({
                open: true,
                message: `Combined SOA and Invoice PDF with Proof of Delivery generated and downloaded for summary ${summary.id}`,
                severity: 'success'
            });
        } catch (error) {
            console.error('Error generating combined PDF:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to generate combined PDF',
                severity: 'error'
            });
            // Reset state on error
            setShouldRenderCombinedPDF(false);
            setCombinedPDFData(null);
        }
    };

     // Sorting functions for Summary table
     const handleSummarySort = (field) => {
         const isAsc = summarySortField === field && summarySortDirection === 'asc';
         setSummarySortDirection(isAsc ? 'desc' : 'asc');
         setSummarySortField(field);
     };

     const getSortedSummaries = () => {
         return [...summaries].sort((a, b) => {
             let aValue, bValue;
             
             switch (summarySortField) {
                 case 'id':
                     aValue = a.id;
                     bValue = b.id;
                     break;
                 case 'invoice_id':
                     aValue = a.invoice_id || '';
                     bValue = b.invoice_id || '';
                     break;
                 case 'status_name':
                     aValue = a.status_name || '';
                     bValue = b.status_name || '';
                     break;
                 case 'created_at':
                     aValue = new Date(a.created_at || 0);
                     bValue = new Date(b.created_at || 0);
                     break;
                 case 'due_date':
                     aValue = new Date(a.due_date || 0);
                     bValue = new Date(b.due_date || 0);
                     break;
                 default:
                     aValue = a[summarySortField] || '';
                     bValue = b[summarySortField] || '';
             }
             
             if (aValue < bValue) {
                 return summarySortDirection === 'asc' ? -1 : 1;
             }
             if (aValue > bValue) {
                 return summarySortDirection === 'asc' ? 1 : -1;
             }
             return 0;
         });
     };

     const getSortIcon = (field) => {
         if (summarySortField !== field) {
             return null;
         }
         return summarySortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
     };



    const fetchProofOfDelivery = async (contractId) => {
        setPodLoading(true);
        setPodError(null);
        try {
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getProofOfDelivery',
                    params: { contract_id: contractId }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch proof of delivery');
            }
            
            const data = await response.json();
            if (data.proof_of_delivery) {
                setPodImage(data.proof_of_delivery);
            } else {
                setPodError('No proof of delivery available');
            }
        } catch (error) {
            setPodError(error.message || 'Failed to load proof of delivery');
        } finally {
            setPodLoading(false);
        }
    };

    // Render
    if (loading) return (<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading...</Typography></Box>);
    if (error) return (<Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>);
    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="transaction management tabs"
                    centered
                >
                    <Tab label="To Pay" />
                    <Tab label="Invoice" />
                    <Tab label="Rates" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    views={['month', 'year']}
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    slotProps={{
                                        textField: {
                                            variant: 'outlined',
                                            size: 'small',
                                            sx: { width: 200 }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel id="corp-filter-label">Filter by Corporation</InputLabel>
                                <Select
                                    labelId="corp-filter-label"
                                    value={corporationFilter}
                                    label="Filter by Corporation"
                                    onChange={(e) => setCorporationFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Corporations</MenuItem>
                                    {Array.from(new Set(Array.from(corporationsById.values()))).sort((a,b)=>a.localeCompare(b)).map(name => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button 
                                variant="contained"
                                size="small"
                                color="primary"
                                sx={{ height: 40 }}
                                onClick={handleSummarize}
                            >
                                Summarize
                            </Button>
                        </Box>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                    <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                        <Checkbox 
                                            indeterminate={somePageRowsSelected && !allPageRowsSelected} 
                                            checked={allPageRowsSelected} 
                                            onChange={handleSelectAll} 
                                            inputProps={{ 'aria-label': 'select all contracts' }}
                                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                        />
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('id')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Tracking ID
                                             {getPendingSortIcon('id')}
                                         </Box>
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('owner_name')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Luggage Owner
                                             {getPendingSortIcon('owner_name')}
                                         </Box>
                                     </TableCell>
                                    <TableCell 
                                        sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                        onClick={() => handlePendingSort('corporation')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            Corporation
                                            {getPendingSortIcon('corporation')}
                                        </Box>
                                    </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('flight_number')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Flight No.
                                             {getPendingSortIcon('flight_number')}
                                         </Box>
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('drop_off_location')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Address
                                             {getPendingSortIcon('drop_off_location')}
                                         </Box>
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('delivered_at')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Date Received
                                             {getPendingSortIcon('delivered_at')}
                                         </Box>
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('contract_status')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Status
                                             {getPendingSortIcon('contract_status')}
                                         </Box>
                                     </TableCell>
                                     <TableCell 
                                         sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                         onClick={() => handlePendingSort('amount')}
                                     >
                                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                             Amount
                                             {getPendingSortIcon('amount')}
                                         </Box>
                                     </TableCell>
                                    <TableCell sx={{ color: 'white' }}>Remarks</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedFilteredData.map((row) => {
                                    const status = row.contract_status?.status_name || row.contract_status_id || '';
                                    const delivery_charge = Number(row.delivery_charge) || 0;
                                    const delivery_surcharge = Number(row.delivery_surcharge || row.surcharge) || 0;
                                    const delivery_discount = Number(row.delivery_discount || row.discount) || 0;
                                    const total = Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
                                    const remarks = row.remarks || '';
                                    
                                    // Format luggage owner name from contracts table fields
                                    const luggageOwner = row.owner_first_name || row.owner_middle_initial || row.owner_last_name 
                                        ? `${row.owner_first_name || ''} ${row.owner_middle_initial || ''} ${row.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                                        : 'N/A';
                                    
                                    return (
                                        <TableRow key={row.id} selected={isRowSelected(row.id)}>
                                            <TableCell padding="checkbox">
                                                <Checkbox 
                                                    checked={isRowSelected(row.id)} 
                                                    onChange={() => handleSelectRow(row.id)} 
                                                    inputProps={{ 'aria-label': `select contract ${row.id}` }} 
                                                    disabled={isRowLocked(row)}
                                                />
                                            </TableCell>
                                            <TableCell>{row.id}</TableCell>
                                            <TableCell>{luggageOwner}</TableCell>
                                            <TableCell>{corporationsById.get(row.airline?.corporation_id) || 'N/A'}</TableCell>
                                            <TableCell>{row.flight_number || 'N/A'}</TableCell>
                                            <TableCell>{row.drop_off_location || 'N/A'}</TableCell>
                                            <TableCell>{formatDate(row.delivered_at || row.created_at)}</TableCell>
                                            <TableCell>{status}</TableCell>
                                            <TableCell>₱{total.toFixed(2)}</TableCell>
                                            <TableCell>{remarks}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        fullWidth
                                                        onClick={() => { setDetailsContract(row); setDetailsOpen(true); }}
                                                    >
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        fullWidth
                                                        onClick={() => { setSurchargeContract(row); setSurchargeValue(row.delivery_surcharge || ''); setSurchargeError(''); setSurchargeOpen(true); }}
                                                    >
                                                        Surcharge
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        fullWidth
                                                        onClick={() => { setDiscountContract(row); setDiscountValue(row.delivery_discount || ''); setDiscountError(''); setDiscountOpen(true); }}
                                                    >
                                                        Discount
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        fullWidth
                                                        sx={{ whiteSpace: 'nowrap' }}
                                                        onClick={() => { setPodContract(row); setPodOpen(true); fetchProofOfDelivery(row.id); }}
                                                    >
                                                        Proof of Delivery
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <TablePagination 
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div" 
                             count={getSortedPendingData().length} 
                            rowsPerPage={tmRowsPerPage}
                            page={tmPage}
                            onPageChange={handleTmPageChange}
                            onRowsPerPageChange={handleTmRowsPerPageChange}
                            labelRowsPerPage="Rows per page:"
                        />
                    </TableContainer>
                </Box>
            )}

            {tabValue === 1 && (
                <Box sx={{ p: 3 }}>
                    {loadingSummaries ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                            <CircularProgress />
                        </Box>
                    ) : summariesError ? (
                        <Alert severity="error">{summariesError}</Alert>
                    ) : (
                        <Box>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handleSummarySort('id')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 Summary ID
                                                 {getSortIcon('id')}
                                             </Box>
                                        </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handleSummarySort('invoice_id')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 Invoice No.
                                                 {getSortIcon('invoice_id')}
                                             </Box>
                                         </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handleSummarySort('status_name')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 Status
                                                 {getSortIcon('status_name')}
                                             </Box>
                                         </TableCell>
                                         <TableCell sx={{ color: 'white' }}>Date Span</TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handleSummarySort('due_date')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 Due Date
                                                 {getSortIcon('due_date')}
                                             </Box>
                                         </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handleSummarySort('created_at')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 Created At
                                                 {getSortIcon('created_at')}
                                             </Box>
                                         </TableCell>
                                        <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                     {summaries.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={7} align="center">No summaries found</TableCell>
                                        </TableRow>
                                     ) : getSortedSummaries().map((summary) => (
                                         <TableRow key={summary.id}>
                                             <TableCell>{summary.id}</TableCell>
                                             <TableCell>{summary.invoice_id || 'N/A'}</TableCell>
                                             <TableCell>
                                                 <Box sx={{ 
                                                     display: 'inline-flex', 
                                                     alignItems: 'center', 
                                                     px: 1.5, 
                                                     py: 0.5, 
                                                     borderRadius: 1,
                                                     backgroundColor: summary.status_id === 1 ? '#fff3cd' : summary.status_id === 3 ? '#d4edda' : '#d1edff',
                                                     color: summary.status_id === 1 ? '#856404' : summary.status_id === 3 ? '#155724' : '#0c5460',
                                                     border: `1px solid ${summary.status_id === 1 ? '#ffeaa7' : summary.status_id === 3 ? '#c3e6cb' : '#bee5eb'}`,
                                                     fontSize: '0.75rem',
                                                     fontWeight: 500
                                                 }}>
                                                     {summary.status_name || 'N/A'}
                                                 </Box>
                                            </TableCell>
                                            <TableCell>
                                                 {loadingDateSpans ? (
                                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                         <CircularProgress size={16} />
                                                         <Typography variant="body2" sx={{ 
                                                             fontSize: '0.875rem',
                                                             color: 'text.primary'
                                                         }}>
                                                             Loading...
                                                         </Typography>
                                                     </Box>
                                                 ) : (
                                                     <Typography variant="body2" sx={{ 
                                                         fontSize: '0.875rem',
                                                         color: 'text.primary'
                                                     }}>
                                                         {summaryDateSpans[summary.id] || 'N/A'}
                                                     </Typography>
                                                 )}
                                             </TableCell>
                                             <TableCell>
                                                 {summary.due_date ? new Date(summary.due_date).toLocaleDateString(undefined, { 
                                                     year: 'numeric', 
                                                     month: 'long', 
                                                     day: 'numeric'
                                                 }) : ''}
                                             </TableCell>
                                             <TableCell>
                                                 {summary.created_at ? new Date(summary.created_at).toLocaleDateString(undefined, { 
                                                     year: 'numeric', 
                                                     month: 'long', 
                                                     day: 'numeric',
                                                     hour: '2-digit',
                                                     minute: '2-digit'
                                                 }) : ''}
                                             </TableCell>
                                             <TableCell>
                                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                                     <Button
                                                          variant="contained"
                                                          size="small"
                                                          color="primary"
                                                          onClick={() => openPreviewForSummary(summary)}
                                                          disabled={summary.status_id === 3}
                                                          sx={{
                                                              backgroundColor: summary.status_id === 3 ? '#ccc' : undefined,
                                                              color: summary.status_id === 3 ? '#666' : undefined,
                                                              '&:hover': {
                                                                  backgroundColor: summary.status_id === 3 ? '#ccc' : undefined
                                                              }
                                                          }}
                                                      >
                                                          View Preview
                                                      </Button>
                                                      <Button
                                                          variant="contained"
                                                          size="small"
                                                          color="primary"
                                                          onClick={() => handleCompleteSummary(summary)}
                                                          disabled={summary.status_id === 3}
                                                          sx={{
                                                              backgroundColor: summary.status_id === 3 ? '#ccc' : undefined,
                                                              color: summary.status_id === 3 ? '#666' : undefined,
                                                              '&:hover': {
                                                                  backgroundColor: summary.status_id === 3 ? '#ccc' : undefined
                                                              }
                                                          }}
                                                      >
                                                          Mark as Complete
                                                      </Button>
                                                  </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {/* Combined PDF Download Link - Hidden for auto-download */}
                        {shouldRenderCombinedPDF && combinedPDFData && (
                            <Box sx={{ display: 'none' }}>
                                <PDFDownloadLink 
                                    ref={pdfDownloadRef}
                                    document={<CombinedPDFTemplate 
                                        contracts={combinedPDFData.contracts} 
                                        dateRange={combinedPDFData.dateRange}
                                        invoiceNumber={combinedPDFData.invoiceNumber}
                                        proofOfDeliveryData={combinedPDFData.proofOfDeliveryData || {}}
                                    />}
                                    fileName={`${combinedPDFData.invoiceNumber || 'invoice'}.pdf`}
                                >
                                    {({ loading, error }) => (
                                        <Button 
                                            variant="contained" 
                                            color="success"
                                            size="large"
                                            disabled={loading || error}
                                        >
                                            {loading ? 'Generating PDF...' : error ? 'Error generating PDF' : 'Download Combined SOA & Invoice PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            </Box>
                        )}
                        {/* Preview Dialog */}
                        <Dialog open={previewOpen} onClose={handlePreviewClose} maxWidth="lg" fullWidth>
                            <DialogTitle>PDF Preview</DialogTitle>
                            <DialogContent dividers>
                                {previewLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : previewError ? (
                                    <Typography color="error">{previewError}</Typography>
                                ) : previewDoc ? (
                                    <Box sx={{ height: 600, border: '1px solid', borderColor: 'divider' }}>
                                        <PDFViewer key={previewKey} width="100%" height="100%" showToolbar>
                                            {previewDoc}
                                        </PDFViewer>
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">No preview available.</Typography>
                                )}
                                {/* E-Signature section */}
                                <Divider sx={{ my: 2 }}>Upload e‑signature</Divider>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const dataUrl = reader.result;
                                                setESignatureDataUrl(dataUrl);
                                                // Always rebuild from latest combinedPDFData; if absent, rebuild via previewSummary
                                                if (combinedPDFData) {
                                                    setPreviewDoc(
                                                        <CombinedPDFTemplate
                                                            contracts={combinedPDFData.contracts}
                                                            dateRange={combinedPDFData.dateRange}
                                                            invoiceNumber={combinedPDFData.invoiceNumber}
                                                            proofOfDeliveryData={combinedPDFData.proofOfDeliveryData || {}}
                                                            eSignatureUrl={dataUrl}
                                                        />
                                                    );
                                                    setPreviewKey(prev => prev + 1);
                                                } else if (previewSummary) {
                                                    // In case user uploads before data is set, refetch lightweight rebuild using existing doc
                                                    setPreviewDoc(prev => (
                                                        <CombinedPDFTemplate
                                                            {...prev?.props}
                                                            eSignatureUrl={dataUrl}
                                                        />
                                                    ));
                                                    setPreviewKey(prev => prev + 1);
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    {eSignatureDataUrl && (
                                        <>
                                            <Typography variant="body2" color="text.secondary">Signature attached</Typography>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                onClick={() => {
                                                    setESignatureDataUrl(null);
                                                    if (combinedPDFData) {
                                                        setPreviewDoc(
                                                            <CombinedPDFTemplate
                                                                contracts={combinedPDFData.contracts}
                                                                dateRange={combinedPDFData.dateRange}
                                                                invoiceNumber={combinedPDFData.invoiceNumber}
                                                                proofOfDeliveryData={combinedPDFData.proofOfDeliveryData || {}}
                                                                eSignatureUrl={null}
                                                            />
                                                        );
                                                        setPreviewKey(prev => prev + 1);
                                                    } else {
                                                        // Also clear from existing preview doc to handle subsequent uploads
                                                        setPreviewDoc(prev => (
                                                            <CombinedPDFTemplate
                                                                {...prev?.props}
                                                                eSignatureUrl={null}
                                                            />
                                                        ));
                                                        setPreviewKey(prev => prev + 1);
                                                    }
                                                }}
                                            >
                                                Remove e‑signature
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {previewSummary ? `Summary ID: ${previewSummary.id}` : ''}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button onClick={handlePreviewSave} variant="contained" disabled={!previewDoc || previewLoading}>Save PDF</Button>
                                        <Button onClick={handlePreviewShare} variant="contained" disabled={!previewDoc || previewLoading}>Share PDF</Button>
                                        <Button onClick={handlePreviewClose} variant="contained">Close</Button>
                                    </Box>
                                </Box>
                            </DialogActions>
                        </Dialog>
                            </Box>
                    )}
                </Box>
            )}

            {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                    <Box sx={{ width: '100%', mb: 4 }}>
                        {/* Filters */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <FormControl sx={{ minWidth: 180 }} size="small">
                                <InputLabel id="region-filter-label">Filter by Region</InputLabel>
                                <Select
                                    labelId="region-filter-label"
                                    value={regionFilter}
                                    label="Filter by Region"
                                    onChange={e => setRegionFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Regions</MenuItem>
                                    {uniqueRegions.map(region => (
                                        <MenuItem key={region} value={region}>{region}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                size="small"
                                label="Search City"
                                value={citySearch}
                                onChange={e => setCitySearch(e.target.value)}
                                sx={{ minWidth: 180 }}
                            />
                        </Box>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                        <TableCell padding="checkbox" sx={{ color: 'white' }}>
                                            <Checkbox
                                                indeterminate={somePagePricingRowsSelected && !allPagePricingRowsSelected}
                                                checked={allPagePricingRowsSelected}
                                                onChange={handleSelectAllPricingRows}
                                                inputProps={{ 'aria-label': 'select all pricing rows' }}
                                                sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                            />
                                        </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handlePricingSort('region')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 <b>Region</b>
                                                 {getPricingSortIcon('region')}
                                             </Box>
                                         </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handlePricingSort('city')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 <b>City</b>
                                                 {getPricingSortIcon('city')}
                                             </Box>
                                         </TableCell>
                                         <TableCell 
                                             align="right"
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handlePricingSort('price')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                 <b>Price (₱)</b>
                                                 {getPricingSortIcon('price')}
                                             </Box>
                                         </TableCell>
                                         <TableCell 
                                             sx={{ color: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                                             onClick={() => handlePricingSort('updated_at')}
                                         >
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                 <b>Last Updated</b>
                                                 {getPricingSortIcon('updated_at')}
                                             </Box>
                                         </TableCell>
                                        <TableCell sx={{ color: 'white' }} align="center"><b>Action</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loadingPricingTable ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <CircularProgress size={24} /> Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedPricingTable.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No pricing data available</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPricingTable.map((row) => (
                                            <TableRow key={row.id} selected={isPricingRowSelected(row.id)}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isPricingRowSelected(row.id)}
                                                        onChange={() => handleSelectPricingRow(row.id)}
                                                        inputProps={{ 'aria-label': `select pricing row ${row.id}` }}
                                                    />
                                                </TableCell>
                                                <TableCell>{row.region}</TableCell>
                                                <TableCell>{row.city}</TableCell>
                                                <TableCell align="right">₱{row.price}</TableCell>
                                                <TableCell>
                                                    {row.updated_at ? new Date(row.updated_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'Never'}
                                                </TableCell>
                                                <TableCell align="center" sx={{ p: 0 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => handleEditPriceClick(row)}
                                                        >
                                                            Edit Price
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                component="div"
                                 count={getSortedPricingData().length}
                                rowsPerPage={pricingRowsPerPage}
                                page={pricingPage}
                                onPageChange={handlePricingPageChange}
                                onRowsPerPageChange={handlePricingRowsPerPageChange}
                                labelRowsPerPage="Rows per page:"
                            />
                        </TableContainer>
                    </Box>
                </Box>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleAction('view')}>View Details</MenuItem>
                <MenuItem onClick={() => handleAction('surcharge')}>Surcharge</MenuItem>
                <MenuItem onClick={() => handleAction('discount')}>Discount</MenuItem>
                <MenuItem onClick={() => handleAction('pod')}>View Proof of Delivery</MenuItem>
            </Menu>
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
                                {detailsContract.pickup_location_geo && (
                                    <Typography variant="body2">
                                        <b>Pickup Coordinates:</b>{' '}
                                        <span>
                                            {detailsContract.pickup_location_geo.coordinates[1].toFixed(6)}, {detailsContract.pickup_location_geo.coordinates[0].toFixed(6)}
                                        </span>
                                    </Typography>
                                )}
                                <Typography variant="body2">
                                    <b>Drop-off:</b> <span>{detailsContract.drop_off_location || 'N/A'}</span>
                                </Typography>
                                {detailsContract.drop_off_location_geo && (
                                    <Typography variant="body2">
                                        <b>Drop-off Coordinates:</b>{' '}
                                        <span>
                                            {detailsContract.drop_off_location_geo.coordinates[1].toFixed(6)}, {detailsContract.drop_off_location_geo.coordinates[0].toFixed(6)}
                                        </span>
                                    </Typography>
                                )}
                                {detailsContract.delivery_charge !== null && !isNaN(Number(detailsContract.delivery_charge)) ? (
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
                                    <b>Name:</b>{' '}
                                    <span>
                                        {detailsContract.owner_first_name || detailsContract.owner_middle_initial || detailsContract.owner_last_name
                                            ? `${detailsContract.owner_first_name || ''} ${detailsContract.owner_middle_initial || ''} ${detailsContract.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                                            : 'N/A'}
                                    </span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Contact Number:</b> <span>{detailsContract.owner_contact || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Address:</b> <span>{detailsContract.owner_address || detailsContract.drop_off_location || 'N/A'}</span>
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
                                            ? `${detailsContract.airline.first_name || ''} ${detailsContract.airline.middle_initial || ''} ${detailsContract.airline.last_name || ''}${detailsContract.airline.suffix ? ` ${detailsContract.airline.suffix}` : ''}`.replace(/  +/g, ' ').trim()
                                            : 'N/A'}
                                    </span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Email:</b> <span>{detailsContract.airline?.email || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Contact:</b> <span>{detailsContract.airline?.contact_number || 'N/A'}</span>
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
                                            ? `${detailsContract.delivery.first_name || ''} ${detailsContract.delivery.middle_initial || ''} ${detailsContract.delivery.last_name || ''}${detailsContract.delivery.suffix ? ` ${detailsContract.delivery.suffix}` : ''}`.replace(/  +/g, ' ').trim()
                                            : 'N/A'}
                                    </span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Email:</b> <span>{detailsContract.delivery?.email || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Contact:</b> <span>{detailsContract.delivery?.contact_number || 'N/A'}</span>
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
                                Luggage Information
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2">
                                    <b>Flight Number:</b> <span>{detailsContract.flight_number || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Case Number:</b> <span>{detailsContract.case_number || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Description:</b> <span>{detailsContract.luggage_description || 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Weight:</b> <span>{detailsContract.luggage_weight ? `${detailsContract.luggage_weight} kg` : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Quantity:</b> <span>{detailsContract.luggage_quantity || 'N/A'}</span>
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Timeline
                            </Typography>
                            <Box sx={{ ml: 1, mb: 1 }}>
                                <Typography variant="body2">
                                    <b>Created:</b>{' '}
                                    <span>{formatDate(detailsContract.created_at)}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Accepted:</b>{' '}
                                    <span>{detailsContract.accepted_at ? formatDate(detailsContract.accepted_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Pickup:</b>{' '}
                                    <span>{detailsContract.pickup_at ? formatDate(detailsContract.pickup_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Delivered:</b>{' '}
                                    <span>{detailsContract.delivered_at ? formatDate(detailsContract.delivered_at) : 'N/A'}</span>
                                </Typography>
                                <Typography variant="body2">
                                    <b>Cancelled:</b>{' '}
                                    <span>{detailsContract.cancelled_at ? formatDate(detailsContract.cancelled_at) : 'N/A'}</span>
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDetailsClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={surchargeOpen} onClose={handleSurchargeClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Surcharge</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the surcharge amount for contract <b>{surchargeContract?.id}</b>:</Typography>
                    <TextField label="Surcharge Amount" type="number" value={surchargeValue} onChange={e => setSurchargeValue(e.target.value)} fullWidth margin="normal" inputProps={{ min: 0, step: '0.01' }} disabled={surchargeLoading} />
                    {surchargeError && <Typography color="error">{surchargeError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSurchargeClose} disabled={surchargeLoading}>Cancel</Button>
                    <Button onClick={handleSurchargeSubmit} color="primary" disabled={surchargeLoading || surchargeValue === ''}>{surchargeLoading ? 'Saving...' : 'Save'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={discountOpen} onClose={handleDiscountClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Discount</DialogTitle>
                <DialogContent dividers>
                    <Typography gutterBottom>Enter the discount amount for contract <b>{discountContract?.id}</b>:</Typography>
                    <TextField label="Discount Amount" type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} fullWidth margin="normal" inputProps={{ min: 0, step: '0.01' }} disabled={discountLoading} />
                    {discountError && <Typography color="error">{discountError}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDiscountClose} disabled={discountLoading}>Cancel</Button>
                    <Button onClick={handleDiscountSubmit} color="primary" disabled={discountLoading || discountValue === ''}>{discountLoading ? 'Saving...' : 'Save'}</Button>
                </DialogActions>
            </Dialog>
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            {/* Add the Edit Price Dialog */}
            <Dialog 
                open={editPriceDialogOpen} 
                onClose={handleEditPriceClose}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Edit Price</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ pt: 1 }}>
                        <Typography gutterBottom>
                            Update price for {selectedPricingRow?.city} ({selectedPricingRow?.region})
                        </Typography>
                        <TextField
                            label="Price (₱)"
                            type="number"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 0, step: "0.01" }}
                            disabled={editPriceLoading}
                            error={!!editPriceError}
                            helperText={editPriceError}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleEditPriceClose} 
                        disabled={editPriceLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEditPriceSubmit} 
                        color="primary"
                        disabled={editPriceLoading || !editPriceValue}
                    >
                        {editPriceLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Add the Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCancelUpdate}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Confirm Price Update</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ pt: 1 }}>
                        <Typography gutterBottom>
                            Are you sure you want to update the price for {pendingPriceUpdate?.city} ({pendingPriceUpdate?.region})?
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Current Price: ₱{pendingPriceUpdate?.oldPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                New Price: ₱{pendingPriceUpdate?.price}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Price Difference: ₱{(pendingPriceUpdate?.price - pendingPriceUpdate?.oldPrice).toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCancelUpdate}
                        disabled={editPriceLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmUpdate}
                        color="primary"
                        disabled={editPriceLoading}
                        variant="contained"
                    >
                        {editPriceLoading ? 'Updating...' : 'Confirm Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Proof of Delivery Dialog */}
            <Dialog open={podOpen} onClose={handlePodClose} maxWidth="md" fullWidth>
                <DialogTitle>Proof of Delivery</DialogTitle>
                <DialogContent dividers>
                    {podContract && (
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                                Contract ID: <span style={{ color: '#bdbdbd', fontWeight: 400 }}>{podContract.id}</span>
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: '300px', justifyContent: 'center' }}>
                                {podLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : podError ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                                        <Typography color="error">{podError}</Typography>
                                    </Box>
                                ) : podImage ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <img 
                                            src={podImage} 
                                            alt="Proof of Delivery" 
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: '500px', 
                                                objectFit: 'contain' 
                                            }} 
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Delivered at: {new Date(podContract?.delivery_timestamp).toLocaleString()}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                                        <Typography>No proof of delivery available</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePodClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
            {/* Summary Dialog */}
            <Dialog open={summaryOpen} onClose={handleSummaryClose} maxWidth="md" fullWidth>
                <DialogTitle>Contract Summary</DialogTitle>
                <DialogContent dividers>
                    {summaryData && (
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>Summary Overview</Typography>
                            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, mb: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>Summary ID</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{summaryData.summaryId}</Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Total Contracts</Typography>
                                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>{summaryData.totalContracts}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>₱{summaryData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Delivered</Typography>
                                    <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 700 }}>{summaryData.deliveredContracts}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Failed</Typography>
                                    <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 700 }}>{summaryData.failedContracts}</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>Selected Contracts:</Typography>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>Owner</TableCell>
                                                <TableCell>Flight</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {summaryData.contracts.map((contract) => {
                                                const delivery_charge = Number(contract.delivery_charge) || 0;
                                                const delivery_surcharge = Number(contract.delivery_surcharge || contract.surcharge) || 0;
                                                const delivery_discount = Number(contract.delivery_discount || contract.discount) || 0;
                                                const total = Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
                                                const ownerName = contract.owner_first_name || contract.owner_middle_initial || contract.owner_last_name 
                                                    ? `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                                                    : 'N/A';
                                                
                                                return (
                                                    <TableRow key={contract.id}>
                                                        <TableCell>{contract.id}</TableCell>
                                                        <TableCell>{ownerName}</TableCell>
                                                        <TableCell>{contract.flight_number || 'N/A'}</TableCell>
                                                        <TableCell>{contract.contract_status?.status_name || 'N/A'}</TableCell>
                                                        <TableCell align="right">₱{total.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSummaryClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
            
            
            {/* Complete Confirmation Dialog */}
            <Dialog open={completeConfirmDialogOpen} onClose={handleCancelComplete} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Summary Completion</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to mark Summary ID: <strong>{pendingCompleteSummary?.id}</strong> as completed?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        This action will mark the summary as completed and disable the View Preview button. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelComplete} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmComplete} color="success" variant="contained">
                        Complete Summary
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Summarize Confirmation Dialog */}
            <Dialog open={summarizeConfirmDialogOpen} onClose={handleCancelSummarize} maxWidth="md" fullWidth>
                <DialogTitle>Confirm Summary Generation</DialogTitle>
                <DialogContent dividers>
                    {pendingSummarizeData && (
                        <Box sx={{ minWidth: 400 }}>
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>Summary Details</Typography>
                            
                            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, mb: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>Summary ID</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{pendingSummarizeData.summaryId}</Typography>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 1, mb: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>Invoice ID</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{pendingSummarizeData.invoiceId}</Typography>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1, mb: 3 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>Date Span</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{pendingSummarizeData.dateSpan}</Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Total Contracts</Typography>
                                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>{pendingSummarizeData.totalContracts}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>₱{pendingSummarizeData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Delivered</Typography>
                                    <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 700 }}>{pendingSummarizeData.deliveredContracts}</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2" color="text.secondary">Failed</Typography>
                                    <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 700 }}>{pendingSummarizeData.failedContracts}</Typography>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                This action will create a summary with the above details and automatically generate an invoice. The summary will remain in "Pending" status.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelSummarize} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmSummarize} color="primary" variant="contained">
                        Generate Summary & Invoice
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TransactionManagement;