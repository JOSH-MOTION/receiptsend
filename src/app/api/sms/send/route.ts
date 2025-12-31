// app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { quickSMSService } from '@/lib/quicksms';
import { Organization, SmsLog, Receipt } from '@/lib/models';
import connectDB from '@/lib/mongodb';

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
    const { 
      recipients, 
      message, 
      receiptId 
    } = await request.json();

    // Validate inputs
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients are required' },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate and format phone numbers
    const validRecipients = recipients
      .filter(phone => quickSMSService.validatePhoneNumber(phone))
      .map(phone => quickSMSService.formatPhoneNumber(phone));

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No valid phone numbers provided' },
        { status: 400 }
      );
    }

    // Calculate units needed
    const pages = quickSMSService.calculatePages(message);
    const unitsNeeded = pages * validRecipients.length;

    // ✅ CRITICAL: Check balance BEFORE sending
    const currentBalance = organization.smsBalance || 0;
    if (currentBalance < unitsNeeded) {
      console.log('❌ Insufficient balance:', {
        organization: organization.companyName,
        available: currentBalance,
        needed: unitsNeeded,
        shortfall: unitsNeeded - currentBalance,
      });

      return NextResponse.json(
        { 
          error: 'Insufficient SMS balance',
          required: unitsNeeded,
          available: currentBalance,
          shortfall: unitsNeeded - currentBalance,
          message: `You need ${unitsNeeded} units but only have ${currentBalance}. Please buy more credits to send this message.`,
        },
        { status: 402 } // Payment Required
      );
    }

    // Get sender ID from organization settings or use default
    const senderId = organization.smsSenderId || 
                     organization.companyName?.substring(0, 11) || 
                     'RECEIPTS';

    console.log('📤 Sending SMS:', {
      organization: organization.companyName,
      recipients: validRecipients.length,
      pages,
      unitsNeeded,
      currentBalance,
      senderId,
    });

    // Send SMS via QuickSMS (this uses YOUR LinksEngineering balance)
    const smsResult = await quickSMSService.sendSMS({
      recipients: validRecipients,
      message,
      senderId,
    });

    // If SMS sent successfully, deduct units from organization balance
    if (smsResult.success) {
      // ✅ Deduct units ONLY if SMS was sent successfully
      organization.smsBalance = currentBalance - unitsNeeded;
      await organization.save();

      console.log('✅ SMS sent successfully:', {
        organization: organization.companyName,
        unitsUsed: unitsNeeded,
        previousBalance: currentBalance,
        newBalance: organization.smsBalance,
      });

      // Log each SMS sent
      const smsLogs = validRecipients.map(phone => ({
        receiptId: receiptId || 'manual_send',
        organizationId: organization._id.toString(),
        phoneNumber: phone,
        message: message,
        unitsUsed: pages, // Units per recipient
        status: 'sent',
        apiResponse: JSON.stringify(smsResult.data),
        sentAt: new Date(),
      }));

      await SmsLog.insertMany(smsLogs);

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        sentCount: validRecipients.length,
        unitsUsed: unitsNeeded,
        remainingBalance: organization.smsBalance,
        invalidNumbers: recipients.length - validRecipients.length,
        details: {
          pages,
          recipients: validRecipients.length,
          unitsPerRecipient: pages,
        },
      });
    } else {
      // ❌ SMS failed - log the error but DON'T deduct units
      console.error('❌ SMS send failed:', {
        organization: organization.companyName,
        error: smsResult.message,
      });

      const errorLogs = validRecipients.map(phone => ({
        receiptId: receiptId || 'manual_send',
        organizationId: organization._id.toString(),
        phoneNumber: phone,
        message: message,
        unitsUsed: 0, // No units used since failed
        status: 'failed',
        apiResponse: JSON.stringify(smsResult),
        sentAt: new Date(),
      }));

      await SmsLog.insertMany(errorLogs);

      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          details: smsResult.message,
          helpText: 'Your balance was not deducted. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ SMS send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

// GET endpoint to check balance and calculate cost
export async function GET(request: NextRequest) {
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

    // Get query params for cost calculation
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message') || '';
    const recipientCount = parseInt(searchParams.get('recipients') || '1');

    const pages = quickSMSService.calculatePages(message);
    const unitsNeeded = quickSMSService.calculateUnitsNeeded(message, recipientCount);
    const currentBalance = organization.smsBalance || 0;

    return NextResponse.json({
      balance: currentBalance,
      senderId: organization.smsSenderId || 'RECEIPTS',
      calculation: {
        messageLength: message.length,
        pages,
        recipients: recipientCount,
        unitsNeeded,
        canSend: currentBalance >= unitsNeeded,
        shortfall: currentBalance < unitsNeeded ? unitsNeeded - currentBalance : 0,
      },
    });

  } catch (error: any) {
    console.error('❌ SMS balance check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check balance' },
      { status: 500 }
    );
  }
}