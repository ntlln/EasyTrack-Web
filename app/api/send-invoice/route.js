import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
    try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { to, subject, html, text, pdfBase64, fileName } = body || {};

        // Fallback: if no recipient provided, send to self (env)
        const fallbackTo = process.env.RESEND_TO_SELF || process.env.RESEND_FROM_EMAIL;
        const recipient = to || fallbackTo;
        if (!recipient) {
            return NextResponse.json({ error: 'Recipient email is required (provide "to" or set RESEND_TO_SELF/RESEND_FROM_EMAIL)' }, { status: 400 });
        }
        if (!pdfBase64) {
            return NextResponse.json({ error: 'pdfBase64 is required' }, { status: 400 });
        }

        const resend = new Resend(resendApiKey);

        // Convert base64 to Buffer for attachment content
        let attachmentBuffer;
        try {
            attachmentBuffer = Buffer.from(pdfBase64, 'base64');
        } catch (e) {
            return NextResponse.json({ error: 'Invalid pdfBase64 content' }, { status: 400 });
        }

        const payload = {
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: recipient,
            subject: subject || 'Your Invoice & SOA PDF',
            html: html || '<p>Please find your invoice attached.</p>',
            text: text || 'Please find your invoice attached.',
            reply_to: process.env.RESEND_REPLY_TO || undefined,
            attachments: [
                {
                    filename: fileName || 'invoice.pdf',
                    content: attachmentBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const response = await resend.emails.send(payload);

        if (response.error) {
            console.error('Resend error:', response.error);
            return NextResponse.json({ error: response.error.message || 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: response.data?.id || null });
    } catch (error) {
        console.error('Send invoice API error:', error);
        return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
    }
}


