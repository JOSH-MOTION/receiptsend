
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Organization, Contact } from '@/lib/models';
import { sendBulkSms } from '@/lib/sms';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, recipients } = await req.json();

    if (!message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Message and at least one recipient are required' }, { status: 400 });
    }

    await connectDB();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!organization.smsSenderId) {
      return NextResponse.json({ error: 'SMS Sender ID is not configured' }, { status: 400 });
    }

    const requiredCredits = recipients.length;
    if (!organization.smsBalance || organization.smsBalance < requiredCredits) {
      return NextResponse.json(
        { 
          error: `Insufficient SMS balance. You need ${requiredCredits} credits but only have ${organization.smsBalance || 0}.` 
        }, 
        { status: 400 }
      );
    }

    // Save any new numbers to contacts
    const existingContacts = await Contact.find({ organizationId, phoneNumber: { $in: recipients } }).select('phoneNumber');
    const existingNumbers = new Set(existingContacts.map(c => c.phoneNumber));
    
    const newNumbers = recipients.filter(num => !existingNumbers.has(num));
    if (newNumbers.length > 0) {
      const newContacts = newNumbers.map(num => ({
        organizationId,
        name: `Contact ${num}`, // Generic name
        email: `${num}@placeholder.email`, // Generic email
        phoneNumber: num,
        createdAt: new Date(),
      }));
      await Contact.insertMany(newContacts);
    }

    // Send the bulk SMS
    const result = await sendBulkSms(organizationId, message, recipients);
    
    if (result.successful > 0) {
      // Deduct credits
      organization.smsBalance -= result.successful;
      await organization.save();

      return NextResponse.json({
        message: 'Bulk message job started.',
        successful: result.successful,
        failed: result.failed,
        balance: organization.smsBalance,
      }, { status: 200 });

    } else {
      return NextResponse.json({
        error: 'Failed to send messages.',
        details: result.errors,
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Bulk SMS error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
