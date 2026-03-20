'use server';

import { getFirestore, doc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { SMS_PACKAGES, type SmsPurchaseRecord } from '@/actions/sms-package-types';

/**
 * Called after successful payment to credit SMS units to the organization.
 * Uses a Firestore transaction to safely update the balance.
 */
export async function creditSmsUnits(
  organizationId: string,
  packageId: string,
  paymentReference: string,
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  try {
    const pkg = SMS_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Invalid package selected.' };
    }

    const { firestore } = initializeFirebase();
    const totalUnits = pkg.units + (pkg.bonus || 0);
    const orgRef = doc(firestore, 'organizations', organizationId);

    let newBalance = 0;

    await runTransaction(firestore, async (transaction) => {
      const orgDoc = await transaction.get(orgRef);
      if (!orgDoc.exists()) {
        throw new Error('Organization not found.');
      }

      const currentBalance = orgDoc.data().smsBalance || 0;
      const currentTotalPurchased = orgDoc.data().smsTotalPurchased || 0;

      newBalance = currentBalance + totalUnits;

      // Update the org document with the new balance
      transaction.update(orgRef, {
        smsBalance: newBalance,
        smsTotalPurchased: currentTotalPurchased + totalUnits,
        smsLastTopUp: serverTimestamp(),
      });
    });

    // Log the purchase in a sub-collection for history
    const purchasesCol = collection(firestore, 'organizations', organizationId, 'smsPurchases');
    await addDoc(purchasesCol, {
      organizationId,
      packageId: pkg.id,
      packageName: pkg.name,
      amountPaid: pkg.price,
      unitsPurchased: pkg.units,
      bonusUnits: pkg.bonus || 0,
      totalUnits,
      paymentReference,
      createdAt: serverTimestamp(),
    } satisfies Omit<SmsPurchaseRecord, 'createdAt'> & { createdAt: any });

    return {
      success: true,
      message: `${totalUnits} SMS units added to your account.`,
      newBalance,
    };
  } catch (error: any) {
    console.error('Error crediting SMS units:', error);
    return { success: false, message: error.message || 'Failed to add SMS credits.' };
  }
}

/**
 * Deducts 1 SMS unit from the organization's balance.
 * Returns false if insufficient balance.
 */
export async function deductSmsUnit(
  organizationId: string,
): Promise<{ success: boolean; message: string; remainingBalance?: number }> {
  try {
    const { firestore } = initializeFirebase();
    const orgRef = doc(firestore, 'organizations', organizationId);
    let remainingBalance = 0;

    await runTransaction(firestore, async (transaction) => {
      const orgDoc = await transaction.get(orgRef);
      if (!orgDoc.exists()) {
        throw new Error('Organization not found.');
      }

      const currentBalance = orgDoc.data().smsBalance || 0;

      if (currentBalance <= 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      remainingBalance = currentBalance - 1;
      const currentTotalUsed = orgDoc.data().smsTotalUsed || 0;

      transaction.update(orgRef, {
        smsBalance: remainingBalance,
        smsTotalUsed: currentTotalUsed + 1,
      });
    });

    return { success: true, message: 'Unit deducted.', remainingBalance };
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return {
        success: false,
        message: 'You have no SMS units remaining. Please top up to continue sending.',
      };
    }
    console.error('Error deducting SMS unit:', error);
    return { success: false, message: error.message || 'Failed to deduct SMS unit.' };
  }
}