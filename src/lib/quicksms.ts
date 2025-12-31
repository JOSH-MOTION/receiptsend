// lib/quicksms.ts
// QuickSMS Ghana API Integration Service

interface QuickSMSResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface SendSMSParams {
  recipients: string[]; // Array of phone numbers
  message: string;
  senderId: string; // Max 11 characters
}

interface BalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
}

class QuickSMSService {
  private publicKey: string;
  private baseUrl: string = 'https://app.quicksms.com.gh/api';

  constructor() {
    this.publicKey = process.env.QUICKSMS_PUBLIC_KEY || '';
    if (!this.publicKey) {
      throw new Error('QUICKSMS_PUBLIC_KEY is not defined in environment variables');
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendSMS(params: SendSMSParams): Promise<QuickSMSResponse> {
    try {
      // Format phone numbers (remove spaces, ensure proper format)
      const formattedRecipients = params.recipients.map(phone => 
        phone.replace(/\s+/g, '').replace(/^\+/, '')
      );

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.publicKey}`,
        },
        body: JSON.stringify({
          recipients: formattedRecipients,
          message: params.message,
          sender_id: params.senderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send SMS');
      }

      return {
        success: true,
        message: 'SMS sent successfully',
        data,
      };
    } catch (error: any) {
      console.error('QuickSMS send error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS',
        error: error.toString(),
      };
    }
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<BalanceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.publicKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch balance');
      }

      return {
        success: true,
        balance: data.balance || 0,
        currency: data.currency || 'GHS',
      };
    } catch (error: any) {
      console.error('QuickSMS balance error:', error);
      return {
        success: false,
        balance: 0,
        currency: 'GHS',
      };
    }
  }

  /**
   * Calculate SMS pages based on message length
   */
  calculatePages(message: string): number {
    const length = message.length;
    if (length === 0) return 0;
    if (length <= 160) return 1;
    return Math.ceil(length / 160);
  }

  /**
   * Calculate total units needed
   */
  calculateUnitsNeeded(message: string, recipientCount: number): number {
    const pages = this.calculatePages(message);
    return pages * recipientCount;
  }

  /**
   * Validate phone number format (Ghana numbers)
   */
  validatePhoneNumber(phone: string): boolean {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Ghana phone numbers: 10 digits starting with 0, or 12 digits starting with 233
    const ghanaPattern = /^(0\d{9}|233\d{9})$/;
    
    return ghanaPattern.test(cleaned);
  }

  /**
   * Format phone number for QuickSMS (233XXXXXXXXX format)
   */
  formatPhoneNumber(phone: string): string {
    // Remove all spaces and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading +
    cleaned = cleaned.replace(/^\+/, '');
    
    // If starts with 0, replace with 233
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    
    // If doesn't start with 233, add it
    if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send SMS with template placeholders
   */
  async sendTemplatedSMS(
    recipients: string[],
    template: string,
    placeholders: Record<string, string>,
    senderId: string
  ): Promise<QuickSMSResponse> {
    let message = template;
    
    // Replace placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return this.sendSMS({
      recipients,
      message,
      senderId,
    });
  }
}

// Export singleton instance
export const quickSMSService = new QuickSMSService();