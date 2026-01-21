// =================================================================
// app/api/admin/quicksms-balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { quickSMSService } from '@/lib/quicksms';
import { isSuperAdmin } from '@/lib/super-admin';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const balanceResponse = await quickSMSService.getBalance();
    
    if (!balanceResponse.success) {
        return NextResponse.json({ error: 'Failed to fetch balance from provider.' }, { status: 502 });
    }

    return NextResponse.json({
      balance: balanceResponse.balance,
      currency: balanceResponse.currency,
    });
  } catch (error: any) {
    console.error('Get QuickSMS balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
