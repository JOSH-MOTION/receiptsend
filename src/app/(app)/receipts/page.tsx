'use client';

import {
  File,
  PlusCircle,
  MoreHorizontal,
  Mail,
  Smartphone,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
        // Sort newest first
        setReceipts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Success', description: 'Receipts exported successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export receipts', variant: 'destructive' });
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
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Success', description: 'PDF downloaded' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' });
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
        toast({ title: 'Success', description: `${type === 'email' ? 'Email' : 'SMS'} resent` });
      }
    } catch (error) {
      toast({ title: 'Error', description: `Failed to resend ${type}`, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-black dark:via-slate-900 dark:to-purple-950/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="text-foreground/80 hover:text-foreground">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground font-medium">Receipts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-4xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Receipts
            </h1>
            <p className="text-muted-foreground mt-2">Manage and track all customer receipts in one place.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              className="backdrop-blur-md border-white/20 hover:bg-white/30 dark:hover:bg-white/10"
            >
              <File className="h-5 w-5 mr-2" />
              Export CSV
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
            >
              <Link href="/receipts/new" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create Receipt
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Receipt History</CardTitle>
                <CardDescription>
                  {isLoading ? 'Loading receipts...' : `Showing ${receipts.length} receipt${receipts.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <TableRow>
                    <TableHead className="font-semibold">Receipt ID</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Channels</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-40" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><div className="h-4 bg-muted rounded w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><div className="h-4 bg-muted rounded w-28" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 bg-muted rounded w-20 ml-auto" /></TableCell>
                        <TableCell className="text-center"><div className="h-8 w-8 bg-muted rounded mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : receipts.length > 0 ? (
                    receipts.map((receipt) => (
                      <TableRow
                        key={receipt._id}
                        className="hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-200 border-b border-white/10"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/receipts/${receipt._id}`}
                            className="text-primary hover:underline font-mono text-sm"
                          >
                            {receipt.receiptNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{receipt.customerName}</div>
                          <div className="text-sm text-muted-foreground">{receipt.customerEmail}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs"><Mail className="h-3 w-3 mr-1" />Email</Badge>
                            {receipt.customerPhoneNumber && (
                              <Badge variant="secondary" className="text-xs"><Smartphone className="h-3 w-3 mr-1" />SMS</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {format(new Date(receipt.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-lg">
                          ${receipt.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-white/30 dark:hover:bg-white/10 rounded-full">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/90 dark:bg-black/90 border-white/20">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(receipt._id)} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(receipt._id, receipt.receiptNumber)} className="cursor-pointer">
                                <Download className="h-4 w-4 mr-2" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResend(receipt._id, 'email')} className="cursor-pointer">
                                <RefreshCw className="h-4 w-4 mr-2" /> Resend Email
                              </DropdownMenuItem>
                              {receipt.customerPhoneNumber && (
                                <DropdownMenuItem onClick={() => handleResend(receipt._id, 'sms')} className="cursor-pointer">
                                  <RefreshCw className="h-4 w-4 mr-2" /> Resend SMS
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="space-y-4">
                          <div className="text-2xl">No receipts yet</div>
                          <p>Create your first digital receipt to get started.</p>
                          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Link href="/receipts/new">Create First Receipt</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}