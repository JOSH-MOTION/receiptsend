
'use server';

/**
 * Server action to send an SMS.
 * This wraps the Genkit flow for sending SMS and makes it accessible from client components.
 */

import { sendSms } from '@/ai/flows/send-sms-flow';
import { z } from 'zod';
import type { SendSmsInput } from '@/actions/sms-types';

export async function sendSmsAction(input: SendSmsInput): Promise<{ success: boolean; message: string }> {
  try {
    // The server action now directly calls the Genkit flow.
    const result = await sendSms(input);
    return result;
  } catch (error) {
    console.error('Error in sendSmsAction:', error);
    
    let errorMessage = 'An unexpected error occurred while sending the SMS.';
    if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(', ');
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
    };
  }
}
