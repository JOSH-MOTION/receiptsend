'use client';

import {
  File,
  PlusCircle,
  Trash2,
  MoreVertical,
  User,
  MessageSquare,
  Loader2,
  Users
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link"
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


interface Contact {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: { seconds: number; nanoseconds: number; } | Date;
}

const contactSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactsPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [bulkContactsText, setBulkContactsText] = useState("");

    const form = useForm<ContactFormValues>({
      resolver: zodResolver(contactSchema),
      defaultValues: {
        name: "",
        email: "",
        phoneNumber: "",
      },
    });

    const contactsQuery = useMemoFirebase(() => 
        user ? collection(firestore, 'organizations', user.uid, 'contacts') : null,
        [firestore, user]
    );
    const { data: contacts, isLoading } = useCollection<Omit<Contact, 'id'>>(contactsQuery);

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!contactToDelete || !user || !firestore) return;

        setIsDeleting(true);
        try {
            const contactRef = doc(firestore, 'organizations', user.uid, 'contacts', contactToDelete.id);
            await deleteDoc(contactRef);
            
            toast({
                title: 'Contact Deleted',
                description: `${contactToDelete.name} has been deleted successfully.`,
            });
        } catch (error: any) {
            console.error('Error deleting contact:', error);
            toast({
                title: 'Delete Failed',
                description: error.message || 'Failed to delete contact',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setContactToDelete(null);
        }
    };
    
    const handleAddContactSubmit = async (data: ContactFormValues) => {
        if (!user || !firestore) return;

        setIsSaving(true);
        try {
            const contactsCol = collection(firestore, 'organizations', user.uid, 'contacts');
            await addDoc(contactsCol, {
                ...data,
                organizationId: user.uid,
                createdAt: serverTimestamp(),
            });
            
            toast({
                title: 'Contact Added',
                description: `${data.name} has been added to your contacts.`,
            });
            form.reset();
            setIsAddContactOpen(false);
        } catch (error: any) {
            console.error('Error adding contact:', error);
            toast({
                title: 'Add Failed',
                description: error.message || 'Failed to add contact',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formatPhoneNumber = (phone: string): string | null => {
        if (!phone) return null;
        let cleaned = phone.replace(/\D/g, ''); // remove non-digits
        
        // e.g. 0241234567 -> +233241234567
        if (cleaned.startsWith('0') && cleaned.length === 10) {
          return `+233${cleaned.substring(1)}`;
        }
        // e.g. 233241234567 -> +233241234567
        if (cleaned.startsWith('233') && cleaned.length === 12) {
          return `+${cleaned}`;
        }
        // e.g. +233241234567 is already good
        if (cleaned.startsWith('233') && cleaned.length === 12) {
          return `+${cleaned}`;
        }
        return null; // Invalid format
    }

    const handleBulkImport = async () => {
        if (!user || !firestore || !bulkContactsText.trim()) return;

        setIsImporting(true);
        
        const lines = bulkContactsText.split('\n').filter(line => line.trim() !== '');
        let successCount = 0;
        let errorCount = 0;

        try {
            const batch = writeBatch(firestore);
            const contactsCol = collection(firestore, 'organizations', user.uid, 'contacts');

            for (const line of lines) {
                const parts = line.split(',').map(p => p.trim()).filter(p => p);
                let name: string | undefined;
                let phone: string | undefined;

                if (parts.length >= 2) {
                    name = parts[0];
                    phone = parts[1];
                } else if (parts.length === 1) {
                    phone = parts[0];
                    name = parts[0]; // Use phone as name if only phone is provided
                }

                const formattedPhone = phone ? formatPhoneNumber(phone) : null;

                if (name && formattedPhone) {
                    const newContactRef = doc(contactsCol); // Creates a ref with a new unique ID
                    batch.set(newContactRef, {
                        name,
                        phoneNumber: formattedPhone,
                        email: null,
                        organizationId: user.uid,
                        createdAt: serverTimestamp(),
                    });
                    successCount++;
                } else {
                    errorCount++;
                }
            }
            
            if (successCount > 0) {
              await batch.commit();
            }

            toast({
              title: 'Import Complete',
              description: `${successCount} contacts imported successfully. ${errorCount} lines had errors.`,
            });
            
            setBulkContactsText("");
            setIsAddContactOpen(false);

        } catch (error: any) {
            console.error('Error bulk importing contacts:', error);
            toast({
                title: 'Import Failed',
                description: error.message || 'An error occurred during the bulk import.',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };


    const formatTimestamp = (ts: any) => {
      if (!ts) return '...';
      if (ts.seconds) {
        return format(new Date(ts.seconds * 1000), "yyyy-MM-dd");
      }
      return format(ts, "yyyy-MM-dd");
    }

  return (
    <>
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
              <BreadcrumbPage>Contacts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 gap-1">
            <Link href="/contacts/bulk-sms">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Bulk SMS
              </span>
            </Link>
          </Button>
           <Button size="sm" variant="outline" className="h-8 gap-1" disabled>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Contact
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Contacts</DialogTitle>
                <DialogDescription>
                    Add a single contact manually or paste a list to import in bulk.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddContactSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                            <FormLabel>Email Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" {...field} />
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
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+233 24 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsAddContactOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Contact
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value="bulk">
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="bulk-contacts">Contact List</Label>
                          <Textarea
                              id="bulk-contacts"
                              placeholder="Paste your list here. One contact per line.&#10;e.g.: Jane Doe, 0241234567&#10;e.g.: 0557654321"
                              rows={8}
                              value={bulkContactsText}
                              onChange={(e) => setBulkContactsText(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                              Use <strong>Name, Phone Number</strong> or just <strong>Phone Number</strong> on each line.
                          </p>
                      </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsAddContactOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkImport} disabled={isImporting}>
                            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Contacts
                        </Button>
                    </DialogFooter>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Manage your customer contacts. Contacts are automatically created when you create receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">
                  Phone Number
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Created At
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="font-medium">Loading...</div></TableCell>
                      <TableCell>...</TableCell>
                      <TableCell className="hidden md:table-cell">...</TableCell>
                      <TableCell className="hidden md:table-cell">...</TableCell>
                      <TableCell className="text-right">...</TableCell>
                    </TableRow>
                  ))
              ) : contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contact.phoneNumber || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatTimestamp(contact.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <button className="flex items-center gap-2 w-full" disabled>
                            <User className="h-4 w-4" />
                            View Details
                          </button>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(contact)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-secondary">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">No contacts found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Contacts are automatically created when you create receipts.
                          </p>
                        </div>
                        <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                          <Link href="/receipts/new">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Receipt
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{contacts?.length || 0}</strong> of <strong>{contacts?.length || 0}</strong> contacts
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contactToDelete?.name}</strong> ({contactToDelete?.email})? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
