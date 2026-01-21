
'use server';
/**
 * @fileOverview A flow for sending a digital receipt.
 *
 * - sendReceipt - A function that handles sending the receipt.
 * - SendReceiptInputSchema - The Zod schema for the sendReceipt input.
 * - SendReceiptInput - The input type for the sendReceipt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

const ReceiptDataSchema = z.object({
  receiptNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  items: z.array(ReceiptItemSchema),
  totalAmount: z.number(),
  thankYouMessage: z.string().optional(),
  createdAt: z.string(), // Pass as ISO string
  discount: z.number().optional(),
  tax: z.number().optional(),
  deliveryChannels: z.array(z.string()).optional(),
});

const OrganizationDataSchema = z.object({
    companyName: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
});


export const SendReceiptInputSchema = z.object({
  receipt: ReceiptDataSchema,
  organization: OrganizationDataSchema,
});
export type SendReceiptInput = z.infer<typeof SendReceiptInputSchema>;

export async function sendReceipt(input: SendReceiptInput): Promise<{ success: boolean; message: string }> {
  return sendReceiptFlow(input);
}


// This is a placeholder flow. In a real application, you would use a service
// like SendGrid or Nodemailer to send an actual email.
const sendReceiptFlow = ai.defineFlow(
  {
    name: 'sendReceiptFlow',
    inputSchema: SendReceiptInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    console.log('--- SIMULATING SENDING RECEIPT ---');
    console.log('To:', input.receipt.customerEmail);
    console.log('From:', input.organization.email || 'noreply@sendora.com');
    console.log('Subject:', `Your receipt from ${input.organization.companyName || 'Us'} (#${input.receipt.receiptNumber})`);
    
    // Here you would construct the email body (e.g., using HTML)
    // and use an email sending service.
    
    // For now, we just simulate a successful send.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const message = `Receipt sent to ${input.receipt.customerEmail}.`;
    console.log(message);
    
    return { success: true, message };
  }
);

    
