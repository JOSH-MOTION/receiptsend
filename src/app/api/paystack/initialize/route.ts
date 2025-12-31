// app/api/paystack/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { paystackService } from '@/lib/paystack';
import { Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { smsPricingBundles } from '@/lib/sms-pricing-updated';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get organization
    const organization = await Organization.findOne({ 
      email: session.user.email 
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const { bundleId } = await request.json();

    // Find bundle
    const bundle = smsPricingBundles.find(b => b.id === bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: 'Invalid bundle selected' },
        { status: 400 }
      );
    }

    // Initialize payment with Paystack
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
      reference: paymentData.data.reference,
      accessCode: paymentData.data.access_code,
    });

  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}