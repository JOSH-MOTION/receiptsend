
import genkit from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/google-genai';

const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

export { ai };
