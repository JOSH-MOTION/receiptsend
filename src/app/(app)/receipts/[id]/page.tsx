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
import { Card, CardTitle } from '@/components/ui/card';
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
  const [isClient, setIsClient] = useState(false);


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
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isUserLoading && !isReceiptLoading && error) {
      toast({
        title: 'Permission Error',
        description: 'You do not have permission to view this receipt.',
        variant: 'destructive',
      });
      router.push('/receipts');
    }
  }, [error, isUserLoading, isReceiptLoading, router, toast]);

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
          className: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900",
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
    <div className="container mx-auto py-8 max-w-4xl print-container">
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
            disabled={isSendingEmail || !receipt.deliveryChannels?.includes("email")}
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
              disabled={isSendingSMS || !receipt.deliveryChannels?.includes("sms")}
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
      
       {isClient && (
        <div className="text-center text-sm text-muted-foreground mb-4 print:hidden">
          {receipt.deliveryChannels?.includes("email") && `Sent via Email on ${formatTimestamp(receipt.createdAt, "MMMM dd, yyyy, hh:mm a")}`}
          {receipt.deliveryChannels?.includes("sms") && `Sent via SMS on ${formatTimestamp(receipt.createdAt, "MMMM dd, yyyy, hh:mm a")}`}
        </div>
       )}

      {/* Receipt Card */}
      <Card className="p-6 sm:p-8 md:p-12 shadow-2xl bg-white dark:bg-black border border-red-200 dark:border-red-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-8 mb-8">
            <div className='mb-6 sm:mb-0'>
                <h1 className="text-3xl font-bold text-red-600">{orgData?.companyName || 'Business Name'}</h1>
                <p className="text-muted-foreground text-sm max-w-xs mt-2">{orgData?.address}</p>
            </div>
            <div className="text-left sm:text-right">
                <h2 className="text-5xl font-extrabold text-gray-800 dark:text-gray-200 tracking-wider">INVOICE</h2>
                <p className="text-muted-foreground mt-2">
                    Invoice #: {receipt.receiptNumber}
                </p>
            </div>
          </div>
          
          <Separator className="my-8 border-red-200 dark:border-red-900" />


          {/* Customer Info & Dates */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
              <div>
                  <h3 className="font-semibold mb-2 text-gray-500 dark:text-gray-400">BILLED TO</h3>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{receipt.customerName}</p>
                  <p className="text-muted-foreground text-sm">{receipt.customerEmail}</p>
                  {receipt.customerPhoneNumber && (
                      <p className="text-muted-foreground text-sm">{receipt.customerPhoneNumber}</p>
                  )}
              </div>
              <div className="text-left md:text-right">
                  <div className="mb-2">
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Invoice Date: </span>
                      <span className="text-gray-800 dark:text-gray-200">{formatTimestamp(receipt.createdAt)}</span>
                  </div>
                  <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Due Date: </span>
                       <span className="text-gray-800 dark:text-gray-200">{formatTimestamp(receipt.createdAt)}</span>
                  </div>
              </div>
          </div>


          {/* Items Table */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full">
                <thead className="border-b-2 border-t-2 border-red-200 dark:border-red-900">
                    <tr>
                        <th className="text-left p-3 font-bold text-red-600 uppercase tracking-wider text-sm">Description</th>
                        <th className="text-right p-3 font-bold text-red-600 uppercase tracking-wider text-sm hidden sm:table-cell">Unit Cost</th>
                        <th className="text-right p-3 font-bold text-red-600 uppercase tracking-wider text-sm hidden sm:table-cell">QTY</th>
                        <th className="text-right p-3 font-bold text-red-600 uppercase tracking-wider text-sm">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {receipt.items.map((item, index) => (
                    <tr key={index} className="border-b border-red-100 dark:border-red-900/50">
                        <td className="p-3">
                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.name}</p>
                        </td>
                        <td className="text-right p-3 text-sm hidden sm:table-cell">GH₵{item.price.toFixed(2)}</td>
                        <td className="text-right p-3 text-sm hidden sm:table-cell">{item.quantity}</td>
                        <td className="text-right p-3 font-medium text-sm text-gray-800 dark:text-gray-200">GH₵{(item.quantity * item.price).toFixed(2)}</td>
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
                    <span className="font-medium text-gray-800 dark:text-gray-200">GH₵{subtotal.toFixed(2)}</span>
                </div>
                {receipt.discount && receipt.discount > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({receipt.discount}%):</span>
                    <span className="font-medium text-red-600">-GH₵{discountAmount.toFixed(2)}</span>
                </div>
                )}
                {receipt.tax && receipt.tax > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({receipt.tax}%):</span>
                    <span className="font-medium">+GH₵{taxAmount.toFixed(2)}</span>
                </div>
                )}
                <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-lg mt-4">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-xl font-bold">GH₵{receipt.totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>

          {/* Note & Footer */}
          <div>
            <div className="mb-8">
              <h4 className="font-bold text-red-600 mb-2">NOTES</h4>
              <p className="text-sm text-muted-foreground">{receipt.thankYouMessage || 'Thank you for your business!'}</p>
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
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            background-color: white !important;
          }
           .print-container .dark\\:bg-black {
             background-color: white !important;
           }
           .print-container .dark\\:text-gray-200 {
             color: #1f2937 !important; /* gray-800 */
           }
           .print-container .dark\\:border-red-900, .print-container .dark\\:border-red-900\\/50 {
             border-color: #fecaca !important; /* red-200 */
           }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
