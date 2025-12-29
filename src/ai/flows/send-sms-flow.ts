'use server';
/**
 * @fileOverview A flow for sending SMS messages via the Quick SMS API.
 *
 * - sendSms - A function that sends an SMS to one or more recipients for a specific organization.
 * - SendSmsInput - The input type for the sendSms function.
 * - SendSmsOutput - The return type for the sendSms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const SendSmsInputSchema = z.object({
  organizationId: z.string().describe('The ID of the organization sending the SMS.'),
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
    const { firestore } = initializeFirebase();
    const orgRef = doc(firestore, `organizations/${input.organizationId}`);
    
    let apiKey: string | undefined;
    let sender: string | undefined;

    try {
      const orgDoc = await getDoc(orgRef);
      if (!orgDoc.exists()) {
        throw new Error(`Organization with ID ${input.organizationId} not found.`);
      }
      const orgData = orgDoc.data();
      apiKey = orgData.smsApiKey;
      sender = orgData.smsSenderId;

    } catch (error: any) {
        console.error("Failed to fetch organization credentials:", error);
        return {
            success: false,
            message: `Could not retrieve SMS credentials for the organization. ${error.message}`
        }
    }


    if (!apiKey || !sender) {
      return {
        success: false,
        message: 'SMS API Key or Sender Name is not configured for this organization in Settings > SMS.',
      }
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

    