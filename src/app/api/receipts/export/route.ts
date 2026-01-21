import { NextRequest, NextResponse } from 'next/server';
import { Receipt } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('X-User-UID');
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
