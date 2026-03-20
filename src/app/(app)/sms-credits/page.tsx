'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  MessageSquare,
  Zap,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SMS_PACKAGES, type SmsPackage } from '@/actions/sms-package-types';
import { creditSmsUnits } from '@/actions/sms-credit-actions';
import { Progress } from '@/components/ui/progress';

// Paystack public key — add to .env.local as NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

interface OrgData {
  companyName?: string;
  email?: string;
  smsBalance?: number;
  smsTotalPurchased?: number;
  smsTotalUsed?: number;
}

function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: SmsPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  const totalUnits = pkg.units + (pkg.bonus || 0);

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        selected
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
          : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1 text-xs font-semibold shadow-md">
            <Star className="h-3 w-3 mr-1 fill-white" />
            Most Popular
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            ~{pkg.units.toLocaleString()} SMS units
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-primary">GH₵{pkg.price}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span>{pkg.units.toLocaleString()} SMS units included</span>
        </div>
        {pkg.bonus && pkg.bonus > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <Zap className="h-4 w-4 flex-shrink-0" />
            <span>+{pkg.bonus} bonus units (total {totalUnits.toLocaleString()})</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>No expiry</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          ≈ GH₵{(pkg.price / totalUnits).toFixed(3)} per SMS
        </p>
      </div>

      {selected && (
        <div className="absolute bottom-3 right-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SmsTopUpPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [selectedPackage, setSelectedPackage] = useState<SmsPackage | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const orgRef = useMemoFirebase(
    () => (user ? doc(firestore, `organizations/${user.uid}`) : null),
    [firestore, user],
  );
  const { data: orgData, isLoading } = useDoc<OrgData>(orgRef);

  const smsBalance = orgData?.smsBalance || 0;
  const totalPurchased = orgData?.smsTotalPurchased || 0;
  const totalUsed = orgData?.smsTotalUsed || 0;
  const usagePercent = totalPurchased > 0 ? Math.round((totalUsed / totalPurchased) * 100) : 0;

  const handlePayWithPaystack = async () => {
    if (!selectedPackage || !user || !orgData?.email) {
      toast({
        title: 'Missing information',
        description: 'Please select a package and ensure your profile email is set.',
        variant: 'destructive',
      });
      return;
    }

    setIsPaying(true);

    try {
      // Dynamically load Paystack inline JS
      const PaystackPop = (window as any).PaystackPop;

      if (!PaystackPop) {
        // Load the Paystack script if not yet loaded
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Paystack'));
          document.head.appendChild(script);
        });
      }

      const reference = `SMS-${user.uid.slice(0, 8)}-${Date.now()}`;

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: orgData.email,
        amount: selectedPackage.price * 100, // Paystack uses pesewas
        currency: 'GHS',
        ref: reference,
        metadata: {
          organizationId: user.uid,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          units: selectedPackage.units + (selectedPackage.bonus || 0),
        },
        onSuccess: async (response: { reference: string; transaction: any }) => {
          // Payment successful — credit the units
          const result = await creditSmsUnits(user.uid, selectedPackage.id, response.reference);

          if (result.success) {
            toast({
              title: '🎉 SMS Units Added!',
              description: `${selectedPackage.units + (selectedPackage.bonus || 0)} units have been added to your account.`,
            });
            setSelectedPackage(null);
          } else {
            toast({
              title: 'Credit Failed',
              description: result.message,
              variant: 'destructive',
            });
          }
          setIsPaying(false);
        },
        onCancel: () => {
          toast({
            title: 'Payment Cancelled',
            description: 'Your payment was not completed.',
            variant: 'destructive',
          });
          setIsPaying(false);
        },
      });

      handler.openIframe();
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Could not initialize payment.',
        variant: 'destructive',
      });
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SMS Credits</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SMS Credits
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Top up your SMS balance to keep sending receipts via SMS.
          </p>
        </div>
      </div>

      {/* Current Balance Card */}
      <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Current SMS Balance</p>
              {isLoading ? (
                <div className="h-10 w-32 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-5xl font-extrabold text-primary">
                    {smsBalance.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground mb-2">units remaining</span>
                </div>
              )}

              {smsBalance === 0 && !isLoading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-destructive font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>No SMS units remaining. Top up to continue sending.</span>
                </div>
              )}

              {smsBalance > 0 && smsBalance <= 50 && !isLoading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Low balance — consider topping up soon.</span>
                </div>
              )}
            </div>

            {totalPurchased > 0 && (
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Usage
                  </span>
                  <span>{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {totalUsed.toLocaleString()} of {totalPurchased.toLocaleString()} used
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <div>
        <h2 className="text-xl font-bold mb-2">Choose a Package</h2>
        <p className="text-sm text-muted-foreground mb-6">
          All packages have no expiry — your units roll over forever.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SMS_PACKAGES.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selectedPackage?.id === pkg.id}
              onSelect={() => setSelectedPackage(pkg)}
            />
          ))}
        </div>
      </div>

      {/* Checkout summary */}
      {selectedPackage && (
        <Card className="backdrop-blur-xl bg-card/70 border-primary/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SMS Units</span>
                <span className="font-medium">{selectedPackage.units.toLocaleString()}</span>
              </div>
              {selectedPackage.bonus && selectedPackage.bonus > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Bonus Units</span>
                  <span className="font-medium">+{selectedPackage.bonus}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-base font-bold">
                <span>Total to pay</span>
                <span className="text-primary">GH₵{selectedPackage.price}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>New balance after payment</span>
                <span>
                  {(
                    smsBalance +
                    selectedPackage.units +
                    (selectedPackage.bonus || 0)
                  ).toLocaleString()}{' '}
                  units
                </span>
              </div>
            </div>

            <Button
              onClick={handlePayWithPaystack}
              disabled={isPaying}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold h-12 text-base shadow-lg"
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Pay GH₵{selectedPackage.price} with Paystack
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Secured by Paystack. Units are credited instantly after payment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card className="backdrop-blur-xl bg-card/70 border-border">
        <CardHeader>
          <CardTitle className="text-base">How SMS Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• 1 SMS unit = 1 message sent to 1 recipient (standard length, up to 160 characters).</p>
          <p>• Units never expire — they roll over indefinitely.</p>
          <p>• SMS sending is blocked when your balance reaches 0. Top up anytime to resume.</p>
          <p>• Units are deducted only on successful delivery attempts.</p>
        </CardContent>
      </Card>
    </div>
  );
}