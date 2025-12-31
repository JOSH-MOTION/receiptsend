// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Transaction schema (create this in your models file)
const TransactionSchema = new mongoose.Schema({
  organizationId: String,
  organizationName: String,
  reference: String,
  bundleId: String,
  bundleName: String,
  amount: Number,
  units: Number,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.models.Transaction || 
  mongoose.model('Transaction', TransactionSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const superAdminEmails = ['admin@yourcompany.com'];
    
    if (!session || !superAdminEmails.includes(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

