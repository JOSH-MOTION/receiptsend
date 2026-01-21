// SMS Pricing Configuration - FINAL PRICING STRUCTURE
// GH¢40, GH¢50, then +GH¢50 markup from Standard onwards

export const smsPricingBundles = [
  {
    id: 'starter',
    name: 'Starter',
    price: 40, // GH¢40 (QuickSMS: GH¢20 + GH¢20 markup)
    units: 401,
    basePrice: 20,
    markup: 20,
    description: 'Perfect for getting started',
    pricePerUnit: 0.100, // GH¢40 / 401
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 50, // GH¢50 (QuickSMS: GH¢30 + GH¢20 markup)
    units: 601,
    basePrice: 30,
    markup: 20,
    description: 'Great for small businesses',
    pricePerUnit: 0.083, // GH¢50 / 601
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 100, // GH¢100 (QuickSMS: GH¢50 + GH¢50 markup)
    units: 1052,
    basePrice: 50,
    markup: 50,
    description: 'Most popular choice',
    pricePerUnit: 0.095, // GH¢100 / 1052
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 150, // GH¢150 (QuickSMS: GH¢100 + GH¢50 markup)
    units: 2054,
    basePrice: 100,
    markup: 50,
    description: 'Best value for regular senders',
    pricePerUnit: 0.073, // GH¢150 / 2054
    popular: false,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 250, // GH¢250 (QuickSMS: GH¢200 + GH¢50 markup)
    units: 4108,
    basePrice: 200,
    markup: 50,
    description: 'For growing businesses',
    pricePerUnit: 0.061, // GH¢250 / 4108
    popular: false,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 1050, // GH¢1050 (QuickSMS: GH¢1000 + GH¢50 markup)
    units: 20340,
    basePrice: 1000,
    markup: 50,
    description: 'Maximum value for high volume',
    pricePerUnit: 0.052, // GH¢1050 / 20340
    popular: false,
  },
];

/**
 * Calculate how many SMS pages a message will use
 */
export function calculateSmsPages(message: string): number {
  const length = message.length;
  if (length === 0) return 0;
  if (length <= 160) return 1;
  return Math.ceil(length / 153); // Standard for multi-part SMS
}

/**
 * Calculate total SMS units needed
 */
export function calculateSmsUnits(message: string, recipientCount: number): number {
  const pages = calculateSmsPages(message);
  return pages * recipientCount;
}

/**
 * Get the best pricing bundle for a given number of units
 */
export function getRecommendedBundle(unitsNeeded: number) {
  const suitableBundle = smsPricingBundles.find(bundle => bundle.units >= unitsNeeded);
  
  if (suitableBundle) {
    return suitableBundle;
  }
  
  // If units needed exceed largest bundle
  const vipBundle = smsPricingBundles[smsPricingBundles.length - 1];
  const bundlesNeeded = Math.ceil(unitsNeeded / vipBundle.units);
  
  return {
    ...vipBundle,
    bundlesNeeded,
    totalPrice: vipBundle.price * bundlesNeeded,
    totalUnits: vipBundle.units * bundlesNeeded,
  };
}

/**
 * Format currency in Ghana Cedis
 */
export function formatCurrency(amount: number): string {
  return `GH¢${amount.toFixed(2)}`;
}

/**
 * Check if user has enough balance
 */
export function hasEnoughBalance(currentBalance: number, unitsNeeded: number): boolean {
  return currentBalance >= unitsNeeded;
}
