import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/super-admin';
import connectDB from '@/lib/mongodb';
import { Organization, Receipt, Contact, User, Transaction } from '@/lib/models';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const totalOrgs = await Organization.countDocuments();
    const totalReceipts = await Receipt.countDocuments();
    const totalContacts = await Contact.countDocuments();
    
    const orgs = await Organization.find({}).select('smsBalance').lean();
    const totalSMSBalance = orgs.reduce((sum, org) => sum + (org.smsBalance || 0), 0);

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthTransactions = await Transaction.find({
        createdAt: { $gte: start, $lte: end },
        status: 'success'
      }).select('amount');

      const revenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      monthlyRevenue.push({
        month: format(date, 'MMM yyyy'),
        revenue: revenue,
      });
    }

    const transactions = await Transaction.find({ status: 'success' }).lean();
    const totalSMSPurchased = transactions.reduce((sum, t) => sum + (t.units || 0), 0);
    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const smsStats = {
      totalPurchased: totalSMSPurchased,
      totalSpent: totalSpent,
      currentBalance: totalSMSBalance, // This is the sum of all orgs' virtual balances
    };

    return NextResponse.json({
      stats: {
        totalOrgs,
        totalReceipts,
        totalContacts,
        monthlyRevenue,
        smsStats,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', details: error.message },
      { status: 500 }
    );
  }
}
