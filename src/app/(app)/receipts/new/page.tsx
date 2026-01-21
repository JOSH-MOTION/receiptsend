"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Loader2, Save, Send } from "lucide-react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp, doc, setDoc, DocumentReference } from "firebase/firestore";
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Import the server action instead of the Genkit flow
import { sendReceiptAction, type SendReceiptInput } from '@/actions/send-receipt-action';


interface Item {
  name: string;
  quantity: number;
  price: number;
}

interface Template {
  id: string;
  name: string;
  content: string;
}

// Function to generate a unique receipt number
async function generateReceiptNumber(): Promise<string> {
    const prefix = 'RCT-';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // In a real app, you'd query Firestore for the last receipt to get the sequence.
    // For this client-side version, we'll use a random sequence for simplicity.
    const sequence = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${year}${month}${sequence}`;
}


export default function NewReceiptPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { firestore } = useFirebase();
  
  const orgRef = useMemoFirebase(() => (user ? doc(firestore, `organizations/${user.uid}`) : null), [firestore, user]);
  const { data: orgData } = useDoc(orgRef);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  
  const [items, setItems] = useState<Item[]>([
    { name: "", quantity: 1, price: 0 },
  ]);
  
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  const [thankYouMessage, setThankYouMessage] = useState("");
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  
  useEffect(() => {
    if (orgData?.thankYouMessage) {
      setThankYouMessage(orgData.thankYouMessage);
    } else {
      setThankYouMessage("Thank you for your business!");
    }
  }, [orgData]);

  const templatesQuery = useMemoFirebase(
    () => user ? collection(firestore, `organizations/${user.uid}/templates`) : null,
    [firestore, user]
  );
  const { data: templates, isLoading: isTemplatesLoading } = useCollection<Omit<Template, 'id'>>(templatesQuery);

  const handleSaveTemplate = async () => {
    if (!user || !firestore || !newTemplateName.trim() || !thankYouMessage.trim()) {
      toast({ title: "Error", description: "Template name and message cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSavingTemplate(true);
    try {
      const templatesCol = collection(firestore, `organizations/${user.uid}/templates`);
      await addDoc(templatesCol, {
        name: newTemplateName,
        content: thankYouMessage,
        type: 'receipt_thank_you',
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: `Template "${newTemplateName}" saved.` });
      setNewTemplateName("");
      setIsSaveTemplateOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not save template.", variant: "destructive" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal - discount + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !orgData) return;
    
    if (!customerName || !customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide customer name and email.",
        variant: "destructive",
      });
      return;
    }

    if (items.some(item => !item.name || item.price <= 0)) {
      toast({
        title: "Invalid Items",
        description: "Please ensure all items have a name and price.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    let newReceiptRef: DocumentReference | null = null;
    try {
      const receiptNumber = await generateReceiptNumber();
      const creationDate = new Date();
      
      const receiptData = {
        organizationId: user.uid,
        receiptNumber,
        customerName,
        customerEmail,
        customerPhoneNumber: customerPhone || null,
        items,
        discount,
        tax,
        totalAmount: total,
        thankYouMessage,
        createdAt: creationDate, // Use a concrete date for the flow
      };
      
      const receiptsCol = collection(firestore, `organizations/${user.uid}/receipts`);
      // Save with server timestamp for accurate Firestore sorting/querying
      newReceiptRef = await addDoc(receiptsCol, { ...receiptData, createdAt: serverTimestamp() });
      
      // Also create/update a contact to avoid duplicates
      const contactRef = doc(firestore, `organizations/${user.uid}/contacts`, customerEmail);
      await setDoc(contactRef, {
        organizationId: user.uid,
        name: customerName,
        email: customerEmail,
        phoneNumber: customerPhone || null,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Receipt Saved!",
        description: "Your new receipt has been saved successfully.",
        className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
      });

      // If sendEmail is checked, call the server action
      if (sendEmail) {
        toast({
            title: "Sending Email...",
            description: `Preparing to send receipt to ${customerEmail}.`,
        });

        const flowInput: SendReceiptInput = {
            receipt: { 
              ...receiptData, 
              createdAt: creationDate.toISOString() 
            },
            organization: {
                companyName: orgData.companyName,
                email: orgData.email,
                address: orgData.address,
            }
        };

        const result = await sendReceiptAction(flowInput);

        if (result.success) {
            toast({
                title: "Receipt Sent!",
                description: result.message,
                className: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900",
            });
        } else {
             toast({
                title: "Email Failed",
                description: result.message,
                variant: "destructive",
            });
        }
      }

      router.push(`/receipts/${newReceiptRef.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create receipt. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-black dark:via-slate-900 dark:to-green-950/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="hover:bg-green-100 dark:hover:bg-green-900/50">
            <Link href="/receipts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Create Receipt
            </h1>
            <p className="text-muted-foreground mt-2">Generate and send a new digital receipt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Who is this receipt for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                />
              </div>

            </CardContent>
          </Card>
          
          {/* Items */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>What was purchased?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-4 rounded-lg border border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                    <Input
                      id={`item-name-${index}`}
                      placeholder="Product or service"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label htmlFor={`item-quantity-${index}`}>Qty</Label>
                    <Input
                      id={`item-quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`item-price-${index}`}>Price</Label>
                    <Input
                      id={`item-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                      className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
          
          {/* Message & Delivery */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle>Message & Delivery</CardTitle>
              <CardDescription>Customize the thank you message and choose delivery channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thank-you-message">Thank You Message</Label>
                 <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => setThankYouMessage(value)}
                    disabled={isTemplatesLoading || !templates || templates.length === 0}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Use a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {isTemplatesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        templates && templates.map((template) => (
                          <SelectItem key={template.id} value={template.content}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Textarea
                    id="thank-you-message"
                    placeholder="e.g., Thank you for your business!"
                    value={thankYouMessage}
                    onChange={(e) => setThankYouMessage(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                    <DialogTrigger asChild>
                       <Button type="button" variant="outline" size="icon" title="Save as template">
                        <Save className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Message as Template</DialogTitle>
                        <DialogDescription>
                          Give this template a name to easily reuse it later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="e.g., Holiday Greeting"
                        />
                      </div>
                       <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
                          {isSavingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Template
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Delivery Options</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    className="border-green-500 data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                    Send receipt via email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendSMS"
                    checked={sendSMS}
                    onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                    disabled={!customerPhone}
                    className="border-green-500 data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="sendSMS" className="text-sm font-normal cursor-pointer text-muted-foreground">
                    Send receipt via SMS (Feature in development)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Calculations */}
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-green-200 dark:border-green-900 shadow-xl">
            <CardHeader>
              <CardTitle>Additional Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount ($)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax ($)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="border-green-200 dark:border-green-900 focus-visible:ring-green-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-green-200 dark:border-green-900 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>+${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-green-200 dark:border-green-900">
                  <span>Total</span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              asChild
              className="flex-1 border-green-200 dark:border-green-900"
            >
              <Link href="/receipts">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
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