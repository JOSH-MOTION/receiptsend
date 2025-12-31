// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Organization, SmsLog } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { quickSMSService } from '@/lib/quicksms';

// Middleware to check if user is super admin
async function isSuper Admin() {
  const session = await getServerSession();
  // Add your super admin email check here
  const superAdminEmails = ['admin@yourcompany.com', 'your@email.com'];
  return session && superAdminEmails.includes(session.user?.email || '');
}

export async function GET(request: NextRequest) {
  try {
    // Check super admin access
    const isSuperAdmin = await isSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Get all organizations
    const organizations = await Organization.find({});
    
    // Calculate total revenue (sum of all purchases)
    const totalRevenue = organizations.reduce((sum, org) => {
      return sum + (org.totalSpent || 0);
    }, 0);

    // Calculate total credits issued
    const totalCreditsIssued = organizations.reduce((sum, org) => {
      return sum + (org.totalPurchased || 0);
    }, 0);

    // Get SMS logs
    const totalSMSSent = await SmsLog.countDocuments({ status: 'sent' });
    
    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySMS = await SmsLog.countDocuments({
      status: 'sent',
      sentAt: { $gte: todayStart }
    });

    // Get QuickSMS balance
    const balanceResponse = await quickSMSService.getBalance();
    const quickSMSBalance = balanceResponse.balance;

    // Active organizations (have balance > 0)
    const activeOrganizations = organizations.filter(org => 
      (org.smsBalance || 0) > 0
    ).length;

    // Monthly revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return NextResponse.json({
      totalRevenue,
      totalOrganizations: organizations.length,
      totalCreditsIssued,
      totalSMSSent,
      quickSMSBalance,
      todayRevenue: 0, // Calculate from payment logs
      todaySMS,
      monthlyRevenue: 0, // Calculate from payment logs
      activeOrganizations,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

