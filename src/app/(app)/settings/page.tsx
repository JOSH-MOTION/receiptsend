
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Mail, Palette, Smartphone, CreditCard, Save, Loader2, DollarSign, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { smsPricingBundles, formatCurrency } from "@/lib/sms-pricing-updated";
import { useUser } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface Organization {
  _id?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string; 
  smsBalance?: number;
  smsSenderId?: string;
  totalSpent?: number;
  totalPurchased?: number;
  thankYouMessage?: string;
  createdAt?: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Partial<Organization>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
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
    setIsLoading(true);
    try {
      const response = await fetch("/api/organization", {
        headers: { 'X-User-UID': user.uid }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      } else {
        toast({ title: 'Error', description: 'Could not load your organization data.', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast({ title: 'Error', description: 'Could not load your organization data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrganization(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (section: string, payload: Partial<Organization>) => {
    if (!user) return;
    setSavingSection(section);
    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'X-User-UID': user.uid
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: 'Settings Saved', description: `Your ${section} settings have been updated.` });
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to save ${section} settings`);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingSection(null);
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

  const renderSkeleton = () => (
    <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );

  if (isLoading) {
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
          {renderSkeleton()}
        </div>
      </div>
    );
  }

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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-green-100/50 dark:bg-green-950/30 p-1 h-auto">
            <TabsTrigger value="profile"><Building2 className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="sms"><Smartphone className="h-4 w-4 mr-2" />SMS</TabsTrigger>
            <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-2" />Customization</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" />Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>This is your business information that will appear on receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Organization Name</Label>
                    <Input id="companyName" name="companyName" value={organization.companyName || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Public Email</Label>
                    <Input id="email" name="email" type="email" value={organization.email || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Public Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" value={organization.phoneNumber || ''} onChange={handleInputChange} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={organization.address || ''} onChange={handleInputChange} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSave('profile', { 
                    companyName: organization.companyName, 
                    email: organization.email,
                    phoneNumber: organization.phoneNumber,
                    address: organization.address
                  })} 
                  disabled={savingSection === 'profile'}
                >
                  {savingSection === 'profile' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingSection === 'profile' ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-6">
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
                      name="smsSenderId" 
                      value={organization.smsSenderId || ''} 
                      onChange={handleInputChange}
                      maxLength={11}
                      placeholder="e.g., SENDORA"
                  />
                  <p className="text-xs text-muted-foreground">This is the name your customers will see. Must be 3-11 alphanumeric characters.</p>
                </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={() => handleSave('sms', { smsSenderId: organization.smsSenderId })} disabled={savingSection === 'sms'}>
                    {savingSection === 'sms' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {savingSection === 'sms' ? 'Saving...' : 'Save Sender ID'}
                  </Button>
              </CardFooter>
            </Card>

            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Purchase SMS Credits</CardTitle>
                    <CardDescription>Top up your balance to send SMS receipts and messages.</CardDescription>
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
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => handlePurchase(bundle.id)}
                          disabled={isPurchasing !== null}
                        >
                          {isPurchasing === bundle.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy Now'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

           <TabsContent value="branding">
             <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>Customize the look and feel of your receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="thankYouMessage">Default "Thank You" Message</Label>
                  <Textarea 
                    id="thankYouMessage" 
                    name="thankYouMessage"
                    value={organization.thankYouMessage || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Thank you for your business!"
                  />
                </div>
                 <div className="space-y-2">
                  <Label>Brand Colors (coming soon)</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 border"></div>
                      <span>Primary</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 border"></div>
                      <span>Secondary</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSave('branding', { thankYouMessage: organization.thankYouMessage })} disabled={savingSection === 'branding'}>
                  {savingSection === 'branding' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingSection === 'branding' ? 'Saving...' : 'Save Customizations'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
              <CardHeader>
                <CardTitle>Billing & Usage</CardTitle>
                <CardDescription>View your purchase history and SMS usage.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold">Lifetime Statistics</h3>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign size={16}/>Total Spent</span>
                    <span className="font-bold">{formatCurrency(organization.totalSpent || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><Hash size={16}/>Total Credits Purchased</span>
                    <span className="font-bold">{(organization.totalPurchased || 0).toLocaleString()}</span>
                  </div>
                </div>
                 <div>
                   <h3 className="font-semibold mb-4">Transaction History</h3>
                   <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <p>Your transaction history will appear here.</p>
                    <p className="text-xs mt-1">(Coming soon)</p>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
