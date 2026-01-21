"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Mail, Palette, Smartphone, CreditCard, Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { smsPricingBundles, formatCurrency } from "@/lib/sms-pricing-updated";
import { useUser } from "@/firebase";

interface Organization {
  companyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  smsBalance?: number;
  smsSenderId?: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Partial<Organization>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);
  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const units = searchParams.get('units');

    if (paymentStatus === 'success') {
      toast({
        title: 'Payment Successful!',
        description: `Your account has been credited with ${units} SMS units.`,
        className: 'bg-green-100 dark:bg-green-900 border-green-300'
      });
      fetchOrganization();
      router.replace('/settings?tab=sms'); // Clean URL
    } else if (paymentStatus === 'failed') {
      toast({
        title: 'Payment Failed',
        description: 'Your payment was not successful. Please try again.',
        variant: 'destructive',
      });
      router.replace('/settings?tab=sms'); // Clean URL
    }
  }, [searchParams, toast, router]);

  const fetchOrganization = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/organization", {
        headers: { 'X-User-UID': user.uid }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'X-User-UID': user.uid
        },
        body: JSON.stringify(organization),
      });

      if (response.ok) {
        setSavedSuccess(true);
        toast({ title: 'Success', description: 'Your settings have been saved.' });
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchase = async (bundleId: string) => {
    if (!user) return;
    setIsPurchasing(bundleId);
    try {
        const response = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-User-UID': user.uid
            },
            body: JSON.stringify({ bundleId }),
        });

        const data = await response.json();

        if (response.ok && data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        } else {
            throw new Error(data.error || 'Failed to start payment.');
        }
    } catch (error: any) {
        toast({
            title: 'Payment Error',
            description: error.message,
            variant: 'destructive',
        });
        setIsPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your organization profile and preferences
          </p>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-green-100/50 dark:bg-green-950/30 p-1 h-auto">
            <TabsTrigger value="organization"><Building2 className="h-4 w-4 mr-2" />Organization</TabsTrigger>
            <TabsTrigger value="sms"><Smartphone className="h-4 w-4 mr-2" />SMS</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-2" />Branding</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" />Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organization">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update your business information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" value={organization.companyName || ''} onChange={(e) => setOrganization({ ...organization, companyName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Contact Email</Label>
                    <Input id="orgEmail" type="email" value={organization.email || ''} onChange={(e) => setOrganization({ ...organization, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Phone Number</Label>
                  <Input id="orgPhone" value={organization.phoneNumber || ''} onChange={(e) => setOrganization({ ...organization, phoneNumber: e.target.value })} />
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms">
            <div className="space-y-6">
               <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
                <CardHeader>
                  <CardTitle>SMS Configuration</CardTitle>
                  <CardDescription>Set your Sender ID for outgoing SMS messages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="smsSenderId">SMS Sender ID</Label>
                    <Input 
                        id="smsSenderId" 
                        value={organization.smsSenderId || ''} 
                        onChange={(e) => setOrganization({ ...organization, smsSenderId: e.target.value })}
                        maxLength={11}
                        placeholder="Max 11 characters"
                    />
                    <p className="text-xs text-muted-foreground">This is the name your customers will see. Must be 3-11 characters.</p>
                  </div>
                   <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Sender ID
                    </Button>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Purchase SMS Credits</CardTitle>
                      <CardDescription>Top up your balance to send SMS receipts.</CardDescription>
                    </div>
                    <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                      {(organization.smsBalance || 0).toLocaleString()} Credits
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                   <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {smsPricingBundles.map((bundle) => (
                      <Card
                        key={bundle.id}
                        className={`flex flex-col ${bundle.popular ? "border-2 border-primary shadow-lg" : "border"}`}
                      >
                        {bundle.popular && (
                          <div className="bg-primary text-primary-foreground text-xs text-center py-1 font-semibold">
                            Most Popular
                          </div>
                        )}
                        <CardHeader className="text-center">
                          <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                          <CardDescription>{bundle.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
                          <div className="text-4xl font-bold">
                            {bundle.units.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground">SMS Credits</div>
                          <div className="text-3xl font-bold text-primary">
                            {formatCurrency(bundle.price)}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatCurrency(bundle.pricePerUnit)} / SMS</p>
                        </CardContent>
                        <div className="p-6 pt-0">
                          <Button 
                            className="w-full" 
                            onClick={() => handlePurchase(bundle.id)}
                            disabled={isPurchasing !== null}
                          >
                            {isPurchasing === bundle.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy Now'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
           {/* Add other tabs content here */}

        </Tabs>
      </div>
    </div>
  );
}
