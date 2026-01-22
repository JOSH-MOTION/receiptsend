"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { format, fromUnixTime } from "date-fns";
import { Plus, Search, Filter, Mail, Smartphone, Eye, Trash2, MoreVertical, FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface Receipt {
  id: string;
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
  createdAt: { seconds: number, nanoseconds: number } | Date;
  deliveryChannels?: string[];
}

export default function ReceiptsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const receiptsQuery = useMemoFirebase(
    () => (user ? collection(firestore, "organizations", user.uid, "receipts") : null),
    [firestore, user]
  );
  const { data: receipts, isLoading } = useCollection<Omit<Receipt, 'id'>>(receiptsQuery);

  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    let filtered = [...receipts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Channel filter
    if (filterChannel === "email") {
      filtered = filtered.filter((r) => r.deliveryChannels?.includes("email"));
    } else if (filterChannel === "sms") {
      filtered = filtered.filter((r) => r.deliveryChannels?.includes("sms"));
    }

    return filtered;
  }, [receipts, searchQuery, filterChannel]);

  const handleDeleteClick = (receipt: Receipt) => {
    setReceiptToDelete(receipt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!receiptToDelete || !user || !firestore) return;
    
    setIsDeleting(true);
    try {
      const receiptRef = doc(firestore, 'organizations', user.uid, 'receipts', receiptToDelete.id);
      await deleteDoc(receiptRef);
      
      toast({
        title: 'Receipt Deleted',
        description: `Receipt #${receiptToDelete.receiptNumber} has been deleted successfully.`,
      });
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
    }
  };

  const totalRevenue = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  const formatTimestamp = (ts: any) => {
    if (!ts) return '...';
    if (ts.seconds) {
      return format(new Date(ts.seconds * 1000), "MMM d, yyyy");
    }
    return format(ts, "MMM d, yyyy");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Receipts
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage all your digital receipts in one place
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">
            <Link href="/receipts/new" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Receipt
            </Link>
          </Button>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">{filteredReceipts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {receipts && receipts.length > filteredReceipts.length && `${receipts.length - filteredReceipts.length} filtered out`}
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">GH₵{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">From selected receipts</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/70 border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Receipt Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
              GH₵{filteredReceipts.length > 0 ? (totalRevenue / filteredReceipts.length).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="backdrop-blur-xl bg-card/60 border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">All Receipts</CardTitle>
            <CardDescription className="text-sm">Search and filter your receipt history</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter - Stack on Mobile */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email, or receipt number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="sms">SMS Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipts Table - Responsive with Horizontal Scroll */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="font-semibold">Receipt #</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Channel</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">Date</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(8)].map((_, i) => (
                          <TableRow key={i} className="animate-pulse">
                            <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                            <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><div className="h-4 bg-muted rounded w-20" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><div className="h-4 bg-muted rounded w-24" /></TableCell>
                            <TableCell className="text-right"><div className="h-4 bg-muted rounded w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><div className="h-4 bg-muted rounded w-8 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredReceipts.length > 0 ? (
                        filteredReceipts.map((receipt) => (
                          <TableRow
                            key={receipt.id}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <TableCell className="font-mono font-medium text-primary text-sm">
                              {receipt.receiptNumber}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{receipt.customerName}</div>
                              <div className="text-xs text-muted-foreground">{receipt.customerEmail}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex gap-2 flex-wrap">
                                {receipt.deliveryChannels?.includes("email") && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </Badge>
                                )}
                                {receipt.deliveryChannels?.includes("sms") && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                                    <Smartphone className="h-3 w-3 mr-1" />
                                    SMS
                                  </Badge>
                                )}
                                {(!receipt.deliveryChannels || receipt.deliveryChannels.length === 0) && (
                                  <Badge variant="outline">Not Sent</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                              {isClient ? formatTimestamp(receipt.createdAt) : "..."}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                            GH₵{receipt.totalAmount.toFixed(2)}
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
                                    <Link href={`/receipts/${receipt.id}`} className="flex items-center gap-2">
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(receipt)}
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
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-full bg-secondary">
                                <FileText className="h-8 w-8 text-primary" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold">No receipts found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {searchQuery || filterChannel !== "all"
                                    ? "Try adjusting your filters"
                                    : "Create your first receipt to get started"}
                                </p>
                              </div>
                              {!searchQuery && filterChannel === "all" && (
                                <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                                  <Link href="/receipts/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Receipt
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete receipt <span className="font-semibold">#{receiptToDelete?.receiptNumber}</span> for{" "}
              <span className="font-semibold">{receiptToDelete?.customerName}</span>?
              <br /><br />
              This action cannot be undone and will permanently remove the receipt from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
