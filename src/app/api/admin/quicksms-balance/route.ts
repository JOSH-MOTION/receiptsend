// =================================================================
// app/api/admin/quicksms-balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { quickSMSService } from '@/lib/quicksms';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const superAdminEmails = ['admin@yourcompany.com'];
    
    if (!session || !superAdminEmails.includes(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const balanceResponse = await quickSMSService.getBalance();
    
    return NextResponse.json({
      balance: balanceResponse.balance,
      currency: balanceResponse.currency,
    });
  } catch (error: any) {
    console.error('Get QuickSMS balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}