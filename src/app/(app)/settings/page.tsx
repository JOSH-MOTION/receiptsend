'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect, useState } from 'react';

const orgSettingsSchema = z.object({
  companyName: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  smsContent: z.string().optional(),
  smsBalance: z.number().optional(),
  smsSenderId: z.string().max(11, 'Sender ID cannot be more than 11 characters').optional(),
});

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

const smsBundles = [
  { credits: 100, price: 5, description: 'Basic starter pack' },
  { credits: 500, price: 22, description: 'Most popular choice' },
  { credits: 1000, price: 40, description: 'Best value for frequent senders' },
  { credits: 5000, price: 180, description: 'For power users and large campaigns' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const companyLogo = PlaceHolderImages.find((p) => p.id === 'company-logo');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phoneNumber: '',
      address: '',
      logoUrl: '',
      emailSubject: '',
      emailBody: '',
      smsContent: '',
      smsBalance: 0,
      smsSenderId: '',
    },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrganization();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization');
      if (response.ok) {
        const data = await response.json();

        const safeData: OrgSettingsFormValues = {
          companyName: data.companyName ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
          address: data.address ?? '',
          logoUrl: data.logoUrl ?? '',
          emailSubject: data.emailSubject ?? '',
          emailBody: data.emailBody ?? '',
          smsContent: data.smsContent ?? '',
          smsBalance: data.smsBalance ?? 0,
          smsSenderId: data.smsSenderId ?? '',
        };

        form.reset(safeData);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: OrgSettingsFormValues) => {
    try {
      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: "Your organization's settings have been updated.",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  const handleSimulatedPurchase = async (credits: number) => {
    const currentBalance = form.getValues('smsBalance') ?? 0;
    const newBalance = currentBalance + credits;

    try {
      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsBalance: newBalance }),
      });

      if (response.ok) {
        form.setValue('smsBalance', newBalance);
        toast({
          title: 'Purchase Successful!',
          description: `${credits} SMS credits have been added to your account.`,
        });
        setIsBuyModalOpen(false);
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update balance. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

          <Button type="submit">Save Changes</Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>Update your company's profile information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@acme.inc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 800 555 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Acme St, San Francisco, CA 94107" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize your receipts with your company's branding.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <div className="flex items-center gap-6">
                        <Image
                          alt="Company logo"
                          className="aspect-square rounded-md object-cover border"
                          height={80}
                          width={80}
                          src={field.value || companyLogo?.imageUrl || 'https://picsum.photos/seed/logo/80/80'}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 800x400px)</p>
                          </div>
                          <FormDescription>
                            For now, paste a direct URL to your logo image.
                          </FormDescription>
                          <FormControl>
                            <Input placeholder="https://your-logo-url.com/logo.png" {...field} />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Customize the emails sent to your customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="emailSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Your receipt from {{business_name}}" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={8}
                          placeholder={`Hi {{customer_name}},

Thank you for your purchase. Please find your receipt attached.

Best,
The {{business_name}} Team`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-sm text-muted-foreground">
                  Available placeholders:{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{customer_name}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{amount}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{receipt_number}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{business_name}}'}
                  </span>
                  .
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle>SMS Settings</CardTitle>
                <CardDescription>Manage your SMS credits and default message.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="smsSenderId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>SMS Sender ID</FormLabel>
                        <FormControl>
                            <Input maxLength={11} placeholder="MyBusiness" {...field} />
                        </FormControl>
                        <FormDescription>
                            Max 11 characters. This is the name your customers will see.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="smsContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default SMS Content</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder="Thanks for your purchase, {{customer_name}}! Your receipt from {{business_name}} for {{amount}} is #{{receipt_number}}."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message is sent when a receipt is created. Use placeholders to personalize it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-sm text-muted-foreground">
                  Available placeholders:{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{customer_name}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{amount}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{receipt_number}}'}
                  </span>
                  ,{' '}
                  <span className="inline-block bg-muted px-2 py-1 rounded text-xs font-mono">
                    {'{{business_name}}'}
                  </span>
                  .
                </p>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-2">SMS Credits</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have <span className="font-bold text-lg">{form.watch('smsBalance') ?? 0}</span> SMS credits remaining.
                  </p>

                  <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Buy More Credits</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Buy SMS Credits</DialogTitle>
                        <DialogDescription>
                          Select a bundle to top up your SMS balance. The purchase will be added to your next invoice.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {smsBundles.map((bundle) => (
                          <Card key={bundle.credits} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <CardTitle className="text-2xl">{bundle.credits.toLocaleString()} Credits</CardTitle>
                              <CardDescription>{bundle.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <p className="text-4xl font-bold">${bundle.price}</p>
                            </CardContent>
                            <CardFooter>
                              <Button className="w-full" onClick={() => handleSimulatedPurchase(bundle.credits)}>
                                Buy Now
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                      <DialogFooter>
                        <p className="text-xs text-muted-foreground">
                          For now, this is a simulated purchase. No real payment will be processed.
                        </p>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
