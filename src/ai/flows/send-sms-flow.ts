import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SendSmsInputSchema } from '@/actions/sms-types';

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
      const apiKey = process.env.SMS_API_KEY;
      const sender = process.env.SMS_API_SENDER || 'Quick SMS';

      if (!apiKey) {
        console.error('SMS_API_KEY not configured');
        return { success: false, message: 'SMS service not configured.' };
      }

      const url = new URL('https://linksengineering.net/apisms/api/qapi');
      url.searchParams.set('public_key', apiKey);
      url.searchParams.set('sender', sender);
      url.searchParams.set('message', input.message);
      url.searchParams.set('numbers', input.to);

      const response = await fetch(url.toString(), { method: 'GET' });
      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { raw: text };
      }

      const isSuccess =
        response.ok ||
        text.toLowerCase().includes('success') ||
        text.toLowerCase().includes('sent') ||
        text.toLowerCase().includes('ok') ||
        result?.status?.toLowerCase() === 'success';

      if (isSuccess) {
        return { success: true, message: `SMS sent to ${input.to}` };
      } else {
        return {
          success: false,
          message: result?.message || text || 'Failed to send SMS.',
        };
      }
    } catch (error: any) {
      return { success: false, message: `Network error: ${error.message}` };
    }
  }
);
