// =================================================================
// app/api/admin/sms-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SmsLog, Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const superAdminEmails = ['admin@yourcompany.com'];
    
    if (!session || !superAdminEmails.includes(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const logs = await SmsLog.find({})
      .sort({ sentAt: -1 })
      .limit(100)
      .lean();

    // Enrich logs with organization names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const receipt = await mongoose.model('Receipt').findById(log.receiptId);
        const org = await Organization.findById(receipt?.organizationId);
        
        return {
          ...log,
          _id: log._id.toString(),
          organizationName: org?.companyName || 'Unknown',
        };
      })
    );

    return NextResponse.json(enrichedLogs);
  } catch (error: any) {
    console.error('Get SMS logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

