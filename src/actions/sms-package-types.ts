// SMS Credit Packages
// Provider cost: GH¢50 = 1052 units → GH¢1 = 21.04 units
// Our sell rate:  GH¢1 = 13.15 units  (our margin ~38%)

export interface SmsPackage {
  id: string;
  name: string;
  price: number;     // in GH₵
  units: number;     // units we give the user
  bonus?: number;    // bonus units (displayed in green)
  popular?: boolean;
}

export const SMS_PACKAGES: SmsPackage[] = [
  {
    id: 'starter_10',
    name: 'Starter',
    price: 10,
    units: 132,      // 13.15 × 10 = 131.5 → 132
  },
  {
    id: 'basic_20',
    name: 'Basic',
    price: 20,
    units: 263,      // 13.15 × 20 = 263
    popular: true,
  },
  {
    id: 'growth_50',
    name: 'Growth',
    price: 50,
    units: 657,      // 13.15 × 50 = 657.5 → 657
    bonus: 25,       // extra 25 → total 682
  },
  {
    id: 'pro_100',
    name: 'Pro',
    price: 100,
    units: 1315,     // 13.15 × 100 = 1315
    bonus: 85,       // extra 85 → total 1400
  },
];

export interface SmsPurchaseRecord {
  organizationId: string;
  packageId: string;
  packageName: string;
  amountPaid: number;
  unitsPurchased: number;
  bonusUnits: number;
  totalUnits: number;
  paymentReference: string;
  createdAt: any;
}