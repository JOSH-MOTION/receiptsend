// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Transaction } from '@/lib/models';
import { isSuperAdmin } from '@/lib/super-admin';

export async function GET(request: NextRequest) {
  try {
    const uid = request.headers.get('X-User-UID');
    const isAdmin = await isSuperAdmin(uid);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(transactions.map(t => ({...t, _id: t._id.toString() })));
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
