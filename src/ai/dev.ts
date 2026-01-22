
/**
 * @fileoverview This file is the entrypoint for Genkit's developer UI.
 */

// Load the flows from their files.
// This is enough for the Genkit CLI to discover the flows, which use the
// centralized configuration from @/ai/genkit.ts.
import './flows/send-receipt-flow';
import './flows/send-sms-flow';
