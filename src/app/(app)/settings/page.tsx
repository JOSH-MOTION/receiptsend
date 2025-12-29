
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirestore, useUser, useDoc, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";

const orgSettingsSchema = z.object({
  companyName: z.string().min(1, "Organization name is required"),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  emailFromName: z.string().optional(),
  emailReplyTo: z.string().email().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  smsContent: z.string().optional(),
  // We remove these from the user-facing form. They will only be on the admin's org document.
  smsApiKey: z.string().optional(),
  smsSenderId: z.string().optional(),
});

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const companyLogo = PlaceHolderImages.find((p) => p.id === "company-logo");

  const orgRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `organizations/${user.uid}`);
  }, [firestore, user]);

  const { data: orgData, isLoading: isOrgDataLoading } = useDoc<OrgSettingsFormValues>(orgRef);

  const form = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phoneNumber: "",
      address: "",
      logoUrl: "",
      primaryColor: "#2962FF",
      accentColor: "#26A69A",
      emailFromName: "",
      emailReplyTo: "",
      emailSubject: "",
      emailBody: "",
      smsContent: "",
    }
  });

  useEffect(() => {
    if (orgData) {
      // We don't want to show the API key or sender ID even if they exist on the doc
      const { smsApiKey, smsSenderId, ...formData } = orgData;
      form.reset(formData);
    }
  }, [orgData, form]);

  const onSubmit = (data: OrgSettingsFormValues) => {
    if (!orgRef) return;
    updateDocumentNonBlocking(orgRef, data);
    toast({
      title: "Settings Saved",
      description: "Your organization's settings have been updated.",
    });
  };

  const isLoading = isUserLoading || isOrgDataLoading;

  if (isLoading) {
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
                             <FormControl>
                                <Card className="flex-1">
                                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-semibold text-primary cursor-pointer">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 800x400px)</p>
                                  </CardContent>
                                </Card>
                              </FormControl>
                           </div>
                           <FormDescription>For now, please paste a URL to your logo.</FormDescription>
                           <FormControl>
                             <Input placeholder="https://your-logo-url.com/logo.png" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} className="h-10 p-1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} className="h-10 p-1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                    name="emailFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailReplyTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reply-To Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="support@acme.inc" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            placeholder="Hi {{customer_name}},\n\nThank you for your purchase. Please find your receipt attached.\n\nBest,\nThe {{business_name}} Team"
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
                    Customize the default SMS message sent to your customers.
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
                        You have <span className="font-bold">0</span> SMS credits remaining.
                    </p>
                    <Button variant="outline" className="mt-2" disabled>Buy More Credits</Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        This feature is coming soon.
                    </p>
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
