'use client';

import {
  File,
  PlusCircle,
  Trash2,
  MoreVertical,
  User,
  MessageSquare,
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
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: { seconds: number; nanoseconds: number; } | Date;
}

export default function ContactsPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                <TableRow key={contact.id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
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
                          <User className="h-8 w-8 text-primary" />
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
