import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Organization Schema
export interface IOrganization extends Document {
  _id: string; // Explicitly define _id to be a string
  companyName: string;
  logoUrl?: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  emailSubject?: string;
  emailBody?: string;
  smsContent?: string;
  smsBalance?: number;
  smsApiKey?: string;
  smsSenderId?: string;
  thankYouMessage?: string;
  totalSpent?: number;        // Track total money spent
  totalPurchased?: number;    // Track total units purchased
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  _id: { type: String, required: true }, // Use Firebase UID as the ID
  companyName: { type: String, required: true },
  logoUrl: { type: String },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  address: { type: String },
  emailSubject: { type: String },
  emailBody: { type: String },
  smsContent: { type: String },
  smsBalance: { type: Number, default: 0 },
  smsApiKey: { type: String },
  smsSenderId: { type: String, trim: true, maxlength: 11 },
  thankYouMessage: { type: String, default: 'Thank you for your business!' },
  totalSpent: { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false }); // Disable default _id generation

// Contact Schema
export interface IContact extends Document {
  organizationId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Receipt Schema
export interface IReceipt extends Document {
  organizationId: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  discount?: number;
  tax?: number;
  totalAmount: number;
  pdfUrl?: string;
  thankYouMessage?: string;
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>({
  organizationId: { type: String, required: true, index: true },
  receiptNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhoneNumber: { type: String },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  pdfUrl: { type: String },
  thankYouMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Email Log Schema
export interface IEmailLog extends Document {
  receiptId: string;
  recipient: string;
  status: string;
  errorMessage?: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  receiptId: { type: String, required: true, index: true },
  recipient: { type: String, required: true },
  status: { type: String, required: true },
  errorMessage: { type: String },
  sentAt: { type: Date, default: Date.now }
});

// SMS Log Schema
export interface ISmsLog extends Document {
  receiptId: string;
  organizationId?: string;     // Added for admin tracking
  phoneNumber: string;
  message?: string;            // Added to store message content
  unitsUsed?: number;          // Added to track units
  status: string;
  apiResponse?: string;
  sentAt: Date;
}

const SmsLogSchema = new Schema<ISmsLog>({
  receiptId: { type: String, required: true, index: true },
  organizationId: { type: String, index: true },
  phoneNumber: { type: String, required: true },
  message: { type: String },
  unitsUsed: { type: Number },
  status: { type: String, required: true },
  apiResponse: { type: String },
  sentAt: { type: Date, default: Date.now }
});

// User Schema (for authentication)
export interface IUser extends Document {
  uid: string; // Firebase UID
  email: string;
  organizationId: string;
  role?: string;               // Added for super admin check
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  organizationId: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'superadmin'
  createdAt: { type: Date, default: Date.now }
});

// Transaction Schema (NEW - for Paystack payments)
export interface ITransaction extends Document {
  organizationId: string;
  organizationName: string;
  reference: string;
  bundleId: string;
  bundleName: string;
  amount: number;
  units: number;
  status: string;
  paystackResponse?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  organizationId: { type: String, required: true, index: true },
  organizationName: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  bundleId: { type: String, required: true },
  bundleName: { type: String, required: true },
  amount: { type: Number, required: true },
  units: { type: Number, required: true },
  status: { type: String, required: true },
  paystackResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Template Schema (NEW)
export interface ITemplate extends Document {
  organizationId: string;
  name: string;
  content: string;
  type: string; // e.g., 'receipt_thank_you'
  createdAt: Date;
}

const TemplateSchema = new Schema<ITemplate>({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});


// System Error Log Schema
export interface ISystemErrorLog extends Document {
  timestamp: Date;
  message: string;
  stackTrace?: string;
  component?: string;
}

const SystemErrorLogSchema = new Schema<ISystemErrorLog>({
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true },
  stackTrace: { type: String },
  component: { type: String }
});

// Export models
export const Organization: Model<IOrganization> = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
export const Receipt: Model<IReceipt> = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);
export const EmailLog: Model<IEmailLog> = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
export const SmsLog: Model<ISmsLog> = mongoose.models.SmsLog || mongoose.model<ISmsLog>('SmsLog', SmsLogSchema);
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Template: Model<ITemplate> = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
export const SystemErrorLog: Model<ISystemErrorLog> = mongoose.models.SystemErrorLog || mongoose.model<ISystemErrorLog>('SystemErrorLog', SystemErrorLogSchema);