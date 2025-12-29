'use client';

import {
  File,
  ListFilter,
  MoreHorizontal,
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
  DropdownMenuItem,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Link from "next/link"
import { useSession } from 'next-auth/react';
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Define proper types for receipts
interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface Receipt {
  _id: string;
  organizationId: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber?: string;
  items: ReceiptItem[];
  discount?: number;
  tax?: number;
  totalAmount: number;
  pdfUrl?: string;
  createdAt: string;
}

export default function ReceiptsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchReceipts();
    }
  }, [session]);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts');
      if (response.ok) {
        const data: Receipt[] = await response.json();
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/receipts/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipts-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Receipts exported successfully',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export receipts',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (receiptId: string) => {
    router.push(`/receipts/${receiptId}`);
  };

  const handleDownloadPDF = async (receiptId: string, receiptNumber: string) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'PDF downloaded successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handleResend = async (receiptId: string, type: 'email' | 'sms') => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type === 'email' ? 'Email' : 'SMS'} resent successfully`,
        });
      } else {
        throw new Error('Resend failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to resend ${type}`,
        variant: 'destructive',
      });
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
              <BreadcrumbPage>Receipts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export CSV
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/receipts/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Receipt
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  All
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Receipts</CardTitle>
              <CardDescription>
                Manage your receipts and view their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">Loading...</TableCell>
                        <TableCell>...</TableCell>
                        <TableCell className="hidden md:table-cell">...</TableCell>
                        <TableCell className="hidden md:table-cell">...</TableCell>
                        <TableCell className="text-right">...</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : receipts && receipts.length > 0 ? (
                    receipts.map((receipt) => (
                      <TableRow key={receipt._id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/receipts/${receipt._id}`}
                            className="hover:underline text-primary"
                          >
                            {receipt.receiptNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{receipt.customerName}</div>
                          <div className="text-sm text-muted-foreground">{receipt.customerEmail}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">Sent</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(receipt.createdAt), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell className="text-right">${receipt.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(receipt._id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(receipt._id, receipt.receiptNumber)}>
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResend(receipt._id, 'email')}>
                                Resend Email
                              </DropdownMenuItem>
                              {receipt.customerPhoneNumber && (
                                <DropdownMenuItem onClick={() => handleResend(receipt._id, 'sms')}>
                                  Resend SMS
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No receipts found. Create your first receipt!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{receipts.length}</strong> of <strong>{receipts.length}</strong> receipts
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Receipts</CardTitle>
              <CardDescription>
                All receipts that have been sent to customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt._id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/receipts/${receipt._id}`}
                          className="hover:underline text-primary"
                        >
                          {receipt.receiptNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{receipt.customerName}</div>
                        <div className="text-sm text-muted-foreground">{receipt.customerEmail}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(receipt.createdAt), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="text-right">${receipt.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}