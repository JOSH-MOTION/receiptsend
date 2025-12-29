
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Receipt, Contact, Organization } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendSms } from '@/ai/flows/send-sms-flow';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

// GET all receipts for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    await connectDB();

    const receipts = await Receipt.find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error('Get receipts error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST create a new receipt
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const data = await req.json();

    await connectDB();
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 1. Create the receipt
    const receipt = await Receipt.create({
      ...data,
      organizationId,
      createdAt: new Date(),
    });

    // 2. Create or update contact
    if (data.customerEmail) {
        await Contact.findOneAndUpdate(
            { email: data.customerEmail, organizationId: organizationId },
            { 
                name: data.customerName,
                phoneNumber: data.customerPhoneNumber,
                organizationId: organizationId
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    
    // 3. Send SMS if phone number is provided and there is a balance
    if (data.customerPhoneNumber && organization.smsBalance && organization.smsBalance > 0) {
        let smsMessage = organization.smsContent || "Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}.";
        smsMessage = smsMessage.replace("{{customer_name}}", data.customerName);
        smsMessage = smsMessage.replace("{{business_name}}", organization.companyName);
        smsMessage = smsMessage.replace("{{amount}}", `$${data.totalAmount.toFixed(2)}`);
        smsMessage = smsMessage.replace("{{receipt_number}}", data.receiptNumber);

        const smsResult = await sendSms({
            organizationId: organizationId,
            message: smsMessage,
            recipients: [data.customerPhoneNumber]
        });

        // 4. Decrement balance if SMS was sent successfully
        if (smsResult.success) {
            organization.smsBalance -= 1;
            await organization.save();
        }
    }

    return NextResponse.json(receipt, { status: 201 });
  } catch (error: any) {
    console.error('Create receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
