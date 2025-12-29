'use server';
/**
 * @fileOverview AI-powered receipt layout enhancement flow.
 *
 * - enhanceReceiptLayout - A function that enhances the receipt layout with AI suggestions.
 * - EnhanceReceiptLayoutInput - The input type for the enhanceReceiptLayout function.
 * - EnhanceReceiptLayoutOutput - The return type for the enhanceReceiptLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceReceiptLayoutInputSchema = z.object({
  currentLayout: z.string().describe('The current receipt layout.'),
  priorLayouts: z.array(z.string()).describe('An array of prior receipt layouts.'),
  emailCopy: z.string().describe('The email copy used for sending receipts.'),
  smsWording: z.string().describe('The SMS wording used for receipt notifications.'),
  companyBranding: z.string().describe('Description of company branding elements like logo and colors.'),
});
export type EnhanceReceiptLayoutInput = z.infer<typeof EnhanceReceiptLayoutInputSchema>;

const EnhanceReceiptLayoutOutputSchema = z.object({
  enhancedLayout: z.string().describe('The enhanced receipt layout with AI suggestions.'),
  suggestions: z.array(z.string()).describe('Specific suggestions for improvement.'),
});
export type EnhanceReceiptLayoutOutput = z.infer<typeof EnhanceReceiptLayoutOutputSchema>;

export async function enhanceReceiptLayout(input: EnhanceReceiptLayoutInput): Promise<EnhanceReceiptLayoutOutput> {
  return enhanceReceiptLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceReceiptLayoutPrompt',
  input: {schema: EnhanceReceiptLayoutInputSchema},
  output: {schema: EnhanceReceiptLayoutOutputSchema},
  prompt: `You are an AI assistant specializing in enhancing receipt layouts for businesses.

You will receive the current receipt layout, prior receipt layouts, email copy, SMS wording, and company branding information.
Based on this information, you will suggest enhancements to the receipt layout to make it look more professional and consistent with the company's brand.

Consider the following aspects when providing suggestions:
- Visual appeal: Is the layout visually appealing and easy to read?
- Branding: Does the layout effectively incorporate the company's branding elements?
- Consistency: Is the layout consistent with prior receipt layouts, email copy, and SMS wording?
- Clarity: Is the information presented clearly and concisely?

Current Layout:
{{currentLayout}}

Prior Layouts:
{{#each priorLayouts}}
{{this}}
{{/each}}

Email Copy:
{{emailCopy}}

SMS Wording:
{{smsWording}}

Company Branding:
{{companyBranding}}

Provide the enhanced layout and a list of specific suggestions for improvement.

Enhanced Layout:`, // The AI will provide the enhanced layout here
});

const enhanceReceiptLayoutFlow = ai.defineFlow(
  {
    name: 'enhanceReceiptLayoutFlow',
    inputSchema: EnhanceReceiptLayoutInputSchema,
    outputSchema: EnhanceReceiptLayoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
