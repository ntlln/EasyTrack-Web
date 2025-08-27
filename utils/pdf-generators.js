"use client";

import React from 'react';
import { PDFDownloadLink, Document, Page as PDFPage, Text, View, Font } from '@react-pdf/renderer';
import { format as formatDateFns, startOfMonth, endOfMonth } from 'date-fns';

// Register fonts from local public/fonts directory
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

// Utility: format date for table
const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

// PDF Receipt component (SOA)
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

// INVOICE PDF COMPONENT (BASIC FORMAT)
const InvoicePDF = ({ contracts = [], invoiceNumber = null }) => {
    const today = new Date();
    const todayFormatted = formatDateFns(today, 'MMMM d, yyyy');
    const invoiceNo = invoiceNumber || formatDateFns(today, 'yyyyMMdd');
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dueDate = formatDateFns(monthEnd, 'MMMM d, yyyy');
    const desc = `PIR Luggage Delivery – ${formatDateFns(monthStart, 'MMMM d, yyyy')} to ${formatDateFns(monthEnd, 'MMMM d, yyyy')}`;
    // Compute total amount
    const subtotal = contracts.reduce((sum, c) => {
        const delivery_charge = Number(c.delivery_charge) || 0;
        const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
        const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
        return sum + Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
    }, 0);
    const vat = subtotal * 0.12;
    const totalAmount = subtotal + vat;
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
                        <Text style={{ flex: 0.5, padding: 4, backgroundColor: '#f7f3d6' }}>{contracts.length}</Text>
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
                        <Text style={{ fontSize: 9 }}>VATABLE: {`₱${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>VAT EXEMPT:</Text>
                        <Text style={{ fontSize: 9 }}>ZERO RATED:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL SALES:</Text>
                        <Text style={{ fontSize: 9 }}>TOTAL VAT: {`₱${vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                        <Text style={{ fontSize: 9 }}>AMOUNT DUE: {`₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
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

export { ReceiptPDF, InvoicePDF, formatDate };