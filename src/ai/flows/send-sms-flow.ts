'use server';
/**
 * @fileOverview A flow for sending SMS messages via the Quick SMS API.
 *
 * - sendSms - A function that sends an SMS to one or more recipients.
 * - SendSmsInput - The input type for the sendSms function.
 * - SendSmsOutput - The return type for the sendSms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendSmsInputSchema = z.object({
  message: z.string().describe('The content of the SMS message.'),
  recipients: z.array(z.string()).describe('A list of phone numbers to send the SMS to.'),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

const SendSmsOutputSchema = z.object({
  success: z.boolean().describe('Whether the SMS was sent successfully.'),
  message: z.string().describe('The response message from the API.'),
});
export type SendSmsOutput = z.infer<typeof SendSmsOutputSchema>;

export async function sendSms(input: SendSmsInput): Promise<SendSmsOutput> {
  return sendSmsFlow(input);
}

const sendSmsFlow = ai.defineFlow(
  {
    name: 'sendSmsFlow',
    inputSchema: SendSmsInputSchema,
    outputSchema: SendSmsOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.SMS_API_KEY;
    const sender = process.env.SMS_API_SENDER;

    if (!apiKey || !sender) {
      throw new Error('SMS API key or sender not configured.');
    }

    const numbers = input.recipients.join(',');
    const url = `https://linksengineering.net/apisms/api/qapi?public_key=${apiKey}&sender=${sender}&message=${encodeURIComponent(
      input.message
    )}&numbers=${numbers}`;

    try {
      const response = await fetch(url);
      const textResponse = await response.text();

      if (!response.ok) {
        console.error('SMS API Error:', textResponse);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${textResponse}`,
        };
      }
      
      // The API seems to return a simple string, let's check for success indicators.
      // This part might need adjustment based on actual API success/error responses.
      if (textResponse.toLowerCase().includes('success')) {
         return {
            success: true,
            message: textResponse,
         };
      }

      return {
        success: true,
        message: `Message sent. API Response: ${textResponse}`,
      };
    } catch (error: any) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
  }
);
