import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Receipt, Organization } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Resend } from 'resend';
import { sendSms } from '@/lib/sms';

const MONGODB_URI = process.env.MONGODB_URI;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const { type } = await req.json(); // 'email' or 'sms'

    await connectDB();

    const receipt = await Receipt.findOne({
      _id: params.id,
      organizationId: organizationId,
    }).lean();

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (type === 'email') {
      // Resend Email
      if (!resend) {
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        );
      }

      if (!receipt.customerEmail) {
        return NextResponse.json(
          { error: 'No customer email on this receipt' },
          { status: 400 }
        );
      }

      let emailSubject = organization.emailSubject || `Your receipt from ${organization.companyName}`;
      let emailBody = organization.emailBody || `Hi {{customer_name}}, thank you for your purchase.`;

      emailSubject = emailSubject.replace('{{business_name}}', organization.companyName);
      emailBody = emailBody
        .replace('{{customer_name}}', receipt.customerName)
        .replace('{{business_name}}', organization.companyName)
        .replace('{{amount}}', `$${receipt.totalAmount.toFixed(2)}`)
        .replace('{{receipt_number}}', receipt.receiptNumber);

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const fromName = organization.companyName || 'ReceiptRocket';

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [receipt.customerEmail],
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2962FF;">Receipt from ${organization.companyName}</h2>
            <p>${emailBody.replace(/\n/g, '<br>')}</p>
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
            <h3>Receipt Details</h3>
            <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
            <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${receipt.totalAmount.toFixed(2)}</p>
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
            <h4>Items:</h4>
            <ul>
              ${receipt.items
                .map(
                  (item: any) =>
                    `<li>${item.name} - ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</li>`
                )
                .join('')}
            </ul>
            ${receipt.discount > 0 ? `<p><strong>Discount:</strong> ${receipt.discount}%</p>` : ''}
            ${receipt.tax > 0 ? `<p><strong>Tax:</strong> ${receipt.tax}%</p>` : ''}
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Thank you for your business!</p>
          </div>
        `,
      });

      return NextResponse.json({ message: 'Email resent successfully' });
    } else if (type === 'sms') {
      // Resend SMS
      if (!receipt.customerPhoneNumber) {
        return NextResponse.json(
          { error: 'No customer phone number on this receipt' },
          { status: 400 }
        );
      }

      if (!organization.smsBalance || organization.smsBalance <= 0) {
        return NextResponse.json(
          { error: 'Insufficient SMS balance' },
          { status: 400 }
        );
      }

      let smsMessage =
        organization.smsContent ||
        'Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}.';
      smsMessage = smsMessage
        .replace('{{customer_name}}', receipt.customerName)
        .replace('{{business_name}}', organization.companyName)
        .replace('{{amount}}', `$${receipt.totalAmount.toFixed(2)}`)
        .replace('{{receipt_number}}', receipt.receiptNumber);

      const smsResult = await sendSms({
        organizationId: organizationId,
        message: smsMessage,
        recipients: [receipt.customerPhoneNumber],
      });

      if (smsResult.success) {
        organization.smsBalance -= 1;
        await organization.save();
        return NextResponse.json({
          message: 'SMS resent successfully',
          balance: organization.smsBalance,
        });
      } else {
        return NextResponse.json(
          { error: smsResult.error || 'Failed to send SMS' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "email" or "sms"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Resend error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend' },
      { status: 500 }
    );
  }
}