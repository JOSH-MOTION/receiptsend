import mongoose, { Schema, Document, Model } from 'mongoose';

// Organization Schema
export interface IOrganization extends Document {
  _id: string;
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
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
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
  smsSenderId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Contact Schema
export interface IContact extends Document {
  _id: string;
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
  _id: string;
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
  createdAt: { type: Date, default: Date.now }
});

// Email Log Schema
export interface IEmailLog extends Document {
  _id: string;
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
  _id: string;
  receiptId: string;
  phoneNumber: string;
  status: string;
  apiResponse?: string;
  sentAt: Date;
}

const SmsLogSchema = new Schema<ISmsLog>({
  receiptId: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true },
  status: { type: String, required: true },
  apiResponse: { type: String },
  sentAt: { type: Date, default: Date.now }
});

// User Schema (for authentication)
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  organizationId: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// System Error Log Schema
export interface ISystemErrorLog extends Document {
  _id: string;
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
export const SystemErrorLog: Model<ISystemErrorLog> = mongoose.models.SystemErrorLog || mongoose.model<ISystemErrorLog>('SystemErrorLog', SystemErrorLogSchema);