'use client';

import {
  File,
  MessageSquare,
  PlusCircle,
  Trash2,
  MoreVertical,
  User,
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
import Link from "next/link"
import { useSession } from 'next-auth/react';
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
}

export default function ContactsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (session) {
            fetchContacts();
        }
    }, [session]);

    const fetchContacts = async () => {
        try {
            const response = await fetch('/api/contacts');
            if (response.ok) {
                const data = await response.json();
                setContacts(data);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load contacts',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            toast({
                title: 'Error',
                description: 'Failed to load contacts',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!contactToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/contacts?id=${contactToDelete._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const result = await response.json();
                setContacts(contacts.filter((c) => c._id !== contactToDelete._id));
                toast({
                    title: 'Contact Deleted',
                    description: `${result.contactName} has been deleted successfully.`,
                });
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete contact');
            }
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
           <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" asChild>
            <Link href="/contacts/bulk-sms">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Bulk Message
              </span>
            </Link>
          </Button>
          <Button size="sm" className="h-8 gap-1" disabled>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Contact
            </span>
          </Button>
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
                <TableRow key={contact._id} className="hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contact.phoneNumber || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(contact.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/50">
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
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                          <User className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">No contacts found</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Contacts are automatically created when you create receipts.
                          </p>
                        </div>
                        <Button asChild className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
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
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}