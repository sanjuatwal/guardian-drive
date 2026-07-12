import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

import { config } from './config';
import { eventTitle } from './riskEngine';
import { verifyEvidence } from './evidenceVault';
import { AlertRow, DeviceRow, EventRow } from './types';

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

// Renders the full incident timeline into a PDF buffer. Runs entirely
// server-side — the app never sees these bytes, only a success/failure ack.
export function buildPolicePackPdf(
  device: DeviceRow,
  alert: AlertRow,
  events: EventRow[],
  recipientName: string,
  verification: { valid: boolean; expected: string | null; actual: string },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Guardian Drive — Theft Incident Report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Prepared for: ${recipientName}`);
    doc.text(`Generated: ${formatTimestamp(Date.now())}`);
    doc.moveDown();

    doc.fillColor('#000').fontSize(13).text('Vehicle & Alert Summary');
    doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#ccc').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Vehicle: ${device.name} (device ${device.id})`);
    doc.text(`Alert ID: ${alert.id}`);
    doc.text(`Risk score: ${alert.risk_score}/100`);
    doc.text(`Reasons: ${(JSON.parse(alert.reasons_json) as string[]).join(', ')}`);
    doc.text(`Alert opened: ${formatTimestamp(alert.created_at)}`);
    if (alert.resolved_at) doc.text(`Confirmed by owner: ${formatTimestamp(alert.resolved_at)}`);
    if (device.lat != null && device.lng != null) {
      doc.text(`Last known location: ${device.location_label ?? ''} (${device.lat}, ${device.lng})`);
    }
    doc.moveDown();

    doc.fontSize(13).text('Event Timeline');
    doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#ccc').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (events.length === 0) {
      doc.text('No events recorded for this alert.');
    } else {
      for (const event of events) {
        const payload = JSON.parse(event.payload_json) as Record<string, unknown>;
        const detail = typeof payload.detail === 'string' ? payload.detail : null;
        doc
          .fillColor('#000')
          .font('Helvetica-Bold')
          .text(`${formatTimestamp(event.created_at)} — ${eventTitle(event.type)}`, { continued: false });
        doc
          .font('Helvetica')
          .fillColor('#333')
          .text(`Severity: ${event.severity} · Risk score: ${event.risk_score}${detail ? ` · ${detail}` : ''}`);
        doc.moveDown(0.3);
      }
    }

    doc.moveDown();
    doc.fontSize(13).fillColor('#000').text('Tamper-Evidence Verification');
    doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#ccc').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Chain valid: ${verification.valid ? 'YES — events match the locked hash chain' : 'NO — mismatch detected'}`);
    doc.text(`Evidence hash: ${verification.actual}`);

    doc.end();
  });
}

// Emails the PDF directly to the recipient via Resend. Returns the message id
// on success; throws on failure (caller maps that to an HTTP error).
export async function sendPolicePackEmail(params: {
  toEmail: string;
  recipientName: string;
  device: DeviceRow;
  alert: AlertRow;
  pdfBuffer: Buffer;
}): Promise<string> {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured on the backend');
  }

  const resend = new Resend(config.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: config.resendFromEmail,
    to: params.toEmail,
    subject: `Guardian Drive Incident Report — ${params.device.name}`,
    text:
      `Hello ${params.recipientName},\n\n` +
      `Attached is the incident report for a theft alert on ${params.device.name} ` +
      `(risk score ${params.alert.risk_score}/100). This report includes the full, ` +
      `tamper-evident event timeline.\n\nGuardian Drive`,
    attachments: [
      {
        filename: `guardian-drive-incident-${params.alert.id}.pdf`,
        content: params.pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }
  return data?.id ?? '';
}
