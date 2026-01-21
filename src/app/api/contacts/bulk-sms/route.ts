import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Organization, Contact } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { quickSMSService } from '@/lib/quicksms';
import { SmsLog } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;
    
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
      return NextResponse.json({ error: 'SMS Sender ID is not configured. Please set it in your settings.' }, { status: 400 });
    }

    const unitsNeeded = quickSMSService.calculateUnitsNeeded(message, recipients.length);
    if ((organization.smsBalance || 0) < unitsNeeded) {
      return NextResponse.json(
        { 
          error: `Insufficient SMS balance. You need ${unitsNeeded} credits but only have ${organization.smsBalance || 0}.` 
        }, 
        { status: 402 } // Payment Required
      );
    }
    
    // Save any new numbers to contacts before sending
    const existingContacts = await Contact.find({ organizationId, phoneNumber: { $in: recipients } }).select('phoneNumber');
    const existingNumbers = new Set(existingContacts.map(c => c.phoneNumber!));
    
    const newNumbers = recipients.filter(num => num && !existingNumbers.has(num));
    if (newNumbers.length > 0) {
      const newContacts = newNumbers.map(num => ({
        organizationId,
        name: `Contact ${num}`, // Generic name
        email: `${num}@placeholder.email`, // Placeholder email
        phoneNumber: num,
      }));
      await Contact.insertMany(newContacts);
    }

    const result = await quickSMSService.sendSMS({
        recipients,
        message,
        senderId: organization.smsSenderId,
    });
    
    if (result.success) {
      organization.smsBalance = (organization.smsBalance || 0) - unitsNeeded;
      await organization.save();

      const smsLogs = recipients.map(phone => ({
          receiptId: 'bulk-sms',
          organizationId: organization._id.toString(),
          phoneNumber: phone,
          message: message,
          unitsUsed: quickSMSService.calculatePages(message),
          status: 'sent',
          apiResponse: JSON.stringify(result.data),
          sentAt: new Date(),
      }));
      await SmsLog.insertMany(smsLogs);

      return NextResponse.json({
        message: 'Bulk message job completed.',
        successful: recipients.length, // Assuming all sent if API call is successful
        failed: 0,
        balance: organization.smsBalance,
      }, { status: 200 });

    } else {
      return NextResponse.json({
        error: 'Failed to send messages.',
        details: result.message,
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
