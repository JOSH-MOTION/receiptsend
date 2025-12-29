
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Contact {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

interface OrgSettings {
  smsSenderId?: string;
  smsBalance?: number;
}

export default function BulkSmsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [message, setMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [manualNumbers, setManualNumbers] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgRes, contactsRes] = await Promise.all([
          fetch('/api/organization'),
          fetch('/api/contacts'),
        ]);

        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrgSettings(data);
        }

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.filter((c: Contact) => c.phoneNumber)); // Only show contacts with phone numbers
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast({
          title: 'Error',
          description: 'Could not load necessary data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const allRecipients = useMemo(() => {
    const numbersFromContacts = contacts
      .filter((c) => selectedContacts.has(c._id))
      .map((c) => c.phoneNumber!);
    const numbersFromManual = manualNumbers
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    return Array.from(new Set([...numbersFromContacts, ...numbersFromManual]));
  }, [contacts, selectedContacts, manualNumbers]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allContactIds = new Set(contacts.map((c) => c._id));
      setSelectedContacts(allContactIds);
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSendMessage = async () => {
    if (!orgSettings?.smsSenderId) {
      toast({
        title: 'Missing Sender ID',
        description: 'Please set your SMS Sender ID in settings before sending.',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Empty Message',
        description: 'You cannot send an empty message.',
        variant: 'destructive',
      });
      return;
    }

    if (allRecipients.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one contact or add a number.',
        variant: 'destructive',
      });
      return;
    }

    const requiredCredits = allRecipients.length;
    if ((orgSettings.smsBalance ?? 0) < requiredCredits) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${requiredCredits} credits but only have ${orgSettings.smsBalance ?? 0}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/contacts/bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, recipients: allRecipients }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Messages Sent!',
          description: `${result.successful} messages have been successfully queued for sending.`,
        });
        router.push('/contacts');
      } else {
        throw new Error(result.error || 'An unknown error occurred');
      }
    } catch (error: any) {
      toast({
        title: 'Sending Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid flex-1 auto-rows-max gap-4">
      {/* Header */}
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
                <Link href="/contacts">Contacts</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Bulk Message</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
          {!orgSettings?.smsSenderId && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SMS Sender ID is Missing</AlertTitle>
              <AlertDescription>
                You must set an 11-character SMS Sender ID in your settings
                before you can send bulk messages.
                <Button variant="link" className="p-0 h-auto ml-1" asChild>
                  <Link href="/settings">Go to Settings <ChevronRight className="h-4 w-4" /></Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Message Composer */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sender-id">Sender ID</Label>
                  <Input
                    id="sender-id"
                    value={orgSettings?.smsSenderId || 'Not Set'}
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>
                Choose from your saved contacts or enter numbers manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">From Contacts</h3>
                <ScrollArea className="h-64 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              contacts.length > 0 &&
                              selectedContacts.size === contacts.length
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(Boolean(checked))
                            }
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.length > 0 ? (
                        contacts.map((contact) => (
                          <TableRow key={contact._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedContacts.has(contact._id)}
                                onCheckedChange={(checked) => {
                                  setSelectedContacts((prev) => {
                                    const newSet = new Set(prev);
                                    if (checked) newSet.add(contact._id);
                                    else newSet.delete(contact._id);
                                    return newSet;
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>{contact.name}</TableCell>
                            <TableCell>{contact.phoneNumber}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No contacts with phone numbers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div>
                <Label htmlFor="manual-numbers">Add Manually</Label>
                <Textarea
                  id="manual-numbers"
                  placeholder="Enter numbers separated by commas, spaces, or new lines."
                  rows={4}
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-semibold">{allRecipients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credits Needed</span>
                <span className="font-semibold">{allRecipients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Balance</span>
                <Badge
                  variant={
                    (orgSettings?.smsBalance ?? 0) >= allRecipients.length
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {orgSettings?.smsBalance ?? 0} credits
                </Badge>
              </div>
              {(orgSettings?.smsBalance ?? 0) < allRecipients.length && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient Balance</AlertTitle>
                  <AlertDescription>
                    You need to buy more credits to send this message.
                    <Button variant="link" className="p-0 h-auto ml-1" asChild>
                      <Link href="/settings">Buy Credits <ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Send to ${allRecipients.length} Recipient(s)`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
