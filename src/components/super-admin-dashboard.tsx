'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>({});
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, orgsRes, transRes, smsRes, quickSmsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/sms-logs'),
        fetch('/api/admin/quicksms-balance'),
      ]);

      const statsData = await statsRes.json();
      const orgsData = await orgsRes.json();
      const transData = await transRes.json();
      const smsData = await smsRes.json();
      const quickSmsData = await quickSmsRes.json();

      setStats({ ...statsData.stats, quickSMSBalance: quickSmsData.balance });
      setOrganizations(orgsData);
      setTransactions(transData);
      setSmsLogs(smsData);
      
      toast({ title: 'Success', description: 'Admin data refreshed.' });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to fetch admin data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrganizations = useMemo(() => {
      if (!searchTerm) return organizations;
      return organizations.filter(org => 
          org.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [organizations, searchTerm]);


  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => 
            `"${String(val).replace(/"/g, '""')}"`
        ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage the entire SMS receipt system
          </p>
        </div>
        <Button onClick={fetchAdminData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orgs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrgs || 0}</div>
            <p className="text-xs text-muted-foreground">
              organizations onboarded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalReceipts || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              receipts created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH¢{(stats.smsStats?.totalSpent || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">from credit sales</p>
          </CardContent>
        </Card>
        <Card className={(stats.quickSMSBalance || 0) < 5000 ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QuickSMS Balance</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.quickSMSBalance || 0).toLocaleString()}</div>
            {(stats.quickSMSBalance || 0) < 5000 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Low balance! Please top up.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="sms-logs">SMS Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Organizations</CardTitle>
                  <CardDescription>Manage and monitor all signed-up organizations</CardDescription>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>SMS Balance</TableHead>
                    <TableHead className="hidden lg:table-cell">Total Purchased</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                      Array.from({length: 5}).map((_, i) => (
                          <TableRow key={i}><TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50"></TableCell></TableRow>
                      ))
                  ) : filteredOrganizations.length > 0 ? (
                    filteredOrganizations.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.companyName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{org.email}</TableCell>
                      <TableCell>
                        <Badge variant={org.smsBalance < 100 ? "destructive" : "secondary"}>
                          {org.smsBalance} credits
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{(org.totalPurchased || 0).toLocaleString()} credits</TableCell>
                       <TableCell className="hidden lg:table-cell">{format(new Date(org.createdAt), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <Badge variant={org.smsBalance > 0 ? "default" : "outline"}>
                          {org.smsBalance > 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">No organizations found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs would go here */}
      </Tabs>
    </div>
  );
}
