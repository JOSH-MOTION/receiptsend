
import { genkit } from 'genkit';
import next from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    next(),
    googleAI(),
  ],
});

export { ai };
