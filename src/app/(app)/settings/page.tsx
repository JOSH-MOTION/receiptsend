"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Send, Mail, Smartphone } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhoneNumber: "",
    items: [{ name: "", quantity: 1, price: 0 }] as ReceiptItem[],
    discount: 0,
    tax: 0,
    notes: "",
  });
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * formData.discount) / 100;
    const taxAmount = ((subtotal - discountAmount) * formData.tax) / 100;
    return subtotal - discountAmount + taxAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalAmount: calculateTotal(),
          sendEmail,
          sendSMS,
        }),
      });

      if (response.ok) {
        router.push("/receipts");
      } else {
        alert("Failed to create receipt");
      }
    } catch (error) {
      console.error("Error creating receipt:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-4 hover:bg-green-100 dark:hover:bg-green-900/30 -ml-2"
            >
              <Link href="/receipts" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Receipts
              </Link>
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Create New Receipt
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Generate and send digital receipts to your customers
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Customer Information</CardTitle>
              <CardDescription className="text-sm">Enter the customer's contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number (with country code)</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.customerPhoneNumber}
                  onChange={(e) => setFormData({ ...formData, customerPhoneNumber: e.target.value })}
                  className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                />
              </div>

              {/* Delivery Method - Stack on Mobile */}
              <div className="space-y-3 pt-4 border-t border-green-200 dark:border-green-900">
                <Label className="text-sm font-semibold">Delivery Method</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendEmail"
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                      disabled={!formData.customerEmail}
                      className="border-green-600 data-[state=checked]:bg-green-600"
                    />
                    <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer text-sm">
                      <Mail className="h-4 w-4 text-green-600" />
                      Send via Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendSMS"
                      checked={sendSMS}
                      onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                      disabled={!formData.customerPhoneNumber}
                      className="border-emerald-600 data-[state=checked]:bg-emerald-600"
                    />
                    <Label htmlFor="sendSMS" className="flex items-center gap-2 cursor-pointer text-sm">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      Send via SMS
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  At least one delivery method must be selected and have a valid recipient
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Items */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Receipt Items</CardTitle>
                  <CardDescription className="text-sm">Add items or services to the receipt</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="w-full sm:w-auto border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-950/20 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Item Name - Full Width on Mobile */}
                    <div className="flex-1 space-y-2 w-full">
                      <Label htmlFor={`item-name-${index}`} className="text-sm">Item Name *</Label>
                      <Input
                        id={`item-name-${index}`}
                        placeholder="Product or service name"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        required
                        className="border-green-200 dark:border-green-900"
                      />
                    </div>

                    {/* Quantity - Stack on Mobile */}
                    <div className="space-y-2 w-full sm:w-24">
                      <Label htmlFor={`item-qty-${index}`} className="text-sm">Qty *</Label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        required
                        className="border-green-200 dark:border-green-900"
                      />
                    </div>

                    {/* Price - Stack on Mobile */}
                    <div className="space-y-2 w-full sm:w-32">
                      <Label htmlFor={`item-price-${index}`} className="text-sm">Price ($) *</Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                        required
                        className="border-green-200 dark:border-green-900"
                      />
                    </div>

                    {/* Subtotal and Delete - Stack on Mobile */}
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2 w-full sm:w-auto pt-0 sm:pt-7">
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                        ${(item.quantity * item.price).toFixed(2)}
                      </div>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Calculations */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Adjustments</CardTitle>
              <CardDescription className="text-sm">Apply discounts and taxes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discount and Tax - Stack on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="border-green-200 dark:border-green-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    className="border-green-200 dark:border-green-900"
                  />
                </div>
              </div>

              {/* Summary - Responsive Text */}
              <div className="space-y-3 pt-4 border-t border-green-200 dark:border-green-900">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({formData.discount}%)</span>
                    <span className="font-medium text-red-600">
                      -${((calculateSubtotal() * formData.discount) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({formData.tax}%)</span>
                    <span className="font-medium">
                      +${(((calculateSubtotal() - (calculateSubtotal() * formData.discount) / 100) * formData.tax) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg font-bold pt-3 border-t border-green-200 dark:border-green-900">
                  <span>Total</span>
                  <span className="text-green-600 dark:text-green-400 text-xl sm:text-2xl">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Additional Notes</CardTitle>
              <CardDescription className="text-sm">Optional message or special instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes or terms..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-24 border-green-200 dark:border-green-900 focus-visible:ring-green-500"
              />
            </CardContent>
          </Card>

          {/* Submit Buttons - Full Width on Mobile */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:flex-1 border-green-200 dark:border-green-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!sendEmail && !sendSMS)}
              className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            >
              {isSubmitting ? (
                <>Creating Receipt...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create & Send Receipt
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}