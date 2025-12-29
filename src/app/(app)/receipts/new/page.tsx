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
import { PlusCircle, Rocket, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const receiptSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  customerPhoneNumber: z.string().optional(),

  items: z.array(
    z.object({
      name: z.string().min(1, "Item or service name is required"),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
      price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    })
  ).min(1, "At least one item is required"),

  discount: z.coerce.number().min(0).optional().default(0),
  tax: z.coerce.number().min(0).optional().default(10),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

function ReceiptPreview({ receiptData, receiptNumber }: { receiptData: Partial<ReceiptFormValues>, receiptNumber: string }) {
  const { items = [], discount = 0, tax = 0 } = receiptData;

  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.price ?? 0);
    return acc + qty * price;
  }, 0);

  const discountAmount = (subtotal * Number(discount)) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * Number(tax)) / 100;
  const total = subtotalAfterDiscount + taxAmount;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            <Rocket className="h-6 w-6" />
            <span>ReceiptRocket</span>
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
                  {item.name || "Item / Service"} (
                  {Number(item.quantity ?? 0)} x ${Number(item.price ?? 0).toFixed(2)}
                  )
                </span>
                <span>
                  ${(Number(item.quantity ?? 0) * Number(item.price ?? 0)).toFixed(2)}
                </span>
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
  const { toast } = useToast();
  const router = useRouter();
  const receiptNumber = `RCPT-${Date.now()}`;

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhoneNumber: "",
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

  const onSubmit = async (data: ReceiptFormValues) => {
    try {
      const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const discountAmount = (subtotal * data.discount) / 100;
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxAmount = (subtotalAfterDiscount * data.tax) / 100;
      const total = subtotalAfterDiscount + taxAmount;

      const receiptData = {
        ...data,
        receiptNumber,
        totalAmount: total,
      };

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        toast({
          title: "Receipt Created",
          description: "The new receipt has been saved and sent.",
        });
        router.push("/receipts");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create receipt");
      }
    } catch (error: any) {
      console.error("Error creating receipt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create receipt",
        variant: "destructive",
      });
    }
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
              <Button variant="outline" size="sm" type="button" onClick={() => router.push("/receipts")}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Send Receipt</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              {/* Customer Details */}
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
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 555 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Items Table */}
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
                                  <FormMessage />
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
                                    <Input type="number" min="1" step="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
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
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="text-right"
                                      placeholder="0.00"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            ${(
                              Number(watchedValues.items?.[index]?.quantity ?? 0) *
                              Number(watchedValues.items?.[index]?.price ?? 0)
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ name: "", quantity: 1, price: 0 })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Item / Service
                  </Button>
                </CardContent>
              </Card>

              {/* Summary */}
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
                          <Input type="number" min="0" step="0.01" {...field} />
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
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Preview Sidebar */}
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReceiptPreview receiptData={watchedValues} receiptNumber={receiptNumber} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push("/receipts")}>
              Cancel
            </Button>
            <Button type="submit" size="sm">Send Receipt</Button>
          </div>
        </form>
      </Form>
    </>
  );
}