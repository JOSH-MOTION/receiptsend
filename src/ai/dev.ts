
/**
 * @fileoverview This file is the entrypoint for Genkit's developer UI.
 */
import { genkit } from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/google-genai';

// Load the flows from their files
import './flows/send-receipt-flow';
import './flows/send-sms-flow';

// Configure Genkit
genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

    
