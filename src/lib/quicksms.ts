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
      // Don't throw error at init, but log it. Allows app to run without SMS.
      console.warn('QUICKSMS_PUBLIC_KEY is not defined. SMS functionality will be disabled.');
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendSMS(params: SendSMSParams): Promise<QuickSMSResponse> {
    if (!this.publicKey) {
      return { success: false, message: 'QuickSMS service is not configured.' };
    }
    try {
      // Format phone numbers
      const formattedRecipients = params.recipients.map(phone => this.formatPhoneNumber(phone));
      const validRecipients = formattedRecipients.filter(this.validatePhoneNumber);
      
      if(validRecipients.length === 0) {
          return { success: false, message: 'No valid phone numbers provided.'}
      }

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.publicKey}`,
        },
        body: JSON.stringify({
          recipients: validRecipients,
          message: params.message,
          sender_id: params.senderId,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
          const errorMessage = data.message || `Failed to send SMS with status: ${response.status}`;
          throw new Error(errorMessage);
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
   * Get SMS balance from your main provider account
   */
  async getBalance(): Promise<BalanceResponse> {
    if (!this.publicKey) {
        return { success: false, balance: 0, currency: 'GHS' };
    }
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
    // For UCS-2 characters, it might be less, but we use a simple model here.
    return Math.ceil(length / 153);
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
    // Basic check for Ghana numbers format 233XXXXXXXXX
    return /^233\d{9}$/.test(phone);
  }

  /**
   * Format phone number for QuickSMS (233XXXXXXXXX format)
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    if (cleaned.length === 9 && !cleaned.startsWith('233')) {
        // Assumes it's a local number without leading 0
        cleaned = '233' + cleaned;
    }
    return cleaned;
  }
}

// Export singleton instance
export const quickSMSService = new QuickSMSService();
