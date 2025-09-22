import React from 'react';
import { Document, Page as PDFPage, Text, View, Font, Image } from '@react-pdf/renderer';
import { startOfMonth, endOfMonth } from 'date-fns';
import { format as formatDateFns } from 'date-fns';

// Register fonts (PDF context)
try {
    Font.register({
        family: 'Roboto',
        fonts: [
            { src: '/fonts/Roboto-VariableFont_wdth,wght.ttf', fontWeight: 'normal', fontStyle: 'normal' },
            { src: '/fonts/Roboto-VariableFont_wdth,wght.ttf', fontWeight: 'bold', fontStyle: 'normal' },
            { src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf', fontWeight: 'normal', fontStyle: 'italic' },
            { src: '/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf', fontWeight: 'bold', fontStyle: 'italic' },
        ],
    });
} catch {}

// Combined SOA + Invoice document
export const CombinedSOAInvoicePDF = ({ contracts = [], dateRange, invoiceNumber = null, proofOfDeliveryData = {} }) => {
    try {
        const today = new Date();
        const todayFormatted = formatDateFns(today, 'MMMM d, yyyy');
        const invoiceNo = invoiceNumber || formatDateFns(today, 'yyyyMMdd');
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const dueDate = formatDateFns(monthEnd, 'MMMM d, yyyy');
        const safeContracts = Array.isArray(contracts) ? contracts : [];
        const soaNumber = (safeContracts[0] && (safeContracts[0].summary_id || safeContracts[0].summaryId)) || invoiceNo;

        const getRowAmount = (c) => {
            const delivery_charge = Number(c.delivery_charge) || 0;
            const delivery_surcharge = Number(c.delivery_surcharge || c.surcharge) || 0;
            const delivery_discount = Number(c.delivery_discount || c.discount) || 0;
            return Math.max(0, (delivery_charge + delivery_surcharge) - delivery_discount);
        };

        const totalAmount = safeContracts.reduce((sum, c) => sum + getRowAmount(c), 0);
        const vat = totalAmount * 0.12;
        const finalTotal = totalAmount;

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            } catch { return 'N/A'; }
        };

        // Use fixed widths (percentages) to avoid flex rounding differences across rows
        const colPct = {
            qty: '7.692%',      // 1/13
            unit: '15.384%',    // 2/13
            desc: '61.538%',    // 8/13
            total: '15.384%',   // 2/13
        };
        const termsPct = { terms: '25%', payment: '50%', due: '25%' };

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
                    <View style={{ flexDirection: 'row', fontWeight: 'bold', fontSize: 9, borderWidth: 1, borderColor: '#000', borderStyle: 'solid' }}>
                        <View style={{ width: termsPct.terms, borderRightWidth: 1, borderColor: '#000', padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>TERMS</Text></View>
                        <View style={{ width: termsPct.payment, borderRightWidth: 1, borderColor: '#000', padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>PAYMENT METHOD</Text></View>
                        <View style={{ width: termsPct.due, padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>DUE DATE</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'solid' }}>
                        <Text style={{ width: termsPct.terms, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>30 DAYS</Text>
                        <Text style={{ width: termsPct.payment, padding: 4, borderRightWidth: 1, borderColor: '#000' }}>DOMESTIC FUND TRANSFER</Text>
                        <Text style={{ width: termsPct.due, padding: 4 }}>{dueDate}</Text>
                    </View>
                    {/* Invoice Table */}
                    <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', fontWeight: 'bold', fontSize: 9, borderWidth: 1, borderColor: '#000', borderStyle: 'solid' }}>
                            <View style={{ width: colPct.qty, borderRightWidth: 1, borderColor: '#000', padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>QTY</Text></View>
                            <View style={{ width: colPct.unit, borderRightWidth: 1, borderColor: '#000', padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>UNIT</Text></View>
                            <View style={{ width: colPct.desc, borderRightWidth: 1, borderColor: '#000', padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>DESCRIPTION</Text></View>
                            <View style={{ width: colPct.total, padding: 4, minHeight: 20, justifyContent: 'center' }}><Text>TOTAL AMOUNT DUE</Text></View>
                        </View>
                        <View style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'solid', minHeight: 20, alignItems: 'stretch' }}>
                            <View style={{ width: colPct.qty, borderRightWidth: 1, borderColor: '#000', padding: 4, justifyContent: 'center' }}><Text>{safeContracts.length}</Text></View>
                            <View style={{ width: colPct.unit, borderRightWidth: 1, borderColor: '#000', padding: 4, justifyContent: 'center' }}><Text>PCS</Text></View>
                            <View style={{ width: colPct.desc, borderRightWidth: 1, borderColor: '#000', padding: 4, justifyContent: 'center' }}><Text>{`PIRs Luggage Delivery - (${formatDateFns(monthStart, 'dd/MM/yyyy')} to ${formatDateFns(monthEnd, 'dd/MM/yyyy')})`}</Text></View>
                            <View style={{ width: colPct.total, padding: 4, justifyContent: 'center' }}><Text>PHP</Text></View>
                        </View>
                        {[...Array(7)].map((_, i) => (
                            <View key={i} style={{ flexDirection: 'row', fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'solid', minHeight: 20, alignItems: 'stretch' }}>
                                <View style={{ width: colPct.qty, borderRightWidth: 1, borderColor: '#000' }} />
                                <View style={{ width: colPct.unit, borderRightWidth: 1, borderColor: '#000' }} />
                                <View style={{ width: colPct.desc, borderRightWidth: 1, borderColor: '#000' }} />
                                <View style={{ width: colPct.total }} />
                            </View>
                        ))}
                        {/* Note row as a single full-width cell (no internal column lines) */}
                        <View style={{ fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'solid', minHeight: 20, justifyContent: 'center' }}>
                            <Text style={{ padding: 4, fontWeight: 'bold' }}>Note: All Original Documents are Included in this statement</Text>
                        </View>
                        {/* Total row - single full-width cell (no internal column lines) */}
                        <View style={{ fontSize: 9, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'solid', minHeight: 20, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <Text style={{ padding: 4, fontWeight: 'bold' }}>Total Amount Due:&nbsp;</Text>
                                <Text style={{ padding: 4, fontWeight: 'bold' }}>{`₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                            </View>
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
                    {/* Signatures */}
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
                {/* Keep existing SOA markup from the page if desired; omitted here for brevity. */}

                {/* Proof of Delivery Pages */}
                {safeContracts.map((contract, index) => {
                    const podData = proofOfDeliveryData[contract.id];
                    const ownerName = contract.owner_first_name || contract.owner_middle_initial || contract.owner_last_name 
                        ? `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim()
                        : 'N/A';
                    const formatDateLocal = (dateString) => {
                        if (!dateString) return 'N/A';
                        try { const date = new Date(dateString); return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch { return 'N/A'; }
                    };
                    return (
                        <PDFPage key={`pod-${contract.id}`} size="A4" style={{ padding: 24, fontSize: 10, fontFamily: 'Roboto' }}>
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>PROOF OF DELIVERY</Text>
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
                                    <Text style={{ fontSize: 10, marginBottom: 2 }}>Delivery Date: {formatDateLocal(contract.delivered_at || contract.created_at)}</Text>
                                    <Text style={{ fontSize: 10, marginBottom: 2 }}>Status: {contract.contract_status?.status_name || 'N/A'}</Text>
                                </View>
                            </View>
                            {podData && podData.proof_of_delivery ? (
                                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Proof of Delivery Image:</Text>
                                    <View style={{ width: '100%', height: 400, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                                        <Image src={podData.proof_of_delivery} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} cache={false} />
                                    </View>
                                    {podData.delivery_timestamp && (
                                        <Text style={{ fontSize: 10, marginTop: 8, color: '#666' }}>Delivered at: {formatDateLocal(podData.delivery_timestamp)}</Text>
                                    )}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', marginBottom: 16, padding: 20, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
                                    <Text style={{ fontSize: 12, color: '#666' }}>No proof of delivery available for this contract</Text>
                                </View>
                            )}
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


