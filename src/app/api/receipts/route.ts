import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Receipt, Contact, Organization, IReceipt } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Resend } from 'resend';
import { sendSms } from '@/lib/sms';

const MONGODB_URI = process.env.MONGODB_URI!;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

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

    // Create receipt
    const receiptDoc = await Receipt.create({
      ...data,
      organizationId,
      createdAt: new Date(),
    });

    const receipt = (receiptDoc as any).toObject() as IReceipt;

    console.log('✅ Receipt created:', receipt.receiptNumber);

    // Update or create contact
    if (data.customerEmail) {
      await Contact.findOneAndUpdate(
        { email: data.customerEmail, organizationId },
        {
          name: data.customerName,
          phoneNumber: data.customerPhoneNumber,
          organizationId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    let emailSent = false;
    let smsSent = false;
    const errors: string[] = [];

    // Send Email
    if (resend && data.customerEmail) {
      let emailSubject = organization.emailSubject || `Your receipt from ${organization.companyName}`;
      let emailBody = organization.emailBody || `Hi {{customer_name}}, thank you for your purchase. Please find your receipt details below.`;

      emailSubject = emailSubject.replace('{{business_name}}', organization.companyName);
      emailBody = emailBody
        .replace('{{customer_name}}', data.customerName || 'Customer')
        .replace('{{business_name}}', organization.companyName)
        .replace('{{amount}}', `$${data.totalAmount.toFixed(2)}`)
        .replace('{{receipt_number}}', data.receiptNumber);

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const fromName = organization.companyName || 'SENDORA';

      try {
        const emailResult = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [data.customerEmail],
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2962FF;">Receipt from ${organization.companyName}</h2>
              <p>${emailBody.replace(/\n/g, '<br>')}</p>
              <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
              <h3>Receipt Details</h3>
              <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
              <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
              <h4>Items:</h4>
              <ul>
                ${data.items.map((item: any) => `
                  <li>${item.name} - ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</li>
                `).join('')}
              </ul>
              ${(data.discount ?? 0) > 0 ? `<p><strong>Discount:</strong> ${(data.discount ?? 0)}%</p>` : ''}
              ${(data.tax ?? 0) > 0 ? `<p><strong>Tax:</strong> ${(data.tax ?? 0)}%</p>` : ''}
              <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">Thank you for your business!</p>
            </div>
          `,
        });

        console.log('✅ Email sent successfully! ID:', emailResult.data?.id ?? 'N/A');
        emailSent = true;
      } catch (emailError: any) {
        console.error('❌ Email error:', emailError);
        errors.push(`Email: ${emailError.message || 'Failed to send'}`);
      }
    } else if (!resend) {
      errors.push('Email: Resend API key not configured');
    }

    // Send SMS – safely handle possibly undefined smsBalance
    const smsBalance = organization.smsBalance ?? 0;

    if (data.customerPhoneNumber && smsBalance > 0) {
      let smsMessage =
        organization.smsContent ||
        'Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}.';
      smsMessage = smsMessage
        .replace('{{customer_name}}', data.customerName || 'Customer')
        .replace('{{business_name}}', organization.companyName)
        .replace('{{amount}}', `$${data.totalAmount.toFixed(2)}`)
        .replace('{{receipt_number}}', data.receiptNumber);

      try {
        const smsResult = await sendSms({
          organizationId,
          message: smsMessage,
          recipients: [data.customerPhoneNumber],
        });

        if (smsResult.success) {
          organization.smsBalance = smsBalance - 1;
          await organization.save();
          smsSent = true;
          console.log('✅ SMS sent successfully! New balance:', organization.smsBalance);
        } else {
          errors.push(`SMS: ${smsResult.error || 'Failed'}`);
        }
      } catch (smsError: any) {
        console.error('❌ SMS error:', smsError);
        errors.push(`SMS: ${smsError.message || 'Failed'}`);
      }
    } else {
      if (!data.customerPhoneNumber) {
        console.warn('⚠️ No phone number provided – skipping SMS');
      } else if (smsBalance <= 0) {
        errors.push('SMS: Insufficient balance');
      }
    }

    return NextResponse.json(
      {
        receipt,
        status: {
          emailSent,
          smsSent,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Create receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}