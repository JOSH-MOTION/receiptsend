// app/api/paystack/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack';
import { Organization, Transaction } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { smsPricingBundles } from '@/lib/sms-pricing-updated';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(
        new URL('/settings?payment=failed&error=no_reference', request.url)
      );
    }

    await connectDB();

    const verification = await paystackService.verifyTransaction(reference);

    if (verification.data.status !== 'success') {
      return NextResponse.redirect(
        new URL(`/settings?payment=failed&status=${verification.data.status}`, request.url)
      );
    }

    const metadata = verification.data.metadata;
    const organizationId = metadata.organizationId;
    const units = metadata.units;
    const bundleId = metadata.bundleId;

    // Prevent re-processing the same successful transaction
    const existingTransaction = await Transaction.findOne({ reference });
    if (existingTransaction) {
        console.log('⚠️ Transaction already processed:', reference);
        return NextResponse.redirect(
          new URL(`/settings?payment=success&units=${units}&tab=sms`, request.url)
        );
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.redirect(
        new URL('/settings?payment=failed&error=org_not_found', request.url)
      );
    }

    const bundle = smsPricingBundles.find(b => b.id === bundleId);
    if (!bundle) {
      return NextResponse.redirect(
        new URL('/settings?payment=failed&error=invalid_bundle', request.url)
      );
    }

    // Update organization's virtual credit balance
    organization.smsBalance = (organization.smsBalance || 0) + units;
    organization.totalSpent = (organization.totalSpent || 0) + bundle.price;
    organization.totalPurchased = (organization.totalPurchased || 0) + units;
    await organization.save();

    // Log the successful transaction in our database
    const transaction = new Transaction({
      organizationId: organization._id.toString(),
      organizationName: organization.companyName,
      reference: verification.data.reference,
      bundleId: bundle.id,
      bundleName: bundle.name,
      amount: bundle.price,
      units: units,
      status: 'success',
      paystackResponse: JSON.stringify(verification.data),
    });
    await transaction.save();

    console.log('✅ Payment successful:', {
      reference,
      organization: organization.companyName,
      units,
      newBalance: organization.smsBalance,
    });

    return NextResponse.redirect(
      new URL(`/settings?payment=success&units=${units}&tab=sms`, request.url)
    );

  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?payment=failed&error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

// Webhook endpoint for Paystack notifications (for redundancy)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;
    const data = body.data;

    // TODO: Verify webhook signature for security

    if (event === 'charge.success') {
      await connectDB();

      const { reference, metadata } = data;
      const { organizationId, units, bundleId } = metadata;
      
      const existingTransaction = await Transaction.findOne({ reference });
      if (existingTransaction) {
        console.log('✅ Webhook: Transaction already processed.', reference);
        return NextResponse.json({ status: 'ok' });
      }

      const organization = await Organization.findById(organizationId);
      if (organization) {
        const bundle = smsPricingBundles.find(b => b.id === bundleId);
        
        organization.smsBalance = (organization.smsBalance || 0) + units;
        organization.totalSpent = (organization.totalSpent || 0) + (bundle?.price || 0);
        organization.totalPurchased = (organization.totalPurchased || 0) + units;
        await organization.save();

        if (bundle) {
            const transaction = new Transaction({
                organizationId,
                organizationName: organization.companyName,
                reference,
                bundleId,
                bundleName: bundle.name,
                amount: bundle.price,
                units,
                status: 'success',
                paystackResponse: JSON.stringify(data),
            });
            await transaction.save();
        }
        console.log('✅ Webhook: SMS units added via webhook.', { organizationId, units });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
