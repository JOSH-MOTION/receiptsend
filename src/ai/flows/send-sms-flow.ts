'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SendSmsInputSchema, type SendSmsInput } from '@/actions/sms-types';

export async function sendSms(input: SendSmsInput): Promise<{ success: boolean; message: string }> {
    return sendSmsFlow(input);
}

export const sendSmsFlow = ai.defineFlow(
  {
    name: 'sendSmsFlow',
    inputSchema: SendSmsInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    // This is a simulated flow.
    // In a real application, you would integrate with an SMS gateway provider.
    console.log('--- SIMULATED SMS SEND ---');
    console.log('To:', input.to);
    console.log('From:', input.organizationName || 'SENDORA');
    console.log('Message:', input.message);
    console.log('--- END SIMULATED SMS ---');
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Always return success for the simulation
    return { 
      success: true, 
      message: `Simulated SMS sent to ${input.to}`
    };
  }
);
