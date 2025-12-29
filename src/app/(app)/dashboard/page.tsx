"use client";

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import Link from "next/link"
import React, { useMemo, useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { format, subHours, subMonths } from "date-fns";

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

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        setAllReceipts(data);
        setRecentReceipts(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!allReceipts || allReceipts.length === 0 || !isClient) {
      return {
        totalRevenue: 0,
        receiptsSent: 0,
        newCustomers: 0,
        engagement: 0,
        revenuePercentage: 0,
        receiptsPercentage: 0,
        customersPercentage: 0,
      };
    }

    const oneMonthAgo = subMonths(new Date(), 1);
    const oneHourAgo = subHours(new Date(), 1);

    let totalRevenue = 0;
    let receiptsSent = allReceipts.length;
    const customerEmails = new Set<string>();
    let engagementLastHour = 0;
    
    let revenueLastMonth = 0;
    let receiptsLastMonth = 0;
    const customersLastMonth = new Set<string>();

    allReceipts.forEach(receipt => {
      totalRevenue += receipt.totalAmount || 0;
      customerEmails.add(receipt.customerEmail);

      const receiptDate = new Date(receipt.createdAt);
      if (receiptDate > oneMonthAgo) {
        revenueLastMonth += receipt.totalAmount || 0;
        receiptsLastMonth++;
        customersLastMonth.add(receipt.customerEmail);
      }
      if (receiptDate > oneHourAgo) {
        engagementLastHour++;
      }
    });
    
    const newCustomers = customerEmails.size;
    const prevMonthRevenue = totalRevenue - revenueLastMonth;
    const prevMonthReceipts = receiptsSent - receiptsLastMonth;
    const prevMonthCustomers = newCustomers - customersLastMonth.size;

    const revenuePercentage = prevMonthRevenue > 0 ? ((revenueLastMonth - prevMonthRevenue) / prevMonthRevenue) * 100 : revenueLastMonth > 0 ? 100 : 0;
    const receiptsPercentage = prevMonthReceipts > 0 ? ((receiptsLastMonth - prevMonthReceipts) / prevMonthReceipts) * 100 : receiptsLastMonth > 0 ? 100 : 0;
    const customersPercentage = prevMonthCustomers > 0 ? ((customersLastMonth.size - prevMonthCustomers) / prevMonthCustomers) * 100 : customersLastMonth.size > 0 ? 100 : 0;

    return {
      totalRevenue,
      receiptsSent,
      newCustomers,
      engagement: engagementLastHour,
      revenuePercentage,
      receiptsPercentage,
      customersPercentage,
    };
  }, [allReceipts, isClient]);

  const chartData = useMemo(() => {
    if (!isClient) {
      return Array.from({ length: 12 }, (_, i) => ({ month: `M${i+1}`, total: 0 }));
    }
    
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: format(d, 'MMMM'), total: 0 };
    }).reverse();

    if (allReceipts && allReceipts.length > 0) {
      allReceipts.forEach(receipt => {
        const receiptMonth = format(new Date(receipt.createdAt), 'MMMM');
        const monthData = months.find(m => m.month === receiptMonth);
        if (monthData) {
          monthData.total += receipt.totalAmount || 0;
        }
      });
    }
    return months;
  }, [allReceipts, isClient]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenuePercentage >= 0 ? '+' : ''}{stats.revenuePercentage.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receipts Sent
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.receiptsSent}</div>
            <p className="text-xs text-muted-foreground">
             {stats.receiptsPercentage >= 0 ? '+' : ''}{stats.receiptsPercentage.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.customersPercentage >= 0 ? '+' : ''}{stats.customersPercentage.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.engagement}</div>
            <p className="text-xs text-muted-foreground">
              in the last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Recent transactions from your store.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/receipts">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Status
                  </TableHead>
                  <TableHead className="hidden xl:table-column">
                    Date
                  </TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="font-medium">Loading...</div></TableCell>
                      <TableCell className="hidden xl:table-column">...</TableCell>
                      <TableCell className="hidden md:table-cell lg:hidden xl:table-column">...</TableCell>
                      <TableCell className="text-right">...</TableCell>
                    </TableRow>
                  ))
                ) : recentReceipts && recentReceipts.length > 0 ? (
                  recentReceipts.map(receipt => (
                    <TableRow key={receipt._id}>
                      <TableCell>
                        <div className="font-medium">{receipt.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {receipt.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        <Badge className="text-xs" variant="secondary">
                          Sent
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                        {isClient ? format(new Date(receipt.createdAt), "yyyy-MM-dd") : "..."}
                      </TableCell>
                      <TableCell className="text-right">${receipt.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                      <TableCell colSpan={4} className="text-center">No transactions found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receipts Overview</CardTitle>
            <CardDescription>An overview of your receipts sent this year.</CardDescription>
          </CardHeader>
          <CardContent>
             {(isLoading || !isClient) ? (
              <div className="h-64 w-full flex items-center justify-center">Loading...</div>
            ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}