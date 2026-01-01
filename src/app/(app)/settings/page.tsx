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
import { Upload, Save, CreditCard, Check, Loader2, Building2, Mail, Palette, MessageSquare, FileText, Sparkles, Crown, Zap } from 'lucide-react';
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
  { id: 'starter', credits: 401, price: 20, description: 'Perfect for getting started', pricePerUnit: 0.050, icon: Sparkles },
  { id: 'basic', credits: 601, price: 40, description: 'Great for small businesses', pricePerUnit: 0.067, icon: Zap },
  { id: 'standard', credits: 1052, price: 50, description: 'Most popular choice', pricePerUnit: 0.048, popular: true, icon: Crown },
  { id: 'premium', credits: 2054, price: 100, description: 'Best value for regular senders', pricePerUnit: 0.049, icon: Crown },
  { id: 'advanced', credits: 4108, price: 200, description: 'For growing businesses', pricePerUnit: 0.049, icon: Zap },
  { id: 'vip', credits: 20340, price: 1000, description: 'Maximum value for high volume', pricePerUnit: 0.049, icon: Crown },
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="hover:text-green-600 transition-colors">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your organization preferences and configurations</p>
        </div>
      </div>

      <Tabs defaultValue={searchParams.get('tab') || 'profile'} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 flex items-center gap-2 py-3">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 flex items-center gap-2 py-3">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 flex items-center gap-2 py-3">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 flex items-center gap-2 py-3">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form className="space-y-6">

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="border-b border-green-100 dark:border-green-900/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Organization Profile</CardTitle>
                      <CardDescription>Update your company's basic information and contact details.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Organization Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500" 
                          placeholder="Acme Corporation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Email Address *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          placeholder="contact@acme.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                            placeholder="+233 XX XXX XXXX"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Business Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                            placeholder="123 Main Street, Accra"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-green-100 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                  <Button 
                    onClick={() => saveSettings(form.getValues(['companyName', 'email', 'phoneNumber', 'address']))}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save Profile Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="border-b border-green-100 dark:border-green-900/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Brand Identity</CardTitle>
                      <CardDescription>Customize your receipts with your company logo and branding.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Company Logo</FormLabel>
                      <div className="flex flex-col md:flex-row items-start gap-6 mt-3">
                        <div className="shrink-0">
                          <div className="relative group">
                            <Image
                              alt="Logo preview"
                              width={120}
                              height={120}
                              className="rounded-xl border-2 border-green-200 object-cover shadow-md group-hover:shadow-lg transition-all"
                              src={field.value || 'https://picsum.photos/seed/logo/120/120'}
                            />
                            <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <div className="border-2 border-dashed border-green-200 dark:border-green-800 rounded-xl p-8 text-center bg-green-50/30 dark:bg-green-950/10 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors cursor-pointer group">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-3 group-hover:scale-110 transition-transform">
                              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              <span className="text-green-600 dark:text-green-400 font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max 800x400px)</p>
                          </div>
                          <div className="space-y-2">
                            <FormLabel className="text-xs text-muted-foreground">Or paste a direct image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://your-domain.com/logo.png" 
                                {...field} 
                                className="border-green-200 focus:border-green-500 focus:ring-green-500"
                              />
                            </FormControl>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
                <CardFooter className="border-t border-green-100 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                  <Button 
                    onClick={() => saveSettings({ logoUrl: form.getValues('logoUrl') })}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save Logo
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="border-b border-green-100 dark:border-green-900/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Email Configuration</CardTitle>
                      <CardDescription>Customize the emails sent with digital receipts to your customers.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <FormField control={form.control} name="emailSubject" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Email Subject Line</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your receipt from {{business_name}}" 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">This appears in the customer's inbox</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="emailBody" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Email Body Template</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={10} 
                          placeholder={`Hi {{customer_name}},

Thank you for your purchase! Please find your receipt attached.

Transaction Details:
Amount: {{amount}}
Receipt Number: {{receipt_number}}

Best regards,
{{business_name}} Team`}
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-semibold mb-2 text-green-800 dark:text-green-300">📧 Available Placeholders:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <code className="bg-white dark:bg-black/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">{'{{customer_name}}'}</code>
                      <code className="bg-white dark:bg-black/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">{'{{amount}}'}</code>
                      <code className="bg-white dark:bg-black/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">{'{{receipt_number}}'}</code>
                      <code className="bg-white dark:bg-black/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">{'{{business_name}}'}</code>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-green-100 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                  <Button 
                    onClick={() => saveSettings(form.getValues(['emailSubject', 'emailBody']))}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save Email Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* SMS Tab */}
            <TabsContent value="sms" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* SMS Balance Card */}
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium mb-1">SMS Credits Balance</p>
                      <p className="text-5xl font-bold tracking-tight">{smsBalance.toLocaleString()}</p>
                      <p className="text-green-100 text-sm mt-1">units remaining</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <CardFooter className="bg-green-50/50 dark:bg-green-950/20 border-t border-green-100 dark:border-green-900/50">
                  <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30">
                        <CreditCard className="mr-2 h-4 w-4" />Top Up Credits
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Buy SMS Credits</DialogTitle>
                        <DialogDescription>Select a bundle that fits your needs. Secure payment via Paystack.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                        {smsBundles.map((bundle) => {
                          const Icon = bundle.icon;
                          return (
                            <Card 
                              key={bundle.id} 
                              className={`flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden ${
                                bundle.popular 
                                  ? 'border-green-500 border-2 shadow-lg shadow-green-500/20' 
                                  : 'border-green-100 dark:border-green-900/50'
                              }`}
                            >
                              {bundle.popular && (
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> POPULAR
                                </div>
                              )}
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                    <Icon className="h-6 w-6" />
                                  </div>
                                </div>
                                <CardTitle className="text-2xl">{bundle.credits.toLocaleString()} Units</CardTitle>
                                <CardDescription className="text-xs">{bundle.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-grow space-y-3">
                                <div>
                                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    GH¢{bundle.price}
                                  </p>
                                  <p className="text-xs text-muted-foreground">GH¢{bundle.pricePerUnit.toFixed(3)} per unit</p>
                                </div>
                                <div className="pt-3 border-t border-green-100 dark:border-green-900/50 space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                    <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                      <Check className="h-3 w-3" />
                                    </div>
                                    No expiry date
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                    <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                      <Check className="h-3 w-3" />
                                    </div>
                                    Instant activation
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0">
                                <Button 
                                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg" 
                                  onClick={() => handlePurchase(bundle.id)} 
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Buy Now'
                                  )}
                                </Button>
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-3 border-t pt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <span>Secure payment powered by Paystack</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Prices in Ghana Cedis (GH¢). You'll be redirected to Paystack for secure payment.
                        </p>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>

              {/* SMS Settings Card */}
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="border-b border-green-100 dark:border-green-900/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">SMS Configuration</CardTitle>
                      <CardDescription>Configure your SMS sender ID and default message template.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-300">📱 SMS Pricing Guide:</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                        1–160 characters = 1 credit
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                        161–320 characters = 2 credits
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                        Each additional 160 characters = +1 credit
                      </li>
                    </ul>
                  </div>

                  <FormField control={form.control} name="smsSenderId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">SMS Sender ID</FormLabel>
                      <FormControl>
                        <Input 
                          maxLength={11} 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 font-mono"
                          placeholder="SENDORA"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Maximum 11 characters (appears as sender name)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="smsContent" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Default SMS Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 font-mono text-sm"
                          placeholder={`Hi {{customer_name}}, your receipt for {{amount}} is ready. Receipt #{{receipt_number}}. Thank you!`}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Use placeholders: {'{{customer_name}}'}, {'{{amount}}'}, {'{{receipt_number}}'}, {'{{business_name}}'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
                <CardFooter className="border-t border-green-100 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                  <Button 
                    onClick={() => saveSettings(form.getValues(['smsSenderId', 'smsContent']))}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save SMS Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Receipt Tab */}
            <TabsContent value="receipt" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="border-green-100 dark:border-green-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="border-b border-green-100 dark:border-green-900/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Receipt Customization</CardTitle>
                      <CardDescription>Personalize the thank you message that appears on your receipts.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <FormField control={form.control} name="thankYouMessage" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-sm font-semibold">Thank You Message</FormLabel>
                        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300">
                              <Sparkles className="mr-2 h-4 w-4" />
                              Browse Templates
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">Choose a Template</DialogTitle>
                              <DialogDescription>Select a pre-written message or customize your own</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              {thankYouTemplates.map((t) => (
                                <Card 
                                  key={t.name} 
                                  className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-700 transition-all group" 
                                  onClick={() => applyTemplate(t)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base font-semibold">{t.name}</CardTitle>
                                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Use This
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground italic">{t.message}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          {...field} 
                          className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          placeholder="Thank you for your business! We appreciate your support."
                        />
                      </FormControl>
                      <FormDescription className="text-xs">This message appears at the bottom of every receipt</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="border-2 border-green-200 dark:border-green-800 rounded-xl p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">Preview</h4>
                    </div>
                    <div className="border-t-2 border-dashed border-green-300 dark:border-green-700 pt-4 text-center">
                      <p className="text-sm text-muted-foreground italic">
                        {form.watch('thankYouMessage') || 'Thank you for your business!'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-green-100 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                  <Button 
                    onClick={() => saveSettings({ thankYouMessage: form.getValues('thankYouMessage') })}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  >
                    <Save className="mr-2 h-4 w-4" /> Save Receipt Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

          </form>
        </Form>
      </Tabs>
    </div>
  );
}