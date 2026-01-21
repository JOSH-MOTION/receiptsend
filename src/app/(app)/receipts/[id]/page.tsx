'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Mail,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, fromUnixTime } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { sendReceiptAction } from '@/actions/send-receipt-action';
import type { SendReceiptInput } from '@/actions/receipt-types';

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
  deliveryChannels?: string[];
}

export default function ReceiptDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  const receiptId = Array.isArray(params.id) ? params.id[0] : params.id;

  const receiptRef = useMemoFirebase(
    () => (receiptId && user ? doc(firestore, `organizations/${user.uid}/receipts`, receiptId) : null),
    [firestore, user, receiptId]
  );
  const { data: receipt, isLoading: isReceiptLoading, error } = useDoc<Omit<Receipt, 'id'>>(receiptRef);
  
  const orgRef = useMemoFirebase(
    () => (user ? doc(firestore, `organizations/${user.uid}`) : null),
    [firestore, user]
  );
  const { data: orgData, isLoading: isOrgLoading } = useDoc(orgRef);
  
  useEffect(() => {
    if (error) {
      console.error('Error loading receipt:', error);
      toast({
        title: 'Permission Error',
        description: 'You do not have permission to view this receipt.',
        variant: 'destructive',
      });
      router.push('/receipts');
    }
  }, [error, router, toast]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleResendEmail = async () => {
    if (!receipt || !orgData) return;
    
    setIsSendingEmail(true);
    try {
      const flowInput: SendReceiptInput = {
        receipt: {
          receiptNumber: receipt.receiptNumber,
          customerName: receipt.customerName,
          customerEmail: receipt.customerEmail,
          items: receipt.items,
          totalAmount: receipt.totalAmount,
          thankYouMessage: receipt.thankYouMessage || '',
          createdAt: new Date(receipt.createdAt.seconds * 1000).toISOString(),
          discount: receipt.discount,
          tax: receipt.tax,
        },
        organization: {
          companyName: orgData.companyName,
          email: orgData.email,
          address: orgData.address,
        }
      };

      const result = await sendReceiptAction(flowInput);

      if (result.success) {
        toast({
          title: 'Email Sent!',
          description: `Receipt has been resent to ${receipt.customerEmail}`,
          className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
        });
      } else {
        toast({
          title: 'Email Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  const handleResendSMS = () => {
    setIsSendingSMS(true);
    setTimeout(() => {
      toast({
        title: 'Feature In Development',
        description: 'SMS functionality requires backend setup (Firebase Functions) to be fully functional.',
      });
      setIsSendingSMS(false);
    }, 500);
  };
  
  const formatTimestamp = (ts: any, timeFormat: string = 'MMMM dd, yyyy') => {
    if (!ts) return '...';
    const date = ts.seconds ? fromUnixTime(ts.seconds) : ts;
    return format(date, timeFormat);
  }

  const isLoading = isUserLoading || isReceiptLoading || isOrgLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }
  
  if (!receipt) {
    return (
      <div className="container mx-auto py-8 max-w-4xl text-center">
        <Card className="p-8">
            <CardTitle className="text-2xl">Receipt Not Found</CardTitle>
            <p className="mt-4">The receipt you are looking for does not exist or you do not have permission to view it.</p>
            <Button asChild className="mt-6">
              <Link href="/receipts">Back to Receipts</Link>
            </Button>
        </Card>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 print:hidden gap-4">
        <Button variant="ghost" asChild>
          <Link href="/receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Receipts
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResendEmail}
            disabled={isSendingEmail}
            className="flex-1 sm:flex-initial"
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Email
              </>
            )}
          </Button>
          {receipt.customerPhoneNumber && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendSMS}
              disabled={isSendingSMS}
              className="flex-1 sm:flex-initial"
            >
              {isSendingSMS ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Resend SMS
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-initial">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="p-6 sm:p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b mb-8">
            <div className='mb-6 sm:mb-0'>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full" />
                    <h1 className="text-2xl font-bold">{orgData?.companyName || 'Business Name'}</h1>
                </div>
                <p className="text-muted-foreground text-sm">{orgData?.address}</p>
                <p className="text-muted-foreground text-sm">{orgData?.phoneNumber}</p>
            </div>
            <div className="text-left sm:text-right">
                <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-wider">RECEIPT</h2>
                <p className="text-muted-foreground mt-2">
                    Date: {formatTimestamp(receipt.createdAt)}
                </p>
                <p className="text-muted-foreground">
                    Receipt #: {receipt.receiptNumber}
                </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="pb-8">
            <h3 className="font-semibold mb-2 text-gray-600 dark:text-gray-300">Billed To:</h3>
            <p className="font-medium">{receipt.customerName}</p>
            <p className="text-muted-foreground text-sm">{receipt.customerEmail}</p>
            {receipt.customerPhoneNumber && (
                <p className="text-muted-foreground text-sm">{receipt.customerPhoneNumber}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                    <tr>
                        <th className="text-left p-3 font-semibold text-sm">ITEM DESCRIPTION</th>
                        <th className="text-right p-3 font-semibold text-sm hidden sm:table-cell">UNIT PRICE</th>
                        <th className="text-right p-3 font-semibold text-sm hidden sm:table-cell">QTY</th>
                        <th className="text-right p-3 font-semibold text-sm">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {receipt.items.map((item, index) => (
                    <tr key={index} className="border-b bg-secondary/20">
                        <td className="p-3">
                            <p className="font-medium text-sm">{item.name}</p>
                        </td>
                        <td className="text-right p-3 text-sm hidden sm:table-cell">${item.price.toFixed(2)}</td>
                        <td className="text-right p-3 text-sm hidden sm:table-cell">{item.quantity}</td>
                        <td className="text-right p-3 font-medium text-sm">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full md:w-1/2 lg:w-2/5 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {receipt.discount && receipt.discount > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({receipt.discount}%):</span>
                    <span className="font-medium text-destructive">-${discountAmount.toFixed(2)}</span>
                </div>
                )}
                {receipt.tax && receipt.tax > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({receipt.tax}%):</span>
                    <span className="font-medium">+${taxAmount.toFixed(2)}</span>
                </div>
                )}
                <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center mt-4">
                    <span className="text-lg font-bold">TOTAL DUE</span>
                    <span className="text-xl font-bold">${receipt.totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>

          {/* Note & Footer */}
          <div>
            <div className="text-center mb-12">
              <p className="text-lg font-medium">{receipt.thankYouMessage || 'Thank you for your business!'}</p>
            </div>

            <Separator className="my-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-muted-foreground">
                <div>
                    <h4 className="font-semibold mb-2 text-foreground">Questions?</h4>
                    <p>Email: {orgData?.email || 'N/A'}</p>
                    <p>Call: {orgData?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-foreground">Payment Info:</h4>
                    <p>This is a receipt, not an invoice. No payment is due on this document.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-foreground">Terms & Conditions:</h4>
                    <p>All sales are final. Please contact us with any issues within 30 days.</p>
                </div>
            </div>
          </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem;
            border: none;
            box-shadow: none;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
