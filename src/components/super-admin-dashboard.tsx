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
import { useUser } from '@/firebase';

export default function SuperAdminDashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>({});
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (isAuthLoading) return; // Wait until Firebase auth state is known

      if (!user) {
        setIsCheckingAuth(false);
        setIsAuthorized(false);
        return;
      }
      
      setIsCheckingAuth(true);
      
      try {
        const headers = { 'X-User-UID': user.uid };
        const authCheckRes = await fetch('/api/admin/stats', { headers });

        if (authCheckRes.status === 403) {
          setIsAuthorized(false);
          toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
          return;
        }
        
        if (!authCheckRes.ok) {
           throw new Error('Failed to verify authorization.');
        }

        setIsAuthorized(true);
        const statsData = await authCheckRes.json();
        
        await fetchAllAdminData(statsData);

      } catch (error) {
        console.error("Authorization check failed:", error);
        setIsAuthorized(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndFetchData();
  }, [user, isAuthLoading]);

  const fetchAllAdminData = async (initialStats: any) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const headers = { 'X-User-UID': user.uid };
      const [orgsRes, transRes, smsRes, quickSmsRes] = await Promise.all([
        fetch('/api/admin/organizations', { headers }),
        fetch('/api/admin/transactions', { headers }),
        fetch('/api/admin/sms-logs', { headers }),
        fetch('/api/admin/quicksms-balance', { headers }),
      ]);

      if (!orgsRes.ok || !transRes.ok || !smsRes.ok || !quickSmsRes.ok) {
        throw new Error('One or more admin data endpoints failed.');
      }

      const orgsData = await orgsRes.json();
      const transData = await transRes.json();
      const smsData = await smsRes.json();
      const quickSmsData = await quickSmsRes.json();

      setStats({ ...initialStats.stats, quickSMSBalance: quickSmsData.balance });
      setOrganizations(orgsData);
      setTransactions(transData);
      setSmsLogs(smsData);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to fetch admin data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!isAuthorized || !user) return;
    toast({ title: 'Refreshing...', description: 'Fetching latest admin data.'});
    setIsLoading(true);
     try {
        const headers = { 'X-User-UID': user.uid };
        const statsRes = await fetch('/api/admin/stats', { headers });
        if (!statsRes.ok) throw new Error('Failed to refresh stats');
        const statsData = await statsRes.json();
        await fetchAllAdminData(statsData);
        toast({ title: 'Success', description: 'Admin data refreshed.' });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to refresh data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
  }


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
  
  if (isAuthLoading || isCheckingAuth) {
     return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md p-8 border rounded-lg shadow-lg bg-card">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-destructive-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-2">
           { user ? "You do not have permission to access the Super Admin Dashboard." : "You must be logged in to view this page."}
          </p>
          <div className="mt-6">
            <a
              href={ user ? "/dashboard" : "/login" }
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              { user ? "Go to Dashboard" : "Go to Login" }
            </a>
          </div>
        </div>
      </div>
    );
  }

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
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
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
