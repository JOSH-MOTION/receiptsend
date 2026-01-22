'use server';
/**
 * @fileOverview A flow for sending a SMS message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SendSmsInputSchema = z.object({
  to: z.string().describe('The recipient\'s phone number.'),
  message: z.string().describe('The content of the SMS message.'),
  organizationName: z.string().optional().describe('The name of the sending organization.'),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

export async function sendSms(input: SendSmsInput): Promise<{ success: boolean; message: string }> {
  return sendSmsFlow(input);
}

const sendSmsFlow = ai.defineFlow(
  {
    name: 'sendSmsFlow',
    inputSchema: SendSmsInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    console.log('--- SIMULATING SENDING SMS ---');
    console.log('To:', input.to);
    console.log('From:', input.organizationName || 'SENDORA');
    console.log('Message:', input.message);
    
    // In a real application, you would integrate with an SMS gateway like Twilio.
    // This requires a secure backend (e.g., Firebase Function) to handle API keys.
    
    // For now, we just simulate a successful send.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const message = `SMS sent to ${input.to}.`;
    console.log(message);
    
    return { success: true, message };
  }
);
