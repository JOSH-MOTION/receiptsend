'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SendSmsInputSchema, type SendSmsInput } from '@/actions/sms-types';
import { getFirestore, doc, runTransaction } from 'firebase/firestore';

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
    try {
      const publicKey = process.env.QUICKSMS_PUBLIC_KEY;
      const senderId = input.organizationName || process.env.QUICKSMS_SENDER_ID || 'Sendora';

      if (!publicKey) {
        console.error('QUICKSMS_PUBLIC_KEY not configured');
        return { success: false, message: 'SMS service not configured' };
      }

      console.log('📱 Sending SMS via Quick SMS...');
      console.log('To:', input.to);
      console.log('From:', senderId);
      console.log('Message:', input.message);

      const apiUrl = new URL('https://linksengineering.net/apisms/api/qapi');
      apiUrl.searchParams.append('public_key', publicKey);
      apiUrl.searchParams.append('sender', senderId);
      apiUrl.searchParams.append('message', input.message);
      apiUrl.searchParams.append('numbers', input.to);

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
      });

      const result = await response.text();

      if (response.ok && (result.toLowerCase().includes('success') || result.includes('200'))) {
        console.log('✅ SMS sent successfully:', result);
        return {
          success: true,
          message: `SMS sent to ${input.to}`,
        };
      } else {
        console.error('❌ Quick SMS API error:', result);
        return {
          success: false,
          message: `Failed to send SMS: ${result}`,
        };
      }
    } catch (error: any) {
      console.error('❌ Error sending SMS:', error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS',
      };
    }
  }
);