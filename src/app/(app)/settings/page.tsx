'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Save, CreditCard, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Updated realistic Ghana SMS bundles (GH¢)
const smsBundles = [
  { id: 'starter', credits: 401, price: 20, description: 'Perfect for getting started', pricePerUnit: 0.050 },
  { id: 'basic', credits: 601, price: 40, description: 'Great for small businesses', pricePerUnit: 0.067 },
  { id: 'standard', credits: 1052, price: 50, description: 'Most popular choice', pricePerUnit: 0.048, popular: true },
  { id: 'premium', credits: 2054, price: 100, description: 'Best value for regular senders', pricePerUnit: 0.049 },
  { id: 'advanced', credits: 4108, price: 200, description: 'For growing businesses', pricePerUnit: 0.049 },
  { id: 'vip', credits: 20340, price: 1000, description: 'Maximum value for high volume', pricePerUnit: 0.049 },
];

const thankYouTemplates = [
  { name: 'Warm & Friendly', message: 'Thank you for shopping with us today! We truly appreciate your business and hope to see you again soon 😊' },
  { name: 'Professional', message: 'Thank you for your purchase. Your satisfaction is our top priority.' },
  { name: 'Loyalty Focused', message: 'Thank you for being a valued customer! Earn rewards on your next visit.' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orgData, setOrgData] = useState<any>(null);
  const [smsBalance, setSmsBalance] = useState(0);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Single form for all settings
  const form = useForm({
    resolver: zodResolver(z.object({
      companyName: z.string().min(1, 'Organization name is required'),
      email: z.string().email('Invalid email'),
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      logoUrl: z.string().url().optional().or(z.literal('')),
      emailSubject: z.string().optional(),
      emailBody: z.string().optional(),
      smsSenderId: z.string().max(11).optional(),
      smsContent: z.string().optional(),
      thankYouMessage: z.string().optional(),
    })),
    defaultValues: {
      companyName: '',
      email: '',
      phoneNumber: '',
      address: '',
      logoUrl: '',
      emailSubject: '',
      emailBody: '',
      smsSenderId: '',
      smsContent: '',
      thankYouMessage: 'Thank you for your business!',
    },
  });

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const units = searchParams.get('units');
    const tab = searchParams.get('tab');

    if (paymentStatus === 'success' && units) {
      toast({ title: 'Payment Successful! 🎉', description: `${units} SMS units added.` });
      router.replace('/dashboard/settings' + (tab ? `?tab=${tab}` : ''));
      fetchOrganization();
    } else if (paymentStatus === 'failed') {
      const error = searchParams.get('error');
      toast({ title: 'Payment Failed', description: error || 'Please try again.', variant: 'destructive' });
      router.replace('/dashboard/settings' + (tab ? `?tab=${tab}` : ''));
    }

    fetchOrganization();
  }, [searchParams, router]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization');
      if (response.ok) {
        const data = await response.json();
        setOrgData(data);
        setSmsBalance(data.smsBalance || 0);

        form.reset({
          companyName: data.companyName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          logoUrl: data.logoUrl || '',
          emailSubject: data.emailSubject || '',
          emailBody: data.emailBody || '',
          smsSenderId: data.smsSenderId || '',
          smsContent: data.smsContent || '',
          thankYouMessage: data.thankYouMessage || 'Thank you for your business!',
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    }
  };

  const saveSettings = async (fields: Partial<any>) => {
    try {
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (response.ok) {
        toast({ title: 'Saved', description: 'Settings updated successfully.' });
        fetchOrganization(); // Refresh data
      } else {
        throw new Error();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const handlePurchase = async (bundleId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      });
      const data = await response.json();
      if (data.success && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      toast({ title: 'Payment Error', description: error.message || 'Try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const applyTemplate = (template: { message: string }) => {
    form.setValue('thankYouMessage', template.message);
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Tabs defaultValue={searchParams.get('tab') || 'profile'}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form className="space-y-8">

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Profile</CardTitle>
                  <CardDescription>Update your company's basic information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button onClick={() => saveSettings(form.getValues(['companyName', 'email', 'phoneNumber', 'address']))}>
                    <Save className="mr-2 h-4 w-4" /> Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize your receipts with your logo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Logo</FormLabel>
                      <div className="flex items-center gap-6">
                        <Image
                          alt="Logo preview"
                          width={80}
                          height={80}
                          className="rounded-md border object-cover"
                          src={field.value || 'https://picsum.photos/seed/logo/80/80'}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max 800x400px)</p>
                          </div>
                          <FormDescription>Paste a direct image URL for now.</FormDescription>
                          <FormControl><Input placeholder="https://your-logo.com/logo.png" {...field} /></FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button onClick={() => saveSettings({ logoUrl: form.getValues('logoUrl') })}>
                    <Save className="mr-2 h-4 w-4" /> Save Logo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Customize emails sent with receipts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="emailSubject" render={({ field }) => (
                    <FormItem><FormLabel>Subject Line</FormLabel><FormControl><Input placeholder="Your receipt from {{business_name}}" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emailBody" render={({ field }) => (
                    <FormItem><FormLabel>Email Body</FormLabel><FormControl><Textarea rows={8} placeholder={`Hi {{customer_name}},\n\nThank you...`} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <p className="text-sm text-muted-foreground">Available: {'{{customer_name}}'}, {'{{amount}}'}, {'{{receipt_number}}'}, {'{{business_name}}'}</p>
                  <Button onClick={() => saveSettings(form.getValues(['emailSubject', 'emailBody']))}>
                    <Save className="mr-2 h-4 w-4" /> Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SMS Tab */}
            <TabsContent value="sms">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Settings</CardTitle>
                  <CardDescription>Manage SMS credits and messaging.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">SMS Credits</h4>
                      <p className="text-sm text-muted-foreground">
                        You have <span className="font-bold text-2xl text-primary">{smsBalance}</span> units remaining
                      </p>
                    </div>
                    <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
                      <DialogTrigger asChild><Button><CreditCard className="mr-2 h-4 w-4" />Buy Credits</Button></DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Buy SMS Credits</DialogTitle>
                          <DialogDescription>Select a bundle and pay securely with Paystack.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                          {smsBundles.map((bundle) => (
                            <Card key={bundle.id} className={`flex flex-col hover:shadow-lg transition-all ${bundle.popular ? 'border-primary border-2 shadow-md' : ''}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-xl">{bundle.credits.toLocaleString()} Units</CardTitle>
                                  {bundle.popular && <Badge>Popular</Badge>}
                                </div>
                                <CardDescription className="text-xs">{bundle.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-grow">
                                <p className="text-3xl font-bold text-primary">GH¢{bundle.price}</p>
                                <p className="text-xs text-muted-foreground">GH¢{bundle.pricePerUnit.toFixed(3)} per unit</p>
                                <div className="pt-2 border-t space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-green-600"><Check className="h-3 w-3" />No expiry</div>
                                  <div className="flex items-center gap-2 text-xs text-green-600"><Check className="h-3 w-3" />Instant activation</div>
                                </div>
                              </CardContent>
                              <CardFooter>
                                <Button className="w-full" onClick={() => handlePurchase(bundle.id)} disabled={isLoading}>
                                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Buy Now'}
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                        <DialogFooter className="flex-col space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="h-4 w-4" />Secure payment by Paystack</div>
                          <p className="text-xs text-muted-foreground">Prices in Ghana Cedis (GH¢). Redirected to Paystack for payment.</p>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">📱 SMS Pricing Guide:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 1–160 chars = 1 unit</li>
                      <li>• 161–320 chars = 2 units</li>
                      <li>• Each additional 160 chars = +1 unit</li>
                    </ul>
                  </div>

                  <FormField control={form.control} name="smsSenderId" render={({ field }) => (
                    <FormItem><FormLabel>SMS Sender ID</FormLabel><FormControl><Input maxLength={11} {...field} /></FormControl><FormDescription>Max 11 chars</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="smsContent" render={({ field }) => (
                    <FormItem><FormLabel>Default SMS Message</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormDescription>Use {'{{customer_name}}'}, {'{{amount}}'}, etc.</FormDescription><FormMessage /></FormItem>
                  )} />

                  <Button onClick={() => saveSettings(form.getValues(['smsSenderId', 'smsContent']))}>
                    <Save className="mr-2 h-4 w-4" /> Save SMS Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Tab */}
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Settings</CardTitle>
                  <CardDescription>Customize the thank you message on receipts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="thankYouMessage" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Thank You Message</FormLabel>
                        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                          <DialogTrigger asChild><Button variant="outline" size="sm"><Save className="mr-2 h-4 w-4" />Use Template</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Choose a Template</DialogTitle></DialogHeader>
                            <div className="space-y-3 py-4">
                              {thankYouTemplates.map((t) => (
                                <Card key={t.name} className="cursor-pointer hover:bg-accent" onClick={() => applyTemplate(t)}>
                                  <CardHeader className="pb-3"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
                                  <CardContent><p className="text-sm text-muted-foreground">{t.message}</p></CardContent>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormControl><Textarea rows={4} {...field} /></FormControl>
                      <FormDescription>Appears at the bottom of every receipt.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-semibold mb-2">Preview</h4>
                    <div className="border-t pt-3 text-center">
                      <p className="text-sm text-muted-foreground">{form.watch('thankYouMessage') || 'Thank you for your business!'}</p>
                    </div>
                  </div>

                  <Button onClick={() => saveSettings({ thankYouMessage: form.getValues('thankYouMessage') })}>
                    <Save className="mr-2 h-4 w-4" /> Save Receipt Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

          </form>
        </Form>
      </Tabs>
    </div>
  );
}