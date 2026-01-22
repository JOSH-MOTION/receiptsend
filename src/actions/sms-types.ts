
import { z } from 'zod';

export const SendSmsInputSchema = z.object({
  to: z.string().describe("The recipient's phone number."),
  message: z.string().describe('The content of the SMS message.'),
  organizationName: z.string().optional().describe('The name of the sending organization.'),
});

export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;
