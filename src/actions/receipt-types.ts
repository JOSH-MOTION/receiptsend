import { z } from 'zod';

export const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const ReceiptDataSchema = z.object({
  receiptNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  items: z.array(ReceiptItemSchema),
  totalAmount: z.number(),
  thankYouMessage: z.string().optional(),
  createdAt: z.string(),
  discount: z.number().optional(),
  tax: z.number().optional(),
});

export const OrganizationDataSchema = z.object({
  companyName: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export const SendReceiptInputSchema = z.object({
  receipt: ReceiptDataSchema,
  organization: OrganizationDataSchema,
});

export type SendReceiptInput = z.infer<typeof SendReceiptInputSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;
export type OrganizationData = z.infer<typeof OrganizationDataSchema>;