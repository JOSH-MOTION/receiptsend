"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { AlertTriangle, PlusCircle, Rocket, Trash2, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const receiptSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerPhoneNumber: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, "Item name required"),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0.01),
    })
  ).min(1, "Add at least one item"),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(10),
  thankYouMessage: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

function ReceiptPreview({ data, receiptNumber }: { data: Partial<ReceiptFormValues>; receiptNumber: string }) {
  const { items = [], discount = 0, tax = 10 } = data;

  const subtotal = items.reduce((sum, item) => sum + (item.quantity ?? 0) * (item.price ?? 0), 0);
  const discountAmount = subtotal * discount / 100;
  const taxAmount = (subtotal - discountAmount) * tax / 100;
  const total = subtotal - discountAmount + taxAmount;

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-blue-50/50 dark:from-black dark:to-slate-900 border border-white/30">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8" />
          <div>
            <h3 className="text-2xl font-bold">ReceiptRocket</h3>
            <p className="text-blue-100">Receipt #{receiptNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <h4 className="font-semibold text-lg mb-3 text-foreground">Billed To</h4>
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">{data.customerName || "Customer Name"}</p>
            {data.customerEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {data.customerEmail}</p>}
            {data.customerPhoneNumber && <p className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> {data.customerPhoneNumber}</p>}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-lg mb-4">Items</h4>
          <div className="space-y-4">
            {items.length > 0 ? items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.name || "Item Name"}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ${Number(item.price).toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">${(item.quantity! * item.price!).toFixed(2)}</p>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No items added yet</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between"><span>Subtotal</span> <span>${subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discount}%)</span> <span>-${discountAmount.toFixed(2)}</span></div>}
          {tax > 0 && <div className="flex justify-between"><span>Tax ({tax}%)</span> <span>${taxAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-xl font-bold pt-3 border-t">
            <span>Total</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-center pt-6 italic text-muted-foreground">
          {data.thankYouMessage || "Thank you for your business!"}
        </div>
      </div>
    </div>
  );
}

export default function NewReceiptPage() {
  const { toast } = useToast();
  const router = useRouter();
  const receiptNumber = `RCPT-${Date.now()}`;
  const [orgSettings, setOrgSettings] = useState<{ smsSenderId?: string; thankYouMessage?: string } | null>(null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhoneNumber: "",
      items: [{ name: "", quantity: 1, price: 0 }],
      discount: 0,
      tax: 10,
      thankYouMessage: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watched = form.watch();
  const showSmsWarning = !!watched.customerPhoneNumber && orgSettings && !orgSettings.smsSenderId;

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/organization');
        if (res.ok) {
          const data = await res.json();
          setOrgSettings(data);
          if (data.thankYouMessage) {
            form.setValue('thankYouMessage', data.thankYouMessage);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, [form]);

  const onSubmit = async (data: ReceiptFormValues) => {
    if (showSmsWarning) {
      toast({
        title: "SMS Not Configured",
        description: "Set your SMS Sender ID in settings to send via text.",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = data.items.reduce((s, i) => s + i.quantity * i.price, 0);
      const total = subtotal * (1 - data.discount / 100) * (1 + data.tax / 100);

      const payload = {
        ...data,
        receiptNumber,
        totalAmount: total,
        thankYouMessage: data.thankYouMessage || orgSettings?.thankYouMessage || "Thank you for your business!",
      };

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success!", description: "Receipt created and sent." });
        router.push("/receipts");
      } else {
        throw new Error("Failed to create receipt");
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-black dark:via-slate-900 dark:to-purple-950/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><Link href="/receipts" className="hover:text-foreground">Receipts</Link></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Create New</BreadcrumbPage></BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Receipt
                </h1>
                <p className="text-muted-foreground mt-2">Fill in details and send a beautiful digital receipt instantly.</p>
              </div>
            </div>

            {/* SMS Warning */}
            {showSmsWarning && (
              <Alert variant="destructive" className="backdrop-blur-md border-red-500/50">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>SMS Sender ID Missing</AlertTitle>
                <AlertDescription>
                  You entered a phone number but haven't configured SMS.{" "}
                  <Link href="/settings" className="underline font-semibold">Go to Settings</Link> to set it up.
                </AlertDescription>
              </Alert>
            )}

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-8">

                {/* Customer Details */}
                <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Customer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" className="h-12 text-lg" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <FormField control={form.control} name="customerEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="john@example.com" className="h-12" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="customerPhoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="+1 555 000 1234" className="h-12" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Items */}
                <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Items & Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, i) => (
                          <TableRow key={field.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition">
                            <TableCell>
                              <FormField control={form.control} name={`items.${i}.name`} render={({ field }) => (
                                <FormItem><FormControl><Input placeholder="e.g. Website Design" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </TableCell>
                            <TableCell className="text-center">
                              <FormField control={form.control} name={`items.${i}.quantity`} render={({ field }) => (
                                <FormItem><FormControl><Input type="number" className="w-20 text-center" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </TableCell>
                            <TableCell className="text-right">
                              <FormField control={form.control} name={`items.${i}.price`} render={({ field }) => (
                                <FormItem><FormControl><Input type="number" step="0.01" className="w-28 text-right" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(Number(watched.items?.[i]?.quantity ?? 0) * Number(watched.items?.[i]?.price ?? 0)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                                <Trash2 className="h-5 w-5 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button type="button" variant="outline" className="mt-6" onClick={() => append({ name: "", quantity: 1, price: 0 })}>
                      <PlusCircle className="h-5 w-5 mr-2" /> Add Item
                    </Button>
                  </CardContent>
                </Card>

                {/* Summary & Message */}
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-2xl">
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent className="grid gap-6">
                      <FormField control={form.control} name="discount" render={({ field }) => (
                        <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="tax" render={({ field }) => (
                        <FormItem><FormLabel>Tax (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-2xl">
                    <CardHeader><CardTitle>Thank You Message</CardTitle></CardHeader>
                    <CardContent>
                      <FormField control={form.control} name="thankYouMessage" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea rows={4} placeholder={orgSettings?.thankYouMessage || "Thank you for your business!"} {...field} />
                          </FormControl>
                          <FormDescription>Leave blank to use default</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sticky Preview */}
              <div className="lg:sticky lg:top-8 h-fit">
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-black/30 border-white/20 shadow-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-2xl">Live Preview</CardTitle>
                    <CardDescription>How your receipt will look</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6 bg-gradient-to-b from-transparent to-white/50 dark:to-black/50">
                      <ReceiptPreview data={watched} receiptNumber={receiptNumber} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Fixed Bottom Bar - Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t md:hidden flex gap-4 justify-center">
              <Button variant="outline" size="lg" onClick={() => router.push("/receipts")}>Cancel</Button>
              <Button size="lg" type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                Send Receipt
              </Button>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex justify-end gap-4 pt-8">
              <Button variant="outline" size="lg" onClick={() => router.push("/receipts")}>Cancel</Button>
              <Button size="lg" type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl px-8">
                Send Receipt
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}