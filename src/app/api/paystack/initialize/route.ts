// app/api/paystack/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/paystack';
import { Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { smsPricingBundles } from '@/lib/sms-pricing-updated';

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { bundleId } = await request.json();
    const bundle = smsPricingBundles.find(b => b.id === bundleId);
    if (!bundle) {
      return NextResponse.json({ error: 'Invalid bundle selected' }, { status: 400 });
    }

    const paymentData = await paystackService.initializeTransaction(
      organization.email,
      bundle.price,
      {
        bundleId: bundle.id,
        units: bundle.units,
        organizationId: organization._id.toString(),
      }
    );

    return NextResponse.json({
      success: true,
      authorizationUrl: paymentData.data.authorization_url,
    });

  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
