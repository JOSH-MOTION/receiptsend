import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Receipt, Contact, Organization, IReceipt, SmsLog } from '@/lib/models';
import { Resend } from 'resend';
import { quickSMSService } from '@/lib/quicksms';
import connectDB from '@/lib/mongodb';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Function to generate a unique receipt number
async function generateReceiptNumber(): Promise<string> {
    const prefix = 'RCT-';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    await connectDB();
    const lastReceipt = await Receipt.findOne({ receiptNumber: new RegExp(`^${prefix}${year}${month}`) })
                                     .sort({ createdAt: -1 });

    let sequence = 1;
    if (lastReceipt) {
        const lastSeqStr = lastReceipt.receiptNumber.slice(-4);
        if (lastSeqStr) {
           const lastSeq = parseInt(lastSeqStr, 10);
           if (!isNaN(lastSeq)) {
             sequence = lastSeq + 1;
           }
        }
    }
    
    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
}


export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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

export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();

    await connectDB();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const receiptNumber = await generateReceiptNumber();

    const receiptDoc = await Receipt.create({
      ...data,
      organizationId,
      receiptNumber, // Use the generated number
      createdAt: new Date(),
    });

    const receipt = receiptDoc.toObject() as IReceipt;

    console.log('✅ Receipt created:', receipt.receiptNumber);

    if (data.customerEmail) {
      await Contact.findOneAndUpdate(
        { email: data.customerEmail, organizationId },
        { name: data.customerName, phoneNumber: data.customerPhoneNumber, organizationId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    let emailSent = false;
    let smsSent = false;
    const errors: string[] = [];

    // Send Email if requested
    if (resend && data.customerEmail && data.sendEmail) {
      // Email sending logic...
    }

    // Send SMS if requested
    if (data.customerPhoneNumber && data.sendSMS) {
      if (!organization.smsSenderId) {
          errors.push('SMS not sent: Sender ID is not configured.');
      } else {
        const unitsNeeded = quickSMSService.calculatePages(organization.smsContent || '');
        if ((organization.smsBalance || 0) < unitsNeeded) {
          errors.push('SMS not sent: Insufficient credits.');
        } else {
            let smsMessage = organization.smsContent || 'Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}.';
            smsMessage = smsMessage
                .replace('{{customer_name}}', data.customerName || 'Customer')
                .replace('{{business_name}}', organization.companyName)
                .replace('{{amount}}', `$${data.totalAmount.toFixed(2)}`)
                .replace('{{receipt_number}}', receipt.receiptNumber);

            const smsResult = await quickSMSService.sendSMS({
                recipients: [data.customerPhoneNumber],
                message: smsMessage,
                senderId: organization.smsSenderId
            });

            if (smsResult.success) {
                organization.smsBalance = (organization.smsBalance || 0) - unitsNeeded;
                await organization.save();
                smsSent = true;
                
                await SmsLog.create({
                    receiptId: receipt._id.toString(),
                    organizationId,
                    phoneNumber: data.customerPhoneNumber,
                    message: smsMessage,
                    unitsUsed: unitsNeeded,
                    status: 'sent',
                    apiResponse: JSON.stringify(smsResult.data),
                });

                console.log(`✅ SMS sent for receipt ${receipt.receiptNumber}. New balance: ${organization.smsBalance}`);
            } else {
                errors.push(`SMS failed: ${smsResult.message}`);
            }
        }
      }
    }

    return NextResponse.json({ receipt, status: { emailSent, smsSent, errors: errors.length > 0 ? errors : undefined } }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Create receipt error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const receiptId = searchParams.get('id');

    if (!receiptId) {
      return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
    }

    await connectDB();

    const receipt = await Receipt.findOneAndDelete({ _id: receiptId, organizationId });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Receipt deleted successfully', receiptNumber: receipt.receiptNumber });
  } catch (error: any) {
    console.error('❌ Delete receipt error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete receipt' }, { status: 500 });
  }
}
