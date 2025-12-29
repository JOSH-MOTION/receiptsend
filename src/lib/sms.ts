// src/lib/sms.ts

import { Organization } from '@/lib/models'; // Add this import

interface SendSmsParams {
  organizationId: string; // Now REQUIRED – we need it for sender ID
  message: string;
  recipients: string[];
}

interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Send SMS using QuickSMS Ghana API – with per-organization sender ID
 */
async function sendSmsViaQuickSMS({
  organizationId,
  message,
  recipients,
}: SendSmsParams): Promise<SendSmsResult> {
  const PUBLIC_KEY = process.env.QUICKSMS_PUBLIC_KEY || '2c88f994a5a5c9d1';

  if (!PUBLIC_KEY) {
    return { success: false, error: 'QuickSMS Public Key not configured' };
  }

  // Fetch organization to get custom sender ID
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return { success: false, error: 'Organization not found' };
  }

  const SENDER_ID = (organization.smsSenderId || 'ReceiptApp').trim().slice(0, 11); // Max 11 chars

  // Format phone numbers
  const formattedRecipients = recipients.map((num) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '233' + cleaned.slice(1);
    else if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
    return cleaned;
  });

  if (formattedRecipients.some(n => n.length !== 12 || !n.startsWith('233'))) {
    return { success: false, error: 'Invalid Ghana phone number(s)' };
  }

  const params = new URLSearchParams({
    public_key: PUBLIC_KEY,
    sender: SENDER_ID,
    numbers: formattedRecipients.join(','),
    message: message,
  });

  const url = `https://linksengineering.net/apisms/api/qapi?${params.toString()}`;

  console.log('📱 Sending SMS via QuickSMS');
  console.log('🏢 Organization Sender ID:', SENDER_ID);
  console.log('🌐 URL:', url);
  console.log('📞 Recipients:', formattedRecipients.join(', '));

  try {
    const response = await fetch(url, { method: 'GET' });
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`);
      console.error('Raw response:', responseText.slice(0, 800));
      return { success: false, error: 'API error – check sender approval/balance' };
    }

    if (!responseText.trim().match(/^[\[{]/)) {
      console.error('❌ Non-JSON response:', responseText.slice(0, 800));
      return { success: false, error: 'Invalid response (wrong key/sender?)' };
    }

    const result = JSON.parse(responseText);
    console.log('✅ QuickSMS response:', result);

    if (result.status === 'success' || result.message?.toLowerCase().includes('success')) {
      return { success: true, message: 'SMS sent', data: result };
    } else {
      return { success: false, error: result.message || 'Failed (unapproved sender?)', data: result };
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { message, recipients, organizationId } = params;

  if (!organizationId) return { success: false, error: 'organizationId required' };
  if (!recipients?.length) return { success: false, error: 'No recipients' };
  if (!message?.trim()) return { success: false, error: 'Empty message' };

  console.log(`📱 Sending SMS for org ${organizationId} to ${recipients.length} recipient(s)`);

  const result = await sendSmsViaQuickSMS(params);

  result.success ? console.log('✅ Success') : console.error('❌ Failed:', result.error);

  return result;
}

// Bulk remains the same – true bulk via comma-separated numbers
export async function sendBulkSms(
  organizationId: string,
  message: string,
  recipients: string[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const result = await sendSms({ organizationId, message, recipients });

  return result.success
    ? { successful: recipients.length, failed: 0, errors: [] }
    : { successful: 0, failed: recipients.length, errors: [result.error || 'Unknown'] };
}