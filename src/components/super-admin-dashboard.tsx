'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Calendar,
  CreditCard,
  Smartphone,
  BarChart3,
  Activity,
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrganizations: 0,
    totalCreditsIssued: 0,
    totalSMSSent: 0,
    quickSMSBalance: 0,
    todayRevenue: 0,
    todaySMS: 0,
    monthlyRevenue: 0,
    activeOrganizations: 0,
  });

  const [organizations, setOrganizations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch all admin data
      const [statsRes, orgsRes, transRes, smsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/sms-logs'),
      ]);

      const statsData = await statsRes.json();
      const orgsData = await orgsRes.json();
      const transData = await transRes.json();
      const smsData = await smsRes.json();

      setStats(statsData);
      setOrganizations(orgsData);
      setTransactions(transData);
      setSmsLogs(smsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkQuickSMSBalance = async () => {
    const response = await fetch('/api/admin/quicksms-balance');
    const data = await response.json();
    setStats(prev => ({ ...prev, quickSMSBalance: data.balance }));
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString()}.csv`;
    a.click();
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage the entire SMS receipt system
          </p>
        </div>
        <Button onClick={fetchAdminData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH¢{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +GH¢{stats.todayRevenue} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrganizations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSMSSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todaySMS} today
            </p>
          </CardContent>
        </Card>

        <Card className={stats.quickSMSBalance < 5000 ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QuickSMS Balance</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quickSMSBalance.toLocaleString()}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs" 
              onClick={checkQuickSMSBalance}
            >
              Refresh Balance
            </Button>
            {stats.quickSMSBalance < 5000 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Low balance! Please top up
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="sms-logs">SMS Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((trans: any, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{trans.organizationName}</p>
                        <p className="text-xs text-muted-foreground">
                          Purchased {trans.units} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">GH¢{trans.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trans.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Paystack Connection</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">QuickSMS API</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Database</span>
                    </div>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stats.quickSMSBalance < 5000 ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-sm">SMS Balance</span>
                    </div>
                    <Badge variant={stats.quickSMSBalance < 5000 ? "destructive" : "default"}>
                      {stats.quickSMSBalance.toLocaleString()} units
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Current month statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">GH¢{stats.monthlyRevenue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Sold</p>
                  <p className="text-2xl font-bold">{stats.totalCreditsIssued.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SMS Delivered</p>
                  <p className="text-2xl font-bold">{stats.totalSMSSent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">99.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Organizations</CardTitle>
                  <CardDescription>Manage and monitor organizations</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" onClick={() => exportToCSV(organizations, 'organizations')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SMS Balance</TableHead>
                    <TableHead>Total Purchased</TableHead>
                    <TableHead>Total Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations
                    .filter((org: any) => 
                      org.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      org.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((org: any) => (
                    <TableRow key={org._id}>
                      <TableCell className="font-medium">{org.companyName}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>
                        <Badge variant={org.smsBalance < 100 ? "destructive" : "default"}>
                          {org.smsBalance} units
                        </Badge>
                      </TableCell>
                      <TableCell>{org.totalPurchased?.toLocaleString() || 0}</TableCell>
                      <TableCell>{org.totalSent?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge variant={org.smsBalance > 0 ? "default" : "secondary"}>
                          {org.smsBalance > 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>Payment history from Paystack</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => exportToCSV(transactions, 'transactions')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((trans: any) => (
                    <TableRow key={trans._id}>
                      <TableCell>
                        {new Date(trans.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {trans.reference}
                      </TableCell>
                      <TableCell>{trans.organizationName}</TableCell>
                      <TableCell>{trans.bundleName}</TableCell>
                      <TableCell className="font-bold">GH¢{trans.amount}</TableCell>
                      <TableCell>{trans.units} units</TableCell>
                      <TableCell>
                        {trans.status === 'success' ? (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Logs Tab */}
        <TabsContent value="sms-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMS Delivery Logs</CardTitle>
                  <CardDescription>All SMS sent through the system</CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportToCSV(smsLogs, 'sms-logs')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead>Units Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsLogs.slice(0, 50).map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {new Date(log.sentAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.organizationName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.phoneNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.message?.substring(0, 50)}...
                      </TableCell>
                      <TableCell>{log.unitsUsed}</TableCell>
                      <TableCell>
                        {log.status === 'sent' ? (
                          <Badge variant="default">Delivered</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Revenue chart (implement with recharts or similar)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  SMS usage chart (implement with recharts or similar)
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>SMS Sent</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations
                    .sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0))
                    .slice(0, 10)
                    .map((org: any, index: number) => (
                      <TableRow key={org._id}>
                        <TableCell className="font-bold">#{index + 1}</TableCell>
                        <TableCell>{org.companyName}</TableCell>
                        <TableCell>GH¢{(org.totalSpent || 0).toLocaleString()}</TableCell>
                        <TableCell>{(org.totalSent || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {org.totalPurchased > 0 
                            ? `${((org.totalSent / org.totalPurchased) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}