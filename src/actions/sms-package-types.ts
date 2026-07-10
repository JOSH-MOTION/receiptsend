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

/*
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
*/

export const SMS_PACKAGES: SmsPackage[] = [
  { id: 'sms_100', name: '100 SMS', price: 57, units: 100 },
  { id: 'sms_250', name: '250 SMS', price: 143, units: 250 },
  { id: 'sms_500', name: '500 SMS', price: 285, units: 500 },
  { id: 'sms_750', name: '750 SMS', price: 428, units: 750 },
  { id: 'sms_1000', name: '1,000 SMS', price: 570, units: 1000, popular: true },
  { id: 'sms_1250', name: '1,250 SMS', price: 713, units: 1250 },
  { id: 'sms_1500', name: '1,500 SMS', price: 856, units: 1500 },
  { id: 'sms_1750', name: '1,750 SMS', price: 998, units: 1750 },
  { id: 'sms_2000', name: '2,000 SMS', price: 1141, units: 2000 },
  { id: 'sms_2250', name: '2,250 SMS', price: 1283, units: 2250 },
  { id: 'sms_2427', name: '2,427 SMS', price: 1384, units: 2427 },
  { id: 'sms_2500', name: '2,500 SMS', price: 1426, units: 2500 },
  { id: 'sms_2600', name: '2,600 SMS', price: 1483, units: 2600 },
  { id: 'sms_2750', name: '2,750 SMS', price: 1569, units: 2750 },
  { id: 'sms_3000', name: '3,000 SMS', price: 1711, units: 3000 },
  { id: 'sms_3500', name: '3,500 SMS', price: 1996, units: 3500 },
  { id: 'sms_4000', name: '4,000 SMS', price: 2282, units: 4000 },
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