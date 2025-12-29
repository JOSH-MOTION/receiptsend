import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { Receipt } from '@/lib/models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGODB_URI!);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    await connectDB();

    const receipts = await Receipt.find({ organizationId })
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const headers = [
      'Receipt Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Date',
      'Items',
      'Subtotal',
      'Discount %',
      'Tax %',
      'Total Amount',
    ];

    const rows = receipts.map((receipt: any) => {
      const subtotal = receipt.items.reduce(
        (acc: number, item: any) => acc + item.quantity * item.price,
        0
      );

      const itemsStr = receipt.items
        .map((item: any) => `${item.name} (${item.quantity}x$${item.price})`)
        .join('; ');

      return [
        receipt.receiptNumber,
        receipt.customerName,
        receipt.customerEmail || '',
        receipt.customerPhoneNumber || '',
        new Date(receipt.createdAt).toISOString().split('T')[0],
        `"${itemsStr}"`, // Wrap in quotes for CSV
        subtotal.toFixed(2),
        receipt.discount || 0,
        receipt.tax || 0,
        receipt.totalAmount.toFixed(2),
      ];
    });

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="receipts-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export' },
      { status: 500 }
    );
  }
}