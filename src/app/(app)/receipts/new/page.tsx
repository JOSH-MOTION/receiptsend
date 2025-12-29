
"use client";

import { useState } from "react";
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
  CardFooter,
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
} from "@/components/ui/form";
import Link from "next/link";
import { PlusCircle, Rocket, Trash2, Wand2 } from "lucide-react";
import { enhanceReceiptLayout } from "@/ai/flows/receipt-layout-enhancement";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { useRouter } from "next/navigation";

const receiptSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1, "Item or service name is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    price: z.coerce.number().min(0.01, "Price is required"),
  })).min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

function ReceiptPreview({ receiptData, receiptNumber }: { receiptData: Partial<ReceiptFormValues>, receiptNumber: string }) {
  const { items = [], discount = 0, tax = 0 } = receiptData;
  const subtotal = items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  const discountAmount = (subtotal * (discount || 0)) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * (tax || 0)) / 100;
  const total = subtotalAfterDiscount + taxAmount;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            <Rocket className="h-6 w-6" />
            <span>Acme Inc.</span>
          </CardTitle>
          <CardDescription>Receipt Number: {receiptNumber}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Receipt Details</div>
          <ul className="grid gap-3">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span>{receiptData.customerName || "-"}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{receiptData.customerEmail || "-"}</span>
            </li>
          </ul>
          <Separator className="my-2" />
          <div className="font-semibold mb-2">Items / Services</div>
          <ul className="grid gap-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {item.name || "Item / Service"} ({item.quantity || 0} x ${item.price?.toFixed(2) || "0.00"})
                </span>
                <span>${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>${subtotal.toFixed(2)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Discount ({discount}%)</dt>
                <dd>-${discountAmount.toFixed(2)}</dd>
              </div>
            )}
            {tax > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tax ({tax}%)</dt>
                <dd>${taxAmount.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold">
              <dt>Total</dt>
              <dd>${total.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Thank you for your business!
        </div>
      </CardFooter>
    </Card>
  );
}

export default function NewReceiptPage() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ enhancedLayout: string; suggestions: string[] } | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const receiptNumber = `RCPT-${Date.now()}`;

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      items: [{ name: "", quantity: 1, price: 0 }],
      discount: 0,
      tax: 10,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedValues = form.watch();
  
  const handleEnhanceWithAI = async () => {
    setIsAiDialogOpen(true);
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
      const currentLayoutHtml = document.getElementById("receipt-preview-content")?.innerHTML || "";
      const result = await enhanceReceiptLayout({
        currentLayout: currentLayoutHtml,
        priorLayouts: [],
        emailCopy: "Thank you for your purchase! Your receipt is attached.",
        smsWording: "Hi {{customer_name}}, thanks for your purchase of {{amount}} from {{business_name}}. Your receipt is {{receipt_number}}.",
        companyBranding: "Company: Acme Inc., Colors: Blue (#2962FF) and Teal (#26A69A)",
      });
      setAiSuggestions(result);
    } catch (error) {
      console.error("AI enhancement failed:", error);
      toast({
        title: "AI Enhancement Failed",
        description: "Could not get suggestions from AI. Please try again.",
        variant: "destructive",
      });
      setIsAiDialogOpen(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = (data: ReceiptFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a receipt.",
        variant: "destructive",
      });
      return;
    }

    const { items = [], discount = 0, tax = 0 } = data;
    const subtotal = items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const discountAmount = (subtotal * (discount || 0)) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * (tax || 0)) / 100;
    const total = subtotalAfterDiscount + taxAmount;

    const receiptData = {
      ...data,
      id: receiptNumber,
      receiptNumber: receiptNumber,
      organizationId: user.uid,
      totalAmount: total,
      createdAt: new Date().toISOString(),
      pdfUrl: "" // This will be updated later
    };

    const receiptsColRef = collection(firestore, `organizations/${user.uid}/receipts`);
    addDocumentNonBlocking(receiptsColRef, receiptData);

    toast({
      title: "Receipt Created",
      description: "The new receipt has been saved and is being sent.",
    });

    router.push("/receipts");
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
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
                  <BreadcrumbLink asChild>
                    <Link href="/receipts">Receipts</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              <Button variant="outline" size="sm" type="button" onClick={() => router.push('/receipts')}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Send Receipt</Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 555 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item / Service</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead className="w-[100px] text-right">Price</TableHead>
                        <TableHead className="w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="e.g. Portrait Session" {...field} />
                                  </FormControl>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                             <FormField
                              control={form.control}
                              name={`items.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" className="text-right" {...field} />
                                  </FormControl>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            ${((watchedValues.items?.[index]?.quantity || 0) * (watchedValues.items?.[index]?.price || 0)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ name: "", quantity: 1, price: 0 })}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Item / Service
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Preview</CardTitle>
                </CardHeader>
                <CardContent id="receipt-preview-content">
                  <ReceiptPreview receiptData={watchedValues} receiptNumber={receiptNumber} />
                </CardContent>
                <CardFooter>
                  <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" onClick={handleEnhanceWithAI}>
                        <Wand2 className="h-4 w-4 mr-2" /> Enhance with AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>AI Suggestions</DialogTitle>
                        <DialogDescription>
                          Here are some AI-powered suggestions to improve your receipt layout.
                        </DialogDescription>
                      </DialogHeader>
                      {isAiLoading && <div className="py-8 text-center flex flex-col items-center gap-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        </div>}
                      {aiSuggestions && (
                        <div className="grid gap-4 py-4">
                          <div className="p-4 border rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Enhanced Layout Preview</h4>
                            <div dangerouslySetInnerHTML={{ __html: aiSuggestions.enhancedLayout }} />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Suggestions</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {aiSuggestions.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                          <Button>Apply Suggestions</Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push('/receipts')}>
              Cancel
            </Button>
            <Button type="submit" size="sm">Send Receipt</Button>
          </div>
        </form>
      </Form>
    </>
    