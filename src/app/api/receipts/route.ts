import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Receipt, Contact, Organization, IReceipt } from '@/lib/models';
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
    const receiptDoc = await Receipt.create({
      ...data,
      organizationId,
      createdAt: new Date(),
    });

    // Convert to plain object to avoid Mongoose type issues
    const receipt = (receiptDoc as any).toObject() as IReceipt;

    console.log('✅ Receipt created:', receipt.receiptNumber);

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
        console.log('✅ Contact created/updated:', data.customerEmail);
    }
    
    // Track email and SMS status
    let emailSent = false;
    let smsSent = false;
    const errors: string[] = [];

    // 3. Send Email
    if (resend && data.customerEmail) {
        console.log('📧 Attempting to send email to:', data.customerEmail);
        
        let emailSubject = organization.emailSubject || `Your receipt from ${organization.companyName}`;
        let emailBody = organization.emailBody || `Hi {{customer_name}}, thank you for your purchase. Please find your receipt details below.`;

        // Replace placeholders
        emailSubject = emailSubject.replace("{{business_name}}", organization.companyName);
        emailBody = emailBody
            .replace("{{customer_name}}", data.customerName)
            .replace("{{business_name}}", organization.companyName)
            .replace("{{amount}}", `$${data.totalAmount.toFixed(2)}`)
            .replace("{{receipt_number}}", data.receiptNumber);
        
        try {
            // Get the from email from environment or use Resend's onboarding email
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
            const fromName = organization.companyName || 'ReceiptRocket';
            
            console.log('📧 Sending from:', `${fromName} <${fromEmail}>`);
            
            const emailResult = await resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: [data.customerEmail],
                subject: emailSubject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2962FF;">Receipt from ${organization.companyName}</h2>
                        <p>${emailBody.replace(/\n/g, "<br>")}</p>
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
                        ${data.discount > 0 ? `<p><strong>Discount:</strong> ${data.discount}%</p>` : ''}
                        ${data.tax > 0 ? `<p><strong>Tax:</strong> ${data.tax}%</p>` : ''}
                        <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Thank you for your business!</p>
                    </div>
                `,
            });
            
            console.log('✅ Email sent successfully! ID:', emailResult.id);
            emailSent = true;
        } catch (emailError: any) {
            console.error("❌ Resend API error:", emailError);
            const errorMessage = emailError.message || 'Failed to send email';
            errors.push(`Email: ${errorMessage}`);
            
            // Log more details for debugging
            if (emailError.response) {
                console.error('Resend error response:', emailError.response);
            }
        }
    } else if (!resend) {
        console.warn('⚠️ Resend not configured - skipping email');
        errors.push('Email: Resend API key not configured');
    } else if (!data.customerEmail) {
        console.warn('⚠️ No customer email provided - skipping email');
    }

    // 4. Send SMS if phone number is provided and there is a balance
    if (data.customerPhoneNumber && organization.smsBalance && organization.smsBalance > 0) {
        console.log('📱 Attempting to send SMS to:', data.customerPhoneNumber);
        
        let smsMessage = organization.smsContent || "Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}.";
        smsMessage = smsMessage
            .replace("{{customer_name}}", data.customerName)
            .replace("{{business_name}}", organization.companyName)
            .replace("{{amount}}", `$${data.totalAmount.toFixed(2)}`)
            .replace("{{receipt_number}}", data.receiptNumber);

        try {
            const smsResult = await sendSms({
                organizationId: organizationId,
                message: smsMessage,
                recipients: [data.customerPhoneNumber]
            });

            // 5. Decrement balance if SMS was sent successfully
            if (smsResult.success) {
                organization.smsBalance -= 1;
                await organization.save();
                console.log('✅ SMS sent successfully! New balance:', organization.smsBalance);
                smsSent = true;
            } else {
                console.error('❌ SMS failed:', smsResult.error);
                errors.push(`SMS: ${smsResult.error || 'Failed to send'}`);
            }
        } catch (smsError: any) {
            console.error('❌ SMS error:', smsError);
            errors.push(`SMS: ${smsError.message}`);
        }
    } else if (!data.customerPhoneNumber) {
        console.warn('⚠️ No customer phone number provided - skipping SMS');
    } else if (!organization.smsBalance || organization.smsBalance <= 0) {
        console.warn('⚠️ No SMS balance - skipping SMS');
        errors.push('SMS: No balance available');
    }

    // Return response with status
    const response = {
      receipt,
      status: {
        emailSent,
        smsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    };

    console.log('📊 Receipt creation summary:', {
      receiptNumber: receipt.receiptNumber,
      emailSent,
      smsSent,
      errors: errors.length
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('❌ Create receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}