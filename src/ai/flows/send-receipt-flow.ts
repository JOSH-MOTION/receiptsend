'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SendReceiptInputSchema, type SendReceiptInput } from '@/actions/receipt-types';

export async function sendReceipt(input: SendReceiptInput): Promise<{ success: boolean; message: string }> {
  return sendReceiptFlow(input);
}

const sendReceiptFlow = ai.defineFlow(
  {
    name: 'sendReceiptFlow',
    inputSchema: SendReceiptInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.error('RESEND_API_KEY not configured');
        return { success: false, message: 'Email service not configured' };
      }

      // Generate HTML email
      const emailHtml = generateReceiptEmailHtml(input);
      
      // Send via Resend API directly
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // IMPORTANT: Use onboarding@resend.dev for testing without domain verification
          from: 'Sendora Receipts <onboarding@resend.dev>',
          to: [input.receipt.customerEmail],
          subject: `Your receipt from ${input.organization.companyName || 'SENDORA'} (#${input.receipt.receiptNumber})`,
          html: emailHtml,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Email sent successfully:', result);
        return { success: true, message: `Receipt sent to ${input.receipt.customerEmail}` };
      } else {
        console.error('❌ Resend API error:', result);
        return { 
          success: false, 
          message: `Failed to send email: ${result.message || 'Unknown error'}` 
        };
      }
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      return { success: false, message: error.message || 'Failed to send email' };
    }
  }
);

function generateReceiptEmailHtml(input: SendReceiptInput): string {
  const { receipt, organization } = input;
  
  const itemsHtml = receipt.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right;">GH₵${item.price.toFixed(2)}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">GH₵${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const subtotal = receipt.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const discount = receipt.discount || 0;
  const discountAmount = subtotal * (discount / 100);
  const tax = receipt.tax || 0;
  const taxAmount = (subtotal - discountAmount) * (tax / 100);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt #${receipt.receiptNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        ${organization.logoUrl ? `<img src="${organization.logoUrl}" alt="Logo" style="max-width: 80px; margin-bottom: 15px;">` : ''}
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${organization.companyName || 'SENDORA'}</h1>
        ${organization.address ? `<p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${organization.address}</p>` : ''}
      </div>
      
      <!-- Receipt Info -->
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px;">Receipt #${receipt.receiptNumber}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 200px;">
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong style="color: #1f2937;">Customer:</strong> ${receipt.customerName}</p>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong style="color: #1f2937;">Email:</strong> ${receipt.customerEmail}</p>
            </div>
            <div style="flex: 1; min-width: 200px; text-align: right;">
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong style="color: #1f2937;">Date:</strong> ${new Date(receipt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
              <th style="padding: 12px 8px; text-align: center; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
              <th style="padding: 12px 8px; text-align: right; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
              <th style="padding: 12px 8px; text-align: right; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <div style="text-align: right; margin-bottom: 8px;">
            <span style="color: #6b7280; margin-right: 20px;">Subtotal:</span>
            <span style="font-weight: 600; color: #1f2937;">GH₵${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
          <div style="text-align: right; margin-bottom: 8px;">
            <span style="color: #6b7280; margin-right: 20px;">Discount (${discount}%):</span>
            <span style="font-weight: 600; color: #dc2626;">-GH₵${discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${tax > 0 ? `
          <div style="text-align: right; margin-bottom: 8px;">
            <span style="color: #6b7280; margin-right: 20px;">Tax (${tax}%):</span>
            <span style="font-weight: 600; color: #1f2937;">+GH₵${taxAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: right;">
            <span style="font-size: 18px; margin-right: 20px; font-weight: 600;">Total:</span>
            <span style="font-size: 24px; font-weight: 700;">GH₵${receipt.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Thank You Message -->
      ${receipt.thankYouMessage ? `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #1f2937; font-style: italic; font-size: 16px;">${receipt.thankYouMessage}</p>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p style="margin: 5px 0;">This is an automated receipt from ${organization.companyName || 'SENDORA'}</p>
        ${organization.email ? `<p style="margin: 5px 0;">Questions? Contact us at ${organization.email}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}