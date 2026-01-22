'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Send, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from '@/components/ui/skeleton';

interface Contact {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export default function BulkSmsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const contactsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'organizations', user.uid, 'contacts') : null),
    [firestore, user]
  );
  const { data: contacts, isLoading } = useCollection<Omit<Contact, 'id'>>(contactsQuery);

  const phoneContacts = contacts?.filter(c => c.phoneNumber) || [];

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedContacts(phoneContacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSend = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'No contacts selected',
        description: 'Please select at least one contact with a phone number.',
        variant: 'destructive',
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: 'Empty message',
        description: 'Please write a message to send.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    // --- Backend Functionality Placeholder ---
    // In a real implementation, this is where you would invoke a Firebase Function.
    // That function would use a service like Twilio to send the SMS messages.
    // Since we cannot create Firebase Functions, we'll simulate the action
    // and show a notification to the user.
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    toast({
      title: 'Feature In Development',
      description: 'The backend for sending SMS is not yet implemented. This would be handled by a secure Firebase Function.',
    });

    setIsSending(false);
  };

  const isAllSelected = selectedContacts.length > 0 && selectedContacts.length === phoneContacts.length;
  const isPartiallySelected = selectedContacts.length > 0 && !isAllSelected;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/contacts">Contacts</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Bulk SMS</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column for message composition */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="text-primary" /> Compose Message</CardTitle>
              <CardDescription>Write the SMS you want to send to the selected contacts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Your message here..."
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               <Button onClick={handleSend} disabled={isSending || selectedContacts.length === 0} className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                {isSending ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: SMS sending requires backend setup (e.g., Firebase Functions) to be fully functional.
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Right column for contact selection */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="text-primary" /> Select Contacts</CardTitle>
              <CardDescription>
                Choose which contacts to send the message to. Only contacts with a phone number are shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 px-4">
                        <Checkbox
                          checked={isAllSelected ? true : (isPartiallySelected ? 'indeterminate' : false)}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="px-4"><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : phoneContacts.length > 0 ? (
                      phoneContacts.map((contact) => (
                        <TableRow key={contact.id} data-state={selectedContacts.includes(contact.id) ? "selected" : ""}>
                          <TableCell className="px-4">
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                              aria-label={`Select ${contact.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell className="text-muted-foreground">{contact.phoneNumber}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No contacts with phone numbers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="pt-6">
                <div className="text-xs text-muted-foreground">
                  Showing <strong>{phoneContacts.length}</strong> contacts with phone numbers.
                </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
