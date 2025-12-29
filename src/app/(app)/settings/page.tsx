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
import { Sparkles, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useEffect, useState } from 'react';

const orgSettingsSchema = z.object({
  companyName: z.string().min(1, "Organization name is required"),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  smsContent: z.string().optional(),
  smsBalance: z.number().optional(),
});

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

const smsBundles = [
    { credits: 100, price: 5, description: "Basic starter pack" },
    { credits: 500, price: 22, description: "Most popular choice" },
    { credits: 1000, price: 40, description: "Best value for frequent senders" },
    { credits: 5000, price: 180, description: "For power users and large campaigns" },
]

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const companyLogo = PlaceHolderImages.find((p) => p.id === "company-logo");
  const [orgData, setOrgData] = useState<OrgSettingsFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

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
    },
  });

  useEffect(() => {
    if (session) {
      fetchOrganization();
    }
  }, [session]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization');
      if (response.ok) {
        const data = await response.json();
        setOrgData(data);
        form.reset(data);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
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
        const updatedData = await response.json();
        setOrgData(updatedData);
        form.reset(updatedData);
        toast({
          title: "Settings Saved",
          description: "Your organization's settings have been updated.",
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleSimulatedPurchase = async (credits: number) => {
    const currentBalance = orgData?.smsBalance || 0;
    const newBalance = currentBalance + credits;

    try {
       const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsBalance: newBalance }),
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        setOrgData(updatedData);
        form.setValue('smsBalance', newBalance);
        toast({
          title: "Purchase Successful!",
          description: `${credits} SMS credits have been added to your account.`,
        });
        setIsBuyModalOpen(false);
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update balance. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (isLoading || status === 'loading') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="ml-auto">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-10 w-full md:w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center gap-4">
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
            <div className="ml-auto">
              <Button type="submit">Save Changes</Button>
            </div>
          </div>
          <Tabs defaultValue="profile" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Profile</CardTitle>
                  <CardDescription>
                    Update your company's profile information.
                  </CardDescription>
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

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Customize your receipts with your company's branding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Logo</FormLabel>
                           <div className="flex items-center gap-4">
                            <Image
                              alt="Company logo"
                              className="aspect-square rounded-md object-cover"
                              height="64"
                              src={field.value || companyLogo?.imageUrl || "https://picsum.photos/seed/logo/64/64"}
                              width="64"
                              data-ai-hint={companyLogo?.imageHint}
                            />
                             <Card className="flex-1">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-primary cursor-pointer">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 800x400px)</p>
                                </CardContent>
                              </Card>
                           </div>
                           <FormDescription>For now, please paste a URL to your logo.</FormDescription>
                           <FormControl>
                             <Input placeholder="https://your-logo-url.com/logo.png" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>
                    Customize the emails sent to your customers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            placeholder="Hi {{customer_name}},

Thank you for your purchase. Please find your receipt attached.

Best,
The {{business_name}} Team"
                            {...field}
                          />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <p className="text-sm text-muted-foreground">
                    Available placeholders: {`{{customer_name}}`}, {`{{amount}}`}, {`{{receipt_number}}`}, {`{{business_name}}`}.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Settings</CardTitle>
                  <CardDescription>
                    Manage your SMS credits and default message.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            This message is sent when a receipt is created. You can customize it using placeholders.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <p className="text-sm text-muted-foreground">
                    Available placeholders: {`{{customer_name}}`}, {`{{amount}}`}, {`{{receipt_number}}`}, {`{{business_name}}`}.
                  </p>
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold">SMS Credits</h4>
                    <p className="text-sm text-muted-foreground">
                        You have <span className="font-bold">{form.watch('smsBalance') || 0}</span> SMS credits remaining.
                    </p>
                     <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="mt-2">
                                Buy More Credits
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Buy SMS Credits</DialogTitle>
                                <DialogDescription>
                                    Select a bundle to top up your SMS balance. The purchase will be added to your next invoice.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                               {smsBundles.map((bundle) => (
                                <Card key={bundle.credits} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{bundle.credits.toLocaleString()} Credits</CardTitle>
                                        <CardDescription>{bundle.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-3xl font-bold">${bundle.price}</p>
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
    </>
  );
}

    