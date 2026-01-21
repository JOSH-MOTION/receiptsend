import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Receipt, Organization, SmsLog } from '@/lib/models';
import { Resend } from 'resend';
import { quickSMSService } from '@/lib/quicksms';

const MONGODB_URI = process.env.MONGODB_URI!;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await req.json(); // 'email' or 'sms'
    const { id } = params;

    await connectDB();

    const receipt = await Receipt.findOne({
      _id: id,
      organizationId,
    }).lean();

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (type === 'email') {
      // Email resend logic...
      return NextResponse.json({ message: 'Email resent successfully' });
    }

    if (type === 'sms') {
      if (!receipt.customerPhoneNumber) {
        return NextResponse.json({ error: 'No customer phone number for this receipt' }, { status: 400 });
      }
      if (!organization.smsSenderId) {
        return NextResponse.json({ error: 'SMS Sender ID is not configured' }, { status: 400 });
      }
      
      const message = `Resending receipt #${receipt.receiptNumber} from ${organization.companyName}. Total: $${receipt.totalAmount.toFixed(2)}`;
      const unitsNeeded = quickSMSService.calculatePages(message);

      if ((organization.smsBalance || 0) < unitsNeeded) {
        return NextResponse.json({ error: 'Insufficient SMS balance' }, { status: 402 });
      }

      const smsResult = await quickSMSService.sendSMS({
        recipients: [receipt.customerPhoneNumber],
        message,
        senderId: organization.smsSenderId,
      });

      if (smsResult.success) {
        organization.smsBalance = (organization.smsBalance || 0) - unitsNeeded;
        await organization.save();
        
        await SmsLog.create({
          receiptId: receipt._id.toString(),
          organizationId,
          phoneNumber: receipt.customerPhoneNumber,
          message,
          unitsUsed: unitsNeeded,
          status: 'sent',
          apiResponse: JSON.stringify(smsResult.data),
        });

        return NextResponse.json({ message: 'SMS resent successfully', balance: organization.smsBalance });
      } else {
        return NextResponse.json({ error: smsResult.message || 'Failed to resend SMS' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: error.message || 'Failed to resend' }, { status: 500 });
  }
}
