// lib/paystack.ts
// Paystack Integration Service

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // in kobo/pesewas
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      bundleId: string;
      units: number;
      organizationId: string;
      custom_fields?: any[];
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

class PaystackService {
  private secretKey: string;
  private baseUrl: string = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY is not defined. Payment functionality will be disabled.');
    }
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(
    email: string,
    amount: number, // Amount in cedis
    metadata: {
      bundleId: string;
      units: number;
      organizationId: string;
    }
  ): Promise<PaystackInitializeResponse> {
    if (!this.secretKey) {
        throw new Error('Payment service is not configured.');
    }
    try {
      // Convert amount to pesewas (Paystack uses smallest currency unit)
      const amountInPesewas = Math.round(amount * 100);

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInPesewas,
          currency: 'GHS',
          metadata,
          callback_url: process.env.PAYSTACK_CALLBACK_URL,
        }),
      });

      const data: PaystackInitializeResponse = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize transaction');
      }

      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
     if (!this.secretKey) {
        throw new Error('Payment service is not configured.');
    }
    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data: PaystackVerifyResponse = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Failed to verify transaction');
      }

      return data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paystackService = new PaystackService();
