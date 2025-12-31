// app/api/paystack/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack';
import { Organization, Transaction } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { smsPricingBundles } from '@/lib/sms-pricing-updated';

export async function GET(request: NextRequest) {
  try {
    // Get reference from query params
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?payment=failed&error=no_reference', request.url)
      );
    }

    // Connect to database
    await connectDB();

    // Verify payment with Paystack
    const verification = await paystackService.verifyTransaction(reference);

    // Check if payment was successful
    if (verification.data.status !== 'success') {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?payment=failed&status=${verification.data.status}`, request.url)
      );
    }

    // Get metadata
    const metadata = verification.data.metadata;
    const organizationId = metadata.organizationId;
    const units = metadata.units;
    const bundleId = metadata.bundleId;

    // Find organization and update balance
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?payment=failed&error=org_not_found', request.url)
      );
    }

    // Get bundle info
    const bundle = smsPricingBundles.find(b => b.id === bundleId);
    if (!bundle) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?payment=failed&error=invalid_bundle', request.url)
      );
    }

    // Add units to organization balance
    const currentBalance = organization.smsBalance || 0;
    const newBalance = currentBalance + units;

    // Update organization
    organization.smsBalance = newBalance;
    organization.totalSpent = (organization.totalSpent || 0) + bundle.price;
    organization.totalPurchased = (organization.totalPurchased || 0) + units;
    await organization.save();

    // Log the transaction
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
      bundle: bundle.name,
      amount: bundle.price,
      units,
      previousBalance: currentBalance,
      newBalance,
    });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL(`/dashboard/settings?payment=success&units=${units}&tab=sms`, request.url)
    );

  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?payment=failed&error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

// Webhook endpoint for Paystack notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (important for security)
    const signature = request.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    
    // TODO: Implement signature verification
    // const crypto = require('crypto');
    // const hash = crypto
    //   .createHmac('sha512', secret)
    //   .update(JSON.stringify(body))
    //   .digest('hex');
    // 
    // if (hash !== signature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Handle webhook event
    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
      // Connect to database
      await connectDB();

      // Get metadata
      const metadata = data.metadata;
      const organizationId = metadata.organizationId;
      const units = metadata.units;
      const bundleId = metadata.bundleId;

      // Update organization balance
      const organization = await Organization.findById(organizationId);
      if (organization) {
        const bundle = smsPricingBundles.find(b => b.id === bundleId);
        
        const currentBalance = organization.smsBalance || 0;
        organization.smsBalance = currentBalance + units;
        organization.totalSpent = (organization.totalSpent || 0) + (bundle?.price || 0);
        organization.totalPurchased = (organization.totalPurchased || 0) + units;
        await organization.save();

        // Log transaction if not already logged
        const existingTransaction = await Transaction.findOne({ reference: data.reference });
        if (!existingTransaction && bundle) {
          const transaction = new Transaction({
            organizationId: organization._id.toString(),
            organizationName: organization.companyName,
            reference: data.reference,
            bundleId: bundle.id,
            bundleName: bundle.name,
            amount: bundle.price,
            units: units,
            status: 'success',
            paystackResponse: JSON.stringify(data),
          });
          await transaction.save();
        }

        console.log('✅ Webhook: SMS units added:', {
          organizationId,
          organization: organization.companyName,
          units,
          newBalance: organization.smsBalance,
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}