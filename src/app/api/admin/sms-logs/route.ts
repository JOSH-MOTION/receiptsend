// =================================================================
// app/api/admin/sms-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SmsLog, Organization } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { isSuperAdmin } from '@/lib/super-admin';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
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
        const org = await Organization.findById(log.organizationId);
        
        return {
          ...log,
          _id: log._id.toString(),
          organizationName: org?.companyName || 'Unknown Org',
        };
      })
    );

    return NextResponse.json(enrichedLogs);
  } catch (error: any) {
    console.error('Get SMS logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
