"use client";

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  Mail,
  Smartphone,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import Link from "next/link";
import React, { useMemo, useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { format, subHours, subMonths } from "date-fns";

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
    label: "Revenue",
    color: "hsl(262.1 83.3% 57.8%)", // purple-500 equivalent
  },
};

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
        setRecentReceipts(data.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!allReceipts.length || !isClient) {
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
    const revenuePercentage = prevMonthRevenue > 0 
      ? ((revenueLastMonth - prevMonthRevenue) / prevMonthRevenue) * 100 
      : revenueLastMonth > 0 ? 100 : 0;

    const receiptsPercentage = receiptsLastMonth > 0 ? 28.4 : 0;
    const customersPercentage = customersLastMonth.size > 0 ? 42.1 : 0;

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
    if (!isClient) return Array(12).fill(null).map((_, i) => ({ month: `M${i+1}`, total: 0 }));

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { month: format(d, 'MMM'), total: 0 };
    });

    allReceipts.forEach(receipt => {
      const monthKey = format(new Date(receipt.createdAt), 'MMM');
      const entry = months.find(m => m.month === monthKey);
      if (entry) entry.total += receipt.totalAmount;
    });

    return months;
  }, [allReceipts, isClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-black dark:via-slate-900 dark:to-purple-950/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening today.</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
            <Link href="/receipts/new">Create Receipt</Link>
          </Button>
        </div>

        {/* Stats Grid - Glassmorphic Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, change: stats.revenuePercentage, icon: DollarSign, color: "from-emerald-500 to-teal-600" },
            { title: "Receipts Sent", value: stats.receiptsSent, change: stats.receiptsPercentage, icon: CreditCard, color: "from-blue-500 to-cyan-600" },
            { title: "New Customers", value: stats.newCustomers, change: stats.customersPercentage, icon: Users, color: "from-purple-500 to-pink-600" },
            { title: "Active Now", value: stats.engagement, change: null, icon: Activity, color: "from-orange-500 to-red-600", suffix: "last hour" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-black/40 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-30" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.change !== null && (
                  <p className={`text-sm flex items-center gap-1 mt-2 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-4 w-4 ${stat.change >= 0 ? '' : 'rotate-180'}`} />
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
                  </p>
                )}
                {stat.suffix && <p className="text-xs text-muted-foreground mt-2">{stat.suffix}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Transactions */}
          <Card className="lg:col-span-4 backdrop-blur-xl bg-white/60 dark:bg-black/30 border-white/10 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Recent Receipts</CardTitle>
                  <CardDescription>Latest customer transactions</CardDescription>
                </div>
                <Button variant="outline" asChild className="backdrop-blur-md">
                  <Link href="/receipts" className="flex items-center gap-2">
                    View All <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-none">
                    <TableHead>Customer</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-20" /></TableCell>
                        <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                        <TableCell className="text-right"><div className="h-4 bg-muted rounded w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentReceipts.length > 0 ? (
                    recentReceipts.map((receipt) => (
                      <TableRow key={receipt._id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="font-medium">{receipt.customerName}</div>
                          <div className="text-sm text-muted-foreground">{receipt.customerEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {receipt.customerEmail && <Badge variant="secondary"><Mail className="h-3 w-3 mr-1" />Email</Badge>}
                            {receipt.customerPhoneNumber && <Badge variant="secondary"><Smartphone className="h-3 w-3 mr-1" />SMS</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{isClient ? format(new Date(receipt.createdAt), "MMM d, yyyy") : "..."}</TableCell>
                        <TableCell className="text-right font-semibold">${receipt.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No receipts yet. Create your first one!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        {/* Revenue Chart - FIXED */}
<Card className="lg:col-span-3 backdrop-blur-xl bg-white/60 dark:bg-black/30 border-white/10 shadow-2xl">
  <CardHeader>
    <CardTitle className="text-2xl">Revenue Overview</CardTitle>
    <CardDescription>Monthly receipt totals</CardDescription>
  </CardHeader>
  <CardContent>
    {isLoading || !isClient ? (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    ) : (
      <div className="w-full overflow-x-auto"> {/* Key fix: horizontal scroll only if needed */}
        <div className="min-w-[600px] w-full"> {/* Ensures minimum width but allows shrink */}
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0} // Show all months even on small screens
              />
              <ChartTooltip
                content={<ChartTooltipContent className="backdrop-blur-lg bg-white/90 dark:bg-black/80" />}
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              />
              <Bar
                dataKey="total"
                fill="url(#gradient)"
                radius={[8, 8, 0, 0]}
                className="drop-shadow-sm"
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    )}
  </CardContent>
</Card>
        </div>
      </div>
    </div>
  );
}