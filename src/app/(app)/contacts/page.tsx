'use client';
import {
  File,
  ListFilter,
  PlusCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, orderBy, query } from "firebase/firestore";
import { format } from "date-fns";

export default function ContactsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const contactsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `organizations/${user.uid}/contacts`);
    }, [firestore, user]);

    const contactsQuery = useMemoFirebase(() => {
        if (!contactsRef) return null;
        return query(contactsRef, orderBy("createdAt", "desc"));
    }, [contactsRef]);

    const { data: contacts, isLoading: isLoadingContacts } = useCollection(contactsQuery);

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
          <Button size="sm" className="h-8 gap-1">
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
            Manage your customer contacts and send bulk messages.
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContacts ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="font-medium">Loading...</div></TableCell>
                      <TableCell>...</TableCell>
                      <TableCell className="hidden md:table-cell">...</TableCell>
                      <TableCell className="hidden md:table-cell">...</TableCell>
                    </TableRow>
                  ))
              ) : contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contact.phoneNumber || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(contact.createdAt), "yyyy-MM-dd")}
                  </TableCell>
                </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No contacts found.</TableCell>
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
    </>
  )
}

    