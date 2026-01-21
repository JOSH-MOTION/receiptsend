'use server';

/**
 * Server action to send a receipt via email.
 * This wraps the email sending logic and makes it accessible from client components.
 */

import { SendReceiptInputSchema, type SendReceiptInput } from '@/actions/receipt-types';

/**
 * Send a receipt via email (server action)
 */
export async function sendReceiptAction(input: SendReceiptInput): Promise<{ success: boolean; message: string }> {
  try {
    // Validate input
    SendReceiptInputSchema.parse(input);
    
    // Simulate sending email
    console.log('--- SIMULATING SENDING RECEIPT ---');
    console.log('To:', input.receipt.customerEmail);
    console.log('From:', input.organization.email || 'noreply@sendora.com');
    console.log('Subject:', `Your receipt from ${input.organization.companyName || 'Us'} (#${input.receipt.receiptNumber})`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const message = `Receipt sent to ${input.receipt.customerEmail}.`;
    console.log(message);
    
    return { success: true, message };
  } catch (error) {
    console.error('Error sending receipt:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send receipt' 
    };
  }
}