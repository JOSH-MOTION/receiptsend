import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/super-admin';
import connectDB from '@/lib/mongodb';
import { Organization, Receipt, Contact, User, Transaction } from '@/lib/models';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    // Check if user is super admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Get all organizations with receipt and contact counts
    const organizations = await Organization.find({})
      .select('id companyName email smsBalance createdAt')
      .lean();

    // Get counts for each organization
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const receiptsCount = await Receipt.countDocuments({ organizationId: org._id.toString() });
        const contactsCount = await Contact.countDocuments({ organizationId: org._id.toString() });
        
        return {
          id: org._id.toString(),
          companyName: org.companyName,
          email: org.email,
          smsBalance: org.smsBalance || 0,
          createdAt: org.createdAt,
          _count: {
            receipts: receiptsCount,
            contacts: contactsCount,
          },
        };
      })
    );

    // Get total stats
    const totalOrgs = organizations.length;
    const totalReceipts = await Receipt.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const totalSMSBalance = organizations.reduce(
      (sum: number, org: any) => sum + (org.smsBalance || 0),
      0
    );

    // Get monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const receipts = await Receipt.find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }).select('totalAmount');

      const revenue = receipts.reduce(
        (sum: number, r: any) => sum + (r.totalAmount || 0),
        0
      );

      monthlyRevenue.push({
        month: format(date, 'MMM yyyy'),
        revenue: revenue,
      });
    }

    // Get SMS stats from transactions
    const transactions = await Transaction.find({ status: 'success' }).lean();
    const totalSMSPurchased = transactions.reduce(
      (sum: number, t: any) => sum + (t.units || 0),
      0
    );
    const totalSpent = transactions.reduce(
      (sum: number, t: any) => sum + (t.amount || 0),
      0
    );

    const smsStats = {
      totalPurchased: totalSMSPurchased,
      totalSpent: totalSpent,
      currentBalance: totalSMSBalance,
    };

    return NextResponse.json({
      organizations: orgsWithCounts,
      stats: {
        totalOrgs,
        totalReceipts,
        totalContacts,
        totalSMSBalance,
        monthlyRevenue,
        smsStats,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}