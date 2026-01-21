'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, fromUnixTime } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface Receipt {
  id: string;
  organizationId: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber?: string;
  items: ReceiptItem[];
  discount?: number;
  tax?: number;
  totalAmount: number;
  createdAt: { seconds: number; nanoseconds: number; };
  thankYouMessage?: string;
}

export default function ReceiptDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const receiptId = Array.isArray(params.id) ? params.id[0] : params.id;

  const receiptRef = useMemoFirebase(
    () => (receiptId && user ? doc(firestore, `organizations/${user.uid}/receipts`, receiptId) : null),
    [firestore, user, receiptId]
  );
  const { data: receipt, isLoading, error } = useDoc<Omit<Receipt, 'id'>>(receiptRef);
  
  useEffect(() => {
    if (!isLoading && !receipt && receiptId) {
       toast({
          title: 'Error',
          description: 'Receipt not found or you do not have permission to view it.',
          variant: 'destructive',
        });
       router.push('/receipts');
    }
  }, [isLoading, receipt, receiptId, router, toast]);

  const handlePrint = () => {
    window.print();
  };
  
  const formatTimestamp = (ts: any, timeFormat: string = 'MMMM dd, yyyy') => {
    if (!ts) return '...';
    const date = ts.seconds ? fromUnixTime(ts.seconds) : ts;
    return format(date, timeFormat);
  }

  if (isLoading || !receipt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  const subtotal = receipt.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  const discountAmount = (subtotal * (receipt.discount || 0)) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * (receipt.tax || 0)) / 100;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header - Don't print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link href="/receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Receipts
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Receipt</CardTitle>
              <CardDescription className="mt-2">
                Receipt #{receipt.receiptNumber}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              Saved
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Date and Customer Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Receipt Details</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Date:</strong>{' '}
                {formatTimestamp(receipt.createdAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Time:</strong>{' '}
                {formatTimestamp(receipt.createdAt, 'hh:mm a')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Name:</strong> {receipt.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {receipt.customerEmail}
              </p>
              {receipt.customerPhoneNumber && (
                <p className="text-sm text-muted-foreground">
                  <strong>Phone:</strong> {receipt.customerPhoneNumber}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Items / Services</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-center p-3 font-medium">Quantity</th>
                    <th className="text-right p-3 font-medium">Price</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.name}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="text-right p-3">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {receipt.discount && receipt.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount ({receipt.discount}%):
                  </span>
                  <span className="font-medium text-destructive">
                    -${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {receipt.tax && receipt.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({receipt.tax}%):
                  </span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {receipt.thankYouMessage || 'Thank you for your business!'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .container,
          .container * {
            visibility: visible;
          }
          .container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
