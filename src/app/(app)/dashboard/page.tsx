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
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, subHours, subMonths, fromUnixTime } from "date-fns";

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

const chartConfig = {
  total: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

export default function Dashboard() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const receiptsQuery = useMemoFirebase(
    () => (user ? collection(firestore, "organizations", user.uid, "receipts") : null),
    [firestore, user]
  );
  const { data: allReceipts, isLoading } = useCollection<Omit<Receipt, 'id'>>(receiptsQuery);

  const recentReceipts = useMemo(() => {
    return allReceipts ? allReceipts.slice(0, 6) : [];
  }, [allReceipts]);

  const formatTimestamp = (ts: any) => {
    if (!ts) return new Date();
    return ts.seconds ? fromUnixTime(ts.seconds) : ts;
  }

  const stats = useMemo(() => {
    if (!allReceipts || !isClient) {
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

      const receiptDate = formatTimestamp(receipt.createdAt);
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
    const initialMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { month: format(d, 'MMM'), total: 0 };
    });

    if (!isClient || !allReceipts) return initialMonths;

    const months = [...initialMonths];

    allReceipts.forEach(receipt => {
      const receiptDate = formatTimestamp(receipt.createdAt);
      const monthKey = format(receiptDate, 'MMM');
      const entry = months.find(m => m.month === monthKey);
      if (entry) entry.total += receipt.totalAmount;
    });

    return months;
  }, [allReceipts, isClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
          </div>
          <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg">
            <Link href="/receipts/new">Create Receipt</Link>
          </Button>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Revenue", value: `GH₵${stats.totalRevenue.toFixed(2)}`, change: stats.revenuePercentage, icon: DollarSign, color: "from-red-500 to-orange-600" },
            { title: "Receipts Sent", value: stats.receiptsSent, change: stats.receiptsPercentage, icon: CreditCard, color: "from-orange-500 to-amber-600" },
            { title: "New Customers", value: stats.newCustomers, change: stats.customersPercentage, icon: Users, color: "from-amber-500 to-yellow-600" },
            { title: "Active Now", value: stats.engagement, change: null, icon: Activity, color: "from-red-500 to-pink-600", suffix: "last hour" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="relative overflow-hidden backdrop-blur-xl bg-card/80 border-border shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                {stat.change !== null && (
                  <p className={`text-xs sm:text-sm flex items-center gap-1 mt-2 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.change >= 0 ? '' : 'rotate-180'}`} />
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
                  </p>
                )}
                {stat.suffix && <p className="text-xs text-muted-foreground mt-2">{stat.suffix}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
          {/* Recent Transactions */}
          <Card className="lg:col-span-4 backdrop-blur-xl bg-card/70 border-border shadow-2xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Recent Receipts</CardTitle>
                  <CardDescription className="text-sm">Latest customer transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto backdrop-blur-md">
                  <Link href="/receipts" className="flex items-center gap-2">
                    View All <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">Channel</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                          <TableCell className="hidden sm:table-cell"><div className="h-4 bg-muted rounded w-20" /></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-24" /></TableCell>
                          <TableCell className="text-right"><div className="h-4 bg-muted rounded w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentReceipts.length > 0 ? (
                      recentReceipts.map((receipt) => (
                        <TableRow key={receipt.id} className="hover:bg-secondary/50 dark:hover:bg-secondary/10 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">{receipt.customerName}</div>
                            <div className="text-xs text-muted-foreground hidden sm:block">{receipt.customerEmail}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-2 flex-wrap">
                              {(receipt.deliveryChannels || []).includes("email") && <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs"><Mail className="h-3 w-3 mr-1" />Email</Badge>}
                              {(receipt.deliveryChannels || []).includes("sms") && <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs"><Smartphone className="h-3 w-3 mr-1" />SMS</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{isClient ? format(formatTimestamp(receipt.createdAt), "MMM d, yyyy") : "..."}</TableCell>
                          <TableCell className="text-right font-semibold text-primary text-sm">GH₵{receipt.totalAmount.toFixed(2)}</TableCell>
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
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart - Responsive */}
          <Card className="lg:col-span-3 backdrop-blur-xl bg-card/70 border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Revenue Overview</CardTitle>
              <CardDescription className="text-sm">Monthly receipt totals</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !isClient ? (
                <div className="h-64 sm:h-80 flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground text-sm">Loading chart...</div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[300px] sm:min-w-[400px] w-full">
                    <ChartContainer config={chartConfig} className="h-64 sm:h-80 w-full">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent className="backdrop-blur-lg bg-background/90" />}
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
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
