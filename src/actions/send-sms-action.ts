'use server';

import { sendSms } from '@/ai/flows/send-sms-flow';
import { z } from 'zod';
import type { SendSmsInput } from '@/actions/sms-types';
import { deductSmsUnit } from '@/actions/sms-credit-actions';

export async function sendSmsAction(
  input: SendSmsInput,
  organizationId?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // --- Credit check ---
    if (organizationId) {
      const deductResult = await deductSmsUnit(organizationId);
      if (!deductResult.success) {
        return {
          success: false,
          message: deductResult.message, // "You have no SMS units remaining..."
        };
      }
    }

    // --- Send the SMS ---
    const result = await sendSms(input);

    // If the actual SMS send fails, refund the unit
    if (!result.success && organizationId) {
      // We do a best-effort refund by re-crediting 1 unit
      // Import dynamically to avoid circular deps
      const { creditSmsUnits } = await import('@/actions/sms-credit-actions');
      // Minimal refund — add 1 unit back using a special refund reference
      try {
        const { getFirestore, doc, updateDoc, increment } = await import('firebase/firestore');
        const { initializeFirebase } = await import('@/firebase');
        const { firestore } = initializeFirebase();
        const orgRef = doc(firestore, 'organizations', organizationId);
        await updateDoc(orgRef, {
          smsBalance: increment(1),
          smsTotalUsed: increment(-1),
        });
      } catch (refundErr) {
        console.error('Could not refund SMS unit after failed send:', refundErr);
      }
    }

    return result;
  } catch (error) {
    console.error('Error in sendSmsAction:', error);
    let errorMessage = 'An unexpected error occurred while sending the SMS.';
    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}