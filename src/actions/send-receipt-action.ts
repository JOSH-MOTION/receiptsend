
'use server';

/**
 * Server action to send a receipt via email.
 * This wraps the genkit flow for sending receipts and makes it accessible from client components.
 */

import { sendReceipt } from '@/ai/flows/send-receipt-flow';
import type { SendReceiptInput } from '@/actions/receipt-types';

/**
 * Send a receipt via email (server action)
 */
export async function sendReceiptAction(input: SendReceiptInput): Promise<{ success: boolean; message: string }> {
  try {
    // The server action now directly calls the Genkit flow.
    // The Zod validation is handled inside the flow itself.
    const result = await sendReceipt(input);
    return result;
  } catch (error) {
    console.error('Error in sendReceiptAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while sending the receipt.';
    return { 
      success: false, 
      message: errorMessage,
    };
  }
}
