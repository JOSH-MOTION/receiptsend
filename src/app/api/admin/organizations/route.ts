// =================================================================
// app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Organization, SmsLog } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const superAdminEmails = ['admin@yourcompany.com'];
    
    if (!session || !superAdminEmails.includes(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Get all organizations with additional stats
    const organizations = await Organization.find({}).lean();
    
    // Add SMS stats to each organization
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const totalSent = await SmsLog.countDocuments({
          organizationId: org._id.toString(),
          status: 'sent',
        });

        return {
          ...org,
          _id: org._id.toString(),
          totalSent,
          totalPurchased: org.smsBalance || 0, // This should track lifetime purchases
        };
      })
    );

    return NextResponse.json(orgsWithStats);
  } catch (error: any) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


