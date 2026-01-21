// app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { quickSMSService } from '@/lib/quicksms';
import { Organization, SmsLog } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;

    await connectDB();
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { recipients, message, receiptId = 'manual_send' } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 });
    }
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (!organization.smsSenderId) {
        return NextResponse.json({ error: 'SMS Sender ID is not configured in your settings.' }, { status: 400 });
    }

    const validRecipients = recipients.map(r => quickSMSService.formatPhoneNumber(r)).filter(r => quickSMSService.validatePhoneNumber(r));
    if (validRecipients.length === 0) {
        return NextResponse.json({ error: 'No valid phone numbers provided.' }, { status: 400 });
    }

    const unitsNeeded = quickSMSService.calculateUnitsNeeded(message, validRecipients.length);
    const currentBalance = organization.smsBalance || 0;

    if (currentBalance < unitsNeeded) {
      return NextResponse.json(
        { 
          error: 'Insufficient SMS balance',
          message: `You need ${unitsNeeded} credits but only have ${currentBalance}. Please buy more credits to send this message.`,
        },
        { status: 402 } // Payment Required
      );
    }

    const smsResult = await quickSMSService.sendSMS({
      recipients: validRecipients,
      message,
      senderId: organization.smsSenderId,
    });
    
    if (smsResult.success) {
      organization.smsBalance = currentBalance - unitsNeeded;
      await organization.save();

      const smsLogs = validRecipients.map(phone => ({
        receiptId,
        organizationId: organization._id.toString(),
        phoneNumber: phone,
        message: message,
        unitsUsed: quickSMSService.calculatePages(message),
        status: 'sent',
        apiResponse: JSON.stringify(smsResult.data),
        sentAt: new Date(),
      }));
      await SmsLog.insertMany(smsLogs);
      
      return NextResponse.json({ success: true, message: 'SMS sent successfully', newBalance: organization.smsBalance });
    } else {
      return NextResponse.json({ error: 'Failed to send SMS', details: smsResult.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ SMS send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
}
