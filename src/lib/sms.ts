// src/lib/sms.ts

import { Organization } from '@/lib/models';

interface SendSmsParams {
  organizationId: string;
  message: string;
  recipients: string[];
}

interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send SMS using QuickSMS API (linksengineering.net)
 */
async function sendSmsViaQuickSMS(params: SendSmsParams): Promise<SendSmsResult> {
  const { message, recipients } = params;
  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'QuickSMS API key not configured' };
  }

  try {
    // QuickSMS API endpoint - adjust if the actual endpoint is different
    const apiUrl = 'https://linksengineering.net/quicksms/api/send';
    
    // Prepare the request body - adjust fields based on actual API requirements
    const requestBody = {
      api_key: apiKey,
      to: recipients[0], // Phone number
      message: message,
      sender: 'ReceiptApp', // Adjust sender name as needed
    };

    console.log('📱 Sending SMS via QuickSMS to:', recipients[0]);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SMS sent successfully via QuickSMS:', result);
      return { 
        success: true, 
        message: `SMS sent successfully` 
      };
    } else {
      console.error('❌ QuickSMS API error:', result);
      return { 
        success: false, 
        error: result.message || result.error || 'Unknown QuickSMS error' 
      };
    }
  } catch (error: any) {
    console.error('❌ QuickSMS request failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main SMS sending function
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { recipients, message } = params;

  // Validate inputs
  if (!recipients || recipients.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Message is empty' };
  }

  console.log(`📱 Attempting to send SMS to ${recipients[0]}`);
  console.log(`📝 Message: ${message.substring(0, 50)}...`);

  try {
    const result = await sendSmsViaQuickSMS(params);

    // Log the result
    if (result.success) {
      console.log('✅ SMS delivery successful');
    } else {
      console.error('❌ SMS delivery failed:', result.error);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Unexpected SMS error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Send SMS to multiple recipients (sends individually)
 */
export async function sendBulkSms(
  organizationId: string,
  message: string,
  recipients: string[]
): Promise<{ successful: number; failed: number; errors: string[] }> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const recipient of recipients) {
    const result = await sendSms({
      organizationId,
      message,
      recipients: [recipient],
    });

    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      results.errors.push(`${recipient}: ${result.error}`);
    }

    // Add a small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}