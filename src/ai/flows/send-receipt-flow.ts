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
    // This is a simulated flow.
    // In a real application, you would integrate with an email service provider.
    console.log('--- SIMULATED EMAIL SEND ---');
    console.log('To:', input.receipt.customerEmail);
    console.log('From:', `Sendora Receipts <onboarding@resend.dev>`);
    console.log('Subject:', `Your receipt from ${input.organization.companyName || 'SENDORA'} (#${input.receipt.receiptNumber})`);
    console.log('Body (HTML would be generated and sent here)');
    console.log('--- END SIMULATED EMAIL ---');
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Always return success for the simulation
    return { 
      success: true, 
      message: `Simulated receipt sent to ${input.receipt.customerEmail}` 
    };
  }
);
