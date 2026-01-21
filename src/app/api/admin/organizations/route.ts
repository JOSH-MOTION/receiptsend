// =================================================================
// app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Organization, Receipt } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { isSuperAdmin } from '@/lib/super-admin';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Get all organizations with additional stats
    const organizations = await Organization.find({}).sort({ createdAt: -1 }).lean();
    
    // Add stats to each organization
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const receiptsCount = await Receipt.countDocuments({ organizationId: org._id.toString() });

        return {
          ...org,
          id: org._id.toString(), // ensure id is a string
          receiptsCount,
        };
      })
    );

    return NextResponse.json(orgsWithStats);
  } catch (error: any) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
