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

export default function ReceiptsPage() {
  const { data: session } = useSession();
  const [receipts, setReceipts] = useState<any[]>([]);
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
        const data = await response.json();
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setIsLoading(false);
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
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
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
                        <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
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
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download PDF</DropdownMenuItem>
                              <DropdownMenuItem>Resend</DropdownMenuItem>
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
                      <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
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