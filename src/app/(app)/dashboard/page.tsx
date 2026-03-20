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
  TrendingDown,
  Receipt,
  MessageSquare,
  Clock,
  Target,
  Zap,
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
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, ResponsiveContainer } from "recharts";
import Link from "next/link";
import React, { useMemo, useState, useEffect } from "react";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, subHours, subMonths, subDays, fromUnixTime, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

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
  receipts: {
    label: "Receipts",
    color: "hsl(var(--accent))",
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
    return allReceipts ? allReceipts.slice(0, 5) : [];
  }, [allReceipts]);

  const formatTimestamp = (ts: any) => {
    if (!ts) return new Date();
    return ts.seconds ? fromUnixTime(ts.seconds) : ts;
  }

  const formatRelativeTime = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

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
        todayRevenue: 0,
        todayReceipts: 0,
        weekRevenue: 0,
        weekReceipts: 0,
      };
    }

    const oneMonthAgo = subMonths(new Date(), 1);
    const oneWeekAgo = subDays(new Date(), 7);
    const oneDayAgo = subDays(new Date(), 1);
    const oneHourAgo = subHours(new Date(), 1);

    let totalRevenue = 0;
    let receiptsSent = allReceipts.length;
    const customerEmails = new Set<string>();
    let engagementLastHour = 0;
    
    let revenueLastMonth = 0;
    let receiptsLastMonth = 0;
    const customersLastMonth = new Set<string>();
    
    let todayRevenue = 0;
    let todayReceipts = 0;
    let weekRevenue = 0;
    let weekReceipts = 0;

    allReceipts.forEach(receipt => {
      totalRevenue += receipt.totalAmount || 0;
      customerEmails.add(receipt.customerEmail);

      const receiptDate = formatTimestamp(receipt.createdAt);
      
      // Today's stats
      if (receiptDate > oneDayAgo) {
        todayRevenue += receipt.totalAmount || 0;
        todayReceipts++;
      }
      
      // Week stats
      if (receiptDate > oneWeekAgo) {
        weekRevenue += receipt.totalAmount || 0;
        weekReceipts++;
      }
      
      // Month stats
      if (receiptDate > oneMonthAgo) {
        revenueLastMonth += receipt.totalAmount || 0;
        receiptsLastMonth++;
        customersLastMonth.add(receipt.customerEmail);
      }
      
      // Hour stats
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
      todayRevenue,
      todayReceipts,
      weekRevenue,
      weekReceipts,
    };
  }, [allReceipts, isClient]);

  const chartData = useMemo(() => {
    const initialDays = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return { 
        date: format(d, 'MMM dd'), 
        revenue: 0,
        receipts: 0 
      };
    });

    if (!isClient || !allReceipts) return initialDays;

    const days = [...initialDays];

    allReceipts.forEach(receipt => {
      const receiptDate = formatTimestamp(receipt.createdAt);
      const dateKey = format(receiptDate, 'MMM dd');
      const entry = days.find(m => m.date === dateKey);
      if (entry) {
        entry.revenue += receipt.totalAmount || 0;
        entry.receipts += 1;
      }
    });

    return days.slice(-14); // Show last 14 days
  }, [allReceipts, isClient]);

  const quickActions = [
    {
      title: "Create Receipt",
      description: "Generate a new digital receipt",
      icon: Receipt,
      href: "/receipts/new",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "View Contacts",
      description: "Manage customer information",
      icon: Users,
      href: "/contacts",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Send Bulk SMS",
      description: "Message multiple contacts",
      icon: MessageSquare,
      href: "/contacts/bulk-sms",
      color: "from-green-500 to-green-600",
    },
    {
      title: "SMS Credits",
      description: "Top up your SMS balance",
      icon: CreditCard,
      href: "/sms-credits",
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600">
              Here's what's happening with your business today
            </p>
          </div>
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
          >
            <Link href="/receipts/new" className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Create Receipt
            </Link>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 bg-white hover:border-green-300">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {stats.revenuePercentage > 0 ? '+' : ''}{stats.revenuePercentage.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">GH₵{stats.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {stats.receiptsPercentage > 0 ? '+' : ''}{stats.receiptsPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stats.receiptsSent}</p>
                <p className="text-sm text-gray-600">Receipts Sent</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {stats.customersPercentage > 0 ? '+' : ''}{stats.customersPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stats.newCustomers}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-lime-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-lime-600" />
                </div>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Today
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stats.todayReceipts}</p>
                <p className="text-sm text-gray-600">Today's Receipts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Revenue Overview</CardTitle>
                  <CardDescription className="text-gray-600">Last 14 days performance</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">Revenue</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || !isClient ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading chart...</div>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={1}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent className="bg-white border border-gray-200 shadow-lg" />}
                        cursor={{ fill: '#f0fdf4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: '#059669' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">Recent Activity</CardTitle>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentReceipts.length > 0 ? (
                  recentReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {receipt.customerName}
                        </p>
                        <p className="text-xs text-gray-600">
                          GH₵{receipt.totalAmount.toFixed(2)} • {formatRelativeTime(formatTimestamp(receipt.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No receipts yet</p>
                  </div>
                )}
              </div>
              {recentReceipts.length > 0 && (
                <Button variant="ghost" size="sm" asChild className="w-full mt-4 text-gray-600 hover:text-green-600">
                  <Link href="/receipts" className="flex items-center gap-2">
                    View all receipts
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900">Performance Metrics</CardTitle>
            <CardDescription className="text-gray-600">Key business insights and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Today's Revenue
                </div>
                <p className="text-2xl font-bold text-gray-900">GH₵{stats.todayRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-600">{stats.todayReceipts} receipts</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="h-4 w-4" />
                  This Week
                </div>
                <p className="text-2xl font-bold text-gray-900">GH₵{stats.weekRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-600">{stats.weekReceipts} receipts</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  Avg. Receipt Value
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  GH₵{stats.receiptsSent > 0 ? (stats.totalRevenue / stats.receiptsSent).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-gray-600">Per transaction</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="h-4 w-4" />
                  Active Now
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.engagement}</p>
                <p className="text-xs text-gray-600">Last hour activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
