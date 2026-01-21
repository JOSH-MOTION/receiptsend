
import { genkit, ai } from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/google-genai';

genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai };

    